/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
#include "JSEngine.h"
#include "V8Utils.h"
#include "Log.h"
#include <memory>
#include <stdarg.h>

namespace PUERTS_NAMESPACE
{
    static void JSObjectValueGetterFunction(const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        v8::Isolate* Isolate = Info.GetIsolate();
        if (!Info[0]->IsObject() || !Info[1]->IsString())
            return;

        auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        auto Context = JsEngine->ResultInfo.Context.Get(Isolate);
        v8::Context::Scope ContextScope(Context);
        v8::Local<v8::Object> object = v8::Local<v8::Object>::Cast(Info[0]);

        auto maybeRet = object->Get(Context, Info[1]);
        if (maybeRet.IsEmpty())
            return;

        Info.GetReturnValue().Set(maybeRet.ToLocalChecked());
    }

    v8::Local<v8::ArrayBuffer> NewArrayBuffer(v8::Isolate* Isolate, void *Ptr, size_t Size)
    {
        v8::Local<v8::ArrayBuffer> Ab = v8::ArrayBuffer::New(Isolate, Size);
        void* Buff = Ab->GetBackingStore()->Data();
        ::memcpy(Buff, Ptr, Size);
        return Ab;
    }

    static void EvalWithPath(const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        v8::Isolate* Isolate = Info.GetIsolate();
#ifdef THREAD_SAFE
        v8::Locker Locker(Isolate);
#endif
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
        v8::Context::Scope ContextScope(Context);

        if (Info.Length() != 2 || !Info[0]->IsString() || !Info[1]->IsString())
        {
            FV8Utils::ThrowException(Isolate, "invalid argument for evalScript");
            return;
        }

        v8::Local<v8::String> Source = Info[0]->ToString(Context).ToLocalChecked();
        v8::Local<v8::String> Name = Info[1]->ToString(Context).ToLocalChecked();
#if defined(V8_94_OR_NEWER) && !defined(WITH_QUICKJS)
        v8::ScriptOrigin Origin(Isolate, Name);
#else
        v8::ScriptOrigin Origin(Name);
#endif
        auto Script = v8::Script::Compile(Context, Source, &Origin);
        if (Script.IsEmpty())
        {
            return;
        }
        auto Result = Script.ToLocalChecked()->Run(Context);
        if (Result.IsEmpty())
        {
            return;
        }
        Info.GetReturnValue().Set(Result.ToLocalChecked());
    }

    static void GetLastException(const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        v8::Isolate* Isolate = Info.GetIsolate();
        auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
        Info.GetReturnValue().Set(JsEngine->LastException.Get(Isolate));
    }

    void JSEngine::SetLastException(v8::Local<v8::Value> Exception)
    {
        LastException.Reset(MainIsolate, Exception);
        LastExceptionInfo = FV8Utils::ExceptionToString(MainIsolate, Exception);
    }

#ifdef MULT_BACKENDS
    JSEngine::JSEngine(puerts::IPuertsPlugin* InPuertsPlugin, void* external_quickjs_runtime, void* external_quickjs_context)
#else
    JSEngine::JSEngine(void* external_quickjs_runtime, void* external_quickjs_context)
#endif
    {
        GeneralDestructor = nullptr;
        FBackendEnv::GlobalPrepare();

        BackendEnv.Initialize(external_quickjs_runtime, external_quickjs_context);
        MainIsolate = BackendEnv.MainIsolate;

        auto Isolate = MainIsolate;
#ifdef MULT_BACKENDS
        ResultInfo.PuertsPlugin = InPuertsPlugin;
#endif
        ResultInfo.Isolate = Isolate;
        Isolate->SetData(0, this);
        Isolate->SetData(1, &BackendEnv);

#ifdef THREAD_SAFE
        v8::Locker Locker(Isolate);
#endif
        v8::Isolate::Scope Isolatescope(Isolate);
        v8::HandleScope HandleScope(Isolate);

        v8::Local<v8::Context> Context = BackendEnv.MainContext.Get(Isolate);
        v8::Context::Scope ContextScope(Context);
        ResultInfo.Context.Reset(Isolate, Context);
        v8::Local<v8::Object> Global = Context->Global();
        if (external_quickjs_runtime == nullptr) 
        {
            Global->Set(Context, FV8Utils::V8String(Isolate, "__puertsGetLastException"), v8::FunctionTemplate::New(Isolate, &GetLastException)->GetFunction(Context).ToLocalChecked()).Check();
        }
        Global->Set(Context, FV8Utils::V8String(Isolate, "__tgjsEvalScript"), v8::FunctionTemplate::New(Isolate, &EvalWithPath)->GetFunction(Context).ToLocalChecked()).Check();

        JSObjectIdMap.Reset(Isolate, v8::Map::New(Isolate));

        JSObjectValueGetter = CreateJSFunction(
            Isolate, Context, 
            v8::FunctionTemplate::New(Isolate, &JSObjectValueGetterFunction)->GetFunction(Context).ToLocalChecked()
        );
        
        CppObjectMapperV8.Initialize(Isolate, Context);
        Isolate->SetData(MAPPER_ISOLATE_DATA_POS, static_cast<ICppObjectMapper*>(&CppObjectMapperV8));

        BackendEnv.StartPolling();
    }

    JSEngine::~JSEngine()
    {
        LogicTick();
        BackendEnv.StopPolling();
        DestroyInspector();

        JSObjectIdMap.Reset();
        BackendEnv.JsPromiseRejectCallback.Reset();
        LastException.Reset();

        for (int i = 0; i < Templates.size(); ++i)
        {
            Templates[i].Reset();
        }
        for (int i = 0; i < Metadatas.size(); ++i)
        {
            Metadatas[i].Reset();
        }

        {
            auto Isolate = MainIsolate;
#ifdef THREAD_SAFE
            v8::Locker Locker(Isolate);
#endif
            v8::Isolate::Scope IsolateScope(Isolate);
            v8::HandleScope HandleScope(Isolate);
            auto Context = ResultInfo.Context.Get(Isolate);
            v8::Context::Scope ContextScope(Context);

            for (auto Iter = ObjectMap.begin(); Iter != ObjectMap.end(); ++Iter)
            {
                auto Value = Iter->second.Get(MainIsolate);
                if (Value->IsObject())
                {
                    auto Object = Value->ToObject(Context).ToLocalChecked();
                    auto LifeCycleInfo = static_cast<FLifeCycleInfo *>(FV8Utils::GetPoninter(Object, 1));
                    if (LifeCycleInfo && LifeCycleInfo->Size > 0)
                    {
                        auto Ptr = FV8Utils::GetPoninter(Object);
                        free(Ptr);
                    }
                }
                Iter->second.Reset();
            }
            BackendEnv.PathToModuleMap.clear();
            BackendEnv.ScriptIdToPathMap.clear();
        }
        {
            std::lock_guard<std::mutex> guard(JSFunctionsMutex);
            for (auto Iter = JSFunctions.begin(); Iter != JSFunctions.end(); ++Iter)
            {
                delete *Iter;
            }
        }
        {
            std::lock_guard<std::mutex> guard(JSObjectsMutex);
            for (auto Iter = JSObjectMap.begin(); Iter != JSObjectMap.end(); ++Iter)
            {
                delete Iter->second;
            }
        }

        ResultInfo.Context.Reset();
        ResultInfo.Result.Reset();

        CppObjectMapperV8.UnInitialize(MainIsolate);

        for (int i = 0; i < CallbackWithFinalizeInfos.size(); ++i)
        {
            CallbackWithFinalizeInfos[i]->JsFunction.Reset();
        }
        
        BackendEnv.UnInitialize();

        for (int i = 0; i < CallbackInfos.size(); ++i)
        {
            delete CallbackInfos[i];
        }
        
        for (int i = 0; i < CallbackWithFinalizeInfos.size(); ++i)
        {
            delete CallbackWithFinalizeInfos[i];
        }

        for (int i = 0; i < LifeCycleInfos.size(); ++i)
        {
            delete LifeCycleInfos[i];
        }
    }

    JSObject *JSEngine::CreateJSObject(v8::Isolate *InIsolate, v8::Local<v8::Context> InContext, v8::Local<v8::Object> InObject)
    {
        // PLog(puerts::Log, "[PuertsDLL][CreateJSObject]mutex");
        std::lock_guard<std::mutex> guard(JSObjectsMutex);

        // PLog(puerts::Log, "[PuertsDLL][CreateJSObject]ContextScope");
#ifdef THREAD_SAFE
        v8::Locker Locker(InIsolate);
#endif
        v8::Isolate::Scope IsolateScope(InIsolate);
        v8::HandleScope HandleScope(InIsolate);
        v8::Context::Scope ContextScope(InContext);

        // PLog(puerts::Log, "[PuertsDLL][CreateJSObject]map get");
        v8::Local<v8::Map> idmap = JSObjectIdMap.Get(InIsolate);
        
        // PLog(puerts::Log, "[PuertsDLL][CreateJSObject]get v8object id");
        // 从idmap尝试取出该jsObject的id
        v8::Local<v8::Value> v8ObjectIndex = idmap->Get(InContext, InObject).ToLocalChecked();
        JSObject* jsObject = nullptr;

        // PLog(puerts::Log, "[PuertsDLL][CreateJSObject]get jsobject");
        // 如果存在该id，则从objectmap里取出该对象
        if (!v8ObjectIndex->IsNullOrUndefined())
        {
            int32_t mapIndex = (int32_t)v8::Number::Cast(*v8ObjectIndex)->Value();
            auto iter = JSObjectMap.find(mapIndex);
            if (iter != JSObjectMap.end())
            {
                jsObject = iter->second;
            }
        }

        // 如果不存在id，则创建新对象
        if (jsObject == nullptr) 
        {
            int32_t id = 0;
            size_t freeIDSize = ObjectMapFreeIndex.size();
            if (freeIDSize > 0) {
                id = ObjectMapFreeIndex[freeIDSize - 1];
                ObjectMapFreeIndex.pop_back();
            }
            else
            {
                id = JSObjectMap.size();
            }
            jsObject = new JSObject(InIsolate, InContext, InObject, id);
            JSObjectMap[id] = jsObject;
            idmap->Set(InContext, InObject, v8::Number::New(InIsolate, id));
        }

        return jsObject;
    }

    void JSEngine::ReleaseJSObject(JSObject *InObject)
    {
        std::lock_guard<std::mutex> guard(JSObjectsMutex);

        // PLog(puerts::Log, std::to_string((long)InObject));
        v8::Isolate* Isolate = InObject->Isolate;
#ifdef THREAD_SAFE
        v8::Locker Locker(Isolate);
#endif
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = InObject->Context.Get(Isolate);
        v8::Context::Scope ContextScope(Context);

        v8::Local<v8::Map> idmap = JSObjectIdMap.Get(InObject->Isolate);
        idmap->Delete(InObject->Context.Get(Isolate), InObject->GObject.Get(Isolate));
        JSObjectMap.erase(InObject->Index);

        ObjectMapFreeIndex.push_back(InObject->Index);
        delete InObject;
    }

    JSFunction* JSEngine::CreateJSFunction(v8::Isolate* InIsolate, v8::Local<v8::Context> InContext, v8::Local<v8::Function> InFunction)
    {
        std::lock_guard<std::mutex> guard(JSFunctionsMutex);
        auto maybeId = InFunction->Get(InContext, FV8Utils::V8String(InIsolate, FUNCTION_INDEX_KEY));
        if (!maybeId.IsEmpty()) {
            auto id = maybeId.ToLocalChecked();
            if (id->IsNumber()) {
                int32_t index = id->Int32Value(InContext).ToChecked();
                return JSFunctions[index];
            }
        }
        JSFunction* Function = nullptr;
        for (int i = 0; i < JSFunctions.size(); i++) {
            if (!JSFunctions[i]) {
#ifdef MULT_BACKENDS
                Function = new JSFunction(ResultInfo.PuertsPlugin, InIsolate, InContext, InFunction, i);
#else
                Function = new JSFunction(InIsolate, InContext, InFunction, i);
#endif
                JSFunctions[i] = Function;
                break;
            }
        }
        if (!Function) {
#ifdef MULT_BACKENDS
            Function = new JSFunction(ResultInfo.PuertsPlugin, InIsolate, InContext, InFunction, static_cast<int32_t>(JSFunctions.size()));
#else
            Function = new JSFunction(InIsolate, InContext, InFunction, static_cast<int32_t>(JSFunctions.size()));
#endif
            JSFunctions.push_back(Function);
        }
        InFunction->Set(InContext, FV8Utils::V8String(InIsolate, FUNCTION_INDEX_KEY), v8::Integer::New(InIsolate, Function->Index));
        return Function;
    }

    void JSEngine::ReleaseJSFunction(JSFunction* InFunction)
    {
        JSFunctions[InFunction->Index] = nullptr;
        delete InFunction;
    }

    void JSEngine::LowMemoryNotification()
    {
        MainIsolate->LowMemoryNotification();
    }

    bool JSEngine::IdleNotificationDeadline(double DeadlineInSeconds)
    {
#ifndef WITH_QUICKJS
        return MainIsolate->IdleNotificationDeadline(DeadlineInSeconds);
#else
        return true;
#endif
    }

    void JSEngine::RequestMinorGarbageCollectionForTesting()
    {
#ifndef WITH_QUICKJS
        MainIsolate->RequestGarbageCollectionForTesting(v8::Isolate::kMinorGarbageCollection);
#endif
    }

    void JSEngine::RequestFullGarbageCollectionForTesting()
    {
#ifndef WITH_QUICKJS
        MainIsolate->RequestGarbageCollectionForTesting(v8::Isolate::kFullGarbageCollection);
#endif
    }

    void JSEngine::CreateInspector(int32_t Port)
    {    
        BackendEnv.CreateInspector(MainIsolate, &ResultInfo.Context, Port);
    }

    void JSEngine::DestroyInspector()
    {
        BackendEnv.DestroyInspector(MainIsolate, &ResultInfo.Context);
    }

    void JSEngine::LogicTick()
    {
        BackendEnv.LogicTick();
    }

    bool JSEngine::InspectorTick()
    {
        return BackendEnv.InspectorTick() ? 1 : 0;
    }
    
    bool JSEngine::ClearModuleCache(const char* Path)
    {
#ifdef THREAD_SAFE
        v8::Locker Locker(MainIsolate);
#endif
        v8::Isolate::Scope IsolateScope(MainIsolate);
        v8::HandleScope HandleScope(MainIsolate);
        v8::Local<v8::Context> Context = ResultInfo.Context.Get(MainIsolate);
        v8::Context::Scope ContextScope(Context);

        return BackendEnv.ClearModuleCache(MainIsolate, Context, Path);
    }

    std::string JSEngine::GetJSStackTrace()
	{
        return BackendEnv.GetJSStackTrace();
	}
}

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
#include "PromiseRejectCallback.hpp"

namespace puerts
{
    v8::Local<v8::ArrayBuffer> NewArrayBuffer(v8::Isolate* Isolate, void *Ptr, size_t Size)
    {
        v8::Local<v8::ArrayBuffer> Ab = v8::ArrayBuffer::New(Isolate, Size);
        void* Buff = Ab->GetContents().Data();
        ::memcpy(Buff, Ptr, Size);
        return Ab;
    }

    static void EvalWithPath(const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        v8::Isolate* Isolate = Info.GetIsolate();
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
        v8::ScriptOrigin Origin(Name);
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

    JSEngine::JSEngine(void* external_quickjs_runtime, void* external_quickjs_context)
    {
        GeneralDestructor = nullptr;
        Inspector = nullptr;
        if (!GPlatform)
        {
            GPlatform = v8::platform::NewDefaultPlatform();
            v8::V8::InitializePlatform(GPlatform.get());
            v8::V8::Initialize();
        }
#if PLATFORM_IOS
        std::string Flags = "--jitless";
        v8::V8::SetFlagsFromString(Flags.c_str(), static_cast<int>(Flags.size()));
#endif

        v8::StartupData SnapshotBlob;
        SnapshotBlob.data = (const char *)SnapshotBlobCode;
        SnapshotBlob.raw_size = sizeof(SnapshotBlobCode);
        v8::V8::SetSnapshotDataBlob(&SnapshotBlob);

        // 初始化Isolate和DefaultContext
        CreateParams.array_buffer_allocator = v8::ArrayBuffer::Allocator::NewDefaultAllocator();
#if WITH_QUICKJS
        MainIsolate = (external_quickjs_runtime == nullptr) ? v8::Isolate::New(CreateParams) : v8::Isolate::New(external_quickjs_runtime);
#else
        MainIsolate = v8::Isolate::New(CreateParams);
#endif
        auto Isolate = MainIsolate;
        ResultInfo.Isolate = MainIsolate;
        Isolate->SetData(0, this);

        v8::Isolate::Scope Isolatescope(Isolate);
        v8::HandleScope HandleScope(Isolate);

#if WITH_QUICKJS
        v8::Local<v8::Context> Context = (external_quickjs_runtime && external_quickjs_context) ? v8::Context::New(Isolate, external_quickjs_context) : v8::Context::New(Isolate);
#else
        v8::Local<v8::Context> Context = v8::Context::New(Isolate);
#endif
        v8::Context::Scope ContextScope(Context);
        ResultInfo.Context.Reset(Isolate, Context);
        v8::Local<v8::Object> Global = Context->Global();

        InitNativeClasses(Context);

        Global->Set(Context, FV8Utils::V8String(Isolate, "__tgjsEvalScript"), v8::FunctionTemplate::New(Isolate, &EvalWithPath)->GetFunction(Context).ToLocalChecked()).Check();

        Isolate->SetPromiseRejectCallback(&PromiseRejectCallback<JSEngine>);
        Global->Set(Context, FV8Utils::V8String(Isolate, "__tgjsSetPromiseRejectCallback"), v8::FunctionTemplate::New(Isolate, &SetPromiseRejectCallback<JSEngine>)->GetFunction(Context).ToLocalChecked()).Check();

        // the new version callback
        auto Template = v8::FunctionTemplate::New(Isolate, nullptr);
        Template->InstanceTemplate()->SetInternalFieldCount(1);
        Global->Set(
            Context,
            FV8Utils::V8String(Isolate, "__PuertsCallbackHandler__"),
            Template->GetFunction(Context).ToLocalChecked()
        );
        
        JSObjectIdMap.Reset(Isolate, v8::Map::New(Isolate));
    }

    JSEngine::~JSEngine()
    {
        if (Inspector)
        {
            delete Inspector;
            Inspector = nullptr;
        }

        JSObjectIdMap.Reset();
        JsPromiseRejectCallback.Reset();

        {
            auto Isolate = MainIsolate;
            v8::Isolate::Scope Isolatescope(Isolate);
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
        }

        {
            std::lock_guard<std::mutex> guard(JSFunctionsMutex);
            for (auto Iter = JSFunctions.begin(); Iter != JSFunctions.end(); ++Iter)
            {
                delete *Iter;
            }
        }

        ResultInfo.Context.Reset();
        MainIsolate->Dispose();
        MainIsolate = nullptr;
        delete CreateParams.array_buffer_allocator;

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
            jsObject = JSObjectMap[mapIndex];
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
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = InObject->Context.Get(Isolate);
        v8::Context::Scope ContextScope(Context);

        v8::Local<v8::Map> idmap = JSObjectIdMap.Get(InObject->Isolate);
        idmap->Set(
            InObject->Context.Get(Isolate),
            InObject->GObject.Get(Isolate),
            v8::Undefined(Isolate)
        );

        JSObjectMap[InObject->Index] = nullptr;
        
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
                Function = new JSFunction(InIsolate, InContext, InFunction, i);
                JSFunctions[i] = Function;
                break;
            }
        }
        if (!Function) {
            Function = new JSFunction(InIsolate, InContext, InFunction, static_cast<int32_t>(JSFunctions.size()));
            JSFunctions.push_back(Function);
        }
        InFunction->Set(InContext, FV8Utils::V8String(InIsolate, FUNCTION_INDEX_KEY), v8::Integer::New(InIsolate, Function->Index));
        return Function;
    }

    void JSEngine::ReleaseJSFunction(JSFunction* InFunction)
    {
        std::lock_guard<std::mutex> guard(JSFunctionsMutex);
        JSFunctions[InFunction->Index] = nullptr;
        delete InFunction;
    }

    void JSEngine::SetGlobalFunction(const char *Name, CSharpFunctionCallback Callback, int64_t Data)
    {
        v8::Isolate* Isolate = MainIsolate;
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = ResultInfo.Context.Get(Isolate);
        v8::Context::Scope ContextScope(Context);
        char code[1024];
        std::snprintf(
            code, 
            sizeof(code),
            "(function() { const handler = new __PuertsCallbackHandler__(); this['%s'] = (function() { const callback = PuertsV8.callback.bind(handler); return function (...args) { return callback(this, ...args) } })(); return handler; })()",
            Name, Name
        );

        v8::Local<v8::Value> puertsHandler = v8::Script::Compile(
            Context,
            FV8Utils::V8String(Isolate, code)
        ).ToLocalChecked()->Run(Context).ToLocalChecked();

        v8::Puerts::FunctionInfo* functionInfo = new v8::Puerts::FunctionInfo();
        functionInfo->callback = Callback;
        functionInfo->bindData = (void*)Data;
        functionInfo->isStatic = true;
        
        v8::Object::Cast(*puertsHandler)->SetInternalField(0, v8::External::New(Isolate, (void*)functionInfo));
    }

    bool JSEngine::Eval(const char *Code, const char* Path)
    {
        v8::Isolate* Isolate = MainIsolate;
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = ResultInfo.Context.Get(Isolate);
        v8::Context::Scope ContextScope(Context);

        v8::Local<v8::String> Url = FV8Utils::V8String(Isolate, Path == nullptr ? "" : Path);
        v8::Local<v8::String> Source = FV8Utils::V8String(Isolate, Code);
        v8::ScriptOrigin Origin(Url);
        v8::TryCatch TryCatch(Isolate);

        auto CompiledScript = v8::Script::Compile(Context, Source, &Origin);
        if (CompiledScript.IsEmpty())
        {
            LastExceptionInfo = FV8Utils::ExceptionToString(Isolate, TryCatch);
            return false;
        }
        auto maybeValue = CompiledScript.ToLocalChecked()->Run(Context);//error info output
        if (TryCatch.HasCaught())
        {
            LastExceptionInfo = FV8Utils::ExceptionToString(Isolate, TryCatch);
            return false;
        }

        if (!maybeValue.IsEmpty())
        {
            ResultInfo.Result.Reset(Isolate, maybeValue.ToLocalChecked());
        }

        return true;
    }

    v8::Local<v8::Value> JSEngine::GetClassConstructor(int ClassID)
    {
        v8::Isolate* Isolate = MainIsolate;

        auto Context = ResultInfo.Context.Get(Isolate);

        v8::Local<v8::Value> Args[1];
        Args[0] = v8::Number::New(MainIsolate, ClassID);
        
        auto Result = v8::Function::Cast(*GJSGetClass.Get(MainIsolate))->Call(Context, Context->Global(), 1, Args).ToLocalChecked();
        if (!Result->IsUndefined()) {
            v8::Function::Cast(*Result)->Set(Context, FV8Utils::V8String(Isolate, "$cid"), v8::Integer::New(Isolate, ClassID));
        }
        return Result;
    }

    v8::Local<v8::Value> JSEngine::FindOrAddObject(v8::Isolate* Isolate, v8::Local<v8::Context> Context, int ClassID, void *Ptr)
    {
        if (!Ptr)
        {
            return v8::Undefined(Isolate);
        }

        auto Iter = ObjectMap.find(Ptr);
        if (Iter == ObjectMap.end())//create and link
        {
            auto BindTo = v8::External::New(Isolate, Ptr);
            v8::Local<v8::Value> Args[] = {
                v8::Number::New(MainIsolate, ClassID),
                BindTo 
            };
            return v8::Function::Cast(
                *GJSNewObject.Get(MainIsolate)
            )->Call(Context, Context->Global(), 2, Args).ToLocalChecked();
        }
        else
        {
            return v8::Local<v8::Value>::New(Isolate, Iter->second);
        }
    }

    static void OnGarbageCollected(const v8::WeakCallbackInfo<FLifeCycleInfo>& Data)
    {
        FV8Utils::IsolateData<JSEngine>(Data.GetIsolate())->UnBindObject(Data.GetParameter(), Data.GetInternalField(0));
    }

    void JSEngine::BindObject(FLifeCycleInfo* LifeCycleInfo, void* Ptr, v8::Local<v8::Object> JSObject)
    {
        if (LifeCycleInfo->Size > 0)
        {
            void *Val = malloc(LifeCycleInfo->Size);
            if (Ptr != nullptr)
            {
                memcpy(Val, Ptr, LifeCycleInfo->Size);
            }
            JSObject->SetAlignedPointerInInternalField(0, Val);
            Ptr = Val;
        }
        else
        {
            JSObject->SetAlignedPointerInInternalField(0, Ptr);
        }
        
        JSObject->SetAlignedPointerInInternalField(1, LifeCycleInfo);
        JSObject->SetAlignedPointerInInternalField(2, reinterpret_cast<void *>(OBJECT_MAGIC));
        ObjectMap[Ptr] = v8::UniquePersistent<v8::Value>(MainIsolate, JSObject);
        ObjectMap[Ptr].SetWeak<FLifeCycleInfo>(LifeCycleInfo, OnGarbageCollected, v8::WeakCallbackType::kInternalFields);
    }

    void JSEngine::UnBindObject(FLifeCycleInfo* LifeCycleInfo, void* Ptr)
    {
        ObjectMap.erase(Ptr);

        if (LifeCycleInfo->Size > 0)
        {
            free(Ptr);
        }
        else
        {
            if (LifeCycleInfo->Destructor)
            {
                LifeCycleInfo->Destructor(Ptr, LifeCycleInfo->Data);
            }
        }
    }

    void JSEngine::LowMemoryNotification()
    {
        MainIsolate->LowMemoryNotification();
    }

    void JSEngine::CreateInspector(int32_t Port)
    {
        v8::Isolate* Isolate = MainIsolate;
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = ResultInfo.Context.Get(Isolate);
        v8::Context::Scope ContextScope(Context);

        if (Inspector == nullptr)
        {
            Inspector = CreateV8Inspector(Port, &Context);
        }
    }

    void JSEngine::DestroyInspector()
    {
        v8::Isolate* Isolate = MainIsolate;
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = ResultInfo.Context.Get(Isolate);
        v8::Context::Scope ContextScope(Context);

        if (Inspector != nullptr)
        {
            delete Inspector;
            Inspector = nullptr;
        }
    }

    bool JSEngine::InspectorTick()
    {
        if (Inspector != nullptr)
        {
            return Inspector->Tick();
        }
        return true;
    }
}

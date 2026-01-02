/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
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
    JSEngine::JSEngine(void* external_quickjs_runtime, void* external_quickjs_context)
    {
        FBackendEnv::GlobalPrepare();

        BackendEnv.Initialize(external_quickjs_runtime, external_quickjs_context);
        MainIsolate = BackendEnv.MainIsolate;

        auto Isolate = MainIsolate;
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
        
        CppObjectMapperV8.Initialize(Isolate, Context);
        Isolate->SetData(MAPPER_ISOLATE_DATA_POS, static_cast<ICppObjectMapper*>(&CppObjectMapperV8));

        BackendEnv.StartPolling();
    }

    JSEngine::~JSEngine()
    {
        LogicTick();
        BackendEnv.StopPolling();
        DestroyInspector();
        
        BackendEnv.JsPromiseRejectCallback.Reset();

        {
            auto Isolate = MainIsolate;
#ifdef THREAD_SAFE
            v8::Locker Locker(Isolate);
#endif
            v8::Isolate::Scope IsolateScope(Isolate);
            v8::HandleScope HandleScope(Isolate);
            auto Context = ResultInfo.Context.Get(Isolate);
            v8::Context::Scope ContextScope(Context);
            BackendEnv.PathToModuleMap.clear();
            BackendEnv.ScriptIdToPathMap.clear();
        }
        ResultInfo.Context.Reset();
        ResultInfo.Result.Reset();

        CppObjectMapperV8.UnInitialize(MainIsolate);
        
        BackendEnv.UnInitialize();
    }

    void JSEngine::LowMemoryNotification()
    {
        MainIsolate->LowMemoryNotification();
    }

    bool JSEngine::IdleNotificationDeadline(double DeadlineInSeconds)
    {
#if defined(V8_129_OR_NEWER)
        // V8 12.9+ removed/changed IdleNotificationDeadline. Keep behavior best-effort.
        MainIsolate->MemoryPressureNotification(v8::MemoryPressureLevel::kModerate);
        return true;
#else
        return MainIsolate->IdleNotificationDeadline(DeadlineInSeconds);
#endif
    }

    void JSEngine::RequestMinorGarbageCollectionForTesting()
    {
        MainIsolate->RequestGarbageCollectionForTesting(v8::Isolate::kMinorGarbageCollection);
    }

    void JSEngine::RequestFullGarbageCollectionForTesting()
    {
        MainIsolate->RequestGarbageCollectionForTesting(v8::Isolate::kFullGarbageCollection);
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

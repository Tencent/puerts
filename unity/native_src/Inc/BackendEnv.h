/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once
#pragma warning(push, 0)
#include "v8.h"
#pragma warning(pop)

#include <map>
#include <algorithm>
#include "Log.h"
#include "V8InspectorImpl.h"
#if WITH_QUICKJS
#include "quickjs-msvc.h"
#endif

#if defined(WITH_NODEJS)

#pragma warning(push, 0)
#include "node.h"
#include "uv.h"
#pragma warning(pop)

#endif

namespace puerts
{
    class BackendEnv 
    {
    private:
        v8::Isolate* MainIsolate;

        v8::Global<v8::Context> MainContext;

    public:
        ~BackendEnv() {
            PathToModuleMap.clear();
            ScriptIdToPathMap.clear();
        }
        BackendEnv()
        {
            Inspector = nullptr;
        } 

        v8::Isolate::CreateParams* CreateParams;

        void LogicTick();

#if defined(WITH_NODEJS)
        uv_loop_t NodeUVLoop;

        std::unique_ptr<node::ArrayBufferAllocator> NodeArrayBufferAllocator;

        node::IsolateData* NodeIsolateData;

        node::Environment* NodeEnv;

        const float UV_LOOP_DELAY = 0.1;

        uv_thread_t PollingThread;

        uv_sem_t PollingSem;

        uv_async_t DummyUVHandle;

        bool PollingClosed = false;

        // FGraphEventRef LastJob;
        bool hasPendingTask = false;

#if PLATFORM_LINUX
        int Epoll;
#endif

        void StartPolling();

        void UvRunOnce();

        void PollEvents();

        static void OnWatcherQueueChanged(uv_loop_t* loop);

        void WakeupPollingThread();

        void StopPolling();

#endif

        // Module
#if defined(WITH_QUICKJS)
        std::map<std::string, JSModuleDef*> PathToModuleMap;
#else
        std::map<std::string, v8::UniquePersistent<v8::Module>> PathToModuleMap;
#endif
        std::map<int, std::string> ScriptIdToPathMap;

        // PromiseCallback
        v8::UniquePersistent<v8::Function> JsPromiseRejectCallback;
        
        // Inspector
        V8Inspector* Inspector;

        V8_INLINE static BackendEnv* Get(v8::Isolate* Isolate)
        {
            return (BackendEnv*)Isolate->GetData(1);
        }
        static void GlobalPrepare();

        v8::Isolate* CreateIsolate(void* external_quickjs_runtime);

        void FreeIsolate();

        void InitInject(v8::Isolate* Isolate, v8::Local<v8::Context> Context);
        
        void CreateInspector(v8::Isolate* Isolate, const v8::Global<v8::Context>* ContextGlobal, int32_t Port);

        void DestroyInspector(v8::Isolate* Isolate, const v8::Global<v8::Context>* ContextGlobal);

        bool InspectorTick();

        bool ClearModuleCache(v8::Isolate* Isolate, v8::Local<v8::Context> Context, const char* Path);
    };

#if WITH_NODEJS
    namespace nodejs
    {

    }
#endif

    namespace esmodule 
    {
        void ExecuteModule(const v8::FunctionCallbackInfo<v8::Value>& info);

#if !WITH_QUICKJS
        v8::MaybeLocal<v8::Module> _ResolveModule(
            v8::Local<v8::Context> Context,
            v8::Local<v8::String> Specifier,
            v8::Local<v8::Module> Referrer,
            bool& isFromCache
        );

        v8::MaybeLocal<v8::Module> ResolveModule( v8::Local<v8::Context> Context, v8::Local<v8::String> Specifier, v8::Local<v8::Module> Referrer);

        bool LinkModule(v8::Local<v8::Context> Context, v8::Local<v8::Module> RefModule);

        void HostInitializeImportMetaObject(v8::Local<v8::Context> Context, v8::Local<v8::Module> Module, v8::Local<v8::Object> meta);
#else 
        JSModuleDef* js_module_loader(JSContext* ctx, const char *name, void *opaque);

        char* js_module_resolver(JSContext *ctx, const char *base_name, const char *name, void* opaque);
#endif
    }
}
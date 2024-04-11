/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#include <map>
#include <algorithm>
#include "Common.h"
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

#define EXECUTEMODULEGLOBANAME "__puertsExecuteModule"

namespace PUERTS_NAMESPACE
{
    class FBackendEnv 
    {
    public:
        v8::Isolate* MainIsolate;

        v8::Global<v8::Context> MainContext;

        ~FBackendEnv() {
            PathToModuleMap.clear();
            ScriptIdToPathMap.clear();
        }
        FBackendEnv()
        {
            Inspector = nullptr;
        } 

        v8::Isolate::CreateParams* CreateParams;

        void LogicTick();
        
        void StartPolling();
        
        void StopPolling();

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

        void UvRunOnce();

        void PollEvents();

        static void OnWatcherQueueChanged(uv_loop_t* loop);

        void WakeupPollingThread();
#endif

        // Module
#if defined(WITH_QUICKJS)
        std::map<std::string, JSModuleDef*> PathToModuleMap;
        JSValue JsFileLoader;
        JSValue JsFileNormalize;
        
        JSModuleDef* LoadModule(JSContext* ctx, const char *name);
        
        char* ResolveQjsModule(JSContext *ctx, const char *base_name, const char *name, bool throwIfFail);
        
        char* NormalizeModuleName(JSContext *ctx, const char *base_name, const char *name);
#else
        std::map<std::string, v8::UniquePersistent<v8::Module>> PathToModuleMap;
#endif
        std::map<int, std::string> ScriptIdToPathMap;

        // PromiseCallback
        v8::UniquePersistent<v8::Function> JsPromiseRejectCallback;
        
        // Inspector
        V8Inspector* Inspector;

        V8_INLINE static FBackendEnv* Get(v8::Isolate* Isolate)
        {
            return (FBackendEnv*)Isolate->GetData(1);
        }
        static void GlobalPrepare();

        void Initialize(void* external_quickjs_runtime, void* external_quickjs_context);

        void UnInitialize();
        
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
#if !WITH_QUICKJS
        v8::MaybeLocal<v8::Module> _ResolveModule(
            v8::Local<v8::Context> Context,
            v8::Local<v8::String> Specifier,
            v8::Local<v8::Value> Referrer,
            bool& isFromCache
        );

        v8::MaybeLocal<v8::Module> ResolveModule( v8::Local<v8::Context> Context, v8::Local<v8::String> Specifier, v8::Local<v8::Module> Referrer);

        bool LinkModule(v8::Local<v8::Context> Context, v8::Local<v8::Module> RefModule);

        v8::MaybeLocal<v8::Promise> DynamicImport(v8::Local<v8::Context> Context, v8::Local<v8::ScriptOrModule> Referrer, v8::Local<v8::String> Specifier); 

        void HostInitializeImportMetaObject(v8::Local<v8::Context> Context, v8::Local<v8::Module> Module, v8::Local<v8::Object> meta);
        
        void ExecuteModule(const v8::FunctionCallbackInfo<v8::Value>& info);
#else 
        JSModuleDef* js_module_loader(JSContext* ctx, const char *name, void *opaque);
    
        char* module_normalize(JSContext *ctx, const char *base_name, const char *name, void* opaque);
    
        JSValue ExecuteModule(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv, int magic, JSValue *func_data);
#endif
    }
}
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

namespace puerts
{
    class BackendEnv 
    {
    public:
        ~BackendEnv() {
            PathToModuleMap.clear();
            ScriptIdToPathMap.clear();
        }
        BackendEnv()
        {
            Inspector = nullptr;
        } 

        // Module
        std::map<std::string, v8::UniquePersistent<v8::Module>> PathToModuleMap;
        std::map<int, std::string> ScriptIdToPathMap;

        // PromiseCallback
        v8::UniquePersistent<v8::Function> JsPromiseRejectCallback;
        
        // Inspector
        V8Inspector* Inspector;

        V8_INLINE static BackendEnv* Get(v8::Isolate* Isolate)
        {
            return (BackendEnv*)Isolate->GetData(1);
        }
        void InitInject(v8::Isolate* Isolate);
        
        void CreateInspector(v8::Isolate* Isolate, const v8::Global<v8::Context>* ContextGlobal, int32_t Port);

        void DestroyInspector(v8::Isolate* Isolate, const v8::Global<v8::Context>* ContextGlobal);

        bool InspectorTick();

        bool ClearModuleCache(v8::Local<v8::Context> Context, const char* Path);
    };



    namespace esmodule 
    {
        v8::MaybeLocal<v8::Module> _ResolveModule(
            v8::Local<v8::Context> Context,
            v8::Local<v8::String> Specifier,
            v8::Local<v8::Module> Referrer,
            bool& isFromCache
        );

        v8::MaybeLocal<v8::Module> ResolveModule( v8::Local<v8::Context> Context, v8::Local<v8::String> Specifier, v8::Local<v8::Module> Referrer);

        bool LinkModule(v8::Local<v8::Context> Context, v8::Local<v8::Module> RefModule);

        void HostInitializeImportMetaObject(v8::Local<v8::Context> Context, v8::Local<v8::Module> Module, v8::Local<v8::Object> meta);
    }
}
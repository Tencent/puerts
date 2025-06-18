/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#include <map>
#include <EASTL/string.h>
#include <EASTL/map.h>
#include <EASTL/allocator_malloc.h>
#include "quickjs.h"
#include "CppObjectMapperQuickjs.h"

#define EXECUTEMODULEGLOBANAME "__puertsExecuteModule"

namespace PUERTS_NAMESPACE
{
    class FBackendEnv 
    {
    public:
        JSRuntime *rt;
        JSContext* ctx;

        ~FBackendEnv() {
            PathToModuleMap.clear();
            ScriptIdToPathMap.clear();
        }
        FBackendEnv()
        {
        } 

        inline static FBackendEnv* Get(JSRuntime *rt)
        {
            return reinterpret_cast<FBackendEnv*>(JS_GetRuntimeOpaque(rt));
        }

        eastl::map<eastl::basic_string<char, eastl::allocator_malloc>, JSModuleDef*, eastl::less<eastl::basic_string<char, eastl::allocator_malloc>>, eastl::allocator_malloc> PathToModuleMap;
        JSValue JsFileLoader;
        JSValue JsFileNormalize;
        
        JSModuleDef* LoadModule(JSContext* ctx, const char *name);
        
        char* ResolveQjsModule(JSContext *ctx, const char *base_name, const char *name, bool throwIfFail);
        
        char* NormalizeModuleName(JSContext *ctx, const char *base_name, const char *name);

        eastl::map<int, eastl::basic_string<char, eastl::allocator_malloc>, eastl::less<int>, eastl::allocator_malloc> ScriptIdToPathMap;

        // PromiseCallback
        //v8::UniquePersistent<v8::Function> JsPromiseRejectCallback;

        void Initialize(void* external_quickjs_runtime, void* external_quickjs_context);

        void UnInitialize();

        pesapi::qjsimpl::CppObjectMapper CppObjectMapperQjs;
        
        //std::string GetJSStackTrace();
    };

    namespace esmodule 
    {
        JSModuleDef* js_module_loader(JSContext* ctx, const char *name, void *opaque);
    
        char* module_normalize(JSContext *ctx, const char *base_name, const char *name, void* opaque);
    
        JSValue ExecuteModule(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv, int magic, JSValue *func_data);
    }
}
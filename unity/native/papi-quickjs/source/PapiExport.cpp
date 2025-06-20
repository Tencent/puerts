/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
#include "BackendEnv.h"
#include "CppObjectMapperQuickjs.h"
#include "pesapi.h"

namespace puerts
{
enum JSEngineBackend
{
    V8          = 0,
    Node        = 1,
    QuickJS     = 2,
    Auto = 3
};
}

#ifdef __cplusplus
extern "C" {
#endif

PESAPI_MODULE_EXPORT int GetQjsPapiVersion()
{
    return PESAPI_VERSION;
}

PESAPI_MODULE_EXPORT pesapi_env_ref GetQjsPapiEnvRef(puerts::FBackendEnv *BackendEnv)
{
    auto env = reinterpret_cast<pesapi_env>(BackendEnv->ctx);
    return pesapi::qjsimpl::g_pesapi_ffi.create_env_ref(env);
}

PESAPI_MODULE_EXPORT pesapi_ffi* GetQjsFFIApi()
{
    return &pesapi::qjsimpl::g_pesapi_ffi;
}

PESAPI_MODULE_EXPORT pesapi_env_ref CreateQjsPapiEnvRef()
{
    auto BackendEnv = (puerts::FBackendEnv*)(malloc(sizeof(puerts::FBackendEnv)));
    new (BackendEnv) puerts::FBackendEnv();
    BackendEnv->Initialize();
    auto env = reinterpret_cast<pesapi_env>(BackendEnv->ctx);
    return pesapi::qjsimpl::g_pesapi_ffi.create_env_ref(env);
}

PESAPI_MODULE_EXPORT void DestroyQjsPapiEnvRef(pesapi_env_ref env_ref)
{
    auto env = pesapi::qjsimpl::g_pesapi_ffi.get_env_from_ref(env_ref);
    auto ctx = reinterpret_cast<JSContext*>(env);
    pesapi::qjsimpl::g_pesapi_ffi.release_env_ref(env_ref);
    auto BackendEnv = puerts::FBackendEnv::Get(JS_GetRuntime(ctx));
    BackendEnv->UnInitialize();
    BackendEnv->~FBackendEnv();
    free(BackendEnv);
}

PESAPI_MODULE_EXPORT void RunGC(pesapi_env_ref env_ref)
{
    auto env = pesapi::qjsimpl::g_pesapi_ffi.get_env_from_ref(env_ref);
    auto ctx = reinterpret_cast<JSContext*>(env);
    JS_RunGC(JS_GetRuntime(ctx));
}

#ifdef __cplusplus
}
#endif
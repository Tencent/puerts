/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
#include "CppObjectMapperLua.h"
#include "pesapi.h"

#ifdef __cplusplus
extern "C" {
#endif

PESAPI_MODULE_EXPORT int GetLuaPapiVersion()
{
    return PESAPI_VERSION;
}

PESAPI_MODULE_EXPORT pesapi_ffi* GetLuaFFIApi()
{
    return &pesapi::luaimpl::g_pesapi_ffi;
}

PESAPI_MODULE_EXPORT pesapi_env_ref CreateLuaPapiEnvRef()
{
    lua_State* L = luaL_newstate();
    luaL_openlibs(L);
    auto mapper = (pesapi::luaimpl::CppObjectMapper*)malloc(sizeof(pesapi::luaimpl::CppObjectMapper));
    new (mapper) pesapi::luaimpl::CppObjectMapper();
    mapper->Initialize(L);
    auto env = reinterpret_cast<pesapi_env>(L);
    return pesapi::luaimpl::g_pesapi_ffi.create_env_ref(env);
}

PESAPI_MODULE_EXPORT void DestroyLuaPapiEnvRef(pesapi_env_ref env_ref)
{
    auto scope = pesapi::luaimpl::g_pesapi_ffi.open_scope(env_ref);
    auto L = reinterpret_cast<lua_State*>(pesapi::luaimpl::g_pesapi_ffi.get_env_from_ref(env_ref));
    pesapi::luaimpl::CppObjectMapper* mapper = pesapi::luaimpl::CppObjectMapper::Get(L);
    pesapi::luaimpl::g_pesapi_ffi.close_scope(scope);
    pesapi::luaimpl::g_pesapi_ffi.release_env_ref(env_ref);
    mapper->UnInitialize(L);
    lua_close(L);
    if (mapper)
    {
        mapper->~CppObjectMapper();
        free(mapper);
    }
}

#ifdef __cplusplus
}
#endif
/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
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
    return {};
}

PESAPI_MODULE_EXPORT void DestroyQjsPapiEnvRef(pesapi_env_ref env_ref)
{
}

#ifdef __cplusplus
}
#endif
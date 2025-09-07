/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include <cstring>
#include "Log.h"
#include "pesapi.h"

#define API_LEVEL 36

LogCallback GLogCallback = nullptr;
LogCallback GLogWarningCallback = nullptr;
LogCallback GLogErrorCallback = nullptr;

namespace pesapi
{
namespace regimpl
{
extern pesapi_registry_api g_reg_apis;
}
}

#ifdef __cplusplus
extern "C" {
#endif

// deprecated, delete in 1.4 plz
PESAPI_MODULE_EXPORT int GetPapiVersion()
{
    return PESAPI_VERSION;
}

PESAPI_MODULE_EXPORT pesapi_registry_api* GetRegisterApi()
{
    return &pesapi::regimpl::g_reg_apis;
}

PESAPI_MODULE_EXPORT void SetLogCallback(LogCallback Log, LogCallback LogWarning, LogCallback LogError)
{
    GLogCallback = Log;
    GLogWarningCallback = LogWarning;
    GLogErrorCallback = LogError;
}

#ifdef __cplusplus
}
#endif
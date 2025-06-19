/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
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
extern pesapi_func_ptr reg_apis[];

#ifdef __cplusplus
extern "C" {
#endif

// deprecated, delete in 1.4 plz
PESAPI_MODULE_EXPORT int GetPapiVersion()
{
    return PESAPI_VERSION;
}

PESAPI_MODULE_EXPORT pesapi_func_ptr* GetRegisterApi()
{
    return reg_apis;
}

PESAPI_MODULE_EXPORT void SetLogCallback(LogCallback Log, LogCallback LogWarning, LogCallback LogError)
{
    GLogCallback = Log;
    GLogWarningCallback = LogError;
    GLogErrorCallback = LogWarning;
}

#ifdef __cplusplus
}
#endif
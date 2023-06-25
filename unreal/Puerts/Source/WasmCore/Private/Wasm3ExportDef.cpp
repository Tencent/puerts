/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "Wasm3ExportDef.h"

WASMCORE_API bool Export_m3_GetResults(IM3Function i_function, uint32_t i_retc, const void* o_retptrs[])
{
    M3Result err = m3_GetResults(i_function, i_retc, o_retptrs);
    if (err)
    {
        UE_LOG(LogTemp, Error, TEXT("get results error for %s: %s"), UTF8_TO_TCHAR(i_function->export_name), UTF8_TO_TCHAR(err));
        return false;
    }
    return true;
}

WASMCORE_API bool Export_m3_Call(IM3Function i_function, uint32_t i_argc, const void* i_argptrs[])
{
    M3Result err = m3_Call(i_function, i_argc, i_argptrs);
    if (err)
    {
        UE_LOG(LogTemp, Error, TEXT("m3_Call error for %s: %s"), UTF8_TO_TCHAR(i_function->export_name), UTF8_TO_TCHAR(err));
        return false;
    }
    return true;
}

WASMCORE_API bool Export_m3_LinkRawFunctionEx(IM3Module io_module, const char* const i_moduleName, const char* const i_functionName,
    const char* const i_signature, M3RawCall i_function, const void* i_userdata)
{
    M3Result err = m3_LinkRawFunctionEx(io_module, i_moduleName, i_functionName, i_signature, i_function, i_userdata);
    if (err && err != m3Err_functionLookupFailed)
    {
        UE_LOG(LogTemp, Error, TEXT("link error for %s: %s"), UTF8_TO_TCHAR(i_functionName), UTF8_TO_TCHAR(err));
        return false;
    }
    return true;
}

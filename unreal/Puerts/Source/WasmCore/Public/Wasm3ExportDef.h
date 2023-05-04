/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once
#include "CoreMinimal.h"
#include "wasm3.h"
#include "m3_env.h"

// true表示成功,false表示失败
WASMCORE_API bool Export_m3_GetResults(IM3Function i_function, uint32_t i_retc, const void* o_retptrs[]);
WASMCORE_API bool Export_m3_Call(IM3Function i_function, uint32_t i_argc, const void* i_argptrs[]);
WASMCORE_API bool Export_m3_LinkRawFunctionEx(IM3Module io_module, const char* const i_moduleName, const char* const i_functionName,
    const char* const i_signature, M3RawCall i_function, const void* i_userdata);

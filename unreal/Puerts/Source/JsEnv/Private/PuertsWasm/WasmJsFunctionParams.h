/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "CoreMinimal.h"
#include "WasmModule.h"

#pragma warning(push, 0)
#include "libplatform/libplatform.h"
#include "v8.h"
#pragma warning(pop)
#include "WasmFunction.h"

namespace puerts
{
enum class WasmJsParamType
{
    Type_Void,
    Type_Bool,
    Type_Int,
    Type_Int64,
    Type_Float,
    Type_Double,
    Type_Struct,
    Type_Pointer,
};

struct WasmJsParamDesc
{
    WasmJsParamType ParamType;
    uint8 IsReference : 1;
    uint8 IsConst : 1;
    uint8 IsUObject : 1;
    UScriptStruct* Struct;
};

struct WasmJsFunctionDesc
{
    const WasmFunction* Function;
    WasmJsParamDesc ReturnValue;
    TArray<WasmJsParamDesc> ParamList;
};

struct WasmJsModuleDesc
{
    TArray<WasmJsFunctionDesc> FunctionList;
};

void InitWasmRuntimeToJsObject(v8::Local<v8::Object>& GlobalObject, WasmRuntime* TargetRuntime, const FString& RootPath,
    TArray<WasmJsModuleDesc>& AllWasmJsModuleDesc);
};    // namespace puerts

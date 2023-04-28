// Fill out your copyright notice in the Description page of Project Settings.

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

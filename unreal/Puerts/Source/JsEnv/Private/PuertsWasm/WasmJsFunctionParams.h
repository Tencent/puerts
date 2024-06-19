/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once
#if USE_WASM3
#include "CoreMinimal.h"
#include "WasmModule.h"
#include "PuertsNamespaceDef.h"

PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS
#pragma warning(push, 0)
#include "libplatform/libplatform.h"
#include "v8.h"
#pragma warning(pop)
PRAGMA_ENABLE_UNDEFINED_IDENTIFIER_WARNINGS

#include "WasmFunction.h"

#define M3_FUNCTION_KEY "__puerts_inner_m3_func"

namespace PUERTS_NAMESPACE
{
struct WasmNormalLinkInfo
{
    v8::UniquePersistent<v8::Function> CachedFunction;
    v8::Isolate* Isolate;
};

WasmRuntime* NormalInstanceModule(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, TArray<uint8>& InData,
    v8::Local<v8::Object>& ExportsObject, v8::Local<v8::Value> ImportsValue,
    const TArray<std::shared_ptr<WasmRuntime>>& RuntimeList, TArray<WasmNormalLinkInfo*>& CachedLinkFunctionList);
};    // namespace PUERTS_NAMESPACE
#endif
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

class WasmRuntime;
class WasmFunction;

class WASMCORE_API WasmModule final
{
private:
    IM3Module _Module;
    TMap<FName, WasmFunction*> _AllExportFunctions;

public:
    WasmModule(const TCHAR* Path, WasmRuntime* Runtime, int LinkCategory);
    ~WasmModule();
    FORCEINLINE const TMap<FName, WasmFunction*>& GetAllExportFunctions() const
    {
        return _AllExportFunctions;
    }
};
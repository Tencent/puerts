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
#include "WasmCommonIncludes.h"
#include <functional>
class WasmRuntime;
class WasmFunction;
class WasmEnv;

using AdditionLinkFunc = std::function<bool(IM3Module)>;

class WASMCORE_API WasmModuleInstance final
{
private:
    IM3Module _Module;
    TMap<FName, WasmFunction*> _AllExportFunctions;
    TArray<uint8> Data;

public:
    WasmModuleInstance(TArray<uint8>& InData);

    int Index = -1;

    bool ParseModule(WasmEnv* Env);
    bool LoadModule(WasmRuntime* Runtime, int LinkCategory, AdditionLinkFunc _Func = nullptr);

    size_t TableGrow(size_t N) const;

    void TableSet(size_t Idx, IM3Function Function) const;

    size_t TableLen() const;

    ~WasmModuleInstance();
    const TMap<FName, WasmFunction*>& GetAllExportFunctions()
    {
        return _AllExportFunctions;
    }
    IM3Module GetModule()
    {
        return _Module;
    }
};
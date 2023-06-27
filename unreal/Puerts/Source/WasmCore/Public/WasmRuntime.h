/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once
#include "CoreMinimal.h"
#include "WasmCommonIncludes.h"
#include "WasmEnv.h"

class WasmModuleInstance;
class WasmFunction;
class WasmPointerSupport;

struct WASMCORE_API WasmStackAllocCacheInfo
{
    WASM_PTR PtrInWasm = 0;
    char* RealPtr = nullptr;
};

class WASMCORE_API WasmRuntime final
{
private:
    WasmEnv* _Env;
    IM3Runtime _Runtime;
    TArray<WasmModuleInstance*> _AllModuleInstances;
    uint16 _RuntimeSeq;

    WasmStackAllocCacheInfo CurrentStackAllocInfo;
    WasmStackAllocCacheInfo BaseStackAllocInfo;
    WASM_PTR MaxWasmStackAllocCount = 0;

public:
    WasmEnv* GetEnv()
    {
        return _Env;
    }
    WasmStackAllocCacheInfo GetCurrentStackAllocInfo()
    {
        return CurrentStackAllocInfo;
    }
    WasmStackAllocCacheInfo AllocStackParam(int Count)
    {
        WasmStackAllocCacheInfo ret = CurrentStackAllocInfo;
        if (Count < 8)
            Count = 8;
        CurrentStackAllocInfo.PtrInWasm += Count;
        CurrentStackAllocInfo.RealPtr += Count;
        check(CurrentStackAllocInfo.PtrInWasm - BaseStackAllocInfo.PtrInWasm < MaxWasmStackAllocCount);
        return ret;
    }

    void RestoreCurrentStackAllocInfo(const WasmStackAllocCacheInfo& NewInfo)
    {
        check(NewInfo.PtrInWasm >= BaseStackAllocInfo.PtrInWasm && NewInfo.RealPtr >= BaseStackAllocInfo.RealPtr);
        CurrentStackAllocInfo = NewInfo;
    }

    WasmRuntime(WasmEnv* Env, int MaxPage = 10, int InitPage = 1, int StackSizeInBytes = 5 * 1024);
    ~WasmRuntime();

    int Grow(int number);
    uint8* GetBuffer(int& Length);

    uint16 GetRuntimeSeq() const
    {
        return _RuntimeSeq;
    }

    WasmModuleInstance* GetModuleInstance(int index) const
    {
        return _AllModuleInstances[index];
    }

    WasmModuleInstance* OnModuleInstance(WasmModuleInstance* InModuleInstance);

    FORCEINLINE IM3Runtime GetRuntime() const
    {
        return _Runtime;
    }

    //转换wasm与host的地址
    void* GetPlatformAddress(WASM_PTR ptr);

    static WasmRuntime* StaticGetWasmRuntime(IM3Runtime Runtime);
};
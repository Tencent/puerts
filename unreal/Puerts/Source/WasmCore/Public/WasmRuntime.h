#pragma once
#include "CoreMinimal.h"
#include "wasm3.h"
#include "m3_env.h"
#include "WasmCommonIncludes.h"

class WasmModule;
class WasmFunction;
class WasmPointerSupport;

struct WASMCORE_API WasmStackAllocCacheInfo
{
    WASM_PTR PtrInWasm;
    char* RealPtr;
};

class WASMCORE_API WasmRuntime final
{
private:
    IM3Environment _Env;
    IM3Runtime _Runtime;
    TArray<WasmModule*> _AllModules;
    uint16 _RuntimeSeq;

    WasmStackAllocCacheInfo CurrentStackAllocInfo;
    WasmStackAllocCacheInfo BaseStackAllocInfo;
    WASM_PTR MaxWasmStackAllocCount = 0;

public:
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

    WasmRuntime(int StackSizeInBytes);
    ~WasmRuntime();

    uint16 GetRuntimeSeq() const
    {
        return _RuntimeSeq;
    }

    WasmModule* LoadModule(const TCHAR* Path, int LinkCategory = -1);
    FORCEINLINE IM3Environment GetEnv() const
    {
        return _Env;
    }
    FORCEINLINE IM3Runtime GetRuntime() const
    {
        return _Runtime;
    }

    //转换wasm与host的地址
    void* GetPlatformAddress(WASM_PTR ptr);

    static WasmRuntime* StaticGetWasmRuntime(IM3Runtime Runtime);
};
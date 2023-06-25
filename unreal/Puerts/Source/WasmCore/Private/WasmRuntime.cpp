/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "WasmRuntime.h"
#include "WasmModule.h"
#include "WasmFunction.h"
#include "HAL/Platform.h"
#include "m3_exec_defs.h"
#include "m3_env.h"
#include "WasmModuleInstance.h"

static TArray<WasmRuntime*> _AllWasmRuntimes;
static uint16 WasmRuntime_Seq = 1;

WasmRuntime::WasmRuntime(WasmEnv* Env, int MaxPage /*= 10*/, int InitPage /*= 1*/, int StackSizeInBytes /*= 5 * 1024*/)
{
    _RuntimeSeq = WasmRuntime_Seq;
    WasmRuntime_Seq++;
    if (!WasmRuntime_Seq)
        WasmRuntime_Seq++;
    _Env = Env;
    _Runtime = m3_NewRuntime(_Env->GetEnv(), StackSizeInBytes, this);
    _Runtime->memory.maxPages = MaxPage;
    ResizeMemory(_Runtime, InitPage);
    _AllWasmRuntimes.Add(this);
}

WasmRuntime::~WasmRuntime()
{
    for (WasmModuleInstance*& Instance : _AllModuleInstances)
    {
        delete Instance;
    }

    if (_Runtime)
    {
        m3_FreeRuntime(_Runtime);
        _Runtime = nullptr;
    }

    _AllWasmRuntimes.Remove(this);
}

int WasmRuntime::Grow(int number)
{
    int Ret = _Runtime->memory.numPages;
    ResizeMemory(_Runtime, _Runtime->memory.numPages + number);
    return Ret;
}

uint8* WasmRuntime::GetBuffer(int& Length)
{
    u8* base = m3MemData(_Runtime->memory.mallocated);
    Length = _Runtime->memory.mallocated->length;
    return base;
}

WasmModuleInstance* WasmRuntime::OnModuleInstance(WasmModuleInstance* InModuleInstance)
{
    _AllModuleInstances.Add(InModuleInstance);
    WasmModuleInstance* ret = _AllModuleInstances[_AllModuleInstances.Num() - 1];
    ret->Index = _AllModuleInstances.Num() - 1;
    if (MaxWasmStackAllocCount == 0)
    {
        if (ret->GetAllExportFunctions().Contains("GetStackParamBegin"))
        {
            WasmFunction* GetStackParamBegin = ret->GetAllExportFunctions()["GetStackParamBegin"];
            WasmFunction* GetStackParamMaxSize = ret->GetAllExportFunctions()["GetStackParamMaxSize"];
            MaxWasmStackAllocCount = GetStackParamMaxSize->Call<WASM_PTR>();
            WASM_PTR BasePtr = GetStackParamBegin->Call<WASM_PTR>();
            BaseStackAllocInfo.PtrInWasm = BasePtr;
            BaseStackAllocInfo.RealPtr = (char*) GetPlatformAddress(BasePtr);
            CurrentStackAllocInfo = BaseStackAllocInfo;
            // 8字节对齐
            while ((reinterpret_cast<UPTRINT>(CurrentStackAllocInfo.RealPtr) % 8) != 0)
            {
                CurrentStackAllocInfo.PtrInWasm++;
                CurrentStackAllocInfo.RealPtr++;
            }
        }
    }
    return ret;
}

void* WasmRuntime::GetPlatformAddress(WASM_PTR ptr)
{
    u8* base = m3MemData(_Runtime->memory.mallocated);
    return base + ptr;
}

WasmRuntime* WasmRuntime::StaticGetWasmRuntime(IM3Runtime Runtime)
{
    return (WasmRuntime*) (Runtime->userdata);
}

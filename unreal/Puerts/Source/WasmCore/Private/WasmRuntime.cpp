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

static TArray<WasmRuntime*> _AllWasmRuntimes;
static uint16 WasmRuntime_Seq = 1;

WasmRuntime::WasmRuntime(int StackSizeInBytes)
{
    _RuntimeSeq = WasmRuntime_Seq;
    WasmRuntime_Seq++;
    if (!WasmRuntime_Seq)
        WasmRuntime_Seq++;
    _Env = m3_NewEnvironment();    // m3_FreeEnvironment
    check(_Env);
    _Runtime = m3_NewRuntime(_Env, StackSizeInBytes, this);    // m3_FreeRuntime
    _Runtime->memory.maxPages = 10;                            // 64K一个Page,最多允许640K
    _Runtime->memoryLimit = 3 * 1024 * 1024;
    ResizeMemory(_Runtime, 10);
    check(_Runtime);
    _AllWasmRuntimes.Add(this);
}

WasmRuntime::~WasmRuntime()
{
    for (WasmModule* Module : _AllModules)
    {
        delete Module;
    }

    m3_FreeRuntime(_Runtime);
    m3_FreeEnvironment(_Env);
    _AllWasmRuntimes.Remove(this);
}

WasmModule* WasmRuntime::LoadModule(const TCHAR* Path, int LinkCategory /*= -1*/)
{
    _AllModules.Add(new WasmModule(Path, this, LinkCategory));
    WasmModule* ret = _AllModules[_AllModules.Num() - 1];
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

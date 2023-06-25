/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "WasmModuleInstance.h"
#include "Misc/FileHelper.h"
#include "WasmRuntime.h"
#include "WasmFunction.h"
#include "WasmStaticLink.h"
#include "WasmEnv.h"

WasmModuleInstance::WasmModuleInstance(TArray<uint8>& InData)
{
    Data = std::move(InData);
}

bool WasmModuleInstance::ParseModule(WasmEnv* Env)
{
    _Module = nullptr;
    M3Result err = m3_ParseModule(Env->GetEnv(), &_Module, Data.GetData(), Data.Num());    // m3_FreeModule
    if (err)
    {
        _Module = nullptr;
        UE_LOG(LogTemp, Error, TEXT("m3_ParseModule:%s"), ANSI_TO_TCHAR(err));
        Data.Empty();
        return false;
    }
    return true;
}

bool WasmModuleInstance::LoadModule(WasmRuntime* Runtime, int LinkCategory, AdditionLinkFunc _Func /*= nullptr*/)
{
    if (!_Module)
        return false;

    IM3Runtime m3Runtime = Runtime->GetRuntime();
    //初始的page设置为已经分配的,否则runtime加载一个初始memory更小的module,会导致老的import memory的module被重置
    if (_Module->memoryInfo.initPages < m3Runtime->memory.numPages)
    {
        _Module->memoryInfo.initPages = m3Runtime->memory.numPages;
    }
    M3Result err = m3_LoadModule(m3Runtime, _Module);
    if (err)
    {
        UE_LOG(LogTemp, Error, TEXT("m3_LoadModule:%s"), ANSI_TO_TCHAR(err));
        m3_FreeModule(_Module);
        _Module = nullptr;
        Data.Empty();
        return false;
    }

    if (LinkCategory >= 0)
    {
        if (!WasmStaticLinkClass::Link(_Module, LinkCategory))
        {
            Data.Empty();
            return false;
        }
    }

    if (_Func)
    {
        if (!_Func(_Module))
        {
            UE_LOG(LogTemp, Error, TEXT("wasm module addition link function error"));
            Data.Empty();
            return false;
        }
    }

    //这里需要把所有函数都compile掉,否则在函数调用的过程中如果触发compile,会有写越界
    //这是因为compile需要读取wasm的原始数据(类似v8需要js原始代码一样)
    //这里暂时不想保留wasm的源码,所以先全部compile
    //未来如果有crash,就再考虑保留源码
    err = m3_CompileModule(_Module);
    if (err)
    {
        UE_LOG(LogTemp, Error, TEXT("m3_CompileModule: %s"), ANSI_TO_TCHAR(err));
        Data.Empty();
        return false;
    }

    for (u32 i = 0; i < _Module->numFunctions; ++i)
    {
        IM3Function f = &_Module->functions[i];
        if (f->compiled && f->export_name && *(f->export_name))
        {
            _AllExportFunctions.Add(f->export_name, new WasmFunction(f));
        }
    }
    //清理下data,如果有crash就不清理了吧
    Data.Empty();
    Runtime->OnModuleInstance(this);
    return true;

    // compile all function
    /*for (u32 i = 0; i < _Module->numFunctions; ++i)
    {
        IM3Function f = &_Module->functions[i];
        // if (f->export_name && *(f->export_name))
        {
            if (!f->compiled)
            {
                err = CompileFunction(f);
                if (err)
                {
                    UE_LOG(LogTemp, Error, TEXT("m3_ExportFunctions:%s %s"), ANSI_TO_TCHAR(err), ANSI_TO_TCHAR(f->export_name));
                }
            }
            if (f->compiled && f->export_name && *(f->export_name))
            {
                _AllExportFunctions.Add(f->export_name, new WasmFunction(f));
            }
        }
    }*/
}

size_t WasmModuleInstance::TableGrow(size_t N) const
{
    size_t ret;
    M3Result err = m3_GrowTable0(_Module, N, &ret);
    if (err)
    {
        // TODO: do not log with LogTemp
        UE_LOG(LogTemp, Error, TEXT("m3_GrowTable0: %s"), ANSI_TO_TCHAR(err));
        return 0;
    }
    return ret;
}

void WasmModuleInstance::TableSet(size_t Idx, IM3Function Function) const
{
    M3Result err = m3_SetTable0(_Module, Idx, Function);
    if (err)
    {
        // TODO: do not log with LogTemp
        UE_LOG(LogTemp, Error, TEXT("m3_SetTable0: %s"), ANSI_TO_TCHAR(err));
    }
}

size_t WasmModuleInstance::TableLen() const
{
    return m3_GetTable0Size(_Module);
}

WasmModuleInstance::~WasmModuleInstance()
{
    for (auto Iter = _AllExportFunctions.CreateIterator(); Iter; ++Iter)
    {
        delete Iter->Value;
    }
    // module会在runtime的free的时候被free,所以这里不需要主动free了?
    if (_Module)
    {
        // m3_FreeModule(_Module);
        _Module = nullptr;
    }
}

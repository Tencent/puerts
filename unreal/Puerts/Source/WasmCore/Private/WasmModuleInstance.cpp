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

void WasmModuleInstance::_OnInit(WasmRuntime* Runtime, TArray<uint8>& InData, int LinkCategory, AdditionLinkFunc _Func)
{
    _Module = nullptr;
    M3Result err = m3_ParseModule(Runtime->GetRuntime()->environment, &_Module, InData.GetData(), InData.Num());    // m3_FreeModule
    if (err)
    {
        UE_LOG(LogTemp, Error, TEXT("m3_ParseModule:%s"), ANSI_TO_TCHAR(err));
        return;
    }
    IM3Runtime m3Runtime = Runtime->GetRuntime();
    //初始的page设置为已经分配的,否则runtime加载一个初始memory更小的module,会导致老的import memory的module被重置
    if (_Module->memoryInfo.initPages < m3Runtime->memory.numPages)
    {
        _Module->memoryInfo.initPages = m3Runtime->memory.numPages;
    }
    err = m3_LoadModule(m3Runtime, _Module);
    if (err)
    {
        UE_LOG(LogTemp, Error, TEXT("m3_LoadModule:%s"), ANSI_TO_TCHAR(err));
        m3_FreeModule(_Module);
        _Module = nullptr;
        return;
    }

    if (LinkCategory >= 0)
    {
        if (!WasmStaticLinkClass::Link(_Module, LinkCategory))
        {
            return;
        }
    }

    if (_Func)
    {
        if (!_Func(_Module))
        {
            UE_LOG(LogTemp, Error, TEXT("wasm module addition link function error"));
            return;
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
        return;
    }

    for (u32 i = 0; i < _Module->numFunctions; ++i)
    {
        IM3Function f = &_Module->functions[i];
        if (f->compiled && f->export_name && *(f->export_name))
        {
            _AllExportFunctions.Add(f->export_name, new WasmFunction(f));
        }
    }

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

WasmModuleInstance::WasmModuleInstance(WasmRuntime* Runtime, TArray<uint8>& InData, int LinkCategory, AdditionLinkFunc _Func)
{
    this->_OnInit(Runtime, InData, LinkCategory, _Func);
    Runtime->OnModuleInstance(this);
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

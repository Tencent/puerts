/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "WasmStaticLink.h"

static TArray<TArray<WasmStaticLinkClassFunction> >* StaticLinkFunctionList = nullptr;

WasmStaticLinkClass::WasmStaticLinkClass(WasmStaticLinkClassFunction func, int Category)
{
    if (!StaticLinkFunctionList)
        StaticLinkFunctionList = new TArray<TArray<WasmStaticLinkClassFunction> >();
    if (StaticLinkFunctionList->Num() <= Category)
    {
        StaticLinkFunctionList->AddDefaulted(Category - StaticLinkFunctionList->Num() + 1);
    }
    TArray<TArray<WasmStaticLinkClassFunction> >& tmp = *StaticLinkFunctionList;
    tmp[Category].Add(func);
}

bool WasmStaticLinkClass::Link(IM3Module _Module, int Category)
{
    if (StaticLinkFunctionList)
    {
        TArray<TArray<WasmStaticLinkClassFunction> >& tmp = *StaticLinkFunctionList;
        if (tmp.Num() > Category)
        {
            for (WasmStaticLinkClassFunction& func : tmp[Category])
            {
                if (!func(_Module))
                {
                    return false;
                }
            }
        }
    }
    return true;
}

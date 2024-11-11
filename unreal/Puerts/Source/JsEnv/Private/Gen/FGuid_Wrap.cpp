/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

// gen by puerts gen tools

#include "CoreMinimal.h"
#include "Binding.hpp"
#include "UEDataBinding.hpp"

UsingUStruct(FGuid);

struct AutoRegisterForFGuid
{
    AutoRegisterForFGuid()
    {
        puerts::DefineClass<FGuid>()
            .Property("A", MakeProperty(&FGuid::A))
            .Property("B", MakeProperty(&FGuid::B))
            .Property("C", MakeProperty(&FGuid::C))
            .Property("D", MakeProperty(&FGuid::D))
            .Method("set_Item", SelectFunction(uint32 & (FGuid::*) (int32), &FGuid::operator[]))
            .Method("get_Item", SelectFunction(const uint32& (FGuid::*) (int32) const, &FGuid::operator[]))
            .Method("Invalidate", MakeFunction(&FGuid::Invalidate))
            .Method("IsValid", MakeFunction(&FGuid::IsValid))
            .Method("ToString", MakeFunction(&FGuid::ToString, EGuidFormats::Digits))
            .Function("NewGuid", MakeFunction(&FGuid::NewGuid))
            .Function("Parse", MakeFunction(&FGuid::Parse))
            .Function("ParseExact", MakeFunction(&FGuid::ParseExact))
            .Register();
    }
};

AutoRegisterForFGuid _AutoRegisterForFGuid_;
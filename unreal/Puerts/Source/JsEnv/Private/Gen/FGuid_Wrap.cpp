/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

// gen by puerts gen tools

#include "CoreMinimal.h"
#include "UsingTypeDecl.hpp"

struct AutoRegisterForFGuid
{
    AutoRegisterForFGuid()
    {
        puerts::DefineClass<FGuid>()
            .Constructor(CombineConstructors(MakeConstructor(FGuid), MakeConstructor(FGuid, uint32, uint32, uint32, uint32)))
            .Property("A", MakeProperty(&FGuid::A))
            .Property("B", MakeProperty(&FGuid::B))
            .Property("C", MakeProperty(&FGuid::C))
            .Property("D", MakeProperty(&FGuid::D))
            .Method("set_Item", SelectFunction(uint32 & (FGuid::*) (int32), &FGuid::operator[]))
            .Method("get_Item", SelectFunction(const uint32& (FGuid::*) (int32) const, &FGuid::operator[]))
            .Method("Invalidate", MakeFunction(&FGuid::Invalidate))
            .Method("IsValid", MakeFunction(&FGuid::IsValid))
#if ENGINE_MAJOR_VERSION >= 5 && ENGINE_MINOR_VERSION > 0
            .Method("ToString", MakeFunction(&FGuid::ToString, EGuidFormats::Digits))
#else
            .Method("ToString", CombineOverloads(MakeOverload(FString(FGuid::*)() const, &FGuid::ToString),
                                    MakeOverload(FString(FGuid::*)(EGuidFormats Format) const, &FGuid::ToString)))
#endif
            .Function("NewGuid", MakeFunction(&FGuid::NewGuid))
#if ENGINE_MAJOR_VERSION >= 5 && ENGINE_MINOR_VERSION > 5
            .Function("Parse", SelectFunction(bool (*)(const FString&, FGuid&), &FGuid::Parse))
            .Function("ParseExact", SelectFunction(bool (*)(const FString&, EGuidFormats, FGuid&), &FGuid::ParseExact))
#else
            .Function("Parse", MakeFunction(&FGuid::Parse))
            .Function("ParseExact", MakeFunction(&FGuid::ParseExact))
#endif
            .Register();
    }
};

AutoRegisterForFGuid _AutoRegisterForFGuid_;
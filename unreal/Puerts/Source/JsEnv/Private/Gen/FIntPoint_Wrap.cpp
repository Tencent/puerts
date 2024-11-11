/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

// gen by puerts gen tools

#include "CoreMinimal.h"
#include "UsingTypeDecl.hpp"

struct AutoRegisterForFIntPoint
{
    AutoRegisterForFIntPoint()
    {
        puerts::DefineClass<FIntPoint>()
            .Property("X", MakeProperty(&FIntPoint::X))
            .Property("Y", MakeProperty(&FIntPoint::Y))
            .Method("op_Equality", MakeFunction(&FIntPoint::operator==))
            .Method("op_Inequality", MakeFunction(&FIntPoint::operator!=))
            .Method("op_Multiply", SelectFunction(FIntPoint(FIntPoint::*)(int32 Scale) const, &FIntPoint::operator*))
            .Method("op_Division", CombineOverloads(MakeOverload(FIntPoint(FIntPoint::*)(int32) const, &FIntPoint::operator/),
                                       MakeOverload(FIntPoint(FIntPoint::*)(const FIntPoint&) const, &FIntPoint::operator/)))
            .Method("op_Addition", MakeFunction(&FIntPoint::operator+))
            .Method("op_Subtraction", MakeFunction(&(FIntPoint::operator-)))
            .Method("set_Item", SelectFunction(int32 & (FIntPoint::*) (int32), &FIntPoint::operator[]))
            .Method("get_Item", SelectFunction(int32(FIntPoint::*)(int32) const, &FIntPoint::operator[]))
            .Method("ComponentMin", MakeFunction(&FIntPoint::ComponentMin))
            .Method("ComponentMax", MakeFunction(&FIntPoint::ComponentMax))
            .Method("GetMax", MakeFunction(&FIntPoint::GetMax))
            .Method("GetMin", MakeFunction(&FIntPoint::GetMin))
            .Method("Size", MakeFunction(&FIntPoint::Size))
            .Method("SizeSquared", MakeFunction(&FIntPoint::SizeSquared))
            .Method("ToString", MakeFunction(&FIntPoint::ToString))
            .Function(
                "DivideAndRoundUp", CombineOverloads(MakeOverload(FIntPoint(*)(FIntPoint, int32), &FIntPoint::DivideAndRoundUp),
                                        MakeOverload(FIntPoint(*)(FIntPoint, FIntPoint), &FIntPoint::DivideAndRoundUp)))
            .Function(
                "DivideAndRoundDown", SelectFunction(FIntPoint(*)(FIntPoint lhs, int32 Divisor), &FIntPoint::DivideAndRoundDown))
            .Function("Num", MakeFunction(&FIntPoint::Num))
            .Register();
    }
};

AutoRegisterForFIntPoint _AutoRegisterForFIntPoint_;

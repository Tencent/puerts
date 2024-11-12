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

struct AutoRegisterForFBox2D
{
    AutoRegisterForFBox2D()
    {
        puerts::DefineClass<FBox2D>()
            .Constructor(CombineConstructors(MakeConstructor(FBox2D), MakeConstructor(FBox2D, EForceInit),
                MakeConstructor(FBox2D, const FVector2D&, const FVector2D&), MakeConstructor(FBox2D, const FVector2D*, const int32),
                MakeConstructor(FBox2D, const TArray<FVector2D>&)))
            .Property("Min", MakeProperty(&FBox2D::Min))
            .Property("Max", MakeProperty(&FBox2D::Max))
            .Property("bIsValid", MakeProperty(&FBox2D::bIsValid))
            .Method("op_Equality", MakeFunction(&FBox2D::operator==))
            .Method("op_Inequality", MakeFunction(&FBox2D::operator!=))
            .Method("op_Addition", CombineOverloads(MakeOverload(FBox2D(FBox2D::*)(const FVector2D&) const, &FBox2D::operator+),
                                       MakeOverload(FBox2D(FBox2D::*)(const FBox2D&) const, &FBox2D::operator+)))
            .Method("set_Item", SelectFunction(FVector2D & (FBox2D::*) (int32), &FBox2D::operator[]))
            .Method("ComputeSquaredDistanceToPoint", MakeFunction(&FBox2D::ComputeSquaredDistanceToPoint))
#if ENGINE_MAJOR_VERSION >= 5 && ENGINE_MINOR_VERSION > 2
            .Method("ExpandBy", SelectFunction(FBox2D(FBox2D::*)(const double W) const, &FBox2D::ExpandBy))
#else
            .Method("ExpandBy", SelectFunction(FBox2D(FBox2D::*)(const float W) const, &FBox2D::ExpandBy))
#endif
            .Method("GetArea", MakeFunction(&FBox2D::GetArea))
            .Method("GetCenter", MakeFunction(&FBox2D::GetCenter))
            .Method("GetCenterAndExtents", MakeFunction(&FBox2D::GetCenterAndExtents))
            .Method("GetClosestPointTo", MakeFunction(&FBox2D::GetClosestPointTo))
            .Method("GetExtent", MakeFunction(&FBox2D::GetExtent))
            .Method("GetSize", MakeFunction(&FBox2D::GetSize))
            .Method("Init", MakeFunction(&FBox2D::Init))
            .Method("Intersect", MakeFunction(&FBox2D::Intersect))
            .Method("IsInside", CombineOverloads(MakeOverload(bool (FBox2D::*)(const FVector2D&) const, &FBox2D::IsInside),
                                    MakeOverload(bool (FBox2D::*)(const FBox2D&) const, &FBox2D::IsInside)))
            .Method("ShiftBy", MakeFunction(&FBox2D::ShiftBy))
            .Method("ToString", MakeFunction(&FBox2D::ToString))
            .Register();
    }
};

AutoRegisterForFBox2D _AutoRegisterForFBox2D_;
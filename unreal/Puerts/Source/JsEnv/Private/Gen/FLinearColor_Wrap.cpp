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

struct AutoRegisterForFLinearColor
{
    AutoRegisterForFLinearColor()
    {
        puerts::DefineClass<FLinearColor>()
            .Constructor(CombineConstructors(MakeConstructor(FLinearColor), MakeConstructor(FLinearColor, EForceInit),
                MakeConstructor(FLinearColor, float, float, float, float), MakeConstructor(FLinearColor, const FColor&),
                MakeConstructor(FLinearColor, const FVector&), MakeConstructor(FLinearColor, const FVector4&),
                MakeConstructor(FLinearColor, const FFloat16Color&)))
            .Property("R", MakeProperty(&FLinearColor::R))
            .Property("G", MakeProperty(&FLinearColor::G))
            .Property("B", MakeProperty(&FLinearColor::B))
            .Property("A", MakeProperty(&FLinearColor::A))
            .Method("ToRGBE", MakeFunction(&FLinearColor::ToRGBE))
            .Function("FromSRGBColor", MakeFunction(&FLinearColor::FromSRGBColor))
            .Function("FromPow22Color", MakeFunction(&FLinearColor::FromPow22Color))
            .Method("Component", CombineOverloads(MakeOverload(float& (FLinearColor::*) (int32), &FLinearColor::Component),
                                     MakeOverload(const float& (FLinearColor::*) (int32) const, &FLinearColor::Component)))
            .Method("op_Addition", MakeFunction(&FLinearColor::operator+))
            .Method("op_Subtraction", MakeFunction(&FLinearColor::operator-))
            .Method("op_Multiply",
                CombineOverloads(MakeOverload(FLinearColor(FLinearColor::*)(const FLinearColor&) const, &FLinearColor::operator*),
                    MakeOverload(FLinearColor(FLinearColor::*)(float) const, &FLinearColor::operator*)))
            .Method("op_Division",
                CombineOverloads(MakeOverload(FLinearColor(FLinearColor::*)(const FLinearColor&) const, &FLinearColor::operator/),
                    MakeOverload(FLinearColor(FLinearColor::*)(float) const, &FLinearColor::operator/)))
            .Method("GetClamped", MakeFunction(&FLinearColor::GetClamped))
            .Method("op_Equality", MakeFunction(&FLinearColor::operator==))
            .Method("op_Inequality", MakeFunction(&FLinearColor::operator!=))
            .Method("Equals", MakeFunction(&FLinearColor::Equals))
            .Method("CopyWithNewOpacity", MakeFunction(&FLinearColor::CopyWithNewOpacity))
            .Function("MakeRandomColor", MakeFunction(&FLinearColor::MakeRandomColor))
            .Function("MakeFromColorTemperature", MakeFunction(&FLinearColor::MakeFromColorTemperature))
            .Function("Dist", MakeFunction(&FLinearColor::Dist))
            .Method("LinearRGBToHSV", MakeFunction(&FLinearColor::LinearRGBToHSV))
            .Method("HSVToLinearRGB", MakeFunction(&FLinearColor::HSVToLinearRGB))
            .Function("LerpUsingHSV", MakeFunction(&FLinearColor::LerpUsingHSV))
            .Method("Quantize", MakeFunction(&FLinearColor::Quantize))
            .Method("QuantizeRound", MakeFunction(&FLinearColor::QuantizeRound))
            .Method("ToFColor", MakeFunction(&FLinearColor::ToFColor))
            .Method("Desaturate", MakeFunction(&FLinearColor::Desaturate))
#if ENGINE_MAJOR_VERSION > 4
            .Method("ComputeLuminance", MakeFunction(&FLinearColor::GetLuminance))
#else
            .Method("ComputeLuminance", MakeFunction(&FLinearColor::ComputeLuminance))
#endif
            .Method("GetMax", MakeFunction(&FLinearColor::GetMax))
            .Method("IsAlmostBlack", MakeFunction(&FLinearColor::IsAlmostBlack))
            .Method("GetMin", MakeFunction(&FLinearColor::GetMin))
            .Method("GetLuminance", MakeFunction(&FLinearColor::GetLuminance))
            .Method("ToString", MakeFunction(&FLinearColor::ToString))
            .Method("InitFromString", MakeFunction(&FLinearColor::InitFromString))
            .Register();
    }
};

AutoRegisterForFLinearColor _AutoRegisterForFLinearColor_;

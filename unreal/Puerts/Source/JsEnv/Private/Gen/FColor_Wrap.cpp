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

struct AutoRegisterForFColor
{
    AutoRegisterForFColor()
    {
        puerts::DefineClass<FColor>()
            .Constructor(CombineConstructors(MakeConstructor(FColor), MakeConstructor(FColor, EForceInit),
                MakeConstructor(FColor, uint8, uint8, uint8, uint8), MakeConstructor(FColor, uint32)))
            .Method("DWColor", CombineOverloads(MakeOverload(uint32 & (FColor::*) (), &FColor::DWColor),
                                   MakeOverload(const uint32& (FColor::*) () const, &FColor::DWColor)))
            .Method("op_Equality", MakeFunction(&FColor::operator==))
            .Method("op_Inequality", MakeFunction(&FColor::operator!=))
            .Method("FromRGBE", MakeFunction(&FColor::FromRGBE))
            .Function("FromHex", MakeFunction(&FColor::FromHex))
            .Function("MakeRandomColor", MakeFunction(&FColor::MakeRandomColor))
            .Function("MakeRedToGreenColorFromScalar", MakeFunction(&FColor::MakeRedToGreenColorFromScalar))
            .Function("MakeFromColorTemperature", MakeFunction(&FColor::MakeFromColorTemperature))
            .Method("WithAlpha", MakeFunction(&FColor::WithAlpha))
            .Method("ReinterpretAsLinear", MakeFunction(&FColor::ReinterpretAsLinear))
            .Method("ToHex", MakeFunction(&FColor::ToHex))
            .Method("ToString", MakeFunction(&FColor::ToString))
            .Method("InitFromString", MakeFunction(&FColor::InitFromString))
            .Method("ToPackedARGB", MakeFunction(&FColor::ToPackedARGB))
            .Method("ToPackedABGR", MakeFunction(&FColor::ToPackedABGR))
            .Method("ToPackedRGBA", MakeFunction(&FColor::ToPackedRGBA))
            .Method("ToPackedBGRA", MakeFunction(&FColor::ToPackedBGRA))
            .Variable("White", MakeReadonlyVariable(&FColor::White))
            .Variable("Black", MakeReadonlyVariable(&FColor::Black))
            .Variable("Transparent", MakeReadonlyVariable(&FColor::Transparent))
            .Variable("Red", MakeReadonlyVariable(&FColor::Red))
            .Variable("Green", MakeReadonlyVariable(&FColor::Green))
            .Variable("Blue", MakeReadonlyVariable(&FColor::Blue))
            .Variable("Yellow", MakeReadonlyVariable(&FColor::Yellow))
            .Variable("Cyan", MakeReadonlyVariable(&FColor::Cyan))
            .Variable("Magenta", MakeReadonlyVariable(&FColor::Magenta))
            .Variable("Orange", MakeReadonlyVariable(&FColor::Orange))
            .Variable("Purple", MakeReadonlyVariable(&FColor::Purple))
            .Variable("Turquoise", MakeReadonlyVariable(&FColor::Turquoise))
            .Variable("Silver", MakeReadonlyVariable(&FColor::Silver))
            .Variable("Emerald", MakeReadonlyVariable(&FColor::Emerald))
            .Register();
    }
};

AutoRegisterForFColor _AutoRegisterForFColor_;
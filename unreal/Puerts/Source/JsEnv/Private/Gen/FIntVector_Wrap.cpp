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

UsingUStruct(FIntVector);

struct AutoRegisterForFIntVector
{
    AutoRegisterForFIntVector()
    {
        puerts::DefineClass<FIntVector>()
            .Property("X", MakeProperty(&FIntVector::X))
            .Property("Y", MakeProperty(&FIntVector::Y))
            .Property("Z", MakeProperty(&FIntVector::Z))
            .Method("get_Item", SelectFunction(const int32& (FIntVector::*) (int32) const, &FIntVector::operator[]))
            .Method("set_Item", SelectFunction(int32 & (FIntVector::*) (int32), &FIntVector::operator[]))
            .Method("op_Equality", MakeFunction(&FIntVector::operator==))
            .Method("op_Inequality", MakeFunction(&FIntVector::operator!=))
            .Method("op_Multiply", SelectFunction(FIntVector(FIntVector::*)(int32 Scale) const, &FIntVector::operator*))
            .Method("op_Division", MakeFunction(&FIntVector::operator/))
            .Method("op_Addition", MakeFunction(&FIntVector::operator+))
            .Method("op_Subtraction", MakeFunction(&FIntVector::operator-))
            .Method("IsZero", MakeFunction(&FIntVector::IsZero))
            .Method("GetMax", MakeFunction(&FIntVector::GetMax))
            .Method("GetMin", MakeFunction(&FIntVector::GetMin))
            .Method("Size", MakeFunction(&FIntVector::Size))
            .Method("ToString", MakeFunction(&FIntVector::ToString))
            .Function(
                "DivideAndRoundUp", CombineOverloads(MakeOverload(FIntVector(*)(FIntVector, int32), &FIntVector::DivideAndRoundUp),
                                        MakeOverload(FIntVector(*)(FIntVector, FIntVector), &FIntVector::DivideAndRoundUp)))
            .Function("Num", MakeFunction(&FIntVector::Num))
            .Register();
    }
};

AutoRegisterForFIntVector _AutoRegisterForFIntVector_;
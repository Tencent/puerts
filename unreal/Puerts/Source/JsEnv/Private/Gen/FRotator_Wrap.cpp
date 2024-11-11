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

UsingUStruct(FRotator);
UsingUStruct(FVector);
UsingUStruct(FQuat);

struct AutoRegisterForFRotator
{
    AutoRegisterForFRotator()
    {
        puerts::DefineClass<FRotator>()
            .Property("Pitch", MakeProperty(&FRotator::Pitch))
            .Property("Yaw", MakeProperty(&FRotator::Yaw))
            .Property("Roll", MakeProperty(&FRotator::Roll))
            .Method("DiagnosticCheckNaN", CombineOverloads(MakeOverload(void (FRotator::*)() const, &FRotator::DiagnosticCheckNaN),
                                              MakeOverload(void (FRotator::*)(const TCHAR*) const, &FRotator::DiagnosticCheckNaN)))
            .Method("op_Addition", MakeFunction(&FRotator::operator+))
            .Method("op_Subtraction", MakeFunction(&FRotator::operator-))
            .Method("op_Multiply", SelectFunction(FRotator(FRotator::*)(float Scale) const, &FRotator::operator*))
            .Method("op_Equality", MakeFunction(&FRotator::operator==))
            .Method("op_Inequality", MakeFunction(&FRotator::operator!=))
            .Method("IsNearlyZero", MakeFunction(&FRotator::IsNearlyZero))
            .Method("IsZero", MakeFunction(&FRotator::IsZero))
            .Method("Equals", MakeFunction(&FRotator::Equals))
            .Method("Add", MakeFunction(&FRotator::Add))
            .Method("GetInverse", MakeFunction(&FRotator::GetInverse))
            .Method("GridSnap", MakeFunction(&FRotator::GridSnap))
            .Method("Vector", MakeFunction(&FRotator::Vector))
            .Method("Quaternion", MakeFunction(&FRotator::Quaternion))
            .Method("Euler", MakeFunction(&FRotator::Euler))
            .Method("RotateVector", MakeFunction(&FRotator::RotateVector))
            .Method("UnrotateVector", MakeFunction(&FRotator::UnrotateVector))
            .Method("Clamp", MakeFunction(&FRotator::Clamp))
            .Method("GetNormalized", MakeFunction(&FRotator::GetNormalized))
            .Method("GetDenormalized", MakeFunction(&FRotator::GetDenormalized))
            .Method("GetComponentForAxis", MakeFunction(&FRotator::GetComponentForAxis))
            .Method("SetComponentForAxis", MakeFunction(&FRotator::SetComponentForAxis))
            .Method("Normalize", MakeFunction(&FRotator::Normalize))
            .Method("GetWindingAndRemainder", MakeFunction(&FRotator::GetWindingAndRemainder))
            .Method("GetManhattanDistance", MakeFunction(&FRotator::GetManhattanDistance))
            .Method("GetEquivalentRotator", MakeFunction(&FRotator::GetEquivalentRotator))
            .Method("SetClosestToMe", MakeFunction(&FRotator::SetClosestToMe))
            .Method("ToString", MakeFunction(&FRotator::ToString))
            .Method("ToCompactString", MakeFunction(&FRotator::ToCompactString))
            .Method("InitFromString", MakeFunction(&FRotator::InitFromString))
            .Method("ContainsNaN", MakeFunction(&FRotator::ContainsNaN))
            .Function("ClampAxis", MakeFunction(&FRotator::ClampAxis))
            .Function("NormalizeAxis", MakeFunction(&FRotator::NormalizeAxis))
            .Function("CompressAxisToByte", MakeFunction(&FRotator::CompressAxisToByte))
            .Function("DecompressAxisFromByte", MakeFunction(&FRotator::DecompressAxisFromByte))
            .Function("CompressAxisToShort", MakeFunction(&FRotator::CompressAxisToShort))
            .Function("DecompressAxisFromShort", MakeFunction(&FRotator::DecompressAxisFromShort))
            .Function("MakeFromEuler", MakeFunction(&FRotator::MakeFromEuler))
            .Register();
    }
};

AutoRegisterForFRotator _AutoRegisterForFRotator_;
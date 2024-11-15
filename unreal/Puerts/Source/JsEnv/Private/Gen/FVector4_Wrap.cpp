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

struct AutoRegisterForFVector4
{
    AutoRegisterForFVector4()
    {
        puerts::DefineClass<FVector4>()
            .Constructor(CombineConstructors(MakeConstructor(FVector4, const FVector&, float),
                MakeConstructor(FVector4, const FLinearColor&), MakeConstructor(FVector4, float, float, float, float),
                MakeConstructor(FVector4, FVector2D, FVector2D), MakeConstructor(FVector4, const FIntVector4&),
                MakeConstructor(FVector4, EForceInit)))
            .Property("X", MakeProperty(&FVector4::X))
            .Property("Y", MakeProperty(&FVector4::Y))
            .Property("Z", MakeProperty(&FVector4::Z))
            .Property("W", MakeProperty(&FVector4::W))
            .Method("op_UnaryNegation", SelectFunction(FVector4(FVector4::*)() const, &FVector4::operator-))
            .Method("op_Addition", MakeFunction(&FVector4::operator+))
            .Method("op_Subtraction", SelectFunction(FVector4(FVector4::*)(const FVector4&) const, &FVector4::operator-))
            .Method("op_Multiply", CombineOverloads(MakeOverload(FVector4(FVector4::*)(float) const, &FVector4::operator*),
                                       MakeOverload(FVector4(FVector4::*)(const FVector4&) const, &FVector4::operator*)))
            .Method("op_Division", CombineOverloads(MakeOverload(FVector4(FVector4::*)(float) const, &FVector4::operator/),
                                       MakeOverload(FVector4(FVector4::*)(const FVector4&) const, &FVector4::operator/)))
            .Method("op_Equality", MakeFunction(&FVector4::operator==))
            .Method("op_Inequality", MakeFunction(&FVector4::operator!=))
            .Method("op_ExclusiveOr", MakeFunction(&FVector4::operator^))
#if ENGINE_MAJOR_VERSION >= 5 && ENGINE_MINOR_VERSION > 2
            .Method("set_Item", SelectFunction(double& (FVector4::*) (int32), &FVector4::operator[]))
            .Method("get_Item", SelectFunction(double (FVector4::*)(int32) const, &FVector4::operator[]))
            .Method("Component", CombineOverloads(MakeOverload(double& (FVector4::*) (int32), &FVector4::Component),
                                     MakeOverload(const double& (FVector4::*) (int32) const, &FVector4::Component)))
#else
            .Method("set_Item", SelectFunction(float& (FVector4::*) (int32), &FVector4::operator[]))
            .Method("get_Item", SelectFunction(float (FVector4::*)(int32) const, &FVector4::operator[]))
            .Method("Component", CombineOverloads(MakeOverload(float& (FVector4::*) (int32), &FVector4::Component),
                                     MakeOverload(const float& (FVector4::*) (int32) const, &FVector4::Component)))
#endif
            .Method("Equals", MakeFunction(&FVector4::Equals, KINDA_SMALL_NUMBER))
            .Method("IsUnit3", MakeFunction(&FVector4::IsUnit3, KINDA_SMALL_NUMBER))
            .Method("ToString", MakeFunction(&FVector4::ToString))
            .Method("InitFromString", MakeFunction(&FVector4::InitFromString))
            .Method("GetSafeNormal", MakeFunction(&FVector4::GetSafeNormal, SMALL_NUMBER))
            .Method("GetUnsafeNormal3", MakeFunction(&FVector4::GetUnsafeNormal3))
            .Method("ToOrientationRotator", MakeFunction(&FVector4::ToOrientationRotator))
            .Method("ToOrientationQuat", MakeFunction(&FVector4::ToOrientationQuat))
            .Method("Rotation", MakeFunction(&FVector4::Rotation))
            .Method("Set", MakeFunction(&FVector4::Set))
            .Method("Size3", MakeFunction(&FVector4::Size3))
            .Method("SizeSquared3", MakeFunction(&FVector4::SizeSquared3))
            .Method("Size", MakeFunction(&FVector4::Size))
            .Method("SizeSquared", MakeFunction(&FVector4::SizeSquared))
            .Method("ContainsNaN", MakeFunction(&FVector4::ContainsNaN))
            .Method("IsNearlyZero3", MakeFunction(&FVector4::IsNearlyZero3, KINDA_SMALL_NUMBER))
            .Method("Reflect3", MakeFunction(&FVector4::Reflect3))
            .Method("FindBestAxisVectors3", MakeFunction(&FVector4::FindBestAxisVectors3))
            .Method("DiagnosticCheckNaN", MakeFunction(&FVector4::DiagnosticCheckNaN))
            .Register();
    }
};

AutoRegisterForFVector4 _AutoRegisterForFVector4_;

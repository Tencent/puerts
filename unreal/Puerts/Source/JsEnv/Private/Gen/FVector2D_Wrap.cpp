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

struct AutoRegisterForFVector2D
{
    AutoRegisterForFVector2D()
    {
        puerts::DefineClass<FVector2D>()
            .Constructor(CombineConstructors(MakeConstructor(FVector2D), MakeConstructor(FVector2D, float, float),
                MakeConstructor(FVector2D, float), MakeConstructor(FVector2D, FIntPoint), MakeConstructor(FVector2D, EForceInit),
                MakeConstructor(FVector2D, ENoInit), MakeConstructor(FVector2D, const FVector&),
                MakeConstructor(FVector2D, const FVector4&)))
            .Property("X", MakeProperty(&FVector2D::X))
            .Property("Y", MakeProperty(&FVector2D::Y))
            .Method("op_BitwiseOr", MakeFunction(&FVector2D::operator|))
            .Method("op_ExclusiveOr", MakeFunction(&FVector2D::operator^))
            .Method("op_Equality", MakeFunction(&FVector2D::operator==))
            .Method("op_Inequality", MakeFunction(&FVector2D::operator!=))
            .Method("op_UnaryNegation", SelectFunction(FVector2D(FVector2D::*)() const, &FVector2D::operator-))
#if ENGINE_MAJOR_VERSION >= 5 && ENGINE_MINOR_VERSION > 2
            .Method("op_Addition",
                CombineOverloads(MakeOverload(FVector2D(FVector2D::*)(const FVector2D&) const, &FVector2D::operator+),
                    MakeOverload(FVector2D(FVector2D::*)(double) const, &FVector2D::operator+)))
            .Method("op_Subtraction",
                CombineOverloads(MakeOverload(FVector2D(FVector2D::*)(const FVector2D&) const, &FVector2D::operator-),
                    MakeOverload(FVector2D(FVector2D::*)(double) const, &FVector2D::operator-)))
            .Method("op_Multiply", CombineOverloads(MakeOverload(FVector2D(FVector2D::*)(double) const, &FVector2D::operator*),
                                       MakeOverload(FVector2D(FVector2D::*)(const FVector2D&) const, &FVector2D::operator*)))
            .Method("op_Division", CombineOverloads(MakeOverload(FVector2D(FVector2D::*)(double) const, &FVector2D::operator/),
                                       MakeOverload(FVector2D(FVector2D::*)(const FVector2D&) const, &FVector2D::operator/)))
            .Method("set_Item", SelectFunction(double& (FVector2D::*) (int32), &FVector2D::operator[]))
            .Method("get_Item", SelectFunction(double (FVector2D::*)(int32) const, &FVector2D::operator[]))
            .Method("Component", CombineOverloads(MakeOverload(double& (FVector2D::*) (int32), &FVector2D::Component),
                                     MakeOverload(double (FVector2D::*)(int32) const, &FVector2D::Component)))
#else
            .Method("op_Addition",
                CombineOverloads(MakeOverload(FVector2D(FVector2D::*)(const FVector2D&) const, &FVector2D::operator+),
                    MakeOverload(FVector2D(FVector2D::*)(float) const, &FVector2D::operator+)))
            .Method("op_Subtraction",
                CombineOverloads(MakeOverload(FVector2D(FVector2D::*)(const FVector2D&) const, &FVector2D::operator-),
                    MakeOverload(FVector2D(FVector2D::*)(float) const, &FVector2D::operator-)))
            .Method("op_Multiply", CombineOverloads(MakeOverload(FVector2D(FVector2D::*)(float) const, &FVector2D::operator*),
                                       MakeOverload(FVector2D(FVector2D::*)(const FVector2D&) const, &FVector2D::operator*)))
            .Method("op_Division", CombineOverloads(MakeOverload(FVector2D(FVector2D::*)(float) const, &FVector2D::operator/),
                                       MakeOverload(FVector2D(FVector2D::*)(const FVector2D&) const, &FVector2D::operator/)))
            .Method("set_Item", SelectFunction(float& (FVector2D::*) (int32), &FVector2D::operator[]))
            .Method("get_Item", SelectFunction(float (FVector2D::*)(int32) const, &FVector2D::operator[]))
            .Method("Component", CombineOverloads(MakeOverload(float& (FVector2D::*) (int32), &FVector2D::Component),
                                     MakeOverload(float (FVector2D::*)(int32) const, &FVector2D::Component)))
#endif
            .Function("DotProduct", MakeFunction(&FVector2D::DotProduct))
            .Function("DistSquared", MakeFunction(&FVector2D::DistSquared))
            .Function("Distance", MakeFunction(&FVector2D::Distance))
            .Function("CrossProduct", MakeFunction(&FVector2D::CrossProduct))
            .Method("Equals", MakeFunction(&FVector2D::Equals))
            .Method("Set", MakeFunction(&FVector2D::Set))
            .Method("GetMax", MakeFunction(&FVector2D::GetMax))
            .Method("GetAbsMax", MakeFunction(&FVector2D::GetAbsMax))
            .Method("GetMin", MakeFunction(&FVector2D::GetMin))
            .Method("Size", MakeFunction(&FVector2D::Size))
            .Method("SizeSquared", MakeFunction(&FVector2D::SizeSquared))
            .Method("GetRotated", MakeFunction(&FVector2D::GetRotated))
            .Method("GetSafeNormal", MakeFunction(&FVector2D::GetSafeNormal))
            .Method("Normalize", MakeFunction(&FVector2D::Normalize))
            .Method("IsNearlyZero", MakeFunction(&FVector2D::IsNearlyZero))
            .Method("ToDirectionAndLength",
                SelectFunction(void (FVector2D::*)(FVector2D&, float&) const, &FVector2D::ToDirectionAndLength))
            .Method("IsZero", MakeFunction(&FVector2D::IsZero))
            .Method("IntPoint", MakeFunction(&FVector2D::IntPoint))
            .Method("RoundToVector", MakeFunction(&FVector2D::RoundToVector))
            .Method("ClampAxes", MakeFunction(&FVector2D::ClampAxes))
            .Method("GetSignVector", MakeFunction(&FVector2D::GetSignVector))
            .Method("GetAbs", MakeFunction(&FVector2D::GetAbs))
            .Method("ToString", MakeFunction(&FVector2D::ToString))
            .Method("InitFromString", MakeFunction(&FVector2D::InitFromString))
            .Method("DiagnosticCheckNaN", MakeFunction(&FVector2D::DiagnosticCheckNaN))
            .Method("ContainsNaN", MakeFunction(&FVector2D::ContainsNaN))
            .Method("SphericalToUnitCartesian", MakeFunction(&FVector2D::SphericalToUnitCartesian))
            .Variable("ZeroVector", MakeReadonlyVariable(&FVector2D::ZeroVector))
            .Variable("UnitVector", MakeReadonlyVariable(&FVector2D::UnitVector))
            .Variable("Unit45Deg", MakeReadonlyVariable(&FVector2D::Unit45Deg))
            .Register();
    }
};

AutoRegisterForFVector2D _AutoRegisterForFVector2D_;

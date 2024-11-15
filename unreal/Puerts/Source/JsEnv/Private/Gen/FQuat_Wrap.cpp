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

struct AutoRegisterForFQuat
{
    AutoRegisterForFQuat()
    {
        puerts::DefineClass<FQuat>()
            .Constructor(CombineConstructors(MakeConstructor(FQuat), MakeConstructor(FQuat, EForceInit),
                MakeConstructor(FQuat, float, float, float, float), MakeConstructor(FQuat, const FMatrix&),
                MakeConstructor(FQuat, const FRotator&), MakeConstructor(FQuat, FVector, float)))
            .Property("X", MakeProperty(&FQuat::X))
            .Property("Y", MakeProperty(&FQuat::Y))
            .Property("Z", MakeProperty(&FQuat::Z))
            .Property("W", MakeProperty(&FQuat::W))
            .Method("op_Addition", MakeFunction(&FQuat::operator+))
            .Method("op_Subtraction", SelectFunction(FQuat(FQuat::*)(const FQuat& Q) const, &FQuat::operator-))
            .Method("Equals", MakeFunction(&FQuat::Equals, UE_KINDA_SMALL_NUMBER))
            .Method("IsIdentity", MakeFunction(&FQuat::IsIdentity, UE_SMALL_NUMBER))
            .Method("op_Multiply", CombineOverloads(MakeOverload(FQuat(FQuat::*)(const FQuat&) const, &FQuat::operator*),
                                       MakeOverload(FVector(FQuat::*)(const FVector&) const, &FQuat::operator*),
                                       MakeOverload(FQuat(FQuat::*)(const float) const, &FQuat::operator*)))
            .Method("op_Division", SelectFunction(FQuat(FQuat::*)(const float Scale) const, &FQuat::operator/))
            .Method("op_Equality", MakeFunction(&FQuat::operator==))
            .Method("op_Inequality", MakeFunction(&FQuat::operator!=))
            .Method("op_BitwiseOr", MakeFunction(&FQuat::operator|))
            .Function("MakeFromEuler", MakeFunction(&FQuat::MakeFromEuler))
            .Method("Euler", MakeFunction(&FQuat::Euler))
            .Method("Normalize", MakeFunction(&FQuat::Normalize, UE_SMALL_NUMBER))
            .Method("GetNormalized", MakeFunction(&FQuat::GetNormalized, UE_SMALL_NUMBER))
            .Method("IsNormalized", MakeFunction(&FQuat::IsNormalized))
            .Method("Size", MakeFunction(&FQuat::Size))
            .Method("SizeSquared", MakeFunction(&FQuat::SizeSquared))
            .Method("GetAngle", MakeFunction(&FQuat::GetAngle))
            .Method("ToAxisAndAngle", SelectFunction(void (FQuat::*)(FVector & Axis, float& Angle) const, &FQuat::ToAxisAndAngle))
            .Method("ToSwingTwist", MakeFunction(&FQuat::ToSwingTwist))
            .Method("RotateVector", MakeFunction(&FQuat::RotateVector))
            .Method("UnrotateVector", MakeFunction(&FQuat::UnrotateVector))
            .Method("Log", MakeFunction(&FQuat::Log))
            .Method("Exp", MakeFunction(&FQuat::Exp))
            .Method("Inverse", MakeFunction(&FQuat::Inverse))
            .Method("EnforceShortestArcWith", MakeFunction(&FQuat::EnforceShortestArcWith))
            .Method("GetAxisX", MakeFunction(&FQuat::GetAxisX))
            .Method("GetAxisY", MakeFunction(&FQuat::GetAxisY))
            .Method("GetAxisZ", MakeFunction(&FQuat::GetAxisZ))
            .Method("GetForwardVector", MakeFunction(&FQuat::GetForwardVector))
            .Method("GetRightVector", MakeFunction(&FQuat::GetRightVector))
            .Method("GetUpVector", MakeFunction(&FQuat::GetUpVector))
            .Method("Vector", MakeFunction(&FQuat::Vector))
            .Method("Rotator", MakeFunction(&FQuat::Rotator))
            .Method("GetRotationAxis", MakeFunction(&FQuat::GetRotationAxis))
            .Method("AngularDistance", MakeFunction(&FQuat::AngularDistance))
            .Method("ContainsNaN", MakeFunction(&FQuat::ContainsNaN))
            .Method("ToString", MakeFunction(&FQuat::ToString))
            .Method("InitFromString", MakeFunction(&FQuat::InitFromString))
            .Method("DiagnosticCheckNaN", CombineOverloads(MakeOverload(void (FQuat::*)() const, &FQuat::DiagnosticCheckNaN),
                                              MakeOverload(void (FQuat::*)(const TCHAR*) const, &FQuat::DiagnosticCheckNaN)))
            .Function("FindBetween", MakeFunction(&FQuat::FindBetween))
            .Function("FindBetweenNormals", MakeFunction(&FQuat::FindBetweenNormals))
            .Function("FindBetweenVectors", MakeFunction(&FQuat::FindBetweenVectors))
            .Function("Error", MakeFunction(&FQuat::Error))
            .Function("ErrorAutoNormalize", MakeFunction(&FQuat::ErrorAutoNormalize))
            .Function("FastLerp", MakeFunction(&FQuat::FastLerp))
            .Function("FastBilerp", MakeFunction(&FQuat::FastBilerp))
            .Function("Slerp_NotNormalized", MakeFunction(&FQuat::Slerp_NotNormalized))
            .Function("Slerp", MakeFunction(&FQuat::Slerp))
            .Function("SlerpFullPath_NotNormalized", MakeFunction(&FQuat::SlerpFullPath_NotNormalized))
            .Function("SlerpFullPath", MakeFunction(&FQuat::SlerpFullPath))
            .Function("Squad", MakeFunction(&FQuat::Squad))
            .Function("SquadFullPath", MakeFunction(&FQuat::SquadFullPath))
            .Function("CalcTangents", MakeFunction(&FQuat::CalcTangents))
            .Variable("Identity", MakeReadonlyVariable(&FQuat::Identity))
            .Register();
    }
};

AutoRegisterForFQuat _AutoRegisterForFQuat_;

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

struct AutoRegisterForFVector
{
    AutoRegisterForFVector()
    {
        puerts::DefineClass<FVector>()
            .Constructor(CombineConstructors(MakeConstructor(FVector), MakeConstructor(FVector, float),
                MakeConstructor(FVector, float, float, float), MakeConstructor(FVector, const FVector2D, float),
                MakeConstructor(FVector, const FVector4&), MakeConstructor(FVector, const FLinearColor&),
                MakeConstructor(FVector, FIntVector), MakeConstructor(FVector, FIntPoint), MakeConstructor(FVector, EForceInit)))
            .Property("X", MakeProperty(&FVector::X))
            .Property("Y", MakeProperty(&FVector::Y))
            .Property("Z", MakeProperty(&FVector::Z))
            .Method("DiagnosticCheckNaN", CombineOverloads(MakeOverload(void (FVector::*)() const, &FVector::DiagnosticCheckNaN),
                                              MakeOverload(void (FVector::*)(const TCHAR*) const, &FVector::DiagnosticCheckNaN)))
            .Method("op_ExclusiveOr", MakeFunction(&FVector::operator^))
            .Function("CrossProduct", MakeFunction(&FVector::CrossProduct))
            .Method("op_BitwiseOr", MakeFunction(&FVector::operator|))
            .Function("DotProduct", MakeFunction(&FVector::DotProduct))
            .Method("op_Addition", CombineOverloads(MakeOverload(FVector(FVector::*)(const FVector&) const, &FVector::operator+),
                                       MakeOverload(FVector(FVector::*)(float) const, &FVector::operator+)))
            .Method("op_Subtraction", CombineOverloads(MakeOverload(FVector(FVector::*)(const FVector&) const, &FVector::operator-),
                                          MakeOverload(FVector(FVector::*)(float) const, &FVector::operator-)))
            .Method("op_Multiply", CombineOverloads(MakeOverload(FVector(FVector::*)(float) const, &FVector::operator*),
                                       MakeOverload(FVector(FVector::*)(const FVector&) const, &FVector::operator*)))
            .Method("op_Division", CombineOverloads(MakeOverload(FVector(FVector::*)(float) const, &FVector::operator/),
                                       MakeOverload(FVector(FVector::*)(const FVector&) const, &FVector::operator/)))
            .Method("op_Equality", MakeFunction(&FVector::operator==))
            .Method("op_Inequality", MakeFunction(&FVector::operator!=))
            .Method("Equals", MakeFunction(&FVector::Equals, UE_KINDA_SMALL_NUMBER))
            .Method("AllComponentsEqual", MakeFunction(&FVector::AllComponentsEqual))
            .Method("op_UnaryNegation", SelectFunction(FVector(FVector::*)() const, &FVector::operator-))
#if ENGINE_MAJOR_VERSION >= 5 && ENGINE_MINOR_VERSION > 2
            .Method("set_Item", SelectFunction(double& (FVector::*) (int32), &FVector::operator[]))
            .Method("get_Item", SelectFunction(double (FVector::*)(int32) const, &FVector::operator[]))
            .Method("Component", CombineOverloads(MakeOverload(double& (FVector::*) (int32), &FVector::Component),
                                     MakeOverload(double (FVector::*)(int32) const, &FVector::Component)))
#else
            .Method("set_Item", SelectFunction(float& (FVector::*) (int32), &FVector::operator[]))
            .Method("get_Item", SelectFunction(float (FVector::*)(int32) const, &FVector::operator[]))
            .Method("Component", CombineOverloads(MakeOverload(float& (FVector::*) (int32), &FVector::Component),
                                     MakeOverload(float (FVector::*)(int32) const, &FVector::Component)))
#endif
            .Method("GetComponentForAxis", MakeFunction(&FVector::GetComponentForAxis))
            .Method("SetComponentForAxis", MakeFunction(&FVector::SetComponentForAxis))
            .Method("Set", MakeFunction(&FVector::Set))
            .Method("GetMax", MakeFunction(&FVector::GetMax))
            .Method("GetAbsMax", MakeFunction(&FVector::GetAbsMax))
            .Method("GetMin", MakeFunction(&FVector::GetMin))
            .Method("GetAbsMin", MakeFunction(&FVector::GetAbsMin))
            .Method("ComponentMin", MakeFunction(&FVector::ComponentMin))
            .Method("ComponentMax", MakeFunction(&FVector::ComponentMax))
            .Method("GetAbs", MakeFunction(&FVector::GetAbs))
            .Method("Size", MakeFunction(&FVector::Size))
            .Method("SizeSquared", MakeFunction(&FVector::SizeSquared))
            .Method("Size2D", MakeFunction(&FVector::Size2D))
            .Method("SizeSquared2D", MakeFunction(&FVector::SizeSquared2D))
            .Method("IsNearlyZero", MakeFunction(&FVector::IsNearlyZero, UE_KINDA_SMALL_NUMBER))
            .Method("IsZero", MakeFunction(&FVector::IsZero))
            .Method("IsUnit", MakeFunction(&FVector::IsUnit, UE_KINDA_SMALL_NUMBER))
            .Method("IsNormalized", MakeFunction(&FVector::IsNormalized))
            .Method("Normalize", MakeFunction(&FVector::Normalize, UE_SMALL_NUMBER))
            .Method("GetUnsafeNormal", MakeFunction(&FVector::GetUnsafeNormal))
            .Method("GetSafeNormal", MakeFunction(&FVector::GetSafeNormal, UE_SMALL_NUMBER, FVector::ZeroVector))
            .Method("GetSafeNormal2D", MakeFunction(&FVector::GetSafeNormal2D, UE_SMALL_NUMBER, FVector::ZeroVector))
            .Method(
                "ToDirectionAndLength", SelectFunction(void (FVector::*)(FVector&, float&) const, &FVector::ToDirectionAndLength))
            .Method("GetSignVector", MakeFunction(&FVector::GetSignVector))
            .Method("Projection", MakeFunction(&FVector::Projection))
            .Method("GetUnsafeNormal2D", MakeFunction(&FVector::GetUnsafeNormal2D))
            .Method("GridSnap", MakeFunction(&FVector::GridSnap))
            .Method("BoundToCube", MakeFunction(&FVector::BoundToCube))
            .Method("BoundToBox", MakeFunction(&FVector::BoundToBox))
            .Method("GetClampedToSize", MakeFunction(&FVector::GetClampedToSize))
            .Method("GetClampedToSize2D", MakeFunction(&FVector::GetClampedToSize2D))
            .Method("GetClampedToMaxSize", MakeFunction(&FVector::GetClampedToMaxSize))
            .Method("GetClampedToMaxSize2D", MakeFunction(&FVector::GetClampedToMaxSize2D))
            .Method("AddBounded", MakeFunction(&FVector::AddBounded))
            .Method("Reciprocal", MakeFunction(&FVector::Reciprocal))
            .Method("IsUniform", MakeFunction(&FVector::IsUniform, UE_KINDA_SMALL_NUMBER))
            .Method("MirrorByVector", MakeFunction(&FVector::MirrorByVector))
            .Method("MirrorByPlane", MakeFunction(&FVector::MirrorByPlane))
            .Method("RotateAngleAxis", MakeFunction(&FVector::RotateAngleAxis))
            .Method("CosineAngle2D", MakeFunction(&FVector::CosineAngle2D))
            .Method("ProjectOnTo", MakeFunction(&FVector::ProjectOnTo))
            .Method("ProjectOnToNormal", MakeFunction(&FVector::ProjectOnToNormal))
            .Method("ToOrientationRotator", MakeFunction(&FVector::ToOrientationRotator))
            .Method("ToOrientationQuat", MakeFunction(&FVector::ToOrientationQuat))
            .Method("Rotation", MakeFunction(&FVector::Rotation))
            .Method("FindBestAxisVectors", MakeFunction(&FVector::FindBestAxisVectors))
            .Method("UnwindEuler", MakeFunction(&FVector::UnwindEuler))
            .Method("ContainsNaN", MakeFunction(&FVector::ContainsNaN))
            .Method("ToString", MakeFunction(&FVector::ToString))
            .Method("ToText", MakeFunction(&FVector::ToText))
            .Method("ToCompactString", MakeFunction(&FVector::ToCompactString))
            .Method("ToCompactText", MakeFunction(&FVector::ToCompactText))
            .Method("InitFromString", MakeFunction(&FVector::InitFromString))
            .Method("UnitCartesianToSpherical", MakeFunction(&FVector::UnitCartesianToSpherical))
            .Method("HeadingAngle", MakeFunction(&FVector::HeadingAngle))
            .Function("CreateOrthonormalBasis", MakeFunction(&FVector::CreateOrthonormalBasis))
            .Function("PointsAreSame", MakeFunction(&FVector::PointsAreSame))
            .Function("PointsAreNear", MakeFunction(&FVector::PointsAreNear))
            .Function("PointPlaneDist", MakeFunction(&FVector::PointPlaneDist))
            .Function("PointPlaneProject",
                CombineOverloads(MakeOverload(FVector(*)(const FVector&, const FPlane&), &FVector::PointPlaneProject),
                    MakeOverload(
                        FVector(*)(const FVector&, const FVector&, const FVector&, const FVector&), &FVector::PointPlaneProject),
                    MakeOverload(FVector(*)(const FVector&, const FVector&, const FVector&), &FVector::PointPlaneProject)))
            .Function("VectorPlaneProject", MakeFunction(&FVector::VectorPlaneProject))
            .Function("Dist", MakeFunction(&FVector::Dist))
            .Function("Distance", MakeFunction(&FVector::Distance))
            .Function("DistXY", MakeFunction(&FVector::DistXY))
            .Function("Dist2D", MakeFunction(&FVector::Dist2D))
            .Function("DistSquared", MakeFunction(&FVector::DistSquared))
            .Function("DistSquaredXY", MakeFunction(&FVector::DistSquaredXY))
            .Function("DistSquared2D", MakeFunction(&FVector::DistSquared2D))
            .Function("BoxPushOut", MakeFunction(&FVector::BoxPushOut))
            .Function("Parallel", MakeFunction(&FVector::Parallel, UE_THRESH_NORMALS_ARE_PARALLEL))
            .Function("Coincident", MakeFunction(&FVector::Coincident, UE_THRESH_NORMALS_ARE_PARALLEL))
            .Function("Orthogonal", MakeFunction(&FVector::Orthogonal, UE_THRESH_NORMALS_ARE_ORTHOGONAL))
            .Function("Coplanar", MakeFunction(&FVector::Coplanar, UE_THRESH_NORMALS_ARE_PARALLEL))
            .Function("Triple", MakeFunction(&FVector::Triple))
            .Function("RadiansToDegrees", MakeFunction(&FVector::RadiansToDegrees))
            .Function("DegreesToRadians", MakeFunction(&FVector::DegreesToRadians))
            .Variable("ZeroVector", MakeReadonlyVariable(&FVector::ZeroVector))
            .Variable("OneVector", MakeReadonlyVariable(&FVector::OneVector))
            .Variable("UpVector", MakeReadonlyVariable(&FVector::UpVector))
            .Variable("DownVector", MakeReadonlyVariable(&FVector::DownVector))
            .Variable("ForwardVector", MakeReadonlyVariable(&FVector::ForwardVector))
            .Variable("BackwardVector", MakeReadonlyVariable(&FVector::BackwardVector))
            .Variable("RightVector", MakeReadonlyVariable(&FVector::RightVector))
            .Variable("LeftVector", MakeReadonlyVariable(&FVector::LeftVector))
            .Register();
    }
};

AutoRegisterForFVector _AutoRegisterForFVector_;

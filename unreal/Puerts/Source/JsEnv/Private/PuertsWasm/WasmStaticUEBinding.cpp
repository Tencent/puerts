/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#if WITH_WASM
#include <array>
#include <tuple>
#include "WasmRuntime.h"
#include "WasmModule.h"
#include "WasmFunction.h"
#include "WasmStaticLink.h"
#include "CoreMinimal.h"

bool AActor_K2_SetActorLocation(AActor* Actor, const FVector& NewLocation)
{
    return Actor->SetActorLocation(NewLocation);
}

FVector AActor_K2_GetActorLocation(AActor* Actor)
{
    return Actor->GetActorLocation();
}

FRotator FVector_Rotation(const FVector& InVector)
{
    return InVector.Rotation();
}

FVector FRotator_Vector(const FRotator& InRotator)
{
    return InRotator.Vector();
}

WASM_BEGIN_LINK_GLOBAL(AActor, 0)
WASM_LINK_GLOBAL(AActor_K2_SetActorLocation)
WASM_LINK_GLOBAL(AActor_K2_GetActorLocation)
WASM_END_LINK_GLOBAL(AActor, 0)

WASM_BEGIN_LINK_GLOBAL(FVector, 0)
WASM_LINK_GLOBAL(FVector_Rotation)
WASM_LINK_GLOBAL(FRotator_Vector)
WASM_END_LINK_GLOBAL(FVector, 0)
#endif
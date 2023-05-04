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
#include "Binding.hpp"
#include "UEDataBinding.hpp"

class TestFunction
{
public:
    static FVector Test_GetActorLocation(AActor* Actor)
    {
        return Actor->K2_GetActorLocation();
    }

    static int Test_Fib(int a)
    {
        if (a <= 2)
            return 1;
        return Test_Fib(a - 1) + Test_Fib(a - 2);
    }

    static float Test_DistanceSqr(const FVector& InVector)
    {
        return InVector.X * InVector.X + InVector.Y * InVector.Y + InVector.Z * InVector.Z;
    }
};

UsingCppType(TestFunction);
UsingUStruct(FVector);
UsingUClass(AActor);

struct AutoRegisterForUEExtension11
{
    AutoRegisterForUEExtension11()
    {
        {
            puerts::DefineClass<TestFunction>()
                .Function("Test_GetActorLocation", MakeFunction(&TestFunction::Test_GetActorLocation))
                .Function("Test_Fib", MakeFunction(&TestFunction::Test_Fib))
                .Function("Test_DistanceSqr", MakeFunction(&TestFunction::Test_DistanceSqr))
                .Register();
        }
    }
};
AutoRegisterForUEExtension11 _AutoRegisterForUEExtension1__;
#endif
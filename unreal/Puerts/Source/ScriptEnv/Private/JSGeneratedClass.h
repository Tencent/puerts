/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "NamespaceDef.h"

#include "DynamicInvoker.h"

#include "CoreMinimal.h"
#include "Engine/BlueprintGeneratedClass.h"
#include "JSGeneratedClass.generated.h"

/**
 * the helpers of blueprint.mixin: redirects the functions of an existing class to js, and restores them
 */
UCLASS()
class UJSGeneratedClass : public UBlueprintGeneratedClass
{
    GENERATED_BODY()

public:
    static UFunction* Mixin(UClass* Class, UFunction* Super,
        TSharedPtr<PUERTS_NAMESPACE::IDynamicInvoker, ESPMode::ThreadSafe> DynamicInvoker, bool TakeJsObjectRef, bool Warning);

    static void Restore(UClass* Class);
};

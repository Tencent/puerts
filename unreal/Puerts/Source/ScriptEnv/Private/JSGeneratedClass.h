/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "NamespaceDef.h"
#include "pesapi.h"
#include "PapiValueRef.h"

#include "DynamicInvoker.h"

#include "CoreMinimal.h"
#include "Engine/BlueprintGeneratedClass.h"
#include "JSGeneratedClass.generated.h"

/**
 *
 */
UCLASS()
class UJSGeneratedClass : public UBlueprintGeneratedClass
{
    GENERATED_BODY()

public:
    static UClass* Create(const FString& Name, UClass* Parent,
        TSharedPtr<PUERTS_NAMESPACE::IDynamicInvoker, ESPMode::ThreadSafe> DynamicInvoker, struct pesapi_ffi* Apis, pesapi_env Env,
        pesapi_value Constructor, pesapi_value Prototype);

    static void Override(struct pesapi_ffi* Apis, pesapi_env Env, UClass* Class, UFunction* Super, pesapi_value JSImpl,
        TSharedPtr<PUERTS_NAMESPACE::IDynamicInvoker, ESPMode::ThreadSafe> DynamicInvoker, bool IsNative);

    static UFunction* Mixin(UClass* Class, UFunction* Super,
        TSharedPtr<PUERTS_NAMESPACE::IDynamicInvoker, ESPMode::ThreadSafe> DynamicInvoker, bool TakeJsObjectRef, bool Warning);

    static void Restore(UClass* Class);

    void InitPropertiesFromCustomList(uint8* DataPtr, const uint8* DefaultDataPtr) override;

    // must be called while the env is alive
    void Release();

    static void StaticConstructor(const FObjectInitializer& ObjectInitializer);

public:
    PUERTS_NAMESPACE::FPapiValueRef Constructor;

    PUERTS_NAMESPACE::FPapiValueRef Prototype;

    TWeakPtr<PUERTS_NAMESPACE::IDynamicInvoker, ESPMode::ThreadSafe> DynamicInvoker;
};

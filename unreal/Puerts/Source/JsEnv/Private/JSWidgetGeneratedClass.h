/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "NamespaceDef.h"

PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS
#pragma warning(push, 0)
#include "libplatform/libplatform.h"
#include "v8.h"
#pragma warning(pop)
PRAGMA_ENABLE_UNDEFINED_IDENTIFIER_WARNINGS

#include "DynamicInvoker.h"

#include "CoreMinimal.h"
#include "Blueprint/WidgetBlueprintGeneratedClass.h"
#include "JSWidgetGeneratedClass.generated.h"

/**
 *
 */
UCLASS()
class UJSWidgetGeneratedClass : public UWidgetBlueprintGeneratedClass
{
    GENERATED_BODY()

public:
    void InitPropertiesFromCustomList(uint8* DataPtr, const uint8* DefaultDataPtr) override;

    static void StaticConstructor(const FObjectInitializer& ObjectInitializer);

    void Release();

public:
    v8::UniquePersistent<v8::Function> Constructor;

    v8::UniquePersistent<v8::Object> Prototype;

    TWeakPtr<PUERTS_NAMESPACE::IDynamicInvoker, ESPMode::ThreadSafe> DynamicInvoker;

#ifdef THREAD_SAFE
    v8::Isolate* Isolate;
#endif
};

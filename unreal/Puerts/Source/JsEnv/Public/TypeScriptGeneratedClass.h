/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "TsDynamicInvoker.h"

#include "CoreMinimal.h"
#include "Engine/BlueprintGeneratedClass.h"
#include "TypeScriptGeneratedClass.generated.h"

/**
 *
 */
UCLASS()
class JSENV_API UTypeScriptGeneratedClass : public UBlueprintGeneratedClass
{
    GENERATED_BODY()

public:
    TWeakPtr<puerts::ITsDynamicInvoker> DynamicInvoker;

    TSet<FName> FunctionToRedirect;

    static void StaticConstructor(const FObjectInitializer& ObjectInitializer);

    void ObjectInitialize(const FObjectInitializer& ObjectInitializer);

    virtual void Bind() override;

    void RedirectToTypeScript(UFunction* InFunction);

    void RedirectToTypeScriptFinish();

    void CancelRedirection();

    bool NotSupportInject();

    UPROPERTY()
    bool HasConstructor;

    DECLARE_FUNCTION(execCallJS);
};

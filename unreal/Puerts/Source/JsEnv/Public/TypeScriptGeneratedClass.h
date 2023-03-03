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
#include "Templates/Function.h"
#include "Templates/SharedPointer.h"
#include "TypeScriptGeneratedClass.generated.h"

struct PendingConstructJobInfo
{
    TFunction<void()> Func = nullptr;
    TSharedPtr<int> Ref = nullptr;
};

/**
 *
 */
UCLASS()
class JSENV_API UTypeScriptGeneratedClass : public UBlueprintGeneratedClass
{
    GENERATED_BODY()

public:
    TWeakPtr<puerts::ITsDynamicInvoker, ESPMode::ThreadSafe> DynamicInvoker;

    TSet<FName> FunctionToRedirect;

    bool RedirectedToTypeScript = false;

    TMap<FName, FNativeFuncPtr> TempNativeFuncStorage;

#if WITH_EDITOR
    bool NeedReBind = true;
    TSet<TWeakObjectPtr<UObject>> GeneratedObjects;
    bool FunctionToRedirectInitialized = false;
    static void NotifyRebind(UClass* Class);
    void LazyLoadRedirect();
#endif

    DECLARE_FUNCTION(execLazyLoadCallJS);

    static void StaticConstructor(const FObjectInitializer& ObjectInitializer);

    void ObjectInitialize(const FObjectInitializer& ObjectInitializer);

    virtual void Bind() override;

    void RedirectToTypeScript(UFunction* InFunction);

    void RedirectToTypeScriptFinish();

    void CancelRedirection();

    bool NotSupportInject();

    void RestoreNativeFunc();

    UPROPERTY()
    bool HasConstructor;

    DECLARE_FUNCTION(execCallJS);
};

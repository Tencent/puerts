/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "ReactWidget.generated.h"

/**
 *
 */
UCLASS()
class REACTUMG_API UReactWidget : public UUserWidget
{
    GENERATED_BODY()

protected:
    UPanelSlot* RootSlot;

public:
    explicit UReactWidget(const FObjectInitializer& ObjectInitializer);

    UFUNCTION(BlueprintCallable, Category = "Scripting | Javascript")
    UPanelSlot* AddChild(UWidget* Content);

    UFUNCTION(BlueprintCallable, Category = "Scripting | Javascript")
    bool RemoveChild(UWidget* Content);
};

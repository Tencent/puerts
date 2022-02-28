/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "ReactWidget.h"
#include "Blueprint/WidgetTree.h"

UReactWidget::UReactWidget(const FObjectInitializer& ObjectInitializer) : Super(ObjectInitializer)
{
    WidgetTree = CreateDefaultSubobject<UWidgetTree>(TEXT("WidgetTree"));
    WidgetTree->SetFlags(RF_Transactional);
}

UPanelSlot* UReactWidget::AddChild(UWidget* Content)
{
    if (Content == nullptr)
    {
        return nullptr;
    }

    if (RootSlot)
    {
        return nullptr;
    }

    Content->RemoveFromParent();

    EObjectFlags NewObjectFlags = RF_Transactional;
    if (HasAnyFlags(RF_Transient))
    {
        NewObjectFlags |= RF_Transient;
    }

    UPanelSlot* PanelSlot = NewObject<UPanelSlot>(this, UPanelSlot::StaticClass(), NAME_None, NewObjectFlags);
    PanelSlot->Content = Content;

    Content->Slot = PanelSlot;

    RootSlot = PanelSlot;

    WidgetTree->RootWidget = Content;

    InvalidateLayoutAndVolatility();

    return PanelSlot;
}

bool UReactWidget::RemoveChild(UWidget* Content)
{
    if (Content == nullptr || RootSlot == nullptr || Content != RootSlot->Content)
    {
        return false;
    }
    UPanelSlot* PanelSlot = RootSlot;
    RootSlot = nullptr;

    if (PanelSlot->Content)
    {
        PanelSlot->Content->Slot = nullptr;
    }

    const bool bReleaseChildren = true;
    PanelSlot->ReleaseSlateResources(bReleaseChildren);
    PanelSlot->Parent = nullptr;
    PanelSlot->Content = nullptr;

    WidgetTree->RootWidget = nullptr;

    InvalidateLayoutAndVolatility();

    return true;
}

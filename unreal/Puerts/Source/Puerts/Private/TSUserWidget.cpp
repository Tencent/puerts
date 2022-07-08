// Fill out your copyright notice in the Description page of Project Settings.
#include "TSUserWidget.h"
#include "TSWidgetPrivate.h"


UTSUserWidget::UTSUserWidget(const FObjectInitializer& ObjectInitializer)
	: Super(ObjectInitializer)
{
	UMGTypeScript = nullptr;
}

void UTSUserWidget::NativePreConstruct()
{
	Super::NativePreConstruct();
}

void UTSUserWidget::NativeConstruct()
{
	Super::NativeConstruct();
	CreateTSScript();
}

void UTSUserWidget::NativeDestruct()
{
	Super::NativeDestruct();
}

void UTSUserWidget::NativeTick(const FGeometry& MyGeometry, float InDeltaTime)
{
	Super::NativeTick(MyGeometry, InDeltaTime);
}

void UTSUserWidget::CreateTSScript()
{
	if (TSClass)
	{
		UMGTypeScript = NewObject<UTSWidgetPrivate>(this, TSClass.Get());
		UMGTypeScript->SetupUI(this);
	}
}

void UTSUserWidget::PostEditChangeProperty(struct FPropertyChangedEvent& PropertyChangedEvent)
{
	if (TSClass != nullptr)
	{
		UMGTypeScript = NewObject<UTSWidgetPrivate>(this, TSClass.Get());
		UMGTypeScript->SetupUI(this);
	}
}


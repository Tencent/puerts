// Fill out your copyright notice in the Description page of Project Settings.

#pragma once

#include "CoreMinimal.h"
#include "Engine/GameInstance.h"

#include "JsEnv.h"

#include "PTSGameInstance.generated.h"

/**
 * 
 */
UCLASS(BlueprintType, Blueprintable)
class PUERTS_API UPTSGameInstance : public UGameInstance
{
	GENERATED_BODY()

public:
	UPTSGameInstance();
	/** virtual function to allow custom GameInstances an opportunity to set up what it needs */
	virtual void Init() override;
	/** virtual function to allow custom GameInstances an opportunity to do cleanup when shutting down */
	virtual void Shutdown() override;

	TSharedPtr<puerts::FJsEnv> JsEnv;
	
};

// Fill out your copyright notice in the Description page of Project Settings.

#pragma once

#include "CoreMinimal.h"
#include "Engine/Blueprint.h"
#include "TypeScriptBlueprint.generated.h"

/**
 * 
 */
UCLASS()
class JSENV_API UTypeScriptBlueprint : public UBlueprint
{
	GENERATED_BODY()
	
public:
#if WITH_EDITOR
    virtual UClass* GetBlueprintClass() const override;
#endif
};

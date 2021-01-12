// Fill out your copyright notice in the Description page of Project Settings.

#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "PuertsSetting.generated.h"

/**
 * 
 */
UCLASS(config = Puerts, defaultconfig, meta = (DisplayName = "Puerts"))
class UPuertsSetting : public UObject
{
	GENERATED_BODY()
public:
    UPROPERTY(config, EditAnywhere, Category = "Setting", meta = (DisplayName = "Puerts Module Enable", defaultValue = false))
    bool Enable = false;

    UPROPERTY(config, EditAnywhere, Category = "Setting", meta = (DisplayName = "Debug Enable", defaultValue = false))
    bool DebugEnable = false;

    UPROPERTY(config, EditAnywhere, Category = "Setting", meta = (DisplayName = "Debug Port", defaultValue = 8080))
    int32 DebugPort = 8080;

    UPROPERTY(config, EditAnywhere, Category = "Setting", meta = (DisplayName = "Wait Debugger", defaultValue = false))
    bool WaitDebugger = false;
};

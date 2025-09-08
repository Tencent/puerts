// Fill out your copyright notice in the Description page of Project Settings.

#pragma once

#include "IDirectoryWatcher.h"

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "PEDirectoryWatcher.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_ThreeParams(
    FDirectoryWatcherCallback, const TArray<FString>&, Added, const TArray<FString>&, Modified, const TArray<FString>&, Removed);

/**
 *
 */
UCLASS()
class PUERTSEDITOR_API UPEDirectoryWatcher : public UObject
{
    GENERATED_BODY()

public:
    FDelegateHandle DelegateHandle;

    UPROPERTY(BlueprintAssignable)
    FDirectoryWatcherCallback OnChanged;

    UFUNCTION(BlueprintCallable, Category = "File")
    bool Watch(const FString& InDirectory);

    UFUNCTION(BlueprintCallable, Category = "File")
    void UnWatch();

    UPEDirectoryWatcher();

    ~UPEDirectoryWatcher();

private:
    FString Directory;
};

/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#include "CoreMinimal.h"
#include "ExtensionMethods.h"
#include "ObjectExtension.generated.h"

/**
 * 
 */
UCLASS()
class UObjectExtension : public UExtensionMethods
{
	GENERATED_BODY()
	
    UFUNCTION(BlueprintCallable, Category = "ObjectExtension")
    static UObject* CreateDefaultSubobject(UObject *Object, FName SubobjectFName, UClass* ReturnType, 
        UClass* ClassToCreateByDefault, bool bIsRequired, bool bAbstract, bool bIsTransient);

    UFUNCTION(BlueprintCallable, Category = "ObjectExtension")
    static FString GetName(UObject *Object);

    UFUNCTION(BlueprintCallable, Category = "ObjectExtension")
    static bool IsValid(UObject *Object);

    UFUNCTION(BlueprintCallable, Category = "ObjectExtension")
    static UObject *GetOuter(UObject *Object);

    UFUNCTION(BlueprintCallable, Category = "ObjectExtension")
    static UClass *GetClass(UObject *Object);

    UFUNCTION(BlueprintCallable, Category = "ObjectExtension")
    static UWorld *GetWorld(UObject *Object);

};

/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "PEBlueprintAsset.generated.h"


USTRUCT(BlueprintType)
struct FPEGraphTerminalType
{
public:
    GENERATED_USTRUCT_BODY()

public:
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "PEBlueprintAsset")
    FName PinCategory;
     
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "PEBlueprintAsset")
    UObject* PinSubCategoryObject;
};

USTRUCT(BlueprintType)
struct FPEGraphPinType
{
public:
    GENERATED_USTRUCT_BODY()

public:
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "PEBlueprintAsset")
    FName PinCategory;
     
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "PEBlueprintAsset")
    UObject* PinSubCategoryObject;
    
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "PEBlueprintAsset")
    int PinContainerType;
        
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "PEBlueprintAsset")
    bool bIsReference;
};


/**
 * 
 */
UCLASS()
class PUERTSEDITOR_API UPEBlueprintAsset : public UObject
{
	GENERATED_BODY()
	
public:

    UPROPERTY(BlueprintReadOnly, Category = "PEBlueprintAsset")
    UClass* GeneratedClass;

    UPROPERTY(BlueprintReadOnly, Category = "PEBlueprintAsset")
    UBlueprint* Blueprint;

    UPROPERTY(BlueprintReadOnly, Category = "PEBlueprintAsset")
    UPackage* Package;

    UPROPERTY(BlueprintReadOnly, Category = "PEBlueprintAsset")
    bool NeedSave;

    UPROPERTY()
    bool HasConstructor;

    UFUNCTION(BlueprintCallable, Category = "PEBlueprintAsset")
    bool LoadOrCreate(const FString& InName, const FString& InPath, UClass* ParentClass, int32 InSetFlags, int32 InClearFlags);

    UFUNCTION(BlueprintCallable, Category = "PEBlueprintAsset")
    void AddParameter(FName InParameterName, FPEGraphPinType InGraphPinType, FPEGraphTerminalType InPinValueType);

    UFUNCTION(BlueprintCallable, Category = "PEBlueprintAsset")
    void ClearParameter();

    UFUNCTION(BlueprintCallable, Category = "PEBlueprintAsset")
    void AddFunction(FName InName, bool IsVoid, FPEGraphPinType InGraphPinType, FPEGraphTerminalType InPinValueType, int32 InSetFlags, int32 InClearFlags);

    UFUNCTION(BlueprintCallable, Category = "PEBlueprintAsset")
    void RemoveNotExistedFunction();

    UFUNCTION(BlueprintCallable, Category = "PEBlueprintAsset")
    void AddMemberVariable(FName NewVarName, FPEGraphPinType InGraphPinType, FPEGraphTerminalType InPinValueType, int32 InLFlags, int32 InHFlags, int32 InLifetimeCondition);

    UFUNCTION(BlueprintCallable, Category = "PEBlueprintAsset")
    void RemoveNotExistedMemberVariable();

    UFUNCTION(BlueprintCallable, Category = "PEBlueprintAsset")
    void Save();

private:
    TSet<FName> MemberVariableAdded;

    TSet<FName> FunctionAdded;

    TSet<FName> OverrideAdded;

    TArray<FName> ParameterNames;

    TArray<FEdGraphPinType> ParameterTypes;
};

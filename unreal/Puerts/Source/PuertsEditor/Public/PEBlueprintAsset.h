/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "CoreMinimal.h"

#include "K2Node_CustomEvent.h"
#include "PropertyMacros.h"
#include "UObject/NoExportTypes.h"
#include "PEBlueprintMetaData.h"
#include "PEBlueprintAsset.generated.h"

USTRUCT(BlueprintType)
struct FPEGraphTerminalType
{
    GENERATED_USTRUCT_BODY()
    FPEGraphTerminalType() : PinSubCategoryObject(nullptr)
    {
    }

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "PEBlueprintAsset")
    FName PinCategory;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "PEBlueprintAsset")
    UObject* PinSubCategoryObject;
};

USTRUCT(BlueprintType)
struct FPEGraphPinType
{
    GENERATED_USTRUCT_BODY()
    FPEGraphPinType() : PinSubCategoryObject(nullptr), PinContainerType(0), bIsReference(false), bIn(false)
    {
    }

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "PEBlueprintAsset")
    FName PinCategory;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "PEBlueprintAsset")
    UObject* PinSubCategoryObject;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "PEBlueprintAsset")
    int PinContainerType;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "PEBlueprintAsset")
    bool bIsReference;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "PEBlueprintAsset")
    bool bIn;
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

    // Record the variable's location in the .ts file.
    int32 VariableIndexInTS = 0;

    UFUNCTION(BlueprintCallable, Category = "PEBlueprintAsset")
    static bool Existed(const FString& InName, const FString& InPath);

    UFUNCTION(BlueprintCallable, Category = "PEBlueprintAsset")
    bool LoadOrCreate(const FString& InName, const FString& InPath, UClass* ParentClass, int32 InSetFlags, int32 InClearFlags);

    /**
     * @brief create the class with given meta data
     * @param InName
     * @param InPath
     * @param InParentClass
     * @param InSetFlags
     * @param InClearFlags
     * @param InMetaData
     * @return
     */
    UFUNCTION(BlueprintCallable, Category = "PEBlueprintAsset")
    bool LoadOrCreateWithMetaData(const FString& InName, const FString& InPath, UClass* InParentClass, int32 InSetFlags,
        int32 InClearFlags, UPEClassMetaData* InMetaData);

    UFUNCTION(BlueprintCallable, Category = "PEBlueprintAsset")
    void AddParameter(FName InParameterName, FPEGraphPinType InGraphPinType, FPEGraphTerminalType InPinValueType);

    /**
     * @brief add parameter with given meta data
     * @param InParameterName
     * @param InGraphPinType
     * @param InPinValueType
     * @param InMetaData
     */
    UFUNCTION(BlueprintCallable, Category = "PEBlueprintAsset")
    void AddParameterWithMetaData(
        FName InParameterName, FPEGraphPinType InGraphPinType, FPEGraphTerminalType InPinValueType, UPEParamMetaData* InMetaData);

    UFUNCTION(BlueprintCallable, Category = "PEBlueprintAsset")
    void ClearParameter();

    UFUNCTION(BlueprintCallable, Category = "PEBlueprintAsset")
    void AddFunction(FName InName, bool IsVoid, FPEGraphPinType InGraphPinType, FPEGraphTerminalType InPinValueType,
        int32 InSetFlags, int32 InClearFlags);

    /**
     * @brief create the function with given meta data
     * @param InName
     * @param IsVoid
     * @param InGraphPinType
     * @param InPinValueType
     * @param InSetFlags
     * @param InClearFlags
     * @param InMetaData
     */
    UFUNCTION(BlueprintCallable, Category = "PEBlueprintAsset")
    void AddFunctionWithMetaData(FName InName, bool IsVoid, FPEGraphPinType InGraphPinType, FPEGraphTerminalType InPinValueType,
        int32 InSetFlags, int32 InClearFlags, UPEFunctionMetaData* InMetaData);

    UFUNCTION(BlueprintCallable, Category = "PEBlueprintAsset")
    void RemoveNotExistedFunction();

    void RemoveComponent(FName ComponentName);

    void SetupAttachment(FName InComponentName, FName InParentComponentName);

    UFUNCTION(BlueprintCallable, Category = "PEBlueprintAsset")
    void SetupAttachments(TMap<FName, FName> InAttachments);

    UFUNCTION(BlueprintCallable, Category = "PEBlueprintAsset")
    void AddMemberVariable(FName NewVarName, FPEGraphPinType InGraphPinType, FPEGraphTerminalType InPinValueType, int32 InLFlags,
        int32 InHFlags, int32 InLifetimeCondition);

    /**
     * @brief create the property with given meta data
     * @param InNewVarName
     * @param InGraphPinType
     * @param InPinValueType
     * @param InLFlags
     * @param InHFLags
     * @param InLifetimeCondition
     * @param InMetaData
     */
    UFUNCTION(BlueprintCallable, Category = "PEBlueprintAsset")
    void AddMemberVariableWithMetaData(FName InNewVarName, FPEGraphPinType InGraphPinType, FPEGraphTerminalType InPinValueType,
        int32 InLFlags, int32 InHFLags, int32 InLifetimeCondition, UPEPropertyMetaData* InMetaData);

    UFUNCTION(BlueprintCallable, Category = "PEBlueprintAsset")
    void RemoveNotExistedMemberVariable();

    UFUNCTION(BlueprintCallable, Category = "PEBlueprintAsset")
    void RemoveNotExistedComponent();

    UFUNCTION(BlueprintCallable, Category = "PEBlueprintAsset")
    void Save();

private:
    TSet<FName> ComponentsAdded;

    TSet<FName> MemberVariableAdded;

    TSet<FName> FunctionAdded;

    TSet<FName> OverrideAdded;

    TArray<FName> ParameterNames;

    TArray<FEdGraphPinType> ParameterTypes;

    TArray<bool> ParameterIsIn;
};

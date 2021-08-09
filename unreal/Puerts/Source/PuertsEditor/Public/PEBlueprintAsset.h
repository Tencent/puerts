/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#include "CoreMinimal.h"

#include "K2Node_CustomEvent.h"
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
 * @brief the utility function collection for meta data
 */
struct FPEMetaDataUtils
{

	/**
	 * @brief validate the format of specific meta data
	 * @param InField
	 * @param InKey
	 * @param InValue
	 * @param OutMessage
	 * @return
	 */
	static bool ValidateFormat(FFieldVariant InField, FName InKey, const FString& InValue, FString& OutMessage);

	/**
	 * @brief add specific meta data to ufield
	 * @param InField
	 * @param InMetaData
	 */
	static void AddMetaData(UField* InField, TMap<FName, FString>& InMetaData);
};

/**
 * @brief a helper structure used to store the meta data of a class, @see ClassDeclarationMetaData.h/cpp
 *		currently, we don't need remove methods, also the caller should ensure the internal data consistence
 *		e.g. the show category added should never be added in hide categories...
 */
UCLASS()
class PUERTSEDITOR_API UPEClassMetaData : public UObject
{
	GENERATED_BODY()

public:

	/**
	 * @brief set the class flags, ant notify if placeable specifier is set
	 * @param InFlags
	 * @param bInPlaceable
	 */
	UFUNCTION()
	void SetClassFlags(int32 InFlags, bool bInPlaceable);

	/**
	 * @brief set the specific meta data
	 * @param InName
	 * @param InValue
	 */
	UFUNCTION()
	void SetMetaData(const FString& InName, const FString& InValue);

	/**
	 * @brief set the class should be with in
	 * @param InClassName
	 */
	UFUNCTION()
	void SetClassWithIn(const FString& InClassName);

	/**
	 * @brief set the configuration name
	 * @param InConfigName
	 */
	UFUNCTION()
	void SetConfig(const FString& InConfigName);

	/**
	 * @brief add a category to hide in blueprint
	 * @param InCategory
	 */
	UFUNCTION()
	void AddHideCategory(const FString& InCategory);

	/**
	 * @brief add a category to show in blueprint
	 * @param InCategory
	 */
	UFUNCTION()
	void AddShowCategory(const FString& InCategory);

	/**
	 * @brief add a sub category to show in blueprint
	 * @param InCategory
	 */
	UFUNCTION()
	void AddShowSubCategory(const FString& InCategory);

	/**
	 * @brief add a function to hide in blueprint
	 * @param InFunctionName
	 */
	UFUNCTION()
	void AddHideFunction(const FString& InFunctionName);

	/**
	 * @brief add a function to show in blueprint
	 * @param InFunctionName
	 */
	UFUNCTION()
	void AddShowFunction(const FString& InFunctionName);

	/**
	 * @brief add a category to auto expand in blueprint
	 * @param InCategory
	 */
	UFUNCTION()
	void AddAutoExpandCategory(const FString& InCategory);

	/**
	 * @brief add a category to auto collapse in blueprint
	 * @param InCategory
	 */
	UFUNCTION()
	void AddAutoCollapseCategory(const FString& InCategory);

	/**
	 * @brief forbid a category to auto collapse in blueprint
	 * @param InCategory
	 */
	UFUNCTION()
	void AddDontAutoCollapseCategory(const FString& InCategory);

	/**
	 * @brief add a class group
	 * @param InGroupName
	 */
	UFUNCTION()
	void AddClassGroup(const FString& InGroupName);

	/**
	 * @brief add a sparse data type
	 * @param InType
	 */
	UFUNCTION()
	void AddSparseDataType(const FString& InType);

public:

	/**
	 * @brief apply the meta data to specific class, this should only call at most once
	 *		since this function will change the internal status of the meta data
	 * @param InClass
	 */
	void Apply(UClass* InClass);
private:
	/**
	 * @brief the helper function used to get the value array like meta data from the given class
	 * @param InClass
	 * @param InMetaDataKey
	 * @param InDelimiter
	 * @param bInCullEmpty
	 * @return
	 */
	static TArray<FString> GetClassMetaDataValues(UClass* InClass, const TCHAR* InMetaDataKey, const TCHAR* InDelimiter = TEXT(" "), bool bInCullEmpty = true);

private:

	/**
	* @brief Merges all category properties with the class which at this point only has its parent propagated categories
	* @param InClass
	*/
	void MergeClassCategories(UClass* InClass);

	/**
	* @brief Merge and validate the class flags, the input class is the class to set meta data
	* @param InClass
	*/
	void MergeAndValidateClassFlags(UClass* InClass);

	/**
	 * @brief set the class meta data
	 * @param InClass
	 */
	void SetClassMetaData(UClass* InClass);

	/**
	 * @brief set and check with class
	 * @param InClass
	 */
	void SetAndValidateWithinClass(UClass* InClass);

	/**
	 * @brief set and check the config name
	 * @param InClass
	 */
	void SetAndValidateConfigName(UClass* InClass);

public:

	/**
	 * @brief the class flags
	 */
	EClassFlags ClassFlags = CLASS_None;

	/**
	 * @brief the meta data
	 */
	TMap<FName, FString> MetaData;

	/**
	 * @brief the class with in
	 */
	FString ClassWithIn;

	/**
	 * @brief the config name, from where the class to read config variables' value
	 */
	FString ConfigName;

	/**
	 * @brief the hide categories in blueprint
	 */
	TArray<FString> HideCategories;

	/**
	 * @brief the show categories in blueprint
	 */
	TArray<FString> ShowCategories;

	/**
	 * @brief the show sub categories in blueprint
	 */
	TArray<FString> ShowSubCategories;

	/**
	 * @brief the hide functions in blueprint
	 */
	TArray<FString> HideFunctions;

	/**
	 * @brief the show functions in blueprint
	 */
	TArray<FString> ShowFunctions;

	/**
	 * @brief the auto expand categories in blueprint
	 */
	TArray<FString> AutoExpandCategories;

	/**
	 * @brief the auto collapse categories in blueprint
	 */
	TArray<FString> AutoCollapseCategories;

	/**
	 * @brief the categories will not auto collapse in blueprint
	 */
	TArray<FString> DontAutoCollapseCategories;

	/**
	 * @brief the class group names
	 */
	TArray<FString> ClassGroupNames;

	/**
	 * @brief the sparse class data types
	 */
	TArray<FString> SparseClassDataTypes;

	/**
	 * @brief a boolean indicate if wants to be placeable
	 */
	bool bWantsToBePlaceable = false;
private:

	/**
	 * @brief the name of cached category in meta data
	 */
	static const TCHAR* NAME_ClassGroupNames;
	static const TCHAR* NAME_HideCategories;
	static const TCHAR* NAME_ShowCategories;
	static const TCHAR* NAME_SparseClassDataTypes;
	static const TCHAR* NAME_HideFunctions;
	static const TCHAR* NAME_AutoExpandCategories;
	static const TCHAR* NAME_AutoCollapseCategories;
};

/**
 * @brief a helper structure used to store the meta data of a function, @see ParseHelper.h
 */
UCLASS()
class PUERTSEDITOR_API UPEFunctionMetaData : public UObject
{
	GENERATED_BODY()

private:
	friend class UPEBlueprintAsset;
public:

	/**
	 * @brief set the function flags, since this will called from js, so divide into high and low parts
	 * @param InHighBits
	 * @param InLowBits
	 */
	UFUNCTION()
	void SetFunctionFlags(int32 InHighBits, int32 InLowBits);

	/**
	 * @brief set the function export flags
	 * @param InFlags
	 */
	UFUNCTION()
	void SetFunctionExportFlags(int32 InFlags);

	/**
	* @brief set the specific meta data
	* @param InName
	* @param InValue
	*/
	UFUNCTION()
	void SetMetaData(const FString& InName, const FString& InValue);

	/**
	 * @brief set the cpp implementation function, is this meaningful for blueprint function?
	 * @param InName
	 */
	UFUNCTION()
	void SetCppImplName(const FString& InName);

	/**
	 * @brief set the cpp implementation validation function
	 * @param InName
	 */
	UFUNCTION()
	void SetCppValidationImplName(const FString& InName);

	/**
	 * @brief set the end point name,
	 * @param InEndpointName
	 */
	UFUNCTION()
	void SetEndpointName(const FString& InEndpointName);

	/**
	 * @brief set the rpc id
	 * @param InRPCId
	 */
	UFUNCTION()
	void SetRPCId(int32 InRPCId);

	/**
	 * @brief set the rpc response id
	 * @param InRPCResponseId
	 */
	UFUNCTION()
	void SetRPCResponseId(int32 InRPCResponseId);

	/**
	 * @brief set if the function is sealed event
	 * @param bInSealedEvent
	 */
	UFUNCTION()
	void SetIsSealedEvent(bool bInSealedEvent);

	/**
	 * @brief set if the function is force blueprint impure
	 * @param bInForceBlueprintImpure
	 */
	UFUNCTION()
	void SetForceBlueprintImpure(bool bInForceBlueprintImpure);

public:

	/**
	 * @brief apply to a custom event
	 * @param InCustomEvent
	 */
	void Apply(UK2Node_CustomEvent* InCustomEvent) const;

	/**
	 * @brief apply to a normal function
	 * @param InFunctionEntry
	 */
	void Apply(UK2Node_FunctionEntry* InFunctionEntry) const;
public:

	/**
	 * @brief the function flags
	 */
	EFunctionFlags FunctionFlags = FUNC_None;

	/**
	 * @brief the function export flags
	 */
	int32 FunctionExportFlags = 0;

	/**
	 * @brief the meta data of the function
	 */
	TMap<FName, FString> MetaData;

	/**
	 * @brief the cpp implementation name, is this ok for blueprint function? or generated function could be a no-blueprint function ?
	 */
	FString CppImplName;

	/**
	 * @brief the cpp validation implementation name,
	 */
	FString CppValidationImplName;

	/**
	 * @brief endpoint name
	 */
	FString EndpointName;

	/**
	 * @brief identifier for an RPC call to a platform service
	 */
	uint16 RPCId = 0;

	/**
	 * @brief identifier for an RPC call expect a response
	 */
	uint16 RPCResponseId = 0;

	/**
	 * @brief whether this function represents a sealed event
	 */
	bool bSealedEvent = false;

	/**
	 * @brief true if the function is being forced to be considered as impure by the user
	 */
	bool bForceBlueprintImpure = false;
};


/**
 * @brief a helper structure used to store the meta data of a function parameter
 */
UCLASS()
class PUERTSEDITOR_API UPEParamMetaData : public UObject
{
	GENERATED_BODY()

private:
	friend class UPEBlueprintAsset;

public:

	/**
	 * @brief set the parameter's property flags
	 * @param InHighBits
	 * @param InLowBits
	 */
	UFUNCTION()
	void SetParamFlags(int32 InHighBits, int32 InLowBits);

	/**
	 * @brief set specific meta data
	 * @param InName
	 * @param InValue
	 */
	UFUNCTION()
	void SetMetaData(const FString& InName, const FString& InValue);

public:

	/**
	 * @brief apply to pin type
	 * @param PinType
	 */
	void Apply(FEdGraphPinType& PinType) const;

private:

	/**
	 * @brief the parameter's flags
	 */
	EPropertyFlags ParamFlags;

	/**
	 * @brief the meta data
	 */
	TMap<FName, FString> MetaData;
};

/**
 * @brief a helper function used to store the meta data of a class's member variable
 */
UCLASS()
class PUERTSEDITOR_API UPEPropertyMetaData : public UObject
{
	GENERATED_BODY()

private:
	friend class UPEBlueprintAsset;
public:

	/**
	 * @brief set the property flags
	 * @param InHighBits
	 * @param InLowBits
	 */
	UFUNCTION()
	void SetPropertyFlags(int32 InHighBits, int32 InLowBits);

	/**
	 * @brief set the meta data of the property
	 * @param InName
	 * @param InValue
	 */
	UFUNCTION()
	void SetMetaData(const FString& InName, const FString& InValue);

	/**
	 * @brief set the rep callback name
	 * @param InName
	 */
	UFUNCTION()
	void SetRepCallbackName(const FString& InName);

public:
	/**
	 * @brief apply the meta data to the property
	 * @param Element
	 */
	void Apply(FBPVariableDescription& Element) const;
private:

	/**
	 * @brief the property's flags
	 */
	EPropertyFlags PropertyFlags;

	/**
	 * @brief the function name for a replicated function
	 */
	FString RepCallbackName;

	/**
	 * @brief the meta data for the property
	 */
	TMap<FName, FString> MetaData;

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
	UFUNCTION(BlueprintCallable, Category="PEBlueprintAsset")
	bool LoadOrCreateWithMetaData(const FString& InName, const FString& InPath, UClass* InParentClass, int32 InSetFlags, int32 InClearFlags, UPEClassMetaData* InMetaData);

    UFUNCTION(BlueprintCallable, Category = "PEBlueprintAsset")
    void AddParameter(FName InParameterName, FPEGraphPinType InGraphPinType, FPEGraphTerminalType InPinValueType);

	/**
	 * @brief add parameter with given meta data
	 * @param InParameterName
	 * @param InGraphPinType
	 * @param InPinValueType
	 * @param InMetaData
	 */
	UFUNCTION(BlueprintCallable, Category="PEBlueprintAsset")
	void AddParameterWithMetaData(FName InParameterName, FPEGraphPinType InGraphPinType, FPEGraphTerminalType InPinValueType, UPEParamMetaData* InMetaData);

    UFUNCTION(BlueprintCallable, Category = "PEBlueprintAsset")
    void ClearParameter();

    UFUNCTION(BlueprintCallable, Category = "PEBlueprintAsset")
    void AddFunction(FName InName, bool IsVoid, FPEGraphPinType InGraphPinType, FPEGraphTerminalType InPinValueType, int32 InSetFlags, int32 InClearFlags);

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
	UFUNCTION(BlueprintCallable, Category="PEBlueprintAsset")
	void AddFunctionWithMetaData(FName InName, bool IsVoid, FPEGraphPinType InGraphPinType, FPEGraphTerminalType InPinValueType, int32 InSetFlags, int32 InClearFlags, UPEFunctionMetaData* InMetaData);

    UFUNCTION(BlueprintCallable, Category = "PEBlueprintAsset")
    void RemoveNotExistedFunction();

    UFUNCTION(BlueprintCallable, Category = "PEBlueprintAsset")
    void AddMemberVariable(FName NewVarName, FPEGraphPinType InGraphPinType, FPEGraphTerminalType InPinValueType, int32 InLFlags, int32 InHFlags, int32 InLifetimeCondition);

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
	UFUNCTION(BlueprintCallable, Category=  "PEBlueprintAsset")
	void AddMemberVariableWithMetaData(FName InNewVarName, FPEGraphPinType InGraphPinType, FPEGraphTerminalType InPinValueType, int32 InLFlags,  int32 InHFLags, int32 InLifetimeCondition, UPEPropertyMetaData* InMetaData);

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

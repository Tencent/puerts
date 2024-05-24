/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "PropertyMacros.h"
#include "Math/UnitConversion.h"
#include "K2Node_CustomEvent.h"
#include "K2Node_FunctionEntry.h"
#include "Engine/Blueprint.h"

#include "PEBlueprintMetaData.generated.h"

/**
 * @brief since the void_t defined in converter.hpp will introduce v8
 *		define a temporary void_t here
 */
template <class...>
using Void_t = void;

/**
 * @brief the utility function collection for meta data
 */
struct FPEMetaDataUtils
{
    /**
     * temporary check if a type is defined
     */
    template <typename T, typename = void>
    struct TFormatValidator
    {
        /**
         * @brief fallback
         * @param ...
         * @return
         */
        template <typename... Args>
        bool operator()(Args&&...) const
        {
            //	if the field variant is not exist, currently don't do further check
            UE_LOG(LogTemp, VeryVerbose, TEXT("FFieldVarient is not implemented in current engine"));
            return true;
        }
    };

    /**
     * @brief if the field variant is defined, we do the check
     * @tparam T
     */
    template <typename T>
    struct TFormatValidator<T, typename std::enable_if<(sizeof(T) > 0)>::type>
    {
        /**
         * @brief real check
         * @param InField
         * @param InKey
         * @param InValue
         * @param OutMessage
         * @return
         */
        bool operator()(T InField, FName InKey, const FString& InValue, FString& OutMessage) const
        {
            //	name pre define
            static const FName NAME_BlueprintProtected = TEXT("BlueprintProtected");
            static const FName NAME_ClampMax = TEXT("ClampMax");
            static const FName NAME_ClampMin = TEXT("ClampMin");
            static const FName NAME_CommutativeAssociativeBinaryOperator = TEXT("CommutativeAssociativeBinaryOperator");
            static const FName NAME_DevelopmentStatus = TEXT("DevelopmentStatus");
            static const FName NAME_DocumentationPolicy = TEXT("DocumentationPolicy");
            static const FName NAME_ExpandBoolAsExecs = TEXT("ExpandBoolAsExecs");
            static const FName NAME_ExpandEnumAsExecs = TEXT("ExpandEnumAsExecs");
            static const FName NAME_UIMax = TEXT("UIMax");
            static const FName NAME_UIMin = TEXT("UIMin");
            static const FName NAME_Units = TEXT("Units");

            //	a helper function used to check a function is well defined blueprint protected
            static const auto ValidateFunctionBlueprintProtected = [](UFunction* InFunction)
            {
                if (!IsValid(InFunction))
                {
                    return false;
                }

                if (InFunction->HasAnyFunctionFlags(FUNC_Static))
                {
                    // Determine if it's a function library
                    UClass* Class = InFunction->GetOuterUClass();
                    while (Class != nullptr && Class->GetSuperClass() != UObject::StaticClass())
                    {
                        Class = Class->GetSuperClass();
                    }

                    if (Class != nullptr && Class->GetName() == TEXT("BlueprintFunctionLibrary"))
                    {
                        return false;
                    }
                }
                return true;
            };

            //	a helper function used to check a function is well defined binary operator
            static const auto ValidateFunctionCommutativeAssociativeBinaryOperator = [](UFunction* InFunction)
            {
                if (!IsValid(InFunction))
                {
                    return false;
                }

                bool bGoodParams = (InFunction->NumParms == 3);
                if (bGoodParams)
                {
                    PropertyMacro* FirstParam = nullptr;
                    PropertyMacro* SecondParam = nullptr;
                    PropertyMacro* ReturnValue = nullptr;

                    TFieldIterator<PropertyMacro> It(InFunction);

                    auto GetNextParam = [&]()
                    {
                        if (It)
                        {
                            if (It->HasAnyPropertyFlags(CPF_ReturnParm))
                            {
                                ReturnValue = *It;
                            }
                            else
                            {
                                if (FirstParam == nullptr)
                                {
                                    FirstParam = *It;
                                }
                                else if (SecondParam == nullptr)
                                {
                                    SecondParam = *It;
                                }
                            }
                            ++It;
                        }
                    };

                    GetNextParam();
                    GetNextParam();
                    GetNextParam();
                    ensure(!It);

                    if (ReturnValue == nullptr || SecondParam == nullptr || !SecondParam->SameType(FirstParam))
                    {
                        bGoodParams = false;
                    }
                }

                return bGoodParams;
            };

            //	a helper function sued to check a function is well defined as execs
            static const auto ValidateFunctionExpandAsExecs = [](UFunction* InFunction, const FString& InValue)
            {
                if (!IsValid(InFunction))
                {
                    return false;
                }

                // multiple entry parsing in the same format as eg SetParam.
                TArray<FString> RawGroupings;
                InValue.ParseIntoArray(RawGroupings, TEXT(","), false);

                PropertyMacro* FirstInput = nullptr;
                for (const FString& RawGroup : RawGroupings)
                {
                    TArray<FString> IndividualEntries;
                    RawGroup.ParseIntoArray(IndividualEntries, TEXT("|"));

                    for (const FString& Entry : IndividualEntries)
                    {
                        if (Entry.IsEmpty())
                        {
                            continue;
                        }
                        auto FoundField = FindUFieldOrFProperty(InFunction, *Entry);
                        if (!FoundField)
                        {
                            return false;
                        }

                        if (PropertyMacro* Prop = FoundField.Get<PropertyMacro>())
                        {
                            if (!Prop->HasAnyPropertyFlags(CPF_ReturnParm) &&

                                (!Prop->HasAnyPropertyFlags(CPF_OutParm) || Prop->HasAnyPropertyFlags(CPF_ReferenceParm)))
                            {
                                if (!FirstInput)
                                {
                                    FirstInput = Prop;
                                }
                                else
                                {
                                    return false;
                                }
                            }
                        }
                    }
                }
                return true;
            };

            //	function body
            //	check numeric keys
            if (InKey == NAME_UIMin || InKey == NAME_UIMax || InKey == NAME_ClampMin || InKey == NAME_ClampMax)
            {
                if (!InValue.IsNumeric())
                {
                    OutMessage =
                        FString::Printf(TEXT("Metadata value for '%s' is non-numeric : '%s'"), *InKey.ToString(), *InValue);
                    return false;
                }
                return true;
            }

            //	check blueprint protected function
            if (InKey == NAME_BlueprintProtected)
            {
                if (!ValidateFunctionBlueprintProtected(InField.template Get<UFunction>()))
                {
                    OutMessage =
                        FString::Printf(TEXT("%s doesn't make sense on static method '%s' in a blueprint function library"),
                            *InKey.ToString(), *InField.GetFullName());
                    return false;
                }
                return true;
            }

            //	check binary operator function
            if (InKey == NAME_CommutativeAssociativeBinaryOperator)
            {
                if (!ValidateFunctionCommutativeAssociativeBinaryOperator(InField.template Get<UFunction>()))
                {
                    OutMessage = TEXT(
                        "Commutative asssociative binary operators must have exactly 2 parameters of the same type and a return "
                        "value.");
                    return false;
                }

                return true;
            }

            //	check expand as execs
            if (InKey == NAME_ExpandBoolAsExecs || InKey == NAME_ExpandEnumAsExecs)
            {
                if (!ValidateFunctionExpandAsExecs(InField.template Get<UFunction>(), InValue))
                {
                    OutMessage = TEXT("invalid meta data for expand as execs");
                    return false;
                }
                return true;
            }

            //	check development status
            if (InKey == NAME_DevelopmentStatus)
            {
                const FString EarlyAccessValue(TEXT("EarlyAccess"));
                const FString ExperimentalValue(TEXT("Experimental"));
                if ((InValue != EarlyAccessValue) && (InValue != ExperimentalValue))
                {
                    OutMessage = FString::Printf(TEXT("'%s' metadata was '%s' but it must be %s or %s"), *InKey.ToString(),
                        *InValue, *ExperimentalValue, *EarlyAccessValue);
                    return false;
                }
                return true;
            }

            //	check units
            if (InKey == NAME_Units)
            {
                // Check for numeric property
                auto* MaybeProperty = InField.template Get<NumericPropertyMacro>();
                if (MaybeProperty == nullptr && !MaybeProperty->template IsA<StructPropertyMacro>())
                {
                    OutMessage = TEXT("'Units' meta data can only be applied to numeric and struct properties");
                    return false;
                }

                if (!FUnitConversion::UnitFromString(*InValue))
                {
                    OutMessage = FString::Printf(
                        TEXT("Unrecognized units (%s) specified for property '%s'"), *InValue, *InField.GetFullName());
                    return false;
                }
                return true;
            }

            //	check documentation policy
            if (InKey == NAME_DocumentationPolicy)
            {
                const TCHAR* StrictValue = TEXT("Strict");
                if (InValue != StrictValue)
                {
                    OutMessage =
                        FString::Printf(TEXT("'%s' metadata was '%s' but it must be %s"), *InKey.ToString(), *InValue, StrictValue);
                    return false;
                }
                return true;
            }
            return true;
        }
    };

    /**
     * @brief the format validate
     */
    static TFormatValidator<class FFieldVariant> ValidateFormat;

    /**
     * @brief add specific meta data to ufield
     * @param InField
     * @param InMetaData
     * @return
     */
    static bool AddMetaData(UField* InField, TMap<FName, FString>& InMetaData);
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
     * @param InBlueprint
     * @return
     */
    bool Apply(UClass* InClass, UBlueprint* InBlueprint);

private:
    /**
     * @brief the helper function used to get the value array like meta data from the given class
     * @param InClass
     * @param InMetaDataKey
     * @param InDelimiter
     * @param bInCullEmpty
     * @return
     */
    static TArray<FString> GetClassMetaDataValues(
        UClass* InClass, const TCHAR* InMetaDataKey, const TCHAR* InDelimiter = TEXT(" "), bool bInCullEmpty = true);

    /**
     * @brief since blueprint compilation will reset class meta data, so make blueprint sync with class
     * @param InClass
     * @param InBlueprint
     */
    bool SyncClassToBlueprint(UClass* InClass, UBlueprint* InBlueprint);

private:
    /**
     * @brief Merges all category properties with the class which at this point only has its parent propagated categories
     * @param InClass
     */
    void MergeClassCategories(UClass* InClass);

    /**
     * @brief Merge and validate the class flags, the input class is the class to set meta data
     * @param InClass
     * @return if the class flags is changed
     */
    bool MergeAndValidateClassFlags(UClass* InClass);

    /**
     * @brief set the class meta data
     * @param InClass
     * @return
     */
    bool SetClassMetaData(UClass* InClass);

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
    bool Apply(UK2Node_CustomEvent* InCustomEvent) const;

    /**
     * @brief apply to a normal function
     * @param InFunctionEntry
     */
    bool Apply(UK2Node_FunctionEntry* InFunctionEntry) const;

private:
    /**
     * @brief
     *		fallback if the custom event not support the user defined meta data
     * @param bOutChanged
     * @param ...
     */
    template <typename... Args>
    static void ApplyCustomEventMetaData(bool& bOutChanged, Args&&...)
    {
        bOutChanged = false;
    };

    /**
     * @brief add user defined meta data for custom event
     * @tparam CustomEvent
     * @param bOutChanged
     * @param InMetaData
     * @param InCustomEvent
     * @return
     */
    template <typename CustomEvent>
    static auto ApplyCustomEventMetaData(bool& bOutChanged, const TMap<FName, FString>& InMetaData, CustomEvent* InCustomEvent) ->
        typename std::enable_if<true, Void_t<decltype(std::declval<CustomEvent>().GetUserDefinedMetaData())>>::type
    {
        check(IsValid(InCustomEvent));

        //	a helper function used to update text value, and return if the value is updated by a new value
        static const auto UpdateTextMetaData = [](FName InKey, const TMap<FName, FString>& InMetaData, FText& InOutValue) -> bool
        {
            const FText NewValue = InMetaData.Contains(InKey) ? FText::FromString(InMetaData[InKey]) : FText{};
            const bool bChanged = !NewValue.EqualTo(InOutValue);
            InOutValue = NewValue;
            return bChanged;
        };
        //	a helper function used to update boolean value, and return if the value is updated by the new value
        static const auto UpdateBooleanMetaData = [](FName InKey, const TMap<FName, FString>& InMetaData, bool& InOutValue) -> bool
        {
            const bool NewValue = InMetaData.Contains(InKey) ? true : false;
            const bool bChanged = NewValue != InOutValue;
            InOutValue = NewValue;
            return bChanged;
        };
        //	a helper function sued update string value, return return if the value is updated by the new value
        static const auto UpdateStringMetaData = [](FName InKey, const TMap<FName, FString>& InMetaData,
                                                     FString& InOutValue) -> bool
        {
            const FString NewValue = InMetaData.Contains(InKey) ? InMetaData[InKey] : FString{};
            const bool bChanged = NewValue != InOutValue;
            InOutValue = NewValue;
            return bChanged;
        };

        bool bMetaDataChanged = false;
        auto& MetaDataToSet = InCustomEvent->GetUserDefinedMetaData();

        bMetaDataChanged = UpdateBooleanMetaData(TEXT("CallInEditor"), InMetaData, MetaDataToSet.bCallInEditor) || bMetaDataChanged;
        bMetaDataChanged = UpdateTextMetaData(TEXT("Category"), InMetaData, MetaDataToSet.Category) || bMetaDataChanged;
        bMetaDataChanged = UpdateTextMetaData(TEXT("Keywords"), InMetaData, MetaDataToSet.Keywords) || bMetaDataChanged;
        bMetaDataChanged =
            UpdateTextMetaData(TEXT("CompactNodeTitle"), InMetaData, MetaDataToSet.CompactNodeTitle) || bMetaDataChanged;
        bMetaDataChanged = UpdateTextMetaData(TEXT("ToolTip"), InMetaData, MetaDataToSet.ToolTip) || bMetaDataChanged;
        bMetaDataChanged =
            UpdateBooleanMetaData(TEXT("DeprecatedFunction"), InMetaData, MetaDataToSet.bIsDeprecated) || bMetaDataChanged;
        bMetaDataChanged =
            UpdateStringMetaData(TEXT("DeprecationMessage"), InMetaData, MetaDataToSet.DeprecationMessage) || bMetaDataChanged;

        bOutChanged = bMetaDataChanged;
    }

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
     * @brief the cpp implementation name, is this ok for blueprint function? or generated function could be a no-blueprint function
     * ?
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
     * @return
     */
    bool Apply(FEdGraphPinType& PinType) const;

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
    bool Apply(FBPVariableDescription& Element) const;

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

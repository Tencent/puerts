/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#include "CoreMinimal.h"

#include "K2Node_CustomEvent.h"
#include "PropertyMacros.h"
#include "UObject/NoExportTypes.h"
#include "PEBlueprintMetaData.h"
#include "PEBlueprintAsset.generated.h"


<<<<<<< HEAD
=======
/**
* @brief since the void_t defined in converter.hpp will introduce v8
*		define a temporary void_t here
*/
template<class ... >
using Void_t = void;
>>>>>>> f3877a4 ([unreal] 修复低版本ue的编译错误)


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
	 * temporary check if a type is defined
	 */
	template<typename T, typename = void>
	struct TFormatValidator
	{
		/**
		 * @brief fallback
		 * @param ...
		 * @return
		 */
		template<typename... Args>
		bool operator()(Args&&...) const
		{
			//	if the field variant is not exist, currently don't do further check
			UE_LOG(LogTemp, VeryVerbose, TEXT("FFieldVarient is not implemented in current engine"));
			return false;
		}
	};

	/**
	 * @brief if the field variant is defined, we do the check
	 * @tparam T
	 */
	template<typename T>
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
		bool operator()(FFieldVariant InField, FName InKey, const FString& InValue, FString& OutMessage) const
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

								(!Prop->HasAnyPropertyFlags(CPF_OutParm) ||
								Prop->HasAnyPropertyFlags(CPF_ReferenceParm)))
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
					OutMessage = FString::Printf(TEXT("Metadata value for '%s' is non-numeric : '%s'"), *InKey.ToString(), *InValue);
					return false;
				}
				return true;
			}

			//	check blueprint protected function
			if (InKey == NAME_BlueprintProtected)
			{
				if (!ValidateFunctionBlueprintProtected(InField.Get<UFunction>()))
				{
					OutMessage = FString::Printf(TEXT("%s doesn't make sense on static method '%s' in a blueprint function library"), *InKey.ToString(), *InField.GetFullName());
					return false;
				}
				return true;
			}

			//	check binary operator function
			if (InKey == NAME_CommutativeAssociativeBinaryOperator)
			{
				if (!ValidateFunctionCommutativeAssociativeBinaryOperator(InField.Get<UFunction>()))
				{
					OutMessage = TEXT("Commutative asssociative binary operators must have exactly 2 parameters of the same type and a return value.");
					return false;
				}

				return true;
			}

			//	check expand as execs
			if (InKey == NAME_ExpandBoolAsExecs || InKey == NAME_ExpandEnumAsExecs)
			{
				if (!ValidateFunctionExpandAsExecs(InField.Get<UFunction>(), InValue))
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
					OutMessage = FString::Printf(TEXT("'%s' metadata was '%s' but it must be %s or %s"), *InKey.ToString(), *InValue, *ExperimentalValue, *EarlyAccessValue);
					return false;
				}
				return true;
			}

			//	check units
			if (InKey == NAME_Units)
			{
				// Check for numeric property
				auto* MaybeProperty = InField.Get<NumericPropertyMacro>();
				if (MaybeProperty == nullptr && !MaybeProperty->IsA<StructPropertyMacro>())
				{
					OutMessage = TEXT("'Units' meta data can only be applied to numeric and struct properties");
					return false;
				}

				if (!FUnitConversion::UnitFromString(*InValue))
				{
					OutMessage = FString::Printf(TEXT("Unrecognized units (%s) specified for property '%s'"), *InValue, *InField.GetFullName());
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
					OutMessage = FString::Printf(TEXT("'%s' metadata was '%s' but it must be %s"), *InKey.ToString(), *InValue, StrictValue);
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
	 */
	static void AddMetaData(UField* InField, TMap<FName, FString>& InMetaData);
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

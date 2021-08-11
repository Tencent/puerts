/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include "PEBlueprintAsset.h"
#include "Modules/ModuleManager.h"
#include "KismetCompilerModule.h"
#include "Kismet2/KismetEditorUtilities.h"
#include "Kismet2/BlueprintEditorUtils.h"
#include "AssetToolsModule.h"
#include "AssetRegistryModule.h"
#include "FileHelpers.h"
#include "Misc/PackageName.h"
#include "UObject/MetaData.h"
#include "FunctionParametersDuplicate.h"
#include "CoreGlobals.h"
#include "K2Node_FunctionEntry.h"
#include "EdGraphSchema_K2_Actions.h"
#include "K2Node_Event.h"
#include "K2Node_CustomEvent.h"
#include "K2Node_FunctionResult.h"
#include "GameFramework/InputSettings.h"
#include "K2Node_InputAxisEvent.h"
#include "K2Node_InputAction.h"
#include "K2Node_CallFunction.h"
#include "ScopedTransaction.h"
#include "Kismet/KismetSystemLibrary.h"
#include "TypeScriptGeneratedClass.h"
#include "TypeScriptBlueprint.h"
#include "utility"

#define LOCTEXT_NAMESPACE "UPEBlueprintAsset"

UClass* FindClass(const TCHAR* ClassName)
{
    check(ClassName);

    UObject* ClassPackage = ANY_PACKAGE;

    if (UClass* Result = FindObject<UClass>(ClassPackage, ClassName))
        return Result;

    if (UObjectRedirector* RenamedClassRedirector = FindObject<UObjectRedirector>(ClassPackage, ClassName))
        return CastChecked<UClass>(RenamedClassRedirector->DestinationObject);

    return nullptr;
}

const TCHAR* UPEClassMetaData::NAME_HideCategories{TEXT("HideCategories")};
const TCHAR* UPEClassMetaData::NAME_ShowCategories{TEXT("ShowCategories")};
const TCHAR* UPEClassMetaData::NAME_HideFunctions{TEXT("HideFunctions")};
const TCHAR* UPEClassMetaData::NAME_AutoExpandCategories{TEXT("AutoExpandCategories")};
const TCHAR* UPEClassMetaData::NAME_AutoCollapseCategories{TEXT("AutoCollapseCategories")};
const TCHAR* UPEClassMetaData::NAME_ClassGroupNames{TEXT("ClassGroupNames")};
const TCHAR* UPEClassMetaData::NAME_SparseClassDataTypes{TEXT("SparseClassDataTypes")};

FPEMetaDataUtils::TFormatValidator<class FFieldVariant> FPEMetaDataUtils::ValidateFormat;

void FPEMetaDataUtils::AddMetaData(UField* InField, TMap<FName, FString>& InMetaData)
{
	// only add if we have some!
	if (InMetaData.Num())
	{
		check(InField);

		// get (or create) a metadata object for this package
		UMetaData* MetaData = InField->GetOutermost()->GetMetaData();
		TMap<FName, FString>* ExistingMetaData = MetaData->GetMapForObject(InField);
		if (ExistingMetaData && ExistingMetaData->Num())
		{
			// Merge the existing metadata
			TMap<FName, FString> MergedMetaData;
			MergedMetaData.Reserve(InMetaData.Num() + ExistingMetaData->Num());
			MergedMetaData.Append(*ExistingMetaData);
			MergedMetaData.Append(InMetaData);
			MetaData->SetObjectValues(InField, MoveTemp(MergedMetaData));
		}
		else
		{
			// set the metadata for this field
			MetaData->SetObjectValues(InField, MoveTemp(InMetaData));
		}
	}
}

void UPEClassMetaData::SetClassFlags(int32 InFlags, bool bInPlaceable)
{
	ClassFlags = static_cast<EClassFlags>(InFlags);
	bWantsToBePlaceable = bInPlaceable;
}

void UPEClassMetaData::SetMetaData(const FString& InName, const FString& InValue)
{
	MetaData.FindOrAdd(*InName) = InValue;
}

void UPEClassMetaData::SetClassWithIn(const FString& InClassName)
{
	ClassWithIn = InClassName;
}

void UPEClassMetaData::SetConfig(const FString& InConfigName)
{
	ConfigName = InConfigName;
}

void UPEClassMetaData::AddHideCategory(const FString& InCategory)
{
	HideCategories.AddUnique(InCategory);
}

void UPEClassMetaData::AddShowCategory(const FString& InCategory)
{
	ShowCategories.AddUnique(InCategory);
}

void UPEClassMetaData::AddShowSubCategory(const FString& InCategory)
{
	ShowSubCategories.AddUnique(InCategory);
}

void UPEClassMetaData::AddHideFunction(const FString& InFunctionName)
{
	HideFunctions.AddUnique(InFunctionName);
}

void UPEClassMetaData::AddShowFunction(const FString& InFunctionName)
{
	ShowFunctions.AddUnique(InFunctionName);
}

void UPEClassMetaData::AddAutoExpandCategory(const FString& InCategory)
{
	AutoExpandCategories.AddUnique(InCategory);
}

void UPEClassMetaData::AddAutoCollapseCategory(const FString& InCategory)
{
	AutoCollapseCategories.AddUnique(InCategory);
}

void UPEClassMetaData::AddDontAutoCollapseCategory(const FString& InCategory)
{
	DontAutoCollapseCategories.AddUnique(InCategory);
}

void UPEClassMetaData::AddClassGroup(const FString& InGroupName)
{
	ClassGroupNames.AddUnique(InGroupName);
}

void UPEClassMetaData::AddSparseDataType(const FString& InType)
{
	SparseClassDataTypes.AddUnique(InType);
}

void UPEClassMetaData::Apply(UClass* InClass)
{
	MergeClassCategories(InClass);
	MergeAndValidateClassFlags(InClass);
	SetClassMetaData(InClass);
}

void UPEClassMetaData::MergeClassCategories(UClass* InParentClass)
{
	if (!IsValid(InParentClass))
	{
		return;
	}

	TArray<FString> ParentHideCategories = GetClassMetaDataValues(InParentClass, NAME_HideCategories);
	TArray<FString> ParentShowCategories = GetClassMetaDataValues(InParentClass, NAME_ShowCategories);
	TArray<FString> ParentHideFunctions = GetClassMetaDataValues(InParentClass, NAME_HideFunctions);
	TArray<FString> ParentAutoExpandCategories = GetClassMetaDataValues(InParentClass, NAME_AutoExpandCategories);
	TArray<FString> ParentAutoCollapseCategories = GetClassMetaDataValues(InParentClass, NAME_AutoCollapseCategories);

	//	add parent categories
	HideCategories.Append(MoveTemp(ParentHideCategories));
	ShowSubCategories.Append(MoveTemp(ParentShowCategories));
	HideFunctions.Append(MoveTemp(ParentHideFunctions));

	//	for show categories
	for (const FString& Value : ShowCategories)
	{
		// if we didn't find this specific category path in the HideCategories metadata
		if (HideCategories.RemoveSwap(Value) != 0)
		{
			continue;
		}
		TArray<FString> SubCategoryList;
		Value.ParseIntoArray(SubCategoryList, TEXT("|"), true);

		FString SubCategoryPath;
		// look to see if any of the parent paths are excluded in the HideCategories list
		for (int32 CategoryPathIndex = 0; CategoryPathIndex < SubCategoryList.Num() - 1; ++CategoryPathIndex)
		{
			SubCategoryPath += SubCategoryList[CategoryPathIndex];
			// if we're hiding a parent category, then we need to flag this sub category for show
			if (HideCategories.Contains(SubCategoryPath))
			{
				ShowSubCategories.AddUnique(Value);
				break;
			}
			SubCategoryPath += "|";
		}

	}
	// Once the categories have been merged, empty the array as we will no longer need it nor should we use it
	ShowCategories.Empty();

	// Merge ShowFunctions and HideFunctions
	for (const FString& Value : ShowFunctions)
	{
		HideFunctions.RemoveSwap(Value);
	}
	ShowFunctions.Empty();

	// Merge DontAutoCollapseCategories and AutoCollapseCategories
	for (const FString& Value : DontAutoCollapseCategories)
	{
		AutoCollapseCategories.RemoveSwap(Value);
	}
	DontAutoCollapseCategories.Empty();

	// Merge ShowFunctions and HideFunctions
	for (const FString& Value : ShowFunctions)
	{
		HideFunctions.RemoveSwap(Value);
	}
	ShowFunctions.Empty();

	// Merge AutoExpandCategories and AutoCollapseCategories (we still want to keep AutoExpandCategories though!)
	for (const FString& Value : AutoExpandCategories)
	{
		AutoCollapseCategories.RemoveSwap(Value);
		ParentAutoCollapseCategories.RemoveSwap(Value);
	}

	// Do the same as above but the other way around
	for (const FString& Value : AutoCollapseCategories)
	{
		AutoExpandCategories.RemoveSwap(Value);
		ParentAutoExpandCategories.RemoveSwap(Value);
	}

	// Once AutoExpandCategories and AutoCollapseCategories for THIS class have been parsed, add the parent inherited categories
	AutoCollapseCategories.Append(MoveTemp(ParentAutoCollapseCategories));
	AutoExpandCategories.Append(MoveTemp(ParentAutoExpandCategories));

	//	add the categories to the meta data
	if (ClassGroupNames.Num() > 0)
	{
		MetaData.Add(NAME_ClassGroupNames, FString::Join(ClassGroupNames, TEXT(" ")));
	}
	if (AutoExpandCategories.Num() > 0)
	{
		MetaData.Add(NAME_AutoExpandCategories, FString::Join(AutoExpandCategories, TEXT(" ")));
	}
	if (HideCategories.Num() > 0)
	{
		MetaData.Add(NAME_HideCategories, FString::Join(HideCategories, TEXT(" ")));
	}
	if (ShowSubCategories.Num() > 0)
	{
		MetaData.Add(NAME_ShowCategories, FString::Join(ShowSubCategories, TEXT(" ")));
	}
	if (SparseClassDataTypes.Num() > 0)
	{
		MetaData.Add(NAME_SparseClassDataTypes, FString::Join(SparseClassDataTypes, TEXT(" ")));
	}
	if (AutoCollapseCategories.Num() > 0)
	{
		MetaData.Add(NAME_AutoCollapseCategories, FString::Join(AutoCollapseCategories, TEXT(" ")));
	}
}

void UPEClassMetaData::MergeAndValidateClassFlags(UClass* InClass)
{
	if (!IsValid(InClass))
	{
		return;
	}

	if (bWantsToBePlaceable)
	{
		if (!(InClass->ClassFlags & CLASS_NotPlaceable))
		{
			UE_LOG(LogTemp, Error, TEXT("The 'placeable' specifier is only allowed on classes which have a base class that's marked as not placeable. Classes are assumed to be placeable by default."));
			return;
		}
		InClass->ClassFlags &= ~CLASS_NotPlaceable;
		bWantsToBePlaceable = false;
	}

	InClass->ClassFlags |= ClassFlags;
	InClass->ClassConfigName = FName(*ConfigName);

	SetAndValidateWithinClass(InClass);
	SetAndValidateConfigName(InClass);

	if (!!(InClass->ClassFlags & CLASS_EditInlineNew) && InClass->IsChildOf(AActor::StaticClass()))
	{
		UE_LOG(LogTemp, Error, TEXT("Invalid class attribute: Creating actor instances via the property window is not allowed"));
		return;
	}

	if (InClass->HasAllClassFlags(CLASS_MinimalAPI | CLASS_RequiredAPI))
	{
		UE_LOG(LogTemp, Error, TEXT("MinimalAPI cannot be specified when the class is fully exported using a MODULENAME_API macro"));
	}
}

void UPEClassMetaData::SetClassMetaData(UClass* InClass)
{
	// Evaluate any key redirects on the passed in pairs
	for (TPair<FName, FString>& Pair : MetaData)
	{
		FName& CurrentKey = Pair.Key;
		FName NewKey = UMetaData::GetRemappedKeyName(CurrentKey);

		if (NewKey != NAME_None)
		{
			UE_LOG(LogTemp, Warning, TEXT("Remapping old metadata key '%s' to new key '%s', please update the declaration."), *CurrentKey.ToString(), *NewKey.ToString());
			CurrentKey = NewKey;
		}
	}

	// Finish validating and associate the metadata with the field
	for (const auto& Pair : MetaData)
	{
		FString Message;
		if (!FPEMetaDataUtils::ValidateFormat(InClass, Pair.Key, Pair.Value, Message))
		{
			UE_LOG(LogTemp, Error, TEXT("failed set meta data: %s"), *Message);
			return;
		}

	}

	FPEMetaDataUtils::AddMetaData(InClass, MetaData);
}

TArray<FString> UPEClassMetaData::GetClassMetaDataValues(UClass* InClass, const TCHAR* InMetaDataKey, const TCHAR* InDelimiter, bool bInCullEmpty)
{
	TArray<FString> Result;

	if (!IsValid(InClass))
	{
		return Result;
	}

	if (!InClass->HasMetaData(InMetaDataKey))
	{
		return Result;
	}

	InClass->GetMetaData(InMetaDataKey).ParseIntoArray(Result, InDelimiter, bInCullEmpty);
	return Result;
}

void UPEClassMetaData::SetAndValidateWithinClass(UClass* InClass)
{
	UClass* ExpectedWithinClass = InClass->GetSuperClass() ? InClass->GetSuperClass()->ClassWithin : UObject::StaticClass();
	if (ClassWithIn.IsEmpty() == false)
	{
		UClass* WithinClass = FindObject<UClass>(ANY_PACKAGE, *ClassWithIn);
		if (WithinClass == nullptr)
		{
			UE_LOG(LogTemp, Error, TEXT("the with in class of %s: %s is not found"), *InClass->GetName(), *ClassWithIn);
			return;
		}

		if (WithinClass->IsChildOf(UInterface::StaticClass()))
		{
			UE_LOG(LogTemp, Error, TEXT("the with in class of %s: %s should not be interface "), *InClass->GetName(), *ClassWithIn);
			return;
		}

		if (InClass->ClassWithin == nullptr || InClass->ClassWithin == UObject::StaticClass() || WithinClass->IsChildOf(InClass->ClassWithin))
		{
			InClass->ClassWithin = WithinClass;
		}

		if (InClass->ClassWithin != WithinClass)
		{
			UE_LOG(LogTemp, Error, TEXT("the with in class of %s: %s is set failed"), *InClass->GetName(), *ClassWithIn);
			return;
		}
	}
	else
	{
		InClass->ClassWithin = ExpectedWithinClass;
	}

	if (!InClass->ClassWithin->IsChildOf(ExpectedWithinClass))
	{
		UE_LOG(LogTemp, Error, TEXT("the parent class with in class %s is not consist the with in class of %s: %s"), *ExpectedWithinClass->GetName(), *InClass->GetName(), *InClass->ClassWithin->GetName());
	}
}

void UPEClassMetaData::SetAndValidateConfigName(UClass* InClass)
{
	if (ConfigName.IsEmpty() == false)
	{
		// if the user specified "inherit", we're just going to use the parent class's config filename
		// this is not actually necessary but it can be useful for explicitly communicating config-ness
		if (ConfigName == TEXT("inherit"))
		{
			UClass* SuperClass = InClass->GetSuperClass();
			if (!SuperClass)
			{
				UE_LOG(LogTemp, Error, TEXT("Cannot inherit config filename: %s has no super class"), *InClass->GetName());
				return;
			}

			if (SuperClass->ClassConfigName == NAME_None)
			{
				UE_LOG(LogTemp, Error, TEXT("Cannot inherit config filename: parent class %s is not marked config."), *SuperClass->GetPathName());
				return;
			}
		}
		else
		{
			// otherwise, set the config name to the parsed identifier
			InClass->ClassConfigName = FName(*ConfigName);
		}
	}
	else
	{
		// Invalidate config name if not specifically declared.
		InClass->ClassConfigName = NAME_None;
	}
}

void UPEFunctionMetaData::SetFunctionFlags(int32 InHighBits, int32 InLowBits)
{
	FunctionFlags = static_cast<EFunctionFlags>((static_cast<uint64>(static_cast<uint32>(InHighBits)) << 32) + static_cast<uint32>(InLowBits));
}

void UPEFunctionMetaData::SetFunctionExportFlags(int32 InFlags)
{
	FunctionExportFlags = InFlags;
}

void UPEFunctionMetaData::SetMetaData(const FString& InName, const FString& InValue)
{
	MetaData.FindOrAdd(*InName) = InValue;
}

void UPEFunctionMetaData::SetCppImplName(const FString& InName)
{
	CppImplName = InName;
}

void UPEFunctionMetaData::SetCppValidationImplName(const FString& InName)
{
	CppValidationImplName = InName;
}

void UPEFunctionMetaData::SetEndpointName(const FString& InEndpointName)
{
	EndpointName = InEndpointName;
}

void UPEFunctionMetaData::SetRPCId(int32 InRPCId)
{
	RPCId = static_cast<uint16>(InRPCId);
}

void UPEFunctionMetaData::SetRPCResponseId(int32 InRPCResponseId)
{
	RPCResponseId = InRPCResponseId;
}

void UPEFunctionMetaData::SetIsSealedEvent(bool bInSealedEvent)
{
	bSealedEvent = bInSealedEvent;
}

void UPEFunctionMetaData::SetForceBlueprintImpure(bool bInForceBlueprintImpure)
{
	bForceBlueprintImpure = bInForceBlueprintImpure;
}

void UPEFunctionMetaData::Apply(UK2Node_FunctionEntry* InFunctionEntry) const
{
	if (!IsValid(InFunctionEntry))
	{
		return;
	}

	// make sure native flags is removed
	InFunctionEntry->SetExtraFlags(InFunctionEntry->GetExtraFlags() | FunctionFlags);

	auto& MetaDataToSet = InFunctionEntry->MetaData;
	if (MetaData.Contains(TEXT("CallInEditor")))
	{
		MetaDataToSet.bCallInEditor = true;
	}

	if (MetaData.Contains(TEXT("Keywords")))
	{
		MetaDataToSet.Keywords = FText::FromString(MetaData[TEXT("Keywords")]);
	}
}

void UPEFunctionMetaData::ApplyCustomEventMetaData(const TMap<FName, FString>&, ...)
{
	UE_LOG(LogTemp, Log, TEXT("the user defined meta data is not supported in current engine"));
}

void UPEFunctionMetaData::Apply(UK2Node_CustomEvent* InCustomEvent) const
{
	if (!IsValid(InCustomEvent))
	{
		return;
	}

	//	the function flags
	InCustomEvent->FunctionFlags |= FunctionFlags;
	//	add meta data
	ApplyCustomEventMetaData(MetaData, InCustomEvent);
}


void UPEParamMetaData::SetParamFlags(int32 InHighBits, int32 InLowBits)
{
	ParamFlags = static_cast<EPropertyFlags>((static_cast<uint64>(static_cast<uint32>(InHighBits)) << 32) + static_cast<uint32>(InLowBits));
}

void UPEParamMetaData::SetMetaData(const FString& InName, const FString& InValue)
{
	MetaData.FindOrAdd(*InName) = InValue;
}

void UPEParamMetaData::Apply(FEdGraphPinType& PinType) const
{
	//	most meta data could not set in blueprint, should have a way to apply on related FProperty after blueprint compilation?
	PinType.bIsConst = !!(ParamFlags & CPF_ConstParm);
	PinType.bIsReference = !!(ParamFlags & CPF_ReferenceParm);
}

void UPEPropertyMetaData::SetPropertyFlags(int32 InHighBits, int32 InLowBits)
{
	PropertyFlags = static_cast<EPropertyFlags>((static_cast<uint64>(static_cast<uint32>(InHighBits)) << 32) + static_cast<uint32>(InLowBits));
}

void UPEPropertyMetaData::SetMetaData(const FString& InName, const FString& InValue)
{
	MetaData.FindOrAdd(*InName) = InValue;
}

void UPEPropertyMetaData::SetRepCallbackName(const FString& InName)
{
	RepCallbackName = InName;
}

void UPEPropertyMetaData::Apply(FBPVariableDescription& Element) const
{
	//	should do more check here?

	//	set flags, since the default create blueprint variable could not edit instance, so modify it if needed
	Element.PropertyFlags |= PropertyFlags;

	//	set meta data
	for (const auto Pair: MetaData)
	{
		if (auto MetaDataEntryPtr = Element.MetaDataArray.FindByPredicate([Key = Pair.Key](const FBPVariableMetaDataEntry& InEntry) {return InEntry.DataKey == Key;}))
		{
			MetaDataEntryPtr->DataValue = Pair.Value;
		}
		else
		{
			Element.MetaDataArray.Emplace(Pair.Key, Pair.Value);
		}
	}

	//	if needed set notify function, we don't check the existence of the notify function here
	if (PropertyFlags & CPF_RepNotify)
	{
		Element.RepNotifyFunc = RepCallbackName.IsEmpty() ? *FString::Printf(TEXT("OnRep_%s"), *Element.VarName.ToString()) : *RepCallbackName;
	}
}

bool UPEBlueprintAsset::LoadOrCreate(const FString& InName, const FString& InPath, UClass* ParentClass, int32 InSetFlags, int32 InClearFlags)
{
    FString PackageName = FString(TEXT("/Game/Blueprints/TypeScript/")) / InPath / InName;

    //UE_LOG(LogTemp, Warning, TEXT("LoadOrCreate.PackageName: %s"), *PackageName);

    Blueprint = LoadObject<UBlueprint>(nullptr, *PackageName, nullptr, LOAD_NoWarn | LOAD_NoRedirects);
    if (Blueprint)
    {
        GeneratedClass = Blueprint->GeneratedClass;
        if (auto TypeScriptGeneratedClass = Cast<UTypeScriptGeneratedClass>(GeneratedClass))
        {
            HasConstructor = TypeScriptGeneratedClass->HasConstructor;
        }
        Package = Cast<UPackage>(Blueprint->GetOuter());
        if (Blueprint->ParentClass != ParentClass)
        {
            Blueprint->ParentClass = ParentClass;
            NeedSave = true;
        }
        else {
            NeedSave = false;
        }
        return true;
    }

    if (!ParentClass) return false;

    NeedSave = true;

    UClass* BlueprintClass = UBlueprint::StaticClass();
    UClass* BlueprintGeneratedClass = UTypeScriptGeneratedClass::StaticClass();

    if (!ParentClass->IsChildOf(AActor::StaticClass()))
    {
        BlueprintClass = UTypeScriptBlueprint::StaticClass();
    }

    //UE_LOG(LogTemp, Warning, TEXT("BlueprintClass: %s"), *BlueprintClass->GetName());
    //UE_LOG(LogTemp, Warning, TEXT("BlueprintGeneratedClass: %s"), *BlueprintGeneratedClass->GetName());

    //FString Name;
    //FAssetToolsModule& AssetToolsModule = FModuleManager::LoadModuleChecked<FAssetToolsModule>("AssetTools");
    //AssetToolsModule.Get().CreateUniqueAssetName(PackageName, TEXT(""), PackageName, Name);

    //UE_LOG(LogTemp, Warning, TEXT("Name: %s, PackageName: %s, InName:%s, InPath:%s"), *Name, *PackageName, *InName, *InPath);

    Package = CreatePackage(NULL, *PackageName);
    check(Package);

    // Create and init a new Blueprint
    Blueprint = FKismetEditorUtilities::CreateBlueprint(ParentClass, Package, *InName, BPTYPE_Normal, BlueprintClass, BlueprintGeneratedClass, FName("LevelEditorActions"));
    if (Blueprint)
    {
        //static FName InterfaceClassName = FName(TEXT("TypeScriptObject"));
        //FBlueprintEditorUtils::ImplementNewInterface(Blueprint, InterfaceClassName);
        // Notify the asset registry
        FAssetRegistryModule::AssetCreated(Blueprint);

        // Mark the package dirty...
        Package->MarkPackageDirty();
        GeneratedClass = Blueprint->GeneratedClass;
        return true;
    }
    else
    {
        return false;
    }
}

bool UPEBlueprintAsset::LoadOrCreateWithMetaData(const FString& InName, const FString& InPath, UClass* InParentClass, int32 InSetFlags, int32 InClearFlags, UPEClassMetaData* InMetaData)
{
	if (!IsValid(InParentClass))
	{	// the parent class should be valid
		return false;
	}

	if (!LoadOrCreate(InName, InPath, InParentClass, InSetFlags, InClearFlags))
	{	//	create the class
		return false;
	}

	if (IsValid(InMetaData))
	{	//	apply the meta data
		InMetaData->Apply(GeneratedClass);
		NeedSave = true;
	}
	return true;
}

bool IsImplementationDesiredAsFunction(UBlueprint* InBlueprint, const UFunction* OverrideFunc)
{
    // If the original function was created in a parent blueprint, then prefer a BP function
    if (OverrideFunc)
    {
        FName OverrideName = *OverrideFunc->GetName();
        TSet<FName> GraphNames;
        FBlueprintEditorUtils::GetAllGraphNames(InBlueprint, GraphNames);
        for (const FName & Name : GraphNames)
        {
            if (Name == OverrideName)
            {
                return true;
            }
        }
    }

    // Otherwise, we would prefer an event
    return false;
}

static FEdGraphPinType ToFEdGraphPinType(FPEGraphPinType InGraphPinType, FPEGraphTerminalType InPinValueType)
{
    if (InGraphPinType.PinSubCategoryObject && InGraphPinType.PinCategory == UEdGraphSchema_K2::PC_Object)
    {
        if (InGraphPinType.PinSubCategoryObject->IsA<UScriptStruct>())
        {
            InGraphPinType.PinCategory = UEdGraphSchema_K2::PC_Struct;
        }
        else if (InGraphPinType.PinSubCategoryObject->IsA<UEnum>())
        {
            InGraphPinType.PinCategory = UEdGraphSchema_K2::PC_Byte;
        }
        else
        {
            InGraphPinType.PinCategory = UEdGraphSchema_K2::PC_Object;
        }
    }

    FEdGraphPinType PinType(InGraphPinType.PinCategory, NAME_None, InGraphPinType.PinSubCategoryObject,
        (EPinContainerType)InGraphPinType.PinContainerType, InGraphPinType.bIsReference, FEdGraphTerminalType());
    if (PinType.ContainerType == EPinContainerType::Map)
    {
        PinType.PinValueType.TerminalCategory = InPinValueType.PinCategory;
        PinType.PinValueType.TerminalSubCategoryObject = InPinValueType.PinSubCategoryObject;
        if (InPinValueType.PinSubCategoryObject && InPinValueType.PinCategory == UEdGraphSchema_K2::PC_Object)
        {
            if (InPinValueType.PinSubCategoryObject->IsA<UScriptStruct>())
            {
                PinType.PinValueType.TerminalCategory = UEdGraphSchema_K2::PC_Struct;
            }
            else if (InPinValueType.PinSubCategoryObject->IsA<UEnum>())
            {
                PinType.PinValueType.TerminalCategory = UEdGraphSchema_K2::PC_Byte;
            }
            else
            {
                PinType.PinValueType.TerminalCategory = UEdGraphSchema_K2::PC_Object;
            }
        }
    }

    return PinType;
}

void UPEBlueprintAsset::AddParameter(FName InParameterName, FPEGraphPinType InGraphPinType, FPEGraphTerminalType InPinValueType)
{
    ParameterNames.Add(InParameterName);
    ParameterTypes.Add(ToFEdGraphPinType(InGraphPinType, InPinValueType));
}

void UPEBlueprintAsset::AddParameterWithMetaData(FName InParameterName, FPEGraphPinType InGraphPinType, FPEGraphTerminalType InPinValueType, UPEParamMetaData* InMetaData)
{
	ParameterNames.Add(InParameterName);
	FEdGraphPinType PinType = ToFEdGraphPinType(InGraphPinType, InPinValueType);
	if (IsValid(InMetaData))
	{
		InMetaData->Apply(PinType);
	}
	ParameterTypes.Add(PinType);
}

static TArray<UK2Node_EditablePinBase*> GatherAllResultNodes(UK2Node_EditablePinBase* TargetNode)
{
    if (UK2Node_FunctionResult* ResultNode = Cast<UK2Node_FunctionResult>(TargetNode))
    {
        return (TArray<UK2Node_EditablePinBase*>)ResultNode->GetAllResultNodes();
    }
    TArray<UK2Node_EditablePinBase*> Result;
    if (TargetNode)
    {
        Result.Add(TargetNode);
    }
    return Result;
}
#if ENGINE_MINOR_VERSION <= 23 && ENGINE_MAJOR_VERSION < 5
UFunction* GetInterfaceFunction(UBlueprint* Blueprint, const FName FuncName)
{
    UFunction* Function = nullptr;

    // If that class is an interface class implemented by this function, then return true
    for (const FBPInterfaceDescription& I : Blueprint->ImplementedInterfaces)
    {
        if (I.Interface)
        {
            Function = FindField<UFunction>(I.Interface, FuncName);
            if (Function)
            {
                // found it, done
                return Function;
            }
        }
    }

    // Check if it is in a native class or parent class
    for (UClass* TempClass = Blueprint->ParentClass; (nullptr != TempClass) && (nullptr == Function); TempClass = TempClass->GetSuperClass())
    {
        for (const FImplementedInterface& I : TempClass->Interfaces)
        {
            Function = FindField<UFunction>(I.Class, FuncName);
            if (Function)
            {
                // found it, done
                return Function;
            }
        }
    }

    return nullptr;
}


UClass* const GetOverrideFunctionClass(UBlueprint* Blueprint, const FName FuncName, UFunction** OutFunction)
{
    if (!Blueprint->SkeletonGeneratedClass)
    {
        return nullptr;
    }

    UFunction* OverrideFunc = GetInterfaceFunction(Blueprint, FuncName);

    if (OverrideFunc == nullptr)
    {
        OverrideFunc = FindField<UFunction>(Blueprint->SkeletonGeneratedClass, FuncName);
        // search up the class hierarchy, we want to find the original declaration of the function to match FBlueprintEventNodeSpawner.
        // Doing so ensures that we can find the existing node if there is one:
        const UClass* Iter = Blueprint->SkeletonGeneratedClass->GetSuperClass();
        while (Iter != nullptr && OverrideFunc == nullptr)
        {
            if (UFunction * F = Iter->FindFunctionByName(FuncName))
            {
                OverrideFunc = F;
            }
            else
            {
                break;
            }
            Iter = Iter->GetSuperClass();
        }
    }
    if (OutFunction != nullptr)
    {
        *OutFunction = OverrideFunc;
    }

    return (OverrideFunc ? CastChecked<UClass>(OverrideFunc->GetOuter())->GetAuthoritativeClass() : nullptr);
}
#endif

void UPEBlueprintAsset::AddFunction(FName InName, bool IsVoid, FPEGraphPinType InGraphPinType, FPEGraphTerminalType InPinValueType, int32 InSetFlags, int32 InClearFlags)
{
    InSetFlags &= ~InClearFlags;
    InSetFlags &= ~FUNC_Native;
    const int32 NetMask = FUNC_Net | FUNC_NetMulticast | FUNC_NetServer | FUNC_NetClient | FUNC_NetReliable;
    if (InSetFlags & NetMask)
    {
        InSetFlags |= FUNC_Net;
    }

    UClass* SuperClass = GeneratedClass->GetSuperClass();

    UFunction* ParentFunction = SuperClass->FindFunctionByName(InName);

    UFunction* Function = GeneratedClass->FindFunctionByName(InName, EIncludeSuperFlag::ExcludeSuper);

	TArray<FName> AxisNames;
	TArray<FName> ActionNames;
	GetDefault<UInputSettings>()->GetAxisNames(AxisNames);
	GetDefault<UInputSettings>()->GetActionNames(ActionNames);

    UK2Node_EditablePinBase* FunctionEntryNode = nullptr;
    bool IsCustomEvent = false;

    // Create the function graph.

    const bool bUserCreated = true;
    if (ParentFunction)
    {
        //UE_LOG(LogTemp, Warning, TEXT("Override Function %s"), *ParentFunction->GetName());
        //FBlueprintEditorUtils::AddFunctionGraph(Blueprint, FunctionGraph, bUserCreated, ParentFunction);
        UFunction* OverrideFunc = nullptr;
#if ENGINE_MINOR_VERSION <= 23 && ENGINE_MAJOR_VERSION < 5
        UClass* const OverrideFuncClass = GetOverrideFunctionClass(Blueprint, InName, &OverrideFunc);
#else
        UClass* const OverrideFuncClass = FBlueprintEditorUtils::GetOverrideFunctionClass(Blueprint, InName, &OverrideFunc);
#endif
        check(OverrideFunc);

        UEdGraph* EventGraph = FBlueprintEditorUtils::FindEventGraph(Blueprint);

        if (UEdGraphSchema_K2::FunctionCanBePlacedAsEvent(OverrideFunc) && !IsImplementationDesiredAsFunction(Blueprint, OverrideFunc) && EventGraph)
        {
            // Add to event graph
            FName EventName = OverrideFunc->GetFName();
            UK2Node_Event* ExistingNode = FBlueprintEditorUtils::FindOverrideForFunction(Blueprint, OverrideFuncClass, EventName);

            if (!ExistingNode && !Function)
            {
                if (OverrideFuncClass == GeneratedClass)
                {
                    ExistingNode = FBlueprintEditorUtils::FindOverrideForFunction(Blueprint, UObject::StaticClass(), EventName);
                    if (ExistingNode && !ExistingNode->IsNodeEnabled())
                    {
                        EventGraph->Nodes.RemoveAll([&](UEdGraphNode* GraphNode) {return GraphNode == ExistingNode;});
                        FBlueprintEditorUtils::RemoveNode(Blueprint, ExistingNode);
                    }
                }
                UK2Node_Event* NewEventNode = FEdGraphSchemaAction_K2NewNode::SpawnNode<UK2Node_Event>(
                    EventGraph,
                    EventGraph->GetGoodPlaceForNewNode(),
                    EK2NewNodeFlags::SelectNewNode,
                    [EventName, OverrideFuncClass](UK2Node_Event* NewInstance)
                    {
                        NewInstance->EventReference.SetExternalMember(EventName, OverrideFuncClass);
                        NewInstance->bOverrideFunction = true;
                    }
                );
                NeedSave = true;
            }
            OverrideAdded.Add(InName);
        }
        else
        {
            if (FunctionAdded.Contains(InName)) return;
            UEdGraph* const ExistingGraph = FindObject<UEdGraph>(Blueprint, *InName.ToString());
            if (!ExistingGraph)
            {
                const FScopedTransaction Transaction(LOCTEXT("CreateOverrideFunctionGraph", "Create Override Function Graph"));
                Blueprint->Modify();
                // Implement the function graph
                UEdGraph* const NewGraph = FBlueprintEditorUtils::CreateNewGraph(Blueprint, InName, UEdGraph::StaticClass(), UEdGraphSchema_K2::StaticClass());
                FBlueprintEditorUtils::AddFunctionGraph(Blueprint, NewGraph, /*bIsUserCreated=*/ false, OverrideFuncClass);
                NewGraph->Modify();
                NeedSave = true;
            }
            FunctionAdded.Add(InName);
        }

        ParameterNames.Empty();
        ParameterTypes.Empty();
        return;
    }
    else if (AxisNames.Contains(InName))
    {
        TArray<UK2Node_InputAxisEvent*> AllEvents;
        //TODO: K2Node_InputTouchEvent,K2Node_InputVectorAxisEvent,K2Node_InputAxisKeyEvent,UK2Node_InputKeyEvent
        FBlueprintEditorUtils::GetAllNodesOfClass<UK2Node_InputAxisEvent>(Blueprint, AllEvents);

        UEdGraph* EventGraph = FBlueprintEditorUtils::FindEventGraph(Blueprint);

        if (EventGraph && !AllEvents.FindByPredicate([&](UK2Node_InputAxisEvent* Node) { return Node->InputAxisName == InName; }))
        {
            //UE_LOG(LogTemp, Warning, TEXT("Add Axis: %s"), *InName.ToString());
            FEdGraphSchemaAction_K2NewNode::SpawnNode<UK2Node_InputAxisEvent>(
                EventGraph,
                EventGraph->GetGoodPlaceForNewNode(),
                EK2NewNodeFlags::SelectNewNode,
                [InName](UK2Node_InputAxisEvent* NewInstance)
                {
                    NewInstance->Initialize(InName);
                }
            );
            NeedSave = true;
        }
    }
    //Create Action node and PrintString node
    //then Connection them.
    //UK2Node_InputAction Node must have one connected node to create function "InpActEvt_%s_%s"
    else if (ActionNames.Contains(InName))
    {
        TArray<UK2Node_InputAction*> AllEvents;
        FBlueprintEditorUtils::GetAllNodesOfClass<UK2Node_InputAction>(Blueprint, AllEvents);

        UEdGraph* EventGraph = FBlueprintEditorUtils::FindEventGraph(Blueprint);

        if (EventGraph && !AllEvents.FindByPredicate([&](UK2Node_InputAction* Node) { return Node->InputActionName == InName; }))
        {
            UK2Node_InputAction* NewNode = FEdGraphSchemaAction_K2NewNode::SpawnNode<UK2Node_InputAction>(
                EventGraph,
                EventGraph->GetGoodPlaceForNewNode(),
                EK2NewNodeFlags::SelectNewNode,
                [InName](UK2Node_InputAction* NewInstance)
                {
                    NewInstance->InputActionName = InName;
                }
            );
            //UK2Node_CallFunction
            UK2Node_CallFunction* NewNode2 = FEdGraphSchemaAction_K2NewNode::SpawnNode<UK2Node_CallFunction>(
                EventGraph,
                EventGraph->GetGoodPlaceForNewNode(),
                EK2NewNodeFlags::SelectNewNode,
                [InName](UK2Node_CallFunction* NewInstance)
                {
                    NewInstance->FunctionReference.SetExternalMember(FName("PrintString"), UKismetSystemLibrary::StaticClass());
                }
            );

            EventGraph->GetSchema()->TryCreateConnection(NewNode->Pins[0], NewNode2->Pins[0]);
            NeedSave = true;
        }
    }
    else if (InSetFlags & FUNC_Net)
    {
        TArray<UK2Node_CustomEvent*> AllEvents;
        FBlueprintEditorUtils::GetAllNodesOfClass<UK2Node_CustomEvent>(Blueprint, AllEvents);

        UEdGraph* EventGraph = FBlueprintEditorUtils::FindEventGraph(Blueprint);

        auto Iter = AllEvents.FindByPredicate([&](UK2Node_CustomEvent* Node) { return Node->CustomFunctionName == InName; });

        if (EventGraph)
        {
            if (EventGraph && !Iter)
            {
                //处理标签改变的情况
                Blueprint->FunctionGraphs.RemoveAll([&](UEdGraph* Graph) { return Graph->GetFName() == InName; });

                UEdGraph* ExistingGraph = FindObject<UEdGraph>(Blueprint, *(InName.ToString()));
                if (ExistingGraph)
                {
                    ExistingGraph->Rename(*FString::Printf(TEXT("%s%s"), *ExistingGraph->GetName(), TEXT("__Removed")), nullptr, REN_DontCreateRedirectors | REN_DoNotDirty | REN_ForceNoResetLoaders);
                }

                UK2Node_CustomEvent* EventNode = FEdGraphSchemaAction_K2NewNode::SpawnNode<UK2Node_CustomEvent>(
                    EventGraph,
                    EventGraph->GetGoodPlaceForNewNode(),
                    EK2NewNodeFlags::SelectNewNode,
                    [InName](UK2Node_Event* NewInstance)
                    {
                        NewInstance->CustomFunctionName = InName;
                        NewInstance->bIsEditable = true;
                    }
                );

                FunctionEntryNode = EventNode;
                NeedSave = true;
            }
            else
            {
                FunctionEntryNode = *Iter;
            }
            IsCustomEvent = true;
            FunctionAdded.Add(InName);
        }
    }
    else
    {
        if (FunctionAdded.Contains(InName)) return;
        TArray< UEdGraph* > GraphList;
        Blueprint->GetAllGraphs(GraphList);
        UEdGraph** ExistedGraph = GraphList.FindByPredicate([&](UEdGraph* Graph) { return Graph->GetFName() == InName; });
        UEdGraph* FunctionGraph;
        if (ExistedGraph)
        {
            //UE_LOG(LogTemp, Warning, TEXT("FunctionGraph %s existed, delete it!"), *InName.ToString());
            //FBlueprintEditorUtils::RemoveGraph(Blueprint, *ExistedGraph);
	        FunctionGraph = *ExistedGraph;
        }
        else
        {
            UEdGraph* EventGraph = FBlueprintEditorUtils::FindEventGraph(Blueprint);
            if (EventGraph)
            {
                EventGraph->Nodes.RemoveAll([&](UEdGraphNode* GraphNode) {
                    UK2Node_CustomEvent* CustomEvent = Cast<UK2Node_CustomEvent>(GraphNode);
                    return CustomEvent && CustomEvent->CustomFunctionName == InName;
                    });
                UEdGraph* ExistingGraph = FindObject<UEdGraph>(Blueprint, *(InName.ToString()));
                if (ExistingGraph)
                {
                    ExistingGraph->Rename(*FString::Printf(TEXT("%s%s"), *ExistingGraph->GetName(), TEXT("__Removed")), nullptr, REN_DontCreateRedirectors | REN_DoNotDirty | REN_ForceNoResetLoaders);
                }
            }
            FunctionGraph = FBlueprintEditorUtils::CreateNewGraph(
                Blueprint,
                InName, //FBlueprintEditorUtils::FindUniqueKismetName(Blueprint, FuncName.ToString()),
                UEdGraph::StaticClass(),
                UEdGraphSchema_K2::StaticClass());
            FBlueprintEditorUtils::AddFunctionGraph<UClass>(Blueprint, FunctionGraph, bUserCreated, nullptr);
            NeedSave = true;
        }

        //if (InFlags)
        //{
        //    const UEdGraphSchema_K2* K2Schema = Cast<const UEdGraphSchema_K2>(FunctionGraph->GetSchema());
        //    K2Schema->AddExtraFunctionFlags(FunctionGraph, InFlags);
        //}

        TArray<UK2Node_FunctionEntry*> EntryNodes;
        FunctionGraph->GetNodesOfClass(EntryNodes);

        if (EntryNodes.Num() == 1)
        {
            FunctionEntryNode = EntryNodes[0];
        }
        FunctionAdded.Add(InName);
    }

    if (FunctionEntryNode)
    {
        if (UK2Node_FunctionEntry* TypedEntryNode = Cast<UK2Node_FunctionEntry>(FunctionEntryNode))
        {
            int32 ExtraFlags = TypedEntryNode->GetExtraFlags();

            int32 NewExtraFlags = (ExtraFlags | InSetFlags) & ~InClearFlags;

            if (ExtraFlags != NewExtraFlags)
            {
                TypedEntryNode->SetExtraFlags(NewExtraFlags);
                NeedSave = true;
            }
        }
        else if (UK2Node_CustomEvent* CustomEventNode = Cast<UK2Node_CustomEvent>(FunctionEntryNode))
        {
            int32 NewFunctionFlags = (CustomEventNode->FunctionFlags | InSetFlags) & ~InClearFlags;
            if (CustomEventNode->FunctionFlags  != NewFunctionFlags)
            {
                CustomEventNode->FunctionFlags = NewFunctionFlags;
                NeedSave = true;
            }
        }

        TArray<TSharedPtr<FUserPinInfo>> OldUserDefinedPins = FunctionEntryNode->UserDefinedPins;

        bool ParameterChanged = OldUserDefinedPins.Num() != ParameterTypes.Num();

        if (!ParameterChanged)
        {
            for (int i = 0; i < OldUserDefinedPins.Num(); i++)
            {
                if (OldUserDefinedPins[i]->PinType != ParameterTypes[i])
                {
                    ParameterChanged = true;
                }
            }
        }

        if (ParameterChanged)
        {
            for (TSharedPtr<FUserPinInfo> pinInfo : OldUserDefinedPins)
            {
                FunctionEntryNode->RemoveUserDefinedPin(pinInfo);
            }
            for (int i = 0; i < ParameterNames.Num(); i++)
            {
                FunctionEntryNode->CreateUserDefinedPin(ParameterNames[i], ParameterTypes[i], EGPD_Output);
            }
        }

        bool RetChanged = false;

        const FName RetValName = FName(TEXT("ReturnValue"));

        if (!IsVoid && !IsCustomEvent)
        {
            FEdGraphPinType PinType = ToFEdGraphPinType(InGraphPinType, InPinValueType);
            //EntryNodes[0]->CreateUserDefinedPin(RetValName, PinType, EGPD_Input, false);
            auto FunctionResultNode = FBlueprintEditorUtils::FindOrCreateFunctionResultNode(FunctionEntryNode);

            TArray<UK2Node_EditablePinBase*> TargetNodes = GatherAllResultNodes(FunctionResultNode);
            for (UK2Node_EditablePinBase* Node : TargetNodes)
            {
                TArray<TSharedPtr<FUserPinInfo>> OldUserDefinedReturnPins = Node->UserDefinedPins;
                RetChanged = RetChanged || (OldUserDefinedReturnPins.Num() != 1) || (OldUserDefinedReturnPins[0]->PinType != PinType);

                if (RetChanged)
                {
                    Node->Modify();
                    for (TSharedPtr<FUserPinInfo> pinInfo : OldUserDefinedReturnPins)
                    {
                        Node->RemoveUserDefinedPin(pinInfo);
                    }
                    Node->CreateUserDefinedPin(RetValName, PinType, EGPD_Input, false);
                }
            }
        }
        else
        {
            auto FunctionResultNode = FBlueprintEditorUtils::FindOrCreateFunctionResultNode(FunctionEntryNode);

            TArray<UK2Node_EditablePinBase*> TargetNodes = GatherAllResultNodes(FunctionResultNode);
            for (UK2Node_EditablePinBase* Node : TargetNodes)
            {
                TArray<TSharedPtr<FUserPinInfo>> OldUserDefinedReturnPins = Node->UserDefinedPins;
                RetChanged = RetChanged || (OldUserDefinedReturnPins.Num() != 0);

                if (RetChanged)
                {
                    Node->Modify();
                    for (TSharedPtr<FUserPinInfo> pinInfo : OldUserDefinedReturnPins)
                    {
                        Node->RemoveUserDefinedPin(pinInfo);
                    }
                }
            }
        }

        NeedSave = NeedSave || ParameterChanged || RetChanged;
    }

    ParameterNames.Empty();
    ParameterTypes.Empty();
}

void UPEBlueprintAsset::AddFunctionWithMetaData(FName InName, bool IsVoid, FPEGraphPinType InGraphPinType, FPEGraphTerminalType InPinValueType, int32 InSetFlags, int32 InClearFlags, UPEFunctionMetaData* InMetaData)
{
	//	a helper function used to find custom event by name
	static const auto FindCustomEvent = [](UBlueprint* InBlueprint, FName InName)->UK2Node_CustomEvent*
	{
		if (!IsValid(InBlueprint))
		{
			return nullptr;
		}

		TArray<UK2Node_CustomEvent*> Result;
		FBlueprintEditorUtils::GetAllNodesOfClass<UK2Node_CustomEvent>(InBlueprint, Result);

		const auto pFindResult = Result.FindByPredicate([Name = InName](const UK2Node_CustomEvent* InEvent)->bool
		{
			return InEvent->CustomFunctionName == Name;
		});

		return pFindResult == nullptr ? nullptr : *pFindResult;
	};

	//	a helper function used to find function entry of a function
	static const auto FindFunctionEntry = [](UBlueprint* InBlueprint, FName InName)->UK2Node_FunctionEntry*
	{
		if (!IsValid(InBlueprint))
		{
			return nullptr;
		}

		TArray<UEdGraph*> Graphs;
		InBlueprint->GetAllGraphs(Graphs);

		const auto pFunctionGraph = Graphs.FindByPredicate([Name = InName](const UEdGraph* InGraph){return InGraph->GetFName() == Name;});
		if (pFunctionGraph == nullptr)
		{
			return nullptr;
		}

		TArray<UK2Node_FunctionEntry*> Entries;
		(*pFunctionGraph)->GetNodesOfClass(Entries);
		if (Entries.Num() == 1)
		{
			return Entries[0];
		}
		return nullptr;
	};

	/**
	 * @brief
	 *		function body
	 */
	if (IsValid(InMetaData))
	{
		InSetFlags |= static_cast<int32>(InMetaData->FunctionFlags);
		InClearFlags &= ~static_cast<int32>(InMetaData->FunctionFlags);
	}

	AddFunction(InName, IsVoid, InGraphPinType, InPinValueType, InSetFlags, InClearFlags);

	if (!IsValid(InMetaData))
	{
		return;
	}

	//	check if input function is custom event
	if (UK2Node_CustomEvent* CustomEvent = FindCustomEvent(Blueprint, InName))
	{
		InMetaData->Apply(CustomEvent);
		NeedSave = true;
	}
	else if (UK2Node_FunctionEntry* FunctionEntry = FindFunctionEntry(Blueprint, InName))
	{
		InMetaData->Apply(FunctionEntry);
		NeedSave = true;
	}
	else
	{
		UE_LOG(LogTemp, Warning, TEXT("Currently, Only Custom Event and Function Graph Support MetaData"));
	}
}

void UPEBlueprintAsset::ClearParameter()
{
    ParameterNames.Empty();
    ParameterTypes.Empty();
}

void UPEBlueprintAsset::AddMemberVariable(FName NewVarName, FPEGraphPinType InGraphPinType, FPEGraphTerminalType InPinValueType, int32 InLFlags, int32 InHFlags, int32 InLifetimeCondition)
{
    uint64 InFlags = (uint64)InHFlags << 32 | InLFlags;
    FEdGraphPinType PinType = ToFEdGraphPinType(InGraphPinType, InPinValueType);

    int32 VarIndex = FBlueprintEditorUtils::FindNewVariableIndex(Blueprint, NewVarName);
    if (VarIndex == INDEX_NONE)
    {
        FBlueprintEditorUtils::AddMemberVariable(Blueprint, NewVarName, PinType);
        NeedSave = true;
    }
    else
    {
        FBPVariableDescription& Variable = Blueprint->NewVariables[VarIndex];
        if (Variable.VarType != PinType)
        {
            FBlueprintEditorUtils::ChangeMemberVariableType(Blueprint, NewVarName, PinType);
            NeedSave = true;
        }
        //else
        //{
        //    UE_LOG(LogTemp, Error, TEXT("do not changed %s"), *NewVarName.ToString());
        //}
    }
    VarIndex = FBlueprintEditorUtils::FindNewVariableIndex(Blueprint, NewVarName);
    if (VarIndex != INDEX_NONE)
    {
        FBPVariableDescription& Variable = Blueprint->NewVariables[VarIndex];
        const uint64 NetMask = CPF_Net | CPF_RepNotify;
        uint64 NetFlags = InFlags & NetMask;
        if ((Variable.PropertyFlags & NetMask) != NetFlags)
        {
            Variable.PropertyFlags &= ~NetMask;
            Variable.PropertyFlags |= NetFlags;
            if (Variable.PropertyFlags & CPF_RepNotify)
            {
                FString NewFuncNameStr = FString::Printf(TEXT("OnRep_%s"), *NewVarName.ToString());
                FName NewFuncName = FName(*NewFuncNameStr);
                UEdGraph* FuncGraph = FindObject<UEdGraph>(Blueprint, *NewFuncNameStr);
                if (!FuncGraph)
                {
                    FuncGraph = FBlueprintEditorUtils::CreateNewGraph(Blueprint, NewFuncName, UEdGraph::StaticClass(), UEdGraphSchema_K2::StaticClass());
                    FBlueprintEditorUtils::AddFunctionGraph<UClass>(Blueprint, FuncGraph, false, NULL);
                }

                FunctionAdded.Add(NewFuncName);

                Blueprint->NewVariables[VarIndex].RepNotifyFunc = NewFuncName;
            }
            NeedSave = true;
        }

        if ((Variable.PropertyFlags & CPF_DisableEditOnInstance) != (InFlags & CPF_DisableEditOnInstance))
        {
            if( InFlags & CPF_DisableEditOnInstance )
            {
                Blueprint->NewVariables[VarIndex].PropertyFlags |= CPF_DisableEditOnInstance;
            }
            else
            {
                Blueprint->NewVariables[VarIndex].PropertyFlags &= ~CPF_DisableEditOnInstance;
            }
            NeedSave = true;
        }

        if (InLifetimeCondition < COND_Max && Variable.ReplicationCondition != InLifetimeCondition)
        {
            Variable.ReplicationCondition = (ELifetimeCondition)InLifetimeCondition;
            NeedSave = true;
        }
    }
    MemberVariableAdded.Add(NewVarName);
}

void UPEBlueprintAsset::AddMemberVariableWithMetaData(FName InNewVarName, FPEGraphPinType InGraphPinType, FPEGraphTerminalType InPinValueType, int32 InLFlags, int32 InHFLags, int32 InLifetimeCondition, UPEPropertyMetaData* InMetaData)
{
	if (IsValid(InMetaData))
	{//	handle the conflict here
		EPropertyFlags InputFlags = static_cast<EPropertyFlags>((static_cast<uint64>(InHFLags) << 32) + InLFlags);

		InputFlags |= InMetaData->PropertyFlags;
		//	meta data has instanced specifier
		if (InMetaData->MetaData.Contains(TEXT("EditInline")))
		{
			InputFlags &= ~CPF_DisableEditOnInstance;
		}

		InLFlags = (static_cast<uint64>(InputFlags) & 0xffffffff);
		InHFLags = (static_cast<uint64>(InputFlags) >> 32);
	}
	AddMemberVariable(InNewVarName, InGraphPinType, InPinValueType, InLFlags, InHFLags, InLifetimeCondition);
	const int32 VarIndex = FBlueprintEditorUtils::FindNewVariableIndex(Blueprint, InNewVarName);
	if (VarIndex == INDEX_NONE || !IsValid(InMetaData))
	{
		return;
	}

	//	currently the replicated behaviour is different from cpp
	InMetaData->Apply(Blueprint->NewVariables[VarIndex]);
	NeedSave = true;
}

void UPEBlueprintAsset::RemoveNotExistedMemberVariable()
{
    if (Blueprint)
    {
        TArray<FName> ToDelete;
        for (int32 i = 0; i < Blueprint->NewVariables.Num(); i++)
        {
            if (!MemberVariableAdded.Contains(Blueprint->NewVariables[i].VarName))
            {
                ToDelete.Add(Blueprint->NewVariables[i].VarName);
            }
        }
        for (auto Name : ToDelete)
        {
            NeedSave = true;
            FBlueprintEditorUtils::RemoveMemberVariable(Blueprint, Name);
        }
    }
    MemberVariableAdded.Empty();
}

void UPEBlueprintAsset::RemoveNotExistedFunction()
{
    if (Blueprint)
    {
        if (FBlueprintEditorUtils::SupportsConstructionScript(Blueprint) && Blueprint->SimpleConstructionScript)
        {
            if (UEdGraph* ExistingUCS = FBlueprintEditorUtils::FindUserConstructionScript(Blueprint))
            {
                ExistingUCS->bAllowDeletion = false;
            }
            else
            {
                UEdGraph* UCSGraph = FBlueprintEditorUtils::CreateNewGraph(Blueprint, UEdGraphSchema_K2::FN_UserConstructionScript, UEdGraph::StaticClass(), UEdGraphSchema_K2::StaticClass());
                FBlueprintEditorUtils::AddFunctionGraph(Blueprint, UCSGraph, /*bIsUserCreated=*/ false, AActor::StaticClass());
                UCSGraph->bAllowDeletion = false;
                NeedSave = true;
            }
            FunctionAdded.Add(UEdGraphSchema_K2::FN_UserConstructionScript);
        }

        auto RemovedFunction = Blueprint->FunctionGraphs.RemoveAll([&](UEdGraph* Graph) { return !FunctionAdded.Contains(Graph->GetFName()); });
        NeedSave = NeedSave || (RemovedFunction > 0);

        UEdGraph* EventGraph = FBlueprintEditorUtils::FindEventGraph(Blueprint);
        if (EventGraph)
        {
            auto RemovedCustomEvent = EventGraph->Nodes.RemoveAll([&](UEdGraphNode* GraphNode) {
                UK2Node_CustomEvent* CustomEvent = Cast<UK2Node_CustomEvent>(GraphNode);
                return CustomEvent && !FunctionAdded.Contains(CustomEvent->CustomFunctionName);
                });
            NeedSave = NeedSave || (RemovedCustomEvent > 0);

            auto RemoveOverrideEvent = EventGraph->Nodes.RemoveAll([&](UEdGraphNode* GraphNode) {
                UK2Node_Event* Event = Cast<UK2Node_Event>(GraphNode);
                return Event && Event->bOverrideFunction && !OverrideAdded.Contains(Event->EventReference.GetMemberName());
                });
            NeedSave = NeedSave || (RemoveOverrideEvent > 0);
        }
    }
    FunctionAdded.Empty();
}

void UPEBlueprintAsset::Save()
{
    auto TypeScriptGeneratedClass = Cast<UTypeScriptGeneratedClass>(GeneratedClass);
    if (Blueprint && TypeScriptGeneratedClass)
    {
        NeedSave = NeedSave || (TypeScriptGeneratedClass->HasConstructor != HasConstructor);
        TypeScriptGeneratedClass->HasConstructor = HasConstructor;
        if (NeedSave)
        {
            for (TFieldIterator<UFunction> FuncIt(TypeScriptGeneratedClass, EFieldIteratorFlags::ExcludeSuper); FuncIt; ++FuncIt)
            {
                auto Function = *FuncIt;
                Function->FunctionFlags &= ~FUNC_Native;
            }
            FBlueprintEditorUtils::MarkBlueprintAsModified(Blueprint);
            FKismetEditorUtilities::CompileBlueprint(Blueprint);

            TArray<UPackage*> PackagesToSave;
            PackagesToSave.Add(Package);
            FEditorFileUtils::PromptForCheckoutAndSave(PackagesToSave, false, false);
        }
    }
}


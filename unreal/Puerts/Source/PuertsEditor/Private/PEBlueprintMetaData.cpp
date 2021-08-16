#include "PEBlueprintMetaData.h"

#include "K2Node_FunctionEntry.h"
#include "MetaData.h"
#include "Engine/Blueprint.h"
#include "GameFramework/Actor.h"

const TCHAR* UPEClassMetaData::NAME_HideCategories{ TEXT("HideCategories") };
const TCHAR* UPEClassMetaData::NAME_ShowCategories{ TEXT("ShowCategories") };
const TCHAR* UPEClassMetaData::NAME_HideFunctions{ TEXT("HideFunctions") };
const TCHAR* UPEClassMetaData::NAME_AutoExpandCategories{ TEXT("AutoExpandCategories") };
const TCHAR* UPEClassMetaData::NAME_AutoCollapseCategories{ TEXT("AutoCollapseCategories") };
const TCHAR* UPEClassMetaData::NAME_ClassGroupNames{ TEXT("ClassGroupNames") };
const TCHAR* UPEClassMetaData::NAME_SparseClassDataTypes{ TEXT("SparseClassDataTypes") };

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
	for (const auto Pair : MetaData)
	{
		if (auto MetaDataEntryPtr = Element.MetaDataArray.FindByPredicate([Key = Pair.Key](const FBPVariableMetaDataEntry& InEntry) {return InEntry.DataKey == Key; }))
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
// Fill out your copyright notice in the Description page of Project Settings.


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
#include "ScriptDisassembler.h"
#include "K2Node_FunctionEntry.h"
#include "EdGraphSchema_K2_Actions.h"
#include "K2Node_Event.h"

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

bool UPEBlueprintAsset::Load(const FString& InParentClassName, const FString& InName, const FString& InPath)
{
    UClass* ParentClass = FindClass(*InParentClassName);
    UE_LOG(LogTemp, Warning, TEXT("InParentClassName: %s(%p)"), *InParentClassName, ParentClass);
    UE_LOG(LogTemp, Warning, TEXT("InName: %s"), *InName);
    UE_LOG(LogTemp, Warning, TEXT("InPath: %s"), *InPath);

    FString PackageName = FString(TEXT("/Game/Blueprints/TypeScript/")) / InPath / InName;

    UE_LOG(LogTemp, Warning, TEXT("PackageName: %s"), *PackageName);

    FAssetRegistryModule& AssetRegistryModule = FModuleManager::LoadModuleChecked<FAssetRegistryModule>("AssetRegistry");
    TArray<FAssetData> AssetDatas;
    if (AssetRegistryModule.Get().GetAssetsByPackageName(*PackageName, AssetDatas) && AssetDatas.Num() > 0) //防止StaticLoadObject找不到文件的Warning
    {
        Blueprint = Cast<UBlueprint>(StaticLoadObject(UObject::StaticClass(), nullptr, *PackageName));
        GeneratedClass = Blueprint->GeneratedClass;
        Package = Cast<UPackage>(Blueprint->GetOuter());
        UE_LOG(LogTemp, Warning, TEXT("existed BlueprintGeneratedClass: %s"), *GeneratedClass->GetName());
        UE_LOG(LogTemp, Warning, TEXT("existed Package: %s"), *Package->GetName());
        return true;
    }

    if (!ParentClass) ParentClass = UObject::StaticClass();

    UClass* BlueprintClass = nullptr;
    UClass* BlueprintGeneratedClass = nullptr;

    IKismetCompilerInterface& KismetCompilerModule = FModuleManager::LoadModuleChecked<IKismetCompilerInterface>("KismetCompiler");
    KismetCompilerModule.GetBlueprintTypesForClass(ParentClass, BlueprintClass, BlueprintGeneratedClass);

    UE_LOG(LogTemp, Warning, TEXT("BlueprintClass: %s"), *BlueprintClass->GetName());
    UE_LOG(LogTemp, Warning, TEXT("BlueprintGeneratedClass: %s"), *BlueprintGeneratedClass->GetName());

    FString Name;
    FAssetToolsModule& AssetToolsModule = FModuleManager::LoadModuleChecked<FAssetToolsModule>("AssetTools");
    AssetToolsModule.Get().CreateUniqueAssetName(PackageName, TEXT(""), PackageName, Name);

    Package = CreatePackage(NULL, *PackageName);
    check(Package);

    // Create and init a new Blueprint
    Blueprint = FKismetEditorUtilities::CreateBlueprint(ParentClass, Package, *Name, BPTYPE_Normal, BlueprintClass, BlueprintGeneratedClass, FName("LevelEditorActions"));
    if (Blueprint)
    {
        static FName InterfaceClassName = FName(TEXT("TypeScriptObject"));
        FBlueprintEditorUtils::ImplementNewInterface(Blueprint, InterfaceClassName);
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

void UPEBlueprintAsset::AddFunction(FName InName)
{
    UClass* SuperClass = GeneratedClass->GetSuperClass();

    UFunction* ParentFunction = SuperClass->FindFunctionByName(InName);

    UFunction* Function = GeneratedClass->FindFunctionByName(InName, EIncludeSuperFlag::ExcludeSuper);
    if (ParentFunction && Function)
    {
        return;
    }

    Blueprint->Modify();

    // Create the function graph.
    
    const bool bUserCreated = true;
    if (ParentFunction)
    {
        UE_LOG(LogTemp, Warning, TEXT("Override Function %s"), *ParentFunction->GetName());
        //FBlueprintEditorUtils::AddFunctionGraph(Blueprint, FunctionGraph, bUserCreated, ParentFunction);
        UFunction* OverrideFunc = nullptr;
        UClass* const OverrideFuncClass = FBlueprintEditorUtils::GetOverrideFunctionClass(Blueprint, InName, &OverrideFunc);
        check(OverrideFunc);

        UEdGraph* EventGraph = FBlueprintEditorUtils::FindEventGraph(Blueprint);

        if (UEdGraphSchema_K2::FunctionCanBePlacedAsEvent(OverrideFunc) && !IsImplementationDesiredAsFunction(Blueprint, OverrideFunc) && EventGraph)
        {
            // Add to event graph
            FName EventName = OverrideFunc->GetFName();
            UK2Node_Event* ExistingNode = FBlueprintEditorUtils::FindOverrideForFunction(Blueprint, OverrideFuncClass, EventName);

            if (!ExistingNode)
            {
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
            }
        }

        return;
    }
    else
    {
        TArray< UEdGraph* > GraphList;
        Blueprint->GetAllGraphs(GraphList);
        UEdGraph** ExistedGraph = GraphList.FindByPredicate([&](UEdGraph* Graph) { return Graph->GetFName() == InName; });
        if (ExistedGraph)
        {
            UE_LOG(LogTemp, Warning, TEXT("FunctionGraph %s existed, delete it!"), *InName.ToString());
            FBlueprintEditorUtils::RemoveGraph(Blueprint, *ExistedGraph);
        }

        UE_LOG(LogTemp, Warning, TEXT("Add Function %s"), *InName.ToString());
        UEdGraph* FunctionGraph = FBlueprintEditorUtils::CreateNewGraph(
            Blueprint,
            InName, //FBlueprintEditorUtils::FindUniqueKismetName(Blueprint, FuncName.ToString()),
            UEdGraph::StaticClass(),
            UEdGraphSchema_K2::StaticClass());

        FBlueprintEditorUtils::AddFunctionGraph<UClass>(Blueprint, FunctionGraph, bUserCreated, nullptr);

        //TODO: Add parameter
        TArray<UK2Node_FunctionEntry*> EntryNodes;
        FunctionGraph->GetNodesOfClass(EntryNodes);

        if (EntryNodes.Num() == 1)
        {
            FEdGraphPinType StringPinType(UEdGraphSchema_K2::PC_String, NAME_None, nullptr, EPinContainerType::None, false, FEdGraphTerminalType());
            FEdGraphPinType ActorPinType(UEdGraphSchema_K2::PC_Object, NAME_None, AActor::StaticClass(), EPinContainerType::None, false, FEdGraphTerminalType());
            EntryNodes[0]->CreateUserDefinedPin(TEXT("P1"), StringPinType, EGPD_Output);
            EntryNodes[0]->CreateUserDefinedPin(TEXT("P2"), ActorPinType, EGPD_Input, false);
        }
        else
        {
            UE_LOG(LogTemp, Error, TEXT("EntryNodes.Num: %d"), EntryNodes.Num());
        }
    }

    //FEdGraphPinType TempPinType;
    //Schema->ConvertPropertyToPinType(Temp, TempPinType);
    //Schema->ConvertPropertyToPinType()

    //FEdGraphPinType StringPinType(UEdGraphSchema_K2::PC_String, NAME_None, nullptr, EPinContainerType::None, false, FEdGraphTerminalType());
    //FBlueprintEditorUtils::AddMemberVariable(Blueprint, TEXT("StrMember"), StringPinType);

    //FEdGraphPinType ActorPinType(UEdGraphSchema_K2::PC_Object, NAME_None, AActor::StaticClass(), EPinContainerType::None, false, FEdGraphTerminalType());
    //FBlueprintEditorUtils::AddMemberVariable(Blueprint, TEXT("ObjectMember"), ActorPinType);
}

void UPEBlueprintAsset::AddMemberVariable(FName NewVarName, FPEGraphPinType InGraphPinType, FPEGraphTerminalType InPinValueType)
{
    if ((EPinContainerType)InGraphPinType.PinContainerType == EPinContainerType::None && InGraphPinType.PinSubCategoryObject)
    {
        if (InGraphPinType.PinSubCategoryObject->IsA<UScriptStruct>())
        {
            InGraphPinType.PinCategory = UEdGraphSchema_K2::PC_Struct;
        }
        else if (UClass *Class = Cast<UClass>(InGraphPinType.PinSubCategoryObject))
        {
            if (Class == UClass::StaticClass())
            {
                InGraphPinType.PinCategory = UEdGraphSchema_K2::PC_Class;
            }
            else
            {
                InGraphPinType.PinCategory = UEdGraphSchema_K2::PC_Object;
            }
        }
    }

    FEdGraphPinType PinType(InGraphPinType.PinCategory, NAME_None, InGraphPinType.PinSubCategoryObject, 
        (EPinContainerType)InGraphPinType.PinContainerType, InGraphPinType.bIsReference, FEdGraphTerminalType());
    if (PinType.ContainerType != EPinContainerType::None)
    {
        PinType.PinValueType.TerminalCategory = InPinValueType.PinCategory;
        PinType.PinValueType.TerminalSubCategoryObject = InGraphPinType.PinSubCategoryObject;
    }

    const int32 VarIndex = FBlueprintEditorUtils::FindNewVariableIndex(Blueprint, NewVarName);
    if (VarIndex == INDEX_NONE)
    {
        FBlueprintEditorUtils::AddMemberVariable(Blueprint, NewVarName, PinType);
    }
    else
    {
        FBlueprintEditorUtils::ChangeMemberVariableType(Blueprint, NewVarName, PinType);
    }
    NamesAdded.Add(NewVarName);
}

void UPEBlueprintAsset::RemoveNotExistedMemberVariable()
{
    //Blueprint->NewVariables->
    TArray<FName> ToDelete;
    for (int32 i = 0; i < Blueprint->NewVariables.Num(); i++)
    {
        if (!NamesAdded.Contains(Blueprint->NewVariables[i].VarName))
        {
            ToDelete.Add(Blueprint->NewVariables[i].VarName);
        }
    }
    for (auto Name : ToDelete)
    {
        UE_LOG(LogTemp, Warning, TEXT("Delete MemberVariable %s"), *Name.ToString());
        FBlueprintEditorUtils::RemoveMemberVariable(Blueprint, Name);
    }
    NamesAdded.Empty();
}

void UPEBlueprintAsset::Save()
{
    if (Blueprint)
    {
        FKismetEditorUtilities::CompileBlueprint(Blueprint);

        TArray<UPackage*> PackagesToSave;
        PackagesToSave.Add(Package);
        FEditorFileUtils::PromptForCheckoutAndSave(PackagesToSave, false, false);
    }
}

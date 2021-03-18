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
#include "K2Node_FunctionEntry.h"
#include "EdGraphSchema_K2_Actions.h"
#include "K2Node_Event.h"
#include "K2Node_FunctionResult.h"
#include "GameFramework/InputSettings.h"
#include "K2Node_InputAxisEvent.h"
#include "TypeScriptGeneratedClass.h"
#include "TypeScriptBlueprint.h"

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

bool UPEBlueprintAsset::LoadOrCreate(const FString& InName, const FString& InPath, UClass* ParentClass)
{
    FString PackageName = FString(TEXT("/Game/Blueprints/TypeScript/")) / InPath / InName;

    //UE_LOG(LogTemp, Warning, TEXT("LoadOrCreate.PackageName: %s"), *PackageName);

    Blueprint = LoadObject<UBlueprint>(nullptr, *PackageName, nullptr, LOAD_NoWarn | LOAD_NoRedirects);
    if (Blueprint) 
    {
        GeneratedClass = Blueprint->GeneratedClass;
        Package = Cast<UPackage>(Blueprint->GetOuter());
        NeedSave = false;
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
    if ((EPinContainerType)InGraphPinType.PinContainerType == EPinContainerType::None && InGraphPinType.PinSubCategoryObject)
    {
        if (InGraphPinType.PinSubCategoryObject->IsA<UScriptStruct>())
        {
            InGraphPinType.PinCategory = UEdGraphSchema_K2::PC_Struct;
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
        if (InPinValueType.PinSubCategoryObject)
        {
            if (InPinValueType.PinSubCategoryObject->IsA<UScriptStruct>())
            {
                PinType.PinValueType.TerminalCategory = UEdGraphSchema_K2::PC_Struct;
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
#if ENGINE_MINOR_VERSION <= 23
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

void UPEBlueprintAsset::AddFunction(FName InName, bool IsVoid, FPEGraphPinType InGraphPinType, FPEGraphTerminalType InPinValueType)
{
    UClass* SuperClass = GeneratedClass->GetSuperClass();

    UFunction* ParentFunction = SuperClass->FindFunctionByName(InName);

    UFunction* Function = GeneratedClass->FindFunctionByName(InName, EIncludeSuperFlag::ExcludeSuper);

    if (ParentFunction && Function)
    {
        ParameterNames.Empty();
        ParameterTypes.Empty();
        return;
    }

    TArray<FName> AxisNames;
    GetDefault<UInputSettings>()->GetAxisNames(AxisNames);

    // Create the function graph.
    
    const bool bUserCreated = true;
    if (ParentFunction)
    {
        //UE_LOG(LogTemp, Warning, TEXT("Override Function %s"), *ParentFunction->GetName());
        //FBlueprintEditorUtils::AddFunctionGraph(Blueprint, FunctionGraph, bUserCreated, ParentFunction);
        UFunction* OverrideFunc = nullptr;
#if ENGINE_MINOR_VERSION <= 23
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
            //UK2Node_Event* ExistingNode = FBlueprintEditorUtils::FindOverrideForFunction(Blueprint, OverrideFuncClass, EventName);

            //if (!ExistingNode)
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
            NeedSave = true;
        }
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
            FunctionGraph = FBlueprintEditorUtils::CreateNewGraph(
                Blueprint,
                InName, //FBlueprintEditorUtils::FindUniqueKismetName(Blueprint, FuncName.ToString()),
                UEdGraph::StaticClass(),
                UEdGraphSchema_K2::StaticClass());
            FBlueprintEditorUtils::AddFunctionGraph<UClass>(Blueprint, FunctionGraph, bUserCreated, nullptr);
        }

        //TODO: Add parameter
        TArray<UK2Node_FunctionEntry*> EntryNodes;
        FunctionGraph->GetNodesOfClass(EntryNodes);

        if (EntryNodes.Num() == 1)
        {
            //FEdGraphPinType StringPinType(UEdGraphSchema_K2::PC_String, NAME_None, nullptr, EPinContainerType::None, false, FEdGraphTerminalType());
            //FEdGraphPinType ActorPinType(UEdGraphSchema_K2::PC_Object, NAME_None, AActor::StaticClass(), EPinContainerType::None, false, FEdGraphTerminalType());
            //EntryNodes[0]->CreateUserDefinedPin(TEXT("P1"), StringPinType, EGPD_Output);
            //EntryNodes[0]->CreateUserDefinedPin(TEXT("P2"), ActorPinType, EGPD_Input, false);
            UK2Node_FunctionEntry* EntryNode = EntryNodes[0];
            TArray<TSharedPtr<FUserPinInfo>> OldUserDefinedPins = EntryNode->UserDefinedPins;

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
                    EntryNode->RemoveUserDefinedPin(pinInfo);
                }
                for (int i = 0; i < ParameterNames.Num(); i++)
                {
                    EntryNodes[0]->CreateUserDefinedPin(ParameterNames[i], ParameterTypes[i], EGPD_Output);
                }
            }

            bool RetChanged = false;

            const FName RetValName = FName(TEXT("ReturnValue"));

            if (!IsVoid)
            {
                FEdGraphPinType PinType = ToFEdGraphPinType(InGraphPinType, InPinValueType);
                //EntryNodes[0]->CreateUserDefinedPin(RetValName, PinType, EGPD_Input, false);
                auto FunctionResultNode = FBlueprintEditorUtils::FindOrCreateFunctionResultNode(EntryNodes[0]);

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
                auto FunctionResultNode = FBlueprintEditorUtils::FindOrCreateFunctionResultNode(EntryNodes[0]);

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

            //UE_LOG(LogTemp, Error, TEXT("function %s, %d, %d "), *InName.ToString(), ParameterChanged, RetChanged);
        }
        FunctionAdded.Add(InName);
    }

    ParameterNames.Empty();
    ParameterTypes.Empty();
}

void UPEBlueprintAsset::ClearParameter()
{
    ParameterNames.Empty();
    ParameterTypes.Empty();
}

void UPEBlueprintAsset::AddMemberVariable(FName NewVarName, FPEGraphPinType InGraphPinType, FPEGraphTerminalType InPinValueType)
{
    
    FEdGraphPinType PinType = ToFEdGraphPinType(InGraphPinType, InPinValueType);

    const int32 VarIndex = FBlueprintEditorUtils::FindNewVariableIndex(Blueprint, NewVarName);
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
    MemberVariableAdded.Add(NewVarName);
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
        auto Removed = Blueprint->FunctionGraphs.RemoveAll([&](UEdGraph* Graph) { return !FunctionAdded.Contains(Graph->GetFName()); });
        NeedSave = NeedSave || (Removed > 0);
    }
    FunctionAdded.Empty();
}

void UPEBlueprintAsset::Save()
{
    if (Blueprint && NeedSave)
    {
        FKismetEditorUtilities::CompileBlueprint(Blueprint);

        TArray<UPackage*> PackagesToSave;
        PackagesToSave.Add(Package);
        FEditorFileUtils::PromptForCheckoutAndSave(PackagesToSave, false, false);
    }
}

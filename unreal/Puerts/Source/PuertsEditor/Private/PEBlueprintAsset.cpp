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

bool UPEBlueprintAsset::LoadOrCreate(const FString& InName, const FString& InPath, UClass* ParentClass)
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
    if ((EPinContainerType)InGraphPinType.PinContainerType == EPinContainerType::None && InGraphPinType.PinSubCategoryObject && InGraphPinType.PinCategory == UEdGraphSchema_K2::PC_Object)
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

void UPEBlueprintAsset::AddFunction(FName InName, bool IsVoid, FPEGraphPinType InGraphPinType, FPEGraphTerminalType InPinValueType, int32 InFlags)
{
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
    else if (InFlags & FUNC_Net)
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
        const int32 NetMask = FUNC_Net | FUNC_NetMulticast | FUNC_NetServer | FUNC_NetClient;
        int32 NetFlags = InFlags & NetMask;
        NetFlags = NetFlags ? FUNC_Net | NetFlags : 0;

        if (UK2Node_FunctionEntry* TypedEntryNode = Cast<UK2Node_FunctionEntry>(FunctionEntryNode))
        {
            int32 ExtraFlags = TypedEntryNode->GetExtraFlags();

            if ((ExtraFlags & NetMask) != NetFlags)
            {
                ExtraFlags &= ~NetMask;
                ExtraFlags |= NetFlags;
                TypedEntryNode->SetExtraFlags(ExtraFlags);
                NeedSave = true;
            }
        }
        else if (UK2Node_CustomEvent* CustomEventNode = Cast<UK2Node_CustomEvent>(FunctionEntryNode))
        {
            if ((CustomEventNode->FunctionFlags & NetMask) != NetFlags)
            {
                CustomEventNode->FunctionFlags &= ~NetMask;
                CustomEventNode->FunctionFlags |= NetFlags;
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

        if (InLifetimeCondition < COND_Max && Variable.ReplicationCondition != InLifetimeCondition)
        {
            Variable.ReplicationCondition = (ELifetimeCondition)InLifetimeCondition;
            NeedSave = true;
        }
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

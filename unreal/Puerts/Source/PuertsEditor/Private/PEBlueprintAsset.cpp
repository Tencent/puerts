/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
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
#include "PuertsModule.h"

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

DEFINE_LOG_CATEGORY_STATIC(PuertsEditorModule, Log, All);

static bool IsPlaying()
{
    return GEditor && IPuertsModule::IsInPIEMode();
}

#define CanChangeCheckWithBoolRet()                                                                        \
    if (IsPlaying())                                                                                       \
    {                                                                                                      \
        UE_LOG(PuertsEditorModule, Error, TEXT("change the layout of class[%s] in PIE mode is forbiden!"), \
            *GeneratedClass->GetName());                                                                   \
        NeedSave = false;                                                                                  \
        return false;                                                                                      \
    }

#define CanChangeCheck()                                                                                   \
    if (IsPlaying())                                                                                       \
    {                                                                                                      \
        UE_LOG(PuertsEditorModule, Error, TEXT("change the layout of class[%s] in PIE mode is forbiden!"), \
            *GeneratedClass->GetName());                                                                   \
        NeedSave = false;                                                                                  \
        return;                                                                                            \
    }

bool UPEBlueprintAsset::LoadOrCreate(
    const FString& InName, const FString& InPath, UClass* ParentClass, int32 InSetFlags, int32 InClearFlags)
{
    FString PackageName = FString(TEXT("/Game/Blueprints/TypeScript/")) / InPath / InName;

    // UE_LOG(LogTemp, Warning, TEXT("LoadOrCreate.PackageName: %s"), *PackageName);

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
            CanChangeCheckWithBoolRet();
            Blueprint->ParentClass = ParentClass;
            NeedSave = true;
        }
        else
        {
            NeedSave = false;
        }
        return true;
    }

    if (!ParentClass)
        return false;

    if (IsPlaying())
    {
        UE_LOG(PuertsEditorModule, Error, TEXT("create class[%s] in PIE mode is forbiden!"), *InName);
        return false;
    }

    NeedSave = true;

    UClass* BlueprintClass = UBlueprint::StaticClass();
    UClass* BlueprintGeneratedClass = UTypeScriptGeneratedClass::StaticClass();

    if (!ParentClass->IsChildOf(AActor::StaticClass()))
    {
        BlueprintClass = UTypeScriptBlueprint::StaticClass();
    }

    // UE_LOG(LogTemp, Warning, TEXT("BlueprintClass: %s"), *BlueprintClass->GetName());
    // UE_LOG(LogTemp, Warning, TEXT("BlueprintGeneratedClass: %s"), *BlueprintGeneratedClass->GetName());

    // FString Name;
    // FAssetToolsModule& AssetToolsModule = FModuleManager::LoadModuleChecked<FAssetToolsModule>("AssetTools");
    // AssetToolsModule.Get().CreateUniqueAssetName(PackageName, TEXT(""), PackageName, Name);

    // UE_LOG(LogTemp, Warning, TEXT("Name: %s, PackageName: %s, InName:%s, InPath:%s"), *Name, *PackageName, *InName, *InPath);

#if ENGINE_MINOR_VERSION < 26 && ENGINE_MAJOR_VERSION <= 4
    Package = CreatePackage(NULL, *PackageName);
#else
    Package = CreatePackage(*PackageName);
#endif
    check(Package);

    EBlueprintType BlueprintType =
        ParentClass && ParentClass->IsChildOf(UBlueprintFunctionLibrary::StaticClass()) ? BPTYPE_FunctionLibrary : BPTYPE_Normal;
    // Create and init a new Blueprint
    Blueprint = FKismetEditorUtilities::CreateBlueprint(
        ParentClass, Package, *InName, BlueprintType, BlueprintClass, BlueprintGeneratedClass, FName("PuertsAutoGen"));
    if (Blueprint)
    {
        // static FName InterfaceClassName = FName(TEXT("TypeScriptObject"));
        // FBlueprintEditorUtils::ImplementNewInterface(Blueprint, InterfaceClassName);
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

bool UPEBlueprintAsset::LoadOrCreateWithMetaData(const FString& InName, const FString& InPath, UClass* InParentClass,
    int32 InSetFlags, int32 InClearFlags, UPEClassMetaData* InMetaData)
{
    if (!IsValid(InParentClass))
    {    // the parent class should be valid
        return false;
    }

    if (!LoadOrCreate(InName, InPath, InParentClass, InSetFlags, InClearFlags))
    {    //	create the class
        return false;
    }

    if (IsValid(InMetaData))
    {    //	apply the meta data
        NeedSave = InMetaData->Apply(GeneratedClass, Blueprint) || NeedSave;
        if (NeedSave)
            CanChangeCheckWithBoolRet();
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
        for (const FName& Name : GraphNames)
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
        (EPinContainerType) InGraphPinType.PinContainerType, InGraphPinType.bIsReference, FEdGraphTerminalType());
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
    ParameterIsIn.Add(InGraphPinType.bIn);
    ParameterTypes.Add(ToFEdGraphPinType(InGraphPinType, InPinValueType));
}

void UPEBlueprintAsset::AddParameterWithMetaData(
    FName InParameterName, FPEGraphPinType InGraphPinType, FPEGraphTerminalType InPinValueType, UPEParamMetaData* InMetaData)
{
    ParameterNames.Add(InParameterName);
    ParameterIsIn.Add(InGraphPinType.bIn);
    FEdGraphPinType PinType = ToFEdGraphPinType(InGraphPinType, InPinValueType);
    if (IsValid(InMetaData))
    {
        if (InMetaData->Apply(PinType))
        {
            // "Currently Parameter Type Don't Affect NeedSava In Add Parameter Process"
        }
    }
    ParameterTypes.Add(PinType);
}

static TArray<UK2Node_EditablePinBase*> GatherAllResultNodes(UK2Node_EditablePinBase* TargetNode)
{
    TArray<UK2Node_EditablePinBase*> Result;
    if (UK2Node_FunctionResult* ResultNode = Cast<UK2Node_FunctionResult>(TargetNode))
    {
        for (auto& Node : ResultNode->GetAllResultNodes())
        {
            if (Node)
            {
                Result.Add(Node);
            }
        }
        return Result;
    }

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
    for (UClass* TempClass = Blueprint->ParentClass; (nullptr != TempClass) && (nullptr == Function);
         TempClass = TempClass->GetSuperClass())
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
        // search up the class hierarchy, we want to find the original declaration of the function to match
        // FBlueprintEventNodeSpawner. Doing so ensures that we can find the existing node if there is one:
        const UClass* Iter = Blueprint->SkeletonGeneratedClass->GetSuperClass();
        while (Iter != nullptr && OverrideFunc == nullptr)
        {
            if (UFunction* F = Iter->FindFunctionByName(FuncName))
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

void UPEBlueprintAsset::AddFunction(FName InName, bool IsVoid, FPEGraphPinType InGraphPinType, FPEGraphTerminalType InPinValueType,
    int32 InSetFlags, int32 InClearFlags)
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
        // UE_LOG(LogTemp, Warning, TEXT("Override Function %s"), *ParentFunction->GetName());
        // FBlueprintEditorUtils::AddFunctionGraph(Blueprint, FunctionGraph, bUserCreated, ParentFunction);
        UFunction* OverrideFunc = nullptr;
#if ENGINE_MINOR_VERSION <= 23 && ENGINE_MAJOR_VERSION < 5
        UClass* const OverrideFuncClass = GetOverrideFunctionClass(Blueprint, InName, &OverrideFunc);
#else
        UClass* const OverrideFuncClass = FBlueprintEditorUtils::GetOverrideFunctionClass(Blueprint, InName, &OverrideFunc);
#endif
        check(OverrideFunc);

        UEdGraph* EventGraph = FBlueprintEditorUtils::FindEventGraph(Blueprint);

        if (UEdGraphSchema_K2::FunctionCanBePlacedAsEvent(OverrideFunc) &&
            !IsImplementationDesiredAsFunction(Blueprint, OverrideFunc) && EventGraph)
        {
            // Add to event graph
            FName EventName = OverrideFunc->GetFName();
            UK2Node_Event* ExistingNode = FBlueprintEditorUtils::FindOverrideForFunction(Blueprint, OverrideFuncClass, EventName);

            if (!ExistingNode && !Function)
            {
                ExistingNode = FBlueprintEditorUtils::FindOverrideForFunction(Blueprint, UObject::StaticClass(), EventName);
                if (ExistingNode)
                {
                    if (!ExistingNode->IsNodeEnabled())
                    {
                        CanChangeCheck();
                        ExistingNode->SetEnabledState(ENodeEnabledState::Enabled);
                        ExistingNode->NodeComment.Empty();
                        NeedSave = true;
                    }
                }
                else
                {
                    CanChangeCheck();
                    UK2Node_Event* NewEventNode = FEdGraphSchemaAction_K2NewNode::SpawnNode<UK2Node_Event>(EventGraph,
                        EventGraph->GetGoodPlaceForNewNode(), EK2NewNodeFlags::SelectNewNode,
                        [EventName, OverrideFuncClass](UK2Node_Event* NewInstance)
                        {
                            NewInstance->EventReference.SetExternalMember(EventName, OverrideFuncClass);
                            NewInstance->bOverrideFunction = true;
                        });
                    NeedSave = true;
                }
            }
            OverrideAdded.Add(InName);
        }
        else
        {
            if (FunctionAdded.Contains(InName))
                return;
            UEdGraph* const ExistingGraph = FindObject<UEdGraph>(Blueprint, *InName.ToString());
            if (!ExistingGraph)
            {
                CanChangeCheck();
                const FScopedTransaction Transaction(LOCTEXT("CreateOverrideFunctionGraph", "Create Override Function Graph"));
                Blueprint->Modify();
                // Implement the function graph
                UEdGraph* const NewGraph = FBlueprintEditorUtils::CreateNewGraph(
                    Blueprint, InName, UEdGraph::StaticClass(), UEdGraphSchema_K2::StaticClass());
                FBlueprintEditorUtils::AddFunctionGraph(Blueprint, NewGraph, /*bIsUserCreated=*/false, OverrideFuncClass);
                NewGraph->Modify();
                NeedSave = true;
            }
            FunctionAdded.Add(InName);
        }

        ParameterNames.Empty();
        ParameterIsIn.Empty();
        ParameterTypes.Empty();
        return;
    }
    else if (AxisNames.Contains(InName))
    {
        TArray<UK2Node_InputAxisEvent*> AllEvents;
        // TODO: K2Node_InputTouchEvent,K2Node_InputVectorAxisEvent,K2Node_InputAxisKeyEvent,UK2Node_InputKeyEvent
        FBlueprintEditorUtils::GetAllNodesOfClass<UK2Node_InputAxisEvent>(Blueprint, AllEvents);

        UEdGraph* EventGraph = FBlueprintEditorUtils::FindEventGraph(Blueprint);

        if (EventGraph && !AllEvents.FindByPredicate([&](UK2Node_InputAxisEvent* Node) { return Node->InputAxisName == InName; }))
        {
            CanChangeCheck();
            // UE_LOG(LogTemp, Warning, TEXT("Add Axis: %s"), *InName.ToString());
            FEdGraphSchemaAction_K2NewNode::SpawnNode<UK2Node_InputAxisEvent>(EventGraph, EventGraph->GetGoodPlaceForNewNode(),
                EK2NewNodeFlags::SelectNewNode, [InName](UK2Node_InputAxisEvent* NewInstance) { NewInstance->Initialize(InName); });
            NeedSave = true;
        }
    }
    // Create Action node and PrintString node
    // then Connection them.
    // UK2Node_InputAction Node must have one connected node to create function "InpActEvt_%s_%s"
    else if (ActionNames.Contains(InName))
    {
        TArray<UK2Node_InputAction*> AllEvents;
        FBlueprintEditorUtils::GetAllNodesOfClass<UK2Node_InputAction>(Blueprint, AllEvents);

        UEdGraph* EventGraph = FBlueprintEditorUtils::FindEventGraph(Blueprint);

        if (EventGraph && !AllEvents.FindByPredicate([&](UK2Node_InputAction* Node) { return Node->InputActionName == InName; }))
        {
            CanChangeCheck();
            UK2Node_InputAction* NewNode = FEdGraphSchemaAction_K2NewNode::SpawnNode<UK2Node_InputAction>(EventGraph,
                EventGraph->GetGoodPlaceForNewNode(), EK2NewNodeFlags::SelectNewNode,
                [InName](UK2Node_InputAction* NewInstance) { NewInstance->InputActionName = InName; });
            // UK2Node_CallFunction
            UK2Node_CallFunction* NewNode2 = FEdGraphSchemaAction_K2NewNode::SpawnNode<UK2Node_CallFunction>(EventGraph,
                EventGraph->GetGoodPlaceForNewNode(), EK2NewNodeFlags::SelectNewNode,
                [InName](UK2Node_CallFunction* NewInstance)
                { NewInstance->FunctionReference.SetExternalMember(FName("PrintString"), UKismetSystemLibrary::StaticClass()); });

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
                CanChangeCheck();
                //处理标签改变的情况
                Blueprint->FunctionGraphs.RemoveAll([&](UEdGraph* Graph) { return Graph->GetFName() == InName; });

                UEdGraph* ExistingGraph = FindObject<UEdGraph>(Blueprint, *(InName.ToString()));
                if (ExistingGraph)
                {
                    ExistingGraph->Rename(*FString::Printf(TEXT("%s%s"), *ExistingGraph->GetName(), TEXT("__Removed")), nullptr,
                        REN_DontCreateRedirectors | REN_DoNotDirty | REN_ForceNoResetLoaders);
                }

                UK2Node_CustomEvent* EventNode = FEdGraphSchemaAction_K2NewNode::SpawnNode<UK2Node_CustomEvent>(EventGraph,
                    EventGraph->GetGoodPlaceForNewNode(), EK2NewNodeFlags::SelectNewNode,
                    [InName](UK2Node_Event* NewInstance)
                    {
                        NewInstance->CustomFunctionName = InName;
                        NewInstance->bIsEditable = true;
                    });

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
        if (FunctionAdded.Contains(InName))
            return;
        TArray<UEdGraph*> GraphList;
        Blueprint->GetAllGraphs(GraphList);
        UEdGraph** ExistedGraph = GraphList.FindByPredicate([&](UEdGraph* Graph) { return Graph->GetFName() == InName; });
        UEdGraph* FunctionGraph;
        if (ExistedGraph)
        {
            // UE_LOG(LogTemp, Warning, TEXT("FunctionGraph %s existed, delete it!"), *InName.ToString());
            // FBlueprintEditorUtils::RemoveGraph(Blueprint, *ExistedGraph);
            FunctionGraph = *ExistedGraph;
        }
        else
        {
            CanChangeCheck();
            UEdGraph* EventGraph = FBlueprintEditorUtils::FindEventGraph(Blueprint);
            if (EventGraph)
            {
                EventGraph->Nodes.RemoveAll(
                    [&](UEdGraphNode* GraphNode)
                    {
                        UK2Node_CustomEvent* CustomEvent = Cast<UK2Node_CustomEvent>(GraphNode);
                        return CustomEvent && CustomEvent->CustomFunctionName == InName;
                    });
                UEdGraph* ExistingGraph = FindObject<UEdGraph>(Blueprint, *(InName.ToString()));
                if (ExistingGraph)
                {
                    ExistingGraph->Rename(*FString::Printf(TEXT("%s%s"), *ExistingGraph->GetName(), TEXT("__Removed")), nullptr,
                        REN_DontCreateRedirectors | REN_DoNotDirty | REN_ForceNoResetLoaders);
                }
            }
            FunctionGraph = FBlueprintEditorUtils::CreateNewGraph(Blueprint,
                InName,    // FBlueprintEditorUtils::FindUniqueKismetName(Blueprint, FuncName.ToString()),
                UEdGraph::StaticClass(), UEdGraphSchema_K2::StaticClass());
            FBlueprintEditorUtils::AddFunctionGraph<UClass>(Blueprint, FunctionGraph, bUserCreated, nullptr);
            NeedSave = true;
        }

        // if (InFlags)
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

            int32 NewExtraFlags = ((ExtraFlags & ~NetMask) | InSetFlags) & ~InClearFlags;

            if (ExtraFlags != NewExtraFlags)
            {
                CanChangeCheck();
                TypedEntryNode->SetExtraFlags(NewExtraFlags);
                NeedSave = true;
            }
        }
        else if (UK2Node_CustomEvent* CustomEventNode = Cast<UK2Node_CustomEvent>(FunctionEntryNode))
        {
            int32 NewFunctionFlags = ((CustomEventNode->FunctionFlags & ~NetMask) | InSetFlags) & ~InClearFlags;
            if (CustomEventNode->FunctionFlags != NewFunctionFlags)
            {
                CanChangeCheck();
                CustomEventNode->FunctionFlags = NewFunctionFlags;
                NeedSave = true;
            }
        }

        TArray<TSharedPtr<FUserPinInfo>> OldUserDefinedPins = FunctionEntryNode->UserDefinedPins;

        TArray<TPair<FName, FEdGraphPinType>> InputParameterTypes;
        TArray<TPair<FName, FEdGraphPinType>> OutputParameterTypes;

        for (int i = 0; i < ParameterTypes.Num(); ++i)
        {
            FEdGraphPinType ParameterType = ParameterTypes[i];
            if (ParameterType.bIsReference && !ParameterIsIn[i])
            {
                ParameterType.bIsReference = false;
                OutputParameterTypes.Add(TPair<FName, FEdGraphPinType>(ParameterNames[i], ParameterType));
            }
            else
            {
                InputParameterTypes.Add(TPair<FName, FEdGraphPinType>(ParameterNames[i], ParameterType));
            }
        }

        bool ParameterChanged = OldUserDefinedPins.Num() != InputParameterTypes.Num();

        if (!ParameterChanged)
        {
            for (int i = 0; i < OldUserDefinedPins.Num(); i++)
            {
                if (OldUserDefinedPins[i]->PinType != InputParameterTypes[i].Value)
                {
                    CanChangeCheck();
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
            for (int i = 0; i < InputParameterTypes.Num(); i++)
            {
                FunctionEntryNode->CreateUserDefinedPin(InputParameterTypes[i].Key, InputParameterTypes[i].Value, EGPD_Output);
            }
        }

        auto TryAddOutput = [](TArray<UK2Node_EditablePinBase*> TargetNodes, FName PinName, const FEdGraphPinType& PinType) -> bool
        {
            bool Changed = false;
            for (UK2Node_EditablePinBase* Node : TargetNodes)
            {
                TArray<TSharedPtr<FUserPinInfo>> OldUserDefinedReturnPins = Node->UserDefinedPins;
                auto Old = Node->UserDefinedPins.FindByPredicate(
                    [&PinName](const TSharedPtr<FUserPinInfo>& UDPin) { return UDPin.IsValid() && (UDPin->PinName == PinName); });
                if (!Old || (*Old)->PinType != PinType)
                {
                    Changed = true;
                    if (Old)
                    {
                        Node->RemoveUserDefinedPinByName(PinName);
                    }
                    Node->CreateUserDefinedPin(PinName, PinType, EGPD_Input, false);
                }
            }
            return Changed;
        };

        bool RetChanged = false;

        const FName RetValName = FName(TEXT("ReturnValue"));

        if (!IsVoid && !IsCustomEvent)
        {
            FEdGraphPinType PinType = ToFEdGraphPinType(InGraphPinType, InPinValueType);
            auto FunctionResultNode = FBlueprintEditorUtils::FindOrCreateFunctionResultNode(FunctionEntryNode);
            RetChanged = RetChanged || TryAddOutput(GatherAllResultNodes(FunctionResultNode), RetValName, PinType);
        }
        else if (IsCustomEvent || (IsVoid && OutputParameterTypes.Num() == 0))
        {
            UEdGraph* Graph = FunctionEntryNode->GetGraph();

            TArray<UK2Node_FunctionResult*> ResultNodes;
            if (Graph)
            {
                Graph->GetNodesOfClass(ResultNodes);
            }

            if (ResultNodes.Num() == 1)
            {
                auto FunctionResultNode = ResultNodes[0];

                TArray<UK2Node_EditablePinBase*> TargetNodes = GatherAllResultNodes(FunctionResultNode);
                for (UK2Node_EditablePinBase* Node : TargetNodes)
                {
                    TArray<TSharedPtr<FUserPinInfo>> OldUserDefinedReturnPins = Node->UserDefinedPins;
                    RetChanged = RetChanged || (OldUserDefinedReturnPins.Num() != 0);

                    if (RetChanged)
                    {
                        CanChangeCheck();
                        Node->Modify();
                        for (TSharedPtr<FUserPinInfo> pinInfo : OldUserDefinedReturnPins)
                        {
                            Node->RemoveUserDefinedPin(pinInfo);
                        }
                    }
                }
            }
        }

        if (!IsCustomEvent && OutputParameterTypes.Num() > 0)
        {
            auto FunctionResultNode = FBlueprintEditorUtils::FindOrCreateFunctionResultNode(FunctionEntryNode);
            TArray<UK2Node_EditablePinBase*> TargetNodes = GatherAllResultNodes(FunctionResultNode);
            TSet<FName> OutputSet;
            for (auto& Pair : OutputParameterTypes)
            {
                RetChanged = RetChanged || TryAddOutput(TargetNodes, Pair.Key, Pair.Value);
                if (RetChanged)
                    CanChangeCheck();
                OutputSet.Add(Pair.Key);
            }
            OutputSet.Add(RetValName);
            for (UK2Node_EditablePinBase* Node : TargetNodes)
            {
                for (TSharedPtr<FUserPinInfo> UserDefinedPin : Node->UserDefinedPins)
                {
                    if (!OutputSet.Contains(UserDefinedPin->PinName))
                    {
                        CanChangeCheck();
                        RetChanged = true;
                        Node->RemoveUserDefinedPinByName(UserDefinedPin->PinName);
                    }
                }
            }
        }

        NeedSave = NeedSave || ParameterChanged || RetChanged;
    }

    ParameterNames.Empty();
    ParameterIsIn.Empty();
    ParameterTypes.Empty();
}

void UPEBlueprintAsset::AddFunctionWithMetaData(FName InName, bool IsVoid, FPEGraphPinType InGraphPinType,
    FPEGraphTerminalType InPinValueType, int32 InSetFlags, int32 InClearFlags, UPEFunctionMetaData* InMetaData)
{
    //	a helper function used to find custom event by name
    static const auto FindCustomEvent = [](UBlueprint* InBlueprint, FName InName) -> UK2Node_CustomEvent*
    {
        if (!IsValid(InBlueprint))
        {
            return nullptr;
        }

        TArray<UK2Node_CustomEvent*> Result;
        FBlueprintEditorUtils::GetAllNodesOfClass<UK2Node_CustomEvent>(InBlueprint, Result);

        const auto pFindResult = Result.FindByPredicate(
            [Name = InName](const UK2Node_CustomEvent* InEvent) -> bool { return InEvent->CustomFunctionName == Name; });

        return pFindResult == nullptr ? nullptr : *pFindResult;
    };

    //	a helper function used to find function entry of a function
    static const auto FindFunctionEntry = [](UBlueprint* InBlueprint, FName InName) -> UK2Node_FunctionEntry*
    {
        if (!IsValid(InBlueprint))
        {
            return nullptr;
        }

        TArray<UEdGraph*> Graphs;
        InBlueprint->GetAllGraphs(Graphs);

        const auto pFunctionGraph =
            Graphs.FindByPredicate([Name = InName](const UEdGraph* InGraph) { return InGraph->GetFName() == Name; });
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
        NeedSave = InMetaData->Apply(CustomEvent) || NeedSave;
    }
    else if (UK2Node_FunctionEntry* FunctionEntry = FindFunctionEntry(Blueprint, InName))
    {
        NeedSave = InMetaData->Apply(FunctionEntry) || NeedSave;
    }
    else
    {
        UE_LOG(LogTemp, Warning, TEXT("Currently, Only Custom Event and Function Graph Support MetaData"));
    }
    if (NeedSave)
        CanChangeCheck();
}

void UPEBlueprintAsset::ClearParameter()
{
    ParameterNames.Empty();
    ParameterIsIn.Empty();
    ParameterTypes.Empty();
}

void UPEBlueprintAsset::AddMemberVariable(FName NewVarName, FPEGraphPinType InGraphPinType, FPEGraphTerminalType InPinValueType,
    int32 InLFlags, int32 InHFlags, int32 InLifetimeCondition)
{
    uint64 InFlags = (uint64) InHFlags << 32 | InLFlags;
    FEdGraphPinType PinType = ToFEdGraphPinType(InGraphPinType, InPinValueType);

    int32 VarIndex = FBlueprintEditorUtils::FindNewVariableIndex(Blueprint, NewVarName);
    if (VarIndex == INDEX_NONE)
    {
        CanChangeCheck();
        FBlueprintEditorUtils::AddMemberVariable(Blueprint, NewVarName, PinType);
        NeedSave = true;
    }
    else
    {
        FBPVariableDescription& Variable = Blueprint->NewVariables[VarIndex];
        if (Variable.VarType != PinType)
        {
            CanChangeCheck();
            FBlueprintEditorUtils::ChangeMemberVariableType(Blueprint, NewVarName, PinType);
            NeedSave = true;
        }
        // else
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
            CanChangeCheck();
            Variable.PropertyFlags &= ~NetMask;
            Variable.PropertyFlags |= NetFlags;
            if (Variable.PropertyFlags & CPF_RepNotify)
            {
                FString NewFuncNameStr = FString::Printf(TEXT("OnRep_%s"), *NewVarName.ToString());
                FName NewFuncName = FName(*NewFuncNameStr);
                UEdGraph* FuncGraph = FindObject<UEdGraph>(Blueprint, *NewFuncNameStr);
                if (!FuncGraph)
                {
                    FuncGraph = FBlueprintEditorUtils::CreateNewGraph(
                        Blueprint, NewFuncName, UEdGraph::StaticClass(), UEdGraphSchema_K2::StaticClass());
                    FBlueprintEditorUtils::AddFunctionGraph<UClass>(Blueprint, FuncGraph, false, NULL);
                }

                FunctionAdded.Add(NewFuncName);

                Blueprint->NewVariables[VarIndex].RepNotifyFunc = NewFuncName;
            }
            NeedSave = true;
        }

        if ((Variable.PropertyFlags & CPF_DisableEditOnInstance) != (InFlags & CPF_DisableEditOnInstance))
        {
            CanChangeCheck();
            if (InFlags & CPF_DisableEditOnInstance)
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
            CanChangeCheck();
            Variable.ReplicationCondition = (ELifetimeCondition) InLifetimeCondition;
            NeedSave = true;
        }
    }
    MemberVariableAdded.Add(NewVarName);
}

void UPEBlueprintAsset::AddMemberVariableWithMetaData(FName InNewVarName, FPEGraphPinType InGraphPinType,
    FPEGraphTerminalType InPinValueType, int32 InLFlags, int32 InHFLags, int32 InLifetimeCondition, UPEPropertyMetaData* InMetaData)
{
    if (IsValid(InMetaData))
    {    //	handle the conflict here
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
    NeedSave = InMetaData->Apply(Blueprint->NewVariables[VarIndex]) || NeedSave;
    if (NeedSave)
        CanChangeCheck();
}

void UPEBlueprintAsset::RemoveNotExistedMemberVariable()
{
    if (IsPlaying())
    {
        return;
    }
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
    if (IsPlaying())
    {
        return;
    }
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
                UEdGraph* UCSGraph = FBlueprintEditorUtils::CreateNewGraph(Blueprint, UEdGraphSchema_K2::FN_UserConstructionScript,
                    UEdGraph::StaticClass(), UEdGraphSchema_K2::StaticClass());
                FBlueprintEditorUtils::AddFunctionGraph(Blueprint, UCSGraph, /*bIsUserCreated=*/false, AActor::StaticClass());
                UCSGraph->bAllowDeletion = false;
                NeedSave = true;
            }
            FunctionAdded.Add(UEdGraphSchema_K2::FN_UserConstructionScript);
        }

        auto RemovedFunction =
            Blueprint->FunctionGraphs.RemoveAll([&](UEdGraph* Graph) { return !FunctionAdded.Contains(Graph->GetFName()); });
        NeedSave = NeedSave || (RemovedFunction > 0);

        UEdGraph* EventGraph = FBlueprintEditorUtils::FindEventGraph(Blueprint);
        if (EventGraph)
        {
            auto RemovedCustomEvent = EventGraph->Nodes.RemoveAll(
                [&](UEdGraphNode* GraphNode)
                {
                    UK2Node_CustomEvent* CustomEvent = Cast<UK2Node_CustomEvent>(GraphNode);
                    return CustomEvent && !FunctionAdded.Contains(CustomEvent->CustomFunctionName);
                });
            NeedSave = NeedSave || (RemovedCustomEvent > 0);

            auto RemoveOverrideEvent = EventGraph->Nodes.RemoveAll(
                [&](UEdGraphNode* GraphNode)
                {
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
        if (NeedSave)
            CanChangeCheck();
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

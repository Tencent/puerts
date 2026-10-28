/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "JSGeneratedClass.h"
#include "JSGeneratedFunction.h"
#include "JSLogger.h"

// UE 5.8 deprecates REN_ForceNoResetLoaders: UObject::Rename no longer calls ResetLoaders, so the flag has no effect
// there. Earlier engines keep it, where Rename would otherwise reset the package loaders.
#if ENGINE_MAJOR_VERSION > 5 || (ENGINE_MAJOR_VERSION == 5 && ENGINE_MINOR_VERSION >= 8)
#define PUERTS_RENAME_FLAGS (REN_DontCreateRedirectors | REN_DoNotDirty)
#else
#define PUERTS_RENAME_FLAGS (REN_DontCreateRedirectors | REN_DoNotDirty | REN_ForceNoResetLoaders)
#endif

#define MIXIN_METHOD_SUFFIX "__puerts_mixin__"

UFunction* UJSGeneratedClass::Mixin(UClass* Class, UFunction* Super,
    TSharedPtr<PUERTS_NAMESPACE::IDynamicInvoker, ESPMode::ThreadSafe> DynamicInvoker, bool TakeJsObjectRef, bool Warning)
{
    bool Existed = Super->GetOuter() == Class;

    if (!Existed)
    {
        UFunction* Tmp =
            Cast<UFunction>(StaticDuplicateObject(Super, Class, Super->GetFName(), RF_AllFlags, UFunction::StaticClass()));
        Tmp->SetSuperStruct(Super);
        Tmp->Next = Class->Children;
        Class->Children = Tmp;
        Class->AddFunctionToFunctionMap(Tmp, Tmp->GetFName());
        Tmp->SetFlags(Tmp->GetFlags() | RF_Transient);
        Super = Tmp;
        Super->ClearInternalFlags(EInternalObjectFlags::Native);
        Super->StaticLink(true);
    }
    auto MaybeJSFunction = Cast<UJSGeneratedFunction>(Super);
    if (!MaybeJSFunction)
    {
        MaybeJSFunction = UJSGeneratedFunction::GetJSGeneratedFunctionFromScript(Super);
    }
    if (MaybeJSFunction)
    {
        if (Warning)
        {
            UE_LOG(Puerts, Warning, TEXT("Try to mixin a function[%s:%s] already mixin by anthor vm"), *Class->GetName(),
                *Super->GetName());
        }
        return MaybeJSFunction;
    }

    const FString FunctionName = *FString::Printf(TEXT("%s%s"), *Super->GetName(), TEXT(MIXIN_METHOD_SUFFIX));

    // "Failed to bind native" warning
    Class->AddNativeFunction(*FunctionName, &UJSGeneratedFunction::execCallMixin);
    UJSGeneratedFunction* Function = Cast<UJSGeneratedFunction>(
        StaticDuplicateObject(Super, Class, *FunctionName, RF_AllFlags, UJSGeneratedFunction::StaticClass()));
    Function->SetFlags(Function->GetFlags() | RF_Transient);

    for (TFieldIterator<UFunction> It(Class, EFieldIteratorFlags::IncludeSuper, EFieldIteratorFlags::ExcludeDeprecated,
             EFieldIteratorFlags::IncludeInterfaces);
         It; ++It)
    {
        if (*It == Function)
        {
            return Function;
        }
    }

    Function->SetSuperStruct(Super->GetSuperStruct());

    Function->DynamicInvoker = DynamicInvoker;
    Function->FunctionTranslator = std::make_unique<PUERTS_NAMESPACE::FFunctionTranslator>(Super, false);
    Function->TakeJsObjectRef = TakeJsObjectRef;

    Function->Next = Class->Children;
    Class->Children = Function;
    Class->AddFunctionToFunctionMap(Function, Function->GetFName());

    Function->FunctionFlags |= FUNC_Native;    //让UE不走解析
    Function->SetNativeFunc(&UJSGeneratedFunction::execCallMixin);
    Function->Bind();
    Function->StaticLink(true);
    Function->ClearInternalFlags(EInternalObjectFlags::Native);

    if (Class->HasAnyInternalFlags(EInternalObjectFlags::RootSet) || GUObjectArray.IsDisregardForGC(Class))
    {
        Function->AddToRoot();
        Super->AddToRoot();
    }

    Function->Original = Super;
    Function->OriginalFunc = Super->GetNativeFunc();
    Function->OriginalFunctionFlags = Super->FunctionFlags;
    Super->FunctionFlags |= FUNC_Native;    //让UE不走解析
    Super->SetNativeFunc(&UJSGeneratedFunction::execCallMixin);
    Class->AddNativeFunction(*Super->GetName(), &UJSGeneratedFunction::execCallMixin);
    UJSGeneratedFunction::SetJSGeneratedFunctionToScript(Super, Function);

    return Function;
}

void UJSGeneratedClass::Restore(UClass* Class)
{
    FString OrphanedClassString = FString::Printf(TEXT("ORPHANED_DATA_ONLY_%s"), *Class->GetName());
    FName OrphanedClassName =
        MakeUniqueObjectName(GetTransientPackage(), UBlueprintGeneratedClass::StaticClass(), FName(*OrphanedClassString));
    UClass* OrphanedClass = NewObject<UBlueprintGeneratedClass>(GetTransientPackage(), OrphanedClassName, RF_Public | RF_Transient);
#if ENGINE_MAJOR_VERSION >= 5 && ENGINE_MINOR_VERSION > 0
    OrphanedClass->CppClassStaticFunctions = Class->CppClassStaticFunctions;
#else
    OrphanedClass->ClassAddReferencedObjects = Class->AddReferencedObjects;
#endif
    OrphanedClass->ClassFlags |= CLASS_CompiledFromBlueprint;
#if ENGINE_MAJOR_VERSION < 5 || WITH_EDITOR
    OrphanedClass->ClassGeneratedBy = Class->ClassGeneratedBy;
#endif

#if ENGINE_MAJOR_VERSION >= 5 && ENGINE_MINOR_VERSION >= 7
    TObjectPtr<UField>* PP = &Class->Children;
#elif ENGINE_MAJOR_VERSION >= 5 && ENGINE_MINOR_VERSION > 2
    UField** PP = nullptr;
    UField* ChildrenPtr = Class->Children.Get();
    PP = &ChildrenPtr;
#else
    auto PP = &Class->Children;
#endif
    while (*PP)
    {
        if (auto JGF = Cast<UJSGeneratedFunction>(*PP))    // to delete
        {
            if (JGF->Original)
            {
                if (JGF->Script.Num() == 0)
                {
                    JGF->Original->Script.Empty();
                }
                else
                {
                    JGF->Original->Script = JGF->Script;
                }
                JGF->Original->SetNativeFunc(JGF->OriginalFunc);
                Class->AddNativeFunction(*JGF->Original->GetName(), JGF->OriginalFunc);
                JGF->Original->FunctionFlags = JGF->OriginalFunctionFlags;
            }

            *PP = JGF->Next;
#if ENGINE_MAJOR_VERSION >= 5 && ENGINE_MINOR_VERSION > 2 && ENGINE_MINOR_VERSION < 7
            if (PP == &ChildrenPtr)
            {
                Class->Children = ChildrenPtr;
            }
#endif

            Class->RemoveFunctionFromFunctionMap(JGF);
            if (JGF->IsRooted())
            {
                JGF->RemoveFromRoot();
            }
            JGF->Rename(nullptr, OrphanedClass, PUERTS_RENAME_FLAGS);
            FLinkerLoad::InvalidateExport(JGF);
        }
        else
        {
            PP = &(*PP)->Next;
        }
    }
    Class->ClearFunctionMapsCaches();
    for (TObjectIterator<UClass> It; It; ++It)
    {
        if (Class != *It && It->IsChildOf(Class) && !It->HasAnyClassFlags(CLASS_Abstract) &&
            !It->GetName().StartsWith(TEXT("REINST_")))
        {
            It->ClearFunctionMapsCaches();
        }
    }
}

#undef PUERTS_RENAME_FLAGS

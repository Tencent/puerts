/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "JSGeneratedClass.h"
#include "Engine/Blueprint.h"
#include "JSGeneratedFunction.h"
#include "JSWidgetGeneratedClass.h"
#include "JSAnimGeneratedClass.h"
#include "JSLogger.h"

#define OLD_METHOD_PREFIX "__puerts_old__"
#define MIXIN_METHOD_SUFFIX "__puerts_mixin__"

UClass* UJSGeneratedClass::Create(const FString& Name, UClass* Parent,
    TSharedPtr<PUERTS_NAMESPACE::IDynamicInvoker, ESPMode::ThreadSafe> DynamicInvoker, v8::Isolate* Isolate,
    v8::Local<v8::Function> Constructor, v8::Local<v8::Object> Prototype)
{
    auto Outer = GetTransientPackage();
    UClass* Class = nullptr;
    if (Cast<UWidgetBlueprintGeneratedClass>(Parent))
    {
        auto JSGeneratedClass = NewObject<UJSWidgetGeneratedClass>(Outer, *Name, RF_Public);
#ifdef THREAD_SAFE
        JSGeneratedClass->Isolate = Isolate;
#endif
        JSGeneratedClass->DynamicInvoker = DynamicInvoker;
        JSGeneratedClass->Constructor = v8::UniquePersistent<v8::Function>(Isolate, Constructor);
        JSGeneratedClass->Prototype = v8::UniquePersistent<v8::Object>(Isolate, Prototype);
        JSGeneratedClass->ClassConstructor = &UJSWidgetGeneratedClass::StaticConstructor;
        Class = JSGeneratedClass;
    }
    else if (Cast<UAnimBlueprintGeneratedClass>(Parent))
    {
        auto JSGeneratedClass = NewObject<UJSAnimGeneratedClass>(Outer, *Name, RF_Public);
#ifdef THREAD_SAFE
        JSGeneratedClass->Isolate = Isolate;
#endif
        JSGeneratedClass->DynamicInvoker = DynamicInvoker;
        JSGeneratedClass->Constructor = v8::UniquePersistent<v8::Function>(Isolate, Constructor);
        JSGeneratedClass->Prototype = v8::UniquePersistent<v8::Object>(Isolate, Prototype);
        JSGeneratedClass->ClassConstructor = &UJSAnimGeneratedClass::StaticConstructor;
        Class = JSGeneratedClass;
    }
    else
    {
        auto JSGeneratedClass = NewObject<UJSGeneratedClass>(Outer, *Name, RF_Public);
#ifdef THREAD_SAFE
        JSGeneratedClass->Isolate = Isolate;
#endif
        JSGeneratedClass->DynamicInvoker = DynamicInvoker;
        JSGeneratedClass->Constructor = v8::UniquePersistent<v8::Function>(Isolate, Constructor);
        JSGeneratedClass->Prototype = v8::UniquePersistent<v8::Object>(Isolate, Prototype);
        JSGeneratedClass->ClassConstructor = &UJSGeneratedClass::StaticConstructor;
        Class = JSGeneratedClass;
    }

    auto Blueprint = NewObject<UBlueprint>(Outer);
    Blueprint->GeneratedClass = Class;
#if ENGINE_MAJOR_VERSION < 5 || WITH_EDITOR
    Class->ClassGeneratedBy = Blueprint;
#endif

    // Set properties we need to regenerate the class with
    Class->PropertyLink = Parent->PropertyLink;
    Class->ClassWithin = Parent->ClassWithin;
    Class->ClassConfigName = Parent->ClassConfigName;

    Class->SetSuperStruct(Parent);
    Class->ClassFlags |= (Parent->ClassFlags & (CLASS_Inherit | CLASS_ScriptInherit | CLASS_CompiledFromBlueprint));
    Class->ClassFlags |= CLASS_CompiledFromBlueprint;    // AActor::Tick只有有这标记时，才会调用ReceiveTick
    Class->ClassCastFlags |= Parent->ClassCastFlags;

    return Class;
}

void UJSGeneratedClass::StaticConstructor(const FObjectInitializer& ObjectInitializer)
{
    auto Class = ObjectInitializer.GetClass();
    auto Object = ObjectInitializer.GetObj();
    Class->GetSuperClass()->ClassConstructor(ObjectInitializer);

    if (auto JSGeneratedClass = Cast<UJSGeneratedClass>(Class))
    {
#ifdef THREAD_SAFE
        v8::Locker Locker(JSGeneratedClass->Isolate);
#endif
        auto PinedDynamicInvoker = JSGeneratedClass->DynamicInvoker.Pin();
        if (PinedDynamicInvoker)
        {
            PinedDynamicInvoker->JsConstruct(JSGeneratedClass, Object, JSGeneratedClass->Constructor, JSGeneratedClass->Prototype);
        }
    }
}

void UJSGeneratedClass::Override(v8::Isolate* Isolate, UClass* Class, UFunction* Super, v8::Local<v8::Function> JSImpl,
    TSharedPtr<PUERTS_NAMESPACE::IDynamicInvoker, ESPMode::ThreadSafe> DynamicInvoker, bool IsNative)
{
    bool Existed = Super->GetOuter() == Class;
    FName FunctionName = Super->GetFName();
    if (Existed)
    {
        if (auto MaybeJSFunction = Cast<UJSGeneratedFunction>(Super))    //这种情况只需简单替换下js函数
        {
            MaybeJSFunction->DynamicInvoker = DynamicInvoker;
            MaybeJSFunction->FunctionTranslator = std::make_unique<PUERTS_NAMESPACE::FFunctionTranslator>(Super, false);
            MaybeJSFunction->JsFunction.Reset(Isolate, JSImpl);
            MaybeJSFunction->SetNativeFunc(&UJSGeneratedFunction::execCallJS);
            return;
        }
        // UE_LOG(LogTemp, Error, TEXT("replace %s of %s"), *Super->GetName(), *Class->GetName());
        //同一Outer下的同名对象只能有一个...
        Super->Rename(*FString::Printf(TEXT("%s%s"), TEXT(OLD_METHOD_PREFIX), *Super->GetName()), Class,
            REN_DontCreateRedirectors | REN_DoNotDirty | REN_ForceNoResetLoaders);
        Class->AddFunctionToFunctionMap(Super, Super->GetFName());
        // UE_LOG(LogTemp, Error, TEXT("rename to %s"), *Super->GetName());
    }

    // UE_LOG(LogTemp, Error, TEXT("new function name %s"), *FunctionName.ToString());
    UJSGeneratedFunction* Function = Cast<UJSGeneratedFunction>(
        StaticDuplicateObject(Super, Class, FunctionName, RF_Transient, UJSGeneratedFunction::StaticClass()));

    for (TFieldIterator<UFunction> It(Class, EFieldIteratorFlags::IncludeSuper, EFieldIteratorFlags::ExcludeDeprecated,
             EFieldIteratorFlags::IncludeInterfaces);
         It; ++It)
    {
        if (*It == Function)
        {
            return;
        }
    }

    if (!Existed)
    {
        // UE_LOG(LogTemp, Error, TEXT("new function %s"), *FunctionName.ToString());
        Function->SetSuperStruct(Super);
    }
    else
    {
        // UE_LOG(LogTemp, Error, TEXT("replace function %s"), *FunctionName.ToString());
        Function->SetSuperStruct(Super->GetSuperStruct());
    }

    Function->Bind();
    Function->StaticLink(true);

    if (IsNative)
    {
        Function->FunctionFlags |= FUNC_Native;    //让UE不走解析
    }

    Function->SetNativeFunc(&UJSGeneratedFunction::execCallJS);

    Function->JsFunction = v8::UniquePersistent<v8::Function>(Isolate, JSImpl);
    Function->DynamicInvoker = DynamicInvoker;
    Function->FunctionTranslator = std::make_unique<PUERTS_NAMESPACE::FFunctionTranslator>(Function, false);

    if (Existed)
    {
        Function->Next = Super->Next;
        if (Class->Children == Super)    // first one
        {
            Class->Children = Function;
        }
        else
        {
            auto P = Class->Children;
            while (P && P->Next != Super)
                P = P->Next;
            check(P);
            P->Next = Function;
        }
        Class->RemoveFunctionFromFunctionMap(Super);
    }
    else
    {
        Function->Next = Class->Children;
        Class->Children = Function;
    }
    Class->AddFunctionToFunctionMap(Function, Function->GetFName());
}

UFunction* UJSGeneratedClass::Mixin(v8::Isolate* Isolate, UClass* Class, UFunction* Super,
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

    if (Class->HasAnyInternalFlags(EInternalObjectFlags::RootSet))
    {
        Function->AddToRoot();
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

#if ENGINE_MAJOR_VERSION >= 5 && ENGINE_MINOR_VERSION > 2
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
            JGF->JsFunction.Reset();

            *PP = JGF->Next;
#if ENGINE_MAJOR_VERSION >= 5 && ENGINE_MINOR_VERSION > 2
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
            JGF->Rename(nullptr, OrphanedClass, REN_DontCreateRedirectors | REN_DoNotDirty | REN_ForceNoResetLoaders);
            FLinkerLoad::InvalidateExport(JGF);
        }
        else
        {
            PP = &(*PP)->Next;
        }
    }
#if ENGINE_MAJOR_VERSION >= 5 && ENGINE_MINOR_VERSION > 2
    PP = &ChildrenPtr;
#else
    PP = &Class->Children;
#endif
    while (*PP)
    {
        if (auto Function = Cast<UFunction>(*PP))
        {
            if (Function->GetName().StartsWith(TEXT(OLD_METHOD_PREFIX)))
            {
                Class->RemoveFunctionFromFunctionMap(Function);
                Function->Rename(*Function->GetName().Mid(strlen(OLD_METHOD_PREFIX)), Class,
                    REN_DontCreateRedirectors | REN_DoNotDirty | REN_ForceNoResetLoaders);
                Class->AddFunctionToFunctionMap(Function, Function->GetFName());
            }
        }
        PP = &(*PP)->Next;
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

void UJSGeneratedClass::InitPropertiesFromCustomList(uint8* DataPtr, const uint8* DefaultDataPtr)
{
    if (const FCustomPropertyListNode* CustomPropertyList = GetCustomPropertyListForPostConstruction())
    {
        UBlueprintGeneratedClass::InitPropertiesFromCustomList(CustomPropertyList, this, DataPtr, DefaultDataPtr);
    }
}

void UJSGeneratedClass::Release()
{
    for (TFieldIterator<UFunction> It(this, EFieldIteratorFlags::IncludeSuper, EFieldIteratorFlags::ExcludeDeprecated,
             EFieldIteratorFlags::IncludeInterfaces);
         It; ++It)
    {
        if (auto Function = Cast<UJSGeneratedFunction>(*It))
        {
            // UE_LOG(LogTemp, Warning, TEXT("release: %s"), *Function->GetName());
            Function->JsFunction.Reset();
        }
    }

    Constructor.Reset();
    Prototype.Reset();
}

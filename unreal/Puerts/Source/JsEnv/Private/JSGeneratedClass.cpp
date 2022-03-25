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
#include "FunctionParametersDuplicate.h"

UClass* UJSGeneratedClass::Create(const FString& Name, UClass* Parent, TSharedPtr<puerts::IDynamicInvoker> DynamicInvoker,
    v8::Isolate* Isolate, v8::Local<v8::Function> Constructor, v8::Local<v8::Object> Prototype)
{
    auto Outer = GetTransientPackage();
    UClass* Class = nullptr;
    if (Cast<UWidgetBlueprintGeneratedClass>(Parent))
    {
        auto JSGeneratedClass = NewObject<UJSWidgetGeneratedClass>(Outer, *Name, RF_Public);
        JSGeneratedClass->DynamicInvoker = DynamicInvoker;
        JSGeneratedClass->Constructor = v8::UniquePersistent<v8::Function>(Isolate, Constructor);
        JSGeneratedClass->Prototype = v8::UniquePersistent<v8::Object>(Isolate, Prototype);
        JSGeneratedClass->ClassConstructor = &UJSWidgetGeneratedClass::StaticConstructor;
        Class = JSGeneratedClass;
    }
    else if (Cast<UAnimBlueprintGeneratedClass>(Parent))
    {
        auto JSGeneratedClass = NewObject<UJSAnimGeneratedClass>(Outer, *Name, RF_Public);
        JSGeneratedClass->DynamicInvoker = DynamicInvoker;
        JSGeneratedClass->Constructor = v8::UniquePersistent<v8::Function>(Isolate, Constructor);
        JSGeneratedClass->Prototype = v8::UniquePersistent<v8::Object>(Isolate, Prototype);
        JSGeneratedClass->ClassConstructor = &UJSAnimGeneratedClass::StaticConstructor;
        Class = JSGeneratedClass;
    }
    else
    {
        auto JSGeneratedClass = NewObject<UJSGeneratedClass>(Outer, *Name, RF_Public);
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
        auto PinedDynamicInvoker = JSGeneratedClass->DynamicInvoker.Pin();
        if (PinedDynamicInvoker)
        {
            PinedDynamicInvoker->Construct(JSGeneratedClass, Object, JSGeneratedClass->Constructor, JSGeneratedClass->Prototype);
        }
    }
}

void UJSGeneratedClass::Override(v8::Isolate* Isolate, UClass* Class, UFunction* Super, v8::Local<v8::Function> JSImpl,
    TSharedPtr<puerts::IDynamicInvoker> DynamicInvoker, bool IsNative)
{
    bool Replace = Super->GetOuter() == Class;
    FName FunctionName = Super->GetFName();
    if (Replace)
    {
        if (auto MaybeJSFunction = Cast<UJSGeneratedFunction>(Super))    //这种情况只需简单替换下js函数
        {
            MaybeJSFunction->DynamicInvoker = DynamicInvoker;
            MaybeJSFunction->FunctionTranslator = std::make_unique<puerts::FFunctionTranslator>(Super, false);
            MaybeJSFunction->JsFunction.Reset(Isolate, JSImpl);
            MaybeJSFunction->SetNativeFunc(&UJSGeneratedFunction::execCallJS);
            return;
        }
        // UE_LOG(LogTemp, Error, TEXT("replace %s of %s"), *Super->GetName(), *Class->GetName());
        //同一Outer下的同名对象只能有一个...
        Super->Rename(*FString::Printf(TEXT("%s%s"), *Super->GetName(), TEXT("__Removed")), Super->GetOuter(),
            REN_DontCreateRedirectors | REN_DoNotDirty | REN_ForceNoResetLoaders);
        // UE_LOG(LogTemp, Error, TEXT("rename to %s"), *Super->GetName());
    }

    // UE_LOG(LogTemp, Error, TEXT("new function name %s"), *FunctionName.ToString());
    UJSGeneratedFunction* Function = NewObject<UJSGeneratedFunction>(Class, FunctionName, RF_Public);

    for (TFieldIterator<UFunction> It(Class, EFieldIteratorFlags::IncludeSuper, EFieldIteratorFlags::ExcludeDeprecated,
             EFieldIteratorFlags::IncludeInterfaces);
         It; ++It)
    {
        if (*It == Function)
        {
            return;
        }
    }

    Function->ReturnValueOffset = MAX_uint16;
    Function->FirstPropertyToInit = NULL;

    if (!Replace)
    {
        // UE_LOG(LogTemp, Error, TEXT("new function %s"), *FunctionName.ToString());
        Function->SetSuperStruct(Super);
    }
    else
    {
        // UE_LOG(LogTemp, Error, TEXT("replace function %s"), *FunctionName.ToString());
        Function->SetSuperStruct(Super->GetSuperStruct());
    }

    DuplicateParameters(Super, Function);

    Function->Bind();
    Function->StaticLink(true);

    if (IsNative)
    {
        Function->FunctionFlags |= FUNC_Native;    //让UE不走解析
    }

    Function->SetNativeFunc(&UJSGeneratedFunction::execCallJS);

    Function->JsFunction = v8::UniquePersistent<v8::Function>(Isolate, JSImpl);
    Function->DynamicInvoker = DynamicInvoker;
    Function->FunctionTranslator = std::make_unique<puerts::FFunctionTranslator>(Function, false);

    if (Replace)
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

/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "CoreMinimal.h"
#include "Binding.hpp"
#include "UEDataBinding.hpp"
#include "V8Utils.h"
#if !defined(ENGINE_INDEPENDENT_JSENV)
#include "Kismet/DataTableFunctionLibrary.h"
#include "Components/SceneComponent.h"
#include "Engine/World.h"
#endif

UsingUClass(UObject);
UsingUClass(UClass);
UsingUClass(UStruct);
#if !defined(ENGINE_INDEPENDENT_JSENV)
UsingUClass(UWorld);    // for return type
UsingUClass(USceneComponent);
UsingUClass(UActorComponent);
UsingUClass(UDataTable);
UsingUClass(UDataTableFunctionLibrary);
#endif
#ifdef PUERTS_FTEXT_AS_OBJECT
UsingCppType(FText);
static PUERTS_NAMESPACE::CFunctionInfoWithCustomSignature FormatSignature(
    "(Fmt: string | FText, ...InArguments: (string | number | FText) []) :FText");

static void FText_Format(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    FTextFormat Fmt;
    auto P0 = Info[0];
    if (P0->IsString())
    {
        Fmt = FTextFormat::FromString(PUERTS_NAMESPACE::FV8Utils::ToFString(Isolate, P0));
    }
    else if (::PUERTS_NAMESPACE::v8_impl::Converter<FText*>::accept(Context, P0))
    {
        Fmt = *::PUERTS_NAMESPACE::v8_impl::Converter<FText*>::toCpp(Context, P0);
    }
    else
    {
        PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "Fmt expect a string or FText");
        return;
    }
    FFormatOrderedArguments Args;
    for (int i = 1; i < Info.Length(); i++)
    {
        if (Info[i]->IsInt32())
        {
            Args.Add(FFormatArgumentValue(Info[i]->Int32Value(Context).FromJust()));
        }
        else if (Info[i]->IsNumber())
        {
            Args.Add(FFormatArgumentValue(Info[i]->ToNumber(Context).ToLocalChecked()->Value()));
        }
        else if (Info[i]->IsString())
        {
            Args.Add(FFormatArgumentValue(FText::FromString(PUERTS_NAMESPACE::FV8Utils::ToFString(Isolate, Info[i]))));
        }
        else if (Info[i]->IsObject() && ::PUERTS_NAMESPACE::v8_impl::Converter<FText*>::accept(Context, Info[i]))
        {
            Args.Add(FFormatArgumentValue(*::PUERTS_NAMESPACE::v8_impl::Converter<FText*>::toCpp(Context, Info[i])));
        }
        else
        {
            PUERTS_NAMESPACE::DataTransfer::ThrowException(Isolate, "InArguments expect a number/string/FText");
            return;
        }
    }

    Info.GetReturnValue().Set(::PUERTS_NAMESPACE::v8_impl::Converter<FText>::toScript(Context, FText::Format(Fmt, Args)));
}
#endif

#if ENGINE_MAJOR_VERSION > 4
UsingUClass(AActor);
UsingUStruct(FHitResult)
#endif

    struct AutoRegisterForUE
{
    AutoRegisterForUE()
    {
        PUERTS_NAMESPACE::DefineClass<UObject>()
#if ENGINE_MAJOR_VERSION > 4 || ENGINE_MAJOR_VERSION == 4 && ENGINE_MINOR_VERSION >= 23
            .Method("CreateDefaultSubobject",
                SelectFunction(UObject * (UObject::*) (FName, UClass*, UClass*, bool, bool), &UObject::CreateDefaultSubobject))
#else
            .Method("CreateDefaultSubobject", SelectFunction(UObject * (UObject::*) (FName, UClass*, UClass*, bool, bool, bool),
                                                  &UObject::CreateDefaultSubobject))
#endif
            .Method("GetName", SelectFunction(FString(UObjectBaseUtility::*)() const, &UObjectBaseUtility::GetName))
            .Method("GetOuter", MakeFunction(&UObject::GetOuter))
            .Method("GetClass", MakeFunction(&UObject::GetClass))
            .Method("IsA", SelectFunction(bool (UObjectBaseUtility::*)(UClass*) const, &UObjectBaseUtility::IsA))
            .Method("IsNative", MakeFunction(&UObjectBaseUtility::IsNative))
#if !defined(ENGINE_INDEPENDENT_JSENV)
            .Method("GetWorld", MakeFunction(&UObject::GetWorld))
#endif
            .Register();

        PUERTS_NAMESPACE::DefineClass<UStruct>()
            .Method("IsChildOf", SelectFunction(bool (UStruct::*)(const UStruct*) const, &UStruct::IsChildOf))
            .Register();

#if !defined(ENGINE_INDEPENDENT_JSENV)
        PUERTS_NAMESPACE::DefineClass<USceneComponent>()
            .Method("SetupAttachment", MakeFunction(&USceneComponent::SetupAttachment))
            .Register();

        PUERTS_NAMESPACE::DefineClass<UActorComponent>()
            .Method("RegisterComponent", MakeFunction(&UActorComponent::RegisterComponent))
            .Register();

        PUERTS_NAMESPACE::DefineClass<UDataTableFunctionLibrary>()
            .Function("Generic_GetDataTableRowFromName", MakeFunction(&UDataTableFunctionLibrary::Generic_GetDataTableRowFromName))
            .Register();
#endif

#ifdef PUERTS_FTEXT_AS_OBJECT
        PUERTS_NAMESPACE::DefineClass<FText>()
            .Constructor<>()    // make destructor available
            .Method("ToString", MakeFunction(&FText::ToString))
            .Function("FromStringTable", MakeFunction(&FText::FromStringTable))
            .Function("FromString", SelectFunction(FText(*)(const FString&), &FText::FromString))
            .Function("Format", FText_Format, &FormatSignature)
            .Register();
#endif

#if ENGINE_MAJOR_VERSION > 4
        PUERTS_NAMESPACE::DefineClass<FHitResult>().Method("GetActor", MakeFunction(&FHitResult::GetActor)).Register();
#endif
    }
};

AutoRegisterForUE _AutoRegisterForUE__;

/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "CoreMinimal.h"
#include "Binding.hpp"
#include "UEDataBinding.hpp"
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
static PUERTS_NAMESPACE::CFunctionInfoWithCustomSignature FormatSignature(
    "(Fmt: string | FText, ...InArguments: (string | number | FText) []) :FText");

static void FText_Format(struct pesapi_ffi* apis, pesapi_callback_info info)
{
    using FTextPtrConverter = ::PUERTS_NAMESPACE::pesapi_impl::Converter<FText*>;
    pesapi_env env = apis->get_env(info);
    ::PUERTS_NAMESPACE::pesapi_impl::PApiCallbackEnv Env{apis, env};

    FTextFormat Fmt;
    auto P0 = apis->get_arg(info, 0);
    if (apis->is_string(env, P0) != 0)
    {
        Fmt = FTextFormat::FromString(::PUERTS_NAMESPACE::pesapi_impl::Converter<FString>::toCpp(Env, P0));
    }
    else if (FTextPtrConverter::accept(Env, P0))
    {
        Fmt = *FTextPtrConverter::toCpp(Env, P0);
    }
    else
    {
        apis->throw_by_string(info, "Fmt expect a string or FText");
        return;
    }
    FFormatOrderedArguments Args;
    const int Len = apis->get_args_len(info);
    for (int i = 1; i < Len; i++)
    {
        auto Arg = apis->get_arg(info, i);
        if (apis->is_int32(env, Arg) != 0)
        {
            Args.Add(FFormatArgumentValue(apis->get_value_int32(env, Arg)));
        }
        else if (apis->is_double(env, Arg) != 0)
        {
            Args.Add(FFormatArgumentValue(apis->get_value_double(env, Arg)));
        }
        else if (apis->is_string(env, Arg) != 0)
        {
            Args.Add(FFormatArgumentValue(FText::FromString(::PUERTS_NAMESPACE::pesapi_impl::Converter<FString>::toCpp(Env, Arg))));
        }
        else if (apis->is_object(env, Arg) != 0 && FTextPtrConverter::accept(Env, Arg))
        {
            Args.Add(FFormatArgumentValue(*FTextPtrConverter::toCpp(Env, Arg)));
        }
        else
        {
            apis->throw_by_string(info, "InArguments expect a number/string/FText");
            return;
        }
    }

    apis->add_return(info, ::PUERTS_NAMESPACE::pesapi_impl::Converter<FText>::toScript(Env, FText::Format(Fmt, Args)));
}

static FText FromStringTable(const FName InTableId, const FString& InKey,
    const EStringTableLoadingPolicy InLoadingPolicy = EStringTableLoadingPolicy::FindOrLoad)
{
    // 这块代码主要是为了兼容 UE5.5 版本之后，FText::FromStringTable 函数的参数从 FString 改为 FTextKey 类型
    return FText::FromStringTable(InTableId, InKey, InLoadingPolicy);
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
            .Function("FromStringTable", MakeFunction(&FromStringTable))
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

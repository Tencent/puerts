/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "CoreMinimal.h"
#include "CoreUObject.h"
#include "NamespaceDef.h"
#include "pesapi.h"
#include "DataTransfer.h"
#include "V8Utils.h"
#include "ObjectMapper.h"
#include "PapiV8Bridge.h"
#include <initializer_list>

// helpers shared by the papi based code of the plugin
namespace PUERTS_NAMESPACE
{
namespace PapiUtils
{
FORCEINLINE FString ToFString(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value)
{
    FString Ret;
    size_t Len = 0;
    Apis->get_value_string_utf16(Env, Value, nullptr, &Len);
    if (Len > 0)
    {
        TArray<TCHAR>& CharArray = Ret.GetCharArray();
        CharArray.SetNumUninitialized(static_cast<int32>(Len) + 1);
        Apis->get_value_string_utf16(Env, Value, reinterpret_cast<uint16_t*>(CharArray.GetData()), &Len);
        CharArray[static_cast<int32>(Len)] = TEXT('\0');
    }
    return Ret;
}

FORCEINLINE pesapi_value FromFString(struct pesapi_ffi* Apis, pesapi_env Env, const FString& Str)
{
    static_assert(sizeof(TCHAR) == sizeof(uint16_t), "TCHAR must be UTF-16");
    return Apis->create_string_utf16(Env, reinterpret_cast<const uint16_t*>(*Str), static_cast<size_t>(Str.Len()));
}

// same as FV8Utils::GetUObject(Context, Value): nullptr for a non object value, RELEASED_UOBJECT for a released one
FORCEINLINE UObject* GetUObject(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value)
{
    return DataTransfer::GetUObjectOfNativePtr(Apis->get_native_object_ptr(Env, Value));
}

// the IObjectMapper of an env, it is the isolate data of the v8 backend (the only backend of the plugin for now)
FORCEINLINE IObjectMapper* ObjectMapperOf(pesapi_env Env)
{
    return FV8Utils::IsolateData<IObjectMapper>(papi_bridge::IsolateOf(Env));
}

// pesapi_throw_by_string needs the callback info, which translators do not have
FORCEINLINE void ThrowException(pesapi_env Env, const char* Message)
{
    FV8Utils::ThrowException(papi_bridge::IsolateOf(Env), Message);
}

FORCEINLINE void ThrowException(pesapi_env Env, const FString& Message)
{
    FV8Utils::ThrowException(papi_bridge::IsolateOf(Env), Message);
}

FORCEINLINE pesapi_value FindOrAddUObject(pesapi_env Env, UClass* Class, UObject* Object)
{
    return ObjectMapperOf(Env)->FindOrAdd(Env, Class, Object);
}

FORCEINLINE pesapi_value FindOrAddStruct(pesapi_env Env, UScriptStruct* ScriptStruct, void* Ptr, bool PassByPointer)
{
    return ObjectMapperOf(Env)->FindOrAddStruct(Env, ScriptStruct, Ptr, PassByPointer);
}

FORCEINLINE void Merge(pesapi_env Env, pesapi_value Src, UStruct* DesType, void* Des)
{
    ObjectMapperOf(Env)->Merge(Env, Src, DesType, Des);
}

template <typename TContainer>
FORCEINLINE pesapi_value FindOrAddContainer(pesapi_env Env, PropertyMacro* Property, TContainer* Ptr, bool PassByPointer)
{
    return ObjectMapperOf(Env)->FindOrAddContainer(Env, Property, Ptr, PassByPointer);
}

FORCEINLINE pesapi_value FindOrAddContainer(
    pesapi_env Env, PropertyMacro* KeyProperty, PropertyMacro* ValueProperty, FScriptMap* Ptr, bool PassByPointer)
{
    return ObjectMapperOf(Env)->FindOrAddContainer(Env, KeyProperty, ValueProperty, Ptr, PassByPointer);
}

FORCEINLINE pesapi_value CreateArray(pesapi_env Env, FPropertyTranslator* Inner, void* ArrayPtr)
{
    return ObjectMapperOf(Env)->CreateArray(Env, Inner, ArrayPtr);
}

FORCEINLINE pesapi_value AddSoftObjectPtr(pesapi_env Env, FSoftObjectPtr* SoftObjectPtr, UClass* Class, bool IsSoftClass)
{
    return ObjectMapperOf(Env)->AddSoftObjectPtr(Env, SoftObjectPtr, Class, IsSoftClass);
}

FORCEINLINE pesapi_value FindOrAddDelegate(
    pesapi_env Env, UObject* Owner, PropertyMacro* Property, void* DelegatePtr, bool PassByPointer)
{
    return ObjectMapperOf(Env)->FindOrAddDelegate(Env, Owner, Property, DelegatePtr, PassByPointer);
}

// JsFunction must be a function
FORCEINLINE FScriptDelegate NewDelegate(pesapi_env Env, UObject* Owner, pesapi_value JsFunction, UFunction* SignatureFunction)
{
    return ObjectMapperOf(Env)->NewDelegate(Env, Owner, JsFunction, SignatureFunction);
}

FORCEINLINE bool AddToDelegate(pesapi_env Env, void* DelegatePtr, pesapi_value JsFunction)
{
    return ObjectMapperOf(Env)->AddToDelegate(Env, DelegatePtr, JsFunction);
}

FORCEINLINE bool RemoveFromDelegate(pesapi_env Env, void* DelegatePtr, pesapi_value JsFunction)
{
    return ObjectMapperOf(Env)->RemoveFromDelegate(Env, DelegatePtr, JsFunction);
}

FORCEINLINE bool ClearDelegate(pesapi_env Env, void* DelegatePtr)
{
    return ObjectMapperOf(Env)->ClearDelegate(Env, DelegatePtr);
}

FORCEINLINE void ExecuteDelegate(pesapi_env Env, pesapi_callback_info Info, void* DelegatePtr)
{
    ObjectMapperOf(Env)->ExecuteDelegate(Env, Info, DelegatePtr);
}

FORCEINLINE PropertyMacro* FindDelegateProperty(pesapi_env Env, void* DelegatePtr)
{
    return ObjectMapperOf(Env)->FindDelegateProperty(DelegatePtr);
}

// the same checks and messages as FV8Utils::CheckArgument
inline bool CheckArguments(struct pesapi_ffi* Apis, pesapi_callback_info Info, std::initializer_list<ArgType> TypesExpect)
{
    const int Provided = Apis->get_args_len(Info);
    if (Provided < static_cast<int>(TypesExpect.size()))
    {
        Apis->throw_by_string(
            Info, TCHAR_TO_UTF8(*FString::Printf(TEXT("Bad parameters, the function expect %d, but  %d provided."),
                      static_cast<int>(TypesExpect.size()), Provided)));
        return false;
    }

    pesapi_env Env = Apis->get_env(Info);
    int i = 0;
    for (ArgType Type : TypesExpect)
    {
        pesapi_value Arg = Apis->get_arg(Info, i);
        const TCHAR* Expect = nullptr;
        switch (Type)
        {
            case EArgInt32:
                Expect = Apis->is_int32(Env, Arg) ? nullptr : TEXT("a int32");
                break;
            case EArgNumber:
                Expect = Apis->is_double(Env, Arg) ? nullptr : TEXT("a int32");
                break;
            case EArgString:
                Expect = Apis->is_string(Env, Arg) ? nullptr : TEXT("a string");
                break;
            case EArgExternal:
                // papi has no external, only the v8 implementation creates them
                Expect = papi_bridge::ToV8(Arg)->IsExternal() ? nullptr : TEXT("an external");
                break;
            case EArgFunction:
                Expect = Apis->is_function(Env, Arg) ? nullptr : TEXT("a function");
                break;
            case EArgObject:
                Expect = Apis->is_object(Env, Arg) ? nullptr : TEXT("a object");
                break;
            default:
                break;
        }
        if (Expect)
        {
            Apis->throw_by_string(Info, TCHAR_TO_UTF8(*FString::Printf(TEXT("Bad parameters #%d, expect %s."), i, Expect)));
            return false;
        }
        ++i;
    }
    return true;
}
}    // namespace PapiUtils
}    // namespace PUERTS_NAMESPACE

// for callbacks with the papi signature (struct pesapi_ffi* Apis, pesapi_callback_info Info)
#define PAPI_CHECK_ARGS(...)                                                     \
    if (!PUERTS_NAMESPACE::PapiUtils::CheckArguments(Apis, Info, {__VA_ARGS__})) \
    {                                                                            \
        return;                                                                  \
    }

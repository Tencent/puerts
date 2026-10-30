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
#include "PapiDataTransfer.h"
#include "UECompatible.h"
#include "ArgType.h"
#include "ObjectMapper.h"
#include "JSLogger.h"
#include <initializer_list>

// helpers shared by the papi based code of the plugin
namespace PUERTS_NAMESPACE
{
namespace PapiUtils
{
FORCEINLINE FString ToFString(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value)
{
    return PapiDataTransfer::ToFString(Apis, Env, Value);
}

FORCEINLINE pesapi_value FromFString(struct pesapi_ffi* Apis, pesapi_env Env, const FString& Str)
{
    return PapiDataTransfer::FromFString(Apis, Env, Str);
}

// same as FV8Utils::ToV8StringFromFileContent: UTF-16 with BOM, otherwise UTF-8 (BOM skipped)
inline pesapi_value FromFileContent(struct pesapi_ffi* Apis, pesapi_env Env, const TArray<uint8>& FileContent)
{
    const uint8* Buffer = FileContent.GetData();
    int32 Size = FileContent.Num();

    if (Size >= 2 && !(Size & 1) && ((Buffer[0] == 0xff && Buffer[1] == 0xfe) || (Buffer[0] == 0xfe && Buffer[1] == 0xff)))
    {
        FString Content;
        FFileHelper::BufferToString(Content, Buffer, Size);
        return FromFString(Apis, Env, Content);
    }
    if (Size >= 3 && Buffer[0] == 0xef && Buffer[1] == 0xbb && Buffer[2] == 0xbf)
    {
        Buffer += 3;
        Size -= 3;
    }
    return Apis->create_string_utf8(Env, reinterpret_cast<const char*>(Buffer), static_cast<size_t>(Size));
}

// evaluates a classic script, the encoding of FileContent is detected as FromFileContent does (pesapi eval takes UTF-8)
inline pesapi_value EvalFileContent(struct pesapi_ffi* Apis, pesapi_env Env, const TArray<uint8>& FileContent, const char* Path)
{
    const uint8* Buffer = FileContent.GetData();
    int32 Size = FileContent.Num();

    if (Size >= 2 && !(Size & 1) && ((Buffer[0] == 0xff && Buffer[1] == 0xfe) || (Buffer[0] == 0xfe && Buffer[1] == 0xff)))
    {
        FString Content;
        FFileHelper::BufferToString(Content, Buffer, Size);
        FTCHARToUTF8 Utf8(*Content);
        return Apis->eval(Env, reinterpret_cast<const uint8_t*>(Utf8.Get()), static_cast<size_t>(Utf8.Length()), Path);
    }
    if (Size >= 3 && Buffer[0] == 0xef && Buffer[1] == 0xbb && Buffer[2] == 0xbf)
    {
        Buffer += 3;
        Size -= 3;
    }
    return Apis->eval(Env, reinterpret_cast<const uint8_t*>(Buffer), static_cast<size_t>(Size), Path);
}

// same as FV8Utils::GetUObject(Context, Value): nullptr for a non object value, RELEASED_UOBJECT for a released one
FORCEINLINE UObject* GetUObject(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value)
{
    return PapiDataTransfer::GetUObjectOfValue(Apis, Env, Value);
}

// a raw UObject pointer (e.g. the type id of a struct wrapper, which is its UScriptStruct), same as FV8Utils::GetUObject with
// a non zero index: RELEASED_UOBJECT if the UObject is destroyed / pending kill
FORCEINLINE UObject* ToUObjectChecked(const void* Ptr)
{
    auto UEObject = static_cast<UObject*>(const_cast<void*>(Ptr));
    return (!UEObject || (UEObject != RELEASED_UOBJECT && UEObject->IsValidLowLevelFast() && !UEObjectIsPendingKill(UEObject)))
               ? UEObject
               : RELEASED_UOBJECT;
}

// the member pointer of a released UObject (see RELEASED_UOBJECT_MEMBER)
FORCEINLINE bool IsReleasedPtr(void* Ptr)
{
    return RELEASED_UOBJECT_MEMBER == Ptr;
}

// the IObjectMapper of an env, the host publishes it as the env private (pesapi set_env_private) when the env is created
FORCEINLINE IObjectMapper* ObjectMapperOf(struct pesapi_ffi* Apis, pesapi_env Env)
{
    return static_cast<IObjectMapper*>(const_cast<void*>(Apis->get_env_private(Env)));
}

// a translator (JsToUE ...) error: thrown to the script caller when it is called from a native callback (Info), logged when it
// converts the result of a script function called by the engine (no Info, no script caller to throw to)
FORCEINLINE void ThrowException(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_callback_info Info, const char* Message)
{
    if (Info)
    {
        Apis->throw_by_string(Info, Message);
    }
    else
    {
        UE_LOG(Puerts, Error, TEXT("%s"), UTF8_TO_TCHAR(Message));
    }
}

FORCEINLINE void ThrowException(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_callback_info Info, const FString& Message)
{
    ThrowException(Apis, Env, Info, TCHAR_TO_UTF8(*Message));
}

FORCEINLINE pesapi_value FindOrAddUObject(struct pesapi_ffi* Apis, pesapi_env Env, UClass* Class, UObject* Object)
{
    return ObjectMapperOf(Apis, Env)->FindOrAdd(Env, Class, Object);
}

FORCEINLINE pesapi_value FindOrAddStruct(
    struct pesapi_ffi* Apis, pesapi_env Env, UScriptStruct* ScriptStruct, void* Ptr, bool PassByPointer)
{
    return ObjectMapperOf(Apis, Env)->FindOrAddStruct(Env, ScriptStruct, Ptr, PassByPointer);
}

FORCEINLINE void Merge(
    struct pesapi_ffi* Apis, pesapi_env Env, pesapi_callback_info Info, pesapi_value Src, UStruct* DesType, void* Des)
{
    ObjectMapperOf(Apis, Env)->Merge(Env, Info, Src, DesType, Des);
}

template <typename TContainer>
FORCEINLINE pesapi_value FindOrAddContainer(
    struct pesapi_ffi* Apis, pesapi_env Env, PropertyMacro* Property, TContainer* Ptr, bool PassByPointer)
{
    return ObjectMapperOf(Apis, Env)->FindOrAddContainer(Env, Property, Ptr, PassByPointer);
}

FORCEINLINE pesapi_value FindOrAddContainer(struct pesapi_ffi* Apis, pesapi_env Env, PropertyMacro* KeyProperty,
    PropertyMacro* ValueProperty, FScriptMap* Ptr, bool PassByPointer)
{
    return ObjectMapperOf(Apis, Env)->FindOrAddContainer(Env, KeyProperty, ValueProperty, Ptr, PassByPointer);
}

FORCEINLINE pesapi_value CreateArray(struct pesapi_ffi* Apis, pesapi_env Env, FPropertyTranslator* Inner, void* ArrayPtr)
{
    return ObjectMapperOf(Apis, Env)->CreateArray(Env, Inner, ArrayPtr);
}

FORCEINLINE pesapi_value FindOrAddDelegate(
    struct pesapi_ffi* Apis, pesapi_env Env, UObject* Owner, PropertyMacro* Property, void* DelegatePtr, bool PassByPointer)
{
    return ObjectMapperOf(Apis, Env)->FindOrAddDelegate(Env, Owner, Property, DelegatePtr, PassByPointer);
}

// JsFunction must be a function
FORCEINLINE FScriptDelegate NewDelegate(
    struct pesapi_ffi* Apis, pesapi_env Env, UObject* Owner, pesapi_value JsFunction, UFunction* SignatureFunction)
{
    return ObjectMapperOf(Apis, Env)->NewDelegate(Env, Owner, JsFunction, SignatureFunction);
}

FORCEINLINE bool AddToDelegate(struct pesapi_ffi* Apis, pesapi_env Env, void* DelegatePtr, pesapi_value JsFunction)
{
    return ObjectMapperOf(Apis, Env)->AddToDelegate(Env, DelegatePtr, JsFunction);
}

FORCEINLINE bool RemoveFromDelegate(struct pesapi_ffi* Apis, pesapi_env Env, void* DelegatePtr, pesapi_value JsFunction)
{
    return ObjectMapperOf(Apis, Env)->RemoveFromDelegate(Env, DelegatePtr, JsFunction);
}

FORCEINLINE bool ClearDelegate(struct pesapi_ffi* Apis, pesapi_env Env, void* DelegatePtr)
{
    return ObjectMapperOf(Apis, Env)->ClearDelegate(Env, DelegatePtr);
}

FORCEINLINE void ExecuteDelegate(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_callback_info Info, void* DelegatePtr)
{
    ObjectMapperOf(Apis, Env)->ExecuteDelegate(Env, Info, DelegatePtr);
}

FORCEINLINE PropertyMacro* FindDelegateProperty(struct pesapi_ffi* Apis, pesapi_env Env, void* DelegatePtr)
{
    return ObjectMapperOf(Apis, Env)->FindDelegateProperty(DelegatePtr);
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
                // papi has no external, nothing created by papi can be one
                Expect = TEXT("an external");
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

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

// IObjectMapper keeps its v8 interface until FJsEnvImpl is migrated (M5), the papi based code reaches it only through the
// helpers below, so the bridge is confined to this header
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
    v8::Local<v8::Context> Context = papi_bridge::ToV8(Env);
    return papi_bridge::ToPapi(ObjectMapperOf(Env)->FindOrAdd(Context->GetIsolate(), Context, Class, Object));
}

FORCEINLINE pesapi_value FindOrAddStruct(pesapi_env Env, UScriptStruct* ScriptStruct, void* Ptr, bool PassByPointer)
{
    v8::Local<v8::Context> Context = papi_bridge::ToV8(Env);
    return papi_bridge::ToPapi(
        ObjectMapperOf(Env)->FindOrAddStruct(Context->GetIsolate(), Context, ScriptStruct, Ptr, PassByPointer));
}

FORCEINLINE void Merge(pesapi_env Env, pesapi_value Src, UStruct* DesType, void* Des)
{
    v8::Local<v8::Context> Context = papi_bridge::ToV8(Env);
    ObjectMapperOf(Env)->Merge(Context->GetIsolate(), Context, papi_bridge::ToV8(Src).As<v8::Object>(), DesType, Des);
}

template <typename TContainer>
FORCEINLINE pesapi_value FindOrAddContainer(pesapi_env Env, PropertyMacro* Property, TContainer* Ptr, bool PassByPointer)
{
    v8::Local<v8::Context> Context = papi_bridge::ToV8(Env);
    return papi_bridge::ToPapi(
        ObjectMapperOf(Env)->FindOrAddContainer(Context->GetIsolate(), Context, Property, Ptr, PassByPointer));
}

FORCEINLINE pesapi_value FindOrAddContainer(
    pesapi_env Env, PropertyMacro* KeyProperty, PropertyMacro* ValueProperty, FScriptMap* Ptr, bool PassByPointer)
{
    v8::Local<v8::Context> Context = papi_bridge::ToV8(Env);
    return papi_bridge::ToPapi(
        ObjectMapperOf(Env)->FindOrAddContainer(Context->GetIsolate(), Context, KeyProperty, ValueProperty, Ptr, PassByPointer));
}

FORCEINLINE pesapi_value CreateArray(pesapi_env Env, FPropertyTranslator* Inner, void* ArrayPtr)
{
    v8::Local<v8::Context> Context = papi_bridge::ToV8(Env);
    return papi_bridge::ToPapi(ObjectMapperOf(Env)->CreateArray(Context->GetIsolate(), Context, Inner, ArrayPtr));
}

FORCEINLINE pesapi_value AddSoftObjectPtr(pesapi_env Env, FSoftObjectPtr* SoftObjectPtr, UClass* Class, bool IsSoftClass)
{
    v8::Local<v8::Context> Context = papi_bridge::ToV8(Env);
    return papi_bridge::ToPapi(
        ObjectMapperOf(Env)->AddSoftObjectPtr(Context->GetIsolate(), Context, SoftObjectPtr, Class, IsSoftClass));
}

FORCEINLINE pesapi_value FindOrAddDelegate(
    pesapi_env Env, UObject* Owner, PropertyMacro* Property, void* DelegatePtr, bool PassByPointer)
{
    v8::Local<v8::Context> Context = papi_bridge::ToV8(Env);
    return papi_bridge::ToPapi(
        ObjectMapperOf(Env)->FindOrAddDelegate(Context->GetIsolate(), Context, Owner, Property, DelegatePtr, PassByPointer));
}

// JsFunction must be a function
FORCEINLINE FScriptDelegate NewDelegate(pesapi_env Env, UObject* Owner, pesapi_value JsFunction, UFunction* SignatureFunction)
{
    v8::Local<v8::Context> Context = papi_bridge::ToV8(Env);
    return ObjectMapperOf(Env)->NewDelegate(
        Context->GetIsolate(), Context, Owner, papi_bridge::ToV8(JsFunction).As<v8::Function>(), SignatureFunction);
}

FORCEINLINE bool AddToDelegate(pesapi_env Env, void* DelegatePtr, pesapi_value JsFunction)
{
    v8::Local<v8::Context> Context = papi_bridge::ToV8(Env);
    return ObjectMapperOf(Env)->AddToDelegate(
        Context->GetIsolate(), Context, DelegatePtr, papi_bridge::ToV8(JsFunction).As<v8::Function>());
}

FORCEINLINE bool RemoveFromDelegate(pesapi_env Env, void* DelegatePtr, pesapi_value JsFunction)
{
    v8::Local<v8::Context> Context = papi_bridge::ToV8(Env);
    return ObjectMapperOf(Env)->RemoveFromDelegate(
        Context->GetIsolate(), Context, DelegatePtr, papi_bridge::ToV8(JsFunction).As<v8::Function>());
}

FORCEINLINE bool ClearDelegate(pesapi_env Env, void* DelegatePtr)
{
    v8::Local<v8::Context> Context = papi_bridge::ToV8(Env);
    return ObjectMapperOf(Env)->ClearDelegate(Context->GetIsolate(), Context, DelegatePtr);
}

FORCEINLINE void ExecuteDelegate(pesapi_env Env, pesapi_callback_info Info, void* DelegatePtr)
{
    v8::Local<v8::Context> Context = papi_bridge::ToV8(Env);
    ObjectMapperOf(Env)->ExecuteDelegate(Context->GetIsolate(), Context, papi_bridge::ToV8(Info), DelegatePtr);
}

FORCEINLINE PropertyMacro* FindDelegateProperty(pesapi_env Env, void* DelegatePtr)
{
    return ObjectMapperOf(Env)->FindDelegateProperty(DelegatePtr);
}
}    // namespace PapiUtils
}    // namespace PUERTS_NAMESPACE

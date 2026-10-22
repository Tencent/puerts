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

// the object mapper is not migrated yet, the wrapper of a UObject is still created by IObjectMapper through the bridge
FORCEINLINE pesapi_value FindOrAddUObject(pesapi_env Env, UClass* Class, UObject* Object)
{
    v8::Local<v8::Context> Context = papi_bridge::ToV8(Env);
    v8::Isolate* Isolate = Context->GetIsolate();
    return papi_bridge::ToPapi(FV8Utils::IsolateData<IObjectMapper>(Isolate)->FindOrAdd(Isolate, Context, Class, Object));
}
}    // namespace PapiUtils
}    // namespace PUERTS_NAMESPACE

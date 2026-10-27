/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#ifndef WITH_QUICKJS

#include <cstddef>

#include "JSClassRegister.h"
#include "PesapiImpl.h"

#if USING_IN_UNREAL_ENGINE
PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS
MSVC_PRAGMA(warning(push, 0))
#include "v8.h"
MSVC_PRAGMA(warning(pop))
PRAGMA_ENABLE_UNDEFINED_IDENTIFIER_WARNINGS
#else
#include "v8.h"
#endif

// Trampolines from v8 native callbacks to the pesapi style callbacks stored in the class registry.
// The v8 data of a method / getter / setter / constructor template is an External pointing to the Data / GetterData /
// SetterData field of the registry entry, so the entry is recovered by offsetof and the callback receives the plugin's
// pesapi_ffi (in the plugin a pesapi_callback_info is a const v8::FunctionCallbackInfo<v8::Value>*).
namespace PUERTS_NAMESPACE
{
namespace ClassThunks
{
#define PUERTS_CLASS_THUNK_CONTAINER_OF(ptr, type, member) ((type*) ((char*) (ptr) -offsetof(type, member)))

FORCEINLINE void* ExternalValueOf(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    return v8::Local<v8::External>::Cast(Info.Data())->Value();
}

inline void MethodThunk(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    auto FunctionInfo = PUERTS_CLASS_THUNK_CONTAINER_OF(ExternalValueOf(Info), JSFunctionInfo, Data);
    FunctionInfo->Callback(&v8impl::g_pesapi_ffi, (pesapi_callback_info) (&Info));
}

inline void GetterThunk(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    auto PropertyInfo = PUERTS_CLASS_THUNK_CONTAINER_OF(ExternalValueOf(Info), JSPropertyInfo, GetterData);
    PropertyInfo->Getter(&v8impl::g_pesapi_ffi, (pesapi_callback_info) (&Info));
}

inline void SetterThunk(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    auto PropertyInfo = PUERTS_CLASS_THUNK_CONTAINER_OF(ExternalValueOf(Info), JSPropertyInfo, SetterData);
    PropertyInfo->Setter(&v8impl::g_pesapi_ffi, (pesapi_callback_info) (&Info));
}

FORCEINLINE v8::Local<v8::External> MethodData(v8::Isolate* Isolate, const JSFunctionInfo* FunctionInfo)
{
    return v8::External::New(Isolate, const_cast<void**>(&FunctionInfo->Data));
}

// Behavior is only used when there is no fast call info (with fast call info the function can not be a constructor)
inline v8::Local<v8::FunctionTemplate> MethodTemplate(
    v8::Isolate* Isolate, const JSFunctionInfo* FunctionInfo, v8::ConstructorBehavior Behavior)
{
    auto FastCallInfo = FunctionInfo->ReflectionInfo ? FunctionInfo->ReflectionInfo->FastCallInfo() : nullptr;
    if (FastCallInfo)
    {
        return v8::FunctionTemplate::New(Isolate, MethodThunk, MethodData(Isolate, FunctionInfo), v8::Local<v8::Signature>(), 0,
            v8::ConstructorBehavior::kThrow, v8::SideEffectType::kHasSideEffect, FastCallInfo);
    }
    return v8::FunctionTemplate::New(
        Isolate, MethodThunk, MethodData(Isolate, FunctionInfo), v8::Local<v8::Signature>(), 0, Behavior);
}

FORCEINLINE v8::Local<v8::FunctionTemplate> GetterTemplate(v8::Isolate* Isolate, const JSPropertyInfo* PropertyInfo)
{
    return PropertyInfo->Getter ? v8::FunctionTemplate::New(Isolate, GetterThunk,
                                      v8::External::New(Isolate, const_cast<void**>(&PropertyInfo->GetterData)))
                                : v8::Local<v8::FunctionTemplate>();
}

FORCEINLINE v8::Local<v8::FunctionTemplate> SetterTemplate(v8::Isolate* Isolate, const JSPropertyInfo* PropertyInfo)
{
    return PropertyInfo->Setter ? v8::FunctionTemplate::New(Isolate, SetterThunk,
                                      v8::External::New(Isolate, const_cast<void**>(&PropertyInfo->SetterData)))
                                : v8::Local<v8::FunctionTemplate>();
}

// the data of the constructor template of a c++ class is an External pointing to ClassDefinition->Data
FORCEINLINE JSClassDefinition* ClassDefinitionOf(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    return PUERTS_CLASS_THUNK_CONTAINER_OF(ExternalValueOf(Info), JSClassDefinition, Data);
}

FORCEINLINE void* Construct(pesapi_constructor Initialize, const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    return Initialize ? Initialize(&v8impl::g_pesapi_ffi, (pesapi_callback_info) (&Info)) : nullptr;
}

FORCEINLINE void Finalize(pesapi_finalize Finalizer, void* Ptr, void* ClassData, void* EnvPrivate)
{
    if (Finalizer)
    {
        Finalizer(&v8impl::g_pesapi_ffi, Ptr, ClassData, EnvPrivate);
    }
}

#undef PUERTS_CLASS_THUNK_CONTAINER_OF
}    // namespace ClassThunks
}    // namespace PUERTS_NAMESPACE

#endif    // WITH_QUICKJS

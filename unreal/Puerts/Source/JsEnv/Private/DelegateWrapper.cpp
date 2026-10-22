/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "DelegateWrapper.h"
#include "ObjectMapper.h"
#include "V8Utils.h"
#include "PesapiClassThunks.h"
#include "PapiUtils.h"

namespace PUERTS_NAMESPACE
{
static v8::Local<v8::FunctionTemplate> DelegateTemplate(
    v8::Isolate* Isolate, v8::FunctionCallback Constructor, const JSFunctionInfo* Methods, int MethodCount)
{
    auto Result = v8::FunctionTemplate::New(Isolate, Constructor);
    Result->InstanceTemplate()->SetInternalFieldCount(2);
    for (int i = 0; i < MethodCount; ++i)
    {
        Result->PrototypeTemplate()->Set(FV8Utils::InternalString(Isolate, Methods[i].Name),
            ClassThunks::MethodTemplate(Isolate, &Methods[i], v8::ConstructorBehavior::kAllow));
    }
    return Result;
}

v8::Local<v8::FunctionTemplate> FDelegateWrapper::ToFunctionTemplate(v8::Isolate* Isolate)
{
    // the entries are referenced by the function templates, so they must have static storage
    static const JSFunctionInfo Methods[] = {{"Bind", &Bind}, {"IsBound", &IsBound}, {"Unbind", &Unbind}, {"Execute", &Execute}};
    return DelegateTemplate(Isolate, New, Methods, UE_ARRAY_COUNT(Methods));
}

void FDelegateWrapper::New(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
}

void FDelegateWrapper::IsBound(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    auto DelegatePtr = static_cast<FScriptDelegate*>(Apis->get_native_holder_ptr(Info));
    Apis->add_return(Info, Apis->create_boolean(Apis->get_env(Info), DelegatePtr->IsBound()));
}

void FDelegateWrapper::Bind(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    const int ArgCount = Apis->get_args_len(Info);
    if (ArgCount == 1 && Apis->is_function(Env, Apis->get_arg(Info, 0)))
    {
        auto DelegatePtr = Apis->get_native_holder_ptr(Info);
        PapiUtils::AddToDelegate(Env, DelegatePtr, Apis->get_arg(Info, 0));
        return;
    }
    if (ArgCount == 2 && Apis->is_object(Env, Apis->get_arg(Info, 0)) && Apis->is_string(Env, Apis->get_arg(Info, 1)))
    {
        if (auto Object = PapiUtils::GetUObject(Apis, Env, Apis->get_arg(Info, 0)))
        {
            if (FV8Utils::IsReleasedPtr(Object))
            {
                Apis->throw_by_string(Info, "passing a invalid object");
                return;
            }
            auto DelegatePtr = static_cast<FScriptDelegate*>(Apis->get_native_holder_ptr(Info));
            FScriptDelegate Delegate;
            Delegate.BindUFunction(Object, FName(*PapiUtils::ToFString(Apis, Env, Apis->get_arg(Info, 1))));
            *DelegatePtr = Delegate;
            return;
        }
    }
    Apis->throw_by_string(Info, "invalid arguments");
}

void FDelegateWrapper::Unbind(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    auto DelegatePtr = Apis->get_native_holder_ptr(Info);
    PapiUtils::ClearDelegate(Env, DelegatePtr);
}

void FDelegateWrapper::Execute(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    auto DelegatePtr = Apis->get_native_holder_ptr(Info);
    PapiUtils::ExecuteDelegate(Env, Info, DelegatePtr);
}

v8::Local<v8::FunctionTemplate> FMulticastDelegateWrapper::ToFunctionTemplate(v8::Isolate* Isolate)
{
    static const JSFunctionInfo Methods[] = {{"Add", &Add}, {"Remove", &Remove}, {"Clear", &Clear}, {"Broadcast", &Broadcast}};
    return DelegateTemplate(Isolate, New, Methods, UE_ARRAY_COUNT(Methods));
}

void FMulticastDelegateWrapper::New(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
}

void FMulticastDelegateWrapper::Add(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    const int ArgCount = Apis->get_args_len(Info);
    if (ArgCount == 1 && Apis->is_function(Env, Apis->get_arg(Info, 0)))
    {
        auto DelegatePtr = Apis->get_native_holder_ptr(Info);
        PapiUtils::AddToDelegate(Env, DelegatePtr, Apis->get_arg(Info, 0));
        return;
    }
    if (ArgCount == 2 && Apis->is_object(Env, Apis->get_arg(Info, 0)) && Apis->is_string(Env, Apis->get_arg(Info, 1)))
    {
        if (auto Object = PapiUtils::GetUObject(Apis, Env, Apis->get_arg(Info, 0)))
        {
            if (FV8Utils::IsReleasedPtr(Object))
            {
                Apis->throw_by_string(Info, "passing a invalid object");
                return;
            }
            auto DelegatePtr = Apis->get_native_holder_ptr(Info);
            if (auto Property = CastFieldMacro<MulticastDelegatePropertyMacro>(PapiUtils::FindDelegateProperty(Env, DelegatePtr)))
            {
                FScriptDelegate Delegate;
                Delegate.BindUFunction(Object, FName(*PapiUtils::ToFString(Apis, Env, Apis->get_arg(Info, 1))));

#if ENGINE_MINOR_VERSION >= 23 || ENGINE_MAJOR_VERSION > 4
                if (Property->IsA<MulticastSparseDelegatePropertyMacro>())
                {
                    Property->AddDelegate(MoveTemp(Delegate), nullptr, DelegatePtr);
                }
                else
#endif
                {
                    static_cast<FMulticastScriptDelegate*>(DelegatePtr)->AddUnique(Delegate);
                }
                return;
            }
        }
    }
    Apis->throw_by_string(Info, "invalid arguments");
}

void FMulticastDelegateWrapper::Remove(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    if (Apis->get_args_len(Info) == 1 && Apis->is_function(Env, Apis->get_arg(Info, 0)))
    {
        auto DelegatePtr = Apis->get_native_holder_ptr(Info);
        PapiUtils::RemoveFromDelegate(Env, DelegatePtr, Apis->get_arg(Info, 0));
    }
    else
    {
        Apis->throw_by_string(Info, "invalid arguments");
    }
}

void FMulticastDelegateWrapper::Clear(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    auto DelegatePtr = Apis->get_native_holder_ptr(Info);
    PapiUtils::ClearDelegate(Env, DelegatePtr);
}

void FMulticastDelegateWrapper::Broadcast(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    auto DelegatePtr = Apis->get_native_holder_ptr(Info);
    PapiUtils::ExecuteDelegate(Env, Info, DelegatePtr);
}
}    // namespace PUERTS_NAMESPACE

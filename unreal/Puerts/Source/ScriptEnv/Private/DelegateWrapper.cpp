/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "DelegateWrapper.h"
#include "ObjectMapper.h"
#include "PapiUtils.h"

namespace PUERTS_NAMESPACE
{
// the type ids of the delegate classes (different values, so identical constants folding can not merge them)
static const char DelegateTypeTag = 'D';

static const char MulticastDelegateTypeTag = 'M';

static JSClassDefinition DelegateClassDefinition(const void* TypeId, const char* ScriptName, JSFunctionInfo* Methods)
{
    JSClassDefinition Result = JSClassEmptyDefinition;
    Result.TypeId = TypeId;
    Result.ScriptName = ScriptName;
    Result.Methods = Methods;
    return Result;
}

const void* FDelegateWrapper::TypeId()
{
    return &DelegateTypeTag;
}

const JSClassDefinition* FDelegateWrapper::GetClassDefinition()
{
    // the entries are referenced by the class definition, so they must have static storage
    static JSFunctionInfo Methods[] = {
        {"Bind", &Bind}, {"IsBound", &IsBound}, {"Unbind", &Unbind}, {"Execute", &Execute}, JSFunctionInfo()};
    static const JSClassDefinition Definition = DelegateClassDefinition(&DelegateTypeTag, "FScriptDelegate", Methods);
    return &Definition;
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
        PapiUtils::AddToDelegate(Apis, Env, DelegatePtr, Apis->get_arg(Info, 0));
        return;
    }
    if (ArgCount == 2 && Apis->is_object(Env, Apis->get_arg(Info, 0)) && Apis->is_string(Env, Apis->get_arg(Info, 1)))
    {
        if (auto Object = PapiUtils::GetUObject(Apis, Env, Apis->get_arg(Info, 0)))
        {
            if (PapiUtils::IsReleasedPtr(Object))
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
    PapiUtils::ClearDelegate(Apis, Env, DelegatePtr);
}

void FDelegateWrapper::Execute(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    auto DelegatePtr = Apis->get_native_holder_ptr(Info);
    PapiUtils::ExecuteDelegate(Apis, Env, Info, DelegatePtr);
}

const void* FMulticastDelegateWrapper::TypeId()
{
    return &MulticastDelegateTypeTag;
}

const JSClassDefinition* FMulticastDelegateWrapper::GetClassDefinition()
{
    static JSFunctionInfo Methods[] = {
        {"Add", &Add}, {"Remove", &Remove}, {"Clear", &Clear}, {"Broadcast", &Broadcast}, JSFunctionInfo()};
    static const JSClassDefinition Definition =
        DelegateClassDefinition(&MulticastDelegateTypeTag, "FMulticastScriptDelegate", Methods);
    return &Definition;
}

void FMulticastDelegateWrapper::Add(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    const int ArgCount = Apis->get_args_len(Info);
    if (ArgCount == 1 && Apis->is_function(Env, Apis->get_arg(Info, 0)))
    {
        auto DelegatePtr = Apis->get_native_holder_ptr(Info);
        PapiUtils::AddToDelegate(Apis, Env, DelegatePtr, Apis->get_arg(Info, 0));
        return;
    }
    if (ArgCount == 2 && Apis->is_object(Env, Apis->get_arg(Info, 0)) && Apis->is_string(Env, Apis->get_arg(Info, 1)))
    {
        if (auto Object = PapiUtils::GetUObject(Apis, Env, Apis->get_arg(Info, 0)))
        {
            if (PapiUtils::IsReleasedPtr(Object))
            {
                Apis->throw_by_string(Info, "passing a invalid object");
                return;
            }
            auto DelegatePtr = Apis->get_native_holder_ptr(Info);
            if (auto Property =
                    CastFieldMacro<MulticastDelegatePropertyMacro>(PapiUtils::FindDelegateProperty(Apis, Env, DelegatePtr)))
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
        PapiUtils::RemoveFromDelegate(Apis, Env, DelegatePtr, Apis->get_arg(Info, 0));
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
    PapiUtils::ClearDelegate(Apis, Env, DelegatePtr);
}

void FMulticastDelegateWrapper::Broadcast(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    auto DelegatePtr = Apis->get_native_holder_ptr(Info);
    PapiUtils::ExecuteDelegate(Apis, Env, Info, DelegatePtr);
}
}    // namespace PUERTS_NAMESPACE

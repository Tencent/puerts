/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "DelegateWrapper.h"
#include "ObjectMapper.h"
#include "V8Utils.h"

namespace PUERTS_NAMESPACE
{
v8::Local<v8::FunctionTemplate> FDelegateWrapper::ToFunctionTemplate(v8::Isolate* Isolate)
{
    auto Result = v8::FunctionTemplate::New(Isolate, New);
    Result->InstanceTemplate()->SetInternalFieldCount(2);

    Result->PrototypeTemplate()->Set(FV8Utils::InternalString(Isolate, "Bind"), v8::FunctionTemplate::New(Isolate, Bind));
    Result->PrototypeTemplate()->Set(FV8Utils::InternalString(Isolate, "IsBound"), v8::FunctionTemplate::New(Isolate, IsBound));
    Result->PrototypeTemplate()->Set(FV8Utils::InternalString(Isolate, "Unbind"), v8::FunctionTemplate::New(Isolate, Unbind));
    Result->PrototypeTemplate()->Set(FV8Utils::InternalString(Isolate, "Execute"), v8::FunctionTemplate::New(Isolate, Execute));

    return Result;
}

void FDelegateWrapper::New(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
}

void FDelegateWrapper::IsBound(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    auto DelegatePtr = FV8Utils::GetPointerFast<FScriptDelegate>(Info.Holder(), 0);

    Info.GetReturnValue().Set(DelegatePtr->IsBound());
}

void FDelegateWrapper::Bind(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    if (Info.Length() == 1 && Info[0]->IsFunction())
    {
        auto DelegatePtr = FV8Utils::GetPointerFast<void>(Info.Holder(), 0);
        FV8Utils::IsolateData<IObjectMapper>(Isolate)->AddToDelegate(
            Isolate, Context, DelegatePtr, v8::Local<v8::Function>::Cast(Info[0]));
        return;
    }
    if (Info.Length() == 2 && Info[0]->IsObject() && Info[1]->IsString())
    {
        if (auto Object = FV8Utils::GetUObject(Info[0].As<v8::Object>()))
        {
            if (FV8Utils::IsReleasedPtr(Object))
            {
                FV8Utils::ThrowException(Isolate, "passing a invalid object");
                return;
            }
            auto DelegatePtr = FV8Utils::GetPointerFast<FScriptDelegate>(Info.Holder(), 0);
            FScriptDelegate Delegate;
            Delegate.BindUFunction(Object, FName(*FV8Utils::ToFString(Isolate, Info[1])));
            *DelegatePtr = Delegate;
            return;
        }
    }
    FV8Utils::ThrowException(Isolate, "invalid arguments");
}

void FDelegateWrapper::Unbind(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    auto DelegatePtr = FV8Utils::GetPointerFast<void>(Info.Holder(), 0);
    FV8Utils::IsolateData<IObjectMapper>(Isolate)->ClearDelegate(Isolate, Context, DelegatePtr);
}

void FDelegateWrapper::Execute(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    auto DelegatePtr = FV8Utils::GetPointerFast<void>(Info.Holder(), 0);
    FV8Utils::IsolateData<IObjectMapper>(Isolate)->ExecuteDelegate(Isolate, Context, Info, DelegatePtr);
}

v8::Local<v8::FunctionTemplate> FMulticastDelegateWrapper::ToFunctionTemplate(v8::Isolate* Isolate)
{
    auto Result = v8::FunctionTemplate::New(Isolate, New);
    Result->InstanceTemplate()->SetInternalFieldCount(2);

    Result->PrototypeTemplate()->Set(FV8Utils::InternalString(Isolate, "Add"), v8::FunctionTemplate::New(Isolate, Add));
    Result->PrototypeTemplate()->Set(FV8Utils::InternalString(Isolate, "Remove"), v8::FunctionTemplate::New(Isolate, Remove));
    Result->PrototypeTemplate()->Set(FV8Utils::InternalString(Isolate, "Clear"), v8::FunctionTemplate::New(Isolate, Clear));
    Result->PrototypeTemplate()->Set(FV8Utils::InternalString(Isolate, "Broadcast"), v8::FunctionTemplate::New(Isolate, Broadcast));

    return Result;
}

void FMulticastDelegateWrapper::New(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
}

void FMulticastDelegateWrapper::Add(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    if (Info.Length() == 1 && Info[0]->IsFunction())
    {
        auto DelegatePtr = FV8Utils::GetPointerFast<void>(Info.Holder(), 0);
        FV8Utils::IsolateData<IObjectMapper>(Isolate)->AddToDelegate(
            Isolate, Context, DelegatePtr, v8::Local<v8::Function>::Cast(Info[0]));
        return;
    }
    if (Info.Length() == 2 && Info[0]->IsObject() && Info[1]->IsString())
    {
        if (auto Object = FV8Utils::GetUObject(Info[0].As<v8::Object>()))
        {
            if (FV8Utils::IsReleasedPtr(Object))
            {
                FV8Utils::ThrowException(Isolate, "passing a invalid object");
                return;
            }
            auto DelegatePtr = FV8Utils::GetPointerFast<void>(Info.Holder(), 0);
            if (auto Property = CastFieldMacro<MulticastDelegatePropertyMacro>(
                    FV8Utils::IsolateData<IObjectMapper>(Isolate)->FindDelegateProperty(DelegatePtr)))
            {
                FScriptDelegate Delegate;
                Delegate.BindUFunction(Object, FName(*FV8Utils::ToFString(Isolate, Info[1])));

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
    FV8Utils::ThrowException(Isolate, "invalid arguments");
}

void FMulticastDelegateWrapper::Remove(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    if (Info.Length() == 1 && Info[0]->IsFunction())
    {
        auto DelegatePtr = FV8Utils::GetPointerFast<void>(Info.Holder(), 0);
        FV8Utils::IsolateData<IObjectMapper>(Isolate)->RemoveFromDelegate(
            Isolate, Context, DelegatePtr, v8::Local<v8::Function>::Cast(Info[0]));
    }
    else
    {
        FV8Utils::ThrowException(Isolate, "invalid arguments");
    }
}

void FMulticastDelegateWrapper::Clear(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    auto DelegatePtr = FV8Utils::GetPointerFast<void>(Info.Holder(), 0);
    FV8Utils::IsolateData<IObjectMapper>(Isolate)->ClearDelegate(Isolate, Context, DelegatePtr);
}

void FMulticastDelegateWrapper::Broadcast(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    auto DelegatePtr = FV8Utils::GetPointerFast<void>(Info.Holder(), 0);
    FV8Utils::IsolateData<IObjectMapper>(Isolate)->ExecuteDelegate(Isolate, Context, Info, DelegatePtr);
}
}    // namespace PUERTS_NAMESPACE

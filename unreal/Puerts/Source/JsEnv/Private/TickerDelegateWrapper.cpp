/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "TickerDelegateWrapper.h"

#if PLATFORM_ANDROID || PLATFORM_WINDOWS || PLATFORM_IOS || PLATFORM_MAC || PLATFORM_LINUX

FTickerDelegateWrapper::FTickerDelegateWrapper(bool Continue) : FunctionContinue(Continue), DelegateHandle(nullptr)
{
    // No operation
}

FTickerDelegateWrapper::~FTickerDelegateWrapper()
{
    /*
    if (GEngine) {
        GEngine->AddOnScreenDebugMessage(-1, 15.0f, FColor::Yellow, TEXT("Been Destruct!"));
    }
    */
}

v8::Isolate* FTickerDelegateWrapper::GetIsolate()
{
    return Isolate;
}

v8::Global<v8::Context>& FTickerDelegateWrapper::GetContext()
{
    return DefaultContext;
}

v8::Global<v8::Function>& FTickerDelegateWrapper::GetFunction()
{
    return DefaultFunction;
}

void FTickerDelegateWrapper::Init(const v8::FunctionCallbackInfo<v8::Value>& Info,
    std::function<void(v8::Isolate*, v8::TryCatch*)> InExceptionHandler,
    std::function<void(FDelegateHandle*)> InDelegateHandleCleaner)
{
    Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(GetIsolate());
    v8::HandleScope HandleScope(GetIsolate());
    DefaultContext.Reset(GetIsolate(), GetIsolate()->GetCurrentContext());
    DefaultFunction.Reset(GetIsolate(), v8::Local<v8::Function>::Cast(Info[0]));
    ExceptionHandler = InExceptionHandler;
    DelegateHandleCleaner = InDelegateHandleCleaner;
}

bool FTickerDelegateWrapper::CallFunction(float)
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
    v8::Isolate::Scope Isolatescope(Isolate);
    v8::HandleScope HandleScope(GetIsolate());
    v8::Local<v8::Context> Context = v8::Local<v8::Context>::New(GetIsolate(), GetContext());
    v8::Context::Scope ContextScope(Context);
    v8::Local<v8::Function> Function = v8::Local<v8::Function>::New(GetIsolate(), GetFunction());

    v8::TryCatch TryCatch(GetIsolate());
    IsCalling = true;
    v8::MaybeLocal<v8::Value> Result = Function->Call(Context, Context->Global(), 0, nullptr);
    IsCalling = false;
    if (TryCatch.HasCaught())
    {
        ExceptionHandler(GetIsolate(), &TryCatch);
    }

    const bool Continue = FunctionContinue;
    if (!Continue)
    {
        DelegateHandleCleaner(DelegateHandle);
    }
    return Continue;
}

void FTickerDelegateWrapper::SetDelegateHandle(FDelegateHandle* Handle)
{
    DelegateHandle = Handle;
}

#endif    // PLATFORM_ANDROID || PLATFORM_WINDOWS || PLATFORM_IOS || PLATFORM_MAC || PLATFORM_LINUX

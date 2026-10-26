/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "DynamicDelegateProxy.h"

UWorld* UDynamicDelegateProxy::GetWorld() const
{
    if (Owner.IsValid())
    {
        return Owner->GetWorld();
    }
    return UObject::GetWorld();
}

void UDynamicDelegateProxy::BeginDestroy()
{
    ResetJsFunction();
    Super::BeginDestroy();
}

void UDynamicDelegateProxy::SetJsFunction(struct pesapi_ffi* InApis, pesapi_env Env, pesapi_value Function)
{
    ResetJsFunction();
    Apis = InApis;
    JsFunction = Apis->create_value_ref(Env, Function, 0);
}

void UDynamicDelegateProxy::ResetJsFunction()
{
    if (JsFunction)
    {
        // safe after the env is gone: the ref only frees its memory then
        Apis->release_value_ref(JsFunction);
        JsFunction = nullptr;
    }
}

void UDynamicDelegateProxy::Fire()
{
    // Do Nothing
}

void UDynamicDelegateProxy::ProcessEvent(UFunction*, void* Params)
{
    // the lock of the backend (THREAD_SAFE) is taken by the env scope in InvokeDelegateCallback
    auto PinedDynamicInvoker = DynamicInvoker.Pin();
    if (PinedDynamicInvoker && Owner.IsValid())
    {
        if (ensureAlwaysMsgf(JsFunction, TEXT("Invalid JS Function")))
        {
            PinedDynamicInvoker->InvokeDelegateCallback(this, Params);
        }
    }
}

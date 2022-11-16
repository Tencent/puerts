/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "DynamicDelegateProxy.h"

void UDynamicDelegateProxy::Fire()
{
    // Do Nothing
}

void UDynamicDelegateProxy::ProcessEvent(UFunction*, void* Params)
{
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    auto PinedDynamicInvoker = DynamicInvoker.Pin();
    if (PinedDynamicInvoker && Owner.IsValid())
    {
        if (ensureAlwaysMsgf(!JsFunction.IsEmpty(), TEXT("Invalid JS Function")))
        {
            PinedDynamicInvoker->InvokeDelegateCallback(this, Params);
        }
    }
}

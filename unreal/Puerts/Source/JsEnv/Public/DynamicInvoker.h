/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#pragma warning(push, 0)
#include "libplatform/libplatform.h"
#include "v8.h"
#pragma warning(pop)

#include "CoreUObject.h"

class UDynamicDelegateProxy;
class UJSGeneratedFunction;
namespace puerts
{
class IDynamicInvoker
{
public:
    virtual void InvokeDelegateCallback(UDynamicDelegateProxy* Proxy, void* Params) = 0;

#if !defined(ENGINE_INDEPENDENT_JSENV)
    virtual void JsConstruct(UClass* Class, UObject* Object, const v8::UniquePersistent<v8::Function>& Constructor,
        const v8::UniquePersistent<v8::Object>& Prototype) = 0;

    virtual void InvokeJsMethod(UObject* ContextObject, UJSGeneratedFunction* Function, FFrame& Stack, void* RESULT_PARAM) = 0;

    virtual void InvokeMixinMethod(UObject* ContextObject, UJSGeneratedFunction* Function, FFrame& Stack, void* RESULT_PARAM) = 0;
#endif
};

}    // namespace puerts

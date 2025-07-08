/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "NamespaceDef.h"

#include "CoreUObject.h"

PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS
#pragma warning(push, 0)
#include "v8.h"
#pragma warning(pop)
PRAGMA_ENABLE_UNDEFINED_IDENTIFIER_WARNINGS

class UDynamicDelegateProxy;
class UJSGeneratedFunction;
namespace PUERTS_NAMESPACE
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

}    // namespace PUERTS_NAMESPACE

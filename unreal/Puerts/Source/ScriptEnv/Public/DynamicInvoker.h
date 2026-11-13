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
#include "pesapi.h"

class UDynamicDelegateProxy;
namespace PUERTS_NAMESPACE
{
// calls the js callbacks of a delegate proxy (the mixin methods are called by IMixinInvoker of ScriptEnvMixin.h)
class IDynamicInvoker
{
public:
    virtual void InvokeDelegateCallback(UDynamicDelegateProxy* Proxy, void* Params) = 0;
};

}    // namespace PUERTS_NAMESPACE

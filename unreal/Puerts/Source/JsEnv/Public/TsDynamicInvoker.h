/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "UObject/Stack.h"
#include "UObject/Object.h"
#include "UObject/Class.h"
#include "PuertsNamespaceDef.h"

class UTypeScriptGeneratedClass;

namespace PUERTS_NAMESPACE
{
class ITsDynamicInvoker
{
public:
    virtual void TsConstruct(UTypeScriptGeneratedClass* Class, UObject* Object) = 0;

    virtual void InvokeTsMethod(UObject* ContextObject, UFunction* Function, FFrame& Stack, void* RESULT_PARAM) = 0;

    virtual void NotifyReBind(UTypeScriptGeneratedClass* Class) = 0;
};

}    // namespace PUERTS_NAMESPACE

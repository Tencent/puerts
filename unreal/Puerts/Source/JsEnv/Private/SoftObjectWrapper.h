/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "CoreMinimal.h"

#include "NamespaceDef.h"

PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS
#pragma warning(push, 0)
#include "libplatform/libplatform.h"
#include "v8.h"
#pragma warning(pop)
PRAGMA_ENABLE_UNDEFINED_IDENTIFIER_WARNINGS

namespace PUERTS_NAMESPACE
{
class FSoftObjectWrapper
{
public:
    static v8::Local<v8::FunctionTemplate> ToFunctionTemplate(v8::Isolate* Isolate);

private:
    static void LoadSynchronous(const v8::FunctionCallbackInfo<v8::Value>& Info);

    static void Get(const v8::FunctionCallbackInfo<v8::Value>& Info);
};
}    // namespace PUERTS_NAMESPACE

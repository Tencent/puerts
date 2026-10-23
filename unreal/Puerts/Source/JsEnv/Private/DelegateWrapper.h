/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "CoreMinimal.h"
#include "CoreUObject.h"

#include "NamespaceDef.h"
#include "pesapi.h"
#include "JSClassRegister.h"

namespace PUERTS_NAMESPACE
{
// registry classes (process wide, fixed type id), the native object is the FScriptDelegate / FMulticastScriptDelegate, which is
// not owned by the js object: the wrapper is held by the DelegateMap of the env and the delegate is released there
class FDelegateWrapper
{
public:
    static const JSClassDefinition* GetClassDefinition();

    static const void* TypeId();

private:
    static void Bind(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void IsBound(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void Unbind(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void Execute(struct pesapi_ffi* Apis, pesapi_callback_info Info);
};

class FMulticastDelegateWrapper
{
public:
    static const JSClassDefinition* GetClassDefinition();

    static const void* TypeId();

private:
    static void Add(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void Remove(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void Clear(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void Broadcast(struct pesapi_ffi* Apis, pesapi_callback_info Info);
};
}    // namespace PUERTS_NAMESPACE

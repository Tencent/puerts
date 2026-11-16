/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "CoreMinimal.h"

#include "NamespaceDef.h"
#include "pesapi.h"
#include "JSClassRegister.h"

namespace PUERTS_NAMESPACE
{
// a registry class (process wide, fixed type id), the native object is a TWeakObjectPtr<UObject> owned by the js object
class FWeakObjectPtrWrapper
{
public:
    static const JSClassDefinition* GetClassDefinition();

    static const void* TypeId();

    // UE.MakeWeakObjectPtr(obj)
    static void Make(struct pesapi_ffi* Apis, pesapi_callback_info Info);

private:
    static void Get(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void IsValid(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void Finalize(struct pesapi_ffi* Apis, void* Ptr, void* ClassData, void* EnvPrivate);
};
}    // namespace PUERTS_NAMESPACE

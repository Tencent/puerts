/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "CoreMinimal.h"
#include "UObject/SoftObjectPtr.h"

#include "NamespaceDef.h"
#include "pesapi.h"
#include "JSClassRegister.h"

namespace PUERTS_NAMESPACE
{
// the native object of a soft object / soft class wrapper, owned by the js object
struct FSoftObjectHolder
{
    FSoftObjectPtr Ptr;
    // the class of a soft object property or the meta class of a soft class property
    TWeakObjectPtr<UClass> Class;
    bool IsSoftClass;
};

// a registry class (process wide, fixed type id), the native object is an FSoftObjectHolder
class FSoftObjectWrapper
{
public:
    static const JSClassDefinition* GetClassDefinition();

    static const void* TypeId();

    // a new js object holding a copy of SoftObjectPtr
    static pesapi_value Wrap(
        struct pesapi_ffi* Apis, pesapi_env Env, const FSoftObjectPtr& SoftObjectPtr, UClass* Class, bool IsSoftClass);

    // the FSoftObjectPtr held by a soft object / soft class wrapper, nullptr for other values
    static FSoftObjectPtr* SoftObjectPtrOf(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value);

private:
    static void LoadSynchronous(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void Get(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void Finalize(struct pesapi_ffi* Apis, void* Ptr, void* ClassData, void* EnvPrivate);
};
}    // namespace PUERTS_NAMESPACE

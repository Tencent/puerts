/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "JsObject.h"

namespace
{
// The reference count of a papi value reference is not atomic and releasing a reference of a living env resets an engine
// handle, so in THREAD_SAFE builds they are done with the isolate lock (taken by a papi scope) like the other accesses.
// Nothing is locked if the env is destroyed: the reference is only freed then.
struct FRefLock
{
#ifdef THREAD_SAFE
    FRefLock(struct pesapi_ffi* InApis, pesapi_value_ref ValueRef) : Apis(InApis), Scope(nullptr)
    {
        pesapi_env_ref EnvRef = Apis->get_ref_associated_env(ValueRef);
        if (Apis->env_ref_is_valid(EnvRef))
        {
            Scope = Apis->open_scope_placement(EnvRef, &Memory);
        }
    }

    ~FRefLock()
    {
        if (Scope)
        {
            Apis->close_scope_placement(Scope);
        }
    }

    struct pesapi_ffi* Apis;
    pesapi_scope Scope;
    alignas(void*) pesapi_scope_memory Memory;
#else
    FRefLock(struct pesapi_ffi*, pesapi_value_ref)
    {
    }
#endif
};
}    // namespace

FJsObject::FJsObject(struct pesapi_ffi* InApis, pesapi_env Env, pesapi_value Value) : Apis(nullptr), ValueRef(nullptr)
{
    if (InApis && Env && Value && InApis->is_object(Env, Value))
    {
        Apis = InApis;
        ValueRef = Apis->create_value_ref(Env, Value, 0);
    }
}

FJsObject::FJsObject(const FJsObject& InOther) : Apis(InOther.Apis), ValueRef(nullptr)
{
    if (InOther.ValueRef)
    {
        FRefLock Lock(Apis, InOther.ValueRef);
        ValueRef = Apis->duplicate_value_ref(InOther.ValueRef);
    }
}

FJsObject::FJsObject(FJsObject&& InOther) noexcept : Apis(InOther.Apis), ValueRef(InOther.ValueRef)
{
    InOther.Apis = nullptr;
    InOther.ValueRef = nullptr;
}

FJsObject::~FJsObject()
{
    Release();
}

FJsObject& FJsObject::operator=(const FJsObject& InOther)
{
    if (this != &InOther && ValueRef != InOther.ValueRef)
    {
        Release();
        if (InOther.ValueRef)
        {
            FRefLock Lock(InOther.Apis, InOther.ValueRef);
            Apis = InOther.Apis;
            ValueRef = Apis->duplicate_value_ref(InOther.ValueRef);
        }
    }
    return *this;
}

FJsObject& FJsObject::operator=(FJsObject&& InOther) noexcept
{
    if (this != &InOther)
    {
        Release();
        Apis = InOther.Apis;
        ValueRef = InOther.ValueRef;
        InOther.Apis = nullptr;
        InOther.ValueRef = nullptr;
    }
    return *this;
}

bool FJsObject::IsValid() const
{
    return ValueRef && Apis->env_ref_is_valid(Apis->get_ref_associated_env(ValueRef));
}

pesapi_value FJsObject::GetValue(struct pesapi_ffi* InApis, pesapi_env Env) const
{
    if (!IsValid())
    {
        return InApis->create_undefined(Env);
    }
    return Apis->get_value_from_ref(Env, ValueRef);
}

void FJsObject::Release()
{
    if (ValueRef)
    {
        FRefLock Lock(Apis, ValueRef);
        // the scope taken by the lock does not use the env reference after it is opened, the value reference (which is
        // its env reference as well) can be released inside it
        Apis->release_value_ref(ValueRef);
    }
    Apis = nullptr;
    ValueRef = nullptr;
}

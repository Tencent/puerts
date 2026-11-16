/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "NamespaceDef.h"
#include "pesapi.h"

namespace PUERTS_NAMESPACE
{
// Move-only owner of a pesapi_value_ref (strong unless SetWeak is called). Release it while the env is alive (before
// CppObjectMapper.UnInitialize), a ref released after the env is gone only frees its memory.
class FPapiValueRef
{
public:
    FPapiValueRef() = default;

    FPapiValueRef(struct pesapi_ffi* InApis, pesapi_env Env, pesapi_value Value)
    {
        Reset(InApis, Env, Value);
    }

    FPapiValueRef(const FPapiValueRef&) = delete;
    FPapiValueRef& operator=(const FPapiValueRef&) = delete;

    FPapiValueRef(FPapiValueRef&& Other) noexcept : Apis(Other.Apis), Ref(Other.Ref)
    {
        Other.Ref = nullptr;
    }

    FPapiValueRef& operator=(FPapiValueRef&& Other) noexcept
    {
        if (this != &Other)
        {
            Reset();
            Apis = Other.Apis;
            Ref = Other.Ref;
            Other.Ref = nullptr;
        }
        return *this;
    }

    ~FPapiValueRef()
    {
        Reset();
    }

    void Reset()
    {
        if (Ref)
        {
            Apis->release_value_ref(Ref);
            Ref = nullptr;
        }
    }

    void Reset(struct pesapi_ffi* InApis, pesapi_env Env, pesapi_value Value)
    {
        Reset();
        Apis = InApis;
        if (Value)
        {
            Ref = Apis->create_value_ref(Env, Value, 0);
        }
    }

    pesapi_value Get(pesapi_env Env) const
    {
        return Ref ? Apis->get_value_from_ref(Env, Ref) : nullptr;
    }

    // the value is not kept alive by the ref from now on, Get returns nullptr after the value is garbage collected
    void SetWeak(pesapi_env Env)
    {
        if (Ref)
        {
            Apis->set_ref_weak(Env, Ref);
        }
    }

    explicit operator bool() const
    {
        return Ref != nullptr;
    }

    pesapi_value_ref GetRef() const
    {
        return Ref;
    }

private:
    struct pesapi_ffi* Apis = nullptr;
    pesapi_value_ref Ref = nullptr;
};
}    // namespace PUERTS_NAMESPACE

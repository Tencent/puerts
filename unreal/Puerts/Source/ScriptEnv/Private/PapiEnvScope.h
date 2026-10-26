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
// The entry of an env from the host (ticker, UObject callbacks, hot reload, ...): opens a papi scope on the env, which does
// whatever the backend needs before js can be touched (for v8: locker, isolate/context enter, handle scope and try catch).
// The scope is not opened if the env is gone, check it with operator bool before touching js.
// The memory of the scope is a member, so a nested entry (an FPapiEnvScope inside a js callback) has its own memory.
class FPapiEnvScope
{
public:
    FPapiEnvScope(struct pesapi_ffi* InApis, pesapi_env_ref EnvRef) : Apis(InApis)
    {
        Scope = EnvRef ? Apis->open_scope_placement(EnvRef, &Memory) : nullptr;
        Env = Scope ? Apis->get_env_from_ref(EnvRef) : nullptr;
    }

    ~FPapiEnvScope()
    {
        if (Scope)
        {
            Apis->close_scope_placement(Scope);
        }
    }

    FPapiEnvScope(const FPapiEnvScope&) = delete;
    FPapiEnvScope& operator=(const FPapiEnvScope&) = delete;

    explicit operator bool() const
    {
        return Env != nullptr;
    }

    pesapi_env GetEnv() const
    {
        return Env;
    }

    pesapi_scope GetScope() const
    {
        return Scope;
    }

    bool HasCaught() const
    {
        return Scope && Apis->has_caught(Scope);
    }

    // valid until the next call or the scope is closed
    const char* GetExceptionAsString(bool WithStack = true) const
    {
        return Scope ? Apis->get_exception_as_string(Scope, WithStack) : "";
    }

private:
    struct pesapi_ffi* Apis;
    pesapi_scope_memory Memory;
    pesapi_scope Scope;
    pesapi_env Env;
};
}    // namespace PUERTS_NAMESPACE

/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "PapiBackend.h"
#include "JSLogger.h"
#include <memory>

namespace PUERTS_NAMESPACE
{
// the js language part of a backend (BackendJs of unity), engine independent: binds the module system and the promise
// rejection handler of js to the `puerts` object (created by the host) and the global, and executes the bootstrap scripts
class SCRIPTENV_API FPapiBackendJs : public IPapiBackend
{
public:
    explicit FPapiBackendJs(std::shared_ptr<ILogger> InLogger) : Logger(std::move(InLogger))
    {
    }

    virtual void OnEnter(IPapiScriptHost* Host) override;

    virtual void OnExit(IPapiScriptHost* Host) override;

    // a js Proxy at the end of the prototype chain of the class
    virtual void InstallNameFixing(pesapi_env Env, pesapi_value Class, pesapi_callback FixName) override;

protected:
    // the engine part of the js runtime, called inside a scope of the env

    // starts the module loader and the promise rejection tracking of the env
    virtual void StartRuntime(pesapi_env Env) = 0;

    // stops what StartRuntime started, while the env is alive
    virtual void StopRuntime() = 0;

    // a require function resolving relative to Referrer (a url, "" for the root)
    virtual pesapi_value CreateRequire(pesapi_env Env, const char* Referrer) = 0;

    // handler(event, promise, value), a value which is not a function clears it
    virtual void SetPromiseRejectHandler(pesapi_env Env, pesapi_value Handler) = 0;

    std::shared_ptr<ILogger> Logger;

    // the main ref of the env, set by CreateEnvRef of the engine part
    pesapi_env_ref MainEnvRef = nullptr;

private:
    static void GenRequire(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void RegisterBuiltin(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void SetPromiseRejectHandlerCallback(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    // the cached functions of InstallNameFixing, released by OnExit
    pesapi_value_ref NameFixingProxy = nullptr;

    pesapi_value_ref SetPrototypeOf = nullptr;
};
}    // namespace PUERTS_NAMESPACE

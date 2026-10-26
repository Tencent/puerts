/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

// The backend of an env: a script engine and the language running on it, the same layering as Puerts.Backend of unity
// (Backend -> BackendJs -> BackendV8). The env (the host) only uses this interface and the pesapi function table returned by
// GetApi, it does not depend on the implementation of a backend:
//
//   IPapiBackend    engine and language independent
//   FPapiBackendJs  the js language part (bootstrap scripts, module system bindings), engine independent
//   FPapiBackendV8  the v8 engine part (isolate, context, module loader, promise rejection tracking)
//
// Life cycle of an env:
//   CreateEnvRef -> (the host binds its functions) -> OnEnter -> ... -> OnExit -> DestroyEnvRef

#include "CoreMinimal.h"
#include "pesapi.h"
#include "NamespaceDef.h"

namespace PUERTS_NAMESPACE
{
// the env a backend is entered into (ScriptEnv of unity)
class IPapiScriptHost
{
public:
    // loads and executes a script of the language (a bootstrap script or a module) by the loader of the host, errors are
    // reported by the host
    virtual void ExecuteModule(const FString& ModuleName) = 0;

protected:
    ~IPapiScriptHost() = default;
};

class IPapiBackend
{
public:
    virtual ~IPapiBackend() = default;

    // PESAPI_VERSION the backend is built with
    virtual int GetApiVersion() = 0;

    virtual struct pesapi_ffi* GetApi() = 0;

    // creates the engine instance and its env, returns the main ref of the env (released by DestroyEnvRef). One env per
    // backend instance
    virtual pesapi_env_ref CreateEnvRef() = 0;

    // destroys the env and the engine instance, the refs (pesapi_value_ref, pesapi_env_ref) still held become invalid
    virtual void DestroyEnvRef(pesapi_env_ref EnvRef) = 0;

    // initializes the language runtime after the host bound its functions (before any script of the host is executed)
    virtual void OnEnter(IPapiScriptHost* Host) = 0;

    // releases the language runtime, before the host releases its objects and DestroyEnvRef
    virtual void OnExit(IPapiScriptHost* Host) = 0;

    // module system, called inside a scope of the env. Returns the exports (nullptr with the exception thrown on failure),
    // ByImport selects the import or require semantics
    virtual pesapi_value ExecuteModule(pesapi_env Env, const char* Specifier, const char* Referrer, bool ByImport) = 0;

    // a module matched by name before the host is asked to resolve it
    virtual void RegisterBuiltinModule(pesapi_env Env, const char* Name, pesapi_value Exports) = 0;

    // memory management of the engine instance, called outside of any scope
    virtual void LowMemoryNotification() = 0;

    virtual bool IdleNotificationDeadline(double DeadlineInSeconds) = 0;

    virtual void RequestMinorGarbageCollectionForTesting() = 0;

    virtual void RequestFullGarbageCollectionForTesting() = 0;
};
}    // namespace PUERTS_NAMESPACE

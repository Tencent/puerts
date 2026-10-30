/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "PapiBackend.h"
#include "NamespaceDef.h"
#include <memory>

struct lua_State;

namespace PUERTS_NAMESPACE
{
namespace luaimpl
{
class FCppObjectMapper;
}

// the lua backend (BackendLua of unity): a lua 5.4 state, the module system is the require of lua (package.searchers) with the
// sources resolved and loaded by the host, bootstrapped by puerts/init.lua. No inspector, addons, trivially freed objects or
// name fixing
class PAPILUA_API FPapiBackendLua : public IPapiBackend
{
public:
    explicit FPapiBackendLua(const FPapiBackendParams& InParams);

    // the factory creating lua backends for FScriptEnv
    static std::unique_ptr<IPapiBackend> Create(const FPapiBackendParams& InParams);

    virtual ~FPapiBackendLua() override;

    virtual int GetApiVersion() override;

    virtual struct pesapi_ffi* GetApi() override;

    virtual pesapi_env_ref CreateEnvRef() override;

    virtual void DestroyEnvRef(pesapi_env_ref EnvRef) override;

    virtual void OnEnter(IPapiScriptHost* Host) override;

    virtual void OnExit(IPapiScriptHost* Host) override;

    virtual pesapi_value ExecuteModule(pesapi_env Env, const char* Specifier, const char* Referrer, bool ByImport) override;

    virtual void RegisterBuiltinModule(pesapi_env Env, const char* Name, pesapi_value Exports) override;

    // the string keys of a table (raw, no __pairs)
    virtual pesapi_value GetOwnKeys(pesapi_env Env, pesapi_value Object) override;

    virtual void LowMemoryNotification() override;

    virtual bool IdleNotificationDeadline(double DeadlineInSeconds) override;

    virtual void RequestMinorGarbageCollectionForTesting() override;

    virtual void RequestFullGarbageCollectionForTesting() override;

    virtual FString GetStatisticsLog() override;

    virtual FString CurrentStackTrace() override;

    virtual ScriptClassRegistry* GetRegistry() override;

private:
    FPapiBackendParams Params;

    std::unique_ptr<luaimpl::FCppObjectMapper> CppObjectMapper;

    lua_State* MainL = nullptr;

    pesapi_env_ref MainEnvRef = nullptr;
};
}    // namespace PUERTS_NAMESPACE

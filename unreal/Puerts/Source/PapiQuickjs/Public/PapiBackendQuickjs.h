/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "PapiBackendJs.h"
#include "NamespaceDef.h"
#include <memory>

struct JSRuntime;
struct JSContext;

namespace PUERTS_NAMESPACE
{
namespace qjsimpl
{
class FCppObjectMapper;
}

namespace papi_qjs
{
class FModuleLoader;
class FPromiseRejectTracker;
}    // namespace papi_qjs

// the quickjs engine part of a backend (BackendQuickJS of unity): the runtime and the context of the env, the module loader
// and the promise rejection tracking. No inspector, addons or trivially freed objects
class PAPIQUICKJS_API FPapiBackendQuickjs : public FPapiBackendJs
{
public:
    explicit FPapiBackendQuickjs(const FPapiBackendParams& InParams);

    // the factory creating quickjs backends for FScriptEnv / FJsEnv
    static std::unique_ptr<IPapiBackend> Create(const FPapiBackendParams& InParams);

    virtual ~FPapiBackendQuickjs() override;

    virtual int GetApiVersion() override;

    virtual struct pesapi_ffi* GetApi() override;

    virtual pesapi_env_ref CreateEnvRef() override;

    virtual void DestroyEnvRef(pesapi_env_ref EnvRef) override;

    virtual pesapi_value ExecuteModule(pesapi_env Env, const char* Specifier, const char* Referrer, bool ByImport) override;

    virtual void RegisterBuiltinModule(pesapi_env Env, const char* Name, pesapi_value Exports) override;

    virtual void LowMemoryNotification() override;

    virtual bool IdleNotificationDeadline(double DeadlineInSeconds) override;

    virtual void RequestMinorGarbageCollectionForTesting() override;

    virtual void RequestFullGarbageCollectionForTesting() override;

    virtual FString GetStatisticsLog() override;

    virtual FString CurrentStackTrace() override;

    virtual ScriptClassRegistry* GetRegistry() override;

    virtual bool IsQuickJS() override
    {
        return true;
    }

protected:
    virtual void StartRuntime(pesapi_env Env) override;

    virtual void StopRuntime() override;

    virtual pesapi_value CreateRequire(pesapi_env Env, const char* Referrer) override;

    virtual bool ForceReload(pesapi_env Env, const char* Url) override;

    virtual pesapi_value GetModuleByUrl(pesapi_env Env, const char* Url) override;

    virtual void SetPromiseRejectHandler(pesapi_env Env, pesapi_value Handler) override;

private:
    static void OnPromiseRejectHandlerError(void* UserData, const char* Error);

    FPapiBackendParams Params;

    std::unique_ptr<qjsimpl::FCppObjectMapper> CppObjectMapper;

    JSRuntime* Runtime = nullptr;

    JSContext* Context = nullptr;

    papi_qjs::FModuleLoader* ModuleLoader = nullptr;

    papi_qjs::FPromiseRejectTracker* PromiseRejectTracker = nullptr;
};
}    // namespace PUERTS_NAMESPACE

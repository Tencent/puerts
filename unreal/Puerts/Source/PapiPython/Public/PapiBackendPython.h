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

// PyThreadState (Python.h is not exposed)
struct _ts;

namespace PUERTS_NAMESPACE
{
namespace pyimpl
{
class FCppObjectMapper;
}

// the python backend (BackendPython of unity): a sub interpreter of the python of the engine (initialized by the backend if
// PythonScriptPlugin did not), the module system is the import of python (a finder of sys.meta_path) with the sources
// resolved and loaded by the host, bootstrapped by puerts/init.py. No inspector, addons, trivially freed objects or name fixing.
// Create returns nullptr if python is not available (WITH_PYTHON is 0, the python of the engine is older than 3.9, or the
// initialization failed)
class PAPIPYTHON_API FPapiBackendPython : public IPapiBackend
{
public:
    explicit FPapiBackendPython(const FPapiBackendParams& InParams);

    // the factory creating python backends for FScriptEnv
    static std::unique_ptr<IPapiBackend> Create(const FPapiBackendParams& InParams);

    // false if python is not available (the backend is a stub, or python failed to initialize), Create returns nullptr then
    static bool IsAvailable();

    virtual ~FPapiBackendPython() override;

    virtual int GetApiVersion() override;

    virtual struct pesapi_ffi* GetApi() override;

    virtual pesapi_env_ref CreateEnvRef() override;

    virtual void DestroyEnvRef(pesapi_env_ref EnvRef) override;

    virtual void OnEnter(IPapiScriptHost* Host) override;

    virtual void OnExit(IPapiScriptHost* Host) override;

    virtual pesapi_value ExecuteModule(pesapi_env Env, const char* Specifier, const char* Referrer, bool ByImport) override;

    virtual void RegisterBuiltinModule(pesapi_env Env, const char* Name, pesapi_value Exports) override;

    // the str keys of a dict
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

    std::unique_ptr<pyimpl::FCppObjectMapper> CppObjectMapper;

    // the thread state of the sub interpreter of the env
    struct _ts* SubTState = nullptr;

    pesapi_env_ref MainEnvRef = nullptr;
};
}    // namespace PUERTS_NAMESPACE

/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#ifndef WITH_QUICKJS

#include "PapiBackendJs.h"
#include "NamespaceDef.h"
#include <functional>

PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS
#pragma warning(push, 0)
#include "v8.h"
#pragma warning(pop)
PRAGMA_ENABLE_UNDEFINED_IDENTIFIER_WARNINGS

namespace PUERTS_NAMESPACE
{
class FCppObjectMapper;

namespace papi_v8
{
class FModuleLoader;
class FPromiseRejectTracker;
}    // namespace papi_v8

// the v8 engine part of a backend (BackendV8 of unity): the isolate and the context of the env, the module loader and the
// promise rejection tracking. The only place (with the papi-v8 implementation files) the v8 pesapi table is referenced
class FPapiBackendV8 : public FPapiBackendJs
{
public:
    struct FParams
    {
        std::shared_ptr<ILogger> Logger;

        // v8 flags of the isolate, only --max-old-space-size=<MB> is used
        FString Flags;

        // legacy: the object mapper set to the isolate (data slot 0) and the class template mapper it forwards to, owned by
        // the host until the IObjectMapper of the host is removed
        void* IsolateMapper = nullptr;
        FCppObjectMapper* CppObjectMapper = nullptr;

        // an isolate and a context created by the host (node), adopted but not disposed by the backend
        v8::Isolate* ExternalIsolate = nullptr;
        v8::Local<v8::Context> ExternalContext;

        // the cleanup of the host run by DestroyEnvRef after the env is released and before the isolate is disposed (inside
        // the isolate scope): the leftovers of the mapper, the node environment, the inspector...
        std::function<void()> OnEnvReleased;
    };

    explicit FPapiBackendV8(const FParams& InParams);

    virtual ~FPapiBackendV8() override;

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

    v8::Isolate* GetIsolate() const
    {
        return Isolate;
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

    FParams Params;

    v8::Isolate::CreateParams CreateParams;

    v8::Isolate* Isolate = nullptr;

    bool OwnsIsolate = false;

    papi_v8::FModuleLoader* ModuleLoader = nullptr;

    papi_v8::FPromiseRejectTracker* PromiseRejectTracker = nullptr;
};
}    // namespace PUERTS_NAMESPACE

#endif

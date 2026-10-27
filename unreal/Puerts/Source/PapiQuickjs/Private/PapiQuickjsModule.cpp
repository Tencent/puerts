/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "PapiQuickjsModule.h"
#include "ScriptEnvModule.h"
#include "JSClassRegister.h"
#include "PesapiQuickjsImpl.h"

class FPapiQuickjsModule : public IPapiQuickjsModule
{
    void StartupModule() override;
    void ShutdownModule() override;

    // the global ffi is only taken if no other backend (v8) set it
    bool OwnsFFI = false;
};

IMPLEMENT_MODULE(FPapiQuickjsModule, PapiQuickjs)

void FPapiQuickjsModule::StartupModule()
{
    if (!PUERTS_NAMESPACE::GetPesapiFFI())
    {
        PUERTS_NAMESPACE::SetPesapiFFI(&PUERTS_NAMESPACE::qjsimpl::g_pesapi_ffi);
        OwnsFFI = true;
    }
}

void FPapiQuickjsModule::ShutdownModule()
{
    if (OwnsFFI)
    {
        // the cached struct wrappers must go while the ffi is still alive, the ScriptEnv module shuts down after this one
        if (IScriptEnvModule* ScriptEnvModule = FModuleManager::GetModulePtr<IScriptEnvModule>("ScriptEnv"))
        {
            ScriptEnvModule->ReleaseGlobalCaches();
        }
        PUERTS_NAMESPACE::SetPesapiFFI(nullptr);
        OwnsFFI = false;
    }
}

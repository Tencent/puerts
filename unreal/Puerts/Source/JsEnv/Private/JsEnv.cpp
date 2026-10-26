/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "JsEnv.h"
#include "JsEnvGroup.h"
#include "PapiBackendV8.h"

namespace PUERTS_NAMESPACE
{
FJsEnv::FJsEnv(const FString& ScriptRoot) : FScriptEnv(&FPapiBackendV8::Create, ScriptRoot)
{
}

FJsEnv::FJsEnv(std::shared_ptr<IJSModuleLoader> InModuleLoader, std::shared_ptr<ILogger> InLogger, int InDebugPort,
    std::function<void(const FString&)> InOnSourceLoadedCallback, const FString InFlags, void* InExternalRuntime,
    void* InExternalContext)
    : FScriptEnv(&FPapiBackendV8::Create, std::move(InModuleLoader), InLogger, InDebugPort, InOnSourceLoadedCallback, InFlags,
          InExternalRuntime, InExternalContext)
{
}

#if !defined(ENGINE_INDEPENDENT_JSENV)
FJsEnvGroup::FJsEnvGroup(int Size, const FString& ScriptRoot) : FScriptEnvGroup(&FPapiBackendV8::Create, Size, ScriptRoot)
{
}

FJsEnvGroup::FJsEnvGroup(int Size, std::shared_ptr<IJSModuleLoader> InModuleLoader, std::shared_ptr<ILogger> InLogger,
    int InDebugStartPort, std::function<void(const FString&)> InOnSourceLoadedCallback, const FString InFlags,
    void* InExternalRuntime, void* InExternalContext)
    : FScriptEnvGroup(&FPapiBackendV8::Create, Size, std::move(InModuleLoader), InLogger, InDebugStartPort,
          InOnSourceLoadedCallback, InFlags, InExternalRuntime, InExternalContext)
{
}
#endif

}    // namespace PUERTS_NAMESPACE

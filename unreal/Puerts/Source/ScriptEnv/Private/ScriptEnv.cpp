/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "ScriptEnv.h"
#include "ScriptEnvImpl.h"

namespace PUERTS_NAMESPACE
{
FScriptEnv::FScriptEnv(FPapiBackendFactory InBackendFactory, const FString& ScriptRoot)
{
    GameScript = std::make_unique<FScriptEnvImpl>(std::move(InBackendFactory), ScriptRoot);
}

FScriptEnv::FScriptEnv(FPapiBackendFactory InBackendFactory, std::shared_ptr<IJSModuleLoader> InModuleLoader,
    std::shared_ptr<ILogger> InLogger, int InDebugPort, const FString InFlags, void* InExternalRuntime, void* InExternalContext)
{
    GameScript = std::make_unique<FScriptEnvImpl>(std::move(InBackendFactory), std::move(InModuleLoader), InLogger, InDebugPort,
        InFlags, InExternalRuntime, InExternalContext);
}

void FScriptEnv::Start(const FString& ModuleName, const TArray<TPair<FString, UObject*>>& Arguments)
{
    GameScript->Start(ModuleName, Arguments);
}

bool FScriptEnv::IdleNotificationDeadline(double DeadlineInSeconds)
{
    return GameScript->IdleNotificationDeadline(DeadlineInSeconds);
}

void FScriptEnv::LowMemoryNotification()
{
    GameScript->LowMemoryNotification();
}

void FScriptEnv::RequestMinorGarbageCollectionForTesting()
{
    GameScript->RequestMinorGarbageCollectionForTesting();
}

void FScriptEnv::RequestFullGarbageCollectionForTesting()
{
    GameScript->RequestFullGarbageCollectionForTesting();
}

void FScriptEnv::WaitDebugger(double timeout)
{
    GameScript->WaitDebugger(timeout);
}

#if !defined(ENGINE_INDEPENDENT_JSENV)
void FScriptEnv::TryBindJs(const class UObjectBase* InObject)
{
    GameScript->TryBindJs(InObject);
}

void FScriptEnv::RebindJs()
{
    GameScript->RebindJs();
}
#endif

FString FScriptEnv::CurrentStackTrace()
{
    return GameScript->CurrentStackTrace();
}

void FScriptEnv::InitExtensionMethodsMap()
{
    GameScript->InitExtensionMethodsMap();
}

}    // namespace PUERTS_NAMESPACE

/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include <vector>

#include "CoreMinimal.h"
#include "ScriptEnv.h"

namespace PUERTS_NAMESPACE
{
class SCRIPTENV_API FScriptEnvGroup
{
public:
    explicit FScriptEnvGroup(FPapiBackendFactory InBackendFactory, int Size, const FString& ScriptRoot = TEXT("JavaScript"));

    FScriptEnvGroup(FPapiBackendFactory InBackendFactory, int Size, std::shared_ptr<IJSModuleLoader> InModuleLoader,
        std::shared_ptr<ILogger> InLogger, int InDebugStartPort,
        std::function<void(const FString&)> InOnSourceLoadedCallback = nullptr, const FString InFlags = FString(),
        void* InExternalRuntime = nullptr, void* InExternalContext = nullptr);

    ~FScriptEnvGroup();

    void TryBindJs(const class UObjectBase* InObject);

    void ReloadModule(FName ModuleName, const FString& JsSource);

    void RebindJs();

    void InitExtensionMethodsMap();

    std::shared_ptr<IScriptEnv> Get(int Index);

    void SetJsEnvSelector(std::function<int(UObject*, int)> InSelector);

private:
    std::vector<std::shared_ptr<IScriptEnv>> JsEnvList;

    void Init();
};

}    // namespace PUERTS_NAMESPACE

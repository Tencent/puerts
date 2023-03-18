/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include <vector>

#include "CoreMinimal.h"
#include "JsEnv.h"

namespace puerts
{
class JSENV_API FJsEnvGroup
{
public:
    explicit FJsEnvGroup(int Size, const FString& ScriptRoot = TEXT("JavaScript"));

    FJsEnvGroup(int Size, std::shared_ptr<IJSModuleLoader> InModuleLoader, std::shared_ptr<ILogger> InLogger, int InDebugStartPort,
        std::function<void(const FString&)> InOnSourceLoadedCallback = nullptr, void* InExternalRuntime = nullptr,
        void* InExternalContext = nullptr);

    ~FJsEnvGroup();

    void TryBindJs(const class UObjectBase* InObject);

    void ReloadModule(FName ModuleName, const FString& JsSource);

    void RebindJs();

    void InitExtensionMethodsMap();

    std::shared_ptr<IJsEnv> Get(int Index);

    void SetJsEnvSelector(std::function<int(UObject*, int)> InSelector);

private:
    std::vector<std::shared_ptr<IJsEnv>> JsEnvList;

    void Init();
};

}    // namespace puerts

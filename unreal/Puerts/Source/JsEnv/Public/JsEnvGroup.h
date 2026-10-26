/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "JsEnv.h"
#include "ScriptEnvGroup.h"

namespace PUERTS_NAMESPACE
{
// a ScriptEnv env group with the v8 backend
class JSENV_API FJsEnvGroup : public FScriptEnvGroup
{
public:
    explicit FJsEnvGroup(int Size, const FString& ScriptRoot = TEXT("JavaScript"));

    FJsEnvGroup(int Size, std::shared_ptr<IJSModuleLoader> InModuleLoader, std::shared_ptr<ILogger> InLogger, int InDebugStartPort,
        std::function<void(const FString&)> InOnSourceLoadedCallback = nullptr, const FString InFlags = FString(),
        void* InExternalRuntime = nullptr, void* InExternalContext = nullptr);
};

}    // namespace PUERTS_NAMESPACE

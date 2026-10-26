/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "ScriptEnv.h"

namespace PUERTS_NAMESPACE
{
using IJsEnv = IScriptEnv;

// a ScriptEnv env with the v8 backend
class JSENV_API FJsEnv : public FScriptEnv
{
public:
    explicit FJsEnv(const FString& ScriptRoot = TEXT("JavaScript"));

    FJsEnv(std::shared_ptr<IJSModuleLoader> InModuleLoader, std::shared_ptr<ILogger> InLogger, int InDebugPort,
        std::function<void(const FString&)> InOnSourceLoadedCallback = nullptr, const FString InFlags = FString(),
        void* InExternalRuntime = nullptr, void* InExternalContext = nullptr);
};

}    // namespace PUERTS_NAMESPACE

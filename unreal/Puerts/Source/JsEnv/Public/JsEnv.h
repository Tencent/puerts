/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include <map>
#include <string>
#include <algorithm>
#include <functional>
#include <memory>

#include "CoreMinimal.h"
#include "UObject/GCObject.h"
#include "Containers/Ticker.h"
#include "ObjectRetainer.h"
#include "JSLogger.h"
#include "JSModuleLoader.h"
#if !defined(ENGINE_INDEPENDENT_JSENV)
#include "ExtensionMethods.h"
#endif

namespace puerts
{
class JSENV_API IJsEnv
{
public:
    virtual void Start(const FString& ModuleName, const TArray<TPair<FString, UObject*>>& Arguments) = 0;

    virtual void LowMemoryNotification() = 0;

    virtual void WaitDebugger(double timeout) = 0;

#if !defined(ENGINE_INDEPENDENT_JSENV)
    virtual void TryBindJs(const class UObjectBase* InObject) = 0;

    virtual void RebindJs() = 0;
#endif

    virtual void ReloadModule(FName ModuleName, const FString& JsSource) = 0;

    virtual FString CurrentStackTrace() = 0;

    virtual void InitExtensionMethodsMap() = 0;

    virtual ~IJsEnv()
    {
    }
};

class JSENV_API FJsEnv    // : public TSharedFromThis<FJsEnv> // only a wrapper
{
public:
    explicit FJsEnv(const FString& ScriptRoot = TEXT("JavaScript"));

    FJsEnv(std::shared_ptr<IJSModuleLoader> InModuleLoader, std::shared_ptr<ILogger> InLogger, int InDebugPort,
        void* InExternalRuntime = nullptr, void* InExternalContext = nullptr);

    void Start(const FString& ModuleName, const TArray<TPair<FString, UObject*>>& Arguments = TArray<TPair<FString, UObject*>>());

    void LowMemoryNotification();

    void WaitDebugger(double timeout = 0);

    void TryBindJs(const class UObjectBase* InObject);

    void ReloadModule(FName ModuleName, const FString& JsSource);

    void RebindJs();

    FString CurrentStackTrace();

    void InitExtensionMethodsMap();

private:
    std::unique_ptr<IJsEnv> GameScript;
};

}    // namespace puerts

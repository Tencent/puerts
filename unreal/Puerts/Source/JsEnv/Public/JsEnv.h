/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include <string>
#include <functional>
#include <memory>

#include "CoreMinimal.h"
#include "JSLogger.h"
#include "JSModuleLoader.h"
#include "PString.h"
#if !defined(ENGINE_INDEPENDENT_JSENV)
#include "ExtensionMethods.h"
#endif

namespace PUERTS_NAMESPACE
{
class JSENV_API IJsEnv
{
public:
    virtual void Start(const FString& ModuleName, const TArray<TPair<FString, UObject*>>& Arguments) = 0;

    virtual bool IdleNotificationDeadline(double DeadlineInSeconds) = 0;

    virtual void LowMemoryNotification() = 0;

    virtual void RequestMinorGarbageCollectionForTesting() = 0;

    virtual void RequestFullGarbageCollectionForTesting() = 0;

    virtual void WaitDebugger(double Timeout) = 0;

#if !defined(ENGINE_INDEPENDENT_JSENV)
    virtual void TryBindJs(const class UObjectBase* InObject) = 0;

    virtual void RebindJs() = 0;
#endif

    virtual void ReloadModule(FName ModuleName, const FString& JsSource) = 0;

    virtual void ReloadSource(const FString& Path, const PString& JsSource) = 0;

    virtual void OnSourceLoaded(std::function<void(const FString&)> Callback) = 0;

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
        std::function<void(const FString&)> InOnSourceLoadedCallback = nullptr, const FString InFlags = FString(),
        void* InExternalRuntime = nullptr, void* InExternalContext = nullptr);

    void Start(const FString& ModuleName, const TArray<TPair<FString, UObject*>>& Arguments = TArray<TPair<FString, UObject*>>());

    bool IdleNotificationDeadline(double DeadlineInSeconds);

    void LowMemoryNotification();

    // equivalent to Isolate->RequestGarbageCollectionForTesting(v8::Isolate::kMinorGarbageCollection)
    // It is only valid to call this function if --expose_gc was specified
    void RequestMinorGarbageCollectionForTesting();

    // equivalent to Isolate->RequestGarbageCollectionForTesting(v8::Isolate::kFullGarbageCollection)
    void RequestFullGarbageCollectionForTesting();

    void WaitDebugger(double Timeout = 0);

    void TryBindJs(const class UObjectBase* InObject);

    void ReloadModule(FName ModuleName, const FString& JsSource);

    void ReloadSource(const FString& Path, const PString& JsSource);

    void OnSourceLoaded(std::function<void(const FString&)> Callback);

    void RebindJs();

    FString CurrentStackTrace();

    void InitExtensionMethodsMap();

private:
    std::unique_ptr<IJsEnv> GameScript;
};

}    // namespace PUERTS_NAMESPACE

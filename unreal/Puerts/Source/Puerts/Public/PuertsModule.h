/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include <cstdio>
#include <functional>

#include "Modules/ModuleManager.h"
#include "CoreMinimal.h"

class PUERTS_API IPuertsModule : public IModuleInterface
{
public:
    static inline IPuertsModule& Get()
    {
        return FModuleManager::LoadModuleChecked<IPuertsModule>("Puerts");
    }

    static inline bool IsAvailable()
    {
        return FModuleManager::Get().IsModuleLoaded("Puerts");
    }

#if WITH_EDITOR
    static inline bool IsInPIEMode()
    {
        return Get().IsInPIE();
    }
#endif

    virtual bool IsEnabled() = 0;

    virtual bool IsWatchEnabled() = 0;

    virtual void ReloadModule(FName ModuleName, const FString& JsSource) = 0;

    virtual void InitExtensionMethodsMap() = 0;

    virtual void SetJsEnvSelector(std::function<int(UObject*, int)> InSelector) = 0;

    virtual void MakeSharedJsEnv() = 0;

#if WITH_EDITOR
    virtual bool IsInPIE() = 0;
#endif
};

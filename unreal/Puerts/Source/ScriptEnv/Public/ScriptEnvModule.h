/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "CoreMinimal.h"
#include "Modules/ModuleInterface.h"
#include "Modules/ModuleManager.h"

// the engine independent part of puerts: the env, the reflection layer and the class registry, it never sees a script engine
class IScriptEnvModule : public IModuleInterface
{
public:
    static inline IScriptEnvModule& Get()
    {
        return FModuleManager::LoadModuleChecked<IScriptEnvModule>("ScriptEnv");
    }

    static inline bool IsAvailable()
    {
        return FModuleManager::Get().IsModuleLoaded("ScriptEnv");
    }

    // drops the process wide reflection caches (struct wrappers and their translators), a backend module calls it before it
    // tears its script engine down
    virtual void ReleaseGlobalCaches() = 0;
};

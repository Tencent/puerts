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

// the v8 backend: owns the v8 platform and registers the v8 pesapi implementation
class IPapiV8Module : public IModuleInterface
{
public:
    static inline IPapiV8Module& Get()
    {
        return FModuleManager::LoadModuleChecked<IPapiV8Module>("PapiV8");
    }

    static inline bool IsAvailable()
    {
        return FModuleManager::Get().IsModuleLoaded("PapiV8");
    }

    virtual void* GetV8Platform() = 0;
};

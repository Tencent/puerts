/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "JsEnvModule.h"
#include "PapiV8Module.h"

// the JsEnv module is a thin compatibility layer: FJsEnv / FJsEnvGroup are ScriptEnv envs with the v8 backend
class FJsEnvModule : public IJsEnvModule
{
public:
    void* GetV8Platform() override
    {
        return IPapiV8Module::Get().GetV8Platform();
    }
};

IMPLEMENT_MODULE(FJsEnvModule, JsEnv)

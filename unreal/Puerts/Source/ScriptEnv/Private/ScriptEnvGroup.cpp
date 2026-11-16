/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#if !defined(ENGINE_INDEPENDENT_JSENV)
#include "ScriptEnvGroup.h"
#include "ScriptEnvImpl.h"
#include "PuertsNamespaceDef.h"

namespace PUERTS_NAMESPACE
{
FScriptEnvGroup::FScriptEnvGroup(FPapiBackendFactory InBackendFactory, int Size, const FString& ScriptRoot)
{
    check(Size > 1);
    for (int i = 0; i < Size; i++)
    {
        JsEnvList.push_back(std::make_shared<FScriptEnvImpl>(InBackendFactory, ScriptRoot));
    }
}

FScriptEnvGroup::FScriptEnvGroup(FPapiBackendFactory InBackendFactory, int Size, std::shared_ptr<IScriptFileLoader> InFileLoader,
    std::shared_ptr<ILogger> InLogger, int InDebugStartPort, const FString InFlags, void* InExternalRuntime,
    void* InExternalContext)
{
    check(Size > 1);
    std::shared_ptr<IScriptFileLoader> SharedFileLoader = std::move(InFileLoader);
    for (int i = 0; i < Size; i++)
    {
        JsEnvList.push_back(std::make_shared<FScriptEnvImpl>(
            InBackendFactory, SharedFileLoader, InLogger, InDebugStartPort + i, InFlags, InExternalRuntime, InExternalContext));
    }
}

FScriptEnvGroup::~FScriptEnvGroup()
{
    JsEnvList.clear();
}

void FScriptEnvGroup::InitExtensionMethodsMap()
{
    for (int i = 0; i < JsEnvList.size(); i++)
    {
        JsEnvList[i]->InitExtensionMethodsMap();
    }
}

std::shared_ptr<IScriptEnv> FScriptEnvGroup::Get(int Index)
{
    return JsEnvList[Index];
}

}    // namespace PUERTS_NAMESPACE
#endif

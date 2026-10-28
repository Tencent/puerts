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
#include "DynamicInvoker.h"
#include "PuertsNamespaceDef.h"

namespace PUERTS_NAMESPACE
{
class FGroupDynamicInvoker : public IDynamicInvoker
{
public:
    FGroupDynamicInvoker(std::vector<FScriptEnvImpl*> InJsEnvs) : JsEnvs(InJsEnvs)
    {
    }

    FORCEINLINE int GetSelectIndex(UObject* Object)
    {
        int Size = JsEnvs.size();
        int Index = Selector ? Selector(Object, Size) : 0;
        return (Index > 0 && Index < Size) ? Index : 0;
    }

    virtual void InvokeDelegateCallback(UDynamicDelegateProxy* Proxy, void* Params) override
    {
        ensureMsgf(false, TEXT("InvokeDelegateCallback in GroupDynamicInvoker"));
    }
#if !defined(ENGINE_INDEPENDENT_JSENV)
    virtual void InvokeMixinMethod(
        UObject* ContextObject, UJSGeneratedFunction* Function, FFrame& Stack, void* RESULT_PARAM) override
    {
        JsEnvs[GetSelectIndex(ContextObject)]->InvokeMixinMethod(ContextObject, Function, Stack, RESULT_PARAM);
    }
#endif

    std::vector<FScriptEnvImpl*> JsEnvs;

    std::function<int(UObject*, int)> Selector;

    virtual ~FGroupDynamicInvoker()
    {
    }
};

FScriptEnvGroup::FScriptEnvGroup(FPapiBackendFactory InBackendFactory, int Size, const FString& ScriptRoot)
{
    check(Size > 1);
    for (int i = 0; i < Size; i++)
    {
        JsEnvList.push_back(std::make_shared<FScriptEnvImpl>(InBackendFactory, ScriptRoot));
    }
    Init();
}

FScriptEnvGroup::FScriptEnvGroup(FPapiBackendFactory InBackendFactory, int Size, std::shared_ptr<IJSModuleLoader> InModuleLoader,
    std::shared_ptr<ILogger> InLogger, int InDebugStartPort, const FString InFlags, void* InExternalRuntime,
    void* InExternalContext)
{
    check(Size > 1);
    std::shared_ptr<IJSModuleLoader> SharedModuleLoader = std::move(InModuleLoader);
    for (int i = 0; i < Size; i++)
    {
        JsEnvList.push_back(std::make_shared<FScriptEnvImpl>(
            InBackendFactory, SharedModuleLoader, InLogger, InDebugStartPort + i, InFlags, InExternalRuntime, InExternalContext));
    }
    Init();
}

void FScriptEnvGroup::Init()
{
    std::vector<FScriptEnvImpl*> JsEnvs;
    for (int i = 0; i < JsEnvList.size(); i++)
    {
        JsEnvs.push_back(static_cast<FScriptEnvImpl*>(JsEnvList[i].get()));
    }
    auto GroupDynamicInvoker = MakeShared<FGroupDynamicInvoker, ESPMode::ThreadSafe>(JsEnvs);
    for (int i = 0; i < JsEnvs.size(); i++)
    {
        JsEnvs[i]->MixinInvoker = GroupDynamicInvoker;
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

void FScriptEnvGroup::SetJsEnvSelector(std::function<int(UObject*, int)> InSelector)
{
    auto DynamicInvoker = static_cast<FScriptEnvImpl*>(JsEnvList[0].get())->MixinInvoker;
    if (DynamicInvoker.IsValid())
    {
        static_cast<FGroupDynamicInvoker*>(DynamicInvoker.Get())->Selector = InSelector;
    }
}

}    // namespace PUERTS_NAMESPACE
#endif

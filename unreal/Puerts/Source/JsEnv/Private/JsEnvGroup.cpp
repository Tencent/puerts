/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#if !defined(ENGINE_INDEPENDENT_JSENV)
#include "JsEnvGroup.h"
#include "JsEnvImpl.h"
#include "TsDynamicInvoker.h"
#include "DynamicInvoker.h"
#include "PuertsNamespaceDef.h"

namespace PUERTS_NAMESPACE
{
class FGroupDynamicInvoker : public ITsDynamicInvoker, public IDynamicInvoker
{
public:
    FGroupDynamicInvoker(std::vector<FJsEnvImpl*> InJsEnvs) : JsEnvs(InJsEnvs)
    {
    }

    FORCEINLINE int GetSelectIndex(UObject* Object)
    {
        int Size = JsEnvs.size();
        int Index = Selector ? Selector(Object, Size) : 0;
        return (Index > 0 && Index < Size) ? Index : 0;
    }

    void TsConstruct(UTypeScriptGeneratedClass* Class, UObject* Object) override
    {
        // 对于cdo,应该在所有的虚拟机中调用construct,因为cdo并没有明确的jsenv
        // 不过不大确定cdo的这样判断够不够
        // JsEnvs[GetSelectIndex(Object)]->TsConstruct(Class, Object);
        if (Object->HasAnyFlags(RF_ClassDefaultObject | RF_ArchetypeObject | RF_WasLoaded))
        {
            for (int i = 0; i < JsEnvs.size(); i++)
            {
                JsEnvs[i]->TsConstruct(Class, Object);
            }
        }
        else
        {
            JsEnvs[GetSelectIndex(Object)]->TsConstruct(Class, Object);
        }
    }

    void InvokeTsMethod(UObject* ContextObject, UFunction* Function, FFrame& Stack, void* RESULT_PARAM) override
    {
        JsEnvs[GetSelectIndex(ContextObject)]->InvokeTsMethod(ContextObject, Function, Stack, RESULT_PARAM);
    }

    void NotifyReBind(UTypeScriptGeneratedClass* Class) override
    {
        for (int i = 0; i < JsEnvs.size(); i++)
        {
            JsEnvs[i]->NotifyReBind(Class);
        }
    }

    virtual void InvokeDelegateCallback(UDynamicDelegateProxy* Proxy, void* Params) override
    {
        ensureMsgf(false, TEXT("InvokeDelegateCallback in GroupDynamicInvoker"));
    }
#if !defined(ENGINE_INDEPENDENT_JSENV)
    virtual void JsConstruct(UClass* Class, UObject* Object, const v8::UniquePersistent<v8::Function>& Constructor,
        const v8::UniquePersistent<v8::Object>& Prototype) override
    {
        ensureMsgf(false, TEXT("JsConstruct in GroupDynamicInvoker"));
    }

    virtual void InvokeJsMethod(UObject* ContextObject, UJSGeneratedFunction* Function, FFrame& Stack, void* RESULT_PARAM) override
    {
        ensureMsgf(false, TEXT("InvokeJsMethod in GroupDynamicInvoker"));
    }

    virtual void InvokeMixinMethod(
        UObject* ContextObject, UJSGeneratedFunction* Function, FFrame& Stack, void* RESULT_PARAM) override
    {
        JsEnvs[GetSelectIndex(ContextObject)]->InvokeMixinMethod(ContextObject, Function, Stack, RESULT_PARAM);
    }
#endif

    std::vector<FJsEnvImpl*> JsEnvs;

    std::function<int(UObject*, int)> Selector;

    virtual ~FGroupDynamicInvoker()
    {
    }
};

FJsEnvGroup::FJsEnvGroup(int Size, const FString& ScriptRoot)
{
    check(Size > 1);
    for (int i = 0; i < Size; i++)
    {
        JsEnvList.push_back(std::make_shared<FJsEnvImpl>(ScriptRoot));
    }
    Init();
}

FJsEnvGroup::FJsEnvGroup(int Size, std::shared_ptr<IJSModuleLoader> InModuleLoader, std::shared_ptr<ILogger> InLogger,
    int InDebugStartPort, std::function<void(const FString&)> InOnSourceLoadedCallback, const FString InFlags,
    void* InExternalRuntime, void* InExternalContext)
{
    check(Size > 1);
    std::shared_ptr<IJSModuleLoader> SharedModuleLoader = std::move(InModuleLoader);
    for (int i = 0; i < Size; i++)
    {
        JsEnvList.push_back(std::make_shared<FJsEnvImpl>(SharedModuleLoader, InLogger, InDebugStartPort + i,
            InOnSourceLoadedCallback, InFlags, InExternalRuntime, InExternalContext));
    }
    Init();
}

void FJsEnvGroup::Init()
{
    std::vector<FJsEnvImpl*> JsEnvs;
    for (int i = 0; i < JsEnvList.size(); i++)
    {
        JsEnvs.push_back(static_cast<FJsEnvImpl*>(JsEnvList[i].get()));
    }
    auto GroupDynamicInvoker = MakeShared<FGroupDynamicInvoker, ESPMode::ThreadSafe>(JsEnvs);
    for (int i = 0; i < JsEnvs.size(); i++)
    {
        JsEnvs[i]->TsDynamicInvoker = GroupDynamicInvoker;
        JsEnvs[i]->MixinInvoker = GroupDynamicInvoker;
    }
}

FJsEnvGroup::~FJsEnvGroup()
{
    JsEnvList.clear();
}

void FJsEnvGroup::TryBindJs(const class UObjectBase* InObject)
{
    for (int i = 0; i < JsEnvList.size(); i++)
    {
        JsEnvList[i]->TryBindJs(InObject);
    }
}

void FJsEnvGroup::RebindJs()
{
    for (int i = 0; i < JsEnvList.size(); i++)
    {
        JsEnvList[i]->RebindJs();
    }
}

void FJsEnvGroup::InitExtensionMethodsMap()
{
    for (int i = 0; i < JsEnvList.size(); i++)
    {
        JsEnvList[i]->InitExtensionMethodsMap();
    }
}

void FJsEnvGroup::ReloadModule(FName ModuleName, const FString& JsSource)
{
    for (int i = 0; i < JsEnvList.size(); i++)
    {
        JsEnvList[i]->ReloadModule(ModuleName, JsSource);
    }
}

std::shared_ptr<IJsEnv> FJsEnvGroup::Get(int Index)
{
    return JsEnvList[Index];
}

void FJsEnvGroup::SetJsEnvSelector(std::function<int(UObject*, int)> InSelector)
{
    auto DynamicInvoker = static_cast<FJsEnvImpl*>(JsEnvList[0].get())->TsDynamicInvoker;
    if (DynamicInvoker.IsValid())
    {
        static_cast<FGroupDynamicInvoker*>(DynamicInvoker.Get())->Selector = InSelector;
    }
}

}    // namespace PUERTS_NAMESPACE
#endif

/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include <functional>
#include <memory>
#include <vector>

#include "CoreMinimal.h"
#include "NamespaceDef.h"
#include "pesapi.h"
#include "JSLogger.h"
#include "PapiValueRef.h"
#include "ScriptEnvExtension.h"

class UJSGeneratedFunction;

namespace PUERTS_NAMESPACE
{
// calls the js function of a mixin method (UJSGeneratedFunction::execCallMixin), the function holds it weakly
class IMixinInvoker
{
public:
    virtual void InvokeMixinMethod(UObject* ContextObject, UJSGeneratedFunction* Function, FFrame& Stack, void* RESULT_PARAM) = 0;

    virtual ~IMixinInvoker()
    {
    }
};

#if !defined(ENGINE_INDEPENDENT_JSENV)
class FScriptEnvImpl;
class FGroupMixinInvoker;

// blueprint.mixin of an env (the native object, passed to puerts/mixin.js by puerts.__mixin and taken away there), not a part of
// the basic env: EnableMixin of ScriptEnvMixinApi.h adds it, FJsEnv / FJsEnvGroup always do. Whether the objects of a mixed class
// are held by native is set by scriptEnv.setNativeTakeJsRef of the env (puerts/mixin.js calls it after the mixin)
class FScriptEnvMixin : public IScriptEnvExtension
{
public:
    // adds the mixin to the env if not yet (runs puerts/mixin.js, which adds blueprint.mixin/unmixin), returns the mixin of the
    // env, nullptr if the env is not a js one
    static FScriptEnvMixin* Enable(FScriptEnvImpl* ScriptEnv);

    // the mixin of the env, nullptr if not enabled
    static FScriptEnvMixin* Get(FScriptEnvImpl* ScriptEnv);

    // adds the mixin to the envs of a group, a mixin method is called in the env chosen by the selector (the first by default)
    static void EnableGroup(const std::vector<FScriptEnvImpl*>& ScriptEnvs);

    // the selector of the group of the env (EnableGroup), ignored if the env is not in a group
    static void SetGroupSelector(FScriptEnvImpl* ScriptEnv, std::function<int(UObject*, int)> InSelector);

    FScriptEnvMixin(struct pesapi_ffi* InApis, pesapi_env Env, std::shared_ptr<ILogger> InLogger);

    virtual ~FScriptEnvMixin() override;

    void InvokeMixinMethod(UObject* ContextObject, UJSGeneratedFunction* Function, FFrame& Stack, void* RESULT_PARAM);

    // IScriptEnvExtension
    virtual FName GetExtensionName() const override;

    virtual void OnEnvExit() override;

    virtual void OnEnvReleased() override;

    virtual void NotifyUObjectDeleted(const class UObjectBase* Object) override;

private:
    // puerts.__mixin.mixin(cls, methods, inherit, noWarning): the class whose functions are redirected (a new subclass of cls if
    // inherit)
    void Mixin(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    // puerts.__mixin.unmixin(cls)
    void Unmixin(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    // the UClass of argument #0, nullptr with the exception thrown if it is not
    static UClass* GetClassArg(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void RegisterMixinClass();

    typedef void (FScriptEnvMixin::*PapiMethodCallback)(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    template <PapiMethodCallback Method>
    static void PapiMethod(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    struct pesapi_ffi* MainApis;

    std::shared_ptr<ILogger> Logger;

    TArray<TWeakObjectPtr<UClass>> MixinClasses;

    TMap<UFunction*, FPapiValueRef> MixinFunctionMap;

    // the invoker the mixin functions use, this env (FSelfMixinInvoker) or the group (GroupInvoker) when in a group
    TSharedPtr<IMixinInvoker, ESPMode::ThreadSafe> Invoker;

    FGroupMixinInvoker* GroupInvoker = nullptr;

#ifdef SINGLE_THREAD_VERIFY
    uint32 BoundThreadId;
#endif
};
#endif

}    // namespace PUERTS_NAMESPACE

/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "ScriptEnv.h"
#include "DynamicDelegateProxy.h"
#include "StructWrapper.h"
#include "ObjectMapper.h"
#include "JSLogger.h"
#include "ObjectRetainer.h"
#if !defined(ENGINE_INDEPENDENT_JSENV)
#include "DynamicInvoker.h"
#include "JSGeneratedFunction.h"
#endif
#include "UECompatible.h"
#include "ContainerMeta.h"
#include "ContainerWrapper.h"
#include <unordered_map>

#if ENGINE_MINOR_VERSION >= 25 || ENGINE_MAJOR_VERSION > 4
#include "UObject/WeakFieldPtr.h"
#endif

#include "NamespaceDef.h"

#include "PapiValueRef.h"
#include "PapiEnvScope.h"
#include "PapiBackend.h"
#include <memory>

namespace PUERTS_NAMESPACE
{
class JSError
{
public:
    FString Message;

    JSError()
    {
    }

    explicit JSError(const FString& m) : Message(m)
    {
    }
};

class FScriptEnvImpl : public IScriptEnv, IObjectMapper, public FUObjectArray::FUObjectDeleteListener, public IPapiScriptHost
{
public:
    FScriptEnvImpl(FPapiBackendFactory InBackendFactory, const FString& ScriptRoot);

    // InExternalRuntime / InExternalContext: not supported (must be null), node is set up by the v8 backend
    FScriptEnvImpl(FPapiBackendFactory InBackendFactory, std::shared_ptr<IJSModuleLoader> InModuleLoader,
        std::shared_ptr<ILogger> InLogger, int InPort, const FString InFlags, void* InExternalRuntime, void* InExternalContext);

    virtual ~FScriptEnvImpl() override;

    virtual void Start(const FString& ModuleNameOrScript, const TArray<TPair<FString, UObject*>>& Arguments) override;

    virtual bool IdleNotificationDeadline(double DeadlineInSeconds) override;

    virtual void LowMemoryNotification() override;

    virtual void RequestMinorGarbageCollectionForTesting() override;

    virtual void RequestFullGarbageCollectionForTesting() override;

    virtual void WaitDebugger(double timeout) override
    {
        const auto startTime = FDateTime::Now();
        while (!Backend->DebuggerTick())
        {
            if (timeout > 0)
            {
                auto now = FDateTime::Now();
                if ((now - startTime).GetTotalSeconds() >= timeout)
                {
                    break;
                }
            }
        }
    }

    virtual FString CurrentStackTrace() override;

    virtual void InitExtensionMethodsMap() override;

public:
    void SetJsTakeRef(pesapi_env Env, UObject* UEObject);

    // the UObject was destroyed, it is unbound from its wrapper (if any)
    void UnBind(UObject* UEObject);

    virtual bool AddToDelegate(pesapi_env Env, void* DelegatePtr, pesapi_value JsFunction) override;

    virtual PropertyMacro* FindDelegateProperty(void* DelegatePtr) override;

    virtual FScriptDelegate NewDelegate(
        pesapi_env Env, UObject* Owner, pesapi_value JsFunction, UFunction* SignatureFunction) override;

    void ReleaseManualReleaseDelegate(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    virtual bool RemoveFromDelegate(pesapi_env Env, void* DelegatePtr, pesapi_value JsFunction) override;

    virtual bool ClearDelegate(pesapi_env Env, void* DelegatePtr) override;

    // IObjectMapper, the papi interface used by the backend independent code
    virtual pesapi_value FindOrAdd(pesapi_env Env, UClass* Class, UObject* UEObject) override;

    virtual bool TryBindOwnedStruct(pesapi_callback_info Info, FScriptStructWrapper* Wrapper, void* Ptr) override;

    virtual pesapi_value FindOrAddStruct(pesapi_env Env, UScriptStruct* ScriptStruct, void* Ptr, bool PassByPointer) override;

    // the wrapper of a delegate is held by DelegateMap (strong) until the delegate is released
    virtual pesapi_value FindOrAddDelegate(
        pesapi_env Env, UObject* Owner, PropertyMacro* Property, void* DelegatePtr, bool PassByPointer) override;

    virtual void ExecuteDelegate(pesapi_env Env, pesapi_callback_info Info, void* DelegatePtr) override;

    virtual bool IsInstanceOf(pesapi_env Env, UStruct* Struct, pesapi_value JsObject) override;

    bool CheckDelegateProxies(float Tick);

    void InvokeDelegateCallback(UDynamicDelegateProxy* Proxy, void* Params);

#if !defined(ENGINE_INDEPENDENT_JSENV)
    void InvokeMixinMethod(UObject* ContextObject, UJSGeneratedFunction* Function, FFrame& Stack, void* RESULT_PARAM);
#endif

public:
#if ENGINE_MINOR_VERSION > 22 || ENGINE_MAJOR_VERSION > 4
    virtual void OnUObjectArrayShutdown() override
    {
        GUObjectArray.RemoveUObjectDeleteListener(static_cast<FUObjectArray::FUObjectDeleteListener*>(this));
    }
#endif
    virtual void NotifyUObjectDeleted(const class UObjectBase* Object, int32 Index) override;

    void TryReleaseType(UStruct* Struct);

private:
    bool LoadFile(const FString& RequiringDir, const FString& ModuleName, FString& OutPath, FString& OutDebugPath,
        TArray<uint8>& Data, FString& ErrInfo);

    // IPapiScriptHost
    virtual void ExecuteModule(const FString& ModuleName) override;

    // the cleanup of the host after the env is released by the backend, before its isolate is disposed
    void OnEnvReleased();

    // require of the module system (the module loader of the backend), returns nullptr with the exception pending on failure
    pesapi_value RequireModule(struct pesapi_ffi* Apis, pesapi_env Env, const FString& ModuleName);

    // the methods of the global scriptEnv (see RegisterScriptEnvClass), called by the bootstrap scripts
    // scriptEnv.log(level, msg): 1 info, 2 warn, 3 error, log otherwise
    void Log(int32 Level, const FString& Msg);

    void LoadModule(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    // the host side of the module loader of the backend (PapiV8ModuleLoader): finds and reads a module
    void HostResolveModule(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    void HostLoadModule(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    // the js class of a UStruct, an object of the values for a UEnum, undefined otherwise
    pesapi_value UETypeToJsClass(pesapi_env Env, UField* Type);

    void LoadUEType(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    void LoadCppType(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    void UEClassToJSClass(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    void SetJsTakeRefInTs(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    // the per env info of a UStruct whose js class is built in this env (the class itself is cached by the backend, keyed by
    // the type id, see pesapi create_class)
    struct FTemplateInfo
    {
        std::shared_ptr<FStructWrapper> StructWrapper;
    };

    // builds the js class of the type in this env if not yet (called inside a scope of the env)
    FTemplateInfo* GetTemplateInfoOfType(pesapi_env Env, UStruct* Class, bool& Existed);

    pesapi_value GetJsClass(pesapi_env Env, UStruct* Class);

    // scriptEnv.registerTickHandler(fn): fn is called every frame (puerts/timer.js implements the timers on it), as unity
    void RegisterTickHandler(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    bool Tick(float DeltaTime);

    void NewObjectByClass(struct pesapi_ffi* Apis, pesapi_callback_info Info);

#if !defined(ENGINE_INDEPENDENT_JSENV)
    TArray<TWeakObjectPtr<UClass>> MixinClasses;
    void Mixin(struct pesapi_ffi* Apis, pesapi_callback_info Info);
#endif

    void DumpStatisticsLog() const;

    bool IsQuickJS() const;

    // the class definition of FScriptEnvImpl in the default registry (once per process), the global scriptEnv of the scripts is
    // a native object of it that is not owned by the script (no finalize)
    static void RegisterScriptEnvClass();

public:
#if !defined(ENGINE_INDEPENDENT_JSENV)
    TSharedPtr<IDynamicInvoker, ESPMode::ThreadSafe> MixinInvoker;
#endif
private:
    // the UObjects held by their wrappers (see OnUObjectEnter)
    FObjectRetainer UserObjectRetainer;

    FObjectRetainer SysObjectRetainer;

    std::shared_ptr<IJSModuleLoader> ModuleLoader;

    // "<by><path>" -> kind, the modules whose kind is decided by the package.json requiring them
    TMap<FString, FString> ForcedModuleKinds;

    // path -> debug path, filled by HostResolveModule
    TMap<FString, FString> ModuleDebugPaths;

    std::shared_ptr<ILogger> Logger;

    bool Started;

private:
    // the backend of the env (engine and language), the env only uses it and the pesapi table it returns
    std::unique_ptr<IPapiBackend> Backend;

    struct pesapi_ffi* MainApis = nullptr;

    // the ref of the default env, the entries from the host open their papi scopes with it (FPapiEnvScope)
    pesapi_env_ref MainEnvRef = nullptr;

    FPapiValueRef RemoveListItem;

    FPapiValueRef GenListApply;

    TMap<UStruct*, FTemplateInfo> TypeToTemplateInfoMap;

    // A UObject wrapper is a native object of the class definition of its UClass (the type id is the FClassWrapper), the native
    // pointer is the UObject itself and it is not owned by js. The backend caches the wrapper (weakly) by the pointer, and calls
    // OnUObjectEnter / OnUObjectExit when it is bound / unbound (a UObject has at most one binding in an env: it is always bound
    // as its own class, enter and exit alternate). Like 2.0, the env holds the UObject (UserObjectRetainer) while it is bound,
    // unless the class is native take js ref (mixin), then the wrapper is held strongly by NativeTakeJsRefObjects instead until
    // SetJsTakeRef. When the UObject is destroyed it is unbound from its wrapper (UnBind, pesapi unbind_native_object) and the
    // strong ref is released, a later access of the wrapper sees a released object.
    virtual void* OnUObjectEnter(pesapi_env Env, pesapi_value JSObject, UObject* UEObject) override;

    virtual void OnUObjectExit(UObject* UEObject, void* UserData) override;

    // whether the wrapper of Obj is held by native (the UObject does not hold the wrapper), by the nearest class of Obj in
    // NativeTakeJsRefClasses (set by mixin), the default otherwise
    bool IsNativeTakeJsRefObject(UObject* Obj) const;

    // per env (the wrappers are shared by envs), set by mixin for a class and its subclasses
    TMap<UClass*, bool> NativeTakeJsRefClasses;

    // the wrappers held strongly by native (set by OnUObjectEnter), released by SetJsTakeRef, when the UObject is destroyed or
    // the env is released. An entry is removed from the map before its ref is released (the wrapper may be freed synchronously
    // on quickjs)
    TMap<UObject*, FPapiValueRef> NativeTakeJsRefObjects;

    std::map<UFunction*, std::unique_ptr<FFunctionTranslator>> JsCallbackPrototypeMap;

    struct DelegateObjectInfo
    {
        FPapiValueRef JSObject;           // the wrapper of the delegate (strong), function to proxy save here
        TWeakObjectPtr<UObject> Owner;    //可用于自动清理
        DelegatePropertyMacro* DelegateProperty;
        MulticastDelegatePropertyMacro* MulticastDelegateProperty;
        UFunction* SignatureFunction;
        bool PassByPointer;
        TWeakObjectPtr<UDynamicDelegateProxy> Proxy;
        FPapiValueRef JsCallbacks;    // js array of the bound functions, the proxy's apply function reads it
    };

    class DynamicInvokerImpl : public IDynamicInvoker
    {
    public:
        DynamicInvokerImpl(FScriptEnvImpl* InParent) : Parent(InParent)
        {
        }

        virtual void InvokeDelegateCallback(UDynamicDelegateProxy* Proxy, void* Params) override
        {
            if (Parent)
                Parent->InvokeDelegateCallback(Proxy, Params);
        }
#if !defined(ENGINE_INDEPENDENT_JSENV)
        virtual void InvokeMixinMethod(
            UObject* ContextObject, UJSGeneratedFunction* Function, FFrame& Stack, void* RESULT_PARAM) override
        {
            if (Parent)
                Parent->InvokeMixinMethod(ContextObject, Function, Stack, RESULT_PARAM);
        }
#endif
        FScriptEnvImpl* Parent;
    };
    TSharedPtr<DynamicInvokerImpl, ESPMode::ThreadSafe> DynamicInvoker;

    std::map<void*, DelegateObjectInfo> DelegateMap;

    TMap<UFunction*, FPapiValueRef> MixinFunctionMap;

    // released before CppObjectMapper.UnInitialize
    TArray<FPapiValueRef> TickHandlers;
    FUETickDelegateHandle TickHandle;

    FUETickDelegateHandle DelegateProxiesCheckerHandler;

    uint32_t ManualReleaseCallbackId = 0;

    TMap<uint32_t, TWeakObjectPtr<UDynamicDelegateProxy>> ManualReleaseCallbacks;

    TMap<UObject*, TArray<TWeakObjectPtr<UDynamicDelegateProxy>>> AutoReleaseCallbacksMap;

#ifdef SINGLE_THREAD_VERIFY
    uint32 BoundThreadId;
#endif

    typedef void (FScriptEnvImpl::*PapiMethodCallback)(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    // a method of scriptEnv that handles the papi callback info itself, the env is the receiver (this)
    template <PapiMethodCallback Method>
    static void PapiMethod(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    // a global function of the host called without a receiver (the module loader of the backend), the env is the userdata
    template <PapiMethodCallback Method>
    static void PapiUserdataMethod(struct pesapi_ffi* Apis, pesapi_callback_info Info)
    {
        (static_cast<FScriptEnvImpl*>(Apis->get_userdata(Info))->*Method)(Apis, Info);
    }
};

}    // namespace PUERTS_NAMESPACE

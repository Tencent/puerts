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
#include "TypeScriptGeneratedClass.h"
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

#if defined(WITH_NODEJS)
PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS
MSVC_PRAGMA(warning(push, 0))
#include "node.h"
#include "uv.h"
MSVC_PRAGMA(warning(pop))
PRAGMA_ENABLE_UNDEFINED_IDENTIFIER_WARNINGS
#endif

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

    // InExternalRuntime / InExternalContext: the isolate and the context of node, only supported by the node build
    FScriptEnvImpl(FPapiBackendFactory InBackendFactory, std::shared_ptr<IJSModuleLoader> InModuleLoader,
        std::shared_ptr<ILogger> InLogger, int InPort, std::function<void(const FString&)> InOnSourceLoadedCallback,
        const FString InFlags, void* InExternalRuntime, void* InExternalContext);

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

#if !defined(ENGINE_INDEPENDENT_JSENV)
    virtual void TryBindJs(const class UObjectBase* InObject) override;

    virtual void RebindJs() override;
#endif

    virtual FString CurrentStackTrace() override;

    virtual void InitExtensionMethodsMap() override;

    void JsHotReload(FName ModuleName, const FString& JsSource);

    // calls puerts.__reload with (module name or undefined, path, source) and logs its exception
    void CallReloadJs(const FPapiEnvScope& EnvScope, pesapi_value (&Args)[3]);

    virtual void ReloadModule(FName ModuleName, const FString& JsSource) override;

    virtual void ReloadSource(const FString& Path, const PString& JsSource) override;

    std::function<void(const FString&)> OnSourceLoadedCallback;

    virtual void OnSourceLoaded(std::function<void(const FString&)> Callback) override;

public:
    bool IsTypeScriptGeneratedClass(UClass* Class);

    void SetJsTakeRef(pesapi_env Env, UObject* UEObject);

    // the UObject was destroyed, the binding (if any) is detached
    void UnBind(UObject* UEObject);

    pesapi_value FindOrAdd(pesapi_env Env, UClass* Class, UObject* UEObject, bool SkipTypeScriptInitial);

    // an owned POD struct, the memory may be freed with the script object by the backend (IPapiBackend::
    // CreateTriviallyFreedObject) instead of the finalizer of the class definition
    static bool IsTriviallyFreed(FScriptStructWrapper* Wrapper);

    static void FreeTriviallyFreedStruct(void* Ptr, size_t Size, void* DeleterData);

    // a wrapper of the container class (ClassDefinition), the wrapper of a borrowed container (PassByPointer) is cached by the
    // container, an owned one (deleted with the wrapper) is always new
    pesapi_value FindOrAddContainer(pesapi_env Env, const JSClassDefinition* ClassDefinition, void* Ptr, PropertyMacro* KeyProperty,
        PropertyMacro* ValueProperty, bool PassByPointer);

    virtual bool AddToDelegate(pesapi_env Env, void* DelegatePtr, pesapi_value JsFunction) override;

    virtual PropertyMacro* FindDelegateProperty(void* DelegatePtr) override;

    virtual FScriptDelegate NewDelegate(
        pesapi_env Env, UObject* Owner, pesapi_value JsFunction, UFunction* SignatureFunction) override;

    void ReleaseManualReleaseDelegate(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    virtual bool RemoveFromDelegate(pesapi_env Env, void* DelegatePtr, pesapi_value JsFunction) override;

    virtual bool ClearDelegate(pesapi_env Env, void* DelegatePtr) override;

    // the class of TypeId is invalidated (pesapi invalidate_class), drops the UE side caches of it
    void OnClassInvalidated(const void* TypeId);

    // IObjectMapper, the papi interface used by the backend independent code
    virtual void* Bind(pesapi_env Env, FClassWrapper* ClassWrapper, UObject* UEObject, pesapi_value JSObject) override;

    virtual pesapi_value FindOrAdd(pesapi_env Env, UClass* Class, UObject* UEObject) override
    {
        return FindOrAdd(Env, Class, UEObject, false);
    }

    virtual bool TryBindOwnedStruct(pesapi_callback_info Info, FScriptStructWrapper* Wrapper, void* Ptr) override;

    virtual pesapi_value FindOrAddStruct(pesapi_env Env, UScriptStruct* ScriptStruct, void* Ptr, bool PassByPointer) override;

    virtual void Merge(pesapi_env Env, pesapi_value Src, UStruct* DesType, void* Des) override;

    virtual pesapi_value FindOrAddContainer(pesapi_env Env, PropertyMacro* Property, FScriptArray* Ptr, bool PassByPointer) override
    {
        return FindOrAddContainer(Env, FScriptArrayWrapper::GetClassDefinition(), Ptr, Property, nullptr, PassByPointer);
    }

    virtual pesapi_value FindOrAddContainer(pesapi_env Env, PropertyMacro* Property, FScriptSet* Ptr, bool PassByPointer) override
    {
        return FindOrAddContainer(Env, FScriptSetWrapper::GetClassDefinition(), Ptr, Property, nullptr, PassByPointer);
    }

    virtual pesapi_value FindOrAddContainer(
        pesapi_env Env, PropertyMacro* KeyProperty, PropertyMacro* ValueProperty, FScriptMap* Ptr, bool PassByPointer) override
    {
        return FindOrAddContainer(Env, FScriptMapWrapper::GetClassDefinition(), Ptr, KeyProperty, ValueProperty, PassByPointer);
    }

    // the wrapper of a delegate is held by DelegateMap (strong) until the delegate is released
    virtual pesapi_value FindOrAddDelegate(
        pesapi_env Env, UObject* Owner, PropertyMacro* Property, void* DelegatePtr, bool PassByPointer) override;

    virtual void ExecuteDelegate(pesapi_env Env, pesapi_callback_info Info, void* DelegatePtr) override;

    virtual pesapi_value CreateArray(pesapi_env Env, FPropertyTranslator* Property, void* ArrayPtr) override;

    virtual bool IsInstanceOf(pesapi_env Env, UStruct* Struct, pesapi_value JsObject) override;

    bool CheckDelegateProxies(float Tick);

    void InvokeDelegateCallback(UDynamicDelegateProxy* Proxy, void* Params);

#if !defined(ENGINE_INDEPENDENT_JSENV)
    void JsConstruct(UClass* Class, UObject* Object, pesapi_value_ref Constructor, pesapi_value_ref Prototype);

    void TsConstruct(UTypeScriptGeneratedClass* Class, UObject* Object);

    void InvokeJsMethod(UObject* ContextObject, UJSGeneratedFunction* Function, FFrame& Stack, void* RESULT_PARAM);

    void InvokeMixinMethod(UObject* ContextObject, UJSGeneratedFunction* Function, FFrame& Stack, void* RESULT_PARAM);

    void TypeScriptInitial(UClass* Class, UObject* Object, const bool TypeScriptClassFound = false);

    void InvokeTsMethod(UObject* ContextObject, UFunction* Function, FFrame& Stack, void* RESULT_PARAM);

    void NotifyReBind(UTypeScriptGeneratedClass* Class);
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

    void Log(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    void LoadModule(struct pesapi_ffi* Apis, pesapi_callback_info Info);

#ifndef WITH_QUICKJS
    // the host side of the module loader of the backend (PapiV8ModuleLoader): finds and reads a module
    void HostResolveModule(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    void HostLoadModule(struct pesapi_ffi* Apis, pesapi_callback_info Info);
#endif

    // the js class of a UStruct, an object of the values for a UEnum, undefined otherwise
    pesapi_value UETypeToJsClass(pesapi_env Env, UField* Type);

    void LoadUEType(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    void LoadCppType(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    void UEClassToJSClass(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    void SetJsTakeRefInTs(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    bool GetContainerTypeProperty(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, PropertyMacro** PropertyPtr);

    void NewContainer(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    std::shared_ptr<FStructWrapper> GetStructWrapper(UStruct* InStruct);

    // the per env info of a UStruct whose js class is built in this env (the class itself is cached by the backend, keyed by
    // the type id, see pesapi create_class)
    struct FTemplateInfo
    {
        std::shared_ptr<FStructWrapper> StructWrapper;
        // the class definition the js class is built from (held by ClassesBuilt / RetiredClasses)
        const JSClassDefinition* ClassDefinition = nullptr;
        // per env flags (the wrapper is shared by envs), IsNativeTakeJsRef can be changed by mixin
#if PUERTS_KEEP_UOBJECT_REFERENCE
        bool IsNativeTakeJsRef = false;
#else
        bool IsNativeTakeJsRef = true;
#endif
        bool IsTypeScriptGeneratedClass = false;
    };

    // builds the js class of the type in this env if not yet (called inside a scope of the env)
    FTemplateInfo* GetTemplateInfoOfType(pesapi_env Env, UStruct* Class, bool& Existed);

    pesapi_value GetJsClass(pesapi_env Env, UStruct* Class);

    FPropertyTranslator* GetContainerPropertyTranslator(PropertyMacro* Property);

    void SetTimeout(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    void SetFTickerDelegate(struct pesapi_ffi* Apis, pesapi_callback_info Info, bool Continue);

    bool TimerCallback(int DelegateHandleId, bool Continue);

    void RemoveFTickerDelegateHandle(int HandleId);

    void SetInterval(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    void ClearInterval(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    void MergeObject(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    void NewObjectByClass(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    void NewStructByScriptStruct(struct pesapi_ffi* Apis, pesapi_callback_info Info);

#if !defined(ENGINE_INDEPENDENT_JSENV)
    void MakeUClass(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    TArray<TWeakObjectPtr<UClass>> MixinClasses;
    void Mixin(struct pesapi_ffi* Apis, pesapi_callback_info Info);
#endif

    void DumpStatisticsLog(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    void IsQuickJS(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    struct ObjectMerger;

    std::unique_ptr<ObjectMerger>& GetObjectMerger(UStruct* Struct);

    struct ObjectMerger
    {
        std::map<PString, std::unique_ptr<FPropertyTranslator>> Fields;
        UStruct* Struct;
        FScriptEnvImpl* Parent;

        ObjectMerger(FScriptEnvImpl* InParent, UStruct* InStruct)
        {
            Parent = InParent;
            Struct = InStruct;
            for (TFieldIterator<PropertyMacro> It(Struct); It; ++It)
            {
                PropertyMacro* Property = *It;
                TStringConversion<TStringConvert<TCHAR, ANSICHAR>> Name(*Property->GetName());
                Fields[Name.Get()] = FPropertyTranslator::Create(Property);
            }
        }

        // merges the own enumerable properties of JsObject into the fields of Ptr, a plain object value of an object / struct
        // field is merged recursively
        void Merge(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value JsObject, void* Ptr);
    };

    friend ObjectMerger;

public:
#if !defined(ENGINE_INDEPENDENT_JSENV)
    class TsDynamicInvokerImpl : public ITsDynamicInvoker
    {
    public:
        TsDynamicInvokerImpl(FScriptEnvImpl* InParent) : Parent(InParent)
        {
        }

        virtual void TsConstruct(UTypeScriptGeneratedClass* Class, UObject* Object) override
        {
            if (Parent)
                Parent->TsConstruct(Class, Object);
        }

        virtual void InvokeTsMethod(UObject* ContextObject, UFunction* Function, FFrame& Stack, void* RESULT_PARAM) override
        {
            if (Parent)
                Parent->InvokeTsMethod(ContextObject, Function, Stack, RESULT_PARAM);
        }

        virtual void NotifyReBind(UTypeScriptGeneratedClass* Class) override
        {
            if (Parent)
                Parent->NotifyReBind(Class);
        }

        FScriptEnvImpl* Parent;
    };

    TSharedPtr<ITsDynamicInvoker, ESPMode::ThreadSafe> TsDynamicInvoker;

    TSharedPtr<IDynamicInvoker, ESPMode::ThreadSafe> MixinInvoker;
#endif
private:
    FObjectRetainer UserObjectRetainer;

    FObjectRetainer SysObjectRetainer;

    std::shared_ptr<IJSModuleLoader> ModuleLoader;

#ifndef WITH_QUICKJS
    // "<by><path>" -> kind, the modules whose kind is decided by the package.json requiring them
    TMap<FString, FString> ForcedModuleKinds;

    // path -> debug path, filled by HostResolveModule
    TMap<FString, FString> ModuleDebugPaths;

#if defined(WITH_NODEJS)
    // the require of node, tried first by require (as modular.js did)
    FPapiValueRef NodeRequire;
#endif
#endif

    std::shared_ptr<ILogger> Logger;

    bool Started;

private:
    // the backend of the env (engine and language), the env only uses it and the pesapi table it returns
    std::unique_ptr<IPapiBackend> Backend;

    struct pesapi_ffi* MainApis = nullptr;

#if defined(WITH_NODEJS)
    uv_loop_t NodeUVLoop;

    std::unique_ptr<node::ArrayBufferAllocator> NodeArrayBufferAllocator;

    node::IsolateData* NodeIsolateData;

    node::Environment* NodeEnv;

    uv_thread_t PollingThread;

    uv_sem_t PollingSem;

    uv_async_t DummyUVHandle;

    bool PollingClosed = false;

    FGraphEventRef LastJob;

#if PLATFORM_LINUX
    int Epoll;
#endif

    void StartPolling();

    void UvRunOnce();

    void PollEvents();

    static void OnWatcherQueueChanged(uv_loop_t* loop);

    void WakeupPollingThread();

    void StopPolling();
#endif

#if defined(WITH_NODEJS)
    // the isolate of node, created and disposed by the host (adopted by the backend)
    v8::Isolate* NodeIsolate = nullptr;
#endif

    // the ref of the default env, the entries from the host open their papi scopes with it (FPapiEnvScope)
    pesapi_env_ref MainEnvRef = nullptr;

    FPapiValueRef ReloadJs;

#if !PUERTS_FORCE_CPP_UFUNCTION
    FPapiValueRef MergePrototype;
#endif

    FPapiValueRef RemoveListItem;

    FPapiValueRef GenListApply;

    TMap<UStruct*, FTemplateInfo> TypeToTemplateInfoMap;

    // the class definitions (of FStructWrapper) the js classes of this env are built from, keyed by type id. The classes
    // reference the definitions and are not collected while the env is alive, so a definition dropped by InvalidateClass is
    // kept in RetiredClasses, both are released after the env is destroyed
    std::unordered_map<const void*, std::shared_ptr<FReflectedClass>> ClassesBuilt;

    std::vector<std::shared_ptr<FReflectedClass>> RetiredClasses;

    // IPapiBackend OnClassCreated
    bool OnReflectedClassCreated(const JSClassDefinition* ClassDefinition);

    // A UObject wrapper is a native object of the class definition of its UClass (the type id is the FClassWrapper), the native
    // pointer is a FUObjectBinding (a FUObjectHandle) owned by the wrapper: it is freed by the finalizer of the class
    // (OnBindingFinalize) when the wrapper is garbage collected. When the UObject is destroyed first, the binding is detached (see
    // UnBind) and moved to ReleasedObjectBindings until then.
    struct FUObjectBinding : FUObjectHandle
    {
        FScriptEnvImpl* Owner = nullptr;

        // the wrapper, strong if native holds the js object, weak if the js object holds the UObject (SetJsTakeRef), released
        // after the UObject is destroyed
        FPapiValueRef JsObject;
    };

    static void OnBindingFinalize(FUObjectHandle* Handle);

    // creates the binding of UEObject and adds it to ObjectMap. A null JSObject is set to a new wrapper (a native object of
    // ClassWrapper owning the binding), otherwise it is the object being constructed, which the backend binds the returned
    // binding to. The wrapper is held weakly and holds UEObject unless the class is native take js ref
    FUObjectBinding* AddBinding(
        pesapi_env Env, FClassWrapper* ClassWrapper, bool ClassIsNativeTakeJsRef, UObject* UEObject, pesapi_value& JSObject);

    TMap<UObject*, FUObjectBinding*> ObjectMap;

    TSet<FUObjectBinding*> ReleasedObjectBindings;

    // container -> holder of the cached (borrowed) container wrappers, the holders are freed by the finalizer of the container
    // classes (on gc or when the env is released by the backend), so the map must outlive the env
    TMap<void*, FContainerHolder*> ContainerHolders;

    struct ContainerPropertyInfo
    {
#if ENGINE_MINOR_VERSION < 25 && ENGINE_MAJOR_VERSION < 5
        TWeakObjectPtr<PropertyMacro> PropertyWeakPtr;
#else
        TWeakFieldPtr<PropertyMacro> PropertyWeakPtr;
#endif
        std::unique_ptr<FPropertyTranslator> PropertyTranslator;
    };

    std::map<PropertyMacro*, ContainerPropertyInfo> ContainerPropertyMap;

    std::map<UFunction*, std::unique_ptr<FFunctionTranslator>> JsCallbackPrototypeMap;

    std::map<UStruct*, std::unique_ptr<ObjectMerger>> ObjectMergers;

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

    struct TsFunctionInfo
    {
        FPapiValueRef JsFunction;

        std::unique_ptr<FFunctionTranslator> FunctionTranslator;
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
        virtual void JsConstruct(UClass* Class, UObject* Object, pesapi_value_ref Constructor, pesapi_value_ref Prototype) override
        {
            if (Parent)
                Parent->JsConstruct(Class, Object, Constructor, Prototype);
        }

        virtual void InvokeJsMethod(
            UObject* ContextObject, UJSGeneratedFunction* Function, FFrame& Stack, void* RESULT_PARAM) override
        {
            if (Parent)
                Parent->InvokeJsMethod(ContextObject, Function, Stack, RESULT_PARAM);
        }

        virtual void InvokeMixinMethod(
            UObject* ContextObject, UJSGeneratedFunction* Function, FFrame& Stack, void* RESULT_PARAM) override
        {
            if (Parent)
                Parent->InvokeMixinMethod(ContextObject, Function, Stack, RESULT_PARAM);
        }
#endif
        FScriptEnvImpl* Parent;
    };
#if !defined(ENGINE_INDEPENDENT_JSENV)
    struct FBindInfo
    {
        FName Name;
        FPapiValueRef Constructor;
        FPapiValueRef Prototype;
        bool InjectNotFinished;
    };

    TMap<UTypeScriptGeneratedClass*, FBindInfo> BindInfoMap;

    void FinishInjection(UClass* InClass);

    void MakeSureInject(UTypeScriptGeneratedClass* Class, bool ForceReinject, bool RebindObject);

    // the exceptions are left in Scope for the caller
    void InjectTsClass(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_scope Scope, UTypeScriptGeneratedClass* Class,
        UTypeScriptGeneratedClass* SuperClass, const FString& ModuleName, bool PrototypeLinked, bool RebindObject);
#endif
    TSharedPtr<DynamicInvokerImpl, ESPMode::ThreadSafe> DynamicInvoker;

    TSet<UClass*> GeneratedClasses;

    std::map<void*, DelegateObjectInfo> DelegateMap;

    TMap<UFunction*, TsFunctionInfo> TsFunctionMap;

    TMap<UFunction*, FPapiValueRef> MixinFunctionMap;

    // papi has no prototype / own property api, use the js builtins, cached by GetCachedJsFunction
    FPapiValueRef ObjectSetPrototypeOf;

    FPapiValueRef ObjectGetPrototypeOf;

    FPapiValueRef ObjectHasOwn;

    // used by ObjectMerger (the js to struct conversion of a plain object)
    FPapiValueRef ObjectKeys;

    // proxy at the end of the prototype chains of reflected classes (set as the prototype of the root prototypes), it fixes
    // the case of member names by FName when a member is not found
    FPapiValueRef FNameFixingProxy;

    void InstallFNameFixing(pesapi_env Env, pesapi_value Class);

    // evals Code once and caches the function, returns nullptr with the exception pending if the eval fails
    pesapi_value GetCachedJsFunction(
        struct pesapi_ffi* Apis, pesapi_env Env, FPapiValueRef& Cache, const char* Code, const char* Path);

    struct FTimerInfo
    {
        // released by RemoveFTickerDelegateHandle or the destructor
        pesapi_value_ref Callback = nullptr;
        FUETickDelegateHandle TickerHandle;
    };
    uint32_t TimerID = 0;
    TMap<uint32_t, FTimerInfo> TimerInfos;

    FUETickDelegateHandle DelegateProxiesCheckerHandler;

    FContainerMeta ContainerMeta;

    // js Map: function -> id in ManualReleaseCallbacks
    FPapiValueRef ManualReleaseCallbackMap;

    uint32_t ManualReleaseCallbackId = 0;

    TMap<uint32_t, TWeakObjectPtr<UDynamicDelegateProxy>> ManualReleaseCallbacks;

    TMap<UObject*, TArray<TWeakObjectPtr<UDynamicDelegateProxy>>> AutoReleaseCallbacksMap;

#ifdef SINGLE_THREAD_VERIFY
    uint32 BoundThreadId;
#endif

    typedef void (FScriptEnvImpl::*PapiMethodCallback)(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    // binds a member function as a papi function (pesapi create_function), This is passed as the userdata
    template <PapiMethodCallback callback>
    struct PapiMethodBindingHelper
    {
        static void Callback(struct pesapi_ffi* Apis, pesapi_callback_info Info)
        {
            auto Self = static_cast<FScriptEnvImpl*>(Apis->get_userdata(Info));
            (Self->*callback)(Apis, Info);
        }

        static void Bind(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Obj, const char* Key, FScriptEnvImpl* This)
        {
            Apis->set_property(Env, Obj, Key, Apis->create_function(Env, &Callback, This, nullptr));
        }
    };

    static void PapiBindFunction(
        struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Obj, const char* Key, pesapi_callback Callback)
    {
        Apis->set_property(Env, Obj, Key, Apis->create_function(Env, Callback, nullptr, nullptr));
    }
};

}    // namespace PUERTS_NAMESPACE

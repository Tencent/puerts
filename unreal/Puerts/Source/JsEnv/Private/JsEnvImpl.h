/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "JsEnv.h"
#include "DynamicDelegateProxy.h"
#include "StructWrapper.h"
#include "CppObjectMapper.h"
#include "V8Utils.h"
#include "ObjectMapper.h"
#include "JSLogger.h"
#include "TickerDelegateWrapper.h"
#if !defined(ENGINE_INDEPENDENT_JSENV)
#include "TypeScriptGeneratedClass.h"
#endif
#include "UECompatible.h"
#include "ContainerMeta.h"
#include "ObjectCacheNode.h"
#include <unordered_map>

#if ENGINE_MINOR_VERSION >= 25 || ENGINE_MAJOR_VERSION > 4
#include "UObject/WeakFieldPtr.h"
#endif

#pragma warning(push, 0)
#include "libplatform/libplatform.h"
#include "v8.h"
#pragma warning(pop)

#include "V8InspectorImpl.h"

#if defined(WITH_NODEJS)
#pragma warning(push, 0)
#include "node.h"
#include "uv.h"
#pragma warning(pop)
#endif

#if V8_MAJOR_VERSION < 8 || defined(WITH_QUICKJS) || defined(WITH_NODEJS) || (WITH_EDITOR && !defined(FORCE_USE_STATIC_V8_LIB))
#define WITH_BACKING_STORE_AUTO_FREE 0
#else
#define WITH_BACKING_STORE_AUTO_FREE 1
#endif

namespace puerts
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

class FJsEnvImpl : public IJsEnv, IObjectMapper, public FUObjectArray::FUObjectDeleteListener
{
public:
    explicit FJsEnvImpl(const FString& ScriptRoot);

    FJsEnvImpl(std::shared_ptr<IJSModuleLoader> InModuleLoader, std::shared_ptr<ILogger> InLogger, int InPort,
        std::function<void(const FString&)> InOnSourceLoadedCallback, void* InExternalRuntime = nullptr,
        void* InExternalContext = nullptr);

    virtual ~FJsEnvImpl() override;

    virtual void Start(
        const FString& ModuleNameOrScript, const TArray<TPair<FString, UObject*>>& Arguments, bool IsScript) override;

    virtual bool IdleNotificationDeadline(double DeadlineInSeconds) override;

    virtual void LowMemoryNotification() override;

    virtual void RequestMinorGarbageCollectionForTesting() override;

    virtual void RequestFullGarbageCollectionForTesting() override;

    virtual void WaitDebugger(double timeout) override
    {
#ifdef THREAD_SAFE
        v8::Locker Locker(MainIsolate);
#endif
        const auto startTime = FDateTime::Now();
        while (Inspector && !Inspector->Tick())
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

    virtual void ReloadModule(FName ModuleName, const FString& JsSource) override;

    virtual void ReloadSource(const FString& Path, const std::string& JsSource) override;

    std::function<void(const FString&)> OnSourceLoadedCallback;

    virtual void OnSourceLoaded(std::function<void(const FString&)> Callback) override;

public:
    bool IsTypeScriptGeneratedClass(UClass* Class);

    virtual void Bind(FClassWrapper* ClassWrapper, UObject* UEObject, v8::Local<v8::Object> JSObject) override;

    virtual void UnBind(UClass* Class, UObject* UEObject) override;

    virtual void UnBind(UClass* Class, UObject* UEObject, bool ResetPointer);

    v8::Local<v8::Value> FindOrAdd(
        v8::Isolate* InIsolate, v8::Local<v8::Context>& Context, UClass* Class, UObject* UEObject, bool SkipTypeScriptInitial);

    virtual v8::Local<v8::Value> FindOrAdd(
        v8::Isolate* InIsolate, v8::Local<v8::Context>& Context, UClass* Class, UObject* UEObject) override;

    virtual void BindStruct(
        FScriptStructWrapper* ScriptStructWrapper, void* Ptr, v8::Local<v8::Object> JSObject, bool PassByPointer) override;

    virtual void UnBindStruct(FScriptStructWrapper* ScriptStructWrapper, void* Ptr) override;

    virtual void UnBindCppObject(JSClassDefinition* ClassDefinition, void* Ptr) override;

    virtual v8::Local<v8::Value> FindOrAddStruct(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, UScriptStruct* ScriptStruct, void* Ptr, bool PassByPointer) override;

    virtual void BindCppObject(v8::Isolate* InIsolate, JSClassDefinition* ClassDefinition, void* Ptr,
        v8::Local<v8::Object> JSObject, bool PassByPointer) override;

    virtual v8::Local<v8::Value> FindOrAddCppObject(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* TypeId, void* Ptr, bool PassByPointer) override;

    virtual void Merge(
        v8::Isolate* Isolate, v8::Local<v8::Context> Context, v8::Local<v8::Object> Src, UStruct* DesType, void* Des) override;

    virtual void BindContainer(
        void* Ptr, v8::Local<v8::Object> JSObject, void (*Callback)(const v8::WeakCallbackInfo<void>& data)) override;

    virtual void UnBindContainer(void* Ptr) override;

    virtual v8::Local<v8::Value> FindOrAddContainer(v8::Isolate* Isolate, v8::Local<v8::Context>& Context,
        v8::Local<v8::Function> Constructor, PropertyMacro* Property1, PropertyMacro* Property2, void* Ptr, bool PassByPointer);

    virtual v8::Local<v8::Value> FindOrAddContainer(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, PropertyMacro* Property,
        FScriptArray* Ptr, bool PassByPointer) override;

    virtual v8::Local<v8::Value> FindOrAddContainer(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, PropertyMacro* Property,
        FScriptSet* Ptr, bool PassByPointer) override;

    virtual v8::Local<v8::Value> FindOrAddContainer(v8::Isolate* Isolate, v8::Local<v8::Context>& Context,
        PropertyMacro* KeyProperty, PropertyMacro* ValueProperty, FScriptMap* Ptr, bool PassByPointer) override;

    virtual v8::Local<v8::Value> FindOrAddDelegate(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, UObject* Owner,
        PropertyMacro* Property, void* DelegatePtr, bool PassByPointer) override;

    virtual bool AddToDelegate(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, void* DelegatePtr, v8::Local<v8::Function> JsFunction) override;

    virtual PropertyMacro* FindDelegateProperty(void* DelegatePtr) override;

    virtual FScriptDelegate NewManualReleaseDelegate(v8::Isolate* Isolate, v8::Local<v8::Context>& Context,
        v8::Local<v8::Function> JsFunction, UFunction* SignatureFunction) override;

    void ReleaseManualReleaseDelegate(const v8::FunctionCallbackInfo<v8::Value>& Info);

    virtual bool RemoveFromDelegate(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, void* DelegatePtr, v8::Local<v8::Function> JsFunction) override;

    virtual bool ClearDelegate(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, void* DelegatePtr) override;

    virtual void ExecuteDelegate(v8::Isolate* Isolate, v8::Local<v8::Context>& Context,
        const v8::FunctionCallbackInfo<v8::Value>& Info, void* DelegatePtr) override;

    virtual bool IsInstanceOf(UStruct* Struct, v8::Local<v8::Object> JsObject) override;

    virtual bool IsInstanceOfCppObject(const void* TypeId, v8::Local<v8::Object> JsObject) override;

    virtual std::weak_ptr<int> GetJsEnvLifeCycleTracker() override;

    virtual v8::Local<v8::Value> AddSoftObjectPtr(v8::Isolate* Isolate, v8::Local<v8::Context> Context,
        FSoftObjectPtr* SoftObjectPtr, UClass* Class, bool IsSoftClass) override;

    bool CheckDelegateProxies(float Tick);

    virtual v8::Local<v8::Value> CreateArray(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, FPropertyTranslator* Property, void* ArrayPtr) override;

    void InvokeDelegateCallback(UDynamicDelegateProxy* Proxy, void* Params);

#if !defined(ENGINE_INDEPENDENT_JSENV)
    void JsConstruct(UClass* Class, UObject* Object, const v8::UniquePersistent<v8::Function>& Constructor,
        const v8::UniquePersistent<v8::Object>& Prototype);

    void TsConstruct(UTypeScriptGeneratedClass* Class, UObject* Object);

    void InvokeJsMethod(UObject* ContextObject, UJSGeneratedFunction* Function, FFrame& Stack, void* RESULT_PARAM);

    void InvokeMixinMethod(UObject* ContextObject, UJSGeneratedFunction* Function, FFrame& Stack, void* RESULT_PARAM);

    void TypeScriptInitial(UClass* Class, UObject* Object);

    void InvokeTsMethod(UObject* ContextObject, UFunction* Function, FFrame& Stack, void* RESULT_PARAM);

    void NotifyReBind(UTypeScriptGeneratedClass* Class);
#endif

    v8::UniquePersistent<v8::Function> JsPromiseRejectCallback;

    V8_INLINE static FJsEnvImpl* Get(v8::Isolate* Isolate)
    {
        return static_cast<FJsEnvImpl*>(FV8Utils::IsolateData<IObjectMapper>(Isolate));
    }

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

    void ExecuteModule(const FString& ModuleName, std::function<FString(const FString&, const FString&)> Preprocessor = nullptr);

    void EvalScript(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void Log(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void SearchModule(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void LoadModule(const v8::FunctionCallbackInfo<v8::Value>& Info);

    v8::Local<v8::Value> UETypeToJsClass(v8::Isolate* Isolate, v8::Local<v8::Context> Context, UField* Type);

    void LoadUEType(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void LoadCppType(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void UEClassToJSClass(const v8::FunctionCallbackInfo<v8::Value>& Info);

    bool GetContainerTypeProperty(v8::Local<v8::Context> Context, v8::Local<v8::Value> Value, PropertyMacro** PropertyPtr);

    void NewContainer(const v8::FunctionCallbackInfo<v8::Value>& Info);

    std::shared_ptr<FStructWrapper> GetStructWrapper(UStruct* InStruct, bool& IsReuseTemplate);

    struct FTemplateInfo
    {
        v8::UniquePersistent<v8::FunctionTemplate> Template;
        std::shared_ptr<FStructWrapper> StructWrapper;
    };

    FTemplateInfo* GetTemplateInfoOfType(UStruct* Class, bool& Existed);

    v8::Local<v8::Function> GetJsClass(UStruct* Class, v8::Local<v8::Context> Context);

    FPropertyTranslator* GetContainerPropertyTranslator(PropertyMacro* Property);

    void SetTimeout(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void SetFTickerDelegate(const v8::FunctionCallbackInfo<v8::Value>& Info, bool Continue);

    void ReportExecutionException(
        v8::Isolate* Isolate, v8::TryCatch* TryCatch, std::function<void(const JSError*)> CompletionHandler);

    void RemoveFTickerDelegateHandle(FUETickDelegateHandle* Handle);

    void SetInterval(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void ClearInterval(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void MergeObject(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void NewObjectByClass(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void NewStructByScriptStruct(const v8::FunctionCallbackInfo<v8::Value>& Info);

#if !defined(ENGINE_INDEPENDENT_JSENV)
    void MakeUClass(const v8::FunctionCallbackInfo<v8::Value>& Info);

    TArray<TWeakObjectPtr<UClass>> MixinClasses;
    void Mixin(const v8::FunctionCallbackInfo<v8::Value>& Info);
#endif

    void FindModule(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void DumpStatisticsLog(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void SetInspectorCallback(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void DispatchProtocolMessage(const v8::FunctionCallbackInfo<v8::Value>& Info);

#ifndef WITH_QUICKJS
    v8::MaybeLocal<v8::Module> FetchESModuleTree(v8::Local<v8::Context> Context, const FString& FileName);

    v8::MaybeLocal<v8::Module> FetchCJSModuleAsESModule(v8::Local<v8::Context> Context, const FString& ModuleName);

    struct FModuleInfo
    {
        v8::Global<v8::Module> Module;
        TMap<FString, v8::Global<v8::Module>> ResolveCache;
        v8::Global<v8::Value> CJSValue;
    };

    std::unordered_multimap<int, FModuleInfo*>::iterator FindModuleInfo(v8::Local<v8::Module> Module);

    static v8::MaybeLocal<v8::Module> ResolveModuleCallback(
        v8::Local<v8::Context> Context, v8::Local<v8::String> Specifier, v8::Local<v8::Module> Referrer);
#endif

    struct ObjectMerger;

    std::unique_ptr<ObjectMerger>& GetObjectMerger(UStruct* Struct);

    struct ObjectMerger
    {
        std::map<std::string, std::unique_ptr<FPropertyTranslator>> Fields;
        UStruct* Struct;
        FJsEnvImpl* Parent;

        ObjectMerger(FJsEnvImpl* InParent, UStruct* InStruct)
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

        void Merge(v8::Isolate* Isolate, v8::Local<v8::Context> Context, v8::Local<v8::Object> JsObject, void* Ptr)
        {
            if (auto Class = Cast<UClass>(Struct))
            {
                UObject* Object = reinterpret_cast<UObject*>(Ptr);
                if (!Object->IsValidLowLevel() || UEObjectIsPendingKill(Object) || Object->GetClass() != Class ||
                    FV8Utils::GetPointer(JsObject))
                {
                    return;
                }
            }
            auto Keys = JsObject->GetOwnPropertyNames(Context).ToLocalChecked();
            for (decltype(Keys->Length()) i = 0; i < Keys->Length(); ++i)
            {
                auto Key = Keys->Get(Context, i).ToLocalChecked();
                auto Iter = Fields.find(*v8::String::Utf8Value(Isolate, Key));
                if (Iter != Fields.end())
                {
                    auto MaybeValue = JsObject->Get(Context, Key);
                    if (!MaybeValue.IsEmpty())
                    {
                        auto Value = MaybeValue.ToLocalChecked();
                        if (Value->IsObject())
                        {
                            auto JsObjectField = Value->ToObject(Context).ToLocalChecked();
                            if (!FV8Utils::GetPointerFast<void>(JsObjectField))
                            {
                                UStruct* FieldStruct = nullptr;
                                if (auto ObjectPropertyBase = CastFieldMacro<ObjectPropertyBaseMacro>(Iter->second->Property))
                                {
                                    FieldStruct = ObjectPropertyBase->PropertyClass;
                                }
                                else if (auto StructProperty = CastFieldMacro<StructPropertyMacro>(Iter->second->Property))
                                {
                                    FieldStruct = StructProperty->Struct;
                                }
                                if (FieldStruct)
                                {
                                    Parent->GetObjectMerger(FieldStruct)
                                        ->Merge(Isolate, Context, JsObjectField,
                                            Iter->second->Property->ContainerPtrToValuePtr<void>(Ptr));
                                }
                                continue;
                            }
                        }
                        if (!Value->IsUndefined())
                            Iter->second->JsToUEInContainer(Isolate, Context, Value, Ptr, true);
                    }
                }
            }
        }
    };

    friend ObjectMerger;

public:
#if !defined(ENGINE_INDEPENDENT_JSENV)
    class TsDynamicInvokerImpl : public ITsDynamicInvoker
    {
    public:
        TsDynamicInvokerImpl(FJsEnvImpl* InParent) : Parent(InParent)
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

        FJsEnvImpl* Parent;
    };

    TSharedPtr<ITsDynamicInvoker, ESPMode::ThreadSafe> TsDynamicInvoker;

    TSharedPtr<IDynamicInvoker, ESPMode::ThreadSafe> MixinInvoker;
#endif
private:
    puerts::FObjectRetainer UserObjectRetainer;

    puerts::FObjectRetainer SysObjectRetainer;

    std::shared_ptr<IJSModuleLoader> ModuleLoader;

    std::shared_ptr<ILogger> Logger;

    bool Started;

private:
    v8::Isolate::CreateParams CreateParams;

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

    v8::Isolate* MainIsolate;

    v8::Global<v8::Context> DefaultContext;

    v8::Global<v8::Function> Require;

    v8::Global<v8::Function> GetESMMain;

    v8::Global<v8::Function> ReloadJs;

    TMap<UStruct*, FTemplateInfo> TypeToTemplateInfoMap;

    TMap<FString, std::shared_ptr<FStructWrapper>> TypeReflectionMap;

    TMap<UObject*, v8::UniquePersistent<v8::Value>> ObjectMap;

    TMap<void*, FObjectCacheNode> StructCache;

    TMap<void*, v8::UniquePersistent<v8::Value>> ContainerCache;

    FCppObjectMapper CppObjectMapper;

#if !WITH_BACKING_STORE_AUTO_FREE && !defined(HAS_ARRAYBUFFER_NEW_WITHOUT_STL)
    struct ScriptStructFinalizeInfo
    {
        TWeakObjectPtr<UStruct> Struct;
        FinalizeFunc Finalize;
    };
    TMap<void*, ScriptStructFinalizeInfo> ScriptStructFinalizeInfoMap;
#endif

    v8::UniquePersistent<v8::FunctionTemplate> ArrayTemplate;

    v8::UniquePersistent<v8::FunctionTemplate> SetTemplate;

    v8::UniquePersistent<v8::FunctionTemplate> MapTemplate;

    v8::UniquePersistent<v8::FunctionTemplate> FixSizeArrayTemplate;

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
        v8::UniquePersistent<v8::Object> JSObject;    // function to proxy save here
        TWeakObjectPtr<UObject> Owner;                //可用于自动清理
        DelegatePropertyMacro* DelegateProperty;
        MulticastDelegatePropertyMacro* MulticastDelegateProperty;
        UFunction* SignatureFunction;
        bool PassByPointer;
        TWeakObjectPtr<UDynamicDelegateProxy> Proxy;           // for delegate
        TSet<TWeakObjectPtr<UDynamicDelegateProxy>> Proxys;    // for MulticastDelegate
    };

    struct TsFunctionInfo
    {
        v8::UniquePersistent<v8::Function> JsFunction;

        std::unique_ptr<puerts::FFunctionTranslator> FunctionTranslator;
    };

    class DynamicInvokerImpl : public IDynamicInvoker
    {
    public:
        DynamicInvokerImpl(FJsEnvImpl* InParent) : Parent(InParent)
        {
        }

        virtual void InvokeDelegateCallback(UDynamicDelegateProxy* Proxy, void* Params) override
        {
            if (Parent)
                Parent->InvokeDelegateCallback(Proxy, Params);
        }
#if !defined(ENGINE_INDEPENDENT_JSENV)
        virtual void JsConstruct(UClass* Class, UObject* Object, const v8::UniquePersistent<v8::Function>& Constructor,
            const v8::UniquePersistent<v8::Object>& Prototype) override
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
        FJsEnvImpl* Parent;
    };
#if !defined(ENGINE_INDEPENDENT_JSENV)
    struct FBindInfo
    {
        FName Name;
        v8::UniquePersistent<v8::Function> Constructor;
        v8::UniquePersistent<v8::Object> Prototype;
        bool InjectNotFinished;
    };

    TMap<UTypeScriptGeneratedClass*, FBindInfo> BindInfoMap;

    void FinishInjection(UClass* InClass);

    void MakeSureInject(UTypeScriptGeneratedClass* Class, bool ForceReinject, bool RebindObject);
#endif
    TSharedPtr<DynamicInvokerImpl, ESPMode::ThreadSafe> DynamicInvoker;

    TSet<UClass*> GeneratedClasses;

    v8::UniquePersistent<v8::FunctionTemplate> DelegateTemplate;

    v8::UniquePersistent<v8::FunctionTemplate> MulticastDelegateTemplate;

    v8::UniquePersistent<v8::FunctionTemplate> SoftObjectPtrTemplate;

    std::map<void*, DelegateObjectInfo> DelegateMap;

    TMap<UFunction*, TsFunctionInfo> TsFunctionMap;

    TMap<UFunction*, v8::UniquePersistent<v8::Function>> MixinFunctionMap;

    std::map<UStruct*, std::vector<UFunction*>> ExtensionMethodsMap;

    bool ExtensionMethodsMapInited = false;

    std::map<FUETickDelegateHandle*, FTickerDelegateWrapper*> TickerDelegateHandleMap;

    FUETickDelegateHandle DelegateProxiesCheckerHandler;

    V8Inspector* Inspector;

    V8InspectorChannel* InspectorChannel;

    v8::Global<v8::Function> InspectorMessageHandler;

    FContainerMeta ContainerMeta;

    v8::Global<v8::Map> ManualReleaseCallbackMap;

    std::vector<TWeakObjectPtr<UDynamicDelegateProxy>> ManualReleaseCallbackList;

#ifndef WITH_QUICKJS
    TMap<FString, v8::Global<v8::Module>> PathToModule;

    std::unordered_multimap<int, FModuleInfo*> HashToModuleInfo;
#endif

#ifdef SINGLE_THREAD_VERIFY
    uint32 BoundThreadId;
#endif

    typedef void (FJsEnvImpl::*V8MethodCallback)(const v8::FunctionCallbackInfo<v8::Value>& Info);

    template <V8MethodCallback callback>
    struct MethodBindingHelper
    {
        static void Bind(v8::Isolate* Isolate, v8::Local<v8::Context> Context, v8::Local<v8::Object> Obj, const char* Key,
            v8::Local<v8::External> This)
        {
            Obj->Set(Context, FV8Utils::ToV8String(Isolate, Key),
                   v8::FunctionTemplate::New(
                       Isolate,
                       [](const v8::FunctionCallbackInfo<v8::Value>& Info)
                       {
                           auto Self = static_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
                           (Self->*callback)(Info);
                       },
                       This)
                       ->GetFunction(Context)
                       .ToLocalChecked())
                .Check();
        }
    };
};

}    // namespace puerts

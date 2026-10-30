/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "ScriptEnvImpl.h"
#include "DynamicDelegateProxy.h"
#include "Misc/FileHelper.h"
#include "Dom/JsonObject.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "Misc/Paths.h"
#include "StructWrapper.h"
#include "PapiUtils.h"
#include "DelegateWrapper.h"
#include "ContainerWrapper.h"
#include "SoftObjectWrapper.h"
#include "WeakObjectPtrWrapper.h"
#include "ObjectMapper.h"
#include "JSLogger.h"
#if !defined(ENGINE_INDEPENDENT_JSENV)
#include "JSGeneratedClass.h"
#include "JSGeneratedFunction.h"
#include "Blueprint/WidgetBlueprintGeneratedClass.h"
#endif
#include "JSClassRegister.h"
#if !defined(ENGINE_INDEPENDENT_JSENV)
#include "Engine/UserDefinedEnum.h"
#endif
#include "ContainerMeta.h"

#if !defined(ENGINE_INDEPENDENT_JSENV)
#include "Engine/CollisionProfile.h"
#endif

#if defined(WITH_WEBSOCKET)
void InitWebsocketPPWrap(pesapi_ffi* Apis, pesapi_env Env, PUERTS_NAMESPACE::ScriptClassRegistry* Registry);
#endif

namespace PUERTS_NAMESPACE
{
void LoadPesapiDll(struct pesapi_ffi* Apis, pesapi_callback_info Info);

FScriptEnvImpl::FScriptEnvImpl(FPapiBackendFactory InBackendFactory, const FString& ScriptRoot)
    : FScriptEnvImpl(std::move(InBackendFactory), std::make_shared<DefaultJSModuleLoader>(ScriptRoot),
          std::make_shared<FDefaultLogger>(), -1, FString(), nullptr, nullptr)
{
}

static void FNameToArrayBuffer(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    FName Name(*PapiUtils::ToFString(Apis, Env, Apis->get_arg(Info, 0)));
    Apis->add_return(Info, Apis->create_binary_by_value(Env, &Name, sizeof(FName)));
}

static void ToCString(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    pesapi_value Str = Apis->get_arg(Info, 0);
    if (!Apis->is_string(Env, Str))
    {
        Apis->throw_by_string(Info, "expect a string");
        return;
    }

    size_t Length = 0;
    Apis->get_value_string_utf8(Env, Str, nullptr, &Length);
    TArray<char> Buff;
    Buff.SetNumUninitialized(Length + 1);
    Apis->get_value_string_utf8(Env, Str, Buff.GetData(), &Length);
    Buff[Length] = '\0';
    Apis->add_return(Info, Apis->create_binary_by_value(Env, Buff.GetData(), Length + 1));
}

static void ToCPtrArray(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    const int Num = Apis->get_args_len(Info);

    TArray<void*> Buff;
    Buff.SetNumZeroed(Num);
    for (int i = 0; i < Num; i++)
    {
        pesapi_value Val = Apis->get_arg(Info, i);
        // an ArrayBuffer or an ArrayBufferView
        if (Apis->is_binary(Env, Val))
        {
            size_t Unused = 0;
            Buff[i] = Apis->get_value_binary(Env, Val, &Unused);
        }
    }
    Apis->add_return(Info, Apis->create_binary_by_value(Env, Buff.GetData(), sizeof(void*) * Num));
}

static void GetFNameString(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    FName RequiredFName(*PapiUtils::ToFString(Apis, Env, Apis->get_arg(Info, 0)));
    Apis->add_return(Info, PapiUtils::FromFString(Apis, Env, RequiredFName.ToString()));
}

// the name with the case of the comparison entry (the first registered case), ToString keeps the case of the display entry
static void FixFNameCase(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    FName RequiredFName(*PapiUtils::ToFString(Apis, Env, Apis->get_arg(Info, 0)));
    const FNameEntry* Entry = RequiredFName.GetComparisonNameEntry();
    FString Out;
    Entry->AppendNameToString(Out);
    if (RequiredFName.GetNumber() != NAME_NO_NUMBER_INTERNAL)
    {
        Out += TEXT('_');
        Out.AppendInt(NAME_INTERNAL_TO_EXTERNAL(RequiredFName.GetNumber()));
    }
    Apis->add_return(Info, PapiUtils::FromFString(Apis, Env, Out));
}

FScriptEnvImpl::FScriptEnvImpl(FPapiBackendFactory InBackendFactory, std::shared_ptr<IJSModuleLoader> InModuleLoader,
    std::shared_ptr<ILogger> InLogger, int InDebugPort, const FString InFlags, void* InExternalRuntime, void* InExternalContext)
{
    GUObjectArray.AddUObjectDeleteListener(static_cast<FUObjectArray::FUObjectDeleteListener*>(this));

    Started = false;

    ModuleLoader = std::move(InModuleLoader);
    Logger = InLogger;

    // the backend of the env, created by the factory given by the caller (see PapiBackend.h), the host only uses the papi
    // table it provides (MainApis)
    FPapiBackendParams BackendParams;
    BackendParams.Logger = Logger;
    BackendParams.Flags = InFlags;
    BackendParams.OnEnvReleased = [this]() { OnEnvReleased(); };
    BackendParams.OnClassInvalidated = [this](const void* TypeId) { OnClassInvalidated(TypeId); };
    // an external engine instance is not supported, node is set up by the v8 backend (PapiV8, WITH_NODEJS)
    check(!InExternalRuntime && !InExternalContext);
    // the classes of reflected types (built from the class definitions of FStructWrapper) must be kept alive while the
    // classes are, and they are named by the backend
    BackendParams.OnClassCreated = [this](const JSClassDefinition* ClassDefinition)
    { return OnReflectedClassCreated(ClassDefinition); };

    check(InBackendFactory);
    Backend = InBackendFactory(BackendParams);
    checkf(Backend, TEXT("the backend factory returned null (the backend is not available on this build)"));
    MainApis = Backend->GetApi();
    checkf(Backend->GetApiVersion() == PESAPI_VERSION, TEXT("papi version mismatch, expect %d, got %d"), PESAPI_VERSION,
        Backend->GetApiVersion());
    MainEnvRef = Backend->CreateEnvRef();

    // the bindings of the host
    {
        FPapiEnvScope EnvScope(MainApis, MainEnvRef);
        struct pesapi_ffi* Apis = MainApis;
        pesapi_env Env = EnvScope.GetEnv();
        // the object mapping of UE types, used by the translators and wrappers (PapiUtils::ObjectMapperOf)
        Apis->set_env_private(Env, static_cast<IObjectMapper*>(this));

        pesapi_value PapiGlobal = Apis->global(Env);
        pesapi_value PapiPuertsObj = Apis->create_object(Env);
        Apis->set_property(Env, PapiGlobal, "puerts", PapiPuertsObj);

        PapiMethodBindingHelper<&FScriptEnvImpl::Log>::Bind(Apis, Env, PapiGlobal, "__tgjsLog", this);

        PapiMethodBindingHelper<&FScriptEnvImpl::LoadModule>::Bind(Apis, Env, PapiPuertsObj, "loadModule", this);

        PapiMethodBindingHelper<&FScriptEnvImpl::LoadUEType>::Bind(Apis, Env, PapiPuertsObj, "loadUEType", this);

        PapiMethodBindingHelper<&FScriptEnvImpl::LoadCppType>::Bind(Apis, Env, PapiPuertsObj, "loadCPPType", this);

        PapiBindFunction(Apis, Env, PapiPuertsObj, "getFNameString", &GetFNameString);

        PapiMethodBindingHelper<&FScriptEnvImpl::UEClassToJSClass>::Bind(Apis, Env, PapiGlobal, "__tgjsUEClassToJSClass", this);

        PapiMethodBindingHelper<&FScriptEnvImpl::NewContainer>::Bind(Apis, Env, PapiGlobal, "__tgjsNewContainer", this);

        PapiMethodBindingHelper<&FScriptEnvImpl::MergeObject>::Bind(Apis, Env, PapiGlobal, "__tgjsMergeObject", this);

        PapiMethodBindingHelper<&FScriptEnvImpl::NewObjectByClass>::Bind(Apis, Env, PapiGlobal, "__tgjsNewObject", this);

        PapiMethodBindingHelper<&FScriptEnvImpl::SetJsTakeRefInTs>::Bind(Apis, Env, PapiGlobal, "__tgjsSetJsTakeRef", this);

        PapiMethodBindingHelper<&FScriptEnvImpl::NewStructByScriptStruct>::Bind(Apis, Env, PapiGlobal, "__tgjsNewStruct", this);

        PapiBindFunction(Apis, Env, PapiGlobal, "__tgjsMakeWeakObjectPtr", &FWeakObjectPtrWrapper::Make);

#if !defined(ENGINE_INDEPENDENT_JSENV)
        PapiMethodBindingHelper<&FScriptEnvImpl::Mixin>::Bind(Apis, Env, PapiGlobal, "__tgjsMixin", this);
#endif

        // the timers are implemented in js (puerts/timer.js) on the tick, as unity
        PapiMethodBindingHelper<&FScriptEnvImpl::RegisterTickHandler>::Bind(
            Apis, Env, PapiGlobal, "__tgjsRegisterTickHandler", this);

        PapiMethodBindingHelper<&FScriptEnvImpl::DumpStatisticsLog>::Bind(Apis, Env, PapiGlobal, "dumpStatisticsLog", this);
        PapiMethodBindingHelper<&FScriptEnvImpl::IsQuickJS>::Bind(Apis, Env, PapiGlobal, "isQuickJS", this);
        PapiBindFunction(Apis, Env, PapiGlobal, "__tgjsFNameToArrayBuffer", &FNameToArrayBuffer);

        PapiBindFunction(Apis, Env, PapiPuertsObj, "toCString", &ToCString);

        PapiBindFunction(Apis, Env, PapiPuertsObj, "toCPtrArray", &ToCPtrArray);

        PapiBindFunction(Apis, Env, PapiPuertsObj, "load", &LoadPesapiDll);

        FString DllExt =
#if PLATFORM_WINDOWS
            TEXT(".dll");
#elif PLATFORM_MAC || PLATFORM_IOS
            TEXT(".dylib");
#else
            TEXT(".so");
#endif
        Apis->set_property(Env, PapiPuertsObj, "dll_ext", PapiUtils::FromFString(Apis, Env, DllExt));

        PapiMethodBindingHelper<&FScriptEnvImpl::ReleaseManualReleaseDelegate>::Bind(
            Apis, Env, PapiPuertsObj, "releaseManualReleaseDelegate", this);

        // the host part of the module system: resolving and loading the source, the rest is done by the backend
        PapiMethodBindingHelper<&FScriptEnvImpl::HostResolveModule>::Bind(Apis, Env, PapiGlobal, "__puer_host_resolve__", this);
        PapiMethodBindingHelper<&FScriptEnvImpl::HostLoadModule>::Bind(Apis, Env, PapiGlobal, "__puer_host_load__", this);

        DynamicInvoker = MakeShared<DynamicInvokerImpl, ESPMode::ThreadSafe>(this);
        MixinInvoker = DynamicInvoker;
    }

    // before the bootstrap scripts, so the inspector sees all the scripts (hot reload looks them up by url)
    Backend->OpenRemoteDebugger(InDebugPort);

    // the js runtime of the backend (module system, promise rejection tracking) and its bootstrap scripts
    Backend->OnEnter(this);

    {
        FPapiEnvScope EnvScope(MainApis, MainEnvRef);
        struct pesapi_ffi* Apis = MainApis;
        pesapi_env Env = EnvScope.GetEnv();
        pesapi_value PapiPuertsObj = Apis->get_property(Env, Apis->global(Env), "puerts");

        RemoveListItem.Reset(Apis, Env, Apis->get_property(Env, PapiPuertsObj, "__removeListItem"));

        GenListApply.Reset(Apis, Env, Apis->get_property(Env, PapiPuertsObj, "__genListApply"));
    }

    DelegateProxiesCheckerHandler =
        FUETicker::GetCoreTicker().AddTicker(FTickerDelegate::CreateRaw(this, &FScriptEnvImpl::CheckDelegateProxies), 1);

    // every frame, calls the tick handlers (the timers of puerts/timer.js)
    TickHandle = FUETicker::GetCoreTicker().AddTicker(FTickerDelegate::CreateRaw(this, &FScriptEnvImpl::Tick), 0);

    UserObjectRetainer.SetName(TEXT("Puerts_UserObjectRetainer"));
    SysObjectRetainer.SetName(TEXT("Puerts_SysObjectRetainer"));

#ifdef SINGLE_THREAD_VERIFY
    BoundThreadId = FPlatformTLS::GetCurrentThreadId();
#endif

#if defined(WITH_WEBSOCKET)
    {
        FPapiEnvScope EnvScope(MainApis, MainEnvRef);
        ScriptClassRegistry* Registry = Backend->GetRegistry();
        InitWebsocketPPWrap(MainApis, EnvScope.GetEnv(), Registry ? Registry : GetDefaultClassRegistry());
    }
    ExecuteModule("puerts/websocketpp.js");
#endif
}

// #lizard forgives
FScriptEnvImpl::~FScriptEnvImpl()
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
    for (auto& KV : ManualReleaseCallbacks)
    {
        if (KV.Value.IsValid(true))
        {
            KV.Value.Get()->ResetJsFunction();
        }
    }
    ManualReleaseCallbacks.Empty();

    FUETicker::GetCoreTicker().RemoveTicker(DelegateProxiesCheckerHandler);
    FUETicker::GetCoreTicker().RemoveTicker(TickHandle);

    {
        FPapiEnvScope EnvScope(MainApis, MainEnvRef);

        TypeToTemplateInfoMap.Empty();

        // value refs must be released while the env is alive (before CppObjectMapper.UnInitialize)
        TickHandlers.Empty();

        for (auto Iter = DelegateMap.begin(); Iter != DelegateMap.end(); Iter++)
        {
            if (Iter->second.Proxy.IsValid(true))
            {
                Iter->second.Proxy->ResetJsFunction();
            }
            Iter->second.JsCallbacks.Reset();
            Iter->second.JSObject.Reset();
        }
        RemoveListItem.Reset();
        GenListApply.Reset();

        for (auto& KV : AutoReleaseCallbacksMap)
        {
            for (auto& Callback : KV.Value)
            {
                if (Callback.IsValid(true))
                {
                    Callback->ResetJsFunction();
                }
            }
        }

        MixinFunctionMap.Empty();

        ObjectKeys.Reset();

        // the wrappers held by native, the UObjects are released by OnUObjectExit when the backend unbinds them
        NativeTakeJsRefObjects.Empty();

        // the js runtime of the backend stops before the env is released
        Backend->OnExit(this);
    }

    // the cleanup that needs the env released (but the isolate alive) is done in OnEnvReleased
    Backend->DestroyEnvRef(MainEnvRef);
    MainEnvRef = nullptr;
    Backend.reset();
    MainApis = nullptr;

    // referenced by the templates, released after the isolate
    ClassesBuilt.clear();
    RetiredClasses.clear();

    GUObjectArray.RemoveUObjectDeleteListener(static_cast<FUObjectArray::FUObjectDeleteListener*>(this));
}

void FScriptEnvImpl::OnEnvReleased()
{
    for (auto Iter = DelegateMap.begin(); Iter != DelegateMap.end(); Iter++)
    {
        if (!Iter->second.PassByPointer)
        {
            delete ((FScriptDelegate*) Iter->first);
        }
    }

    DynamicInvoker.Reset();
    MixinInvoker.Reset();

#if !defined(ENGINE_INDEPENDENT_JSENV)
    for (size_t i = 0; i < MixinClasses.Num(); i++)
    {
        if (MixinClasses[i].IsValid())
        {
            UJSGeneratedClass::Restore(MixinClasses[i].Get());
        }
    }
#endif
}

void FScriptEnvImpl::InitExtensionMethodsMap()
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
#ifdef THREAD_SAFE
    FPapiEnvScope ThreadSafeScope(MainApis, MainEnvRef);
#endif
    // the extension methods are kept by the process wide struct wrappers
    FStructWrapper::InitExtensionMethodsMap();
}

std::unique_ptr<FScriptEnvImpl::ObjectMerger>& FScriptEnvImpl::GetObjectMerger(UStruct* Struct)
{
    if (ObjectMergers.find(Struct) == ObjectMergers.end())
    {
        ObjectMergers[Struct] = std::make_unique<ObjectMerger>(this, Struct);
    }
    return ObjectMergers[Struct];
}

void FScriptEnvImpl::Merge(pesapi_env Env, pesapi_callback_info Info, pesapi_value Src, UStruct* DesType, void* Des)
{
    GetObjectMerger(DesType)->Merge(MainApis, Env, Info, Src, Des);
}

void FScriptEnvImpl::ObjectMerger::Merge(
    struct pesapi_ffi* Apis, pesapi_env Env, pesapi_callback_info Info, pesapi_value JsObject, void* Ptr)
{
    if (auto Class = Cast<UClass>(Struct))
    {
        UObject* Object = reinterpret_cast<UObject*>(Ptr);
        if (!Object->IsValidLowLevel() || UEObjectIsPendingKill(Object) || Object->GetClass() != Class ||
            Apis->get_native_object_ptr(Env, JsObject))
        {
            return;
        }
    }
    // papi has no own property enumeration, Object.keys gives the same keys as v8::Object::GetOwnPropertyNames (own,
    // enumerable, no symbols)
    pesapi_value Keys = Parent->GetCachedJsFunction(Apis, Env, Parent->ObjectKeys, "Object.keys", "puerts/object_keys");
    if (!Keys)
    {
        return;    // the exception propagates to the js caller
    }
    pesapi_value KeysArgs[] = {JsObject};
    Keys = Apis->call_function(Env, Keys, nullptr, 1, KeysArgs);
    if (!Keys)
    {
        return;
    }
    const uint32_t KeysLen = Apis->get_array_length(Env, Keys);
    char StackBuf[128];
    TArray<char> HeapBuf;
    for (uint32_t i = 0; i < KeysLen; ++i)
    {
        pesapi_value Key = Apis->get_property_uint32(Env, Keys, i);
        size_t KeyLen = 0;
        Apis->get_value_string_utf8(Env, Key, nullptr, &KeyLen);
        char* KeyBuf = StackBuf;
        if (KeyLen >= sizeof(StackBuf))
        {
            HeapBuf.SetNumUninitialized(static_cast<int32>(KeyLen) + 1);
            KeyBuf = HeapBuf.GetData();
        }
        Apis->get_value_string_utf8(Env, Key, KeyBuf, &KeyLen);
        KeyBuf[KeyLen] = '\0';

        auto Iter = Fields.find(KeyBuf);
        if (Iter == Fields.end())
        {
            continue;
        }
        pesapi_value Value = Apis->get_property(Env, JsObject, KeyBuf);
        if (!Value)
        {
            continue;
        }
        if (Apis->is_object(Env, Value) && !Apis->get_native_object_ptr(Env, Value))
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
                    ->Merge(Apis, Env, Info, Value, Iter->second->Property->ContainerPtrToValuePtr<void>(Ptr));
            }
            continue;
        }
        if (!Apis->is_undefined(Env, Value))
        {
            Iter->second->JsToUEInContainer(Apis, Env, Info, Value, Ptr, true);
        }
    }
}

void FScriptEnvImpl::MergeObject(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CHECK_ARGS(EArgObject, EArgObject);

    pesapi_env Env = Apis->get_env(Info);
    pesapi_value Des = Apis->get_arg(Info, 0);
    pesapi_value Src = Apis->get_arg(Info, 1);
    // the type id of a reflected object is its wrapper (FScriptStructWrapper or FClassWrapper)
    auto Wrapper = FStructWrapper::FromTypeId(Apis->get_native_object_typeid(Env, Des));
    if (auto Struct = Wrapper ? Cast<UScriptStruct>(Wrapper->GetStruct()) : nullptr)
    {
        PapiUtils::Merge(Apis, Env, Info, Src, Struct, Apis->get_native_object_ptr(Env, Des));
        return;
    }
    if (auto Object = PapiUtils::GetUObject(Apis, Env, Des))
    {
        if (PapiUtils::IsReleasedPtr(Object))
        {
            Apis->throw_by_string(Info, "passing a invalid object");
            return;
        }
        PapiUtils::Merge(Apis, Env, Info, Src, Object->GetClass(), Object);
        return;
    }
    Apis->throw_by_string(Info, "Bad parameters #1, expect a native object.");
}

void FScriptEnvImpl::NewObjectByClass(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    const int ArgsLen = Apis->get_args_len(Info);
    auto IsSet = [&](int Index)
    {
        return ArgsLen > Index && !Apis->is_null(Env, Apis->get_arg(Info, Index)) &&
               !Apis->is_undefined(Env, Apis->get_arg(Info, Index));
    };

    UObject* Outer = GetTransientPackage();
    FName Name = NAME_None;
    EObjectFlags ObjectFlags = RF_NoFlags;

    UClass* Class = nullptr;
    if (UObject* Object = PapiUtils::GetUObject(Apis, Env, Apis->get_arg(Info, 0)))
    {
        if (PapiUtils::IsReleasedPtr(Object))
        {
            Apis->throw_by_string(Info, "passing a invalid object");
            return;
        }
        Class = Cast<UClass>(Object);
    }

    if (Class)
    {
        if (IsSet(1))
        {
            Outer = PapiUtils::GetUObject(Apis, Env, Apis->get_arg(Info, 1));
            if (!Outer || PapiUtils::IsReleasedPtr(Outer))
            {
                Apis->throw_by_string(Info, "passing a invalid object");
                return;
            }
        }
        if (IsSet(2))
        {
            Name = FName(*PapiUtils::ToFString(Apis, Env, Apis->get_arg(Info, 2)));
        }
        if (IsSet(3))
        {
            ObjectFlags = (EObjectFlags) (Apis->get_value_int32(Env, Apis->get_arg(Info, 3)));
        }
        UObject* Object = NewObject<UObject>(Outer, Class, Name, ObjectFlags);

        auto Result = PapiUtils::FindOrAddUObject(Apis, Env, Object->GetClass(), Object);
#if !PUERTS_KEEP_UOBJECT_REFERENCE
        bool NeedJsTakeRef = true;
        if (IsSet(4))
        {
            if (!Apis->get_value_bool(Env, Apis->get_arg(Info, 4)))
            {
                NeedJsTakeRef = false;
            }
        }
        if (NeedJsTakeRef)
        {
            SetJsTakeRef(Env, Object);
        }
#endif
        Apis->add_return(Info, Result);
    }
    else
    {
        Apis->throw_by_string(Info, "invalid argument");
    }
}

void FScriptEnvImpl::NewStructByScriptStruct(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);

    UScriptStruct* ScriptStruct = nullptr;
    if (UObject* Object = PapiUtils::GetUObject(Apis, Env, Apis->get_arg(Info, 0)))
    {
        if (PapiUtils::IsReleasedPtr(Object))
        {
            Apis->throw_by_string(Info, "passing a invalid object");
            return;
        }
        ScriptStruct = Cast<UScriptStruct>(Object);
    }

    if (ScriptStruct)
    {
        void* Ptr = FScriptStructWrapper::Alloc(ScriptStruct);

        Apis->add_return(Info, PapiUtils::FindOrAddStruct(Apis, Env, ScriptStruct, Ptr, false));
    }
    else
    {
        Apis->throw_by_string(Info, "invalid argument");
    }
}

bool FScriptEnvImpl::IdleNotificationDeadline(double DeadlineInSeconds)
{
    return Backend->IdleNotificationDeadline(DeadlineInSeconds);
}

void FScriptEnvImpl::LowMemoryNotification()
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
    Backend->LowMemoryNotification();
}

void FScriptEnvImpl::RequestMinorGarbageCollectionForTesting()
{
    Backend->RequestMinorGarbageCollectionForTesting();
}

void FScriptEnvImpl::RequestFullGarbageCollectionForTesting()
{
    Backend->RequestFullGarbageCollectionForTesting();
}

pesapi_value FScriptEnvImpl::GetCachedJsFunction(
    struct pesapi_ffi* Apis, pesapi_env Env, FPapiValueRef& Cache, const char* Code, const char* Path)
{
    if (Cache)
    {
        return Cache.Get(Env);
    }
    pesapi_value Func = Apis->eval(Env, (const uint8_t*) Code, strlen(Code), Path);
    if (Func)
    {
        Cache.Reset(Apis, Env, Func);
    }
    return Func;
}

FString FScriptEnvImpl::CurrentStackTrace()
{
    return Backend->CurrentStackTrace();
}

void* FScriptEnvImpl::Bind(pesapi_env Env, FClassWrapper* ClassWrapper, UObject* UEObject, pesapi_value JSObject)
{
    // called by FClassWrapper::New, JSObject is the object being constructed, the backend binds UEObject to it after the
    // return (and calls OnUObjectEnter)
    auto Class = static_cast<UClass*>(ClassWrapper->Struct.Get());
    bool Existed;
    if (IsNativeTakeJsRefObject(UEObject, GetTemplateInfoOfType(Env, Class, Existed)))
    {
        NativeTakeJsRefObjects.Emplace(UEObject, FPapiValueRef(MainApis, Env, JSObject));
    }
    return UEObject;
}

bool FScriptEnvImpl::IsNativeTakeJsRefObject(UObject* Obj, const FTemplateInfo* Info)
{
    if (!Info)
    {
        return false;
    }
#if PUERTS_KEEP_UOBJECT_REFERENCE
    return Info->IsNativeTakeJsRef;
#else
    // the flag of the class is only set by mixin
    if (Obj->IsA<UClass>() || Obj->HasAnyFlags(RF_ClassDefaultObject | RF_ArchetypeObject))
    {
        return false;
    }
    return Info->IsNativeTakeJsRef;
#endif
}

void FScriptEnvImpl::OnUObjectEnter(UObject* UEObject)
{
    EnteredUObject = UEObject;
    if (!IsNativeTakeJsRefObject(UEObject, TypeToTemplateInfoMap.Find(UEObject->GetClass())))
    {
        // the wrapper holds the UObject
        UserObjectRetainer.Retain(UEObject);
    }
}

void FScriptEnvImpl::OnUObjectExit(UObject* UEObject)
{
    // UEObject may be being destroyed (UnBind), do not dereference it. Release is a no-op if it is not retained
    UserObjectRetainer.Release(UEObject);
}

void FScriptEnvImpl::SetJsTakeRef(pesapi_env Env, UObject* UEObject)
{
    // a bound object is either retained already or its wrapper is held by native, an unbound one is left alone. Retained
    // before the ref is released: the wrapper may be freed synchronously (quickjs), then OnUObjectExit releases it
    if (NativeTakeJsRefObjects.Contains(UEObject))
    {
        UserObjectRetainer.Retain(UEObject);
        NativeTakeJsRefObjects.Remove(UEObject);
    }
}

void FScriptEnvImpl::UnBind(UObject* UEObject)
{
    // the UObject is destroyed while its wrapper may be still alive: unbind it (any access from js reports an invalid object
    // from now on), OnUObjectExit releases the UObject
    if (!MainEnvRef || !MainApis)
    {
        return;
    }
    FPapiEnvScope EnvScope(MainApis, MainEnvRef);
    if (!EnvScope)
    {
        return;
    }
    MainApis->unbind_native_object(EnvScope.GetEnv(), nullptr, UEObject);
    NativeTakeJsRefObjects.Remove(UEObject);
}

pesapi_value FScriptEnvImpl::FindOrAdd(pesapi_env Env, UClass* Class, UObject* UEObject)
{
    if (!UEObject)
    {
        return MainApis->create_null(Env);
    }

    bool Existed;
    auto TemplateInfoPtr = GetTemplateInfoOfType(Env, UEObject->GetClass(), Existed);
    EnteredUObject = nullptr;
    // the backend returns the cached wrapper, or creates one (not owned by js) and calls OnUObjectEnter
    pesapi_value Result = MainApis->native_object_to_value(Env, TemplateInfoPtr->StructWrapper.get(), UEObject, false);
    if (EnteredUObject == UEObject && IsNativeTakeJsRefObject(UEObject, TemplateInfoPtr))
    {
        NativeTakeJsRefObjects.Emplace(UEObject, FPapiValueRef(MainApis, Env, Result));
    }
    EnteredUObject = nullptr;
    return Result;
}

pesapi_value FScriptEnvImpl::FindOrAddStruct(pesapi_env Env, UScriptStruct* ScriptStruct, void* Ptr, bool PassByPointer)
{
    struct pesapi_ffi* Apis = MainApis;
    if (!Ptr)
    {
        return Apis->create_null(Env);
    }

    // builds the js class of the type in this env (if not yet)
    bool Existed;
    auto TemplateInfoPtr = GetTemplateInfoOfType(Env, ScriptStruct, Existed);
    auto Wrapper = static_cast<FScriptStructWrapper*>(TemplateInfoPtr->StructWrapper.get());
    // the memory of an owned pod struct is freed with the object by the backend (if supported)
    if (!PassByPointer && IsTriviallyFreed(Wrapper))
    {
        if (auto Result = Backend->CreateTriviallyFreedObject(Env, static_cast<FStructWrapper*>(Wrapper), Ptr,
                Wrapper->Struct->GetStructureSize(), &FreeTriviallyFreedStruct, Wrapper))
        {
            return Result;
        }
    }
    // the type id of the object is the wrapper, a borrowed struct is cached, the memory of an owned one is freed by the
    // finalizer of the class definition (FScriptStructWrapper::ReflectedFinalize)
    return Apis->native_object_to_value(Env, static_cast<FStructWrapper*>(Wrapper), Ptr, !PassByPointer);
}

pesapi_value FScriptEnvImpl::FindOrAddDelegate(
    pesapi_env Env, UObject* Owner, PropertyMacro* Property, void* DelegatePtr, bool PassByPointer)
{
    check(DelegatePtr);    // must not null
    struct pesapi_ffi* Apis = MainApis;

    if (PassByPointer)
    {
        auto Iter = DelegateMap.find(DelegatePtr);
        if (Iter != DelegateMap.end())
        {
            if (Iter->second.Owner.IsValid())
            {
                return Iter->second.JSObject.Get(Env);
            }
            else
            {
                ClearDelegate(Env, DelegatePtr);
            }
        }
    }
    else
    {
        if (CastFieldMacro<DelegatePropertyMacro>(Property))
        {
            auto NewDelegatePtr = new FScriptDelegate;
            *NewDelegatePtr = *static_cast<FScriptDelegate*>(DelegatePtr);
            DelegatePtr = NewDelegatePtr;
        }
        else    // do not support MulticastDelegate
        {
            return Apis->create_undefined(Env);
        }
    }

    {
        // UE_LOG(LogTemp, Warning, TEXT("FindOrAddDelegate -- new %s"), *Property->GetName());
        // the delegate is not owned by the wrapper, the wrapper is held by DelegateMap and the delegate (if copied) is deleted
        // when the entry is released
        const void* TypeId =
            Property->IsA<DelegatePropertyMacro>() ? FDelegateWrapper::TypeId() : FMulticastDelegateWrapper::TypeId();
        pesapi_value JSObject = Apis->native_object_to_value(Env, TypeId, DelegatePtr, false);
        UFunction* Function = nullptr;
        DelegatePropertyMacro* DelegateProperty = CastFieldMacro<DelegatePropertyMacro>(Property);
        MulticastDelegatePropertyMacro* MulticastDelegateProperty = CastFieldMacro<MulticastDelegatePropertyMacro>(Property);
        if (DelegateProperty)
        {
            Function = DelegateProperty->SignatureFunction;
        }
        else if (MulticastDelegateProperty)
        {
            Function = MulticastDelegateProperty->SignatureFunction;
        }
        DelegateMap[DelegatePtr] = {FPapiValueRef(Apis, Env, JSObject), TWeakObjectPtr<UObject>(Owner), DelegateProperty,
            MulticastDelegateProperty, Function, PassByPointer, nullptr, FPapiValueRef(Apis, Env, Apis->create_array(Env))};
        return JSObject;
    }
}

pesapi_value FScriptEnvImpl::CreateArray(pesapi_env Env, FPropertyTranslator* Property, void* ArrayPtr)
{
    // a fixed size array is a view of its outer, never cached
    auto Holder = new FContainerHolder{ArrayPtr, FFixSizeArrayWrapper::GetClassDefinition()->TypeId, Property, nullptr,
        Property->Property, nullptr, nullptr, false};
    return MainApis->native_object_to_value(Env, Holder->TypeId, Holder, true);
}

void FScriptEnvImpl::InvokeDelegateCallback(UDynamicDelegateProxy* Proxy, void* Params)
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
#ifdef THREAD_SAFE
    FPapiEnvScope ThreadSafeScope(MainApis, MainEnvRef);
#endif
    auto SignatureFunction = Proxy->SignatureFunction;
    auto Iter = JsCallbackPrototypeMap.find(SignatureFunction.Get());
    if (Iter == JsCallbackPrototypeMap.end())
    {
        if (!SignatureFunction.IsValid())
        {
            Logger->Warn(TEXT("invalid SignatureFunction!"));
            return;
        }
        JsCallbackPrototypeMap[SignatureFunction.Get()] = std::make_unique<FFunctionTranslator>(SignatureFunction.Get(), true);
        Iter = JsCallbackPrototypeMap.find(SignatureFunction.Get());
    }
    else
    {
        if (!SignatureFunction.IsValid())
        {
            JsCallbackPrototypeMap.erase(Iter);
            Logger->Warn(TEXT("invalid SignatureFunction!"));
            return;
        }

        // 非 Editor 模式，函数签名地址可能会变且内存可能复用，不检查可能会访问到旧的非法地址。
        if (!Iter->second->IsValid())
        {
            JsCallbackPrototypeMap[SignatureFunction.Get()] = std::make_unique<FFunctionTranslator>(SignatureFunction.Get(), true);
            Iter = JsCallbackPrototypeMap.find(SignatureFunction.Get());
        }
    }

    if (!Proxy->JsFunction)
    {
        return;
    }

    struct pesapi_ffi* Apis = Proxy->Apis;
    pesapi_env_ref EnvRef = Apis->get_ref_associated_env(Proxy->JsFunction);
    pesapi_scope_memory ScopeMemory;
    pesapi_scope Scope = Apis->open_scope_placement(EnvRef, &ScopeMemory);
    pesapi_env Env = Apis->get_env_from_ref(EnvRef);

    Iter->second->CallJs(Apis, Env, Apis->get_value_from_ref(Env, Proxy->JsFunction), Apis->global(Env), Params);

    if (Apis->has_caught(Scope))
    {
        Logger->Error(FString::Printf(TEXT("js callback exception %s"), UTF8_TO_TCHAR(Apis->get_exception_as_string(Scope, true))));
    }
    Apis->close_scope_placement(Scope);
}

void FScriptEnvImpl::NotifyUObjectDeleted(const class UObjectBase* ObjectBase, int32 Index)
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
#ifdef THREAD_SAFE
    FPapiEnvScope ThreadSafeScope(MainApis, MainEnvRef);
#endif

    TryReleaseType((UStruct*) ObjectBase);

    UnBind((UObject*) ObjectBase);

    MixinFunctionMap.Remove((UFunction*) ObjectBase);
    ContainerMeta.NotifyElementTypeDeleted((UField*) ObjectBase);

    auto CallbacksPtr = AutoReleaseCallbacksMap.Find((UObject*) ObjectBase);
    if (CallbacksPtr)
    {
        for (auto Callback : *CallbacksPtr)
        {
            if (Callback.IsValid())
            {
                Callback.Get()->ResetJsFunction();
            }
            SysObjectRetainer.Release(Callback.Get());
        }
        AutoReleaseCallbacksMap.Remove((UObject*) ObjectBase);
    }
}

void FScriptEnvImpl::TryReleaseType(UStruct* Struct)
{
    TypeToTemplateInfoMap.Remove(Struct);
}

// fix ScriptCore.cpp UObject::SkipFunction crash when Function has no parameters
static void SkipFunction(FFrame& Stack, RESULT_DECL, UFunction* Function)
{
    uint8* Frame = (uint8*) FMemory_Alloca(Function->PropertiesSize);
    FMemory::Memzero(Frame, Function->PropertiesSize);
    for (PropertyMacro* Property = (PropertyMacro*) (
#if ENGINE_MINOR_VERSION >= 25 || ENGINE_MAJOR_VERSION > 4
             Function->ChildProperties
#else
             Function->Children
#endif
         );
         Property && (*Stack.Code != EX_EndFunctionParms); Property = (PropertyMacro*) (Property->Next))
    {
        Stack.MostRecentPropertyAddress = NULL;
        Stack.Step(Stack.Object, (Property->PropertyFlags & CPF_OutParm) ? NULL : Property->ContainerPtrToValuePtr<uint8>(Frame));
    }

    Stack.Code++;

    for (PropertyMacro* Destruct = Function->DestructorLink; Destruct; Destruct = Destruct->DestructorLinkNext)
    {
        if (!Destruct->HasAnyPropertyFlags(CPF_OutParm))
        {
            Destruct->DestroyValue_InContainer(Frame);
        }
    }

    PropertyMacro* ReturnProp = Function->GetReturnProperty();
    if (ReturnProp != NULL)
    {
        ReturnProp->DestroyValue(RESULT_PARAM);
#if ENGINE_MINOR_VERSION >= 5 && ENGINE_MAJOR_VERSION >= 5
        FMemory::Memzero(RESULT_PARAM, ReturnProp->ArrayDim * ReturnProp->GetElementSize());
#else
        FMemory::Memzero(RESULT_PARAM, ReturnProp->ArrayDim * ReturnProp->ElementSize);
#endif
    }
}

#if !defined(ENGINE_INDEPENDENT_JSENV)
void FScriptEnvImpl::InvokeMixinMethod(UObject* ContextObject, UJSGeneratedFunction* Function, FFrame& Stack, void* RESULT_PARAM)
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
    auto JsFuncPtr = MixinFunctionMap.Find(Function);
    if (!JsFuncPtr || !*JsFuncPtr)
    {
        Logger->Error(FString::Printf(TEXT("call %s::%s of %p fail: can not find Binded JavaScript Function"),
            *ContextObject->GetClass()->GetName(), *Function->GetName(), ContextObject));
        SkipFunction(Stack, RESULT_PARAM, Function);
        return;
    }

    struct pesapi_ffi* Apis = MainApis;
    pesapi_env_ref EnvRef = Apis->get_ref_associated_env(JsFuncPtr->GetRef());
    pesapi_scope_memory ScopeMemory;
    pesapi_scope Scope = Apis->open_scope_placement(EnvRef, &ScopeMemory);
    pesapi_env Env = Apis->get_env_from_ref(EnvRef);

    pesapi_value Self = FindOrAdd(Env, ContextObject->GetClass(), ContextObject);

    Function->FunctionTranslator->CallJs(Apis, Env, JsFuncPtr->Get(Env), Self, ContextObject, Stack, RESULT_PARAM);

    if (Apis->has_caught(Scope))
    {
        Logger->Error(FString::Printf(TEXT("call %s::%s of %p fail: %s"), *ContextObject->GetClass()->GetName(),
            *Function->GetName(), ContextObject, UTF8_TO_TCHAR(Apis->get_exception_as_string(Scope, true))));
    }
    Apis->close_scope_placement(Scope);
}
#endif

void FScriptEnvImpl::ExecuteDelegate(pesapi_env Env, pesapi_callback_info Info, void* DelegatePtr)
{
    struct pesapi_ffi* Apis = MainApis;
    auto Iter = DelegateMap.find(DelegatePtr);
    if (Iter == DelegateMap.end())
    {
        Apis->throw_by_string(Info, "can not find the delegate!");
        return;
    }
    if (Iter->second.DelegateProperty && !static_cast<FScriptDelegate*>(DelegatePtr)->IsBound())
    {
        // FScriptDelegate::ProcessDelegate asserts on an unbound (or stale) delegate
        Apis->throw_by_string(Info, "can not execute an unbound delegate!");
        return;
    }
    auto SignatureFunction = Iter->second.SignatureFunction;
    auto& Translator = JsCallbackPrototypeMap[SignatureFunction];
    if (!Translator)
    {
        Translator = std::make_unique<FFunctionTranslator>(SignatureFunction, true);
    }

    if (Iter->second.DelegateProperty)
    {
        Translator->Call(Apis, Info,
            [ScriptDelegate = static_cast<FScriptDelegate*>(DelegatePtr)](void* Params)
            { ScriptDelegate->ProcessDelegate<UObject>(Params); });
    }
    else
    {
        Translator->Call(Apis, Info,
            [MulticastScriptDelegate = static_cast<FMulticastScriptDelegate*>(DelegatePtr)](void* Params)
            {
#if ENGINE_MAJOR_VERSION >= 5 && ENGINE_MINOR_VERSION >= 8
                MulticastScriptDelegate->ProcessDelegate<UObject>(Params);
#else
                MulticastScriptDelegate->ProcessMulticastDelegate<UObject>(Params);
#endif
            });
    }
}

static FName NAME_Fire("Fire");

bool FScriptEnvImpl::AddToDelegate(pesapi_env Env, void* DelegatePtr, pesapi_value JsFunction)
{
    struct pesapi_ffi* Apis = MainApis;
    // UE_LOG(LogTemp, Warning, TEXT("add delegate proxy"));
    auto Iter = DelegateMap.find(DelegatePtr);
    if (Iter == DelegateMap.end())
    {
        return false;
    }
    if (!Iter->second.Owner.IsValid())
    {
        Logger->Warn("try to bind a delegate with invalid owner!");
        ClearDelegate(Env, DelegatePtr);
        if (!Iter->second.PassByPointer)
        {
            delete ((FScriptDelegate*) Iter->first);
        }
        DelegateMap.erase(Iter);
        return false;
    }

    pesapi_value JsCallbacks = Iter->second.JsCallbacks.Get(Env);

    UDynamicDelegateProxy* DelegateProxy = nullptr;
    bool InitApplyFunc = false;
    if (Iter->second.Proxy.IsValid())
    {
        DelegateProxy = Iter->second.Proxy.Get();
        if (Iter->second.DelegateProperty)
        {
            if (!static_cast<FScriptDelegate*>(DelegatePtr)->IsBoundToObject(DelegateProxy))
            {
                InitApplyFunc = true;
            }
        }
        else if (Iter->second.MulticastDelegateProperty)
        {
#if ENGINE_MINOR_VERSION >= 23 || ENGINE_MAJOR_VERSION > 4
            if (Iter->second.MulticastDelegateProperty->IsA<MulticastSparseDelegatePropertyMacro>())
            {
                if (!FSparseDelegateStorage::Contains(
                        Iter->second.Owner.Get(), Iter->second.MulticastDelegateProperty->GetFName(), DelegateProxy, NAME_Fire))
                {
                    InitApplyFunc = true;
                }
            }
            else
            {
#endif
                if (!static_cast<FMulticastScriptDelegate*>(DelegatePtr)->Contains(DelegateProxy, NAME_Fire))
                {
                    InitApplyFunc = true;
                }
            }
        }
        if (InitApplyFunc)
        {
            if (Apis->get_array_length(Env, JsCallbacks) > 0)
            {
                JsCallbacks = Apis->create_array(Env);
                Iter->second.JsCallbacks.Reset(Apis, Env, JsCallbacks);
            }
            else
            {
                InitApplyFunc = false;
            }
        }
    }
    else
    {
        DelegateProxy = NewObject<UDynamicDelegateProxy>();

        DelegateProxy->Owner = Iter->second.Owner;
        DelegateProxy->SignatureFunction = Iter->second.SignatureFunction;
        DelegateProxy->DynamicInvoker = DynamicInvoker;

        InitApplyFunc = true;

        SysObjectRetainer.Retain(DelegateProxy);
        Iter->second.Proxy = DelegateProxy;
    }

    if (InitApplyFunc)
    {
        // __genListApply is a puerts internal function, exceptions (if any) propagate to the js caller
        pesapi_value Args[] = {JsCallbacks};
        pesapi_value Apply = Apis->call_function(Env, GenListApply.Get(Env), nullptr, 1, Args);
        if (!Apply || !Apis->is_function(Env, Apply))
        {
            Logger->Error(TEXT("gen callback apply fail"));
            return false;
        }
        DelegateProxy->SetJsFunction(Apis, Env, Apply);
    }

    bool bSingleDelegate = Iter->second.DelegateProperty != nullptr;
    Apis->set_property_uint32(
        Env, JsCallbacks, bSingleDelegate ? 0 : Apis->get_array_length(Env, JsCallbacks), JsFunction);    // push

    FScriptDelegate Delegate;
    Delegate.BindUFunction(DelegateProxy, NAME_Fire);

    if (Iter->second.DelegateProperty)
    {
        // UE_LOG(LogTemp, Warning, TEXT("bind to delegate"));
        *(static_cast<FScriptDelegate*>(DelegatePtr)) = Delegate;
    }
    else if (Iter->second.MulticastDelegateProperty)
    {
        // UE_LOG(LogTemp, Warning, TEXT("add to multicast delegate, proxy: %p to:%p"), DelegateProxy, DelegatePtr);
#if ENGINE_MINOR_VERSION >= 23 || ENGINE_MAJOR_VERSION > 4
        if (Iter->second.MulticastDelegateProperty->IsA<MulticastSparseDelegatePropertyMacro>())
        {
            Iter->second.MulticastDelegateProperty->AddDelegate(MoveTemp(Delegate), Iter->second.Owner.Get(), DelegatePtr);
        }
        else
#endif
        {
            static_cast<FMulticastScriptDelegate*>(DelegatePtr)->AddUnique(Delegate);
        }
    }
    return true;
}

PropertyMacro* FScriptEnvImpl::FindDelegateProperty(void* DelegatePtr)
{
    auto Iter = DelegateMap.find(DelegatePtr);
    if (Iter == DelegateMap.end())
    {
        return nullptr;
    }
    return Iter->second.DelegateProperty ? (PropertyMacro*) Iter->second.DelegateProperty
                                         : (PropertyMacro*) Iter->second.MulticastDelegateProperty;
}

// the id of a manually released callback in ManualReleaseCallbacks is the private data of the script function (0 if none)
static uint32_t GetManualReleaseId(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value JsFunction)
{
    void* Ptr = nullptr;
    if (!Apis->get_private(Env, JsFunction, &Ptr))
    {
        return 0;
    }
    return static_cast<uint32_t>(reinterpret_cast<uintptr_t>(Ptr));
}

FScriptDelegate FScriptEnvImpl::NewDelegate(pesapi_env Env, UObject* Owner, pesapi_value JsFunction, UFunction* SignatureFunction)
{
    struct pesapi_ffi* Apis = MainApis;
    UDynamicDelegateProxy* DelegateProxy = nullptr;
    if (Owner)
    {
        TArray<TWeakObjectPtr<UDynamicDelegateProxy>>& Callbacks = AutoReleaseCallbacksMap.FindOrAdd(Owner);

        DelegateProxy = NewObject<UDynamicDelegateProxy>();
        DelegateProxy->Owner = Owner;
        DelegateProxy->SignatureFunction = SignatureFunction;
        DelegateProxy->DynamicInvoker = DynamicInvoker;
        DelegateProxy->SetJsFunction(Apis, Env, JsFunction);

        SysObjectRetainer.Retain(DelegateProxy);
        Callbacks.Add(DelegateProxy);
    }
    else
    {
        const uint32_t Id = GetManualReleaseId(Apis, Env, JsFunction);
        TWeakObjectPtr<UDynamicDelegateProxy>* Found = Id ? ManualReleaseCallbacks.Find(Id) : nullptr;

        if (!Found || !Found->IsValid())
        {
            DelegateProxy = NewObject<UDynamicDelegateProxy>();
            DelegateProxy->Owner = DelegateProxy;
            DelegateProxy->SignatureFunction = SignatureFunction;
            DelegateProxy->DynamicInvoker = DynamicInvoker;
            DelegateProxy->SetJsFunction(Apis, Env, JsFunction);

            SysObjectRetainer.Retain(DelegateProxy);

            while (!(++ManualReleaseCallbackId) || ManualReleaseCallbacks.Contains(ManualReleaseCallbackId))    // id > 0 and unused
            {
            }
            ManualReleaseCallbacks.Add(ManualReleaseCallbackId, DelegateProxy);
            Apis->set_private(Env, JsFunction, reinterpret_cast<void*>(static_cast<uintptr_t>(ManualReleaseCallbackId)));
        }
        else
        {
            DelegateProxy = Found->Get();
            if (DelegateProxy->SignatureFunction.Get() != SignatureFunction)
            {
                Logger->Error(TEXT("aleady bind to another delegate pleace release first!"));
                DelegateProxy = nullptr;
            }
        }
    }
    FScriptDelegate Delegate;
    if (DelegateProxy)
    {
        Delegate.BindUFunction(DelegateProxy, NAME_Fire);
    }
    return Delegate;
}

void FScriptEnvImpl::ReleaseManualReleaseDelegate(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CHECK_ARGS(EArgFunction);

    pesapi_env Env = Apis->get_env(Info);
    pesapi_value JsFunction = Apis->get_arg(Info, 0);
    const uint32_t Id = GetManualReleaseId(Apis, Env, JsFunction);
    if (Id)
    {
        Apis->set_private(Env, JsFunction, nullptr);
        TWeakObjectPtr<UDynamicDelegateProxy> DelegateProxy;
        if (ManualReleaseCallbacks.RemoveAndCopyValue(Id, DelegateProxy) && DelegateProxy.IsValid())
        {
            DelegateProxy->ResetJsFunction();
            SysObjectRetainer.Release(DelegateProxy.Get());
        }
    }
}

bool FScriptEnvImpl::RemoveFromDelegate(pesapi_env Env, void* DelegatePtr, pesapi_value JsFunction)
{
    struct pesapi_ffi* Apis = MainApis;
    auto Iter = DelegateMap.find(DelegatePtr);
    if (Iter == DelegateMap.end())
    {
        return false;
    }

    if (!Iter->second.Owner.IsValid())
    {
        Logger->Warn("try to unbind a delegate with invalid owner!");
        ClearDelegate(Env, DelegatePtr);
        if (!Iter->second.PassByPointer)
        {
            delete ((FScriptDelegate*) Iter->first);
        }
        DelegateMap.erase(Iter);
        return false;
    }

    FScriptDelegate Delegate;

    if (Iter->second.DelegateProperty)
    {
        return ClearDelegate(Env, DelegatePtr);
    }
    else if (Iter->second.MulticastDelegateProperty)
    {
        pesapi_value JsCallbacks = Iter->second.JsCallbacks.Get(Env);

        pesapi_value Args[] = {JsCallbacks, JsFunction};

        Apis->call_function(Env, RemoveListItem.Get(Env), nullptr, 2, Args);

        if (Apis->get_array_length(Env, JsCallbacks) == 0 && Iter->second.Proxy.IsValid())
        {
            auto DelegateProxy = Iter->second.Proxy.Get();

            Delegate.BindUFunction(DelegateProxy, NAME_Fire);

#if ENGINE_MINOR_VERSION >= 23 || ENGINE_MAJOR_VERSION > 4
            if (Iter->second.MulticastDelegateProperty->IsA<MulticastSparseDelegatePropertyMacro>())
            {
                Iter->second.MulticastDelegateProperty->RemoveDelegate(Delegate, Iter->second.Owner.Get(), DelegatePtr);
            }
            else
#endif
            {
                static_cast<FMulticastScriptDelegate*>(DelegatePtr)->Remove(Delegate);
            }

            SysObjectRetainer.Release(DelegateProxy);
            DelegateProxy->ResetJsFunction();
            Iter->second.Proxy.Reset();
        }
    }

    return true;
}

bool FScriptEnvImpl::ClearDelegate(pesapi_env Env, void* DelegatePtr)
{
    auto Iter = DelegateMap.find(DelegatePtr);
    if (Iter == DelegateMap.end())
    {
        return false;
    }

    if (Iter->second.DelegateProperty)
    {
        if (Iter->second.Owner.IsValid())
        {
            FScriptDelegate Delegate;
            *(static_cast<FScriptDelegate*>(DelegatePtr)) = Delegate;
        }
    }
    else if (Iter->second.MulticastDelegateProperty)
    {
        if (Iter->second.Owner.IsValid())
        {
#if ENGINE_MINOR_VERSION >= 23 || ENGINE_MAJOR_VERSION > 4
            if (Iter->second.MulticastDelegateProperty->IsA<MulticastSparseDelegatePropertyMacro>())
            {
                Iter->second.MulticastDelegateProperty->ClearDelegate(Iter->second.Owner.Get(), DelegatePtr);
            }
            else
#endif
            {
                static_cast<FMulticastScriptDelegate*>(DelegatePtr)->Clear();
            }
        }
    }
    if (Iter->second.Proxy.IsValid())
    {
        Iter->second.Proxy->ResetJsFunction();
        SysObjectRetainer.Release(Iter->second.Proxy.Get());
        Iter->second.Proxy.Reset();
    }

    Iter->second.JsCallbacks.Reset(MainApis, Env, MainApis->create_array(Env));
    return true;
}

bool FScriptEnvImpl::CheckDelegateProxies(float Tick)
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
    struct pesapi_ffi* Apis = MainApis;
    FPapiEnvScope EnvScope(Apis, MainEnvRef);
    if (!EnvScope)
    {
        return true;
    }

    std::vector<void*> PendingToRemove;
    for (auto& KV : DelegateMap)
    {
        if (!KV.second.Owner.IsValid())
        {
            PendingToRemove.push_back(KV.first);
        }
    }

    if (PendingToRemove.size() > 0)
    {
        pesapi_env Env = EnvScope.GetEnv();
        for (int i = 0; i < PendingToRemove.size(); ++i)
        {
            ClearDelegate(Env, PendingToRemove[i]);
            if (!DelegateMap[PendingToRemove[i]].PassByPointer)
            {
                delete ((FScriptDelegate*) PendingToRemove[i]);
            }
            DelegateMap.erase(PendingToRemove[i]);
        }
    }

    // Collecting invalid function translators to remove.
    std::vector<UFunction*> PendingToRemoveJsCallbacks;
    for (auto& KV : JsCallbackPrototypeMap)
    {
        if ((nullptr == KV.first) || (!KV.second->IsValid()))
        {
            PendingToRemoveJsCallbacks.push_back(KV.first);
        }
    }

    if (PendingToRemoveJsCallbacks.size() > 0)
    {
        for (int32 i = 0; i < PendingToRemoveJsCallbacks.size(); i++)
        {
            JsCallbackPrototypeMap.erase(PendingToRemoveJsCallbacks[i]);
        }
    }

    return true;
}

FPropertyTranslator* FScriptEnvImpl::GetContainerPropertyTranslator(PropertyMacro* Property)
{
    auto Iter = ContainerPropertyMap.find(Property);
    // TODO: 如果脚本一直持有蓝图里头的Map，还是有可能有问题的，需要统筹考虑一套机制解决这类问题
    if (Iter == ContainerPropertyMap.end() || !Iter->second.PropertyWeakPtr.IsValid())
    {
        ContainerPropertyInfo Temp{Property, FPropertyTranslator::Create(Property)};
        ContainerPropertyMap[Property] = std::move(Temp);
#if ENGINE_MINOR_VERSION < 25 && ENGINE_MAJOR_VERSION < 5
        if (!Property->IsNative())
        {
            SysObjectRetainer.Retain(Property);
        }
#endif
        return ContainerPropertyMap[Property].PropertyTranslator.get();
    }
    else
    {
        return Iter->second.PropertyTranslator.get();
    }
}

pesapi_value FScriptEnvImpl::FindOrAddContainer(pesapi_env Env, const JSClassDefinition* ClassDefinition, void* Ptr,
    PropertyMacro* KeyProperty, PropertyMacro* ValueProperty, bool PassByPointer)
{
    check(Ptr);    // must not null
    struct pesapi_ffi* Apis = MainApis;

    auto Existed = ContainerHolders.Find(Ptr);
    if (Existed)
    {
        auto Holder = *Existed;
        if (Holder->TypeId == ClassDefinition->TypeId && Holder->InnerProperty == KeyProperty &&
            Holder->ValueProperty == ValueProperty)
        {
            return Apis->native_object_to_value(Env, Holder->TypeId, Holder, false);
        }
        Holder->Cache = nullptr;    // replaced
    }

    auto Holder = new FContainerHolder{Ptr, ClassDefinition->TypeId, GetContainerPropertyTranslator(KeyProperty),
        ValueProperty ? GetContainerPropertyTranslator(ValueProperty) : nullptr, KeyProperty, ValueProperty, &ContainerHolders,
        !PassByPointer};
    ContainerHolders.Add(Ptr, Holder);
    return Apis->native_object_to_value(Env, Holder->TypeId, Holder, true);
}

bool FScriptEnvImpl::IsTriviallyFreed(FScriptStructWrapper* Wrapper)
{
    UScriptStruct* Struct = Wrapper->Struct.IsValid() ? Cast<UScriptStruct>(Wrapper->Struct.Get()) : nullptr;
    return Struct && (Struct->StructFlags & EStructFlags::STRUCT_IsPlainOldData);
}

// the deleter of a pod struct whose memory is freed with its js object (may be called on a gc thread of the backend, safe
// for pod), FScriptStructWrapper is process wide (see FStructWrapper::FindOrAdd), it outlives the env
void FScriptEnvImpl::FreeTriviallyFreedStruct(void* Ptr, size_t Size, void* DeleterData)
{
    FScriptStructWrapper* StructInfo = static_cast<FScriptStructWrapper*>(DeleterData);
    FScriptStructWrapper::Free(StructInfo->Struct, StructInfo->ExternalFinalize, Ptr);
}

bool FScriptEnvImpl::TryBindOwnedStruct(pesapi_callback_info Info, FScriptStructWrapper* Wrapper, void* Ptr)
{
    // not cached, the type id is the wrapper
    return IsTriviallyFreed(Wrapper) && Backend->BindTriviallyFreedObject(Info, static_cast<FStructWrapper*>(Wrapper), Ptr,
                                            Wrapper->Struct->GetStructureSize(), &FreeTriviallyFreedStruct, Wrapper);
}

std::shared_ptr<FStructWrapper> FScriptEnvImpl::GetStructWrapper(UStruct* InStruct)
{
    return FStructWrapper::FindOrAdd(InStruct);
}

FScriptEnvImpl::FTemplateInfo* FScriptEnvImpl::GetTemplateInfoOfType(pesapi_env Env, UStruct* InStruct, bool& Existed)
{
    auto TemplateInfoPtr = TypeToTemplateInfoMap.Find(InStruct);
    if (!TemplateInfoPtr)
    {
        FTemplateInfo TemplateInfo;

        // the super type first, so that (when classes are not reused) it is rebuilt before the class of InStruct inherits it
        if (auto SuperStruct = InStruct->GetSuperStruct())
        {
            bool Dummy;
            auto SuperTemplateInfo = GetTemplateInfoOfType(Env, SuperStruct, Dummy);
            if (InStruct->IsA<UClass>() && SuperTemplateInfo->IsNativeTakeJsRef)
            {
                TemplateInfo.IsNativeTakeJsRef = true;
            }
        }

        auto StructWrapper = GetStructWrapper(InStruct);
#if !PUERTS_REUSE_STRUCTWRAPPER_FUNCTIONTEMPLATE
        // the template info was released (TryReleaseType), rebuild the js class
        if (ClassesBuilt.find(StructWrapper.get()) != ClassesBuilt.end())
        {
            MainApis->invalidate_class(Env, StructWrapper.get());
        }
#endif
        // the definition is shared by envs, the first use of a type in this env refreshes the translators
        auto ClassDefinition = StructWrapper->GetClassDefinition(InStruct, true);
        // cached by type id (the wrapper), a new UStruct with the same full name keeps the js class of this env unless
        // PUERTS_REUSE_STRUCTWRAPPER_FUNCTIONTEMPLATE is 0
        pesapi_value JsClass = MainApis->create_class(Env, StructWrapper.get());

        TemplateInfo.StructWrapper = StructWrapper;
        // the class may be built from a previous definition (kept by this env)
        auto Built = ClassesBuilt.find(StructWrapper.get());
        TemplateInfo.ClassDefinition = ensure(Built != ClassesBuilt.end()) ? &Built->second->Definition : ClassDefinition;

        if (auto ScriptStruct = Cast<UScriptStruct>(InStruct))
        {
            if (!ScriptStruct->IsNative())    //非原生的结构体，可能在实例没有的时候会释放
            {
                SysObjectRetainer.Retain(ScriptStruct);
            }
        }

        if (!InStruct->GetSuperStruct())
        {
            InstallFNameFixing(Env, JsClass);
        }

        Existed = false;
        return &TypeToTemplateInfoMap.Add(InStruct, MoveTemp(TemplateInfo));
    }
    else
    {
        Existed = true;
        return TemplateInfoPtr;
    }
}

// a script name may differ from the FName only in case (FName is case insensitive), the backend fixes the name by FName when a
// member is not found (a js Proxy at the end of the prototype chain)
void FScriptEnvImpl::InstallFNameFixing(pesapi_env Env, pesapi_value Class)
{
    Backend->InstallNameFixing(Env, Class, &FixFNameCase);
}

pesapi_value FScriptEnvImpl::GetJsClass(pesapi_env Env, UStruct* InStruct)
{
    bool Existed;
    auto TemplateInfo = GetTemplateInfoOfType(Env, InStruct, Existed);
    return MainApis->create_class(Env, TemplateInfo->StructWrapper.get());
}

bool FScriptEnvImpl::IsInstanceOf(pesapi_env Env, UStruct* Struct, pesapi_value JsObject)
{
    struct pesapi_ffi* Apis = MainApis;
    if (Cast<UScriptStruct>(Struct))
    {
        // the type id of a struct object is its wrapper
        auto Wrapper = FStructWrapper::FromTypeId(Apis->get_native_object_typeid(Env, JsObject));
        UStruct* ObjectStruct = Wrapper ? Wrapper->GetStruct() : nullptr;
        return ObjectStruct && ObjectStruct->IsChildOf(Struct);
    }
    else
    {
        UObject* Object = PapiUtils::GetUObject(Apis, Env, JsObject);
        if (!Object || Object == RELEASED_UOBJECT)
        {
            return false;
        }
        return Object->GetClass()->IsChildOf(Struct);
    }
}

void FScriptEnvImpl::OnClassInvalidated(const void* TypeId)
{
    // the UE side caches of the type (keyed by UStruct) are dropped too, so the next use goes through the registry
    for (auto Iter = TypeToTemplateInfoMap.CreateIterator(); Iter; ++Iter)
    {
        if (Iter->Value.StructWrapper.get() == TypeId)
        {
            Iter.RemoveCurrent();
        }
    }
    auto Built = ClassesBuilt.find(TypeId);
    if (Built != ClassesBuilt.end())
    {
        // the old template (and js class) is still alive
        RetiredClasses.push_back(std::move(Built->second));
        ClassesBuilt.erase(Built);
    }
}

bool FScriptEnvImpl::OnReflectedClassCreated(const JSClassDefinition* ClassDefinition)
{
    // only reflected classes are named (as before), the rest keep an empty constructor.name
    if (ClassDefinition->Initialize != &FStructWrapper::ReflectedConstruct)
    {
        return false;
    }
    // the type id of a reflected class is its wrapper, and the class is always built from the current definition
    auto& Current = static_cast<const FStructWrapper*>(ClassDefinition->TypeId)->GetCurrentClass();
    if (ensure(Current && &Current->Definition == ClassDefinition))
    {
        auto& Holder = ClassesBuilt[ClassDefinition->TypeId];
        if (Holder && Holder != Current)
        {
            RetiredClasses.push_back(std::move(Holder));
        }
        Holder = Current;
    }
    return true;
}

// the name -> value and value -> name entries of an enum like object (a number key is the same as its string form in js)
static void SetEnumEntry(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Object, const FString& Name, int64 Value)
{
    FTCHARToUTF8 NameUtf8(*Name);
    Apis->set_property(Env, Object, NameUtf8.Get(), Apis->create_double(Env, static_cast<double>(Value)));
    FTCHARToUTF8 ValueUtf8(*FString::Printf(TEXT("%lld"), static_cast<long long>(Value)));
    Apis->set_property(Env, Object, ValueUtf8.Get(), Apis->create_string_utf8(Env, NameUtf8.Get(), NameUtf8.Length()));
}

pesapi_value FScriptEnvImpl::UETypeToJsClass(pesapi_env Env, UField* Type)
{
    struct pesapi_ffi* Apis = MainApis;
    if (const auto Struct = Cast<UStruct>(Type))
    {
        return GetJsClass(Env, Struct);
    }

    if (const auto Enum = Cast<UEnum>(Type))
    {
        pesapi_value Result = Apis->create_object(Env);
        for (int i = 0; i < Enum->NumEnums(); ++i)
        {
#if !defined(ENGINE_INDEPENDENT_JSENV)
            auto Name = Enum->IsA<UUserDefinedEnum>() ?
#if ENGINE_MINOR_VERSION >= 23 || ENGINE_MAJOR_VERSION > 4
                                                      Enum->GetAuthoredNameStringByIndex(i)
#else
                                                      Enum->GetDisplayNameTextByIndex(i).ToString()
#endif
                                                      : Enum->GetNameStringByIndex(i);
#else
            auto Name = Enum->GetNameStringByIndex(i);
#endif
            SetEnumEntry(Apis, Env, Result, Name, Enum->GetValueByIndex(i));
        }
        Apis->set_property(Env, Result, "__puerts_ufield", FindOrAdd(Env, Enum->GetClass(), Enum));
#if !defined(ENGINE_INDEPENDENT_JSENV)
        if (Enum == StaticEnum<EObjectTypeQuery>())
        {
            UCollisionProfile* CollisionProfile = UCollisionProfile::Get();
            int32 ContainerIndex = 0;
            while (true)
            {
                FName ChannelName = CollisionProfile->ReturnChannelNameFromContainerIndex(ContainerIndex);
                if (ChannelName == NAME_None)
                {
                    break;
                }
                auto ObjectType = CollisionProfile->ConvertToObjectType((ECollisionChannel) ContainerIndex);
                if (ObjectType != EObjectTypeQuery::ObjectTypeQuery_MAX)
                {
                    SetEnumEntry(Apis, Env, Result, ChannelName.ToString(), ObjectType);
                }
                ContainerIndex++;
            }
        }
        else if (Enum == StaticEnum<ETraceTypeQuery>())
        {
            UCollisionProfile* CollisionProfile = UCollisionProfile::Get();
            int32 ContainerIndex = 0;
            while (true)
            {
                FName ChannelName = CollisionProfile->ReturnChannelNameFromContainerIndex(ContainerIndex);
                if (ChannelName == NAME_None)
                {
                    break;
                }
                auto TraceType = CollisionProfile->ConvertToTraceType((ECollisionChannel) ContainerIndex);
                if (TraceType != ETraceTypeQuery::TraceTypeQuery_MAX)
                {
                    SetEnumEntry(Apis, Env, Result, ChannelName.ToString(), TraceType);
                }
                ContainerIndex++;
            }
        }
#endif
        return Result;
    }

    return Apis->create_undefined(Env);
}

void FScriptEnvImpl::LoadUEType(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CHECK_ARGS(EArgString);

    pesapi_env Env = Apis->get_env(Info);
    const FString TypeName = PapiUtils::ToFString(Apis, Env, Apis->get_arg(Info, 0));

    UField* Type = FindAnyType<UClass>(TypeName);

    if (!Type)
    {
        Type = FindAnyType<UScriptStruct>(TypeName);
    }

    if (!Type)
    {
        Type = FindAnyType<UEnum>(TypeName);
    }

    if (!Type)
    {
        Type = LoadObject<UClass>(nullptr, *TypeName);
    }

    if (!Type)
    {
        Type = LoadObject<UScriptStruct>(nullptr, *TypeName);
    }

    if (!Type)
    {
        Type = LoadObject<UEnum>(nullptr, *TypeName);
    }

    if (Type && !Type->IsNative())
    {
        Apis->throw_by_string(
            Info, TCHAR_TO_UTF8(*FString::Printf(
                      TEXT("%s is blueprint type, load it using UE.Class.Load('path/to/your/blueprint/file')."), *TypeName)));
        return;
    }

    pesapi_value Result = UETypeToJsClass(Env, Type);

    if (Apis->is_undefined(Env, Result))
    {
        Apis->throw_by_string(Info, TCHAR_TO_UTF8(*FString::Printf(TEXT("can not find type:%s"), *TypeName)));
    }
    else
    {
        Apis->add_return(Info, Result);
    }
}

void FScriptEnvImpl::LoadCppType(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CHECK_ARGS(EArgString);

    pesapi_env Env = Apis->get_env(Info);
    const FString TypeName = PapiUtils::ToFString(Apis, Env, Apis->get_arg(Info, 0));

    ScriptClassRegistry* Registry = Backend->GetRegistry();
    if (!Registry)
    {
        Registry = GetDefaultClassRegistry();
    }
    auto ClassDef = FindCppTypeClassByName(Registry, PString(TCHAR_TO_UTF8(*TypeName)));
    pesapi_value Result = ClassDef ? Apis->create_class(Env, ClassDef->TypeId) : nullptr;
    if (Result)
    {
        Apis->add_return(Info, Result);
    }
    else
    {
        Apis->throw_by_string(Info, TCHAR_TO_UTF8(*FString::Printf(TEXT("can not find type: %s"), *TypeName)));
    }
}

void FScriptEnvImpl::UEClassToJSClass(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CHECK_ARGS(EArgObject);

    pesapi_env Env = Apis->get_env(Info);
    UField* Type = nullptr;
    if (UObject* Object = PapiUtils::GetUObject(Apis, Env, Apis->get_arg(Info, 0)))
    {
        if (PapiUtils::IsReleasedPtr(Object))
        {
            Apis->throw_by_string(Info, "passing a invalid object");
            return;
        }
        Type = Cast<UField>(Object);
    }

    if (Type)
    {
        Apis->add_return(Info, UETypeToJsClass(Env, Type));
    }
    else
    {
        Apis->throw_by_string(Info, "argument #0 expect a UField");
    }
}

void FScriptEnvImpl::SetJsTakeRefInTs(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CHECK_ARGS(EArgObject);

    pesapi_env Env = Apis->get_env(Info);
    UObject* Object = PapiUtils::GetUObject(Apis, Env, Apis->get_arg(Info, 0));
    if (!Object || PapiUtils::IsReleasedPtr(Object))
    {
        Apis->throw_by_string(Info, "passing a invalid object");
        return;
    }

    SetJsTakeRef(Env, Object);
}

bool FScriptEnvImpl::GetContainerTypeProperty(
    struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, PropertyMacro** PropertyPtr)
{
    if (Apis->is_int32(Env, Value))
    {
        int Type = Apis->get_value_int32(Env, Value);
        if (Type < 0 || Type >= MaxBuiltinType)
        {
            *PropertyPtr = nullptr;
            return false;
        }
        *PropertyPtr = ContainerMeta.GetBuiltinProperty((BuiltinType) Type);
        return true;
    }
    else if (auto Field = Cast<UField>(PapiUtils::GetUObject(Apis, Env, Value)))
    {
        *PropertyPtr = ContainerMeta.GetObjectProperty(Field);
        return *PropertyPtr != nullptr;
    }
    else
    {
        *PropertyPtr = nullptr;
        return false;
    }
}

void FScriptEnvImpl::NewContainer(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CHECK_ARGS(EArgInt32);

    pesapi_env Env = Apis->get_env(Info);
    int ContainerType = Apis->get_value_int32(Env, Apis->get_arg(Info, 0));

    PropertyMacro* Property1 = nullptr;
    PropertyMacro* Property2 = nullptr;

    if (!GetContainerTypeProperty(Apis, Env, Apis->get_arg(Info, 1), &Property1))
    {
        Apis->throw_by_string(Info, TCHAR_TO_UTF8(*FString::Printf(TEXT("can not get first type for %d"), ContainerType)));
        return;
    }

    switch (ContainerType)
    {
        case 0:    // Array
        {
            auto ScriptArray = reinterpret_cast<FScriptArray*>(new FScriptArrayEx(Property1));
            Apis->add_return(Info, PapiUtils::FindOrAddContainer(Apis, Env, Property1, ScriptArray, false));
            break;
        }
        case 1:    // Set
        {
            auto ScriptSet = reinterpret_cast<FScriptSet*>(new FScriptSetEx(Property1));
            Apis->add_return(Info, PapiUtils::FindOrAddContainer(Apis, Env, Property1, ScriptSet, false));
            break;
        }
        case 2:    // Map
        {
            if (!GetContainerTypeProperty(Apis, Env, Apis->get_arg(Info, 2), &Property2))
            {
                Apis->throw_by_string(Info, TCHAR_TO_UTF8(*FString::Printf(TEXT("can not get second type for %d"), ContainerType)));
                return;
            }
            auto ScriptMap = reinterpret_cast<FScriptMap*>(new FScriptMapEx(Property1, Property2));
            Apis->add_return(Info, PapiUtils::FindOrAddContainer(Apis, Env, Property1, Property2, ScriptMap, false));
            break;
        }
        default:
            Apis->throw_by_string(Info, TCHAR_TO_UTF8(*FString::Printf(TEXT("invalid container type %d"), ContainerType)));
    }
}

void FScriptEnvImpl::Start(const FString& ModuleNameOrScript, const TArray<TPair<FString, UObject*>>& Arguments)
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
    if (Started)
    {
        Logger->Error("Started yet!");
        return;
    }

    struct pesapi_ffi* Apis = MainApis;
    // the scope also catches the exception thrown by require
    FPapiEnvScope EnvScope(Apis, MainEnvRef);
    if (!EnvScope)
    {
        Logger->Error("the env is gone!");
        return;
    }
    pesapi_env Env = EnvScope.GetEnv();

    pesapi_value TGJS = Apis->get_property(Env, Apis->global(Env), "puerts");
    if (!Apis->is_object(Env, TGJS))
    {
        Logger->Error("global.puerts not found!");
        return;
    }

    pesapi_value Argv = Apis->get_property(Env, TGJS, "argv");
    if (!Apis->is_object(Env, Argv))
    {
        Logger->Error("global.puerts.argv not found!");
        return;
    }

    pesapi_value ArgvAdd = Apis->get_property(Env, Argv, "add");
    if (!Apis->is_function(Env, ArgvAdd))
    {
        Logger->Error("global.puerts.argv.add not found!");
        return;
    }

    for (int i = 0; i < Arguments.Num(); i++)
    {
        auto Object = Arguments[i].Value;
        pesapi_value Args[2] = {PapiUtils::FromFString(Apis, Env, Arguments[i].Key),
            PapiUtils::FindOrAddUObject(Apis, Env, Object->GetClass(), Object)};
        Apis->call_function(Env, ArgvAdd, Argv, 2, Args);
    }

    RequireModule(Apis, Env, ModuleNameOrScript);
    if (EnvScope.HasCaught())
    {
        Logger->Error(UTF8_TO_TCHAR(EnvScope.GetExceptionAsString()));
    }
    Started = true;
}

bool FScriptEnvImpl::LoadFile(const FString& RequiringDir, const FString& ModuleName, FString& OutPath, FString& OutDebugPath,
    TArray<uint8>& Data, FString& ErrInfo)
{
    if (ModuleLoader->Search(RequiringDir, ModuleName, OutPath, OutDebugPath))
    {
        if (!ModuleLoader->Load(OutPath, Data))
        {
            ErrInfo = FString::Printf(TEXT("can not load [%s]"), *ModuleName);
            return false;
        }
    }
    else
    {
        ErrInfo = FString::Printf(TEXT("can not find [%s]"), *ModuleName);
        return false;
    }
    return true;
}

void FScriptEnvImpl::ExecuteModule(const FString& ModuleName)
{
    FString OutPath;
    FString DebugPath;
    TArray<uint8> Data;

    FString ErrInfo;
    if (!LoadFile(TEXT(""), ModuleName, OutPath, DebugPath, Data, ErrInfo))
    {
        Logger->Error(ErrInfo);
        return;
    }

    struct pesapi_ffi* Apis = MainApis;
    FPapiEnvScope EnvScope(Apis, MainEnvRef);
    if (!EnvScope)
    {
        return;
    }
    pesapi_env Env = EnvScope.GetEnv();
    if (OutPath.EndsWith(".mjs"))
    {
        // an esm is evaluated by the module loader of the backend
        if (!Backend->ExecuteModule(Env, TCHAR_TO_UTF8(*ModuleName), "", true) || EnvScope.HasCaught())
        {
            Logger->Error(EnvScope.HasCaught() ? FString(UTF8_TO_TCHAR(EnvScope.GetExceptionAsString()))
                                               : FString::Printf(TEXT("execute module [%s] fail"), *ModuleName));
        }
        return;
    }
    // the bootstrap scripts (puerts/*.js) are classic scripts, their top-level declarations (`var global`) are globals
#if PLATFORM_WINDOWS
    // 修改URL分隔符格式，否则无法匹配Inspector协议在打断点时发送的正则表达式，导致断点失败
    FString FormattedScriptUrl = DebugPath.Replace(TEXT("/"), TEXT("\\"));
#else
    FString FormattedScriptUrl = DebugPath;
#endif
    PapiUtils::EvalFileContent(Apis, Env, Data, TCHAR_TO_UTF8(*FormattedScriptUrl));
    if (EnvScope.HasCaught())
    {
        Logger->Error(UTF8_TO_TCHAR(EnvScope.GetExceptionAsString()));
    }
}

pesapi_value FScriptEnvImpl::RequireModule(struct pesapi_ffi* Apis, pesapi_env Env, const FString& ModuleName)
{
    return Backend->ExecuteModule(Env, TCHAR_TO_UTF8(*ModuleName), "", false);
}

void FScriptEnvImpl::Log(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CHECK_ARGS(EArgInt32, EArgString);

    pesapi_env Env = Apis->get_env(Info);
    auto Level = Apis->get_value_int32(Env, Apis->get_arg(Info, 0));

    FString Msg = PapiUtils::ToFString(Apis, Env, Apis->get_arg(Info, 1));
    switch (Level)
    {
        case 1:
            Logger->Info(Msg);
            break;
        case 2:
            Logger->Warn(Msg);
            break;
        case 3:
            Logger->Error(Msg);
            break;
        default:
            Logger->Log(Msg);
            break;
    }
}

void FScriptEnvImpl::LoadModule(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CHECK_ARGS(EArgString);

    pesapi_env Env = Apis->get_env(Info);
    FString Path = PapiUtils::ToFString(Apis, Env, Apis->get_arg(Info, 0));
    TArray<uint8> Data;
    if (!ModuleLoader->Load(Path, Data))
    {
        Apis->throw_by_string(Info, "can not load module");
        return;
    }
#if defined(WITH_V8_BYTECODE)
    if (Path.EndsWith(TEXT(".cbc")) || Path.EndsWith(TEXT(".mbc")))
    {
        Apis->add_return(Info, Apis->create_binary_by_value(Env, Data.GetData(), Data.Num()));
    }
    else
#endif
    {
        Apis->add_return(Info, PapiUtils::FromFileContent(Apis, Env, Data));
    }
}

// the kind of a module by its extension, a .js is an esm when imported and a cjs when required
static const TCHAR* ModuleKindOfPath(const FString& Path, bool ByRequire)
{
    if (Path.EndsWith(TEXT(".mjs")) || Path.EndsWith(TEXT(".mbc")))
    {
        return TEXT("esm");
    }
    if (Path.EndsWith(TEXT(".cjs")) || Path.EndsWith(TEXT(".cbc")))
    {
        return TEXT("cjs");
    }
    if (Path.EndsWith(TEXT(".json")))
    {
        return TEXT("json");
    }
    return ByRequire ? TEXT("cjs") : TEXT("esm");
}

// __puer_host_resolve__(specifier, referrer, by): the url (path) of the module, or the name of a builtin module
void FScriptEnvImpl::HostResolveModule(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CHECK_ARGS(EArgString, EArgString, EArgString);

    pesapi_env Env = Apis->get_env(Info);
    FString Specifier = PapiUtils::ToFString(Apis, Env, Apis->get_arg(Info, 0));
    FString Referrer = PapiUtils::ToFString(Apis, Env, Apis->get_arg(Info, 1));
    bool ByRequire = PapiUtils::ToFString(Apis, Env, Apis->get_arg(Info, 2)) == TEXT("require");
    if (ByRequire && Specifier.StartsWith(TEXT("./")))
    {
        Specifier = Specifier.Mid(2);
    }

    // addons are registered as builtin modules on their first use
    if (Backend->LoadAddon(Env, TCHAR_TO_UTF8(*Specifier)))
    {
        Apis->add_return(Info, PapiUtils::FromFString(Apis, Env, Specifier));
        return;
    }

    FString Dir = FPaths::GetPath(Referrer);
    FString Path;
    FString DebugPath;
    if (!ModuleLoader->Search(Dir, Specifier, Path, DebugPath))
    {
        FString Message = ByRequire ? FString::Printf(TEXT("can not find %s in %s"), *Specifier, *Dir)
                                    : FString::Printf(TEXT("can not resolve [%s], import by [%s]"), *Specifier, *Referrer);
        Apis->throw_by_string(Info, TCHAR_TO_UTF8(*Message));
        return;
    }

    if (Path.EndsWith(TEXT("package.json")))
    {
        TArray<uint8> Data;
        if (!ModuleLoader->Load(Path, Data))
        {
            Apis->throw_by_string(Info, TCHAR_TO_UTF8(*FString::Printf(TEXT("can not load [%s]"), *Path)));
            return;
        }
        FString Text;
        FFileHelper::BufferToString(Text, Data.GetData(), Data.Num());
        TSharedPtr<FJsonObject> Package;
        auto Reader = TJsonReaderFactory<>::Create(Text);
        if (!FJsonSerializer::Deserialize(Reader, Package) || !Package.IsValid())
        {
            Apis->throw_by_string(Info, TCHAR_TO_UTF8(*FString::Printf(TEXT("invalid package.json: %s"), *Path)));
            return;
        }
        FString Type;
        Package->TryGetStringField(TEXT("type"), Type);
        bool IsModule = Type == TEXT("module");
        FString Entry;
        Package->TryGetStringField(TEXT("main"), Entry);
        if (Entry.IsEmpty())
        {
            Entry = TEXT("index.js");
        }
        if (ByRequire && IsModule)
        {
            // the esm package required: exports["."] must have an entry for require
            Entry.Empty();
            const TSharedPtr<FJsonObject>* Exports = nullptr;
            const TSharedPtr<FJsonObject>* Dot = nullptr;
            if (Package->TryGetObjectField(TEXT("exports"), Exports) && (*Exports)->TryGetObjectField(TEXT("."), Dot))
            {
                const TSharedPtr<FJsonObject>* Sub = nullptr;
                if (!((*Dot)->TryGetObjectField(TEXT("default"), Sub) && (*Sub)->TryGetStringField(TEXT("require"), Entry)) &&
                    !((*Dot)->TryGetObjectField(TEXT("require"), Sub) && (*Sub)->TryGetStringField(TEXT("default"), Entry)))
                {
                    (*Dot)->TryGetStringField(TEXT("require"), Entry);
                }
            }
            if (Entry.IsEmpty())
            {
                Apis->throw_by_string(Info, "can not require a esm in cjs module!");
                return;
            }
        }
        FString PackageDir = FPaths::GetPath(Path);
        FString EntryPath;
        FString EntryDebugPath;
        if (!ModuleLoader->Search(PackageDir, Entry, EntryPath, EntryDebugPath))
        {
            Apis->throw_by_string(Info, TCHAR_TO_UTF8(*FString::Printf(TEXT("can not find %s in %s"), *Entry, *PackageDir)));
            return;
        }
        // an esm package required is loaded as esm, a cjs package imported is loaded by the rules of require
        const TCHAR* ForcedKind =
            ByRequire ? (IsModule ? TEXT("esm") : nullptr) : (IsModule ? nullptr : ModuleKindOfPath(EntryPath, true));
        if (ForcedKind)
        {
            ForcedModuleKinds.Add((ByRequire ? TEXT("r") : TEXT("i")) + EntryPath, ForcedKind);
        }
        Path = EntryPath;
        DebugPath = EntryDebugPath;
    }

    ModuleDebugPaths.Add(Path, DebugPath);
    Apis->add_return(Info, PapiUtils::FromFString(Apis, Env, Path));
}

// __puer_host_load__(url, by): {kind, content, debugPath}
void FScriptEnvImpl::HostLoadModule(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CHECK_ARGS(EArgString, EArgString);

    pesapi_env Env = Apis->get_env(Info);
    FString Url = PapiUtils::ToFString(Apis, Env, Apis->get_arg(Info, 0));
    bool ByRequire = PapiUtils::ToFString(Apis, Env, Apis->get_arg(Info, 1)) == TEXT("require");
    TArray<uint8> Data;
    if (!ModuleLoader->Load(Url, Data))
    {
        Apis->throw_by_string(Info, TCHAR_TO_UTF8(*FString::Printf(TEXT("can not load [%s]"), *Url)));
        return;
    }

    const FString* Forced = ForcedModuleKinds.Find((ByRequire ? TEXT("r") : TEXT("i")) + Url);
    FString Kind = Forced ? *Forced : FString(ModuleKindOfPath(Url, ByRequire));

    FString DebugPath = ModuleDebugPaths.FindRef(Url);
    if (DebugPath.IsEmpty() || DebugPath.StartsWith(TEXT("Pak: ")))
    {
        DebugPath = Url;
    }
#if PLATFORM_WINDOWS
    // the inspector matches the urls of breakpoints with backslashes
    DebugPath = DebugPath.Replace(TEXT("/"), TEXT("\\"));
#endif

    pesapi_value Content;
    if (Url.EndsWith(TEXT(".mbc")) || Url.EndsWith(TEXT(".cbc")))
    {
        Content = Apis->create_binary_by_value(Env, Data.GetData(), Data.Num());
    }
    else
    {
        Content = PapiUtils::FromFileContent(Apis, Env, Data);
    }

    pesapi_value Result = Apis->create_object(Env);
    Apis->set_property(Env, Result, "kind", PapiUtils::FromFString(Apis, Env, Kind));
    Apis->set_property(Env, Result, "content", Content);
    Apis->set_property(Env, Result, "debugPath", PapiUtils::FromFString(Apis, Env, DebugPath));
    Apis->add_return(Info, Result);
}

void FScriptEnvImpl::RegisterTickHandler(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CHECK_ARGS(EArgFunction);

    TickHandlers.Emplace(Apis, Apis->get_env(Info), Apis->get_arg(Info, 0));
}

bool FScriptEnvImpl::Tick(float DeltaTime)
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
    // a handler may register another one, it runs from the next frame
    const int32 Num = TickHandlers.Num();
    for (int32 i = 0; i < Num; ++i)
    {
        // a scope for each handler: locks the isolate (THREAD_SAFE), enters the context and catches the exception of it
        FPapiEnvScope EnvScope(MainApis, MainEnvRef);
        if (!EnvScope)
        {
            break;
        }
        struct pesapi_ffi* Apis = MainApis;
        pesapi_env Env = EnvScope.GetEnv();
        Apis->call_function(Env, TickHandlers[i].Get(Env), Apis->global(Env), 0, nullptr);
        if (EnvScope.HasCaught())
        {
            Logger->Error(FString::Printf(TEXT("Exception in Tick Handler: %s"), UTF8_TO_TCHAR(EnvScope.GetExceptionAsString())));
        }
    }
    return true;
}

void FScriptEnvImpl::IsQuickJS(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    Apis->add_return(Info, Apis->create_boolean(Apis->get_env(Info), Backend->IsQuickJS()));
}

#if !defined(ENGINE_INDEPENDENT_JSENV)
void FScriptEnvImpl::Mixin(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CHECK_ARGS(EArgObject, EArgObject);

    pesapi_env Env = Apis->get_env(Info);

    UClass* To = nullptr;
    if (UObject* Object = PapiUtils::GetUObject(Apis, Env, Apis->get_arg(Info, 0)))
    {
        if (PapiUtils::IsReleasedPtr(Object))
        {
            Apis->throw_by_string(Info, "passing a invalid object");
            return;
        }
        To = Cast<UClass>(Object);
    }

    if (!To)
    {
        Apis->throw_by_string(Info, "#0 parameter expect a Blueprint UClass");
        return;
    }

    auto BoolArg = [Apis, Env, Info](int Index)
    {
        pesapi_value Arg = Apis->get_arg(Info, Index);
        return Apis->is_boolean(Env, Arg) && Apis->get_value_bool(Env, Arg);
    };

    // release
    if (BoolArg(5))
    {
        MixinClasses.Remove(To);
        UJSGeneratedClass::Restore(To);
        return;
    }

    if (MixinClasses.Contains(To))
    {
        Apis->throw_by_string(Info, "had mixin");
        return;
    }

    pesapi_value MixinMethods = Apis->get_arg(Info, 1);

    bool TakeJsObjectRef = BoolArg(2);

    bool Inherit = BoolArg(3);

    bool NoWarning = BoolArg(4);

    UClass* New = To;

    if (Inherit)
    {
        New = NewObject<UClass>(To->GetOuter(), To->GetClass(),
            MakeUniqueObjectName(To->GetOuter(), To->GetClass(), *(To->GetName() + TEXT("_MixinGen_"))));
        New->PropertyLink = To->PropertyLink;
        New->ClassWithin = To->ClassWithin;
        New->ClassConfigName = To->ClassConfigName;
        New->ClassFlags = To->ClassFlags;
        New->ClassCastFlags = To->ClassCastFlags;
        New->ClassConstructor = To->ClassConstructor;
        New->ClassFlags = New->ClassFlags | EClassFlags::CLASS_Transient;
        New->ClassFlags = New->ClassFlags & (~EClassFlags::CLASS_Intrinsic);
        New->SetFlags(EObjectFlags::RF_Transient);
        New->SetSuperStruct(To);
    }

    // papi has no own property enumeration, use Object.getOwnPropertyNames (mixin is not a hot path)
    static const char GetNamesCode[] = "Object.getOwnPropertyNames";
    pesapi_value GetNames = Apis->eval(Env, (const uint8_t*) GetNamesCode, sizeof(GetNamesCode) - 1, "puerts/mixin_names");
    pesapi_value GetNamesArgs[] = {MixinMethods};
    pesapi_value Keys = GetNames ? Apis->call_function(Env, GetNames, nullptr, 1, GetNamesArgs) : nullptr;
    if (!Keys)
    {
        return;    // the exception propagates to the js caller
    }
    TArray<FName> ReplaceMethodNames;
    const uint32_t KeysLen = Apis->get_array_length(Env, Keys);
    TArray<char> KeyBuf;
    for (uint32_t i = 0; i < KeysLen; ++i)
    {
        pesapi_value Key = Apis->get_property_uint32(Env, Keys, i);
        size_t KeyLen = 0;
        Apis->get_value_string_utf8(Env, Key, nullptr, &KeyLen);
        KeyBuf.SetNumUninitialized(static_cast<int32>(KeyLen) + 1);
        Apis->get_value_string_utf8(Env, Key, KeyBuf.GetData(), &KeyLen);
        KeyBuf[static_cast<int32>(KeyLen)] = '\0';
        FName MethodName = UTF8_TO_TCHAR(KeyBuf.GetData());
        auto Function = To->FindFunctionByName(MethodName);
        if (Function)
        {
            pesapi_value JsFunc = Apis->get_property(Env, MixinMethods, KeyBuf.GetData());
            auto MixinedFunc = UJSGeneratedClass::Mixin(New, Function, MixinInvoker, TakeJsObjectRef, !NoWarning);
            MixinFunctionMap.Emplace(MixinedFunc, FPapiValueRef(Apis, Env, JsFunc));
            ReplaceMethodNames.Add(MethodName);
        }
    }

    if (Inherit)
    {
        New->Bind();
        New->StaticLink(true);

        auto CDO = New->GetDefaultObject();
        if (auto WidgetClass = Cast<UWidgetBlueprintGeneratedClass>(New))
        {
            WidgetClass->UpdateCustomPropertyListForPostConstruction();
        }
        else if (auto BPClass = Cast<UBlueprintGeneratedClass>(New))
        {
            BPClass->UpdateCustomPropertyListForPostConstruction();
        }

        if (CDO->IsA<AActor>())
        {
            if (UBlueprintGeneratedClass* BPGClass = Cast<UBlueprintGeneratedClass>(New))
            {
                BPGClass->bCooked = true;
            }
        }

#if ENGINE_MAJOR_VERSION == 4 && ENGINE_MINOR_VERSION > 12
        // 拷贝创建的Class需要手动重新创建ReferenceTokenStream
        New->AssembleReferenceTokenStream(true);
#endif
    }
    else
    {
        To->ClearFunctionMapsCaches();
        auto StructWrapper = GetStructWrapper(To);
        for (int i = 0; i < ReplaceMethodNames.Num(); i++)
        {
            StructWrapper->RefreshMethod(To->FindFunctionByName(ReplaceMethodNames[i]));
        }
    }
    MixinClasses.Add(New);

    bool Existed = false;
    GetTemplateInfoOfType(Env, New, Existed)->IsNativeTakeJsRef = TakeJsObjectRef;
    for (auto& KV : TypeToTemplateInfoMap)
    {
        if (New != KV.Key && KV.Key->IsChildOf(New))
        {
            KV.Value.IsNativeTakeJsRef = TakeJsObjectRef;
        }
    }
    Apis->add_return(Info, FindOrAdd(Env, New->GetClass(), New));
}
#endif

void FScriptEnvImpl::DumpStatisticsLog(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    Logger->Info(Backend->GetStatisticsLog());
}

}    // namespace PUERTS_NAMESPACE

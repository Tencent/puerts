/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "ScriptEnvImpl.h"
#include "Binding.hpp"
#include "UEDataBinding.hpp"
#include "DynamicDelegateProxy.h"
#include "Misc/Paths.h"
#include "StructWrapper.h"
#include "PapiUtils.h"
#include "PapiHostFunctions.h"
#include "DelegateWrapper.h"
#include "ContainerWrapper.h"
#include "SoftObjectWrapper.h"
#include "WeakObjectPtrWrapper.h"
#include "ObjectMapper.h"
#include "JSLogger.h"
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

// the type of the global scriptEnv of the scripts
UsingNamedCppType(PUERTS_NAMESPACE::FScriptEnvImpl, PuertsScriptEnv);

namespace PUERTS_NAMESPACE
{
void LoadPesapiDll(struct pesapi_ffi* Apis, pesapi_callback_info Info);

// a statically bound function whose arguments are checked first, with the same messages as the other methods of scriptEnv
// (MakeFunction does not check them)
template <typename F, F Func, ArgType... TypesExpect>
static void CheckedFunction(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    if (PapiUtils::CheckArguments(Apis, Info, {TypesExpect...}))
    {
        FuncCallWrapper<PUERTS_BINDING_API, F, Func, false>::call(Apis, Info);
    }
}

template <FScriptEnvImpl::PapiMethodCallback Method>
void FScriptEnvImpl::PapiMethod(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    if (Apis->get_native_holder_typeid(Info) != StaticTypeId<FScriptEnvImpl>::get())
    {
        Apis->throw_by_string(Info, "the receiver is not scriptEnv");
        return;
    }
    (static_cast<FScriptEnvImpl*>(Apis->get_native_holder_ptr(Info))->*Method)(Apis, Info);
}

void FScriptEnvImpl::RegisterScriptEnvClass()
{
    static bool Registered = false;
    if (Registered)
    {
        return;
    }
    Registered = true;
    DefineClass<FScriptEnvImpl>()
        .Method("log", MakeFunction(&FScriptEnvImpl::Log))
        .Method("loadModule", &PapiMethod<&FScriptEnvImpl::LoadModule>, nullptr)
        .Method("loadUEType", &PapiMethod<&FScriptEnvImpl::LoadUEType>, nullptr)
        .Method("loadCPPType", &PapiMethod<&FScriptEnvImpl::LoadCppType>, nullptr)
        .Method("ueClassToJSClass", &PapiMethod<&FScriptEnvImpl::UEClassToJSClass>, nullptr)
        .Method("newObject", &PapiMethod<&FScriptEnvImpl::NewObjectByClass>, nullptr)
        .Method("setJsTakeRef", &PapiMethod<&FScriptEnvImpl::SetJsTakeRefInTs>, nullptr)
        // setNativeTakeJsRef(cls, isNativeTakeJsRef): whether the wrappers of the objects of cls and its subclasses are held by
        // native (the mixin of puerts/mixin.js sets it by objectTakeByNative)
        .Method("setNativeTakeJsRef", &PapiMethod<&FScriptEnvImpl::SetNativeTakeJsRefInTs>, nullptr)
        // the timers are implemented in js (puerts/timer.js) on the tick, as unity
        .Method("registerTickHandler", &PapiMethod<&FScriptEnvImpl::RegisterTickHandler>, nullptr)
        .Method("releaseManualReleaseDelegate", &PapiMethod<&FScriptEnvImpl::ReleaseManualReleaseDelegate>, nullptr)
        // reads a script file by the file loader of the env (the module systems of lua / python)
        .Method("loadFile", &PapiMethod<&FScriptEnvImpl::LoadFileMethod>, nullptr)
        .Method("dumpStatisticsLog", MakeFunction(&FScriptEnvImpl::DumpStatisticsLog))
        .Method("isQuickJS", MakeFunction(&FScriptEnvImpl::IsQuickJS))
        // the host functions not using the env (PapiHostFunctions.h), bound as the methods of scriptEnv as well
        // the names of getFNameString may be symbols (the proxies of uelazyload.js), not checked as before
        .Method("getFNameString", MakeFunction(&PapiHostFunctions::GetFNameString))
        .Method("fnameToArrayBuffer", MakeFunction(&PapiHostFunctions::FNameToArrayBuffer))
        .Method("toCString", &CheckedFunction<decltype(&PapiHostFunctions::ToCString), &PapiHostFunctions::ToCString, EArgString>,
            nullptr)
        // these return a dynamically typed value (or throw by their own messages), so they handle the callback info
        .Method("toCPtrArray", &PapiHostFunctions::ToCPtrArray, nullptr)
        .Method("newStruct", &FScriptStructWrapper::NewByScriptStruct, nullptr)
        .Method("makeWeakObjectPtr", &FWeakObjectPtrWrapper::Make, nullptr)
        .Method("newContainer", &NewContainer, nullptr)
        .Method("load", &LoadPesapiDll, nullptr)
        // the env is owned by the host
        .Register(nullptr);
}

FScriptEnvImpl::FScriptEnvImpl(FPapiBackendFactory InBackendFactory, const FString& ScriptRoot)
    : FScriptEnvImpl(std::move(InBackendFactory), std::make_shared<FDefaultScriptFileLoader>(ScriptRoot),
          std::make_shared<FDefaultLogger>(), -1, FString(), nullptr, nullptr)
{
}

FScriptEnvImpl::FScriptEnvImpl(FPapiBackendFactory InBackendFactory, std::shared_ptr<IScriptFileLoader> InFileLoader,
    std::shared_ptr<ILogger> InLogger, int InDebugPort, const FString InFlags, void* InExternalRuntime, void* InExternalContext)
{
    GUObjectArray.AddUObjectDeleteListener(static_cast<FUObjectArray::FUObjectDeleteListener*>(this));

    Started = false;

    FileLoader = InFileLoader ? std::move(InFileLoader) : std::make_shared<FDefaultScriptFileLoader>();
    Logger = InLogger;

    // the backend of the env, created by the factory given by the caller (see PapiBackend.h), the host only uses the papi
    // table it provides (MainApis)
    FPapiBackendParams BackendParams;
    BackendParams.Logger = Logger;
    BackendParams.Flags = InFlags;
    BackendParams.OnEnvReleased = [this]() { OnEnvReleased(); };
    // the module systems of the backend read the files by the file loader of the env
    BackendParams.LoadFile = [this](pesapi_env Env, const char* Path, PString& OutDebugPath) -> pesapi_value
    {
        FString DebugPath;
        pesapi_value Content = LoadFileContent(MainApis, Env, UTF8_TO_TCHAR(Path), DebugPath);
        if (Content)
        {
            FTCHARToUTF8 DebugPathUtf8(*DebugPath);
            OutDebugPath = PString(DebugPathUtf8.Get(), DebugPathUtf8.Length());
        }
        return Content;
    };
    // an external engine instance is not supported, node is set up by the v8 backend (PapiV8, WITH_NODEJS)
    check(!InExternalRuntime && !InExternalContext);
    // the classes of reflected types are defined in the default registry on first load (process wide, idempotent)
    GetPesapiRegistryApi()->on_class_not_found(nullptr, &FStructWrapper::OnClassNotFound);

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

        // the methods of the env called by the scripts, the env is not owned by the script
        RegisterScriptEnvClass();
        Apis->set_property(
            Env, PapiGlobal, "scriptEnv", Apis->native_object_to_value(Env, StaticTypeId<FScriptEnvImpl>::get(), this, false));

        FString DllExt =
#if PLATFORM_WINDOWS
            TEXT(".dll");
#elif PLATFORM_MAC || PLATFORM_IOS
            TEXT(".dylib");
#else
            TEXT(".so");
#endif
        Apis->set_property(Env, PapiPuertsObj, "dll_ext", PapiDataTransfer::FromFString(Apis, Env, DllExt));

        DynamicInvoker = MakeShared<DynamicInvokerImpl, ESPMode::ThreadSafe>(this);
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

        // a script name may differ from the FName only in case (FName is case insensitive), the backend fixes the name by
        // FName when a member is not found (a js Proxy at the end of the prototype chain of the virtual root class)
        Backend->InstallNameFixing(Env, Apis->create_class(Env, FStructWrapper::RootTypeId()), &PapiHostFunctions::FixFNameCase);
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

        for (auto& Extension : Extensions)
        {
            Extension->OnEnvExit();
        }

        // the wrappers held by native, moved out first (a wrapper may be freed synchronously while the refs are released)
        {
            TMap<UObject*, FPapiValueRef> Released = MoveTemp(NativeTakeJsRefObjects);
            NativeTakeJsRefObjects.Empty();
        }

        // the js runtime of the backend stops before the env is released
        Backend->OnExit(this);
    }

    // the cleanup that needs the env released (but the isolate alive) is done in OnEnvReleased
    Backend->DestroyEnvRef(MainEnvRef);
    MainEnvRef = nullptr;
    Backend.reset();
    MainApis = nullptr;

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

    for (auto& Extension : Extensions)
    {
        Extension->OnEnvReleased();
    }
}

void FScriptEnvImpl::AddExtension(std::unique_ptr<IScriptEnvExtension> Extension)
{
    check(Extension && !FindExtension(Extension->GetExtensionName()));
    Extensions.push_back(std::move(Extension));
}

IScriptEnvExtension* FScriptEnvImpl::FindExtension(FName Name) const
{
    for (auto& Extension : Extensions)
    {
        if (Extension->GetExtensionName() == Name)
        {
            return Extension.get();
        }
    }
    return nullptr;
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
    if (UObject* Object = PapiDataTransfer::GetUObjectOfValue(Apis, Env, Apis->get_arg(Info, 0)))
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
            Outer = PapiDataTransfer::GetUObjectOfValue(Apis, Env, Apis->get_arg(Info, 1));
            if (!Outer || PapiUtils::IsReleasedPtr(Outer))
            {
                Apis->throw_by_string(Info, "passing a invalid object");
                return;
            }
        }
        if (IsSet(2))
        {
            Name = FName(*PapiDataTransfer::ToFString(Apis, Env, Apis->get_arg(Info, 2)));
        }
        if (IsSet(3))
        {
            ObjectFlags = (EObjectFlags) (Apis->get_value_int32(Env, Apis->get_arg(Info, 3)));
        }
        UObject* Object = NewObject<UObject>(Outer, Class, Name, ObjectFlags);

        auto Result = PapiDataTransfer::FindOrAddObject(Apis, Env, Object->GetClass(), Object);
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

FString FScriptEnvImpl::CurrentStackTrace()
{
    return Backend->CurrentStackTrace();
}

bool FScriptEnvImpl::IsNativeTakeJsRefObject(UObject* Obj) const
{
#if PUERTS_KEEP_UOBJECT_REFERENCE
    bool Result = false;
#else
    bool Result = true;
#endif
    if (NativeTakeJsRefClasses.Num() > 0)
    {
        for (UClass* Class = Obj->GetClass(); Class; Class = Class->GetSuperClass())
        {
            if (auto Found = NativeTakeJsRefClasses.Find(Class))
            {
                Result = *Found;
                break;
            }
        }
    }
#if !PUERTS_KEEP_UOBJECT_REFERENCE
    if (Result && (Obj->IsA<UClass>() || Obj->HasAnyFlags(RF_ClassDefaultObject | RF_ArchetypeObject)))
    {
        return false;
    }
#endif
    return Result;
}

void* FScriptEnvImpl::OnUObjectEnter(pesapi_env Env, pesapi_value JSObject, UObject* UEObject)
{
    if (IsNativeTakeJsRefObject(UEObject))
    {
        // native holds the wrapper until SetJsTakeRef
        NativeTakeJsRefObjects.FindOrAdd(UEObject).Reset(MainApis, Env, JSObject);
    }
    else
    {
        // the wrapper holds the UObject
        UserObjectRetainer.Retain(UEObject);
    }
    return nullptr;
}

void FScriptEnvImpl::OnUObjectExit(UObject* UEObject, void* UserData)
{
    // UEObject may be being destroyed (UnBind), it is only used as a key. A native take js ref object is not retained, the
    // release is a no-op then
    UserObjectRetainer.Release(UEObject);
}

void FScriptEnvImpl::SetJsTakeRef(pesapi_env Env, UObject* UEObject)
{
    // a wrapper held by native: the UObject is retained before the ref is released, the wrapper may be freed synchronously
    // (quickjs) and OnUObjectExit releases the UObject then
    if (auto Wrapper = NativeTakeJsRefObjects.Find(UEObject))
    {
        UserObjectRetainer.Retain(UEObject);
        FPapiValueRef Removed = MoveTemp(*Wrapper);
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
    if (auto Wrapper = NativeTakeJsRefObjects.Find(UEObject))
    {
        FPapiValueRef Removed = MoveTemp(*Wrapper);
        NativeTakeJsRefObjects.Remove(UEObject);
    }
}

pesapi_value FScriptEnvImpl::FindOrAdd(pesapi_env Env, UClass* Class, UObject* UEObject)
{
    if (!UEObject)
    {
        return MainApis->create_null(Env);
    }

    bool Existed;
    auto TemplateInfoPtr = GetTemplateInfoOfType(Env, UEObject->GetClass(), Existed);
    // the backend returns the cached wrapper, or creates one (not owned by js) and calls OnUObjectEnter
    return MainApis->native_object_to_value(Env, TemplateInfoPtr->StructWrapper.get(), UEObject, false);
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
    if (!PassByPointer && Wrapper->IsTriviallyFreed())
    {
        if (auto Result = Backend->CreateTriviallyFreedObject(Env, static_cast<FStructWrapper*>(Wrapper), Ptr,
                Wrapper->Struct->GetStructureSize(), &FScriptStructWrapper::FreeTriviallyFreed, Wrapper))
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

    for (auto& Extension : Extensions)
    {
        Extension->NotifyUObjectDeleted(ObjectBase);
    }
    FContainerMeta::Get().NotifyElementTypeDeleted((UField*) ObjectBase);

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
    NativeTakeJsRefClasses.Remove(static_cast<UClass*>(Struct));
}

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

bool FScriptEnvImpl::TryBindOwnedStruct(pesapi_callback_info Info, FScriptStructWrapper* Wrapper, void* Ptr)
{
    // not cached, the type id is the wrapper
    return Wrapper->IsTriviallyFreed() &&
           Backend->BindTriviallyFreedObject(Info, static_cast<FStructWrapper*>(Wrapper), Ptr, Wrapper->Struct->GetStructureSize(),
               &FScriptStructWrapper::FreeTriviallyFreed, Wrapper);
}

FScriptEnvImpl::FTemplateInfo* FScriptEnvImpl::GetTemplateInfoOfType(pesapi_env Env, UStruct* InStruct, bool& Existed)
{
    auto TemplateInfoPtr = TypeToTemplateInfoMap.Find(InStruct);
    if (!TemplateInfoPtr)
    {
        FTemplateInfo TemplateInfo;

        // the super type first
        if (auto SuperStruct = InStruct->GetSuperStruct())
        {
            bool Dummy;
            GetTemplateInfoOfType(Env, SuperStruct, Dummy);
        }

        auto StructWrapper = FStructWrapper::FindOrAdd(InStruct);
        // the definition is shared by envs, the first use of a type in this env refreshes the translators (UE4 has no
        // reinstancing notification, so this is where a recompiled type is noticed)
        StructWrapper->Define(InStruct, true);
        // cached by type id (the wrapper), a new UStruct with the same full name keeps the js class of this env
        MainApis->create_class(Env, StructWrapper.get());

        // a non native struct (user defined) may be collected while its objects are alive, the env holds it (as 2.0)
        if (auto ScriptStruct = Cast<UScriptStruct>(InStruct))
        {
            if (!ScriptStruct->IsNative())
            {
                SysObjectRetainer.Retain(ScriptStruct);
            }
        }

        TemplateInfo.StructWrapper = StructWrapper;

        Existed = false;
        return &TypeToTemplateInfoMap.Add(InStruct, MoveTemp(TemplateInfo));
    }
    else
    {
        Existed = true;
        return TemplateInfoPtr;
    }
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
        UObject* Object = PapiDataTransfer::GetUObjectOfValue(Apis, Env, JsObject);
        if (!Object || Object == RELEASED_UOBJECT)
        {
            return false;
        }
        return Object->GetClass()->IsChildOf(Struct);
    }
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
    const FString TypeName = PapiDataTransfer::ToFString(Apis, Env, Apis->get_arg(Info, 0));

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
    const FString TypeName = PapiDataTransfer::ToFString(Apis, Env, Apis->get_arg(Info, 0));

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
    if (UObject* Object = PapiDataTransfer::GetUObjectOfValue(Apis, Env, Apis->get_arg(Info, 0)))
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
    UObject* Object = PapiDataTransfer::GetUObjectOfValue(Apis, Env, Apis->get_arg(Info, 0));
    if (!Object || PapiUtils::IsReleasedPtr(Object))
    {
        Apis->throw_by_string(Info, "passing a invalid object");
        return;
    }

    SetJsTakeRef(Env, Object);
}

void FScriptEnvImpl::SetNativeTakeJsRef(UClass* Class, bool IsNativeTakeJsRef)
{
    // the nearest entry of the class chain wins, the subclasses set before follow this one
    for (auto It = NativeTakeJsRefClasses.CreateIterator(); It; ++It)
    {
        if (It.Key() != Class && It.Key()->IsChildOf(Class))
        {
            It.RemoveCurrent();
        }
    }
    NativeTakeJsRefClasses.Add(Class, IsNativeTakeJsRef);
}

void FScriptEnvImpl::SetNativeTakeJsRefInTs(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CHECK_ARGS(EArgObject);

    pesapi_env Env = Apis->get_env(Info);
    UClass* Class = nullptr;
    if (UObject* Object = PapiDataTransfer::GetUObjectOfValue(Apis, Env, Apis->get_arg(Info, 0)))
    {
        if (PapiUtils::IsReleasedPtr(Object))
        {
            Apis->throw_by_string(Info, "passing a invalid object");
            return;
        }
        Class = Cast<UClass>(Object);
    }
    if (!Class)
    {
        Apis->throw_by_string(Info, "#0 parameter expect a UClass");
        return;
    }

    pesapi_value Arg = Apis->get_arg(Info, 1);
    SetNativeTakeJsRef(Class, Apis->is_boolean(Env, Arg) && Apis->get_value_bool(Env, Arg));
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
        pesapi_value Args[2] = {PapiDataTransfer::FromFString(Apis, Env, Arguments[i].Key),
            PapiDataTransfer::FindOrAddObject(Apis, Env, Object->GetClass(), Object)};
        Apis->call_function(Env, ArgvAdd, Argv, 2, Args);
    }

    RequireModule(Apis, Env, ModuleNameOrScript);
    if (EnvScope.HasCaught())
    {
        Logger->Error(UTF8_TO_TCHAR(EnvScope.GetExceptionAsString()));
    }
    Started = true;
}

bool FScriptEnvImpl::ReadScriptFile(const FString& Path, FString& OutPath, TArray<uint8>& OutData, FString& OutDebugPath)
{
    OutPath = Path;
    if (FileLoader->ReadFile(Path, OutData, OutDebugPath))
    {
        return true;
    }
#if defined(WITH_V8_BYTECODE)
    // the source may be stripped in the release build, the bytecode of it is loaded instead
    if (Path.EndsWith(TEXT(".js")) || Path.EndsWith(TEXT(".mjs")))
    {
        OutPath = FPaths::ChangeExtension(Path, Path.EndsWith(TEXT(".js")) ? TEXT("cbc") : TEXT("mbc"));
        OutData.Reset();
        OutDebugPath.Empty();
        if (FileLoader->ReadFile(OutPath, OutData, OutDebugPath))
        {
            return true;
        }
    }
#endif
    OutPath = Path;
    return false;
}

pesapi_value FScriptEnvImpl::LoadFileContent(struct pesapi_ffi* Apis, pesapi_env Env, const FString& Path, FString& OutDebugPath)
{
    FString FilePath;
    TArray<uint8> Data;
    if (!ReadScriptFile(Path, FilePath, Data, OutDebugPath))
    {
        return nullptr;
    }
    if (OutDebugPath.IsEmpty() || OutDebugPath.StartsWith(TEXT("Pak: ")))
    {
        OutDebugPath = FilePath;
    }
#if PLATFORM_WINDOWS
    // the inspector matches the urls of breakpoints with backslashes
    OutDebugPath = OutDebugPath.Replace(TEXT("/"), TEXT("\\"));
#endif
    if (FilePath.EndsWith(TEXT(".mbc")) || FilePath.EndsWith(TEXT(".cbc")))
    {
        return Apis->create_binary_by_value(Env, Data.GetData(), Data.Num());
    }
    return PapiUtils::FromFileContent(Apis, Env, Data);
}

void FScriptEnvImpl::ExecuteModule(const FString& ModuleName)
{
    if (ModuleName.EndsWith(TEXT(".mjs")))
    {
        // an esm is evaluated by the module loader of the backend
        struct pesapi_ffi* Apis = MainApis;
        FPapiEnvScope EnvScope(Apis, MainEnvRef);
        if (!EnvScope)
        {
            return;
        }
        pesapi_env Env = EnvScope.GetEnv();
        if (!Backend->ExecuteModule(Env, TCHAR_TO_UTF8(*ModuleName), "", true) || EnvScope.HasCaught())
        {
            Logger->Error(EnvScope.HasCaught() ? FString(UTF8_TO_TCHAR(EnvScope.GetExceptionAsString()))
                                               : FString::Printf(TEXT("execute module [%s] fail"), *ModuleName));
        }
        return;
    }

    FString OutPath;
    FString DebugPath;
    TArray<uint8> Data;
    if (!ReadScriptFile(ModuleName, OutPath, Data, DebugPath))
    {
        Logger->Error(FString::Printf(TEXT("can not load [%s]"), *ModuleName));
        return;
    }
    if (DebugPath.IsEmpty() || DebugPath.StartsWith(TEXT("Pak: ")))
    {
        DebugPath = OutPath;
    }

    struct pesapi_ffi* Apis = MainApis;
    FPapiEnvScope EnvScope(Apis, MainEnvRef);
    if (!EnvScope)
    {
        return;
    }
    pesapi_env Env = EnvScope.GetEnv();
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

void FScriptEnvImpl::Log(int32 Level, const FString& Msg)
{
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

// puerts.loadModule(path): the content of the file of the path (relative to the script root), a string, or an ArrayBuffer for
// the bytecode
void FScriptEnvImpl::LoadModule(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CHECK_ARGS(EArgString);

    pesapi_env Env = Apis->get_env(Info);
    FString Path = PapiDataTransfer::ToFString(Apis, Env, Apis->get_arg(Info, 0));
    FString DebugPath;
    pesapi_value Content = LoadFileContent(Apis, Env, Path, DebugPath);
    if (!Content)
    {
        Apis->throw_by_string(Info, "can not load module");
        return;
    }
    Apis->add_return(Info, Content);
}

void FScriptEnvImpl::LoadFileMethod(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CHECK_ARGS(EArgString);

    pesapi_env Env = Apis->get_env(Info);
    FString Path = PapiDataTransfer::ToFString(Apis, Env, Apis->get_arg(Info, 0));
    FString DebugPath;
    pesapi_value Content = LoadFileContent(Apis, Env, Path, DebugPath);
    if (!Content)
    {
        return;
    }
    pesapi_value Result = Apis->create_object(Env);
    Apis->set_property(Env, Result, "content", Content);
    Apis->set_property(Env, Result, "debugPath", PapiDataTransfer::FromFString(Apis, Env, DebugPath));
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

bool FScriptEnvImpl::IsQuickJS() const
{
    return Backend->IsQuickJS();
}

void FScriptEnvImpl::DumpStatisticsLog() const
{
    Logger->Info(Backend->GetStatisticsLog());
}

}    // namespace PUERTS_NAMESPACE

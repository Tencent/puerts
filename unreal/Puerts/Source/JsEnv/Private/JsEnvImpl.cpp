/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "JsEnvImpl.h"
#include "JsEnvModule.h"
#include "DynamicDelegateProxy.h"
#include "Misc/FileHelper.h"
#include "Dom/JsonObject.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "Misc/Paths.h"
#include "StructWrapper.h"
#include "PapiUtils.h"
#include "PapiBackendV8.h"
#include "DelegateWrapper.h"
#include "ContainerWrapper.h"
#include "SoftObjectWrapper.h"
#include "WeakObjectPtrWrapper.h"
#include "V8Utils.h"
#include "ObjectMapper.h"
#include "JSLogger.h"
#if !defined(ENGINE_INDEPENDENT_JSENV)
#include "JSGeneratedClass.h"
#include "JSWidgetGeneratedClass.h"
#include "JSGeneratedFunction.h"
#endif
#include "JSClassRegister.h"
#if !defined(ENGINE_INDEPENDENT_JSENV)
#include "TypeScriptGeneratedClass.h"
#include "Engine/UserDefinedEnum.h"
#endif
#include "ContainerMeta.h"

#if defined(WITH_NODEJS)
PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS
#if PLATFORM_WINDOWS
#include <windows.h>
#elif PLATFORM_LINUX
#include <sys/epoll.h>
#elif PLATFORM_MAC
#include <sys/select.h>
#include <sys/sysctl.h>
#include <sys/time.h>
#include <sys/types.h>
#endif
PRAGMA_ENABLE_UNDEFINED_IDENTIFIER_WARNINGS
#endif

#if !defined(ENGINE_INDEPENDENT_JSENV)
#include "Engine/CollisionProfile.h"
#endif

#if defined(WITH_WEBSOCKET)
void InitWebsocketPPWrap(pesapi_ffi* Apis, pesapi_env Env, PUERTS_NAMESPACE::ScriptClassRegistry* Registry);
#endif

namespace PUERTS_NAMESPACE
{
#if !defined(WITH_QUICKJS)
void LoadPesapiDll(struct pesapi_ffi* Apis, pesapi_callback_info Info);
#endif

FJsEnvImpl::FJsEnvImpl(const FString& ScriptRoot)
    : FJsEnvImpl(std::make_shared<DefaultJSModuleLoader>(ScriptRoot), std::make_shared<FDefaultLogger>(), -1, nullptr, FString(),
          nullptr, nullptr)
{
}

static void FNameToArrayBuffer(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    // ToFName tells a raw FName buffer from a string, which papi can not express
    FName Name = FV8Utils::ToFName(papi_bridge::IsolateOf(Env), papi_bridge::ToV8(Apis->get_arg(Info, 0)));
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

#if defined(WITH_NODEJS)
void FJsEnvImpl::StartPolling()
{
    uv_async_init(&NodeUVLoop, &DummyUVHandle, nullptr);
    uv_sem_init(&PollingSem, 0);
    uv_thread_create(
        &PollingThread,
        [](void* arg)
        {
            auto* self = static_cast<FJsEnvImpl*>(arg);
            while (true)
            {
                uv_sem_wait(&self->PollingSem);

                if (self->PollingClosed)
                    break;

                self->PollEvents();

                if (self->PollingClosed)
                    break;

                self->LastJob = FFunctionGraphTask::CreateAndDispatchWhenReady(
                    [self]() { self->UvRunOnce(); }, TStatId{}, nullptr, ENamedThreads::GameThread);
            }
        },
        this);

#if PLATFORM_WINDOWS
    // on single-core the io comp port NumberOfConcurrentThreads needs to be 2
    // to avoid cpu pegging likely caused by a busy loop in PollEvents
    if (FPlatformMisc::NumberOfCores() == 1)
    {
        if (NodeUVLoop.iocp && NodeUVLoop.iocp != INVALID_HANDLE_VALUE)
            CloseHandle(NodeUVLoop.iocp);
        NodeUVLoop.iocp = CreateIoCompletionPort(INVALID_HANDLE_VALUE, NULL, 0, 2);
    }
#elif PLATFORM_LINUX
    Epoll = epoll_create(1);
    int backend_fd = uv_backend_fd(&NodeUVLoop);
    struct epoll_event ev = {0};
    ev.events = EPOLLIN;
    ev.data.fd = backend_fd;
    epoll_ctl(Epoll, EPOLL_CTL_ADD, backend_fd, &ev);
    NodeUVLoop.data = this;
    NodeUVLoop.on_watcher_queue_updated = OnWatcherQueueChanged;

#elif PLATFORM_MAC
    NodeUVLoop.data = this;
    NodeUVLoop.on_watcher_queue_updated = OnWatcherQueueChanged;
#endif
    UvRunOnce();
}

void FJsEnvImpl::UvRunOnce()
{
    FPapiEnvScope EnvScope(MainApis, MainEnvRef);

    // TODO: catch uv_run可以让脚本错误不至于进程退出，但这不知道会不会对node有什么副作用
    uv_run(&NodeUVLoop, UV_RUN_NOWAIT);
    if (EnvScope.HasCaught())
    {
        Logger->Error(FString::Printf(TEXT("uv_run throw: %s"), UTF8_TO_TCHAR(EnvScope.GetExceptionAsString())));
    }
    else
    {
        static_cast<node::MultiIsolatePlatform*>(IJsEnvModule::Get().GetV8Platform())->DrainTasks(NodeIsolate);
    }

    LastJob = nullptr;

    // Tell the Polling thread to continue.
    uv_sem_post(&PollingSem);
}

void FJsEnvImpl::PollEvents()
{
#if PLATFORM_WINDOWS
    DWORD bytes;
    DWORD timeout = uv_backend_timeout(&NodeUVLoop);
    ULONG_PTR key;
    OVERLAPPED* overlapped;

    timeout = timeout > 100 ? 100 : timeout;

    GetQueuedCompletionStatus(NodeUVLoop.iocp, &bytes, &key, &overlapped, timeout);

    // Give the event back so libuv can deal with it.
    if (overlapped != NULL)
        PostQueuedCompletionStatus(NodeUVLoop.iocp, bytes, key, overlapped);
#elif PLATFORM_LINUX
    int timeout = uv_backend_timeout(&NodeUVLoop);
    timeout = (timeout > 100 || timeout < 0) ? 100 : timeout;

    // Wait for new libuv events.
    int r;
    do
    {
        struct epoll_event ev;
        r = epoll_wait(Epoll, &ev, 1, timeout);
    } while (r == -1 && errno == EINTR);
#elif PLATFORM_MAC
    struct timeval tv;
    int timeout = uv_backend_timeout(&NodeUVLoop);
    timeout = (timeout > 100 || timeout < 0) ? 100 : timeout;
    if (timeout != -1)
    {
        tv.tv_sec = timeout / 1000;
        tv.tv_usec = (timeout % 1000) * 1000;
    }

    fd_set readset;
    int fd = uv_backend_fd(&NodeUVLoop);
    FD_ZERO(&readset);
    FD_SET(fd, &readset);

    // Wait for new libuv events.
    int r;
    do
    {
        r = select(fd + 1, &readset, nullptr, nullptr, timeout == -1 ? nullptr : &tv);
    } while (r == -1 && errno == EINTR);
#endif
}

void FJsEnvImpl::OnWatcherQueueChanged(uv_loop_t* loop)
{
#if !PLATFORM_WINDOWS
    FJsEnvImpl* self = static_cast<FJsEnvImpl*>(loop->data);
    self->WakeupPollingThread();
#endif
}

void FJsEnvImpl::WakeupPollingThread()
{
    uv_async_send(&DummyUVHandle);
}

void FJsEnvImpl::StopPolling()
{
    PollingClosed = true;

    uv_sem_post(&PollingSem);

    WakeupPollingThread();

    uv_thread_join(&PollingThread);

    if (LastJob)
    {
        LastJob->Wait();
    }

    uv_sem_destroy(&PollingSem);
}

#endif

FJsEnvImpl::FJsEnvImpl(std::shared_ptr<IJSModuleLoader> InModuleLoader, std::shared_ptr<ILogger> InLogger, int InDebugPort,
    std::function<void(const FString&)> InOnSourceLoadedCallback, const FString InFlags, void* InExternalRuntime,
    void* InExternalContext)
{
    GUObjectArray.AddUObjectDeleteListener(static_cast<FUObjectArray::FUObjectDeleteListener*>(this));

    Started = false;

    ModuleLoader = std::move(InModuleLoader);
    Logger = InLogger;
    OnSourceLoadedCallback = InOnSourceLoadedCallback;

    // the backend of the env, the only place the engine is chosen (see PapiBackend.h), the rest of the host uses the papi
    // table it provides (MainApis)
    FPapiBackendV8::FParams BackendParams;
    BackendParams.Logger = Logger;
    BackendParams.Flags = InFlags;
    BackendParams.OnEnvReleased = [this]() { OnEnvReleased(); };
    BackendParams.OnClassInvalidated = [this](const void* TypeId) { OnClassInvalidated(TypeId); };
#if !defined(WITH_NODEJS)
    check(!InExternalRuntime && !InExternalContext);
#else
    int Argc = 1;
    const char* Argv[] = {"puerts"};
    std::vector<std::string> Args(Argv, Argv + Argc);
    std::vector<std::string> ExecArgs;
    std::vector<std::string> Errors;

    const int Ret = uv_loop_init(&NodeUVLoop);
    if (Ret != 0)
    {
        Logger->Error(FString::Printf(TEXT("Failed to initialize loop: %s\n"), UTF8_TO_TCHAR(uv_err_name(Ret))));
        return;
    }

    NodeArrayBufferAllocator = node::ArrayBufferAllocator::Create();

    auto Platform = static_cast<node::MultiIsolatePlatform*>(IJsEnvModule::Get().GetV8Platform());
    NodeIsolate = node::NewIsolate(NodeArrayBufferAllocator.get(), &NodeUVLoop, Platform);

#ifdef THREAD_SAFE
    v8::Locker NodeLocker(NodeIsolate);
#endif

    // v8::Locker locker(Isolate);
    // difference from embedding example, if lock, blow check fail:
    // Utils::ApiCheck(
    //! v8::Locker::IsActive() ||
    //    internal_isolate->thread_manager()->IsLockedByCurrentThread() ||
    //    internal_isolate->serializer_enabled(),
    //"HandleScope::HandleScope",
    //"Entering the V8 API without proper locking in place");

    v8::Isolate::Scope NodeIsolateScope(NodeIsolate);

    NodeIsolateData =
        node::CreateIsolateData(NodeIsolate, &NodeUVLoop, Platform, NodeArrayBufferAllocator.get());    // node::FreeIsolateData

    v8::HandleScope NodeHandleScope(NodeIsolate);

    v8::Local<v8::Context> NodeContext = node::NewContext(NodeIsolate);
    {
        v8::Context::Scope NodeContextScope(NodeContext);
        v8::Local<v8::Object> NodeGlobal = NodeContext->Global();
        auto strConsole = v8::String::NewFromUtf8(NodeIsolate, "console").ToLocalChecked();
        v8::Local<v8::Value> Console = NodeGlobal->Get(NodeContext, strConsole).ToLocalChecked();
        // kDefaultFlags = kOwnsProcessState | kOwnsInspector, if kOwnsInspector set, inspector_agent.cc:681
        // CHECK_EQ(start_io_thread_async_initialized.exchange(true), false) fail!
        NodeEnv = CreateEnvironment(NodeIsolateData, NodeContext, Args, ExecArgs, node::EnvironmentFlags::kOwnsProcessState);
        NodeGlobal->Set(NodeContext, strConsole, Console).Check();
        v8::MaybeLocal<v8::Value> LoadenvRet = node::LoadEnvironment(NodeEnv,
            "const publicRequire ="
            "  require('module').createRequire(process.cwd() + '/');"
            "globalThis.require = publicRequire;");

        if (LoadenvRet.IsEmpty())    // There has been a JS exception.
        {
            return;
        }
    }

    // the same as raw v8
    NodeIsolate->SetMicrotasksPolicy(v8::MicrotasksPolicy::kAuto);

    StartPolling();

    // the isolate and the context of node are adopted by the backend
    BackendParams.ExternalIsolate = NodeIsolate;
    BackendParams.ExternalContext = NodeContext;
#endif
    // the classes of reflected types (built from the class definitions of FStructWrapper) must be kept alive while the
    // classes are, and they are named by the backend
    BackendParams.OnClassCreated = [this](const JSClassDefinition* ClassDefinition)
    { return OnReflectedClassCreated(ClassDefinition); };

    Backend = std::make_unique<FPapiBackendV8>(BackendParams);
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

        PapiMethodBindingHelper<&FJsEnvImpl::Log>::Bind(Apis, Env, PapiGlobal, "__tgjsLog", this);

        PapiMethodBindingHelper<&FJsEnvImpl::LoadModule>::Bind(Apis, Env, PapiPuertsObj, "loadModule", this);

        PapiMethodBindingHelper<&FJsEnvImpl::LoadUEType>::Bind(Apis, Env, PapiPuertsObj, "loadUEType", this);

        PapiMethodBindingHelper<&FJsEnvImpl::LoadCppType>::Bind(Apis, Env, PapiPuertsObj, "loadCPPType", this);

        PapiBindFunction(Apis, Env, PapiPuertsObj, "getFNameString", &GetFNameString);

        PapiMethodBindingHelper<&FJsEnvImpl::UEClassToJSClass>::Bind(Apis, Env, PapiGlobal, "__tgjsUEClassToJSClass", this);

        PapiMethodBindingHelper<&FJsEnvImpl::NewContainer>::Bind(Apis, Env, PapiGlobal, "__tgjsNewContainer", this);

        PapiMethodBindingHelper<&FJsEnvImpl::MergeObject>::Bind(Apis, Env, PapiGlobal, "__tgjsMergeObject", this);

        PapiMethodBindingHelper<&FJsEnvImpl::NewObjectByClass>::Bind(Apis, Env, PapiGlobal, "__tgjsNewObject", this);

        PapiMethodBindingHelper<&FJsEnvImpl::SetJsTakeRefInTs>::Bind(Apis, Env, PapiGlobal, "__tgjsSetJsTakeRef", this);

        PapiMethodBindingHelper<&FJsEnvImpl::NewStructByScriptStruct>::Bind(Apis, Env, PapiGlobal, "__tgjsNewStruct", this);

        PapiBindFunction(Apis, Env, PapiGlobal, "__tgjsMakeWeakObjectPtr", &FWeakObjectPtrWrapper::Make);

#if !defined(ENGINE_INDEPENDENT_JSENV)
        PapiMethodBindingHelper<&FJsEnvImpl::MakeUClass>::Bind(Apis, Env, PapiGlobal, "__tgjsMakeUClass", this);

        PapiMethodBindingHelper<&FJsEnvImpl::Mixin>::Bind(Apis, Env, PapiGlobal, "__tgjsMixin", this);
#endif

        //#if !defined(WITH_NODEJS)
        PapiMethodBindingHelper<&FJsEnvImpl::SetTimeout>::Bind(Apis, Env, PapiGlobal, "setTimeout", this);

        PapiMethodBindingHelper<&FJsEnvImpl::ClearInterval>::Bind(Apis, Env, PapiGlobal, "clearTimeout", this);

        PapiMethodBindingHelper<&FJsEnvImpl::SetInterval>::Bind(Apis, Env, PapiGlobal, "setInterval", this);

        PapiMethodBindingHelper<&FJsEnvImpl::ClearInterval>::Bind(Apis, Env, PapiGlobal, "clearInterval", this);
        //#endif

        PapiMethodBindingHelper<&FJsEnvImpl::DumpStatisticsLog>::Bind(Apis, Env, PapiGlobal, "dumpStatisticsLog", this);
        PapiMethodBindingHelper<&FJsEnvImpl::IsQuickJS>::Bind(Apis, Env, PapiGlobal, "isQuickJS", this);
        PapiBindFunction(Apis, Env, PapiGlobal, "__tgjsFNameToArrayBuffer", &FNameToArrayBuffer);

        PapiBindFunction(Apis, Env, PapiPuertsObj, "toCString", &ToCString);

        PapiBindFunction(Apis, Env, PapiPuertsObj, "toCPtrArray", &ToCPtrArray);

#if !defined(WITH_QUICKJS)
        PapiBindFunction(Apis, Env, PapiPuertsObj, "load", &LoadPesapiDll);
#endif

        FString DllExt =
#if PLATFORM_WINDOWS
            TEXT(".dll");
#elif PLATFORM_MAC || PLATFORM_IOS
            TEXT(".dylib");
#else
            TEXT(".so");
#endif
        Apis->set_property(Env, PapiPuertsObj, "dll_ext", PapiUtils::FromFString(Apis, Env, DllExt));

        PapiMethodBindingHelper<&FJsEnvImpl::ReleaseManualReleaseDelegate>::Bind(
            Apis, Env, PapiPuertsObj, "releaseManualReleaseDelegate", this);

        // the host part of the module system: resolving and loading the source, the rest is done by the backend
        PapiMethodBindingHelper<&FJsEnvImpl::HostResolveModule>::Bind(Apis, Env, PapiGlobal, "__puer_host_resolve__", this);
        PapiMethodBindingHelper<&FJsEnvImpl::HostLoadModule>::Bind(Apis, Env, PapiGlobal, "__puer_host_load__", this);
#if defined(WITH_NODEJS)
        {
            // saved before the backend replaces it with the require of puerts
            pesapi_value OrgRequire = Apis->get_property(Env, PapiGlobal, "require");
            if (Apis->is_function(Env, OrgRequire))
            {
                NodeRequire.Reset(Apis, Env, OrgRequire);
            }
        }
#endif

        DynamicInvoker = MakeShared<DynamicInvokerImpl, ESPMode::ThreadSafe>(this);
        MixinInvoker = DynamicInvoker;
#if !defined(ENGINE_INDEPENDENT_JSENV)
        TsDynamicInvoker = MakeShared<TsDynamicInvokerImpl, ESPMode::ThreadSafe>(this);
#endif
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

        ReloadJs.Reset(Apis, Env, Apis->get_property(Env, PapiPuertsObj, "__reload"));
#if !PUERTS_FORCE_CPP_UFUNCTION
        MergePrototype.Reset(Apis, Env, Apis->get_property(Env, PapiPuertsObj, "__mergePrototype"));
#endif

        RemoveListItem.Reset(Apis, Env, Apis->get_property(Env, PapiPuertsObj, "__removeListItem"));

        GenListApply.Reset(Apis, Env, Apis->get_property(Env, PapiPuertsObj, "__genListApply"));

        static const char MapCode[] = "new Map()";
        ManualReleaseCallbackMap.Reset(Apis, Env,
            Apis->eval(Env, reinterpret_cast<const uint8_t*>(MapCode), sizeof(MapCode) - 1, "puerts/manual_release_map"));
    }

    DelegateProxiesCheckerHandler =
        FUETicker::GetCoreTicker().AddTicker(FTickerDelegate::CreateRaw(this, &FJsEnvImpl::CheckDelegateProxies), 1);

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
FJsEnvImpl::~FJsEnvImpl()
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
#if defined(WITH_NODEJS)
    StopPolling();
#endif

    for (auto& KV : ManualReleaseCallbacks)
    {
        if (KV.Value.IsValid(true))
        {
            KV.Value.Get()->ResetJsFunction();
        }
    }
    ManualReleaseCallbacks.Empty();
    ManualReleaseCallbackMap.Reset();
    ReloadJs.Reset();

    FUETicker::GetCoreTicker().RemoveTicker(DelegateProxiesCheckerHandler);

    {
        FPapiEnvScope EnvScope(MainApis, MainEnvRef);

        TypeToTemplateInfoMap.Empty();

        // value refs must be released while the env is alive (before CppObjectMapper.UnInitialize)
        for (auto Iter = TimerInfos.CreateIterator(); Iter; ++Iter)
        {
            MainApis->release_value_ref(Iter->Value.Callback);
            FUETicker::GetCoreTicker().RemoveTicker(Iter->Value.TickerHandle);
        }
        TimerInfos.Empty();

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

#if !defined(ENGINE_INDEPENDENT_JSENV)
        for (auto& GeneratedClass : GeneratedClasses)
        {
            if (auto JSGeneratedClass = Cast<UJSGeneratedClass>(GeneratedClass))
            {
                if (JSGeneratedClass->IsValidLowLevelFast() && !UEObjectIsPendingKill(JSGeneratedClass))
                {
                    JSGeneratedClass->Release();
                }
            }
            else if (auto JSWidgetGeneratedClass = Cast<UJSWidgetGeneratedClass>(GeneratedClass))
            {
                if (JSWidgetGeneratedClass->IsValidLowLevelFast() && !UEObjectIsPendingKill(JSWidgetGeneratedClass))
                {
                    JSWidgetGeneratedClass->Release();
                }
            }
        }
#endif
        TsFunctionMap.Empty();
#if !defined(ENGINE_INDEPENDENT_JSENV)
        BindInfoMap.Empty();
#endif
        ObjectSetPrototypeOf.Reset();
        ObjectGetPrototypeOf.Reset();
        ObjectHasOwn.Reset();
        ObjectKeys.Reset();
        FNameFixingProxy.Reset();

#if !defined(WITH_QUICKJS)
#if defined(WITH_NODEJS)
        NodeRequire.Reset();
#endif
#endif
#if !PUERTS_FORCE_CPP_UFUNCTION
        MergePrototype.Reset();
#endif
        // the js runtime of the backend stops before the env is released
        Backend->OnExit(this);
    }

    // the cleanup that needs the env released (but the isolate alive) is done in OnEnvReleased
    Backend->DestroyEnvRef(MainEnvRef);
    MainEnvRef = nullptr;
#if defined(WITH_NODEJS)
    // the isolate of node is created by the host
    NodeIsolate->Dispose();
    NodeIsolate = nullptr;
#endif
    Backend.reset();
    MainApis = nullptr;

    // referenced by the templates, released after the isolate
    ClassesBuilt.clear();
    RetiredClasses.clear();

    GUObjectArray.RemoveUObjectDeleteListener(static_cast<FUObjectArray::FUObjectDeleteListener*>(this));
}

void FJsEnvImpl::OnEnvReleased()
{
    // the bindings are freed by the finalizer of their classes in CppObjectMapper.UnInitialize, the rest (whose class is not
    // found) are freed here
    for (auto& KV : ObjectMap)
    {
        delete KV.Value;
    }
    ObjectMap.Empty();
    for (auto Binding : ReleasedObjectBindings)
    {
        delete Binding;
    }
    ReleasedObjectBindings.Empty();

    for (auto Iter = DelegateMap.begin(); Iter != DelegateMap.end(); Iter++)
    {
        if (!Iter->second.PassByPointer)
        {
            delete ((FScriptDelegate*) Iter->first);
        }
    }

    // TsFunctionMap and BindInfoMap hold papi refs, they are released before CppObjectMapper.UnInitialize
#if !defined(ENGINE_INDEPENDENT_JSENV)
    TsDynamicInvoker.Reset();
#endif

#if defined(WITH_NODEJS)
    node::EmitExit(NodeEnv);
    node::Stop(NodeEnv);
    node::FreeEnvironment(NodeEnv);
    node::FreeIsolateData(NodeIsolateData);

    auto Platform = static_cast<node::MultiIsolatePlatform*>(IJsEnvModule::Get().GetV8Platform());
    Platform->UnregisterIsolate(NodeIsolate);
#endif

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

void FJsEnvImpl::InitExtensionMethodsMap()
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

std::unique_ptr<FJsEnvImpl::ObjectMerger>& FJsEnvImpl::GetObjectMerger(UStruct* Struct)
{
    if (ObjectMergers.find(Struct) == ObjectMergers.end())
    {
        ObjectMergers[Struct] = std::make_unique<ObjectMerger>(this, Struct);
    }
    return ObjectMergers[Struct];
}

void FJsEnvImpl::Merge(pesapi_env Env, pesapi_value Src, UStruct* DesType, void* Des)
{
    GetObjectMerger(DesType)->Merge(MainApis, Env, Src, Des);
}

void FJsEnvImpl::ObjectMerger::Merge(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value JsObject, void* Ptr)
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
                    ->Merge(Apis, Env, Value, Iter->second->Property->ContainerPtrToValuePtr<void>(Ptr));
            }
            continue;
        }
        if (!Apis->is_undefined(Env, Value))
        {
            Iter->second->JsToUEInContainer(Apis, Env, Value, Ptr, true);
        }
    }
}

void FJsEnvImpl::MergeObject(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CHECK_ARGS(EArgObject, EArgObject);

    pesapi_env Env = Apis->get_env(Info);
    pesapi_value Des = Apis->get_arg(Info, 0);
    pesapi_value Src = Apis->get_arg(Info, 1);
    // the type id of a reflected object is its wrapper (FScriptStructWrapper or FClassWrapper)
    auto Wrapper = FStructWrapper::FromTypeId(Apis->get_native_object_typeid(Env, Des));
    if (auto Struct = Wrapper ? Cast<UScriptStruct>(Wrapper->GetStruct()) : nullptr)
    {
        PapiUtils::Merge(Apis, Env, Src, Struct, Apis->get_native_object_ptr(Env, Des));
        return;
    }
    if (auto Object = PapiUtils::GetUObject(Apis, Env, Des))
    {
        if (PapiUtils::IsReleasedPtr(Object))
        {
            Apis->throw_by_string(Info, "passing a invalid object");
            return;
        }
        PapiUtils::Merge(Apis, Env, Src, Object->GetClass(), Object);
        return;
    }
    Apis->throw_by_string(Info, "Bad parameters #1, expect a native object.");
}

void FJsEnvImpl::NewObjectByClass(struct pesapi_ffi* Apis, pesapi_callback_info Info)
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

void FJsEnvImpl::NewStructByScriptStruct(struct pesapi_ffi* Apis, pesapi_callback_info Info)
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

bool FJsEnvImpl::IdleNotificationDeadline(double DeadlineInSeconds)
{
    return Backend->IdleNotificationDeadline(DeadlineInSeconds);
}

void FJsEnvImpl::LowMemoryNotification()
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
    Backend->LowMemoryNotification();
}

void FJsEnvImpl::RequestMinorGarbageCollectionForTesting()
{
    Backend->RequestMinorGarbageCollectionForTesting();
}

void FJsEnvImpl::RequestFullGarbageCollectionForTesting()
{
    Backend->RequestFullGarbageCollectionForTesting();
}

#if !defined(ENGINE_INDEPENDENT_JSENV)
void FJsEnvImpl::FinishInjection(UClass* InClass)
{
    while (InClass && !InClass->IsNative())
    {
        auto TempTypeScriptGeneratedClass = Cast<UTypeScriptGeneratedClass>(InClass);
        if (TempTypeScriptGeneratedClass)    // InjectNotFinished状态下，其子类的CDO对象构建，把UFunction设置为Native
        {
            auto BindInfoPtr = BindInfoMap.Find(TempTypeScriptGeneratedClass);
            if (BindInfoPtr && BindInfoPtr->InjectNotFinished)
            {
                TempTypeScriptGeneratedClass->RedirectToTypeScriptFinish();
                BindInfoPtr->InjectNotFinished = false;
            }
        }
        InClass = InClass->GetSuperClass();
    }
}

void FJsEnvImpl::MakeSureInject(UTypeScriptGeneratedClass* TypeScriptGeneratedClass, bool ForceReinject, bool RebindObject)
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif

#if WITH_EDITOR
    if (TypeScriptGeneratedClass->NeedReBind)
    {
        UTypeScriptGeneratedClass::NotifyRebind(TypeScriptGeneratedClass);
    }
#endif

    auto BindInfoPtr = BindInfoMap.Find(TypeScriptGeneratedClass);

    if (!BindInfoPtr || ForceReinject)    // create and link
    {
        auto Package = Cast<UPackage>(TypeScriptGeneratedClass->GetOuter());
        if (!Package || TypeScriptGeneratedClass->NotSupportInject())
        {
            return;
        }

        auto PackageName = Package->GetName();

        static FString PackageNamePrefix(TEXT(TS_BLUEPRINT_PATH));

        auto PrefixPos = PackageName.Find(PackageNamePrefix);

        if (PrefixPos != INDEX_NONE)
        {
            auto SuperClass = Cast<UTypeScriptGeneratedClass>(TypeScriptGeneratedClass->GetSuperClass());
            if (SuperClass && SuperClass->GetName().StartsWith(TEXT("REINST_")))
            {
                //中间状态，父类修改，子类可能有个中间状态，其父类可能被修改为一个REINST_前缀的临时类
                return;
            }
            if (SuperClass)
            {
                MakeSureInject(SuperClass, false, RebindObject);
            }
            FString ModuleName = PackageName.Mid(PrefixPos + PackageNamePrefix.Len());
            Logger->Info(FString::Printf(TEXT("Bind module [%s] "), *ModuleName));

            struct pesapi_ffi* Apis = MainApis;
            FPapiEnvScope EnvScope(Apis, MainEnvRef);
            if (!EnvScope)
            {
                return;
            }
            pesapi_env Env = EnvScope.GetEnv();
            // the prototype chain of an existing BindInfo (ForceReinject must be true here) is linked already
            InjectTsClass(Apis, Env, EnvScope.GetScope(), TypeScriptGeneratedClass, SuperClass, ModuleName, BindInfoPtr != nullptr,
                RebindObject);
            if (EnvScope.HasCaught())
            {
                Logger->Error(FString::Printf(
                    TEXT("load module [%s] exception %s"), *ModuleName, UTF8_TO_TCHAR(EnvScope.GetExceptionAsString())));
            }
        }
        else
        {
            Logger->Warn(FString::Printf(TEXT("not find module info for [%s]"), *TypeScriptGeneratedClass->GetName()));
        }
    }
}

void FJsEnvImpl::InjectTsClass(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_scope Scope,
    UTypeScriptGeneratedClass* TypeScriptGeneratedClass, UTypeScriptGeneratedClass* SuperClass, const FString& ModuleName,
    bool PrototypeLinked, bool RebindObject)
{
    if (!PrototypeLinked)
    {
        FBindInfo BindInfo;
        BindInfo.Name = *ModuleName;
        BindInfo.Prototype.Reset(Apis, Env, Apis->create_object(Env));
        BindInfo.InjectNotFinished = true;
        BindInfoMap.Emplace(TypeScriptGeneratedClass, std::move(BindInfo));
    }

    pesapi_value Ret = RequireModule(Apis, Env, ModuleName);
    if (Apis->has_caught(Scope))
    {
        return;
    }
    if (!Ret || !Apis->is_object(Env, Ret))
    {
        Logger->Error(FString::Printf(TEXT("module [%s] invalid"), *ModuleName));
        return;
    }

    pesapi_value Func = Apis->get_property(Env, Ret, "default");
    if (!Apis->is_function(Env, Func))
    {
        return;
    }
    pesapi_value Proto = Apis->get_property(Env, Func, "prototype");
    if (!Apis->is_object(Env, Proto))
    {
        return;
    }

    pesapi_value HasOwn = GetCachedJsFunction(
        Apis, Env, ObjectHasOwn, "Function.prototype.call.bind(Object.prototype.hasOwnProperty)", "puerts/object_has_own");
    if (!HasOwn)
    {
        return;
    }

    TypeScriptGeneratedClass->DynamicInvoker = TsDynamicInvoker;
    TypeScriptGeneratedClass->ClassConstructor = &UTypeScriptGeneratedClass::StaticConstructor;

    pesapi_value Ctor = Apis->get_property(Env, Proto, "Constructor");
    if (Apis->is_function(Env, Ctor))
    {
        BindInfoMap[TypeScriptGeneratedClass].Constructor.Reset(Apis, Env, Ctor);
    }

    // implement by js
    TypeScriptGeneratedClass->FunctionToRedirect.Empty();

#if !PUERTS_FORCE_CPP_UFUNCTION
    pesapi_value NetMethods = Apis->create_object(Env);
#endif

    for (TFieldIterator<UFunction> It(TypeScriptGeneratedClass, EFieldIteratorFlags::ExcludeSuper,
             EFieldIteratorFlags::ExcludeDeprecated, EFieldIteratorFlags::ExcludeInterfaces);
         It; ++It)
    {
        UFunction* Function = *It;
        auto FunctionFName = Function->GetFName();
        if (!Function->HasAnyFunctionFlags(FUNC_BlueprintEvent) ||
            TypeScriptGeneratedClass->FunctionToRedirect.Contains(FunctionFName))
        {
            continue;
        }
        FString FunctionName = Function->GetName();

        // FString::Printf(TEXT("InpAxisEvt_%s_%s"), *InputAxisName.ToString(), *GetName())
        static FString AxisPrefix(TEXT("InpAxisEvt_"));
        if (FunctionName.StartsWith(AxisPrefix))
        {
            auto FunctionNameWithoutPrefix = FunctionName.Mid(AxisPrefix.Len());
            int32 SubPos;
            if (FunctionNameWithoutPrefix.FindChar('_', SubPos))
            {
                FunctionName = FunctionNameWithoutPrefix.Mid(0, SubPos);
            }
        }
        static FString ActionPrefix(TEXT("InpActEvt_"));
        if (FunctionName.StartsWith(ActionPrefix))
        {
            auto FunctionNameWithoutPrefix = FunctionName.Mid(ActionPrefix.Len());
            int32 SubPos;
            if (FunctionNameWithoutPrefix.FindChar('_', SubPos))
            {
                FunctionName = FunctionNameWithoutPrefix.Mid(0, SubPos);
            }
        }

        FTCHARToUTF8 FunctionNameUtf8(*FunctionName);
        pesapi_value FuncsObj = Function->HasAnyFunctionFlags(FUNC_Static) ? Func : Proto;
        pesapi_value HasOwnArgs[] = {FuncsObj, Apis->create_string_utf8(Env, FunctionNameUtf8.Get(), FunctionNameUtf8.Length())};
        pesapi_value IsOwn = Apis->call_function(Env, HasOwn, nullptr, 2, HasOwnArgs);
        if (!IsOwn)
        {
            return;
        }
        if (!Apis->get_value_bool(Env, IsOwn))
        {
            continue;
        }
        pesapi_value JsFunction = Apis->get_property(Env, FuncsObj, FunctionNameUtf8.Get());
        if (!Apis->is_function(Env, JsFunction))
        {
            continue;
        }

        auto FuncInfo = TsFunctionMap.Find(Function);
        if (!FuncInfo)
        {
            TsFunctionMap.Add(
                Function, {FPapiValueRef(Apis, Env, JsFunction), std::make_unique<FFunctionTranslator>(Function, false)});
        }
        else
        {
            FuncInfo->FunctionTranslator->Init(Function, false);
            FuncInfo->JsFunction.Reset(Apis, Env, JsFunction);
        }

#if !PUERTS_FORCE_CPP_UFUNCTION
        if (Function->HasAnyFunctionFlags(FUNC_Net))
        {
            Apis->set_property(Env, NetMethods, FunctionNameUtf8.Get(), Apis->create_boolean(Env, true));
        }
#endif

        TypeScriptGeneratedClass->FunctionToRedirect.Add(FunctionFName);
        TypeScriptGeneratedClass->RedirectToTypeScript(Function);
    }
    TypeScriptGeneratedClass->RedirectedToTypeScript = true;
#if WITH_EDITOR
    TypeScriptGeneratedClass->FunctionToRedirectInitialized = true;
#endif

    TryReleaseType(TypeScriptGeneratedClass);
    pesapi_value NativeCtor = GetJsClass(Env, TypeScriptGeneratedClass);
    if (!PrototypeLinked)
    {
        pesapi_value SetPrototypeOf =
            GetCachedJsFunction(Apis, Env, ObjectSetPrototypeOf, "Object.setPrototypeOf", "puerts/object_set_prototype_of");
        if (!SetPrototypeOf)
        {
            return;
        }
        pesapi_value Prototype = BindInfoMap[TypeScriptGeneratedClass].Prototype.Get(Env);
        pesapi_value NativeProto = Apis->get_property(Env, NativeCtor, "prototype");
        if (Apis->is_object(Env, NativeProto))
        {
            //{} -> Native Prototype -> Js Prototype -> Super Prototype
            pesapi_value Args[] = {Prototype, NativeProto};
            Apis->call_function(Env, SetPrototypeOf, nullptr, 2, Args);

            auto SuperBindInfo = SuperClass ? BindInfoMap.Find(SuperClass) : nullptr;
            pesapi_value ProtoParent = (SuperBindInfo && SuperBindInfo->Prototype) ? SuperBindInfo->Prototype.Get(Env) : nullptr;
            if (!ProtoParent)
            {
                pesapi_value GetPrototypeOf =
                    GetCachedJsFunction(Apis, Env, ObjectGetPrototypeOf, "Object.getPrototypeOf", "puerts/object_get_prototype_of");
                if (!GetPrototypeOf)
                {
                    return;
                }
                ProtoParent = Apis->call_function(Env, GetPrototypeOf, nullptr, 1, &NativeProto);
                if (!ProtoParent)
                {
                    return;
                }
            }
            Args[0] = Proto;
            Args[1] = ProtoParent;
            Apis->call_function(Env, SetPrototypeOf, nullptr, 2, Args);
            Args[0] = NativeProto;
            Args[1] = Proto;
            Apis->call_function(Env, SetPrototypeOf, nullptr, 2, Args);

#if !PUERTS_FORCE_CPP_UFUNCTION
            pesapi_value MergeArgs[] = {Proto, NativeProto, NetMethods};
            Apis->call_function(Env, MergePrototype.Get(Env), nullptr, 3, MergeArgs);
#endif
        }
        else
        {
            pesapi_value Args[] = {Prototype, Proto};
            Apis->call_function(Env, SetPrototypeOf, nullptr, 2, Args);
        }
    }

    if (RebindObject)
    {
        for (FUEObjectIterator It(TypeScriptGeneratedClass); It; ++It)
        {
            auto Object = *It;
            if (ObjectMap.Find(Object))
                continue;
            if (Object->GetClass()->GetName().StartsWith(TEXT("REINST_")))
                continue;    //跳过父类重新编译后临时状态的对象
            //在编辑器下重启虚拟机，如果TS带构造函数，不重新执行的话，新虚拟机上逻辑上少执行了逻辑（比如对js对象一些字段的初始化）
            //执行的话，对CreateDefaultSubobject这类UE逻辑又不允许执行多次（会崩溃），两者相较取其轻
            //后面看是否能参照蓝图的组件初始化进行改造
            // TsConstruct(TypeScriptGeneratedClass, Object);
            (void) FindOrAdd(Env, Object->GetClass(), Object, true);
        }
    }

    if (TypeScriptGeneratedClass->IsChildOf(UBlueprintFunctionLibrary::StaticClass()))
    {
        FinishInjection(TypeScriptGeneratedClass);
    }
}
#endif

pesapi_value FJsEnvImpl::GetCachedJsFunction(
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

void FJsEnvImpl::JsHotReload(FName ModuleName, const FString& JsSource)
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
    FString OutPath, OutDebugPath;

    if (ModuleLoader->Search(TEXT(""), ModuleName.ToString(), OutPath, OutDebugPath))
    {
        OutPath = FPaths::ConvertRelativePathToFull(OutPath);
        Logger->Info(FString::Printf(TEXT("reload js module [%s]"), *OutPath));
        struct pesapi_ffi* Apis = MainApis;
        FPapiEnvScope EnvScope(Apis, MainEnvRef);
        if (!EnvScope)
        {
            return;
        }
        pesapi_env Env = EnvScope.GetEnv();
        pesapi_value Args[] = {PapiUtils::FromFString(Apis, Env, ModuleName.ToString()), PapiUtils::FromFString(Apis, Env, OutPath),
            PapiUtils::FromFString(Apis, Env, JsSource)};
        CallReloadJs(EnvScope, Args);
    }
    else
    {
        Logger->Warn(FString::Printf(TEXT("not find js module [%s]"), *ModuleName.ToString()));
        return;
    }
}

void FJsEnvImpl::CallReloadJs(const FPapiEnvScope& EnvScope, pesapi_value (&Args)[3])
{
    struct pesapi_ffi* Apis = MainApis;
    pesapi_env Env = EnvScope.GetEnv();
    Apis->call_function(Env, ReloadJs.Get(Env), nullptr, 3, Args);
    if (EnvScope.HasCaught())
    {
        Logger->Error(FString::Printf(TEXT("reload module exception %s"), UTF8_TO_TCHAR(EnvScope.GetExceptionAsString())));
    }
}

void FJsEnvImpl::ReloadModule(FName ModuleName, const FString& JsSource)
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
    // Logger->Info(FString::Printf(TEXT("start reload js module [%s]"), *ModuleName.ToString()));
    JsHotReload(ModuleName, JsSource);
}

void FJsEnvImpl::ReloadSource(const FString& Path, const PString& JsSource)
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
    Logger->Info(FString::Printf(TEXT("reload js [%s]"), *Path));
    struct pesapi_ffi* Apis = MainApis;
    FPapiEnvScope EnvScope(Apis, MainEnvRef);
    if (!EnvScope)
    {
        return;
    }
    pesapi_env Env = EnvScope.GetEnv();
    pesapi_value Args[] = {Apis->create_undefined(Env), PapiUtils::FromFString(Apis, Env, Path),
        Apis->create_string_utf8(Env, JsSource.c_str(), JsSource.size())};
    CallReloadJs(EnvScope, Args);
}

void FJsEnvImpl::OnSourceLoaded(std::function<void(const FString&)> Callback)
{
    OnSourceLoadedCallback = Callback;
}

#if !defined(ENGINE_INDEPENDENT_JSENV)
void FJsEnvImpl::TryBindJs(const class UObjectBase* InObject)
{
    UObjectBaseUtility* Object = static_cast<UObjectBaseUtility*>(const_cast<UObjectBase*>(InObject));

    const bool IsCDO = Object->HasAnyFlags(RF_ClassDefaultObject | RF_ArchetypeObject);

    // if (!Object->HasAnyFlags(RF_ClassDefaultObject | RF_ArchetypeObject))
    {
        UClass* Class = InObject->GetClass();

        auto TypeScriptGeneratedClass = Cast<UTypeScriptGeneratedClass>(Class);

        if (UNLIKELY(TypeScriptGeneratedClass))
        {
            if (UNLIKELY(IsCDO))
            {
                if (TypeScriptGeneratedClass->IsChildOf(UBlueprintFunctionLibrary::StaticClass()))
                {
                    TypeScriptGeneratedClass->DynamicInvoker = TsDynamicInvoker;
                    TypeScriptGeneratedClass->ClassConstructor = &UTypeScriptGeneratedClass::StaticConstructor;
                    for (TFieldIterator<UFunction> FuncIt(TypeScriptGeneratedClass, EFieldIteratorFlags::ExcludeSuper); FuncIt;
                         ++FuncIt)
                    {
                        auto Function = *FuncIt;
                        if (!Function->HasAllFunctionFlags(FUNC_Static) || Function->HasAnyFunctionFlags(FUNC_Native))
                        {
                            continue;
                        }
                        Function->FunctionFlags |= FUNC_BlueprintCallable | FUNC_BlueprintEvent | FUNC_Public | FUNC_Native;
                        Function->SetNativeFunc(&UTypeScriptGeneratedClass::execLazyLoadCallJS);
                        TypeScriptGeneratedClass->AddNativeFunction(
                            *Function->GetName(), &UTypeScriptGeneratedClass::execLazyLoadCallJS);
                    }
                }
                else
                {
                    // MakeSureInject(TypeScriptGeneratedClass, true, true);
                    TypeScriptGeneratedClass->DynamicInvoker = TsDynamicInvoker;
                    TypeScriptGeneratedClass->ClassConstructor = &UTypeScriptGeneratedClass::StaticConstructor;
                    if (IsInGameThread())
                    {
                        // 其实目前在编辑器下Start后才启动虚拟机，这部分本来防止蓝图刷新的代码其实用不上了
                        auto BindInfoPtr = BindInfoMap.Find(TypeScriptGeneratedClass);
                        if (BindInfoPtr)
                        {
                            BindInfoPtr->InjectNotFinished = true;    // CDO construct meat first load or recompiled
                        }
                    }
                }
            }
        }
        else if (UNLIKELY(!IsCDO && Class == UTypeScriptGeneratedClass::StaticClass()))
        {
            TypeScriptGeneratedClass = static_cast<UTypeScriptGeneratedClass*>(Object);
            TypeScriptGeneratedClass->DynamicInvoker = TsDynamicInvoker;
            TypeScriptGeneratedClass->ClassConstructor = &UTypeScriptGeneratedClass::StaticConstructor;
            if (IsInGameThread())
            {
                auto BindInfoPtr = BindInfoMap.Find(TypeScriptGeneratedClass);
                if (BindInfoPtr)
                {
                    BindInfoPtr->InjectNotFinished = true;    // CDO construct meat first load or recompiled
                }
            }
        }
    }
}

void FJsEnvImpl::RebindJs()
{
    FPapiEnvScope EnvScope(MainApis, MainEnvRef);
    if (!EnvScope)
    {
        return;
    }
    for (TObjectIterator<UClass> It; It; ++It)
    {
        UClass* Class = *It;
        if (!Class->IsNative())
        {
            if (auto TsClass = Cast<UTypeScriptGeneratedClass>(Class))
            {
                if (!TsClass->NotSupportInject())
                {
#if WITH_EDITOR
                    if (TsClass->FunctionToRedirectInitialized && !TsClass->IsChildOf(UBlueprintFunctionLibrary::StaticClass()))
                    {
                        TsClass->DynamicInvoker = TsDynamicInvoker;
                        TsClass->ClassConstructor = &UTypeScriptGeneratedClass::StaticConstructor;
                        TsClass->NeedReBind = true;
                        TsClass->GeneratedObjects.Empty(TsClass->GeneratedObjects.Num());
                        TsClass->LazyLoadRedirect();
                    }
                    else
#endif
                    {
                        MakeSureInject(TsClass, false, true);
                        FinishInjection(TsClass);
                    }
                }
            }
            else
            {
                auto IsTsSubclass = [](UClass* InnerClass)
                {
                    while (InnerClass)
                    {
                        if (InnerClass->ClassConstructor == UTypeScriptGeneratedClass::StaticConstructor ||
                            Cast<UTypeScriptGeneratedClass>(InnerClass))
                            return true;
                        InnerClass = InnerClass->GetSuperClass();
                    }

                    return false;
                };
                if (IsTsSubclass(Class))
                {
                    Class->ClassConstructor = UTypeScriptGeneratedClass::StaticConstructor;
                }
            }
        }
    }

    //如果在notifyrebind的时候去遍历,那么多次遍历会明显拉低性能
    //改为rebindjs的时候一次性找到全部需要rebind的object
    //在遍历之后创建的uobject,虽然不会被GeneratedObjects记录,但是因为会走TypeScript::ObjectInialize,所以也不用担心没有被bind
#if WITH_EDITOR
    for (TObjectIterator<UObject> It; It; ++It)
    {
        if (It->GetClass()->ClassConstructor == UTypeScriptGeneratedClass::StaticConstructor)
        {
            UClass* Cls = It->GetClass();
            while (Cls)
            {
                if (Cast<UTypeScriptGeneratedClass>(Cls))
                    break;
                Cls = Cls->GetSuperClass();
            }
            while (Cls)
            {
                if (UTypeScriptGeneratedClass* TsClass = Cast<UTypeScriptGeneratedClass>(Cls))
                {
                    TsClass->GeneratedObjects.Add(*It);
                    Cls = Cls->GetSuperClass();
                }
                else
                {
                    break;
                }
            }
        }
    }
#endif
}
#endif

FString FJsEnvImpl::CurrentStackTrace()
{
    return Backend->CurrentStackTrace();
}

bool FJsEnvImpl::IsTypeScriptGeneratedClass(UClass* Class)
{
    while (Class)
    {
        if (Class->GetClass() == UTypeScriptGeneratedClass::StaticClass())
        {
            return true;
        }

        Class = Class->GetSuperClass();
    }
    return false;
}

void* FJsEnvImpl::Bind(pesapi_env Env, FClassWrapper* ClassWrapper, UObject* UEObject, pesapi_value JSObject)
{
    // called by FClassWrapper::New, JSObject is the object being constructed
    auto Class = static_cast<UClass*>(ClassWrapper->Struct.Get());
    bool Existed;
    return AddBinding(Env, ClassWrapper, GetTemplateInfoOfType(Env, Class, Existed)->IsNativeTakeJsRef, UEObject, JSObject);
}

FJsEnvImpl::FUObjectBinding* FJsEnvImpl::AddBinding(
    pesapi_env Env, FClassWrapper* ClassWrapper, bool ClassIsNativeTakeJsRef, UObject* UEObject, pesapi_value& JSObject)
{
#if PUERTS_KEEP_UOBJECT_REFERENCE
    const bool IsNativeTakeJsRef = ClassIsNativeTakeJsRef;
#else
    const bool ClassWrapperIsNativeTakeJsRef = ClassIsNativeTakeJsRef;    //这个值只有mixin会进行设置
    const bool IsUClass = UEObject->IsA<UClass>();
    const bool IsCDO = UEObject->HasAnyFlags(RF_ClassDefaultObject | RF_ArchetypeObject);
    const bool IsNativeTakeJsRef = (IsCDO || IsUClass) ? false : ClassWrapperIsNativeTakeJsRef;
#endif
    struct pesapi_ffi* Apis = MainApis;

    auto Binding = new FUObjectBinding();
    Binding->Object = UEObject;
    Binding->WeakObject = UEObject;
    Binding->Class = UEObject->GetClass();
    Binding->Finalize = &OnBindingFinalize;
    Binding->Owner = this;
    if (!JSObject)
    {
        // the binding is owned by the wrapper, freed by the finalizer of the class (FClassWrapper::ReflectedFinalize)
        JSObject = Apis->native_object_to_value(Env, static_cast<FStructWrapper*>(ClassWrapper), Binding, true);
    }
    Binding->JsObject.Reset(Apis, Env, JSObject);
    ObjectMap.Emplace(UEObject, Binding);

    if (!IsNativeTakeJsRef)
    {
        SetJsTakeRef(Env, UEObject);
    }
    return Binding;
}

void FJsEnvImpl::SetJsTakeRef(pesapi_env Env, UObject* UEObject)
{
    if (auto BindingPtr = ObjectMap.Find(UEObject))
    {
        UserObjectRetainer.Retain(UEObject);
        (*BindingPtr)->JsObject.SetWeak(Env);
    }
}

void FJsEnvImpl::OnBindingFinalize(FUObjectHandle* Handle)
{
    // the wrapper is garbage collected (or the env is disposed)
    auto Binding = static_cast<FUObjectBinding*>(Handle);
    auto Self = Binding->Owner;
    if (Binding->Object)
    {
        auto BindingPtr = Self->ObjectMap.Find(Binding->Object);
        if (BindingPtr && *BindingPtr == Binding)
        {
            Self->ObjectMap.Remove(Binding->Object);
            Self->UserObjectRetainer.Release(Binding->Object);
        }
    }
    else
    {
        Self->ReleasedObjectBindings.Remove(Binding);
    }
    delete Binding;
}

void FJsEnvImpl::UnBind(UObject* UEObject)
{
    FUObjectBinding* Binding = nullptr;
    if (ObjectMap.RemoveAndCopyValue(UEObject, Binding))
    {
        UserObjectRetainer.Release(UEObject);
        // the UObject is destroyed while the js object may be still alive: detach the handle (any access from js reports an
        // invalid object from now on) and keep it until the wrapper is garbage collected
        Binding->Object = nullptr;
        Binding->WeakObject.Reset();
        Binding->JsObject.Reset();
        ReleasedObjectBindings.Add(Binding);
    }
}

pesapi_value FJsEnvImpl::FindOrAdd(pesapi_env Env, UClass* Class, UObject* UEObject, bool SkipTypeScriptInitial)
{
    if (!UEObject)
    {
        return MainApis->create_null(Env);
    }

    if (auto BindingPtr = ObjectMap.Find(UEObject))
    {
        return (*BindingPtr)->JsObject.Get(Env);
    }

    // create and link
    bool Existed;
    auto TemplateInfoPtr = GetTemplateInfoOfType(Env, Class, Existed);
    const bool IsTypeScriptGeneratedClass = TemplateInfoPtr->IsTypeScriptGeneratedClass;
    pesapi_value Result = nullptr;
    AddBinding(Env, static_cast<FClassWrapper*>(TemplateInfoPtr->StructWrapper.get()), TemplateInfoPtr->IsNativeTakeJsRef, UEObject,
        Result);
    if (!SkipTypeScriptInitial && IsTypeScriptGeneratedClass)
    {
        TypeScriptInitial(UEObject->GetClass(), UEObject);
    }
    return Result;
}

pesapi_value FJsEnvImpl::FindOrAddStruct(pesapi_env Env, UScriptStruct* ScriptStruct, void* Ptr, bool PassByPointer)
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

pesapi_value FJsEnvImpl::FindOrAddDelegate(
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

pesapi_value FJsEnvImpl::CreateArray(pesapi_env Env, FPropertyTranslator* Property, void* ArrayPtr)
{
    // a fixed size array is a view of its outer, never cached
    auto Holder = new FContainerHolder{ArrayPtr, FFixSizeArrayWrapper::GetClassDefinition()->TypeId, Property, nullptr,
        Property->Property, nullptr, nullptr, false};
    return MainApis->native_object_to_value(Env, Holder->TypeId, Holder, true);
}

void FJsEnvImpl::InvokeDelegateCallback(UDynamicDelegateProxy* Proxy, void* Params)
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

#if !defined(ENGINE_INDEPENDENT_JSENV)
void FJsEnvImpl::JsConstruct(UClass* Class, UObject* Object, pesapi_value_ref Constructor, pesapi_value_ref Prototype)
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
    pesapi_value_ref AnyRef = Prototype ? Prototype : Constructor;
    if (!AnyRef)
    {
        return;    // released, the env is shutting down
    }

    struct pesapi_ffi* Apis = MainApis;
    pesapi_env_ref EnvRef = Apis->get_ref_associated_env(AnyRef);
    pesapi_scope_memory ScopeMemory;
    pesapi_scope Scope = Apis->open_scope_placement(EnvRef, &ScopeMemory);
    pesapi_env Env = Apis->get_env_from_ref(EnvRef);

    pesapi_value JSObject = FindOrAdd(Env, Class, Object);
    // 过时功能(makeUClass)用不影响现有功能的方式修改: 由js持有引用改为native持有js的强引用, 句柄保持不变
    if (auto BindingPtr = ObjectMap.Find(Object))
    {
        UserObjectRetainer.Release(Object);
        (*BindingPtr)->JsObject.Reset(Apis, Env, JSObject);
    }

    if (Prototype && ObjectSetPrototypeOf)
    {
        pesapi_value Args[] = {JSObject, Apis->get_value_from_ref(Env, Prototype)};
        Apis->call_function(Env, ObjectSetPrototypeOf.Get(Env), nullptr, 2, Args);
    }

    if (Constructor)
    {
        Apis->call_function(Env, Apis->get_value_from_ref(Env, Constructor), JSObject, 0, nullptr);
    }

    if (Apis->has_caught(Scope))
    {
        Logger->Error(FString::Printf(TEXT("js callback exception %s"), UTF8_TO_TCHAR(Apis->get_exception_as_string(Scope, true))));
    }
    Apis->close_scope_placement(Scope);
}

void FJsEnvImpl::TsConstruct(UTypeScriptGeneratedClass* Class, UObject* Object)
{
#ifndef THREAD_SAFE
    if (!IsInGameThread())
    {
        Logger->Error(FString::Printf(TEXT("Construct TypeScript Object %s(%p) on illegal thread!"), *Object->GetName(), Object));
    }
#endif
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
    struct pesapi_ffi* Apis = MainApis;
    FPapiEnvScope EnvScope(Apis, MainEnvRef);
    if (!EnvScope)
    {
        return;
    }
    bool IsCDO = Object->HasAnyFlags(RF_ClassDefaultObject | RF_ArchetypeObject);

    UObject* CDO = Class->GetDefaultObject(false);
    if (CDO != Object && IsCDO)    // blueprint extend a ts
    {
        UClass* ObjClass = Object->GetClass();

        while (ObjClass && !ObjClass->IsNative() && !static_cast<UObject*>(ObjClass)->IsA<UTypeScriptGeneratedClass>())
        {
            // Logger->Warn(FString::Printf(TEXT("release %s in  %s(%p) construct"), *ObjClass->GetName(), *Object->GetName(),
            // Object));
            TryReleaseType(ObjClass);
            ObjClass = ObjClass->GetSuperClass();
        }
    }

    auto BindInfoPtr = BindInfoMap.Find(Class);

    if (!BindInfoPtr || BindInfoPtr->InjectNotFinished)
    {
        // Logger->Warn(FString::Printf(TEXT("force %s injection in %s(%p) construct"), *Class->GetName(), *Object->GetName(),
        // Object));
        MakeSureInject(Class, true, false);
        if (!IsCDO)    // finish inject in first non-CDO construct
        {
            // Logger->Warn(FString::Printf(TEXT("finish %s injection in %s(%p) construct"), *Class->GetName(), *Object->GetName(),
            // Object));
            FinishInjection(Class);
        }
        BindInfoPtr = BindInfoMap.Find(Class);
    }

    if (BindInfoPtr && BindInfoPtr->Prototype)
    {
        pesapi_env Env = EnvScope.GetEnv();

        pesapi_value JSObject;
        auto BindingPtr = ObjectMap.Find(Object);
        if (!BindingPtr)
        {
            JSObject = FindOrAdd(Env, Object->GetClass(), Object, true);

            // FindOrAdd may change BindInfoMap, cause a rehash
            BindInfoPtr = BindInfoMap.Find(Class);
        }
        else
        {
            JSObject = (*BindingPtr)->JsObject.Get(Env);
        }

        if (BindInfoPtr)
        {
            //假如是UTypeScriptGeneratedClass的对象，设置成间接Prototype，后续刷新代码对象会自动更新
            if (Object->GetClass() == Class)
            {
                pesapi_value SetPrototypeOf =
                    GetCachedJsFunction(Apis, Env, ObjectSetPrototypeOf, "Object.setPrototypeOf", "puerts/object_set_prototype_of");
                if (SetPrototypeOf)
                {
                    pesapi_value Args[] = {JSObject, BindInfoPtr->Prototype.Get(Env)};
                    Apis->call_function(Env, SetPrototypeOf, nullptr, 2, Args);
                }
            }

            if (BindInfoPtr->Constructor)
            {
                Apis->call_function(Env, BindInfoPtr->Constructor.Get(Env), JSObject, 0, nullptr);
            }
        }

        if (EnvScope.HasCaught())
        {
            Logger->Error(FString::Printf(TEXT("js callback exception %s"), UTF8_TO_TCHAR(EnvScope.GetExceptionAsString())));
        }
    }
    else if (!Object->HasAnyFlags(RF_ClassDefaultObject | RF_ArchetypeObject))
    {
        Logger->Error(FString::Printf(TEXT("Construct TypeScript Object fail for %s"), *Class->GetName()));
    }
}
#endif

void FJsEnvImpl::NotifyUObjectDeleted(const class UObjectBase* ObjectBase, int32 Index)
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
#ifdef THREAD_SAFE
    FPapiEnvScope ThreadSafeScope(MainApis, MainEnvRef);
#endif

    TryReleaseType((UStruct*) ObjectBase);

#if !defined(ENGINE_INDEPENDENT_JSENV)
    BindInfoMap.Remove((UTypeScriptGeneratedClass*) ObjectBase);
#endif

    UnBind((UObject*) ObjectBase);

    GeneratedClasses.Remove((UClass*) ObjectBase);

    TsFunctionMap.Remove((UFunction*) ObjectBase);
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

void FJsEnvImpl::TryReleaseType(UStruct* Struct)
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
void FJsEnvImpl::InvokeJsMethod(UObject* ContextObject, UJSGeneratedFunction* Function, FFrame& Stack, void* RESULT_PARAM)
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
    if (!Function->JsFunction)
    {
        Logger->Error(FString::Printf(TEXT("call %s::%s of %p fail: can not find Binded JavaScript Function"),
            *ContextObject->GetClass()->GetName(), *Function->GetName(), ContextObject));
        SkipFunction(Stack, RESULT_PARAM, Function);
        return;
    }

    struct pesapi_ffi* Apis = MainApis;
    pesapi_env_ref EnvRef = Apis->get_ref_associated_env(Function->JsFunction.GetRef());
    pesapi_scope_memory ScopeMemory;
    pesapi_scope Scope = Apis->open_scope_placement(EnvRef, &ScopeMemory);
    pesapi_env Env = Apis->get_env_from_ref(EnvRef);

    pesapi_value Self = nullptr;
    auto GeneratedObjectPtr = ObjectMap.Find(ContextObject);
    if (GeneratedObjectPtr)
    {
        // the binding of a makeUClass object holds its js object strongly (see JsConstruct)
        Self = (*GeneratedObjectPtr)->JsObject.Get(Env);
    }

    if (!Self)
    {
        Logger->Error(FString::Printf(TEXT("call %s::%s of %p fail: can not find Binded JavaScript Object"),
            *ContextObject->GetClass()->GetName(), *Function->GetName(), ContextObject));
        SkipFunction(Stack, RESULT_PARAM, Function);
        Apis->close_scope_placement(Scope);
        return;
    }

    Function->FunctionTranslator->CallJs(Apis, Env, Function->JsFunction.Get(Env), Self, ContextObject, Stack, RESULT_PARAM);

    if (Apis->has_caught(Scope))
    {
        Logger->Error(FString::Printf(TEXT("call %s::%s of %p fail: %s"), *ContextObject->GetClass()->GetName(),
            *Function->GetName(), ContextObject, UTF8_TO_TCHAR(Apis->get_exception_as_string(Scope, true))));
    }
    Apis->close_scope_placement(Scope);
}

void FJsEnvImpl::InvokeMixinMethod(UObject* ContextObject, UJSGeneratedFunction* Function, FFrame& Stack, void* RESULT_PARAM)
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

void FJsEnvImpl::TypeScriptInitial(UClass* Class, UObject* Object, const bool TypeScriptClassFound)
{
    if (auto TypeScriptGeneratedClass = Cast<UTypeScriptGeneratedClass>(Class))
    {
        TypeScriptInitial(Class->GetSuperClass(), Object, true);
        TsConstruct(TypeScriptGeneratedClass, Object);
    }
    else if (!TypeScriptClassFound)
    {
        TypeScriptInitial(Class->GetSuperClass(), Object, false);
    }
}

void FJsEnvImpl::InvokeTsMethod(UObject* ContextObject, UFunction* Function, FFrame& Stack, void* RESULT_PARAM)
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
    struct pesapi_ffi* Apis = MainApis;
    FPapiEnvScope EnvScope(Apis, MainEnvRef);
    if (!EnvScope)
    {
        SkipFunction(Stack, RESULT_PARAM, Function);
        return;
    }
    auto FuncInfo = TsFunctionMap.Find(Function);
    if (!FuncInfo)
    {
        auto Class = Cast<UTypeScriptGeneratedClass>(Function->GetOuterUClassUnchecked());
        MakeSureInject(Class, true, false);
        FinishInjection(Class);
        FuncInfo = TsFunctionMap.Find(Function);
        if (!FuncInfo)
        {
            Logger->Error(FString::Printf(TEXT("call %s::%s of %p fail: can not find Binded JavaScript Function"),
                *ContextObject->GetClass()->GetName(), *Function->GetName(), ContextObject));
            SkipFunction(Stack, RESULT_PARAM, Function);
            return;
        }
    }

    if (!FuncInfo->JsFunction)
    {
        Logger->Error(FString::Printf(TEXT("call %s::%s of %p fail: can not find Binded JavaScript Function"),
            *ContextObject->GetClass()->GetName(), *Function->GetName(), ContextObject));
        SkipFunction(Stack, RESULT_PARAM, Function);
        return;
    }

    pesapi_env Env = EnvScope.GetEnv();

    // FindOrAdd may inject a ts class and rehash TsFunctionMap, read FuncInfo before it
    pesapi_value JsFunction = FuncInfo->JsFunction.Get(Env);
    FFunctionTranslator* FunctionTranslator = FuncInfo->FunctionTranslator.get();

    pesapi_value Self = nullptr;
    if (!Function->HasAnyFunctionFlags(FUNC_Static))
    {
        Self = FindOrAdd(Env, ContextObject->GetClass(), ContextObject);
    }

    FunctionTranslator->CallJs(Apis, Env, JsFunction, Self, ContextObject, Stack, RESULT_PARAM);

    if (EnvScope.HasCaught())
    {
        Logger->Error(FString::Printf(TEXT("call %s::%s of %p fail: %s"), *ContextObject->GetClass()->GetName(),
            *Function->GetName(), ContextObject, UTF8_TO_TCHAR(EnvScope.GetExceptionAsString())));
    }
}

void FJsEnvImpl::NotifyReBind(UTypeScriptGeneratedClass* Class)
{
    struct pesapi_ffi* Apis = MainApis;
    FPapiEnvScope EnvScope(Apis, MainEnvRef);
    if (!EnvScope)
    {
        return;
    }
    MakeSureInject(Class, false, false);
    FinishInjection(Class);

#if WITH_EDITOR
    while (UTypeScriptGeneratedClass* SuperCls = Cast<UTypeScriptGeneratedClass>(Class->GetSuperClass()))
    {
        Class = SuperCls;
    }
    {
        pesapi_env Env = EnvScope.GetEnv();

        for (TWeakObjectPtr<UObject>& Iter : Class->GeneratedObjects)
        {
            auto Object = Iter.Get();
            if (!Object || ObjectMap.Find(Object))
                continue;
            if (Object->GetClass()->GetName().StartsWith(TEXT("REINST_")))
                continue;    //跳过父类重新编译后临时状态的对象
            (void) FindOrAdd(Env, Object->GetClass(), Object, true);

            UTypeScriptGeneratedClass* ClassMayNeedReBind = nullptr;
            auto TempClass = Object->GetClass();

            while (TempClass && (TempClass != Class) && (!ClassMayNeedReBind))
            {
                ClassMayNeedReBind = Cast<UTypeScriptGeneratedClass>(TempClass);
                TempClass = TempClass->GetSuperClass();
            }
            if (ClassMayNeedReBind)
            {
                MakeSureInject(ClassMayNeedReBind, false, false);
            }
        }
    }
#endif
    if (EnvScope.HasCaught())
    {
        Logger->Error(FString::Printf(TEXT("rebind exception %s"), UTF8_TO_TCHAR(EnvScope.GetExceptionAsString())));
    }
}
#endif

void FJsEnvImpl::ExecuteDelegate(pesapi_env Env, pesapi_callback_info Info, void* DelegatePtr)
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

bool FJsEnvImpl::AddToDelegate(pesapi_env Env, void* DelegatePtr, pesapi_value JsFunction)
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

PropertyMacro* FJsEnvImpl::FindDelegateProperty(void* DelegatePtr)
{
    auto Iter = DelegateMap.find(DelegatePtr);
    if (Iter == DelegateMap.end())
    {
        return nullptr;
    }
    return Iter->second.DelegateProperty ? (PropertyMacro*) Iter->second.DelegateProperty
                                         : (PropertyMacro*) Iter->second.MulticastDelegateProperty;
}

static pesapi_value CallJsMapMethod(
    struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Map, const char* Method, int Argc, pesapi_value* Argv)
{
    return Apis->call_function(Env, Apis->get_property(Env, Map, Method), Map, Argc, Argv);
}

FScriptDelegate FJsEnvImpl::NewDelegate(pesapi_env Env, UObject* Owner, pesapi_value JsFunction, UFunction* SignatureFunction)
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
        pesapi_value CallbacksMap = ManualReleaseCallbackMap.Get(Env);
        pesapi_value GetArgs[] = {JsFunction};
        pesapi_value Id = CallJsMapMethod(Apis, Env, CallbacksMap, "get", 1, GetArgs);
        TWeakObjectPtr<UDynamicDelegateProxy>* Found =
            (Id && Apis->is_uint32(Env, Id)) ? ManualReleaseCallbacks.Find(Apis->get_value_uint32(Env, Id)) : nullptr;

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
            pesapi_value SetArgs[] = {JsFunction, Apis->create_uint32(Env, ManualReleaseCallbackId)};
            CallJsMapMethod(Apis, Env, CallbacksMap, "set", 2, SetArgs);
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

void FJsEnvImpl::ReleaseManualReleaseDelegate(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CHECK_ARGS(EArgFunction);

    pesapi_env Env = Apis->get_env(Info);
    pesapi_value CallbacksMap = ManualReleaseCallbackMap.Get(Env);
    pesapi_value Args[] = {Apis->get_arg(Info, 0)};
    pesapi_value Id = CallJsMapMethod(Apis, Env, CallbacksMap, "get", 1, Args);
    if (Id && Apis->is_uint32(Env, Id))
    {
        CallJsMapMethod(Apis, Env, CallbacksMap, "delete", 1, Args);
        TWeakObjectPtr<UDynamicDelegateProxy> DelegateProxy;
        if (ManualReleaseCallbacks.RemoveAndCopyValue(Apis->get_value_uint32(Env, Id), DelegateProxy) && DelegateProxy.IsValid())
        {
            DelegateProxy->ResetJsFunction();
            SysObjectRetainer.Release(DelegateProxy.Get());
        }
    }
}

bool FJsEnvImpl::RemoveFromDelegate(pesapi_env Env, void* DelegatePtr, pesapi_value JsFunction)
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

bool FJsEnvImpl::ClearDelegate(pesapi_env Env, void* DelegatePtr)
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

bool FJsEnvImpl::CheckDelegateProxies(float Tick)
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

FPropertyTranslator* FJsEnvImpl::GetContainerPropertyTranslator(PropertyMacro* Property)
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

pesapi_value FJsEnvImpl::FindOrAddContainer(pesapi_env Env, const JSClassDefinition* ClassDefinition, void* Ptr,
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

bool FJsEnvImpl::IsTriviallyFreed(FScriptStructWrapper* Wrapper)
{
    UScriptStruct* Struct = Wrapper->Struct.IsValid() ? Cast<UScriptStruct>(Wrapper->Struct.Get()) : nullptr;
    return Struct && (Struct->StructFlags & EStructFlags::STRUCT_IsPlainOldData);
}

// the deleter of a pod struct whose memory is freed with its js object (may be called on a gc thread of the backend, safe
// for pod), FScriptStructWrapper is process wide (see FStructWrapper::FindOrAdd), it outlives the env
void FJsEnvImpl::FreeTriviallyFreedStruct(void* Ptr, size_t Size, void* DeleterData)
{
    FScriptStructWrapper* StructInfo = static_cast<FScriptStructWrapper*>(DeleterData);
    FScriptStructWrapper::Free(StructInfo->Struct, StructInfo->ExternalFinalize, Ptr);
}

bool FJsEnvImpl::TryBindOwnedStruct(pesapi_callback_info Info, FScriptStructWrapper* Wrapper, void* Ptr)
{
    // not cached, the type id is the wrapper
    return IsTriviallyFreed(Wrapper) && Backend->BindTriviallyFreedObject(Info, static_cast<FStructWrapper*>(Wrapper), Ptr,
                                            Wrapper->Struct->GetStructureSize(), &FreeTriviallyFreedStruct, Wrapper);
}

std::shared_ptr<FStructWrapper> FJsEnvImpl::GetStructWrapper(UStruct* InStruct)
{
    return FStructWrapper::FindOrAdd(InStruct);
}

FJsEnvImpl::FTemplateInfo* FJsEnvImpl::GetTemplateInfoOfType(pesapi_env Env, UStruct* InStruct, bool& Existed)
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
        else
        {
            auto Class = Cast<UClass>(InStruct);
            check(Class);
#if PUERTS_KEEP_UOBJECT_REFERENCE
            const bool IsTsClass = IsTypeScriptGeneratedClass(Class);
            TemplateInfo.IsTypeScriptGeneratedClass = IsTsClass;
            if (IsTsClass)
            {
                TemplateInfo.IsNativeTakeJsRef = true;
            }
#endif
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

// a js name may differ from the FName only in case (FName is case insensitive), the proxy at the end of the prototype chain
// fixes the name by FName when a member is not found, and caches the member on its owner by the requested name
static const char* FNameFixingProxyFactory = R"((function (fixName) {
    var getProto = Object.getPrototypeOf, getDesc = Object.getOwnPropertyDescriptor, define = Object.defineProperty;
    var proxy;
    function fix(receiver, key) {
        if (typeof key !== 'string' || key.length === 0 || key.length >= 1024) return undefined;
        var fixed = fixName(key);
        if (fixed === key) return undefined;
        for (var p = receiver; p !== null && p !== proxy; p = getProto(p)) {
            var d = getDesc(p, fixed);
            if (d) {
                if (p !== receiver) {
                    define(p, key, ('get' in d) ? {get: d.get, set: d.set, enumerable: true, configurable: true}
                        : {value: d.value, writable: d.writable, enumerable: true, configurable: true});
                }
                return fixed;
            }
        }
        return undefined;
    }
    proxy = new Proxy({}, {
        get: function (t, key, receiver) {
            if (!(key in t)) {
                var fixed = fix(receiver, key);
                if (fixed !== undefined) return receiver[fixed];
            }
            return Reflect.get(t, key, receiver);
        },
        set: function (t, key, value, receiver) {
            if (!(key in t)) {
                var fixed = fix(receiver, key);
                if (fixed !== undefined) {
                    receiver[fixed] = value;
                    return true;
                }
            }
            return Reflect.set(t, key, value, receiver);
        }
    });
    return proxy;
}))";

void FJsEnvImpl::InstallFNameFixing(pesapi_env Env, pesapi_value Class)
{
    struct pesapi_ffi* Apis = MainApis;
    if (!Class)
    {
        return;
    }
    if (!FNameFixingProxy)
    {
        FPapiValueRef Factory;
        pesapi_value FactoryFunc = GetCachedJsFunction(Apis, Env, Factory, FNameFixingProxyFactory, "puerts/fname_fixing_proxy");
        if (!FactoryFunc)
        {
            return;
        }
        pesapi_value Args[] = {Apis->create_function(Env, &FixFNameCase, nullptr, nullptr)};
        pesapi_value Proxy = Apis->call_function(Env, FactoryFunc, nullptr, 1, Args);
        Factory.Reset();
        if (!Proxy || !Apis->is_object(Env, Proxy))
        {
            return;
        }
        FNameFixingProxy.Reset(Apis, Env, Proxy);
    }
    pesapi_value SetPrototypeOf =
        GetCachedJsFunction(Apis, Env, ObjectSetPrototypeOf, "Object.setPrototypeOf", "puerts/object_set_prototype_of");
    if (!SetPrototypeOf)
    {
        return;
    }
    pesapi_value Proto = Apis->get_property(Env, Class, "prototype");
    if (Apis->is_object(Env, Proto))
    {
        pesapi_value Args[] = {Proto, FNameFixingProxy.Get(Env)};
        Apis->call_function(Env, SetPrototypeOf, nullptr, 2, Args);
    }
}

pesapi_value FJsEnvImpl::GetJsClass(pesapi_env Env, UStruct* InStruct)
{
    bool Existed;
    auto TemplateInfo = GetTemplateInfoOfType(Env, InStruct, Existed);
    pesapi_value Ret = MainApis->create_class(Env, TemplateInfo->StructWrapper.get());

    if (UNLIKELY(!Existed) && Ret)    // first create
    {
        auto Class = Cast<UClass>(InStruct);
#if !defined(ENGINE_INDEPENDENT_JSENV)
        if (Class && !Class->IsNative() && !InStruct->IsA<UTypeScriptGeneratedClass>())
        {
            auto SuperClass = Cast<UTypeScriptGeneratedClass>(Class->GetSuperClass());
            if (SuperClass)
            {
                MakeSureInject(SuperClass, false, false);
                auto SuperBindInfo = BindInfoMap.Find(SuperClass);
                if (SuperBindInfo && SuperBindInfo->Prototype)
                {
                    struct pesapi_ffi* Apis = MainApis;
                    pesapi_value Proto = Apis->get_property(Env, Ret, "prototype");
                    pesapi_value SetPrototypeOf = Apis->is_object(Env, Proto)
                                                      ? GetCachedJsFunction(Apis, Env, ObjectSetPrototypeOf,
                                                            "Object.setPrototypeOf", "puerts/object_set_prototype_of")
                                                      : nullptr;
                    if (SetPrototypeOf)
                    {
                        pesapi_value Args[] = {Proto, SuperBindInfo->Prototype.Get(Env)};
                        Apis->call_function(Env, SetPrototypeOf, nullptr, 2, Args);
                    }
                }
            }
        }
#endif
    }

    return Ret;
}

bool FJsEnvImpl::IsInstanceOf(pesapi_env Env, UStruct* Struct, pesapi_value JsObject)
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

void FJsEnvImpl::OnClassInvalidated(const void* TypeId)
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

bool FJsEnvImpl::OnReflectedClassCreated(const JSClassDefinition* ClassDefinition)
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

pesapi_value FJsEnvImpl::UETypeToJsClass(pesapi_env Env, UField* Type)
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
        Apis->set_property(Env, Result, "__puerts_ufield", FindOrAdd(Env, Enum->GetClass(), Enum, false));
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

void FJsEnvImpl::LoadUEType(struct pesapi_ffi* Apis, pesapi_callback_info Info)
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

void FJsEnvImpl::LoadCppType(struct pesapi_ffi* Apis, pesapi_callback_info Info)
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

void FJsEnvImpl::UEClassToJSClass(struct pesapi_ffi* Apis, pesapi_callback_info Info)
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

void FJsEnvImpl::SetJsTakeRefInTs(struct pesapi_ffi* Apis, pesapi_callback_info Info)
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

bool FJsEnvImpl::GetContainerTypeProperty(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value, PropertyMacro** PropertyPtr)
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

void FJsEnvImpl::NewContainer(struct pesapi_ffi* Apis, pesapi_callback_info Info)
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

void FJsEnvImpl::Start(const FString& ModuleNameOrScript, const TArray<TPair<FString, UObject*>>& Arguments)
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

bool FJsEnvImpl::LoadFile(const FString& RequiringDir, const FString& ModuleName, FString& OutPath, FString& OutDebugPath,
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

void FJsEnvImpl::ExecuteModule(const FString& ModuleName)
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
#ifndef WITH_QUICKJS
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
#endif
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

pesapi_value FJsEnvImpl::RequireModule(struct pesapi_ffi* Apis, pesapi_env Env, const FString& ModuleName)
{
    return Backend->ExecuteModule(Env, TCHAR_TO_UTF8(*ModuleName), "", false);
}

void FJsEnvImpl::Log(struct pesapi_ffi* Apis, pesapi_callback_info Info)
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

void FJsEnvImpl::LoadModule(struct pesapi_ffi* Apis, pesapi_callback_info Info)
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

#ifndef WITH_QUICKJS
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
void FJsEnvImpl::HostResolveModule(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CHECK_ARGS(EArgString, EArgString, EArgString);

    pesapi_env Env = Apis->get_env(Info);
    FString Specifier = PapiUtils::ToFString(Apis, Env, Apis->get_arg(Info, 0));
    FString Referrer = PapiUtils::ToFString(Apis, Env, Apis->get_arg(Info, 1));
    bool ByRequire = PapiUtils::ToFString(Apis, Env, Apis->get_arg(Info, 2)) == TEXT("require");
#if defined(WITH_NODEJS)
    // the require of node first (its builtin and node_modules), as modular.js did, a bare name only since it is
    // registered as a builtin module
    if (ByRequire && NodeRequire && !Specifier.StartsWith(TEXT(".")) && !Specifier.StartsWith(TEXT("/")))
    {
        bool Found = false;
        pesapi_env_ref EnvRef = Apis->create_env_ref(Env);
        pesapi_scope_memory ScopeMemory;
        pesapi_scope Scope = Apis->open_scope_placement(EnvRef, &ScopeMemory);
        pesapi_value Arg = Apis->get_arg(Info, 0);
        pesapi_value Exports = Apis->call_function(Env, NodeRequire.Get(Env), nullptr, 1, &Arg);
        if (!Apis->has_caught(Scope) && Exports)
        {
            Backend->RegisterBuiltinModule(Env, TCHAR_TO_UTF8(*Specifier), Exports);
            Found = true;
        }
        Apis->close_scope_placement(Scope);
        Apis->release_env_ref(EnvRef);
        if (Found)
        {
            Apis->add_return(Info, PapiUtils::FromFString(Apis, Env, Specifier));
            return;
        }
    }
#endif
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
void FJsEnvImpl::HostLoadModule(struct pesapi_ffi* Apis, pesapi_callback_info Info)
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

    if (OnSourceLoadedCallback)
    {
        OnSourceLoadedCallback(DebugPath);
    }
}
#endif

void FJsEnvImpl::SetTimeout(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CHECK_ARGS(EArgFunction, EArgNumber);

    SetFTickerDelegate(Apis, Info, false);
}

void FJsEnvImpl::SetFTickerDelegate(struct pesapi_ffi* Apis, pesapi_callback_info Info, bool Continue)
{
    pesapi_env Env = Apis->get_env(Info);

    while (!(++TimerID))    // TimerID > 0
    {
    }
    uint32_t DelegateHandleId = TimerID;
    // the id wrapped around and is still in use
    RemoveFTickerDelegateHandle(DelegateHandleId);
    FTimerInfo& TimerInfo = TimerInfos.Emplace(DelegateHandleId, FTimerInfo());
    TimerInfo.Callback = Apis->create_value_ref(Env, Apis->get_arg(Info, 0), 0);

    float Millisecond = Apis->get_value_double(Env, Apis->get_arg(Info, 1));
    float Delay = Millisecond / 1000.f;

    TimerInfo.TickerHandle =
        FUETicker::GetCoreTicker().AddTicker(FTickerDelegate::CreateLambda([this, DelegateHandleId, Continue](float)
                                                 { return this->TimerCallback(DelegateHandleId, Continue); }),
            Delay);

    Apis->add_return(Info, Apis->create_uint32(Env, DelegateHandleId));
}

bool FJsEnvImpl::TimerCallback(int DelegateHandleId, bool Continue)
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif

    FTimerInfo* PTimeInfo = TimerInfos.Find(DelegateHandleId);
    if (!PTimeInfo)
    {
        Logger->Warn(FString::Printf(TEXT("Try to callback a invalid timer: %d"), DelegateHandleId));
        return false;
    }

    auto OriginHandle = PTimeInfo->TickerHandle;

    {
        struct pesapi_ffi* Apis = MainApis;
        pesapi_env_ref EnvRef = Apis->get_ref_associated_env(PTimeInfo->Callback);
        pesapi_scope_memory ScopeMemory;
        // locks the isolate (THREAD_SAFE), enters the context of the timer and catches exceptions
        pesapi_scope Scope = Apis->open_scope_placement(EnvRef, &ScopeMemory);
        pesapi_env Env = Apis->get_env_from_ref(EnvRef);
        pesapi_value Function = Apis->get_value_from_ref(Env, PTimeInfo->Callback);

        Apis->call_function(Env, Function, Apis->global(Env), 0, nullptr);

        if (Apis->has_caught(Scope))
        {
            Logger->Error(FString::Printf(
                TEXT("Exception in Timer Callback: %s"), UTF8_TO_TCHAR(Apis->get_exception_as_string(Scope, true))));
        }
        Apis->close_scope_placement(Scope);
    }

    auto ClearInCallback = !TimerInfos.Contains(DelegateHandleId) || (OriginHandle != TimerInfos[DelegateHandleId].TickerHandle);

    if (!Continue && !ClearInCallback)
    {
        RemoveFTickerDelegateHandle(DelegateHandleId);
    }

    return Continue && !ClearInCallback;
}

void FJsEnvImpl::RemoveFTickerDelegateHandle(int DelegateHandleId)
{
    FTimerInfo* PTimeInfo = TimerInfos.Find(DelegateHandleId);
    if (!PTimeInfo)
    {
        return;
    }
    FUETicker::GetCoreTicker().RemoveTicker(PTimeInfo->TickerHandle);
    MainApis->release_value_ref(PTimeInfo->Callback);
    TimerInfos.Remove(DelegateHandleId);
}

void FJsEnvImpl::ClearInterval(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);

    // todo - mocha 7.0.1，当reporter为JSON，调用clearTimeout时，可能不传值，或传Null、Undefined过来。暂将其忽略
    if (Apis->get_args_len(Info) == 0)
    {
        Logger->Warn(TEXT("Calling ClearInterval with 0 argument."));
    }
    else if (Apis->is_null(Env, Apis->get_arg(Info, 0)) || Apis->is_undefined(Env, Apis->get_arg(Info, 0)))
    {
        // 屏蔽这条只在mocha中出现的警告
        // Logger->Warn(TEXT("Calling ClearInterval with a Null or Undefined."));
    }
    else
    {
        PAPI_CHECK_ARGS(EArgInt32);
        int HandleId = Apis->get_value_int32(Env, Apis->get_arg(Info, 0));
        RemoveFTickerDelegateHandle(HandleId);
    }
}

void FJsEnvImpl::SetInterval(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CHECK_ARGS(EArgFunction, EArgNumber);

    SetFTickerDelegate(Apis, Info, true);
}

void FJsEnvImpl::IsQuickJS(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
#ifdef WITH_QUICKJS
    Apis->add_return(Info, Apis->create_boolean(Apis->get_env(Info), true));
#else
    Apis->add_return(Info, Apis->create_boolean(Apis->get_env(Info), false));
#endif
}

#if !defined(ENGINE_INDEPENDENT_JSENV)
void FJsEnvImpl::MakeUClass(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CHECK_ARGS(EArgFunction, EArgObject, EArgString, EArgObject, EArgObject);

    pesapi_env Env = Apis->get_env(Info);

    pesapi_value Constructor = Apis->get_arg(Info, 0);
    pesapi_value Prototype = Apis->get_arg(Info, 1);
    FString ClassName = PapiUtils::ToFString(Apis, Env, Apis->get_arg(Info, 2));
    pesapi_value Methods = Apis->get_arg(Info, 3);

    UClass* ParentUClass = nullptr;
    if (UObject* Object = PapiUtils::GetUObject(Apis, Env, Apis->get_arg(Info, 4)))
    {
        if (PapiUtils::IsReleasedPtr(Object))
        {
            Apis->throw_by_string(Info, "passing a invalid object");
            return;
        }
        ParentUClass = Cast<UClass>(Object);
    }

    if (!ParentUClass)
    {
        Apis->throw_by_string(Info, "#4 parameter expect a UClass object");
        return;
    }

    // papi has no set_prototype, JsConstruct uses the cached Object.setPrototypeOf
    if (!GetCachedJsFunction(Apis, Env, ObjectSetPrototypeOf, "Object.setPrototypeOf", "puerts/object_set_prototype_of"))
    {
        return;    // the exception propagates to the js caller
    }

    FString GenClassName;
    int i = 0;
    while (true)
    {
        GenClassName = FString::Printf(TEXT("%s%d"), *ClassName, i);
        if (!FindAnyType<UClass>(GenClassName))
            break;
        i++;
    }

    auto Class = UJSGeneratedClass::Create(GenClassName, ParentUClass, DynamicInvoker, Apis, Env, Constructor, Prototype);

    TSet<FName> overrided;

    for (TFieldIterator<UFunction> It(ParentUClass, EFieldIteratorFlags::IncludeSuper, EFieldIteratorFlags::ExcludeDeprecated,
             EFieldIteratorFlags::IncludeInterfaces);
         It; ++It)
    {
        UFunction* Function = *It;
        auto FunctionFName = Function->GetFName();
        if (!overrided.Contains(FunctionFName) && Function->HasAnyFunctionFlags(FUNC_BlueprintEvent))
        {
            pesapi_value Value = Apis->get_property(Env, Methods, TCHAR_TO_UTF8(*Function->GetName()));
            if (Value && Apis->is_function(Env, Value))
            {
                // Logger->Warn(FString::Printf(TEXT("override: %s"), *Function->GetName()));
                UJSGeneratedClass::Override(Apis, Env, Class, Function, Value, DynamicInvoker, true);
                overrided.Add(FunctionFName);
            }
        }
    }

    Class->Bind();
    Class->StaticLink(true);

    // Make sure CDO is ready for use
    (void) (Class->GetDefaultObject());

#if ENGINE_MAJOR_VERSION == 4 && ENGINE_MINOR_VERSION > 12
    // Assemble reference token stream for garbage collection/ RTGC.
    if (!Class->HasAnyClassFlags(CLASS_TokenStreamAssembled))
    {
        Class->AssembleReferenceTokenStream();
    }
#endif
    if (!GeneratedClasses.Contains(Class))
    {
        GeneratedClasses.Add(Class);
    }
    SysObjectRetainer.Retain(Class);

    Apis->add_return(Info, FindOrAdd(Env, Class->GetClass(), Class));
}

void FJsEnvImpl::Mixin(struct pesapi_ffi* Apis, pesapi_callback_info Info)
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

void FJsEnvImpl::DumpStatisticsLog(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    Logger->Info(Backend->GetStatisticsLog());
}

}    // namespace PUERTS_NAMESPACE

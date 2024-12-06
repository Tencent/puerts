/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "JsEnvImpl.h"
#include "JsEnvModule.h"
#include "DynamicDelegateProxy.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "StructWrapper.h"
#include "DelegateWrapper.h"
#include "ContainerWrapper.h"
#include "SoftObjectWrapper.h"
#include "V8Utils.h"
#include "ObjectMapper.h"
#include "JSLogger.h"
#if !defined(ENGINE_INDEPENDENT_JSENV)
#include "JSGeneratedClass.h"
#include "JSAnimGeneratedClass.h"
#include "JSWidgetGeneratedClass.h"
#include "JSGeneratedFunction.h"
#endif
#include "JSClassRegister.h"
#include "PromiseRejectCallback.hpp"
#if !defined(ENGINE_INDEPENDENT_JSENV)
#include "TypeScriptGeneratedClass.h"
#include "Engine/UserDefinedEnum.h"
#endif
#include "ContainerMeta.h"

#include "V8InspectorImpl.h"
#if USE_WASM3
#include "WasmModuleInstance.h"
#endif

#if !defined(WITH_NODEJS)

#if V8_MAJOR_VERSION < 8 && !defined(WITH_QUICKJS)

#if PLATFORM_WINDOWS
#include "Blob/Win64/NativesBlob.h"
#include "Blob/Win64/SnapshotBlob.h"
#elif PLATFORM_ANDROID_ARM
#include "Blob/Android/armv7a/NativesBlob.h"
#include "Blob/Android/armv7a/SnapshotBlob.h"
#elif PLATFORM_ANDROID_ARM64
#include "Blob/Android/arm64/NativesBlob.h"
#include "Blob/Android/arm64/SnapshotBlob.h"
#elif PLATFORM_MAC
#include "Blob/macOS/NativesBlob.h"
#include "Blob/macOS/SnapshotBlob.h"
#elif PLATFORM_IOS
#include "Blob/iOS/arm64/NativesBlob.h"
#include "Blob/iOS/arm64/SnapshotBlob.h"
#elif PLATFORM_LINUX
#include "Blob/Linux/NativesBlob.h"
#include "Blob/Linux/SnapshotBlob.h"
#endif

#endif

#else
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

#if USE_WASM3
#include "PuertsWasm/WasmJsFunctionParams.h"
#endif

#if defined(WITH_WEBSOCKET)
void InitWebsocketPPWrap(v8::Local<v8::Context> Context);
#endif

namespace PUERTS_NAMESPACE
{
#if !defined(WITH_QUICKJS)
void LoadPesapiDll(const v8::FunctionCallbackInfo<v8::Value>& Info);
#endif

FJsEnvImpl::FJsEnvImpl(const FString& ScriptRoot)
    : FJsEnvImpl(std::make_shared<DefaultJSModuleLoader>(ScriptRoot), std::make_shared<FDefaultLogger>(), -1, nullptr, FString(),
          nullptr, nullptr)
{
}

static void FNameToArrayBuffer(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    FName Name = FV8Utils::ToFName(Info.GetIsolate(), Info[0]);
    v8::Local<v8::ArrayBuffer> Ab = v8::ArrayBuffer::New(Info.GetIsolate(), sizeof(FName));
    void* Buff = DataTransfer::GetArrayBufferData(Ab);
    ::memcpy(Buff, &Name, sizeof(FName));
    Info.GetReturnValue().Set(Ab);
}

static void ToCString(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    auto Isolate = Info.GetIsolate();
    if (!Info[0]->IsString())
    {
        FV8Utils::ThrowException(Isolate, "expect a string");
        return;
    }

    v8::Local<v8::String> Str = Info[0]->ToString(Isolate->GetCurrentContext()).ToLocalChecked();

    const size_t Length = Str->Utf8Length(Isolate);
    v8::Local<v8::ArrayBuffer> Ab = v8::ArrayBuffer::New(Info.GetIsolate(), Length + 1);
    char* Buff = static_cast<char*>(DataTransfer::GetArrayBufferData(Ab));
    Str->WriteUtf8(Isolate, Buff);
    Buff[Length] = '\0';
    Info.GetReturnValue().Set(Ab);
}

static void ToCPtrArray(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    const size_t Length = sizeof(void*) * Info.Length();

    v8::Local<v8::ArrayBuffer> Ret = v8::ArrayBuffer::New(Info.GetIsolate(), Length);
    void** Buff = static_cast<void**>(DataTransfer::GetArrayBufferData(Ret));

    for (int i = 0; i < Info.Length(); i++)
    {
        auto Val = Info[i];
        void* Ptr = nullptr;
        if (Val->IsArrayBufferView())
        {
            v8::Local<v8::ArrayBufferView> BuffView = Val.As<v8::ArrayBufferView>();
            auto Ab = BuffView->Buffer();
            Ptr = static_cast<char*>(DataTransfer::GetArrayBufferData(Ab)) + BuffView->ByteOffset();
        }
        else if (Val->IsArrayBuffer())
        {
            auto Ab = v8::Local<v8::ArrayBuffer>::Cast(Val);
            Ptr = static_cast<char*>(DataTransfer::GetArrayBufferData(Ab));
        }
        Buff[i] = Ptr;
    }
    Info.GetReturnValue().Set(Ret);
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
    auto Isolate = MainIsolate;
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    auto Context = v8::Local<v8::Context>::New(Isolate, DefaultContext);
    v8::Context::Scope ContextScope(Context);

    // TODO: catch uv_run可以让脚本错误不至于进程退出，但这不知道会不会对node有什么副作用
    v8::TryCatch TryCatch(Isolate);

    uv_run(&NodeUVLoop, UV_RUN_NOWAIT);
    if (TryCatch.HasCaught())
    {
        Logger->Error(FString::Printf(TEXT("uv_run throw: %s"), *FV8Utils::TryCatchToString(Isolate, &TryCatch)));
    }
    else
    {
        static_cast<node::MultiIsolatePlatform*>(IJsEnvModule::Get().GetV8Platform())->DrainTasks(Isolate);
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

#if defined(WITH_V8_BYTECODE)
struct FCodeCacheHeader
{
    uint32_t MagicNumber;
    uint32_t VersionHash;
    uint32_t SourceHash;
    uint32_t FlagHash;
#if V8_MAJOR_VERSION >= 11
    uint32_t ReadOnlySnapshotChecksum;
#endif
    uint32_t PayloadLength;
    uint32_t Checksum;
};
#endif

FJsEnvImpl::FJsEnvImpl(std::shared_ptr<IJSModuleLoader> InModuleLoader, std::shared_ptr<ILogger> InLogger, int InDebugPort,
    std::function<void(const FString&)> InOnSourceLoadedCallback, const FString InFlags, void* InExternalRuntime,
    void* InExternalContext)
{
    GUObjectArray.AddUObjectDeleteListener(static_cast<FUObjectArray::FUObjectDeleteListener*>(this));

    if (!InFlags.IsEmpty())
    {
#if !defined(WITH_NODEJS) && !defined(WITH_QUICKJS)
        TArray<FString> FlagArray;
        InFlags.ParseIntoArray(FlagArray, TEXT(" "));
        for (auto& Flag : FlagArray)
        {
            static FString Max_Old_Space_Size_Name(TEXT("--max-old-space-size="));
            if (Flag.StartsWith(Max_Old_Space_Size_Name))
            {
                size_t Val = FCString::Atoi(*Flag.Mid(Max_Old_Space_Size_Name.Len()));
                CreateParams.constraints.set_max_old_generation_size_in_bytes(Val * 1024 * 1024);
            }
        }
#endif
    }

    Started = false;
    Inspector = nullptr;
    InspectorChannel = nullptr;

    ModuleLoader = std::move(InModuleLoader);
    Logger = InLogger;
    OnSourceLoadedCallback = InOnSourceLoadedCallback;
#if !defined(WITH_NODEJS)
#if V8_MAJOR_VERSION < 8 && !defined(WITH_QUICKJS)
    std::unique_ptr<v8::StartupData> NativesBlob;
    if (!NativesBlob)
    {
        NativesBlob = std::make_unique<v8::StartupData>();
        NativesBlob->data = (const char*) NativesBlobCode;
        NativesBlob->raw_size = sizeof(NativesBlobCode);
    }
    v8::V8::SetNativesDataBlob(NativesBlob.get());
#endif

    CreateParams.array_buffer_allocator = v8::ArrayBuffer::Allocator::NewDefaultAllocator();
#ifdef WITH_QUICKJS
    MainIsolate = InExternalRuntime ? v8::Isolate::New(InExternalRuntime) : v8::Isolate::New(CreateParams);
#else
    check(!InExternalRuntime && !InExternalContext);
    MainIsolate = v8::Isolate::New(CreateParams);
#endif
    auto Isolate = MainIsolate;
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    Isolate->SetData(0, static_cast<IObjectMapper*>(this));    //直接传this会有问题，强转后地址会变

    v8::Isolate::Scope Isolatescope(Isolate);
    v8::HandleScope HandleScope(Isolate);

#ifdef WITH_QUICKJS
    v8::Local<v8::Context> Context =
        (InExternalRuntime && InExternalContext) ? v8::Context::New(Isolate, InExternalContext) : v8::Context::New(Isolate);
#else
    v8::Local<v8::Context> Context = v8::Context::New(Isolate);
#endif
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

    CreateParams.array_buffer_allocator = nullptr;
    NodeArrayBufferAllocator = node::ArrayBufferAllocator::Create();

    auto Platform = static_cast<node::MultiIsolatePlatform*>(IJsEnvModule::Get().GetV8Platform());
    MainIsolate = node::NewIsolate(NodeArrayBufferAllocator.get(), &NodeUVLoop, Platform);

    auto Isolate = MainIsolate;
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    Isolate->SetData(0, static_cast<IObjectMapper*>(this));    //直接传this会有问题，强转后地址会变

    // v8::Locker locker(Isolate);
    // difference from embedding example, if lock, blow check fail:
    // Utils::ApiCheck(
    //! v8::Locker::IsActive() ||
    //    internal_isolate->thread_manager()->IsLockedByCurrentThread() ||
    //    internal_isolate->serializer_enabled(),
    //"HandleScope::HandleScope",
    //"Entering the V8 API without proper locking in place");

    v8::Isolate::Scope Isolatescope(Isolate);

    NodeIsolateData =
        node::CreateIsolateData(Isolate, &NodeUVLoop, Platform, NodeArrayBufferAllocator.get());    // node::FreeIsolateData

    v8::HandleScope HandleScope(Isolate);

    v8::Local<v8::Context> Context = node::NewContext(Isolate);

#endif

    DefaultContext.Reset(Isolate, Context);

    v8::Context::Scope ContextScope(Context);

#if defined(WITH_NODEJS)
    // kDefaultFlags = kOwnsProcessState | kOwnsInspector, if kOwnsInspector set, inspector_agent.cc:681
    // CHECK_EQ(start_io_thread_async_initialized.exchange(true), false) fail!
    NodeEnv = CreateEnvironment(NodeIsolateData, Context, Args, ExecArgs, node::EnvironmentFlags::kOwnsProcessState);

    v8::MaybeLocal<v8::Value> LoadenvRet = node::LoadEnvironment(NodeEnv,
        "const publicRequire ="
        "  require('module').createRequire(process.cwd() + '/');"
        "globalThis.require = publicRequire;");

    if (LoadenvRet.IsEmpty())    // There has been a JS exception.
    {
        return;
    }

    // the same as raw v8
    Isolate->SetMicrotasksPolicy(v8::MicrotasksPolicy::kAuto);

    StartPolling();
#endif

    v8::Local<v8::Object> Global = Context->Global();

    v8::Local<v8::Object> PuertsObj = v8::Object::New(Isolate);
    Global->Set(Context, FV8Utils::InternalString(Isolate, "puerts"), PuertsObj).Check();

    auto This = v8::External::New(Isolate, this);

    MethodBindingHelper<&FJsEnvImpl::EvalScript>::Bind(Isolate, Context, Global, "__tgjsEvalScript", This);

    MethodBindingHelper<&FJsEnvImpl::Log>::Bind(Isolate, Context, Global, "__tgjsLog", This);

    MethodBindingHelper<&FJsEnvImpl::SearchModule>::Bind(Isolate, Context, Global, "__tgjsSearchModule", This);

    MethodBindingHelper<&FJsEnvImpl::LoadModule>::Bind(Isolate, Context, Global, "__tgjsLoadModule", This);

    MethodBindingHelper<&FJsEnvImpl::LoadUEType>::Bind(Isolate, Context, PuertsObj, "loadUEType", This);

    MethodBindingHelper<&FJsEnvImpl::LoadCppType>::Bind(Isolate, Context, PuertsObj, "loadCPPType", This);

    MethodBindingHelper<&FJsEnvImpl::UEClassToJSClass>::Bind(Isolate, Context, Global, "__tgjsUEClassToJSClass", This);

    MethodBindingHelper<&FJsEnvImpl::NewContainer>::Bind(Isolate, Context, Global, "__tgjsNewContainer", This);

    MethodBindingHelper<&FJsEnvImpl::MergeObject>::Bind(Isolate, Context, Global, "__tgjsMergeObject", This);

    MethodBindingHelper<&FJsEnvImpl::NewObjectByClass>::Bind(Isolate, Context, Global, "__tgjsNewObject", This);

    MethodBindingHelper<&FJsEnvImpl::SetJsTakeRefInTs>::Bind(Isolate, Context, Global, "__tgjsSetJsTakeRef", This);

    MethodBindingHelper<&FJsEnvImpl::NewStructByScriptStruct>::Bind(Isolate, Context, Global, "__tgjsNewStruct", This);

#if !defined(ENGINE_INDEPENDENT_JSENV)
    MethodBindingHelper<&FJsEnvImpl::MakeUClass>::Bind(Isolate, Context, Global, "__tgjsMakeUClass", This);

    MethodBindingHelper<&FJsEnvImpl::Mixin>::Bind(Isolate, Context, Global, "__tgjsMixin", This);
#endif

    MethodBindingHelper<&FJsEnvImpl::FindModule>::Bind(Isolate, Context, Global, "__tgjsFindModule", This);

    MethodBindingHelper<&FJsEnvImpl::SetInspectorCallback>::Bind(Isolate, Context, Global, "__tgjsSetInspectorCallback", This);

    MethodBindingHelper<&FJsEnvImpl::DispatchProtocolMessage>::Bind(
        Isolate, Context, Global, "__tgjsDispatchProtocolMessage", This);

    Isolate->SetPromiseRejectCallback(&PromiseRejectCallback<FJsEnvImpl>);
    Global
        ->Set(Context, FV8Utils::ToV8String(Isolate, "__tgjsSetPromiseRejectCallback"),
            v8::FunctionTemplate::New(Isolate, &SetPromiseRejectCallback<FJsEnvImpl>)->GetFunction(Context).ToLocalChecked())
        .Check();

    //#if !defined(WITH_NODEJS)
    MethodBindingHelper<&FJsEnvImpl::SetTimeout>::Bind(Isolate, Context, Global, "setTimeout", This);

    MethodBindingHelper<&FJsEnvImpl::ClearInterval>::Bind(Isolate, Context, Global, "clearTimeout", This);

    MethodBindingHelper<&FJsEnvImpl::SetInterval>::Bind(Isolate, Context, Global, "setInterval", This);

    MethodBindingHelper<&FJsEnvImpl::ClearInterval>::Bind(Isolate, Context, Global, "clearInterval", This);
    //#endif

#if USE_WASM3
    MethodBindingHelper<&FJsEnvImpl::Wasm_NewMemory>::Bind(Isolate, Context, Global, "__tgjsWasm_NewMemory", This);
    MethodBindingHelper<&FJsEnvImpl::Wasm_MemoryGrowth>::Bind(Isolate, Context, Global, "__tgjsWasm_MemoryGrowth", This);
    MethodBindingHelper<&FJsEnvImpl::Wasm_MemoryBuffer>::Bind(Isolate, Context, Global, "__tgjsWasm_MemoryBuffer", This);
    MethodBindingHelper<&FJsEnvImpl::Wasm_TableGrowth>::Bind(Isolate, Context, Global, "__tgjsWasm_TableGrow", This);
    MethodBindingHelper<&FJsEnvImpl::Wasm_TableSet>::Bind(Isolate, Context, Global, "__tgjsWasm_TableSet", This);
    MethodBindingHelper<&FJsEnvImpl::Wasm_TableLen>::Bind(Isolate, Context, Global, "__tgjsWasm_TableLen", This);
    MethodBindingHelper<&FJsEnvImpl::Wasm_Instance>::Bind(Isolate, Context, Global, "__tgjsWasm_Instance", This);
    MethodBindingHelper<&FJsEnvImpl::Wasm_OverrideWebAssembly>::Bind(
        Isolate, Context, Global, "__tgjsWasm_OverrideWebAssembly", This);
#endif

    MethodBindingHelper<&FJsEnvImpl::DumpStatisticsLog>::Bind(Isolate, Context, Global, "dumpStatisticsLog", This);

    Global
        ->Set(Context, FV8Utils::ToV8String(Isolate, "__tgjsFNameToArrayBuffer"),
            v8::FunctionTemplate::New(Isolate, FNameToArrayBuffer)->GetFunction(Context).ToLocalChecked())
        .Check();

    PuertsObj
        ->Set(Context, FV8Utils::ToV8String(Isolate, "toCString"),
            v8::FunctionTemplate::New(Isolate, ToCString)->GetFunction(Context).ToLocalChecked())
        .Check();

    PuertsObj
        ->Set(Context, FV8Utils::ToV8String(Isolate, "toCPtrArray"),
            v8::FunctionTemplate::New(Isolate, ToCPtrArray)->GetFunction(Context).ToLocalChecked())
        .Check();

#if !defined(WITH_QUICKJS)
    PuertsObj
        ->Set(Context, FV8Utils::ToV8String(Isolate, "load"),
            v8::FunctionTemplate::New(Isolate, LoadPesapiDll)->GetFunction(Context).ToLocalChecked())
        .Check();
#endif

    FString DllExt =
#if PLATFORM_WINDOWS
        TEXT(".dll");
#elif PLATFORM_MAC || PLATFORM_IOS
        TEXT(".dylib");
#else
        TEXT(".so");
#endif
    PuertsObj->Set(Context, FV8Utils::ToV8String(Isolate, "dll_ext"), FV8Utils::ToV8String(Isolate, DllExt)).Check();

    MethodBindingHelper<&FJsEnvImpl::ReleaseManualReleaseDelegate>::Bind(
        Isolate, Context, PuertsObj, "releaseManualReleaseDelegate", This);

    ArrayTemplate = v8::UniquePersistent<v8::FunctionTemplate>(Isolate, FScriptArrayWrapper::ToFunctionTemplate(Isolate));

    SetTemplate = v8::UniquePersistent<v8::FunctionTemplate>(Isolate, FScriptSetWrapper::ToFunctionTemplate(Isolate));

    MapTemplate = v8::UniquePersistent<v8::FunctionTemplate>(Isolate, FScriptMapWrapper::ToFunctionTemplate(Isolate));

    FixSizeArrayTemplate = v8::UniquePersistent<v8::FunctionTemplate>(Isolate, FFixSizeArrayWrapper::ToFunctionTemplate(Isolate));

    CppObjectMapper.Initialize(Isolate, Context);

    DelegateTemplate = v8::UniquePersistent<v8::FunctionTemplate>(Isolate, FDelegateWrapper::ToFunctionTemplate(Isolate));

    MulticastDelegateTemplate =
        v8::UniquePersistent<v8::FunctionTemplate>(Isolate, FMulticastDelegateWrapper::ToFunctionTemplate(Isolate));

    SoftObjectPtrTemplate = v8::UniquePersistent<v8::FunctionTemplate>(Isolate, FSoftObjectWrapper::ToFunctionTemplate(Isolate));

    DynamicInvoker = MakeShared<DynamicInvokerImpl, ESPMode::ThreadSafe>(this);
    MixinInvoker = DynamicInvoker;
#if !defined(ENGINE_INDEPENDENT_JSENV)
    TsDynamicInvoker = MakeShared<TsDynamicInvokerImpl, ESPMode::ThreadSafe>(this);
#endif

    Inspector = CreateV8Inspector(InDebugPort, &Context);

    ExecuteModule("puerts/first_run.js");
#if !defined(WITH_NODEJS)
    ExecuteModule("puerts/polyfill.js");
#endif
    ExecuteModule("puerts/log.js");
    ExecuteModule("puerts/modular.js");
    ExecuteModule("puerts/uelazyload.js");
    ExecuteModule("puerts/events.js");
    ExecuteModule("puerts/promises.js");
    ExecuteModule("puerts/argv.js");
    ExecuteModule("puerts/jit_stub.js");
    ExecuteModule("puerts/hot_reload.js");
    ExecuteModule("puerts/pesaddon.js");

    Require.Reset(Isolate, PuertsObj->Get(Context, FV8Utils::ToV8String(Isolate, "__require")).ToLocalChecked().As<v8::Function>());

    GetESMMain.Reset(
        Isolate, PuertsObj->Get(Context, FV8Utils::ToV8String(Isolate, "getESMMain")).ToLocalChecked().As<v8::Function>());

    ReloadJs.Reset(Isolate, PuertsObj->Get(Context, FV8Utils::ToV8String(Isolate, "__reload")).ToLocalChecked().As<v8::Function>());
#if !PUERTS_FORCE_CPP_UFUNCTION
    MergePrototype.Reset(
        Isolate, PuertsObj->Get(Context, FV8Utils::ToV8String(Isolate, "__mergePrototype")).ToLocalChecked().As<v8::Function>());
#endif

    RemoveListItem.Reset(
        Isolate, PuertsObj->Get(Context, FV8Utils::ToV8String(Isolate, "__removeListItem")).ToLocalChecked().As<v8::Function>());

    GenListApply.Reset(
        Isolate, PuertsObj->Get(Context, FV8Utils::ToV8String(Isolate, "__genListApply")).ToLocalChecked().As<v8::Function>());
#if defined(WITH_V8_BYTECODE)
    GenEmptyCode.Reset(
        Isolate, PuertsObj->Get(Context, FV8Utils::ToV8String(Isolate, "generateEmptyCode")).ToLocalChecked().As<v8::Function>());
#endif

    DelegateProxiesCheckerHandler =
        FUETicker::GetCoreTicker().AddTicker(FTickerDelegate::CreateRaw(this, &FJsEnvImpl::CheckDelegateProxies), 1);

    ManualReleaseCallbackMap.Reset(Isolate, v8::Map::New(Isolate));

    UserObjectRetainer.SetName(TEXT("Puerts_UserObjectRetainer"));
    SysObjectRetainer.SetName(TEXT("Puerts_SysObjectRetainer"));

#ifdef SINGLE_THREAD_VERIFY
    BoundThreadId = FPlatformTLS::GetCurrentThreadId();
#endif

#if USE_WASM3
    PuertsWasmEnv = std::make_shared<WasmEnv>();
    //创建默认的runtime
    PuertsWasmRuntimeList.Add(std::make_shared<WasmRuntime>(PuertsWasmEnv.get()));
    ExecuteModule("puerts/wasm3_helper.js");
#endif
#if defined(WITH_V8_BYTECODE)
    auto Script = v8::Script::Compile(Context, FV8Utils::ToV8String(Isolate, "")).ToLocalChecked();
    auto CachedCode = v8::ScriptCompiler::CreateCodeCache(Script->GetUnboundScript());
    const FCodeCacheHeader* CodeCacheHeader = (const FCodeCacheHeader*) CachedCode->data;
    Expect_FlagHash = CodeCacheHeader->FlagHash;    // get FlagHash
#if V8_MAJOR_VERSION >= 11
    Expect_ReadOnlySnapshotChecksum = CodeCacheHeader->ReadOnlySnapshotChecksum;
#endif
#if !WITH_EDITOR
    delete CachedCode;    //编辑器下是v8.dll分配的，ue里的delete被重载了，这delete会有问题
#endif
#endif

#if defined(WITH_WEBSOCKET)
    InitWebsocketPPWrap(Context);
    ExecuteModule("puerts/websocketpp.js");
#endif
}

// #lizard forgives
FJsEnvImpl::~FJsEnvImpl()
{
#if USE_WASM3
    PuertsWasmRuntimeList.Empty();
    PuertsWasmEnv.reset();
    for (auto Item : PuertsWasmCachedLinkFunctionList)
    {
        Item->CachedFunction.Reset();
        delete Item;
    }
    PuertsWasmCachedLinkFunctionList.Empty();
#endif

#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
#if defined(WITH_NODEJS)
    StopPolling();
#endif

#ifndef WITH_QUICKJS
    for (auto& KV : HashToModuleInfo)
    {
        delete KV.second;
    }
    HashToModuleInfo.clear();
    PathToModule.Empty();
#endif

    for (int i = 0; i < ManualReleaseCallbackList.size(); i++)
    {
        if (ManualReleaseCallbackList[i].IsValid(true))
        {
            ManualReleaseCallbackList[i].Get()->JsFunction.Reset();
        }
    }
    ManualReleaseCallbackMap.Reset();
    InspectorMessageHandler.Reset();
    Require.Reset();
    GetESMMain.Reset();
    ReloadJs.Reset();
    JsPromiseRejectCallback.Reset();

    FUETicker::GetCoreTicker().RemoveTicker(DelegateProxiesCheckerHandler);

    {
        auto Isolate = MainIsolate;
#ifdef THREAD_SAFE
        v8::Locker Locker(Isolate);
#endif
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);

        TypeToTemplateInfoMap.Empty();

        CppObjectMapper.UnInitialize(Isolate);

        ObjectMap.Empty();

        for (auto& KV : StructCache)
        {
            FObjectCacheNode* PNode = &KV.Value;
            while (PNode)
            {
                PNode->Value.Reset();
                PNode = PNode->Next;
            }
        }

        for (auto& KV : ContainerCache)
        {
            if (KV.Value.NeedRelease)
            {
                switch (KV.Value.Type)
                {
                    case EArray:
                        delete static_cast<FScriptArrayEx*>(KV.Key);
                        break;
                    case EMap:
                        delete static_cast<FScriptMapEx*>(KV.Key);
                        break;
                    case ESet:
                        delete static_cast<FScriptSetEx*>(KV.Key);
                        break;
                }
            }
        }
        ContainerCache.Empty();

        for (auto Iter = DelegateMap.begin(); Iter != DelegateMap.end(); Iter++)
        {
            Iter->second.JSObject.Reset();
            if (Iter->second.Proxy.IsValid(true))
            {
                Iter->second.Proxy->JsFunction.Reset();
            }

            if (!Iter->second.PassByPointer)
            {
                delete ((FScriptDelegate*) Iter->first);
            }
            Iter->second.JsCallbacks.Reset();
        }

        for (auto& KV : AutoReleaseCallbacksMap)
        {
            for (auto& Callback : KV.Value)
            {
                if (Callback.IsValid(true))
                {
                    Callback->JsFunction.Reset();
                }
            }
        }

        TsFunctionMap.Empty();
        MixinFunctionMap.Empty();

#if !defined(ENGINE_INDEPENDENT_JSENV)
        TsDynamicInvoker.Reset();
        BindInfoMap.Empty();
#endif

        for (auto Iter = TimerInfos.CreateIterator(); Iter; ++Iter)
        {
            Iter->Value.Callback.Reset();
            FUETicker::GetCoreTicker().RemoveTicker(Iter->Value.TickerHandle);
        }
        TimerInfos.Empty();

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
            else if (auto JSAnimGeneratedClass = Cast<UJSAnimGeneratedClass>(GeneratedClass))
            {
                if (JSWidgetGeneratedClass->IsValidLowLevelFast() && !UEObjectIsPendingKill(JSWidgetGeneratedClass))
                {
                    JSAnimGeneratedClass->Release();
                }
            }
        }
#endif

#if defined(WITH_NODEJS)
        node::EmitExit(NodeEnv);
        node::Stop(NodeEnv);
        node::FreeEnvironment(NodeEnv);
        node::FreeIsolateData(NodeIsolateData);

        auto Platform = static_cast<node::MultiIsolatePlatform*>(IJsEnvModule::Get().GetV8Platform());
        Platform->UnregisterIsolate(Isolate);
#endif

        if (InspectorChannel)
        {
            delete InspectorChannel;
            InspectorChannel = nullptr;
        }

        if (Inspector)
        {
            delete Inspector;
            Inspector = nullptr;
        }

        DynamicInvoker.Reset();
        MixinInvoker.Reset();

        SoftObjectPtrTemplate.Reset();
        MulticastDelegateTemplate.Reset();
        DelegateTemplate.Reset();
        FixSizeArrayTemplate.Reset();
        MapTemplate.Reset();
        SetTemplate.Reset();
        ArrayTemplate.Reset();
#if !PUERTS_FORCE_CPP_UFUNCTION
        MergePrototype.Reset();
#endif
        RemoveListItem.Reset();
        GenListApply.Reset();
#if defined(WITH_V8_BYTECODE)
        GenEmptyCode.Reset();
#endif
    }

#if !defined(ENGINE_INDEPENDENT_JSENV)
    for (size_t i = 0; i < MixinClasses.Num(); i++)
    {
        if (MixinClasses[i].IsValid())
        {
            UJSGeneratedClass::Restore(MixinClasses[i].Get());
        }
    }
#endif

#if PUERTS_REUSE_STRUCTWRAPPER_FUNCTIONTEMPLATE
    for (auto Iter = TypeReflectionMap.CreateIterator(); Iter; ++Iter)
    {
        Iter->Value->CachedFunctionTemplate.Reset();
    }
#endif

    DefaultContext.Reset();
    MainIsolate->Dispose();
    MainIsolate = nullptr;
    delete CreateParams.array_buffer_allocator;

    GUObjectArray.RemoveUObjectDeleteListener(static_cast<FUObjectArray::FUObjectDeleteListener*>(this));

    // quickjs will call UnBind in vm dispose, so cleanup move to here
    for (auto& KV : StructCache)
    {
        FObjectCacheNode* PNode = &KV.Value;
        while (PNode)
        {
            if (PNode->UserData)
            {
                FScriptStructWrapper* ScriptStructWrapper = (FScriptStructWrapper*) (PNode->UserData);
                ScriptStructWrapper->Free(KV.Key);
            }
            PNode = PNode->Next;
        }
    }
    StructCache.Empty();
}

void FJsEnvImpl::InitExtensionMethodsMap()
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
#ifdef THREAD_SAFE
    v8::Locker Locker(MainIsolate);
#endif
#if !defined(ENGINE_INDEPENDENT_JSENV)
    for (TObjectIterator<UClass> It; It; ++It)
    {
        UClass* Class = *It;
        if (Class->IsChildOf<UExtensionMethods>() && Class->IsNative())
        {
            for (TFieldIterator<UFunction> FuncIt(Class, EFieldIteratorFlags::ExcludeSuper); FuncIt; ++FuncIt)
            {
                UFunction* Function = *FuncIt;

                if (Function->HasAnyFunctionFlags(FUNC_Static))
                {
                    TFieldIterator<PropertyMacro> ParamIt(Function);
                    if (ParamIt &&
                        ((ParamIt->PropertyFlags & (CPF_Parm | CPF_ReturnParm)) == CPF_Parm))    // has at least one param
                    {
                        UStruct* Struct = nullptr;
                        if (auto ObjectPropertyBase = CastFieldMacro<ObjectPropertyBaseMacro>(*ParamIt))
                        {
                            Struct = ObjectPropertyBase->PropertyClass;
                        }
                        else if (auto StructProperty = CastFieldMacro<StructPropertyMacro>(*ParamIt))
                        {
                            Struct = StructProperty->Struct;
                        }
                        if (Struct)
                        {
                            if (ExtensionMethodsMap.find(Struct) == ExtensionMethodsMap.end())
                            {
                                ExtensionMethodsMap[Struct] = std::vector<UFunction*>();
                            }
                            auto Iter = ExtensionMethodsMap.find(Struct);

                            if (std::find(Iter->second.begin(), Iter->second.end(), Function) == Iter->second.end())
                            {
                                Iter->second.push_back(Function);
                            }
                        }
                    }
                }
            }
        }
    }
#endif
    ExtensionMethodsMapInited = true;
}

std::unique_ptr<FJsEnvImpl::ObjectMerger>& FJsEnvImpl::GetObjectMerger(UStruct* Struct)
{
    if (ObjectMergers.find(Struct) == ObjectMergers.end())
    {
        ObjectMergers[Struct] = std::make_unique<ObjectMerger>(this, Struct);
    }
    return ObjectMergers[Struct];
}

void FJsEnvImpl::Merge(v8::Isolate* Isolate, v8::Local<v8::Context> Context, v8::Local<v8::Object> Src, UStruct* DesType, void* Des)
{
    GetObjectMerger(DesType)->Merge(Isolate, Context, Src, Des);
}

void FJsEnvImpl::MergeObject(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope Isolatescope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    CHECK_V8_ARGS(EArgObject, EArgObject);

    auto Des = Info[0]->ToObject(Context).ToLocalChecked();
    auto Src = Info[1]->ToObject(Context).ToLocalChecked();
    if (FV8Utils::GetPointerFast<void>(Des, 1))    // struct
    {
        if (auto Object = FV8Utils::GetUObject(Des, 1))
        {
            if (FV8Utils::IsReleasedPtr(Object))
            {
                FV8Utils::ThrowException(Isolate, "passing a invalid object");
                return;
            }
            auto Struct = Cast<UScriptStruct>(Object);
            if (Struct)
            {
                Merge(Isolate, Context, Src, Struct, FV8Utils::GetPointer(Des));
                return;
            }
        }
    }
    else    // class
    {
        auto Object = FV8Utils::GetUObject(Des);
        if (Object)
        {
            if (FV8Utils::IsReleasedPtr(Object))
            {
                FV8Utils::ThrowException(Isolate, "passing a invalid object");
                return;
            }
            Merge(Isolate, Context, Src, Object->GetClass(), Object);
            return;
        }
    }
    FV8Utils::ThrowException(Isolate, "Bad parameters #1, expect a native object.");
}

void FJsEnvImpl::NewObjectByClass(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    UObject* Outer = GetTransientPackage();
    FName Name = NAME_None;
    EObjectFlags ObjectFlags = RF_NoFlags;

    UClass* Class = nullptr;
    if (UObject* Object = FV8Utils::GetUObject(Context, Info[0]))
    {
        if (FV8Utils::IsReleasedPtr(Object))
        {
            FV8Utils::ThrowException(Isolate, "passing a invalid object");
            return;
        }
        Class = Cast<UClass>(Object);
    }

    if (Class)
    {
        if (Info.Length() > 1 && !Info[1]->IsNullOrUndefined())
        {
            Outer = FV8Utils::GetUObject(Context, Info[1]);
            if (FV8Utils::IsReleasedPtr(Outer))
            {
                FV8Utils::ThrowException(Isolate, "passing a invalid object");
                return;
            }
        }
        if (Info.Length() > 2 && !Info[2]->IsNullOrUndefined())
        {
            Name = FName(*FV8Utils::ToFString(Isolate, Info[2]));
        }
        if (Info.Length() > 3 && !Info[3]->IsNullOrUndefined())
        {
            ObjectFlags = (EObjectFlags) (Info[3]->Int32Value(Context).ToChecked());
        }
        UObject* Object = NewObject<UObject>(Outer, Class, Name, ObjectFlags);

        auto Result = FV8Utils::IsolateData<IObjectMapper>(Isolate)->FindOrAdd(Isolate, Context, Object->GetClass(), Object);
#if !PUERTS_KEEP_UOBJECT_REFERENCE
        bool NeedJsTakeRef = true;
        if (Info.Length() > 4 && !Info[4]->IsNullOrUndefined())
        {
            if (!Info[4]->BooleanValue(Isolate))
            {
                NeedJsTakeRef = false;
            }
        }
        if (NeedJsTakeRef)
        {
            bool Existed;
            auto TemplateInfoPtr = GetTemplateInfoOfType(Class, Existed);
            SetJsTakeRef(Object, static_cast<FClassWrapper*>(TemplateInfoPtr->StructWrapper.get()));
        }
#endif
        Info.GetReturnValue().Set(Result);
    }
    else
    {
        FV8Utils::ThrowException(Isolate, "invalid argument");
    }
}

void FJsEnvImpl::NewStructByScriptStruct(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    UScriptStruct* ScriptStruct = nullptr;
    if (UObject* Object = FV8Utils::GetUObject(Context, Info[0]))
    {
        if (FV8Utils::IsReleasedPtr(Object))
        {
            FV8Utils::ThrowException(Isolate, "passing a invalid object");
            return;
        }
        ScriptStruct = Cast<UScriptStruct>(Object);
    }

    if (ScriptStruct)
    {
        void* Ptr = FScriptStructWrapper::Alloc(ScriptStruct);

        Info.GetReturnValue().Set(
            FV8Utils::IsolateData<IObjectMapper>(Isolate)->FindOrAddStruct(Isolate, Context, ScriptStruct, Ptr, false));
    }
    else
    {
        FV8Utils::ThrowException(Isolate, "invalid argument");
    }
}

bool FJsEnvImpl::IdleNotificationDeadline(double DeadlineInSeconds)
{
#ifdef THREAD_SAFE
    v8::Locker Locker(MainIsolate);
#endif
#ifndef WITH_QUICKJS
    return MainIsolate->IdleNotificationDeadline(DeadlineInSeconds);
#else
    return true;
#endif
}

void FJsEnvImpl::LowMemoryNotification()
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
#ifdef THREAD_SAFE
    v8::Locker Locker(MainIsolate);
#endif
    MainIsolate->LowMemoryNotification();
}

void FJsEnvImpl::RequestMinorGarbageCollectionForTesting()
{
#ifdef THREAD_SAFE
    v8::Locker Locker(MainIsolate);
#endif
#ifndef WITH_QUICKJS
    MainIsolate->RequestGarbageCollectionForTesting(v8::Isolate::kMinorGarbageCollection);
#endif
}

void FJsEnvImpl::RequestFullGarbageCollectionForTesting()
{
#ifdef THREAD_SAFE
    v8::Locker Locker(MainIsolate);
#endif
#ifndef WITH_QUICKJS
    MainIsolate->RequestGarbageCollectionForTesting(v8::Isolate::kFullGarbageCollection);
#endif
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

            auto Isolate = MainIsolate;
            v8::Isolate::Scope IsolateScope(Isolate);
            v8::HandleScope HandleScope(Isolate);
            auto Context = DefaultContext.Get(Isolate);
            v8::Context::Scope ContextScope(Context);
            auto LocalRequire = Require.Get(Isolate);

            if (!BindInfoPtr)
            {
                FBindInfo BindInfo;
                BindInfo.Name = *ModuleName;
                BindInfo.Prototype.Reset(Isolate, v8::Object::New(Isolate));
                BindInfo.InjectNotFinished = true;
                BindInfoMap.Emplace(TypeScriptGeneratedClass, std::move(BindInfo));
            }

            v8::TryCatch TryCatch(Isolate);

            v8::Local<v8::Value> Args[] = {FV8Utils::ToV8String(Isolate, ModuleName)};

            auto MaybeRet = LocalRequire->Call(Context, v8::Undefined(Isolate), 1, Args);

            if (TryCatch.HasCaught())
            {
                Logger->Error(FString::Printf(
                    TEXT("load module [%s] exception %s"), *ModuleName, *FV8Utils::TryCatchToString(Isolate, &TryCatch)));
                return;
            }

            if (!MaybeRet.IsEmpty())
            {
                auto Ret = MaybeRet.ToLocalChecked().As<v8::Object>();

                auto MaybeFunc = Ret->Get(Context, FV8Utils::ToV8String(Isolate, "default"));
                v8::Local<v8::Value> Val;
                if (MaybeFunc.ToLocal(&Val) && Val->IsFunction())
                {
                    auto Func = Val.As<v8::Function>();
                    v8::Local<v8::Value> VProto;
                    // UE_LOG(LogTemp, Error, TEXT("found function for , %s"), *ModuleName);

                    if (Func->Get(Context, FV8Utils::ToV8String(Isolate, "prototype")).ToLocal(&VProto) && VProto->IsObject())
                    {
                        // UE_LOG(LogTemp, Error, TEXT("found proto for , %s"), *ModuleName);
                        v8::Local<v8::Object> Proto = VProto.As<v8::Object>();

                        TypeScriptGeneratedClass->DynamicInvoker = TsDynamicInvoker;
                        // BindInfo.Prototype.Reset(Isolate, Proto);
                        TypeScriptGeneratedClass->ClassConstructor = &UTypeScriptGeneratedClass::StaticConstructor;
                        // BindInfo.Rebind = false;

                        v8::Local<v8::Value> VCtor;
                        if (Proto->Get(Context, FV8Utils::ToV8String(Isolate, "Constructor")).ToLocal(&VCtor) &&
                            VCtor->IsFunction())
                        {
                            // UE_LOG(LogTemp, Error, TEXT("found ctor for , %s"), *ModuleName);
                            BindInfoMap[TypeScriptGeneratedClass].Constructor.Reset(Isolate, VCtor.As<v8::Function>());
                            // BindInfo.Prototype.Reset(Isolate, Proto);
                        }

                        // SysObjectRetainer.Retain(Class);

                        // implement by js
                        TypeScriptGeneratedClass->FunctionToRedirect.Empty();

#if !PUERTS_FORCE_CPP_UFUNCTION
                        auto NetMethods = v8::Object::New(Isolate);
#endif

                        for (TFieldIterator<UFunction> It(TypeScriptGeneratedClass, EFieldIteratorFlags::ExcludeSuper,
                                 EFieldIteratorFlags::ExcludeDeprecated, EFieldIteratorFlags::ExcludeInterfaces);
                             It; ++It)
                        {
                            UFunction* Function = *It;
                            auto FunctionFName = Function->GetFName();
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
                            auto V8Name = FV8Utils::ToV8String(Isolate, FunctionName);
                            v8::Local<v8::Object> FuncsObj =
                                Function->HasAnyFunctionFlags(FUNC_Static) ? static_cast<v8::Local<v8::Object>>(Func) : Proto;
                            if (!TypeScriptGeneratedClass->FunctionToRedirect.Contains(FunctionFName) &&
                                FuncsObj->HasOwnProperty(Context, V8Name).ToChecked() &&
                                (Function->HasAnyFunctionFlags(FUNC_BlueprintEvent)))
                            {
                                auto MaybeValue = FuncsObj->Get(Context, V8Name);
                                if (!MaybeValue.IsEmpty() && MaybeValue.ToLocalChecked()->IsFunction())
                                {
                                    // Logger->Warn(FString::Printf(TEXT("override: %s:%s"), *TypeScriptGeneratedClass->GetName(),
                                    // *Function->GetName())); UJSGeneratedClass::Override(Isolate, TypeScriptGeneratedClass,
                                    // Function, v8::Local<v8::Function>::Cast(MaybeValue.ToLocalChecked()), DynamicInvoker, false);
                                    auto FuncInfo = TsFunctionMap.Find(Function);
                                    if (!FuncInfo)
                                    {
                                        TsFunctionMap.Add(
                                            Function, {v8::UniquePersistent<v8::Function>(
                                                           Isolate, v8::Local<v8::Function>::Cast(MaybeValue.ToLocalChecked())),
                                                          std::make_unique<FFunctionTranslator>(Function, false)});
                                    }
                                    else
                                    {
                                        FuncInfo->FunctionTranslator->Init(Function, false);
                                        FuncInfo->JsFunction = v8::UniquePersistent<v8::Function>(
                                            Isolate, v8::Local<v8::Function>::Cast(MaybeValue.ToLocalChecked()));
                                    }

#if !PUERTS_FORCE_CPP_UFUNCTION
                                    if (Function->HasAnyFunctionFlags(FUNC_Net))
                                    {
                                        __USE(NetMethods->Set(Context, V8Name, v8::True(Isolate)));
                                    }
#endif

                                    TypeScriptGeneratedClass->FunctionToRedirect.Add(FunctionFName);
                                    TypeScriptGeneratedClass->RedirectToTypeScript(Function);
                                }
                            }
                        }
                        TypeScriptGeneratedClass->RedirectedToTypeScript = true;
#if WITH_EDITOR
                        TypeScriptGeneratedClass->FunctionToRedirectInitialized = true;
#endif

                        TryReleaseType(TypeScriptGeneratedClass);
                        auto NativeCtor = GetJsClass(TypeScriptGeneratedClass, Context);
                        //如果已经有了bindinfoptr(此时forcereinject一定是true),这种情况下prototype是已经设置过了的,因此不用重复设置prototype
                        if (!(BindInfoPtr && ForceReinject))
                        {
                            v8::Local<v8::Value> VNativeProto;
                            if (NativeCtor->Get(Context, FV8Utils::ToV8String(Isolate, "prototype")).ToLocal(&VNativeProto) &&
                                VNativeProto->IsObject())
                            {
                                //{} -> Native Prototype -> Js Prototype -> Super Prototype
                                v8::Local<v8::Object> NativeProto = VNativeProto.As<v8::Object>();
                                __USE(BindInfoMap[TypeScriptGeneratedClass].Prototype.Get(Isolate)->SetPrototype(
                                    Context, NativeProto));
                                if (SuperClass)
                                {
                                    __USE(Proto->SetPrototype(Context, BindInfoMap[SuperClass].Prototype.Get(Isolate)));
                                }
                                else
                                {
                                    __USE(Proto->SetPrototype(Context, NativeProto->GetPrototype()));
                                }
                                __USE(NativeProto->SetPrototype(Context, Proto));

#if !PUERTS_FORCE_CPP_UFUNCTION
                                v8::Local<v8::Value> MergeArgs[] = {Proto, NativeProto, NetMethods};

                                __USE(MergePrototype.Get(Isolate)->Call(Context, v8::Undefined(Isolate), 3, MergeArgs));
#endif
                            }
                            else
                            {
                                __USE(BindInfoMap[TypeScriptGeneratedClass].Prototype.Get(Isolate)->SetPrototype(Context, Proto));
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
                                __USE(FindOrAdd(Isolate, Context, Object->GetClass(), Object, true));
                            }
                        }

                        if (TypeScriptGeneratedClass->IsChildOf(UBlueprintFunctionLibrary::StaticClass()))
                        {
                            FinishInjection(TypeScriptGeneratedClass);
                        }
                    }
                }
            }
            else
            {
                Logger->Error(FString::Printf(TEXT("module [%s] invalid"), *ModuleName));
            }
        }
        else
        {
            Logger->Warn(FString::Printf(TEXT("not find module info for [%s]"), *TypeScriptGeneratedClass->GetName()));
        }
    }
}
#endif

void FJsEnvImpl::JsHotReload(FName ModuleName, const FString& JsSource)
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
    auto Isolate = MainIsolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    auto Context = DefaultContext.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    auto LocalReloadJs = ReloadJs.Get(Isolate);

    FString OutPath, OutDebugPath;

    if (ModuleLoader->Search(TEXT(""), ModuleName.ToString(), OutPath, OutDebugPath))
    {
        OutPath = FPaths::ConvertRelativePathToFull(OutPath);
        Logger->Info(FString::Printf(TEXT("reload js module [%s]"), *OutPath));
        v8::TryCatch TryCatch(Isolate);
        v8::Handle<v8::Value> Args[] = {FV8Utils::ToV8String(Isolate, ModuleName), FV8Utils::ToV8String(Isolate, OutPath),
            FV8Utils::ToV8String(Isolate, JsSource)};

        (void) (LocalReloadJs->Call(Context, v8::Undefined(Isolate), 3, Args));

        if (TryCatch.HasCaught())
        {
            Logger->Error(FString::Printf(TEXT("reload module exception %s"), *FV8Utils::TryCatchToString(Isolate, &TryCatch)));
        }
    }
    else
    {
        Logger->Warn(FString::Printf(TEXT("not find js module [%s]"), *ModuleName.ToString()));
        return;
    }
}

void FJsEnvImpl::ReloadModule(FName ModuleName, const FString& JsSource)
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
#ifdef THREAD_SAFE
    v8::Locker Locker(MainIsolate);
#endif
    // Logger->Info(FString::Printf(TEXT("start reload js module [%s]"), *ModuleName.ToString()));
    JsHotReload(ModuleName, JsSource);
}

void FJsEnvImpl::ReloadSource(const FString& Path, const PString& JsSource)
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
#ifdef THREAD_SAFE
    v8::Locker Locker(MainIsolate);
#endif
    auto Isolate = MainIsolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    auto Context = DefaultContext.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    auto LocalReloadJs = ReloadJs.Get(Isolate);

    Logger->Info(FString::Printf(TEXT("reload js [%s]"), *Path));
    v8::TryCatch TryCatch(Isolate);
    v8::Handle<v8::Value> Args[] = {
        v8::Undefined(Isolate), FV8Utils::ToV8String(Isolate, Path), FV8Utils::ToV8String(Isolate, JsSource.c_str())};

    (void) (LocalReloadJs->Call(Context, v8::Undefined(Isolate), 3, Args));

    if (TryCatch.HasCaught())
    {
        Logger->Error(FString::Printf(TEXT("reload module exception %s"), *FV8Utils::TryCatchToString(Isolate, &TryCatch)));
    }
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
#ifdef THREAD_SAFE
    v8::Locker Locker(MainIsolate);
#endif
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
#ifndef WITH_QUICKJS
    v8::Isolate* Isolate = MainIsolate;
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);

    PString StackTrace = StackTraceToString(Isolate, v8::StackTrace::CurrentStackTrace(Isolate, 10, v8::StackTrace::kDetailed));
    return UTF8_TO_TCHAR(StackTrace.c_str());
#else
    return TEXT("");
#endif
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

void FJsEnvImpl::Bind(FClassWrapper* ClassWrapper, UObject* UEObject,
    v8::Local<v8::Object> JSObject)    // Just call in FClassReflection::Call, new a Object
{
#if PUERTS_KEEP_UOBJECT_REFERENCE
    const bool IsNativeTakeJsRef = ClassWrapper->IsNativeTakeJsRef;
#else
    const bool ClassWrapperIsNativeTakeJsRef = ClassWrapper->IsNativeTakeJsRef;    //这个值只有mixin会进行设置
    const bool IsUClass = UEObject->IsA<UClass>();
    const bool IsCDO = UEObject->HasAnyFlags(RF_ClassDefaultObject | RF_ArchetypeObject);
    const bool IsNativeTakeJsRef = (IsCDO || IsUClass) ? false : ClassWrapperIsNativeTakeJsRef;
#endif

    DataTransfer::SetPointer(MainIsolate, JSObject, UEObject, 0);
    DataTransfer::SetPointer(MainIsolate, JSObject, nullptr, 1);
    ObjectMap.Emplace(UEObject, v8::UniquePersistent<v8::Value>(MainIsolate, JSObject));

    if (!IsNativeTakeJsRef)
    {
        SetJsTakeRef(UEObject, ClassWrapper);
    }
}

void FJsEnvImpl::SetJsTakeRef(UObject* UEObject, FClassWrapper* ClassWrapper)
{
    UserObjectRetainer.Retain(UEObject);
    ObjectMap[UEObject].SetWeak<UClass>(
        Cast<UClass>(ClassWrapper->Struct.Get()), FClassWrapper::OnGarbageCollected, v8::WeakCallbackType::kInternalFields);
}

void FJsEnvImpl::UnBind(UClass* Class, UObject* UEObject, bool ResetPointer)
{
    auto PersistentValuePtr = ObjectMap.Find(UEObject);
    if (PersistentValuePtr)
    {
        if (ResetPointer)
        {
            auto Isolate = MainIsolate;
            v8::Isolate::Scope IsolateScope(Isolate);
            v8::HandleScope HandleScope(Isolate);
            auto Context = DefaultContext.Get(Isolate);
            v8::Context::Scope ContextScope(Context);

            auto JsObject = PersistentValuePtr->Get(Isolate).As<v8::Object>();
            DataTransfer::SetPointer(MainIsolate, JsObject, RELEASED_UOBJECT, 0);
            DataTransfer::SetPointer(Isolate, JsObject, nullptr, 1);
        }
        ObjectMap.Remove(UEObject);
        UserObjectRetainer.Release(UEObject);
    }
}

void FJsEnvImpl::UnBind(UClass* Class, UObject* UEObject)
{
    UnBind(Class, UEObject, false);
}

v8::Local<v8::Value> FJsEnvImpl::FindOrAdd(
    v8::Isolate* Isolate, v8::Local<v8::Context>& Context, UClass* Class, UObject* UEObject, bool SkipTypeScriptInitial)
{
    if (!UEObject)
    {
        return v8::Null(Isolate);
    }

    auto PersistentValuePtr = ObjectMap.Find(UEObject);
    if (!PersistentValuePtr)    // create and link
    {
        bool Existed;
        auto TemplateInfoPtr = GetTemplateInfoOfType(Class, Existed);

        auto Result = TemplateInfoPtr->Template.Get(Isolate)->InstanceTemplate()->NewInstance(Context).ToLocalChecked();
        auto ClassWrapper = static_cast<FClassWrapper*>(TemplateInfoPtr->StructWrapper.get());
        Bind(ClassWrapper, UEObject, Result);
        if (!SkipTypeScriptInitial && ClassWrapper->IsTypeScriptGeneratedClass)
        {
            TypeScriptInitial(UEObject->GetClass(), UEObject);
        }
        return Result;
    }
    else
    {
        return v8::Local<v8::Value>::New(Isolate, *PersistentValuePtr);
    }
}

v8::Local<v8::Value> FJsEnvImpl::FindOrAdd(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, UClass* Class, UObject* UEObject)
{
    return FindOrAdd(Isolate, Context, Class, UEObject, false);
}

v8::Local<v8::Value> FJsEnvImpl::FindOrAddStruct(
    v8::Isolate* Isolate, v8::Local<v8::Context>& Context, UScriptStruct* ScriptStruct, void* Ptr, bool PassByPointer)
{
    if (!Ptr)
    {
        return v8::Null(Isolate);
    }

    auto HeaderPtr = StructCache.Find(Ptr);
    if (HeaderPtr)
    {
        auto CacheNodePtr = HeaderPtr->Find(ScriptStruct);
        if (CacheNodePtr)
        {
            return CacheNodePtr->Value.Get(Isolate);
        }
    }

    // create and link
    bool Existed;
    auto TemplateInfoPtr = GetTemplateInfoOfType(ScriptStruct, Existed);
    auto Result = TemplateInfoPtr->Template.Get(Isolate)->InstanceTemplate()->NewInstance(Context).ToLocalChecked();
    BindStruct(static_cast<FScriptStructWrapper*>(TemplateInfoPtr->StructWrapper.get()), Ptr, Result, PassByPointer);
    return Result;
}

v8::Local<v8::Value> FJsEnvImpl::FindOrAddCppObject(
    v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* TypeId, void* Ptr, bool PassByPointer)
{
    return CppObjectMapper.FindOrAddCppObject(Isolate, Context, TypeId, Ptr, PassByPointer);
}

v8::Local<v8::Value> FJsEnvImpl::FindOrAddDelegate(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, UObject* Owner,
    PropertyMacro* Property, void* DelegatePtr, bool PassByPointer)
{
    check(DelegatePtr);    // must not null

    if (PassByPointer)
    {
        auto Iter = DelegateMap.find(DelegatePtr);
        if (Iter != DelegateMap.end())
        {
            if (Iter->second.Owner.IsValid())
            {
                return Iter->second.JSObject.Get(Isolate);
            }
            else
            {
                ClearDelegate(Isolate, Context, DelegatePtr);
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
            return v8::Undefined(Isolate);
        }
    }

    {
        // UE_LOG(LogTemp, Warning, TEXT("FindOrAddDelegate -- new %s"), *Property->GetName());
        auto Constructor = (Property->IsA<DelegatePropertyMacro>() ? DelegateTemplate : MulticastDelegateTemplate)
                               .Get(Isolate)
                               ->GetFunction(Context)
                               .ToLocalChecked();
        auto JSObject = Constructor->NewInstance(Context).ToLocalChecked();
        DataTransfer::SetPointer(Isolate, JSObject, DelegatePtr, 0);
        (void) (JSObject->Set(Context, 0, v8::Map::New(Isolate)));
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
        DelegateMap[DelegatePtr] = {v8::UniquePersistent<v8::Object>(Isolate, JSObject), TWeakObjectPtr<UObject>(Owner),
            DelegateProperty, MulticastDelegateProperty, Function, PassByPointer, nullptr,
            v8::UniquePersistent<v8::Array>(Isolate, v8::Array::New(Isolate))};
        return JSObject;
    }
}

v8::Local<v8::Value> FJsEnvImpl::CreateArray(
    v8::Isolate* Isolate, v8::Local<v8::Context>& Context, FPropertyTranslator* Property, void* ArrayPtr)
{
    auto Array = FixSizeArrayTemplate.Get(Isolate)->GetFunction(Context).ToLocalChecked()->NewInstance(Context).ToLocalChecked();
    DataTransfer::SetPointer(Isolate, Array, ArrayPtr, 0);
    DataTransfer::SetPointer(Isolate, Array, Property, 1);
    return Array;
}

void FJsEnvImpl::InvokeDelegateCallback(UDynamicDelegateProxy* Proxy, void* Params)
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
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

    auto Isolate = MainIsolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    auto Context = DefaultContext.Get(Isolate);
    v8::Context::Scope ContextScope(Context);

    v8::TryCatch TryCatch(Isolate);

    Iter->second->CallJs(Isolate, Context, Proxy->JsFunction.Get(Isolate), Context->Global(), Params);

    if (TryCatch.HasCaught())
    {
        Logger->Error(FString::Printf(TEXT("js callback exception %s"), *FV8Utils::TryCatchToString(Isolate, &TryCatch)));
    }
}

#if !defined(ENGINE_INDEPENDENT_JSENV)
void FJsEnvImpl::JsConstruct(UClass* Class, UObject* Object, const v8::UniquePersistent<v8::Function>& Constructor,
    const v8::UniquePersistent<v8::Object>& Prototype)
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
    auto Isolate = MainIsolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    auto Context = DefaultContext.Get(Isolate);
    v8::Context::Scope ContextScope(Context);

    v8::TryCatch TryCatch(Isolate);

    auto JSObject = FindOrAdd(Isolate, Context, Class, Object)->ToObject(Context).ToLocalChecked();
    // 过时功能(makeUClass)用不影响现有功能的方式修改
    UnBind(Class, Object);
    ObjectMap.Emplace(Object, v8::UniquePersistent<v8::Value>(MainIsolate, JSObject));

    if (!Prototype.IsEmpty())
    {
        (void) (JSObject->SetPrototype(Context, Prototype.Get(Isolate)));
    }

    if (!Constructor.IsEmpty())
    {
        (void) (Constructor.Get(Isolate)->Call(Context, JSObject, 0, nullptr));
    }

    if (TryCatch.HasCaught())
    {
        Logger->Error(FString::Printf(TEXT("js callback exception %s"), *FV8Utils::TryCatchToString(Isolate, &TryCatch)));
    }
}

void FJsEnvImpl::TsConstruct(UTypeScriptGeneratedClass* Class, UObject* Object)
{
#ifdef THREAD_SAFE
    v8::Locker Locker(MainIsolate);
#else
    if (!IsInGameThread())
    {
        Logger->Error(FString::Printf(TEXT("Construct TypeScript Object %s(%p) on illegal thread!"), *Object->GetName(), Object));
    }
#endif
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
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

    if (BindInfoPtr)
    {
        auto Isolate = MainIsolate;
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        auto Context = DefaultContext.Get(Isolate);
        v8::Context::Scope ContextScope(Context);

        v8::TryCatch TryCatch(Isolate);

        v8::Local<v8::Object> JSObject;
        auto PersistentValuePtr = ObjectMap.Find(Object);
        if (!PersistentValuePtr)
        {
            JSObject = FindOrAdd(Isolate, Context, Object->GetClass(), Object, true)->ToObject(Context).ToLocalChecked();

            // FindOrAdd may change BindInfoMap, cause a rehash
            BindInfoPtr = BindInfoMap.Find(Class);
        }
        else
        {
            JSObject = PersistentValuePtr->Get(Isolate).As<v8::Object>();
        }

        //假如是UTypeScriptGeneratedClass的对象，设置成间接Prototype，后续刷新代码对象会自动更新
        if (Object->GetClass() == Class && !BindInfoPtr->Prototype.IsEmpty())
        {
            __USE(JSObject->SetPrototype(Context, BindInfoPtr->Prototype.Get(Isolate)));
        }

        if (!BindInfoPtr->Constructor.IsEmpty())
        {
            __USE(BindInfoPtr->Constructor.Get(Isolate)->Call(Context, JSObject, 0, nullptr));
        }
        if (TryCatch.HasCaught())
        {
            Logger->Error(FString::Printf(TEXT("js callback exception %s"), *FV8Utils::TryCatchToString(Isolate, &TryCatch)));
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
    v8::Locker Locker(MainIsolate);
#endif

    TryReleaseType((UStruct*) ObjectBase);

#if !defined(ENGINE_INDEPENDENT_JSENV)
    BindInfoMap.Remove((UTypeScriptGeneratedClass*) ObjectBase);
#endif

    UnBind(nullptr, (UObject*) ObjectBase, true);

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
                Callback.Get()->JsFunction.Reset();
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
        FMemory::Memzero(RESULT_PARAM, ReturnProp->ArrayDim * ReturnProp->ElementSize);
    }
}

#if !defined(ENGINE_INDEPENDENT_JSENV)
void FJsEnvImpl::InvokeJsMethod(UObject* ContextObject, UJSGeneratedFunction* Function, FFrame& Stack, void* RESULT_PARAM)
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
    auto Isolate = MainIsolate;
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    auto Context = DefaultContext.Get(Isolate);
    v8::Context::Scope ContextScope(Context);

    v8::Local<v8::Value> Self;
    auto GeneratedObjectPtr = ObjectMap.Find(ContextObject);
    if (GeneratedObjectPtr)
    {
        Self = GeneratedObjectPtr->Get(Isolate);
    }

    if (Self.IsEmpty())
    {
        Logger->Error(FString::Printf(TEXT("call %s::%s of %p fail: can not find Binded JavaScript Object"),
            *ContextObject->GetClass()->GetName(), *Function->GetName(), ContextObject));
        SkipFunction(Stack, RESULT_PARAM, Function);
        return;
    }

    v8::TryCatch TryCatch(Isolate);

    Function->FunctionTranslator->CallJs(
        Isolate, Context, Function->JsFunction.Get(Isolate), Self, ContextObject, Stack, RESULT_PARAM);

    if (TryCatch.HasCaught())
    {
        Logger->Error(FString::Printf(TEXT("call %s::%s of %p fail: %s"), *ContextObject->GetClass()->GetName(),
            *Function->GetName(), ContextObject, *FV8Utils::TryCatchToString(Isolate, &TryCatch)));
    }
}

void FJsEnvImpl::InvokeMixinMethod(UObject* ContextObject, UJSGeneratedFunction* Function, FFrame& Stack, void* RESULT_PARAM)
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
    auto Isolate = MainIsolate;
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    auto Context = DefaultContext.Get(Isolate);
    v8::Context::Scope ContextScope(Context);

    v8::Local<v8::Value> Self = FindOrAdd(Isolate, Context, ContextObject->GetClass(), ContextObject);

    auto JsFuncPtr = MixinFunctionMap.Find(Function);
    if (!JsFuncPtr)
    {
        Logger->Error(FString::Printf(TEXT("call %s::%s of %p fail: can not find Binded JavaScript Function"),
            *ContextObject->GetClass()->GetName(), *Function->GetName(), ContextObject));
        SkipFunction(Stack, RESULT_PARAM, Function);
        return;
    }

    v8::TryCatch TryCatch(Isolate);

    Function->FunctionTranslator->CallJs(Isolate, Context, JsFuncPtr->Get(Isolate), Self, ContextObject, Stack, RESULT_PARAM);

    if (TryCatch.HasCaught())
    {
        Logger->Error(FString::Printf(TEXT("call %s::%s of %p fail: %s"), *ContextObject->GetClass()->GetName(),
            *Function->GetName(), ContextObject, *FV8Utils::TryCatchToString(Isolate, &TryCatch)));
    }
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
#ifdef THREAD_SAFE
    v8::Locker Locker(MainIsolate);
#endif
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

    {
        auto Isolate = MainIsolate;
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        auto Context = DefaultContext.Get(Isolate);
        v8::Context::Scope ContextScope(Context);

        v8::Local<v8::Value> ThisObj = v8::Undefined(Isolate);

        if (!Function->HasAnyFunctionFlags(FUNC_Static))
        {
            ThisObj = FindOrAdd(Isolate, Context, ContextObject->GetClass(), ContextObject);
        }

        v8::TryCatch TryCatch(Isolate);

        FuncInfo->FunctionTranslator->CallJs(
            Isolate, Context, FuncInfo->JsFunction.Get(Isolate), ThisObj, ContextObject, Stack, RESULT_PARAM);

        if (TryCatch.HasCaught())
        {
            Logger->Error(FString::Printf(TEXT("call %s::%s of %p fail: %s"), *ContextObject->GetClass()->GetName(),
                *Function->GetName(), ContextObject, *FV8Utils::TryCatchToString(Isolate, &TryCatch)));
        }
    }
}

void FJsEnvImpl::NotifyReBind(UTypeScriptGeneratedClass* Class)
{
    auto Isolate = MainIsolate;
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    MakeSureInject(Class, false, false);
    FinishInjection(Class);

#if WITH_EDITOR
    while (UTypeScriptGeneratedClass* SuperCls = Cast<UTypeScriptGeneratedClass>(Class->GetSuperClass()))
    {
        Class = SuperCls;
    }
    {
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        auto Context = DefaultContext.Get(Isolate);
        v8::Context::Scope ContextScope(Context);

        for (TWeakObjectPtr<UObject>& Iter : Class->GeneratedObjects)
        {
            auto Object = Iter.Get();
            if (!Object || ObjectMap.Find(Object))
                continue;
            if (Object->GetClass()->GetName().StartsWith(TEXT("REINST_")))
                continue;    //跳过父类重新编译后临时状态的对象
            __USE(FindOrAdd(Isolate, Context, Object->GetClass(), Object, true));

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
}
#endif

void FJsEnvImpl::ExecuteDelegate(
    v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::FunctionCallbackInfo<v8::Value>& Info, void* DelegatePtr)
{
    auto Iter = DelegateMap.find(DelegatePtr);
    if (Iter == DelegateMap.end())
    {
        FV8Utils::ThrowException(Isolate, "can not find the delegate!");
    }
    auto SignatureFunction = Iter->second.SignatureFunction;
    if (JsCallbackPrototypeMap.find(SignatureFunction) == JsCallbackPrototypeMap.end())
    {
        JsCallbackPrototypeMap[SignatureFunction] = std::make_unique<FFunctionTranslator>(SignatureFunction, true);
    }

    if (Iter->second.DelegateProperty)
    {
        JsCallbackPrototypeMap[SignatureFunction]->Call(Isolate, Context, Info,
            [ScriptDelegate = static_cast<FScriptDelegate*>(DelegatePtr)](void* Params)
            { ScriptDelegate->ProcessDelegate<UObject>(Params); });
    }
    else
    {
        JsCallbackPrototypeMap[SignatureFunction]->Call(Isolate, Context, Info,
            [MulticastScriptDelegate = static_cast<FMulticastScriptDelegate*>(DelegatePtr)](void* Params)
            { MulticastScriptDelegate->ProcessMulticastDelegate<UObject>(Params); });
    }
}

static FName NAME_Fire("Fire");

bool FJsEnvImpl::AddToDelegate(
    v8::Isolate* Isolate, v8::Local<v8::Context>& Context, void* DelegatePtr, v8::Local<v8::Function> JsFunction)
{
    // UE_LOG(LogTemp, Warning, TEXT("add delegate proxy"));
    auto Iter = DelegateMap.find(DelegatePtr);
    if (Iter == DelegateMap.end())
    {
        return false;
    }
    if (!Iter->second.Owner.IsValid())
    {
        Logger->Warn("try to bind a delegate with invalid owner!");
        ClearDelegate(Isolate, Context, DelegatePtr);
        if (!Iter->second.PassByPointer)
        {
            delete ((FScriptDelegate*) Iter->first);
        }
        DelegateMap.erase(Iter);
        return false;
    }

    auto JsCallbacks = Iter->second.JsCallbacks.Get(Isolate);

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
            if (JsCallbacks->Length() > 0)
            {
                JsCallbacks = v8::Array::New(Isolate);
                Iter->second.JsCallbacks.Reset(Isolate, JsCallbacks);
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

#ifdef THREAD_SAFE
        DelegateProxy->Isolate = Isolate;
#endif
        DelegateProxy->Owner = Iter->second.Owner;
        DelegateProxy->SignatureFunction = Iter->second.SignatureFunction;
        DelegateProxy->DynamicInvoker = DynamicInvoker;

        InitApplyFunc = true;

        SysObjectRetainer.Retain(DelegateProxy);
        Iter->second.Proxy = DelegateProxy;
    }

    if (InitApplyFunc)
    {
        v8::TryCatch TryCatch(Isolate);
        v8::Local<v8::Value> Args[] = {JsCallbacks};

        v8::Local<v8::Value> Apply;
        if (!GenListApply.Get(Isolate)->Call(Context, v8::Undefined(Isolate), 1, Args).ToLocal(&Apply) || !Apply->IsFunction())
        {
            FString ErrMsg = TEXT("Unknow");
            if (TryCatch.HasCaught())
            {
                ErrMsg = FV8Utils::TryCatchToString(Isolate, &TryCatch);
            }
            Logger->Error(FString::Printf(TEXT("gen callback apply fail: %s"), *ErrMsg));
            return false;
        }
        DelegateProxy->JsFunction = v8::UniquePersistent<v8::Function>(Isolate, v8::Local<v8::Function>::Cast(Apply));
    }

    bool bSingleDelegate = Iter->second.DelegateProperty != nullptr;
    (void) (JsCallbacks->Set(Context, bSingleDelegate ? 0 : JsCallbacks->Length(), JsFunction));    // push

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

FScriptDelegate FJsEnvImpl::NewDelegate(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, UObject* Owner,
    v8::Local<v8::Function> JsFunction, UFunction* SignatureFunction)
{
    UDynamicDelegateProxy* DelegateProxy = nullptr;
    if (Owner)
    {
        TArray<TWeakObjectPtr<UDynamicDelegateProxy>>& Callbacks = AutoReleaseCallbacksMap.FindOrAdd(Owner);

        DelegateProxy = NewObject<UDynamicDelegateProxy>();
#ifdef THREAD_SAFE
        DelegateProxy->Isolate = Isolate;
#endif
        DelegateProxy->Owner = Owner;
        DelegateProxy->SignatureFunction = SignatureFunction;
        DelegateProxy->DynamicInvoker = DynamicInvoker;
        DelegateProxy->JsFunction = v8::UniquePersistent<v8::Function>(Isolate, JsFunction);

        SysObjectRetainer.Retain(DelegateProxy);
        Callbacks.Add(DelegateProxy);
    }
    else
    {
        auto CallbacksMap = ManualReleaseCallbackMap.Get(Isolate);
        auto MaybeProxy = CallbacksMap->Get(Context, JsFunction);

        if (MaybeProxy.IsEmpty() || !MaybeProxy.ToLocalChecked()->IsExternal())
        {
            DelegateProxy = NewObject<UDynamicDelegateProxy>();
#ifdef THREAD_SAFE
            DelegateProxy->Isolate = Isolate;
#endif
            DelegateProxy->Owner = DelegateProxy;
            DelegateProxy->SignatureFunction = SignatureFunction;
            DelegateProxy->DynamicInvoker = DynamicInvoker;
            DelegateProxy->JsFunction = v8::UniquePersistent<v8::Function>(Isolate, JsFunction);

            SysObjectRetainer.Retain(DelegateProxy);
            __USE(CallbacksMap->Set(Context, JsFunction, v8::External::New(Context->GetIsolate(), DelegateProxy)));

            ManualReleaseCallbackList.push_back(DelegateProxy);
        }
        else
        {
            DelegateProxy = Cast<UDynamicDelegateProxy>(
                static_cast<UObject*>(v8::Local<v8::External>::Cast(MaybeProxy.ToLocalChecked())->Value()));
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

void FJsEnvImpl::ReleaseManualReleaseDelegate(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    CHECK_V8_ARGS(EArgFunction);

    auto CallbacksMap = ManualReleaseCallbackMap.Get(Isolate);
    auto MaybeProxy = CallbacksMap->Get(Context, Info[0]);
    if (!MaybeProxy.IsEmpty() && MaybeProxy.ToLocalChecked()->IsExternal())
    {
        __USE(CallbacksMap->Delete(Context, Info[0]));
        auto DelegateProxy =
            Cast<UDynamicDelegateProxy>(static_cast<UObject*>(v8::Local<v8::External>::Cast(MaybeProxy.ToLocalChecked())->Value()));
        for (auto it = ManualReleaseCallbackList.begin(); it != ManualReleaseCallbackList.end();)
        {
            if (!it->IsValid())
            {
                it = ManualReleaseCallbackList.erase(it);
            }
            else if (it->Get() == DelegateProxy)
            {
                DelegateProxy->JsFunction.Reset();
                it = ManualReleaseCallbackList.erase(it);
                SysObjectRetainer.Release(DelegateProxy);
            }
            else
            {
                ++it;
            }
        }
    }
}

bool FJsEnvImpl::RemoveFromDelegate(
    v8::Isolate* Isolate, v8::Local<v8::Context>& Context, void* DelegatePtr, v8::Local<v8::Function> JsFunction)
{
    auto Iter = DelegateMap.find(DelegatePtr);
    if (Iter == DelegateMap.end())
    {
        return false;
    }

    FScriptDelegate Delegate;

    if (Iter->second.DelegateProperty)
    {
        return ClearDelegate(Isolate, Context, DelegatePtr);
    }
    else if (Iter->second.MulticastDelegateProperty)
    {
        auto JsCallbacks = Iter->second.JsCallbacks.Get(Isolate);

        v8::Local<v8::Value> Args[] = {JsCallbacks, JsFunction};

        __USE(RemoveListItem.Get(Isolate)->Call(Context, v8::Undefined(Isolate), 2, Args));

        if (JsCallbacks->Length() == 0 && Iter->second.Proxy.IsValid())
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
            DelegateProxy->JsFunction.Reset();
            Iter->second.Proxy.Reset();
        }
    }

    return true;
}

bool FJsEnvImpl::ClearDelegate(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, void* DelegatePtr)
{
    auto Iter = DelegateMap.find(DelegatePtr);
    if (Iter == DelegateMap.end())
    {
        return false;
    }

    auto JSObject = Iter->second.JSObject.Get(Isolate);
    auto Map = v8::Local<v8::Map>::Cast(JSObject->Get(Context, 0).ToLocalChecked());
    Map->Clear();

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
        Iter->second.Proxy->JsFunction.Reset();
        SysObjectRetainer.Release(Iter->second.Proxy.Get());
        Iter->second.Proxy.Reset();
    }

    Iter->second.JsCallbacks.Reset(Isolate, v8::Array::New(Isolate));
    return true;
}

bool FJsEnvImpl::CheckDelegateProxies(float Tick)
{
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
    auto Isolate = MainIsolate;
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif

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
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = DefaultContext.Get(Isolate);
        v8::Context::Scope ContextScope(Context);
        for (int i = 0; i < PendingToRemove.size(); ++i)
        {
            ClearDelegate(Isolate, Context, PendingToRemove[i]);
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

v8::Local<v8::Value> FJsEnvImpl::FindOrAddContainer(
    v8::Isolate* Isolate, v8::Local<v8::Context>& Context, PropertyMacro* Property, FScriptArray* Ptr, bool PassByPointer)
{
    check(Ptr);    // must not null

    auto PersistentValuePtr = ContainerCache.Find(Ptr);
    if (PersistentValuePtr)
    {
        return PersistentValuePtr->Container.Get(Isolate);
    }

    auto Result = ArrayTemplate.Get(Isolate)->InstanceTemplate()->NewInstance(Context).ToLocalChecked();
    BindContainer(Ptr, Result,
        PassByPointer ? FScriptArrayWrapper::OnGarbageCollected : FScriptArrayWrapper::OnGarbageCollectedWithFree, PassByPointer,
        EArray);
    DataTransfer::SetPointer(Isolate, Result, GetContainerPropertyTranslator(Property), 1);
    return Result;
}

v8::Local<v8::Value> FJsEnvImpl::FindOrAddContainer(
    v8::Isolate* Isolate, v8::Local<v8::Context>& Context, PropertyMacro* Property, FScriptSet* Ptr, bool PassByPointer)
{
    check(Ptr);    // must not null

    auto PersistentValuePtr = ContainerCache.Find(Ptr);
    if (PersistentValuePtr)
    {
        return PersistentValuePtr->Container.Get(Isolate);
    }

    auto Result = SetTemplate.Get(Isolate)->InstanceTemplate()->NewInstance(Context).ToLocalChecked();
    BindContainer(Ptr, Result,
        PassByPointer ? FScriptSetWrapper::OnGarbageCollected : FScriptSetWrapper::OnGarbageCollectedWithFree, PassByPointer, ESet);
    DataTransfer::SetPointer(Isolate, Result, GetContainerPropertyTranslator(Property), 1);
    return Result;
}

v8::Local<v8::Value> FJsEnvImpl::FindOrAddContainer(v8::Isolate* Isolate, v8::Local<v8::Context>& Context,
    PropertyMacro* KeyProperty, PropertyMacro* ValueProperty, FScriptMap* Ptr, bool PassByPointer)
{
    check(Ptr);    // must not null

    auto PersistentValuePtr = ContainerCache.Find(Ptr);
    if (PersistentValuePtr)
    {
        return PersistentValuePtr->Container.Get(Isolate);
    }

    auto Result = MapTemplate.Get(Isolate)->InstanceTemplate()->NewInstance(Context).ToLocalChecked();
    BindContainer(Ptr, Result,
        PassByPointer ? FScriptMapWrapper::OnGarbageCollected : FScriptMapWrapper::OnGarbageCollectedWithFree, PassByPointer, EMap);
    DataTransfer::SetPointer(Isolate, Result, GetContainerPropertyTranslator(KeyProperty), 1);
    DataTransfer::SetPointer(Isolate, Result, GetContainerPropertyTranslator(ValueProperty), 2);
    return Result;
}

void FJsEnvImpl::BindStruct(
    FScriptStructWrapper* ScriptStructWrapper, void* Ptr, v8::Local<v8::Object> JSObject, bool PassByPointer)
{
    DataTransfer::SetPointer(MainIsolate, JSObject, Ptr, 0);
    DataTransfer::SetPointer(
        MainIsolate, JSObject, static_cast<UScriptStruct*>(ScriptStructWrapper->Struct.Get()), 1);    // add type info

    if (!PassByPointer)
    {
// Optimization branch:
// ArrayBuffer will be gced on v8 worker thread
// for pod ustruct it's safe to use it
#if defined(HAS_ARRAYBUFFER_NEW_WITHOUT_STL) || defined(WITH_BACKING_STORE_AUTO_FREE)
        bool bStructTriviallyFreed = false;
        if (ScriptStructWrapper->Struct.IsValid())
        {
            UScriptStruct* Struct = Cast<UScriptStruct>(ScriptStructWrapper->Struct.Get());
            bStructTriviallyFreed = Struct->StructFlags & EStructFlags::STRUCT_IsPlainOldData;
        }
        if (bStructTriviallyFreed)
        {
#if defined(HAS_ARRAYBUFFER_NEW_WITHOUT_STL)
            auto MemoryHolder = v8::ArrayBuffer_New_Without_Stl(
                MainIsolate, Ptr, ScriptStructWrapper->Struct->GetStructureSize(),
                [](void* Data, size_t Length, void* DeleterData)
                {
                    // TFScriptStructWrapper存放在TypeReflectionMap中，Isolate先Dispose后，对象才跟着销毁
                    FScriptStructWrapper* StructInfo = static_cast<FScriptStructWrapper*>(DeleterData);
                    FScriptStructWrapper::Free(StructInfo->Struct, StructInfo->ExternalFinalize, Data);
                },
                ScriptStructWrapper);
            __USE(JSObject->Set(MainIsolate->GetCurrentContext(), 0, MemoryHolder));
            return;    // early return
#elif WITH_BACKING_STORE_AUTO_FREE
            auto Backing = v8::ArrayBuffer::NewBackingStore(
                Ptr, ScriptStructWrapper->Struct->GetStructureSize(),
                [](void* Data, size_t Length, void* DeleterData)
                {
                    // TFScriptStructWrapper存放在TypeReflectionMap中，Isolate先Dispose后，对象才跟着销毁
                    FScriptStructWrapper* StructInfo = static_cast<FScriptStructWrapper*>(DeleterData);
                    FScriptStructWrapper::Free(StructInfo->Struct, StructInfo->ExternalFinalize, Data);
                },
                ScriptStructWrapper);
            auto MemoryHolder = v8::ArrayBuffer::New(MainIsolate, std::move(Backing));
            __USE(JSObject->Set(MainIsolate->GetCurrentContext(), 0, MemoryHolder));
            return;    // early return
#endif
        }
#endif
        auto CacheNodePtr = StructCache.Find(Ptr);
        if (CacheNodePtr)
        {
            auto Temp = CacheNodePtr->Find(ScriptStructWrapper->Struct.Get());
            CacheNodePtr = Temp ? Temp : CacheNodePtr->Add(ScriptStructWrapper->Struct.Get());
        }
        else
        {
            CacheNodePtr = &StructCache.Emplace(Ptr, FObjectCacheNode(ScriptStructWrapper->Struct.Get()));
        }
        CacheNodePtr->Value.Reset(MainIsolate, JSObject);
        CacheNodePtr->UserData = ScriptStructWrapper;
        CacheNodePtr->Value.SetWeak<FScriptStructWrapper>(
            ScriptStructWrapper, FScriptStructWrapper::OnGarbageCollectedWithFree, v8::WeakCallbackType::kInternalFields);
    }
    else
    {
        auto CacheNodePtr = StructCache.Find(Ptr);
        if (CacheNodePtr)
        {
            CacheNodePtr = CacheNodePtr->Add(ScriptStructWrapper->Struct.Get());
        }
        else
        {
            CacheNodePtr = &StructCache.Emplace(Ptr, FObjectCacheNode(ScriptStructWrapper->Struct.Get()));
        }
        CacheNodePtr->Value.Reset(MainIsolate, JSObject);
        CacheNodePtr->Value.SetWeak<FScriptStructWrapper>(
            ScriptStructWrapper, FScriptStructWrapper::OnGarbageCollected, v8::WeakCallbackType::kInternalFields);
    }
}

void FJsEnvImpl::BindCppObject(
    v8::Isolate* InIsolate, JSClassDefinition* ClassDefinition, void* Ptr, v8::Local<v8::Object> JSObject, bool PassByPointer)
{
    CppObjectMapper.BindCppObject(InIsolate, ClassDefinition, Ptr, JSObject, PassByPointer);
}

void* FJsEnvImpl::GetPrivateData(v8::Local<v8::Context> Context, v8::Local<v8::Object> JSObject)
{
    return CppObjectMapper.GetPrivateData(Context, JSObject);
}

void FJsEnvImpl::SetPrivateData(v8::Local<v8::Context> Context, v8::Local<v8::Object> JSObject, void* Ptr)
{
    CppObjectMapper.SetPrivateData(Context, JSObject, Ptr);
}

v8::MaybeLocal<v8::Function> FJsEnvImpl::LoadTypeById(v8::Local<v8::Context> Context, const void* TypeId)
{
    return CppObjectMapper.LoadTypeById(Context, TypeId);
}

void FJsEnvImpl::UnBindStruct(FScriptStructWrapper* ScriptStructWrapper, void* Ptr)
{
    auto CacheNodePtr = StructCache.Find(Ptr);
    if (CacheNodePtr)
    {
        (void) (CacheNodePtr->Remove(ScriptStructWrapper->Struct.Get(), true));
        if (!CacheNodePtr->TypeId)    // last one
        {
            StructCache.Remove(Ptr);
        }
    }
}

void FJsEnvImpl::UnBindCppObject(v8::Isolate* Isolate, JSClassDefinition* ClassDefinition, void* Ptr)
{
    CppObjectMapper.UnBindCppObject(Isolate, ClassDefinition, Ptr);
}

void FJsEnvImpl::BindContainer(void* Ptr, v8::Local<v8::Object> JSObject, void (*Callback)(const v8::WeakCallbackInfo<void>& data),
    bool PassByPointer, ContainerType Type)
{
    DataTransfer::SetPointer(MainIsolate, JSObject, Ptr, 0);
    ContainerCacheItem& Val =
        ContainerCache.Add(Ptr, {v8::UniquePersistent<v8::Value>(MainIsolate, JSObject), !PassByPointer, Type});
    Val.Container.SetWeak<void>(nullptr, Callback, v8::WeakCallbackType::kInternalFields);
}

void FJsEnvImpl::UnBindContainer(void* Ptr)
{
    ContainerCache.Remove(Ptr);
}

std::shared_ptr<FStructWrapper> FJsEnvImpl::GetStructWrapper(UStruct* InStruct, bool& IsReuseTemplate)
{
    const auto FullName = InStruct->GetFullName();
    auto TypeReflectionPtr = TypeReflectionMap.Find(FullName);
    if (!TypeReflectionPtr)
    {
        auto Ret = std::make_shared<FStructWrapper>(InStruct);
        TypeReflectionMap.Add(FullName, Ret);
        // UE_LOG(LogTemp, Warning, TEXT("FJsEnvImpl::GetStructWrapper new %s // %s"), *InStruct->GetName(), *FullName);
        return Ret;
    }
    else
    {
#if PUERTS_REUSE_STRUCTWRAPPER_FUNCTIONTEMPLATE
        IsReuseTemplate = true;
#endif
        // UE_LOG(LogTemp, Warning, TEXT("FJsEnvImpl::GetStructWrapper existed %s // %s"), *InStruct->GetName(), *FullName);
        (*TypeReflectionPtr)->Init(InStruct, IsReuseTemplate);
        return (*TypeReflectionPtr);
    }
}

FJsEnvImpl::FTemplateInfo* FJsEnvImpl::GetTemplateInfoOfType(UStruct* InStruct, bool& Existed)
{
    auto Isolate = MainIsolate;
    auto TemplateInfoPtr = TypeToTemplateInfoMap.Find(InStruct);
    if (!TemplateInfoPtr)
    {
        if (!ExtensionMethodsMapInited)
        {
            InitExtensionMethodsMap();
        }
        v8::Local<v8::FunctionTemplate> Template;

        bool IsReuseTemplate = false;
        auto StructWrapper = GetStructWrapper(InStruct, IsReuseTemplate);

        auto ExtensionMethodsIter = ExtensionMethodsMap.find(InStruct);
        if (ExtensionMethodsIter != ExtensionMethodsMap.end())
        {
            StructWrapper->AddExtensionMethods(ExtensionMethodsIter->second);
            ExtensionMethodsMap.erase(ExtensionMethodsIter);
        }

        if (auto ScriptStruct = Cast<UScriptStruct>(InStruct))
        {
            // Logger->Warn(FString::Printf(TEXT("UScriptStruct: %s"), *InStruct->GetName()));

            Template = StructWrapper->ToFunctionTemplate(Isolate, FScriptStructWrapper::New);
            if (!IsReuseTemplate)
            {
#if WITH_EDITOR
                Template->SetClassName(
                    v8::String::NewFromUtf8(Isolate, TCHAR_TO_UTF8(*InStruct->GetPathName()), v8::NewStringType::kNormal)
                        .ToLocalChecked());
#elif !defined(UE_SHIPPING)
                Template->SetClassName(
                    v8::String::NewFromUtf8(Isolate, TCHAR_TO_UTF8(*InStruct->GetName()), v8::NewStringType::kNormal)
                        .ToLocalChecked());
#endif
            }
            if (!ScriptStruct->IsNative())    //非原生的结构体，可能在实例没有的时候会释放
            {
                SysObjectRetainer.Retain(ScriptStruct);
            }

            auto SuperStruct = ScriptStruct->GetSuperStruct();
            if (SuperStruct)
            {
                bool Dummy;
                if (IsReuseTemplate)
                    __USE(GetTemplateInfoOfType(SuperStruct, Dummy));
                else
                    Template->Inherit(GetTemplateInfoOfType(SuperStruct, Dummy)->Template.Get(Isolate));
            }
        }
        else
        {
            auto Class = Cast<UClass>(InStruct);
            check(Class);
            Template = StructWrapper->ToFunctionTemplate(Isolate, FClassWrapper::New);
            if (!IsReuseTemplate)
            {
#if WITH_EDITOR
                Template->SetClassName(
                    v8::String::NewFromUtf8(Isolate, TCHAR_TO_UTF8(*InStruct->GetPathName()), v8::NewStringType::kNormal)
                        .ToLocalChecked());
#elif !defined(UE_SHIPPING)
                Template->SetClassName(
                    v8::String::NewFromUtf8(Isolate, TCHAR_TO_UTF8(*InStruct->GetName()), v8::NewStringType::kNormal)
                        .ToLocalChecked());
#endif
            }
#if PUERTS_KEEP_UOBJECT_REFERENCE
            StructWrapper->IsNativeTakeJsRef = StructWrapper->IsTypeScriptGeneratedClass = IsTypeScriptGeneratedClass(Class);
#endif
            auto SuperClass = Class->GetSuperClass();
            if (SuperClass)
            {
                bool Dummy;
                auto SuperTemplateInfo = GetTemplateInfoOfType(SuperClass, Dummy);
                if (!IsReuseTemplate)
                {
                    Template->Inherit(SuperTemplateInfo->Template.Get(Isolate));
                }
                if (SuperTemplateInfo->StructWrapper->IsNativeTakeJsRef)
                {
                    StructWrapper->IsNativeTakeJsRef = true;
                }
            }
        }

        Existed = false;
        return &TypeToTemplateInfoMap.Add(InStruct, {v8::UniquePersistent<v8::FunctionTemplate>(Isolate, Template), StructWrapper});
    }
    else
    {
        Existed = true;
        return TemplateInfoPtr;
    }
}

v8::Local<v8::Function> FJsEnvImpl::GetJsClass(UStruct* InStruct, v8::Local<v8::Context> Context)
{
    bool Existed;
    auto Ret = GetTemplateInfoOfType(InStruct, Existed)->Template.Get(MainIsolate)->GetFunction(Context).ToLocalChecked();

    if (UNLIKELY(!Existed))    // first create
    {
        auto Class = Cast<UClass>(InStruct);
#if !defined(ENGINE_INDEPENDENT_JSENV)
        if (Class && !Class->IsNative() && !InStruct->IsA<UTypeScriptGeneratedClass>())
        {
            auto SuperClass = Cast<UTypeScriptGeneratedClass>(Class->GetSuperClass());
            if (SuperClass)
            {
                MakeSureInject(SuperClass, false, false);
                v8::Local<v8::Value> VProto;
                if (Ret->Get(Context, FV8Utils::ToV8String(MainIsolate, "prototype")).ToLocal(&VProto) && VProto->IsObject())
                {
                    v8::Local<v8::Object> Proto = VProto.As<v8::Object>();
                    __USE(Proto->SetPrototype(Context, BindInfoMap[SuperClass].Prototype.Get(MainIsolate)));
                }
            }
        }
#endif
    }

    return Ret;
}

bool FJsEnvImpl::IsInstanceOf(UStruct* Struct, v8::Local<v8::Object> JsObject)
{
    //这里如果外面传一个非uobject或者ustructsrcipt的object,可能会有问题
    if (Cast<UScriptStruct>(Struct))
    {
        UScriptStruct* ObjectStruct = (UScriptStruct*) FV8Utils::GetPointer(JsObject, 1);
        return ObjectStruct && ObjectStruct->IsChildOf(Struct);
    }
    else
    {
        UObject* Object = FV8Utils::GetUObject(JsObject);
        if (!Object || Object == RELEASED_UOBJECT)
        {
            return false;
        }
        return Object->GetClass()->IsChildOf(Struct);
    }
}

bool FJsEnvImpl::IsInstanceOfCppObject(v8::Isolate* Isolate, const void* TypeId, v8::Local<v8::Object> JsObject)
{
    return CppObjectMapper.IsInstanceOfCppObject(Isolate, TypeId, JsObject);
}

std::weak_ptr<int> FJsEnvImpl::GetJsEnvLifeCycleTracker()
{
    return CppObjectMapper.GetJsEnvLifeCycleTracker();
}

v8::Local<v8::Value> FJsEnvImpl::AddSoftObjectPtr(
    v8::Isolate* Isolate, v8::Local<v8::Context> Context, FSoftObjectPtr* SoftObjectPtr, UClass* Class, bool IsSoftClass)
{
    const auto JSObject = SoftObjectPtrTemplate.Get(Isolate)->InstanceTemplate()->NewInstance(Context).ToLocalChecked();
    DataTransfer::SetPointer(Isolate, JSObject, SoftObjectPtr, 0);
    DataTransfer::SetPointer(Isolate, JSObject, Class, IsSoftClass ? 2 : 1);
    DataTransfer::SetPointer(Isolate, JSObject, nullptr, IsSoftClass ? 1 : 2);
    v8::Global<v8::Object>* GlobalPtr = new v8::Global<v8::Object>(Isolate, JSObject);
    GlobalPtr->SetWeak<v8::Global<v8::Object>>(
        GlobalPtr,
        [](const v8::WeakCallbackInfo<v8::Global<v8::Object>>& Data)
        {
            void* Ptr = DataTransfer::MakeAddressWithHighPartOfTwo(Data.GetInternalField(0), Data.GetInternalField(1));
            delete static_cast<FSoftObjectPtr*>(Ptr);
            delete Data.GetParameter();
        },
        v8::WeakCallbackType::kInternalFields);
    return JSObject;
}

v8::Local<v8::Value> FJsEnvImpl::UETypeToJsClass(v8::Isolate* Isolate, v8::Local<v8::Context> Context, UField* Type)
{
    if (const auto Struct = Cast<UStruct>(Type))
    {
        return GetJsClass(Struct, Context);
    }

    if (const auto Enum = Cast<UEnum>(Type))
    {
        auto Result = v8::Object::New(Isolate);
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
            auto Value = Enum->GetValueByIndex(i);
            __USE(Result->Set(Context, FV8Utils::ToV8String(Isolate, Name), v8::Number::New(Isolate, Value)));
            __USE(Result->Set(Context, v8::Number::New(Isolate, Value), FV8Utils::ToV8String(Isolate, Name)));
        }
        __USE(Result->Set(
            Context, FV8Utils::ToV8String(Isolate, "__puerts_ufield"), FindOrAdd(Isolate, Context, Enum->GetClass(), Enum)));
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
                    __USE(Result->Set(Context, FV8Utils::ToV8String(Isolate, ChannelName), v8::Number::New(Isolate, ObjectType)));
                    __USE(Result->Set(Context, v8::Number::New(Isolate, ObjectType), FV8Utils::ToV8String(Isolate, ChannelName)));
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
                    __USE(Result->Set(Context, FV8Utils::ToV8String(Isolate, ChannelName), v8::Number::New(Isolate, TraceType)));
                    __USE(Result->Set(Context, v8::Number::New(Isolate, TraceType), FV8Utils::ToV8String(Isolate, ChannelName)));
                }
                ContainerIndex++;
            }
        }
#endif
        return Result;
    }

    return v8::Undefined(Isolate);
}

void FJsEnvImpl::LoadUEType(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    CHECK_V8_ARGS(EArgString);

    const FString TypeName = FV8Utils::ToFString(Isolate, Info[0]);

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
        FV8Utils::ThrowException(Isolate,
            FString::Printf(TEXT("%s is blueprint type, load it using UE.Class.Load('path/to/your/blueprint/file')."), *TypeName));
        return;
    }

    auto Result = UETypeToJsClass(Isolate, Context, Type);

    if (Result->IsUndefined())
    {
        FV8Utils::ThrowException(Isolate, FString::Printf(TEXT("can not find type:%s"), *TypeName));
    }
    else
    {
        Info.GetReturnValue().Set(Result);
    }
}

void FJsEnvImpl::LoadCppType(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    CppObjectMapper.LoadCppType(Info);
}

void FJsEnvImpl::UEClassToJSClass(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    CHECK_V8_ARGS(EArgObject);

    UField* Type = nullptr;
    if (UObject* Object = FV8Utils::GetUObject(Context, Info[0]))
    {
        if (FV8Utils::IsReleasedPtr(Object))
        {
            FV8Utils::ThrowException(Isolate, "passing a invalid object");
            return;
        }
        Type = Cast<UField>(Object);
    }

    if (Type)
    {
        Info.GetReturnValue().Set(UETypeToJsClass(Isolate, Context, Type));
    }
    else
    {
        FV8Utils::ThrowException(Isolate, FString::Printf(TEXT("argument #0 expect a UField")));
    }
}

void FJsEnvImpl::SetJsTakeRefInTs(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    CHECK_V8_ARGS(EArgObject);

    UObject* Object = FV8Utils::GetUObject(Context, Info[0]);

    bool Existed;
    auto TemplateInfoPtr = GetTemplateInfoOfType(Object->GetClass(), Existed);
    SetJsTakeRef(Object, static_cast<FClassWrapper*>(TemplateInfoPtr->StructWrapper.get()));
}

bool FJsEnvImpl::GetContainerTypeProperty(v8::Local<v8::Context> Context, v8::Local<v8::Value> Value, PropertyMacro** PropertyPtr)
{
    if (Value->IsInt32())
    {
        int Type = Value->Int32Value(Context).ToChecked();
        if (Type >= MaxBuiltinType)
        {
            *PropertyPtr = nullptr;
            return false;
        }
        *PropertyPtr = ContainerMeta.GetBuiltinProperty((BuiltinType) Type);
        return true;
    }
    else if (auto Field = Cast<UField>(FV8Utils::GetUObject(Context, Value)))
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

void FJsEnvImpl::NewContainer(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    CHECK_V8_ARGS(EArgInt32);

    int ContainerType = Info[0]->Int32Value(Context).ToChecked();

    PropertyMacro* Property1 = nullptr;
    PropertyMacro* Property2 = nullptr;
    FScriptArray* ScriptArray = nullptr;
    FScriptSet* ScriptSet = nullptr;
    FScriptMap* ScriptMap = nullptr;

    if (!GetContainerTypeProperty(Context, Info[1], &Property1))
    {
        FV8Utils::ThrowException(Isolate, FString::Printf(TEXT("can not get first type for %d"), ContainerType));
        return;
    }

    switch (ContainerType)
    {
        case 0:    // Array
            ScriptArray = reinterpret_cast<FScriptArray*>(new FScriptArrayEx(Property1));
            // Logger->Info(FString::Printf(TEXT("Array %s"), *Property1->GetClass()->GetName()));
            Info.GetReturnValue().Set(FindOrAddContainer(Isolate, Context, Property1, ScriptArray, false));
            break;
        case 1:    // Set
            ScriptSet = reinterpret_cast<FScriptSet*>(new FScriptSetEx(Property1));
            // Logger->Info(FString::Printf(TEXT("Set %s"), *Property1->GetClass()->GetName()));
            Info.GetReturnValue().Set(FindOrAddContainer(Isolate, Context, Property1, ScriptSet, false));
            break;
        case 2:    // Map
            if (!GetContainerTypeProperty(Context, Info[2], &Property2))
            {
                FV8Utils::ThrowException(Isolate, FString::Printf(TEXT("can not get second type for %d"), ContainerType));
                return;
            }
            // Logger->Info(FString::Printf(TEXT("Map %s %s"), *Property1->GetClass()->GetName(),
            // *Property2->GetClass()->GetName()));
            ScriptMap = reinterpret_cast<FScriptMap*>(new FScriptMapEx(Property1, Property2));
            Info.GetReturnValue().Set(FindOrAddContainer(Isolate, Context, Property1, Property2, ScriptMap, false));
            break;
        default:
            FV8Utils::ThrowException(Isolate, FString::Printf(TEXT("invalid container type %d"), ContainerType));
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

    auto Isolate = MainIsolate;
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    auto Context = v8::Local<v8::Context>::New(Isolate, DefaultContext);
    v8::Context::Scope ContextScope(Context);

    auto MaybeTGameTGJS = Context->Global()->Get(Context, FV8Utils::ToV8String(Isolate, "puerts"));

    if (MaybeTGameTGJS.IsEmpty() || !MaybeTGameTGJS.ToLocalChecked()->IsObject())
    {
        Logger->Error("global.puerts not found!");
        return;
    }

    auto TGJS = MaybeTGameTGJS.ToLocalChecked()->ToObject(Context).ToLocalChecked();

    auto MaybeArgv = TGJS->Get(Context, FV8Utils::ToV8String(Isolate, "argv"));

    if (MaybeArgv.IsEmpty() || !MaybeArgv.ToLocalChecked()->IsObject())
    {
        Logger->Error("global.puerts.argv not found!");
        return;
    }

    auto Argv = MaybeArgv.ToLocalChecked()->ToObject(Context).ToLocalChecked();

    auto MaybeArgvAdd = Argv->Get(Context, FV8Utils::ToV8String(Isolate, "add"));

    if (MaybeArgvAdd.IsEmpty() || !MaybeArgvAdd.ToLocalChecked()->IsFunction())
    {
        Logger->Error("global.puerts.argv.add not found!");
        return;
    }

    auto ArgvAdd = MaybeArgvAdd.ToLocalChecked().As<v8::Function>();

    for (int i = 0; i < Arguments.Num(); i++)
    {
        auto Object = Arguments[i].Value;
        v8::Local<v8::Value> Args[2] = {
            FV8Utils::ToV8String(Isolate, Arguments[i].Key), FindOrAdd(Isolate, Context, Object->GetClass(), Object)};
        (void) (ArgvAdd->Call(Context, Argv, 2, Args));
    }

    v8::TryCatch TryCatch(Isolate);
    v8::Local<v8::Value> Args[] = {FV8Utils::ToV8String(Isolate, ModuleNameOrScript)};
    __USE(Require.Get(Isolate)->Call(Context, v8::Undefined(Isolate), 1, Args));
    if (TryCatch.HasCaught())
    {
        Logger->Error(FV8Utils::TryCatchToString(Isolate, &TryCatch));
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

#ifndef WITH_QUICKJS
std::unordered_multimap<int, FJsEnvImpl::FModuleInfo*>::iterator FJsEnvImpl::FindModuleInfo(v8::Local<v8::Module> Module)
{
    auto Range = HashToModuleInfo.equal_range(Module->GetIdentityHash());
    for (auto It = Range.first; It != Range.second; ++It)
    {
        if (It->second->Module == Module)
        {
            return It;
        }
    }
    return HashToModuleInfo.end();
}

v8::MaybeLocal<v8::Module> FJsEnvImpl::ResolveModuleCallback(v8::Local<v8::Context> Context, v8::Local<v8::String> Specifier,
#if V8_MAJOR_VERSION >= 9
    v8::Local<v8::FixedArray> ImportAttributes,    // not implement yet
#endif
    v8::Local<v8::Module> Referrer)
{
    auto Self = static_cast<FJsEnvImpl*>(FV8Utils::IsolateData<IObjectMapper>(Context->GetIsolate()));
    const auto ItModuleInfo = Self->FindModuleInfo(Referrer);
    check(ItModuleInfo != Self->HashToModuleInfo.end());
    const auto RefModuleName = FV8Utils::ToFString(Context->GetIsolate(), Specifier);
    auto ItRefModule = ItModuleInfo->second->ResolveCache.Find(RefModuleName);
    check(ItRefModule);
    return (*ItRefModule).Get(Context->GetIsolate());
}

v8::MaybeLocal<v8::Module> FJsEnvImpl::FetchCJSModuleAsESModule(v8::Local<v8::Context> Context, const FString& ModuleName)
{
#if V8_MAJOR_VERSION < 8
    FV8Utils::ThrowException(
        MainIsolate, FString::Printf(TEXT("V8_MAJOR_VERSION < 8 not support fetch CJS module [%s] from ESM"), *ModuleName));
    return v8::MaybeLocal<v8::Module>();
#else
    const auto Isolate = Context->GetIsolate();

    Logger->Info(FString::Printf(TEXT("ESM Fetch CJS Module: %s"), *ModuleName));

    v8::Local<v8::Value> Args[] = {FV8Utils::ToV8String(Isolate, ModuleName)};

    auto MaybeRet = Require.Get(Isolate)->Call(Context, v8::Undefined(Isolate), 1, Args);

    if (MaybeRet.IsEmpty())
    {
        return v8::MaybeLocal<v8::Module>();
    }

    auto CJSValue = MaybeRet.ToLocalChecked();
    std::vector<v8::Local<v8::String>> ExportNames = {
        v8::String::NewFromUtf8(Isolate, "default", v8::NewStringType::kNormal).ToLocalChecked()};

    if (CJSValue->IsObject())
    {
        auto JsObject = CJSValue->ToObject(Context).ToLocalChecked();
        auto Keys = JsObject->GetOwnPropertyNames(Context).ToLocalChecked();
        for (decltype(Keys->Length()) i = 0; i < Keys->Length(); ++i)
        {
            v8::Local<v8::Value> Key;
            if (Keys->Get(Context, i).ToLocal(&Key))
            {
                // UE_LOG(LogTemp, Warning, TEXT("---'%s' '%s'"), *ModuleName, *FV8Utils::ToFString(Isolate, Key));
                ExportNames.push_back(Key->ToString(Context).ToLocalChecked());
            }
        }
    }

    v8::Local<v8::Module> SyntheticModule =
#if defined(V8_HAS_WRAP_API_WITHOUT_STL)
        v8::Module_CreateSyntheticModule_Without_Stl(Isolate, FV8Utils::ToV8String(Isolate, ModuleName), ExportNames.data(),
            ExportNames.size(),
#else
        v8::Module::CreateSyntheticModule(Isolate, FV8Utils::ToV8String(Isolate, ModuleName), ExportNames,
#endif
            [](v8::Local<v8::Context> ContextInner, v8::Local<v8::Module> Module) -> v8::MaybeLocal<v8::Value>
            {
                const auto IsolateInner = ContextInner->GetIsolate();
                auto Self = static_cast<FJsEnvImpl*>(FV8Utils::IsolateData<IObjectMapper>(IsolateInner));

                const auto ModuleInfoIt = Self->FindModuleInfo(Module);
                check(ModuleInfoIt != Self->HashToModuleInfo.end());
                auto CJSValueInner = ModuleInfoIt->second->CJSValue.Get(IsolateInner);

                __USE(Module->SetSyntheticModuleExport(IsolateInner,
                    v8::String::NewFromUtf8(IsolateInner, "default", v8::NewStringType::kNormal).ToLocalChecked(), CJSValueInner));

                if (CJSValueInner->IsObject())
                {
                    auto JsObjectInner = CJSValueInner->ToObject(ContextInner).ToLocalChecked();
                    auto KeysInner = JsObjectInner->GetOwnPropertyNames(ContextInner).ToLocalChecked();
                    for (decltype(KeysInner->Length()) ii = 0; ii < KeysInner->Length(); ++ii)
                    {
                        v8::Local<v8::Value> KeyInner;
                        v8::Local<v8::Value> ValueInner;
                        if (KeysInner->Get(ContextInner, ii).ToLocal(&KeyInner) &&
                            JsObjectInner->Get(ContextInner, KeyInner).ToLocal(&ValueInner))
                        {
                            // UE_LOG(LogTemp, Warning, TEXT("-----set '%s'"), *FV8Utils::ToFString(IsolateInner, KeyInner));
                            __USE(Module->SetSyntheticModuleExport(
                                IsolateInner, KeyInner->ToString(ContextInner).ToLocalChecked(), ValueInner));
                        }
                    }
                }

                return v8::MaybeLocal<v8::Value>(v8::True(IsolateInner));
            });

    FModuleInfo* Info = new FModuleInfo;
    Info->Module.Reset(Isolate, SyntheticModule);
    Info->CJSValue.Reset(Isolate, CJSValue);
    HashToModuleInfo.emplace(SyntheticModule->GetIdentityHash(), Info);

    return SyntheticModule;
#endif
}

v8::MaybeLocal<v8::Module> FJsEnvImpl::FetchESModuleTree(v8::Local<v8::Context> Context, const FString& FileName)
{
    const auto Isolate = Context->GetIsolate();
    if (PathToModule.Contains(FileName))
    {
        return PathToModule[FileName].Get(Isolate);
    }

    Logger->Info(FString::Printf(TEXT("Fetch ES Module: %s"), *FileName));
    TArray<uint8> Data;
    if (!ModuleLoader->Load(FileName, Data))
    {
        FV8Utils::ThrowException(MainIsolate, FString::Printf(TEXT("can not load [%s]"), *FileName));
        return v8::MaybeLocal<v8::Module>();
    }

    v8::Local<v8::String> Source;

    v8::ScriptCompiler::CachedData* CachedCode = nullptr;
    v8::ScriptCompiler::CompileOptions Options = v8::ScriptCompiler::CompileOptions::kNoCompileOptions;
#if defined(WITH_V8_BYTECODE)
    if (FileName.EndsWith(TEXT(".mbc")))
    {
        FCodeCacheHeader* CodeCacheHeader = (FCodeCacheHeader*) Data.GetData();
        if (CodeCacheHeader->FlagHash != Expect_FlagHash)
        {
            UE_LOG(Puerts, Warning, TEXT("FlagHash not match expect %u, but got %u"), Expect_FlagHash, CodeCacheHeader->FlagHash);
            CodeCacheHeader->FlagHash = Expect_FlagHash;
        }
#if V8_MAJOR_VERSION >= 11
        if (CodeCacheHeader->ReadOnlySnapshotChecksum != Expect_ReadOnlySnapshotChecksum)
        {
            UE_LOG(Puerts, Warning, TEXT("ReadOnlySnapshotChecksum not match expect %u, but got %u"),
                Expect_ReadOnlySnapshotChecksum, CodeCacheHeader->ReadOnlySnapshotChecksum);
            CodeCacheHeader->ReadOnlySnapshotChecksum = Expect_ReadOnlySnapshotChecksum;
        }
#endif
        static constexpr uint32_t kModuleFlagMask = (1 << 31);
        uint32_t Len = CodeCacheHeader->SourceHash & ~kModuleFlagMask;
        v8::Local<v8::Value> Args[] = {v8::Integer::New(Isolate, Len)};
        v8::Local<v8::Value> Ret;
        if (!GenEmptyCode.Get(Isolate)->Call(Context, v8::Undefined(Isolate), 1, Args).ToLocal(&Ret) || !Ret->IsString())
        {
            FV8Utils::ThrowException(MainIsolate, FString::Printf(TEXT("generate code for bytecode [%s] fail!"), *FileName));
            return v8::MaybeLocal<v8::Module>();
        }
        CachedCode = new v8::ScriptCompiler::CachedData(Data.GetData(), Data.Num());    // will delete by ~Source
        Options = v8::ScriptCompiler::CompileOptions::kConsumeCodeCache;
        Source = Ret.As<v8::String>();
    }
    else
#endif
    {
        FString Script;
        FFileHelper::BufferToString(Script, Data.GetData(), Data.Num());
        Source = FV8Utils::ToV8String(Isolate, Script);
    }

#if V8_MAJOR_VERSION > 8
    v8::ScriptOrigin Origin(
        Isolate, FV8Utils::ToV8String(Isolate, FileName), 0, 0, false, -1, v8::Local<v8::Value>(), false, false, true);
#else
    v8::ScriptOrigin Origin(FV8Utils::ToV8String(Isolate, FileName), v8::Local<v8::Integer>(), v8::Local<v8::Integer>(),
        v8::Local<v8::Boolean>(), v8::Local<v8::Integer>(), v8::Local<v8::Value>(), v8::Local<v8::Boolean>(),
        v8::Local<v8::Boolean>(), v8::True(Isolate));
#endif
    v8::ScriptCompiler::Source ScriptSource(Source, Origin, CachedCode);

    v8::Local<v8::Module> Module;
    if (!v8::ScriptCompiler::CompileModule(Isolate, &ScriptSource, Options).ToLocal(&Module))
    {
        return v8::MaybeLocal<v8::Module>();
    }

    PathToModule.Add(FileName, v8::Global<v8::Module>(Isolate, Module));
    FModuleInfo* Info = new FModuleInfo;
    Info->Module.Reset(Isolate, Module);
    HashToModuleInfo.emplace(Module->GetIdentityHash(), Info);

    auto DirName = FPaths::GetPath(FileName);

#if V8_MAJOR_VERSION >= 9
    v8::Local<v8::FixedArray> module_requests = Module->GetModuleRequests();
    for (int i = 0, Length = module_requests->Length(); i < Length; ++i)
    {
        v8::Local<v8::ModuleRequest> module_request = module_requests->Get(Context, i).As<v8::ModuleRequest>();
        auto RefModuleName = FV8Utils::ToFString(Isolate, module_request->GetSpecifier());
#else
    for (int i = 0, Length = Module->GetModuleRequestsLength(); i < Length; ++i)
    {
        auto RefModuleName = FV8Utils::ToFString(Isolate, Module->GetModuleRequest(i));
#endif
        FString OutPath;
        FString OutDebugPath;
        if (ModuleLoader->Search(DirName, RefModuleName, OutPath, OutDebugPath))
        {
            if (OutPath.EndsWith(TEXT("package.json")))
            {
                TArray<uint8> PackageData;
                if (ModuleLoader->Load(OutPath, PackageData))
                {
                    FString PackageScript;
                    FFileHelper::BufferToString(PackageScript, PackageData.GetData(), PackageData.Num());
                    v8::Local<v8::Value> Args[] = {FV8Utils::ToV8String(Isolate, PackageScript)};

                    auto MaybeRet = GetESMMain.Get(Isolate)->Call(Context, v8::Undefined(Isolate), 1, Args);

                    v8::Local<v8::Value> ESMMainValue;
                    if (MaybeRet.ToLocal(&ESMMainValue) && ESMMainValue->IsString())
                    {
                        FString ESMMain = FV8Utils::ToFString(Isolate, ESMMainValue);
                        FString ESMMainOutPath;
                        FString ESMMainOutDebugPath;
                        if (ModuleLoader->Search(FPaths::GetPath(OutPath), ESMMain, ESMMainOutPath, ESMMainOutDebugPath))
                        {
                            OutPath = ESMMainOutPath;
                        }
                    }
                }
            }
            if (OutPath.EndsWith(TEXT(".mjs")) || OutPath.EndsWith(TEXT(".js")))
            {
                auto RefModule = FetchESModuleTree(Context, OutPath);
                if (RefModule.IsEmpty())
                {
                    return v8::MaybeLocal<v8::Module>();
                }
                Info->ResolveCache.Add(RefModuleName, v8::Global<v8::Module>(Isolate, RefModule.ToLocalChecked()));
                continue;
            }
        }

        auto RefModule = FetchCJSModuleAsESModule(Context, OutPath.EndsWith(TEXT(".cjs")) ? OutPath : RefModuleName);

        if (RefModule.IsEmpty())
        {
            FV8Utils::ThrowException(
                MainIsolate, FString::Printf(TEXT("can not resolve [%s], import by [%s]"), *RefModuleName, *FileName));
            return v8::MaybeLocal<v8::Module>();
        }

        Info->ResolveCache.Add(RefModuleName, v8::Global<v8::Module>(Isolate, RefModule.ToLocalChecked()));
    }

    return Module;
}
#endif

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

    // #if UE_BUILD_DEBUG || UE_BUILD_DEVELOPMENT
    //     if (!DebugPath.IsEmpty())
    //         OutPath = DebugPath;
    // #endif

    auto Isolate = MainIsolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    auto Context = v8::Local<v8::Context>::New(Isolate, DefaultContext);
    v8::Context::Scope ContextScope(Context);
#ifndef WITH_QUICKJS
    if (OutPath.EndsWith(".mjs"))
    {
        v8::TryCatch TryCatch(Isolate);
        v8::Local<v8::Module> RootModule;

        if (!FetchESModuleTree(Context, OutPath).ToLocal(&RootModule))
        {
            check(TryCatch.HasCaught());
            Logger->Error(FV8Utils::TryCatchToString(Isolate, &TryCatch));
            return;
        }

        if (RootModule->InstantiateModule(Context, ResolveModuleCallback).FromMaybe(false))
        {
            __USE(RootModule->Evaluate(Context));
        }

        if (TryCatch.HasCaught())
        {
            Logger->Error(FV8Utils::TryCatchToString(Isolate, &TryCatch));
            return;
        }
    }
    else
#endif
    {
        v8::Local<v8::String> Source = FV8Utils::ToV8StringFromFileContent(Isolate, Data);

#if PLATFORM_WINDOWS
        // 修改URL分隔符格式，否则无法匹配Inspector协议在打断点时发送的正则表达式，导致断点失败
        FString FormattedScriptUrl = DebugPath.Replace(TEXT("/"), TEXT("\\"));
#else
        FString FormattedScriptUrl = DebugPath;
#endif
        v8::Local<v8::String> Name = FV8Utils::ToV8String(Isolate, FormattedScriptUrl);
#if V8_MAJOR_VERSION > 8
        v8::ScriptOrigin Origin(Isolate, Name);
#else
        v8::ScriptOrigin Origin(Name);
#endif
        v8::TryCatch TryCatch(Isolate);

        auto CompiledScript = v8::Script::Compile(Context, Source, &Origin);
        if (CompiledScript.IsEmpty())
        {
            Logger->Error(FV8Utils::TryCatchToString(Isolate, &TryCatch));
            return;
        }
        (void) (CompiledScript.ToLocalChecked()->Run(Context));
        if (TryCatch.HasCaught())
        {
            Logger->Error(FV8Utils::TryCatchToString(Isolate, &TryCatch));
            return;
        }
    }
}

void FJsEnvImpl::EvalScript(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

#ifndef WITH_QUICKJS
    bool IsESM = Info[2]->BooleanValue(Isolate);

    if (IsESM)
    {
        FString FullPath = FV8Utils::ToFString(Isolate, Info[3]);
        v8::Local<v8::Module> RootModule;

        if (!FetchESModuleTree(Context, FullPath).ToLocal(&RootModule))
        {
            return;
        }

        if (RootModule->InstantiateModule(Context, ResolveModuleCallback).FromMaybe(false))
        {
            auto MaybeResult = RootModule->Evaluate(Context);
            v8::Local<v8::Value> Result;
            if (MaybeResult.ToLocal(&Result))
            {
                if (Result->IsPromise())
                {
                    v8::Local<v8::Promise> ResultPromise(Result.As<v8::Promise>());
                    while (ResultPromise->State() == v8::Promise::kPending)
                    {
                        Isolate->PerformMicrotaskCheckpoint();
                    }

                    if (ResultPromise->State() == v8::Promise::kRejected)
                    {
                        ResultPromise->MarkAsHandled();
                        Isolate->ThrowException(ResultPromise->Result());
                        return;
                    }
                }
                Info.GetReturnValue().Set(RootModule->GetModuleNamespace());
            }
        }

        return;
    }
#endif

    v8::String::Utf8Value UrlArg(Isolate, Info[1]);
    FString ScriptUrl = UTF8_TO_TCHAR(*UrlArg);
#if PLATFORM_WINDOWS
    // 修改URL分隔符格式，否则无法匹配Inspector协议在打断点时发送的正则表达式，导致断点失败
    FString FormattedScriptUrl = ScriptUrl.Replace(TEXT("/"), TEXT("\\"));
#else
    FString FormattedScriptUrl = ScriptUrl;
#endif
    v8::Local<v8::String> Name = FV8Utils::ToV8String(Isolate, FormattedScriptUrl);
#if V8_MAJOR_VERSION > 8
    v8::ScriptOrigin Origin(Isolate, Name);
#else
    v8::ScriptOrigin Origin(Name);
#endif
    v8::Local<v8::String> Source = Info[0]->ToString(Context).ToLocalChecked();

#if defined(WITH_V8_BYTECODE)
    v8::ScriptCompiler::CachedData* CachedCode = nullptr;
    uint8_t* Cache = nullptr;
    v8::ScriptCompiler::CompileOptions Options = v8::ScriptCompiler::CompileOptions::kNoCompileOptions;
    if (Info.Length() > 4)
    {
        if (Info[4]->IsArrayBuffer())
        {
            auto AB = Info[4].As<v8::ArrayBuffer>();
            auto Length = AB->ByteLength();
            Cache = new uint8_t[Length];
            memcpy(Cache, DataTransfer::GetArrayBufferData(AB), Length);
            CachedCode = new v8::ScriptCompiler::CachedData(Cache, Length);    // will delete by ~Source
            Options = v8::ScriptCompiler::CompileOptions::kConsumeCodeCache;
            FCodeCacheHeader* CodeCacheHeader = (FCodeCacheHeader*) CachedCode->data;
            if (CodeCacheHeader->FlagHash != Expect_FlagHash)
            {
                UE_LOG(
                    Puerts, Warning, TEXT("FlagHash not match expect %u, but got %u"), Expect_FlagHash, CodeCacheHeader->FlagHash);
                CodeCacheHeader->FlagHash = Expect_FlagHash;
            }
        }
    }

    v8::ScriptCompiler::Source ScriptSource(Source, Origin, CachedCode);
    auto Script = v8::ScriptCompiler::Compile(Context, &ScriptSource, Options);
    if (CachedCode)
    {
        delete Cache;
        if (CachedCode->rejected)
        {
            FV8Utils::ThrowException(Isolate, TEXT("invalid bytecode"));
            return;
        }
    }
#else
    auto Script = v8::Script::Compile(Context, Source, &Origin);
#endif

    if (Script.IsEmpty())
    {
        return;
    }
    auto Result = Script.ToLocalChecked()->Run(Context);
    if (Result.IsEmpty())
    {
        return;
    }
    Info.GetReturnValue().Set(Result.ToLocalChecked());

    if (OnSourceLoadedCallback)
    {
        OnSourceLoadedCallback(FormattedScriptUrl);
    }
}

void FJsEnvImpl::Log(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    CHECK_V8_ARGS(EArgInt32, EArgString);

    auto Level = Info[0]->Int32Value(Context).ToChecked();

    FString Msg = FV8Utils::ToFString(Isolate, Info[1]);
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

void FJsEnvImpl::SearchModule(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    CHECK_V8_ARGS(EArgString, EArgString);

    FString ModuleName = FV8Utils::ToFString(Isolate, Info[0]);
    FString RequiringDir = FV8Utils::ToFString(Isolate, Info[1]);
    FString OutPath;
    FString OutDebugPath;

    if (ModuleLoader->Search(RequiringDir, ModuleName, OutPath, OutDebugPath))
    {
        auto Result = v8::Array::New(Isolate);
        Result->Set(Context, 0, FV8Utils::ToV8String(Isolate, OutPath)).Check();
        Result->Set(Context, 1, FV8Utils::ToV8String(Isolate, OutDebugPath)).Check();
        Info.GetReturnValue().Set(Result);
    }
}

void FJsEnvImpl::LoadModule(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    CHECK_V8_ARGS(EArgString);

    FString Path = FV8Utils::ToFString(Isolate, Info[0]);
    TArray<uint8> Data;
    if (!ModuleLoader->Load(Path, Data))
    {
        FV8Utils::ThrowException(Isolate, "can not load module");
        return;
    }
#if defined(WITH_V8_BYTECODE)
    if (Path.EndsWith(TEXT(".cbc")) || Path.EndsWith(TEXT(".mbc")))
    {
        v8::Local<v8::ArrayBuffer> Ab = v8::ArrayBuffer::New(Info.GetIsolate(), Data.Num());
        void* Buff = DataTransfer::GetArrayBufferData(Ab);
        ::memcpy(Buff, Data.GetData(), Data.Num());
        Info.GetReturnValue().Set(Ab);
    }
    else
#endif
    {
        Info.GetReturnValue().Set(FV8Utils::ToV8StringFromFileContent(Isolate, Data));
    }
}

void FJsEnvImpl::SetTimeout(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    CHECK_V8_ARGS(EArgFunction, EArgNumber);

    SetFTickerDelegate(Info, false);
}

void FJsEnvImpl::SetFTickerDelegate(const v8::FunctionCallbackInfo<v8::Value>& Info, bool Continue)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    while (!(++TimerID))    // TimerID > 0
    {
    }
    uint32_t DelegateHandleId = TimerID;
    FTimerInfo& TimerInfo = TimerInfos.Emplace(DelegateHandleId, FTimerInfo());
    TimerInfo.Callback.Reset(Isolate, v8::Local<v8::Function>::Cast(Info[0]));

    float Millisecond = Info[1]->NumberValue(Context).ToChecked();
    float Delay = Millisecond / 1000.f;

    TimerInfo.TickerHandle =
        FUETicker::GetCoreTicker().AddTicker(FTickerDelegate::CreateLambda([this, DelegateHandleId, Continue](float)
                                                 { return this->TimerCallback(DelegateHandleId, Continue); }),
            Delay);

    Info.GetReturnValue().Set(DelegateHandleId);
}

bool FJsEnvImpl::TimerCallback(int DelegateHandleId, bool Continue)
{
    v8::Isolate* Isolate = MainIsolate;
#ifdef SINGLE_THREAD_VERIFY
    ensureMsgf(BoundThreadId == FPlatformTLS::GetCurrentThreadId(), TEXT("Access by illegal thread!"));
#endif
#ifdef THREAD_SAFE
    v8::Locker Locker(MainIsolate);
#endif

    v8::Isolate::Scope Isolatescope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = DefaultContext.Get(Isolate);
    v8::Context::Scope ContextScope(Context);

    FTimerInfo* PTimeInfo = TimerInfos.Find(DelegateHandleId);
    if (!PTimeInfo)
    {
        Logger->Warn(FString::Printf(TEXT("Try to callback a invalid timer: %d"), DelegateHandleId));
        return false;
    }

    auto OriginHandle = PTimeInfo->TickerHandle;
    v8::Local<v8::Function> Function = TimerInfos[DelegateHandleId].Callback.Get(Isolate);

    v8::TryCatch TryCatch(Isolate);
    (void) (Function->Call(Context, Context->Global(), 0, nullptr));

    if (TryCatch.HasCaught())
    {
        FString Message =
            FString::Printf(TEXT("Exception in Timer Callback: %s"), *(FV8Utils::TryCatchToString(Isolate, &TryCatch)));
        Logger->Error(Message);
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
    if (!TimerInfos.Contains(DelegateHandleId))
    {
        return;
    }
    FUETicker::GetCoreTicker().RemoveTicker(TimerInfos[DelegateHandleId].TickerHandle);
    TimerInfos.Remove(DelegateHandleId);
}

void FJsEnvImpl::ClearInterval(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    // todo - mocha 7.0.1，当reporter为JSON，调用clearTimeout时，可能不传值，或传Null、Undefined过来。暂将其忽略
    if (Info.Length() == 0)
    {
        Logger->Warn(TEXT("Calling ClearInterval with 0 argument."));
    }
    else if (Info[0]->IsNullOrUndefined())
    {
        // 屏蔽这条只在mocha中出现的警告
        // Logger->Warn(TEXT("Calling ClearInterval with a Null or Undefined."));
    }
    else
    {
        CHECK_V8_ARGS(EArgInt32);
        int HandleId = Info[0]->Int32Value(Context).ToChecked();
        RemoveFTickerDelegateHandle(HandleId);
    }
}

void FJsEnvImpl::SetInterval(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    CHECK_V8_ARGS(EArgFunction, EArgNumber);

    SetFTickerDelegate(Info, true);
}

#if !defined(ENGINE_INDEPENDENT_JSENV)
void FJsEnvImpl::MakeUClass(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope Isolatescope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    CHECK_V8_ARGS(EArgFunction, EArgObject, EArgString, EArgObject, EArgObject);

    auto Constructor = v8::Local<v8::Function>::Cast(Info[0]);
    auto Prototype = Info[1]->ToObject(Context).ToLocalChecked();
    auto ClassName = FV8Utils::ToFString(Isolate, Info[2]);
    auto Methods = Info[3]->ToObject(Context).ToLocalChecked();

    UClass* ParentUClass = nullptr;
    if (UObject* Object = FV8Utils::GetUObject(Context, Info[4]))
    {
        if (FV8Utils::IsReleasedPtr(Object))
        {
            FV8Utils::ThrowException(Isolate, "passing a invalid object");
            return;
        }
        ParentUClass = Cast<UClass>(Object);
    }

    if (!ParentUClass)
    {
        FV8Utils::ThrowException(Isolate, "#4 parameter expect a UClass object");
        return;
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

    auto Class = UJSGeneratedClass::Create(GenClassName, ParentUClass, DynamicInvoker, Isolate, Constructor, Prototype);

    TSet<FName> overrided;

    for (TFieldIterator<UFunction> It(ParentUClass, EFieldIteratorFlags::IncludeSuper, EFieldIteratorFlags::ExcludeDeprecated,
             EFieldIteratorFlags::IncludeInterfaces);
         It; ++It)
    {
        UFunction* Function = *It;
        auto FunctionFName = Function->GetFName();
        if (!overrided.Contains(FunctionFName) && Function->HasAnyFunctionFlags(FUNC_BlueprintEvent))
        {
            auto MaybeValue = Methods->Get(Context, FV8Utils::ToV8String(Isolate, Function->GetName()));
            if (!MaybeValue.IsEmpty() && MaybeValue.ToLocalChecked()->IsFunction())
            {
                // Logger->Warn(FString::Printf(TEXT("override: %s"), *Function->GetName()));
                UJSGeneratedClass::Override(
                    Isolate, Class, Function, v8::Local<v8::Function>::Cast(MaybeValue.ToLocalChecked()), DynamicInvoker, true);
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

    auto Result = FindOrAdd(Isolate, Context, Class->GetClass(), Class);
    Info.GetReturnValue().Set(Result);
}

void FJsEnvImpl::Mixin(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    CHECK_V8_ARGS(EArgObject, EArgObject);

    UClass* To = nullptr;
    if (UObject* Object = FV8Utils::GetUObject(Context, Info[0]))
    {
        if (FV8Utils::IsReleasedPtr(Object))
        {
            FV8Utils::ThrowException(Isolate, "passing a invalid object");
            return;
        }
        To = Cast<UClass>(Object);
    }

    if (!To)
    {
        FV8Utils::ThrowException(Isolate, "#0 parameter expect a Blueprint UClass");
        return;
    }

    // release
    if (Info[5]->IsBoolean() && Info[5]->BooleanValue(Isolate))
    {
        MixinClasses.Remove(To);
        UJSGeneratedClass::Restore(To);
        return;
    }

    if (MixinClasses.Contains(To))
    {
        FV8Utils::ThrowException(Isolate, "had mixin");
        return;
    }

    auto MixinMethods = Info[1]->ToObject(Context).ToLocalChecked();

    bool TakeJsObjectRef = false;
    if (Info[2]->IsBoolean())
    {
        TakeJsObjectRef = Info[2]->BooleanValue(Isolate);
    }

    bool Inherit = false;
    if (Info[3]->IsBoolean())
    {
        Inherit = Info[3]->BooleanValue(Isolate);
    }

    bool NoWarning = false;
    if (Info[4]->IsBoolean())
    {
        NoWarning = Info[4]->BooleanValue(Isolate);
    }

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

    auto Keys = MixinMethods->GetOwnPropertyNames(Context).ToLocalChecked();
    TArray<FName> ReplaceMethodNames;
    for (decltype(Keys->Length()) i = 0; i < Keys->Length(); ++i)
    {
        auto Key = Keys->Get(Context, i).ToLocalChecked();
        auto MethodName = FV8Utils::ToFName(Isolate, Key);
        auto Function = To->FindFunctionByName(MethodName);
        if (Function)
        {
            auto JsFunc = MixinMethods->Get(Context, Key).ToLocalChecked();
            auto MixinedFunc = UJSGeneratedClass::Mixin(Isolate, New, Function, MixinInvoker, TakeJsObjectRef, !NoWarning);
            MixinFunctionMap.Emplace(
                MixinedFunc, v8::UniquePersistent<v8::Function>(Isolate, v8::Local<v8::Function>::Cast(JsFunc)));
            ReplaceMethodNames.Add(MethodName);
        }
    }

    if (Inherit)
    {
        New->Bind();
        New->StaticLink(true);

        (void) (New->GetDefaultObject());
        if (auto AnimClass = Cast<UAnimBlueprintGeneratedClass>(New))
        {
            AnimClass->UpdateCustomPropertyListForPostConstruction();
        }
        else if (auto WidgetClass = Cast<UWidgetBlueprintGeneratedClass>(New))
        {
            WidgetClass->UpdateCustomPropertyListForPostConstruction();
        }
        else if (auto BPClass = Cast<UBlueprintGeneratedClass>(New))
        {
            BPClass->UpdateCustomPropertyListForPostConstruction();
        }

#if ENGINE_MAJOR_VERSION == 4 && ENGINE_MINOR_VERSION > 12
        // 拷贝创建的Class需要手动重新创建ReferenceTokenStream
        New->AssembleReferenceTokenStream(true);
#endif
    }
    else
    {
        To->ClearFunctionMapsCaches();
        bool IsReuseTemplate = false;
        auto StructWrapper = GetStructWrapper(To, IsReuseTemplate);
        for (int i = 0; i < ReplaceMethodNames.Num(); i++)
        {
            StructWrapper->RefreshMethod(To->FindFunctionByName(ReplaceMethodNames[i]));
        }
    }
    MixinClasses.Add(New);

    bool Existed = false;
    __USE(GetTemplateInfoOfType(New, Existed));
    bool IsReuseTemplate = false;
    auto StructWrapper = GetStructWrapper(New, IsReuseTemplate);
    StructWrapper->IsNativeTakeJsRef = TakeJsObjectRef;
    for (auto& KV : TypeToTemplateInfoMap)
    {
        if (New != KV.Key && KV.Key->IsChildOf(New))
        {
            KV.Value.StructWrapper->IsNativeTakeJsRef = TakeJsObjectRef;
        }
    }
    Info.GetReturnValue().Set(FindOrAdd(Isolate, Context, New->GetClass(), New));
}
#endif

void FJsEnvImpl::FindModule(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope Isolatescope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    CHECK_V8_ARGS(EArgString);

    PString Name = *(v8::String::Utf8Value(Isolate, Info[0]));

    auto Func = FindAddonRegisterFunc(Name);

    if (Func)
    {
        auto Exports = v8::Object::New(Isolate);
        Func(Context, Exports);
        Info.GetReturnValue().Set(Exports);
    }
}

void FJsEnvImpl::SetInspectorCallback(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
#ifndef WITH_QUICKJS
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope Isolatescope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    if (!Inspector)
        return;

    CHECK_V8_ARGS(EArgFunction);

    if (!InspectorChannel)
    {
        InspectorChannel = Inspector->CreateV8InspectorChannel();
        InspectorChannel->OnMessage(
            [this](std::string Message)
            {
                // UE_LOG(LogTemp, Warning, TEXT("<-- %s"), UTF8_TO_TCHAR(Message.c_str()));
                v8::Isolate::Scope IsolatescopeObject(MainIsolate);
                v8::HandleScope HandleScopeObject(MainIsolate);
                v8::Local<v8::Context> ContextInner = DefaultContext.Get(MainIsolate);
                v8::Context::Scope ContextScopeObject(ContextInner);

                auto Handler = InspectorMessageHandler.Get(MainIsolate);

                v8::Local<v8::Value> Args[] = {FV8Utils::ToV8String(MainIsolate, Message.c_str())};

                v8::TryCatch TryCatch(MainIsolate);
                __USE(Handler->Call(ContextInner, ContextInner->Global(), 1, Args));
                if (TryCatch.HasCaught())
                {
                    Logger->Error(FString::Printf(
                        TEXT("inspector callback exception %s"), *FV8Utils::TryCatchToString(MainIsolate, &TryCatch)));
                }
            });
    }

    InspectorMessageHandler.Reset(Isolate, v8::Local<v8::Function>::Cast(Info[0]));
#endif    // !WITH_QUICKJS
}

void FJsEnvImpl::DispatchProtocolMessage(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
#ifndef WITH_QUICKJS
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope Isolatescope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    CHECK_V8_ARGS(EArgString);

    if (InspectorChannel)
    {
        FString Message = FV8Utils::ToFString(Isolate, Info[0]);
        // UE_LOG(LogTemp, Warning, TEXT("--> %s"), *Message);
        InspectorChannel->DispatchProtocolMessage(TCHAR_TO_UTF8(*Message));
    }
#endif    // !WITH_QUICKJS
}

void FJsEnvImpl::DumpStatisticsLog(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
#ifndef WITH_QUICKJS
    v8::HeapStatistics Statistics;

    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    Isolate->GetHeapStatistics(&Statistics);

    FString StatisticsLog = FString::Printf(TEXT("------------------------\n"
                                                 "Dump Statistics of V8:\n"
                                                 "total_heap_size: %llu\n"
                                                 "total_heap_size_executable: %llu\n"
                                                 "total_physical_size: %llu\n"
                                                 "total_available_size: %llu\n"
                                                 "used_heap_size: %llu\n"
                                                 "heap_size_limit: %llu\n"
                                                 "malloced_memory: %llu\n"
                                                 "external_memory: %llu\n"
                                                 "peak_malloced_memory: %llu\n"
                                                 "number_of_native_contexts: %llu\n"
                                                 "number_of_detached_contexts: %llu\n"
                                                 "does_zap_garbage: %llu\n"
                                                 "------------------------\n"),
        Statistics.total_heap_size(), Statistics.total_heap_size_executable(), Statistics.total_physical_size(),
        Statistics.total_available_size(), Statistics.used_heap_size(), Statistics.heap_size_limit(), Statistics.malloced_memory(),
        Statistics.external_memory(), Statistics.peak_malloced_memory(), Statistics.number_of_native_contexts(),
        Statistics.number_of_detached_contexts(), Statistics.does_zap_garbage());

    Logger->Info(StatisticsLog);
#endif    // !WITH_QUICKJS
}

#if USE_WASM3
void FJsEnvImpl::Wasm_NewMemory(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    CHECK_V8_ARGS(EArgInt32, EArgInt32);

    int InitPages = Info[0]->Int32Value(Context).ToChecked();
    int MaxPages = Info[1]->Int32Value(Context).ToChecked();
    check(InitPages >= 0 && MaxPages > 0 && MaxPages >= InitPages);
    auto Runtime = std::make_shared<WasmRuntime>(PuertsWasmEnv.get(), MaxPages, InitPages);
    PuertsWasmRuntimeList.Add(Runtime);
    Info.GetReturnValue().Set(Runtime->GetRuntimeSeq());
}

void FJsEnvImpl::Wasm_MemoryGrowth(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    CHECK_V8_ARGS(EArgInt32, EArgInt32);

    int Seq = Info[0]->Int32Value(Context).ToChecked();
    int n = Info[1]->Int32Value(Context).ToChecked();
    for (auto Runtime : PuertsWasmRuntimeList)
    {
        if (Runtime->GetRuntimeSeq() == Seq)
        {
            int previous = Runtime->Grow(n);
            Info.GetReturnValue().Set(previous);
            return;
        }
    }

    FV8Utils::ThrowException(Isolate, "can not find associated runtime with memory");
    return;
}

void FJsEnvImpl::Wasm_MemoryBuffer(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    CHECK_V8_ARGS(EArgInt32);

    int Seq = Info[0]->Int32Value(Context).ToChecked();
    for (auto Runtime : PuertsWasmRuntimeList)
    {
        if (Runtime->GetRuntimeSeq() == Seq)
        {
            int Length = 0;
            uint8* Ptr = Runtime->GetBuffer(Length);
            if (Ptr)
            {
                auto Buffer = DataTransfer::NewArrayBuffer(Context, Ptr, Length);
                Info.GetReturnValue().Set(Buffer);
            }
            else
            {
                FV8Utils::ThrowException(Isolate, "no memory?");
            }
            return;
        }
    }
    FV8Utils::ThrowException(Isolate, "can not find associated runtime with memory");
    return;
}

void FJsEnvImpl::Wasm_TableGrowth(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    CHECK_V8_ARGS(EArgInt32, EArgInt32, EArgInt32);

    int Seq = Info[0]->Int32Value(Context).ToChecked();
    int Index = Info[1]->Int32Value(Context).ToChecked();
    int N = Info[2]->Int32Value(Context).ToChecked();
    for (auto Runtime : PuertsWasmRuntimeList)
    {
        if (Runtime->GetRuntimeSeq() == Seq)
        {
            if (auto ModuleInstance = Runtime->GetModuleInstance(Index))
            {
                Info.GetReturnValue().Set(static_cast<uint32_t>(ModuleInstance->TableGrow(N)));
            }
            else
            {
                FV8Utils::ThrowException(Isolate, "invalid Module Instance index");
            }
            return;
        }
    }

    FV8Utils::ThrowException(Isolate, "can not find associated runtime with memory");
}

void FJsEnvImpl::Wasm_TableSet(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    CHECK_V8_ARGS(EArgInt32, EArgInt32, EArgInt32, EArgFunction);

    int Seq = Info[0]->Int32Value(Context).ToChecked();
    int Index = Info[1]->Int32Value(Context).ToChecked();
    int Pos = Info[2]->Int32Value(Context).ToChecked();
    auto Func = v8::Local<v8::Function>::Cast(Info[3]);

    v8::Local<v8::Value> FuncData;

    if (!Func->Get(Context, FV8Utils::ToV8String(Isolate, M3_FUNCTION_KEY)).ToLocal(&FuncData) || !FuncData->IsExternal())
    {
        FV8Utils::ThrowException(Isolate, "Argument 1 must be null or a WebAssembly function of type compatible to 'this'");
        return;
    }

    for (auto Runtime : PuertsWasmRuntimeList)
    {
        if (Runtime->GetRuntimeSeq() == Seq)
        {
            if (auto ModuleInstance = Runtime->GetModuleInstance(Index))
            {
                ModuleInstance->TableSet(Pos, static_cast<IM3Function>(v8::Local<v8::External>::Cast(FuncData)->Value()));
            }
            else
            {
                FV8Utils::ThrowException(Isolate, "invalid Module Instance index");
            }
            return;
        }
    }

    FV8Utils::ThrowException(Isolate, "can not find associated runtime with memory");
}

void FJsEnvImpl::Wasm_TableLen(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    CHECK_V8_ARGS(EArgInt32, EArgInt32);

    int Seq = Info[0]->Int32Value(Context).ToChecked();
    int Index = Info[1]->Int32Value(Context).ToChecked();
    for (auto Runtime : PuertsWasmRuntimeList)
    {
        if (Runtime->GetRuntimeSeq() == Seq)
        {
            if (auto ModuleInstance = Runtime->GetModuleInstance(Index))
            {
                Info.GetReturnValue().Set(static_cast<uint32_t>(ModuleInstance->TableLen()));
            }
            else
            {
                FV8Utils::ThrowException(Isolate, "invalid Module Instance index");
            }
            return;
        }
    }

    FV8Utils::ThrowException(Isolate, "can not find associated runtime with memory");
}

void FJsEnvImpl::Wasm_Instance(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);
    // typedarray or arraybuffer, importobject or undefined, exports object
    if (Info.Length() != 3)
    {
        FV8Utils::ThrowException(Isolate, "params number dismatch");
        return;
    }
    if (!Info[2]->IsObject())
    {
        FV8Utils::ThrowException(Isolate, "params at 3 must be object");
        return;
    }
    v8::Local<v8::Object> ExportsObject = Info[2].As<v8::Object>();

    v8::Local<v8::ArrayBuffer> InArrayBuffer;
    if (Info[0]->IsArrayBuffer())
    {
        InArrayBuffer = Info[0].As<v8::ArrayBuffer>();
    }
    else if (Info[0]->IsTypedArray())
    {
        InArrayBuffer = Info[0].As<v8::TypedArray>()->Buffer();
    }

    void* Buffer = static_cast<char*>(DataTransfer::GetArrayBufferData(InArrayBuffer));
    int BufferLength = InArrayBuffer->ByteLength();

    TArray<uint8> InData;
    InData.Append((uint8*) Buffer, BufferLength);
    auto Runtime = NormalInstanceModule(
        Isolate, Context, InData, ExportsObject, Info[1], PuertsWasmRuntimeList, PuertsWasmCachedLinkFunctionList);
    if (Runtime)
    {
        Info.GetReturnValue().Set(Runtime->GetRuntimeSeq());
    }
}

void FJsEnvImpl::Wasm_OverrideWebAssembly(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
#if WASM3_OVERRIDE_WEBASSEMBLY
    Info.GetReturnValue().Set(v8::True(Info.GetIsolate()));
#else
    Info.GetReturnValue().Set(v8::False(Info.GetIsolate()));
#endif
}

#endif
}    // namespace PUERTS_NAMESPACE

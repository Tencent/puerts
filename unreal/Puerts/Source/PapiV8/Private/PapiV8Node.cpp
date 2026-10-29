/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#if defined(WITH_NODEJS)

#include "PapiV8Node.h"
#include "PapiV8Module.h"
#include "PapiEnvScope.h"
#include "JSLogger.h"

PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS
#if PLATFORM_WINDOWS
#include <windows.h>
#elif PLATFORM_LINUX
#include <sys/epoll.h>
#include <unistd.h>
#elif PLATFORM_MAC
#include <sys/select.h>
#include <sys/sysctl.h>
#include <sys/time.h>
#include <sys/types.h>
#endif
PRAGMA_ENABLE_UNDEFINED_IDENTIFIER_WARNINGS

namespace PUERTS_NAMESPACE
{
static node::MultiIsolatePlatform* GetNodePlatform()
{
    return static_cast<node::MultiIsolatePlatform*>(IPapiV8Module::Get().GetV8Platform());
}

FPapiV8Node::FPapiV8Node(std::shared_ptr<ILogger> InLogger) : Logger(std::move(InLogger))
{
}

FPapiV8Node::~FPapiV8Node()
{
    check(!Polling);
    check(!NodeEnv);
}

v8::Isolate* FPapiV8Node::NewIsolate()
{
    const int Ret = uv_loop_init(&NodeUVLoop);
    if (Ret != 0)
    {
        Logger->Error(FString::Printf(TEXT("Failed to initialize loop: %s\n"), UTF8_TO_TCHAR(uv_err_name(Ret))));
        return nullptr;
    }
    LoopInitialized = true;

    NodeArrayBufferAllocator = node::ArrayBufferAllocator::Create();
    // registered to the platform, unregistered by FreeEnvironment
    Isolate = node::NewIsolate(NodeArrayBufferAllocator.get(), &NodeUVLoop, GetNodePlatform());
    return Isolate;
}

v8::Local<v8::Context> FPapiV8Node::NewContext()
{
    // v8::Locker locker(Isolate);
    // difference from embedding example, if lock, blow check fail:
    // Utils::ApiCheck(
    //! v8::Locker::IsActive() ||
    //    internal_isolate->thread_manager()->IsLockedByCurrentThread() ||
    //    internal_isolate->serializer_enabled(),
    //"HandleScope::HandleScope",
    //"Entering the V8 API without proper locking in place");
    NodeIsolateData = node::CreateIsolateData(Isolate, &NodeUVLoop, GetNodePlatform(), NodeArrayBufferAllocator.get());

    v8::Local<v8::Context> Context = node::NewContext(Isolate);
    if (Context.IsEmpty())
    {
        return Context;
    }

    int Argc = 1;
    const char* Argv[] = {"puerts"};
    std::vector<std::string> Args(Argv, Argv + Argc);
    std::vector<std::string> ExecArgs;

    v8::Context::Scope ContextScope(Context);
    v8::Local<v8::Object> Global = Context->Global();
    auto StrConsole = v8::String::NewFromUtf8(Isolate, "console").ToLocalChecked();
    v8::Local<v8::Value> Console = Global->Get(Context, StrConsole).ToLocalChecked();
    // kDefaultFlags = kOwnsProcessState | kOwnsInspector, if kOwnsInspector set, inspector_agent.cc:681
    // CHECK_EQ(start_io_thread_async_initialized.exchange(true), false) fail!
    NodeEnv = node::CreateEnvironment(NodeIsolateData, Context, Args, ExecArgs, node::EnvironmentFlags::kOwnsProcessState);
    // the console of v8 (forwarded to the inspector) is kept
    Global->Set(Context, StrConsole, Console).Check();
    v8::MaybeLocal<v8::Value> LoadenvRet = node::LoadEnvironment(NodeEnv,
        "const publicRequire ="
        "  require('module').createRequire(process.cwd() + '/');"
        "globalThis.require = publicRequire;");
    if (LoadenvRet.IsEmpty())    // There has been a JS exception.
    {
        Logger->Error(TEXT("Failed to load the node environment"));
    }

    // the same as raw v8
    Isolate->SetMicrotasksPolicy(v8::MicrotasksPolicy::kAuto);
    return Context;
}

v8::Local<v8::Value> FPapiV8Node::GetRequire(v8::Local<v8::Context> Context)
{
    v8::Local<v8::Value> Require;
    if (!Context->Global()->Get(Context, v8::String::NewFromUtf8(Isolate, "require").ToLocalChecked()).ToLocal(&Require) ||
        !Require->IsFunction())
    {
        return v8::Local<v8::Value>();
    }
    return Require;
}

void FPapiV8Node::StartPolling(struct pesapi_ffi* InApis, pesapi_env_ref InEnvRef)
{
    Apis = InApis;
    EnvRef = InEnvRef;
    PollingClosed = false;
    Polling = true;

    uv_async_init(&NodeUVLoop, &DummyUVHandle, nullptr);
    uv_sem_init(&PollingSem, 0);
    uv_thread_create(
        &PollingThread,
        [](void* arg)
        {
            auto* self = static_cast<FPapiV8Node*>(arg);
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

void FPapiV8Node::UvRunOnce()
{
    if (!PollingClosed)
    {
        FPapiEnvScope EnvScope(Apis, EnvRef);
        // TODO: catch uv_run可以让脚本错误不至于进程退出，但这不知道会不会对node有什么副作用
        uv_run(&NodeUVLoop, UV_RUN_NOWAIT);
        if (EnvScope.HasCaught())
        {
            Logger->Error(FString::Printf(TEXT("uv_run throw: %s"), UTF8_TO_TCHAR(EnvScope.GetExceptionAsString())));
        }
        else
        {
            GetNodePlatform()->DrainTasks(Isolate);
        }
    }

    LastJob = nullptr;

    // Tell the Polling thread to continue.
    uv_sem_post(&PollingSem);
}

void FPapiV8Node::PollEvents()
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

void FPapiV8Node::OnWatcherQueueChanged(uv_loop_t* loop)
{
#if !PLATFORM_WINDOWS
    FPapiV8Node* self = static_cast<FPapiV8Node*>(loop->data);
    self->WakeupPollingThread();
#endif
}

void FPapiV8Node::WakeupPollingThread()
{
    uv_async_send(&DummyUVHandle);
}

void FPapiV8Node::StopPolling()
{
    if (!Polling)
    {
        return;
    }
    PollingClosed = true;

    uv_sem_post(&PollingSem);

    WakeupPollingThread();

    uv_thread_join(&PollingThread);

    if (LastJob)
    {
        LastJob->Wait();
    }

    uv_sem_destroy(&PollingSem);
#if PLATFORM_LINUX
    if (Epoll >= 0)
    {
        close(Epoll);
        Epoll = -1;
    }
#endif
    Polling = false;
    Apis = nullptr;
    EnvRef = nullptr;
}

void FPapiV8Node::FreeEnvironment()
{
    if (NodeEnv)
    {
        node::EmitExit(NodeEnv);
        node::Stop(NodeEnv);
        node::FreeEnvironment(NodeEnv);
        NodeEnv = nullptr;
    }
    if (NodeIsolateData)
    {
        node::FreeIsolateData(NodeIsolateData);
        NodeIsolateData = nullptr;
    }
    if (Isolate)
    {
        GetNodePlatform()->UnregisterIsolate(Isolate);
        Isolate = nullptr;
    }
}
}    // namespace PUERTS_NAMESPACE

#endif

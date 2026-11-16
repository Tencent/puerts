/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#if defined(WITH_NODEJS)

#include "CoreMinimal.h"
#include "Async/TaskGraphInterfaces.h"
#include "pesapi.h"
#include "NamespaceDef.h"
#include <memory>

PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS
MSVC_PRAGMA(warning(push, 0))
#include "node.h"
#include "uv.h"
MSVC_PRAGMA(warning(pop))
PRAGMA_ENABLE_UNDEFINED_IDENTIFIER_WARNINGS

namespace PUERTS_NAMESPACE
{
class ILogger;

// the node part of a v8 backend built with node (WITH_NODEJS): the isolate is created by node (registered to the
// MultiIsolatePlatform of the PapiV8 module), the context is a node context with a node environment, and the uv loop is
// polled by a thread and run on the game thread.
//
// Life cycle (driven by FPapiBackendV8):
//   NewIsolate -> NewContext (in the isolate and handle scopes) -> StartPolling (after the env ref is created) -> ...
//   -> StopPolling -> FreeEnvironment (the isolate alive) -> isolate disposed by the backend -> destroyed
class FPapiV8Node
{
public:
    explicit FPapiV8Node(std::shared_ptr<ILogger> InLogger);

    ~FPapiV8Node();

    // nullptr on failure
    v8::Isolate* NewIsolate();

    // creates the node context and environment of the isolate, called in the isolate and handle scopes, empty on failure
    v8::Local<v8::Context> NewContext();

    // the require of node (globalThis.require set by the environment), empty if not available
    v8::Local<v8::Value> GetRequire(v8::Local<v8::Context> Context);

    // the uv loop is run in the scope of the env (EnvRef)
    void StartPolling(struct pesapi_ffi* InApis, pesapi_env_ref InEnvRef);

    void StopPolling();

    // releases the environment and unregisters the isolate, the isolate is disposed after it
    void FreeEnvironment();

private:
    void UvRunOnce();

    void PollEvents();

    static void OnWatcherQueueChanged(uv_loop_t* loop);

    void WakeupPollingThread();

    std::shared_ptr<ILogger> Logger;

    v8::Isolate* Isolate = nullptr;

    uv_loop_t NodeUVLoop;

    bool LoopInitialized = false;

    std::unique_ptr<node::ArrayBufferAllocator> NodeArrayBufferAllocator;

    node::IsolateData* NodeIsolateData = nullptr;

    node::Environment* NodeEnv = nullptr;

    struct pesapi_ffi* Apis = nullptr;

    pesapi_env_ref EnvRef = nullptr;

    uv_thread_t PollingThread;

    uv_sem_t PollingSem;

    uv_async_t DummyUVHandle;

    bool Polling = false;

    volatile bool PollingClosed = false;

    FGraphEventRef LastJob;

#if PLATFORM_LINUX
    int Epoll = -1;
#endif
};
}    // namespace PUERTS_NAMESPACE

#endif

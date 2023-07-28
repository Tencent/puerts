/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
#include "BackendEnv.h"
#include "Log.h"
#include "PromiseRejectCallback.hpp"

#pragma warning(push, 0)  
#include "libplatform/libplatform.h"
#include "v8.h"
#pragma warning(pop)

#if WITH_NODEJS

#pragma warning(push, 0)
#include "node.h"
#include "uv.h"
#pragma warning(pop)

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

#else // !WITH_NODEJS

#if defined(PLATFORM_WINDOWS)

#if _WIN64
#include "Blob/Win64/SnapshotBlob.h"
#else
#include "Blob/Win32/SnapshotBlob.h"
#endif

#elif defined(PLATFORM_ANDROID_ARM)
#include "Blob/Android/armv7a/SnapshotBlob.h"
#elif defined(PLATFORM_ANDROID_ARM64)
#include "Blob/Android/arm64/SnapshotBlob.h"
#elif defined(PLATFORM_ANDROID_x64)
#include "Blob/Android/x64/SnapshotBlob.h"
#elif defined(PLATFORM_MAC_ARM64)
#include "Blob/macOS_arm64/SnapshotBlob.h"
#elif defined(PLATFORM_MAC)
#include "Blob/macOS/SnapshotBlob.h"
#elif defined(PLATFORM_IOS)
#include "Blob/iOS/arm64/SnapshotBlob.h"
#elif defined(PLATFORM_LINUX)
#include "Blob/Linux/SnapshotBlob.h"
#endif // defined(PLATFORM_WINDOWS)

#endif // WITH_NODEJS

static std::unique_ptr<v8::Platform> GPlatform;
#if defined(WITH_NODEJS)
static std::vector<std::string>* Args;
static std::vector<std::string>* ExecArgs;
static std::vector<std::string>* Errors;
#endif


#if defined(WITH_NODEJS)
void puerts::BackendEnv::StartPolling()
{
    uv_async_init(&NodeUVLoop, &DummyUVHandle, nullptr);
    uv_sem_init(&PollingSem, 0);
    uv_thread_create(
        &PollingThread,
        [](void* arg)
        {
            auto* self = static_cast<puerts::BackendEnv*>(arg);
            while (true)
            {
                uv_sem_wait(&self->PollingSem);

                if (self->PollingClosed)
                    break;

                self->PollEvents();

                if (self->PollingClosed)
                    break;

                self->hasPendingTask = true;
            }
        },
        this);

#if PLATFORM_WINDOWS
    // on single-core the io comp port NumberOfConcurrentThreads needs to be 2
    // to avoid cpu pegging likely caused by a busy loop in PollEvents
    // if (FPlatformMisc::NumberOfCores() == 1)
    if (false)
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

void puerts::BackendEnv::UvRunOnce()
{
    auto Isolate = MainIsolate;
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    auto Context = MainContext.Get(Isolate);
    v8::Context::Scope ContextScope(Context);

    // TODO: catch uv_run可以让脚本错误不至于进程退出，但这不知道会不会对node有什么副作用
    v8::TryCatch TryCatch(Isolate);

    uv_run(&NodeUVLoop, UV_RUN_NOWAIT);
    if (TryCatch.HasCaught())
    {
        // Logger->Error(FString::Printf(TEXT("uv_run throw: %s"), *FV8Utils::TryCatchToString(Isolate, &TryCatch)));
    }
    else
    {
        static_cast<node::MultiIsolatePlatform*>(GPlatform.get())->DrainTasks(Isolate);
    }

    hasPendingTask = false;

    // Tell the Polling thread to continue.
    uv_sem_post(&PollingSem);
}

void puerts::BackendEnv::PollEvents()
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

void puerts::BackendEnv::OnWatcherQueueChanged(uv_loop_t* loop)
{
#if !PLATFORM_WINDOWS
    puerts::BackendEnv* self = static_cast<puerts::BackendEnv*>(loop->data);
    self->WakeupPollingThread();
#endif
}

void puerts::BackendEnv::WakeupPollingThread()
{
    uv_async_send(&DummyUVHandle);
}

void puerts::BackendEnv::StopPolling()
{
    PollingClosed = true;

    uv_sem_post(&PollingSem);

    WakeupPollingThread();

    uv_thread_join(&PollingThread);

    uv_sem_destroy(&PollingSem);
}
#endif

void puerts::BackendEnv::GlobalPrepare()
{
    if (!GPlatform)
    {
#if defined(WITH_NODEJS)
        int Argc = 2;
        char* ArgvIn[] = {"puerts", "--no-harmony-top-level-await"};
        char ** Argv = uv_setup_args(Argc, ArgvIn);
        Args = new std::vector<std::string>(Argv, Argv + Argc);
        ExecArgs = new std::vector<std::string>();
        Errors = new std::vector<std::string>();

        GPlatform = node::MultiIsolatePlatform::Create(4);
        v8::V8::InitializePlatform(GPlatform.get());
        v8::V8::Initialize();
        int ExitCode = node::InitializeNodeWithArgs(Args, ExecArgs, Errors);
        for (const std::string& error : *Errors)
        {
            printf("InitializeNodeWithArgs failed\n");
        }
#else
        GPlatform = v8::platform::NewDefaultPlatform();
        v8::V8::InitializePlatform(GPlatform.get());
        v8::V8::Initialize();
#endif
    }
}

v8::Isolate* puerts::BackendEnv::CreateIsolate(void* external_quickjs_runtime)
{
#if defined(WITH_NODEJS)
    const int Ret = uv_loop_init(&NodeUVLoop);
    if (Ret != 0)
    {
        // TODO log
        printf("uv_loop_init failed\n");
        return nullptr;
    }

    NodeArrayBufferAllocator = node::ArrayBufferAllocator::Create();
    // PLog(puerts::Log, "[PuertsDLL][JSEngineWithNode]isolate");

    auto Platform = static_cast<node::MultiIsolatePlatform*>(GPlatform.get());
    MainIsolate = node::NewIsolate(NodeArrayBufferAllocator.get(), &NodeUVLoop,
        Platform);

    MainIsolate->SetMicrotasksPolicy(v8::MicrotasksPolicy::kAuto);
#else
    v8::StartupData SnapshotBlob;
    SnapshotBlob.data = (const char *)SnapshotBlobCode;
    SnapshotBlob.raw_size = sizeof(SnapshotBlobCode);
    v8::V8::SetSnapshotDataBlob(&SnapshotBlob);

    // 初始化Isolate和DefaultContext
    CreateParams = new v8::Isolate::CreateParams();
    CreateParams->array_buffer_allocator = v8::ArrayBuffer::Allocator::NewDefaultAllocator();
    
#if WITH_QUICKJS
        MainIsolate = (external_quickjs_runtime == nullptr) ? v8::Isolate::New(*CreateParams) : v8::Isolate::New(external_quickjs_runtime);
#else
        MainIsolate = v8::Isolate::New(*CreateParams);
#endif
#endif

    return MainIsolate;
}

void puerts::BackendEnv::FreeIsolate()
{
#if WITH_NODEJS
    // node::EmitExit(NodeEnv);
    node::Stop(NodeEnv);
    node::FreeEnvironment(NodeEnv);
    node::FreeIsolateData(NodeIsolateData);
    auto Platform = static_cast<node::MultiIsolatePlatform*>(GPlatform.get());
    // bool platform_finished = false;
    // Platform->AddIsolateFinishedCallback(MainIsolate, [](void* data) {
    //     *static_cast<bool*>(data) = true;
    // }, &platform_finished);
    Platform->UnregisterIsolate(MainIsolate);
#endif
    MainContext.Reset();
    MainIsolate->Dispose();
    MainIsolate = nullptr;
#if WITH_NODEJS
    // Wait until the platform has cleaned up all relevant resources.
    // while (!platform_finished)
    // {
    //     uv_run(&NodeUVLoop, UV_RUN_ONCE);
    // }

    // int err = uv_loop_close(&NodeUVLoop);
    // assert(err == 0);
#else
    delete CreateParams->array_buffer_allocator;
    delete CreateParams;
#endif
}

void puerts::BackendEnv::LogicTick()
{
#if WITH_NODEJS
    v8::Isolate::Scope IsolateScope(MainIsolate);
    v8::HandleScope HandleScope(MainIsolate);
    auto Context = MainContext.Get(MainIsolate);
    v8::Context::Scope ContextScope(Context);

    if (hasPendingTask)
        UvRunOnce();
#endif
}

void puerts::BackendEnv::InitInject(v8::Isolate* Isolate, v8::Local<v8::Context> Context)
{
    MainContext.Reset(Isolate, Context);
#if defined(WITH_NODEJS)
    v8::Local<v8::Object> Global = Context->Global();
    auto strConsole = v8::String::NewFromUtf8(Isolate, "console").ToLocalChecked();
    v8::Local<v8::Value> Console = Global->Get(Context, strConsole).ToLocalChecked();
    auto Platform = static_cast<node::MultiIsolatePlatform*>(GPlatform.get());

    NodeIsolateData = node::CreateIsolateData(Isolate, &NodeUVLoop, Platform, NodeArrayBufferAllocator.get()); // node::FreeIsolateData

    NodeEnv = CreateEnvironment(NodeIsolateData, Context, *Args, *ExecArgs, node::EnvironmentFlags::kOwnsProcessState);

    Global->Set(Context, strConsole, Console).Check();

    v8::MaybeLocal<v8::Value> LoadenvRet = node::LoadEnvironment(
        NodeEnv,
        "const publicRequire ="
        "  require('module').createRequire(process.cwd() + '/');"
        "globalThis.require = publicRequire;");

    if (LoadenvRet.IsEmpty())  // There has been a JS exception.
    {
        return;
    }
#endif

    Isolate->SetPromiseRejectCallback(&PromiseRejectCallback<puerts::BackendEnv>);

#if !WITH_QUICKJS
    Isolate->SetHostInitializeImportMetaObjectCallback(&puerts::esmodule::HostInitializeImportMetaObject);
#endif

    Context->Global()->Set(Context, v8::String::NewFromUtf8(Isolate, "__tgjsSetPromiseRejectCallback").ToLocalChecked(), v8::FunctionTemplate::New(Isolate, &SetPromiseRejectCallback<puerts::BackendEnv>)->GetFunction(Context).ToLocalChecked()).Check();

#if defined(WITH_NODEJS)
    StartPolling();
#endif
}

void puerts::BackendEnv::CreateInspector(v8::Isolate* Isolate, const v8::Global<v8::Context>* ContextGlobal, int32_t Port)
{
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = ContextGlobal->Get(Isolate);
    v8::Context::Scope ContextScope(Context);

    if (Inspector == nullptr)
    {
        Inspector = CreateV8Inspector(Port, &Context);
    }
}

void puerts::BackendEnv::DestroyInspector(v8::Isolate* Isolate, const v8::Global<v8::Context>* ContextGlobal)
{
    if (Inspector != nullptr)
    {
#ifdef THREAD_SAFE
        v8::Locker Locker(Isolate);
#endif
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = ContextGlobal->Get(Isolate);
        v8::Context::Scope ContextScope(Context);

        delete Inspector;
        Inspector = nullptr;
    }
}

bool puerts::BackendEnv::InspectorTick()
{
    if (Inspector != nullptr)
    {
        return Inspector->Tick();
    }
    return true;
}

bool puerts::BackendEnv::ClearModuleCache(v8::Isolate* Isolate, v8::Local<v8::Context> Context, const char* Path)
{
    std::string key(Path);
    if (key.size() == 0) 
    {
#if !WITH_QUICKJS
        for (auto Iter = PathToModuleMap.begin(); Iter != PathToModuleMap.end(); ++Iter)
        {
            Iter->second.Reset();
        }
#else
#endif
        PathToModuleMap.clear();
        return true;
    } 
    else 
    {
        auto finder = PathToModuleMap.find(key);
        if (finder != PathToModuleMap.end()) 
        {
            PathToModuleMap.erase(key);
#if !WITH_QUICKJS
            finder->second.Reset();
            return true;
#else
            v8::Isolate::Scope IsolateScope(Isolate);
            v8::HandleScope HandleScope(Isolate);
            JSContext* ctx = Context->context_;
            return JS_ReleaseLoadedModule(ctx, Path);
#endif
        }
    }
    return false;
}

static v8::MaybeLocal<v8::Value> CallResolver(
    v8::Isolate* Isolate,
    v8::Local<v8::Context> Context,
    v8::Local<v8::Value> Specifier,
    v8::Local<v8::Value> ReferrerName
)
{
    std::vector< v8::Local<v8::Value>> V8Args;

    v8::Local<v8::Function> URLResolveFunction = v8::Local<v8::Function>::Cast(Context->Global()->Get(Context, v8::String::NewFromUtf8(Isolate, "__puer_resolve_module_url__").ToLocalChecked()).ToLocalChecked());
    V8Args.push_back(Specifier);
    V8Args.push_back(ReferrerName);
    v8::MaybeLocal<v8::Value> maybeRet = URLResolveFunction->Call(Context, Context->Global(), 2, V8Args.data());
    V8Args.clear();

    return maybeRet;
}

static v8::MaybeLocal<v8::Value> CallRead(
    v8::Isolate* Isolate,
    v8::Local<v8::Context> Context,
    v8::Local<v8::Value> URL,
    std::string &pathForDebug
)
{
    std::vector< v8::Local<v8::Value>> V8Args;

    v8::Local<v8::Function> ModuleReadFunction = v8::Local<v8::Function>::Cast(Context->Global()->Get(Context, v8::String::NewFromUtf8(Isolate, "__puer_resolve_module_content__").ToLocalChecked()).ToLocalChecked());

    V8Args.push_back(URL);

#if !WITH_QUICKJS
    v8::Local<v8::Array> pathForDebugRef = v8::Array::New(Isolate, 0);
    V8Args.push_back(pathForDebugRef);
    v8::MaybeLocal<v8::Value> maybeRet = ModuleReadFunction->Call(Context, Context->Global(), 2, V8Args.data());
#else
    v8::MaybeLocal<v8::Value> maybeRet = ModuleReadFunction->Call(Context, Context->Global(), 1, V8Args.data());
#endif

    v8::Local<v8::Value> pathForDebugValue;

    V8Args.clear();
#if !WITH_QUICKJS
    if (pathForDebugRef->Length() == 1 && pathForDebugRef->Get(Context, 0).ToLocal(&pathForDebugValue))
    {
        v8::String::Utf8Value pathForDebug_utf8(Isolate, pathForDebugValue);
        pathForDebug = std::string(*pathForDebug_utf8, pathForDebug_utf8.length());
    }
#endif

    return maybeRet;
}

void puerts::esmodule::ExecuteModule(const v8::FunctionCallbackInfo<v8::Value>& info) 
{
    v8::Isolate* Isolate = info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    v8::Local<v8::String> Specifier_v8 = info[0]->ToString(Context).ToLocalChecked();

#if !WITH_QUICKJS
    auto emptyStrV8 = v8::String::NewFromUtf8(Isolate, "", v8::NewStringType::kNormal).ToLocalChecked();
    v8::ScriptOrigin origin(emptyStrV8,
                    v8::Integer::New(Isolate, 0),                      // line offset
                    v8::Integer::New(Isolate, 0),                    // column offset
                    v8::True(Isolate),                    // is cross origin
                    v8::Local<v8::Integer>(),                 // script id
                    v8::Local<v8::Value>(),                   // source map URL
                    v8::False(Isolate),                   // is opaque (?)
                    v8::False(Isolate),                   // is WASM
                    v8::True(Isolate),                    // is ES Module
                    v8::PrimitiveArray::New(Isolate, 10)
    );
    v8::ScriptCompiler::Source source(emptyStrV8, origin);
    v8::Local<v8::Module> entryModule = v8::ScriptCompiler::CompileModule(Isolate, &source, v8::ScriptCompiler::kNoCompileOptions)
            .ToLocalChecked();

    v8::MaybeLocal<v8::Module> mod = puerts::esmodule::ResolveModule(Context, Specifier_v8, entryModule);
    if (mod.IsEmpty())
    {
        // TODO
        return;
    }
    v8::Local<v8::Module> moduleChecked = mod.ToLocalChecked();
    if (!puerts::esmodule::LinkModule(Context, moduleChecked))
    {
        // TODO
        return;
    }
    v8::Maybe<bool> ret = moduleChecked->InstantiateModule(Context, puerts::esmodule::ResolveModule);
    if (ret.IsNothing() || !ret.ToChecked())
    {
        // TODO
        return;
    }
    v8::MaybeLocal<v8::Value> evalRet = moduleChecked->Evaluate(Context);
    if (evalRet.IsEmpty())
    {
        // TODO
        return;
    }
    info.GetReturnValue().Set(moduleChecked->GetModuleNamespace());

#else 
    JS_SetModuleLoaderFunc(Isolate->runtime_, puerts::esmodule::js_module_resolver, puerts::esmodule::js_module_loader, NULL);
    JSContext* ctx = Context->context_;

    v8::String::Utf8Value Specifier_utf8(Isolate, Specifier_v8);
    std::string Specifier_std(*Specifier_utf8, Specifier_utf8.length());

    char* resolved_name = puerts::esmodule::js_module_resolver(ctx, "", Specifier_std.c_str(), nullptr);
    if (resolved_name == nullptr)
    {
        // should be a exception on mockV8's VM
        Isolate->handleException();
        return;
    }

    JSModuleDef* EntryModule = puerts::esmodule::js_module_loader(ctx, resolved_name, nullptr);
    if (EntryModule == nullptr) 
    {
        // should be a exception on mockV8's VM
        Isolate->handleException();
        return;
    }

    auto func_obj = JS_DupModule(ctx, EntryModule);
    auto evalRet = JS_EvalFunction(ctx, func_obj);

    v8::Value* val = nullptr;
    if (JS_IsException(evalRet)) {
        JS_FreeValue(ctx, evalRet);
        Isolate->handleException();
        return;

    } else {
        val = Isolate->Alloc<v8::Value>();
        val->value_ = JS_GET_MODULE_NS(ctx, EntryModule);
        JS_FreeValue(ctx, evalRet);
        v8::Local<v8::Value> ns = v8::Local<v8::Value>(val);

        if (ns->IsNullOrUndefined())
        {
            ns = v8::Object::New(Isolate);
        }

        info.GetReturnValue().Set(ns);

        return;   
    }
#endif
}

#if !WITH_QUICKJS
v8::MaybeLocal<v8::Module> puerts::esmodule::_ResolveModule(
    v8::Local<v8::Context> Context,
    v8::Local<v8::String> Specifier,
    v8::Local<v8::Module> Referrer,
    bool& isFromCache
)
{
    v8::Isolate* Isolate = Context->GetIsolate();
    BackendEnv* mm = (BackendEnv*)Isolate->GetData(1);

    v8::Local<v8::Value> ReferrerName;
    const auto referIter = mm->ScriptIdToPathMap.find(Referrer->ScriptId()); 
    if (referIter != mm->ScriptIdToPathMap.end())
    {
        std::string referPath_std = referIter->second;
        ReferrerName = v8::String::NewFromUtf8(Isolate, referPath_std.c_str()).ToLocalChecked();
    }
    else
    {
        ReferrerName = v8::String::NewFromUtf8(Isolate, "").ToLocalChecked();
    }

    v8::MaybeLocal<v8::Value> maybeRet = CallResolver(Isolate, Context, Specifier, ReferrerName);
    if (maybeRet.IsEmpty()) 
    {
        return v8::MaybeLocal<v8::Module> {};
    }
    Specifier = v8::Local<v8::String>::Cast(maybeRet.ToLocalChecked());

    v8::String::Utf8Value Specifier_utf8(Isolate, Specifier);
    std::string Specifier_std(*Specifier_utf8, Specifier_utf8.length());

    const auto cacheIter = mm->PathToModuleMap.find(Specifier_std);
    if (cacheIter != mm->PathToModuleMap.end())//create and link
    {
        isFromCache = true;
        return v8::Local<v8::Module>::New(Isolate, cacheIter->second);
    }
    
    std::string pathForDebug;
    maybeRet = CallRead(Isolate, Context, Specifier, pathForDebug);
    if (maybeRet.IsEmpty()) 
    {
        return v8::MaybeLocal<v8::Module> {};
    }
    v8::Local<v8::String> Code = v8::Local<v8::String>::Cast(maybeRet.ToLocalChecked());

    v8::ScriptOrigin Origin(pathForDebug.size() == 0 ? 
        Specifier : 
        v8::String::NewFromUtf8(Isolate, pathForDebug.c_str()).ToLocalChecked(),
        v8::Integer::New(Isolate, 0),                      // line offset
        v8::Integer::New(Isolate, 0),                    // column offset
        v8::True(Isolate),                    // is cross origin
        v8::Local<v8::Integer>(),                 // script id
        v8::Local<v8::Value>(),                   // source map URL
        v8::False(Isolate),                   // is opaque (?)
        v8::False(Isolate),                   // is WASM
        v8::True(Isolate),                    // is ES Module
        v8::PrimitiveArray::New(Isolate, 10)
    );

    v8::ScriptCompiler::CompileOptions options;

    v8::ScriptCompiler::Source Source(Code, Origin);
    v8::Local<v8::Module> Module;

    if (!v8::ScriptCompiler::CompileModule(Isolate, &Source, v8::ScriptCompiler::kNoCompileOptions)
            .ToLocal(&Module)) 
    {
        return v8::MaybeLocal<v8::Module> {};
    }
    mm->ScriptIdToPathMap[Module->ScriptId()] = Specifier_std;
    mm->PathToModuleMap[Specifier_std] = v8::UniquePersistent<v8::Module>(Isolate, Module);
    return Module;
}

v8::MaybeLocal<v8::Module> puerts::esmodule::ResolveModule(
    v8::Local<v8::Context> Context,
    v8::Local<v8::String> Specifier,
    v8::Local<v8::Module> Referrer
)
{
    bool isFromCache = false;
    return _ResolveModule(Context, Specifier, Referrer, isFromCache);
}

bool puerts::esmodule::LinkModule(
    v8::Local<v8::Context> Context,
    v8::Local<v8::Module> RefModule
)
{
    v8::Isolate* Isolate = Context->GetIsolate();

    for (int i = 0, length = RefModule->GetModuleRequestsLength(); i < length; i++)
    {
        v8::Local<v8::String> Specifier_v8 = RefModule->GetModuleRequest(i);

        bool isFromCache = false;
        v8::MaybeLocal<v8::Module> MaybeModule = _ResolveModule(Context, Specifier_v8, RefModule, isFromCache);
        if (MaybeModule.IsEmpty())
        {
            return false;
        }
        if (!isFromCache) 
        {
            if (!LinkModule(Context, MaybeModule.ToLocalChecked())) 
            {
                return false;
            }
        }
    }

    return true;
}

void puerts::esmodule::HostInitializeImportMetaObject(v8::Local<v8::Context> Context, v8::Local<v8::Module> Module, v8::Local<v8::Object> meta)
{
    v8::Isolate* Isolate = Context->GetIsolate();
    BackendEnv* mm = (BackendEnv*)Isolate->GetData(1);

    auto iter = mm->ScriptIdToPathMap.find(Module->ScriptId());
    if (iter != mm->ScriptIdToPathMap.end()) 
    {
        meta->CreateDataProperty(
            Context, 
            v8::String::NewFromUtf8(Isolate, "url").ToLocalChecked(),
            v8::String::NewFromUtf8(Isolate, ("puer:" + iter->second).c_str()).ToLocalChecked()
        ).ToChecked();
    }
}

#else 
char* puerts::esmodule::js_module_resolver(
    JSContext *ctx, const char *base_name, const char *name, void* opaque
)
{
    JSRuntime *rt = JS_GetRuntime(ctx);
    v8::Isolate* Isolate = (v8::Isolate*)JS_GetRuntimeOpaque(rt);
    BackendEnv* mm = (BackendEnv*)Isolate->GetData(1);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    v8::Local<v8::Value> Specifier = v8::String::NewFromUtf8(Isolate, name).ToLocalChecked();
    v8::Local<v8::Value> ReferrerName = v8::String::NewFromUtf8(Isolate, base_name).ToLocalChecked();

    v8::TryCatch TryCatch(Isolate);
    v8::MaybeLocal<v8::Value> maybeRet = CallResolver(Isolate, Context, Specifier, ReferrerName);
    if (maybeRet.IsEmpty() || !(Specifier = maybeRet.ToLocalChecked())->IsString()) 
    {
        // should be a exception on mockV8's VM

        // TODO rethrow this error will crash, why?
        // JSValue ex = TryCatch.catched_;
        std::string ErrorMessage = std::string("[Puer002]module not found ") + name;
        JSValue ex = JS_NewStringLen(ctx, ErrorMessage.c_str(), ErrorMessage.length());
        JS_Throw(ctx, ex);
        // there should be a exception in quickjs VM now
        return nullptr;
    }

    v8::String::Utf8Value Specifier_utf8(Isolate, Specifier);
    const char* specifier = *Specifier_utf8;

    int32_t size = strlen(specifier);
    char* rname = (char*)js_malloc(ctx, strlen(specifier) + 1);
    memcpy(rname, specifier, size);
    rname[size] = '\0';
    return rname;
}

JSModuleDef* puerts::esmodule::js_module_loader(
    JSContext* ctx, const char *name, void *opaque
) 
{
    JSRuntime *rt = JS_GetRuntime(ctx);
    v8::Isolate* Isolate = (v8::Isolate*)JS_GetRuntimeOpaque(rt);
    BackendEnv* mm = (BackendEnv*)Isolate->GetData(1);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    
    std::string name_std(name, strlen(name));

    auto Iter = mm->PathToModuleMap.find(name_std);
    if (Iter != mm->PathToModuleMap.end())//create and link
    {
        return Iter->second;
    }

    std::string pathForDebug;
    v8::Local<v8::Value> Specifier = v8::String::NewFromUtf8(Isolate, name).ToLocalChecked();
    v8::TryCatch TryCatch(Isolate);
    v8::MaybeLocal<v8::Value> maybeRet = CallRead(Isolate, Context, Specifier, pathForDebug);
    v8::Local<v8::Value> ret;
    if (maybeRet.IsEmpty() || !((ret = maybeRet.ToLocalChecked())->IsString()))
    {
        // should be a exception on mockV8's VM

        // JSValue ex = TryCatch.catched_;
        // TODO rethrow this error will crash, why?
        std::string ErrorMessage = std::string("[Puer003]module not found ") + name;
        JSValue ex = JS_NewStringLen(ctx, ErrorMessage.c_str(), ErrorMessage.length());
        JS_Throw(ctx, ex);
        // there should be a exception in quickjs VM now
        return nullptr;
    }
    v8::Local<v8::String> V8Code = v8::Local<v8::String>::Cast(ret);
    v8::String::Utf8Value Code_utf8(Isolate, V8Code);

    const char* Code = *Code_utf8;
    if (Code == nullptr) 
    {
        return nullptr;
    }
    JSValue func_val = JS_Eval(ctx, Code, strlen(Code), name, JS_EVAL_TYPE_MODULE | JS_EVAL_FLAG_COMPILE_ONLY);

    if (JS_IsException(func_val)) {
        // there should be a exception in quickjs VM now
        return nullptr;
    }

    auto module_ = (JSModuleDef *) JS_VALUE_GET_PTR(func_val);

    auto obj = JS_GetImportMeta(ctx, module_);
    JS_SetProperty(ctx, obj, JS_NewAtom(ctx, "url"), JS_NewString(ctx, ("puer:" + name_std).c_str()));
    JS_FreeValue(ctx, obj);

    mm->PathToModuleMap[name_std] = module_;

    return module_;
}
#endif
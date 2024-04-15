/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
#include "BackendEnv.h"
#include "Log.h"
#include "PromiseRejectCallback.hpp"

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

#endif // WITH_NODEJS

#if defined(WITH_QUICKJS)
#if !defined(CONFIG_CHECK_JSVALUE) && defined(JS_NAN_BOXING)
#define JS_INITVAL(s, t, val) s = JS_MKVAL(t, val)
#define JS_INITPTR(s, t, p) s = JS_MKPTR(t, p)
#else
#define JS_INITVAL(s, t, val) s.tag = t, s.u.int32=val
#define JS_INITPTR(s, t, p) s.tag = t, s.u.ptr = p
#endif
#endif

namespace PUERTS_NAMESPACE
{

static std::unique_ptr<v8::Platform> GPlatform;
#if defined(WITH_NODEJS)
static std::vector<std::string>* Args;
static std::vector<std::string>* ExecArgs;
static std::vector<std::string>* Errors;
#endif

void FBackendEnv::StartPolling()
{
#if defined(WITH_NODEJS)
    uv_async_init(&NodeUVLoop, &DummyUVHandle, nullptr);
    uv_sem_init(&PollingSem, 0);
    uv_thread_create(
        &PollingThread,
        [](void* arg)
        {
            auto* self = static_cast<FBackendEnv*>(arg);
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
#endif
}

#if defined(WITH_NODEJS)
void FBackendEnv::UvRunOnce()
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

void FBackendEnv::PollEvents()
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

void FBackendEnv::OnWatcherQueueChanged(uv_loop_t* loop)
{
#if !PLATFORM_WINDOWS
    FBackendEnv* self = static_cast<FBackendEnv*>(loop->data);
    self->WakeupPollingThread();
#endif
}

void FBackendEnv::WakeupPollingThread()
{
    uv_async_send(&DummyUVHandle);
}
#endif

void FBackendEnv::StopPolling()
{
#if defined(WITH_NODEJS)
    PollingClosed = true;

    uv_sem_post(&PollingSem);

    WakeupPollingThread();

    uv_thread_join(&PollingThread);

    uv_sem_destroy(&PollingSem);
#endif
}

void FBackendEnv::GlobalPrepare()
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

void FBackendEnv::Initialize(void* external_quickjs_runtime, void* external_quickjs_context)
{
#if defined(WITH_NODEJS)
    const int Ret = uv_loop_init(&NodeUVLoop);
    if (Ret != 0)
    {
        // TODO log
        printf("uv_loop_init failed\n");
        return;
    }

    NodeArrayBufferAllocator = node::ArrayBufferAllocator::Create();
    // PLog(Log, "[PuertsDLL][JSEngineWithNode]isolate");

    auto Platform = static_cast<node::MultiIsolatePlatform*>(GPlatform.get());
    MainIsolate = node::NewIsolate(NodeArrayBufferAllocator.get(), &NodeUVLoop,
        Platform);

    MainIsolate->SetMicrotasksPolicy(v8::MicrotasksPolicy::kAuto);
#else

    // 初始化Isolate和DefaultContext
    CreateParams = new v8::Isolate::CreateParams();
    CreateParams->array_buffer_allocator = v8::ArrayBuffer::Allocator::NewDefaultAllocator();
    
#if WITH_QUICKJS
    MainIsolate = (external_quickjs_runtime == nullptr) ? v8::Isolate::New(*CreateParams) : v8::Isolate::New(external_quickjs_runtime);
#else
    MainIsolate = v8::Isolate::New(*CreateParams);
#endif
#endif

    auto Isolate = MainIsolate;
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::Isolate::Scope Isolatescope(Isolate);
    v8::HandleScope HandleScope(Isolate);
#if defined(WITH_NODEJS)
    v8::Local<v8::Context> Context = node::NewContext(Isolate);
#elif defined(WITH_QUICKJS)
    v8::Local<v8::Context> Context = (external_quickjs_runtime && external_quickjs_context) ? v8::Context::New(Isolate, external_quickjs_context) : v8::Context::New(Isolate);
#else
    v8::Local<v8::Context> Context = v8::Context::New(Isolate);
#endif
    v8::Context::Scope ContextScope(Context);
    MainContext.Reset(Isolate, Context);
    
    v8::Local<v8::Object> Global = Context->Global();
#if defined(WITH_NODEJS)
    auto strConsole = v8::String::NewFromUtf8(Isolate, "console").ToLocalChecked();
    v8::Local<v8::Value> Console = Global->Get(Context, strConsole).ToLocalChecked();

    NodeIsolateData = node::CreateIsolateData(Isolate, &NodeUVLoop, Platform, NodeArrayBufferAllocator.get()); // node::FreeIsolateData

    NodeEnv = CreateEnvironment(NodeIsolateData, Context, *Args, *ExecArgs, (node::EnvironmentFlags::Flags)(node::EnvironmentFlags::kOwnsProcessState | node::EnvironmentFlags::kNoRegisterESMLoader | node::EnvironmentFlags::kNoCreateInspector));

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
    
    if (external_quickjs_runtime == nullptr) 
    {
        Isolate->SetPromiseRejectCallback(&PromiseRejectCallback<FBackendEnv>);

#if !WITH_QUICKJS
        Isolate->SetHostInitializeImportMetaObjectCallback(&esmodule::HostInitializeImportMetaObject);
        Isolate->SetHostImportModuleDynamicallyCallback(&esmodule::DynamicImport);
#endif

        Global->Set(Context, v8::String::NewFromUtf8(Isolate, "__tgjsSetPromiseRejectCallback").ToLocalChecked(), v8::FunctionTemplate::New(Isolate, &SetPromiseRejectCallback<FBackendEnv>)->GetFunction(Context).ToLocalChecked()).Check();
    }
    
#if defined(WITH_QUICKJS)
    JsFileLoader = JS_Undefined();
    JsFileNormalize = JS_Undefined();
    
    auto rt = Isolate->runtime_;
    auto ctx = Context->context_;
    JS_SetModuleLoaderFunc(rt, esmodule::module_normalize, esmodule::js_module_loader, this);
    
    JSValue FuncData;
    JS_INITPTR(FuncData, JS_TAG_EXTERNAL, (void*)this);
    JSValue Func = JS_NewCFunctionData(ctx, esmodule::ExecuteModule, 0, 0, 1, &FuncData);
    
    JSValue G = JS_GetGlobalObject(ctx);
    JS_SetPropertyStr(ctx, G, EXECUTEMODULEGLOBANAME, Func);
    JS_FreeValue(ctx, G);
#else
    Global->Set(Context, v8::String::NewFromUtf8(Isolate, EXECUTEMODULEGLOBANAME).ToLocalChecked(), v8::FunctionTemplate::New(Isolate, esmodule::ExecuteModule)->GetFunction(Context).ToLocalChecked()).Check();
#endif
}

void FBackendEnv::UnInitialize()
{
#if defined(WITH_QUICKJS)
    JS_FreeValueRT(MainIsolate->runtime_, JsFileNormalize);
    JS_FreeValueRT(MainIsolate->runtime_, JsFileLoader);
#endif
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

void FBackendEnv::LogicTick()
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

void FBackendEnv::CreateInspector(v8::Isolate* Isolate, const v8::Global<v8::Context>* ContextGlobal, int32_t Port)
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

void FBackendEnv::DestroyInspector(v8::Isolate* Isolate, const v8::Global<v8::Context>* ContextGlobal)
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

bool FBackendEnv::InspectorTick()
{
    if (Inspector != nullptr)
    {
        return Inspector->Tick();
    }
    return true;
}

bool FBackendEnv::ClearModuleCache(v8::Isolate* Isolate, v8::Local<v8::Context> Context, const char* Path)
{
    std::string key(Path);
    if (key.size() == 0) 
    {
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

#if defined(WITH_QUICKJS)
char* FBackendEnv::ResolveQjsModule(JSContext *ctx, const char *base_name, const char *name, bool throwIfFail)
{
    if (JS_IsUndefined(JsFileNormalize))
    {
        JSValue G = JS_GetGlobalObject(ctx);
        JsFileNormalize = JS_GetPropertyStr(ctx, G, "__puer_resolve_module_url__");
        JS_FreeValue(ctx, G);
        if (throwIfFail && JS_IsUndefined(JsFileNormalize))
        {
            JS_ThrowReferenceError(ctx, "could not load module loader");
            return nullptr;
        }
    }
    if (!JS_IsUndefined(JsFileNormalize))
    {
        JSValue Args[2];
        Args[0] = JS_NewString(ctx, name);
        Args[1] = JS_NewString(ctx, base_name);
        JSValue Resolved = JS_Call(ctx, JsFileNormalize, JS_Undefined(), 2, &Args[0]);
        if (!JS_IsException(Resolved))
        {
            const char* ResolvedName = JS_ToCString(ctx, Resolved);
            char* ret = js_strdup(ctx, ResolvedName);
            JS_FreeCString(ctx, ResolvedName);
            JS_FreeValue(ctx, Resolved);
            return ret;
        }
        else
        {
            if (!throwIfFail)
            {
                JS_FreeValue(ctx, JS_GetException(ctx));
            }
        }
    }
    
    return nullptr;
}

char* FBackendEnv::NormalizeModuleName(JSContext *ctx, const char *base_name, const char *name)
{
    char* ret = ResolveQjsModule(ctx, base_name, name, true);
    
    return ret ? ret : js_strdup(ctx, "");;
}

//static bool StringIsNullOrEmpty(const char * str)
//{
//    return str == nullptr || str[0] == '\0';
//}

JSModuleDef* FBackendEnv::LoadModule(JSContext* ctx, const char *name)
{
    //if (StringIsNullOrEmpty(name))
    //{
        // exception from Normalize
    //    return nullptr;
    //}
    auto Ex = JS_GetException(ctx);
    if (!JS_IsUndefined(Ex) && !JS_IsNull(Ex))
    {
        JS_Throw(ctx, Ex);
        return nullptr;
    }
    // quickjs本身已经做了cache，这只是为了支持ClearModuleCache ///
    auto Iter = PathToModuleMap.find(name);
    if (Iter != PathToModuleMap.end())
    {
        return Iter->second;
    }
    
    if (JS_IsUndefined(JsFileLoader))
    {
        JSValue G = JS_GetGlobalObject(ctx);
        JsFileLoader = JS_GetPropertyStr(ctx, G, "__puer_resolve_module_content__");
        JS_FreeValue(ctx, G);
        
        if (JS_IsUndefined(JsFileLoader))
        {
            JS_ThrowReferenceError(ctx, "could not load module loader");
            return nullptr;
        }
    }
    
    JSValue Url = JS_NewString(ctx, name);
    JSValue Context = JS_Call(ctx, JsFileLoader, JS_Undefined(), 1, &Url);
    
    if (JS_IsException(Context))
    {
        return nullptr;
    }
    
    if (!JS_IsString(Context))
    {
        JS_FreeValue(ctx, Context);
        JS_ThrowReferenceError(ctx, "could not load module filename '%s'", name);
        return nullptr;
    }
    
    const char * Src = JS_ToCString(ctx, Context);
    JSValue EvalRet = JS_Eval(ctx, Src, strlen(Src), name, JS_EVAL_TYPE_MODULE | JS_EVAL_FLAG_COMPILE_ONLY);
    
    if (JS_IsException(EvalRet))
    {
        return nullptr;
    }
    
    auto Ret = (JSModuleDef *)JS_VALUE_GET_PTR(EvalRet);

    auto Meta = JS_GetImportMeta(ctx, Ret);
    std::string str = name;
    str = "puer:" + str;
    JS_SetPropertyStr(ctx, Meta, "url", JS_NewString(ctx, str.c_str()));
    JS_FreeValue(ctx, Meta);

    PathToModuleMap[name] = Ret;
    
    JS_FreeCString(ctx, Src);
    JS_FreeValue(ctx, Context);
    
    return Ret;
}

#endif

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
#if !WITH_QUICKJS
v8::MaybeLocal<v8::Promise> esmodule::DynamicImport(
    v8::Local<v8::Context> Context, 
    v8::Local<v8::ScriptOrModule> Referrer,
    v8::Local<v8::String> Specifier
) 
{
    bool isFromCache;
    v8::Local<v8::Value> ReferrerName = Referrer->GetResourceName();
    
    v8::TryCatch TryCatch(Context->GetIsolate());
    v8::MaybeLocal<v8::Module> mod = esmodule::_ResolveModule(Context, Specifier, ReferrerName, isFromCache);

    v8::Local<v8::Promise::Resolver> resolver;
    if (!v8::Promise::Resolver::New(Context).ToLocal(&resolver)) return v8::MaybeLocal<v8::Promise> {};
    
    if (mod.IsEmpty())
    {
        resolver->Reject(Context, TryCatch.Exception());
        return resolver->GetPromise();
    }
    v8::Local<v8::Module> moduleChecked = mod.ToLocalChecked();
    if (!esmodule::LinkModule(Context, moduleChecked))
    {
        resolver->Reject(Context, TryCatch.Exception());
        return resolver->GetPromise();
    }
    v8::Maybe<bool> ret = moduleChecked->InstantiateModule(Context, esmodule::ResolveModule);
    if (ret.IsNothing() || !ret.ToChecked())
    {
        resolver->Reject(Context, TryCatch.Exception());
        return resolver->GetPromise();
    }
    v8::MaybeLocal<v8::Value> evalRet = moduleChecked->Evaluate(Context);
    if (evalRet.IsEmpty())
    {
        resolver->Reject(Context, TryCatch.Exception());
        return resolver->GetPromise();
    }

    resolver->Resolve(Context, moduleChecked->GetModuleNamespace());

    return resolver->GetPromise();
}
#endif

#if defined(WITH_QUICKJS)
JSValue esmodule::ExecuteModule(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv, int magic, JSValue *func_data)
{
    if (argc == 1)
    {
        const char * Specifier = JS_ToCString(ctx, argv[0]);
        FBackendEnv* Backend = (FBackendEnv*)(JS_VALUE_GET_PTR(func_data[0]));
        char *Path = Backend->ResolveQjsModule(ctx, "", Specifier, true);
        if (!Path)
        {
            return JS_Exception();
        }
        JSModuleDef* EntryModule = Backend->LoadModule(ctx, Path);
        JS_FreeCString(ctx, Specifier);
        js_free(ctx, Path);
        if (!EntryModule)
        {
            return JS_Exception();
        }
        auto Func = JS_DupModule(ctx, EntryModule);
        auto EvalRet = JS_EvalFunction(ctx, Func);
        if (JS_IsException(EvalRet)) {
            return EvalRet;
        }
        auto Namespace = JS_GET_MODULE_NS(ctx, EntryModule);
        if (JS_IsUndefined(Namespace) || JS_IsNull(Namespace))
        {
            return JS_NewObject(ctx);
        }
        else
        {
            return Namespace;
        }
    }
    
    return JS_Undefined();
}
#else
void esmodule::ExecuteModule(const v8::FunctionCallbackInfo<v8::Value>& info) 
{
    v8::Isolate* Isolate = info.GetIsolate();
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    v8::Local<v8::String> Specifier_v8 = info[0]->ToString(Context).ToLocalChecked();

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

    v8::MaybeLocal<v8::Module> mod = esmodule::ResolveModule(Context, Specifier_v8, entryModule);
    if (mod.IsEmpty())
    {
        // TODO
        return;
    }
    v8::Local<v8::Module> moduleChecked = mod.ToLocalChecked();
    if (!esmodule::LinkModule(Context, moduleChecked))
    {
        // TODO
        return;
    }
    v8::Maybe<bool> ret = moduleChecked->InstantiateModule(Context, esmodule::ResolveModule);
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
}
#endif

#if !WITH_QUICKJS
v8::MaybeLocal<v8::Module> esmodule::_ResolveModule(
    v8::Local<v8::Context> Context,
    v8::Local<v8::String> Specifier,
    v8::Local<v8::Value> ReferrerName,
    bool& isFromCache
)
{
    v8::Isolate* Isolate = Context->GetIsolate();
    FBackendEnv* mm = FBackendEnv::Get(Isolate);

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
#if V8_94_OR_NEWER
    mm->ScriptIdToPathMap[Module->ScriptId()] = Specifier_std;
#else 
    mm->ScriptIdToPathMap[Module->GetIdentityHash()] = Specifier_std;
#endif
    mm->PathToModuleMap[Specifier_std] = v8::UniquePersistent<v8::Module>(Isolate, Module);
    return Module;
}

v8::Local<v8::Value> GetModuleName(
    v8::Isolate* Isolate,
    v8::Local<v8::Module> Referrer
) 
{
    FBackendEnv* mm = FBackendEnv::Get(Isolate);
    v8::Local<v8::Value> ReferrerName;
#if V8_94_OR_NEWER
    const auto referIter = mm->ScriptIdToPathMap.find(Referrer->ScriptId()); 
#else 
    const auto referIter = mm->ScriptIdToPathMap.find(Referrer->GetIdentityHash()); 
#endif
    if (referIter != mm->ScriptIdToPathMap.end())
    {
        std::string referPath_std = referIter->second;
        ReferrerName = v8::String::NewFromUtf8(Isolate, referPath_std.c_str()).ToLocalChecked();
    }
    else
    {
        ReferrerName = v8::String::NewFromUtf8(Isolate, "").ToLocalChecked();
    }
    return ReferrerName;
}

v8::MaybeLocal<v8::Module> esmodule::ResolveModule(
    v8::Local<v8::Context> Context,
    v8::Local<v8::String> Specifier,
    v8::Local<v8::Module> Referrer
)
{
    v8::Isolate* Isolate = Context->GetIsolate();
    bool isFromCache = false;
    v8::Local<v8::Value> ReferrerName = GetModuleName(Isolate, Referrer);

    return _ResolveModule(Context, Specifier, ReferrerName, isFromCache);
}

bool esmodule::LinkModule(
    v8::Local<v8::Context> Context,
    v8::Local<v8::Module> RefModule
)
{
    v8::Isolate* Isolate = Context->GetIsolate();

    for (int i = 0, length = RefModule->GetModuleRequestsLength(); i < length; i++)
    {
        v8::Local<v8::String> Specifier_v8 = RefModule->GetModuleRequest(i);

        bool isFromCache = false;
        v8::MaybeLocal<v8::Module> MaybeModule = _ResolveModule(Context, Specifier_v8, GetModuleName(Isolate, RefModule), isFromCache);
        if (MaybeModule.IsEmpty())
        {
            return false;
        }
        if (!isFromCache) 
        {
            v8::Local<v8::Module> Module = MaybeModule.ToLocalChecked();
            if (!LinkModule(Context, Module)) 
            {
                FBackendEnv* mm = FBackendEnv::Get(Isolate);

#if V8_94_OR_NEWER
                auto Specifier_std = mm->ScriptIdToPathMap[Module->ScriptId()];
                mm->ScriptIdToPathMap.erase(Module->ScriptId());
#else 
                auto Specifier_std =  = mm->ScriptIdToPathMap[Module->GetIdentityHash()];
                mm->ScriptIdToPathMap.erase(Module->GetIdentityHash());
#endif
                mm->PathToModuleMap.erase(Specifier_std);
                return false;
            }
        }
    }

    return true;
}

void esmodule::HostInitializeImportMetaObject(v8::Local<v8::Context> Context, v8::Local<v8::Module> Module, v8::Local<v8::Object> meta)
{
    v8::Isolate* Isolate = Context->GetIsolate();
    FBackendEnv* mm = FBackendEnv::Get(Isolate);

#if V8_94_OR_NEWER
    auto iter = mm->ScriptIdToPathMap.find(Module->ScriptId());
#else 
    auto iter = mm->ScriptIdToPathMap.find(Module->GetIdentityHash());
#endif
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

JSModuleDef* esmodule::js_module_loader(
    JSContext* ctx, const char *name, void *opaque
) 
{
    return static_cast<FBackendEnv*>(opaque)->LoadModule(ctx, name);
}

char* esmodule::module_normalize(
    JSContext *ctx, const char *base_name, const char *name, void* opaque
)
{
    return static_cast<FBackendEnv*>(opaque)->NormalizeModuleName(ctx, base_name, name);
}
#endif

}

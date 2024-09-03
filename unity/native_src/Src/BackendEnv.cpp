/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
#include "BackendEnv.h"
#include "Log.h"
#include "PromiseRejectCallback.hpp"
#include "V8Utils.h"

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

#if defined(WITH_WEBSOCKET)
void InitWebsocketPPWrap(v8::Local<v8::Context> Context);
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
        std::string Flags = "--stack_size=856";
#if PUERTS_DEBUG
        Flags += " --expose-gc";
#if PLATFORM_MAC
        Flags += " --jitless --no-expose-wasm";
#endif
#endif
#if defined(PLATFORM_IOS) || defined(PLATFORM_OHOS)
        Flags += " --jitless --no-expose-wasm";
#endif
#if V8_MAJOR_VERSION <= 9
        Flags += " --no-harmony-top-level-await";
#endif
        v8::V8::SetFlagsFromString(Flags.c_str(), static_cast<int>(Flags.size()));

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

#if !defined(WITH_QUICKJS)
        Isolate->SetHostInitializeImportMetaObjectCallback(&esmodule::HostInitializeImportMetaObject);
        Isolate->SetHostImportModuleDynamicallyCallback(&esmodule::HostImportModuleDynamically);
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
    Global->Set(Context, v8::String::NewFromUtf8(Isolate, "v8").ToLocalChecked(), GetV8Extras(Isolate, Context));
#endif

#if defined(WITH_WEBSOCKET)
    InitWebsocketPPWrap(Context);
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
        JS_FreeValue(ctx,  Args[1]);
        JS_FreeValue(ctx,  Args[0]);
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
#if defined(QUICKJS_VERSION) && QUICKJS_VERSION >= 20240214
    if (JS_HasException(ctx))
    {
        return nullptr;
    }
#else
    auto Ex = JS_GetException(ctx);
    if (!JS_IsUndefined(Ex) && !JS_IsNull(Ex))
    {
        JS_Throw(ctx, Ex);
        return nullptr;
    }
#endif
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
    JS_FreeValue(ctx, Url);
    
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
#if defined(JS_EVAL_FLAG_ASYNC)
        if (!JS_IsUndefined(EvalRet))
        {
            JSPromiseStateEnum state = JS_PromiseState(ctx, EvalRet);
            if (state == JS_PROMISE_REJECTED)
            {
                auto ret = JS_Throw(ctx, JS_PromiseResult(ctx, EvalRet));
                JS_FreeValue(ctx, EvalRet);
                return ret;
            }
        }
#endif
        JS_FreeValue(ctx, EvalRet);
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

#else
    
v8::MaybeLocal<v8::Value> FBackendEnv::ResolvePath(
    v8::Isolate* Isolate,
    v8::Local<v8::Context> Context,
    v8::Local<v8::Value> Specifier,
    v8::Local<v8::Value> ReferrerName
)
{
    v8::Local<v8::Value> Args[2] = {Specifier, ReferrerName};

    v8::Local<v8::Function> URLResolveFunction = v8::Local<v8::Function>::Cast(Context->Global()->Get(Context, v8::String::NewFromUtf8(Isolate, "__puer_resolve_module_url__").ToLocalChecked()).ToLocalChecked());
    return URLResolveFunction->Call(Context, Context->Global(), 2, Args);
}

v8::MaybeLocal<v8::Value> FBackendEnv::ReadFile(
    v8::Isolate* Isolate,
    v8::Local<v8::Context> Context,
    v8::Local<v8::Value> URL,
    std::string &pathForDebug
)
{
    v8::Local<v8::Array> pathForDebugRef = v8::Array::New(Isolate, 0);
    v8::Local<v8::Value> Args[2] = {URL, pathForDebugRef};

    v8::Local<v8::Function> ModuleReadFunction = v8::Local<v8::Function>::Cast(Context->Global()->Get(Context, v8::String::NewFromUtf8(Isolate, "__puer_resolve_module_content__").ToLocalChecked()).ToLocalChecked());

    v8::MaybeLocal<v8::Value> maybeRet = ModuleReadFunction->Call(Context, Context->Global(), 2, Args);

    v8::Local<v8::Value> pathForDebugValue;

    if (pathForDebugRef->Length() == 1 && pathForDebugRef->Get(Context, 0).ToLocal(&pathForDebugValue))
    {
        v8::String::Utf8Value pathForDebug_utf8(Isolate, pathForDebugValue);
        pathForDebug = std::string(*pathForDebug_utf8, pathForDebug_utf8.length());
    }

    return maybeRet;
}

v8::MaybeLocal<v8::Module> FBackendEnv::FetchModuleTree(v8::Isolate* isolate, v8::Local<v8::Context> context,
    v8::Local<v8::String> absolute_file_path)
{
    std::string absolute_file_path_str = *v8::String::Utf8Value(isolate, absolute_file_path);
    //fprintf(stdout, "o fetch:%s\n", absolute_file_path_str.c_str());
    //fprintf(stderr, "e fetch:%s\n", absolute_file_path_str.c_str());
    auto cached_module = PathToModuleMap.find(absolute_file_path_str);
    if (cached_module!= PathToModuleMap.end())
    {
        return cached_module->second.Get(isolate);
    }
    std::string pathForDebug;
    
    v8::Local<v8::Value> source_text;
    
    if (!ReadFile(isolate, context, absolute_file_path, pathForDebug).ToLocal(&source_text))
    {
        return v8::MaybeLocal<v8::Module>();
    }
    if (!source_text->IsString())
    {
        FV8Utils::ThrowException(isolate, "source_text is not a string!");
        return v8::MaybeLocal<v8::Module>();
    }
    v8::Local<v8::String> script_url = absolute_file_path;
    if (pathForDebug.size() > 0 )
    {
        script_url = FV8Utils::V8String(isolate, pathForDebug.c_str());
    }
#if defined(V8_94_OR_NEWER) && !defined(WITH_QUICKJS)
    v8::ScriptOrigin origin(isolate, script_url, 0, 0, true, -1, v8::Local<v8::Value>(), false, false, true);
#else
    v8::ScriptOrigin origin(script_url, v8::Integer::New(isolate, 0), v8::Integer::New(isolate, 0), v8::True(isolate),
        v8::Local<v8::Integer>(), v8::Local<v8::Value>(), v8::False(isolate), v8::False(isolate), v8::True(isolate));
#endif
    v8::ScriptCompiler::Source source(source_text.As<v8::String>(), origin);
    v8::Local<v8::Module> module;
    if (!v8::ScriptCompiler::CompileModule(isolate, &source).ToLocal(&module))
    {
        return v8::MaybeLocal<v8::Module>();
    }

    FModuleInfo* info = new FModuleInfo;
    info->Module.Reset(isolate, module);
#if V8_94_OR_NEWER
    int script_id = module->ScriptId();
#else 
    int script_id = module->GetIdentityHash();
#endif
    ScriptIdToModuleInfo.emplace(script_id, info);
    PathToModuleMap[absolute_file_path_str] = v8::UniquePersistent<v8::Module>(isolate, module);
    ScriptIdToPathMap[script_id] = absolute_file_path_str;
    bool load_ref_modules_fail = false;

#ifdef V8_94_OR_NEWER
    v8::Local<v8::FixedArray> module_requests = module->GetModuleRequests();
    for (int i = 0, length = module_requests->Length(); i < length; ++i)
    {
        v8::Local<v8::ModuleRequest> module_request =
            module_requests->Get(context, i).As<v8::ModuleRequest>();
        v8::Local<v8::String> request_specifier = module_request->GetSpecifier();
#else
    for (int i = 0, length = module->GetModuleRequestsLength(); i < length; i++)
    {
        v8::Local<v8::String> request_specifier = module->GetModuleRequest(i);
#endif
        v8::Local<v8::Value> resolved_path;
        if (!ResolvePath(isolate, context, request_specifier, absolute_file_path).ToLocal(&resolved_path))
        {
            load_ref_modules_fail = true;
            break;
        }
        if (!resolved_path->IsString())
        {
            FV8Utils::ThrowException(isolate, "resolved_path is not a string!");
            load_ref_modules_fail = true;
            break;
        }
        
        auto request_absolute_file_path = resolved_path.As<v8::String>();
        std::string request_absolute_file_path_str = *v8::String::Utf8Value(isolate, request_absolute_file_path);
        v8::Local<v8::Module> request_module;
        if (!FetchModuleTree(isolate, context, request_absolute_file_path).ToLocal(&request_module))
        {
            load_ref_modules_fail = true;
            break;
        }
        info->ResolveCache[*v8::String::Utf8Value(isolate, request_specifier)] = v8::Global<v8::Module>(isolate, request_module);
    }
    
    if (load_ref_modules_fail)
    {
        // for issue: https://github.com/Tencent/puerts/issues/1670
        ScriptIdToPathMap.erase(script_id);
        PathToModuleMap.erase(absolute_file_path_str);
        ScriptIdToModuleInfo.erase(script_id);
        delete info;
        return v8::MaybeLocal<v8::Module>();
    }

    return module;
}

std::unordered_multimap<int, FBackendEnv::FModuleInfo*>::iterator FBackendEnv::FindModuleInfo(v8::Local<v8::Module> module)
{
#if V8_94_OR_NEWER
    int script_id = module->ScriptId();
#else 
    int script_id = module->GetIdentityHash();
#endif
    auto range = ScriptIdToModuleInfo.equal_range(script_id);
    for (auto It = range.first; It != range.second; ++It)
    {
        if (It->second->Module == module)
        {
            return It;
        }
    }
    return ScriptIdToModuleInfo.end();
}

v8::MaybeLocal<v8::Module> FBackendEnv::ResolveModuleCallback(
    v8::Local<v8::Context> context, v8::Local<v8::String> specifier, 
#if V8_94_OR_NEWER
    v8::Local<v8::FixedArray> import_attributes,    // not implement yet
#endif
    v8::Local<v8::Module> referrer)
{
    auto isolate = context->GetIsolate();
    auto self = FBackendEnv::Get(isolate);
    const auto module_info_iter = self->FindModuleInfo(referrer);
    if(module_info_iter == self->ScriptIdToModuleInfo.end())
    {
        return v8::MaybeLocal<v8::Module>();
    }
    auto ref_module_iter = module_info_iter->second->ResolveCache.find(*(v8::String::Utf8Value(isolate, specifier)));
    if (ref_module_iter == module_info_iter->second->ResolveCache.end())
    {
        return v8::MaybeLocal<v8::Module>();
    }
    //fprintf(stderr, "e m:%s, e:%d\n", *(v8::String::Utf8Value(isolate, specifier)), ref_module_iter != module_info_iter->second->ResolveCache.end());
    return ref_module_iter->second.Get(isolate);
}

void esmodule::ExecuteModule(const v8::FunctionCallbackInfo<v8::Value>& info) 
{
    v8::Isolate* isolate = info.GetIsolate();
    v8::Local<v8::Context> context = isolate->GetCurrentContext();
    auto backend_env = FBackendEnv::Get(isolate);

    v8::Local<v8::String> specifier = info[0]->ToString(context).ToLocalChecked();

    v8::Local<v8::Value> resolved_path;
    if (!backend_env->ResolvePath(isolate, context, specifier, v8::String::Empty(isolate)).ToLocal(&resolved_path))
    {
        return;
    }
    if (!resolved_path->IsString())
    {
        FV8Utils::ThrowException(isolate, "resolved_path is not a string!");
        return;
    }
    
    v8::Local<v8::Module> root_module;

    if (!backend_env->FetchModuleTree(isolate, context, resolved_path.As<v8::String>()).ToLocal(&root_module))
    {
        return;
    }
    
    v8::MaybeLocal<v8::Value> maybe_result;
    if (root_module->InstantiateModule(context, FBackendEnv::ResolveModuleCallback).FromMaybe(false))
    {
        maybe_result = root_module->Evaluate(context);
    }
    
    v8::Local<v8::Value> result;
    if (!maybe_result.ToLocal(&result))
    {
        return;
    }
    
    if (result->IsPromise())
    {
        v8::Local<v8::Promise> result_promise = result.As<v8::Promise>();
        if (result_promise->State() == v8::Promise::kRejected)
        {
            isolate->ThrowException(result_promise->Result());
        }
    }
    
    info.GetReturnValue().Set(root_module->GetModuleNamespace());
}

struct ModuleResolutionData
{
    ModuleResolutionData(v8::Isolate* isolate_, v8::Local<v8::Value> module_namespace_,
        v8::Local<v8::Promise::Resolver> resolver_)
          : isolate(isolate_)
    {
        module_namespace.Reset(isolate, module_namespace_);
        resolver.Reset(isolate, resolver_);
    }

    v8::Isolate* isolate;
    v8::Global<v8::Value> module_namespace;
    v8::Global<v8::Promise::Resolver> resolver;
};

static void ModuleResolutionSuccessCallback(const v8::FunctionCallbackInfo<v8::Value>& info)
{
    std::unique_ptr<ModuleResolutionData> module_resolution_data( 
        static_cast<ModuleResolutionData*>(info.Data().As<v8::External>()->Value()));
    v8::Isolate* isolate = info.GetIsolate();
    v8::Local<v8::Context> context = isolate->GetCurrentContext();

    v8::Local<v8::Promise::Resolver> resolver(
        module_resolution_data->resolver.Get(isolate));
    v8::Local<v8::Value> module_namespace(
          module_resolution_data->module_namespace.Get(isolate));
    
    resolver->Resolve(context, module_namespace).ToChecked();
}

static void ModuleResolutionFailureCallback(const v8::FunctionCallbackInfo<v8::Value>& info)
{
    std::unique_ptr<ModuleResolutionData> module_resolution_data( 
        static_cast<ModuleResolutionData*>(info.Data().As<v8::External>()->Value()));
    v8::Isolate* isolate = info.GetIsolate();
    v8::Local<v8::Context> context = isolate->GetCurrentContext();
 
    v8::Local<v8::Promise::Resolver> resolver(
        module_resolution_data->resolver.Get(isolate));
    v8::Local<v8::Value> module_namespace(
          module_resolution_data->module_namespace.Get(isolate));

    resolver->Reject(context, info[0]).ToChecked();
}

struct DynamicImportData
{
    DynamicImportData(v8::Isolate* isolate_, v8::Local<v8::String> referrer_,
                    v8::Local<v8::String> specifier_,
                    v8::Local<v8::Promise::Resolver> resolver_)
        : isolate(isolate_)
    {
        referrer.Reset(isolate, referrer_);
        specifier.Reset(isolate, specifier_);
        resolver.Reset(isolate, resolver_);
    }

    v8::Isolate* isolate;
    v8::Global<v8::String> referrer;
    v8::Global<v8::String> specifier;
    v8::Global<v8::Promise::Resolver> resolver;
};

static void DoHostImportModuleDynamically(void* import_data_)
{
    std::unique_ptr<DynamicImportData> import_data(
        static_cast<DynamicImportData*>(import_data_));
      
    v8::Isolate* isolate(import_data->isolate);
    auto backend_env = FBackendEnv::Get(isolate);
    v8::HandleScope handle_scope(isolate);
    v8::Local<v8::Context> context = backend_env->MainContext.Get(isolate);
    v8::Context::Scope context_scope(context);
    
    v8::Local<v8::String> referrer(import_data->referrer.Get(isolate));
    v8::Local<v8::String> specifier(import_data->specifier.Get(isolate));
    v8::Local<v8::Promise::Resolver> resolver(import_data->resolver.Get(isolate));
    
    v8::TryCatch try_catch(isolate);
    v8::Local<v8::Value> resolved_path;
    if (!backend_env->ResolvePath(isolate, context, specifier, referrer).ToLocal(&resolved_path))
    {
        resolver->Reject(context, try_catch.Exception());
        return;
    }
    std::string absolute_file_path_str = *v8::String::Utf8Value(isolate, resolved_path);
    v8::Local<v8::Module> root_module;
    auto cached_module = backend_env->PathToModuleMap.find(absolute_file_path_str);
    if (cached_module!= backend_env->PathToModuleMap.end())
    {
        root_module = cached_module->second.Get(isolate);
    }
    else if(!backend_env->FetchModuleTree(isolate, context, resolved_path.As<v8::String>()).ToLocal(&root_module))
    {
        resolver->Reject(context, try_catch.Exception());
        return;
    }
    
    v8::MaybeLocal<v8::Value> maybe_result;
    if (root_module->InstantiateModule(context, FBackendEnv::ResolveModuleCallback).FromMaybe(false))
    {
        maybe_result = root_module->Evaluate(context);
    }
    
    v8::Local<v8::Value> result;
    if (!maybe_result.ToLocal(&result))
    {
        resolver->Reject(context, try_catch.Exception());
        return;
    }
    
    if (result->IsPromise())
    {
        v8::Local<v8::Promise> result_promise = result.As<v8::Promise>();
        auto module_resolution_data = new ModuleResolutionData(isolate, root_module->GetModuleNamespace(), resolver);
        v8::Local<v8::External> edata = v8::External::New(isolate, module_resolution_data);
        v8::Local<v8::Function> callback_success;
        if(!v8::Function::New(context, ModuleResolutionSuccessCallback, edata).ToLocal(&callback_success))
        {
            resolver->Reject(context, try_catch.Exception());
            return;
        }
        v8::Local<v8::Function> callback_failure;
        if(!v8::Function::New(context, ModuleResolutionFailureCallback, edata).ToLocal(&callback_failure))
        {
            resolver->Reject(context, try_catch.Exception());
            return;
        }
        result_promise->Then(context, callback_success, callback_failure).ToLocalChecked();
    }
    else
    {
        resolver->Resolve(context, root_module->GetModuleNamespace());
    }
}

#if V8_MAJOR_VERSION >= 10
v8::MaybeLocal<v8::Promise> esmodule::HostImportModuleDynamically(v8::Local<v8::Context> context, v8::Local<v8::Data> host_defined_options,
    v8::Local<v8::Value> resource_name, v8::Local<v8::String> specifier, v8::Local<v8::FixedArray> import_assertions)
{
    v8::Local<v8::Value> referrer_name = resource_name;
#else
v8::MaybeLocal<v8::Promise> esmodule::HostImportModuleDynamically(
    v8::Local<v8::Context> context, v8::Local<v8::ScriptOrModule> referrer, v8::Local<v8::String> specifier) 
{
    v8::Local<v8::Value> referrer_name = referrer->GetResourceName();
#endif
    auto isolate = context->GetIsolate();
    v8::HandleScope handle_scope(isolate);
    v8::Context::Scope context_scope(context);
    v8::Local<v8::Promise::Resolver> resolver;
    if (!v8::Promise::Resolver::New(context).ToLocal(&resolver)) return v8::MaybeLocal<v8::Promise> {};
    
    DynamicImportData* data = new DynamicImportData(
        isolate, v8::Local<v8::String>::Cast(referrer_name), specifier,
        resolver);
    isolate->EnqueueMicrotask(DoHostImportModuleDynamically, data);

    return resolver->GetPromise();
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

#endif


std::string FBackendEnv::GetJSStackTrace()
{
    v8::Isolate* Isolate = MainIsolate;
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = MainContext.Get(Isolate);
    v8::Context::Scope ContextScope(Context);

#if defined(WITH_QUICKJS)
    auto ctx = Context->context_;
    // new Error("").stack
    JSValue global = JS_GetGlobalObject(ctx);
    JSValue error_t = JS_GetPropertyStr(ctx, global, "Error");
    if (JS_IsUndefined(error_t))
    {
        JS_FreeValue(ctx, global);
        return "";
    };
    JS_FreeValue(ctx, global);
    JSValue message = JS_NewString(ctx, "");
    JSValue argv[] = {message};
    JSValue error = JS_CallConstructor(ctx, error_t, 1, argv);
    JS_FreeValue(ctx, message);
    JS_FreeValue(ctx, error_t);
    JSValue stack = JS_GetPropertyStr(ctx, error, "stack");
    JS_FreeValue(ctx, error);
    const char* cstr = JS_ToCString(ctx, stack);
    std::string ret = cstr;
    JS_FreeCString(ctx, cstr);
    JS_FreeValue(ctx, stack);
    return ret;
#else
    return StackTraceToString(Isolate, v8::StackTrace::CurrentStackTrace(Isolate, 10, v8::StackTrace::kDetailed));
#endif
}

#if !defined(WITH_QUICKJS)

#define SetNumericStatProperty(name)                                           \
  target                                                                       \
      ->Set(context,                                                           \
            v8::String::NewFromUtf8(isolate, #name).ToLocalChecked(),          \
            v8::Number::New(isolate, static_cast<double>(stat.name())))        \
      .Check();

void GetHeapStatistics(const v8::FunctionCallbackInfo<v8::Value>& info)
{
    v8::Isolate* isolate = info.GetIsolate();
    v8::Local<v8::Context> context = isolate->GetCurrentContext();
    v8::Local<v8::Object> target = v8::Object::New(isolate);
    v8::HeapStatistics stat;
    isolate->GetHeapStatistics(&stat);
    
    SetNumericStatProperty(total_heap_size);
    SetNumericStatProperty(total_heap_size_executable);
    SetNumericStatProperty(total_physical_size);
    SetNumericStatProperty(total_available_size);
    SetNumericStatProperty(total_global_handles_size);
    SetNumericStatProperty(used_global_handles_size);
    SetNumericStatProperty(used_heap_size);
    SetNumericStatProperty(heap_size_limit);
    SetNumericStatProperty(malloced_memory);
    SetNumericStatProperty(external_memory);
    SetNumericStatProperty(peak_malloced_memory);
    SetNumericStatProperty(number_of_native_contexts);
    SetNumericStatProperty(number_of_detached_contexts);
    SetNumericStatProperty(does_zap_garbage);
    
    info.GetReturnValue().Set(target);
}

void GetHeapSpaceStatistics(const v8::FunctionCallbackInfo<v8::Value>& info)
{
    v8::Isolate* isolate = info.GetIsolate();
    v8::Local<v8::Context> context = isolate->GetCurrentContext();
    v8::Local<v8::Object> ret = v8::Object::New(isolate);
    
    for (size_t i = 0; i < isolate->NumberOfHeapSpaces(); i++)
    {
        v8::HeapSpaceStatistics stat;
        isolate->GetHeapSpaceStatistics(&stat, i);
        v8::Local<v8::Object> target = v8::Object::New(isolate);
        
        SetNumericStatProperty(space_size);
        SetNumericStatProperty(space_used_size);
        SetNumericStatProperty(space_available_size);
        SetNumericStatProperty(physical_space_size);
        
        ret->Set(context, v8::String::NewFromUtf8(isolate, stat.space_name()).ToLocalChecked(), target).Check();
    }
    info.GetReturnValue().Set(ret);
}

#undef SetUIntStatProperty

v8::Local<v8::Object> FBackendEnv::GetV8Extras(v8::Isolate* isolate, v8::Local<v8::Context> context)
{
    v8::Local<v8::Object> ret = v8::Object::New(isolate);
    ret->Set(context, v8::String::NewFromUtf8(isolate, "getHeapStatistics").ToLocalChecked(), 
        v8::Function::New(context, GetHeapStatistics).ToLocalChecked()).Check();
    ret->Set(context, v8::String::NewFromUtf8(isolate, "getHeapSpaceStatistics").ToLocalChecked(), 
        v8::Function::New(context, GetHeapSpaceStatistics).ToLocalChecked()).Check();
    return ret;
}
#endif
}

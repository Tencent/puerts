/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#ifndef WITH_QUICKJS

#include "PapiBackendV8.h"
#include "PesapiImpl.h"
#include "PapiV8Bridge.h"
#include "PapiV8ModuleLoader.h"
#include "PapiV8PromiseReject.h"
#include "CppObjectMapper.h"
#include "DataTransfer.h"
#include "PapiEnvScope.h"
#include "PString.h"
#include "V8InspectorImpl.h"
#include <sstream>

#if !defined(WITH_NODEJS) && V8_MAJOR_VERSION < 8
#if PLATFORM_WINDOWS
#include "Blob/Win64/NativesBlob.h"
#elif PLATFORM_ANDROID_ARM
#include "Blob/Android/armv7a/NativesBlob.h"
#elif PLATFORM_ANDROID_ARM64
#include "Blob/Android/arm64/NativesBlob.h"
#elif PLATFORM_MAC
#include "Blob/macOS/NativesBlob.h"
#elif PLATFORM_IOS
#include "Blob/iOS/arm64/NativesBlob.h"
#elif PLATFORM_LINUX
#include "Blob/Linux/NativesBlob.h"
#endif
#endif

namespace PUERTS_NAMESPACE
{
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

FPapiBackendV8::FPapiBackendV8(const FParams& InParams)
    : FPapiBackendJs(InParams.Logger), Params(InParams), CppObjectMapper(std::make_unique<FCppObjectMapper>())
{
    CppObjectMapper->OnClassInvalidated = Params.OnClassInvalidated;
}

FPapiBackendV8::~FPapiBackendV8()
{
    check(!Isolate);
}

int FPapiBackendV8::GetApiVersion()
{
    return PESAPI_VERSION;
}

struct pesapi_ffi* FPapiBackendV8::GetApi()
{
    return &v8impl::g_pesapi_ffi;
}

pesapi_env_ref FPapiBackendV8::CreateEnvRef()
{
    check(!Isolate);
    // a local of the scope of the host, only valid during this call
    v8::Local<v8::Context> ExternalContext = Params.ExternalContext;
    Params.ExternalContext.Clear();

    if (Params.ExternalIsolate)
    {
        Isolate = Params.ExternalIsolate;
        OwnsIsolate = false;
    }
    else
    {
        TArray<FString> FlagArray;
        Params.Flags.ParseIntoArray(FlagArray, TEXT(" "));
        for (auto& Flag : FlagArray)
        {
            static FString Max_Old_Space_Size_Name(TEXT("--max-old-space-size="));
            if (Flag.StartsWith(Max_Old_Space_Size_Name))
            {
                size_t Val = FCString::Atoi(*Flag.Mid(Max_Old_Space_Size_Name.Len()));
                CreateParams.constraints.set_max_old_generation_size_in_bytes(Val * 1024 * 1024);
            }
        }
#if !defined(WITH_NODEJS) && V8_MAJOR_VERSION < 8
        std::unique_ptr<v8::StartupData> NativesBlob = std::make_unique<v8::StartupData>();
        NativesBlob->data = (const char*) NativesBlobCode;
        NativesBlob->raw_size = sizeof(NativesBlobCode);
        v8::V8::SetNativesDataBlob(NativesBlob.get());
#endif
        CreateParams.array_buffer_allocator = v8::ArrayBuffer::Allocator::NewDefaultAllocator();
        Isolate = v8::Isolate::New(CreateParams);
        OwnsIsolate = true;
    }

#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    // the object mapping used by the v8 implementation of pesapi
    Isolate->SetData(MAPPER_ISOLATE_DATA_POS, static_cast<ICppObjectMapper*>(CppObjectMapper.get()));

    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = ExternalContext.IsEmpty() ? v8::Context::New(Isolate) : ExternalContext;
    v8::Context::Scope ContextScope(Context);

    CppObjectMapper->Initialize(Isolate, Context);
    // after the mapper is initialized: the ref tracks the life cycle of the env, which starts there
    MainEnvRef = v8impl::g_pesapi_ffi.create_env_ref(papi_bridge::ToPapi(Context));
    return MainEnvRef;
}

void FPapiBackendV8::DestroyEnvRef(pesapi_env_ref EnvRef)
{
    if (!Isolate)
    {
        return;
    }
    // the inspector references the context
    CloseRemoteDebugger();
    {
#ifdef THREAD_SAFE
        v8::Locker Locker(Isolate);
#endif
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        if (EnvRef)
        {
            v8impl::g_pesapi_ffi.release_env_ref(EnvRef);
        }
        MainEnvRef = nullptr;
        // invalidates the refs of the env
        CppObjectMapper->UnInitialize(Isolate);
        if (Params.OnEnvReleased)
        {
            Params.OnEnvReleased();
        }
    }

    if (OwnsIsolate)
    {
        Isolate->Dispose();
        delete CreateParams.array_buffer_allocator;
        CreateParams.array_buffer_allocator = nullptr;
    }
    Isolate = nullptr;
}

pesapi_value FPapiBackendV8::ExecuteModule(pesapi_env Env, const char* Specifier, const char* Referrer, bool ByImport)
{
    return papi_v8::ExecuteModule(Env, Specifier, Referrer, ByImport);
}

void FPapiBackendV8::RegisterBuiltinModule(pesapi_env Env, const char* Name, pesapi_value Exports)
{
    papi_v8::RegisterBuiltinModule(Env, Name, Exports);
}

void FPapiBackendV8::LowMemoryNotification()
{
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    Isolate->LowMemoryNotification();
}

bool FPapiBackendV8::IdleNotificationDeadline(double DeadlineInSeconds)
{
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    return Isolate->IdleNotificationDeadline(DeadlineInSeconds);
}

void FPapiBackendV8::RequestMinorGarbageCollectionForTesting()
{
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    Isolate->RequestGarbageCollectionForTesting(v8::Isolate::kMinorGarbageCollection);
}

void FPapiBackendV8::RequestFullGarbageCollectionForTesting()
{
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    Isolate->RequestGarbageCollectionForTesting(v8::Isolate::kFullGarbageCollection);
}

void FPapiBackendV8::OpenRemoteDebugger(int32 Port)
{
    if (Inspector)
    {
        return;
    }
    FPapiEnvScope EnvScope(GetApi(), MainEnvRef);
    if (!EnvScope)
    {
        return;
    }
    v8::Local<v8::Context> Context = papi_bridge::ToV8(EnvScope.GetEnv());
    Inspector = CreateV8Inspector(Port, &Context);
}

bool FPapiBackendV8::DebuggerTick()
{
    if (!Inspector)
    {
        return true;
    }
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    return Inspector->Tick();
}

void FPapiBackendV8::CloseRemoteDebugger()
{
    if (!Inspector)
    {
        return;
    }
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    // the session of the channel is connected to the inspector
    delete InspectorChannel;
    InspectorChannel = nullptr;
    delete Inspector;
    Inspector = nullptr;
}

FString FPapiBackendV8::GetStatisticsLog()
{
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::HeapStatistics Statistics;
    Isolate->GetHeapStatistics(&Statistics);

    return FString::Printf(TEXT("------------------------\n"
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
        (uint64) Statistics.total_heap_size(), (uint64) Statistics.total_heap_size_executable(),
        (uint64) Statistics.total_physical_size(), (uint64) Statistics.total_available_size(), (uint64) Statistics.used_heap_size(),
        (uint64) Statistics.heap_size_limit(), (uint64) Statistics.malloced_memory(), (uint64) Statistics.external_memory(),
        (uint64) Statistics.peak_malloced_memory(), (uint64) Statistics.number_of_native_contexts(),
        (uint64) Statistics.number_of_detached_contexts(), (uint64) Statistics.does_zap_garbage());
}

static PString StackTraceToString(v8::Isolate* InIsolate, v8::Local<v8::StackTrace> InStack)
{
    std::ostringstream stm;
    for (int i = 0; i < InStack->GetFrameCount(); i++)
    {
        v8::Local<v8::StackFrame> StackFrame = InStack->GetFrame(InIsolate, i);
        v8::String::Utf8Value FuncName(InIsolate, StackFrame->GetFunctionName());
        v8::String::Utf8Value ScriptName(InIsolate, StackFrame->GetScriptName());
        const int LineNumber = StackFrame->GetLineNumber();
        const int Column = StackFrame->GetColumn();

        if (StackFrame->IsEval())
        {
            if (StackFrame->GetScriptId() == v8::Message::kNoScriptIdInfo)
            {
                stm << "    at [eval]:" << LineNumber << ":" << Column << std::endl;
            }
            else
            {
                stm << "    at [eval] (" << (*ScriptName ? *ScriptName : "anonymous") << ":" << LineNumber << ":" << Column << ")"
                    << std::endl;
            }
            break;
        }

        if (FuncName.length() == 0)
        {
            stm << "    at " << (*ScriptName ? *ScriptName : "anonymous") << ":" << LineNumber << ":" << Column << std::endl;
        }
        else
        {
            stm << "    at " << *FuncName << "(" << (*ScriptName ? *ScriptName : "anonymous") << ":" << LineNumber << ":" << Column
                << ")" << std::endl;
        }
    }
    return stm.str().c_str();
}

FString FPapiBackendV8::CurrentStackTrace()
{
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);

    PString StackTrace = StackTraceToString(Isolate, v8::StackTrace::CurrentStackTrace(Isolate, 10, v8::StackTrace::kDetailed));
    return UTF8_TO_TCHAR(StackTrace.c_str());
}

void FPapiBackendV8::SetInspectorCallback(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    auto Self = static_cast<FPapiBackendV8*>(Apis->get_userdata(Info));
    pesapi_env Env = Apis->get_env(Info);
    if (!Self->Inspector)
    {
        return;
    }
    if (Apis->get_args_len(Info) < 1 || !Apis->is_function(Env, Apis->get_arg(Info, 0)))
    {
        Apis->throw_by_string(Info, "Bad parameters #0, expect a function.");
        return;
    }

    if (!Self->InspectorChannel)
    {
        Self->InspectorChannel = Self->Inspector->CreateV8InspectorChannel();
        Self->InspectorChannel->OnMessage([Self](const std::string& Message) { Self->OnInspectorMessage(Message); });
    }

    Self->InspectorMessageHandler.Reset(Apis, Env, Apis->get_arg(Info, 0));
}

void FPapiBackendV8::DispatchProtocolMessage(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    auto Self = static_cast<FPapiBackendV8*>(Apis->get_userdata(Info));
    pesapi_env Env = Apis->get_env(Info);
    if (Apis->get_args_len(Info) < 1 || !Apis->is_string(Env, Apis->get_arg(Info, 0)))
    {
        Apis->throw_by_string(Info, "Bad parameters #0, expect a string.");
        return;
    }

    if (Self->InspectorChannel)
    {
        pesapi_value Arg = Apis->get_arg(Info, 0);
        size_t Len = 0;
        Apis->get_value_string_utf8(Env, Arg, nullptr, &Len);
        std::string Message(Len, '\0');
        if (Len > 0)
        {
            Apis->get_value_string_utf8(Env, Arg, &Message[0], &Len);
        }
        Self->InspectorChannel->DispatchProtocolMessage(Message);
    }
}

// a message of the in-process session: a response (inside DispatchProtocolMessage) or a notification (any time the inspector
// is running), passed to the handler set by __tgjsSetInspectorCallback
void FPapiBackendV8::OnInspectorMessage(const std::string& Message)
{
    struct pesapi_ffi* Apis = GetApi();
    FPapiEnvScope EnvScope(Apis, MainEnvRef);
    if (!EnvScope)
    {
        return;
    }
    pesapi_env Env = EnvScope.GetEnv();
    pesapi_value Handler = InspectorMessageHandler.Get(Env);
    if (!Handler)
    {
        return;
    }
    pesapi_value Args[] = {Apis->create_string_utf8(Env, Message.c_str(), Message.size())};
    Apis->call_function(Env, Handler, Apis->global(Env), 1, Args);
    if (EnvScope.HasCaught())
    {
        Logger->Error(FString::Printf(TEXT("inspector callback exception %s"), UTF8_TO_TCHAR(EnvScope.GetExceptionAsString())));
    }
}

void FPapiBackendV8::StartRuntime(pesapi_env Env)
{
    ModuleLoader = papi_v8::CreateModuleLoader(Env);
    PromiseRejectTracker = papi_v8::CreatePromiseRejectTracker(Env, &OnPromiseRejectHandlerError, Logger.get());

    // taken (and removed from the global) by puerts/hot_reload.js
    struct pesapi_ffi* Apis = GetApi();
    pesapi_value Global = Apis->global(Env);
    Apis->set_property(Env, Global, "__tgjsSetInspectorCallback", Apis->create_function(Env, &SetInspectorCallback, this, nullptr));
    Apis->set_property(
        Env, Global, "__tgjsDispatchProtocolMessage", Apis->create_function(Env, &DispatchProtocolMessage, this, nullptr));

#if defined(WITH_V8_BYTECODE)
    // the header fields of the bytecode the running v8 accepts, taken from the code cache of an empty script
    v8::Local<v8::Context> Context = papi_bridge::ToV8(Env);
    auto Script = v8::Script::Compile(Context, v8::String::NewFromUtf8(Isolate, "").ToLocalChecked()).ToLocalChecked();
    auto CachedCode = v8::ScriptCompiler::CreateCodeCache(Script->GetUnboundScript());
    const FCodeCacheHeader* CodeCacheHeader = (const FCodeCacheHeader*) CachedCode->data;
    papi_v8::SetCodeCacheExpect(Env, CodeCacheHeader->FlagHash,
#if V8_MAJOR_VERSION >= 11
        CodeCacheHeader->ReadOnlySnapshotChecksum
#else
        0
#endif
    );
#if !WITH_EDITOR
    delete CachedCode;    //编辑器下是v8.dll分配的，ue里的delete被重载了，这delete会有问题
#endif
#endif
}

void FPapiBackendV8::StopRuntime()
{
    InspectorMessageHandler.Reset();
    papi_v8::DestroyPromiseRejectTracker(PromiseRejectTracker);
    PromiseRejectTracker = nullptr;
    papi_v8::DestroyModuleLoader(ModuleLoader);
    ModuleLoader = nullptr;
}

pesapi_value FPapiBackendV8::CreateRequire(pesapi_env Env, const char* Referrer)
{
    return papi_v8::CreateRequire(Env, Referrer);
}

bool FPapiBackendV8::ForceReload(pesapi_env Env, const char* Url)
{
    return papi_v8::ForceReload(Env, Url);
}

pesapi_value FPapiBackendV8::GetModuleByUrl(pesapi_env Env, const char* Url)
{
    return papi_v8::GetModuleByUrl(Env, Url);
}

void FPapiBackendV8::SetPromiseRejectHandler(pesapi_env Env, pesapi_value Handler)
{
    papi_v8::SetPromiseRejectHandler(Env, Handler);
}

void FPapiBackendV8::OnPromiseRejectHandlerError(void* UserData, const char* Error)
{
    static_cast<ILogger*>(UserData)->Error(FString::Printf(TEXT("promise reject handler exception %s"), UTF8_TO_TCHAR(Error)));
}
}    // namespace PUERTS_NAMESPACE

#endif

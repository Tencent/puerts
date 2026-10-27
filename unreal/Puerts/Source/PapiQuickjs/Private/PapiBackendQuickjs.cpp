/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "PapiBackendQuickjs.h"
#include "PesapiQuickjsImpl.h"
#include "PapiQjsModuleLoader.h"
#include "PapiQjsPromiseReject.h"
#include "QjsObjectMapper.h"
#include "quickjs.h"

namespace PUERTS_NAMESPACE
{
FPapiBackendQuickjs::FPapiBackendQuickjs(const FPapiBackendParams& InParams)
    : FPapiBackendJs(InParams.Logger), Params(InParams), CppObjectMapper(std::make_unique<qjsimpl::FCppObjectMapper>())
{
    CppObjectMapper->OnClassInvalidated = Params.OnClassInvalidated;
    CppObjectMapper->OnClassCreated = Params.OnClassCreated;
}

FPapiBackendQuickjs::~FPapiBackendQuickjs()
{
    check(!Runtime);
}

std::unique_ptr<IPapiBackend> FPapiBackendQuickjs::Create(const FPapiBackendParams& InParams)
{
    return std::make_unique<FPapiBackendQuickjs>(InParams);
}

int FPapiBackendQuickjs::GetApiVersion()
{
    return PESAPI_VERSION;
}

struct pesapi_ffi* FPapiBackendQuickjs::GetApi()
{
    return &qjsimpl::g_pesapi_ffi;
}

pesapi_env_ref FPapiBackendQuickjs::CreateEnvRef()
{
    check(!Runtime);
    Runtime = JS_NewRuntime();
    TArray<FString> FlagArray;
    Params.Flags.ParseIntoArray(FlagArray, TEXT(" "));
    for (auto& Flag : FlagArray)
    {
        static FString Max_Old_Space_Size_Name(TEXT("--max-old-space-size="));
        if (Flag.StartsWith(Max_Old_Space_Size_Name))
        {
            size_t Val = FCString::Atoi(*Flag.Mid(Max_Old_Space_Size_Name.Len()));
            JS_SetMemoryLimit(Runtime, Val * 1024 * 1024);
        }
    }
    Context = JS_NewContext(Runtime);

    // the object mapping used by the quickjs implementation of pesapi (the runtime opaque)
    CppObjectMapper->Initialize(Context);
    // after the mapper is initialized: the ref tracks the life cycle of the env, which starts there
    MainEnvRef = qjsimpl::g_pesapi_ffi.create_env_ref(reinterpret_cast<pesapi_env>(Context));
    return MainEnvRef;
}

void FPapiBackendQuickjs::DestroyEnvRef(pesapi_env_ref EnvRef)
{
    if (!Runtime)
    {
        return;
    }
    if (EnvRef)
    {
        qjsimpl::g_pesapi_ffi.release_env_ref(EnvRef);
    }
    MainEnvRef = nullptr;
    // invalidates the refs of the env
    CppObjectMapper->UnInitialize();
    if (Params.OnEnvReleased)
    {
        Params.OnEnvReleased();
    }
    JS_FreeContext(Context);
    Context = nullptr;
    JS_FreeRuntime(Runtime);
    Runtime = nullptr;
}

pesapi_value FPapiBackendQuickjs::ExecuteModule(pesapi_env Env, const char* Specifier, const char* Referrer, bool ByImport)
{
    return papi_qjs::ExecuteModule(Env, Specifier, Referrer, ByImport);
}

void FPapiBackendQuickjs::RegisterBuiltinModule(pesapi_env Env, const char* Name, pesapi_value Exports)
{
    papi_qjs::RegisterBuiltinModule(Env, Name, Exports);
}

void FPapiBackendQuickjs::LowMemoryNotification()
{
    JS_RunGC(Runtime);
}

bool FPapiBackendQuickjs::IdleNotificationDeadline(double DeadlineInSeconds)
{
    JS_RunGC(Runtime);
    return true;
}

void FPapiBackendQuickjs::RequestMinorGarbageCollectionForTesting()
{
    JS_RunGC(Runtime);
}

void FPapiBackendQuickjs::RequestFullGarbageCollectionForTesting()
{
    JS_RunGC(Runtime);
}

FString FPapiBackendQuickjs::GetStatisticsLog()
{
    JSMemoryUsage Usage;
    JS_ComputeMemoryUsage(Runtime, &Usage);
    return FString::Printf(TEXT("------------------------\n"
                                "Dump Statistics of QuickJS:\n"
                                "malloc_size: %lld\n"
                                "malloc_limit: %lld\n"
                                "memory_used_size: %lld\n"
                                "malloc_count: %lld\n"
                                "memory_used_count: %lld\n"
                                "atom_count: %lld\n"
                                "str_count: %lld\n"
                                "obj_count: %lld\n"
                                "prop_count: %lld\n"
                                "shape_count: %lld\n"
                                "js_func_count: %lld\n"
                                "c_func_count: %lld\n"
                                "array_count: %lld\n"
                                "------------------------\n"),
        (int64) Usage.malloc_size, (int64) Usage.malloc_limit, (int64) Usage.memory_used_size, (int64) Usage.malloc_count,
        (int64) Usage.memory_used_count, (int64) Usage.atom_count, (int64) Usage.str_count, (int64) Usage.obj_count,
        (int64) Usage.prop_count, (int64) Usage.shape_count, (int64) Usage.js_func_count, (int64) Usage.c_func_count,
        (int64) Usage.array_count);
}

FString FPapiBackendQuickjs::CurrentStackTrace()
{
    if (!Context)
    {
        return FString();
    }
    // keeps an exception being thrown
    JSValue Pending = JS_UNINITIALIZED;
    const bool HadPending = JS_HasException(Context) != 0;
    if (HadPending)
    {
        Pending = JS_GetException(Context);
    }
    static const char Code[] = "new Error().stack";
    JSValue Stack = JS_Eval(Context, Code, sizeof(Code) - 1, "<stack>", JS_EVAL_TYPE_GLOBAL);
    FString Ret;
    if (JS_IsException(Stack))
    {
        JS_FreeValue(Context, JS_GetException(Context));
    }
    else if (const char* Str = JS_ToCString(Context, Stack))
    {
        Ret = UTF8_TO_TCHAR(Str);
        JS_FreeCString(Context, Str);
    }
    JS_FreeValue(Context, Stack);
    if (HadPending)
    {
        JS_Throw(Context, Pending);
    }
    return Ret;
}

ScriptClassRegistry* FPapiBackendQuickjs::GetRegistry()
{
    return CppObjectMapper->GetRegistry();
}

void FPapiBackendQuickjs::StartRuntime(pesapi_env Env)
{
    ModuleLoader = papi_qjs::CreateModuleLoader(Env);
    PromiseRejectTracker = papi_qjs::CreatePromiseRejectTracker(Env, &OnPromiseRejectHandlerError, Logger.get());
}

void FPapiBackendQuickjs::StopRuntime()
{
    papi_qjs::DestroyPromiseRejectTracker(PromiseRejectTracker);
    PromiseRejectTracker = nullptr;
    papi_qjs::DestroyModuleLoader(ModuleLoader);
    ModuleLoader = nullptr;
}

pesapi_value FPapiBackendQuickjs::CreateRequire(pesapi_env Env, const char* Referrer)
{
    return papi_qjs::CreateRequire(Env, Referrer);
}

bool FPapiBackendQuickjs::ForceReload(pesapi_env Env, const char* Url)
{
    return papi_qjs::ForceReload(Env, Url);
}

pesapi_value FPapiBackendQuickjs::GetModuleByUrl(pesapi_env Env, const char* Url)
{
    return papi_qjs::GetModuleByUrl(Env, Url);
}

void FPapiBackendQuickjs::SetPromiseRejectHandler(pesapi_env Env, pesapi_value Handler)
{
    papi_qjs::SetPromiseRejectHandler(Env, Handler);
}

void FPapiBackendQuickjs::OnPromiseRejectHandlerError(void* UserData, const char* Error)
{
    static_cast<ILogger*>(UserData)->Error(FString::Printf(TEXT("promise reject handler exception %s"), UTF8_TO_TCHAR(Error)));
}
}    // namespace PUERTS_NAMESPACE

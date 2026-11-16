/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "PapiV8Module.h"
#include "ScriptEnvModule.h"
#include "NamespaceDef.h"
PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS
#if defined(WITH_NODEJS)
MSVC_PRAGMA(warning(push, 0))
#include "node.h"
#include "uv.h"
MSVC_PRAGMA(warning(pop))
#endif
MSVC_PRAGMA(warning(push, 0))
#include "v8.h"
#include "libplatform/libplatform.h"
MSVC_PRAGMA(warning(pop))
PRAGMA_ENABLE_UNDEFINED_IDENTIFIER_WARNINGS
#include "JSClassRegister.h"
#include "PesapiImpl.h"

class FPapiV8Module : public IPapiV8Module
{
    /** IModuleInterface implementation */
    void StartupModule() override;
    void ShutdownModule() override;

public:
    void* GetV8Platform() override;

private:
#if defined(V8_HAS_WRAP_API_WITHOUT_STL)
    v8::Platform* platform_;
#else
    std::unique_ptr<v8::Platform> platform_;
#endif
};

IMPLEMENT_MODULE(FPapiV8Module, PapiV8)

void FPapiV8Module::StartupModule()
{
#if defined(WITH_NODEJS)
    platform_ = node::MultiIsolatePlatform::Create(4);
#else
#if defined(V8_HAS_WRAP_API_WITHOUT_STL)
#if defined(USING_SINGLE_THREAD_PLATFORM)
    platform_ = v8::platform::NewSingleThreadedDefaultPlatform_Without_Stl();
#else
    platform_ = v8::platform::NewDefaultPlatform_Without_Stl();
#endif
#else
#if defined(USING_SINGLE_THREAD_PLATFORM)
    platform_ = v8::platform::NewSingleThreadedDefaultPlatform();
#else
    platform_ = v8::platform::NewDefaultPlatform();
#endif
#endif
#endif

#if PLATFORM_IOS
    v8::V8::SetFlagsFromString("--jitless --no-expose-wasm");
#endif

#ifdef WITH_V8_FAST_CALL
    v8::V8::SetFlagsFromString("--turbo-fast-api-calls");
#endif

#if defined(USING_SINGLE_THREAD_PLATFORM)
    v8::V8::SetFlagsFromString("--single-threaded");
#endif

#if defined(WITH_V8_BYTECODE)
    v8::V8::SetFlagsFromString("--no-lazy --no-flush-bytecode --no-enable-lazy-source-positions");
#endif

    // v8::V8::SetFlagsFromString("--expose-gc");
    // v8::V8::SetFlagsFromString("--no-freeze-flags-after-init");

#if defined(V8_HAS_WRAP_API_WITHOUT_STL)
    v8::V8::InitializePlatform(platform_);
#else
    v8::V8::InitializePlatform(platform_.get());
#endif
    v8::V8::Initialize();

    PUERTS_NAMESPACE::SetPesapiFFI(&v8impl::g_pesapi_ffi);

#if defined(WITH_NODEJS)
    int Argc = 1;
    char* ArgvIn[1];
    ArgvIn[0] = const_cast<char*>("puerts");
    char** Argv = uv_setup_args(Argc, ArgvIn);
    std::vector<std::string> Args(Argv, Argv + Argc);
    std::vector<std::string> ExecArgs;
    std::vector<std::string> Errors;
    int ExitCode = node::InitializeNodeWithArgs(&Args, &ExecArgs, &Errors);
    for (const std::string& error : Errors)
    {
        UE_LOG(LogTemp, Error, TEXT("Initialize Node:  %s"), UTF8_TO_TCHAR(error.c_str()));
    }
#endif
}

void FPapiV8Module::ShutdownModule()
{
    // the cached struct wrappers must go while the ffi and v8 are still alive, the ScriptEnv module shuts down after this one
    if (IScriptEnvModule* ScriptEnvModule = FModuleManager::GetModulePtr<IScriptEnvModule>("ScriptEnv"))
    {
        ScriptEnvModule->ReleaseGlobalCaches();
    }
    PUERTS_NAMESPACE::SetPesapiFFI(nullptr);
    v8::V8::Dispose();
#if V8_MAJOR_VERSION > 9
    v8::V8::DisposePlatform();
#else
    v8::V8::ShutdownPlatform();
#endif

#if defined(V8_HAS_WRAP_API_WITHOUT_STL)
    v8::platform::DeletePlatform_Without_Stl(platform_);
#endif
}

void* FPapiV8Module::GetV8Platform()
{
#if defined(V8_HAS_WRAP_API_WITHOUT_STL)
    return reinterpret_cast<void*>(platform_);
#else
    return reinterpret_cast<void*>(platform_.get());
#endif
}

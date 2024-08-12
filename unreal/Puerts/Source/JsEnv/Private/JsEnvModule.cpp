/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "JsEnvModule.h"
//#include "TGameJSCorePCH.h"
#include "HAL/MemoryBase.h"
#include "NamespaceDef.h"
PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS
#if defined(WITH_NODEJS)
#pragma warning(push, 0)
#include "node.h"
#include "uv.h"
#pragma warning(pop)
#endif
#pragma warning(push, 0)
#include "v8.h"
#include "libplatform/libplatform.h"
#pragma warning(pop)
PRAGMA_ENABLE_UNDEFINED_IDENTIFIER_WARNINGS

class FMallocWrapper final : public FMalloc
{
public:
    FMalloc* InnerMalloc;

public:
    FMallocWrapper(FMalloc* InMalloc)
    {
        InnerMalloc = InMalloc;
    }

    virtual void* Malloc(SIZE_T Size, uint32 Alignment) override
    {
        if (UNLIKELY(Size == 0))
        {
            Size = 1;
        }
        return InnerMalloc->Malloc(Size, Alignment);
    }

#if ENGINE_MINOR_VERSION >= 25 || ENGINE_MAJOR_VERSION > 4
    virtual void* TryMalloc(SIZE_T Size, uint32 Alignment) override
    {
        if (UNLIKELY(Size == 0))
        {
            Size = 1;
        }
        return InnerMalloc->TryMalloc(Size, Alignment);
    }
#endif

    virtual void* Realloc(void* Ptr, SIZE_T NewSize, uint32 Alignment) override
    {
        return InnerMalloc->Realloc(Ptr, NewSize, Alignment);
    }

#if ENGINE_MINOR_VERSION >= 25 || ENGINE_MAJOR_VERSION > 4
    virtual void* TryRealloc(void* Ptr, SIZE_T NewSize, uint32 Alignment) override
    {
        return InnerMalloc->TryRealloc(Ptr, NewSize, Alignment);
    }
#endif

    virtual void Free(void* Ptr) override
    {
        return InnerMalloc->Free(Ptr);
    }

    virtual bool GetAllocationSize(void* Original, SIZE_T& SizeOut) override
    {
        return InnerMalloc->GetAllocationSize(Original, SizeOut);
    }

    virtual bool IsInternallyThreadSafe() const override
    {
        return InnerMalloc->IsInternallyThreadSafe();
    }

    virtual bool ValidateHeap() override
    {
        return InnerMalloc->ValidateHeap();
    }

    virtual const TCHAR* GetDescriptiveName() override
    {
        return InnerMalloc->GetDescriptiveName();
    }

    virtual SIZE_T QuantizeSize(SIZE_T Count, uint32 Alignment) override
    {
        return InnerMalloc->QuantizeSize(Count, Alignment);
    }

#if ENGINE_MINOR_VERSION > 21 || ENGINE_MAJOR_VERSION > 4
    virtual void Trim(bool bTrimThreadCaches) override
    {
        InnerMalloc->Trim(bTrimThreadCaches);
    }
#else
    virtual void Trim() override
    {
        InnerMalloc->Trim();
    }
#endif

    virtual void SetupTLSCachesOnCurrentThread() override
    {
        InnerMalloc->SetupTLSCachesOnCurrentThread();
    }

    virtual void ClearAndDisableTLSCachesOnCurrentThread() override
    {
        InnerMalloc->ClearAndDisableTLSCachesOnCurrentThread();
    }

    virtual void InitializeStatsMetadata() override
    {
        InnerMalloc->InitializeStatsMetadata();
    }

    virtual bool Exec(UWorld* InWorld, const TCHAR* Cmd, FOutputDevice& Ar) override
    {
        return InnerMalloc->Exec(InWorld, Cmd, Ar);
    }

    virtual void UpdateStats() override
    {
        InnerMalloc->UpdateStats();
    }

    virtual void GetAllocatorStats(FGenericMemoryStats& out_Stats) override
    {
        InnerMalloc->GetAllocatorStats(out_Stats);
    }

    virtual void DumpAllocatorStats(class FOutputDevice& Ar) override
    {
        InnerMalloc->DumpAllocatorStats(Ar);
    }
};

DEFINE_LOG_CATEGORY_STATIC(JsEnvModule, Log, All);

class FJsEnvModule : public IJsEnvModule
{
    /** IModuleInterface implementation */
    void StartupModule() override;
    void ShutdownModule() override;

    FMallocWrapper* MallocWrapper = nullptr;

public:
    void* GetV8Platform() override;

private:
#if defined(V8_HAS_WRAP_API_WITHOUT_STL)
    v8::Platform* platform_;
#else
    std::unique_ptr<v8::Platform> platform_;
#endif
};

IMPLEMENT_MODULE(FJsEnvModule, JsEnv)

void FJsEnvModule::StartupModule()
{
    int* Dummy = new (std::nothrow) int[0];
    if (!Dummy)
    {
        UE_LOG(JsEnvModule, Warning, TEXT("new (std::nothrow) int[0] return nullptr, try fix it!"));
        MallocWrapper = new FMallocWrapper(GMalloc);
        GMalloc = MallocWrapper;
    }
    delete[] Dummy;

    // This code will execute after your module is loaded into memory (but after global variables are initialized, of course.)
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

void FJsEnvModule::ShutdownModule()
{
    // This function may be called during shutdown to clean up your module.  For modules that support dynamic reloading,
    // we call this function before unloading the module.
    v8::V8::Dispose();
#if V8_MAJOR_VERSION > 9
    v8::V8::DisposePlatform();
#else
    v8::V8::ShutdownPlatform();
#endif

#if defined(V8_HAS_WRAP_API_WITHOUT_STL)
    v8::platform::DeletePlatform_Without_Stl(platform_);
#endif

    if (MallocWrapper && MallocWrapper == GMalloc)
    {
        GMalloc = MallocWrapper->InnerMalloc;
        delete MallocWrapper;
        MallocWrapper = nullptr;
        UE_LOG(JsEnvModule, Warning, TEXT("GMalloc restored!"));
    }
}

void* FJsEnvModule::GetV8Platform()
{
#if defined(V8_HAS_WRAP_API_WITHOUT_STL)
    return reinterpret_cast<void*>(platform_);
#else
    return reinterpret_cast<void*>(platform_.get());
#endif
}

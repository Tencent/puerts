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
#if defined(WITH_NODEJS)
#pragma warning(push, 0)
#include "node.h"
#include "uv.h"
#pragma warning(pop)
#endif

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

#if PLATFORM_ANDROID || PLATFORM_WINDOWS || PLATFORM_IOS || PLATFORM_MAC || PLATFORM_LINUX
#pragma warning(push, 0)
#include "v8.h"
#include "libplatform/libplatform.h"
#pragma warning(pop)
#endif

DEFINE_LOG_CATEGORY_STATIC(JsEnvModule, Log, All);

class FJsEnvModule : public IJsEnvModule
{
    /** IModuleInterface implementation */
    void StartupModule() override;
    void ShutdownModule() override;

    FMallocWrapper* MallocWrapper = nullptr;

#if PLATFORM_ANDROID || PLATFORM_WINDOWS || PLATFORM_IOS || PLATFORM_MAC || PLATFORM_LINUX
public:
    void* GetV8Platform() override;

private:
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
#if PLATFORM_ANDROID || PLATFORM_WINDOWS || PLATFORM_IOS || PLATFORM_MAC || PLATFORM_LINUX
#if defined(WITH_NODEJS)
    platform_ = node::MultiIsolatePlatform::Create(4);
#else
    platform_ = v8::platform::NewDefaultPlatform();
#endif
    v8::V8::InitializePlatform(platform_.get());
    v8::V8::Initialize();
#endif

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
#if PLATFORM_ANDROID || PLATFORM_WINDOWS || PLATFORM_IOS || PLATFORM_MAC || PLATFORM_LINUX
    v8::V8::Dispose();
    v8::V8::ShutdownPlatform();
#endif

    if (MallocWrapper && MallocWrapper == GMalloc)
    {
        GMalloc = MallocWrapper->InnerMalloc;
        delete MallocWrapper;
        MallocWrapper = nullptr;
        UE_LOG(JsEnvModule, Warning, TEXT("GMalloc restored!"));
    }
}

#if PLATFORM_ANDROID || PLATFORM_WINDOWS || PLATFORM_IOS || PLATFORM_MAC || PLATFORM_LINUX
void* FJsEnvModule::GetV8Platform()
{
    return reinterpret_cast<void*>(platform_.get());
}
#endif

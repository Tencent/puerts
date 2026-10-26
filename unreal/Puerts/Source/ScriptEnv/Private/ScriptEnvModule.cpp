/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "ScriptEnvModule.h"
#include "HAL/MemoryBase.h"
#include "UObject/CoreRedirects.h"
#include "NamespaceDef.h"
#include "StructWrapper.h"

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

DEFINE_LOG_CATEGORY_STATIC(ScriptEnvModule, Log, All);

class FScriptEnvModule : public IScriptEnvModule
{
    /** IModuleInterface implementation */
    void StartupModule() override;
    void ShutdownModule() override;

    FMallocWrapper* MallocWrapper = nullptr;

public:
    void ReleaseGlobalCaches() override;
};

IMPLEMENT_MODULE(FScriptEnvModule, ScriptEnv)

void FScriptEnvModule::StartupModule()
{
    int* Dummy = new (std::nothrow) int[0];
    if (!Dummy)
    {
#if ENGINE_MAJOR_VERSION >= 5 && ENGINE_MINOR_VERSION > 5
        UE_LOG(ScriptEnvModule, Error, TEXT("new (std::nothrow) int[0] return nullptr, try fix it!"));
#else
        UE_LOG(ScriptEnvModule, Warning, TEXT("new (std::nothrow) int[0] return nullptr, try fix it!"));
        MallocWrapper = new FMallocWrapper(GMalloc);
        GMalloc = MallocWrapper;
#endif
    }
    delete[] Dummy;

    // the reflected types used to live in the JsEnv module, keep assets and blueprints referencing them loadable
    TArray<FCoreRedirect> Redirects;
    Redirects.Emplace(ECoreRedirectFlags::Type_Package, TEXT("/Script/JsEnv"), TEXT("/Script/ScriptEnv"));
    FCoreRedirects::AddRedirectList(Redirects, TEXT("ScriptEnv"));
}

void FScriptEnvModule::ShutdownModule()
{
    ReleaseGlobalCaches();

#if ENGINE_MAJOR_VERSION < 5 || ENGINE_MINOR_VERSION <= 5
    if (MallocWrapper && MallocWrapper == GMalloc)
    {
        GMalloc = MallocWrapper->InnerMalloc;
        delete MallocWrapper;
        MallocWrapper = nullptr;
        UE_LOG(ScriptEnvModule, Warning, TEXT("GMalloc restored!"));
    }
#endif
}

void FScriptEnvModule::ReleaseGlobalCaches()
{
    PUERTS_NAMESPACE::FStructWrapper::ReleaseAll();
}

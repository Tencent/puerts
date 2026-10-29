/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "pesapi.h"
#include "CoreMinimal.h"
#include "Misc/Paths.h"
#include "PapiUtils.h"
#include "PString.h"
#include "PesapiRegistryImpl.h"

#include <map>
#include <string>

typedef void (*PesapiAddonRegisterFunc)(struct pesapi_registry_api* registry_api, pesapi_registry registry);

static std::map<puerts::PString, puerts::PString> LoadedPesapiModules;

#if PLATFORM_IOS
int PesapiLoadFramework(
    const char* frameworkName, const char* entryName, struct pesapi_registry_api* registryApi, pesapi_registry registry);
#endif

// entry name of an addon: pesapi_register_<module_name>_v<PESAPI_VERSION>
static FString PesapiAddonEntryName(const FString& ModuleName)
{
    return FString::Printf(TEXT("pesapi_register_%s_v%d"), *ModuleName, PESAPI_VERSION);
}

static void PesapiCallAddonRegister(PesapiAddonRegisterFunc Init, const FString& ModuleName)
{
    FTCHARToUTF8 ModuleNameUtf8(*ModuleName);
    pesapi::regimpl::GPesapiModuleName = ModuleNameUtf8.Get();
    Init(&pesapi::regimpl::g_reg_apis, pesapi::regimpl::GetDefaultRegistry());
    pesapi::regimpl::GPesapiModuleName = nullptr;
}

// try to find the addon entry, return module name used if found
static PesapiAddonRegisterFunc PesapiFindAddonEntry(void* DllHandle, const FString& PreferModuleName, FString& OutModuleName)
{
    TArray<FString> Candidates;
    Candidates.Add(PreferModuleName);
    if (PreferModuleName.StartsWith(TEXT("lib")))
    {
        Candidates.Add(PreferModuleName.RightChop(3));
    }
    for (const FString& Candidate : Candidates)
    {
        if (Candidate.IsEmpty())
        {
            continue;
        }
        auto Init =
            (PesapiAddonRegisterFunc) (uintptr_t) FPlatformProcess::GetDllExport(DllHandle, *PesapiAddonEntryName(Candidate));
        if (Init)
        {
            OutModuleName = Candidate;
            return Init;
        }
    }
    return nullptr;
}

static bool PesapiIsLegacyAddon(void* DllHandle)
{
    return FPlatformProcess::GetDllExport(DllHandle, TEXT("pesapi_register_dynamic_v11")) != nullptr ||
           FPlatformProcess::GetDllExport(DllHandle, TEXT("pesapi_register_version_v0")) != nullptr;
}

static FString PesapiModuleNameFromPath(const FString& Path)
{
    return FPaths::GetBaseFilename(Path);
}

namespace puerts
{
void LoadPesapiDll(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    pesapi_value PathArg = Apis->get_arg(Info, 0);
    if (!Apis->is_string(Env, PathArg))
    {
        Apis->throw_by_string(Info, "#0 argument expect a string");
        return;
    }
    FString Path = PapiUtils::ToFString(Apis, Env, PathArg);

    auto Iter = LoadedPesapiModules.find(TCHAR_TO_UTF8(*Path));
    if (Iter != LoadedPesapiModules.end())
    {
        Apis->add_return(Info, Apis->create_string_utf8(Env, Iter->second.c_str(), Iter->second.size()));
        return;
    }

    FString PreferModuleName;
    if (Apis->get_args_len(Info) > 1 && Apis->is_string(Env, Apis->get_arg(Info, 1)))
    {
        PreferModuleName = PapiUtils::ToFString(Apis, Env, Apis->get_arg(Info, 1));
    }
    if (PreferModuleName.IsEmpty())
    {
        PreferModuleName = PesapiModuleNameFromPath(Path);
    }

    void* DllHandle = FPlatformProcess::GetDllHandle(*Path);
    if (!DllHandle)
    {
        Apis->throw_by_string(Info, TCHAR_TO_UTF8(*(FString(TEXT("dlopen fail for ")) + Path)));
        return;
    }

    FString ModuleName;
    auto Init = PesapiFindAddonEntry(DllHandle, PreferModuleName, ModuleName);

    if (Init)
    {
        PesapiCallAddonRegister(Init, ModuleName);
        LoadedPesapiModules[TCHAR_TO_UTF8(*Path)] = TCHAR_TO_UTF8(*ModuleName);
        Apis->add_return(Info, PapiUtils::FromFString(Apis, Env, ModuleName));
    }
    else
    {
        if (PesapiIsLegacyAddon(DllHandle))
        {
            Apis->throw_by_string(
                Info, TCHAR_TO_UTF8(*FString::Printf(
                          TEXT("addon %s is built with legacy pesapi abi, please rebuild it with current pesapi.h"), *Path)));
        }
        else
        {
            Apis->throw_by_string(Info, TCHAR_TO_UTF8(*FString::Printf(
                                            TEXT("can not find entry %s in %s"), *PesapiAddonEntryName(PreferModuleName), *Path)));
        }
        FPlatformProcess::FreeDllHandle(DllHandle);
    }
}
}    // namespace puerts

static int PesapiLoadAddonImpl(const char* path, const char* module_name)
{
    if (!path)
    {
        return -1;
    }
    if (LoadedPesapiModules.find(path) != LoadedPesapiModules.end())
    {
        // UE_LOG(LogTemp, Warning, TEXT("Try load addon already loaded: %s"), UTF8_TO_TCHAR(path));
        return 0;
    }
    FString PreferModuleName = (module_name && module_name[0] != '\0') ? FString(UTF8_TO_TCHAR(module_name))
                                                                       : PesapiModuleNameFromPath(UTF8_TO_TCHAR(path));
#if !PLATFORM_IOS
    void* Handle = FPlatformProcess::GetDllHandle(UTF8_TO_TCHAR(path));
    if (Handle)
    {
        FString ModuleName;
        auto Init = PesapiFindAddonEntry(Handle, PreferModuleName, ModuleName);
        if (Init)
        {
            PesapiCallAddonRegister(Init, ModuleName);
            LoadedPesapiModules[path] = TCHAR_TO_UTF8(*ModuleName);
            return 0;
        }
        else if (PesapiIsLegacyAddon(Handle))
        {
            UE_LOG(LogTemp, Error, TEXT("addon %s is built with legacy pesapi abi, please rebuild it with current pesapi.h"),
                UTF8_TO_TCHAR(path));
        }
        else
        {
            UE_LOG(LogTemp, Error, TEXT("Could not find entry %s for: %s"), *PesapiAddonEntryName(PreferModuleName),
                UTF8_TO_TCHAR(path));
        }
    }
    else
    {
        UE_LOG(LogTemp, Error, TEXT("Could not load addon: %s"), UTF8_TO_TCHAR(path));
    }
    return -1;
#else
    FString EntryName = PesapiAddonEntryName(PreferModuleName);
    FTCHARToUTF8 ModuleNameUtf8(*PreferModuleName);
    pesapi::regimpl::GPesapiModuleName = ModuleNameUtf8.Get();
    int Ret = PesapiLoadFramework(
        ModuleNameUtf8.Get(), TCHAR_TO_UTF8(*EntryName), &pesapi::regimpl::g_reg_apis, pesapi::regimpl::GetDefaultRegistry());
    pesapi::regimpl::GPesapiModuleName = nullptr;
    if (Ret == 0)
    {
        LoadedPesapiModules[path] = ModuleNameUtf8.Get();
    }
    return Ret;
#endif
}

EXTERN_C_START
int pesapi_load_addon(const char* path, const char* module_name)
{
    return PesapiLoadAddonImpl(path, module_name);
}
EXTERN_C_END

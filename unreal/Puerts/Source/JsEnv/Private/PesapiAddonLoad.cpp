/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#ifndef WITH_QUICKJS

#include "pesapi.h"
#include "CoreMinimal.h"
#include "V8Utils.h"

#include <map>
#include <string>
#include <sstream>

#define STRINGIFY_(x) #x
#define STRINGIFY(x) STRINGIFY_(x)

static std::map<std::string, std::string> LoadedModules;

#if PLATFORM_IOS
int PesapiLoadFramework(std::string frameworkName, std::string entryClassName, pesapi_func_ptr* funcPtrArray);
#endif

MSVC_PRAGMA(warning(push))
MSVC_PRAGMA(warning(disable : 4191))
static pesapi_func_ptr funcs[] = {(pesapi_func_ptr) &pesapi_create_null, (pesapi_func_ptr) &pesapi_create_undefined,
    (pesapi_func_ptr) &pesapi_create_boolean, (pesapi_func_ptr) &pesapi_create_int32, (pesapi_func_ptr) &pesapi_create_uint32,
    (pesapi_func_ptr) &pesapi_create_int64, (pesapi_func_ptr) &pesapi_create_uint64, (pesapi_func_ptr) &pesapi_create_double,
    (pesapi_func_ptr) &pesapi_create_string_utf8, (pesapi_func_ptr) &pesapi_create_binary, (pesapi_func_ptr) &pesapi_create_array,
    (pesapi_func_ptr) &pesapi_get_value_bool, (pesapi_func_ptr) &pesapi_get_value_int32, (pesapi_func_ptr) &pesapi_get_value_uint32,
    (pesapi_func_ptr) &pesapi_get_value_int64, (pesapi_func_ptr) &pesapi_get_value_uint64,
    (pesapi_func_ptr) &pesapi_get_value_double, (pesapi_func_ptr) &pesapi_get_value_string_utf8,
    (pesapi_func_ptr) &pesapi_get_value_binary, (pesapi_func_ptr) &pesapi_get_array_length, (pesapi_func_ptr) &pesapi_is_null,
    (pesapi_func_ptr) &pesapi_is_undefined, (pesapi_func_ptr) &pesapi_is_boolean, (pesapi_func_ptr) &pesapi_is_int32,
    (pesapi_func_ptr) &pesapi_is_uint32, (pesapi_func_ptr) &pesapi_is_int64, (pesapi_func_ptr) &pesapi_is_uint64,
    (pesapi_func_ptr) &pesapi_is_double, (pesapi_func_ptr) &pesapi_is_string, (pesapi_func_ptr) &pesapi_is_object,
    (pesapi_func_ptr) &pesapi_is_function, (pesapi_func_ptr) &pesapi_is_binary, (pesapi_func_ptr) &pesapi_is_array,
    (pesapi_func_ptr) &pesapi_native_object_to_value, (pesapi_func_ptr) &pesapi_get_native_object_ptr,
    (pesapi_func_ptr) &pesapi_get_native_object_typeid, (pesapi_func_ptr) &pesapi_is_instance_of, (pesapi_func_ptr) &pesapi_boxing,
    (pesapi_func_ptr) &pesapi_unboxing, (pesapi_func_ptr) &pesapi_update_boxed_value, (pesapi_func_ptr) &pesapi_is_boxed_value,
    (pesapi_func_ptr) &pesapi_get_args_len, (pesapi_func_ptr) &pesapi_get_arg, (pesapi_func_ptr) &pesapi_get_env,
    (pesapi_func_ptr) &pesapi_get_this, (pesapi_func_ptr) &pesapi_get_holder, (pesapi_func_ptr) &pesapi_get_userdata,
    (pesapi_func_ptr) &pesapi_get_constructor_userdata, (pesapi_func_ptr) &pesapi_add_return,
    (pesapi_func_ptr) &pesapi_throw_by_string, (pesapi_func_ptr) &pesapi_hold_env, (pesapi_func_ptr) &pesapi_get_env_from_holder,
    (pesapi_func_ptr) &pesapi_duplicate_env_holder, (pesapi_func_ptr) &pesapi_release_env_holder,
    (pesapi_func_ptr) &pesapi_open_scope, (pesapi_func_ptr) &pesapi_has_caught, (pesapi_func_ptr) &pesapi_get_exception_as_string,
    (pesapi_func_ptr) &pesapi_close_scope, (pesapi_func_ptr) &pesapi_hold_value, (pesapi_func_ptr) &pesapi_duplicate_value_holder,
    (pesapi_func_ptr) &pesapi_release_value_holder, (pesapi_func_ptr) &pesapi_get_value_from_holder,
    (pesapi_func_ptr) &pesapi_get_property, (pesapi_func_ptr) &pesapi_set_property, (pesapi_func_ptr) &pesapi_get_property_uint32,
    (pesapi_func_ptr) &pesapi_set_property_uint32, (pesapi_func_ptr) &pesapi_call_function, (pesapi_func_ptr) &pesapi_eval,
    (pesapi_func_ptr) &pesapi_alloc_type_infos, (pesapi_func_ptr) &pesapi_set_type_info,
    (pesapi_func_ptr) &pesapi_create_signature_info, (pesapi_func_ptr) &pesapi_alloc_property_descriptors,
    (pesapi_func_ptr) &pesapi_set_method_info, (pesapi_func_ptr) &pesapi_set_property_info, (pesapi_func_ptr) &pesapi_define_class,
    (pesapi_func_ptr) &pesapi_class_type_info};
MSVC_PRAGMA(warning(pop))

EXTERN_C_START
extern const char* GPesapiModuleName;
EXTERN_C_END

namespace puerts
{
void LoadPesapiDll(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    if (!Info[0]->IsString())
    {
        FV8Utils::ThrowException(Info.GetIsolate(), "#0 argument expect a string");
        return;
    }
    FString Path = FV8Utils::ToFString(Info.GetIsolate(), Info[0]);

    auto Iter = LoadedModules.find(TCHAR_TO_UTF8(*Path));
    if (Iter != LoadedModules.end())
    {
        Info.GetReturnValue().Set(FV8Utils::ToV8String(Info.GetIsolate(), Iter->second.c_str()));
        return;
    }

    void* DllHandle = FPlatformProcess::GetDllHandle(*Path);
    if (!DllHandle)
    {
        FV8Utils::ThrowException(Info.GetIsolate(), FString(TEXT("dlopen fail for ")) + Path);
        return;
    }

    const FString EntryName = UTF8_TO_TCHAR(STRINGIFY(PESAPI_MODULE_INITIALIZER(dynamic)));
    auto Init = (const char* (*) (pesapi_func_ptr*) )(uintptr_t) FPlatformProcess::GetDllExport(DllHandle, *EntryName);

    if (Init)
    {
        const char* ModuleName = Init(nullptr);
        GPesapiModuleName = ModuleName;
        Init(funcs);
        GPesapiModuleName = nullptr;
        LoadedModules[TCHAR_TO_UTF8(*Path)] = ModuleName;
        Info.GetReturnValue().Set(FV8Utils::ToV8String(Info.GetIsolate(), ModuleName));
    }
    else
    {
        const FString VersionEntryName = UTF8_TO_TCHAR(STRINGIFY(PESAPI_MODULE_VERSION()));
        auto Ver = (int (*)())(uintptr_t) FPlatformProcess::GetDllExport(DllHandle, *VersionEntryName);
        if (!Ver)
        {
            FV8Utils::ThrowException(Info.GetIsolate(), "can find entry");
        }
        else
        {
            int PesapiVersion = Ver();
            FV8Utils::ThrowException(Info.GetIsolate(),
                FString::Printf(TEXT("pesapi version mismatch, expect: %d, but got %d"), PESAPI_VERSION, PesapiVersion));
        }
        FPlatformProcess::FreeDllHandle(DllHandle);
    }
}
}    // namespace puerts

static int LoadAddon(const char* path, const char* module_name)
{
    if (LoadedModules.find(path) != LoadedModules.end())
    {
        // UE_LOG(LogTemp, Warning, TEXT("Try load addon already loaded: %s"), UTF8_TO_TCHAR(path));
        return 0;
    }
#if !PLATFORM_IOS
    void* Handle = FPlatformProcess::GetDllHandle(UTF8_TO_TCHAR(path));
    if (Handle)
    {
        FString EntryName = UTF8_TO_TCHAR(STRINGIFY(PESAPI_MODULE_INITIALIZER(dynamic)));

        auto Init = (const char* (*) (pesapi_func_ptr*) )(uintptr_t) FPlatformProcess::GetDllExport(Handle, *EntryName);
        if (Init)
        {
            const char* ModuleName = Init(nullptr);
            GPesapiModuleName = ModuleName;
            Init(funcs);
            GPesapiModuleName = nullptr;
            LoadedModules[path] = ModuleName;
            return 0;
        }
        else
        {
            FString VersionEntryName = UTF8_TO_TCHAR(STRINGIFY(PESAPI_MODULE_VERSION()));
            auto Ver = (int (*)())(uintptr_t) FPlatformProcess::GetDllExport(Handle, *VersionEntryName);
            if (!Ver)
            {
                UE_LOG(LogTemp, Error, TEXT("Could not find entry for: %s"), UTF8_TO_TCHAR(path));
            }
            else
            {
                int PesapiVersion = Ver();
                UE_LOG(LogTemp, Error, TEXT("pesapi version mismatch, expect: %d, but got: %d"), PESAPI_VERSION, PesapiVersion);
            }
        }
    }
    else
    {
        UE_LOG(LogTemp, Error, TEXT("Could not load addon: %s"), UTF8_TO_TCHAR(path));
    }
    return -1;
#else
    FString EntryName = UTF8_TO_TCHAR(STRINGIFY(PESAPI_MODULE_INITIALIZER(___magic_module_name_xx___)));
    EntryName = EntryName.Replace(TEXT("___magic_module_name_xx___"), UTF8_TO_TCHAR(module_name));
    return PesapiLoadFramework(module_name, TCHAR_TO_UTF8(*EntryName), funcs);
#endif
}

EXTERN_C_START
int pesapi_load_addon(const char* path, const char* module_name)
{
    return LoadAddon(path, module_name);
}
EXTERN_C_END

#endif

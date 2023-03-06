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

#include <map>
#include <string>

#define STRINGIFY_(x) #x
#define STRINGIFY(x) STRINGIFY_(x)

static std::map<std::string, void*> GHandlers;

#if PLATFORM_IOS
int PesapiLoadFramework(std::string frameworkName, std::string entryClassName, pesapi_func_ptr* funcPtrArray);
#endif

MSVC_PRAGMA(warning(push))
MSVC_PRAGMA(warning(disable : 4191))
static pesapi_func_ptr funcs[] = {(pesapi_func_ptr) &pesapi_create_null, (pesapi_func_ptr) &pesapi_create_undefined,
    (pesapi_func_ptr) &pesapi_create_boolean, (pesapi_func_ptr) &pesapi_create_int32, (pesapi_func_ptr) &pesapi_create_uint32,
    (pesapi_func_ptr) &pesapi_create_int64, (pesapi_func_ptr) &pesapi_create_uint64, (pesapi_func_ptr) &pesapi_create_double,
    (pesapi_func_ptr) &pesapi_create_string_utf8, (pesapi_func_ptr) &pesapi_create_binary, (pesapi_func_ptr) &pesapi_get_value_bool,
    (pesapi_func_ptr) &pesapi_get_value_int32, (pesapi_func_ptr) &pesapi_get_value_uint32,
    (pesapi_func_ptr) &pesapi_get_value_int64, (pesapi_func_ptr) &pesapi_get_value_uint64,
    (pesapi_func_ptr) &pesapi_get_value_double, (pesapi_func_ptr) &pesapi_get_value_string_utf8,
    (pesapi_func_ptr) &pesapi_get_value_binary, (pesapi_func_ptr) &pesapi_is_null, (pesapi_func_ptr) &pesapi_is_undefined,
    (pesapi_func_ptr) &pesapi_is_boolean, (pesapi_func_ptr) &pesapi_is_int32, (pesapi_func_ptr) &pesapi_is_uint32,
    (pesapi_func_ptr) &pesapi_is_int64, (pesapi_func_ptr) &pesapi_is_uint64, (pesapi_func_ptr) &pesapi_is_double,
    (pesapi_func_ptr) &pesapi_is_string, (pesapi_func_ptr) &pesapi_is_object, (pesapi_func_ptr) &pesapi_is_function,
    (pesapi_func_ptr) &pesapi_is_binary, (pesapi_func_ptr) &pesapi_create_native_object,
    (pesapi_func_ptr) &pesapi_get_native_object_ptr, (pesapi_func_ptr) &pesapi_get_native_object_typeid,
    (pesapi_func_ptr) &pesapi_is_native_object, (pesapi_func_ptr) &pesapi_create_ref, (pesapi_func_ptr) &pesapi_get_value_ref,
    (pesapi_func_ptr) &pesapi_update_value_ref, (pesapi_func_ptr) &pesapi_is_ref, (pesapi_func_ptr) &pesapi_get_args_len,
    (pesapi_func_ptr) &pesapi_get_arg, (pesapi_func_ptr) &pesapi_get_env, (pesapi_func_ptr) &pesapi_get_this,
    (pesapi_func_ptr) &pesapi_get_holder, (pesapi_func_ptr) &pesapi_get_userdata,
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
    (pesapi_func_ptr) &pesapi_set_method_info, (pesapi_func_ptr) &pesapi_set_property_info, (pesapi_func_ptr) &pesapi_define_class};
MSVC_PRAGMA(warning(pop))

static int LoadAddon(const char* path, const char* module_name)
{
    if (GHandlers.find(path) != GHandlers.end())
    {
        // UE_LOG(LogTemp, Warning, TEXT("Try load addon already loaded: %s"), UTF8_TO_TCHAR(path));
        return 0;
    }
#if !PLATFORM_IOS
    void* Handle = FPlatformProcess::GetDllHandle(UTF8_TO_TCHAR(path));
    if (Handle)
    {
        FString EntryName = UTF8_TO_TCHAR(STRINGIFY(PESAPI_MODULE_INITIALIZER(___magic_module_name_xx___)));
        EntryName = EntryName.Replace(TEXT("___magic_module_name_xx___"), UTF8_TO_TCHAR(module_name));

        auto Init = (void (*)(pesapi_func_ptr*))(uintptr_t) FPlatformProcess::GetDllExport(Handle, *EntryName);
        if (Init)
        {
            Init(funcs);
            GHandlers[path] = Handle;
            return 0;
        }
        UE_LOG(LogTemp, Error, TEXT("Could not find entry for: %s"), UTF8_TO_TCHAR(path));
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

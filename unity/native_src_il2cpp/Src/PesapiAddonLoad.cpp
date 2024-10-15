/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "pesapi.h"
#if defined(PLATFORM_WINDOWS)
#include <windows.h>
#endif

#include <map>
#include <string>
#include <iostream>
#include <regex>

#pragma warning(push, 0)  
#include "libplatform/libplatform.h"
#include "v8.h"
#pragma warning(pop)

#define STRINGIFY_(x) #x
#define STRINGIFY(x) STRINGIFY_(x)

#ifndef MSVC_PRAGMA
#if !defined(__clang__) && defined(_MSC_VER)
	#define MSVC_PRAGMA(Pragma) __pragma(Pragma)
#else
	#define MSVC_PRAGMA(...)
#endif
#endif

static std::map<std::string, void*> GHandlers;

MSVC_PRAGMA(warning(push))
MSVC_PRAGMA(warning(disable : 4191))
static pesapi_func_ptr funcs[] = {(pesapi_func_ptr) &pesapi_create_null, (pesapi_func_ptr) &pesapi_create_undefined,
    (pesapi_func_ptr) &pesapi_create_boolean, (pesapi_func_ptr) &pesapi_create_int32, (pesapi_func_ptr) &pesapi_create_uint32,
    (pesapi_func_ptr) &pesapi_create_int64, (pesapi_func_ptr) &pesapi_create_uint64, (pesapi_func_ptr) &pesapi_create_double,
    (pesapi_func_ptr) &pesapi_create_string_utf8, (pesapi_func_ptr) &pesapi_create_binary, (pesapi_func_ptr) &pesapi_create_array,
    (pesapi_func_ptr) &pesapi_create_object, (pesapi_func_ptr) &pesapi_create_function, (pesapi_func_ptr) &pesapi_create_class,
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
    (pesapi_func_ptr) &pesapi_get_class_data_in_constructor, (pesapi_func_ptr) &pesapi_add_return,
    (pesapi_func_ptr) &pesapi_throw_by_string, (pesapi_func_ptr) &pesapi_create_env_ref, (pesapi_func_ptr) &pesapi_env_ref_is_valid,
    (pesapi_func_ptr) &pesapi_get_env_from_ref, (pesapi_func_ptr) &pesapi_duplicate_env_ref,
    (pesapi_func_ptr) &pesapi_release_env_ref, (pesapi_func_ptr) &pesapi_open_scope, (pesapi_func_ptr) &pesapi_has_caught,
    (pesapi_func_ptr) &pesapi_get_exception_as_string, (pesapi_func_ptr) &pesapi_close_scope,
    (pesapi_func_ptr) &pesapi_create_value_ref, (pesapi_func_ptr) &pesapi_duplicate_value_ref,
    (pesapi_func_ptr) &pesapi_release_value_ref, (pesapi_func_ptr) &pesapi_get_value_from_ref,
    (pesapi_func_ptr) &pesapi_set_ref_weak, (pesapi_func_ptr) &pesapi_set_owner, (pesapi_func_ptr) &pesapi_get_ref_associated_env,
    (pesapi_func_ptr) &pesapi_get_ref_internal_fields, (pesapi_func_ptr) &pesapi_get_property,
    (pesapi_func_ptr) &pesapi_set_property, (pesapi_func_ptr) &pesapi_get_private, (pesapi_func_ptr) &pesapi_set_private,
    (pesapi_func_ptr) &pesapi_get_property_uint32, (pesapi_func_ptr) &pesapi_set_property_uint32,
    (pesapi_func_ptr) &pesapi_call_function, (pesapi_func_ptr) &pesapi_eval, (pesapi_func_ptr) &pesapi_global,
    (pesapi_func_ptr) &pesapi_get_env_private, (pesapi_func_ptr) &pesapi_set_env_private,
    (pesapi_func_ptr) &pesapi_alloc_type_infos, (pesapi_func_ptr) &pesapi_set_type_info,
    (pesapi_func_ptr) &pesapi_create_signature_info, (pesapi_func_ptr) &pesapi_alloc_property_descriptors,
    (pesapi_func_ptr) &pesapi_set_method_info, (pesapi_func_ptr) &pesapi_set_property_info, (pesapi_func_ptr) &pesapi_define_class,
    (pesapi_func_ptr) &pesapi_load_class_data, (pesapi_func_ptr) &pesapi_on_class_not_found,
    (pesapi_func_ptr) &pesapi_class_type_info, (pesapi_func_ptr) &pesapi_find_type_id};
MSVC_PRAGMA(warning(pop))

static int LoadAddon(const char* path, const char* module_name)
{
    /*if (GHandlers.find(path) != GHandlers.end())
    {
        // UE_LOG(LogTemp, Warning, TEXT("Try load addon already loaded: %s"), UTF8_TO_TCHAR(path));
        return 0;
    }
    
    HINSTANCE hinstLib; 

    hinstLib = LoadLibrary(path); 

    if (hinstLib != NULL) 
    {
        std::string EntryName = STRINGIFY(PESAPI_MODULE_INITIALIZER(___magic_module_name_xx___));
        EntryName = std::regex_replace(EntryName, std::regex("___magic_module_name_xx___"), module_name);
        
        auto Init = (void (*)(pesapi_func_ptr*))(uintptr_t)GetProcAddress(hinstLib, EntryName.c_str()); 
 
        if (Init) 
        {
            Init(funcs);
            GHandlers[path] = hinstLib;
            return 0;
        }
        std::cout << "can find symbol " << EntryName << " in " << path << "!" << std::endl;
        FreeLibrary(hinstLib); 
    } 
    else
    {
        std::cout << "load " << path << " fail!" << std::endl;
    }
    */
    return -1;
}

EXTERN_C_START
int pesapi_load_addon(const char* path, const char* module_name)
{
    return LoadAddon(path, module_name);
}

V8_EXPORT pesapi_func_ptr* GetPesapiImpl()
{
    return funcs;
}
EXTERN_C_END


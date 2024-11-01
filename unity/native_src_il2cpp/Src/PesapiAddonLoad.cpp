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
static pesapi_func_ptr funcs[] = {(pesapi_func_ptr) &pesapi_alloc_type_infos, (pesapi_func_ptr) &pesapi_set_type_info,
    (pesapi_func_ptr) &pesapi_create_signature_info, (pesapi_func_ptr) &pesapi_alloc_property_descriptors,
    (pesapi_func_ptr) &pesapi_set_method_info, (pesapi_func_ptr) &pesapi_set_property_info, (pesapi_func_ptr) &pesapi_define_class,
    (pesapi_func_ptr) &pesapi_get_class_data, (pesapi_func_ptr) &pesapi_trace_native_object_lifecycle,
    (pesapi_func_ptr) &pesapi_on_class_not_found, (pesapi_func_ptr) &pesapi_class_type_info,
    (pesapi_func_ptr) &pesapi_find_type_id};
MSVC_PRAGMA(warning(pop))

static int LoadAddon(const char* path, const char* module_name)
{
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


/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include "pesapi.h"
#include <windows.h>
#include "CoreMinimal.h"

#define STRINGIFY_(x) #x
#define STRINGIFY(x) STRINGIFY_(x)

EXTERN_C_START

static void* funcs[] = {
	&pesapi_create_null,
	&pesapi_create_undefined,
	&pesapi_create_boolean,
	&pesapi_create_int32,
	&pesapi_create_uint32,
	&pesapi_create_int64,
	&pesapi_create_uint64,
	&pesapi_create_double,
	&pesapi_create_string_utf8,
	&pesapi_get_value_bool,
	&pesapi_get_value_int32,
	&pesapi_get_value_uint32,
	&pesapi_get_value_int64,
	&pesapi_get_value_uint64,
	&pesapi_get_value_double,
	&pesapi_is_null,
	&pesapi_is_undefined,
	&pesapi_is_boolean,
	&pesapi_is_int32,
	&pesapi_is_uint32,
	&pesapi_is_int64,
	&pesapi_is_uint64,
	&pesapi_is_double,
	&pesapi_is_string,
	&pesapi_is_object,
	&pesapi_is_function,
	&pesapi_create_native_object,
	&pesapi_is_native_object,
	&pesapi_create_ref,
	&pesapi_get_value_ref,
	&pesapi_update_value_ref,
	&pesapi_is_ref,
	&pesapi_get_args_len,
	&pesapi_get_arg,
	&pesapi_get_env,
	&pesapi_get_this,
	&pesapi_get_holder,
	&pesapi_add_return,
	&pesapi_throw_by_string,
	&pesapi_hold_env,
	&pesapi_get_env_from_holder,
	&pesapi_duplicate_env_holder,
	&pesapi_release_env_holder,
	&pesapi_open_scope,
	&pesapi_has_caught,
	&pesapi_close_scope,
	&pesapi_hold_value,
	&pesapi_duplicate_value_holder,
	&pesapi_release_value_holder,
	&pesapi_get_value_from_holder,
	&pesapi_get_property,
	&pesapi_set_property,
	&pesapi_call_function,
	&pesapi_define_class
};

int pesapi_load_addon(const char* path, const char* module_name)
{
#if PLATFORM_WINDOWS
	wchar_t filename_w[32768];
	
	if (MultiByteToWideChar(CP_UTF8,
							0,
							path,
							-1,
							filename_w,
							sizeof(filename_w)/sizeof(wchar_t))) {
		const HMODULE handle = LoadLibraryExW(filename_w, NULL, LOAD_WITH_ALTERED_SEARCH_PATH);
		if (handle)
		{
			char name[1024];
			snprintf(name, sizeof(name), STRINGIFY(PESAPI_MODULE_INITIALIZER(%s)), module_name);
		    auto init = (void(*)(void**))(uintptr_t) GetProcAddress(handle, name);
			if (!init)
			{
				return -1;
			}
			init(funcs);
		}
	}
	return GetLastError();
#else
	//not implemented yet
	return -1;
#endif
}

EXTERN_C_END
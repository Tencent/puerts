/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include "pesapi.h"
#include "CoreMinimal.h"

#include <map>
#include <string>

#define STRINGIFY_(x) #x
#define STRINGIFY(x) STRINGIFY_(x)

std::map<std::string, void*> GHandlers;

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
	if (GHandlers.find(path) != GHandlers.end())
	{
		UE_LOG(LogTemp, Warning, TEXT("Try load addon already loaded: %s"), UTF8_TO_TCHAR(path));
		return 0;
	}
#if !PLATFORM_IOS
	void* Handle = FPlatformProcess::GetDllHandle(UTF8_TO_TCHAR(path));
	if (Handle)
	{
		FString EntryName = UTF8_TO_TCHAR(STRINGIFY(PESAPI_MODULE_INITIALIZER(%s)));
		EntryName = EntryName.Replace(TEXT("%s"), UTF8_TO_TCHAR(module_name));
		
		auto Init = (void(*)(void**))(uintptr_t)FPlatformProcess::GetDllExport(Handle, *EntryName);
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
#else
	//not implemented yet
#endif
	return -1;
}

EXTERN_C_END
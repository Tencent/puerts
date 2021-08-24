/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#ifndef PS_API_H_
#define PS_API_H_

#ifdef BUILDING_PES_EXTENSION
#ifdef _WIN32
	#define PESAPI_EXTERN __declspec(dllimport)
#elif defined(__wasm32__)
	#define PESAPI_EXTERN __attribute__((__import_module__("pesapi")))
#endif
#else
#ifdef _WIN32
#define PESAPI_EXTERN __declspec(dllexport)
#elif defined(__wasm32__)
#define PESAPI_EXTERN __attribute__((visibility("default")))                \
__attribute__((__import_module__("pesapi")))
#else
#define PESAPI_EXTERN __attribute__((visibility("default")))
#endif
#endif

#ifdef _WIN32
# define PESAPI_MODULE_EXPORT __declspec(dllexport)
#else
# define PESAPI_MODULE_EXPORT __attribute__((visibility("default")))
#endif

#if defined(__GNUC__)
# define PESAPI_NO_RETURN __attribute__((noreturn))
#elif defined(_WIN32)
# define PESAPI_NO_RETURN __declspec(noreturn)
#else
# define PESAPI_NO_RETURN
#endif

//#ifdef __cplusplus
//extern "C" {
//#endif

typedef struct pesapi_env__* pesapi_env;
typedef struct pesapi_value__* pesapi_value;
typedef struct pesapi_callback_info__* pesapi_callback_info;

//value process
PESAPI_EXTERN pesapi_value pesapi_create_null(pesapi_env env);
PESAPI_EXTERN pesapi_value pesapi_create_undefined(pesapi_env env);
PESAPI_EXTERN pesapi_value pesapi_create_boolean(pesapi_env env, bool value);
PESAPI_EXTERN pesapi_value pesapi_create_int32(pesapi_env env, int32_t value);
PESAPI_EXTERN pesapi_value pesapi_create_uint32(pesapi_env env, uint32_t value);
PESAPI_EXTERN pesapi_value pesapi_create_int64(pesapi_env env, int64_t value);
PESAPI_EXTERN pesapi_value pesapi_create_uint64(pesapi_env env, uint64_t value);
PESAPI_EXTERN pesapi_value pesapi_create_double(pesapi_env env, double value);
PESAPI_EXTERN pesapi_value pesapi_create_string_utf8(pesapi_env env, const char* str, size_t length);

PESAPI_EXTERN bool pesapi_get_value_bool(pesapi_env env, pesapi_value value);
PESAPI_EXTERN int32_t pesapi_get_value_int32(pesapi_env env, pesapi_value value);
PESAPI_EXTERN uint32_t pesapi_get_value_uint32(pesapi_env env, pesapi_value value);
PESAPI_EXTERN int64_t pesapi_get_value_int64(pesapi_env env, pesapi_value value);
PESAPI_EXTERN uint64_t pesapi_get_value_uint64(pesapi_env env, pesapi_value value);
PESAPI_EXTERN double pesapi_get_value_double(pesapi_env env, pesapi_value value);
PESAPI_EXTERN const char* pesapi_get_value_string_utf8(pesapi_env env, pesapi_value value, char* buf, size_t* bufsize);

PESAPI_EXTERN bool pesapi_is_null(pesapi_env env, pesapi_value value);
PESAPI_EXTERN bool pesapi_is_undefined(pesapi_env env, pesapi_value value);
PESAPI_EXTERN bool pesapi_is_boolean(pesapi_env env, pesapi_value value);
PESAPI_EXTERN bool pesapi_is_int32(pesapi_env env, pesapi_value value);
PESAPI_EXTERN bool pesapi_is_uint32(pesapi_env env, pesapi_value value);
PESAPI_EXTERN bool pesapi_is_int64(pesapi_env env, pesapi_value value);
PESAPI_EXTERN bool pesapi_is_uint64(pesapi_env env, pesapi_value value);
PESAPI_EXTERN bool pesapi_is_double(pesapi_env env, pesapi_value value);
PESAPI_EXTERN bool pesapi_is_string(pesapi_env env, pesapi_value value);
PESAPI_EXTERN bool pesapi_is_object(pesapi_env env, pesapi_value value);

PESAPI_EXTERN pesapi_value pesapi_create_native_object(pesapi_env env, void* class_id, void* object_ptr, bool copy);
PESAPI_EXTERN void* pesapi_get_native_object_ptr(pesapi_env env, pesapi_value value);
PESAPI_EXTERN bool pesapi_is_native_object(pesapi_env env, void* class_id, pesapi_value value);

PESAPI_EXTERN pesapi_value pesapi_create_ref(pesapi_env env, pesapi_value value);
PESAPI_EXTERN pesapi_value pesapi_get_value_ref(pesapi_env env, pesapi_value value);
PESAPI_EXTERN void pesapi_update_value_ref(pesapi_env env, pesapi_value ref, pesapi_value value);
PESAPI_EXTERN bool pesapi_is_ref(pesapi_env env, pesapi_value value);

PESAPI_EXTERN int pesapi_get_args_len(pesapi_callback_info info);
PESAPI_EXTERN pesapi_value pesapi_get_arg(pesapi_callback_info info, int index);
PESAPI_EXTERN pesapi_env pesapi_get_env(pesapi_callback_info info);
PESAPI_EXTERN pesapi_value pesapi_get_this(pesapi_callback_info info);
PESAPI_EXTERN pesapi_value pesapi_get_holder(pesapi_callback_info info);
PESAPI_EXTERN void pesapi_set_return(pesapi_callback_info info, pesapi_value value);
PESAPI_EXTERN void pesapi_throw_by_string(pesapi_env env, const char* msg);

//#ifdef __cplusplus
//}
//#endif

#endif

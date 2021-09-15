/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#ifndef PS_API_H_
#define PS_API_H_

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#define PESAPI_VERSION  1

#define PESAPI_EXTERN

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

#ifdef __cplusplus
#define EXTERN_C_START extern "C" {
#define EXTERN_C_END }
#else
#define EXTERN_C_START
#define EXTERN_C_END
#endif

#define PESAPI_MODULE_INITIALIZER_X(base, module, version)                               \
    PESAPI_MODULE_INITIALIZER_X_HELPER(base, module, version)

#define PESAPI_MODULE_INITIALIZER_X_HELPER(base, module, version) base##module##_v##version

#define PESAPI_MODULE_INITIALIZER_BASE pesapi_register_

#define PESAPI_MODULE_INITIALIZER(modname)                                       \
  PESAPI_MODULE_INITIALIZER_X(PESAPI_MODULE_INITIALIZER_BASE, modname,      \
    PESAPI_VERSION)

#define PESAPI_MODULE(modname, initfunc)                                                     \
    EXTERN_C_START                                                                           \
    PESAPI_MODULE_EXPORT void PESAPI_MODULE_INITIALIZER(modname) (pesapi_func_ptr* func_ptr_array);    \
    EXTERN_C_END                                                                             \
    PESAPI_MODULE_EXPORT void PESAPI_MODULE_INITIALIZER(modname) (pesapi_func_ptr* func_ptr_array) {   \
        pesapi_init(func_ptr_array);                                                         \
        initfunc();                                                                          \
    }                                                                                        \
  

EXTERN_C_START

typedef struct pesapi_env__* pesapi_env;
typedef struct pesapi_env_holder__* pesapi_env_holder;
typedef struct pesapi_value__* pesapi_value;
typedef struct pesapi_value_holder__* pesapi_value_holder;
typedef struct pesapi_callback_info__* pesapi_callback_info;
typedef struct pesapi_scope__* pesapi_scope;

struct pesapi_type_info__ {
	const char* name;
	bool is_pointer;
	bool is_const;
	bool is_ref;
	bool is_primitive;
};
typedef struct pesapi_type_info__* pesapi_type_info;

struct pesapi_signature_info__ {
	struct pesapi_type_info__ return_type;
	int parameter_count;
	pesapi_type_info parameter_types;
};
typedef struct pesapi_signature_info__* pesapi_signature_info;

typedef void (*pesapi_callback)(pesapi_callback_info info);
typedef struct {
	const char* name;
	bool is_static;
	pesapi_callback method;
	pesapi_callback getter;
	pesapi_callback setter;
	void* data;

	union 
	{
		pesapi_type_info type_info;
		pesapi_signature_info signature_info;
	} info;
} pesapi_property_descriptor;

typedef void(*pesapi_func_ptr)(void);

#ifdef BUILDING_PES_EXTENSION
PESAPI_EXTERN void pesapi_init(pesapi_func_ptr* func_array);
#else
PESAPI_MODULE_EXPORT int pesapi_load_addon(const char* path, const char* module_name);
#endif

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
PESAPI_EXTERN bool pesapi_is_function(pesapi_env env, pesapi_value value);

PESAPI_EXTERN pesapi_value pesapi_create_native_object(pesapi_env env, const void* class_id, void* object_ptr, bool copy);
PESAPI_EXTERN void* pesapi_get_native_object_ptr(pesapi_env env, pesapi_value value);
PESAPI_EXTERN bool pesapi_is_native_object(pesapi_env env, const void* class_id, pesapi_value value);

PESAPI_EXTERN pesapi_value pesapi_create_ref(pesapi_env env, pesapi_value value);
PESAPI_EXTERN pesapi_value pesapi_get_value_ref(pesapi_env env, pesapi_value value);
PESAPI_EXTERN void pesapi_update_value_ref(pesapi_env env, pesapi_value ref, pesapi_value value);
PESAPI_EXTERN bool pesapi_is_ref(pesapi_env env, pesapi_value value);

PESAPI_EXTERN int pesapi_get_args_len(pesapi_callback_info info);
PESAPI_EXTERN pesapi_value pesapi_get_arg(pesapi_callback_info info, int index);
PESAPI_EXTERN pesapi_env pesapi_get_env(pesapi_callback_info info);
PESAPI_EXTERN pesapi_value pesapi_get_this(pesapi_callback_info info);
PESAPI_EXTERN pesapi_value pesapi_get_holder(pesapi_callback_info info);
PESAPI_EXTERN void pesapi_add_return(pesapi_callback_info info, pesapi_value value);
PESAPI_EXTERN void pesapi_throw_by_string(pesapi_env env, const char* msg);

PESAPI_EXTERN pesapi_env_holder pesapi_hold_env(pesapi_env env);
PESAPI_EXTERN pesapi_env pesapi_get_env_from_holder(pesapi_env_holder env_holder);
PESAPI_EXTERN pesapi_env_holder pesapi_duplicate_env_holder(pesapi_env_holder env_holder);
PESAPI_EXTERN void pesapi_release_env_holder(pesapi_env_holder env_holder);

PESAPI_EXTERN pesapi_scope pesapi_open_scope(pesapi_env_holder env_holder);
PESAPI_EXTERN bool pesapi_has_caught(pesapi_scope scope);
PESAPI_EXTERN const char* pesapi_get_exception_as_string(pesapi_scope scope, bool with_stack);
PESAPI_EXTERN void pesapi_close_scope(pesapi_scope scope);

PESAPI_EXTERN pesapi_value_holder pesapi_hold_value(pesapi_env env, pesapi_value value);
PESAPI_EXTERN pesapi_value_holder pesapi_duplicate_value_holder(pesapi_value_holder value_holder);
PESAPI_EXTERN void pesapi_release_value_holder(pesapi_value_holder value_holder);
PESAPI_EXTERN pesapi_value pesapi_get_value_from_holder(pesapi_env env, pesapi_value_holder value_holder);

PESAPI_EXTERN pesapi_value pesapi_get_property(pesapi_env env, pesapi_value object, const char* key);
PESAPI_EXTERN void pesapi_set_property(pesapi_env env, pesapi_value object, const char* key, pesapi_value value);

PESAPI_EXTERN pesapi_value pesapi_call_function(pesapi_env env, pesapi_value func, pesapi_value this_object, int argc,
											const pesapi_value argv[]);

typedef void*(*pesapi_constructor)(pesapi_callback_info info);
typedef void(*pesapi_finalize)(void* Ptr);
PESAPI_EXTERN void pesapi_define_class(const char* type_name, const char* super_type_name,
	pesapi_constructor constructor, pesapi_finalize finalize, size_t property_count,
	const pesapi_property_descriptor* properties);

EXTERN_C_END

#endif

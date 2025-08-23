/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#ifndef PS_API_H_
#define PS_API_H_

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>
#include <string>

#define PESAPI_VERSION 11

#define PESAPI_EXTERN

#if defined(__APPLE__) && defined(BUILDING_PES_EXTENSION) && !defined(PESAPI_ADPT_C)
#include "TargetConditionals.h"
#if TARGET_OS_IPHONE || TARGET_IPHONE_SIMULATOR
//#define USING_OBJC_REFLECTION
#endif
#endif

#ifdef USING_OBJC_REFLECTION
#import <Foundation/Foundation.h>
#endif

#ifdef _WIN32
#define PESAPI_MODULE_EXPORT __declspec(dllexport)
#else
#define PESAPI_MODULE_EXPORT __attribute__((visibility("default")))
#endif

#if defined(__GNUC__)
#define PESAPI_NO_RETURN __attribute__((noreturn))
#elif defined(_WIN32)
#define PESAPI_NO_RETURN __declspec(noreturn)
#else
#define PESAPI_NO_RETURN
#endif

#ifdef __cplusplus
#define EXTERN_C_START \
    extern "C"         \
    {
#define EXTERN_C_END }
#else
#define EXTERN_C_START
#define EXTERN_C_END
#endif

#define PESAPI_MODULE_INITIALIZER_X(base, module, version) PESAPI_MODULE_INITIALIZER_X_HELPER(base, module, version)

#define PESAPI_MODULE_INITIALIZER_X_HELPER(base, module, version) base##module##_v##version

#define PESAPI_MODULE_INITIALIZER_BASE pesapi_register_

#define PESAPI_MODULE_INITIALIZER(modname) PESAPI_MODULE_INITIALIZER_X(PESAPI_MODULE_INITIALIZER_BASE, modname, PESAPI_VERSION)

#define PESAPI_MODULE_VERSION() PESAPI_MODULE_INITIALIZER_X(PESAPI_MODULE_INITIALIZER_BASE, version, 0)

#ifdef USING_OBJC_REFLECTION

#define PESAPI_MODULE(modname, initfunc)                      \
    @interface PESAPI_MODULE_INITIALIZER (modname) : NSObject                                     \
@end                                                          \
    @implementation PESAPI_MODULE_INITIALIZER (modname)       \
    +(void) initlib : (pesapi_func_ptr*) func_ptr_array       \
    {                                                         \
        pesapi_init(func_ptr_array);                          \
        initfunc();                                           \
    }                                                         \
    @end

#else

#define PESAPI_MODULE(modname, initfunc)                                                                                                      \
    EXTERN_C_START                                                                                                                            \
    PESAPI_MODULE_EXPORT void PESAPI_MODULE_INITIALIZER(modname)(struct pesapi_registry_api * registry_api, pesapi_registry registry);        \
    EXTERN_C_END                                                                                                                              \
    PESAPI_MODULE_EXPORT void PESAPI_MODULE_INITIALIZER(modname)(struct pesapi_registry_api * registry_api, pesapi_registry registry)         \
    {                                                                                                                                         \
        initfunc(registry_api, registry);                                                                                                     \
    }


#endif

EXTERN_C_START

// alloc on stack
struct pesapi_scope_memory
{
    int padding__[32];
};

typedef struct pesapi_env__* pesapi_env;
typedef struct pesapi_env_ref__* pesapi_env_ref;
typedef struct pesapi_value__* pesapi_value;
typedef struct pesapi_value_ref__* pesapi_value_ref;
typedef struct pesapi_callback_info__* pesapi_callback_info;
typedef struct pesapi_scope__* pesapi_scope;
typedef struct pesapi_type_info__* pesapi_type_info;
typedef struct pesapi_signature_info__* pesapi_signature_info;
typedef struct pesapi_property_descriptor__* pesapi_property_descriptor;
typedef struct pesapi_registry__* pesapi_registry;

struct pesapi_ffi;

typedef void (*pesapi_callback)(struct pesapi_ffi* apis, pesapi_callback_info info);
typedef void* (*pesapi_constructor)(struct pesapi_ffi* apis, pesapi_callback_info info);
typedef void (*pesapi_finalize)(struct pesapi_ffi* apis, void* ptr, void* class_data, void* env_private);
typedef void (*pesapi_function_finalize)(struct pesapi_ffi* apis, void* data, void* env_private);
typedef void* (*pesapi_on_native_object_enter)(void* ptr, void* class_data, void* env_private);
// userdata: return of pesapi_on_native_object_enter
typedef void (*pesapi_on_native_object_exit)(void* ptr, void* class_data, void* env_private, void* userdata);
typedef int (*pesapi_class_not_found_callback)(const void* type_id);
typedef void (*pesapi_func_ptr)(void);

#ifdef BUILDING_PES_EXTENSION
PESAPI_EXTERN void pesapi_init(pesapi_func_ptr* func_array);
#else
PESAPI_MODULE_EXPORT int pesapi_load_addon(const char* path, const char* module_name);
#endif

// value process
typedef pesapi_value (*pesapi_create_null_func)(pesapi_env env);
typedef pesapi_value (*pesapi_create_undefined_func)(pesapi_env env);
typedef pesapi_value (*pesapi_create_boolean_func)(pesapi_env env, int value);
typedef pesapi_value (*pesapi_create_int32_func)(pesapi_env env, int32_t value);
typedef pesapi_value (*pesapi_create_uint32_func)(pesapi_env env, uint32_t value);
typedef pesapi_value (*pesapi_create_int64_func)(pesapi_env env, int64_t value);
typedef pesapi_value (*pesapi_create_uint64_func)(pesapi_env env, uint64_t value);
typedef pesapi_value (*pesapi_create_double_func)(pesapi_env env, double value);
typedef pesapi_value (*pesapi_create_string_utf8_func)(pesapi_env env, const char* str, size_t length);
typedef pesapi_value (*pesapi_create_string_utf16_func)(pesapi_env env, const uint16_t* str, size_t length);
typedef pesapi_value (*pesapi_create_binary_func)(pesapi_env env, void* str, size_t length);
typedef pesapi_value (*pesapi_create_array_func)(pesapi_env env);
typedef pesapi_value (*pesapi_create_object_func)(pesapi_env env);
typedef pesapi_value (*pesapi_create_function_func)(pesapi_env env, pesapi_callback native_impl, void* data, pesapi_function_finalize finalize);
typedef pesapi_value (*pesapi_create_class_func)(pesapi_env env, const void* type_id);

typedef int (*pesapi_get_value_bool_func)(pesapi_env env, pesapi_value value);
typedef int32_t (*pesapi_get_value_int32_func)(pesapi_env env, pesapi_value value);
typedef uint32_t (*pesapi_get_value_uint32_func)(pesapi_env env, pesapi_value value);
typedef int64_t (*pesapi_get_value_int64_func)(pesapi_env env, pesapi_value value);
typedef uint64_t (*pesapi_get_value_uint64_func)(pesapi_env env, pesapi_value value);
typedef double (*pesapi_get_value_double_func)(pesapi_env env, pesapi_value value);
typedef const char* (*pesapi_get_value_string_utf8_func)(pesapi_env env, pesapi_value value, char* buf, size_t* bufsize);
typedef const uint16_t* (*pesapi_get_value_string_utf16_func)(pesapi_env env, pesapi_value value, uint16_t* buf, size_t* bufsize);
typedef void* (*pesapi_get_value_binary_func)(pesapi_env env, pesapi_value pvalue, size_t* bufsize);
typedef uint32_t (*pesapi_get_array_length_func)(pesapi_env env, pesapi_value value);

typedef int (*pesapi_is_null_func)(pesapi_env env, pesapi_value value);
typedef int (*pesapi_is_undefined_func)(pesapi_env env, pesapi_value value);
typedef int (*pesapi_is_boolean_func)(pesapi_env env, pesapi_value value);
typedef int (*pesapi_is_int32_func)(pesapi_env env, pesapi_value value);
typedef int (*pesapi_is_uint32_func)(pesapi_env env, pesapi_value value);
typedef int (*pesapi_is_int64_func)(pesapi_env env, pesapi_value value);
typedef int (*pesapi_is_uint64_func)(pesapi_env env, pesapi_value value);
typedef int (*pesapi_is_double_func)(pesapi_env env, pesapi_value value);
typedef int (*pesapi_is_string_func)(pesapi_env env, pesapi_value value);
typedef int (*pesapi_is_object_func)(pesapi_env env, pesapi_value value);
typedef int (*pesapi_is_function_func)(pesapi_env env, pesapi_value value);
typedef int (*pesapi_is_binary_func)(pesapi_env env, pesapi_value value);
typedef int (*pesapi_is_array_func)(pesapi_env env, pesapi_value value);

typedef pesapi_value (*pesapi_native_object_to_value_func)(pesapi_env env, const void* type_id, void* object_ptr, int call_finalize);
typedef void* (*pesapi_get_native_object_ptr_func)(pesapi_env env, pesapi_value value);
typedef const void* (*pesapi_get_native_object_typeid_func)(pesapi_env env, pesapi_value value);
typedef int (*pesapi_is_instance_of_func)(pesapi_env env, const void* type_id, pesapi_value value);

typedef pesapi_value (*pesapi_boxing_func)(pesapi_env env, pesapi_value value);
typedef pesapi_value (*pesapi_unboxing_func)(pesapi_env env, pesapi_value value);
typedef void (*pesapi_update_boxed_value_func)(pesapi_env env, pesapi_value boxed_value, pesapi_value value);
typedef int (*pesapi_is_boxed_value_func)(pesapi_env env, pesapi_value value);

typedef int (*pesapi_get_args_len_func)(pesapi_callback_info info);
typedef pesapi_value (*pesapi_get_arg_func)(pesapi_callback_info info, int index);
typedef pesapi_env (*pesapi_get_env_func)(pesapi_callback_info info);
typedef void* (*pesapi_get_native_holder_ptr_func)(pesapi_callback_info info);
typedef const void* (*pesapi_get_native_holder_typeid_func)(pesapi_callback_info info);
typedef void* (*pesapi_get_userdata_func)(pesapi_callback_info info);
typedef void (*pesapi_add_return_func)(pesapi_callback_info info, pesapi_value value);
typedef void (*pesapi_throw_by_string_func)(pesapi_callback_info pinfo, const char* msg);

typedef pesapi_env_ref (*pesapi_create_env_ref_func)(pesapi_env env);
typedef int (*pesapi_env_ref_is_valid_func)(pesapi_env_ref env);
typedef pesapi_env (*pesapi_get_env_from_ref_func)(pesapi_env_ref env_ref);
typedef pesapi_env_ref (*pesapi_duplicate_env_ref_func)(pesapi_env_ref env_ref);
typedef void (*pesapi_release_env_ref_func)(pesapi_env_ref env_ref);
typedef pesapi_scope (*pesapi_open_scope_func)(pesapi_env_ref env_ref);
typedef pesapi_scope (*pesapi_open_scope_placement_func)(pesapi_env_ref env_ref, struct pesapi_scope_memory* memory);
typedef int (*pesapi_has_caught_func)(pesapi_scope scope);
typedef const char* (*pesapi_get_exception_as_string_func)(pesapi_scope scope, int with_stack);
typedef void (*pesapi_close_scope_func)(pesapi_scope scope);
typedef void (*pesapi_close_scope_placement_func)(pesapi_scope scope);

typedef pesapi_value_ref (*pesapi_create_value_ref_func)(pesapi_env env, pesapi_value value, uint32_t internal_field_count);
typedef pesapi_value_ref (*pesapi_duplicate_value_ref_func)(pesapi_value_ref value_ref);
typedef void (*pesapi_release_value_ref_func)(pesapi_value_ref value_ref);
typedef pesapi_value (*pesapi_get_value_from_ref_func)(pesapi_env env, pesapi_value_ref value_ref);
typedef void (*pesapi_set_ref_weak_func)(pesapi_env env, pesapi_value_ref value_ref);
// Optional api: return false if can not fulfill
typedef int (*pesapi_set_owner_func)(pesapi_env env, pesapi_value value, pesapi_value owner);
// suggestion: struct pesapi_value_ref : pesapi_env_ref {...};
typedef pesapi_env_ref (*pesapi_get_ref_associated_env_func)(pesapi_value_ref value_ref);
typedef void** (*pesapi_get_ref_internal_fields_func)(pesapi_value_ref value_ref, uint32_t* pinternal_field_count);

typedef pesapi_value (*pesapi_get_property_func)(pesapi_env env, pesapi_value object, const char* key);
typedef int (*pesapi_set_property_func)(pesapi_env env, pesapi_value object, const char* key, pesapi_value value);
typedef int (*pesapi_get_private_func)(pesapi_env env, pesapi_value object, void** out_ptr);
typedef int (*pesapi_set_private_func)(pesapi_env env, pesapi_value object, void* ptr);
typedef pesapi_value (*pesapi_get_property_uint32_func)(pesapi_env env, pesapi_value object, uint32_t key);
typedef int (*pesapi_set_property_uint32_func)(pesapi_env env, pesapi_value object, uint32_t key, pesapi_value value);

typedef pesapi_value (*pesapi_call_function_func)(pesapi_env env, pesapi_value func, pesapi_value this_object, int argc, const pesapi_value argv[]);
typedef pesapi_value (*pesapi_eval_func)(pesapi_env env, const uint8_t* code, size_t code_size, const char* path);
typedef pesapi_value (*pesapi_global_func)(pesapi_env env);
typedef const void* (*pesapi_get_env_private_func)(pesapi_env env);
typedef void (*pesapi_set_env_private_func)(pesapi_env env, const void* ptr);

typedef void (*pesapi_set_registry_func)(pesapi_env env, pesapi_registry registry);

struct pesapi_ffi
{
    pesapi_create_null_func create_null;
    pesapi_create_undefined_func create_undefined;
    pesapi_create_boolean_func create_boolean;
    pesapi_create_int32_func create_int32;
    pesapi_create_uint32_func create_uint32;
    pesapi_create_int64_func create_int64;
    pesapi_create_uint64_func create_uint64;
    pesapi_create_double_func create_double;
    pesapi_create_string_utf8_func create_string_utf8;
    pesapi_create_string_utf16_func create_string_utf16;
    pesapi_create_binary_func create_binary;
    pesapi_create_binary_func create_binary_by_value;
    pesapi_create_array_func create_array;
    pesapi_create_object_func create_object;
    pesapi_create_function_func create_function;
    pesapi_create_class_func create_class;
    pesapi_get_value_bool_func get_value_bool;
    pesapi_get_value_int32_func get_value_int32;
    pesapi_get_value_uint32_func get_value_uint32;
    pesapi_get_value_int64_func get_value_int64;
    pesapi_get_value_uint64_func get_value_uint64;
    pesapi_get_value_double_func get_value_double;
    pesapi_get_value_string_utf8_func get_value_string_utf8;
    pesapi_get_value_string_utf16_func get_value_string_utf16;
    pesapi_get_value_binary_func get_value_binary;
    pesapi_get_array_length_func get_array_length;
    pesapi_is_null_func is_null;
    pesapi_is_undefined_func is_undefined;
    pesapi_is_boolean_func is_boolean;
    pesapi_is_int32_func is_int32;
    pesapi_is_uint32_func is_uint32;
    pesapi_is_int64_func is_int64;
    pesapi_is_uint64_func is_uint64;
    pesapi_is_double_func is_double;
    pesapi_is_string_func is_string;
    pesapi_is_object_func is_object;
    pesapi_is_function_func is_function;
    pesapi_is_binary_func is_binary;
    pesapi_is_array_func is_array;
    pesapi_native_object_to_value_func native_object_to_value;
    pesapi_get_native_object_ptr_func get_native_object_ptr;
    pesapi_get_native_object_typeid_func get_native_object_typeid;
    pesapi_is_instance_of_func is_instance_of;
    pesapi_boxing_func boxing;
    pesapi_unboxing_func unboxing;
    pesapi_update_boxed_value_func update_boxed_value;
    pesapi_is_boxed_value_func is_boxed_value;
    pesapi_get_args_len_func get_args_len;
    pesapi_get_arg_func get_arg;
    pesapi_get_env_func get_env;
    pesapi_get_native_holder_ptr_func get_native_holder_ptr;
    pesapi_get_native_holder_typeid_func get_native_holder_typeid;
    pesapi_get_userdata_func get_userdata;
    pesapi_add_return_func add_return;
    pesapi_throw_by_string_func throw_by_string;
    pesapi_create_env_ref_func create_env_ref;
    pesapi_env_ref_is_valid_func env_ref_is_valid;
    pesapi_get_env_from_ref_func get_env_from_ref;
    pesapi_duplicate_env_ref_func duplicate_env_ref;
    pesapi_release_env_ref_func release_env_ref;
    pesapi_open_scope_func open_scope;
    pesapi_open_scope_placement_func open_scope_placement;
    pesapi_has_caught_func has_caught;
    pesapi_get_exception_as_string_func get_exception_as_string;
    pesapi_close_scope_func close_scope;
    pesapi_close_scope_placement_func close_scope_placement;
    pesapi_create_value_ref_func create_value_ref;
    pesapi_duplicate_value_ref_func duplicate_value_ref;
    pesapi_release_value_ref_func release_value_ref;
    pesapi_get_value_from_ref_func get_value_from_ref;
    pesapi_set_ref_weak_func set_ref_weak;
    pesapi_set_owner_func set_owner;
    pesapi_get_ref_associated_env_func get_ref_associated_env;
    pesapi_get_ref_internal_fields_func get_ref_internal_fields;
    pesapi_get_property_func get_property;
    pesapi_set_property_func set_property;
    pesapi_get_private_func get_private;
    pesapi_set_private_func set_private;
    pesapi_get_property_uint32_func get_property_uint32;
    pesapi_set_property_uint32_func set_property_uint32;
    pesapi_call_function_func call_function;
    pesapi_eval_func eval;
    pesapi_global_func global;
    pesapi_get_env_private_func get_env_private;
    pesapi_set_env_private_func set_env_private;
    pesapi_set_registry_func set_registry;
};

typedef pesapi_registry (*pesapi_create_registry_func)();
typedef pesapi_type_info (*pesapi_alloc_type_infos_func)(size_t count);
typedef void (*pesapi_set_type_info_func)(pesapi_type_info type_infos, size_t index, const char* name, int is_pointer, int is_const, int is_ref, int is_primitive);
typedef pesapi_signature_info (*pesapi_create_signature_info_func)(pesapi_type_info return_type, size_t parameter_count, pesapi_type_info parameter_types);
typedef void (*pesapi_define_class_func)(pesapi_registry registry, const void* type_id, const void* super_type_id, const char* module_name, const char* type_name, pesapi_constructor constructor, pesapi_finalize finalize, void* data, int copy_str);
typedef void (*pesapi_set_property_info_size_func)(pesapi_registry registry, const void* type_id, int method_count, int function_count, int property_count, int variable_count);
typedef void (*pesapi_set_method_info_func)(pesapi_registry registry, const void* type_id, int index, const char* name, int is_static, pesapi_callback method, void* data, int copy_str);
typedef void (*pesapi_set_property_info_func)(pesapi_registry registry, const void* type_id, int index, const char* name, int is_static, pesapi_callback getter, pesapi_callback setter, void* getter_data, void* setter_data, int copy_str);
typedef void* (*pesapi_get_class_data_func)(pesapi_registry registry, const void* type_id, int force_load);
typedef void (*pesapi_on_class_not_found_func)(pesapi_registry registry, pesapi_class_not_found_callback callback);
typedef void (*pesapi_class_type_info_func)(pesapi_registry registry, const char* proto_magic_id, const void* type_id, const void* constructor_info, const void* methods_info, const void* functions_info, const void* properties_info, const void* variables_info);
typedef const void* (*pesapi_find_type_id_func)(pesapi_registry registry, const char* module_name, const char* type_name);
typedef int (*pesapi_trace_native_object_lifecycle_func)(pesapi_registry registry, const void* type_id, pesapi_on_native_object_enter on_enter, pesapi_on_native_object_exit on_exit);

struct pesapi_registry_api
{
    pesapi_create_registry_func create_registry;
    pesapi_alloc_type_infos_func alloc_type_infos;
    pesapi_set_type_info_func set_type_info;
    pesapi_create_signature_info_func create_signature_info;
    pesapi_define_class_func define_class;
    pesapi_set_property_info_size_func set_property_info_size;
    pesapi_set_method_info_func set_method_info;
    pesapi_set_property_info_func set_property_info;
    pesapi_get_class_data_func get_class_data;
    pesapi_on_class_not_found_func on_class_not_found;
    pesapi_class_type_info_func class_type_info;
    pesapi_find_type_id_func find_type_id;
    pesapi_trace_native_object_lifecycle_func trace_native_object_lifecycle;
};

EXTERN_C_END

// Define the complete structure for pesapi_scope__
struct pesapi_scope__ {
    pesapi_env_ref env_ref;
    bool has_exception;
    std::string exception_message;
};

#endif

/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "unityenv_for_puerts.h"
#ifdef EXPERIMENTAL_IL2CPP_PUERTS

#define PESAPI_ADPT_C

#include "pesapi.h"

#ifdef PUERTS_SHARED

EXTERN_C_START

typedef pesapi_value (*pesapi_create_nullType)(pesapi_env env);
static pesapi_create_nullType pesapi_create_null_ptr;
pesapi_value pesapi_create_null (pesapi_env env) {
    return pesapi_create_null_ptr(env);
}

typedef pesapi_value (*pesapi_create_undefinedType)(pesapi_env env);
static pesapi_create_undefinedType pesapi_create_undefined_ptr;
pesapi_value pesapi_create_undefined (pesapi_env env) {
    return pesapi_create_undefined_ptr(env);
}

typedef pesapi_value (*pesapi_create_booleanType)(pesapi_env env, bool value);
static pesapi_create_booleanType pesapi_create_boolean_ptr;
pesapi_value pesapi_create_boolean (pesapi_env env, bool value) {
    return pesapi_create_boolean_ptr(env, value);
}

typedef pesapi_value (*pesapi_create_int32Type)(pesapi_env env, int32_t value);
static pesapi_create_int32Type pesapi_create_int32_ptr;
pesapi_value pesapi_create_int32 (pesapi_env env, int32_t value) {
    return pesapi_create_int32_ptr(env, value);
}

typedef pesapi_value (*pesapi_create_uint32Type)(pesapi_env env, uint32_t value);
static pesapi_create_uint32Type pesapi_create_uint32_ptr;
pesapi_value pesapi_create_uint32 (pesapi_env env, uint32_t value) {
    return pesapi_create_uint32_ptr(env, value);
}

typedef pesapi_value (*pesapi_create_int64Type)(pesapi_env env, int64_t value);
static pesapi_create_int64Type pesapi_create_int64_ptr;
pesapi_value pesapi_create_int64 (pesapi_env env, int64_t value) {
    return pesapi_create_int64_ptr(env, value);
}

typedef pesapi_value (*pesapi_create_uint64Type)(pesapi_env env, uint64_t value);
static pesapi_create_uint64Type pesapi_create_uint64_ptr;
pesapi_value pesapi_create_uint64 (pesapi_env env, uint64_t value) {
    return pesapi_create_uint64_ptr(env, value);
}

typedef pesapi_value (*pesapi_create_doubleType)(pesapi_env env, double value);
static pesapi_create_doubleType pesapi_create_double_ptr;
pesapi_value pesapi_create_double (pesapi_env env, double value) {
    return pesapi_create_double_ptr(env, value);
}

typedef pesapi_value (*pesapi_create_string_utf8Type)(pesapi_env env, const char* str, size_t length);
static pesapi_create_string_utf8Type pesapi_create_string_utf8_ptr;
pesapi_value pesapi_create_string_utf8 (pesapi_env env, const char* str, size_t length) {
    return pesapi_create_string_utf8_ptr(env, str, length);
}

typedef pesapi_value (*pesapi_create_binaryType)(pesapi_env env, void* str, size_t length);
static pesapi_create_binaryType pesapi_create_binary_ptr;
pesapi_value pesapi_create_binary (pesapi_env env, void* str, size_t length) {
    return pesapi_create_binary_ptr(env, str, length);
}

typedef bool (*pesapi_get_value_boolType)(pesapi_env env, pesapi_value value);
static pesapi_get_value_boolType pesapi_get_value_bool_ptr;
bool pesapi_get_value_bool (pesapi_env env, pesapi_value value) {
    return pesapi_get_value_bool_ptr(env, value);
}

typedef int32_t (*pesapi_get_value_int32Type)(pesapi_env env, pesapi_value value);
static pesapi_get_value_int32Type pesapi_get_value_int32_ptr;
int32_t pesapi_get_value_int32 (pesapi_env env, pesapi_value value) {
    return pesapi_get_value_int32_ptr(env, value);
}

typedef uint32_t (*pesapi_get_value_uint32Type)(pesapi_env env, pesapi_value value);
static pesapi_get_value_uint32Type pesapi_get_value_uint32_ptr;
uint32_t pesapi_get_value_uint32 (pesapi_env env, pesapi_value value) {
    return pesapi_get_value_uint32_ptr(env, value);
}

typedef int64_t (*pesapi_get_value_int64Type)(pesapi_env env, pesapi_value value);
static pesapi_get_value_int64Type pesapi_get_value_int64_ptr;
int64_t pesapi_get_value_int64 (pesapi_env env, pesapi_value value) {
    return pesapi_get_value_int64_ptr(env, value);
}

typedef uint64_t (*pesapi_get_value_uint64Type)(pesapi_env env, pesapi_value value);
static pesapi_get_value_uint64Type pesapi_get_value_uint64_ptr;
uint64_t pesapi_get_value_uint64 (pesapi_env env, pesapi_value value) {
    return pesapi_get_value_uint64_ptr(env, value);
}

typedef double (*pesapi_get_value_doubleType)(pesapi_env env, pesapi_value value);
static pesapi_get_value_doubleType pesapi_get_value_double_ptr;
double pesapi_get_value_double (pesapi_env env, pesapi_value value) {
    return pesapi_get_value_double_ptr(env, value);
}

typedef const char* (*pesapi_get_value_string_utf8Type)(pesapi_env env, pesapi_value value, char* buf, size_t* bufsize);
static pesapi_get_value_string_utf8Type pesapi_get_value_string_utf8_ptr;
const char* pesapi_get_value_string_utf8 (pesapi_env env, pesapi_value value, char* buf, size_t* bufsize) {
    return pesapi_get_value_string_utf8_ptr(env, value, buf, bufsize);
}

typedef void* (*pesapi_get_value_binaryType)(pesapi_env env, pesapi_value pvalue, size_t* bufsize);
static pesapi_get_value_binaryType pesapi_get_value_binary_ptr;
void* pesapi_get_value_binary (pesapi_env env, pesapi_value pvalue, size_t* bufsize) {
    return pesapi_get_value_binary_ptr(env, pvalue, bufsize);
}

typedef bool (*pesapi_is_nullType)(pesapi_env env, pesapi_value value);
static pesapi_is_nullType pesapi_is_null_ptr;
bool pesapi_is_null (pesapi_env env, pesapi_value value) {
    return pesapi_is_null_ptr(env, value);
}

typedef bool (*pesapi_is_undefinedType)(pesapi_env env, pesapi_value value);
static pesapi_is_undefinedType pesapi_is_undefined_ptr;
bool pesapi_is_undefined (pesapi_env env, pesapi_value value) {
    return pesapi_is_undefined_ptr(env, value);
}

typedef bool (*pesapi_is_booleanType)(pesapi_env env, pesapi_value value);
static pesapi_is_booleanType pesapi_is_boolean_ptr;
bool pesapi_is_boolean (pesapi_env env, pesapi_value value) {
    return pesapi_is_boolean_ptr(env, value);
}

typedef bool (*pesapi_is_int32Type)(pesapi_env env, pesapi_value value);
static pesapi_is_int32Type pesapi_is_int32_ptr;
bool pesapi_is_int32 (pesapi_env env, pesapi_value value) {
    return pesapi_is_int32_ptr(env, value);
}

typedef bool (*pesapi_is_uint32Type)(pesapi_env env, pesapi_value value);
static pesapi_is_uint32Type pesapi_is_uint32_ptr;
bool pesapi_is_uint32 (pesapi_env env, pesapi_value value) {
    return pesapi_is_uint32_ptr(env, value);
}

typedef bool (*pesapi_is_int64Type)(pesapi_env env, pesapi_value value);
static pesapi_is_int64Type pesapi_is_int64_ptr;
bool pesapi_is_int64 (pesapi_env env, pesapi_value value) {
    return pesapi_is_int64_ptr(env, value);
}

typedef bool (*pesapi_is_uint64Type)(pesapi_env env, pesapi_value value);
static pesapi_is_uint64Type pesapi_is_uint64_ptr;
bool pesapi_is_uint64 (pesapi_env env, pesapi_value value) {
    return pesapi_is_uint64_ptr(env, value);
}

typedef bool (*pesapi_is_doubleType)(pesapi_env env, pesapi_value value);
static pesapi_is_doubleType pesapi_is_double_ptr;
bool pesapi_is_double (pesapi_env env, pesapi_value value) {
    return pesapi_is_double_ptr(env, value);
}

typedef bool (*pesapi_is_stringType)(pesapi_env env, pesapi_value value);
static pesapi_is_stringType pesapi_is_string_ptr;
bool pesapi_is_string (pesapi_env env, pesapi_value value) {
    return pesapi_is_string_ptr(env, value);
}

typedef bool (*pesapi_is_objectType)(pesapi_env env, pesapi_value value);
static pesapi_is_objectType pesapi_is_object_ptr;
bool pesapi_is_object (pesapi_env env, pesapi_value value) {
    return pesapi_is_object_ptr(env, value);
}

typedef bool (*pesapi_is_functionType)(pesapi_env env, pesapi_value value);
static pesapi_is_functionType pesapi_is_function_ptr;
bool pesapi_is_function (pesapi_env env, pesapi_value value) {
    return pesapi_is_function_ptr(env, value);
}

typedef bool (*pesapi_is_binaryType)(pesapi_env env, pesapi_value value);
static pesapi_is_binaryType pesapi_is_binary_ptr;
bool pesapi_is_binary (pesapi_env env, pesapi_value value) {
    return pesapi_is_binary_ptr(env, value);
}

typedef pesapi_value (*pesapi_create_native_objectType)(pesapi_env env, const void* class_id, void* object_ptr, bool copy);
static pesapi_create_native_objectType pesapi_create_native_object_ptr;
pesapi_value pesapi_create_native_object (pesapi_env env, const void* class_id, void* object_ptr, bool copy) {
    return pesapi_create_native_object_ptr(env, class_id, object_ptr, copy);
}

typedef void* (*pesapi_get_native_object_ptrType)(pesapi_env env, pesapi_value value);
static pesapi_get_native_object_ptrType pesapi_get_native_object_ptr_ptr;
void* pesapi_get_native_object_ptr (pesapi_env env, pesapi_value value) {
    return pesapi_get_native_object_ptr_ptr(env, value);
}

typedef const void* (*pesapi_get_native_object_typeidType)(pesapi_env env, pesapi_value value);
static pesapi_get_native_object_typeidType pesapi_get_native_object_typeid_ptr;
const void* pesapi_get_native_object_typeid (pesapi_env env, pesapi_value value) {
    return pesapi_get_native_object_typeid_ptr(env, value);
}

typedef bool (*pesapi_is_native_objectType)(pesapi_env env, const void* class_id, pesapi_value value);
static pesapi_is_native_objectType pesapi_is_native_object_ptr;
bool pesapi_is_native_object (pesapi_env env, const void* class_id, pesapi_value value) {
    return pesapi_is_native_object_ptr(env, class_id, value);
}

typedef pesapi_value (*pesapi_create_refType)(pesapi_env env, pesapi_value value);
static pesapi_create_refType pesapi_create_ref_ptr;
pesapi_value pesapi_create_ref (pesapi_env env, pesapi_value value) {
    return pesapi_create_ref_ptr(env, value);
}

typedef pesapi_value (*pesapi_get_value_refType)(pesapi_env env, pesapi_value value);
static pesapi_get_value_refType pesapi_get_value_ref_ptr;
pesapi_value pesapi_get_value_ref (pesapi_env env, pesapi_value value) {
    return pesapi_get_value_ref_ptr(env, value);
}

typedef void (*pesapi_update_value_refType)(pesapi_env env, pesapi_value ref, pesapi_value value);
static pesapi_update_value_refType pesapi_update_value_ref_ptr;
void pesapi_update_value_ref (pesapi_env env, pesapi_value ref, pesapi_value value) {
    pesapi_update_value_ref_ptr(env, ref, value);
}

typedef bool (*pesapi_is_refType)(pesapi_env env, pesapi_value value);
static pesapi_is_refType pesapi_is_ref_ptr;
bool pesapi_is_ref (pesapi_env env, pesapi_value value) {
    return pesapi_is_ref_ptr(env, value);
}

typedef int (*pesapi_get_args_lenType)(pesapi_callback_info info);
static pesapi_get_args_lenType pesapi_get_args_len_ptr;
int pesapi_get_args_len (pesapi_callback_info info) {
    return pesapi_get_args_len_ptr(info);
}

typedef pesapi_value (*pesapi_get_argType)(pesapi_callback_info info, int index);
static pesapi_get_argType pesapi_get_arg_ptr;
pesapi_value pesapi_get_arg (pesapi_callback_info info, int index) {
    return pesapi_get_arg_ptr(info, index);
}

typedef pesapi_env (*pesapi_get_envType)(pesapi_callback_info info);
static pesapi_get_envType pesapi_get_env_ptr;
pesapi_env pesapi_get_env (pesapi_callback_info info) {
    return pesapi_get_env_ptr(info);
}

typedef pesapi_value (*pesapi_get_thisType)(pesapi_callback_info info);
static pesapi_get_thisType pesapi_get_this_ptr;
pesapi_value pesapi_get_this (pesapi_callback_info info) {
    return pesapi_get_this_ptr(info);
}

typedef pesapi_value (*pesapi_get_holderType)(pesapi_callback_info info);
static pesapi_get_holderType pesapi_get_holder_ptr;
pesapi_value pesapi_get_holder (pesapi_callback_info info) {
    return pesapi_get_holder_ptr(info);
}

typedef void* (*pesapi_get_userdataType)(pesapi_callback_info info);
static pesapi_get_userdataType pesapi_get_userdata_ptr;
void* pesapi_get_userdata (pesapi_callback_info info) {
    return pesapi_get_userdata_ptr(info);
}

typedef void* (*pesapi_get_constructor_userdataType)(pesapi_callback_info info);
static pesapi_get_constructor_userdataType pesapi_get_constructor_userdata_ptr;
void* pesapi_get_constructor_userdata (pesapi_callback_info info) {
    return pesapi_get_constructor_userdata_ptr(info);
}

typedef void (*pesapi_add_returnType)(pesapi_callback_info info, pesapi_value value);
static pesapi_add_returnType pesapi_add_return_ptr;
void pesapi_add_return (pesapi_callback_info info, pesapi_value value) {
    pesapi_add_return_ptr(info, value);
}

typedef void (*pesapi_throw_by_stringType)(pesapi_callback_info pinfo, const char* msg);
static pesapi_throw_by_stringType pesapi_throw_by_string_ptr;
void pesapi_throw_by_string (pesapi_callback_info pinfo, const char* msg) {
    pesapi_throw_by_string_ptr(pinfo, msg);
}

typedef pesapi_env_holder (*pesapi_hold_envType)(pesapi_env env);
static pesapi_hold_envType pesapi_hold_env_ptr;
pesapi_env_holder pesapi_hold_env (pesapi_env env) {
    return pesapi_hold_env_ptr(env);
}

typedef pesapi_env (*pesapi_get_env_from_holderType)(pesapi_env_holder env_holder);
static pesapi_get_env_from_holderType pesapi_get_env_from_holder_ptr;
pesapi_env pesapi_get_env_from_holder (pesapi_env_holder env_holder) {
    return pesapi_get_env_from_holder_ptr(env_holder);
}

typedef pesapi_env_holder (*pesapi_duplicate_env_holderType)(pesapi_env_holder env_holder);
static pesapi_duplicate_env_holderType pesapi_duplicate_env_holder_ptr;
pesapi_env_holder pesapi_duplicate_env_holder (pesapi_env_holder env_holder) {
    return pesapi_duplicate_env_holder_ptr(env_holder);
}

typedef void (*pesapi_release_env_holderType)(pesapi_env_holder env_holder);
static pesapi_release_env_holderType pesapi_release_env_holder_ptr;
void pesapi_release_env_holder (pesapi_env_holder env_holder) {
    pesapi_release_env_holder_ptr(env_holder);
}

typedef pesapi_scope (*pesapi_open_scopeType)(pesapi_env_holder env_holder);
static pesapi_open_scopeType pesapi_open_scope_ptr;
pesapi_scope pesapi_open_scope (pesapi_env_holder env_holder) {
    return pesapi_open_scope_ptr(env_holder);
}

typedef bool (*pesapi_has_caughtType)(pesapi_scope scope);
static pesapi_has_caughtType pesapi_has_caught_ptr;
bool pesapi_has_caught (pesapi_scope scope) {
    return pesapi_has_caught_ptr(scope);
}

typedef const char* (*pesapi_get_exception_as_stringType)(pesapi_scope scope, bool with_stack);
static pesapi_get_exception_as_stringType pesapi_get_exception_as_string_ptr;
const char* pesapi_get_exception_as_string (pesapi_scope scope, bool with_stack) {
    return pesapi_get_exception_as_string_ptr(scope, with_stack);
}

typedef void (*pesapi_close_scopeType)(pesapi_scope scope);
static pesapi_close_scopeType pesapi_close_scope_ptr;
void pesapi_close_scope (pesapi_scope scope) {
    pesapi_close_scope_ptr(scope);
}

typedef pesapi_value_holder (*pesapi_hold_valueType)(pesapi_env env, pesapi_value value);
static pesapi_hold_valueType pesapi_hold_value_ptr;
pesapi_value_holder pesapi_hold_value (pesapi_env env, pesapi_value value) {
    return pesapi_hold_value_ptr(env, value);
}

typedef pesapi_value_holder (*pesapi_duplicate_value_holderType)(pesapi_value_holder value_holder);
static pesapi_duplicate_value_holderType pesapi_duplicate_value_holder_ptr;
pesapi_value_holder pesapi_duplicate_value_holder (pesapi_value_holder value_holder) {
    return pesapi_duplicate_value_holder_ptr(value_holder);
}

typedef void (*pesapi_release_value_holderType)(pesapi_value_holder value_holder);
static pesapi_release_value_holderType pesapi_release_value_holder_ptr;
void pesapi_release_value_holder (pesapi_value_holder value_holder) {
    pesapi_release_value_holder_ptr(value_holder);
}

typedef pesapi_value (*pesapi_get_value_from_holderType)(pesapi_env env, pesapi_value_holder value_holder);
static pesapi_get_value_from_holderType pesapi_get_value_from_holder_ptr;
pesapi_value pesapi_get_value_from_holder (pesapi_env env, pesapi_value_holder value_holder) {
    return pesapi_get_value_from_holder_ptr(env, value_holder);
}

typedef pesapi_value (*pesapi_get_propertyType)(pesapi_env env, pesapi_value object, const char* key);
static pesapi_get_propertyType pesapi_get_property_ptr;
pesapi_value pesapi_get_property (pesapi_env env, pesapi_value object, const char* key) {
    return pesapi_get_property_ptr(env, object, key);
}

typedef void (*pesapi_set_propertyType)(pesapi_env env, pesapi_value object, const char* key, pesapi_value value);
static pesapi_set_propertyType pesapi_set_property_ptr;
void pesapi_set_property (pesapi_env env, pesapi_value object, const char* key, pesapi_value value) {
    pesapi_set_property_ptr(env, object, key, value);
}

typedef pesapi_value (*pesapi_get_property_uint32Type)(pesapi_env env, pesapi_value object, uint32_t key);
static pesapi_get_property_uint32Type pesapi_get_property_uint32_ptr;
pesapi_value pesapi_get_property_uint32 (pesapi_env env, pesapi_value object, uint32_t key) {
    return pesapi_get_property_uint32_ptr(env, object, key);
}

typedef void (*pesapi_set_property_uint32Type)(pesapi_env env, pesapi_value object, uint32_t key, pesapi_value value);
static pesapi_set_property_uint32Type pesapi_set_property_uint32_ptr;
void pesapi_set_property_uint32 (pesapi_env env, pesapi_value object, uint32_t key, pesapi_value value) {
    pesapi_set_property_uint32_ptr(env, object, key, value);
}

typedef pesapi_value (*pesapi_call_functionType)(pesapi_env env, pesapi_value func, pesapi_value this_object, int argc, const pesapi_value argv[]);
static pesapi_call_functionType pesapi_call_function_ptr;
pesapi_value pesapi_call_function (pesapi_env env, pesapi_value func, pesapi_value this_object, int argc, const pesapi_value argv[]) {
    return pesapi_call_function_ptr(env, func, this_object, argc, argv);
}

typedef pesapi_value (*pesapi_evalType)(pesapi_env env, const uint8_t* code, size_t code_size, const char* path);
static pesapi_evalType pesapi_eval_ptr;
pesapi_value pesapi_eval (pesapi_env env, const uint8_t* code, size_t code_size, const char* path) {
    return pesapi_eval_ptr(env, code, code_size, path);
}

typedef pesapi_type_info (*pesapi_alloc_type_infosType)(size_t count);
static pesapi_alloc_type_infosType pesapi_alloc_type_infos_ptr;
pesapi_type_info pesapi_alloc_type_infos (size_t count) {
    return pesapi_alloc_type_infos_ptr(count);
}

typedef void (*pesapi_set_type_infoType)(pesapi_type_info type_infos, size_t index, const char* name, bool is_pointer, bool is_const, bool is_ref, bool is_primitive);
static pesapi_set_type_infoType pesapi_set_type_info_ptr;
void pesapi_set_type_info (pesapi_type_info type_infos, size_t index, const char* name, bool is_pointer, bool is_const, bool is_ref, bool is_primitive) {
    pesapi_set_type_info_ptr(type_infos, index, name, is_pointer, is_const, is_ref, is_primitive);
}

typedef pesapi_signature_info (*pesapi_create_signature_infoType)(pesapi_type_info return_type, size_t parameter_count, pesapi_type_info parameter_types);
static pesapi_create_signature_infoType pesapi_create_signature_info_ptr;
pesapi_signature_info pesapi_create_signature_info (pesapi_type_info return_type, size_t parameter_count, pesapi_type_info parameter_types) {
    return pesapi_create_signature_info_ptr(return_type, parameter_count, parameter_types);
}

typedef pesapi_property_descriptor (*pesapi_alloc_property_descriptorsType)(size_t count);
static pesapi_alloc_property_descriptorsType pesapi_alloc_property_descriptors_ptr;
pesapi_property_descriptor pesapi_alloc_property_descriptors (size_t count) {
    return pesapi_alloc_property_descriptors_ptr(count);
}

typedef void (*pesapi_set_method_infoType)(pesapi_property_descriptor properties, size_t index, const char* name, bool is_static,pesapi_callback method, void* userdata, pesapi_signature_info signature_info);
static pesapi_set_method_infoType pesapi_set_method_info_ptr;
void pesapi_set_method_info (pesapi_property_descriptor properties, size_t index, const char* name, bool is_static,pesapi_callback method, void* userdata, pesapi_signature_info signature_info) {
    pesapi_set_method_info_ptr(properties, index, name, is_static, method, userdata, signature_info);
}

typedef void (*pesapi_set_property_infoType)(pesapi_property_descriptor properties, size_t index, const char* name, bool is_static,pesapi_callback getter, pesapi_callback setter, void* userdata, pesapi_type_info type_info);
static pesapi_set_property_infoType pesapi_set_property_info_ptr;
void pesapi_set_property_info (pesapi_property_descriptor properties, size_t index, const char* name, bool is_static,pesapi_callback getter, pesapi_callback setter, void* userdata, pesapi_type_info type_info) {
    pesapi_set_property_info_ptr(properties, index, name, is_static, getter, setter, userdata, type_info);
}

typedef void (*pesapi_define_classType)(const void* type_id, const void* super_type_id, const char* type_name,pesapi_constructor constructor, pesapi_finalize finalize, size_t property_count, pesapi_property_descriptor properties,void* userdata);
static pesapi_define_classType pesapi_define_class_ptr;
void pesapi_define_class (const void* type_id, const void* super_type_id, const char* type_name,pesapi_constructor constructor, pesapi_finalize finalize, size_t property_count, pesapi_property_descriptor properties,void* userdata) {
    pesapi_define_class_ptr(type_id, super_type_id, type_name, constructor, finalize, property_count, properties, userdata);
}


#endif

void pesapi_init(pesapi_func_ptr* func_array){
#ifdef PUERTS_SHARED
    pesapi_create_null_ptr = (pesapi_create_nullType)func_array[0];
    pesapi_create_undefined_ptr = (pesapi_create_undefinedType)func_array[1];
    pesapi_create_boolean_ptr = (pesapi_create_booleanType)func_array[2];
    pesapi_create_int32_ptr = (pesapi_create_int32Type)func_array[3];
    pesapi_create_uint32_ptr = (pesapi_create_uint32Type)func_array[4];
    pesapi_create_int64_ptr = (pesapi_create_int64Type)func_array[5];
    pesapi_create_uint64_ptr = (pesapi_create_uint64Type)func_array[6];
    pesapi_create_double_ptr = (pesapi_create_doubleType)func_array[7];
    pesapi_create_string_utf8_ptr = (pesapi_create_string_utf8Type)func_array[8];
    pesapi_create_binary_ptr = (pesapi_create_binaryType)func_array[9];
    pesapi_get_value_bool_ptr = (pesapi_get_value_boolType)func_array[10];
    pesapi_get_value_int32_ptr = (pesapi_get_value_int32Type)func_array[11];
    pesapi_get_value_uint32_ptr = (pesapi_get_value_uint32Type)func_array[12];
    pesapi_get_value_int64_ptr = (pesapi_get_value_int64Type)func_array[13];
    pesapi_get_value_uint64_ptr = (pesapi_get_value_uint64Type)func_array[14];
    pesapi_get_value_double_ptr = (pesapi_get_value_doubleType)func_array[15];
    pesapi_get_value_string_utf8_ptr = (pesapi_get_value_string_utf8Type)func_array[16];
    pesapi_get_value_binary_ptr = (pesapi_get_value_binaryType)func_array[17];
    pesapi_is_null_ptr = (pesapi_is_nullType)func_array[18];
    pesapi_is_undefined_ptr = (pesapi_is_undefinedType)func_array[19];
    pesapi_is_boolean_ptr = (pesapi_is_booleanType)func_array[20];
    pesapi_is_int32_ptr = (pesapi_is_int32Type)func_array[21];
    pesapi_is_uint32_ptr = (pesapi_is_uint32Type)func_array[22];
    pesapi_is_int64_ptr = (pesapi_is_int64Type)func_array[23];
    pesapi_is_uint64_ptr = (pesapi_is_uint64Type)func_array[24];
    pesapi_is_double_ptr = (pesapi_is_doubleType)func_array[25];
    pesapi_is_string_ptr = (pesapi_is_stringType)func_array[26];
    pesapi_is_object_ptr = (pesapi_is_objectType)func_array[27];
    pesapi_is_function_ptr = (pesapi_is_functionType)func_array[28];
    pesapi_is_binary_ptr = (pesapi_is_binaryType)func_array[29];
    pesapi_create_native_object_ptr = (pesapi_create_native_objectType)func_array[30];
    pesapi_get_native_object_ptr_ptr = (pesapi_get_native_object_ptrType)func_array[31];
    pesapi_get_native_object_typeid_ptr = (pesapi_get_native_object_typeidType)func_array[32];
    pesapi_is_native_object_ptr = (pesapi_is_native_objectType)func_array[33];
    pesapi_create_ref_ptr = (pesapi_create_refType)func_array[34];
    pesapi_get_value_ref_ptr = (pesapi_get_value_refType)func_array[35];
    pesapi_update_value_ref_ptr = (pesapi_update_value_refType)func_array[36];
    pesapi_is_ref_ptr = (pesapi_is_refType)func_array[37];
    pesapi_get_args_len_ptr = (pesapi_get_args_lenType)func_array[38];
    pesapi_get_arg_ptr = (pesapi_get_argType)func_array[39];
    pesapi_get_env_ptr = (pesapi_get_envType)func_array[40];
    pesapi_get_this_ptr = (pesapi_get_thisType)func_array[41];
    pesapi_get_holder_ptr = (pesapi_get_holderType)func_array[42];
    pesapi_get_userdata_ptr = (pesapi_get_userdataType)func_array[43];
    pesapi_get_constructor_userdata_ptr = (pesapi_get_constructor_userdataType)func_array[44];
    pesapi_add_return_ptr = (pesapi_add_returnType)func_array[45];
    pesapi_throw_by_string_ptr = (pesapi_throw_by_stringType)func_array[46];
    pesapi_hold_env_ptr = (pesapi_hold_envType)func_array[47];
    pesapi_get_env_from_holder_ptr = (pesapi_get_env_from_holderType)func_array[48];
    pesapi_duplicate_env_holder_ptr = (pesapi_duplicate_env_holderType)func_array[49];
    pesapi_release_env_holder_ptr = (pesapi_release_env_holderType)func_array[50];
    pesapi_open_scope_ptr = (pesapi_open_scopeType)func_array[51];
    pesapi_has_caught_ptr = (pesapi_has_caughtType)func_array[52];
    pesapi_get_exception_as_string_ptr = (pesapi_get_exception_as_stringType)func_array[53];
    pesapi_close_scope_ptr = (pesapi_close_scopeType)func_array[54];
    pesapi_hold_value_ptr = (pesapi_hold_valueType)func_array[55];
    pesapi_duplicate_value_holder_ptr = (pesapi_duplicate_value_holderType)func_array[56];
    pesapi_release_value_holder_ptr = (pesapi_release_value_holderType)func_array[57];
    pesapi_get_value_from_holder_ptr = (pesapi_get_value_from_holderType)func_array[58];
    pesapi_get_property_ptr = (pesapi_get_propertyType)func_array[59];
    pesapi_set_property_ptr = (pesapi_set_propertyType)func_array[60];
    pesapi_get_property_uint32_ptr = (pesapi_get_property_uint32Type)func_array[61];
    pesapi_set_property_uint32_ptr = (pesapi_set_property_uint32Type)func_array[62];
    pesapi_call_function_ptr = (pesapi_call_functionType)func_array[63];
    pesapi_eval_ptr = (pesapi_evalType)func_array[64];
    pesapi_alloc_type_infos_ptr = (pesapi_alloc_type_infosType)func_array[65];
    pesapi_set_type_info_ptr = (pesapi_set_type_infoType)func_array[66];
    pesapi_create_signature_info_ptr = (pesapi_create_signature_infoType)func_array[67];
    pesapi_alloc_property_descriptors_ptr = (pesapi_alloc_property_descriptorsType)func_array[68];
    pesapi_set_method_info_ptr = (pesapi_set_method_infoType)func_array[69];
    pesapi_set_property_info_ptr = (pesapi_set_property_infoType)func_array[70];
    pesapi_define_class_ptr = (pesapi_define_classType)func_array[71];

#endif
}

EXTERN_C_END
#endif //EXPERIMENTAL_IL2CPP_PUERTS
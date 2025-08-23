/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#ifndef PESAPI_PYTHON_IMPL_H_
#define PESAPI_PYTHON_IMPL_H_

#include "pesapi.h"
#include <Python.h>

namespace pesapi
{
namespace pythonimpl
{

pesapi_value pesapi_create_int32(pesapi_env env, int32_t value);
pesapi_value pesapi_create_boolean(pesapi_env env, int value);
pesapi_value pesapi_create_string_utf8(pesapi_env env, const char* str, size_t length);
pesapi_value pesapi_create_double(pesapi_env env, double value);
pesapi_value pesapi_create_array(pesapi_env env);
pesapi_value pesapi_create_object(pesapi_env env);
pesapi_value pesapi_create_null(pesapi_env env);
pesapi_value pesapi_create_undefined(pesapi_env env);
pesapi_value pesapi_create_uint32(pesapi_env env, uint32_t value);
pesapi_value pesapi_create_int64(pesapi_env env, int64_t value);
pesapi_value pesapi_create_uint64(pesapi_env env, uint64_t value);
pesapi_value pesapi_create_string_utf16(pesapi_env env, const uint16_t* str, size_t length);
pesapi_value pesapi_create_binary(pesapi_env env, void* data, size_t length);
pesapi_value pesapi_create_binary_by_value(pesapi_env env, void* data, size_t length);
pesapi_value pesapi_create_function(pesapi_env env, pesapi_callback native_impl, void* data, pesapi_function_finalize finalize);
pesapi_value pesapi_create_class(pesapi_env env, const void* type_id);
double pesapi_get_value_double(pesapi_env env, pesapi_value value);
uint32_t pesapi_get_array_length(pesapi_env env, pesapi_value value);
int pesapi_is_null(pesapi_env env, pesapi_value value);
int pesapi_is_boolean(pesapi_env env, pesapi_value value);
int pesapi_is_int32(pesapi_env env, pesapi_value value);
int pesapi_get_value_bool(pesapi_env env, pesapi_value value);
int32_t pesapi_get_value_int32(pesapi_env env, pesapi_value value);
uint32_t pesapi_get_value_uint32(pesapi_env env, pesapi_value value);
int64_t pesapi_get_value_int64(pesapi_env env, pesapi_value value);
uint64_t pesapi_get_value_uint64(pesapi_env env, pesapi_value value);
int pesapi_is_undefined(pesapi_env env, pesapi_value value);
int pesapi_is_string(pesapi_env env, pesapi_value value);
int pesapi_is_object(pesapi_env env, pesapi_value value);
int pesapi_is_function(pesapi_env env, pesapi_value value);
int pesapi_is_binary(pesapi_env env, pesapi_value value);
int pesapi_is_array(pesapi_env env, pesapi_value value);
int pesapi_is_uint32(pesapi_env env, pesapi_value value);
int pesapi_is_int64(pesapi_env env, pesapi_value value);
int pesapi_is_uint64(pesapi_env env, pesapi_value value);
int pesapi_is_double(pesapi_env env, pesapi_value value);
pesapi_value pesapi_native_object_to_value(pesapi_env env, const void* type_id, void* object_ptr, int call_finalize);
void* pesapi_get_native_object_ptr(pesapi_env env, pesapi_value value);
const void* pesapi_get_native_object_typeid(pesapi_env env, pesapi_value value);
int pesapi_is_instance_of(pesapi_env env, const void* type_id, pesapi_value value);
pesapi_value pesapi_boxing(pesapi_env env, pesapi_value value);
pesapi_value_ref pesapi_get_value_ref(pesapi_env env, pesapi_value value);
pesapi_value_ref pesapi_create_value_ref(pesapi_env env, pesapi_value value);
void pesapi_release_value_ref(pesapi_env env, pesapi_value_ref value_ref);
pesapi_value pesapi_get_value_from_ref(pesapi_env env, pesapi_value_ref value_ref);
int pesapi_is_value_ref_valid(pesapi_env env, pesapi_value_ref value_ref);
pesapi_scope pesapi_open_scope(pesapi_env_ref env_ref);
int pesapi_has_caught(pesapi_scope scope);
pesapi_value pesapi_call_function(pesapi_env env, pesapi_value func, pesapi_value this_object, int argc, const pesapi_value argv[]);
pesapi_value pesapi_eval(pesapi_env env, const uint8_t* code, size_t code_size, const char* path);
pesapi_value pesapi_global(pesapi_env env);
pesapi_scope pesapi_open_scope_placement(pesapi_env_ref env_ref, struct pesapi_scope_memory* memory);
const char* pesapi_get_exception_as_string(pesapi_scope scope, int with_stack);
void pesapi_close_scope(pesapi_scope scope);
void pesapi_close_scope_placement(pesapi_scope scope);
pesapi_value_ref pesapi_duplicate_value_ref(pesapi_value_ref value_ref);
void pesapi_set_ref_weak(pesapi_env env, pesapi_value_ref value_ref);
int pesapi_set_owner(pesapi_env env, pesapi_value value, pesapi_value owner);
pesapi_env_ref pesapi_get_ref_associated_env(pesapi_value_ref value_ref);
void** pesapi_get_ref_internal_fields(pesapi_value_ref value_ref, uint32_t* pinternal_field_count);
pesapi_value pesapi_get_property(pesapi_env env, pesapi_value object, const char* key);
int pesapi_set_property(pesapi_env env, pesapi_value object, const char* key, pesapi_value value);
int pesapi_get_private(pesapi_env env, pesapi_value object, void** out_ptr);
int pesapi_set_private(pesapi_env env, pesapi_value object, void* ptr);
pesapi_value pesapi_get_property_uint32(pesapi_env env, pesapi_value object, uint32_t key);
int pesapi_set_property_uint32(pesapi_env env, pesapi_value object, uint32_t key, pesapi_value value);
const void* pesapi_get_env_private(pesapi_env env);
void pesapi_set_env_private(pesapi_env env, const void* ptr);
void pesapi_set_registry(pesapi_env env, pesapi_registry registry);

} // namespace pythonimpl
} // namespace pesapi

#endif // PESAPI_PYTHON_IMPL_H_

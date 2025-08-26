#pragma once
#include "pesapi.h"
#include "PythonEnv.h"
#include "CppObjectMapperPython.h"
#include <Python.h>
#include <map>
#include <memory>
#include <string>

namespace pesapi
{
namespace pythonimpl
{

pesapi_env_ref CreatePythonEnvRef();
void DestroyPythonEnvRef(pesapi_env_ref env_ref);
void RunGC(pesapi_env_ref env_ref);

pesapi_value pesapi_create_null(pesapi_env env);
pesapi_value pesapi_create_undefined(pesapi_env env);
pesapi_value pesapi_create_boolean(pesapi_env env, int value);
pesapi_value pesapi_create_int32(pesapi_env env, int32_t value);
pesapi_value pesapi_create_uint32(pesapi_env env, uint32_t value);
pesapi_value pesapi_create_int64(pesapi_env env, int64_t value);
pesapi_value pesapi_create_uint64(pesapi_env env, uint64_t value);
pesapi_value pesapi_create_double(pesapi_env env, double value);
pesapi_value pesapi_create_string_utf8(pesapi_env env, const char* str, size_t length);
pesapi_value pesapi_create_string_utf16(pesapi_env env, const uint16_t* str, size_t length);
pesapi_value pesapi_create_binary(pesapi_env env, void* bin, size_t length);
pesapi_value pesapi_create_binary_by_value(pesapi_env env, void* bin, size_t length);
pesapi_value pesapi_create_array(pesapi_env env);
pesapi_value pesapi_create_object(pesapi_env env);
pesapi_value pesapi_create_function(pesapi_env env, pesapi_callback native_impl, void* data, pesapi_function_finalize finalize);
pesapi_value pesapi_create_class(pesapi_env env, const void* type_id);

int pesapi_get_value_bool(pesapi_env env, pesapi_value value);
int32_t pesapi_get_value_int32(pesapi_env env, pesapi_value value);
uint32_t pesapi_get_value_uint32(pesapi_env env, pesapi_value value);
int64_t pesapi_get_value_int64(pesapi_env env, pesapi_value value);
uint64_t pesapi_get_value_uint64(pesapi_env env, pesapi_value value);
double pesapi_get_value_double(pesapi_env env, pesapi_value value);
const char* pesapi_get_value_string_utf8(pesapi_env env, pesapi_value value, char* buf, size_t* bufsize);
const uint16_t* pesapi_get_value_string_utf16(pesapi_env env, pesapi_value value, uint16_t* buf, size_t* bufsize);
void* pesapi_get_value_binary(pesapi_env env, pesapi_value value, size_t* bufsize);
uint32_t pesapi_get_array_length(pesapi_env env, pesapi_value value);

int pesapi_is_null(pesapi_env env, pesapi_value value);
int pesapi_is_undefined(pesapi_env env, pesapi_value value);
int pesapi_is_boolean(pesapi_env env, pesapi_value value);
int pesapi_is_int32(pesapi_env env, pesapi_value value);
int pesapi_is_uint32(pesapi_env env, pesapi_value value);
int pesapi_is_int64(pesapi_env env, pesapi_value value);
int pesapi_is_uint64(pesapi_env env, pesapi_value value);
int pesapi_is_double(pesapi_env env, pesapi_value value);
int pesapi_is_string(pesapi_env env, pesapi_value value);
int pesapi_is_object(pesapi_env env, pesapi_value value);
int pesapi_is_function(pesapi_env env, pesapi_value value);
int pesapi_is_binary(pesapi_env env, pesapi_value value);
int pesapi_is_array(pesapi_env env, pesapi_value value);

pesapi_value pesapi_call_function(pesapi_env env, pesapi_value func, pesapi_value this_object, int argc, const pesapi_value argv[]);

pesapi_value pesapi_get_property(pesapi_env env, pesapi_value object, const char* name);
void pesapi_set_property(pesapi_env env, pesapi_value object, const char* name, pesapi_value value);

void pesapi_set_array_element(pesapi_env env, pesapi_value array, uint32_t index, pesapi_value value);
pesapi_value pesapi_get_array_element(pesapi_env env, pesapi_value array, uint32_t index);

pesapi_value pesapi_native_object_to_value(pesapi_env env, const void* type_id, void* object_ptr, int call_finalize);
void* pesapi_get_native_object_ptr(pesapi_env env, pesapi_value value);
const void* pesapi_get_native_object_typeid(pesapi_env env, pesapi_value value);
int pesapi_is_instance_of(pesapi_env env, const void* type_id, pesapi_value value);
pesapi_value pesapi_boxing(pesapi_env env, pesapi_value value);
pesapi_value pesapi_unboxing(pesapi_env env, pesapi_value value);
void pesapi_update_boxed_value(pesapi_env env, pesapi_value boxed_value, pesapi_value value);
int pesapi_is_boxed_value(pesapi_env env, pesapi_value value);
int pesapi_get_args_len(pesapi_callback_info info);
pesapi_value pesapi_get_arg(pesapi_callback_info info, int index);
pesapi_env pesapi_get_env(pesapi_callback_info info);
void* pesapi_get_native_holder_ptr(pesapi_callback_info info);
const void* pesapi_get_native_holder_typeid(pesapi_callback_info info);
void* pesapi_get_userdata(pesapi_callback_info info);
void pesapi_add_return(pesapi_callback_info info, pesapi_value value);
void pesapi_throw_by_string(pesapi_callback_info pinfo, const char* msg);
pesapi_env_ref pesapi_create_env_ref(pesapi_env env);
int pesapi_env_ref_is_valid(pesapi_env_ref env);
pesapi_env pesapi_get_env_from_ref(pesapi_env_ref env_ref);
pesapi_env_ref pesapi_duplicate_env_ref(pesapi_env_ref env_ref);
void pesapi_release_env_ref(pesapi_env_ref env_ref);
pesapi_scope pesapi_open_scope(pesapi_env_ref env_ref);
pesapi_scope pesapi_open_scope_placement(pesapi_env_ref env_ref, struct pesapi_scope_memory* memory);
int pesapi_has_caught(pesapi_scope scope);
const char* pesapi_get_exception_as_string(pesapi_scope scope, int with_stack);
void pesapi_close_scope(pesapi_scope scope);
void pesapi_close_scope_placement(pesapi_scope scope);
pesapi_value_ref pesapi_create_value_ref(pesapi_env env, pesapi_value value, uint32_t internal_field_count);
pesapi_value_ref pesapi_duplicate_value_ref(pesapi_value_ref value_ref);
void pesapi_release_value_ref(pesapi_value_ref value_ref);
pesapi_value pesapi_get_value_from_ref(pesapi_env env, pesapi_value_ref value_ref);
void pesapi_set_ref_weak(pesapi_env env, pesapi_value_ref value_ref);
int pesapi_set_owner(pesapi_env env, pesapi_value value, pesapi_value owner);
pesapi_env_ref pesapi_get_ref_associated_env(pesapi_value_ref value_ref);
void** pesapi_get_ref_internal_fields(pesapi_value_ref value_ref, uint32_t* pinternal_field_count);
int pesapi_get_private(pesapi_env env, pesapi_value object, void** out_ptr);
int pesapi_set_private(pesapi_env env, pesapi_value object, void* ptr);
pesapi_value pesapi_get_property_uint32(pesapi_env env, pesapi_value object, uint32_t key);
void pesapi_set_property_uint32(pesapi_env env, pesapi_value object, uint32_t key, pesapi_value value);
pesapi_value pesapi_eval(pesapi_env env, const uint8_t* code, size_t code_size, const char* path);
pesapi_value pesapi_global(pesapi_env env);
const void* pesapi_get_env_private(pesapi_env env);
void pesapi_set_env_private(pesapi_env env, const void* ptr);
void pesapi_set_registry(pesapi_env env, pesapi_registry registry);
extern pesapi_ffi g_pesapi_ffi;
PESAPI_MODULE_EXPORT pesapi_env_ref CreatePythonPapiEnvRef();
PESAPI_MODULE_EXPORT void DestroyPythonPapiEnvRef(pesapi_env_ref env_ref);
PESAPI_MODULE_EXPORT void RunPythonGC(pesapi_env_ref env_ref);
PESAPI_MODULE_EXPORT int GetPythonPapiVersion();
PESAPI_MODULE_EXPORT pesapi_ffi* GetPythonFFIApi();
}    // namespace pythonimpl
}    // namespace pesapi


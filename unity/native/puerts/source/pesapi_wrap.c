#include "pesapi.h"

PESAPI_MODULE_EXPORT pesapi_value pesapi_create_null(struct pesapi_ffi* apis, pesapi_env env)
{
    return apis->create_null(env);
}

PESAPI_MODULE_EXPORT pesapi_value pesapi_create_undefined(struct pesapi_ffi* apis, pesapi_env env)
{
    return apis->create_undefined(env);
}

PESAPI_MODULE_EXPORT pesapi_value pesapi_create_boolean(struct pesapi_ffi* apis, pesapi_env env, int value)
{
    return apis->create_boolean(env, value);
}

PESAPI_MODULE_EXPORT pesapi_value pesapi_create_int32(struct pesapi_ffi* apis, pesapi_env env, int32_t value)
{
    return apis->create_int32(env, value);
}

PESAPI_MODULE_EXPORT pesapi_value pesapi_create_uint32(struct pesapi_ffi* apis, pesapi_env env, uint32_t value)
{
    return apis->create_uint32(env, value);
}

PESAPI_MODULE_EXPORT pesapi_value pesapi_create_int64(struct pesapi_ffi* apis, pesapi_env env, int64_t value)
{
    return apis->create_int64(env, value);
}

PESAPI_MODULE_EXPORT pesapi_value pesapi_create_uint64(struct pesapi_ffi* apis, pesapi_env env, uint64_t value)
{
    return apis->create_uint64(env, value);
}

PESAPI_MODULE_EXPORT pesapi_value pesapi_create_double(struct pesapi_ffi* apis, pesapi_env env, double value)
{
    return apis->create_double(env, value);
}

PESAPI_MODULE_EXPORT pesapi_value pesapi_create_string_utf8(struct pesapi_ffi* apis, pesapi_env env, const char* str, size_t length)
{
    return apis->create_string_utf8(env, str, length);
}

PESAPI_MODULE_EXPORT pesapi_value pesapi_create_string_utf16(struct pesapi_ffi* apis, pesapi_env env, const uint16_t* str, size_t length)
{
    return apis->create_string_utf16(env, str, length);
}

PESAPI_MODULE_EXPORT pesapi_value pesapi_create_binary(struct pesapi_ffi* apis, pesapi_env env, void* data, size_t length)
{
    return apis->create_binary(env, data, length);
}

PESAPI_MODULE_EXPORT pesapi_value pesapi_create_binary_by_value(struct pesapi_ffi* apis, pesapi_env env, void* data, size_t length)
{
    return apis->create_binary_by_value(env, data, length);
}

PESAPI_MODULE_EXPORT pesapi_value pesapi_create_array(struct pesapi_ffi* apis, pesapi_env env)
{
    return apis->create_array(env);
}

PESAPI_MODULE_EXPORT pesapi_value pesapi_create_object(struct pesapi_ffi* apis, pesapi_env env)
{
    return apis->create_object(env);
}

PESAPI_MODULE_EXPORT pesapi_value pesapi_create_function(struct pesapi_ffi* apis, pesapi_env env, pesapi_callback native_impl, void* data, pesapi_function_finalize finalize)
{
    return apis->create_function(env, native_impl, data, finalize);
}

PESAPI_MODULE_EXPORT pesapi_value pesapi_create_class(struct pesapi_ffi* apis, pesapi_env env, const void* type_id)
{
    return apis->create_class(env, type_id);
}

PESAPI_MODULE_EXPORT int pesapi_get_value_bool(struct pesapi_ffi* apis, pesapi_env env, pesapi_value value)
{
    return apis->get_value_bool(env, value);
}

PESAPI_MODULE_EXPORT int32_t pesapi_get_value_int32(struct pesapi_ffi* apis, pesapi_env env, pesapi_value value)
{
    return apis->get_value_int32(env, value);
}

PESAPI_MODULE_EXPORT uint32_t pesapi_get_value_uint32(struct pesapi_ffi* apis, pesapi_env env, pesapi_value value)
{
    return apis->get_value_uint32(env, value);
}

PESAPI_MODULE_EXPORT int64_t pesapi_get_value_int64(struct pesapi_ffi* apis, pesapi_env env, pesapi_value value)
{
    return apis->get_value_int64(env, value);
}

PESAPI_MODULE_EXPORT uint64_t pesapi_get_value_uint64(struct pesapi_ffi* apis, pesapi_env env, pesapi_value value)
{
    return apis->get_value_uint64(env, value);
}

PESAPI_MODULE_EXPORT double pesapi_get_value_double(struct pesapi_ffi* apis, pesapi_env env, pesapi_value value)
{
    return apis->get_value_double(env, value);
}

PESAPI_MODULE_EXPORT const char* pesapi_get_value_string_utf8(struct pesapi_ffi* apis, pesapi_env env, pesapi_value value, char* buf, size_t* bufsize)
{
    return apis->get_value_string_utf8(env, value, buf, bufsize);
}

PESAPI_MODULE_EXPORT const uint16_t* pesapi_get_value_string_utf16(struct pesapi_ffi* apis, pesapi_env env, pesapi_value value, uint16_t* buf, size_t* bufsize)
{
    return apis->get_value_string_utf16(env, value, buf, bufsize);
}

PESAPI_MODULE_EXPORT void* pesapi_get_value_binary(struct pesapi_ffi* apis, pesapi_env env, pesapi_value pvalue, size_t* bufsize)
{
    return apis->get_value_binary(env, pvalue, bufsize);
}

PESAPI_MODULE_EXPORT uint32_t pesapi_get_array_length(struct pesapi_ffi* apis, pesapi_env env, pesapi_value value)
{
    return apis->get_array_length(env, value);
}

PESAPI_MODULE_EXPORT int pesapi_is_null(struct pesapi_ffi* apis, pesapi_env env, pesapi_value value)
{
    return apis->is_null(env, value);
}

PESAPI_MODULE_EXPORT int pesapi_is_undefined(struct pesapi_ffi* apis, pesapi_env env, pesapi_value value)
{
    return apis->is_undefined(env, value);
}

PESAPI_MODULE_EXPORT int pesapi_is_boolean(struct pesapi_ffi* apis, pesapi_env env, pesapi_value value)
{
    return apis->is_boolean(env, value);
}

PESAPI_MODULE_EXPORT int pesapi_is_int32(struct pesapi_ffi* apis, pesapi_env env, pesapi_value value)
{
    return apis->is_int32(env, value);
}

PESAPI_MODULE_EXPORT int pesapi_is_uint32(struct pesapi_ffi* apis, pesapi_env env, pesapi_value value)
{
    return apis->is_uint32(env, value);
}

PESAPI_MODULE_EXPORT int pesapi_is_int64(struct pesapi_ffi* apis, pesapi_env env, pesapi_value value)
{
    return apis->is_int64(env, value);
}

PESAPI_MODULE_EXPORT int pesapi_is_uint64(struct pesapi_ffi* apis, pesapi_env env, pesapi_value value)
{
    return apis->is_uint64(env, value);
}

PESAPI_MODULE_EXPORT int pesapi_is_double(struct pesapi_ffi* apis, pesapi_env env, pesapi_value value)
{
    return apis->is_double(env, value);
}

PESAPI_MODULE_EXPORT int pesapi_is_string(struct pesapi_ffi* apis, pesapi_env env, pesapi_value value)
{
    return apis->is_string(env, value);
}

PESAPI_MODULE_EXPORT int pesapi_is_object(struct pesapi_ffi* apis, pesapi_env env, pesapi_value value)
{
    return apis->is_object(env, value);
}

PESAPI_MODULE_EXPORT int pesapi_is_function(struct pesapi_ffi* apis, pesapi_env env, pesapi_value value)
{
    return apis->is_function(env, value);
}

PESAPI_MODULE_EXPORT int pesapi_is_binary(struct pesapi_ffi* apis, pesapi_env env, pesapi_value value)
{
    return apis->is_binary(env, value);
}

PESAPI_MODULE_EXPORT int pesapi_is_array(struct pesapi_ffi* apis, pesapi_env env, pesapi_value value)
{
    return apis->is_array(env, value);
}

PESAPI_MODULE_EXPORT pesapi_value pesapi_native_object_to_value(struct pesapi_ffi* apis, pesapi_env env, const void* type_id, void* object_ptr, int call_finalize)
{
    return apis->native_object_to_value(env, type_id, object_ptr, call_finalize);
}

PESAPI_MODULE_EXPORT void* pesapi_get_native_object_ptr(struct pesapi_ffi* apis, pesapi_env env, pesapi_value value)
{
    return apis->get_native_object_ptr(env, value);
}

PESAPI_MODULE_EXPORT const void* pesapi_get_native_object_typeid(struct pesapi_ffi* apis, pesapi_env env, pesapi_value value)
{
    return apis->get_native_object_typeid(env, value);
}

PESAPI_MODULE_EXPORT int pesapi_is_instance_of(struct pesapi_ffi* apis, pesapi_env env, const void* type_id, pesapi_value value)
{
    return apis->is_instance_of(env, type_id, value);
}

PESAPI_MODULE_EXPORT pesapi_value pesapi_boxing(struct pesapi_ffi* apis, pesapi_env env, pesapi_value value)
{
    return apis->boxing(env, value);
}

PESAPI_MODULE_EXPORT pesapi_value pesapi_unboxing(struct pesapi_ffi* apis, pesapi_env env, pesapi_value value)
{
    return apis->unboxing(env, value);
}

PESAPI_MODULE_EXPORT void pesapi_update_boxed_value(struct pesapi_ffi* apis, pesapi_env env, pesapi_value boxed_value, pesapi_value value)
{
    apis->update_boxed_value(env, boxed_value, value);
}

PESAPI_MODULE_EXPORT int pesapi_is_boxed_value(struct pesapi_ffi* apis, pesapi_env env, pesapi_value value)
{
    return apis->is_boxed_value(env, value);
}

PESAPI_MODULE_EXPORT int pesapi_get_args_len(struct pesapi_ffi* apis, pesapi_callback_info info)
{
    return apis->get_args_len(info);
}

PESAPI_MODULE_EXPORT pesapi_value pesapi_get_arg(struct pesapi_ffi* apis, pesapi_callback_info info, int index)
{
    return apis->get_arg(info, index);
}

PESAPI_MODULE_EXPORT pesapi_env pesapi_get_env(struct pesapi_ffi* apis, pesapi_callback_info info)
{
    return apis->get_env(info);
}

PESAPI_MODULE_EXPORT void* pesapi_get_native_holder_ptr(struct pesapi_ffi* apis, pesapi_callback_info info)
{
    return apis->get_native_holder_ptr(info);
}

PESAPI_MODULE_EXPORT const void* pesapi_get_native_holder_typeid(struct pesapi_ffi* apis, pesapi_callback_info info)
{
    return apis->get_native_holder_typeid(info);
}

PESAPI_MODULE_EXPORT void* pesapi_get_userdata(struct pesapi_ffi* apis, pesapi_callback_info info)
{
    return apis->get_userdata(info);
}

PESAPI_MODULE_EXPORT void pesapi_add_return(struct pesapi_ffi* apis, pesapi_callback_info info, pesapi_value value)
{
    apis->add_return(info, value);
}

PESAPI_MODULE_EXPORT void pesapi_throw_by_string(struct pesapi_ffi* apis, pesapi_callback_info pinfo, const char* msg)
{
    apis->throw_by_string(pinfo, msg);
}

PESAPI_MODULE_EXPORT pesapi_env_ref pesapi_create_env_ref(struct pesapi_ffi* apis, pesapi_env env)
{
    return apis->create_env_ref(env);
}

PESAPI_MODULE_EXPORT int pesapi_env_ref_is_valid(struct pesapi_ffi* apis, pesapi_env_ref env)
{
    return apis->env_ref_is_valid(env);
}

PESAPI_MODULE_EXPORT pesapi_env pesapi_get_env_from_ref(struct pesapi_ffi* apis, pesapi_env_ref env_ref)
{
    return apis->get_env_from_ref(env_ref);
}

PESAPI_MODULE_EXPORT pesapi_env_ref pesapi_duplicate_env_ref(struct pesapi_ffi* apis, pesapi_env_ref env_ref)
{
    return apis->duplicate_env_ref(env_ref);
}

PESAPI_MODULE_EXPORT void pesapi_release_env_ref(struct pesapi_ffi* apis, pesapi_env_ref env_ref)
{
    apis->release_env_ref(env_ref);
}

PESAPI_MODULE_EXPORT pesapi_scope pesapi_open_scope(struct pesapi_ffi* apis, pesapi_env_ref env_ref)
{
    return apis->open_scope(env_ref);
}

PESAPI_MODULE_EXPORT pesapi_scope pesapi_open_scope_placement(struct pesapi_ffi* apis, pesapi_env_ref env_ref, struct pesapi_scope_memory* memory)
{
    return apis->open_scope_placement(env_ref, memory);
}

PESAPI_MODULE_EXPORT int pesapi_has_caught(struct pesapi_ffi* apis, pesapi_scope scope)
{
    return apis->has_caught(scope) ? 1 : 0;
}

PESAPI_MODULE_EXPORT const char* pesapi_get_exception_as_string(struct pesapi_ffi* apis, pesapi_scope scope, int with_stack)
{
    return apis->get_exception_as_string(scope, with_stack);
}

PESAPI_MODULE_EXPORT void pesapi_close_scope(struct pesapi_ffi* apis, pesapi_scope scope)
{
    apis->close_scope(scope);
}

PESAPI_MODULE_EXPORT void pesapi_close_scope_placement(struct pesapi_ffi* apis, pesapi_scope scope)
{
    apis->close_scope_placement(scope);
}

PESAPI_MODULE_EXPORT pesapi_value_ref pesapi_create_value_ref(struct pesapi_ffi* apis, pesapi_env env, pesapi_value value, uint32_t internal_field_count)
{
    return apis->create_value_ref(env, value, internal_field_count);
}

PESAPI_MODULE_EXPORT pesapi_value_ref pesapi_duplicate_value_ref(struct pesapi_ffi* apis, pesapi_value_ref value_ref)
{
    return apis->duplicate_value_ref(value_ref);
}

PESAPI_MODULE_EXPORT void pesapi_release_value_ref(struct pesapi_ffi* apis, pesapi_value_ref value_ref)
{
    apis->release_value_ref(value_ref);
}

PESAPI_MODULE_EXPORT pesapi_value pesapi_get_value_from_ref(struct pesapi_ffi* apis, pesapi_env env, pesapi_value_ref value_ref)
{
    return apis->get_value_from_ref(env, value_ref);
}

PESAPI_MODULE_EXPORT void pesapi_set_ref_weak(struct pesapi_ffi* apis, pesapi_env env, pesapi_value_ref value_ref)
{
    apis->set_ref_weak(env, value_ref);
}

PESAPI_MODULE_EXPORT int pesapi_set_owner(struct pesapi_ffi* apis, pesapi_env env, pesapi_value value, pesapi_value owner)
{
    return apis->set_owner(env, value, owner);
}

PESAPI_MODULE_EXPORT pesapi_env_ref pesapi_get_ref_associated_env(struct pesapi_ffi* apis, pesapi_value_ref value_ref)
{
    return apis->get_ref_associated_env(value_ref);
}

PESAPI_MODULE_EXPORT void** pesapi_get_ref_internal_fields(struct pesapi_ffi* apis, pesapi_value_ref value_ref, uint32_t* pinternal_field_count)
{
    return apis->get_ref_internal_fields(value_ref, pinternal_field_count);
}

PESAPI_MODULE_EXPORT pesapi_value pesapi_get_property(struct pesapi_ffi* apis, pesapi_env env, pesapi_value object, const char* key)
{
    return apis->get_property(env, object, key);
}

PESAPI_MODULE_EXPORT void pesapi_set_property(struct pesapi_ffi* apis, pesapi_env env, pesapi_value object, const char* key, pesapi_value value)
{
    apis->set_property(env, object, key, value);
}

PESAPI_MODULE_EXPORT int pesapi_get_private(struct pesapi_ffi* apis, pesapi_env env, pesapi_value object, void** out_ptr)
{
    return apis->get_private(env, object, out_ptr);
}

PESAPI_MODULE_EXPORT int pesapi_set_private(struct pesapi_ffi* apis, pesapi_env env, pesapi_value object, void* ptr)
{
    return apis->set_private(env, object, ptr);
}

PESAPI_MODULE_EXPORT pesapi_value pesapi_get_property_uint32(struct pesapi_ffi* apis, pesapi_env env, pesapi_value object, uint32_t key)
{
    return apis->get_property_uint32(env, object, key);
}

PESAPI_MODULE_EXPORT void pesapi_set_property_uint32(struct pesapi_ffi* apis, pesapi_env env, pesapi_value object, uint32_t key, pesapi_value value)
{
    apis->set_property_uint32(env, object, key, value);
}

PESAPI_MODULE_EXPORT pesapi_value pesapi_call_function(struct pesapi_ffi* apis, pesapi_env env, pesapi_value func, pesapi_value this_object, int argc, const pesapi_value argv[])
{
    return apis->call_function(env, func, this_object, argc, argv);
}

PESAPI_MODULE_EXPORT pesapi_value pesapi_eval(struct pesapi_ffi* apis, pesapi_env env, const uint8_t* code, size_t code_size, const char* path)
{
    return apis->eval(env, code, code_size, path);
}

PESAPI_MODULE_EXPORT pesapi_value pesapi_global(struct pesapi_ffi* apis, pesapi_env env)
{
    return apis->global(env);
}

PESAPI_MODULE_EXPORT const void* pesapi_get_env_private(struct pesapi_ffi* apis, pesapi_env env)
{
    return apis->get_env_private(env);
}

PESAPI_MODULE_EXPORT void pesapi_set_env_private(struct pesapi_ffi* apis, pesapi_env env, const void* ptr)
{
    apis->set_env_private(env, ptr);
}

PESAPI_MODULE_EXPORT int pesapi_trace_native_object_lifecycle(struct pesapi_ffi* apis, pesapi_env env, 
    pesapi_on_native_object_enter on_enter, pesapi_on_native_object_exit on_exit)
{
    return apis->trace_native_object_lifecycle(env, on_enter, on_exit);
}

PESAPI_MODULE_EXPORT void pesapi_set_registry(struct pesapi_ffi* apis, pesapi_env env, pesapi_registry registry)
{
    apis->set_registry(env, registry);
}
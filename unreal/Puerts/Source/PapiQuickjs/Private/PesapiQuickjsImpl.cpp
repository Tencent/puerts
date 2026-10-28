/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

// the quickjs implementation of pesapi, ported from unity/native/papi-quickjs (PapiQuickjsImpl.cpp), with the behavior aligned to
// the v8 backend of unreal (PapiV8)

#include "PesapiQuickjsImpl.h"
#include "QjsPapiData.h"
#include "QjsObjectMapper.h"
#include <cstdlib>
#include <cstring>
#include <new>
#include <vector>

namespace PUERTS_NAMESPACE
{
namespace qjsimpl
{
static inline pesapi_value pesapiValueFromQjsValue(JSValue* v)
{
    return reinterpret_cast<pesapi_value>(v);
}

static inline JSValue* qjsValueFromPesapiValue(pesapi_value v)
{
    return reinterpret_cast<JSValue*>(v);
}

static inline pesapi_env pesapiEnvFromQjsContext(JSContext* ctx)
{
    return reinterpret_cast<pesapi_env>(ctx);
}

static inline JSContext* qjsContextFromPesapiEnv(pesapi_env v)
{
    return reinterpret_cast<JSContext*>(v);
}

static inline pesapi_scope__* scopeFromPesapi(pesapi_scope s)
{
    return reinterpret_cast<pesapi_scope__*>(s);
}

static inline pesapi_env_ref__* envRefFromPesapi(pesapi_env_ref r)
{
    return reinterpret_cast<pesapi_env_ref__*>(r);
}

static inline pesapi_value_ref__* valueRefFromPesapi(pesapi_value_ref r)
{
    return reinterpret_cast<pesapi_value_ref__*>(r);
}

static inline pesapi_callback_info__* infoFromPesapi(pesapi_callback_info i)
{
    return reinterpret_cast<pesapi_callback_info__*>(i);
}

static inline JSValue* allocValueInCurrentScope(JSContext* ctx)
{
    auto scope = getCurrentScope(ctx);
    return scope ? scope->allocValue() : nullptr;
}

// takes the ownership of v
static inline pesapi_value pushValue(JSContext* ctx, JSValue v)
{
    auto ret = allocValueInCurrentScope(ctx);
    if (!ret)
    {
        JS_FreeValue(ctx, v);
        return nullptr;
    }
    *ret = v;
    return pesapiValueFromQjsValue(ret);
}

// moves the pending exception of the context to the current scope
static void catchPendingException(JSContext* ctx)
{
    JSValue ex = JS_GetException(ctx);
    auto scope = getCurrentScope(ctx);
    if (scope)
    {
        scope->setCaughtException(ex);
    }
    else
    {
        JS_FreeValue(ctx, ex);
    }
}

static inline void clearPendingException(JSContext* ctx)
{
    if (JS_HasException(ctx))
    {
        JS_FreeValue(ctx, JS_GetException(ctx));
    }
}

static JSValue newError(JSContext* ctx, const char* msg)
{
    JSValue ex = JS_NewError(ctx);
    JSAtom messageAtom = JS_NewAtom(ctx, "message");
    JS_DefinePropertyValue(ctx, ex, messageAtom, JS_NewString(ctx, msg ? msg : ""), JS_PROP_WRITABLE | JS_PROP_CONFIGURABLE);
    JS_FreeAtom(ctx, messageAtom);
    return ex;
}

static JSValue literal_values_undefined = JS_UNDEFINED;
static JSValue literal_values_null = JS_NULL;
static JSValue literal_values_true = JS_TRUE;
static JSValue literal_values_false = JS_FALSE;

// value process
static pesapi_value pesapi_create_null(pesapi_env env)
{
    return pesapiValueFromQjsValue(&literal_values_null);
}

static pesapi_value pesapi_create_undefined(pesapi_env env)
{
    return pesapiValueFromQjsValue(&literal_values_undefined);
}

static pesapi_value pesapi_create_boolean(pesapi_env env, int value)
{
    return pesapiValueFromQjsValue(value ? &literal_values_true : &literal_values_false);
}

static pesapi_value pesapi_create_int32(pesapi_env env, int32_t value)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    return pushValue(ctx, JS_NewInt32(ctx, value));
}

static pesapi_value pesapi_create_uint32(pesapi_env env, uint32_t value)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    return pushValue(ctx, JS_NewUint32(ctx, value));
}

static pesapi_value pesapi_create_int64(pesapi_env env, int64_t value)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    return pushValue(ctx, JS_NewBigInt64(ctx, value));
}

static pesapi_value pesapi_create_uint64(pesapi_env env, uint64_t value)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    return pushValue(ctx, JS_NewBigUint64(ctx, value));
}

static pesapi_value pesapi_create_double(pesapi_env env, double value)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    return pushValue(ctx, JS_NewFloat64(ctx, value));
}

static pesapi_value pesapi_create_string_utf8(pesapi_env env, const char* str, size_t length)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    return pushValue(ctx, JS_NewStringLen(ctx, str, length));
}

static pesapi_value pesapi_create_string_utf16(pesapi_env env, const uint16_t* str, size_t length)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    return pushValue(ctx, JS_NewString16Len(ctx, str, length));
}

static pesapi_value pesapi_create_binary(pesapi_env env, void* bin, size_t length)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    return pushValue(ctx, JS_NewArrayBuffer(ctx, (uint8_t*) bin, length, nullptr, nullptr, false));
}

static pesapi_value pesapi_create_binary_by_value(pesapi_env env, void* bin, size_t length)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    return pushValue(ctx, JS_NewArrayBufferCopy(ctx, (uint8_t*) bin, length));
}

static pesapi_value pesapi_create_array(pesapi_env env)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    return pushValue(ctx, JS_NewArray(ctx));
}

static pesapi_value pesapi_create_object(pesapi_env env)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    return pushValue(ctx, JS_NewObject(ctx));
}

static pesapi_value pesapi_create_function(
    pesapi_env env, pesapi_callback native_impl, void* data, pesapi_function_finalize finalize)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    JSValue func = FCppObjectMapper::Get(ctx)->CreateFunction(native_impl, data, finalize);
    if (JS_IsException(func))
    {
        catchPendingException(ctx);
        return nullptr;
    }
    return pushValue(ctx, func);
}

static pesapi_value pesapi_create_class(pesapi_env env, const void* type_id)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    JSValue cls = FCppObjectMapper::Get(ctx)->FindOrCreateClassByID(type_id);
    if (JS_IsUndefined(cls))
    {
        return nullptr;
    }
    // borrowed from the mapper, the scope owns one reference
    return pushValue(ctx, JS_DupValue(ctx, cls));
}

static int pesapi_get_value_bool(pesapi_env env, pesapi_value pvalue)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    int res = JS_ToBool(ctx, *qjsValueFromPesapiValue(pvalue));
    if (res < 0)
    {
        clearPendingException(ctx);
        return 0;
    }
    return res;
}

static int32_t pesapi_get_value_int32(pesapi_env env, pesapi_value pvalue)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    int32_t ret = 0;
    if (JS_ToInt32(ctx, &ret, *qjsValueFromPesapiValue(pvalue)) < 0)
    {
        clearPendingException(ctx);
        return 0;
    }
    return ret;
}

static uint32_t pesapi_get_value_uint32(pesapi_env env, pesapi_value pvalue)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    uint32_t ret = 0;
    if (JS_ToUint32(ctx, &ret, *qjsValueFromPesapiValue(pvalue)) < 0)
    {
        clearPendingException(ctx);
        return 0;
    }
    return ret;
}

static int64_t pesapi_get_value_int64(pesapi_env env, pesapi_value pvalue)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    JSValue v = *qjsValueFromPesapiValue(pvalue);
    int64_t ret = 0;
    if (!JS_IsBigInt(ctx, v) || JS_ToBigInt64(ctx, &ret, v) < 0)
    {
        clearPendingException(ctx);
        return 0;
    }
    return ret;
}

static uint64_t pesapi_get_value_uint64(pesapi_env env, pesapi_value pvalue)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    JSValue v = *qjsValueFromPesapiValue(pvalue);
    uint64_t ret = 0;
    if (!JS_IsBigInt(ctx, v) || JS_ToBigUint64(ctx, &ret, v) < 0)
    {
        clearPendingException(ctx);
        return 0;
    }
    return ret;
}

static double pesapi_get_value_double(pesapi_env env, pesapi_value pvalue)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    double ret = 0;
    if (JS_ToFloat64(ctx, &ret, *qjsValueFromPesapiValue(pvalue)) < 0)
    {
        clearPendingException(ctx);
        return 0;
    }
    return ret;
}

static const char* pesapi_get_value_string_utf8(pesapi_env env, pesapi_value pvalue, char* buf, size_t* bufsize)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    size_t len = 0;
    const char* str = JS_ToCStringLen(ctx, &len, *qjsValueFromPesapiValue(pvalue));
    if (!str)
    {
        clearPendingException(ctx);
        *bufsize = 0;
        return buf;
    }
    if (buf == nullptr)
    {
        *bufsize = len;
    }
    else
    {
        size_t n = len < *bufsize ? len : *bufsize;
        memcpy(buf, str, n);
        if (n < *bufsize)
        {
            buf[n] = '\0';
        }
        *bufsize = n;
    }
    JS_FreeCString(ctx, str);
    return buf;
}

static const uint16_t* pesapi_get_value_string_utf16(pesapi_env env, pesapi_value pvalue, uint16_t* buf, size_t* bufsize)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    auto ret = JS_ToCString16Len(ctx, *qjsValueFromPesapiValue(pvalue), buf, bufsize);
    clearPendingException(ctx);
    return ret;
}

static void* pesapi_get_value_binary(pesapi_env env, pesapi_value pvalue, size_t* bufsize)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    JSValue jsvalue = *qjsValueFromPesapiValue(pvalue);
    if (JS_IsArrayBufferView(jsvalue))
    {
        size_t byte_offset = 0;
        size_t byte_length = 0;
        size_t bytes_per_element = 0;
        JS_GetArrayBufferViewInfo(ctx, jsvalue, &byte_offset, &byte_length, &bytes_per_element);
        JSValue ab = JS_GetArrayBufferView(ctx, jsvalue);
        size_t ab_size = 0;
        uint8_t* data = JS_GetArrayBuffer(ctx, &ab_size, ab);
        JS_FreeValue(ctx, ab);
        if (!data)
        {
            clearPendingException(ctx);
            *bufsize = 0;
            return nullptr;
        }
        *bufsize = byte_length;
        return data + byte_offset;
    }
    if (JS_IsArrayBuffer(jsvalue))
    {
        auto data = JS_GetArrayBuffer(ctx, bufsize, jsvalue);
        if (!data)
        {
            clearPendingException(ctx);
        }
        return data;
    }
    return nullptr;
}

static uint32_t pesapi_get_array_length(pesapi_env env, pesapi_value pvalue)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    JSValue v = *qjsValueFromPesapiValue(pvalue);
    if (JS_IsArray(ctx, v) != 1)
    {
        return 0;
    }
    JSValue len = JS_GetPropertyStr(ctx, v, "length");
    if (JS_IsException(len))
    {
        clearPendingException(ctx);
        return 0;
    }
    uint32_t ret = 0;
    JS_ToUint32(ctx, &ret, len);
    JS_FreeValue(ctx, len);
    return ret;
}

static int pesapi_is_null(pesapi_env env, pesapi_value pvalue)
{
    return JS_IsNull(*qjsValueFromPesapiValue(pvalue));
}

static int pesapi_is_undefined(pesapi_env env, pesapi_value pvalue)
{
    return JS_IsUndefined(*qjsValueFromPesapiValue(pvalue));
}

static int pesapi_is_boolean(pesapi_env env, pesapi_value pvalue)
{
    return JS_IsBool(*qjsValueFromPesapiValue(pvalue));
}

static int pesapi_is_int32(pesapi_env env, pesapi_value pvalue)
{
    JSValue v = *qjsValueFromPesapiValue(pvalue);
    if (JS_VALUE_GET_TAG(v) == JS_TAG_INT)
    {
        return true;
    }
    if (JS_TAG_IS_FLOAT64(JS_VALUE_GET_TAG(v)))
    {
        double d = JS_VALUE_GET_FLOAT64(v);
        return d >= -2147483648.0 && d <= 2147483647.0 && d == (double) (int32_t) d;
    }
    return false;
}

static int pesapi_is_uint32(pesapi_env env, pesapi_value pvalue)
{
    JSValue v = *qjsValueFromPesapiValue(pvalue);
    if (JS_VALUE_GET_TAG(v) == JS_TAG_INT)
    {
        return JS_VALUE_GET_INT(v) >= 0;
    }
    if (JS_TAG_IS_FLOAT64(JS_VALUE_GET_TAG(v)))
    {
        double d = JS_VALUE_GET_FLOAT64(v);
        return d >= 0 && d <= 4294967295.0 && d == (double) (uint32_t) d;
    }
    return false;
}

static int pesapi_is_int64(pesapi_env env, pesapi_value pvalue)
{
    return JS_IsBigInt(qjsContextFromPesapiEnv(env), *qjsValueFromPesapiValue(pvalue));
}

static int pesapi_is_uint64(pesapi_env env, pesapi_value pvalue)
{
    return JS_IsBigInt(qjsContextFromPesapiEnv(env), *qjsValueFromPesapiValue(pvalue));
}

static int pesapi_is_double(pesapi_env env, pesapi_value pvalue)
{
    return JS_IsNumber(*qjsValueFromPesapiValue(pvalue));
}

static int pesapi_is_string(pesapi_env env, pesapi_value pvalue)
{
    return JS_IsString(*qjsValueFromPesapiValue(pvalue));
}

static int pesapi_is_object(pesapi_env env, pesapi_value pvalue)
{
    return JS_IsObject(*qjsValueFromPesapiValue(pvalue));
}

static int pesapi_is_function(pesapi_env env, pesapi_value pvalue)
{
    return JS_IsFunction(qjsContextFromPesapiEnv(env), *qjsValueFromPesapiValue(pvalue));
}

static int pesapi_is_binary(pesapi_env env, pesapi_value pvalue)
{
    JSValue v = *qjsValueFromPesapiValue(pvalue);
    return JS_IsArrayBuffer(v) || JS_IsArrayBufferView(v);
}

static int pesapi_is_array(pesapi_env env, pesapi_value pvalue)
{
    return JS_IsArray(qjsContextFromPesapiEnv(env), *qjsValueFromPesapiValue(pvalue)) == 1;
}

static pesapi_value pesapi_native_object_to_value(pesapi_env env, const void* type_id, void* object_ptr, int call_finalize)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    JSValue obj = FCppObjectMapper::Get(ctx)->FindOrAddCppObject(type_id, object_ptr, !call_finalize);
    if (JS_IsException(obj))
    {
        catchPendingException(ctx);
        return nullptr;
    }
    return pushValue(ctx, obj);
}

static void* pesapi_get_native_object_ptr(pesapi_env env, pesapi_value pvalue)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    JSValue v = *qjsValueFromPesapiValue(pvalue);
    if (!JS_IsObject(v))
    {
        return nullptr;
    }
    return FCppObjectMapper::Get(ctx)->GetNativeObjectPtr(v);
}

static const void* pesapi_get_native_object_typeid(pesapi_env env, pesapi_value pvalue)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    JSValue v = *qjsValueFromPesapiValue(pvalue);
    if (!JS_IsObject(v))
    {
        return nullptr;
    }
    return FCppObjectMapper::Get(ctx)->GetNativeObjectTypeId(v);
}

static int pesapi_is_instance_of(pesapi_env env, const void* type_id, pesapi_value pvalue)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    JSValue v = *qjsValueFromPesapiValue(pvalue);
    if (!JS_IsObject(v))
    {
        return false;
    }
    return FCppObjectMapper::Get(ctx)->IsInstanceOf(type_id, v);
}

static pesapi_value pesapi_boxing(pesapi_env env, pesapi_value pvalue)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    JSValue boxed = JS_NewArray(ctx);
    JS_SetPropertyUint32(ctx, boxed, 0, JS_DupValue(ctx, *qjsValueFromPesapiValue(pvalue)));
    return pushValue(ctx, boxed);
}

static pesapi_value pesapi_unboxing(pesapi_env env, pesapi_value p_boxed_value)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    JSValue boxed = *qjsValueFromPesapiValue(p_boxed_value);
    if (!JS_IsObject(boxed))
    {
        return pesapiValueFromQjsValue(&literal_values_undefined);
    }
    JSValue ret = JS_GetPropertyUint32(ctx, boxed, 0);
    if (JS_IsException(ret))
    {
        catchPendingException(ctx);
        return pesapiValueFromQjsValue(&literal_values_undefined);
    }
    return pushValue(ctx, ret);
}

static void pesapi_update_boxed_value(pesapi_env env, pesapi_value p_boxed_value, pesapi_value pvalue)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    JSValue boxed = *qjsValueFromPesapiValue(p_boxed_value);
    if (!JS_IsObject(boxed))
    {
        return;
    }
    if (JS_SetPropertyUint32(ctx, boxed, 0, JS_DupValue(ctx, *qjsValueFromPesapiValue(pvalue))) < 0)
    {
        catchPendingException(ctx);
    }
}

static int pesapi_is_boxed_value(pesapi_env env, pesapi_value value)
{
    return pesapi_is_object(env, value);
}

static int pesapi_get_args_len(pesapi_callback_info pinfo)
{
    return infoFromPesapi(pinfo)->argc;
}

static pesapi_value pesapi_get_arg(pesapi_callback_info pinfo, int index)
{
    auto info = infoFromPesapi(pinfo);
    if (index >= 0 && index < info->argc)
    {
        return pesapiValueFromQjsValue(&(info->argv[index]));
    }
    return pesapiValueFromQjsValue(&literal_values_undefined);
}

static pesapi_env pesapi_get_env(pesapi_callback_info pinfo)
{
    return pesapiEnvFromQjsContext(infoFromPesapi(pinfo)->ctx);
}

static void* pesapi_get_native_holder_ptr(pesapi_callback_info pinfo)
{
    auto info = infoFromPesapi(pinfo);
    return FCppObjectMapper::Get(info->ctx)->GetNativeObjectPtr(info->this_val);
}

static const void* pesapi_get_native_holder_typeid(pesapi_callback_info pinfo)
{
    auto info = infoFromPesapi(pinfo);
    return FCppObjectMapper::Get(info->ctx)->GetNativeObjectTypeId(info->this_val);
}

static void* pesapi_get_userdata(pesapi_callback_info pinfo)
{
    return infoFromPesapi(pinfo)->data;
}

static void pesapi_add_return(pesapi_callback_info pinfo, pesapi_value value)
{
    auto info = infoFromPesapi(pinfo);
    JS_FreeValue(info->ctx, info->res);
    info->res = JS_DupValue(info->ctx, *qjsValueFromPesapiValue(value));
}

static void pesapi_throw_by_string(pesapi_callback_info pinfo, const char* msg)
{
    auto info = infoFromPesapi(pinfo);
    JS_FreeValue(info->ctx, info->ex);
    info->ex = newError(info->ctx, msg);
}

static pesapi_env_ref pesapi_create_env_ref(pesapi_env env)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    auto ret = new pesapi_env_ref__(ctx);
    return reinterpret_cast<pesapi_env_ref>(ret);
}

static int pesapi_env_ref_is_valid(pesapi_env_ref penv_ref)
{
    auto env_ref = envRefFromPesapi(penv_ref);
    return env_ref && !env_ref->env_life_cycle_tracker.expired();
}

static pesapi_env pesapi_get_env_from_ref(pesapi_env_ref penv_ref)
{
    auto env_ref = envRefFromPesapi(penv_ref);
    if (!env_ref || env_ref->env_life_cycle_tracker.expired())
    {
        return nullptr;
    }
    return pesapiEnvFromQjsContext(env_ref->context_persistent);
}

static pesapi_env_ref pesapi_duplicate_env_ref(pesapi_env_ref penv_ref)
{
    ++envRefFromPesapi(penv_ref)->ref_count;
    return penv_ref;
}

static void pesapi_release_env_ref(pesapi_env_ref penv_ref)
{
    auto env_ref = envRefFromPesapi(penv_ref);
    if (--env_ref->ref_count == 0)
    {
        delete env_ref;
    }
}

static pesapi_scope pesapi_open_scope(pesapi_env_ref penv_ref)
{
    auto env_ref = envRefFromPesapi(penv_ref);
    if (!env_ref || env_ref->env_life_cycle_tracker.expired())
    {
        return nullptr;
    }
    JSContext* ctx = env_ref->context_persistent;
    void* mem = malloc(sizeof(pesapi_scope__));
    return reinterpret_cast<pesapi_scope>(new (mem) pesapi_scope__(ctx));
}

static pesapi_scope pesapi_open_scope_placement(pesapi_env_ref penv_ref, struct pesapi_scope_memory* memory)
{
    auto env_ref = envRefFromPesapi(penv_ref);
    if (!env_ref || env_ref->env_life_cycle_tracker.expired())
    {
        return nullptr;
    }
    memset(memory, 0, sizeof(struct pesapi_scope_memory));
    return reinterpret_cast<pesapi_scope>(new (memory) pesapi_scope__(env_ref->context_persistent));
}

// a pending exception (thrown by throw_error or an api that failed) is caught by the scope
static void takePendingException(pesapi_scope__* scope)
{
    if (!scope->caught && JS_HasException(scope->ctx))
    {
        scope->setCaughtException(JS_GetException(scope->ctx));
    }
}

static int pesapi_has_caught(pesapi_scope pscope)
{
    auto scope = scopeFromPesapi(pscope);
    if (!scope)
    {
        return false;
    }
    takePendingException(scope);
    return scope->caught != nullptr;
}

static const char* pesapi_get_exception_as_string(pesapi_scope pscope, int with_stack)
{
    auto scope = scopeFromPesapi(pscope);
    if (!scope)
    {
        return nullptr;
    }
    takePendingException(scope);
    if (scope->caught == nullptr)
    {
        return nullptr;
    }
    auto ctx = scope->ctx;
    JSValue ex = scope->caught->exception;
    auto msg = JS_ToCString(ctx, ex);
    if (msg)
    {
        scope->caught->message = msg;
        JS_FreeCString(ctx, msg);
    }
    else
    {
        clearPendingException(ctx);
        scope->caught->message = "";
    }

    if (with_stack && JS_IsObject(ex))
    {
        JSValue stackVal = JS_GetPropertyStr(ctx, ex, "stack");
        if (JS_IsString(stackVal))
        {
            auto stack = JS_ToCString(ctx, stackVal);
            if (stack)
            {
                scope->caught->message += "\n";
                scope->caught->message += stack;
                JS_FreeCString(ctx, stack);
            }
        }
        else if (JS_IsException(stackVal))
        {
            clearPendingException(ctx);
        }
        JS_FreeValue(ctx, stackVal);
    }
    return scope->caught->message.c_str();
}

static void runPendingJobsIfOutermost(pesapi_scope__* scope)
{
    if (scope->prev_scope == nullptr)
    {
        auto rt = JS_GetRuntime(scope->ctx);
        while (JS_IsJobPending(rt))
        {
            JSContext* ctx_ = nullptr;
            if (JS_ExecutePendingJob(rt, &ctx_) < 0 && ctx_)
            {
                // reported by the promise rejection tracker
                clearPendingException(ctx_);
            }
        }
    }
}

static void pesapi_close_scope(pesapi_scope pscope)
{
    auto scope = scopeFromPesapi(pscope);
    if (!scope)
    {
        return;
    }
    runPendingJobsIfOutermost(scope);
    scope->~pesapi_scope__();
    free(scope);
}

static void pesapi_close_scope_placement(pesapi_scope pscope)
{
    auto scope = scopeFromPesapi(pscope);
    if (!scope)
    {
        return;
    }
    runPendingJobsIfOutermost(scope);
    scope->~pesapi_scope__();
}

static pesapi_value_ref pesapi_create_value_ref(pesapi_env env, pesapi_value pvalue, uint32_t internal_field_count)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    size_t totalSize = value_ref_size(internal_field_count);
    void* mem = malloc(totalSize);
    memset(mem, 0, totalSize);
    auto ret = new (mem) pesapi_value_ref__(ctx, *qjsValueFromPesapiValue(pvalue), internal_field_count);
    return reinterpret_cast<pesapi_value_ref>(ret);
}

static pesapi_value_ref pesapi_duplicate_value_ref(pesapi_value_ref pvalue_ref)
{
    ++valueRefFromPesapi(pvalue_ref)->ref_count;
    return pvalue_ref;
}

static void pesapi_release_value_ref(pesapi_value_ref pvalue_ref)
{
    auto value_ref = valueRefFromPesapi(pvalue_ref);
    if (--value_ref->ref_count == 0)
    {
        if (!value_ref->env_life_cycle_tracker.expired())
        {
            value_ref->~pesapi_value_ref__();
        }
        else
        {
            // the env is gone, only the memory is released
            value_ref->env_life_cycle_tracker.~weak_ptr();
        }
        free(value_ref);
    }
}

static pesapi_value pesapi_get_value_from_ref(pesapi_env env, pesapi_value_ref pvalue_ref)
{
    auto value_ref = valueRefFromPesapi(pvalue_ref);
    auto ctx = qjsContextFromPesapiEnv(env);
    if (value_ref->is_dead())
    {
        return nullptr;
    }
    return pushValue(ctx, JS_DupValue(ctx, value_ref->value_persistent));
}

static void pesapi_set_ref_weak(pesapi_env env, pesapi_value_ref pvalue_ref)
{
    auto value_ref = valueRefFromPesapi(pvalue_ref);
    auto ctx = qjsContextFromPesapiEnv(env);
    if (value_ref->weak || !JS_IsObject(value_ref->value_persistent))
    {
        // a primitive value can not be collected, it is kept strongly
        return;
    }
    auto mapper = FCppObjectMapper::Get(ctx);
    JSValue target = value_ref->value_persistent;

    JSValue tracer = JS_NewObjectClass(ctx, mapper->WeakTracerClassId);
    if (JS_IsException(tracer))
    {
        clearPendingException(ctx);
        return;
    }
    JS_SetOpaque(tracer, value_ref);

    // the tracers of an object are kept in a hidden array, they are collected with the object
    JSAtom key = JS_NewAtom(ctx, "__papi_weak_tracers");
    JSPropertyDescriptor desc;
    JSValue tracers = JS_UNDEFINED;
    int has = JS_GetOwnProperty(ctx, &desc, target, key);
    if (has > 0)
    {
        tracers = desc.value;
        JS_FreeValue(ctx, desc.getter);
        JS_FreeValue(ctx, desc.setter);
    }
    else if (has < 0)
    {
        clearPendingException(ctx);
    }
    if (!JS_IsArray(ctx, tracers))
    {
        JS_FreeValue(ctx, tracers);
        tracers = JS_NewArray(ctx);
        if (JS_DefinePropertyValue(ctx, target, key, JS_DupValue(ctx, tracers), JS_PROP_WRITABLE | JS_PROP_CONFIGURABLE) < 0)
        {
            clearPendingException(ctx);
        }
    }
    JS_FreeAtom(ctx, key);

    uint32_t len = 0;
    JSValue lenVal = JS_GetPropertyStr(ctx, tracers, "length");
    JS_ToUint32(ctx, &len, lenVal);
    JS_FreeValue(ctx, lenVal);
    if (JS_SetPropertyUint32(ctx, tracers, len, tracer) < 0)    // consumes tracer
    {
        clearPendingException(ctx);
        JS_FreeValue(ctx, tracers);
        return;
    }
    JS_FreeValue(ctx, tracers);

    value_ref->weak = true;
    value_ref->tracer = tracer;
    value_ref->tracer_alive = true;
    mapper->RemoveStrongRefObject(&value_ref->value_persistent);
    // may finalize the target (and the tracer, which resets the ref) right away
    JS_FreeValue(ctx, target);
}

static int pesapi_set_owner(pesapi_env env, pesapi_value pvalue, pesapi_value powner)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    JSValue obj = *qjsValueFromPesapiValue(pvalue);
    JSValue owner = *qjsValueFromPesapiValue(powner);
    if (!JS_IsObject(owner))
    {
        return false;
    }
    JSAtom key = JS_NewAtom(ctx, "_p_i_only_one_child");
    int ret = JS_DefinePropertyValue(ctx, owner, key, JS_DupValue(ctx, obj), JS_PROP_WRITABLE | JS_PROP_CONFIGURABLE);
    JS_FreeAtom(ctx, key);
    if (ret < 0)
    {
        clearPendingException(ctx);
        return false;
    }
    return true;
}

static pesapi_env_ref pesapi_get_ref_associated_env(pesapi_value_ref value_ref)
{
    return reinterpret_cast<pesapi_env_ref>(static_cast<pesapi_env_ref__*>(valueRefFromPesapi(value_ref)));
}

static void** pesapi_get_ref_internal_fields(pesapi_value_ref pvalue_ref, uint32_t* pinternal_field_count)
{
    auto value_ref = valueRefFromPesapi(pvalue_ref);
    *pinternal_field_count = value_ref->internal_field_count;
    return &value_ref->internal_fields[0];
}

static pesapi_value pesapi_get_property(pesapi_env env, pesapi_value pobject, const char* key)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    JSValue obj = *qjsValueFromPesapiValue(pobject);
    if (!JS_IsObject(obj))
    {
        return pesapiValueFromQjsValue(&literal_values_undefined);
    }
    JSValue ret = JS_GetPropertyStr(ctx, obj, key);
    if (JS_IsException(ret))
    {
        catchPendingException(ctx);
        return pesapiValueFromQjsValue(&literal_values_undefined);
    }
    return pushValue(ctx, ret);
}

static int pesapi_set_property(pesapi_env env, pesapi_value pobject, const char* key, pesapi_value pvalue)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    JSValue obj = *qjsValueFromPesapiValue(pobject);
    if (!JS_IsObject(obj))
    {
        return 0;
    }
    if (JS_SetPropertyStr(ctx, obj, key, JS_DupValue(ctx, *qjsValueFromPesapiValue(pvalue))) < 0)
    {
        catchPendingException(ctx);
        return 0;
    }
    return 1;
}

static int pesapi_get_private(pesapi_env env, pesapi_value pobject, void** out_ptr)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    return FCppObjectMapper::Get(ctx)->GetPrivate(*qjsValueFromPesapiValue(pobject), out_ptr);
}

static int pesapi_set_private(pesapi_env env, pesapi_value pobject, void* ptr)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    bool ret = FCppObjectMapper::Get(ctx)->SetPrivate(*qjsValueFromPesapiValue(pobject), ptr);
    if (!ret)
    {
        clearPendingException(ctx);
    }
    return ret;
}

static pesapi_value pesapi_get_property_uint32(pesapi_env env, pesapi_value pobject, uint32_t key)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    JSValue obj = *qjsValueFromPesapiValue(pobject);
    if (!JS_IsObject(obj))
    {
        return pesapiValueFromQjsValue(&literal_values_undefined);
    }
    JSValue ret = JS_GetPropertyUint32(ctx, obj, key);
    if (JS_IsException(ret))
    {
        catchPendingException(ctx);
        return pesapiValueFromQjsValue(&literal_values_undefined);
    }
    return pushValue(ctx, ret);
}

static int pesapi_set_property_uint32(pesapi_env env, pesapi_value pobject, uint32_t key, pesapi_value pvalue)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    JSValue obj = *qjsValueFromPesapiValue(pobject);
    if (!JS_IsObject(obj))
    {
        return 0;
    }
    if (JS_SetPropertyUint32(ctx, obj, key, JS_DupValue(ctx, *qjsValueFromPesapiValue(pvalue))) < 0)
    {
        catchPendingException(ctx);
        return 0;
    }
    return 1;
}

static pesapi_value pesapi_call_function(
    pesapi_env env, pesapi_value pfunc, pesapi_value this_object, int argc, const pesapi_value argv[])
{
    auto ctx = qjsContextFromPesapiEnv(env);
    JSValue func = *qjsValueFromPesapiValue(pfunc);
    JSValue thisObj = this_object ? *qjsValueFromPesapiValue(this_object) : JS_UNDEFINED;
    std::vector<JSValue> js_argv(argc > 0 ? argc : 1);
    for (int i = 0; i < argc; ++i)
    {
        js_argv[i] = *qjsValueFromPesapiValue(argv[i]);
    }
    JS_UpdateStackTop(JS_GetRuntime(ctx));
    JSValue retOrEx = JS_Call(ctx, func, thisObj, argc, js_argv.data());
    if (JS_IsException(retOrEx))
    {
        catchPendingException(ctx);
        return nullptr;
    }
    return pushValue(ctx, retOrEx);
}

static pesapi_value pesapi_eval(pesapi_env env, const uint8_t* code, size_t code_size, const char* path)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    // JS_Eval reads past the length if the code is not terminated by '\0'
    std::vector<char> buff;
    buff.reserve(code_size + 1);
    buff.insert(buff.end(), code, code + code_size);
    buff.push_back('\0');
    JS_UpdateStackTop(JS_GetRuntime(ctx));
    JSValue retOrEx = JS_Eval(ctx, buff.data(), code_size, path ? path : "<eval>", JS_EVAL_TYPE_GLOBAL);
    if (JS_IsException(retOrEx))
    {
        catchPendingException(ctx);
        return nullptr;
    }
    return pushValue(ctx, retOrEx);
}

static pesapi_value pesapi_global(pesapi_env env)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    return pushValue(ctx, JS_GetGlobalObject(ctx));
}

static const void* pesapi_get_env_private(pesapi_env env)
{
    auto mapper = FCppObjectMapper::Get(qjsContextFromPesapiEnv(env));
    return mapper ? mapper->GetEnvPrivate() : nullptr;
}

static void pesapi_set_env_private(pesapi_env env, const void* ptr)
{
    auto mapper = FCppObjectMapper::Get(qjsContextFromPesapiEnv(env));
    if (mapper)
    {
        mapper->SetEnvPrivate(ptr);
    }
}

static void pesapi_set_registry(pesapi_env env, pesapi_registry registry)
{
    FCppObjectMapper::Get(qjsContextFromPesapiEnv(env))->SetRegistry(reinterpret_cast<ScriptClassRegistry*>(registry));
}

static void pesapi_invalidate_class(pesapi_env env, const void* type_id)
{
    FCppObjectMapper::Get(qjsContextFromPesapiEnv(env))->InvalidateClass(type_id);
}

static pesapi_value pesapi_get_this(pesapi_callback_info pinfo)
{
    return pesapiValueFromQjsValue(&infoFromPesapi(pinfo)->this_val);
}

static void pesapi_throw_error(pesapi_env env, const char* msg)
{
    auto ctx = qjsContextFromPesapiEnv(env);
    JS_Throw(ctx, newError(ctx, msg));
}

static int pesapi_unbind_native_object(pesapi_env env, const void* type_id, void* ptr)
{
    return FCppObjectMapper::Get(qjsContextFromPesapiEnv(env))->UnbindNativeObject(type_id, ptr);
}

pesapi_ffi g_pesapi_ffi{
    &pesapi_create_null,
    &pesapi_create_undefined,
    &pesapi_create_boolean,
    &pesapi_create_int32,
    &pesapi_create_uint32,
    &pesapi_create_int64,
    &pesapi_create_uint64,
    &pesapi_create_double,
    &pesapi_create_string_utf8,
    &pesapi_create_string_utf16,
    &pesapi_create_binary,
    &pesapi_create_binary_by_value,
    &pesapi_create_array,
    &pesapi_create_object,
    &pesapi_create_function,
    &pesapi_create_class,
    &pesapi_get_value_bool,
    &pesapi_get_value_int32,
    &pesapi_get_value_uint32,
    &pesapi_get_value_int64,
    &pesapi_get_value_uint64,
    &pesapi_get_value_double,
    &pesapi_get_value_string_utf8,
    &pesapi_get_value_string_utf16,
    &pesapi_get_value_binary,
    &pesapi_get_array_length,
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
    &pesapi_is_binary,
    &pesapi_is_array,
    &pesapi_native_object_to_value,
    &pesapi_get_native_object_ptr,
    &pesapi_get_native_object_typeid,
    &pesapi_is_instance_of,
    &pesapi_boxing,
    &pesapi_unboxing,
    &pesapi_update_boxed_value,
    &pesapi_is_boxed_value,
    &pesapi_get_args_len,
    &pesapi_get_arg,
    &pesapi_get_env,
    &pesapi_get_native_holder_ptr,
    &pesapi_get_native_holder_typeid,
    &pesapi_get_userdata,
    &pesapi_add_return,
    &pesapi_throw_by_string,
    &pesapi_create_env_ref,
    &pesapi_env_ref_is_valid,
    &pesapi_get_env_from_ref,
    &pesapi_duplicate_env_ref,
    &pesapi_release_env_ref,
    &pesapi_open_scope,
    &pesapi_open_scope_placement,
    &pesapi_has_caught,
    &pesapi_get_exception_as_string,
    &pesapi_close_scope,
    &pesapi_close_scope_placement,
    &pesapi_create_value_ref,
    &pesapi_duplicate_value_ref,
    &pesapi_release_value_ref,
    &pesapi_get_value_from_ref,
    &pesapi_set_ref_weak,
    &pesapi_set_owner,
    &pesapi_get_ref_associated_env,
    &pesapi_get_ref_internal_fields,
    &pesapi_get_property,
    &pesapi_set_property,
    &pesapi_get_private,
    &pesapi_set_private,
    &pesapi_get_property_uint32,
    &pesapi_set_property_uint32,
    &pesapi_call_function,
    &pesapi_eval,
    &pesapi_global,
    &pesapi_get_env_private,
    &pesapi_set_env_private,
    &pesapi_set_registry,
    &pesapi_invalidate_class,
    &pesapi_get_this,
    &pesapi_throw_error,
    &pesapi_unbind_native_object,
};

}    // namespace qjsimpl
}    // namespace PUERTS_NAMESPACE

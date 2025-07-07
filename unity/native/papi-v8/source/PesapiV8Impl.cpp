/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */
 
#include "pesapi.h"
#include "TypeInfo.hpp"
#include "PString.h"
#include "ScriptClassRegistry.h"

#include <string>
#include <sstream>
#include <vector>
#include <cstring>

#include "DataTransfer.h"
#include "ObjectMapper.h"


struct pesapi_env_ref__
{
    explicit pesapi_env_ref__(v8::Local<v8::Context> context)
        : context_persistent(context->GetIsolate(), context)
        , isolate(context->GetIsolate())
        , ref_count(1)
        , env_life_cycle_tracker(puerts::DataTransfer::GetJsEnvLifeCycleTracker(context->GetIsolate()))
    {
    }

    v8::Persistent<v8::Context> context_persistent;
    v8::Isolate* const isolate;
    int ref_count;
    std::weak_ptr<int> env_life_cycle_tracker;
};

struct pesapi_value_ref__ : pesapi_env_ref__
{
    explicit pesapi_value_ref__(v8::Local<v8::Context> context, v8::Local<v8::Value> value, uint32_t field_count)
        : pesapi_env_ref__(context), value_persistent(context->GetIsolate(), value), internal_field_count(field_count)
    {
    }

    v8::Persistent<v8::Value> value_persistent;
    uint32_t internal_field_count;
    void* internal_fields[0];
};

struct pesapi_scope__
{
    explicit pesapi_scope__(v8::Isolate* isolate) : 
#ifdef THREAD_SAFE
        locker(isolate),
#endif
        scope(isolate), trycatch(isolate)
    {
    }
#ifdef THREAD_SAFE
    v8::Locker locker;
#endif
    v8::HandleScope scope;
    v8::TryCatch trycatch;
    puerts::PString errinfo;
};

static_assert(sizeof(pesapi_scope_memory) >= sizeof(pesapi_scope__), "sizeof(pesapi_scope__) > sizeof(pesapi_scope_memory__)");

namespace v8impl
{
static_assert(sizeof(v8::Local<v8::Value>) == sizeof(pesapi_value), "Cannot convert between v8::Local<v8::Value> and pesapi_value");

static_assert(sizeof(v8::Local<v8::Context>) == sizeof(pesapi_env), "Cannot convert between v8::Local<v8::Context> and pesapi_env");

inline pesapi_value PesapiValueFromV8LocalValue(v8::Local<v8::Value> local)
{
    return reinterpret_cast<pesapi_value>(*local);
}

inline v8::Local<v8::Value> V8LocalValueFromPesapiValue(pesapi_value v)
{
    v8::Local<v8::Value> local;
    *reinterpret_cast<pesapi_value*>(&local) = v;
    return local;
}

inline pesapi_env PesapiEnvFromV8LocalContext(v8::Local<v8::Context> local)
{
    return reinterpret_cast<pesapi_env>(*local);
}

inline v8::Local<v8::Context> V8LocalContextFromPesapiEnv(pesapi_env v)
{
    v8::Local<v8::Context> local;
    *reinterpret_cast<pesapi_env*>(&local) = v;
    return local;
}

// value process
pesapi_value pesapi_create_null(pesapi_env env)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    return v8impl::PesapiValueFromV8LocalValue(v8::Null(context->GetIsolate()));
}

pesapi_value pesapi_create_undefined(pesapi_env env)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    return v8impl::PesapiValueFromV8LocalValue(v8::Undefined(context->GetIsolate()));
}

pesapi_value pesapi_create_boolean(pesapi_env env, int value)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    return v8impl::PesapiValueFromV8LocalValue(v8::Boolean::New(context->GetIsolate(), value));
}

pesapi_value pesapi_create_int32(pesapi_env env, int32_t value)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    return v8impl::PesapiValueFromV8LocalValue(v8::Integer::New(context->GetIsolate(), value));
}

pesapi_value pesapi_create_uint32(pesapi_env env, uint32_t value)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    return v8impl::PesapiValueFromV8LocalValue(v8::Integer::NewFromUnsigned(context->GetIsolate(), value));
}

pesapi_value pesapi_create_int64(pesapi_env env, int64_t value)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    return v8impl::PesapiValueFromV8LocalValue(v8::BigInt::New(context->GetIsolate(), value));
}

pesapi_value pesapi_create_uint64(pesapi_env env, uint64_t value)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    return v8impl::PesapiValueFromV8LocalValue(v8::BigInt::NewFromUnsigned(context->GetIsolate(), value));
}

pesapi_value pesapi_create_double(pesapi_env env, double value)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    return v8impl::PesapiValueFromV8LocalValue(v8::Number::New(context->GetIsolate(), value));
}

pesapi_value pesapi_create_string_utf8(pesapi_env env, const char* str, size_t length)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    return v8impl::PesapiValueFromV8LocalValue(
        v8::String::NewFromUtf8(context->GetIsolate(), str, v8::NewStringType::kNormal, static_cast<int>(length)).ToLocalChecked());
}

pesapi_value pesapi_create_string_utf16(pesapi_env env, const uint16_t* str, size_t length)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    return v8impl::PesapiValueFromV8LocalValue(
        v8::String::NewFromTwoByte(context->GetIsolate(), str, v8::NewStringType::kNormal, static_cast<int>(length)).ToLocalChecked());
}

pesapi_value pesapi_create_binary(pesapi_env env, void* bin, size_t length)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    return v8impl::PesapiValueFromV8LocalValue(puerts::DataTransfer::NewArrayBuffer(context, bin, length));
}

pesapi_value pesapi_create_binary_by_value(pesapi_env env, void* bin, size_t length)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    return v8impl::PesapiValueFromV8LocalValue(puerts::DataTransfer::NewArrayBufferCopy(context, bin, length));
}

pesapi_value pesapi_create_array(pesapi_env env)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    return v8impl::PesapiValueFromV8LocalValue(v8::Array::New(context->GetIsolate()));
}

pesapi_value pesapi_create_object(pesapi_env env)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    return v8impl::PesapiValueFromV8LocalValue(v8::Object::New(context->GetIsolate()));
}

pesapi_value pesapi_create_function(pesapi_env env, pesapi_callback native_impl, void* data, pesapi_function_finalize finalize)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto func = puerts::DataTransfer::IsolateData<puerts::ICppObjectMapper>(context->GetIsolate())->CreateFunction(context, native_impl, data, finalize);
    if (func.IsEmpty())
        return nullptr;
    return v8impl::PesapiValueFromV8LocalValue(func.ToLocalChecked());
}

pesapi_value pesapi_create_class(pesapi_env env, const void* type_id)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto cls = puerts::DataTransfer::IsolateData<puerts::ICppObjectMapper>(context->GetIsolate())->LoadTypeById(context, type_id);
    if (cls.IsEmpty())
        return nullptr;
    return v8impl::PesapiValueFromV8LocalValue(cls.ToLocalChecked());
}

int pesapi_get_value_bool(pesapi_env env, pesapi_value pvalue)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return value->BooleanValue(context->GetIsolate());
}

int32_t pesapi_get_value_int32(pesapi_env env, pesapi_value pvalue)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return value->Int32Value(context).ToChecked();
}

uint32_t pesapi_get_value_uint32(pesapi_env env, pesapi_value pvalue)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return value->Uint32Value(context).ToChecked();
}

int64_t pesapi_get_value_int64(pesapi_env env, pesapi_value pvalue)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return value->IsBigInt() ? value->ToBigInt(context).ToLocalChecked()->Int64Value() : 0;
}

uint64_t pesapi_get_value_uint64(pesapi_env env, pesapi_value pvalue)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return value->IsBigInt() ? value->ToBigInt(context).ToLocalChecked()->Uint64Value() : 0;
}

double pesapi_get_value_double(pesapi_env env, pesapi_value pvalue)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return value->NumberValue(context).ToChecked();
}

const char* pesapi_get_value_string_utf8(pesapi_env env, pesapi_value pvalue, char* buf, size_t* bufsize)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);

    if (buf == nullptr)
    {
        auto str = value->ToString(context).ToLocalChecked();
        *bufsize = str->Utf8Length(context->GetIsolate());
    }
    else
    {
        auto str = value->ToString(context).ToLocalChecked();
        str->WriteUtf8(context->GetIsolate(), buf, *bufsize);
    }
    return buf;
}

const uint16_t* pesapi_get_value_string_utf16(pesapi_env env, pesapi_value pvalue, uint16_t* buf, size_t* bufsize)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);

    if (buf == nullptr)
    {
        auto str = value->ToString(context).ToLocalChecked();
        *bufsize = str->Length();
    }
    else
    {
        auto str = value->ToString(context).ToLocalChecked();
        str->Write(context->GetIsolate(), buf, 0, *bufsize);
    }
    return buf;
}

void* pesapi_get_value_binary(pesapi_env env, pesapi_value pvalue, size_t* bufsize)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);

    if (value->IsArrayBufferView())
    {
        v8::Local<v8::ArrayBufferView> buffView = value.As<v8::ArrayBufferView>();
        *bufsize = buffView->ByteLength();
        auto Ab = buffView->Buffer();
        return static_cast<char*>(puerts::DataTransfer::GetArrayBufferData(Ab)) + buffView->ByteOffset();
    }
    if (value->IsArrayBuffer())
    {
        auto ab = v8::Local<v8::ArrayBuffer>::Cast(value);
        return puerts::DataTransfer::GetArrayBufferData(ab, *bufsize);
    }
    return nullptr;
}

uint32_t pesapi_get_array_length(pesapi_env env, pesapi_value pvalue)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    if (value->IsArray())
    {
        return value.As<v8::Array>()->Length();
    }
    return 0;
}

int pesapi_is_null(pesapi_env env, pesapi_value pvalue)
{
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return value->IsNull();
}

int pesapi_is_undefined(pesapi_env env, pesapi_value pvalue)
{
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return value->IsUndefined();
}

int pesapi_is_boolean(pesapi_env env, pesapi_value pvalue)
{
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return value->IsBoolean();
}

int pesapi_is_int32(pesapi_env env, pesapi_value pvalue)
{
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return value->IsInt32();
}

int pesapi_is_uint32(pesapi_env env, pesapi_value pvalue)
{
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return value->IsUint32();
}

int pesapi_is_int64(pesapi_env env, pesapi_value pvalue)
{
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return value->IsBigInt();
}

int pesapi_is_uint64(pesapi_env env, pesapi_value pvalue)
{
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return value->IsBigInt();
}

int pesapi_is_double(pesapi_env env, pesapi_value pvalue)
{
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return value->IsNumber();
}

int pesapi_is_string(pesapi_env env, pesapi_value pvalue)
{
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return value->IsString();
}

int pesapi_is_object(pesapi_env env, pesapi_value pvalue)
{
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return value->IsObject();
}

int pesapi_is_function(pesapi_env env, pesapi_value pvalue)
{
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return value->IsFunction();
}

int pesapi_is_binary(pesapi_env env, pesapi_value pvalue)
{
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return value->IsArrayBuffer() || value->IsArrayBufferView();
}

int pesapi_is_array(pesapi_env env, pesapi_value pvalue)
{
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return value->IsArray();
}

pesapi_value pesapi_native_object_to_value(pesapi_env env, const void* type_id, void* object_ptr, int call_finalize)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    return v8impl::PesapiValueFromV8LocalValue(
        ::puerts::DataTransfer::FindOrAddCData(context->GetIsolate(), context, type_id, object_ptr, !call_finalize));
}

void* pesapi_get_native_object_ptr(pesapi_env env, pesapi_value pvalue)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    if (value.IsEmpty() || !value->IsObject())
        return nullptr;
    return puerts::DataTransfer::GetPointerFast<void>(value.As<v8::Object>());
}

const void* pesapi_get_native_object_typeid(pesapi_env env, pesapi_value pvalue)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    if (value.IsEmpty() || !value->IsObject())
        return nullptr;
    return puerts::DataTransfer::GetPointerFast<void>(value.As<v8::Object>(), 1);
}

int pesapi_is_instance_of(pesapi_env env, const void* type_id, pesapi_value pvalue)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return ::puerts::DataTransfer::IsInstanceOf(context->GetIsolate(), static_cast<const char*>(type_id), value.As<v8::Object>());
}

pesapi_value pesapi_boxing(pesapi_env env, pesapi_value pvalue)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);

    auto result = v8::Object::New(context->GetIsolate());
    auto _unused = result->Set(context, 0, value);
    return v8impl::PesapiValueFromV8LocalValue(result);
}

pesapi_value pesapi_unboxing(pesapi_env env, pesapi_value pvalue)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);

    auto outer = value->ToObject(context).ToLocalChecked();
    auto realvalue = outer->Get(context, 0).ToLocalChecked();
    return v8impl::PesapiValueFromV8LocalValue(realvalue);
}

void pesapi_update_boxed_value(pesapi_env env, pesapi_value boxed_value, pesapi_value pvalue)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto holder = v8impl::V8LocalValueFromPesapiValue(boxed_value);
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    if (holder->IsObject())
    {
        auto outer = holder->ToObject(context).ToLocalChecked();
        auto _unused = outer->Set(context, 0, value);
    }
}

int pesapi_is_boxed_value(pesapi_env env, pesapi_value value)
{
    return pesapi_is_object(env, value);
}

int pesapi_get_args_len(pesapi_callback_info pinfo)
{
    auto info = reinterpret_cast<const v8::FunctionCallbackInfo<v8::Value>*>(pinfo);
    return (*info).Length();
}

pesapi_value pesapi_get_arg(pesapi_callback_info pinfo, int index)
{
    auto info = reinterpret_cast<const v8::FunctionCallbackInfo<v8::Value>*>(pinfo);
    return v8impl::PesapiValueFromV8LocalValue((*info)[index]);
}

PESAPI_EXTERN pesapi_env pesapi_get_env(pesapi_callback_info pinfo)
{
    auto info = reinterpret_cast<const v8::FunctionCallbackInfo<v8::Value>*>(pinfo);
    return v8impl::PesapiEnvFromV8LocalContext((*info).GetIsolate()->GetCurrentContext());
}

void* pesapi_get_native_holder_ptr(pesapi_callback_info pinfo)
{
    auto info = reinterpret_cast<const v8::FunctionCallbackInfo<v8::Value>*>(pinfo);
    return puerts::DataTransfer::GetPointerFast<void>((*info).Holder());
}

const void* pesapi_get_native_holder_typeid(pesapi_callback_info pinfo)
{
    auto info = reinterpret_cast<const v8::FunctionCallbackInfo<v8::Value>*>(pinfo);
    return puerts::DataTransfer::GetPointerFast<void>((*info).Holder(), 1);
}

void* pesapi_get_userdata(pesapi_callback_info pinfo)
{
    auto info = reinterpret_cast<const v8::FunctionCallbackInfo<v8::Value>*>(pinfo);
    return *(static_cast<void**>(v8::Local<v8::External>::Cast((*info).Data())->Value()));
}

void pesapi_add_return(pesapi_callback_info pinfo, pesapi_value value)
{
    auto info = reinterpret_cast<const v8::FunctionCallbackInfo<v8::Value>*>(pinfo);
    (*info).GetReturnValue().Set(v8impl::V8LocalValueFromPesapiValue(value));
}

void pesapi_throw_by_string(pesapi_callback_info pinfo, const char* msg)
{
    auto info = reinterpret_cast<const v8::FunctionCallbackInfo<v8::Value>*>(pinfo);
    v8::Isolate* isolate = info->GetIsolate();
    isolate->ThrowException(
        v8::Exception::Error(v8::String::NewFromUtf8(isolate, msg, v8::NewStringType::kNormal).ToLocalChecked()));
}

pesapi_env_ref pesapi_create_env_ref(pesapi_env env)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    return new pesapi_env_ref__(context);
}

int pesapi_env_ref_is_valid(pesapi_env_ref env_ref)
{
    return !env_ref->env_life_cycle_tracker.expired();
}

pesapi_env pesapi_get_env_from_ref(pesapi_env_ref env_ref)
{
    if (env_ref->env_life_cycle_tracker.expired())
    {
        return nullptr;
    }
    return v8impl::PesapiEnvFromV8LocalContext(env_ref->context_persistent.Get(env_ref->isolate));
}

pesapi_env_ref pesapi_duplicate_env_ref(pesapi_env_ref env_ref)
{
    ++env_ref->ref_count;
    return env_ref;
}

void pesapi_release_env_ref(pesapi_env_ref env_ref)
{
    if (--env_ref->ref_count == 0)
    {
        if (env_ref->env_life_cycle_tracker.expired())
        {
#if V8_MAJOR_VERSION < 11
            env_ref->context_persistent.Empty();
            delete env_ref;
#else
            ::operator delete(static_cast<void*>(env_ref));
#endif
        }
        else
        {
            delete env_ref;
        }
    }
}

pesapi_scope pesapi_open_scope(pesapi_env_ref env_ref)
{
    if (!env_ref || env_ref->env_life_cycle_tracker.expired())
    {
        return nullptr;
    }
    env_ref->isolate->Enter();
    auto scope = new pesapi_scope__(env_ref->isolate);
    env_ref->context_persistent.Get(env_ref->isolate)->Enter();
    return scope;
}

pesapi_scope pesapi_open_scope_placement(pesapi_env_ref env_ref, struct pesapi_scope_memory* memory)
{
    if (!env_ref || env_ref->env_life_cycle_tracker.expired())
    {
        return nullptr;
    }
    env_ref->isolate->Enter();
    auto scope = new (memory) pesapi_scope__(env_ref->isolate);
    env_ref->context_persistent.Get(env_ref->isolate)->Enter();
    return scope;
}

int pesapi_has_caught(pesapi_scope scope)
{
    return (scope && scope->trycatch.HasCaught()) ? 1 : 0;
}

const char* pesapi_get_exception_as_string(pesapi_scope scope, int with_stack)
{
    if (!scope)
        return nullptr;
    scope->errinfo = *v8::String::Utf8Value(scope->scope.GetIsolate(), scope->trycatch.Exception());
    if (with_stack)
    {
        auto isolate = scope->scope.GetIsolate();
        v8::Local<v8::Context> context(isolate->GetCurrentContext());
        v8::Local<v8::Message> message = scope->trycatch.Message();

        // 输出 (filename):(line number): (message).
        std::ostringstream stm;
        v8::String::Utf8Value fileName(isolate, message->GetScriptResourceName());
        int lineNum = message->GetLineNumber(context).FromJust();
        stm << *fileName << ":" << lineNum << ": " << scope->errinfo.c_str();

        stm << std::endl;

        // 输出调用栈信息
        v8::Local<v8::Value> stackTrace;
        if (scope->trycatch.StackTrace(context).ToLocal(&stackTrace))
        {
            v8::String::Utf8Value stackTraceVal(isolate, stackTrace);
            stm << std::endl << *stackTraceVal;
        }
        scope->errinfo = stm.str().c_str();
    }
    return scope->errinfo.c_str();
}

void pesapi_close_scope(pesapi_scope scope)
{
    if (!scope)
        return;
    auto isolate = scope->scope.GetIsolate();
    isolate->GetCurrentContext()->Exit();
    delete (scope);
    isolate->Exit();
}

void pesapi_close_scope_placement(pesapi_scope scope)
{
    if (!scope)
        return;
    auto isolate = scope->scope.GetIsolate();
    isolate->GetCurrentContext()->Exit();
    scope->~pesapi_scope__();
    isolate->Exit();
}

pesapi_value_ref pesapi_create_value_ref(pesapi_env env, pesapi_value pvalue, uint32_t internal_field_count)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    size_t totalSize = sizeof(pesapi_value_ref__) + sizeof(void*) * internal_field_count;
    void* buffer = ::operator new(totalSize);
    return new (buffer) pesapi_value_ref__(context, value, internal_field_count);
}

pesapi_value_ref pesapi_duplicate_value_ref(pesapi_value_ref value_ref)
{
    ++value_ref->ref_count;
    return value_ref;
}

void pesapi_release_value_ref(pesapi_value_ref value_ref)
{
    if (--value_ref->ref_count == 0)
    {
        if (!value_ref->env_life_cycle_tracker.expired())
        {
            value_ref->~pesapi_value_ref__();
        }
        ::operator delete(static_cast<void*>(value_ref));
    }
}

pesapi_value pesapi_get_value_from_ref(pesapi_env env, pesapi_value_ref value_ref)
{
    return v8impl::PesapiValueFromV8LocalValue(value_ref->value_persistent.Get(value_ref->isolate));
}

void pesapi_set_ref_weak(pesapi_env env, pesapi_value_ref value_ref)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    value_ref->value_persistent.SetWeak();
}

int pesapi_set_owner(pesapi_env env, pesapi_value pvalue, pesapi_value powner)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    auto owner = v8impl::V8LocalValueFromPesapiValue(powner);

    if (owner->IsObject())
    {
        auto jsObj = owner.template As<v8::Object>();
#if V8_MAJOR_VERSION < 8
        jsObj->Set(context, v8::String::NewFromUtf8(context->GetIsolate(), "_p_i_only_one_child").ToLocalChecked(), value).Check();
#else
        jsObj->Set(context, v8::String::NewFromUtf8Literal(context->GetIsolate(), "_p_i_only_one_child"), value).Check();
#endif
        return true;
    }
    return false;
}

pesapi_env_ref pesapi_get_ref_associated_env(pesapi_value_ref value_ref)
{
    return value_ref;
}

void** pesapi_get_ref_internal_fields(pesapi_value_ref value_ref, uint32_t* pinternal_field_count)
{
    *pinternal_field_count = value_ref->internal_field_count;
    return &value_ref->internal_fields[0];
}

pesapi_value pesapi_get_property(pesapi_env env, pesapi_value pobject, const char* key)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto object = v8impl::V8LocalValueFromPesapiValue(pobject);
    if (object->IsObject())
    {
        auto MaybeValue = object.As<v8::Object>()->Get(
            context, v8::String::NewFromUtf8(context->GetIsolate(), key, v8::NewStringType::kNormal).ToLocalChecked());
        v8::Local<v8::Value> Val;
        if (MaybeValue.ToLocal(&Val))
        {
            return v8impl::PesapiValueFromV8LocalValue(Val);
        }
    }
    return pesapi_create_undefined(env);
}

void pesapi_set_property(pesapi_env env, pesapi_value pobject, const char* key, pesapi_value pvalue)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto object = v8impl::V8LocalValueFromPesapiValue(pobject);
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);

    if (object->IsObject())
    {
        auto _un_used = object.As<v8::Object>()->Set(
            context, v8::String::NewFromUtf8(context->GetIsolate(), key, v8::NewStringType::kNormal).ToLocalChecked(), value);
    }
}

int pesapi_get_private(pesapi_env env, pesapi_value pobject, void** out_ptr)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto object = v8impl::V8LocalValueFromPesapiValue(pobject);
    if (object.IsEmpty() || !object->IsObject())
    {
        *out_ptr = nullptr;
        return false;
    }
    *out_ptr = puerts::DataTransfer::IsolateData<puerts::ICppObjectMapper>(context->GetIsolate())
                   ->GetPrivateData(context, object.As<v8::Object>());
    return true;
}

int pesapi_set_private(pesapi_env env, pesapi_value pobject, void* ptr)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto object = v8impl::V8LocalValueFromPesapiValue(pobject);
    if (object.IsEmpty() || !object->IsObject())
    {
        return false;
    }
    puerts::DataTransfer::IsolateData<puerts::ICppObjectMapper>(context->GetIsolate())
        ->SetPrivateData(context, object.As<v8::Object>(), ptr);
    return true;
}

pesapi_value pesapi_get_property_uint32(pesapi_env env, pesapi_value pobject, uint32_t key)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto object = v8impl::V8LocalValueFromPesapiValue(pobject);
    if (object->IsObject())
    {
        auto MaybeValue = object.As<v8::Object>()->Get(context, key);
        v8::Local<v8::Value> Val;
        if (MaybeValue.ToLocal(&Val))
        {
            return v8impl::PesapiValueFromV8LocalValue(Val);
        }
    }
    return pesapi_create_undefined(env);
}

void pesapi_set_property_uint32(pesapi_env env, pesapi_value pobject, uint32_t key, pesapi_value pvalue)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto object = v8impl::V8LocalValueFromPesapiValue(pobject);
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);

    if (object->IsObject())
    {
        auto _un_used = object.As<v8::Object>()->Set(context, key, value);
    }
}

pesapi_value pesapi_call_function(pesapi_env env, pesapi_value pfunc, pesapi_value this_object, int argc, const pesapi_value argv[])
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    v8::Local<v8::Value> recv = v8::Undefined(context->GetIsolate());
    if (this_object)
    {
        recv = v8impl::V8LocalValueFromPesapiValue(this_object);
    }
    v8::Local<v8::Function> func = v8impl::V8LocalValueFromPesapiValue(pfunc).As<v8::Function>();

    auto maybe_ret = func->Call(context, recv, argc, reinterpret_cast<v8::Local<v8::Value>*>(const_cast<pesapi_value*>(argv)));
    if (maybe_ret.IsEmpty())
    {
        return nullptr;
    }
    return v8impl::PesapiValueFromV8LocalValue(maybe_ret.ToLocalChecked());
}

pesapi_value pesapi_eval(pesapi_env env, const uint8_t* code, size_t code_size, const char* path)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto isolate = context->GetIsolate();
    v8::Local<v8::String> url =
        v8::String::NewFromUtf8(isolate, path == nullptr ? "" : path, v8::NewStringType::kNormal).ToLocalChecked();
    std::vector<char> buff;
    buff.reserve(code_size + 1);
    memcpy(buff.data(), code, code_size);
    buff.data()[code_size] = '\0';
    v8::Local<v8::String> source = v8::String::NewFromUtf8(isolate, buff.data(), v8::NewStringType::kNormal).ToLocalChecked();
#if V8_MAJOR_VERSION > 8
    v8::ScriptOrigin origin(isolate, url);
#else
    v8::ScriptOrigin origin(url);
#endif

    auto CompiledScript = v8::Script::Compile(context, source, &origin);
    if (CompiledScript.IsEmpty())
    {
        return nullptr;
    }
    auto maybe_ret = CompiledScript.ToLocalChecked()->Run(context);
    if (maybe_ret.IsEmpty())
    {
        return nullptr;
    }
    return v8impl::PesapiValueFromV8LocalValue(maybe_ret.ToLocalChecked());
}

pesapi_value pesapi_global(pesapi_env env)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto global = context->Global();
    return v8impl::PesapiValueFromV8LocalValue(global);
}

const void* pesapi_get_env_private(pesapi_env env)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    return puerts::DataTransfer::GetIsolatePrivateData(context->GetIsolate());
}

void pesapi_set_env_private(pesapi_env env, const void* ptr)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    puerts::DataTransfer::SetIsolatePrivateData(context->GetIsolate(), const_cast<void*>(ptr));
}


int pesapi_trace_native_object_lifecycle(pesapi_env env, 
    pesapi_on_native_object_enter on_enter, pesapi_on_native_object_exit on_exit)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    return puerts::DataTransfer::IsolateData<puerts::ICppObjectMapper>(context->GetIsolate())->TraceObjectLifecycle(on_enter, on_exit);
}

void pesapi_set_registry(pesapi_env env, pesapi_registry registry)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    puerts::DataTransfer::IsolateData<puerts::ICppObjectMapper>(context->GetIsolate())->SetRegistry(reinterpret_cast<puerts::ScriptClassRegistry*>(registry));
}

pesapi_ffi g_pesapi_ffi {
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
    &pesapi_trace_native_object_lifecycle,
    &pesapi_set_registry
};

}    // namespace v8impl

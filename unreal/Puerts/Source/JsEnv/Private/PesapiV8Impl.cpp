/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "pesapi.h"
#include "DataTransfer.h"
#include "JSClassRegister.h"

#include <string>
#include <sstream>
#include <vector>

#pragma warning(push, 0)
#include "v8.h"
#pragma warning(pop)

struct pesapi_env_holder__
{
    explicit pesapi_env_holder__(v8::Local<v8::Context> context)
        : isolate(context->GetIsolate()), context_persistent(isolate, context), ref_count(1)
    {
    }
    v8::Isolate* const isolate;
    v8::Persistent<v8::Context> context_persistent;
    int ref_count;
};

struct pesapi_value_holder__
{
    explicit pesapi_value_holder__(v8::Local<v8::Context> context, v8::Local<v8::Value> value)
        : isolate(context->GetIsolate()), value_persistent(isolate, value), ref_count(1)
    {
    }
    v8::Isolate* const isolate;
    v8::Persistent<v8::Value> value_persistent;
    int ref_count;
};

struct pesapi_scope__
{
    explicit pesapi_scope__(v8::Isolate* isolate) : scope(isolate), trycatch(isolate)
    {
    }
    v8::HandleScope scope;
    v8::TryCatch trycatch;
    std::string errinfo;
};

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
    memcpy(static_cast<void*>(&local), &v, sizeof(v));
    return local;
}

inline pesapi_env PesapiEnvFromV8LocalContext(v8::Local<v8::Context> local)
{
    return reinterpret_cast<pesapi_env>(*local);
}

inline v8::Local<v8::Context> V8LocalContextFromPesapiEnv(pesapi_env v)
{
    v8::Local<v8::Context> local;
    memcpy(static_cast<void*>(&local), &v, sizeof(v));
    return local;
}
}    // namespace v8impl

EXTERN_C_START

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

pesapi_value pesapi_create_boolean(pesapi_env env, bool value)
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

bool pesapi_get_value_bool(pesapi_env env, pesapi_value pvalue)
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
    return value->ToBigInt(context).ToLocalChecked()->Int64Value();
}

uint64_t pesapi_get_value_uint64(pesapi_env env, pesapi_value pvalue)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return value->ToBigInt(context).ToLocalChecked()->Uint64Value();
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

bool pesapi_is_null(pesapi_env env, pesapi_value pvalue)
{
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return value->IsNull();
}

bool pesapi_is_undefined(pesapi_env env, pesapi_value pvalue)
{
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return value->IsUndefined();
}

bool pesapi_is_boolean(pesapi_env env, pesapi_value pvalue)
{
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return value->IsBoolean();
}

bool pesapi_is_int32(pesapi_env env, pesapi_value pvalue)
{
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return value->IsInt32();
}

bool pesapi_is_uint32(pesapi_env env, pesapi_value pvalue)
{
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return value->IsUint32();
}

bool pesapi_is_int64(pesapi_env env, pesapi_value pvalue)
{
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return value->IsBigInt();
}

bool pesapi_is_uint64(pesapi_env env, pesapi_value pvalue)
{
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return value->IsBigInt();
}

bool pesapi_is_double(pesapi_env env, pesapi_value pvalue)
{
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return value->IsNumber();
}

bool pesapi_is_string(pesapi_env env, pesapi_value pvalue)
{
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return value->IsString();
}

bool pesapi_is_object(pesapi_env env, pesapi_value pvalue)
{
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return value->IsObject();
}

bool pesapi_is_function(pesapi_env env, pesapi_value pvalue)
{
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return value->IsFunction();
}

pesapi_value pesapi_create_native_object(pesapi_env env, const void* class_id, void* object_ptr, bool copy)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    return v8impl::PesapiValueFromV8LocalValue(::puerts::DataTransfer::FindOrAddCData(
        context->GetIsolate(), context, static_cast<const char*>(class_id), object_ptr, copy));
}

void* pesapi_get_native_object_ptr(pesapi_env env, pesapi_value pvalue)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    if (value.IsEmpty() || !value->IsObject())
        return nullptr;
    return puerts::DataTransfer::GetPointerFast<void>(value.As<v8::Object>());
}

bool pesapi_is_native_object(pesapi_env env, const void* class_id, pesapi_value pvalue)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return ::puerts::DataTransfer::IsInstanceOf(context->GetIsolate(), static_cast<const char*>(class_id), value.As<v8::Object>());
}

pesapi_value pesapi_create_ref(pesapi_env env, pesapi_value pvalue)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);

    auto result = v8::Object::New(context->GetIsolate());
    auto _unused = result->Set(context, v8::String::NewFromUtf8(context->GetIsolate(), "value", v8::NewStringType::kNormal).ToLocalChecked(), value);
    return v8impl::PesapiValueFromV8LocalValue(result);
}

pesapi_value pesapi_get_value_ref(pesapi_env env, pesapi_value pvalue)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);

    auto outer = value->ToObject(context).ToLocalChecked();
    auto realvalue = outer->Get(context, v8::String::NewFromUtf8(context->GetIsolate(), "value", v8::NewStringType::kNormal).ToLocalChecked()).ToLocalChecked();
    return v8impl::PesapiValueFromV8LocalValue(realvalue);
}

void pesapi_update_value_ref(pesapi_env env, pesapi_value ref, pesapi_value pvalue)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto holder = v8impl::V8LocalValueFromPesapiValue(ref);
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    if (holder->IsObject())
    {
        auto outer = holder->ToObject(context).ToLocalChecked();
        auto _unused = outer->Set(context, v8::String::NewFromUtf8(context->GetIsolate(), "value", v8::NewStringType::kNormal).ToLocalChecked(), value);
    }
}

bool pesapi_is_ref(pesapi_env env, pesapi_value value)
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

pesapi_value pesapi_get_this(pesapi_callback_info pinfo)
{
    auto info = reinterpret_cast<const v8::FunctionCallbackInfo<v8::Value>*>(pinfo);
    return v8impl::PesapiValueFromV8LocalValue((*info).This());
}

pesapi_value pesapi_get_holder(pesapi_callback_info pinfo)
{
    auto info = reinterpret_cast<const v8::FunctionCallbackInfo<v8::Value>*>(pinfo);
    return v8impl::PesapiValueFromV8LocalValue((*info).Holder());
}

void pesapi_add_return(pesapi_callback_info pinfo, pesapi_value value)
{
    auto info = reinterpret_cast<const v8::FunctionCallbackInfo<v8::Value>*>(pinfo);
    (*info).GetReturnValue().Set(v8impl::V8LocalValueFromPesapiValue(value));
}

void pesapi_throw_by_string(pesapi_env env, const char* msg)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    v8::Isolate* isolate = context->GetIsolate();
    isolate->ThrowException(v8::Exception::Error(v8::String::NewFromUtf8(isolate, msg, v8::NewStringType::kNormal).ToLocalChecked()));
}

pesapi_env_holder pesapi_hold_env(pesapi_env env)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    return new pesapi_env_holder__(context);
}

pesapi_env pesapi_get_env_from_holder(pesapi_env_holder env_holder)
{
    return v8impl::PesapiEnvFromV8LocalContext(env_holder->context_persistent.Get(env_holder->isolate));
}

pesapi_env_holder pesapi_duplicate_env_holder(pesapi_env_holder env_holder)
{
    ++env_holder->ref_count;
    return env_holder;
}

void pesapi_release_env_holder(pesapi_env_holder env_holder)
{
    if (--env_holder->ref_count == 0)
    {
        delete env_holder;
    }
}

pesapi_scope pesapi_open_scope(pesapi_env_holder env_holder)
{
    env_holder->isolate->Enter();
    auto scope = new pesapi_scope__(env_holder->isolate);
    env_holder->context_persistent.Get(env_holder->isolate)->Enter();
    return scope;
}

bool pesapi_has_caught(pesapi_scope scope)
{
    return scope->trycatch.HasCaught();
}

const char* pesapi_get_exception_as_string(pesapi_scope scope, bool with_stack)
{
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
        stm << *fileName << ":" << lineNum << ": " << scope->errinfo;

        stm << std::endl;

        // 输出调用栈信息
        v8::Local<v8::Value> stackTrace;
        if (scope->trycatch.StackTrace(context).ToLocal(&stackTrace))
        {
            v8::String::Utf8Value stackTraceVal(isolate, stackTrace);
            stm << std::endl << *stackTraceVal;
        }
        scope->errinfo = stm.str();
    }
    return scope->errinfo.c_str();
}

void pesapi_close_scope(pesapi_scope scope)
{
    auto isolate = scope->scope.GetIsolate();
    isolate->GetCurrentContext()->Exit();
    delete (scope);
    isolate->Exit();
}

pesapi_value_holder pesapi_hold_value(pesapi_env env, pesapi_value pvalue)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
    return new pesapi_value_holder__(context, value);
}

pesapi_value_holder pesapi_duplicate_value_holder(pesapi_value_holder value_holder)
{
    ++value_holder->ref_count;
    return value_holder;
}

void pesapi_release_value_holder(pesapi_value_holder value_holder)
{
    if (--value_holder->ref_count == 0)
    {
        delete value_holder;
    }
}

pesapi_value pesapi_get_value_from_holder(pesapi_env env, pesapi_value_holder value_holder)
{
    return v8impl::PesapiValueFromV8LocalValue(value_holder->value_persistent.Get(value_holder->isolate));
}

pesapi_value pesapi_get_property(pesapi_env env, pesapi_value pobject, const char* key)
{
    auto context = v8impl::V8LocalContextFromPesapiEnv(env);
    auto object = v8impl::V8LocalValueFromPesapiValue(pobject);
    if (object->IsObject())
    {
        auto MaybeValue =
            object.As<v8::Object>()->Get(context, v8::String::NewFromUtf8(context->GetIsolate(), key, v8::NewStringType::kNormal).ToLocalChecked());
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
        auto _un_used =
            object.As<v8::Object>()->Set(context, v8::String::NewFromUtf8(context->GetIsolate(), key, v8::NewStringType::kNormal).ToLocalChecked(), value);
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
    else
    {
        return v8impl::PesapiValueFromV8LocalValue(maybe_ret.ToLocalChecked());
    }
}

void pesapi_define_class(const char* type_name, const char* super_type_name, pesapi_constructor constructor,
    pesapi_finalize finalize, size_t property_count, const pesapi_property_descriptor* properties)
{
    puerts::JSClassDefinition classDef = JSClassEmptyDefinition;
    classDef.CPPTypeName = type_name;
    classDef.CPPSuperTypeName = super_type_name;

    std::vector<puerts::JSFunctionInfo> p_methods;
    std::vector<puerts::JSFunctionInfo> p_functions;
    std::vector<puerts::JSPropertyInfo> p_properties;

    for (int i = 0; i < property_count; i++)
    {
        const pesapi_property_descriptor* p = properties + i;
        if (p->getter != nullptr || p->setter != nullptr)
        {
            p_properties.push_back({p->name, reinterpret_cast<v8::FunctionCallback>(p->getter),
                reinterpret_cast<v8::FunctionCallback>(p->setter), p->data});
        }
        else if (p->method != nullptr)
        {
            puerts::JSFunctionInfo finfo{p->name, reinterpret_cast<v8::FunctionCallback>(p->method), p->data};
            if (p->is_static)
            {
                p_functions.push_back(finfo);
            }
            else
            {
                p_methods.push_back(finfo);
            }
        }
    }

    p_methods.push_back({nullptr, nullptr, nullptr});
    p_functions.push_back({nullptr, nullptr, nullptr});
    p_properties.push_back({nullptr, nullptr, nullptr, nullptr});

    classDef.Methods = p_methods.data();
    classDef.Functions = p_functions.data();
    classDef.Properties = p_properties.data();

    puerts::RegisterJSClass(classDef);
}

EXTERN_C_END

/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include "Pesapi.h"
#include "DataTransfer.h"

#pragma warning(push, 0) 
#include "v8.h"
#pragma warning(pop)

namespace v8impl
{
	static_assert(sizeof(v8::Local<v8::Value>) == sizeof(pesapi_value),
	"Cannot convert between v8::Local<v8::Value> and pesapi_value");

	static_assert(sizeof(v8::Local<v8::Context>) == sizeof(pesapi_env),
	"Cannot convert between v8::Local<v8::Context> and pesapi_env");

	inline pesapi_value PesapiValueFromV8LocalValue(v8::Local<v8::Value> local) {
		return reinterpret_cast<pesapi_value>(*local);
	}

	inline v8::Local<v8::Value> V8LocalValueFromPesapiValue(pesapi_value v) {
		v8::Local<v8::Value> local;
		memcpy(static_cast<void*>(&local), &v, sizeof(v));
		return local;
	}

	inline pesapi_env PesapiEnvFromV8LocalContext(v8::Local<v8::Context> local) {
		return reinterpret_cast<pesapi_env>(*local);
	}

	inline v8::Local<v8::Context> V8LocalContextFromPesapiEnv(pesapi_env v) {
		v8::Local<v8::Context> local;
		memcpy(static_cast<void*>(&local), &v, sizeof(v));
		return local;
	}
}

//#ifdef __cplusplus
//extern "C" {
//#endif

//value process
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
	return v8impl::PesapiValueFromV8LocalValue(v8::String::NewFromUtf8(context->GetIsolate(),
		str, v8::NewStringType::kNormal, static_cast<int>(length)).ToLocalChecked());
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

pesapi_value pesapi_create_native_object(pesapi_env env, void* class_id, void* object_ptr, bool copy)
{
	auto context = v8impl::V8LocalContextFromPesapiEnv(env);
	return v8impl::PesapiValueFromV8LocalValue(::puerts::DataTransfer::FindOrAddCData(context->GetIsolate(), context,
		static_cast<char*>(class_id), object_ptr, copy));
}

void* pesapi_get_native_object_ptr(pesapi_env env, pesapi_value pvalue)
{
	auto context = v8impl::V8LocalContextFromPesapiEnv(env);
	auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
	if (value.IsEmpty() || !value->IsObject()) return nullptr;
	return puerts::DataTransfer::GetPointerFast<void>(value.As<v8::Object>());
}

bool pesapi_is_native_object(pesapi_env env, void* class_id, pesapi_value pvalue)
{
	auto context = v8impl::V8LocalContextFromPesapiEnv(env);
	auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
	return ::puerts::DataTransfer::IsInstanceOf(context->GetIsolate(),
		static_cast<char*>(class_id), value.As<v8::Object>());
}

pesapi_value pesapi_create_ref(pesapi_env env, pesapi_value pvalue)
{
	auto context = v8impl::V8LocalContextFromPesapiEnv(env);
	auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
	
	auto result = v8::Object::New(context->GetIsolate());
	auto _unused = result->Set(context,
		v8::String::NewFromUtf8(context->GetIsolate(), "value").ToLocalChecked(), value);
	return v8impl::PesapiValueFromV8LocalValue(result);
}

pesapi_value pesapi_get_value_ref(pesapi_env env, pesapi_value pvalue)
{
	auto context = v8impl::V8LocalContextFromPesapiEnv(env);
	auto value = v8impl::V8LocalValueFromPesapiValue(pvalue);
	
	auto outer = value->ToObject(context).ToLocalChecked();
	auto realvalue = outer->Get(context,
		v8::String::NewFromUtf8(context->GetIsolate(), "value").ToLocalChecked()).ToLocalChecked();
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
		auto _unused = outer->Set(context,
			v8::String::NewFromUtf8(context->GetIsolate(), "value").ToLocalChecked(),
			value);
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

void pesapi_set_return(pesapi_callback_info pinfo, pesapi_value value)
{
	auto info = reinterpret_cast<const v8::FunctionCallbackInfo<v8::Value>*>(pinfo);
	(*info).GetReturnValue().Set(v8impl::V8LocalValueFromPesapiValue(value));
}

void pesapi_throw_by_string(pesapi_env env, const char* msg)
{
	auto context = v8impl::V8LocalContextFromPesapiEnv(env);
	v8::Isolate* isolate = context->GetIsolate();
	isolate->ThrowException(v8::Exception::Error(v8::String::NewFromUtf8(isolate,
		msg).ToLocalChecked()));
}

//#ifdef __cplusplus
//}
//#endif
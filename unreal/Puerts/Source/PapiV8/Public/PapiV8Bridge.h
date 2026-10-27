/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

// Bridge between pesapi handles and v8 handles, only usable inside the unreal plugin (where the pesapi implementation is
// v8impl, see PesapiV8Impl.cpp). It lets pesapi_impl converters reuse the v8_impl converters of UE types with no extra
// overhead, since pesapi_value/pesapi_env are just the reinterpreted v8::Local<v8::Value>/v8::Local<v8::Context>.

#include "CoreMinimal.h"
#include "pesapi.h"
#include "NamespaceDef.h"
#include <type_traits>

PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS
MSVC_PRAGMA(warning(push, 0))
#include "v8.h"
MSVC_PRAGMA(warning(pop))
PRAGMA_ENABLE_UNDEFINED_IDENTIFIER_WARNINGS

namespace PUERTS_NAMESPACE
{
namespace papi_bridge
{
static_assert(sizeof(v8::Local<v8::Value>) == sizeof(pesapi_value), "Cannot convert between v8::Local<v8::Value> and pesapi_value");

static_assert(sizeof(v8::Local<v8::Context>) == sizeof(pesapi_env), "Cannot convert between v8::Local<v8::Context> and pesapi_env");

V8_INLINE v8::Local<v8::Value> ToV8(pesapi_value Value)
{
    v8::Local<v8::Value> Local;
    *reinterpret_cast<pesapi_value*>(&Local) = Value;
    return Local;
}

V8_INLINE pesapi_value ToPapi(v8::Local<v8::Value> Local)
{
    return reinterpret_cast<pesapi_value>(*Local);
}

// v8::Local<T> has an unconstrained converting constructor, so v8::Local<v8::Object> etc. would be ambiguous between the
// pesapi_value and pesapi_env overloads without this exact-match one.
template <typename T, typename std::enable_if<std::is_base_of<v8::Value, T>::value, int>::type = 0>
V8_INLINE pesapi_value ToPapi(v8::Local<T> Local)
{
    return reinterpret_cast<pesapi_value>(*Local);
}

V8_INLINE v8::Local<v8::Context> ToV8(pesapi_env Env)
{
    v8::Local<v8::Context> Local;
    *reinterpret_cast<pesapi_env*>(&Local) = Env;
    return Local;
}

V8_INLINE pesapi_env ToPapi(v8::Local<v8::Context> Local)
{
    return reinterpret_cast<pesapi_env>(*Local);
}

V8_INLINE const v8::FunctionCallbackInfo<v8::Value>& ToV8(pesapi_callback_info Info)
{
    return *reinterpret_cast<const v8::FunctionCallbackInfo<v8::Value>*>(Info);
}

V8_INLINE pesapi_callback_info ToPapi(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    return reinterpret_cast<pesapi_callback_info>(const_cast<v8::FunctionCallbackInfo<v8::Value>*>(&Info));
}

V8_INLINE v8::Isolate* IsolateOf(pesapi_env Env)
{
    return ToV8(Env)->GetIsolate();
}

// the receiver of a callback, the same as v8::FunctionCallbackInfo::Holder() for our templates (no v8::Signature is used)
V8_INLINE v8::Local<v8::Object> HolderOf(pesapi_callback_info Info)
{
#if V8_MAJOR_VERSION > 13 || (V8_MAJOR_VERSION == 13 && V8_MINOR_VERSION >= 6)
    return ToV8(Info).This();
#else
    return ToV8(Info).Holder();
#endif
}
}    // namespace papi_bridge
}    // namespace PUERTS_NAMESPACE

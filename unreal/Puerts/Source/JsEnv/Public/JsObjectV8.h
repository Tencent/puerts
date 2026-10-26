/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

// v8 specific helpers of FJsObject (part of the v8 backend): building one from v8 handles and the v8_impl converter used
// when the template binding is switched to v8_impl.

#include "JsObject.h"
#include "JSClassRegister.h"
#include "PapiV8Bridge.h"
#include "V8Backend.hpp"

namespace PUERTS_NAMESPACE
{
inline FJsObject MakeJsObject(v8::Local<v8::Context> Context, v8::Local<v8::Value> Value)
{
    return FJsObject(GetPesapiFFI(), papi_bridge::ToPapi(Context), papi_bridge::ToPapi(Value));
}

inline v8::Local<v8::Value> JsObjectToV8(v8::Local<v8::Context> Context, const FJsObject& Object)
{
    return papi_bridge::ToV8(Object.GetValue(GetPesapiFFI(), papi_bridge::ToPapi(Context)));
}

namespace v8_impl
{
template <>
struct Converter<FJsObject>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, const FJsObject& value)
    {
        return JsObjectToV8(context, value);
    }

    static FJsObject toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return MakeJsObject(context, value);
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsObject();
    }
};
}    // namespace v8_impl
}    // namespace PUERTS_NAMESPACE

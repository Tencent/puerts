/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#if BUILDING_PES_EXTENSION
#include "PesapiObject.hpp"
#else
#include "V8Object.hpp"
#endif

namespace puerts
{
template <typename R, typename... Args>
struct ScriptTypeName<std::function<R(Args...)>>
{
    static constexpr const char* value = "Function";
};

namespace converter
{
template <typename R, typename... Args>
struct Converter<std::function<R(Args...)>>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, std::function<R(Args...)> value)
    {
        return GetUndefined(context);
    }

    static std::function<R(Args...)> toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        Function PF(context, value.As<v8::Object>());
        return [=](Args... cppArgs) -> R { return PF.Func<R>(cppArgs...); };
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return Converter<Function>::accept(context, value);
    }
};

template <typename... Args>
struct Converter<std::function<void(Args...)>>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, std::function<void(Args...)> value)
    {
        return GetUndefined(context);
    }

    static std::function<void(Args...)> toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        Function PF(context, value.As<v8::Object>());
        return [=](Args... cppArgs) -> void { PF.Action(cppArgs...); };
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return Converter<Function>::accept(context, value);
    }
};
}    // namespace converter
}    // namespace puerts

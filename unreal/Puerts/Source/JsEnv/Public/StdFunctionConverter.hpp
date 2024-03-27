/*
 * Tencent is pleased to support the open source community by making puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */
#pragma once
template <typename R, typename... Args>
struct Converter<std::function<R(Args...)>>
{
    static API::ValueType toScript(API::ContextType context, std::function<R(Args...)> value)
    {
        return API::GetUndefined(context);
    }

    static std::function<R(Args...)> toCpp(API::ContextType context, const API::ValueType value)
    {
        if (API::IsNullOrUndefined(context, value))
            return nullptr;
        Function PF(context, value);
        return [=](Args... cppArgs) -> R { return PF.Func<R>(cppArgs...); };
    }

    static bool accept(API::ContextType context, const API::ValueType value)
    {
        return API::IsNullOrUndefined(context, value) || Converter<Function>::accept(context, value);
    }
};

template <typename... Args>
struct Converter<std::function<void(Args...)>>
{
    static API::ValueType toScript(API::ContextType context, std::function<void(Args...)> value)
    {
        return API::GetUndefined(context);
    }

    static std::function<void(Args...)> toCpp(API::ContextType context, const API::ValueType value)
    {
        if (API::IsNullOrUndefined(context, value))
            return nullptr;
        Function PF(context, value);
        return [=](Args... cppArgs) -> void { PF.Action(cppArgs...); };
    }

    static bool accept(API::ContextType context, const API::ValueType value)
    {
        return API::IsNullOrUndefined(context, value) || Converter<Function>::accept(context, value);
    }
};

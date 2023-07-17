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
constexpr std::size_t NumDigits(std::size_t n)
{
    return n < 10 ? 1 : NumDigits(n / 10) + 1;
}

template <char... Chars>
struct CharList
{
    const char Str[sizeof...(Chars)] = {Chars...};
};

template <std::size_t D, std::size_t N, char... Chars>
struct SI2A
{
    using type = typename SI2A<D - 1, N / 10, '0' + N % 10, Chars...>::type;
};

template <std::size_t N, char... Chars>
struct SI2A<1, N, Chars...>
{
    using type = CharList<'0' + N, Chars..., '\0'>;
};

template <std::size_t N>
using SI2A_T = typename SI2A<NumDigits(N), N>::type;

template <size_t N, typename... Rest>
struct ParamsDecl
{
};

template <size_t N, typename T, typename... Rest>
struct ParamsDecl<N, T, Rest...>
{
    static constexpr auto Get()
    {
        return ParamsDecl<N, T>::Get() + Literal(", ") + ParamsDecl<N + 1, Rest...>::Get();
    }
};

template <size_t N, typename T>
struct ParamsDecl<N, T>
{
    static constexpr auto Get()
    {
        return Literal("p") + Literal(SI2A_T<N>().Str) + Literal(":") + ScriptTypeNameWithNamespace<T>::value();
    }
};

template <size_t N>
struct ParamsDecl<N>
{
    static constexpr auto Get()
    {
        return Literal("");
    }
};

template <typename R, typename... Args>
struct ScriptTypeName<std::function<R(Args...)>>
{
    static constexpr auto value()
    {
        return Literal("(") + ParamsDecl<0, Args...>::Get() + Literal(") => ") + ScriptTypeNameWithNamespace<R>::value();
    }
};

namespace converter
{
template <typename R, typename... Args>
struct Converter<std::function<R(Args...)>>
{
    static PUERTS_BINDING_IMPL::API::ValueType toScript(
        PUERTS_BINDING_IMPL::API::ContextType context, std::function<R(Args...)> value)
    {
        return PUERTS_BINDING_IMPL::API::GetUndefined(context);
    }

    static std::function<R(Args...)> toCpp(
        PUERTS_BINDING_IMPL::API::ContextType context, const PUERTS_BINDING_IMPL::API::ValueType value)
    {
        if (PUERTS_BINDING_IMPL::API::IsNullOrUndefined(context, value))
            return nullptr;
        Function PF(context, value);
        return [=](Args... cppArgs) -> R { return PF.Func<R>(cppArgs...); };
    }

    static bool accept(PUERTS_BINDING_IMPL::API::ContextType context, const PUERTS_BINDING_IMPL::API::ValueType value)
    {
        return PUERTS_BINDING_IMPL::API::IsNullOrUndefined(context, value) || Converter<Function>::accept(context, value);
    }
};

template <typename... Args>
struct Converter<std::function<void(Args...)>>
{
    static PUERTS_BINDING_IMPL::API::ValueType toScript(
        PUERTS_BINDING_IMPL::API::ContextType context, std::function<void(Args...)> value)
    {
        return PUERTS_BINDING_IMPL::API::GetUndefined(context);
    }

    static std::function<void(Args...)> toCpp(
        PUERTS_BINDING_IMPL::API::ContextType context, const PUERTS_BINDING_IMPL::API::ValueType value)
    {
        if (PUERTS_BINDING_IMPL::API::IsNullOrUndefined(context, value))
            return nullptr;
        Function PF(context, value);
        return [=](Args... cppArgs) -> void { PF.Action(cppArgs...); };
    }

    static bool accept(PUERTS_BINDING_IMPL::API::ContextType context, const PUERTS_BINDING_IMPL::API::ValueType value)
    {
        return PUERTS_BINDING_IMPL::API::IsNullOrUndefined(context, value) || Converter<Function>::accept(context, value);
    }
};
}    // namespace converter
}    // namespace puerts

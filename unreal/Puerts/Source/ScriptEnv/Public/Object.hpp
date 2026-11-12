/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "BindingImpl.h"
#include "PesapiObject.hpp"
#if !PUERTS_BINDING_IS_PESAPI
#include "V8Object.hpp"
#endif

namespace PUERTS_NAMESPACE
{
namespace internal
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

// the declaration of a std::function parameter, matches how it is passed to script (see ScriptCallArg.hpp): a non-const
// reference of a non object type is a $Ref, others are declared as the type itself
template <typename T, typename Enable = void>
struct StdFunctionParamDecl
{
    static constexpr auto Get()
    {
        return ScriptTypeNameWithNamespace<typename std::remove_cv<typename std::remove_reference<T>::type>::type>::value();
    }
};

template <typename T>
struct StdFunctionParamDecl<T&,
    typename std::enable_if<!std::is_const<T>::value && !is_objecttype<T>::value && !is_uetype<T>::value>::type>
{
    static constexpr auto Get()
    {
        return Literal("$Ref<") + ScriptTypeNameWithNamespace<T>::value() + Literal(">");
    }
};

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
        return Literal("p") + Literal(SI2A_T<N>().Str) + Literal(":") + StdFunctionParamDecl<T>::Get();
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

}    // namespace internal

template <typename R, typename... Args>
struct ScriptTypeName<std::function<R(Args...)>>
{
    static constexpr auto value()
    {
        return internal::Literal("(") + internal::ParamsDecl<0, Args...>::Get() + internal::Literal(") => ") +
               ScriptTypeNameWithNamespace<R>::value();
    }
};

}    // namespace PUERTS_NAMESPACE

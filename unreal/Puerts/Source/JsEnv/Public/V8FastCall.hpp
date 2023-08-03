/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#pragma warning(push, 0)
#include <v8-fast-api-calls.h>
#pragma warning(pop)
#include "DataTransfer.h"

namespace puerts
{
template <typename T, typename Enable = void>
struct FastCallArgument
{
};

template <typename T>
struct FastCallArgument<T, typename std::enable_if<std::is_pointer<T>::value && !std::is_same<T, const char*>::value &&
                                                   !std::is_enum<typename std::remove_pointer<T>::type>::value &&
                                                   !std::is_integral<typename std::remove_pointer<T>::type>::value &&
                                                   !std::is_floating_point<typename std::remove_pointer<T>::type>::value>::type>
{
    using DeclType = v8::Local<v8::Value>;

    static T Get(v8::Local<v8::Value> v)
    {
        if (V8_LIKELY(v->IsObject()))
        {
            // return static_cast<T>(v.As<v8::Object>()->GetAlignedPointerFromInternalField(1));
            return static_cast<T>(DataTransfer::GetPointerFast<void>(v.As<v8::Object>()));
        }
        return nullptr;
    }
};

template <>
struct FastCallArgument<std::string*>
{
};

template <typename T>
struct FastCallArgument<T, typename std::enable_if<std::is_enum<T>::value>::type>
{
    using DeclType = int;

    static T Get(int i)
    {
        return static_cast<T>(i);
    }
};

template <typename T>
struct FastCallArgument<T, typename std::enable_if<std::is_integral<T>::value || std::is_floating_point<T>::value>::type>
{
    using DeclType = typename std::decay<T>::type;

    static T Get(typename std::decay<T>::type i)
    {
        return i;
    }
};

template <>
struct FastCallArgument<bool>
{
    using DeclType = bool;

    static bool Get(bool i)
    {
        return i;
    }
};

namespace internal
{
namespace fastcallutil
{
template <bool _First_value, class _First, class... _Rest>
struct _Conjunction
{    // handle false trait or last trait
    using type = _First;
};

template <class _True, class _Next, class... _Rest>
struct _Conjunction<true, _True, _Next, _Rest...>
{    // the first trait is true, try the next one
    using type = typename _Conjunction<_Next::value, _Next, _Rest...>::type;
};

template <class... _Traits>
struct Conjunction : std::true_type
{
};    // If _Traits is empty, true_type

template <class _First, class... _Rest>
struct Conjunction<_First, _Rest...> : _Conjunction<_First::value, _First, _Rest...>::type
{
    // the first false trait in _Traits, or the last trait if none are false
};

template <class...>
using Void_t = void;
}    // namespace fastcallutil
}    // namespace internal

template <typename T, typename = void>
struct IsArgSupportedHelper : std::false_type
{
};

template <typename T>
struct IsArgSupportedHelper<T, internal::fastcallutil::Void_t<decltype(&FastCallArgument<T>::Get)>> : std::true_type
{
};

template <typename T, typename = void>
struct IsArgsSupportedHelper : std::false_type
{
};

template <typename... Args>
struct IsArgsSupportedHelper<std::tuple<Args...>,
    typename std::enable_if<internal::fastcallutil::Conjunction<IsArgSupportedHelper<Args>...>::value>::type> : std::true_type
{
};

template <typename T, typename = void>
struct IsReturnSupportedHelper : std::false_type
{
};

template <typename T>
struct IsReturnSupportedHelper<T,
    typename std::enable_if<IsArgSupportedHelper<T>::value && !std::is_pointer<T>::value && !std::is_integral<T>::value>::type>
    : std::true_type
{
};

template <typename T>
struct IsReturnSupportedHelper<T, typename std::enable_if<std::is_integral<T>::value && sizeof(T) < 8>::type> : std::true_type
{
};

template <>
struct IsReturnSupportedHelper<void> : std::true_type
{
};

template <typename T, T, typename Enable = void>
struct V8FastCall
{
    static const v8::CFunction* info()
    {
        return nullptr;
    }
};

template <typename Ret, typename... Args, Ret (*func)(Args...)>
struct V8FastCall<Ret (*)(Args...), func,
    typename std::enable_if<IsReturnSupportedHelper<Ret>::value && IsArgsSupportedHelper<std::tuple<Args...>>::value &&
                            (sizeof...(Args) > 0)>::type>
{
    static Ret Wrap(typename FastCallArgument<Args>::DeclType... args)
    {
        return func(FastCallArgument<Args>::Get(args)...);
    }

    static const v8::CFunction* info()
    {
#if defined(V8_STATIC_FUNCTION_FAST_CALL)
        static v8::CFunction _info = v8::CFunction::Make(Wrap);
        return &_info;
#else
        return nullptr;
#endif
    }
};

template <typename Inc, typename Ret, typename... Args, Ret (Inc::*func)(Args...)>
struct V8FastCall<Ret (Inc::*)(Args...), func,
    typename std::enable_if<IsReturnSupportedHelper<Ret>::value && IsArgsSupportedHelper<std::tuple<Args...>>::value>::type>
{
    static Ret Wrap(v8::Local<v8::Object> receiver_obj, typename FastCallArgument<Args>::DeclType... args)
    {
        auto self = FastCallArgument<Inc*>::Get(receiver_obj);
        return (self->*func)(FastCallArgument<Args>::Get(args)...);
    }

    static const v8::CFunction* info()
    {
        static v8::CFunction _info = v8::CFunction::Make(Wrap);
        return &_info;
    }
};

template <typename Inc, typename Ret, typename... Args, Ret (Inc::*func)(Args...) const>
struct V8FastCall<Ret (Inc::*)(Args...) const, func,
    typename std::enable_if<IsReturnSupportedHelper<Ret>::value && IsArgsSupportedHelper<std::tuple<Args...>>::value>::type>
{
    static Ret Wrap(v8::Local<v8::Object> receiver_obj, typename FastCallArgument<Args>::DeclType... args)
    {
        auto self = FastCallArgument<Inc*>::Get(receiver_obj);
        return (self->*func)(FastCallArgument<Args>::Get(args)...);
    }

    static const v8::CFunction* info()
    {
        static v8::CFunction _info = v8::CFunction::Make(Wrap);
        return &_info;
    }
};

}    // namespace puerts

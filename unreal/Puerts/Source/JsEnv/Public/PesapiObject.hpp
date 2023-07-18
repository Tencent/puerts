/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#if defined(BUILDING_PES_EXTENSION)

#include "Binding.hpp"

#include <iostream>
#define REPORT_EXCEPTION(MSG) std::cout << "call function throw: " << MSG << std::endl

namespace puerts
{
namespace internal
{
class AutoValueScope
{
public:
    AutoValueScope(pesapi_env_holder env_holder)
    {
        scope = pesapi_open_scope(env_holder);
    }

    ~AutoValueScope()
    {
        pesapi_close_scope(scope);
    }

    pesapi_scope scope;
};
}    // namespace internal
namespace pesapi_impl
{
class Object
{
public:
    Object(pesapi_env env, pesapi_value value)
    {
        env_holder = pesapi_hold_env(env);
        value_holder = pesapi_hold_value(env, value);
    }

    Object(const Object& InOther)
    {
        env_holder = pesapi_duplicate_env_holder(InOther.env_holder);
        value_holder = pesapi_duplicate_value_holder(InOther.value_holder);
    }

    ~Object()
    {
        pesapi_release_value_holder(value_holder);
        pesapi_release_env_holder(env_holder);
    }

    template <typename T>
    T Get(const char* key) const
    {
        internal::AutoValueScope ValueScope(env_holder);
        auto env = pesapi_get_env_from_holder(env_holder);
        auto object = pesapi_get_value_from_holder(env, value_holder);

        auto value = pesapi_get_property(env, object, key);
        if (!pesapi_is_undefined(env, value))
        {
            return puerts::pesapi_impl::Converter<T>::toCpp(env, value);
        }
        return {};
    }

    template <typename T>
    void Set(const char* key, T val) const
    {
        internal::AutoValueScope ValueScope(env_holder);
        auto env = pesapi_get_env_from_holder(env_holder);
        auto object = pesapi_get_value_from_holder(env, value_holder);

        pesapi_set_property(env, object, key, puerts::pesapi_impl::Converter<T>::toScript(env, val));
    }

    bool IsValid() const
    {
        internal::AutoValueScope ValueScope(env_holder);
        auto env = pesapi_get_env_from_holder(env_holder);
        auto val = pesapi_get_value_from_holder(env, value_holder);
        return val && pesapi_is_object(env, val);
    }

    void operator=(const Object& obj)
    {
        env_holder = pesapi_duplicate_env_holder(obj.env_holder);
        value_holder = pesapi_duplicate_value_holder(obj.value_holder);
    }

    pesapi_env_holder env_holder;
    pesapi_value_holder value_holder;

    friend struct puerts::pesapi_impl::Converter<Object>;
};

class Function : public Object
{
public:
    Function(pesapi_env env, pesapi_value value) : Object(env, value)
    {
    }

    template <typename... Args>
    void Action(Args... cppArgs) const
    {
        internal::AutoValueScope ValueScope(env_holder);
        auto env = pesapi_get_env_from_holder(env_holder);
        auto object = pesapi_get_value_from_holder(env, value_holder);

        auto _un_used = invokeHelper(env, object, cppArgs...);

        if (pesapi_has_caught(ValueScope.scope))
        {
            REPORT_EXCEPTION(pesapi_get_exception_as_string(ValueScope.scope, true));
        }
    }

    template <typename Ret, typename... Args>
    Ret Func(Args... cppArgs) const
    {
        internal::AutoValueScope ValueScope(env_holder);
        auto env = pesapi_get_env_from_holder(env_holder);
        auto object = pesapi_get_value_from_holder(env, value_holder);

        auto ret = invokeHelper(env, object, cppArgs...);

        if (pesapi_has_caught(ValueScope.scope))
        {
            REPORT_EXCEPTION(pesapi_get_exception_as_string(ValueScope.scope, true));
            return {};
        }
        else
        {
            return pesapi_impl::Converter<Ret>::toCpp(env, ret);
        }
    }

    bool IsValid() const
    {
        internal::AutoValueScope ValueScope(env_holder);
        auto env = pesapi_get_env_from_holder(env_holder);
        auto val = pesapi_get_value_from_holder(env, value_holder);
        return val && pesapi_is_function(env, val);
    }

private:
    template <typename... Args>
    auto invokeHelper(pesapi_env env, pesapi_value func, Args... CppArgs) const
    {
        pesapi_value argv[sizeof...(Args)]{puerts::pesapi_impl::Converter<Args>::toScript(env, CppArgs)...};
        return pesapi_call_function(env, func, nullptr, sizeof...(Args), argv);
    }

    auto invokeHelper(pesapi_env env, pesapi_value func) const
    {
        return pesapi_call_function(env, func, nullptr, 0, nullptr);
    }

    friend struct puerts::pesapi_impl::Converter<Function>;
};

}    // namespace pesapi_impl

template <>
struct ScriptTypeName<pesapi_impl::Object>
{
    static constexpr auto value()
    {
        return internal::Literal("object");
    }
};

template <>
struct ScriptTypeName<pesapi_impl::Function>
{
    static constexpr auto value()
    {
        return internal::Literal("Function");
    }
};

namespace pesapi_impl
{
template <>
struct Converter<Object>
{
    static pesapi_value toScript(pesapi_env env, Object value)
    {
        return pesapi_get_value_from_holder(env, value.value_holder);
    }

    static Object toCpp(pesapi_env env, pesapi_value value)
    {
        return Object(env, value);
    }

    static bool accept(pesapi_env env, pesapi_value value)
    {
        return pesapi_is_object(env, value);
    }
};

template <>
struct Converter<Function>
{
    static pesapi_value toScript(pesapi_env env, Function value)
    {
        return pesapi_get_value_from_holder(env, value.value_holder);
    }

    static Function toCpp(pesapi_env env, pesapi_value value)
    {
        return Function(env, value);
    }

    static bool accept(pesapi_env env, pesapi_value value)
    {
        return pesapi_is_function(env, value);
    }
};

#include "StdFunctionConverter.hpp"
}    // namespace pesapi_impl

}    // namespace puerts

#endif

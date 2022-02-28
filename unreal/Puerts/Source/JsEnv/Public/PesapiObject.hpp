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
        if (pesapi_is_undefined(env, value))
        {
            return puerts::converter::Converter<T>::toCpp(env, value);
        }
        return {};
    }

    template <typename T>
    void Set(const char* key, T val) const
    {
        internal::AutoValueScope ValueScope(env_holder);
        auto env = pesapi_get_env_from_holder(env_holder);
        auto object = pesapi_get_value_from_holder(env, value_holder);

        pesapi_set_property(env, object, key, puerts::converter::Converter<T>::toScript(env, val));
    }

protected:
    pesapi_env_holder env_holder;
    pesapi_value_holder value_holder;

    friend struct puerts::converter::Converter<Object>;
};

class Function : public Object
{
public:
    Function(pesapi_env env, pesapi_value value) : Object(env, value), ExceptionMessage(""), HasCaught(false)
    {
    }

    template <typename... Args>
    void Action(Args... cppArgs)
    {
        internal::AutoValueScope ValueScope(env_holder);
        auto env = pesapi_get_env_from_holder(env_holder);
        auto object = pesapi_get_value_from_holder(env, value_holder);

        auto _un_used = invokeHelper(env, object, cppArgs...);

        ExceptionMessage = "";
        HasCaught = pesapi_has_caught(ValueScope.scope);
        if (HasCaught)
        {
            ExceptionMessage = pesapi_get_exception_as_string(ValueScope.scope, true);
        }
    }

    template <typename Ret, typename... Args>
    Ret Func(Args... cppArgs)
    {
        internal::AutoValueScope ValueScope(env_holder);
        auto env = pesapi_get_env_from_holder(env_holder);
        auto object = pesapi_get_value_from_holder(env, value_holder);

        auto ret = invokeHelper(env, object, cppArgs...);

        ExceptionMessage = "";
        HasCaught = pesapi_has_caught(ValueScope.scope);
        if (HasCaught)
        {
            ExceptionMessage = pesapi_get_exception_as_string(ValueScope.scope, true);
            return {};
        }
        else
        {
            return converter::Converter<Ret>::toCpp(env, ret);
        }
    }

    std::string ExceptionMessage;

    bool HasCaught;

private:
    template <typename... Args>
    auto invokeHelper(pesapi_env env, pesapi_value func, Args... CppArgs) const
    {
        pesapi_value argv[sizeof...(Args)]{puerts::converter::Converter<Args>::toScript(env, CppArgs)...};
        return pesapi_call_function(env, func, nullptr, sizeof...(Args), argv);
        ;
    };

    auto invokeHelper(pesapi_env env, pesapi_value func) const
    {
        return pesapi_call_function(env, func, nullptr, 0, nullptr);
    };

    friend struct puerts::converter::Converter<Function>;
};

template <>
struct ScriptTypeName<Object>
{
    static constexpr const char* value = "object";
};

template <>
struct ScriptTypeName<::puerts::Function>
{
    static constexpr const char* value = "Function";
};

namespace converter
{
template <>
struct Converter<::puerts::Object>
{
    static pesapi_value toScript(pesapi_env env, ::puerts::Object value)
    {
        return pesapi_get_value_from_holder(env, value.value_holder);
        ;
    }

    static ::puerts::Object toCpp(pesapi_env env, pesapi_value value)
    {
        return ::puerts::Object(env, value);
    }

    static bool accept(pesapi_env env, pesapi_value value)
    {
        return pesapi_is_object(env, value);
    }
};

template <>
struct Converter<::puerts::Function>
{
    static pesapi_value toScript(pesapi_env env, ::puerts::Function value)
    {
        return pesapi_get_value_from_holder(env, value.value_holder);
        ;
    }

    static ::puerts::Function toCpp(pesapi_env env, pesapi_value value)
    {
        return ::puerts::Function(env, value);
    }

    static bool accept(pesapi_env env, pesapi_value value)
    {
        return pesapi_is_function(env, value);
    }
};
}    // namespace converter

}    // namespace puerts

#endif

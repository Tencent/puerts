/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "Binding.hpp"
#include "pesapi.h"
#include <iostream>

namespace PUERTS_NAMESPACE
{
namespace internal
{
class AutoValueScope
{
public:
    AutoValueScope(pesapi_env_ref env_holder)
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
static inline void REPORT_EXCEPTION(const char* MSG)
{
    std::cout << "call function throw: " << MSG << std::endl;
}

class Object
{
public:
    Object(pesapi_env env, pesapi_value value)
    {
        if (!env || !value || IsNullOrUndefined(env, value))
        {
            env_holder = nullptr;
            value_holder = nullptr;
        }
        else
        {
            env_holder = pesapi_create_env_ref(env);
            value_holder = pesapi_create_value_ref(env, value, 0);
        }
    }

    Object(const Object& InOther)
    {
        if (!InOther.env_holder || !InOther.value_holder)
        {
            env_holder = nullptr;
            value_holder = nullptr;
        }
        else
        {
            env_holder = pesapi_duplicate_env_ref(InOther.env_holder);
            value_holder = pesapi_duplicate_value_ref(InOther.value_holder);
        }
    }

    ~Object()
    {
        if (!env_holder || !value_holder)
            return;
        pesapi_release_value_ref(value_holder);
        pesapi_release_env_ref(env_holder);
    }

    template <typename T>
    T Get(const char* key) const
    {
        if (!env_holder || !value_holder)
            return {};
        internal::AutoValueScope ValueScope(env_holder);
        auto env = pesapi_get_env_from_ref(env_holder);
        auto object = pesapi_get_value_from_ref(env, value_holder);

        auto value = pesapi_get_property(env, object, key);
        if (!pesapi_is_undefined(env, value))
        {
            return pesapi_impl::Converter<T>::toCpp(env, value);
        }
        return {};
    }

    template <typename T>
    void Set(const char* key, T val) const
    {
        if (!env_holder || !value_holder)
            return;
        internal::AutoValueScope ValueScope(env_holder);
        auto env = pesapi_get_env_from_ref(env_holder);
        auto object = pesapi_get_value_from_ref(env, value_holder);

        pesapi_set_property(env, object, key, pesapi_impl::Converter<T>::toScript(env, val));
    }

    bool IsValid() const
    {
        if (!env_holder || !value_holder)
            return false;
        internal::AutoValueScope ValueScope(env_holder);
        auto env = pesapi_get_env_from_ref(env_holder);
        auto val = pesapi_get_value_from_ref(env, value_holder);
        return val && pesapi_is_object(env, val);
    }

    void operator=(const Object& obj)
    {
        env_holder = pesapi_duplicate_env_ref(obj.env_holder);
        value_holder = pesapi_duplicate_value_ref(obj.value_holder);
    }

    pesapi_env_ref env_holder;
    pesapi_value_ref value_holder;

    friend struct pesapi_impl::Converter<Object>;
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
        if (!env_holder || !value_holder)
            return;
        internal::AutoValueScope ValueScope(env_holder);
        auto env = pesapi_get_env_from_ref(env_holder);
        auto object = pesapi_get_value_from_ref(env, value_holder);

        auto _un_used = invokeHelper(env, object, cppArgs...);

        if (pesapi_has_caught(ValueScope.scope))
        {
            REPORT_EXCEPTION(pesapi_get_exception_as_string(ValueScope.scope, true));
        }
    }

    template <typename Ret, typename... Args>
    Ret Func(Args... cppArgs) const
    {
        if (!env_holder || !value_holder)
            return {};
        internal::AutoValueScope ValueScope(env_holder);
        auto env = pesapi_get_env_from_ref(env_holder);
        auto object = pesapi_get_value_from_ref(env, value_holder);

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
        if (!env_holder || !value_holder)
            return false;
        internal::AutoValueScope ValueScope(env_holder);
        auto env = pesapi_get_env_from_ref(env_holder);
        auto val = pesapi_get_value_from_ref(env, value_holder);
        return val && pesapi_is_function(env, val);
    }

    template <typename T>
    void SetWeakAndOwnBy(const T* Owner)
    {
        internal::AutoValueScope ValueScope(env_holder);
        auto env = pesapi_get_env_from_ref(env_holder);

        auto owner = pesapi_native_object_to_value(env, StaticTypeId<T>::get(), Owner, false);
        auto val = pesapi_get_value_from_ref(env, value_holder);
        if (pesapi_set_owner(env, val, owner))
        {
            pesapi_set_ref_weak(env, value_holder);
        }
    }

private:
    template <typename... Args>
    auto invokeHelper(pesapi_env env, pesapi_value func, Args... CppArgs) const
    {
        pesapi_value argv[sizeof...(Args)]{pesapi_impl::Converter<Args>::toScript(env, CppArgs)...};
        return pesapi_call_function(env, func, nullptr, sizeof...(Args), argv);
    }

    auto invokeHelper(pesapi_env env, pesapi_value func) const
    {
        return pesapi_call_function(env, func, nullptr, 0, nullptr);
    }

    friend struct pesapi_impl::Converter<Function>;
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
        return pesapi_get_value_from_ref(env, value.value_holder);
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
        return pesapi_get_value_from_ref(env, value.value_holder);
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

}    // namespace PUERTS_NAMESPACE

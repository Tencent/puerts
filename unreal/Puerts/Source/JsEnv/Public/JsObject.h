/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "NamespaceDef.h"

#include "Binding.hpp"
#include "JSLogger.h"
#include "pesapi.h"

namespace PUERTS_NAMESPACE
{
// Enters the env of a value reference (takes the isolate lock in THREAD_SAFE builds) and catches exceptions. Env is null
// (and an error is logged) if there is no value reference or its env is destroyed.
class FJsObjectScope
{
public:
    FJsObjectScope(struct pesapi_ffi* InApis, pesapi_value_ref ValueRef) : Apis(InApis), Scope(nullptr), Env(nullptr)
    {
        pesapi_env_ref EnvRef = ValueRef ? Apis->get_ref_associated_env(ValueRef) : nullptr;
        if (!EnvRef || !Apis->env_ref_is_valid(EnvRef))
        {
            UE_LOG(Puerts, Error, TEXT("JsEnv associated had release!"));
            return;
        }
        Scope = Apis->open_scope_placement(EnvRef, &Memory);
        Env = Apis->get_env_from_ref(EnvRef);
    }

    ~FJsObjectScope()
    {
        if (Scope)
        {
            Apis->close_scope_placement(Scope);
        }
    }

    FJsObjectScope(const FJsObjectScope&) = delete;
    FJsObjectScope& operator=(const FJsObjectScope&) = delete;

    struct pesapi_ffi* Apis;
    pesapi_scope Scope;
    pesapi_env Env;
    alignas(void*) pesapi_scope_memory Memory;
};
}    // namespace PUERTS_NAMESPACE

#include "CoreMinimal.h"
#include "JsObject.generated.h"

// A js object (or function) held by C++. It is a strong reference: the object stays alive until the FJsObject (and all of
// its copies) is destroyed or its env is destroyed. Accessing it after the env is destroyed logs an error and returns the
// default value. It holds a papi value reference only, so it does not depend on the script engine (the v8::Local based
// helpers are in JsObjectV8.h).
USTRUCT(BlueprintType)
struct JSENV_API FJsObject
{
public:
    GENERATED_USTRUCT_BODY()

    FJsObject() : Apis(nullptr), ValueRef(nullptr)
    {
    }

    // holds Value if it is an object (functions included), otherwise the FJsObject is empty
    FJsObject(struct pesapi_ffi* InApis, pesapi_env Env, pesapi_value Value);

    FJsObject(const FJsObject& InOther);

    FJsObject(FJsObject&& InOther) noexcept;

    ~FJsObject();

    FJsObject& operator=(const FJsObject& InOther);

    FJsObject& operator=(FJsObject&& InOther) noexcept;

    // false if empty or the env it belongs to is destroyed
    bool IsValid() const;

    // the held object in Env (which must be the env it belongs to), undefined if empty or the env is destroyed
    pesapi_value GetValue(struct pesapi_ffi* InApis, pesapi_env Env) const;

    template <typename T>
    T Get(const char* Key) const
    {
        PUERTS_NAMESPACE::FJsObjectScope Scope(Apis, ValueRef);
        if (!Scope.Env)
        {
            return {};
        }
        pesapi_value Object = Apis->get_value_from_ref(Scope.Env, ValueRef);
        pesapi_value Value = Apis->get_property(Scope.Env, Object, Key);
        if (!Value || Apis->is_undefined(Scope.Env, Value))
        {
            return {};
        }
        return PUERTS_NAMESPACE::pesapi_impl::Converter<T>::toCpp(
            PUERTS_NAMESPACE::pesapi_impl::PApiCallbackEnv{Apis, Scope.Env}, Value);
    }

    template <typename T>
    void Set(const char* Key, T Val) const
    {
        PUERTS_NAMESPACE::FJsObjectScope Scope(Apis, ValueRef);
        if (!Scope.Env)
        {
            return;
        }
        pesapi_value Object = Apis->get_value_from_ref(Scope.Env, ValueRef);
        Apis->set_property(Scope.Env, Object, Key,
            PUERTS_NAMESPACE::pesapi_impl::Converter<T>::toScript(
                PUERTS_NAMESPACE::pesapi_impl::PApiCallbackEnv{Apis, Scope.Env}, Val));
    }

    template <typename... Args>
    void Action(Args... CppArgs) const
    {
        PUERTS_NAMESPACE::FJsObjectScope Scope(Apis, ValueRef);
        if (!Scope.Env)
        {
            return;
        }
        Invoke(Scope, CppArgs...);
    }

    template <typename Ret, typename... Args>
    Ret Func(Args... CppArgs) const
    {
        PUERTS_NAMESPACE::FJsObjectScope Scope(Apis, ValueRef);
        if (!Scope.Env)
        {
            return {};
        }
        pesapi_value Result = Invoke(Scope, CppArgs...);
        if (!Result)
        {
            return {};
        }
        return PUERTS_NAMESPACE::pesapi_impl::Converter<Ret>::toCpp(
            PUERTS_NAMESPACE::pesapi_impl::PApiCallbackEnv{Apis, Scope.Env}, Result);
    }

private:
    // calls the held function, returns nullptr (and logs an error) if it is not a function or throws
    template <typename... Args>
    pesapi_value Invoke(PUERTS_NAMESPACE::FJsObjectScope& Scope, Args... CppArgs) const
    {
        pesapi_value Function = Apis->get_value_from_ref(Scope.Env, ValueRef);
        if (!Apis->is_function(Scope.Env, Function))
        {
            UE_LOG(Puerts, Error, TEXT("call a non-function object!"));
            return nullptr;
        }
        pesapi_value Argv[sizeof...(Args) + 1]{PUERTS_NAMESPACE::pesapi_impl::Converter<Args>::toScript(
                                                   PUERTS_NAMESPACE::pesapi_impl::PApiCallbackEnv{Apis, Scope.Env}, CppArgs)...,
            nullptr};
        pesapi_value Result = Apis->call_function(Scope.Env, Function, nullptr, sizeof...(Args), Argv);
        if (Apis->has_caught(Scope.Scope))
        {
            UE_LOG(Puerts, Error, TEXT("call function throw: %s"), UTF8_TO_TCHAR(Apis->get_exception_as_string(Scope.Scope, true)));
            return nullptr;
        }
        return Result;
    }

    void Release();

    struct pesapi_ffi* Apis;
    pesapi_value_ref ValueRef;
};

namespace PUERTS_NAMESPACE
{
template <>
struct ScriptTypeName<FJsObject>
{
    static constexpr auto value()
    {
        return internal::Literal("object");
    }
};

namespace pesapi_impl
{
template <>
struct Converter<FJsObject>
{
    static pesapi_value toScript(PApiCallbackEnv env, const FJsObject& value)
    {
        return value.GetValue(env.apis, env.env);
    }

    static FJsObject toCpp(PApiCallbackEnv env, pesapi_value value)
    {
        return FJsObject(env.apis, env.env, value);
    }

    static bool accept(PApiCallbackEnv env, pesapi_value value)
    {
        return env.apis->is_object(env.env, value) != 0;
    }
};
}    // namespace pesapi_impl
}    // namespace PUERTS_NAMESPACE

// the v8_impl converter, used when the template binding is switched to v8_impl (see ScriptBackend.hpp)
#if !PUERTS_BINDING_IS_PESAPI
#include "JsObjectV8.h"
#endif

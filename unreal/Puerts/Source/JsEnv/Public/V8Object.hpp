/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "Binding.hpp"
#include <memory>

#ifdef USING_IN_UNREAL_ENGINE
#include "JSLogger.h"
#include "V8Utils.h"
#else
#include <iostream>
#endif

namespace PUERTS_NAMESPACE
{
namespace v8_impl
{
static inline void REPORT_EXCEPTION(v8::Isolate* Isolate, v8::TryCatch* TC)
{
#ifdef USING_IN_UNREAL_ENGINE
    UE_LOG(Puerts, Error, TEXT("call function throw: %s"), *FV8Utils::TryCatchToString(Isolate, TC));
#else
    std::cout << "call function throw: " << *v8::String::Utf8Value(Isolate, TC->Exception()) << std::endl;
#endif
}

class Object
{
public:
    Object()
    {
    }

    Object(v8::Local<v8::Context> context, v8::Local<v8::Value> object)
    {
        Isolate = context->GetIsolate();
#ifdef THREAD_SAFE
        v8::Locker Locker(Isolate);
#endif
        GContext.Reset(Isolate, context);
        GObject.Reset(Isolate, object.As<v8::Object>());
        JsEnvLifeCycleTracker = DataTransfer::GetJsEnvLifeCycleTracker(Isolate);
    }

    Object(const Object& InOther)
    {
        if (InOther.JsEnvLifeCycleTracker.expired())
        {
            JsEnvLifeCycleTracker = InOther.JsEnvLifeCycleTracker;
            return;
        }
        Isolate = InOther.Isolate;
#ifdef THREAD_SAFE
        v8::Locker Locker(Isolate);
#endif
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        GContext.Reset(Isolate, InOther.GContext.Get(Isolate));
        GObject.Reset(Isolate, InOther.GObject.Get(Isolate));
        JsEnvLifeCycleTracker = DataTransfer::GetJsEnvLifeCycleTracker(Isolate);
    }

    Object& operator=(const Object& InOther)
    {
        if (InOther.JsEnvLifeCycleTracker.expired())
        {
            JsEnvLifeCycleTracker = InOther.JsEnvLifeCycleTracker;
            return *this;
        }
        Isolate = InOther.Isolate;
#ifdef THREAD_SAFE
        v8::Locker Locker(Isolate);
#endif
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        GContext.Reset(Isolate, InOther.GContext.Get(Isolate));
        GObject.Reset(Isolate, InOther.GObject.Get(Isolate));
        JsEnvLifeCycleTracker = DataTransfer::GetJsEnvLifeCycleTracker(Isolate);
        return *this;
    }

    ~Object()
    {
        if (JsEnvLifeCycleTracker.expired())
        {
#ifdef THREAD_SAFE
            v8::Locker Locker(Isolate);
#endif
            GObject.Empty();
            GContext.Empty();
        }
    }

    template <typename T>
    T Get(const char* key) const
    {
        if (JsEnvLifeCycleTracker.expired())
        {
            return {};
        }
#ifdef THREAD_SAFE
        v8::Locker Locker(Isolate);
#endif
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        auto Context = GContext.Get(Isolate);
        v8::Context::Scope ContextScope(Context);
        auto Object = GObject.Get(Isolate);

        auto MaybeValue = Object->Get(Context, v8_impl::Converter<const char*>::toScript(Context, key));
        v8::Local<v8::Value> Val;
        if (MaybeValue.ToLocal(&Val))
        {
            return v8_impl::Converter<T>::toCpp(Context, Val);
        }
        return {};
    }

    template <typename T>
    void Set(const char* key, T val) const
    {
        if (JsEnvLifeCycleTracker.expired())
        {
            return;
        }
#ifdef THREAD_SAFE
        v8::Locker Locker(Isolate);
#endif
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        auto Context = GContext.Get(Isolate);
        v8::Context::Scope ContextScope(Context);
        auto Object = GObject.Get(Isolate);

        auto _UnUsed = Object->Set(
            Context, v8_impl::Converter<const char*>::toScript(Context, key), v8_impl::Converter<T>::toScript(Context, val));
    }

    bool IsValid() const
    {
        if (JsEnvLifeCycleTracker.expired() || !Isolate || GContext.IsEmpty() || GObject.IsEmpty())
            return false;
#ifdef THREAD_SAFE
        v8::Locker Locker(Isolate);
#endif
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        auto Context = GContext.Get(Isolate);
        v8::Context::Scope ContextScope(Context);
        auto Object = GObject.Get(Isolate);
        return !Object.IsEmpty() && Object->IsObject();
    }

    // for performance considerations, a native can only hold one JavaScript object at a time (the last setting takes effect if set
    // multiple times). If there is a need to hold more than one JavaScript object, it is recommended to first hold a JavaScript
    // array and then add objects to the array.
    template <typename T>
    void SetWeakAndOwnBy(const T* Owner)
    {
        if (!Owner)
            return;
        if (JsEnvLifeCycleTracker.expired() || !Isolate || GContext.IsEmpty() || GObject.IsEmpty())
            return;
#ifdef THREAD_SAFE
        v8::Locker Locker(Isolate);
#endif
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        auto Context = GContext.Get(Isolate);
        v8::Context::Scope ContextScope(Context);

        auto Val = DataTransfer::FindOrAddCData(Isolate, Context, StaticTypeId<T>::get(), Owner, true);
        if (Val->IsObject())
        {
            auto JsObject = Val.template As<v8::Object>();
#if V8_MAJOR_VERSION < 8
            JsObject->Set(Context, v8::String::NewFromUtf8(Isolate, "_p_i_only_one_child").ToLocalChecked(), GObject.Get(Isolate))
                .Check();
#else
            JsObject->Set(Context, v8::String::NewFromUtf8Literal(Isolate, "_p_i_only_one_child"), GObject.Get(Isolate)).Check();
#endif
            GObject.SetWeak();
        }
    }

    v8::Isolate* Isolate;
    v8::Global<v8::Context> GContext;
    v8::Global<v8::Object> GObject;

    std::weak_ptr<int> JsEnvLifeCycleTracker;

    friend struct PUERTS_NAMESPACE::v8_impl::Converter<Object>;
};

class Function : public Object
{
public:
    Function()
    {
    }

    Function(v8::Local<v8::Context> context, v8::Local<v8::Value> object) : Object(context, object)
    {
    }

    template <typename... Args>
    void Action(Args... cppArgs) const
    {
        if (JsEnvLifeCycleTracker.expired())
        {
            return;
        }
#ifdef THREAD_SAFE
        v8::Locker Locker(Isolate);
#endif
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        auto Context = GContext.Get(Isolate);
        v8::Context::Scope ContextScope(Context);

        auto Object = GObject.Get(Isolate);

        v8::TryCatch TryCatch(Isolate);

        auto _UnUsed = InvokeHelper(Context, Object, cppArgs...);

        if (TryCatch.HasCaught())
        {
            REPORT_EXCEPTION(Isolate, &TryCatch);
        }
    }

    template <typename Ret, typename... Args>
    Ret Func(Args... cppArgs) const
    {
        if (JsEnvLifeCycleTracker.expired())
        {
            return {};
        }
#ifdef THREAD_SAFE
        v8::Locker Locker(Isolate);
#endif
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        auto Context = GContext.Get(Isolate);
        v8::Context::Scope ContextScope(Context);

        auto Object = GObject.Get(Isolate);

        v8::TryCatch TryCatch(Isolate);

        auto MaybeRet = InvokeHelper(Context, Object, cppArgs...);

        if (TryCatch.HasCaught())
        {
            REPORT_EXCEPTION(Isolate, &TryCatch);
        }

        if (!MaybeRet.IsEmpty())
        {
            return v8_impl::Converter<Ret>::toCpp(Context, MaybeRet.ToLocalChecked());
        }
        return {};
    }

    bool IsValid() const
    {
        if (JsEnvLifeCycleTracker.expired() || !Isolate || GContext.IsEmpty() || GObject.IsEmpty())
            return false;
#ifdef THREAD_SAFE
        v8::Locker Locker(Isolate);
#endif
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        auto Context = GContext.Get(Isolate);
        v8::Context::Scope ContextScope(Context);
        auto Object = GObject.Get(Isolate);
        return !Object.IsEmpty() && Object->IsFunction();
    }

private:
    template <typename... Args>
    auto InvokeHelper(v8::Local<v8::Context>& Context, v8::Local<v8::Object>& Object, Args... CppArgs) const
    {
        v8::Local<v8::Value> Argv[sizeof...(Args)]{v8_impl::Converter<Args>::toScript(Context, CppArgs)...};
        return Object.As<v8::Function>()->Call(Context, v8::Undefined(Isolate), sizeof...(Args), Argv);
    }

    auto InvokeHelper(v8::Local<v8::Context>& Context, v8::Local<v8::Object>& Object) const
    {
        return Object.As<v8::Function>()->Call(Context, v8::Undefined(Isolate), 0, nullptr);
    }

    friend struct PUERTS_NAMESPACE::v8_impl::Converter<Function>;
};

}    // namespace v8_impl

template <>
struct ScriptTypeName<v8_impl::Object>
{
    static constexpr auto value()
    {
        return internal::Literal("object");
    }
};

template <>
struct ScriptTypeName<v8_impl::Function>
{
    static constexpr auto value()
    {
        return internal::Literal("()=>void");
    }
};

namespace v8_impl
{
template <>
struct Converter<Object>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, Object value)
    {
        return value.GObject.Get(context->GetIsolate());
    }

    static Object toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return Object(context, value.As<v8::Object>());
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsObject();
    }
};

template <>
struct Converter<Function>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, Function value)
    {
        return value.GObject.Get(context->GetIsolate());
    }

    static Function toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return Function(context, value.As<v8::Object>());
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsFunction();
    }
};

#include "StdFunctionConverter.hpp"
}    // namespace v8_impl

}    // namespace PUERTS_NAMESPACE

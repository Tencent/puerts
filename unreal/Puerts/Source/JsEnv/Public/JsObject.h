/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "NamespaceDef.h"

#include "Binding.hpp"
#include "JSLogger.h"
#include "V8Utils.h"

namespace PUERTS_NAMESPACE
{
class FJsObjectPropertyTranslator;
}

#include "CoreMinimal.h"
#include "JsObject.generated.h"

USTRUCT(BlueprintType)
struct FJsObject
{
public:
    GENERATED_USTRUCT_BODY()

    FJsObject() : Isolate(nullptr)
    {
    }

    FJsObject(const FJsObject& InOther)
    {
        if (InOther.JsEnvLifeCycleTracker.expired())
        {
            JsEnvLifeCycleTracker = InOther.JsEnvLifeCycleTracker;
            if (!JsEnvLifeCycleTracker.expired())
            {
                GObject.Reset();
                GContext.Reset();
                Isolate = nullptr;
            }
            return;
        }
        Isolate = InOther.Isolate;
#ifdef THREAD_SAFE
        v8::Locker Locker(Isolate);
#endif
        GContext.Reset(Isolate, InOther.GContext.Get(Isolate));
        GObject.Reset(Isolate, InOther.GObject.Get(Isolate));
        JsEnvLifeCycleTracker = PUERTS_NAMESPACE::DataTransfer::GetJsEnvLifeCycleTracker(Isolate);
    }

    FJsObject(v8::Local<v8::Context> InContext, v8::Local<v8::Object> InObject)
        : Isolate(InContext->GetIsolate()), GContext(InContext->GetIsolate(), InContext), GObject(InContext->GetIsolate(), InObject)
    {
        JsEnvLifeCycleTracker = PUERTS_NAMESPACE::DataTransfer::GetJsEnvLifeCycleTracker(Isolate);
    }

    ~FJsObject()
    {
#ifdef THREAD_SAFE
        v8::Locker Locker(Isolate);
#endif
        if (JsEnvLifeCycleTracker.expired())
        {
#if V8_MAJOR_VERSION < 11
            GObject.Empty();
            GContext.Empty();
#endif
        }
        else
        {
            GObject.Reset();
            GContext.Reset();
        }
    }

    FJsObject& operator=(const FJsObject& InOther)
    {
#ifdef THREAD_SAFE
        v8::Locker Locker(Isolate);
#endif
        if (InOther.JsEnvLifeCycleTracker.expired())
        {
            JsEnvLifeCycleTracker = InOther.JsEnvLifeCycleTracker;
            if (!JsEnvLifeCycleTracker.expired())
            {
                GObject.Reset();
                GContext.Reset();
                Isolate = nullptr;
            }
            return *this;
        }
        Isolate = InOther.Isolate;
        GContext.Reset(Isolate, InOther.GContext.Get(Isolate));
        GObject.Reset(Isolate, InOther.GObject.Get(Isolate));
        JsEnvLifeCycleTracker = PUERTS_NAMESPACE::DataTransfer::GetJsEnvLifeCycleTracker(Isolate);
        return *this;
    }

    template <typename T>
    T Get(const char* Key) const
    {
        if (JsEnvLifeCycleTracker.expired())
        {
            UE_LOG(Puerts, Error, TEXT("JsEnv associated had release!"));
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

        auto MaybeValue = Object->Get(Context, PUERTS_NAMESPACE::v8_impl::Converter<const char*>::toScript(Context, Key));
        v8::Local<v8::Value> Val;
        if (MaybeValue.ToLocal(&Val))
        {
            return PUERTS_NAMESPACE::v8_impl::Converter<T>::toCpp(Context, Val);
        }
        return {};
    }

    template <typename T>
    void Set(const char* Key, T Val) const
    {
        if (JsEnvLifeCycleTracker.expired())
        {
            UE_LOG(Puerts, Error, TEXT("JsEnv associated had release!"));
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

        auto _UnUsed = Object->Set(Context, PUERTS_NAMESPACE::v8_impl::Converter<const char*>::toScript(Context, Key),
            PUERTS_NAMESPACE::v8_impl::Converter<T>::toScript(Context, Val));
    }

    template <typename... Args>
    void Action(Args... cppArgs) const
    {
        if (JsEnvLifeCycleTracker.expired())
        {
            UE_LOG(Puerts, Error, TEXT("JsEnv associated had release!"));
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

        if (!Object->IsFunction())
        {
            UE_LOG(Puerts, Error, TEXT("call a non-function object!"));
            return;
        }

        v8::TryCatch TryCatch(Isolate);

        auto _UnUsed = InvokeHelper(Context, Object, cppArgs...);

        if (TryCatch.HasCaught())
        {
            UE_LOG(
                Puerts, Error, TEXT("call function throw: %s"), *PUERTS_NAMESPACE::FV8Utils::TryCatchToString(Isolate, &TryCatch));
        }
    }

    template <typename Ret, typename... Args>
    Ret Func(Args... cppArgs) const
    {
        if (JsEnvLifeCycleTracker.expired())
        {
            UE_LOG(Puerts, Error, TEXT("JsEnv associated had release!"));
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

        if (!Object->IsFunction())
        {
            UE_LOG(Puerts, Error, TEXT("call a non-function object!"));
            return {};
        }

        v8::TryCatch TryCatch(Isolate);

        auto MaybeRet = InvokeHelper(Context, Object, cppArgs...);

        if (TryCatch.HasCaught())
        {
            UE_LOG(
                Puerts, Error, TEXT("call function throw: %s"), *PUERTS_NAMESPACE::FV8Utils::TryCatchToString(Isolate, &TryCatch));
        }

        if (!MaybeRet.IsEmpty())
        {
            return PUERTS_NAMESPACE::v8_impl::Converter<Ret>::toCpp(Context, MaybeRet.ToLocalChecked());
        }
        return {};
    }

private:
    FORCEINLINE v8::Local<v8::Object> GetJsObject() const
    {
        if (JsEnvLifeCycleTracker.expired())
        {
            UE_LOG(Puerts, Error, TEXT("JsEnv associated had release!"));
            return {};
        }
        if (!GObject.IsEmpty())
        {
            return GObject.Get(Isolate);
        }
        else
        {
            return {};
        }
    }

    template <typename... Args>
    FORCEINLINE auto InvokeHelper(v8::Local<v8::Context>& Context, v8::Local<v8::Object>& Object, Args... CppArgs) const
    {
        v8::Local<v8::Value> Argv[sizeof...(Args)]{PUERTS_NAMESPACE::v8_impl::Converter<Args>::toScript(Context, CppArgs)...};
        return Object.As<v8::Function>()->Call(Context, v8::Undefined(Isolate), sizeof...(Args), Argv);
    }

    FORCEINLINE auto InvokeHelper(v8::Local<v8::Context>& Context, v8::Local<v8::Object>& Object) const
    {
        return Object.As<v8::Function>()->Call(Context, v8::Undefined(Isolate), 0, nullptr);
    }

private:
    v8::Isolate* Isolate;
#if V8_MAJOR_VERSION >= 11
    v8::Persistent<v8::Context> GContext;
    v8::Persistent<v8::Object> GObject;
#else
    v8::Global<v8::Context> GContext;
    v8::Global<v8::Object> GObject;
#endif
    std::weak_ptr<int> JsEnvLifeCycleTracker;

    friend struct PUERTS_NAMESPACE::v8_impl::Converter<FJsObject>;
    friend class PUERTS_NAMESPACE::FJsObjectPropertyTranslator;
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

namespace v8_impl
{
template <>
struct Converter<FJsObject>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, FJsObject value)
    {
        return value.GObject.Get(context->GetIsolate());
    }

    static FJsObject toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return FJsObject(context, value.As<v8::Object>());
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsObject();
    }
};
}    // namespace v8_impl
}    // namespace PUERTS_NAMESPACE

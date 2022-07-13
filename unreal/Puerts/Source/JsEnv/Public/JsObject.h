/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#pragma warning(push, 0)
#include "v8.h"
#pragma warning(pop)

#include "Binding.hpp"
#include "JSLogger.h"
#include "V8Utils.h"

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
        Isolate = InOther.Isolate;
        GContext.Reset(Isolate, InOther.GContext.Get(Isolate));
        GObject.Reset(Isolate, InOther.GObject.Get(Isolate));
    }

    FJsObject(v8::Local<v8::Context> InContext, v8::Local<v8::Object> InObject)
        : Isolate(InContext->GetIsolate()), GContext(InContext->GetIsolate(), InContext), GObject(InContext->GetIsolate(), InObject)
    {
    }

    FJsObject& operator=(const FJsObject& InOther)
    {
        Isolate = InOther.Isolate;
        GContext.Reset(Isolate, InOther.GContext.Get(Isolate));
        GObject.Reset(Isolate, InOther.GObject.Get(Isolate));
        return *this;
    }

    template <typename T>
    T Get(const char* Key) const
    {
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        auto Context = GContext.Get(Isolate);
        v8::Context::Scope ContextScope(Context);
        auto Object = GObject.Get(Isolate);

        auto MaybeValue = Object->Get(Context, puerts::converter::Converter<const char*>::toScript(Context, Key));
        v8::Local<v8::Value> Val;
        if (MaybeValue.ToLocal(&Val))
        {
            return puerts::converter::Converter<T>::toCpp(Context, Val);
        }
        return {};
    }

    template <typename T>
    void Set(const char* Key, T Val) const
    {
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        auto Context = GContext.Get(Isolate);
        v8::Context::Scope ContextScope(Context);
        auto Object = GObject.Get(Isolate);

        auto _UnUsed = Object->Set(Context, puerts::converter::Converter<const char*>::toScript(Context, Key),
            puerts::converter::Converter<T>::toScript(Context, Val));
    }

    template <typename... Args>
    void Action(Args... cppArgs) const
    {
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
            UE_LOG(Puerts, Error, TEXT("call function throw: %s"), *puerts::FV8Utils::TryCatchToString(Isolate, &TryCatch));
        }
    }

    template <typename Ret, typename... Args>
    Ret Func(Args... cppArgs) const
    {
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
            UE_LOG(Puerts, Error, TEXT("call function throw: %s"), *puerts::FV8Utils::TryCatchToString(Isolate, &TryCatch));
        }

        if (!MaybeRet.IsEmpty())
        {
            return puerts::converter::Converter<Ret>::toCpp(Context, MaybeRet.ToLocalChecked());
        }
        return {};
    }

    FORCEINLINE v8::Local<v8::Object> GetJsObject() const
    {
        if (!GObject.IsEmpty())
        {
            return GObject.Get(Isolate);
        }
        else
        {
            return {};
        }
    }

private:
    template <typename... Args>
    FORCEINLINE auto InvokeHelper(v8::Local<v8::Context>& Context, v8::Local<v8::Object>& Object, Args... CppArgs) const
    {
        v8::Local<v8::Value> Argv[sizeof...(Args)]{puerts::converter::Converter<Args>::toScript(Context, CppArgs)...};
        return Object.As<v8::Function>()->Call(Context, v8::Undefined(Isolate), sizeof...(Args), Argv);
    }

    FORCEINLINE auto InvokeHelper(v8::Local<v8::Context>& Context, v8::Local<v8::Object>& Object) const
    {
        return Object.As<v8::Function>()->Call(Context, v8::Undefined(Isolate), 0, nullptr);
    }

private:
    v8::Isolate* Isolate;
    v8::Global<v8::Context> GContext;
    v8::Global<v8::Object> GObject;

    friend struct puerts::converter::Converter<FJsObject>;
};

namespace puerts
{
template <>
struct ScriptTypeName<FJsObject>
{
    static constexpr auto value()
    {
        return Literal("object");
    }
};

namespace converter
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
}    // namespace converter
}    // namespace puerts

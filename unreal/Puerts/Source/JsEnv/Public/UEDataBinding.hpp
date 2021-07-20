/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#include "Converter.hpp"
#include "DataTransfer.h"

#define UsingUClass(CLS) \
    __DefScriptTTypeName(CLS, CLS)\
    namespace puerts{\
        template<>  \
        constexpr bool is_uetype_v<CLS> = true;\
    }

namespace puerts
{
namespace converter
{
template <>
struct Converter<const TCHAR *> {
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, const TCHAR * value)
    {
        return v8::String::NewFromUtf8(context->GetIsolate(), TCHAR_TO_UTF8(value), v8::NewStringType::kNormal).ToLocalChecked();
    }

    static const TCHAR * toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return UTF8_TO_TCHAR(*v8::String::Utf8Value(context->GetIsolate(), value));
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsString();
    }
};

template <>
struct Converter<FString> {
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, FString value)
    {
        return v8::String::NewFromUtf8(context->GetIsolate(), TCHAR_TO_UTF8(*value), v8::NewStringType::kNormal).ToLocalChecked();
    }

    static FString toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return UTF8_TO_TCHAR(*v8::String::Utf8Value(context->GetIsolate(), value));
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsString();
    }
};

template <>
struct Converter<FName> {
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, FName value)
    {
        return v8::String::NewFromUtf8(context->GetIsolate(), TCHAR_TO_UTF8(*value.ToString()), v8::NewStringType::kNormal).ToLocalChecked();
    }

    static FName toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return UTF8_TO_TCHAR(*v8::String::Utf8Value(context->GetIsolate(), value));
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsString();
    }
};

template <>
struct Converter<FText> {
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, FText value)
    {
        return v8::String::NewFromUtf8(context->GetIsolate(), TCHAR_TO_UTF8(*value.ToString()), v8::NewStringType::kNormal).ToLocalChecked();
    }

    static FText toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return FText::FromString(UTF8_TO_TCHAR(*v8::String::Utf8Value(context->GetIsolate(), value)));
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsString();
    }
};

template <typename T>
struct Converter<T*, std::enable_if_t<std::is_convertible_v<T*, const UObject *>>> {
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, T* value)
    {
        return ::puerts::DataTransfer::FindOrAddObject<T>(context->GetIsolate(), context, value);
    }

    static T* toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return ::puerts::DataTransfer::GetPoninterFast<T>(value.As<v8::Object>()); ;
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return ::puerts::DataTransfer::IsInstanceOf(context->GetIsolate(), T::StaticClass(), value.As<v8::Object>());
    }
};
    
}

template<typename T>
struct ScriptTypeName<T, std::enable_if_t<std::is_convertible_v<T, const FString&>
    || std::is_convertible_v<T, const FName&>
    || std::is_convertible_v<T, const FText&>
    || std::is_convertible_v<T, const TCHAR *>>> {
    static const char *get()
    {
        return "string";
    }
};

}
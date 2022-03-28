/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "Converter.hpp"
#include "DataTransfer.h"
#include "ArrayBuffer.h"

#define UsingUClass(CLS)                          \
    __DefScriptTTypeName(CLS, CLS);               \
    namespace puerts                              \
    {                                             \
    template <>                                   \
    struct is_uetype<CLS> : public std::true_type \
    {                                             \
    };                                            \
    }

#define UsingTArrayWithName(CLS, CLSNAME)             \
    namespace puerts                                  \
    {                                                 \
    template <>                                       \
    struct ScriptTypeName<TArray<CLS>>                \
    {                                                 \
        static constexpr const char* value = CLSNAME; \
    };                                                \
    }                                                 \
    __DefObjectType(TArray<CLS>) __DefCDataPointerConverter(TArray<CLS>)

#define RegisterTArray(CLS)                                                                              \
    puerts::DefineClass<TArray<CLS>>()                                                                   \
        .Method("Add", SelectFunction(int (TArray<CLS>::*)(const CLS&), &TArray<CLS>::Add))              \
        .Method("Get", SelectFunction(CLS& (TArray<CLS>::*) (int), &TArray<CLS>::operator[]))            \
        .Method("Num", MakeFunction(&TArray<CLS>::Num))                                                  \
        .Method("Contains", MakeFunction(&TArray<CLS>::Contains<CLS>))                                   \
        .Method("FindIndex", SelectFunction(int (TArray<CLS>::*)(const CLS&) const, &TArray<CLS>::Find)) \
        .Method("RemoveAt", SelectFunction(void (TArray<CLS>::*)(int), &TArray<CLS>::RemoveAt))          \
        .Method("IsValidIndex", MakeFunction(&TArray<CLS>::IsValidIndex))                                \
        .Method("Empty", MakeFunction(&TArray<CLS>::Empty))                                              \
        .Register()

#define UsingUStruct(CLS) UsingUClass(CLS)

namespace puerts
{
namespace converter
{
template <>
struct Converter<FString>
{
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
struct Converter<FName>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, FName value)
    {
        return v8::String::NewFromUtf8(context->GetIsolate(), TCHAR_TO_UTF8(*value.ToString()), v8::NewStringType::kNormal)
            .ToLocalChecked();
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
struct Converter<FText>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, FText value)
    {
        return v8::String::NewFromUtf8(context->GetIsolate(), TCHAR_TO_UTF8(*value.ToString()), v8::NewStringType::kNormal)
            .ToLocalChecked();
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

template <>
struct Converter<FArrayBuffer>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, FArrayBuffer value)
    {
        return v8::ArrayBuffer::New(context->GetIsolate(), value.Data, value.Length);
    }

    static FArrayBuffer toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        FArrayBuffer Ret = {nullptr, 0};
        if (value->IsArrayBufferView())
        {
            v8::Local<v8::ArrayBufferView> BuffView = value.As<v8::ArrayBufferView>();
            auto ABC = BuffView->Buffer()->GetContents();
            Ret.Data = static_cast<char*>(ABC.Data()) + BuffView->ByteOffset();
            Ret.Length = BuffView->ByteLength();
        }
        else if (value->IsArrayBuffer())
        {
            auto Ab = v8::Local<v8::ArrayBuffer>::Cast(value);
            Ret.Data = Ab->GetContents().Data();
            Ret.Length = Ab->GetContents().ByteLength();
        }
        return Ret;
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsArrayBuffer() || value->IsArrayBufferView();
    }
};

template <typename T>
struct Converter<T*, typename std::enable_if<std::is_convertible<T*, const UObject*>::value>::type>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, T* value)
    {
        return ::puerts::DataTransfer::FindOrAddObject<T>(context->GetIsolate(), context, value);
    }

    static T* toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        T* Ret = ::puerts::DataTransfer::GetPointerFast<T>(value.As<v8::Object>());
        return (!Ret || Ret == RELEASED_UOBJECT_MEMBER || !Ret->IsValidLowLevelFast() || Ret->IsPendingKill()) ? nullptr : Ret;
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return ::puerts::DataTransfer::IsInstanceOf(context->GetIsolate(), T::StaticClass(), value.As<v8::Object>());
    }
};

template <typename T>
struct Converter<T*, typename std::enable_if<!std::is_convertible<T*, const UObject*>::value &&
                                             std::is_convertible<T*, const UObjectBase*>::value>::type>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, T* value)
    {
        return ::puerts::DataTransfer::FindOrAddObject<UObject>(context->GetIsolate(), context, static_cast<UObject*>(value));
    }

    static T* toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        T* Ret = ::puerts::DataTransfer::GetPointerFast<T>(value.As<v8::Object>());
        return (!Ret || Ret == RELEASED_UOBJECT_MEMBER || !Ret->IsValidLowLevelFast()) ? nullptr : Ret;
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return ::puerts::DataTransfer::IsInstanceOf(context->GetIsolate(), UObject::StaticClass(), value.As<v8::Object>());
    }
};

}    // namespace converter

template <>
struct ScriptTypeName<FString>
{
    static constexpr const char* value = "string";
};

template <>
struct ScriptTypeName<FName>
{
    static constexpr const char* value = "string";
};

template <>
struct ScriptTypeName<FText>
{
    static constexpr const char* value = "string";
};

template <>
struct ScriptTypeName<FArrayBuffer>
{
    static constexpr const char* value = "ArrayBuffer";
};

namespace internal
{
template <typename T, typename = void>
struct IsUStructHelper : std::false_type
{
};

template <typename T>
struct IsUStructHelper<T, Void_t<decltype(&TScriptStructTraits<T>::Get)>> : std::true_type
{
};
}    // namespace internal

namespace converter
{
template <typename T>
struct Converter<T*,
    typename std::enable_if<!std::is_convertible<T*, const UObject*>::value && internal::IsUStructHelper<T>::value>::type>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, T* value)
    {
        return ::puerts::DataTransfer::FindOrAddStruct<T>(context->GetIsolate(), context, value, true);
    }

    static T* toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return ::puerts::DataTransfer::GetPointerFast<T>(value.As<v8::Object>());
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return ::puerts::DataTransfer::IsInstanceOf<T>(context->GetIsolate(), value.As<v8::Object>());
    }
};

template <typename T>
struct Converter<T, typename std::enable_if<internal::IsUStructHelper<T>::value>::type>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, T value)
    {
        return ::puerts::DataTransfer::FindOrAddStruct<T>(context->GetIsolate(), context, new T(value), false);
    }

    static T toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        T* ptr = ::puerts::DataTransfer::GetPointerFast<T>(value.As<v8::Object>());
        return ptr ? *ptr : T{};
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return ::puerts::DataTransfer::IsInstanceOf<T>(context->GetIsolate(), value.As<v8::Object>());
    }
};

}    // namespace converter

}    // namespace puerts
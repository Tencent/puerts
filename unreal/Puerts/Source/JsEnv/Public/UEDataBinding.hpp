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
#include "UECompatible.h"

#define UsingUClass(CLS)                          \
    namespace puerts                              \
    {                                             \
    template <>                                   \
    struct ScriptTypeName<CLS>                    \
    {                                             \
        static constexpr auto value()             \
        {                                         \
            return Literal(#CLS).Sub<1>();        \
        }                                         \
    };                                            \
    }                                             \
    namespace puerts                              \
    {                                             \
    template <>                                   \
    struct is_uetype<CLS> : public std::true_type \
    {                                             \
    };                                            \
    }

#define UsingTArrayWithName(CLS, CLSNAME) \
    namespace puerts                      \
    {                                     \
    template <>                           \
    struct ScriptTypeName<TArray<CLS>>    \
    {                                     \
        static constexpr auto value()     \
        {                                 \
            return Literal(CLSNAME);      \
        }                                 \
    };                                    \
    }                                     \
    __DefObjectType(TArray<CLS>) __DefCDataPointerConverter(TArray<CLS>)

#define RegisterTArray(CLS)                                                                              \
    puerts::DefineClass<TArray<CLS>>()                                                                   \
        .Method("Add", SelectFunction(int (TArray<CLS>::*)(const CLS&), &TArray<CLS>::Add))              \
        .Method("Get", SelectFunction(CLS& (TArray<CLS>::*) (int), &TArray<CLS>::operator[]))            \
        .Method("GetRef", SelectFunction(CLS& (TArray<CLS>::*) (int), &TArray<CLS>::operator[]))         \
        .Method("Num", MakeFunction(&TArray<CLS>::Num))                                                  \
        .Method("Contains", MakeFunction(&TArray<CLS>::Contains<CLS>))                                   \
        .Method("FindIndex", SelectFunction(int (TArray<CLS>::*)(const CLS&) const, &TArray<CLS>::Find)) \
        .Method("RemoveAt", SelectFunction(void (TArray<CLS>::*)(int), &TArray<CLS>::RemoveAt))          \
        .Method("IsValidIndex", MakeFunction(&TArray<CLS>::IsValidIndex))                                \
        .Method("Empty", MakeFunction(&TArray<CLS>::Empty))                                              \
        .Register()

#define UsingUStruct(CLS) UsingUClass(CLS)

#define UsingContainer(CLS) __DefObjectType(CLS) __DefCDataPointerConverter(CLS)

#define UsingTSharedPtr(ITEMCLS) __DefObjectType(TSharedPtr<ITEMCLS>) __DefCDataPointerConverter(TSharedPtr<ITEMCLS>)

template <class T>
struct TSharedPtrExtension
{
    static bool Equals(const TSharedPtr<T> Lhs, const TSharedPtr<T> Rhs)
    {
        return Lhs == Rhs;
    }
};

#define RegisterTSharedPtr(ITEMCLS) \
    puerts::DefineClass<TSharedPtr<ITEMCLS>>().Method("Equals", MakeExtension(&TSharedPtrExtension<ITEMCLS>::Equals)).Register();

namespace puerts
{
class TCharStringHolder
{
public:
    TCharStringHolder()
    {
    }

    TCharStringHolder(v8::Local<v8::Context> context, const v8::Local<v8::Value> value)
    {
        Str = UTF8_TO_TCHAR(*v8::String::Utf8Value(context->GetIsolate(), value));
    }

    const TCHAR* Data() const
    {
        return *Str;
    }

private:
    FString Str;
};

template <>
struct ArgumentBufferType<const TCHAR*>
{
    using type = TCharStringHolder;
    static constexpr bool is_custom = true;
};

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
        if (value->IsArrayBuffer())
        {
            auto Ab = v8::Local<v8::ArrayBuffer>::Cast(value);
#if defined(HAS_ARRAYBUFFER_NEW_WITHOUT_STL)
            size_t ByteLength;
            auto Data = v8::ArrayBuffer_Get_Data(Ab, ByteLength);
            if (ByteLength == sizeof(FName))
            {
                return *static_cast<FName*>(Data);
            }
#else
            if (Ab->GetContents().ByteLength() == sizeof(FName))
            {
                return *static_cast<FName*>(Ab->GetContents().Data());
            }
#endif
        }
        return UTF8_TO_TCHAR(*v8::String::Utf8Value(context->GetIsolate(), value));
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsString();
    }
};

template <>
struct Converter<const TCHAR*>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, const TCHAR* value)
    {
        return v8::String::NewFromUtf8(context->GetIsolate(), TCHAR_TO_UTF8(value), v8::NewStringType::kNormal).ToLocalChecked();
    }

    static TCharStringHolder toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return TCharStringHolder(context, value);
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsString();
    }
};

#ifndef PUERTS_FTEXT_AS_OBJECT
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
#endif

template <>
struct Converter<FArrayBuffer>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, FArrayBuffer value)
    {
#if defined(HAS_ARRAYBUFFER_NEW_WITHOUT_STL)
        return v8::ArrayBuffer_New_Without_Stl(context->GetIsolate(), value.Data, value.Length);
#else
        return v8::ArrayBuffer::New(context->GetIsolate(), value.Data, value.Length);
#endif
    }

    static FArrayBuffer toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        FArrayBuffer Ret = {nullptr, 0};
        if (value->IsArrayBufferView())
        {
            v8::Local<v8::ArrayBufferView> BuffView = value.As<v8::ArrayBufferView>();
            auto Ab = BuffView->Buffer();
#if defined(HAS_ARRAYBUFFER_NEW_WITHOUT_STL)
            Ret.Data = static_cast<char*>(v8::ArrayBuffer_Get_Data(Ab)) + BuffView->ByteOffset();
#else
            Ret.Data = static_cast<char*>(Ab->GetContents().Data()) + BuffView->ByteOffset();
#endif
            Ret.Length = BuffView->ByteLength();
        }
        else if (value->IsArrayBuffer())
        {
            auto Ab = v8::Local<v8::ArrayBuffer>::Cast(value);
#if defined(HAS_ARRAYBUFFER_NEW_WITHOUT_STL)
            size_t ByteLength;
            Ret.Data = static_cast<char*>(v8::ArrayBuffer_Get_Data(Ab, ByteLength));
            Ret.Length = ByteLength;
#else
            Ret.Data = Ab->GetContents().Data();
            Ret.Length = Ab->GetContents().ByteLength();
#endif
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
        return (!Ret || Ret == RELEASED_UOBJECT_MEMBER || !Ret->IsValidLowLevelFast() || UEObjectIsPendingKill(Ret)) ? nullptr
                                                                                                                     : Ret;
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
    static constexpr auto value()
    {
        return Literal("string");
    }
};

template <>
struct ScriptTypeName<FName>
{
    static constexpr auto value()
    {
        return Literal("string");
    }
};

template <>
struct ScriptTypeName<const TCHAR*>
{
    static constexpr auto value()
    {
        return Literal("string");
    }
};

#ifndef PUERTS_FTEXT_AS_OBJECT
template <>
struct ScriptTypeName<FText>
{
    static constexpr auto value()
    {
        return Literal("string");
    }
};
#endif

template <>
struct ScriptTypeName<FArrayBuffer>
{
    static constexpr auto value()
    {
        return Literal("ArrayBuffer");
    }
};

template <typename T>
struct ScriptTypeNameWithNamespace<T,
    typename std::enable_if<is_objecttype<typename std::remove_pointer<typename std::decay<T>::type>::type>::value>::type>
{
    static constexpr auto value()
    {
        return Literal("cpp.") + ScriptTypeName<T>::value();
    }
};

template <typename T>
struct ScriptTypeNameWithNamespace<T,
    typename std::enable_if<is_uetype<typename std::remove_pointer<typename std::decay<T>::type>::type>::value>::type>
{
    static constexpr auto value()
    {
        return Literal("UE.") + ScriptTypeName<T>::value();
    }
};

template <typename T>
struct ScriptTypeName<TSharedPtr<T>>
{
    static constexpr auto value()
    {
        return Literal("UE.TSharedPtr<") + ScriptTypeNameWithNamespace<T>::value() + Literal(">");
    }
};

template <typename T>
struct ScriptTypeName<TArray<T>>
{
    static constexpr auto value()
    {
        return Literal("UE.TArray<") + ScriptTypeNameWithNamespace<T>::value() + Literal(">");
    }
};

template <typename T>
struct ScriptTypeName<TSet<T>>
{
    static constexpr auto value()
    {
        return Literal("UE.TSet<") + ScriptTypeNameWithNamespace<T>::value() + Literal(">");
    }
};

template <typename TKey, typename TValue>
struct ScriptTypeName<TMap<TKey, TValue>>
{
    static constexpr auto value()
    {
        return Literal("UE.TMap<") + ScriptTypeNameWithNamespace<TKey>::value() + Literal(", ") +
               ScriptTypeNameWithNamespace<TValue>::value() + Literal(">");
    }
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
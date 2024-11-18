/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "ScriptBackend.hpp"
#include "DataTransfer.h"
#include "ArrayBuffer.h"
#include "UECompatible.h"
#include "PuertsNamespaceDef.h"

#define UsingUClass(CLS)                             \
    namespace PUERTS_NAMESPACE                       \
    {                                                \
    template <>                                      \
    struct ScriptTypeName<CLS>                       \
    {                                                \
        static constexpr auto value()                \
        {                                            \
            return internal::Literal(#CLS).Sub<1>(); \
        }                                            \
    };                                               \
    }                                                \
    namespace PUERTS_NAMESPACE                       \
    {                                                \
    template <>                                      \
    struct is_uetype<CLS> : public std::true_type    \
    {                                                \
    };                                               \
    }

#define UsingTArrayWithName(CLS, CLSNAME)      \
    namespace PUERTS_NAMESPACE                 \
    {                                          \
    template <>                                \
    struct ScriptTypeName<TArray<CLS>>         \
    {                                          \
        static constexpr auto value()          \
        {                                      \
            return internal::Literal(CLSNAME); \
        }                                      \
    };                                         \
    }                                          \
    __DefObjectType(TArray<CLS>) __DefCDataPointerConverter(TArray<CLS>)

#define UsingCrossModuleCppType(CLS)                                        \
    namespace PUERTS_NAMESPACE                                              \
    {                                                                       \
    template <>                                                             \
    struct StaticTypeId<CLS>                                                \
    {                                                                       \
        static const void* get()                                            \
        {                                                                   \
            static const void* cache_type_id = nullptr;                     \
            if (!cache_type_id)                                             \
            {                                                               \
                auto info = PUERTS_NAMESPACE::FindCppTypeClassByName(#CLS); \
                cache_type_id = info ? info->TypeId : &cache_type_id;       \
            }                                                               \
            return cache_type_id;                                           \
        }                                                                   \
    };                                                                      \
    }                                                                       \
    UsingNamedCppType(CLS, CLS)

#if ENGINE_MAJOR_VERSION >= 5 && ENGINE_MINOR_VERSION >= 4
#define RegisterTArray(CLS)                                                                                                        \
    PUERTS_NAMESPACE::DefineClass<TArray<CLS>>()                                                                                   \
        .Method("Add", SelectFunction(int (TArray<CLS>::*)(CLS const&), &TArray<CLS>::Add))                                        \
        .Method("Get", SelectFunction(CLS& (TArray<CLS>::*) (int), &TArray<CLS>::operator[]))                                      \
        .Method("GetRef", SelectFunction(CLS& (TArray<CLS>::*) (int), &TArray<CLS>::operator[]))                                   \
        .Method("Num", MakeFunction(&TArray<CLS>::Num))                                                                            \
        .Method("Contains", MakeFunction(&TArray<CLS>::Contains<CLS>))                                                             \
        .Method("FindIndex", SelectFunction(int (TArray<CLS>::*)(CLS const&) const, &TArray<CLS>::Find))                           \
        .Method(                                                                                                                   \
            "RemoveAt", SelectFunction(void (TArray<CLS>::*)(int, /* New param in 5.4*/ EAllowShrinking), &TArray<CLS>::RemoveAt)) \
        .Method("IsValidIndex", MakeFunction(&TArray<CLS>::IsValidIndex))                                                          \
        .Method("Empty", MakeFunction(&TArray<CLS>::Empty))                                                                        \
        .Register()
#else
#define RegisterTArray(CLS)                                                                              \
    PUERTS_NAMESPACE::DefineClass<TArray<CLS>>()                                                         \
        .Method("Add", SelectFunction(int (TArray<CLS>::*)(CLS const&), &TArray<CLS>::Add))              \
        .Method("Get", SelectFunction(CLS& (TArray<CLS>::*) (int), &TArray<CLS>::operator[]))            \
        .Method("GetRef", SelectFunction(CLS& (TArray<CLS>::*) (int), &TArray<CLS>::operator[]))         \
        .Method("Num", MakeFunction(&TArray<CLS>::Num))                                                  \
        .Method("Contains", MakeFunction(&TArray<CLS>::Contains<CLS>))                                   \
        .Method("FindIndex", SelectFunction(int (TArray<CLS>::*)(CLS const&) const, &TArray<CLS>::Find)) \
        .Method("RemoveAt", SelectFunction(void (TArray<CLS>::*)(int), &TArray<CLS>::RemoveAt))          \
        .Method("IsValidIndex", MakeFunction(&TArray<CLS>::IsValidIndex))                                \
        .Method("Empty", MakeFunction(&TArray<CLS>::Empty))                                              \
        .Register()
#endif

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

#define RegisterTSharedPtr(ITEMCLS)                                             \
    PUERTS_NAMESPACE::DefineClass<TSharedPtr<ITEMCLS>>()                        \
        .Method("Equals", MakeExtension(&TSharedPtrExtension<ITEMCLS>::Equals)) \
        .Register();

namespace PUERTS_NAMESPACE
{
namespace v8_impl
{
class TCharStringHolder
{
public:
    TCharStringHolder()
    {
    }

    TCharStringHolder(v8::Local<v8::Context> context, const v8::Local<v8::Value> value)
    {
        Str = FV8Utils::ToFString(context->GetIsolate(), value);
    }

    const TCHAR* Data() const
    {
        return *Str;
    }

private:
    FString Str;
};

template <>
struct CustomArgumentBufferType<const TCHAR*>
{
    using type = TCharStringHolder;
    static constexpr bool enable = true;
};

template <>
struct Converter<FString>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, FString value)
    {
        return FV8Utils::ToV8String(context->GetIsolate(), value);
    }

    static FString toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return FV8Utils::ToFString(context->GetIsolate(), value);
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
        return FV8Utils::ToV8String(context->GetIsolate(), value.ToString());
    }

    static FName toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        if (value->IsArrayBuffer())
        {
            auto Ab = v8::Local<v8::ArrayBuffer>::Cast(value);
            size_t ByteLength;
            auto Data = DataTransfer::GetArrayBufferData(Ab, ByteLength);
            if (ByteLength == sizeof(FName))
            {
                return *static_cast<FName*>(Data);
            }
        }
        return FV8Utils::ToFName(context->GetIsolate(), value);
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
        return FV8Utils::ToV8String(context->GetIsolate(), value);
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
        return FV8Utils::ToV8String(context->GetIsolate(), value.ToString());
    }

    static FText toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return FText::FromString(FV8Utils::ToFString(context->GetIsolate(), value));
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
        return DataTransfer::NewArrayBuffer(context, value.Data, value.Length);
    }

    static FArrayBuffer toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        FArrayBuffer Ret = {nullptr, 0};
        if (value->IsArrayBufferView())
        {
            v8::Local<v8::ArrayBufferView> BuffView = value.As<v8::ArrayBufferView>();
            auto Ab = BuffView->Buffer();
            Ret.Data = static_cast<char*>(DataTransfer::GetArrayBufferData(Ab)) + BuffView->ByteOffset();
            Ret.Length = BuffView->ByteLength();
        }
        else if (value->IsArrayBuffer())
        {
            auto Ab = v8::Local<v8::ArrayBuffer>::Cast(value);
            size_t ByteLength;
            Ret.Data = static_cast<char*>(DataTransfer::GetArrayBufferData(Ab, ByteLength));
            Ret.Length = ByteLength;
        }
        return Ret;
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsArrayBuffer() || value->IsArrayBufferView();
    }
};

template <>
struct Converter<FArrayBufferValue>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, FArrayBufferValue& value)
    {
        v8::Local<v8::ArrayBuffer> Ab = v8::ArrayBuffer::New(context->GetIsolate(), value.Data.Num());
        void* Buff = static_cast<char*>(DataTransfer::GetArrayBufferData(Ab));
        ::memcpy(Buff, value.Data.GetData(), value.Data.Num());
        return Ab;
    }

    static FArrayBufferValue toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        FArrayBufferValue Ret;
        size_t Len = 0;
        void* Data = nullptr;
        if (value->IsArrayBufferView())
        {
            v8::Local<v8::ArrayBufferView> BuffView = value.As<v8::ArrayBufferView>();
            auto Ab = BuffView->Buffer();
            Data = static_cast<char*>(DataTransfer::GetArrayBufferData(Ab)) + BuffView->ByteOffset();
            Len = BuffView->ByteLength();
        }
        else if (value->IsArrayBuffer())
        {
            auto Ab = v8::Local<v8::ArrayBuffer>::Cast(value);
            Data = DataTransfer::GetArrayBufferData(Ab, Len);
        }
        if (Len > 0 && Data)
        {
            Ret.Data.AddUninitialized(Len);
            ::memcpy(Ret.Data.GetData(), Data, Len);
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
        using TypeWithoutConst = typename std::remove_const<T>::type;
        return DataTransfer::FindOrAddObject<TypeWithoutConst>(context->GetIsolate(), context, (TypeWithoutConst*) (value));
    }

    static T* toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        T* Ret = DataTransfer::GetPointerFast<T>(value.As<v8::Object>());
        return (!Ret || Ret == RELEASED_UOBJECT_MEMBER || !Ret->IsValidLowLevelFast() || UEObjectIsPendingKill(Ret)) ? nullptr
                                                                                                                     : Ret;
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        if (value.As<v8::Object>()->IsNullOrUndefined())
            return true;
        return DataTransfer::IsInstanceOf(context->GetIsolate(), T::StaticClass(), value.As<v8::Object>());
    }
};

template <typename T>
struct Converter<T*, typename std::enable_if<!std::is_convertible<T*, const UObject*>::value &&
                                             std::is_convertible<T*, const UObjectBase*>::value>::type>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, T* value)
    {
        return DataTransfer::FindOrAddObject<UObject>(context->GetIsolate(), context, static_cast<UObject*>(value));
    }

    static T* toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        T* Ret = DataTransfer::GetPointerFast<T>(value.As<v8::Object>());
        return (!Ret || Ret == RELEASED_UOBJECT_MEMBER || !Ret->IsValidLowLevelFast()) ? nullptr : Ret;
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return DataTransfer::IsInstanceOf(context->GetIsolate(), UObject::StaticClass(), value.As<v8::Object>());
    }
};

}    // namespace v8_impl

template <>
struct ScriptTypeName<FString>
{
    static constexpr auto value()
    {
        return internal::Literal("string");
    }
};

template <>
struct ScriptTypeName<FName>
{
    static constexpr auto value()
    {
        return internal::Literal("string");
    }
};

template <>
struct ScriptTypeName<const TCHAR*>
{
    static constexpr auto value()
    {
        return internal::Literal("string");
    }
};

#ifndef PUERTS_FTEXT_AS_OBJECT
template <>
struct ScriptTypeName<FText>
{
    static constexpr auto value()
    {
        return internal::Literal("string");
    }
};
#endif

template <>
struct ScriptTypeName<FArrayBuffer>
{
    static constexpr auto value()
    {
        return internal::Literal("ArrayBuffer");
    }
};

template <>
struct ScriptTypeName<FArrayBufferValue>
{
    static constexpr auto value()
    {
        return internal::Literal("ArrayBuffer");
    }
};

template <typename T>
struct ScriptTypeNameWithNamespace<T,
    typename std::enable_if<is_objecttype<typename std::remove_pointer<typename std::decay<T>::type>::type>::value>::type>
{
    static constexpr auto value()
    {
        return internal::Literal("cpp.") + ScriptTypeName<T>::value();
    }
};

template <typename T>
struct ScriptTypeNameWithNamespace<T,
    typename std::enable_if<is_uetype<typename std::remove_pointer<typename std::decay<T>::type>::type>::value>::type>
{
    static constexpr auto value()
    {
        return internal::Literal("UE.") + ScriptTypeName<T>::value();
    }
};

template <typename T>
struct ScriptTypeName<TSharedPtr<T>>
{
    static constexpr auto value()
    {
        return internal::Literal("UE.TSharedPtr<") + ScriptTypeNameWithNamespace<T>::value() + internal::Literal(">");
    }
};

template <typename T>
struct ScriptTypeName<TArray<T>>
{
    static constexpr auto value()
    {
        return internal::Literal("UE.TArray<") + ScriptTypeNameWithNamespace<T>::value() + internal::Literal(">");
    }
};

template <typename T>
struct ScriptTypeName<TSet<T>>
{
    static constexpr auto value()
    {
        return internal::Literal("UE.TSet<") + ScriptTypeNameWithNamespace<T>::value() + internal::Literal(">");
    }
};

template <typename TKey, typename TValue>
struct ScriptTypeName<TMap<TKey, TValue>>
{
    static constexpr auto value()
    {
        return internal::Literal("UE.TMap<") + ScriptTypeNameWithNamespace<TKey>::value() + internal::Literal(", ") +
               ScriptTypeNameWithNamespace<TValue>::value() + internal::Literal(">");
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

namespace v8_impl
{
template <typename T>
struct Converter<T*, typename std::enable_if<!std::is_const<T>::value && !std::is_convertible<T*, const UObject*>::value &&
                                             internal::IsUStructHelper<T>::value>::type>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, const T* value)
    {
        return DataTransfer::FindOrAddStruct<T>(context->GetIsolate(), context, (void*) value, true);
    }

    static T* toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return DataTransfer::GetPointerFast<T>(value.As<v8::Object>());
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return DataTransfer::IsInstanceOf<T>(context->GetIsolate(), value.As<v8::Object>());
    }
};

template <typename T>
struct Converter<const T*,
    typename std::enable_if<!std::is_convertible<T*, const UObject*>::value && internal::IsUStructHelper<T>::value>::type>
    : Converter<T*>
{
};

template <typename T>
struct Converter<T, typename std::enable_if<internal::IsUStructHelper<T>::value>::type>
{
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, const T value)
    {
        return DataTransfer::FindOrAddStruct<T>(context->GetIsolate(), context, new T(value), false);
    }

    static T toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        T* ptr = DataTransfer::GetPointerFast<T>(value.As<v8::Object>());
        return ptr ? *ptr : T{};
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return DataTransfer::IsInstanceOf<T>(context->GetIsolate(), value.As<v8::Object>());
    }
};

template <typename T>
struct Converter<const T, typename std::enable_if<internal::IsUStructHelper<T>::value>::type> : Converter<T>
{
};

}    // namespace v8_impl

template <typename T>
struct ScriptTypeName<const T, typename std::enable_if<internal::IsUStructHelper<T>::value>::type> : ScriptTypeName<T>
{
};

}    // namespace PUERTS_NAMESPACE
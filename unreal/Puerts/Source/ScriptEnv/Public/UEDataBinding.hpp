/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "ScriptBackend.hpp"
#include "PesapiBackend.hpp"
#include "PapiDataTransfer.h"
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
struct is_ue_container : std::false_type
{
};

template <typename T>
struct is_ue_container<TArray<T>> : std::true_type
{
};

template <typename T>
struct is_ue_container<TSet<T>> : std::true_type
{
};

template <typename TKey, typename TValue>
struct is_ue_container<TMap<TKey, TValue>> : std::true_type
{
};

template <typename T>
struct ScriptTypeNameWithNamespace<T,
    typename std::enable_if<is_objecttype<typename std::remove_pointer<typename std::decay<T>::type>::type>::value &&
                            !is_ue_container<typename std::remove_pointer<typename std::decay<T>::type>::type>::value>::type>
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

template <>
struct is_char<TCHAR> : std::true_type
{
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

template <typename T>
struct ScriptTypeName<const T, typename std::enable_if<internal::IsUStructHelper<T>::value>::type> : ScriptTypeName<T>
{
};

#if PUERTS_PESAPI_IN_UE_PLUGIN
namespace pesapi_impl
{
// Converters of UE types for the pesapi backend, the same behavior as the v8_impl ones (see UEDataBindingV8.h). UObjects and
// UStructs are mapped by the IObjectMapper of the host (the env private), see PapiDataTransfer.h.
class TCharStringHolder
{
public:
    TCharStringHolder()
    {
    }

    TCharStringHolder(PApiCallbackEnv env, pesapi_value value)
    {
        Str = PapiDataTransfer::ToFString(env.apis, env.env, value);
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
    static pesapi_value toScript(PApiCallbackEnv env, const FString& value)
    {
        return PapiDataTransfer::FromFString(env.apis, env.env, value);
    }

    static FString toCpp(PApiCallbackEnv env, pesapi_value value)
    {
        return PapiDataTransfer::ToFString(env.apis, env.env, value);
    }

    static bool accept(PApiCallbackEnv env, pesapi_value value)
    {
        return env.apis->is_string(env.env, value) != 0;
    }
};

template <>
struct Converter<FName>
{
    static pesapi_value toScript(PApiCallbackEnv env, FName value)
    {
        return PapiDataTransfer::FromFString(env.apis, env.env, value.ToString());
    }

    static FName toCpp(PApiCallbackEnv env, pesapi_value value)
    {
        // a FName passed by value (ArrayBuffer of sizeof(FName)), only a plain ArrayBuffer (a view has a buffer property)
        if (env.apis->is_binary(env.env, value) &&
            env.apis->is_undefined(env.env, env.apis->get_property(env.env, value, "buffer")))
        {
            size_t ByteLength = 0;
            void* Data = env.apis->get_value_binary(env.env, value, &ByteLength);
            if (ByteLength == sizeof(FName))
            {
                return *static_cast<FName*>(Data);
            }
        }
        return FName(*PapiDataTransfer::ToFString(env.apis, env.env, value));
    }

    static bool accept(PApiCallbackEnv env, pesapi_value value)
    {
        return env.apis->is_string(env.env, value) != 0;
    }
};

template <>
struct Converter<const TCHAR*>
{
    static pesapi_value toScript(PApiCallbackEnv env, const TCHAR* value)
    {
        static_assert(sizeof(TCHAR) == sizeof(uint16_t), "TCHAR must be UTF-16");
        return env.apis->create_string_utf16(
            env.env, reinterpret_cast<const uint16_t*>(value ? value : TEXT("")), value ? FCString::Strlen(value) : 0);
    }

    static TCharStringHolder toCpp(PApiCallbackEnv env, pesapi_value value)
    {
        return TCharStringHolder(env, value);
    }

    static bool accept(PApiCallbackEnv env, pesapi_value value)
    {
        return env.apis->is_string(env.env, value) != 0;
    }
};

#ifndef PUERTS_FTEXT_AS_OBJECT
template <>
struct Converter<FText>
{
    static pesapi_value toScript(PApiCallbackEnv env, const FText& value)
    {
        return PapiDataTransfer::FromFString(env.apis, env.env, value.ToString());
    }

    static FText toCpp(PApiCallbackEnv env, pesapi_value value)
    {
        return FText::FromString(PapiDataTransfer::ToFString(env.apis, env.env, value));
    }

    static bool accept(PApiCallbackEnv env, pesapi_value value)
    {
        return env.apis->is_string(env.env, value) != 0;
    }
};
#endif

template <>
struct Converter<FArrayBuffer>
{
    static pesapi_value toScript(PApiCallbackEnv env, FArrayBuffer value)
    {
        return env.apis->create_binary(env.env, value.Data, value.Length);
    }

    static FArrayBuffer toCpp(PApiCallbackEnv env, pesapi_value value)
    {
        FArrayBuffer Ret = {nullptr, 0};
        size_t Len = 0;
        void* Data = env.apis->get_value_binary(env.env, value, &Len);
        if (Data)
        {
            Ret.Data = Data;
            Ret.Length = Len;
        }
        return Ret;
    }

    static bool accept(PApiCallbackEnv env, pesapi_value value)
    {
        return env.apis->is_binary(env.env, value) != 0;
    }
};

template <>
struct Converter<FArrayBufferValue>
{
    static pesapi_value toScript(PApiCallbackEnv env, FArrayBufferValue& value)
    {
        return env.apis->create_binary_by_value(env.env, value.Data.GetData(), value.Data.Num());
    }

    static FArrayBufferValue toCpp(PApiCallbackEnv env, pesapi_value value)
    {
        FArrayBufferValue Ret;
        size_t Len = 0;
        void* Data = env.apis->get_value_binary(env.env, value, &Len);
        if (Len > 0 && Data)
        {
            Ret.Data.AddUninitialized(Len);
            ::memcpy(Ret.Data.GetData(), Data, Len);
        }
        return Ret;
    }

    static bool accept(PApiCallbackEnv env, pesapi_value value)
    {
        return env.apis->is_binary(env.env, value) != 0;
    }
};

// UObject derived (both const and non-const)
template <typename T>
struct Converter<T*, typename std::enable_if<std::is_convertible<T*, const UObject*>::value>::type>
{
    static pesapi_value toScript(PApiCallbackEnv env, T* value)
    {
        using TypeWithoutConst = typename std::remove_const<T>::type;
        return PapiDataTransfer::FindOrAddObject<TypeWithoutConst>(env.apis, env.env, (TypeWithoutConst*) (value));
    }

    static T* toCpp(PApiCallbackEnv env, pesapi_value value)
    {
        // a released / pending kill UObject (or a non-UObject wrapper) is returned as nullptr
        UObject* Ret = PapiDataTransfer::GetUObjectOfNativePtr(env.apis->get_native_object_ptr(env.env, value));
        return LIKELY(Ret != RELEASED_UOBJECT) ? static_cast<T*>(Ret) : nullptr;
    }

    static bool accept(PApiCallbackEnv env, pesapi_value value)
    {
        if (env.apis->is_null(env.env, value) || env.apis->is_undefined(env.env, value))
            return true;
        return PapiDataTransfer::IsInstanceOf(env.apis, env.env, T::StaticClass(), value);
    }
};

// UObjectBase derived but not UObject derived
template <typename T>
struct Converter<T*, typename std::enable_if<!std::is_convertible<T*, const UObject*>::value &&
                                             std::is_convertible<T*, const UObjectBase*>::value>::type>
{
    static pesapi_value toScript(PApiCallbackEnv env, T* value)
    {
        return PapiDataTransfer::FindOrAddObject<UObject>(env.apis, env.env, static_cast<UObject*>(value));
    }

    static T* toCpp(PApiCallbackEnv env, pesapi_value value)
    {
        // pending kill objects are still accessible through UObjectBase (the same as before)
        UObject* Ret = PapiDataTransfer::GetUObjectOfNativePtr(env.apis->get_native_object_ptr(env.env, value), true);
        return LIKELY(Ret != RELEASED_UOBJECT) ? static_cast<T*>(static_cast<UObjectBase*>(Ret)) : nullptr;
    }

    static bool accept(PApiCallbackEnv env, pesapi_value value)
    {
        return PapiDataTransfer::IsInstanceOf(env.apis, env.env, UObject::StaticClass(), value);
    }
};

template <typename T>
struct Converter<T*, typename std::enable_if<!std::is_const<T>::value && !std::is_convertible<T*, const UObject*>::value &&
                                             internal::IsUStructHelper<T>::value>::type>
{
    static pesapi_value toScript(PApiCallbackEnv env, const T* value)
    {
        return PapiDataTransfer::FindOrAddStruct<T>(env.apis, env.env, (void*) value, true);
    }

    static T* toCpp(PApiCallbackEnv env, pesapi_value value)
    {
        return static_cast<T*>(env.apis->get_native_object_ptr(env.env, value));
    }

    static bool accept(PApiCallbackEnv env, pesapi_value value)
    {
        return PapiDataTransfer::IsInstanceOf<T>(env.apis, env.env, value);
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
    static pesapi_value toScript(PApiCallbackEnv env, const T value)
    {
        return PapiDataTransfer::FindOrAddStruct<T>(env.apis, env.env, new T(value), false);
    }

    static T toCpp(PApiCallbackEnv env, pesapi_value value)
    {
        T* ptr = static_cast<T*>(env.apis->get_native_object_ptr(env.env, value));
        return ptr ? *ptr : T{};
    }

    static bool accept(PApiCallbackEnv env, pesapi_value value)
    {
        return PapiDataTransfer::IsInstanceOf<T>(env.apis, env.env, value);
    }
};

template <typename T>
struct Converter<const T, typename std::enable_if<internal::IsUStructHelper<T>::value>::type> : Converter<T>
{
};

// the same as v8_impl::API::GetSelf, a released or pending kill UObject is returned as nullptr
template <typename T>
struct SelfChecker<T, typename std::enable_if<std::is_convertible<T*, const UObjectBase*>::value>::type>
{
    static T* Get(PApiCallbackEnv env, pesapi_callback_info info)
    {
        UObject* Ret = PapiDataTransfer::GetUObjectOfNativePtr(
            env.apis->get_native_holder_ptr(info), !std::is_convertible<T*, const UObject*>::value);
        return LIKELY(Ret != RELEASED_UOBJECT) ? static_cast<T*>(static_cast<UObjectBase*>(Ret)) : nullptr;
    }
};
}    // namespace pesapi_impl
#endif

}    // namespace PUERTS_NAMESPACE

#ifdef PUERTS_FTEXT_AS_OBJECT
// FText is bound as a cpp object (registered in UEExtension.cpp), it is used by the generated wrappers too (e.g. FVector::ToText)
UsingCppType(FText);
#endif

#if !PUERTS_BINDING_IS_PESAPI
#include "UEDataBindingV8.h"
#endif

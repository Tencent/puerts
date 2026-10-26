/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

// the engine independent (papi) part of DataTransfer.h, used by the UE type converters of the pesapi binding
#include "CoreMinimal.h"
#include "UObject/Package.h"
#include "UObject/Class.h"
#include "UObjectHandle.h"
#include "NamespaceDef.h"
#include "pesapi.h"
#include <type_traits>

#ifndef RELEASED_UOBJECT
#define RELEASED_UOBJECT ((UObject*) 12)
#endif
#ifndef RELEASED_UOBJECT_MEMBER
#define RELEASED_UOBJECT_MEMBER ((void*) 12)
#endif

namespace PUERTS_NAMESPACE
{
FORCEINLINE UScriptStruct* GetScriptStructInCoreUObject(const TCHAR* Name)
{
    static UPackage* CoreUObjectPkg = FindObjectChecked<UPackage>(nullptr, TEXT("/Script/CoreUObject"));
    return FindObjectChecked<UScriptStruct>(CoreUObjectPkg, Name);
}

template <class T, typename Enable = void>
struct TScriptStructTraits
{
};

#define PUERTS_BASE_STRUCTURE_TRAITS(T)      \
    template <>                              \
    struct TScriptStructTraits<T>            \
    {                                        \
        static UScriptStruct* Get()          \
        {                                    \
            return TBaseStructure<T>::Get(); \
        }                                    \
    };

#define PUERTS_CORE_UOBJECT_STRUCT_TRAITS(T, Name)           \
    template <>                                              \
    struct TScriptStructTraits<T>                            \
    {                                                        \
        static UScriptStruct* Get()                          \
        {                                                    \
            return GetScriptStructInCoreUObject(TEXT(Name)); \
        }                                                    \
    };

PUERTS_BASE_STRUCTURE_TRAITS(FVector)
PUERTS_BASE_STRUCTURE_TRAITS(FVector2D)
PUERTS_BASE_STRUCTURE_TRAITS(FVector4)
PUERTS_BASE_STRUCTURE_TRAITS(FRotator)
PUERTS_BASE_STRUCTURE_TRAITS(FQuat)
PUERTS_BASE_STRUCTURE_TRAITS(FTransform)
PUERTS_BASE_STRUCTURE_TRAITS(FLinearColor)
PUERTS_BASE_STRUCTURE_TRAITS(FColor)
PUERTS_BASE_STRUCTURE_TRAITS(FGuid)
PUERTS_BASE_STRUCTURE_TRAITS(FBox2D)
PUERTS_CORE_UOBJECT_STRUCT_TRAITS(FIntPoint, "IntPoint")
PUERTS_CORE_UOBJECT_STRUCT_TRAITS(FIntVector, "IntVector")
PUERTS_CORE_UOBJECT_STRUCT_TRAITS(FPlane, "Plane")
PUERTS_CORE_UOBJECT_STRUCT_TRAITS(FMatrix, "Matrix")
PUERTS_CORE_UOBJECT_STRUCT_TRAITS(FIntVector4, "IntVector4")

#undef PUERTS_BASE_STRUCTURE_TRAITS
#undef PUERTS_CORE_UOBJECT_STRUCT_TRAITS

template <class...>
using ToVoid = void;

template <typename T, typename = void>
struct HasStaticStructHelper : std::false_type
{
};

template <typename T>
struct HasStaticStructHelper<T, ToVoid<decltype(&T::StaticStruct)>> : std::true_type
{
};

template <typename T>
struct TScriptStructTraits<T, typename std::enable_if<HasStaticStructHelper<T>::value>::type>
{
    static UScriptStruct* Get()
    {
        return T::StaticStruct();
    }
};

// UE value <-> papi value helpers, the env private of the env must be the IObjectMapper of the host
class SCRIPTENV_API PapiDataTransfer
{
public:
    // UObject of the native pointer of a js wrapper (a FUObjectHandle for UObject wrappers, e.g. the result of
    // pesapi get_native_object_ptr / get_native_holder_ptr): nullptr if no native pointer, RELEASED_UOBJECT if the UObject is
    // destroyed / pending kill, or the pointer is not a FUObjectHandle
    FORCEINLINE static UObject* GetUObjectOfNativePtr(void* Ptr, bool EvenIfPendingKill = false)
    {
        if (!Ptr)
        {
            return nullptr;
        }
        if (UNLIKELY(!FUObjectHandle::IsHandle(Ptr)))
        {
            return RELEASED_UOBJECT;
        }
        auto Handle = static_cast<FUObjectHandle*>(Ptr);
        UObject* Ret = EvenIfPendingKill ? Handle->GetEvenIfPendingKill() : Handle->Get();
        return LIKELY(Ret) ? Ret : RELEASED_UOBJECT;
    }

    FORCEINLINE static FString ToFString(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value)
    {
        FString Ret;
        size_t Len = 0;
        Apis->get_value_string_utf16(Env, Value, nullptr, &Len);
        if (Len > 0)
        {
            TArray<TCHAR>& CharArray = Ret.GetCharArray();
            CharArray.SetNumUninitialized(static_cast<int32>(Len) + 1);
            Apis->get_value_string_utf16(Env, Value, reinterpret_cast<uint16_t*>(CharArray.GetData()), &Len);
            CharArray[static_cast<int32>(Len)] = TEXT('\0');
        }
        return Ret;
    }

    FORCEINLINE static pesapi_value FromFString(struct pesapi_ffi* Apis, pesapi_env Env, const FString& Str)
    {
        static_assert(sizeof(TCHAR) == sizeof(uint16_t), "TCHAR must be UTF-16");
        return Apis->create_string_utf16(Env, reinterpret_cast<const uint16_t*>(*Str), static_cast<size_t>(Str.Len()));
    }

    // keeps Outer alive while Inner (a struct / container which points into Outer) is alive
    FORCEINLINE static void LinkOuter(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Outer, pesapi_value Inner)
    {
#ifdef WITH_OUTER_LINK
        Apis->set_property_uint32(Env, Inner, 0, Outer);
#endif
    }

    template <typename T>
    FORCEINLINE static pesapi_value FindOrAddObject(struct pesapi_ffi* Apis, pesapi_env Env, T* UEObject)
    {
        return FindOrAddObject(Apis, Env, UEObject == nullptr ? T::StaticClass() : UEObject->GetClass(), UEObject);
    }

    static pesapi_value FindOrAddObject(struct pesapi_ffi* Apis, pesapi_env Env, UClass* Class, UObject* UEObject);

    template <typename T>
    FORCEINLINE static pesapi_value FindOrAddStruct(struct pesapi_ffi* Apis, pesapi_env Env, void* Ptr, bool PassByPointer)
    {
        return FindOrAddStruct(Apis, Env, TScriptStructTraits<T>::Get(), Ptr, PassByPointer);
    }

    static pesapi_value FindOrAddStruct(
        struct pesapi_ffi* Apis, pesapi_env Env, UScriptStruct* ScriptStruct, void* Ptr, bool PassByPointer);

    template <typename T>
    FORCEINLINE static bool IsInstanceOf(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value Value)
    {
        return IsInstanceOf(Apis, Env, TScriptStructTraits<T>::Get(), Value);
    }

    // false for a non object value
    static bool IsInstanceOf(struct pesapi_ffi* Apis, pesapi_env Env, UStruct* Struct, pesapi_value Value);
};
}    // namespace PUERTS_NAMESPACE

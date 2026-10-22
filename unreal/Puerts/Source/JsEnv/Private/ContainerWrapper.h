/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include <memory>
#include <vector>

#include "CoreMinimal.h"
#include "CoreUObject.h"
#include "V8Utils.h"
#include "ObjectMapper.h"
#include "JSLogger.h"
#include "pesapi.h"

#include "NamespaceDef.h"

PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS
#pragma warning(push, 0)
#include "libplatform/libplatform.h"
#include "v8.h"
#pragma warning(pop)
PRAGMA_ENABLE_UNDEFINED_IDENTIFIER_WARNINGS

namespace PUERTS_NAMESPACE
{
class FPropertyTranslator;
FORCEINLINE int32 GetSizeWithAlignment(PropertyMacro* InProperty)
{
    return Align(InProperty->GetSize(), InProperty->GetMinAlignment());
}

struct FScriptArrayEx
{
    FScriptArray Data;

#if ENGINE_MINOR_VERSION < 25 && ENGINE_MAJOR_VERSION < 5
    TWeakObjectPtr<PropertyMacro> PropertyPtr;
#else
    TWeakFieldPtr<PropertyMacro> PropertyPtr;
#endif

    FORCEINLINE FScriptArrayEx(PropertyMacro* InProperty)
    {
        // UE_LOG(LogTemp, Warning, TEXT("FScriptArrayEx:%p"), this);
        PropertyPtr = InProperty;
    }

    FORCEINLINE ~FScriptArrayEx()
    {
        // UE_LOG(LogTemp, Warning, TEXT("~FScriptArrayEx:%p"), this);
        if (PropertyPtr.IsValid())
        {
            Empty(&Data, PropertyPtr.Get());
        }
        else
        {
            UE_LOG(Puerts, Error, TEXT("~FScriptArrayEx: Property is invalid"));
        }
    }

    FORCEINLINE static uint8* GetData(FScriptArray* ScriptArray, int32 ElementSize, int32 Index)
    {
        return static_cast<uint8*>(ScriptArray->GetData()) + Index * ElementSize;
    }

    FORCEINLINE static void Destruct(FScriptArray* ScriptArray, PropertyMacro* Property, int32 Index, int32 Count = 1)
    {
        const int32 ElementSize = GetSizeWithAlignment(Property);
        uint8* Dest = GetData(ScriptArray, ElementSize, Index);
        for (int32 i = 0; i < Count; ++i)
        {
            Property->DestroyValue(Dest);
            Dest += ElementSize;
        }
    }

    FORCEINLINE static void Empty(FScriptArray* ScriptArray, PropertyMacro* Property)
    {
        Destruct(ScriptArray, Property, 0, ScriptArray->Num());
#if ENGINE_MAJOR_VERSION > 4
        ScriptArray->Empty(0, GetSizeWithAlignment(Property), __STDCPP_DEFAULT_NEW_ALIGNMENT__);
#else
        ScriptArray->Empty(0, GetSizeWithAlignment(Property));
#endif
    }
};

struct FScriptSetEx
{
    FScriptSet Data;

#if ENGINE_MINOR_VERSION < 25 && ENGINE_MAJOR_VERSION < 5
    TWeakObjectPtr<PropertyMacro> PropertyPtr;
#else
    TWeakFieldPtr<PropertyMacro> PropertyPtr;
#endif

    FORCEINLINE FScriptSetEx(PropertyMacro* InProperty)
    {
        // UE_LOG(LogTemp, Warning, TEXT("FScriptSetEx:%p"), this);
        PropertyPtr = InProperty;
    }

    FORCEINLINE ~FScriptSetEx()
    {
        // UE_LOG(LogTemp, Warning, TEXT("~FScriptSetEx:%p"), this);
        if (PropertyPtr.IsValid())
        {
            Empty(&Data, PropertyPtr.Get());
        }
        else
        {
            UE_LOG(Puerts, Error, TEXT("~FScriptSetEx: Property is invalid"));
        }
    }

    FORCEINLINE static void Destruct(FScriptSet* ScriptSet, PropertyMacro* Property, int32 Index, int32 Count = 1)
    {
        auto SetLayout = ScriptSet->GetScriptLayout(Property->GetSize(), Property->GetMinAlignment());
        for (int32 i = Index; i < Index + Count; ++i)
        {
            if (ScriptSet->IsValidIndex(i))
            {
                void* Data = ScriptSet->GetData(i, SetLayout);
                Property->DestroyValue(Data);
            }
        }
    }

    FORCEINLINE static void Empty(FScriptSet* ScriptSet, PropertyMacro* Property)
    {
        auto SetLayout = FScriptSet::GetScriptLayout(Property->GetSize(), Property->GetMinAlignment());
        Destruct(ScriptSet, Property, 0, ScriptSet->Num());
        ScriptSet->Empty(0, SetLayout);
    }
};

FORCEINLINE static int32 GetKeyOffset(const FScriptMapLayout& ScriptMapLayout)
{
#if ENGINE_MINOR_VERSION < 22 && ENGINE_MAJOR_VERSION < 5
    return ScriptMapLayout.KeyOffset;
#else
    return 0;
#endif
}

struct FScriptMapEx
{
    FScriptMap Data;

#if ENGINE_MINOR_VERSION < 25 && ENGINE_MAJOR_VERSION < 5
    TWeakObjectPtr<PropertyMacro> KeyPropertyPtr;
    TWeakObjectPtr<PropertyMacro> ValuePropertyPtr;
#else
    TWeakFieldPtr<PropertyMacro> KeyPropertyPtr;
    TWeakFieldPtr<PropertyMacro> ValuePropertyPtr;
#endif

    FORCEINLINE FScriptMapEx(PropertyMacro* InKeyProperty, PropertyMacro* InValueProperty)
    {
        // UE_LOG(LogTemp, Warning, TEXT("FScriptMapEx:%p"), this);
        KeyPropertyPtr = InKeyProperty;
        ValuePropertyPtr = InValueProperty;
    }

    FORCEINLINE ~FScriptMapEx()
    {
        // UE_LOG(LogTemp, Warning, TEXT("~FScriptMapEx:%p"), this);
        if (KeyPropertyPtr.IsValid() && ValuePropertyPtr.IsValid())
        {
            Empty(&Data, KeyPropertyPtr.Get(), ValuePropertyPtr.Get());
        }
        else
        {
            UE_LOG(Puerts, Error, TEXT("~FScriptMapEx: Property is invalid"));
        }
    }

    FORCEINLINE static FScriptMapLayout GetScriptLayout(const PropertyMacro* KeyProperty, const PropertyMacro* ValueProperty)
    {
        return FScriptMap::GetScriptLayout(
            KeyProperty->GetSize(), KeyProperty->GetMinAlignment(), ValueProperty->GetSize(), ValueProperty->GetMinAlignment());
    }

    FORCEINLINE static void Destruct(
        FScriptMap* ScriptMap, PropertyMacro* KeyProperty, PropertyMacro* ValueProperty, int32 Index, int32 Count = 1)
    {
        int32 MaxIndex = ScriptMap->GetMaxIndex();
        auto MapLayout = GetScriptLayout(KeyProperty, ValueProperty);
        for (int32 i = Index; i < Index + Count; ++i)
        {
            if (ScriptMap->IsValidIndex(i))
            {
                uint8* Data = reinterpret_cast<uint8*>(ScriptMap->GetData(i, MapLayout));
                void* Key = Data + GetKeyOffset(MapLayout);
                void* Value = Data + MapLayout.ValueOffset;
                KeyProperty->DestroyValue(Key);
                ValueProperty->DestroyValue(Value);
            }
        }
    }

    FORCEINLINE static void Empty(FScriptMap* ScriptMap, PropertyMacro* KeyProperty, PropertyMacro* ValueProperty)
    {
        auto MapLayout = GetScriptLayout(KeyProperty, ValueProperty);
        Destruct(ScriptMap, KeyProperty, ValueProperty, 0, ScriptMap->Num());
        ScriptMap->Empty(0, MapLayout);
    }
};

template <typename T>
struct ContainerExTypeMapper;

template <>
struct ContainerExTypeMapper<FScriptArray>
{
    using Type = FScriptArrayEx;
};

template <>
struct ContainerExTypeMapper<FScriptSet>
{
    using Type = FScriptSetEx;
};

template <>
struct ContainerExTypeMapper<FScriptMap>
{
    using Type = FScriptMapEx;
};

template <typename T>
class FContainerWrapper
{
public:
    static void OnGarbageCollectedWithFree(const v8::WeakCallbackInfo<void>& Data)
    {
        typedef typename ContainerExTypeMapper<T>::Type ET;
        ET* Container =
            static_cast<ET*>(DataTransfer::MakeAddressWithHighPartOfTwo(Data.GetInternalField(0), Data.GetInternalField(1)));
        FV8Utils::IsolateData<IObjectMapper>(Data.GetIsolate())->UnBindContainer(Container);
        delete Container;
    }

    static void OnGarbageCollected(const v8::WeakCallbackInfo<void>& Data)
    {
        T* Container =
            static_cast<T*>(DataTransfer::MakeAddressWithHighPartOfTwo(Data.GetInternalField(0), Data.GetInternalField(1)));
        FV8Utils::IsolateData<IObjectMapper>(Data.GetIsolate())->UnBindContainer(Container);
    }

    static void New(const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        v8::Isolate* Isolate = Info.GetIsolate();
        FV8Utils::ThrowException(Isolate, "Container Constructor no support yet");
    }

    // TODO - 用doxygen注释
    // 参数：无
    // 返回：容器内元素总数
    static void Num(struct pesapi_ffi* Apis, pesapi_callback_info Info)
    {
        auto Self = static_cast<T*>(Apis->get_native_holder_ptr(Info));
        Apis->add_return(Info, Apis->create_int32(Apis->get_env(Info), Self->Num()));
    }
};

class FScriptArrayWrapper : public FContainerWrapper<FScriptArray>
{
public:
    static v8::Local<v8::FunctionTemplate> ToFunctionTemplate(v8::Isolate* Isolate);

private:
    // 参数：一到多个容器元素
    // 返回：无
    // 作用：追加新元素到容器
    static void Add(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    // 参数：索引
    // 返回：元素（值类型，有内存拷贝）
    // 作用：获取索引对应的元素，如果索引越界则抛出异常
    static void Get(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    // 参数：索引
    // 返回：元素（引用类型）
    // 作用：获取索引对应的元素，如果索引越界则抛出异常
    static void GetRef(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    // 参数1：索引；参数2：元素
    // 返回：无
    // 作用：设置容器中索引对应的元素值，如果索引越界则抛出异常
    static void Set(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    // 参数：元素
    // 返回：bool
    // 作用：查询容器是否包含该元素，若是则返回true，否则返回false
    static void Contains(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    // 参数：元素
    // 返回：索引
    // 作用：返回容器中第一次出现该元素的索引，若元素不存在则返回INDEX_NONE（-1）
    static void FindIndex(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    // 参数：索引
    // 返回：无
    // 作用：移除索引对应的元素，被移除的位置之后的元素会自动前移，如果索引越界则抛出异常
    static void RemoveAt(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    // 参数：索引
    // 返回：bool
    // 作用：如果参数是有效索引，返回true，否则返回false
    static void IsValidIndex(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    // 参数：无
    // 返回：无
    // 作用：清空容器
    static void Empty(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    FORCEINLINE static int32 AddUninitialized(FScriptArray* ScriptArray, int32 ElementSize, int32 Count = 1);

    FORCEINLINE static uint8* GetData(FScriptArray* ScriptArray, int32 ElementSize, int32 Index);

    FORCEINLINE static void Construct(FScriptArray* ScriptArray, FPropertyTranslator* Inner, int32 Index, int32 Count = 1);

    static int32 FindIndexInner(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    FORCEINLINE static void InternalGet(struct pesapi_ffi* Apis, pesapi_callback_info Info, bool PassByPointer);
};

class FScriptSetWrapper : public FContainerWrapper<FScriptSet>
{
public:
    static v8::Local<v8::FunctionTemplate> ToFunctionTemplate(v8::Isolate* Isolate);

private:
    static void Add(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void Get(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void GetRef(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void Contains(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void FindIndex(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void RemoveAt(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void GetMaxIndex(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void IsValidIndex(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void Empty(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    FORCEINLINE static int32 FindIndexInner(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    FORCEINLINE static void InternalGet(struct pesapi_ffi* Apis, pesapi_callback_info Info, bool PassByPointer);
};

class FScriptMapWrapper : public FContainerWrapper<FScriptMap>
{
public:
    static v8::Local<v8::FunctionTemplate> ToFunctionTemplate(v8::Isolate* Isolate);

private:
    static void Add(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void Get(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void GetRef(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void Set(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void Remove(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void GetMaxIndex(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void IsValidIndex(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void GetKey(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void Empty(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    FORCEINLINE static FScriptMapLayout GetScriptLayout(const PropertyMacro* KeyProperty, const PropertyMacro* ValueProperty);

    FORCEINLINE static void InternalGet(struct pesapi_ffi* Apis, pesapi_callback_info Info, bool PassByPointer);
};

class FFixSizeArrayWrapper
{
public:
    static v8::Local<v8::FunctionTemplate> ToFunctionTemplate(v8::Isolate* Isolate);

private:
    static void New(const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
    }

    static void Num(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void Get(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void GetRef(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void Set(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    FORCEINLINE static void InternalGet(struct pesapi_ffi* Apis, pesapi_callback_info Info, bool PassByPointer);
};
}    // namespace PUERTS_NAMESPACE

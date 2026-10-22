/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "ContainerWrapper.h"
#include "PropertyTranslator.h"
#include "PesapiClassThunks.h"
#include "PapiV8Bridge.h"

namespace PUERTS_NAMESPACE
{
// internal field 0 of a container wrapper is the container, field 1 is the translator of the element (of the key for a map),
// they are the native pointer and type id slots of papi
template <typename T>
static FORCEINLINE T* ContainerSelfOf(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    return static_cast<T*>(Apis->get_native_holder_ptr(Info));
}

static FORCEINLINE FPropertyTranslator* ContainerInnerOf(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    return static_cast<FPropertyTranslator*>(const_cast<void*>(Apis->get_native_holder_typeid(Info)));
}

// papi exposes only two internal fields, the value translator of a map (field 2) is still read through the bridge
static FORCEINLINE FPropertyTranslator* ContainerMapValueOf(pesapi_callback_info Info)
{
    return DataTransfer::GetPointerFast<FPropertyTranslator>(papi_bridge::HolderOf(Info), 2);
}

static FORCEINLINE bool ContainerCheckArgsLen(struct pesapi_ffi* Apis, pesapi_callback_info Info, int Length)
{
    const int Provided = Apis->get_args_len(Info);
    if (Provided < Length)
    {
        Apis->throw_by_string(Info,
            TCHAR_TO_UTF8(*FString::Printf(TEXT("Bad parameters, the function expect %d, but  %d provided."), Length, Provided)));
        return false;
    }
    return true;
}

// the holder value is not reachable through papi yet
static FORCEINLINE void ContainerLinkOuter(pesapi_env Env, pesapi_callback_info Info, pesapi_value Inner)
{
    LinkOuterImpl(papi_bridge::ToV8(Env), papi_bridge::HolderOf(Info), papi_bridge::ToV8(Inner));
}

static v8::Local<v8::FunctionTemplate> ContainerTemplate(
    v8::Isolate* Isolate, v8::FunctionCallback Constructor, int InternalFieldCount, const JSFunctionInfo* Methods, int MethodCount)
{
    v8::Isolate::Scope Isolatescope(Isolate);
    auto Result = v8::FunctionTemplate::New(Isolate, Constructor);
    Result->InstanceTemplate()->SetInternalFieldCount(InternalFieldCount);
    for (int i = 0; i < MethodCount; ++i)
    {
        Result->PrototypeTemplate()->Set(FV8Utils::InternalString(Isolate, Methods[i].Name),
            ClassThunks::MethodTemplate(Isolate, &Methods[i], v8::ConstructorBehavior::kAllow));
    }
    return Result;
}

#define PAPI_CONTAINER_CHECK_ARGS_LEN(Length)       \
    if (!ContainerCheckArgsLen(Apis, Info, Length)) \
    {                                               \
        return;                                     \
    }

v8::Local<v8::FunctionTemplate> FScriptArrayWrapper::ToFunctionTemplate(v8::Isolate* Isolate)
{
    // the entries are referenced by the function templates, so they must have static storage
    static const JSFunctionInfo Methods[] = {{"Num", &Num}, {"Add", &Add}, {"Get", &Get}, {"GetRef", &GetRef}, {"Set", &Set},
        {"Contains", &Contains}, {"FindIndex", &FindIndex}, {"RemoveAt", &RemoveAt}, {"IsValidIndex", &IsValidIndex},
        {"Empty", &Empty}};
    return ContainerTemplate(Isolate, New, 4, Methods, UE_ARRAY_COUNT(Methods));    // 0 Ptr, 1 Property
}

void FScriptArrayWrapper::Add(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    const int ArgCount = Apis->get_args_len(Info);
    if (ArgCount > 0)
    {
        pesapi_env Env = Apis->get_env(Info);
        auto Self = ContainerSelfOf<FScriptArray>(Apis, Info);
        auto Inner = ContainerInnerOf(Apis, Info);
        if (!Inner->IsPropertyValid())
        {
            Apis->throw_by_string(Info, "item info is invalid!");
            return;
        }

        const int32 ElementSize = GetSizeWithAlignment(Inner->Property);
        int32 Index = AddUninitialized(Self, ElementSize, ArgCount);
        for (int i = 0; i < ArgCount; ++i)
        {
            uint8* DataPtr = GetData(Self, ElementSize, Index + i);
            Inner->Property->InitializeValue(DataPtr);    //使用之前必须得初始化，即使是设置也要
            Inner->JsToUE(Apis, Env, Apis->get_arg(Info, i), DataPtr, false);
        }
        Apis->add_return(Info, Apis->create_int32(Env, Index));
    }
}

void FScriptArrayWrapper::InternalGet(struct pesapi_ffi* Apis, pesapi_callback_info Info, bool PassByPointer)
{
    PAPI_CONTAINER_CHECK_ARGS_LEN(1);

    pesapi_env Env = Apis->get_env(Info);
    auto Self = ContainerSelfOf<FScriptArray>(Apis, Info);
    auto Inner = ContainerInnerOf(Apis, Info);
    if (!Inner->IsPropertyValid())
    {
        Apis->throw_by_string(Info, "item info is invalid!");
        return;
    }

    int Index = Apis->get_value_int32(Env, Apis->get_arg(Info, 0));
    if (Index < 0 || Index >= Self->Num())
    {
        Apis->throw_by_string(Info, "invalid index");
        return;
    }
    uint8* DataPtr = GetData(Self, GetSizeWithAlignment(Inner->Property), Index);
    auto Ret = Inner->UEToJs(Apis, Env, DataPtr, PassByPointer);
    if (Inner->NeedLinkOuter && PassByPointer)
    {
        ContainerLinkOuter(Env, Info, Ret);
    }
    Apis->add_return(Info, Ret);
}

void FScriptArrayWrapper::Get(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    InternalGet(Apis, Info, false);
}

void FScriptArrayWrapper::GetRef(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    InternalGet(Apis, Info, true);
}

void FScriptArrayWrapper::Set(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CONTAINER_CHECK_ARGS_LEN(2);

    pesapi_env Env = Apis->get_env(Info);
    auto Self = ContainerSelfOf<FScriptArray>(Apis, Info);
    auto Inner = ContainerInnerOf(Apis, Info);
    if (!Inner->IsPropertyValid())
    {
        Apis->throw_by_string(Info, "item info is invalid!");
        return;
    }

    int Index = Apis->get_value_int32(Env, Apis->get_arg(Info, 0));
    if (Index < 0 || Index >= Self->Num())
    {
        Apis->throw_by_string(Info, "invalid index");
        return;
    }
    uint8* DataPtr = GetData(Self, GetSizeWithAlignment(Inner->Property), Index);
    Inner->JsToUE(Apis, Env, Apis->get_arg(Info, 1), DataPtr, false);
}

void FScriptArrayWrapper::Contains(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CONTAINER_CHECK_ARGS_LEN(1);
    bool Result = FindIndexInner(Apis, Info) != INDEX_NONE;
    Apis->add_return(Info, Apis->create_boolean(Apis->get_env(Info), Result));
}

void FScriptArrayWrapper::FindIndex(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CONTAINER_CHECK_ARGS_LEN(1);
    int32 Result = FindIndexInner(Apis, Info);
    Apis->add_return(Info, Apis->create_int32(Apis->get_env(Info), Result));
}

void FScriptArrayWrapper::RemoveAt(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CONTAINER_CHECK_ARGS_LEN(1);

    pesapi_env Env = Apis->get_env(Info);
    auto Self = ContainerSelfOf<FScriptArray>(Apis, Info);
    auto Inner = ContainerInnerOf(Apis, Info);
    if (!Inner->IsPropertyValid())
    {
        Apis->throw_by_string(Info, "item info is invalid!");
        return;
    }

    int32 Index = Apis->get_value_int32(Env, Apis->get_arg(Info, 0));
    if (Index < 0 || Index >= Self->Num())
    {
        Apis->throw_by_string(Info, "invalid index");
        return;
    }
    else
    {
        FScriptArrayEx::Destruct(Self, Inner->Property, Index, 1);
#if ENGINE_MAJOR_VERSION > 4
        Self->Remove(Index, 1, GetSizeWithAlignment(Inner->Property), __STDCPP_DEFAULT_NEW_ALIGNMENT__);
#else
        Self->Remove(Index, 1, GetSizeWithAlignment(Inner->Property));
#endif
    }
}

void FScriptArrayWrapper::IsValidIndex(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CONTAINER_CHECK_ARGS_LEN(1);

    pesapi_env Env = Apis->get_env(Info);
    auto Self = ContainerSelfOf<FScriptArray>(Apis, Info);
    int32 Index = Apis->get_value_int32(Env, Apis->get_arg(Info, 0));
    Apis->add_return(Info, Apis->create_boolean(Env, Self->IsValidIndex(Index)));
}

void FScriptArrayWrapper::Empty(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    auto Self = ContainerSelfOf<FScriptArray>(Apis, Info);
    auto Inner = ContainerInnerOf(Apis, Info);
    if (!Inner->IsPropertyValid())
    {
        Apis->throw_by_string(Info, "item info is invalid!");
        return;
    }

    FScriptArrayEx::Empty(Self, Inner->Property);
}

FORCEINLINE int32 FScriptArrayWrapper::AddUninitialized(FScriptArray* ScriptArray, int32 ElementSize, int32 Count)
{
#if ENGINE_MAJOR_VERSION > 4
    return ScriptArray->Add(Count, ElementSize, __STDCPP_DEFAULT_NEW_ALIGNMENT__);
#else
    return ScriptArray->Add(Count, ElementSize);
#endif
}

FORCEINLINE uint8* FScriptArrayWrapper::GetData(FScriptArray* ScriptArray, int32 ElementSize, int32 Index)
{
    return reinterpret_cast<uint8*>(ScriptArray->GetData()) + Index * ElementSize;
}

FORCEINLINE void FScriptArrayWrapper::Construct(FScriptArray* ScriptArray, FPropertyTranslator* Inner, int32 Index, int32 Count)
{
    int32 ElementSize = GetSizeWithAlignment(Inner->Property);
    uint8* Dest = GetData(ScriptArray, ElementSize, Index);
    for (int32 i = 0; i < Count; ++i)
    {
        Inner->Property->InitializeValue(Dest);
        Dest += ElementSize;
    }
}

int32 FScriptArrayWrapper::FindIndexInner(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    auto Self = ContainerSelfOf<FScriptArray>(Apis, Info);
    auto Inner = ContainerInnerOf(Apis, Info);
    if (!Inner->IsPropertyValid())
    {
        Apis->throw_by_string(Info, "item info is invalid!");
        return INDEX_NONE;
    }
    auto Property = Inner->Property;

    void* Dest = FMemory_Alloca(GetSizeWithAlignment(Property));
    Property->InitializeValue(Dest);
    Inner->JsToUE(Apis, Env, Apis->get_arg(Info, 0), Dest, false);

    const int32 Num = Self->Num();
    int32 Result = INDEX_NONE;
    for (int32 i = 0; i < Num; ++i)
    {
        uint8* Src = GetData(Self, GetSizeWithAlignment(Property), i);
        if (Property->Identical(Src, Dest))
        {
            Result = i;
            break;
        }
    }
    Property->DestroyValue(Dest);
    return Result;
}

//---------------------------------------Set-----------------------------------------------

v8::Local<v8::FunctionTemplate> FScriptSetWrapper::ToFunctionTemplate(v8::Isolate* Isolate)
{
    static const JSFunctionInfo Methods[] = {{"Num", &Num}, {"Add", &Add}, {"Get", &Get}, {"GetRef", &GetRef},
        {"Contains", &Contains}, {"FindIndex", &FindIndex}, {"RemoveAt", &RemoveAt}, {"GetMaxIndex", &GetMaxIndex},
        {"IsValidIndex", &IsValidIndex}, {"Empty", &Empty}};
    return ContainerTemplate(Isolate, New, 4, Methods, UE_ARRAY_COUNT(Methods));    // 0 Ptr, 1 Property
}

void FScriptSetWrapper::Add(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CONTAINER_CHECK_ARGS_LEN(1);

    pesapi_env Env = Apis->get_env(Info);
    auto Self = ContainerSelfOf<FScriptSet>(Apis, Info);
    auto Inner = ContainerInnerOf(Apis, Info);
    if (!Inner->IsPropertyValid())
    {
        Apis->throw_by_string(Info, "item info is invalid!");
        return;
    }
    auto Property = Inner->Property;

    void* DataPtr = FMemory_Alloca(GetSizeWithAlignment(Property));
    Property->InitializeValue(DataPtr);
    Inner->JsToUE(Apis, Env, Apis->get_arg(Info, 0), DataPtr, false);

    auto ScriptLayout = FScriptSet::GetScriptLayout(Property->GetSize(), Property->GetMinAlignment());
    Self->Add(
        DataPtr, ScriptLayout, [Property](const void* Element) { return Property->GetValueTypeHash(Element); },
        [Property](const void* A, const void* B) { return Property->Identical(A, B); },
        [Property, DataPtr](void* Element)
        {
            Property->InitializeValue(Element);
            Property->CopySingleValue(Element, DataPtr);
        },
        [Property](void* Element) { Property->DestroyValue(Element); });
    Property->DestroyValue(DataPtr);
}

void FScriptSetWrapper::InternalGet(struct pesapi_ffi* Apis, pesapi_callback_info Info, bool PassByPointer)
{
    PAPI_CONTAINER_CHECK_ARGS_LEN(1);

    pesapi_env Env = Apis->get_env(Info);
    auto Self = ContainerSelfOf<FScriptSet>(Apis, Info);
    auto Inner = ContainerInnerOf(Apis, Info);
    if (!Inner->IsPropertyValid())
    {
        Apis->throw_by_string(Info, "item info is invalid!");
        return;
    }
    auto Property = Inner->Property;

    int32 Index = Apis->get_value_int32(Env, Apis->get_arg(Info, 0));
    if (Self->IsValidIndex(Index) == false)
    {
        Apis->throw_by_string(Info, "invalid index argument");
    }
    else
    {
        auto ScriptLayout = FScriptSet::GetScriptLayout(Property->GetSize(), Property->GetMinAlignment());
        void* Data = Self->GetData(Index, ScriptLayout);
        auto Ret = Inner->UEToJs(Apis, Env, Data, PassByPointer);
        if (Inner->NeedLinkOuter && PassByPointer)
        {
            ContainerLinkOuter(Env, Info, Ret);
        }
        Apis->add_return(Info, Ret);
    }
}

void FScriptSetWrapper::Get(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    InternalGet(Apis, Info, false);
}

void FScriptSetWrapper::GetRef(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    InternalGet(Apis, Info, true);
}

void FScriptSetWrapper::Contains(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CONTAINER_CHECK_ARGS_LEN(1);
    bool Result = FindIndexInner(Apis, Info) != INDEX_NONE;
    Apis->add_return(Info, Apis->create_boolean(Apis->get_env(Info), Result));
}

void FScriptSetWrapper::FindIndex(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CONTAINER_CHECK_ARGS_LEN(1);
    int32 Result = FindIndexInner(Apis, Info);
    Apis->add_return(Info, Apis->create_int32(Apis->get_env(Info), Result));
}

void FScriptSetWrapper::RemoveAt(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CONTAINER_CHECK_ARGS_LEN(1);

    pesapi_env Env = Apis->get_env(Info);
    auto Self = ContainerSelfOf<FScriptSet>(Apis, Info);
    auto Inner = ContainerInnerOf(Apis, Info);
    if (!Inner->IsPropertyValid())
    {
        Apis->throw_by_string(Info, "item info is invalid!");
        return;
    }
    auto Property = Inner->Property;

    int32 Index = Apis->get_value_int32(Env, Apis->get_arg(Info, 0));
    if (Self->IsValidIndex(Index) == false)
    {
        Apis->throw_by_string(Info, "invalid index argument");
    }
    else
    {
        auto ScriptLayout = FScriptSet::GetScriptLayout(Property->GetSize(), Property->GetMinAlignment());
        FScriptSetEx::Destruct(Self, Property, Index, 1);
        Self->RemoveAt(Index, ScriptLayout);
    }
}

void FScriptSetWrapper::GetMaxIndex(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    auto Self = ContainerSelfOf<FScriptSet>(Apis, Info);
    uint32 Result = Self->GetMaxIndex();
    Apis->add_return(Info, Apis->create_uint32(Apis->get_env(Info), Result));
}

void FScriptSetWrapper::IsValidIndex(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CONTAINER_CHECK_ARGS_LEN(1);

    pesapi_env Env = Apis->get_env(Info);
    auto Self = ContainerSelfOf<FScriptSet>(Apis, Info);
    int32 Index = Apis->get_value_int32(Env, Apis->get_arg(Info, 0));
    // kept as a number for compatibility
    uint32 Result = Self->IsValidIndex(Index);
    Apis->add_return(Info, Apis->create_uint32(Env, Result));
}

void FScriptSetWrapper::Empty(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    auto Self = ContainerSelfOf<FScriptSet>(Apis, Info);
    auto Inner = ContainerInnerOf(Apis, Info);
    if (!Inner->IsPropertyValid())
    {
        Apis->throw_by_string(Info, "item info is invalid!");
        return;
    }

    FScriptSetEx::Empty(Self, Inner->Property);
}

int32 FScriptSetWrapper::FindIndexInner(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    auto Self = ContainerSelfOf<FScriptSet>(Apis, Info);
    auto Inner = ContainerInnerOf(Apis, Info);
    if (!Inner->IsPropertyValid())
    {
        Apis->throw_by_string(Info, "item info is invalid!");
        return INDEX_NONE;
    }
    auto Property = Inner->Property;

    void* DataPtr = FMemory_Alloca(GetSizeWithAlignment(Property));
    Property->InitializeValue(DataPtr);

    Inner->JsToUE(Apis, Env, Apis->get_arg(Info, 0), DataPtr, false);

    auto ScriptLayout = FScriptSet::GetScriptLayout(Property->GetSize(), Property->GetMinAlignment());

    int32 Result = Self->FindIndex(
        DataPtr, ScriptLayout, [Property](const void* Element) { return Property->GetValueTypeHash(Element); },
        [Property](const void* A, const void* B) { return Property->Identical(A, B); });
    Property->DestroyValue(DataPtr);
    return Result;
}

//---------------------------------------Map-----------------------------------------------
v8::Local<v8::FunctionTemplate> FScriptMapWrapper::ToFunctionTemplate(v8::Isolate* Isolate)
{
    static const JSFunctionInfo Methods[] = {{"Num", &Num}, {"Add", &Add}, {"Get", &Get}, {"GetRef", &GetRef}, {"Set", &Set},
        {"Remove", &Remove}, {"GetMaxIndex", &GetMaxIndex}, {"IsValidIndex", &IsValidIndex}, {"GetKey", &GetKey},
        {"Empty", &Empty}};
    return ContainerTemplate(Isolate, New, 6, Methods, UE_ARRAY_COUNT(Methods));    // 0 Ptr, 1-2 Property
}

void FScriptMapWrapper::Add(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CONTAINER_CHECK_ARGS_LEN(2);

    pesapi_env Env = Apis->get_env(Info);
    auto Self = ContainerSelfOf<FScriptMap>(Apis, Info);
    auto KeyPropertyTranslator = ContainerInnerOf(Apis, Info);
    auto KeyProperty = KeyPropertyTranslator->Property;
    auto ValuePropertyTranslator = ContainerMapValueOf(Info);
    auto ValueProperty = ValuePropertyTranslator->Property;
    if (!KeyPropertyTranslator->IsPropertyValid() || !ValuePropertyTranslator->IsPropertyValid())
    {
        Apis->throw_by_string(Info, "key/value info is invalid!");
        return;
    }

    void* KeyPtr = FMemory_Alloca(GetSizeWithAlignment(KeyProperty));
    KeyProperty->InitializeValue(KeyPtr);

    void* ValuePtr = FMemory_Alloca(GetSizeWithAlignment(ValueProperty));
    ValueProperty->InitializeValue(ValuePtr);

    KeyPropertyTranslator->JsToUE(Apis, Env, Apis->get_arg(Info, 0), KeyPtr, false);
    ValuePropertyTranslator->JsToUE(Apis, Env, Apis->get_arg(Info, 1), ValuePtr, false);

    auto ScriptLayout = FScriptMap::GetScriptLayout(
        KeyProperty->GetSize(), KeyProperty->GetMinAlignment(), ValueProperty->GetSize(), ValueProperty->GetMinAlignment());

    Self->Add(
        KeyPtr, ValuePtr, ScriptLayout, [KeyProperty](const void* ElementKey) { return KeyProperty->GetValueTypeHash(ElementKey); },
        [KeyProperty](const void* A, const void* B) { return KeyProperty->Identical(A, B); },
        [KeyProperty, KeyPtr](void* NewElementKey)
        {
            KeyProperty->InitializeValue(NewElementKey);
            KeyProperty->CopySingleValue(NewElementKey, KeyPtr);
        },
        [ValueProperty, ValuePtr](void* NewElementValue)
        {
            ValueProperty->InitializeValue(NewElementValue);
            ValueProperty->CopySingleValue(NewElementValue, ValuePtr);
        },
        [ValueProperty, ValuePtr](void* ExistingElementValue) { ValueProperty->CopySingleValue(ExistingElementValue, ValuePtr); },
        [KeyProperty](void* ElementKey) { KeyProperty->DestroyValue(ElementKey); },
        [ValueProperty](void* ElementValue) { ValueProperty->DestroyValue(ElementValue); });
    KeyProperty->DestroyValue(KeyPtr);
    ValueProperty->DestroyValue(ValuePtr);
}

void FScriptMapWrapper::InternalGet(struct pesapi_ffi* Apis, pesapi_callback_info Info, bool PassByPointer)
{
    PAPI_CONTAINER_CHECK_ARGS_LEN(1);

    pesapi_env Env = Apis->get_env(Info);
    auto Self = ContainerSelfOf<FScriptMap>(Apis, Info);
    auto KeyPropertyTranslator = ContainerInnerOf(Apis, Info);
    auto KeyProperty = KeyPropertyTranslator->Property;
    auto ValuePropertyTranslator = ContainerMapValueOf(Info);
    auto ValueProperty = ValuePropertyTranslator->Property;
    if (!KeyPropertyTranslator->IsPropertyValid() || !ValuePropertyTranslator->IsPropertyValid())
    {
        Apis->throw_by_string(Info, "key/value info is invalid!");
        return;
    }

    void* KeyPtr = FMemory_Alloca(GetSizeWithAlignment(KeyProperty));
    KeyProperty->InitializeValue(KeyPtr);
    KeyPropertyTranslator->JsToUE(Apis, Env, Apis->get_arg(Info, 0), KeyPtr, false);

    auto ScriptLayout = FScriptMap::GetScriptLayout(
        KeyProperty->GetSize(), KeyProperty->GetMinAlignment(), ValueProperty->GetSize(), ValueProperty->GetMinAlignment());

    void* ValuePtr = Self->FindValue(
        KeyPtr, ScriptLayout, [KeyProperty](const void* ElementKey) { return KeyProperty->GetValueTypeHash(ElementKey); },
        [KeyProperty](const void* A, const void* B) { return KeyProperty->Identical(A, B); });

    if (ValuePtr)
    {
        auto Ret = ValuePropertyTranslator->UEToJs(Apis, Env, ValuePtr, PassByPointer);
        if (ValuePropertyTranslator->NeedLinkOuter && PassByPointer)
        {
            ContainerLinkOuter(Env, Info, Ret);
        }
        Apis->add_return(Info, Ret);
    }
    KeyProperty->DestroyValue(KeyPtr);
}

void FScriptMapWrapper::Get(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    InternalGet(Apis, Info, false);
}

void FScriptMapWrapper::GetRef(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    InternalGet(Apis, Info, true);
}

void FScriptMapWrapper::Set(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    Add(Apis, Info);
}

void FScriptMapWrapper::Remove(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CONTAINER_CHECK_ARGS_LEN(1);

    pesapi_env Env = Apis->get_env(Info);
    auto Self = ContainerSelfOf<FScriptMap>(Apis, Info);
    auto KeyPropertyTranslator = ContainerInnerOf(Apis, Info);
    auto KeyProperty = KeyPropertyTranslator->Property;
    auto ValuePropertyTranslator = ContainerMapValueOf(Info);
    auto ValueProperty = ValuePropertyTranslator->Property;
    if (!KeyPropertyTranslator->IsPropertyValid() || !ValuePropertyTranslator->IsPropertyValid())
    {
        Apis->throw_by_string(Info, "key/value info is invalid!");
        return;
    }

    void* KeyPtr = FMemory_Alloca(GetSizeWithAlignment(KeyProperty));
    KeyProperty->InitializeValue(KeyPtr);
    KeyPropertyTranslator->JsToUE(Apis, Env, Apis->get_arg(Info, 0), KeyPtr, false);

    auto ScriptLayout = GetScriptLayout(KeyProperty, ValueProperty);
    int32 Index = Self->FindPairIndex(
        KeyPtr, ScriptLayout, [KeyProperty](const void* Key) { return KeyProperty->GetValueTypeHash(Key); },
        [KeyProperty](const void* A, const void* B) { return KeyProperty->Identical(A, B); });
    if (Index == INDEX_NONE)
    {
        Apis->throw_by_string(Info, "invalid key argument");
    }
    else
    {
        FScriptMapEx::Destruct(Self, KeyProperty, ValueProperty, Index, 1);
        Self->RemoveAt(Index, ScriptLayout);
    }
    KeyProperty->DestroyValue(KeyPtr);
}

void FScriptMapWrapper::GetMaxIndex(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    auto Self = ContainerSelfOf<FScriptMap>(Apis, Info);
    int32 Result = Self->GetMaxIndex();
    Apis->add_return(Info, Apis->create_int32(Apis->get_env(Info), Result));
}

void FScriptMapWrapper::IsValidIndex(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CONTAINER_CHECK_ARGS_LEN(1);

    pesapi_env Env = Apis->get_env(Info);
    auto Self = ContainerSelfOf<FScriptMap>(Apis, Info);
    int32 Index = Apis->get_value_int32(Env, Apis->get_arg(Info, 0));
    Apis->add_return(Info, Apis->create_boolean(Env, Self->IsValidIndex(Index)));
}

void FScriptMapWrapper::GetKey(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    PAPI_CONTAINER_CHECK_ARGS_LEN(1);

    pesapi_env Env = Apis->get_env(Info);
    auto Self = ContainerSelfOf<FScriptMap>(Apis, Info);
    int32 Index = Apis->get_value_int32(Env, Apis->get_arg(Info, 0));
    if (Self->IsValidIndex(Index) == false)
    {
        Apis->throw_by_string(Info, "the argument is an invalid index");
    }
    else
    {
        auto KeyPropertyTranslator = ContainerInnerOf(Apis, Info);
        auto KeyProperty = KeyPropertyTranslator->Property;
        auto ValuePropertyTranslator = ContainerMapValueOf(Info);
        auto ValueProperty = ValuePropertyTranslator->Property;
        if (!KeyPropertyTranslator->IsPropertyValid() || !ValuePropertyTranslator->IsPropertyValid())
        {
            Apis->throw_by_string(Info, "key/value info is invalid!");
            return;
        }

        auto ScriptLayout = GetScriptLayout(KeyProperty, ValueProperty);
        uint8* Data = reinterpret_cast<uint8*>(Self->GetData(Index, ScriptLayout));
        void* KeyPtr = Data + GetKeyOffset(ScriptLayout);
        Apis->add_return(Info, KeyPropertyTranslator->UEToJs(Apis, Env, KeyPtr, false));
    }
}

void FScriptMapWrapper::Empty(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    auto Self = ContainerSelfOf<FScriptMap>(Apis, Info);
    auto KeyPropertyTranslator = ContainerInnerOf(Apis, Info);
    auto KeyProperty = KeyPropertyTranslator->Property;
    auto ValuePropertyTranslator = ContainerMapValueOf(Info);
    auto ValueProperty = ValuePropertyTranslator->Property;
    if (!KeyPropertyTranslator->IsPropertyValid() || !ValuePropertyTranslator->IsPropertyValid())
    {
        Apis->throw_by_string(Info, "key/value info is invalid!");
        return;
    }

    FScriptMapEx::Empty(Self, KeyProperty, ValueProperty);
}

FScriptMapLayout FScriptMapWrapper::GetScriptLayout(const PropertyMacro* KeyProperty, const PropertyMacro* ValueProperty)
{
    return FScriptMap::GetScriptLayout(
        KeyProperty->GetSize(), KeyProperty->GetMinAlignment(), ValueProperty->GetSize(), ValueProperty->GetMinAlignment());
}

//---------------------------------------Fix Size Array-----------------------------------------------
v8::Local<v8::FunctionTemplate> FFixSizeArrayWrapper::ToFunctionTemplate(v8::Isolate* Isolate)
{
    static const JSFunctionInfo Methods[] = {{"Num", &Num}, {"Get", &Get}, {"GetRef", &GetRef}, {"Set", &Set}};
    return ContainerTemplate(Isolate, New, 4, Methods, UE_ARRAY_COUNT(Methods));    // 0 Ptr, 1 Property
}

void FFixSizeArrayWrapper::Num(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    auto Inner = ContainerInnerOf(Apis, Info);
    if (!Inner->IsPropertyValid())
    {
        Apis->throw_by_string(Info, "item info is invalid!");
        return;
    }
    Apis->add_return(Info, Apis->create_int32(Apis->get_env(Info), Inner->Property->ArrayDim));
}

// the index must be an int32, otherwise it is treated as invalid
static FORCEINLINE int32 FixSizeArrayIndexOf(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_callback_info Info)
{
    pesapi_value IndexValue = Apis->get_arg(Info, 0);
    return Apis->is_int32(Env, IndexValue) ? Apis->get_value_int32(Env, IndexValue) : -1;
}

void FFixSizeArrayWrapper::InternalGet(struct pesapi_ffi* Apis, pesapi_callback_info Info, bool PassByPointer)
{
    pesapi_env Env = Apis->get_env(Info);
    auto Self = ContainerSelfOf<uint8>(Apis, Info);
    auto Inner = ContainerInnerOf(Apis, Info);
    if (!Inner->IsPropertyValid())
    {
        Apis->throw_by_string(Info, "item info is invalid!");
        return;
    }
    auto Property = Inner->Property;

    int32 Index = FixSizeArrayIndexOf(Apis, Env, Info);
    if (Index < 0 || Index >= Property->ArrayDim)
    {
        Apis->throw_by_string(Info, "invalid index");
        return;
    }

#if ENGINE_MINOR_VERSION >= 5 && ENGINE_MAJOR_VERSION >= 5
    auto Ptr = Self + Property->GetElementSize() * Index;
#else
    auto Ptr = Self + Property->ElementSize * Index;
#endif

    auto Ret = Inner->UEToJs(Apis, Env, Ptr, PassByPointer);
    if (Inner->NeedLinkOuter && PassByPointer)
    {
        ContainerLinkOuter(Env, Info, Ret);
    }
    Apis->add_return(Info, Ret);
}

void FFixSizeArrayWrapper::Get(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    InternalGet(Apis, Info, false);
}

void FFixSizeArrayWrapper::GetRef(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    InternalGet(Apis, Info, true);
}

void FFixSizeArrayWrapper::Set(struct pesapi_ffi* Apis, pesapi_callback_info Info)
{
    pesapi_env Env = Apis->get_env(Info);
    auto Self = ContainerSelfOf<uint8>(Apis, Info);
    auto Inner = ContainerInnerOf(Apis, Info);
    if (!Inner->IsPropertyValid())
    {
        Apis->throw_by_string(Info, "item info is invalid!");
        return;
    }
    auto Property = Inner->Property;

    int32 Index = FixSizeArrayIndexOf(Apis, Env, Info);
    if (Index < 0 || Index >= Property->ArrayDim)
    {
        Apis->throw_by_string(Info, "invalid index");
        return;
    }

#if ENGINE_MINOR_VERSION >= 5 && ENGINE_MAJOR_VERSION >= 5
    auto Ptr = Self + Property->GetElementSize() * Index;
#else
    auto Ptr = Self + Property->ElementSize * Index;
#endif

    Inner->JsToUE(Apis, Env, Apis->get_arg(Info, 1), Ptr, true);
}

#undef PAPI_CONTAINER_CHECK_ARGS_LEN
}    // namespace PUERTS_NAMESPACE

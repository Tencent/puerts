/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

// the UE type converters of the v8_impl binding (V8Backend.hpp), included by UEDataBinding.hpp when PUERTS_BINDING_IS_PESAPI is
// 0, V8 code of the plugin can include it directly
#include "UEDataBinding.hpp"
#include "V8Backend.hpp"
#include "DataTransfer.h"
#include "V8Utils.h"

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
        // a released / pending kill UObject (or a non-UObject wrapper) is returned as nullptr
        UObject* Ret = DataTransfer::GetUObjectOfWrapper(value.As<v8::Object>());
        return V8_LIKELY(Ret != RELEASED_UOBJECT) ? static_cast<T*>(Ret) : nullptr;
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
        // pending kill objects are still accessible through UObjectBase (the same as before)
        UObject* Ret = DataTransfer::GetUObjectOfWrapper(value.As<v8::Object>(), true);
        return V8_LIKELY(Ret != RELEASED_UOBJECT) ? static_cast<T*>(static_cast<UObjectBase*>(Ret)) : nullptr;
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return DataTransfer::IsInstanceOf(context->GetIsolate(), UObject::StaticClass(), value.As<v8::Object>());
    }
};

}    // namespace v8_impl

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
}    // namespace PUERTS_NAMESPACE

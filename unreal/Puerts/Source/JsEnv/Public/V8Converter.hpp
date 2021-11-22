/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#include <type_traits>
#include <string>
#include <functional>
#include "DataTransfer.h"
#include "JSClassRegister.h"

#define __DefObjectType(CLS) \
    namespace puerts { template<> struct is_objecttype<CLS> : public std::true_type {}; }

#define __DefCDataPointerConverter(CLS)                                                                          \
namespace puerts {                                                                                               \
namespace converter {                                                                                            \
    template <>                                                                                                  \
    struct Converter<CLS*> {                                                                                     \
        static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, CLS * value)                        \
        {                                                                                                        \
            return ::puerts::DataTransfer::FindOrAddCData(context->GetIsolate(), context, puerts::ScriptTypeName<CLS>::value, value, true);    \
        }                                                                                                        \
        static CLS * toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)                    \
        {                                                                                                        \
            return ::puerts::DataTransfer::GetPointerFast<CLS>(value.As<v8::Object>());                         \
        }                                                                                                        \
        static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)                    \
        {                                                                                                        \
            return ::puerts::DataTransfer::IsInstanceOf(context->GetIsolate(), puerts::ScriptTypeName<CLS>::value, value.As<v8::Object>());    \
        }                                                                                                        \
    };                                                                                                           \
}                                                                                                                \
}

namespace puerts
{
    typedef const v8::FunctionCallbackInfo<v8::Value>& CallbackInfoType;
    typedef v8::Local<v8::Context> ContextType;
    typedef v8::Local<v8::Value> ValueType;
    typedef v8::FunctionCallback FunctionCallbackType;
    typedef InitializeFunc InitializeFuncType;
    typedef JSFunctionInfo GeneralFunctionInfo;
    typedef JSPropertyInfo GeneralPropertyInfo;
    typedef NamedFunctionInfo GeneralFunctionReflectionInfo;
    typedef NamedPropertyInfo GeneralPropertyReflectionInfo;

    V8_INLINE int GetArgsLen(const v8::FunctionCallbackInfo<v8::Value>& info)
    {
        return info.Length();
    }

    V8_INLINE v8::Local<v8::Value> GetArg(const v8::FunctionCallbackInfo<v8::Value>& info, int index)
    {
        return info[index];
    }

    V8_INLINE v8::Local<v8::Context> GetContext(const v8::FunctionCallbackInfo<v8::Value>& info)
    {
        return info.GetIsolate()->GetCurrentContext();
    }
    V8_INLINE v8::Local<v8::Object> GetThis(const v8::FunctionCallbackInfo<v8::Value>& info)
    {
        return info.This();
    }
    
    V8_INLINE v8::Local<v8::Object> GetHolder(const v8::FunctionCallbackInfo<v8::Value>& info)
    {
        return info.Holder();
    }

    V8_INLINE void ThrowException(v8::Local<v8::Context> context, const char* msg)
    {
        v8::Isolate* isolate = context->GetIsolate();
        isolate->ThrowException(v8::Exception::Error(v8::String::NewFromUtf8(isolate,
            msg, v8::NewStringType::kNormal).ToLocalChecked()));
    }

    V8_INLINE void SetReturn(const v8::FunctionCallbackInfo<v8::Value>& info, v8::Local<v8::Value> value)
    {
        info.GetReturnValue().Set(value);
    }

    V8_INLINE void UpdateRefValue(v8::Local<v8::Context> context, v8::Local<v8::Value> holder, v8::Local<v8::Value> value)
    {
        if (holder->IsObject())
        {
            auto outer = holder->ToObject(context).ToLocalChecked();
            auto _unused = outer->Set(context,
                v8::String::NewFromUtf8(context->GetIsolate(), "value").ToLocalChecked(),
                value);
        }
    }

    template<typename T>
    V8_INLINE T * FastGetNativeObjectPointer(v8::Local<v8::Context> context, v8::Local<v8::Object> Object)
    {
        return DataTransfer::GetPointerFast<T>(Object);
    }
    
}

namespace puerts
{
namespace converter
{

template <typename T, typename Enable = void>
struct Converter;

template <typename T>
struct Converter<T, typename std::enable_if<std::is_integral<T>::value && sizeof(T) == 8 && std::is_signed<T>::value>::type> {
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, T value)
    {
        return v8::BigInt::New(context->GetIsolate(), value);
    }

    static T toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return static_cast<T>(value->ToBigInt(context).ToLocalChecked()->Int64Value());
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsBigInt();
    }
};

template <typename T>
struct Converter<T, typename std::enable_if<std::is_integral<T>::value && sizeof(T) == 8 && !std::is_signed<T>::value>::type> {
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, T value)
    {
        return v8::BigInt::NewFromUnsigned(context->GetIsolate(), value);
    }

    static T toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return static_cast<T>(value->ToBigInt(context).ToLocalChecked()->Uint64Value());
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsBigInt();
    }
};

template <typename T>
struct Converter<T, typename std::enable_if<std::is_integral<T>::value && sizeof(T) < 8 && std::is_signed<T>::value>::type> {
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, T value)
    {
        return v8::Integer::New(context->GetIsolate(), value);
    }

    static T toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return static_cast<T>(value->Int32Value(context).ToChecked());
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsInt32();
    }
};

template <typename T>
struct Converter<T, typename std::enable_if<std::is_integral<T>::value && sizeof(T) < 8 && !std::is_signed<T>::value>::type> {
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, T value)
    {
        return v8::Integer::NewFromUnsigned(context->GetIsolate(), value);
    }

    static T toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return static_cast<T>(value->Uint32Value(context).ToChecked());
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsUint32();
    }
};

template <typename T>
struct Converter<T, typename std::enable_if<std::is_enum<T>::value>::type> {
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, T value)
    {
        return v8::Integer::New(context->GetIsolate(), static_cast<int>(value));
    }

    static T toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return static_cast<T>(value->Int32Value(context).ToChecked());
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsInt32();
    }
};

template <typename T>
struct Converter<T, typename std::enable_if<std::is_floating_point<T>::value>::type> {
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, T value)
    {
        return v8::Number::New(context->GetIsolate(), value);
    }

    static T toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return static_cast<T>(value->NumberValue(context).ToChecked());
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsNumber();
    }
};

template <>
struct Converter<std::string> {
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, std::string value)
    {
        return v8::String::NewFromUtf8(context->GetIsolate(), value.c_str(), v8::NewStringType::kNormal).ToLocalChecked();
    }

    static std::string toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return *v8::String::Utf8Value(context->GetIsolate(), value);
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsString();
    }
};

template <>
struct Converter<const char*> {
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, const char* value)
    {
        return v8::String::NewFromUtf8(context->GetIsolate(), value, v8::NewStringType::kNormal).ToLocalChecked();
    }

    static const char* toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return nullptr;
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsString();
    }
};

template <>
struct Converter<bool> {
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, bool value)
    {
        return v8::Boolean::New(context->GetIsolate(), value);
    }

    static bool toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->BooleanValue(context->GetIsolate());
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsBoolean();
    }
};

template <typename T>
struct Converter<std::reference_wrapper<T>> {
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, const T& value)
    {
        auto result = v8::Object::New(context->GetIsolate());
        auto _unused = result->Set(context, Converter<const char*>::toScript(context, "value")
            , Converter<T>::toScript(context, value));
        return result;
    }

    static T toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        if (value->IsObject())
        {
            auto outer = value->ToObject(context).ToLocalChecked();
            auto realvalue = outer->Get(context, Converter<const char*>::toScript(context, "value")).ToLocalChecked();
            return Converter<T>::toCpp(context, realvalue);
        }
        else
        {
            return {};
        }
    }

    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return value->IsObject(); // do not checked inner
    }
};

template <class T>                                                                                                         
struct Converter<T, typename std::enable_if<std::is_copy_constructible<T>::value && std::is_constructible<T>::value
                        && is_objecttype<T>::value && !is_uetype<T>::value>::type> {
    static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, T value)
    {
        return DataTransfer::FindOrAddCData(context->GetIsolate(), context, ScriptTypeName<T>::value, new T(value), false);
    }
    static T toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        T* ptr = DataTransfer::GetPointerFast<T>(value.As<v8::Object>());
        return ptr ? *ptr : T{};
    }
    static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
    {
        return DataTransfer::IsInstanceOf(context->GetIsolate(), ScriptTypeName<T>::value, value.As<v8::Object>());
    }
};
    
}
}


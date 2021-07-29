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

#define __DefCDataPointerConverter(CLS)                                                                          \
namespace puerts {                                                                                               \
namespace converter {                                                                                            \
    template <>                                                                                                  \
    struct Converter<CLS*> {                                                                                     \
        static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, CLS * value)                        \
        {                                                                                                        \
            return ::puerts::DataTransfer::FindOrAddCData(context->GetIsolate(), context, #CLS, value, true);    \
        }                                                                                                        \
        static CLS * toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)                    \
        {                                                                                                        \
            return ::puerts::DataTransfer::GetPoninterFast<CLS>(value.As<v8::Object>());                         \
        }                                                                                                        \
        static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)                    \
        {                                                                                                        \
            return ::puerts::DataTransfer::IsInstanceOf(context->GetIsolate(), #CLS, value.As<v8::Object>());    \
        }                                                                                                        \
    };                                                                                                           \
}                                                                                                                \
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
        return *v8::String::Utf8Value(context->GetIsolate(), value);
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
    
}
}

namespace puerts {
namespace internal {

// like std::decay,
// except decay ScriptClass& to std::reference_wrapper<ScriptClass>
template <typename T, typename = void>
struct ConverterDecay {
    using type = typename  std::decay<T>::type;
};

template <typename T>
struct ConverterDecay<T, typename std::enable_if<std::is_lvalue_reference<T>::value && !std::is_const<typename  std::remove_reference<T>::type>::value>::type> {
    using type = std::reference_wrapper<typename std::decay<T>::type>;
};

template <typename T>
using TypeConverter = puerts::converter::Converter<typename ConverterDecay<T>::type>;

template <typename T, typename = void>
struct IsConvertibleHelper : std::false_type {};

template< class... >
using Void_t = void;

template <typename T>
struct IsConvertibleHelper<T,
                        // test if it has a function toScript
                        Void_t<decltype(&TypeConverter<T>::toScript)>> : std::true_type {};

} 

namespace converter {

template <typename T>
constexpr bool isConvertible = internal::IsConvertibleHelper<T>::value;

}
}

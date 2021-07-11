/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#include <cstdint>
#include <type_traits>
#include <string>
#include <functional>
#include "DataTransfer.h"

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

template <>
struct Converter<int32_t> {
	static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, int32_t value) { return v8::Integer::New(context->GetIsolate(), value); }

	static int32_t toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value) { return value->Int32Value(context).ToChecked(); }

	static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value) { return value->IsInt32();}
};

template <>
struct Converter<std::string> {
	static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, std::string value) { return v8::String::NewFromUtf8(context->GetIsolate(), value.c_str(), v8::NewStringType::kNormal).ToLocalChecked(); }

	static std::string toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value) { return *v8::String::Utf8Value(context->GetIsolate(), value); }

	static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value) { return value->IsString();}
};
	
}
}

namespace puerts {
namespace internal {

// like std::decay,
// except decay ScriptClass& to std::reference_wrapper<ScriptClass>
template <typename T, typename = void>
struct ConverterDecay {
	using type = std::decay_t<T>;
};

template <typename T>
struct ConverterDecay<T, std::enable_if_t<std::is_lvalue_reference_v<T>>> {
	using type = std::reference_wrapper<std::decay_t<T>>;
};

template <typename T>
using TypeConverter = puerts::converter::Converter<typename ConverterDecay<T>::type>;

template <typename T, typename = void>
struct IsConvertibleHelper : std::false_type {};

template <typename T>
struct IsConvertibleHelper<T,
						// test if it has a function toScript
						std::void_t<decltype(&TypeConverter<T>::toScript)>> : std::true_type {};

} 

namespace converter {

template <typename T>
constexpr bool isConvertible = internal::IsConvertibleHelper<T>::value;

}
}

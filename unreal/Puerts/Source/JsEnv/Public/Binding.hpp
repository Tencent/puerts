/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#include <sstream>
#include <tuple>
#include <type_traits>
#include <string>
#include <functional>
#include "JSClassRegister.h"
#include "DataTransfer.h"
#include "Converter.hpp"

#define MakeConstructor(T, ...) &(::puerts::ConstructorWrapper<T, ##__VA_ARGS__>::call)
#define MakeGetter(M) &(::puerts::PropertyWrapper<decltype(M), M>::getter)
#define MakeSetter(M) &(::puerts::PropertyWrapper<decltype(M), M>::setter)
#define MakeFunction(M) &(::puerts::FuncCallWrapper<decltype(M), M>::call)
#define MakeCheckFunction(M) &(::puerts::CheckedFuncCallWrapper<decltype(M), M>::call)
#define MakeOverload(SIGNATURE, M) &(::puerts::CheckedFuncCallWrapper<decltype(static_cast<SIGNATURE>(M)), static_cast<SIGNATURE>(M)>::callWithRet)
#define CombineFunctions(...) &(::puerts::OverloadsRecursion<##__VA_ARGS__>::call)

#define __DefScriptTTypeName(CLSNAME, CLS)                  \
    template<>                                              \
    const char *::puerts::ScriptTypeName<CLS>::value()      \
    {                                                       \
        return #CLSNAME;                                    \
    }

#define PuertsUsing(CLS) \
    __DefScriptTTypeName(CLS, CLS) \
    __DefCDataPointerConverter(CLS)


namespace puerts
{
using CheckArgsFunctionCallback = std::function<bool(const v8::FunctionCallbackInfo<v8::Value>& info)>;

namespace internal
{
namespace traits {

template <typename Args>
struct TupleTrait;

template <typename HeadT, typename... TailT>
struct TupleTrait<std::tuple<HeadT, TailT...>> {
	using Head = HeadT;
	using Tail = std::tuple<TailT...>;

	static constexpr size_t count = 1 + sizeof...(TailT);

	template <size_t i>
	using Arg = typename std::tuple_element_t<i, std::tuple<HeadT, TailT...>>;
};

template <>
struct TupleTrait<std::tuple<>> {
	using Tail = std::tuple<>;
	static constexpr size_t count = 0;
};

template <typename Func, typename Enable = void>
struct FunctionTrait;

template <typename Ret, typename... Args>
struct FunctionTrait<Ret (*)(Args...)> {
	using ReturnType = Ret;
	using Arguments = std::tuple<Args...>;
};

template <typename C, typename Ret, typename... Args>
struct FunctionTrait<Ret (C::*)(Args...)> : FunctionTrait<Ret (*)(C*, Args...)> {};

template <typename C, typename Ret, typename... Args>
struct FunctionTrait<Ret (C::*)(Args...) const> : FunctionTrait<Ret (*)(C*, Args...)> {};

template <typename C, typename Ret, typename... Args>
struct FunctionTrait<Ret (C::*)(Args...) volatile> : FunctionTrait<Ret (*)(C*, Args...)> {};

template <typename C, typename Ret, typename... Args>
struct FunctionTrait<Ret (C::*)(Args...) const volatile> : FunctionTrait<Ret (*)(C*, Args...)> {};

// functor and lambda
template <typename Functor>
struct FunctionTrait<Functor, std::void_t<decltype(&Functor::operator())>> {
private:
	using FunctorTrait = FunctionTrait<decltype(&Functor::operator())>;

public:
	using ReturnType = typename FunctorTrait::ReturnType;
	using Arguments = typename TupleTrait<typename FunctorTrait::Arguments>::Tail;
};

// decay: remove const, reference; function type to function pointer
template <typename Func>
struct FunctionTrait<Func, std::enable_if_t<!std::is_same_v<Func, std::decay_t<Func>>>>
	: FunctionTrait<std::decay_t<Func>> {};
}  // namespace traits

template <typename T>
using FuncTrait = traits::FunctionTrait<T>;
	
struct StaticDefine {
	struct FunctionDefine {
		std::string name;
		CheckArgsFunctionCallback callback;
		std::string traceName = name;
		v8::FunctionCallback rawCallback;

		FunctionDefine(std::string name, CheckArgsFunctionCallback callback, std::string traceName, v8::FunctionCallback rawCallback)
			: name(std::move(name)), callback(std::move(callback)), traceName(std::move(traceName)), rawCallback(rawCallback) {}
	};
};

template <typename T, typename = void>
struct IsArgsConvertibleHelper : std::false_type {};

template <typename... Args>
struct IsArgsConvertibleHelper<
	std::tuple<Args...>, std::enable_if_t<std::conjunction_v<IsConvertibleHelper<Args>...>, void>>
	: std::true_type {};

template <typename T>
constexpr bool isArgsConvertible = IsArgsConvertibleHelper<T>::value;


template<int Pos, typename ArgType, typename... Rest>
struct ArgumentChecker
{
	static constexpr int NextPos = Pos + 1;
    
	static bool Check(const v8::FunctionCallbackInfo<v8::Value>& Info, v8::Local<v8::Context> Context)
	{
		if (!TypeConverter<typename ConverterDecay<ArgType>::type>::accept(Context, Info[Pos]))
		{
			return false;
		}
		else
		{
			return ArgumentChecker<NextPos, Rest...>::Check(Info, Context);
		}
	}
};

template<int Pos, typename ArgType>
struct ArgumentChecker<Pos, ArgType>
{
	static bool Check(const v8::FunctionCallbackInfo<v8::Value>& Info, v8::Local<v8::Context> Context)
	{
		return TypeConverter<typename ConverterDecay<ArgType>::type>::accept(Context, Info[Pos]);
	}
};

template <typename, bool CheckArguments>
struct FuncCallHelper {};

template <typename Ret, typename... Args, bool CheckArguments>
struct FuncCallHelper<std::pair<Ret, std::tuple<Args...>>, CheckArguments> {
private:
    static constexpr auto ArgsLength = sizeof...(Args);

    template <typename Func, size_t... index>
    static bool call(Func& func, const v8::FunctionCallbackInfo<v8::Value>& info, std::index_sequence<index...>)
    {
        auto context = info.GetIsolate()->GetCurrentContext();

    	if constexpr (CheckArguments)
    	{
    		if (info.Length() != ArgsLength) return false;

    		//bool paramAccpet[ArgsLength] = {TypeConverter<typename ConverterDecay<Args>::type>::accept(context, info[index])...};
    		if constexpr (ArgsLength > 0)
    		{
    			if (!ArgumentChecker<0, Args...>::Check(info, context)) return false;
    		}
    	}
        
        if constexpr (std::is_same_v<Ret, void>)
        {
        	func(TypeConverter<typename ConverterDecay<Args>::type>::toCpp(context, info[index])...);
        }
        else
        {
        	auto ret = func(TypeConverter<typename ConverterDecay<Args>::type>::toCpp(context, info[index])...);
        	info.GetReturnValue().Set(TypeConverter<Ret>::toScript(context, std::forward<Ret>(ret)));
        }
        return true;
    }

	template <typename Ins, typename Func, size_t... index>
	static bool callMethod(Func& func, const v8::FunctionCallbackInfo<v8::Value>& info, std::index_sequence<index...>)
    {
    	auto context = info.GetIsolate()->GetCurrentContext();

    	auto self = DataTransfer::GetPoninterFast<Ins>(info.Holder());

    	if constexpr (CheckArguments)
    	{
    		if (info.Length() != ArgsLength) return false;

    		if constexpr (ArgsLength > 0)
    		{
    			if (!ArgumentChecker<0, Args...>::Check(info, context)) return false;
    		}
    	}
        
    	if constexpr (std::is_same_v<Ret, void>)
    	{
    		(self->*func)(TypeConverter<typename ConverterDecay<Args>::type>::toCpp(context, info[index])...);
    	}
    	else
    	{
    		auto ret = (self->*func)(TypeConverter<typename ConverterDecay<Args>::type>::toCpp(context, info[index])...);
    		info.GetReturnValue().Set(TypeConverter<Ret>::toScript(context, std::forward<Ret>(ret)));
    	}
    	return true;
    }

 public:
	template <typename Func>
	static bool call(Func&& func, const v8::FunctionCallbackInfo<v8::Value>& info)
    {
    	return call(func, info, std::make_index_sequence<ArgsLength>());
    }
    
	template <typename Ins, typename Func>
	static bool callMethod(Func&& func, const v8::FunctionCallbackInfo<v8::Value>& info)
	{
		return callMethod<Ins>(func, info, std::make_index_sequence<ArgsLength>());
	}
};

}


template<typename T, T>
struct FuncCallWrapper;
	
template<typename Ret, typename... Args, Ret (*func)(Args...)>
struct FuncCallWrapper<Ret (*)(Args...), func> 
{
	static void call(const v8::FunctionCallbackInfo<v8::Value>& info)
	{
		using Helper = internal::FuncCallHelper<
			std::pair<Ret, std::tuple<Args...>>, false>;
		Helper::call(func, info);
	}
};

template<typename Inc, typename Ret, typename... Args, Ret (Inc::*func)(Args...)>
struct FuncCallWrapper<Ret (Inc::*)(Args...), func> 
{
	static void call(const v8::FunctionCallbackInfo<v8::Value>& info)
	{
		using Helper = internal::FuncCallHelper<
			std::pair<Ret, std::tuple<Args...>>, false>;
		Helper::callMethod<Inc>(func, info);
	}
};

template<typename Func, Func>
struct CheckedFuncCallWrapper;

template<typename Ret, typename... Args, Ret (*func)(Args...)>
struct CheckedFuncCallWrapper<Ret (*)(Args...), func> 
{
	static bool callWithRet(const v8::FunctionCallbackInfo<v8::Value>& info)
	{
		using Helper = internal::FuncCallHelper<
			std::pair<Ret, std::tuple<Args...>>, true>;
		return Helper::call(func, info);
	}
	static void call(const v8::FunctionCallbackInfo<v8::Value>& info)
	{
		using Helper = internal::FuncCallHelper<
			std::pair<Ret, std::tuple<Args...>>, true>;
		if(!Helper::call(func, info))
		{
			v8::Isolate* isolate = info.GetIsolate();
			isolate->ThrowException(v8::Exception::Error(v8::String::NewFromUtf8(isolate,
				"invalid parameter!", v8::NewStringType::kNormal).ToLocalChecked()));
		}
	}
};

template<typename Inc, typename Ret, typename... Args, Ret (Inc::*func)(Args...)>
struct CheckedFuncCallWrapper<Ret (Inc::*)(Args...), func> 
{
	static bool callWithRet(const v8::FunctionCallbackInfo<v8::Value>& info)
	{
		using Helper = internal::FuncCallHelper<
			std::pair<Ret, std::tuple<Args...>>, true>;
		return Helper::callMethod<Inc, decltype(func)>(func, info);
	}
	static void call(const v8::FunctionCallbackInfo<v8::Value>& info)
	{
		using Helper = internal::FuncCallHelper<
			std::pair<Ret, std::tuple<Args...>>, true>;
		if(!Helper::callMethod<Inc, decltype(func)>(func, info))
		{
			v8::Isolate* isolate = info.GetIsolate();
			isolate->ThrowException(v8::Exception::Error(v8::String::NewFromUtf8(isolate,
				"invalid parameter!", v8::NewStringType::kNormal).ToLocalChecked()));
		}
	}
};

template<typename T, typename... Args>
struct ConstructorWrapper
{
private:
	static constexpr auto ArgsLength = sizeof...(Args);

	template <size_t... index>
	static void *call(const v8::FunctionCallbackInfo<v8::Value>& info, std::index_sequence<index...>)
	{
		auto context = info.GetIsolate()->GetCurrentContext();

		if (info.Length() != ArgsLength) return nullptr;

		if constexpr (ArgsLength > 0)
		{
			if (!internal::ArgumentChecker<0, Args...>::Check(info, context)) return nullptr;
		}

		return new T(internal::TypeConverter<typename internal::ConverterDecay<Args>::type>::toCpp(context, info[index])...);
	}

public:
	static void *call(const v8::FunctionCallbackInfo<v8::Value>& info)
	{
		return call(info, std::make_index_sequence<ArgsLength>());
	}
};

typedef bool (*V8FunctionCallbackWithBoolRet)(const v8::FunctionCallbackInfo<v8::Value>& info);

template<V8FunctionCallbackWithBoolRet Func, V8FunctionCallbackWithBoolRet... Rest>
struct OverloadsRecursion
{
	static bool _call(const v8::FunctionCallbackInfo<v8::Value>& info)
	{
		if (Func(info)) return true;
		else return OverloadsRecursion<Rest...>::_call(info);
	}
	
	static void call(const v8::FunctionCallbackInfo<v8::Value>& info)
	{
		if(!_call(info))
		{
			v8::Isolate* isolate = info.GetIsolate();
			isolate->ThrowException(v8::Exception::Error(v8::String::NewFromUtf8(isolate,
				"invalid parameter!", v8::NewStringType::kNormal).ToLocalChecked()));
		}
	}
};

template<V8FunctionCallbackWithBoolRet Func>
struct OverloadsRecursion<Func>
{
	static bool _call(const v8::FunctionCallbackInfo<v8::Value>& info)
	{
		return Func(info);
	}
};

template<InitializeFunc Func, InitializeFunc... Rest>
struct ConstructorRecursion
{
	static void * _call(const v8::FunctionCallbackInfo<v8::Value>& info)
	{
		auto Ret = Func(info);
		if (Ret) return Ret;
		else return ConstructorRecursion<Rest...>::_call(info);
	}

	static void * call(const v8::FunctionCallbackInfo<v8::Value>& info)
	{
		auto Ret = _call(info);
		if (!Ret)
		{
			v8::Isolate* isolate = info.GetIsolate();
			isolate->ThrowException(v8::Exception::Error(v8::String::NewFromUtf8(isolate,
				"invalid parameter!", v8::NewStringType::kNormal).ToLocalChecked()));
		}
		return Ret;
	}
};

template<InitializeFunc Func>
struct ConstructorRecursion<Func>
{
	static void * _call(const v8::FunctionCallbackInfo<v8::Value>& info)
	{
		return Func(info);
	}
};

template<typename T, T>
struct PropertyWrapper;

template<class Ins, class Ret, Ret Ins::*member>
struct PropertyWrapper<Ret Ins::*, member>
{
	static void getter(v8::Local<v8::Name> property, const v8::PropertyCallbackInfo<v8::Value>& info)
	{
		auto context = info.GetIsolate()->GetCurrentContext();
		auto self = DataTransfer::GetPoninterFast<Ins>(info.This());
		info.GetReturnValue().Set(internal::TypeConverter<Ret>::toScript(context, self->*member));
	}

	static void setter(v8::Local<v8::Name> property, v8::Local<v8::Value> value, const v8::PropertyCallbackInfo<void>& info)
	{
		auto context = info.GetIsolate()->GetCurrentContext();
		auto self = DataTransfer::GetPoninterFast<Ins>(info.This());
		self->*member = internal::TypeConverter<typename internal::ConverterDecay<Ret>::type>::toCpp(context, value);
	}
};

template<typename T>
struct ScriptTypeName {
	static const char *value();
};

template<typename T>
struct ScriptTypeName<const T *> {
	static const char *value()
	{
		return ScriptTypeName<T>::value();
	}
};

template<typename T>
struct ScriptTypeName<T *> {
	static const char *value()
	{
		return ScriptTypeName<T>::value();
	}
};

template <typename T>
class ClassDefineBuilder
{
	template <typename...>
    using sfina = ClassDefineBuilder<T>&;
	
	const char *className_ = nullptr;

	const char *superClassName_ = nullptr;

	std::vector<JSFunctionInfo> functions_{};

	std::vector<JSFunctionInfo> methods_{};

	std::vector<JSPropertyInfo> properties_{}; 

	InitializeFunc constructor_{};

public:
	explicit ClassDefineBuilder(const char * className)
		: className_(className) {}

	template <typename S>
	ClassDefineBuilder<T>& Extends() {
		superClassName_ = ScriptTypeName<S>::value();
		return *this;
	}

	template<typename... Args>
	std::enable_if_t<internal::isArgsConvertible<std::tuple<Args...>>, ClassDefineBuilder<T>&>
	Constructor() {
		constructor_ = ConstructorWrapper<T, Args...>::call;
		return *this;
	}

	template<InitializeFunc... Args>
	ClassDefineBuilder<T>& Constructors() {
		constructor_ = ConstructorRecursion<Args...>::call;
		return *this;
	}

	ClassDefineBuilder<T>& Function(const char* name, v8::FunctionCallback func) {
		functions_.push_back(JSFunctionInfo {name, func, nullptr});
		return *this;
	}

	ClassDefineBuilder<T>& Method(const char* name, v8::FunctionCallback func) {
		methods_.push_back(JSFunctionInfo {name, func, nullptr});
		return *this;
	}

	ClassDefineBuilder<T>& Property(const char* name, v8::AccessorNameGetterCallback getter, v8::AccessorNameSetterCallback setter = nullptr) {
		properties_.push_back(JSPropertyInfo {name, getter, setter, nullptr});
		return *this;
	}

	void Register()
	{
		static std::vector<JSFunctionInfo> s_functions_{};
		static std::vector<JSFunctionInfo> s_methods_{};
		static std::vector<JSPropertyInfo> s_properties_{}; 
		
		puerts::JSClassDefinition ClassDef = JSClassEmptyDefinition;
		ClassDef.CDataName = className_;
		ClassDef.CDataSuperName = superClassName_;

		ClassDef.Initialize = constructor_;
		ClassDef.Finalize = [](void *Ptr)
		{
			delete static_cast<T*>(Ptr);
		};

		s_functions_ = std::move(functions_);
		s_functions_.push_back({nullptr, nullptr, nullptr});
		ClassDef.Functions = s_functions_.data();

		s_methods_ = std::move(methods_);
		s_methods_.push_back({nullptr, nullptr, nullptr});
		ClassDef.Methods = s_methods_.data();

		s_properties_ = std::move(properties_);
		s_properties_.push_back(JSPropertyInfo {nullptr, nullptr, nullptr, nullptr});
		ClassDef.Propertys = s_properties_.data();

		puerts::RegisterClass(ClassDef);
	}
};

template <typename T>
inline ClassDefineBuilder<T> DefineClass() {
	return ClassDefineBuilder<T>(ScriptTypeName<T>::value());
}

}

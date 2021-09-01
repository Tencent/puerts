/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#include "Binding.hpp"

namespace puerts
{
class Object
{
public:
    Object(v8::Local<v8::Context> context, v8::Local<v8::Object> object)
    {
    	Isolate = context->GetIsolate();
    	GContext.Reset(Isolate, context);
    	GObject.Reset(Isolate, object);
    }

	Object(const Object & InOther)
    {
    	Isolate = InOther.Isolate;
    	GContext.Reset(Isolate, InOther.GContext.Get(Isolate));
    	GObject.Reset(Isolate, InOther.GObject.Get(Isolate));
    }

	Object & operator =(const Object & InOther)
    {
    	Isolate = InOther.Isolate;
    	GContext.Reset(Isolate, InOther.GContext.Get(Isolate));
    	GObject.Reset(Isolate, InOther.GObject.Get(Isolate));
    	return *this;
    }

	template<typename T>
	T Get(const char* key) const
    {
    	v8::Isolate::Scope IsolateScope(Isolate);
    	v8::HandleScope HandleScope(Isolate);
    	auto Context = GContext.Get(Isolate);
    	v8::Context::Scope ContextScope(Context);
    	auto Object = GObject.Get(Isolate);
        
    	auto MaybeValue = Object->Get(Context, puerts::converter::Converter<const char*>::toScript(Context, key));
    	v8::Local<v8::Value> Val;
    	if (MaybeValue.ToLocal(&Val))
    	{
    		return puerts::converter::Converter<T>::toCpp(Context, Val);
    	}
    	return {};
    }

	template<typename T>
	void Set(const char* key, T val) const
    {
    	v8::Isolate::Scope IsolateScope(Isolate);
    	v8::HandleScope HandleScope(Isolate);
    	auto Context = GContext.Get(Isolate);
    	v8::Context::Scope ContextScope(Context);
    	auto Object = GObject.Get(Isolate);
        
    	auto _UnUsed = Object->Set(Context, puerts::converter::Converter<const char*>::toScript(Context, key),
			puerts::converter::Converter<T>::toScript(Context, val));
    }

protected:
	v8::Isolate *Isolate;
	v8::Global<v8::Context> GContext;
	v8::Global<v8::Object> GObject;

	friend struct puerts::converter::Converter<Object>;
};

class Function : public Object
{
public:
	Function(v8::Local<v8::Context> context, v8::Local<v8::Object> object): Object(context, object), ExceptionMessage(""), HasCaught(false)
	{
	}
	
	template<typename... Args>
    void Action(Args... cppArgs)
    {
		v8::Isolate::Scope IsolateScope(Isolate);
		v8::HandleScope HandleScope(Isolate);
		auto Context = GContext.Get(Isolate);
		v8::Context::Scope ContextScope(Context);

		auto Object = GObject.Get(Isolate);

		v8::TryCatch TryCatch(Isolate);

		auto _UnUsed = InvokeHelper(Context, Object, cppArgs ... );

		HasCaught = TryCatch.HasCaught();
		if (HasCaught)
		{
			ExceptionMessage = *v8::String::Utf8Value(Isolate, TryCatch.Exception());
		}
    }

	template<typename Ret, typename... Args>
	Ret Func(Args... cppArgs)
	{
		v8::Isolate::Scope IsolateScope(Isolate);
		v8::HandleScope HandleScope(Isolate);
		auto Context = GContext.Get(Isolate);
		v8::Context::Scope ContextScope(Context);

		auto Object = GObject.Get(Isolate);

		v8::TryCatch TryCatch(Isolate);

		auto MaybeRet = InvokeHelper(Context, Object, cppArgs ... );

		HasCaught = TryCatch.HasCaught();
		if (HasCaught)
		{
			ExceptionMessage = *v8::String::Utf8Value(Isolate, TryCatch.Exception());
		}

		if (!MaybeRet.IsEmpty())
		{
			return puerts::converter::Converter<Ret>::toCpp(Context, MaybeRet.ToLocalChecked());
		}
		return {};
	}

	
	std::string ExceptionMessage;

	bool HasCaught;

private:
	template <typename ... Args>
	auto InvokeHelper(v8::Local<v8::Context>& Context, v8::Local<v8::Object>& Object, Args ... CppArgs) const
	{
		v8::Local<v8::Value> Argv[sizeof...(Args)]{puerts::converter::Converter<Args>::toScript(Context, CppArgs)...};
		return Object.As<v8::Function>()->Call(Context, v8::Undefined(Isolate), sizeof...(Args), Argv);;
	};

	auto InvokeHelper(v8::Local<v8::Context>& Context, v8::Local<v8::Object>& Object) const
	{
		return Object.As<v8::Function>()->Call(Context, v8::Undefined(Isolate), 0, nullptr);
	}

	friend struct puerts::converter::Converter<Function>;
};

template<>
struct ScriptTypeName<::puerts::Object> {
    static constexpr const char * value = "object";
};

template<>
struct ScriptTypeName<::puerts::Function> {
    static constexpr const char * value = "Function";
};

namespace converter
{
template <>
struct Converter<::puerts::Object> {
	static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, ::puerts::Object value)
	{
		return value.GObject.Get(context->GetIsolate());
	}

	static ::puerts::Object toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
	{
		return ::puerts::Object(context, value.As<v8::Object>());
	}

	static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
	{
		return value->IsObject();
	}
};

template <>
struct Converter<::puerts::Function> {
	static v8::Local<v8::Value> toScript(v8::Local<v8::Context> context, ::puerts::Function value)
	{
		return value.GObject.Get(context->GetIsolate());
	}

	static ::puerts::Function toCpp(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
	{
		return ::puerts::Function(context, value.As<v8::Object>());
	}

	static bool accept(v8::Local<v8::Context> context, const v8::Local<v8::Value>& value)
	{
		return value->IsFunction();
	}
};
}

}

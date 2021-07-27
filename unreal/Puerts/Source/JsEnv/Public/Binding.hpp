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
#include "BindingTypeInfo.hpp"

#define MakeConstructor(T, ...) ::puerts::template ConstructorWrapper<T, ##__VA_ARGS__>
#define MakeGetter(M) &(::puerts::PropertyWrapper<decltype(M), M>::getter)
#define MakeSetter(M) &(::puerts::PropertyWrapper<decltype(M), M>::setter)
#define MakeProperty(M) &(::puerts::PropertyWrapper<decltype(M), M>::getter), &(::puerts::PropertyWrapper<decltype(M), M>::setter), ::puerts::PropertyWrapper<decltype(M), M>::info()
#define MakeFunction(M) &(::puerts::FuncCallWrapper<decltype(M), M>::call), ::puerts::FuncCallWrapper<decltype(M), M>::info()
#define SelectFunction(SIGNATURE, M) &(::puerts::FuncCallWrapper<SIGNATURE, M>::call), ::puerts::FuncCallWrapper<SIGNATURE, M>::info()
#define MakeCheckFunction(M) &(::puerts::FuncCallWrapper<decltype(M), M>::checkedCall), ::puerts::FuncCallWrapper<decltype(M), M>::info()
#define MakeOverload(SIGNATURE, M) puerts::FuncCallWrapper<SIGNATURE, M>
#define CombineOverloads(...) &::puerts::OverloadsCombiner<__VA_ARGS__>::call, ::puerts::OverloadsCombiner<__VA_ARGS__>::length, ::puerts::OverloadsCombiner<__VA_ARGS__>::infos()
#define CombineConstructors(...) &::puerts::ConstructorsCombiner<__VA_ARGS__>::call, ::puerts::ConstructorsCombiner<__VA_ARGS__>::length, ::puerts::ConstructorsCombiner<__VA_ARGS__>::infos()

#define UsingCppClass(CLS) \
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
    using Arg = typename std::tuple_element<i, std::tuple<HeadT, TailT...>>::type;
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
struct FunctionTrait<Functor, Void_t<decltype(&Functor::operator())>> {
private:
    using FunctorTrait = FunctionTrait<decltype(&Functor::operator())>;

public:
    using ReturnType = typename FunctorTrait::ReturnType;
    using Arguments = typename TupleTrait<typename FunctorTrait::Arguments>::Tail;
};

// decay: remove const, reference; function type to function pointer
template <typename Func>
struct FunctionTrait<Func, typename std::enable_if<!std::is_same<Func, typename std::decay<Func>>::type>::type>
    : FunctionTrait<typename std::decay<Func>::type> {};
}  // namespace traits

template <typename T>
using FuncTrait = traits::FunctionTrait<T>;

template <bool _First_value, class _First, class... _Rest>
struct _Conjunction { // handle false trait or last trait
    using type = _First;
};

template <class _True, class _Next, class... _Rest>
struct _Conjunction<true, _True, _Next, _Rest...> { // the first trait is true, try the next one
    using type = typename _Conjunction<_Next::value, _Next, _Rest...>::type;
};

template <class... _Traits>
struct Conjunction : std::true_type {}; // If _Traits is empty, true_type

template <class _First, class... _Rest>
struct Conjunction<_First, _Rest...> : _Conjunction<_First::value, _First, _Rest...>::type {
    // the first false trait in _Traits, or the last trait if none are false
};

template <typename T, typename = void>
struct IsArgsConvertibleHelper : std::false_type {};

template <typename... Args>
struct IsArgsConvertibleHelper<
    std::tuple<Args...>, typename  std::enable_if<Conjunction<IsConvertibleHelper<Args>...>::value>::type>
    : std::true_type {};

template <typename T>
constexpr bool isArgsConvertible = IsArgsConvertibleHelper<T>::value;

template<int , typename...>
struct ArgumentChecker
{
    static bool Check(const v8::FunctionCallbackInfo<v8::Value>& Info, v8::Local<v8::Context> Context)
    {
        return true;
    }
};

template<int Pos, typename ArgType, typename... Rest>
struct ArgumentChecker<Pos, ArgType, Rest...>
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

template <bool Enable, typename... Args>
struct ArgumentsChecker;

template<typename... Args>
struct ArgumentsChecker<true, Args...>
{
	static constexpr auto ArgsLength = sizeof...(Args);
	
	static bool Check(v8::Local<v8::Context> context, const v8::FunctionCallbackInfo<v8::Value>& info)
	{
		if (info.Length() != ArgsLength) return false;

		if (!ArgumentChecker<0, Args...>::Check(info, context)) return false;

		return true;
	}
};

template<typename... Args>
struct ArgumentsChecker<false, Args...>
{
	static constexpr auto ArgsLength = sizeof...(Args);
	
	static bool Check(v8::Local<v8::Context> context, const v8::FunctionCallbackInfo<v8::Value>& info)
	{
		return true;
	}
};

template <typename, bool CheckArguments>
struct FuncCallHelper {};

template <typename Ret, typename... Args, bool CheckArguments>
struct FuncCallHelper<std::pair<Ret, std::tuple<Args...>>, CheckArguments> {
private:
    static constexpr auto ArgsLength = sizeof...(Args);
    using ArgumentsTupleType = std::tuple<typename std::decay<Args>::type...>;

    template<typename  T, typename Enable = void>
    struct RefValueSync
    {
        static void Sync(v8::Local<v8::Context> context, v8::Local<v8::Value> holder, typename std::decay<T>::type value) {}
    };

    template<typename T>
    struct RefValueSync<T, typename std::enable_if<std::is_lvalue_reference<T>::value && !std::is_const<typename std::remove_reference<T>>::type>::type>
    {
        static void Sync(v8::Local<v8::Context> context, v8::Local<v8::Value> holder, typename std::decay<T>::type value)
        {
            if (holder->IsObject())
            {
                auto outer = holder->ToObject(context).ToLocalChecked();
                auto _unused = outer->Set(context, converter::Converter<const char*>::toScript(context, "value"),
                    converter::Converter<decltype(value)>::toScript(context, value));
            }
        }
    };


    template<int , typename... >
    struct RefValuesSync
    {
        static void Sync(v8::Local<v8::Context> context, const v8::FunctionCallbackInfo<v8::Value>& info, ArgumentsTupleType &cppArgs)
        {
        }
    };

    template<int Pos, typename T, typename...Rest>
    struct RefValuesSync<Pos, T, Rest...>
    {
        static void Sync(v8::Local<v8::Context> context, const v8::FunctionCallbackInfo<v8::Value>& info, ArgumentsTupleType &cppArgs)
        {
            RefValueSync<T>::Sync(context, info[Pos], std::get<Pos>(cppArgs));
            RefValuesSync<Pos + 1, Rest...>::Sync(context, info, cppArgs);
        }
    };

    template <typename Func, size_t... index>
    static typename std::enable_if<std::is_same<typename internal::traits::FunctionTrait<Func>::ReturnType, void>::value,bool>::type
    call(Func& func, const v8::FunctionCallbackInfo<v8::Value>& info, std::index_sequence<index...>)
    {
        auto context = info.GetIsolate()->GetCurrentContext();

        if (!ArgumentsChecker<CheckArguments, Args...>::Check(context, info)) return false;
        
        ArgumentsTupleType cppArgs = std::make_tuple<typename std::decay<Args>::type...>(TypeConverter<typename ConverterDecay<Args>::type>::toCpp(context, info[index])...);

        func(std::get<index>(cppArgs)...);
        
        RefValuesSync<0, Args...>::Sync(context, info, cppArgs);
        
        return true;
    }

    template <typename Func, size_t... index>
    static typename std::enable_if<!std::is_same<typename internal::traits::FunctionTrait<Func>::ReturnType, void>::value, bool>::type
    call(Func& func, const v8::FunctionCallbackInfo<v8::Value>& info, std::index_sequence<index...>)
    {
        auto context = info.GetIsolate()->GetCurrentContext();

        if (!ArgumentsChecker<CheckArguments, Args...>::Check(context, info)) return false;
        
        ArgumentsTupleType cppArgs = std::make_tuple<typename std::decay<Args>::type...>(TypeConverter<typename ConverterDecay<Args>::type>::toCpp(context, info[index])...);

        auto ret = func(std::get<index>(cppArgs)...);
        info.GetReturnValue().Set(TypeConverter<Ret>::toScript(context, std::forward<Ret>(ret)));
        
        RefValuesSync<0, Args...>::Sync(context, info, cppArgs);
        
        return true;
    }
    
    template <typename Ins, typename Func, size_t... index>
    static typename std::enable_if<std::is_same<typename internal::traits::FunctionTrait<Func>::ReturnType, void>::value,bool>::type
    callMethod(Func& func, const v8::FunctionCallbackInfo<v8::Value>& info, std::index_sequence<index...>)
    {
        auto context = info.GetIsolate()->GetCurrentContext();

        auto self = DataTransfer::GetPoninterFast<Ins>(info.Holder());

        if (!ArgumentsChecker<CheckArguments, Args...>::Check(context, info)) return false;

        ArgumentsTupleType cppArgs = std::make_tuple<typename std::decay<Args>::type...>(TypeConverter<typename ConverterDecay<Args>::type>::toCpp(context, info[index])...);
        
        (self->*func)(std::get<index>(cppArgs)...);
        
        RefValuesSync<0, Args...>::Sync(context, info, cppArgs);
        
        return true;
    }

    template <typename Ins, typename Func, size_t... index>
    static typename std::enable_if<!std::is_same<typename internal::traits::FunctionTrait<Func>::ReturnType, void>::value, bool>::type
    callMethod(Func& func, const v8::FunctionCallbackInfo<v8::Value>& info, std::index_sequence<index...>)
    {
        auto context = info.GetIsolate()->GetCurrentContext();

        auto self = DataTransfer::GetPoninterFast<Ins>(info.Holder());

        if (!ArgumentsChecker<CheckArguments, Args...>::Check(context, info)) return false;

        ArgumentsTupleType cppArgs = std::make_tuple<typename std::decay<Args>::type...>(TypeConverter<typename ConverterDecay<Args>::type>::toCpp(context, info[index])...);
        
        auto ret = (self->*func)(std::get<index>(cppArgs)...);
        info.GetReturnValue().Set(TypeConverter<Ret>::toScript(context, std::forward<Ret>(ret)));
        
        RefValuesSync<0, Args...>::Sync(context, info, cppArgs);
        
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

    static bool overloadCall(const v8::FunctionCallbackInfo<v8::Value>& info)
    {
        using Helper = internal::FuncCallHelper<
            std::pair<Ret, std::tuple<Args...>>, true>;
        return Helper::call(func, info);
    }
    static void checkedCall(const v8::FunctionCallbackInfo<v8::Value>& info)
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
    static const CFunctionInfo* info()
    {
        return CFunctionInfoImpl<Ret, Args...>::get();
    }
};

template<typename Inc, typename Ret, typename... Args, Ret (Inc::*func)(Args...)>
struct FuncCallWrapper<Ret (Inc::*)(Args...), func> 
{
    static void call(const v8::FunctionCallbackInfo<v8::Value>& info)
    {
        using Helper = internal::FuncCallHelper<
            std::pair<Ret, std::tuple<Args...>>, false>;
        Helper::template callMethod<Inc>(func, info);
    }

    static bool overloadCall(const v8::FunctionCallbackInfo<v8::Value>& info)
    {
        using Helper = internal::FuncCallHelper<
            std::pair<Ret, std::tuple<Args...>>, true>;
        return Helper::template callMethod<Inc, decltype(func)>(func, info);
    }
    static void checkedCall(const v8::FunctionCallbackInfo<v8::Value>& info)
    {
        using Helper = internal::FuncCallHelper<
            std::pair<Ret, std::tuple<Args...>>, true>;
        if(!Helper::template callMethod<Inc, decltype(func)>(func, info))
        {
            v8::Isolate* isolate = info.GetIsolate();
            isolate->ThrowException(v8::Exception::Error(v8::String::NewFromUtf8(isolate,
                "invalid parameter!", v8::NewStringType::kNormal).ToLocalChecked()));
        }
    }
    static const CFunctionInfo* info()
    {
        return CFunctionInfoImpl<Ret, Args...>::get();
    }
};

//TODO: Similar logic...
template<typename Inc, typename Ret, typename... Args, Ret (Inc::*func)(Args...) const>
struct FuncCallWrapper<Ret (Inc::*)(Args...) const, func> 
{
    static void call(const v8::FunctionCallbackInfo<v8::Value>& info)
    {
        using Helper = internal::FuncCallHelper<
            std::pair<Ret, std::tuple<Args...>>, false>;
        Helper::template callMethod<Inc>(func, info);
    }

    static bool overloadCall(const v8::FunctionCallbackInfo<v8::Value>& info)
    {
        using Helper = internal::FuncCallHelper<
            std::pair<Ret, std::tuple<Args...>>, true>;
        return Helper::template callMethod<Inc, decltype(func)>(func, info);
    }
    static void checkedCall(const v8::FunctionCallbackInfo<v8::Value>& info)
    {
        using Helper = internal::FuncCallHelper<
            std::pair<Ret, std::tuple<Args...>>, true>;
        if(!Helper::template callMethod<Inc, decltype(func)>(func, info))
        {
            v8::Isolate* isolate = info.GetIsolate();
            isolate->ThrowException(v8::Exception::Error(v8::String::NewFromUtf8(isolate,
                "invalid parameter!", v8::NewStringType::kNormal).ToLocalChecked()));
        }
    }
    static const CFunctionInfo* info()
    {
        return CFunctionInfoImpl<Ret, Args...>::get();
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

        if (!internal::ArgumentChecker<0, Args...>::Check(info, context)) return nullptr;

        return new T(internal::TypeConverter<typename internal::ConverterDecay<Args>::type>::toCpp(context, info[index])...);
    }

public:
    static void *call(const v8::FunctionCallbackInfo<v8::Value>& info)
    {
        return call(info, std::make_index_sequence<ArgsLength>());
    }
    static const CFunctionInfo* info()
    {
        return CFunctionInfoImpl<T, Args...>::get();
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

template<typename...OverloadWraps>
struct OverloadsCombiner
{
    static void call(const v8::FunctionCallbackInfo<v8::Value>& info)
    {
        OverloadsRecursion<(&OverloadWraps::overloadCall)...>::call(info);
    }

    static constexpr int length = sizeof...(OverloadWraps);

    static const CFunctionInfo** infos()
    {
        static const CFunctionInfo* _infos[sizeof...(OverloadWraps)] = {OverloadWraps::info()...};
        return _infos;
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

template<typename...OverloadWraps>
struct ConstructorsCombiner
{
    static void * call(const v8::FunctionCallbackInfo<v8::Value>& info)
    {
        return ConstructorRecursion<(&OverloadWraps::call)...>::call(info);
    }

    static constexpr int length = sizeof...(OverloadWraps);

    static const CFunctionInfo** infos()
    {
        static const CFunctionInfo* _infos[sizeof...(OverloadWraps)] = {OverloadWraps::info()...};
        return _infos;
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

    static const char* info()
    {
        return ScriptTypeName<Ret>::value;
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

    std::vector<NamedFunctionInfo> constructorInfos_{};
    std::vector<NamedFunctionInfo> methodInfos_{};
    std::vector<NamedFunctionInfo> functionInfos_{};
    std::vector<NamedPropertyInfo> propertyInfos_{};

public:
    explicit ClassDefineBuilder(const char * className)
        : className_(className) {}

    template <typename S>
    ClassDefineBuilder<T>& Extends() {
        superClassName_ = ScriptTypeName<S>::value;
        return *this;
    }

    template<typename... Args>
    std::enable_if_t<internal::isArgsConvertible<std::tuple<Args...>>, ClassDefineBuilder<T>&>
    Constructor() {
        constructor_ = ConstructorWrapper<T, Args...>::call;
        constructorInfos_.push_back(NamedFunctionInfo {"constructor", ConstructorWrapper<T, Args...>::info()});
        return *this;
    }

    ClassDefineBuilder<T>& Constructor(InitializeFunc constructor, int length, const CFunctionInfo** infos) {
        for(int i = 0; i < length; i++)
        {
            constructorInfos_.push_back(NamedFunctionInfo {"constructor", infos[i]});
        }
        constructor_ = constructor;
        return *this;
    }

    ClassDefineBuilder<T>& Function(const char* name, v8::FunctionCallback func, const CFunctionInfo* info) {
        if (info)
        {
            functionInfos_.push_back(NamedFunctionInfo {name, info});
        }
        functions_.push_back(JSFunctionInfo {name, func, nullptr});
        return *this;
    }
    
    ClassDefineBuilder<T>& Function(const char* name, v8::FunctionCallback func, int length, const CFunctionInfo** infos) {
        for(int i = 0; i < length; i++)
        {
            functionInfos_.push_back(NamedFunctionInfo {name, infos[i]});
        }
        functions_.push_back(JSFunctionInfo {name, func, nullptr});
        return *this;
    }

    ClassDefineBuilder<T>& Method(const char* name, v8::FunctionCallback func, const CFunctionInfo* info) {
        if (info)
        {
            methodInfos_.push_back(NamedFunctionInfo {name, info});
        }
        methods_.push_back(JSFunctionInfo {name, func, nullptr});
        return *this;
    }

    ClassDefineBuilder<T>& Method(const char* name, v8::FunctionCallback func, int length, const CFunctionInfo** infos) {
        for(int i = 0; i < length; i++)
        {
            methodInfos_.push_back(NamedFunctionInfo {name, infos[i]});
        }
        methods_.push_back(JSFunctionInfo {name, func, nullptr});
        return *this;
    }

    ClassDefineBuilder<T>& Property(const char* name, v8::AccessorNameGetterCallback getter, v8::AccessorNameSetterCallback setter = nullptr, const char* type = nullptr) {
        if (type)
        {
            propertyInfos_.push_back(NamedPropertyInfo {name, type});
        }
        properties_.push_back(JSPropertyInfo {name, getter, setter, nullptr});
        return *this;
    }

    void Register()
    {
        const bool isUEType = puerts::is_uetype<T>::value;
        static std::vector<JSFunctionInfo> s_functions_{};
        static std::vector<JSFunctionInfo> s_methods_{};
        static std::vector<JSPropertyInfo> s_properties_{};

        static std::vector<NamedFunctionInfo> s_constructorInfos_{};
        static std::vector<NamedFunctionInfo> s_methodInfos_{};
        static std::vector<NamedFunctionInfo> s_functionInfos_{};
        static std::vector<NamedPropertyInfo> s_propertyInfos_{};
        
        puerts::JSClassDefinition ClassDef = JSClassEmptyDefinition;

        if (isUEType)
        {
            ClassDef.UStructName = className_;
        }
        else
        {
            ClassDef.CDataName = className_;
            ClassDef.CDataSuperName = superClassName_;
        }

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

        s_constructorInfos_ = std::move(constructorInfos_);
        s_constructorInfos_.push_back(NamedFunctionInfo {nullptr, nullptr});
        ClassDef.ConstructorInfos = s_constructorInfos_.data();

        s_methodInfos_ = std::move(methodInfos_);
        s_methodInfos_.push_back(NamedFunctionInfo {nullptr, nullptr});
        ClassDef.MethodInfos = s_methodInfos_.data();

        s_functionInfos_ = std::move(functionInfos_);
        s_functionInfos_.push_back(NamedFunctionInfo {nullptr, nullptr});
        ClassDef.FunctionInfos = s_functionInfos_.data();

        s_propertyInfos_ = std::move(propertyInfos_);
        s_propertyInfos_.push_back(NamedPropertyInfo {nullptr, nullptr});
        ClassDef.PropertyInfos = s_propertyInfos_.data();

        puerts::RegisterClass(ClassDef);
    }
};

template <typename T>
inline ClassDefineBuilder<T> DefineClass() {
    return ClassDefineBuilder<T>(ScriptTypeName<T>::value);
}

}

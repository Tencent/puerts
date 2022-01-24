/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include <sstream>
#include <tuple>
#include <type_traits>
#if BUILDING_PES_EXTENSION
#include "pesapi.h"
#else
#include "JSClassRegister.h"
#endif
#include "Converter.hpp"
#include "TypeInfo.hpp"

#define MakeConstructor(T, ...) ::puerts::template ConstructorWrapper<T, ##__VA_ARGS__>
#define MakeGetter(M) &(::puerts::PropertyWrapper<decltype(M), M>::getter)
#define MakeSetter(M) &(::puerts::PropertyWrapper<decltype(M), M>::setter)
#define MakeProperty(M)                                                                                         \
    &(::puerts::PropertyWrapper<decltype(M), M>::getter), &(::puerts::PropertyWrapper<decltype(M), M>::setter), \
        ::puerts::PropertyWrapper<decltype(M), M>::info()
#define MakeFunction(M) &(::puerts::FuncCallWrapper<decltype(M), M>::call), ::puerts::FuncCallWrapper<decltype(M), M>::info()
#define SelectFunction(SIGNATURE, M) \
    &(::puerts::FuncCallWrapper<SIGNATURE, M>::call), ::puerts::FuncCallWrapper<SIGNATURE, M>::info()
#define MakeCheckFunction(M) \
    &(::puerts::FuncCallWrapper<decltype(M), M>::checkedCall), ::puerts::FuncCallWrapper<decltype(M), M>::info()
#define MakeOverload(SIGNATURE, M) puerts::FuncCallWrapper<SIGNATURE, M>
#define CombineOverloads(...)                                                                          \
    &::puerts::OverloadsCombiner<__VA_ARGS__>::call, ::puerts::OverloadsCombiner<__VA_ARGS__>::length, \
        ::puerts::OverloadsCombiner<__VA_ARGS__>::infos()
#define CombineConstructors(...)                                                                             \
    &::puerts::ConstructorsCombiner<__VA_ARGS__>::call, ::puerts::ConstructorsCombiner<__VA_ARGS__>::length, \
        ::puerts::ConstructorsCombiner<__VA_ARGS__>::infos()

#define UsingCppType(CLS) __DefScriptTTypeName(CLS, CLS) __DefObjectType(CLS) __DefCDataPointerConverter(CLS)

namespace puerts
{
namespace internal
{
template <typename T, typename = void>
struct ConverterDecay
{
    using type = typename std::decay<T>::type;
};

template <typename T>
struct ConverterDecay<T, typename std::enable_if<std::is_lvalue_reference<T>::value &&
                                                 !std::is_const<typename std::remove_reference<T>::type>::value>::type>
{
    using type = std::reference_wrapper<typename std::decay<T>::type>;
};

template <typename T>
using TypeConverter = puerts::converter::Converter<typename ConverterDecay<T>::type>;

template <typename T, typename = void>
struct IsConvertibleHelper : std::false_type
{
};

template <class...>
using Void_t = void;

template <typename T>
struct IsConvertibleHelper<T,
    // test if it has a function toScript
    Void_t<decltype(&TypeConverter<T>::toScript)>> : std::true_type
{
};

}    // namespace internal

namespace converter
{
template <typename T>
constexpr bool isConvertible = internal::IsConvertibleHelper<T>::value;

}
}    // namespace puerts

namespace puerts
{
namespace internal
{
namespace traits
{
template <typename Args>
struct TupleTrait;

template <typename HeadT, typename... TailT>
struct TupleTrait<std::tuple<HeadT, TailT...>>
{
    using Head = HeadT;
    using Tail = std::tuple<TailT...>;

    static constexpr size_t count = 1 + sizeof...(TailT);

    template <size_t i>
    using Arg = typename std::tuple_element<i, std::tuple<HeadT, TailT...>>::type;
};

template <>
struct TupleTrait<std::tuple<>>
{
    using Tail = std::tuple<>;
    static constexpr size_t count = 0;
};

template <typename Func, typename Enable = void>
struct FunctionTrait;

template <typename Ret, typename... Args>
struct FunctionTrait<Ret (*)(Args...)>
{
    using ReturnType = Ret;
    using Arguments = std::tuple<Args...>;
};

template <typename C, typename Ret, typename... Args>
struct FunctionTrait<Ret (C::*)(Args...)> : FunctionTrait<Ret (*)(C*, Args...)>
{
};

template <typename C, typename Ret, typename... Args>
struct FunctionTrait<Ret (C::*)(Args...) const> : FunctionTrait<Ret (*)(C*, Args...)>
{
};

template <typename C, typename Ret, typename... Args>
struct FunctionTrait<Ret (C::*)(Args...) volatile> : FunctionTrait<Ret (*)(C*, Args...)>
{
};

template <typename C, typename Ret, typename... Args>
struct FunctionTrait<Ret (C::*)(Args...) const volatile> : FunctionTrait<Ret (*)(C*, Args...)>
{
};

// functor and lambda
template <typename Functor>
struct FunctionTrait<Functor, Void_t<decltype(&Functor::operator())>>
{
private:
    using FunctorTrait = FunctionTrait<decltype(&Functor::operator())>;

public:
    using ReturnType = typename FunctorTrait::ReturnType;
    using Arguments = typename TupleTrait<typename FunctorTrait::Arguments>::Tail;
};

// decay: remove const, reference; function type to function pointer
template <typename Func>
struct FunctionTrait<Func, typename std::enable_if<!std::is_same<Func, typename std::decay<Func>::type>::value>::type>
    : FunctionTrait<typename std::decay<Func>::type>
{
};
}    // namespace traits

template <typename T>
using FuncTrait = traits::FunctionTrait<T>;

template <bool _First_value, class _First, class... _Rest>
struct _Conjunction
{    // handle false trait or last trait
    using type = _First;
};

template <class _True, class _Next, class... _Rest>
struct _Conjunction<true, _True, _Next, _Rest...>
{    // the first trait is true, try the next one
    using type = typename _Conjunction<_Next::value, _Next, _Rest...>::type;
};

template <class... _Traits>
struct Conjunction : std::true_type
{
};    // If _Traits is empty, true_type

template <class _First, class... _Rest>
struct Conjunction<_First, _Rest...> : _Conjunction<_First::value, _First, _Rest...>::type
{
    // the first false trait in _Traits, or the last trait if none are false
};

template <typename T, typename = void>
struct IsArgsConvertibleHelper : std::false_type
{
};

template <typename... Args>
struct IsArgsConvertibleHelper<std::tuple<Args...>, typename std::enable_if<Conjunction<IsConvertibleHelper<Args>...>::value>::type>
    : std::true_type
{
};

template <typename T>
constexpr bool isArgsConvertible = IsArgsConvertibleHelper<T>::value;

template <int, typename...>
struct ArgumentChecker
{
    static bool Check(CallbackInfoType Info, ContextType Context)
    {
        return true;
    }
};

template <int Pos, typename ArgType, typename... Rest>
struct ArgumentChecker<Pos, ArgType, Rest...>
{
    static constexpr int NextPos = Pos + 1;

    static bool Check(CallbackInfoType Info, ContextType Context)
    {
        if (!TypeConverter<ArgType>::accept(Context, GetArg(Info, Pos)))
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

template <typename... Args>
struct ArgumentsChecker<true, Args...>
{
    static constexpr auto ArgsLength = sizeof...(Args);

    static bool Check(ContextType context, CallbackInfoType info)
    {
        if (GetArgsLen(info) != ArgsLength)
            return false;

        if (!ArgumentChecker<0, Args...>::Check(info, context))
            return false;

        return true;
    }
};

template <typename... Args>
struct ArgumentsChecker<false, Args...>
{
    static constexpr auto ArgsLength = sizeof...(Args);

    static bool Check(ContextType context, CallbackInfoType info)
    {
        return true;
    }
};

template <typename, bool CheckArguments>
struct FuncCallHelper
{
};

template <typename Ret, typename... Args, bool CheckArguments>
struct FuncCallHelper<std::pair<Ret, std::tuple<Args...>>, CheckArguments>
{
private:
    static constexpr auto ArgsLength = sizeof...(Args);
    using ArgumentsTupleType = std::tuple<typename std::decay<Args>::type...>;

    template <typename T, typename Enable = void>
    struct RefValueSync
    {
        static void Sync(ContextType context, ValueType holder, typename std::decay<T>::type value)
        {
        }
    };

    template <typename T>
    struct RefValueSync<T, typename std::enable_if<std::is_lvalue_reference<T>::value &&
                                                   !std::is_const<typename std::remove_reference<T>::type>::value>::type>
    {
        static void Sync(ContextType context, ValueType holder, typename std::decay<T>::type value)
        {
            UpdateRefValue(context, holder, converter::Converter<decltype(value)>::toScript(context, value));
        }
    };

    template <int, typename...>
    struct RefValuesSync
    {
        static void Sync(ContextType context, CallbackInfoType info, ArgumentsTupleType& cppArgs)
        {
        }
    };

    template <int Pos, typename T, typename... Rest>
    struct RefValuesSync<Pos, T, Rest...>
    {
        static void Sync(ContextType context, CallbackInfoType info, ArgumentsTupleType& cppArgs)
        {
            RefValueSync<T>::Sync(context, GetArg(info, Pos), std::get<Pos>(cppArgs));
            RefValuesSync<Pos + 1, Rest...>::Sync(context, info, cppArgs);
        }
    };

    template <typename Func, size_t... index>
    static
        typename std::enable_if<std::is_same<typename internal::traits::FunctionTrait<Func>::ReturnType, void>::value, bool>::type
        call(Func& func, CallbackInfoType info, std::index_sequence<index...>)
    {
        auto context = GetContext(info);

        if (!ArgumentsChecker<CheckArguments, Args...>::Check(context, info))
            return false;

        ArgumentsTupleType cppArgs =
            std::make_tuple<typename std::decay<Args>::type...>(TypeConverter<Args>::toCpp(context, GetArg(info, index))...);

        func(std::forward<Args>(std::get<index>(cppArgs))...);

        RefValuesSync<0, Args...>::Sync(context, info, cppArgs);

        return true;
    }

    template <typename Func, size_t... index>
    static
        typename std::enable_if<!std::is_same<typename internal::traits::FunctionTrait<Func>::ReturnType, void>::value, bool>::type
        call(Func& func, CallbackInfoType info, std::index_sequence<index...>)
    {
        auto context = GetContext(info);

        if (!ArgumentsChecker<CheckArguments, Args...>::Check(context, info))
            return false;

        ArgumentsTupleType cppArgs =
            std::make_tuple<typename std::decay<Args>::type...>(TypeConverter<Args>::toCpp(context, GetArg(info, index))...);

        auto ret = func(std::forward<Args>(std::get<index>(cppArgs))...);
        SetReturn(info, TypeConverter<Ret>::toScript(context, std::forward<Ret>(ret)));

        RefValuesSync<0, Args...>::Sync(context, info, cppArgs);

        return true;
    }

    template <typename Ins, typename Func, size_t... index>
    static
        typename std::enable_if<std::is_same<typename internal::traits::FunctionTrait<Func>::ReturnType, void>::value, bool>::type
        callMethod(Func& func, CallbackInfoType info, std::index_sequence<index...>)
    {
        auto context = GetContext(info);

        auto self = TypeConverter<Ins*>::toCpp(context, GetHolder(info));

        if (!self)
        {
            ThrowException(GetContext(info), "access a null object");
            return true;
        }

        if (!ArgumentsChecker<CheckArguments, Args...>::Check(context, info))
            return false;

        ArgumentsTupleType cppArgs =
            std::make_tuple<typename std::decay<Args>::type...>(TypeConverter<Args>::toCpp(context, GetArg(info, index))...);

        (self->*func)(std::forward<Args>(std::get<index>(cppArgs))...);

        RefValuesSync<0, Args...>::Sync(context, info, cppArgs);

        return true;
    }

    template <typename Ins, typename Func, size_t... index>
    static
        typename std::enable_if<!std::is_same<typename internal::traits::FunctionTrait<Func>::ReturnType, void>::value, bool>::type
        callMethod(Func& func, CallbackInfoType info, std::index_sequence<index...>)
    {
        auto context = GetContext(info);

        auto self = TypeConverter<Ins*>::toCpp(context, GetHolder(info));

        if (!self)
        {
            ThrowException(GetContext(info), "access a null object");
            return true;
        }

        if (!ArgumentsChecker<CheckArguments, Args...>::Check(context, info))
            return false;

        ArgumentsTupleType cppArgs =
            std::make_tuple<typename std::decay<Args>::type...>(TypeConverter<Args>::toCpp(context, GetArg(info, index))...);

        auto ret = (self->*func)(std::forward<Args>(std::get<index>(cppArgs))...);
        SetReturn(info, TypeConverter<Ret>::toScript(context, std::forward<Ret>(ret)));

        RefValuesSync<0, Args...>::Sync(context, info, cppArgs);

        return true;
    }

public:
    template <typename Func>
    static bool call(Func&& func, CallbackInfoType info)
    {
        return call(func, info, std::make_index_sequence<ArgsLength>());
    }

    template <typename Ins, typename Func>
    static bool callMethod(Func&& func, CallbackInfoType info)
    {
        return callMethod<Ins>(func, info, std::make_index_sequence<ArgsLength>());
    }
};

}    // namespace internal

template <typename T, T>
struct FuncCallWrapper;

template <typename Ret, typename... Args, Ret (*func)(Args...)>
struct FuncCallWrapper<Ret (*)(Args...), func>
{
    static void call(CallbackInfoType info)
    {
        using Helper = internal::FuncCallHelper<std::pair<Ret, std::tuple<Args...>>, false>;
        Helper::call(func, info);
    }

    static bool overloadCall(CallbackInfoType info)
    {
        using Helper = internal::FuncCallHelper<std::pair<Ret, std::tuple<Args...>>, true>;
        return Helper::call(func, info);
    }
    static void checkedCall(CallbackInfoType info)
    {
        using Helper = internal::FuncCallHelper<std::pair<Ret, std::tuple<Args...>>, true>;
        if (!Helper::call(func, info))
        {
            ThrowException(GetContext(info), "invalid parameter!");
        }
    }
    static const CFunctionInfo* info()
    {
        return CFunctionInfoImpl<Ret, Args...>::get();
    }
};

template <typename Inc, typename Ret, typename... Args, Ret (Inc::*func)(Args...)>
struct FuncCallWrapper<Ret (Inc::*)(Args...), func>
{
    static void call(CallbackInfoType info)
    {
        using Helper = internal::FuncCallHelper<std::pair<Ret, std::tuple<Args...>>, false>;
        Helper::template callMethod<Inc>(func, info);
    }

    static bool overloadCall(CallbackInfoType info)
    {
        using Helper = internal::FuncCallHelper<std::pair<Ret, std::tuple<Args...>>, true>;
        return Helper::template callMethod<Inc, decltype(func)>(func, info);
    }
    static void checkedCall(CallbackInfoType info)
    {
        using Helper = internal::FuncCallHelper<std::pair<Ret, std::tuple<Args...>>, true>;
        if (!Helper::template callMethod<Inc, decltype(func)>(func, info))
        {
            ThrowException(GetContext(info), "invalid parameter!");
        }
    }
    static const CFunctionInfo* info()
    {
        return CFunctionInfoImpl<Ret, Args...>::get();
    }
};

// TODO: Similar logic...
template <typename Inc, typename Ret, typename... Args, Ret (Inc::*func)(Args...) const>
struct FuncCallWrapper<Ret (Inc::*)(Args...) const, func>
{
    static void call(CallbackInfoType info)
    {
        using Helper = internal::FuncCallHelper<std::pair<Ret, std::tuple<Args...>>, false>;
        Helper::template callMethod<Inc>(func, info);
    }

    static bool overloadCall(CallbackInfoType info)
    {
        using Helper = internal::FuncCallHelper<std::pair<Ret, std::tuple<Args...>>, true>;
        return Helper::template callMethod<Inc, decltype(func)>(func, info);
    }
    static void checkedCall(CallbackInfoType info)
    {
        using Helper = internal::FuncCallHelper<std::pair<Ret, std::tuple<Args...>>, true>;
        if (!Helper::template callMethod<Inc, decltype(func)>(func, info))
        {
            ThrowException(GetContext(info), "invalid parameter!");
        }
    }
    static const CFunctionInfo* info()
    {
        return CFunctionInfoImpl<Ret, Args...>::get();
    }
};

template <typename T, typename... Args>
struct ConstructorWrapper
{
private:
    static constexpr auto ArgsLength = sizeof...(Args);

    template <size_t... index>
    static void* call(CallbackInfoType info, std::index_sequence<index...>)
    {
        auto context = GetContext(info);

        if (GetArgsLen(info) != ArgsLength)
            return nullptr;

        if (!internal::ArgumentChecker<0, Args...>::Check(info, context))
            return nullptr;

        return new T(internal::TypeConverter<Args>::toCpp(context, GetArg(info, index))...);
    }

public:
    static void* call(CallbackInfoType info)
    {
        return call(info, std::make_index_sequence<ArgsLength>());
    }
    static const CFunctionInfo* info()
    {
        return CFunctionInfoImpl<T, Args...>::get();
    }
};

typedef bool (*V8FunctionCallbackWithBoolRet)(CallbackInfoType info);

template <V8FunctionCallbackWithBoolRet Func, V8FunctionCallbackWithBoolRet... Rest>
struct OverloadsRecursion
{
    static bool _call(CallbackInfoType info)
    {
        if (Func(info))
            return true;
        else
            return OverloadsRecursion<Rest...>::_call(info);
    }

    static void call(CallbackInfoType info)
    {
        if (!_call(info))
        {
            ThrowException(GetContext(info), "invalid parameter!");
        }
    }
};

template <V8FunctionCallbackWithBoolRet Func>
struct OverloadsRecursion<Func>
{
    static bool _call(CallbackInfoType info)
    {
        return Func(info);
    }
};

template <typename... OverloadWraps>
struct OverloadsCombiner
{
    static void call(CallbackInfoType info)
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

template <InitializeFuncType Func, InitializeFuncType... Rest>
struct ConstructorRecursion
{
    static void* _call(CallbackInfoType info)
    {
        auto Ret = Func(info);
        if (Ret)
            return Ret;
        else
            return ConstructorRecursion<Rest...>::_call(info);
    }

    static void* call(CallbackInfoType info)
    {
        auto Ret = _call(info);
        if (!Ret)
        {
            ThrowException(GetContext(info), "invalid parameter!");
        }
        return Ret;
    }
};

template <InitializeFuncType Func>
struct ConstructorRecursion<Func>
{
    static void* _call(CallbackInfoType info)
    {
        return Func(info);
    }
};

template <typename... OverloadWraps>
struct ConstructorsCombiner
{
    static void* call(CallbackInfoType info)
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

template <typename T, T, typename Enable = void>
struct PropertyWrapper;

template <class Ins, class Ret, Ret Ins::*member>
struct PropertyWrapper<Ret Ins::*, member, typename std::enable_if<!is_objecttype<Ret>::value && !is_uetype<Ret>::value>::type>
{
    static void getter(CallbackInfoType info)
    {
        auto context = GetContext(info);
        auto self = internal::TypeConverter<Ins*>::toCpp(context, GetThis(info));
        if (!self)
        {
            ThrowException(context, "access a null object");
            return;
        }
        SetReturn(info, internal::TypeConverter<Ret>::toScript(context, self->*member));
    }

    static void setter(CallbackInfoType info)
    {
        auto context = GetContext(info);
        auto self = internal::TypeConverter<Ins*>::toCpp(context, GetThis(info));
        if (!self)
        {
            ThrowException(context, "access a null object");
            return;
        }
        self->*member = internal::TypeConverter<Ret>::toCpp(context, GetArg(info, 0));
    }

    static const char* info()
    {
        return ScriptTypeName<Ret>::value;
    }
};

template <class Ins, class Ret, Ret Ins::*member>
struct PropertyWrapper<Ret Ins::*, member, typename std::enable_if<is_objecttype<Ret>::value || is_uetype<Ret>::value>::type>
{
    static void getter(CallbackInfoType info)
    {
        auto context = GetContext(info);
        auto self = internal::TypeConverter<Ins*>::toCpp(context, GetThis(info));
        if (!self)
        {
            ThrowException(context, "access a null object");
            return;
        }
        SetReturn(info, internal::TypeConverter<Ret*>::toScript(context, &(self->*member)));
    }

    static void setter(CallbackInfoType info)
    {
        auto context = GetContext(info);
        auto self = internal::TypeConverter<Ins*>::toCpp(context, GetThis(info));
        if (!self)
        {
            ThrowException(context, "access a null object");
            return;
        }
        self->*member = internal::TypeConverter<Ret>::toCpp(context, GetArg(info, 0));
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

    const char* className_ = nullptr;

    const char* superClassName_ = nullptr;

    std::vector<GeneralFunctionInfo> functions_{};

    std::vector<GeneralFunctionInfo> methods_{};

    std::vector<GeneralPropertyInfo> properties_{};

    InitializeFuncType constructor_{};

    std::vector<GeneralFunctionReflectionInfo> constructorInfos_{};
    std::vector<GeneralFunctionReflectionInfo> methodInfos_{};
    std::vector<GeneralFunctionReflectionInfo> functionInfos_{};
    std::vector<GeneralPropertyReflectionInfo> propertyInfos_{};

public:
    explicit ClassDefineBuilder(const char* className) : className_(className)
    {
    }

    template <typename S>
    ClassDefineBuilder<T>& Extends()
    {
        superClassName_ = ScriptTypeName<S>::value;
        return *this;
    }

    template <typename... Args>
    std::enable_if_t<internal::isArgsConvertible<std::tuple<Args...>>, ClassDefineBuilder<T>&> Constructor()
    {
        InitializeFuncType constructor = ConstructorWrapper<T, Args...>::call;
        constructor_ = constructor;
        constructorInfos_.push_back(GeneralFunctionReflectionInfo{"constructor", ConstructorWrapper<T, Args...>::info()});
        return *this;
    }

    ClassDefineBuilder<T>& Constructor(InitializeFuncType constructor, int length, const CFunctionInfo** infos)
    {
        for (int i = 0; i < length; i++)
        {
            constructorInfos_.push_back(GeneralFunctionReflectionInfo{"constructor", infos[i]});
        }
        constructor_ = constructor;
        return *this;
    }

    ClassDefineBuilder<T>& Function(const char* name, FunctionCallbackType func, const CFunctionInfo* info)
    {
        if (info)
        {
            functionInfos_.push_back(GeneralFunctionReflectionInfo{name, info});
        }
        functions_.push_back(GeneralFunctionInfo{name, func, nullptr});
        return *this;
    }

    ClassDefineBuilder<T>& Function(const char* name, FunctionCallbackType func, int length, const CFunctionInfo** infos)
    {
        for (int i = 0; i < length; i++)
        {
            functionInfos_.push_back(GeneralFunctionReflectionInfo{name, infos[i]});
        }
        functions_.push_back(GeneralFunctionInfo{name, func, nullptr});
        return *this;
    }

    ClassDefineBuilder<T>& Method(const char* name, FunctionCallbackType func, const CFunctionInfo* info)
    {
        if (info)
        {
            methodInfos_.push_back(GeneralFunctionReflectionInfo{name, info});
        }
        methods_.push_back(GeneralFunctionInfo{name, func, nullptr});
        return *this;
    }

    ClassDefineBuilder<T>& Method(const char* name, FunctionCallbackType func, int length, const CFunctionInfo** infos)
    {
        for (int i = 0; i < length; i++)
        {
            methodInfos_.push_back(GeneralFunctionReflectionInfo{name, infos[i]});
        }
        methods_.push_back(GeneralFunctionInfo{name, func, nullptr});
        return *this;
    }

    ClassDefineBuilder<T>& Property(
        const char* name, FunctionCallbackType getter, FunctionCallbackType setter = nullptr, const char* type = nullptr)
    {
        if (type)
        {
            propertyInfos_.push_back(GeneralPropertyReflectionInfo{name, type});
        }
        properties_.push_back(GeneralPropertyInfo{name, getter, setter, nullptr});
        return *this;
    }

#if !BUILDING_PES_EXTENSION
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
            ClassDef.UETypeName = className_;
        }
        else
        {
            ClassDef.CPPTypeName = className_;
            ClassDef.CPPSuperTypeName = superClassName_;
        }

        ClassDef.Initialize = constructor_;
        if (constructor_)
        {
            ClassDef.Finalize = [](void* Ptr) { delete static_cast<T*>(Ptr); };
        }

        s_functions_ = std::move(functions_);
        s_functions_.push_back({nullptr, nullptr, nullptr});
        ClassDef.Functions = s_functions_.data();

        s_methods_ = std::move(methods_);
        s_methods_.push_back({nullptr, nullptr, nullptr});
        ClassDef.Methods = s_methods_.data();

        s_properties_ = std::move(properties_);
        s_properties_.push_back(JSPropertyInfo{nullptr, nullptr, nullptr, nullptr});
        ClassDef.Properties = s_properties_.data();

        s_constructorInfos_ = std::move(constructorInfos_);
        s_constructorInfos_.push_back(NamedFunctionInfo{nullptr, nullptr});
        ClassDef.ConstructorInfos = s_constructorInfos_.data();

        s_methodInfos_ = std::move(methodInfos_);
        s_methodInfos_.push_back(NamedFunctionInfo{nullptr, nullptr});
        ClassDef.MethodInfos = s_methodInfos_.data();

        s_functionInfos_ = std::move(functionInfos_);
        s_functionInfos_.push_back(NamedFunctionInfo{nullptr, nullptr});
        ClassDef.FunctionInfos = s_functionInfos_.data();

        s_propertyInfos_ = std::move(propertyInfos_);
        s_propertyInfos_.push_back(NamedPropertyInfo{nullptr, nullptr});
        ClassDef.PropertyInfos = s_propertyInfos_.data();

        puerts::RegisterJSClass(ClassDef);
    }
#else
    void Register()
    {
        std::vector<pesapi_property_descriptor> properties;
        for (const auto& func : functions_)
        {
            properties.push_back({func.Name, true, func.Callback});
        }

        for (const auto& method : methods_)
        {
            properties.push_back({method.Name, false, method.Callback});
        }

        for (const auto& prop : properties_)
        {
            properties.push_back({prop.Name, false, nullptr, prop.Getter, prop.Setter});
        }
        pesapi_finalize finalize = nullptr;
        if (constructor_)
        {
            finalize = [](void* Ptr) { delete static_cast<T*>(Ptr); };
        }
        pesapi_define_class(className_, superClassName_, constructor_, finalize, properties.size(), properties.data());
    }
#endif
};

template <typename T>
inline ClassDefineBuilder<T> DefineClass()
{
    return ClassDefineBuilder<T>(ScriptTypeName<T>::value);
}

}    // namespace puerts

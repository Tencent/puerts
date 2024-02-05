/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include <tuple>
#include <type_traits>
#include <vector>
#include "TypeInfo.hpp"
#include <type_traits>
#if defined(WITH_THROW_IN_CPP) && !defined(THREAD_LOCAL_IMPL_THROW)
#include <exception>
#include <cstring>
#endif

namespace PUERTS_NAMESPACE
{
template <typename T, typename = void>
struct ArgumentBufferType
{
    using type = typename std::decay<T>::type*;
};

template <class... Args>
unsigned int Count(Args&&... args)
{
    return sizeof...(Args);
}

template <typename T>
struct ArgumentBufferType<T*, typename std::enable_if<is_script_type<T>::value && !std::is_const<T>::value>::type>
{
    using type = typename std::decay<T>::type;
};

template <typename T>
struct ArgumentBufferType<T,
    typename std::enable_if<std::is_lvalue_reference<T>::value && !std::is_const<typename std::remove_reference<T>::type>::value &&
                            std::is_constructible<typename std::decay<T>::type>::value &&
                            std::is_copy_constructible<typename std::decay<T>::type>::value &&
                            std::is_destructible<typename std::decay<T>::type>::value>::type>
{
    using type = typename std::decay<T>::type;
};

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

template <class...>
using Void_t = void;

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
struct FunctionTrait<Ret (C::*)(Args...)> : FunctionTrait<Ret (*)(Args...)>
{
};

template <typename C, typename Ret, typename... Args>
struct FunctionTrait<Ret (C::*)(Args...) const> : FunctionTrait<Ret (*)(Args...)>
{
};

template <typename C, typename Ret, typename... Args>
struct FunctionTrait<Ret (C::*)(Args...) volatile> : FunctionTrait<Ret (*)(Args...)>
{
};

template <typename C, typename Ret, typename... Args>
struct FunctionTrait<Ret (C::*)(Args...) const volatile> : FunctionTrait<Ret (*)(Args...)>
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

template <typename API, std::size_t, std::size_t, typename...>
struct ArgumentChecker
{
    static bool Check(typename API::CallbackInfoType Info, typename API::ContextType Context)
    {
        return true;
    }
};

template <typename API, std::size_t Pos, std::size_t StopPos, typename ArgType, typename... Rest>
struct ArgumentChecker<API, Pos, StopPos, ArgType, Rest...>
{
    static constexpr int NextPos = Pos + 1;

    template <typename T>
    using DecayTypeConverter = typename API::template Converter<typename ConverterDecay<T>::type>;

    static bool Check(typename API::CallbackInfoType Info, typename API::ContextType Context)
    {
        if (Pos >= StopPos)
            return true;
        if (!DecayTypeConverter<ArgType>::accept(Context, API::GetArg(Info, Pos)))
        {
            return false;
        }
        return ArgumentChecker<API, NextPos, StopPos, Rest...>::Check(Info, Context);
    }
};

template <typename API, typename Enable = void>
struct ExceptionHandle;

template <typename API>
struct ExceptionHandle<API, typename std::enable_if<std::is_pointer<typename API::CallbackInfoType>::value>::type>
{
#if defined(WITH_THROW_IN_CPP) && defined(THREAD_LOCAL_IMPL_THROW)
    // TripleOp : 1. init; 2. get state; 3. throw
    static bool TripleOp(typename API::CallbackInfoType info, const char* error_msg, bool b_get_state)
    {
        thread_local typename API::CallbackInfoType s_info;
        thread_local bool s_throwed;
        if (b_get_state)
        {
            return s_throwed;
        }
        if (error_msg)
        {
            API::ThrowException(s_info, error_msg);
            s_throwed = true;
            return true;
        }
        else
        {
            s_info = info;
            s_throwed = false;
            return false;
        }
    }
#endif

    static void Throw(const char* error_msg)
    {
#if defined(WITH_THROW_IN_CPP) && defined(THREAD_LOCAL_IMPL_THROW)
        // throw
        TripleOp(nullptr, error_msg, false);
#endif
    }
};

#if defined(WITH_THROW_IN_CPP) && !defined(THREAD_LOCAL_IMPL_THROW)
struct UserException : std::exception
{
    UserException(const char* msg)
    {
        auto len = strlen(msg);
        Msg = new char[len + 1];
        strncpy(Msg, msg, len);
        Msg[len] = '\0';
    }

    ~UserException() noexcept
    {
        delete[] Msg;
    }

    const char* what() const noexcept override
    {
        return Msg;
    }

    char* Msg;
};
#endif

template <typename API>
struct ExceptionHandle<API, typename std::enable_if<!std::is_pointer<typename API::CallbackInfoType>::value>::type>
{
#if defined(WITH_THROW_IN_CPP) && defined(THREAD_LOCAL_IMPL_THROW)
    // Triple operate
    // 1. init: info is not null, error_msg is null, b_get_state is false;
    // 2. get state: b_get_state is true;
    // 3. throw: error_msg is not null, b_get_state is false;
    static bool TripleOp(typename API::CallbackInfoType info, const char* error_msg, bool b_get_state)
    {
        thread_local typename std::decay<typename API::CallbackInfoType>::type* s_info;
        thread_local bool s_throwed;
        if (b_get_state)
        {
            return s_throwed;
        }
        if (error_msg)
        {
            API::ThrowException(*s_info, error_msg);
            s_throwed = true;
            return true;
        }
        else
        {
            s_info = (typename std::decay<typename API::CallbackInfoType>::type*) &info;
            s_throwed = false;
            return false;
        }
    }
#endif

    static void Throw(const char* error_msg)
    {
#if defined(WITH_THROW_IN_CPP)
#if defined(THREAD_LOCAL_IMPL_THROW)
        typename std::decay<typename API::CallbackInfoType>::type* pinfo = nullptr;
        // throw
        TripleOp(*pinfo, error_msg, false);
#else
        throw UserException(error_msg);
#endif
#endif
    }
};

template <typename, typename, bool, bool, bool, bool>
struct FuncCallHelper
{
};

template <typename API, typename Ret, typename... Args, bool CheckArguments, bool ReturnByPointer, bool ScriptTypePtrAsRef,
    bool GetSelfFromData>
struct FuncCallHelper<API, std::pair<Ret, std::tuple<Args...>>, CheckArguments, ReturnByPointer, ScriptTypePtrAsRef,
    GetSelfFromData>
{
private:
    template <bool Enable, std::size_t ND, typename... CArgs>
    struct ArgumentsChecker;

    template <typename T>
    using DecayTypeConverter = typename API::template Converter<typename ConverterDecay<T>::type>;

    template <std::size_t ND, typename... CArgs>
    struct ArgumentsChecker<true, ND, CArgs...>
    {
        static constexpr auto ArgsLength = sizeof...(CArgs);

        static bool Check(typename API::ContextType context, typename API::CallbackInfoType info)
        {
            if (ND == 0 ? API::GetArgsLen(info) != ArgsLength : API::GetArgsLen(info) < (ArgsLength - ND))
                return false;

            if (!ArgumentChecker<API, 0, ArgsLength - ND, CArgs...>::Check(info, context))
                return false;

            return true;
        }
    };

    template <std::size_t ND, typename... CArgs>
    struct ArgumentsChecker<false, ND, CArgs...>
    {
        static constexpr auto ArgsLength = sizeof...(CArgs);

        static bool Check(typename API::ContextType context, typename API::CallbackInfoType info)
        {
            return true;
        }
    };

    template <typename T, typename = void>
    struct ArgumentType
    {
        using type = typename std::decay<T>::type;
    };

    template <typename T>
    struct ArgumentType<T, typename std::enable_if<(is_objecttype<typename std::decay<T>::type>::value ||
                                                       is_uetype<typename std::decay<T>::type>::value) &&
                                                   std::is_lvalue_reference<T>::value>::type>
    {
        using type = std::reference_wrapper<typename std::decay<T>::type>;
    };

    static constexpr auto ArgsLength = sizeof...(Args);

    template <typename T, typename Enable = void>
    struct ReturnConverter
    {
        static typename API::ValueType Convert(typename API::ContextType context, T ret)
        {
            return DecayTypeConverter<typename std::remove_reference<T>::type>::toScript(
                context, std::forward<typename std::remove_reference<T>::type>(ret));
        }
    };

    template <typename T>
    struct ReturnConverter<T,
        typename std::enable_if<(ReturnByPointer || (std::is_reference<T>::value && !std::is_const<T>::value)) &&
                                (is_objecttype<typename std::decay<T>::type>::value ||
                                    is_uetype<typename std::decay<T>::type>::value)>::type>
    {
        static typename API::ValueType Convert(typename API::ContextType context, typename std::decay<T>::type ret)
        {
            return DecayTypeConverter<typename std::decay<T>::type*>::toScript(context, &ret);
        }
    };

    template <typename T, typename Enable = void>
    struct ArgumentHolder
    {
        typename ArgumentType<T>::type Arg;

        using ArgumentDecayType = typename std::decay<T>::type;

        ArgumentHolder(std::tuple<typename API::ContextType, typename API::ValueType> info)
            : Arg(DecayTypeConverter<ArgumentDecayType>::toCpp(std::get<0>(info), std::get<1>(info)))
        {
        }

        typename ArgumentType<T>::type& GetArgument()
        {
            return Arg;
        }

        void SetRef(typename API::ContextType context, typename API::ValueType holder)
        {
        }
    };

    template <typename T>
    struct ArgumentHolder<T,
        typename std::enable_if<
            (is_objecttype<typename std::decay<T>::type>::value || is_uetype<typename std::decay<T>::type>::value) &&
            std::is_lvalue_reference<T>::value && !std::is_const<typename std::remove_reference<T>::type>::value &&
            std::is_constructible<typename std::decay<T>::type>::value &&
            std::is_copy_constructible<typename std::decay<T>::type>::value &&
            std::is_destructible<typename std::decay<T>::type>::value>::type>
    {
        typename ArgumentType<T>::type Arg;
        typename ArgumentBufferType<T>::type Buf;

        ArgumentHolder(std::tuple<typename API::ContextType, typename API::ValueType> info)
            : Arg(*DecayTypeConverter<typename ArgumentType<T>::type>::toCpp(std::get<0>(info), std::get<1>(info)))
        {
            if (&(Arg.get()) == nullptr)
            {
                Arg = Buf;
            }
        }

        ArgumentHolder(const ArgumentHolder&& other) noexcept : Arg(other.Arg)
        {
            if (&(other.Buf) == &(other.Arg.get()))
            {
                Arg = Buf;
            }
        }

        typename ArgumentType<T>::type& GetArgument()
        {
            return Arg;
        }

        void SetRef(typename API::ContextType context, typename API::ValueType holder)
        {
            if (&Buf != &(Arg.get()))
            {
                return;
            }
            // new object and set
            API::UpdateRefValue(
                context, holder, API::template Converter<typename std::decay<T>::type>::toScript(context, Arg.get()));
        }
    };

    template <typename T>
    struct ArgumentHolder<T,
        typename std::enable_if<
            (is_objecttype<typename std::decay<T>::type>::value || is_uetype<typename std::decay<T>::type>::value) &&
            std::is_lvalue_reference<T>::value && !std::is_const<typename std::remove_reference<T>::type>::value &&
            (!std::is_constructible<typename std::decay<T>::type>::value ||
                !std::is_copy_constructible<typename std::decay<T>::type>::value ||
                !std::is_destructible<typename std::decay<T>::type>::value)>::type>
    {
        typename ArgumentType<T>::type Arg;

        // there may be nullptr ref
        ArgumentHolder(std::tuple<typename API::ContextType, typename API::ValueType> info)
            : Arg(*DecayTypeConverter<typename ArgumentType<T>::type>::toCpp(std::get<0>(info), std::get<1>(info)))
        {
        }

        typename ArgumentType<T>::type& GetArgument()
        {
            return Arg;
        }

        void SetRef(typename API::ContextType context, typename API::ValueType holder)
        {
        }
    };

    template <typename T>
    struct ArgumentHolder<T,
        typename std::enable_if<
            (is_objecttype<typename std::decay<T>::type>::value || is_uetype<typename std::decay<T>::type>::value) &&
            std::is_lvalue_reference<T>::value && std::is_const<typename std::remove_reference<T>::type>::value>::type>
    {
        typename ArgumentType<T>::type Arg;

        // there may be nullptr ref
        ArgumentHolder(std::tuple<typename API::ContextType, typename API::ValueType> info)
            : Arg(*DecayTypeConverter<typename std::decay<T>::type*>::toCpp(std::get<0>(info), std::get<1>(info)))
        {
        }

        typename ArgumentType<T>::type& GetArgument()
        {
            return Arg;
        }

        void SetRef(typename API::ContextType context, typename API::ValueType holder)
        {
        }
    };

    template <typename T>
    struct ArgumentHolder<T,
        typename std::enable_if<!is_objecttype<typename std::decay<T>::type>::value &&
                                !is_uetype<typename std::decay<T>::type>::value && std::is_lvalue_reference<T>::value &&
                                !std::is_const<typename std::remove_reference<T>::type>::value>::type>
    {
        typename ArgumentType<T>::type Arg;

        using ArgumentDecayType = typename std::decay<T>::type;

        ArgumentHolder(std::tuple<typename API::ContextType, typename API::ValueType> info)
            : Arg(DecayTypeConverter<std::reference_wrapper<ArgumentDecayType>>::toCpp(std::get<0>(info), std::get<1>(info)))
        {
        }

        typename ArgumentType<T>::type& GetArgument()
        {
            return Arg;
        }

        void SetRef(typename API::ContextType context, typename API::ValueType holder)
        {
            API::UpdateRefValue(context, holder, API::template Converter<typename std::decay<T>::type>::toScript(context, Arg));
        }
    };

    template <typename T>
    struct ArgumentHolder<T,
        typename std::enable_if<ScriptTypePtrAsRef && is_script_type<typename std::remove_pointer<T>::type>::value &&
                                !std::is_const<typename std::remove_pointer<T>::type>::value && std::is_pointer<T>::value>::type>
    {
        T Arg = nullptr;
        using BuffType = typename std::remove_pointer<T>::type;
        BuffType Buf;

        ArgumentHolder(std::tuple<typename API::ContextType, typename API::ValueType> info)
            : Buf(DecayTypeConverter<std::reference_wrapper<BuffType>>::toCpp(std::get<0>(info), std::get<1>(info)))
        {
        }

        T GetArgument()
        {
            return Arg ? Arg : &Buf;
        }

        void SetRef(typename API::ContextType context, typename API::ValueType holder)
        {
            API::UpdateRefValue(context, holder, API::template Converter<BuffType>::toScript(context, Buf));
        }
    };

    template <typename T>
    struct ArgumentHolder<T,
        typename std::enable_if<!ScriptTypePtrAsRef && is_script_type<typename std::remove_pointer<T>::type>::value &&
                                !std::is_const<typename std::remove_pointer<T>::type>::value && std::is_pointer<T>::value>::type>
    {
        T Arg = nullptr;

        ArgumentHolder(std::tuple<typename API::ContextType, typename API::ValueType> info)
            : Arg(DecayTypeConverter<T>::toCpp(std::get<0>(info), std::get<1>(info)))
        {
        }

        T GetArgument()
        {
            return Arg;
        }

        void SetRef(typename API::ContextType context, typename API::ValueType holder)
        {
        }
    };

    template <typename T>
    struct ArgumentHolder<T, typename std::enable_if<API::template CustomArgumentBufferType<T>::enable>::type>
    {
        typename ArgumentType<T>::type Arg;

        typename API::template CustomArgumentBufferType<T>::type Buf;

        ArgumentHolder(std::tuple<typename API::ContextType, typename API::ValueType> info)
            : Buf(std::get<0>(info), std::get<1>(info))
        {
            Arg = Buf.Data();
        }

        typename ArgumentType<T>::type GetArgument()
        {
            return Arg;
        }

        void SetRef(typename API::ContextType context, typename API::ValueType holder)
        {
        }
    };

    using ArgumentsHolder = std::tuple<ArgumentHolder<Args>...>;

    template <int, typename...>
    struct RefValuesSync
    {
        static void Sync(typename API::ContextType context, typename API::CallbackInfoType info, ArgumentsHolder& cppArgHolders)
        {
        }
    };

    template <int Pos, typename T, typename... Rest>
    struct RefValuesSync<Pos, T, Rest...>
    {
        static void Sync(typename API::ContextType context, typename API::CallbackInfoType info, ArgumentsHolder& cppArgHolders)
        {
            std::get<Pos>(cppArgHolders).SetRef(context, API::GetArg(info, Pos));
            RefValuesSync<Pos + 1, Rest...>::Sync(context, info, cppArgHolders);
        }
    };

    template <int Skip, int Pos, typename... FullArgs>
    struct DefaultValueSetter;

    template <int Skip, int Pos, typename T, typename... FullArgs>
    struct DefaultValueSetter<Skip, Pos, T, FullArgs...> : DefaultValueSetter<Skip - 1, Pos + 1, FullArgs...>
    {
    };

    template <int Pos, typename T, typename... FullArgs>
    struct DefaultValueSetter<0, Pos, T, FullArgs...>
    {
        template <class T1, class... DefaultArguments>
        static void Set(ArgumentsHolder& cppArgHolders, int argCount, T1 defaultValue, const DefaultArguments&... rest)
        {
            if (argCount <= Pos)
            {
                std::get<Pos>(cppArgHolders).Arg = defaultValue;
            }
            DefaultValueSetter<0, Pos + 1, FullArgs...>::Set(cppArgHolders, argCount, rest...);
        }
    };

    template <int Pos>
    struct DefaultValueSetter<0, Pos>
    {
        static void Set(ArgumentsHolder& cppArgHolders, int argCount)
        {
        }
    };

    template <typename Func, size_t... index, class... DefaultArguments>
    static
        typename std::enable_if<std::is_same<typename internal::traits::FunctionTrait<Func>::ReturnType, void>::value, bool>::type
        call(Func& func, typename API::CallbackInfoType info, std::index_sequence<index...>, DefaultArguments&&... defaultValues)
    {
        auto context = API::GetContext(info);

        if (!ArgumentsChecker<CheckArguments, sizeof...(DefaultArguments), Args...>::Check(context, info))
            return false;

        ArgumentsHolder cppArgHolders(
            std::tuple<typename API::ContextType, typename API::ValueType>{context, API::GetArg(info, index)}...);

        DefaultValueSetter<sizeof...(Args) - sizeof...(DefaultArguments), 0, typename std::decay<Args>::type...>::Set(
            cppArgHolders, API::GetArgsLen(info), std::forward<DefaultArguments>(defaultValues)...);

        func(std::forward<Args>(std::get<index>(cppArgHolders).GetArgument())...);

        RefValuesSync<0, Args...>::Sync(context, info, cppArgHolders);

        return true;
    }

    template <typename Func, size_t... index, class... DefaultArguments>
    static
        typename std::enable_if<!std::is_same<typename internal::traits::FunctionTrait<Func>::ReturnType, void>::value, bool>::type
        call(Func& func, typename API::CallbackInfoType info, std::index_sequence<index...>, DefaultArguments&&... defaultValues)
    {
        auto context = API::GetContext(info);

        if (!ArgumentsChecker<CheckArguments, sizeof...(DefaultArguments), Args...>::Check(context, info))
            return false;

        ArgumentsHolder cppArgHolders(
            std::tuple<typename API::ContextType, typename API::ValueType>{context, API::GetArg(info, index)}...);

        DefaultValueSetter<sizeof...(Args) - sizeof...(DefaultArguments), 0, typename std::decay<Args>::type...>::Set(
            cppArgHolders, API::GetArgsLen(info), std::forward<DefaultArguments>(defaultValues)...);

        API::SetReturn(info, ReturnConverter<Ret>::Convert(context,
                                 std::forward<Ret>(func(std::forward<Args>(std::get<index>(cppArgHolders).GetArgument())...))));

        RefValuesSync<0, Args...>::Sync(context, info, cppArgHolders);

        return true;
    }

    template <bool, typename Ins>
    struct SelfGetter;

    template <typename Ins>
    struct SelfGetter<false, Ins>
    {
        static Ins* Get(typename API::ContextType context, typename API::CallbackInfoType info)
        {
            return DecayTypeConverter<Ins*>::toCpp(context, API::GetHolder(info));
        }
    };

    template <typename Ins>
    struct SelfGetter<true, Ins>
    {
        static Ins* Get(typename API::ContextType context, typename API::CallbackInfoType info)
        {
            return static_cast<Ins*>(API::GetFunctionData(info));
        }
    };

    template <typename Ins, typename Func, size_t... index, class... DefaultArguments>
    static
        typename std::enable_if<std::is_same<typename internal::traits::FunctionTrait<Func>::ReturnType, void>::value, bool>::type
        callMethod(
            Func& func, typename API::CallbackInfoType info, std::index_sequence<index...>, DefaultArguments&&... defaultValues)
    {
        auto context = API::GetContext(info);

        auto self = SelfGetter<GetSelfFromData, Ins>::Get(context, info);

        if (!self)
        {
            API::ThrowException(info, "access a null object");
            return true;
        }

        if (!ArgumentsChecker<CheckArguments, sizeof...(DefaultArguments), Args...>::Check(context, info))
            return false;

        ArgumentsHolder cppArgHolders(
            std::tuple<typename API::ContextType, typename API::ValueType>{context, API::GetArg(info, index)}...);

        DefaultValueSetter<sizeof...(Args) - sizeof...(DefaultArguments), 0, typename std::decay<Args>::type...>::Set(
            cppArgHolders, API::GetArgsLen(info), std::forward<DefaultArguments>(defaultValues)...);

        (self->*func)(std::forward<Args>(std::get<index>(cppArgHolders).GetArgument())...);

        RefValuesSync<0, Args...>::Sync(context, info, cppArgHolders);

        return true;
    }

    template <typename Ins, typename Func, size_t... index, class... DefaultArguments>
    static
        typename std::enable_if<!std::is_same<typename internal::traits::FunctionTrait<Func>::ReturnType, void>::value, bool>::type
        callMethod(
            Func& func, typename API::CallbackInfoType info, std::index_sequence<index...>, DefaultArguments&&... defaultValues)
    {
        auto context = API::GetContext(info);

        auto self = SelfGetter<GetSelfFromData, Ins>::Get(context, info);

        if (!self)
        {
            API::ThrowException(info, "access a null object");
            return true;
        }

        if (!ArgumentsChecker<CheckArguments, sizeof...(DefaultArguments), Args...>::Check(context, info))
            return false;

        ArgumentsHolder cppArgHolders(
            std::tuple<typename API::ContextType, typename API::ValueType>{context, API::GetArg(info, index)}...);

        DefaultValueSetter<sizeof...(Args) - sizeof...(DefaultArguments), 0, typename std::decay<Args>::type...>::Set(
            cppArgHolders, API::GetArgsLen(info), std::forward<DefaultArguments>(defaultValues)...);

        API::SetReturn(
            info, ReturnConverter<Ret>::Convert(context,
                      std::forward<Ret>((self->*func)(std::forward<Args>(std::get<index>(cppArgHolders).GetArgument())...))));

        RefValuesSync<0, Args...>::Sync(context, info, cppArgHolders);

        return true;
    }

    template <typename Ins, typename Func, size_t... index, class... DefaultArguments>
    static
        typename std::enable_if<std::is_same<typename internal::traits::FunctionTrait<Func>::ReturnType, void>::value, bool>::type
        callExtension(
            Func& func, typename API::CallbackInfoType info, std::index_sequence<index...>, DefaultArguments&&... defaultValues)
    {
        auto context = API::GetContext(info);

        auto self = DecayTypeConverter<Ins*>::toCpp(context, API::GetHolder(info));

        if (!self)
        {
            API::ThrowException(info, "access a null object");
            return true;
        }

        if (!ArgumentsChecker<CheckArguments, sizeof...(DefaultArguments), Args...>::Check(context, info))
            return false;

        ArgumentsHolder cppArgHolders(
            std::tuple<typename API::ContextType, typename API::ValueType>{context, API::GetArg(info, index)}...);

        DefaultValueSetter<sizeof...(Args) - sizeof...(DefaultArguments), 0, typename std::decay<Args>::type...>::Set(
            cppArgHolders, API::GetArgsLen(info), std::forward<DefaultArguments>(defaultValues)...);

        func(*self, std::forward<Args>(std::get<index>(cppArgHolders).GetArgument())...);

        RefValuesSync<0, Args...>::Sync(context, info, cppArgHolders);

        return true;
    }

    template <typename Ins, typename Func, size_t... index, class... DefaultArguments>
    static
        typename std::enable_if<!std::is_same<typename internal::traits::FunctionTrait<Func>::ReturnType, void>::value, bool>::type
        callExtension(
            Func& func, typename API::CallbackInfoType info, std::index_sequence<index...>, DefaultArguments&&... defaultValues)
    {
        auto context = API::GetContext(info);

        auto self = DecayTypeConverter<Ins*>::toCpp(context, API::GetHolder(info));

        if (!self)
        {
            API::ThrowException(info, "access a null object");
            return true;
        }

        if (!ArgumentsChecker<CheckArguments, sizeof...(DefaultArguments), Args...>::Check(context, info))
            return false;

        ArgumentsHolder cppArgHolders(
            std::tuple<typename API::ContextType, typename API::ValueType>{context, API::GetArg(info, index)}...);

        DefaultValueSetter<sizeof...(Args) - sizeof...(DefaultArguments), 0, typename std::decay<Args>::type...>::Set(
            cppArgHolders, API::GetArgsLen(info), std::forward<DefaultArguments>(defaultValues)...);

        API::SetReturn(
            info, ReturnConverter<Ret>::Convert(context,
                      std::forward<Ret>(func(*self, std::forward<Args>(std::get<index>(cppArgHolders).GetArgument())...))));

        RefValuesSync<0, Args...>::Sync(context, info, cppArgHolders);

        return true;
    }

public:
    template <typename Func, class... DefaultArguments>
    static bool call(Func&& func, typename API::CallbackInfoType info, DefaultArguments&&... defaultValues)
    {
        static_assert(sizeof...(Args) >= sizeof...(DefaultArguments), "too many default arguments");
#if defined(WITH_THROW_IN_CPP)
#if !defined(THREAD_LOCAL_IMPL_THROW)
        try
        {
#else
        // init
        ExceptionHandle<API>::TripleOp(info, nullptr, false);
#endif
#endif
            return call(func, info, std::make_index_sequence<ArgsLength>(), std::forward<DefaultArguments>(defaultValues)...);
#if defined(WITH_THROW_IN_CPP)
#if !defined(THREAD_LOCAL_IMPL_THROW)
        }
        catch (std::exception& e)
        {
            API::ThrowException(info, e.what());
            return true;
        }
#endif
#endif
    }

    template <typename Ins, typename Func, class... DefaultArguments>
    static bool callMethod(Func&& func, typename API::CallbackInfoType info, DefaultArguments&&... defaultValues)
    {
        static_assert(sizeof...(Args) >= sizeof...(DefaultArguments), "too many default arguments");
#if defined(WITH_THROW_IN_CPP)
#if !defined(THREAD_LOCAL_IMPL_THROW)
        try
        {
#else
        // init
        ExceptionHandle<API>::TripleOp(info, nullptr, false);
#endif
#endif
            return callMethod<Ins>(
                func, info, std::make_index_sequence<ArgsLength>(), std::forward<DefaultArguments>(defaultValues)...);
#if defined(WITH_THROW_IN_CPP)
#if !defined(THREAD_LOCAL_IMPL_THROW)
        }
        catch (std::exception& e)
        {
            API::ThrowException(info, e.what());
            return true;
        }
#endif
#endif
    }

    template <typename Ins, typename Func, class... DefaultArguments>
    static bool callExtension(Func&& func, typename API::CallbackInfoType info, DefaultArguments&&... defaultValues)
    {
        static_assert(sizeof...(Args) >= sizeof...(DefaultArguments), "too many default arguments");
#if defined(WITH_THROW_IN_CPP)
#if !defined(THREAD_LOCAL_IMPL_THROW)
        try
        {
#else
        // init
        ExceptionHandle<API>::TripleOp(info, nullptr, false);
#endif
#endif
            return callExtension<Ins>(
                func, info, std::make_index_sequence<ArgsLength>(), std::forward<DefaultArguments>(defaultValues)...);
#if defined(WITH_THROW_IN_CPP)
#if !defined(THREAD_LOCAL_IMPL_THROW)
        }
        catch (std::exception& e)
        {
            API::ThrowException(info, e.what());
            return true;
        }
#endif
#endif
    }
};

}    // namespace internal

template <typename API, typename T, T, bool ReturnByPointer = false, bool ScriptTypePtrAsRef = true, bool GetSelfFromData = false>
struct FuncCallWrapper;

template <typename API, typename Ret, typename... Args, Ret (*func)(Args...), bool ReturnByPointer, bool ScriptTypePtrAsRef,
    bool GetSelfFromData>
struct FuncCallWrapper<API, Ret (*)(Args...), func, ReturnByPointer, ScriptTypePtrAsRef, GetSelfFromData>
{
    static void call(typename API::CallbackInfoType info)
    {
        using Helper = internal::FuncCallHelper<API, std::pair<Ret, std::tuple<Args...>>, false, ReturnByPointer,
            ScriptTypePtrAsRef, GetSelfFromData>;
        Helper::call(func, info);
    }

    static bool overloadCall(typename API::CallbackInfoType info)
    {
        using Helper = internal::FuncCallHelper<API, std::pair<Ret, std::tuple<Args...>>, true, ReturnByPointer, ScriptTypePtrAsRef,
            GetSelfFromData>;
        return Helper::call(func, info);
    }
    static void checkedCall(typename API::CallbackInfoType info)
    {
        using Helper = internal::FuncCallHelper<API, std::pair<Ret, std::tuple<Args...>>, true, ReturnByPointer, ScriptTypePtrAsRef,
            GetSelfFromData>;
        if (!Helper::call(func, info))
        {
            API::ThrowException(info, "invalid parameter!");
        }
    }
    template <class... DefaultArguments>
    static void callWithDefaultValues(typename API::CallbackInfoType info, DefaultArguments&&... defaultValues)
    {
        using Helper = internal::FuncCallHelper<API, std::pair<Ret, std::tuple<Args...>>, false, ReturnByPointer,
            ScriptTypePtrAsRef, GetSelfFromData>;
        Helper::call(func, info, std::forward<DefaultArguments>(defaultValues)...);
    }
    template <class... DefaultArguments>
    static bool overloadCallWithDefaultValues(typename API::CallbackInfoType info, DefaultArguments&&... defaultValues)
    {
        using Helper = internal::FuncCallHelper<API, std::pair<Ret, std::tuple<Args...>>, true, ReturnByPointer, ScriptTypePtrAsRef,
            GetSelfFromData>;
        return Helper::call(func, info, std::forward<DefaultArguments>(defaultValues)...);
    }
    static const CFunctionInfo* info(unsigned int defaultCount = 0)
    {
        return CFunctionInfoByPtrImpl<Ret (*)(Args...), func, ScriptTypePtrAsRef>::get(defaultCount);
    }
    template <typename FirstType, typename... RestTypes>
    struct ExtensionCallHelper
    {
        template <class... DefaultArguments>
        static void call(typename API::CallbackInfoType info, DefaultArguments&&... defaultValues)
        {
            using FirstDecayType = typename std::decay<FirstType>::type;
            using Helper = internal::FuncCallHelper<API, std::pair<Ret, std::tuple<RestTypes...>>, false, ReturnByPointer,
                ScriptTypePtrAsRef, GetSelfFromData>;
            Helper::template callExtension<FirstDecayType>(func, info, std::forward<DefaultArguments>(defaultValues)...);
        }
    };
    template <class... DefaultArguments>
    static void callExtensionWithDefaultValues(typename API::CallbackInfoType info, DefaultArguments&&... defaultValues)
    {
        ExtensionCallHelper<Args...>::call(info, std::forward<DefaultArguments>(defaultValues)...);
    }
    static const CFunctionInfo* extensionInfo(unsigned int defaultCount = 0)
    {
        return CFunctionInfoByPtrImpl<Ret (*)(Args...), func, ScriptTypePtrAsRef, 1>::get(defaultCount);
    }
};

template <typename API, typename Inc, typename Ret, typename... Args, Ret (Inc::*func)(Args...), bool ReturnByPointer,
    bool ScriptTypePtrAsRef, bool GetSelfFromData>
struct FuncCallWrapper<API, Ret (Inc::*)(Args...), func, ReturnByPointer, ScriptTypePtrAsRef, GetSelfFromData>
{
    static void call(typename API::CallbackInfoType info)
    {
        using Helper = internal::FuncCallHelper<API, std::pair<Ret, std::tuple<Args...>>, false, ReturnByPointer,
            ScriptTypePtrAsRef, GetSelfFromData>;
        Helper::template callMethod<Inc>(func, info);
    }

    static bool overloadCall(typename API::CallbackInfoType info)
    {
        using Helper = internal::FuncCallHelper<API, std::pair<Ret, std::tuple<Args...>>, true, ReturnByPointer, ScriptTypePtrAsRef,
            GetSelfFromData>;
        return Helper::template callMethod<Inc, decltype(func)>(func, info);
    }
    static void checkedCall(typename API::CallbackInfoType info)
    {
        using Helper = internal::FuncCallHelper<API, std::pair<Ret, std::tuple<Args...>>, true, ReturnByPointer, ScriptTypePtrAsRef,
            GetSelfFromData>;
        if (!Helper::template callMethod<Inc, decltype(func)>(func, info))
        {
            API::ThrowException(info, "invalid parameter!");
        }
    }
    template <class... DefaultArguments>
    static void callWithDefaultValues(typename API::CallbackInfoType info, DefaultArguments&&... defaultValues)
    {
        using Helper = internal::FuncCallHelper<API, std::pair<Ret, std::tuple<Args...>>, false, ReturnByPointer,
            ScriptTypePtrAsRef, GetSelfFromData>;
        Helper::template callMethod<Inc>(func, info, std::forward<DefaultArguments>(defaultValues)...);
    }
    template <class... DefaultArguments>
    static bool overloadCallWithDefaultValues(typename API::CallbackInfoType info, DefaultArguments&&... defaultValues)
    {
        using Helper = internal::FuncCallHelper<API, std::pair<Ret, std::tuple<Args...>>, true, ReturnByPointer, ScriptTypePtrAsRef,
            GetSelfFromData>;
        return Helper::template callMethod<Inc>(func, info, std::forward<DefaultArguments>(defaultValues)...);
    }
    static const CFunctionInfo* info(unsigned int defaultCount = 0)
    {
        return CFunctionInfoByPtrImpl<Ret (Inc::*)(Args...), func, ScriptTypePtrAsRef>::get(defaultCount);
    }
};

// TODO: Similar logic...
template <typename API, typename Inc, typename Ret, typename... Args, Ret (Inc::*func)(Args...) const, bool ReturnByPointer,
    bool ScriptTypePtrAsRef, bool GetSelfFromData>
struct FuncCallWrapper<API, Ret (Inc::*)(Args...) const, func, ReturnByPointer, ScriptTypePtrAsRef, GetSelfFromData>
{
    static void call(typename API::CallbackInfoType info)
    {
        using Helper = internal::FuncCallHelper<API, std::pair<Ret, std::tuple<Args...>>, false, ReturnByPointer,
            ScriptTypePtrAsRef, GetSelfFromData>;
        Helper::template callMethod<Inc>(func, info);
    }

    static bool overloadCall(typename API::CallbackInfoType info)
    {
        using Helper = internal::FuncCallHelper<API, std::pair<Ret, std::tuple<Args...>>, true, ReturnByPointer, ScriptTypePtrAsRef,
            GetSelfFromData>;
        return Helper::template callMethod<Inc, decltype(func)>(func, info);
    }
    static void checkedCall(typename API::CallbackInfoType info)
    {
        using Helper = internal::FuncCallHelper<API, std::pair<Ret, std::tuple<Args...>>, true, ReturnByPointer, ScriptTypePtrAsRef,
            GetSelfFromData>;
        if (!Helper::template callMethod<Inc, decltype(func)>(func, info))
        {
            API::ThrowException(info, "invalid parameter!");
        }
    }
    template <class... DefaultArguments>
    static void callWithDefaultValues(typename API::CallbackInfoType info, DefaultArguments&&... defaultValues)
    {
        using Helper = internal::FuncCallHelper<API, std::pair<Ret, std::tuple<Args...>>, false, ReturnByPointer,
            ScriptTypePtrAsRef, GetSelfFromData>;
        Helper::template callMethod<Inc>(func, info, std::forward<DefaultArguments>(defaultValues)...);
    }
    template <class... DefaultArguments>
    static bool overloadCallWithDefaultValues(typename API::CallbackInfoType info, DefaultArguments&&... defaultValues)
    {
        using Helper = internal::FuncCallHelper<API, std::pair<Ret, std::tuple<Args...>>, true, ReturnByPointer, ScriptTypePtrAsRef,
            GetSelfFromData>;
        return Helper::template callMethod<Inc>(func, info, std::forward<DefaultArguments>(defaultValues)...);
    }
    static const CFunctionInfo* info(unsigned int defaultCount = 0)
    {
        return CFunctionInfoByPtrImpl<Ret (Inc::*)(Args...) const, func, ScriptTypePtrAsRef>::get(defaultCount);
    }
};

template <typename API, typename T, typename... Args>
struct ConstructorWrapper
{
private:
    template <typename CT>
    using DecayTypeConverter = typename API::template Converter<typename internal::ConverterDecay<CT>::type>;

    static constexpr auto ArgsLength = sizeof...(Args);

    template <class FT, typename Enable = void>
    struct Finalize
    {
        static void Do(const FT*)
        {
        }
    };

    template <class FT>
    struct Finalize<FT, typename std::enable_if<std::is_destructible<FT>::value>::type>
    {
        static void Do(const FT* Ptr)
        {
            delete Ptr;
        }
    };

    template <size_t... index>
    static void* call(typename API::CallbackInfoType info, std::index_sequence<index...>)
    {
        auto context = API::GetContext(info);

        if (API::GetArgsLen(info) != ArgsLength)
        {
            return nullptr;
        }

        if (!internal::ArgumentChecker<API, 0, ArgsLength, Args...>::Check(info, context))
        {
            return nullptr;
        }

#if defined(WITH_THROW_IN_CPP) && defined(THREAD_LOCAL_IMPL_THROW)
        internal::ExceptionHandle<API>::TripleOp(info, nullptr, false);
#endif
        T* obj = new T(DecayTypeConverter<Args>::toCpp(context, API::GetArg(info, index))...);
#if defined(WITH_THROW_IN_CPP) && defined(THREAD_LOCAL_IMPL_THROW)
        // get state
        if (internal::ExceptionHandle<API>::TripleOp(info, nullptr, true))
        {
            Finalize<T>::Do(obj);
            obj = nullptr;
        }
#endif
        return obj;
    }

public:
    static void* call(typename API::CallbackInfoType info)
    {
        return call(info, std::make_index_sequence<ArgsLength>());
    }
    static void* checkedCall(typename API::CallbackInfoType info)
    {
#if defined(WITH_THROW_IN_CPP) && !defined(THREAD_LOCAL_IMPL_THROW)
        try
        {
#endif
            auto ret = call(info);

            if (!ret)
            {
#if defined(WITH_THROW_IN_CPP) && defined(THREAD_LOCAL_IMPL_THROW)
                // get state, if not exception
                if (!internal::ExceptionHandle<API>::TripleOp(info, nullptr, true))
#endif
                    API::ThrowException(info, "invalid parameter!");
            }
            return ret;
#if defined(WITH_THROW_IN_CPP) && !defined(THREAD_LOCAL_IMPL_THROW)
        }
        catch (std::exception& e)
        {
            API::ThrowException(info, e.what());
        }
        return nullptr;
#endif
    }
    static const CFunctionInfo* info(unsigned int defaultCount = 0)
    {
        return CFunctionInfoImpl<T, true, 0, Args...>::get(defaultCount);
    }
};

template <typename API, typename... OverloadWraps>
struct ConstructorsCombiner
{
    template <typename API::InitializeFuncType Func, typename API::InitializeFuncType... Rest>
    struct ConstructorRecursion
    {
        static void* _call(typename API::CallbackInfoType info)
        {
            auto Ret = Func(info);
            if (Ret)
                return Ret;

#if defined(WITH_THROW_IN_CPP) && defined(THREAD_LOCAL_IMPL_THROW)
            // get state, if not exception
            if (internal::ExceptionHandle<API>::TripleOp(info, nullptr, true))
            {
                return Ret;
            }
#endif
            // try next overload
            return ConstructorRecursion<Rest...>::_call(info);
        }

        static void* call(typename API::CallbackInfoType info)
        {
#if defined(WITH_THROW_IN_CPP) && !defined(THREAD_LOCAL_IMPL_THROW)
            try
            {
#endif
                auto Ret = _call(info);
                if (!Ret)
                {
#if defined(WITH_THROW_IN_CPP) && defined(THREAD_LOCAL_IMPL_THROW)
                    // get state, if not exception
                    if (!internal::ExceptionHandle<API>::TripleOp(info, nullptr, true))
#endif
                        API::ThrowException(info, "invalid parameter!");
                }
                return Ret;
#if defined(WITH_THROW_IN_CPP) && !defined(THREAD_LOCAL_IMPL_THROW)
            }
            catch (std::exception& e)
            {
                API::ThrowException(info, e.what());
            }
            return nullptr;
#endif
        }
    };

    template <typename API::InitializeFuncType Func>
    struct ConstructorRecursion<Func>
    {
        static void* _call(typename API::CallbackInfoType info)
        {
            return Func(info);
        }
    };

    static void* call(typename API::CallbackInfoType info)
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

template <typename API, typename... OverloadWraps>
struct OverloadsCombiner
{
    typedef bool (*V8FunctionCallbackWithBoolRet)(typename API::CallbackInfoType info);

    template <V8FunctionCallbackWithBoolRet Func, V8FunctionCallbackWithBoolRet... Rest>
    struct OverloadsRecursion
    {
        static bool _call(typename API::CallbackInfoType info)
        {
            if (Func(info))
                return true;
            else
                return OverloadsRecursion<Rest...>::_call(info);
        }

        static void call(typename API::CallbackInfoType info)
        {
            if (!_call(info))
            {
                API::ThrowException(info, "invalid parameter!");
            }
        }
    };

    template <V8FunctionCallbackWithBoolRet Func>
    struct OverloadsRecursion<Func>
    {
        static bool _call(typename API::CallbackInfoType info)
        {
            return Func(info);
        }
    };

    static void call(typename API::CallbackInfoType info)
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

template <class T>
struct IsBoundedArray : std::false_type
{
};

template <class T, std::size_t N>
struct IsBoundedArray<T[N]> : std::true_type
{
};

template <typename API, typename T, T, typename IncPass = void, typename Enable = void>
struct PropertyWrapper;

template <typename API, class Ins, class Ret, Ret Ins::*member, typename IncPass>
struct PropertyWrapper<API, Ret Ins::*, member, IncPass,
    typename std::enable_if<!is_objecttype<Ret>::value && !is_uetype<Ret>::value && !IsBoundedArray<Ret>::value>::type>
{
    template <typename T>
    using DecayTypeConverter = typename API::template Converter<typename internal::ConverterDecay<T>::type>;

    using SelfType = typename std::conditional<std::is_same<IncPass, void>::value, Ins, IncPass>::type;

    static void getter(typename API::CallbackInfoType info)
    {
        auto context = API::GetContext(info);
        auto self = DecayTypeConverter<SelfType*>::toCpp(context, API::GetThis(info));
        if (!self)
        {
            API::ThrowException(info, "access a null object");
            return;
        }
        API::SetReturn(info, DecayTypeConverter<Ret>::toScript(context, self->*member));
    }

    static void setter(typename API::CallbackInfoType info)
    {
        auto context = API::GetContext(info);
        auto self = DecayTypeConverter<SelfType*>::toCpp(context, API::GetThis(info));
        if (!self)
        {
            API::ThrowException(info, "access a null object");
            return;
        }
        self->*member = DecayTypeConverter<Ret>::toCpp(context, API::GetArg(info, 0));
    }

    static const CTypeInfo* info()
    {
        return CTypeInfoImpl<Ret, false>::get();
    }
};

template <typename API, class Ins, class Ret, Ret Ins::*member, typename IncPass>
struct PropertyWrapper<API, Ret Ins::*, member, IncPass,
    typename std::enable_if<!is_objecttype<Ret>::value && !is_uetype<Ret>::value && IsBoundedArray<Ret>::value>::type>
{
    template <typename T>
    using DecayTypeConverter = typename API::template Converter<typename internal::ConverterDecay<T>::type>;

    using SelfType = typename std::conditional<std::is_same<IncPass, void>::value, Ins, IncPass>::type;

    static void getter(typename API::CallbackInfoType info)
    {
        auto context = API::GetContext(info);
        auto self = DecayTypeConverter<SelfType*>::toCpp(context, API::GetThis(info));
        if (!self)
        {
            API::ThrowException(info, "access a null object");
            return;
        }

        API::SetReturn(info, API::template Converter<Ret>::toScript(context, self->*member));
    }

    static void setter(typename API::CallbackInfoType info)
    {
        auto context = API::GetContext(info);
        auto self = DecayTypeConverter<SelfType*>::toCpp(context, API::GetThis(info));
        if (!self)
        {
            API::ThrowException(info, "access a null object");
            return;
        }

        if (!API::template Converter<Ret>::accept(context, API::GetArg(info, 0)))
        {
            API::ThrowException(info, "invalid value for property");
            return;
        }
        auto Src = DecayTypeConverter<Ret>::toCpp(context, API::GetArg(info, 0));
        if (self->*member == Src)
        {
            return;
        }
        memcpy(self->*member, Src, sizeof(Ret));
    }

    static const CTypeInfo* info()
    {
        return CTypeInfoImpl<Ret, false>::get();
    }
};

template <typename API, class Ins, class Ret, Ret Ins::*member, typename IncPass>
struct PropertyWrapper<API, Ret Ins::*, member, IncPass,
    typename std::enable_if<is_objecttype<Ret>::value || is_uetype<Ret>::value>::type>
{
    template <typename T>
    using DecayTypeConverter = typename API::template Converter<typename internal::ConverterDecay<T>::type>;

    using SelfType = typename std::conditional<std::is_same<IncPass, void>::value, Ins, IncPass>::type;

    static void getter(typename API::CallbackInfoType info)
    {
        auto context = API::GetContext(info);
        auto self = DecayTypeConverter<SelfType*>::toCpp(context, API::GetThis(info));
        if (!self)
        {
            API::ThrowException(info, "access a null object");
            return;
        }
        auto ret = DecayTypeConverter<Ret*>::toScript(context, &(self->*member));
        API::template LinkOuter<Ins, Ret>(context, API::GetThis(info), ret);
        API::SetReturn(info, ret);
    }

    static void setter(typename API::CallbackInfoType info)
    {
        auto context = API::GetContext(info);
        auto self = DecayTypeConverter<SelfType*>::toCpp(context, API::GetThis(info));
        if (!self)
        {
            API::ThrowException(info, "access a null object");
            return;
        }
        self->*member = DecayTypeConverter<Ret>::toCpp(context, API::GetArg(info, 0));
    }

    static const CTypeInfo* info()
    {
        return CTypeInfoImpl<Ret, false>::get();
    }
};

template <typename API, typename Ret, Ret* Variable>
struct PropertyWrapper<API, Ret*, Variable>
{
    template <typename T>
    using DecayTypeConverter = typename API::template Converter<typename internal::ConverterDecay<T>::type>;

    static void getter(typename API::CallbackInfoType info)
    {
        auto context = API::GetContext(info);
        API::SetReturn(info, DecayTypeConverter<Ret>::toScript(context, *Variable));
    }

    static void setter(typename API::CallbackInfoType info)
    {
        auto context = API::GetContext(info);
        *Variable = DecayTypeConverter<Ret>::toCpp(context, API::GetArg(info, 0));
    }

    static const CTypeInfo* info()
    {
        return CTypeInfoImpl<Ret, false>::get();
    }
};

template <typename T, typename API, typename RegisterAPI>
class ClassDefineBuilder
{
    template <typename...>
    using sfina = ClassDefineBuilder<T, API, RegisterAPI>&;

public:
    const char* className_ = nullptr;

    const void* superTypeId_ = nullptr;

    std::vector<typename API::GeneralFunctionInfo> functions_{};

    std::vector<typename API::GeneralFunctionInfo> methods_{};

    std::vector<typename API::GeneralPropertyInfo> properties_{};

    std::vector<typename API::GeneralPropertyInfo> variables_{};

    typename API::InitializeFuncType constructor_{};

    std::vector<typename API::GeneralFunctionReflectionInfo> constructorInfos_{};
    std::vector<typename API::GeneralFunctionReflectionInfo> methodInfos_{};
    std::vector<typename API::GeneralFunctionReflectionInfo> functionInfos_{};
    std::vector<typename API::GeneralPropertyReflectionInfo> propertyInfos_{};
    std::vector<typename API::GeneralPropertyReflectionInfo> variableInfos_{};

    explicit ClassDefineBuilder(const char* className) : className_(className)
    {
    }

    template <typename S>
    ClassDefineBuilder<T, API, RegisterAPI>& Extends()
    {
        superTypeId_ = StaticTypeId<S>::get();
        return *this;
    }

    template <typename... Args>
    ClassDefineBuilder<T, API, RegisterAPI>& Constructor()
    {
        typename API::InitializeFuncType constructor = ConstructorWrapper<API, T, Args...>::checkedCall;
        constructor_ = constructor;
        constructorInfos_.push_back(
            typename API::GeneralFunctionReflectionInfo{"constructor", ConstructorWrapper<API, T, Args...>::info()});
        return *this;
    }

    ClassDefineBuilder<T, API, RegisterAPI>& Constructor(
        typename API::InitializeFuncType constructor, int length, const CFunctionInfo** infos)
    {
        for (int i = 0; i < length; i++)
        {
            constructorInfos_.push_back(typename API::GeneralFunctionReflectionInfo{"constructor", infos[i]});
        }
        constructor_ = constructor;
        return *this;
    }

    ClassDefineBuilder<T, API, RegisterAPI>& Function(
        const char* name, typename API::FunctionCallbackType func, const CFunctionInfo* info)
    {
        if (info)
        {
            functionInfos_.push_back(typename API::GeneralFunctionReflectionInfo{name, info});
        }
        functions_.push_back(typename API::GeneralFunctionInfo{name, func, nullptr, info});
        return *this;
    }

    ClassDefineBuilder<T, API, RegisterAPI>& Function(
        const char* name, typename API::FunctionCallbackType func, int length, const CFunctionInfo** infos)
    {
        for (int i = 0; i < length; i++)
        {
            functionInfos_.push_back(typename API::GeneralFunctionReflectionInfo{name, infos[i]});
        }
        functions_.push_back(typename API::GeneralFunctionInfo{name, func, nullptr, nullptr});
        return *this;
    }

    ClassDefineBuilder<T, API, RegisterAPI>& Method(
        const char* name, typename API::FunctionCallbackType func, const CFunctionInfo* info)
    {
        if (info)
        {
            methodInfos_.push_back(typename API::GeneralFunctionReflectionInfo{name, info});
        }
        methods_.push_back(typename API::GeneralFunctionInfo{name, func, nullptr, info});
        return *this;
    }

    ClassDefineBuilder<T, API, RegisterAPI>& Method(
        const char* name, typename API::FunctionCallbackType func, int length, const CFunctionInfo** infos)
    {
        for (int i = 0; i < length; i++)
        {
            methodInfos_.push_back(typename API::GeneralFunctionReflectionInfo{name, infos[i]});
        }
        methods_.push_back(typename API::GeneralFunctionInfo{name, func, nullptr, nullptr});
        return *this;
    }

    template <typename Func, Func func>
    ClassDefineBuilder<T, API, RegisterAPI>& MethodProxy(const char* name)
    {
        methods_.push_back(typename API::GeneralFunctionInfo{name,
            [](typename API::CallbackInfoType info) -> void
            {
                using Helper = internal::FuncCallHelper<API,
                    std::pair<typename internal::traits::FunctionTrait<Func>::ReturnType,
                        typename internal::traits::FunctionTrait<Func>::Arguments>,
                    false, false, true, false>;
                Helper::template callMethod<T>(func, info);
            },
            nullptr, nullptr});
        return *this;
    }

    ClassDefineBuilder<T, API, RegisterAPI>& Property(const char* name, typename API::FunctionCallbackType getter,
        typename API::FunctionCallbackType setter = nullptr, const CTypeInfo* type = nullptr)
    {
        if (type)
        {
            propertyInfos_.push_back(typename API::GeneralPropertyReflectionInfo{name, type});
        }
        properties_.push_back(typename API::GeneralPropertyInfo{name, getter, setter, nullptr});
        return *this;
    }

    template <typename Prop, Prop prop>
    ClassDefineBuilder<T, API, RegisterAPI>& PropertyProxy(const char* name)
    {
        properties_.push_back(typename API::GeneralPropertyInfo{
            name, &PropertyWrapper<API, Prop, prop, T>::getter, &PropertyWrapper<API, Prop, prop, T>::setter, nullptr});
        return *this;
    }

    ClassDefineBuilder<T, API, RegisterAPI>& Variable(const char* name, typename API::FunctionCallbackType getter,
        typename API::FunctionCallbackType setter = nullptr, const CTypeInfo* type = nullptr)
    {
        if (type)
        {
            variableInfos_.push_back(typename API::GeneralPropertyReflectionInfo{name, type});
        }
        variables_.push_back(typename API::GeneralPropertyInfo{name, getter, setter, nullptr});
        return *this;
    }

    typedef void (*FinalizeFuncType)(void* Ptr);

    template <class FC, typename Enable = void>
    struct FinalizeBuilder
    {
        static FinalizeFuncType Build()
        {
            return FinalizeFuncType{};
        }
    };

    template <class FC>
    struct FinalizeBuilder<FC, typename std::enable_if<std::is_destructible<FC>::value>::type>
    {
        static FinalizeFuncType Build()
        {
            return [](void* Ptr) { delete static_cast<FC*>(Ptr); };
        }
    };

    void Register()
    {
        Register(FinalizeBuilder<T>::Build());
    }

    void Register(FinalizeFuncType Finalize)
    {
        RegisterAPI::template Register<T>(Finalize, *this);
    }
};

}    // namespace PUERTS_NAMESPACE

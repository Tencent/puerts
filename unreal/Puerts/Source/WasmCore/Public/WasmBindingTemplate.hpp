/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once
#include "wasm3.h"
#include "m3_env.h"
#include "WasmCommonIncludes.h"
#include "Wasm3ExportDef.h"

typedef uint64_t* wasm_stack_type;
typedef void* wasm_mem_type;

template <typename T>
struct wasm_remove_const_ref
{
    using type = typename std::remove_const<typename std::remove_reference<T>::type>::type;
};

template <bool V>
struct true_false_type
{
    static constexpr bool value = V;
};

template <typename T, typename Enable = void>
struct _wasm_is_simple_type;

//定义简单的类型,该类型会直接被放在栈上
template <>
struct _wasm_is_simple_type<bool> : true_false_type<true>
{
};
// template<> struct _wasm_is_simple_type<char> : true_false_type<true> {};
// template<> struct _wasm_is_simple_type<unsigned char> : true_false_type<true> {};
template <>
struct _wasm_is_simple_type<int32> : true_false_type<true>
{
};
template <>
struct _wasm_is_simple_type<uint32> : true_false_type<true>
{
};
template <>
struct _wasm_is_simple_type<int64> : true_false_type<true>
{
};
template <>
struct _wasm_is_simple_type<uint64> : true_false_type<true>
{
};
template <>
struct _wasm_is_simple_type<float> : true_false_type<true>
{
};
template <>
struct _wasm_is_simple_type<double> : true_false_type<true>
{
};
// enum为true,非enum为false
template <typename T>
struct _wasm_is_simple_type<T, typename std::enable_if<std::is_enum<T>::value>::type> : true_false_type<true>
{
};
template <typename T>
struct _wasm_is_simple_type<T, typename std::enable_if<!std::is_enum<T>::value>::type> : true_false_type<false>
{
};

template <typename T>
struct wasm_is_simple_type
{
    static constexpr bool value = _wasm_is_simple_type<typename wasm_remove_const_ref<T>::type>::value;
};

static_assert(wasm_is_simple_type<const int&>::value, "");
static_assert(wasm_is_simple_type<int&>::value, "");
static_assert(wasm_is_simple_type<int>::value, "");
static_assert(wasm_is_simple_type<const int>::value, "");
static_assert(!wasm_is_simple_type<void*>::value, "");

//定义复杂类型,该类型会被当作指针放在栈上
template <typename T>
struct _wasm_is_complex_type
{
    //这里有点奇怪
    // 属性数量大于1的结构体当指针
    // 小于32的结构体当int32,小于64的结构体当int64,大于64的当指针
    // 我们判断不了属性数量，所以强制规定,结构体必须大于64
    static constexpr bool value =
        !wasm_is_simple_type<T>::value && std::is_class<T>::value && std::is_trivially_copyable<T>::value && (sizeof(T) > 8);
};

template <typename T>
struct wasm_is_complex_type
{
    static constexpr bool value = _wasm_is_complex_type<typename wasm_remove_const_ref<T>::type>::value;
};
template <>
struct wasm_is_complex_type<void>
{
    static constexpr bool value = false;
};

static_assert(!wasm_is_complex_type<void*>::value, "");

template <typename T>
struct wasm_is_support_pointer_type
{
    using No_PTr = typename std::remove_pointer<T>::type;
    static constexpr bool value =
        std::is_pointer<T>::value && !wasm_is_complex_type<No_PTr>::value && !wasm_is_simple_type<No_PTr>::value;
};

template <typename... Args>
struct wasm_is_all_support_type;

template <typename T>
struct wasm_is_all_support_type<T>
{
    static constexpr bool value =
        wasm_is_complex_type<T>::value || wasm_is_simple_type<T>::value || wasm_is_support_pointer_type<T>::value;
};

template <typename T, typename... Args>
struct wasm_is_all_support_type<T, Args...>
{
    static constexpr bool value = wasm_is_all_support_type<T>::value && wasm_is_all_support_type<Args...>::value;
};

template <typename T, typename Enabled = void>
struct _wasm_call_params_translator
{
};

template <>
struct _wasm_call_params_translator<float>
{
    using type = float;
};

template <>
struct _wasm_call_params_translator<double>
{
    using type = double;
};

template <typename T>
struct _wasm_call_params_translator<T, typename std::enable_if<wasm_is_simple_type<T>::value && (sizeof(T) <= 4)>::type>
{
    using type = int32;
};

template <typename T>
struct _wasm_call_params_translator<T,
    typename std::enable_if<wasm_is_simple_type<T>::value && (sizeof(T) > 4) && (sizeof(T) <= 8)>::type>
{
    using type = int64;
};

template <typename T>
struct _wasm_call_params_translator<T, typename std::enable_if<wasm_is_complex_type<T>::value>::type>
{
    using type = WASM_PTR;
};

template <typename T>
struct _wasm_call_params_translator<T, typename std::enable_if<wasm_is_support_pointer_type<T>::value>::type>
{
    using type = WASM_PTR;
};

template <typename T>
struct wasm_call_params_translator
{
    using translated_type = typename _wasm_call_params_translator<typename wasm_remove_const_ref<T>::type>::type;
};

template <typename T, typename U>
using is_enum_of_t = typename std::enable_if<std::is_enum<T>::value && std::is_same<std::underlying_type_t<T>, U>::value>::type;

template <char c>
struct m3_sig
{
    static const char value = c;
};
template <typename T, typename = void>
struct _m3_type_to_sig;

template <typename T>
struct _m3_type_to_sig<T, is_enum_of_t<T, int32_t>> : m3_sig<'i'>
{
};

template <class T>
struct _m3_type_to_sig<T, is_enum_of_t<T, int64_t>> : m3_sig<'I'>
{
};

template <>
struct _m3_type_to_sig<bool> : m3_sig<'i'>
{
};
template <>
struct _m3_type_to_sig<char> : m3_sig<'i'>
{
};
template <>
struct _m3_type_to_sig<unsigned char> : m3_sig<'i'>
{
};
template <>
struct _m3_type_to_sig<int32_t> : m3_sig<'i'>
{
};
template <>
struct _m3_type_to_sig<uint32_t> : m3_sig<'i'>
{
};
template <>
struct _m3_type_to_sig<int64_t> : m3_sig<'I'>
{
};
template <>
struct _m3_type_to_sig<uint64_t> : m3_sig<'I'>
{
};
template <>
struct _m3_type_to_sig<float> : m3_sig<'f'>
{
};
template <>
struct _m3_type_to_sig<double> : m3_sig<'F'>
{
};
template <>
struct _m3_type_to_sig<void> : m3_sig<'v'>
{
};
template <typename T>
struct _m3_type_to_sig<T, typename std::is_reference<T>::type> : m3_sig<'*'>
{
};
template <typename T>
struct _m3_type_to_sig<T, typename std::enable_if<wasm_is_complex_type<T>::value>::type> : m3_sig<'*'>
{
};
template <typename T>
struct _m3_type_to_sig<T, typename std::enable_if<wasm_is_support_pointer_type<T>::value>::type> : m3_sig<'*'>
{
};

template <typename T, typename Enable = void>
struct m3_type_to_sig;

//引用当指针处理
template <typename T>
struct m3_type_to_sig<T, typename std::enable_if<std::is_reference<T>::value>::type>
{
    using TT = typename wasm_remove_const_ref<T>::type;
    static const char value = '*';
};

template <typename T>
struct m3_type_to_sig<T, typename std::enable_if<!std::is_reference<T>::value>::type>
{
    using TT = typename wasm_remove_const_ref<T>::type;
    static const char value = _m3_type_to_sig<TT>::value;
};

template <typename Ret, typename... Args>
struct m3_signature
{
    //不支持返回值的引用
    static_assert(!std::is_reference<Ret>::value, "");

    static const char* get()
    {
        static char value[] = {m3_type_to_sig<Ret>::value, '(', m3_type_to_sig<Args>::value..., ')', 0};
        return (const char*) value;
    }
};
//记录不同类型的指针,再wasm存的类型
template <typename T, typename = void>
struct _wasm_pointer_support_ptr_in_wasm;

template <typename T>
struct _wasm_pointer_support_ptr_in_wasm<T, typename std::enable_if<std::is_base_of<UObject, T>::value>::type>
{
    using type = UObjectBase*;
};

template <typename T>
struct _wasm_pointer_support_ptr_in_wasm<T, typename std::enable_if<!std::is_base_of<UObject, T>::value>::type>
{
    using type = void*;
};

template <typename T>
struct wasm_pointer_support_ptr_in_wasm
{
    using type = typename _wasm_pointer_support_ptr_in_wasm<
        typename std::remove_pointer<typename wasm_remove_const_ref<T>::type>::type>::type;
};

//指针
template <typename T, typename memstack_t = typename std::add_pointer_t<typename std::remove_reference_t<T>>,
    typename t_remove_pointer = typename std::remove_pointer<T>::type>
typename std::enable_if<wasm_is_support_pointer_type<T>::value, int>::type wasm_link_get_args_from_stack(
    IM3Runtime rt, IM3ImportContext _ctx, wasm_stack_type _sp, wasm_mem_type _mem, memstack_t& stack_ptr, int index)
{
    using ptr_type_in_wasm = typename wasm_pointer_support_ptr_in_wasm<T>::type;
    WASM_PTR offset = *((WASM_PTR*) (_sp + index));
    ptr_type_in_wasm* tmp = (ptr_type_in_wasm*) m3ApiOffsetToPtr(offset);
    *stack_ptr = static_cast<T>(*tmp);
    return 0;
}

//简单类型,非引用
template <typename T, typename memstack_t = typename std::add_pointer_t<typename std::remove_reference_t<T>>>
typename std::enable_if<wasm_is_simple_type<T>::value && !std::is_reference<T>::value, int>::type wasm_link_get_args_from_stack(
    IM3Runtime rt, IM3ImportContext _ctx, wasm_stack_type _sp, wasm_mem_type _mem, memstack_t& stack_ptr, int index)
{
    T tmp = *((T*) (_sp + index));
    *stack_ptr = tmp;
    return 0;
}

//简单类型引用
template <typename T, typename memstack_t = typename std::add_pointer_t<typename std::remove_reference_t<T>>>
typename std::enable_if<wasm_is_simple_type<T>::value && std::is_reference<T>::value, int>::type wasm_link_get_args_from_stack(
    IM3Runtime rt, IM3ImportContext _ctx, wasm_stack_type _sp, wasm_mem_type _mem, memstack_t& stack_ptr, int index)
{
    using T_noRef = typename std::remove_reference_t<T>;
    WASM_PTR offset = *((WASM_PTR*) (_sp + index));
    T_noRef* tmp = (T_noRef*) m3ApiOffsetToPtr(offset);
    stack_ptr = tmp;
    return 0;
}

//复杂类型
template <typename T, typename memstack_t = typename std::add_pointer_t<typename std::remove_reference_t<T>>>
typename std::enable_if<wasm_is_complex_type<T>::value, int>::type wasm_link_get_args_from_stack(
    IM3Runtime rt, IM3ImportContext _ctx, wasm_stack_type _sp, wasm_mem_type _mem, memstack_t& stack_ptr, int index)
{
    using T_noRef = typename std::remove_reference_t<T>;
    WASM_PTR offset = *((WASM_PTR*) (_sp + index));
    T_noRef* tmp = (T_noRef*) m3ApiOffsetToPtr(offset);
    stack_ptr = tmp;
    return 0;
}

template <typename Func, Func* func>
struct wasm_link_helper;

template <typename Ret, typename... Args, Ret (*func)(Args...)>
struct wasm_link_helper<Ret(Args...), func>
{
    template <typename X>
    struct Functor;

    template <int... Index>
    struct Functor<std::index_sequence<Index...>>
    {
        //返回值是指针
        //规避malloc,需要link的函数,返回值禁止是指针
        /*template<class T>
        static typename std::enable_if<wasm_is_support_pointer_type<T>::value && !std::is_same<T, void>::value, const void*>::type
        _InternalInvoke(IM3Runtime rt, IM3ImportContext _ctx, wasm_stack_type _sp, wasm_mem_type _mem)
        {
            m3ApiReturnType(WASM_PTR);
            auto stack_mem = std::make_tuple<typename std::remove_reference_t<Args>...>(typename
        std::remove_reference_t<Args>()...); auto parm = std::make_tuple<typename std::add_pointer_t<typename
        std::remove_reference_t<Args>>...>(&std::get<Index>(stack_mem)...); auto tmp =
        std::make_tuple(wasm_link_get_args_from_stack<Args>(rt, _ctx, _sp, _mem, std::get<Index>(parm), Index)...);
            //_sp += sizeof...(Args);
            using T_RemoveConst = typename wasm_remove_const_ref<T>::type;
            T_RemoveConst r = (T_RemoveConst)func(*std::get<Index>(parm)...);
            WASM_PTR ptr = TryGetWasmPointerWithObject(r, rt);
            {
                *raw_return = ptr;
                return nullptr;
            }
        }*/

        //没有返回值
        template <class T>
        static typename std::enable_if<std::is_same<T, void>::value, void>::type _InternalInvoke(
            IM3Runtime rt, IM3ImportContext _ctx, wasm_stack_type _sp, wasm_mem_type _mem)
        {
            auto stack_mem =
                std::make_tuple<typename std::remove_reference_t<Args>...>(typename std::remove_reference_t<Args>()...);
            auto parm = std::make_tuple<typename std::add_pointer_t<typename std::remove_reference_t<Args>>...>(
                &std::get<Index>(stack_mem)...);
            auto tmp = std::make_tuple(wasm_link_get_args_from_stack<Args>(rt, _ctx, _sp, _mem, std::get<Index>(parm), Index)...);
            //_sp不是引用,所以也不用加了
            //_sp += sizeof...(Args);
            func(*std::get<Index>(parm)...);
            return nullptr;
        }
        //返回值是复杂类型
        template <class T>
        static typename std::enable_if<wasm_is_complex_type<T>::value && !std::is_same<T, void>::value, const void*>::type
        _InternalInvoke(IM3Runtime rt, IM3ImportContext _ctx, wasm_stack_type _sp, wasm_mem_type _mem)
        {
            using T_RemoveConst = typename wasm_remove_const_ref<T>::type;
            m3ApiReturnType(WASM_PTR);
            T_RemoveConst* ptr = (T_RemoveConst*) m3ApiOffsetToPtr(*raw_return);

            auto stack_mem =
                std::make_tuple<typename std::remove_reference_t<Args>...>(typename std::remove_reference_t<Args>()...);
            auto parm = std::make_tuple<typename std::add_pointer_t<typename std::remove_reference_t<Args>>...>(
                &std::get<Index>(stack_mem)...);
            auto tmp = std::make_tuple(wasm_link_get_args_from_stack<Args>(rt, _ctx, _sp, _mem, std::get<Index>(parm), Index)...);
            //_sp += sizeof...(Args);

            *ptr = func(*std::get<Index>(parm)...);

            return nullptr;
        }
        //返回值是简单类型
        template <class T>
        static typename std::enable_if<wasm_is_simple_type<T>::value && !std::is_same<T, void>::value, const void*>::type
        _InternalInvoke(IM3Runtime rt, IM3ImportContext _ctx, wasm_stack_type _sp, wasm_mem_type _mem)
        {
            m3ApiReturnType(T);
            auto stack_mem =
                std::make_tuple<typename std::remove_reference_t<Args>...>(typename std::remove_reference_t<Args>()...);
            auto parm = std::make_tuple<typename std::add_pointer_t<typename std::remove_reference_t<Args>>...>(
                &std::get<Index>(stack_mem)...);
            auto tmp = std::make_tuple(wasm_link_get_args_from_stack<Args>(rt, _ctx, _sp, _mem, std::get<Index>(parm), Index)...);
            //_sp += sizeof...(Args);

            T r = func(*std::get<Index>(parm)...);
            {
                *raw_return = r;
                return nullptr;
            }
        }

        static const void* Invoke(IM3Runtime rt, IM3ImportContext _ctx, wasm_stack_type _sp, wasm_mem_type _mem)
        {
            return _InternalInvoke<Ret>(rt, _ctx, _sp, _mem);
        }
    };
};

template <typename Func, Func* func>
struct wasm_link_wrapper;

template <typename Ret, typename... Args, Ret (*func)(Args...)>
struct wasm_link_wrapper<Ret(Args...), func>
{
    //为了规避malloc,暂时禁止返回值是指针的函数link
    /*template<typename T>
    static typename std::enable_if<wasm_is_support_pointer_type<T>::value && !std::is_same<T, void>::value, bool>::type
    InternalLink(IM3Module _module, const char* const function_name)
    {
        //返回值不能是引用
        static_assert(!std::is_reference<Ret>::value, "");
        return Export_m3_LinkRawFunctionEx(_module, "*", function_name, m3_signature<Ret, Args...>::get(),
            &wasm_link_helper<Ret(Args...), func>::template Functor<std::make_index_sequence<sizeof...(Args)>>::Invoke, nullptr);
    }*/

    template <typename T>
    static typename std::enable_if<std::is_same<T, void>::value, bool>::type InternalLink(
        IM3Module _module, const char* const function_name)
    {
        return Export_m3_LinkRawFunctionEx(_module, "*", function_name, m3_signature<void, Args...>::get(),
            &wasm_link_helper<void(Args...), func>::template Functor<std::make_index_sequence<sizeof...(Args)>>::Invoke, nullptr);
    }

    template <typename T>
    static typename std::enable_if<wasm_is_simple_type<T>::value && !std::is_same<T, void>::value, bool>::type InternalLink(
        IM3Module _module, const char* const function_name)
    {
        //返回值不能是引用
        static_assert(!std::is_reference<Ret>::value, "");
        return Export_m3_LinkRawFunctionEx(_module, "*", function_name, m3_signature<Ret, Args...>::get(),
            &wasm_link_helper<Ret(Args...), func>::template Functor<std::make_index_sequence<sizeof...(Args)>>::Invoke, nullptr);
    }

    template <typename T>
    static typename std::enable_if<wasm_is_complex_type<T>::value && !std::is_same<T, void>::value, bool>::type InternalLink(
        IM3Module _module, const char* const function_name)
    {
        //返回值不能是引用
        static_assert(!std::is_reference<Ret>::value, "");
        return Export_m3_LinkRawFunctionEx(_module, "*", function_name, m3_signature<void, Ret&, Args...>::get(),
            &wasm_link_helper<Ret(Args...), func>::template Functor<std::make_index_sequence<sizeof...(Args)>>::Invoke, nullptr);
    }

    static bool link(IM3Module _module, const char* const function_name)
    {
        return InternalLink<Ret>(_module, function_name);
    }
};

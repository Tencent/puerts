/*
 * Tencent is pleased to support the open source community by making puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */
// NOTE: no include guard, this file is included inside the backend namespaces (v8_impl / pesapi_impl), once for each,
// before class Function.
//
// How a c++ argument of a script function call (Function::Action / Func, std::function converted from a script function)
// is passed to script, by the parameter type of the c++ signature:
// - by value, const reference, rvalue reference: a copy (Converter<decay T>)
// - non-const reference of an object type (UsingCppType / UsingContainer / UsingUStruct ...): the object itself without
//   copying, modified in place. the script object is not owned by script, do not keep it after the call
// - other non-const reference (number, string ...): boxed ($Ref), written back after the call
template <typename T, typename Enable = void>
struct ScriptCallArg
{
    using DecayType = typename std::decay<T>::type;

    static API::ValueType toScript(API::ContextType context, const DecayType& value)
    {
        return Converter<DecayType>::toScript(context, value);
    }

    static void writeBack(API::ContextType context, const API::ValueType holder, const DecayType& value)
    {
    }
};

template <typename T>
struct ScriptCallArg<T&,
    typename std::enable_if<!std::is_const<T>::value && (is_objecttype<T>::value || is_uetype<T>::value)>::type>
{
    static API::ValueType toScript(API::ContextType context, T& value)
    {
        return Converter<T*>::toScript(context, &value);
    }

    static void writeBack(API::ContextType context, const API::ValueType holder, T& value)
    {
    }
};

template <typename T>
struct ScriptCallArg<T&,
    typename std::enable_if<!std::is_const<T>::value && !is_objecttype<T>::value && !is_uetype<T>::value>::type>
{
    static API::ValueType toScript(API::ContextType context, T& value)
    {
        return Converter<std::reference_wrapper<T>>::toScript(context, value);
    }

    static void writeBack(API::ContextType context, const API::ValueType holder, T& value)
    {
        value = Converter<std::reference_wrapper<T>>::toCpp(context, holder);
    }
};

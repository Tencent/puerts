/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once
#if defined(BUILDING_PES_EXTENSION)
#include "PesapiBackend.hpp"
#else
#include "V8Backend.hpp"
#endif

#ifndef PUERTS_BINDING_IMPL
#if defined(BUILDING_PES_EXTENSION)
#define PUERTS_BINDING_IMPL pesapi_impl
#else
#define PUERTS_BINDING_IMPL v8_impl
#endif
#endif

#define MakeConstructor(T, ...) ::puerts::template ConstructorWrapper<puerts::PUERTS_BINDING_IMPL::API, T, ##__VA_ARGS__>
#define MakeGetter(M) &(::puerts::PropertyWrapper<puerts::PUERTS_BINDING_IMPL::API, decltype(M), M>::getter)
#define MakeSetter(M) &(::puerts::PropertyWrapper<puerts::PUERTS_BINDING_IMPL::API, decltype(M), M>::setter)
#define MakeProperty(M)                                                                         \
    &(::puerts::PropertyWrapper<puerts::PUERTS_BINDING_IMPL::API, decltype(M), M>::getter),     \
        &(::puerts::PropertyWrapper<puerts::PUERTS_BINDING_IMPL::API, decltype(M), M>::setter), \
        ::puerts::PropertyWrapper<puerts::PUERTS_BINDING_IMPL::API, decltype(M), M>::info()
#define MakeReadonlyProperty(M)                                                                      \
    &(::puerts::PropertyWrapper<puerts::PUERTS_BINDING_IMPL::API, decltype(M), M>::getter), nullptr, \
        ::puerts::PropertyWrapper<puerts::PUERTS_BINDING_IMPL::API, decltype(M), M>::info()
#define MakeVariable(M) MakeProperty(M)
#define MakeReadonlyVariable(M) MakeReadonlyProperty(M)
#define MakeFunction(M, ...)                                                                                                      \
    [](::puerts::PUERTS_BINDING_IMPL::API::CallbackInfoType info)                                                                 \
    { ::puerts::FuncCallWrapper<puerts::PUERTS_BINDING_IMPL::API, decltype(M), M>::callWithDefaultValues(info, ##__VA_ARGS__); }, \
        ::puerts::FuncCallWrapper<puerts::PUERTS_BINDING_IMPL::API, decltype(M), M>::info(puerts::Count(__VA_ARGS__))
#define MakeExtension(M, ...)                                                                                        \
    [](::puerts::PUERTS_BINDING_IMPL::API::CallbackInfoType info)                                                    \
    {                                                                                                                \
        ::puerts::FuncCallWrapper<puerts::PUERTS_BINDING_IMPL::API, decltype(M), M>::callExtensionWithDefaultValues( \
            info, ##__VA_ARGS__);                                                                                    \
    },                                                                                                               \
        ::puerts::FuncCallWrapper<puerts::PUERTS_BINDING_IMPL::API, decltype(M), M>::extensionInfo(puerts::Count(__VA_ARGS__))
#define SelectFunction(SIGNATURE, M, ...)                                                                                       \
    [](::puerts::PUERTS_BINDING_IMPL::API::CallbackInfoType info)                                                               \
    { ::puerts::FuncCallWrapper<puerts::PUERTS_BINDING_IMPL::API, SIGNATURE, M>::callWithDefaultValues(info, ##__VA_ARGS__); }, \
        ::puerts::FuncCallWrapper<puerts::PUERTS_BINDING_IMPL::API, SIGNATURE, M>::info(puerts::Count(__VA_ARGS__))
#define SelectFunction_PtrRet(SIGNATURE, M, ...)                                                                \
    [](::puerts::PUERTS_BINDING_IMPL::API::CallbackInfoType info) {                                             \
        ::puerts::FuncCallWrapper<puerts::PUERTS_BINDING_IMPL::API, SIGNATURE, M, true>::callWithDefaultValues( \
            info, ##__VA_ARGS__);                                                                               \
    },                                                                                                          \
        ::puerts::FuncCallWrapper<puerts::PUERTS_BINDING_IMPL::API, SIGNATURE, M, true>::info(puerts::Count(__VA_ARGS__))
#define MakeCheckFunction(M)                                                                     \
    &(::puerts::FuncCallWrapper<puerts::PUERTS_BINDING_IMPL::API, decltype(M), M>::checkedCall), \
        ::puerts::FuncCallWrapper<puerts::PUERTS_BINDING_IMPL::API, decltype(M), M>::info()
#define MakeOverload(SIGNATURE, M) puerts::FuncCallWrapper<puerts::PUERTS_BINDING_IMPL::API, SIGNATURE, M>
#define CombineOverloads(...)                                                               \
    &::puerts::OverloadsCombiner<puerts::PUERTS_BINDING_IMPL::API, __VA_ARGS__>::call,      \
        ::puerts::OverloadsCombiner<puerts::PUERTS_BINDING_IMPL::API, __VA_ARGS__>::length, \
        ::puerts::OverloadsCombiner<puerts::PUERTS_BINDING_IMPL::API, __VA_ARGS__>::infos()
#define CombineConstructors(...)                                                               \
    &::puerts::ConstructorsCombiner<puerts::PUERTS_BINDING_IMPL::API, __VA_ARGS__>::call,      \
        ::puerts::ConstructorsCombiner<puerts::PUERTS_BINDING_IMPL::API, __VA_ARGS__>::length, \
        ::puerts::ConstructorsCombiner<puerts::PUERTS_BINDING_IMPL::API, __VA_ARGS__>::infos()

#define DeclOverloads(Name)      \
    template <typename T>        \
    struct Name##PuertsOverloads \
    {                            \
    };

#define DeclOverload(Name, SIGNATURE, M, ...)                                                                         \
    template <>                                                                                                       \
    struct Name##PuertsOverloads<SIGNATURE>                                                                           \
    {                                                                                                                 \
        static bool overloadCall(::puerts::PUERTS_BINDING_IMPL::API::CallbackInfoType info)                           \
        {                                                                                                             \
            return ::puerts::FuncCallWrapper<SIGNATURE, M, true>::overloadCallWithDefaultValues(info, ##__VA_ARGS__); \
        }                                                                                                             \
        static const ::puerts::CFunctionInfo* info()                                                                  \
        {                                                                                                             \
            return ::puerts::FuncCallWrapper<SIGNATURE, M>::info(puerts::Count(__VA_ARGS__));                         \
        }                                                                                                             \
    };

#define SelectOverload(Name, SIGNATURE) Name##PuertsOverloads<SIGNATURE>

#define UsingNamedCppType(CLS, NAME) __DefScriptTTypeName(NAME, CLS) __DefObjectType(CLS) __DefCDataPointerConverter(CLS)

#define UsingCppType(CLS) UsingNamedCppType(CLS, CLS)

namespace puerts
{
template <typename T, typename API>
class ClassDefineBuilder;

template <typename T>
inline ClassDefineBuilder<T, PUERTS_BINDING_IMPL::API> DefineClass()
{
    static auto NameLiteral = ScriptTypeName<T>::value();
    return ClassDefineBuilder<T, PUERTS_BINDING_IMPL::API>(NameLiteral.Data());
}
}    // namespace puerts
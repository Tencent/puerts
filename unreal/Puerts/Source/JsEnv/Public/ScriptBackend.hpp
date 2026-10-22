/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#if defined(BUILDING_PES_EXTENSION) && defined(PES_EXTENSION_WITH_V8_API)
#error "PES_EXTENSION_WITH_V8_API is no longer supported, the pesapi based extension can only use the pesapi backend"
#endif

#if defined(BUILDING_PES_EXTENSION)
#include "PesapiBackend.hpp"
#else
#include "V8Backend.hpp"
#endif
#include "Object.hpp"

#ifndef PUERTS_BINDING_IMPL
#if defined(BUILDING_PES_EXTENSION)
#define PUERTS_BINDING_IMPL pesapi_impl
#else
#define PUERTS_BINDING_IMPL v8_impl
#endif
#endif

#define PUERTS_BINDING_API ::PUERTS_NAMESPACE::PUERTS_BINDING_IMPL::API

// parameter list / api argument used by the lambdas generated in MakeFunction / MakeExtension / SelectFunction,
// the lambda is converted to the backend native callback type (FunctionCallbackType)
#if defined(BUILDING_PES_EXTENSION)
#define PUERTS_CALLBACK_PARAMS PUERTS_BINDING_API::ApisType apis, PUERTS_BINDING_API::CallbackInfoType info
#define PUERTS_CALLBACK_APIS apis
#else
#define PUERTS_CALLBACK_PARAMS PUERTS_BINDING_API::CallbackInfoType info
#define PUERTS_CALLBACK_APIS     \
    PUERTS_BINDING_API::ApisType \
    {                            \
    }
#endif

// convert a StaticCall internal callback (ApisType, CallbackInfoType) to the backend native callback type
#define PUERTS_ADAPT_CALLBACK(...) ::PUERTS_NAMESPACE::FunctionCallbackAdapter<PUERTS_BINDING_API, __VA_ARGS__>::Get()
#define PUERTS_ADAPT_INITIALIZE(...) ::PUERTS_NAMESPACE::InitializeFuncAdapter<PUERTS_BINDING_API, __VA_ARGS__>::Get()

#define MakeConstructor(T, ...) ::PUERTS_NAMESPACE::template ConstructorWrapper<PUERTS_BINDING_API, T, ##__VA_ARGS__>
#define MakeGetter(M) PUERTS_ADAPT_CALLBACK(&::PUERTS_NAMESPACE::PropertyWrapper<PUERTS_BINDING_API, decltype(M), M>::getter)
#define MakeSetter(M) PUERTS_ADAPT_CALLBACK(&::PUERTS_NAMESPACE::PropertyWrapper<PUERTS_BINDING_API, decltype(M), M>::setter)
#define MakeProperty(M)                                                                                          \
    PUERTS_ADAPT_CALLBACK(&::PUERTS_NAMESPACE::PropertyWrapper<PUERTS_BINDING_API, decltype(M), M>::getter),     \
        PUERTS_ADAPT_CALLBACK(&::PUERTS_NAMESPACE::PropertyWrapper<PUERTS_BINDING_API, decltype(M), M>::setter), \
        ::PUERTS_NAMESPACE::PropertyWrapper<PUERTS_BINDING_API, decltype(M), M>::info()
#define MakePropertyByGetterSetter(Getter, Setter)                                                                               \
    PUERTS_ADAPT_CALLBACK(&::PUERTS_NAMESPACE::PropertyGetterWrapper<PUERTS_BINDING_API, decltype(Getter), Getter>::getter),     \
        PUERTS_ADAPT_CALLBACK(&::PUERTS_NAMESPACE::PropertySetterWrapper<PUERTS_BINDING_API, decltype(Setter), Setter>::setter), \
        ::PUERTS_NAMESPACE::PropertyGetterSetterInfo<PUERTS_BINDING_API, decltype(Getter), decltype(Setter)>::info()
#define MakeReadonlyProperty(M)                                                                                       \
    PUERTS_ADAPT_CALLBACK(&::PUERTS_NAMESPACE::PropertyWrapper<PUERTS_BINDING_API, decltype(M), M>::getter), nullptr, \
        ::PUERTS_NAMESPACE::PropertyWrapper<PUERTS_BINDING_API, decltype(M), M>::info()
#define MakeVariable(M) MakeProperty(M)
#define MakeVariableByGetterSetter(M) MakePropertyByGetterSetter(M)
#define MakeReadonlyVariable(M) MakeReadonlyProperty(M)
#define MakeFunction(M, ...)                                                                                   \
    [](PUERTS_CALLBACK_PARAMS)                                                                                 \
    {                                                                                                          \
        ::PUERTS_NAMESPACE::FuncCallWrapper<PUERTS_BINDING_API, decltype(M), M, false>::callWithDefaultValues( \
            PUERTS_CALLBACK_APIS, info, ##__VA_ARGS__);                                                        \
    },                                                                                                         \
        ::PUERTS_NAMESPACE::FuncCallWrapper<PUERTS_BINDING_API, decltype(M), M, false>::info(PUERTS_NAMESPACE::Count(__VA_ARGS__))
#define MakeExtension(M, ...)                                                                                    \
    [](PUERTS_CALLBACK_PARAMS)                                                                                   \
    {                                                                                                            \
        ::PUERTS_NAMESPACE::FuncCallWrapper<PUERTS_BINDING_API, decltype(M), M>::callExtensionWithDefaultValues( \
            PUERTS_CALLBACK_APIS, info, ##__VA_ARGS__);                                                          \
    },                                                                                                           \
        ::PUERTS_NAMESPACE::FuncCallWrapper<PUERTS_BINDING_API, decltype(M), M>::extensionInfo(                  \
            PUERTS_NAMESPACE::Count(__VA_ARGS__))
#define SelectFunction(SIGNATURE, M, ...)                                                                    \
    [](PUERTS_CALLBACK_PARAMS)                                                                               \
    {                                                                                                        \
        ::PUERTS_NAMESPACE::FuncCallWrapper<PUERTS_BINDING_API, SIGNATURE, M, false>::callWithDefaultValues( \
            PUERTS_CALLBACK_APIS, info, ##__VA_ARGS__);                                                      \
    },                                                                                                       \
        ::PUERTS_NAMESPACE::FuncCallWrapper<PUERTS_BINDING_API, SIGNATURE, M, false>::info(PUERTS_NAMESPACE::Count(__VA_ARGS__))
#define SelectFunction_PtrRet(SIGNATURE, M, ...)                                                            \
    [](PUERTS_CALLBACK_PARAMS)                                                                              \
    {                                                                                                       \
        ::PUERTS_NAMESPACE::FuncCallWrapper<PUERTS_BINDING_API, SIGNATURE, M, true>::callWithDefaultValues( \
            PUERTS_CALLBACK_APIS, info, ##__VA_ARGS__);                                                     \
    },                                                                                                      \
        ::PUERTS_NAMESPACE::FuncCallWrapper<PUERTS_BINDING_API, SIGNATURE, M, true>::info(PUERTS_NAMESPACE::Count(__VA_ARGS__))
#define MakeCheckFunction(M)                                                                                             \
    PUERTS_ADAPT_CALLBACK(&::PUERTS_NAMESPACE::FuncCallWrapper<PUERTS_BINDING_API, decltype(M), M, false>::checkedCall), \
        ::PUERTS_NAMESPACE::FuncCallWrapper<PUERTS_BINDING_API, decltype(M), M, false>::info()
#define MakeOverload(SIGNATURE, M) PUERTS_NAMESPACE::FuncCallWrapper<PUERTS_BINDING_API, SIGNATURE, M, false>
#define CombineOverloads(...)                                                                             \
    PUERTS_ADAPT_CALLBACK(&::PUERTS_NAMESPACE::OverloadsCombiner<PUERTS_BINDING_API, __VA_ARGS__>::call), \
        ::PUERTS_NAMESPACE::OverloadsCombiner<PUERTS_BINDING_API, __VA_ARGS__>::length,                   \
        ::PUERTS_NAMESPACE::OverloadsCombiner<PUERTS_BINDING_API, __VA_ARGS__>::infos()
#define CombineConstructors(...)                                                                               \
    PUERTS_ADAPT_INITIALIZE(&::PUERTS_NAMESPACE::ConstructorsCombiner<PUERTS_BINDING_API, __VA_ARGS__>::call), \
        ::PUERTS_NAMESPACE::ConstructorsCombiner<PUERTS_BINDING_API, __VA_ARGS__>::length,                     \
        ::PUERTS_NAMESPACE::ConstructorsCombiner<PUERTS_BINDING_API, __VA_ARGS__>::infos()

#define DeclOverloads(Name)      \
    template <typename T>        \
    struct Name##PuertsOverloads \
    {                            \
    };

#define DeclOverload(Name, SIGNATURE, M, ...)                                                                                  \
    template <>                                                                                                                \
    struct Name##PuertsOverloads<SIGNATURE>                                                                                    \
    {                                                                                                                          \
        static bool overloadCall(PUERTS_BINDING_API::ApisType apis, PUERTS_BINDING_API::CallbackInfoType info)                 \
        {                                                                                                                      \
            return ::PUERTS_NAMESPACE::FuncCallWrapper<PUERTS_BINDING_API, SIGNATURE, M, true>::overloadCallWithDefaultValues( \
                apis, info, ##__VA_ARGS__);                                                                                    \
        }                                                                                                                      \
        static const ::PUERTS_NAMESPACE::CFunctionInfo* info()                                                                 \
        {                                                                                                                      \
            return ::PUERTS_NAMESPACE::FuncCallWrapper<PUERTS_BINDING_API, SIGNATURE, M>::info(                                \
                PUERTS_NAMESPACE::Count(__VA_ARGS__));                                                                         \
        }                                                                                                                      \
    };

#define SelectOverload(Name, SIGNATURE) Name##PuertsOverloads<SIGNATURE>

#define __DefObjectType_HELPER1(CLS, Suffix) __DefObjectType_##Suffix(CLS)
#define __DefObjectType_HELPER2(CLS, Suffix) __DefObjectType_HELPER1(CLS, Suffix)
#define __DefCDataPointerConverter_HELPER1(CLS, Suffix) __DefCDataPointerConverter_##Suffix(CLS)
#define __DefCDataPointerConverter_HELPER2(CLS, Suffix) __DefCDataPointerConverter_HELPER1(CLS, Suffix)
#define __DefObjectType(CLS) __DefObjectType_HELPER2(CLS, PUERTS_BINDING_IMPL)
#define __DefCDataPointerConverter(CLS) __DefCDataPointerConverter_HELPER2(CLS, PUERTS_BINDING_IMPL)
#define __DefCDataConverter_HELPER1(CLS, Suffix) __DefCDataConverter_##Suffix(CLS)
#define __DefCDataConverter_HELPER2(CLS, Suffix) __DefCDataConverter_HELPER1(CLS, Suffix)
#define __DefCDataConverter(CLS) __DefCDataConverter_HELPER2(CLS, PUERTS_BINDING_IMPL)
#define UsingNamedCppType(CLS, NAME) __DefScriptTTypeName(NAME, CLS) __DefObjectType(CLS) __DefCDataPointerConverter(CLS)

#define UsingCppType(CLS) UsingNamedCppType(CLS, CLS)

#if defined(BUILDING_PES_EXTENSION)
#define UsingOtherModuleCppType(MODULE, CLS)                                                \
    namespace PUERTS_NAMESPACE                                                              \
    {                                                                                       \
    template <>                                                                             \
    struct StaticTypeId<CLS>                                                                \
    {                                                                                       \
        static const void* get()                                                            \
        {                                                                                   \
            static const void* cache_type_id = nullptr;                                     \
            if (!cache_type_id)                                                             \
            {                                                                               \
                cache_type_id = ::PUERTS_NAMESPACE::pesapi_impl::FindTypeId(#MODULE, #CLS); \
            }                                                                               \
            return cache_type_id;                                                           \
        }                                                                                   \
    };                                                                                      \
    }                                                                                       \
    UsingNamedCppType(CLS, CLS)

// Declare a pesapi addon module whose initializer takes no argument, the registry passed in by the host is
// saved (pesapi_impl::SetRegistry) before calling the initializer, so DefineClass<T>().Register() can be used
// directly in it. Use PESAPI_MODULE directly if the initializer wants to handle the registry by itself.
#define PUERTS_PESAPI_MODULE(modname, initfunc)                                                                                \
    static void PUERTS_PESAPI_MODULE_INITIALIZER_##modname(struct pesapi_registry_api* registry_api, pesapi_registry registry) \
    {                                                                                                                          \
        ::PUERTS_NAMESPACE::pesapi_impl::SetRegistry(registry_api, registry);                                                  \
        initfunc();                                                                                                            \
    }                                                                                                                          \
    PESAPI_MODULE(modname, PUERTS_PESAPI_MODULE_INITIALIZER_##modname)
#endif

namespace PUERTS_NAMESPACE
{
template <typename T, typename API, typename RegisterAPI>
class ClassDefineBuilder;

template <typename T>
ClassDefineBuilder<T, PUERTS_BINDING_IMPL::API, PUERTS_BINDING_IMPL::API> DefineClass()
{
    static auto NameLiteral = ScriptTypeName<T>::value();
    return ClassDefineBuilder<T, PUERTS_BINDING_IMPL::API, PUERTS_BINDING_IMPL::API>(NameLiteral.Data());
}

using Object = PUERTS_BINDING_IMPL::Object;

using Function = PUERTS_BINDING_IMPL::Function;

inline void ThrowException(const char* msg)
{
    internal::ExceptionHandle<PUERTS_BINDING_IMPL::API>::Throw(msg);
}
}    // namespace PUERTS_NAMESPACE

/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include <type_traits>
#include <string>
#include <cstring>
#include <functional>
#include <vector>
#include "pesapi.h"
#include "TypeInfo.hpp"

// Inside the unreal plugin (JsEnv and the modules depending on it, not a pesapi addon), classes are registered into the plugin
// registry directly and UE types (UStruct/UClass) are handled through the IObjectMapper of the host (see PapiDataTransfer.h).
#if defined(USING_IN_UNREAL_ENGINE) && !defined(BUILDING_PES_EXTENSION)
#define PUERTS_PESAPI_IN_UE_PLUGIN 1
#else
#define PUERTS_PESAPI_IN_UE_PLUGIN 0
#endif

#if PUERTS_PESAPI_IN_UE_PLUGIN
#include "JSClassRegister.h"
#include "PapiDataTransfer.h"
#endif

#define __DefObjectType_pesapi_impl(CLS)              \
    namespace PUERTS_NAMESPACE                        \
    {                                                 \
    template <>                                       \
    struct is_objecttype<CLS> : public std::true_type \
    {                                                 \
    };                                                \
    }

#define __DefCDataPointerConverter_pesapi_impl(CLS)                                                         \
    namespace PUERTS_NAMESPACE                                                                              \
    {                                                                                                       \
    namespace pesapi_impl                                                                                   \
    {                                                                                                       \
    template <>                                                                                             \
    struct Converter<CLS*>                                                                                  \
    {                                                                                                       \
        static pesapi_value toScript(PApiCallbackEnv env, CLS* value)                                       \
        {                                                                                                   \
            return env.apis->native_object_to_value(env.env, DynamicTypeId<CLS>::get(value), value, false); \
        }                                                                                                   \
        static CLS* toCpp(PApiCallbackEnv env, pesapi_value value)                                          \
        {                                                                                                   \
            return static_cast<CLS*>(env.apis->get_native_object_ptr(env.env, value));                      \
        }                                                                                                   \
        static bool accept(PApiCallbackEnv env, pesapi_value value)                                         \
        {                                                                                                   \
            return env.apis->is_instance_of(env.env, StaticTypeId<CLS>::get(), value) != 0;                 \
        }                                                                                                   \
    };                                                                                                      \
    }                                                                                                       \
    }

#define __DefCDataConverter_pesapi_impl(CLS)                                                                         \
    namespace PUERTS_NAMESPACE                                                                                       \
    {                                                                                                                \
    namespace pesapi_impl                                                                                            \
    {                                                                                                                \
    template <>                                                                                                      \
    struct Converter<CLS>                                                                                            \
    {                                                                                                                \
        static pesapi_value toScript(PApiCallbackEnv env, CLS value)                                                 \
        {                                                                                                            \
            return env.apis->native_object_to_value(env.env, DynamicTypeId<CLS>::get(&value), new CLS(value), true); \
        }                                                                                                            \
        static CLS toCpp(PApiCallbackEnv env, pesapi_value value)                                                    \
        {                                                                                                            \
            return *static_cast<CLS*>(env.apis->get_native_object_ptr(env.env, value));                              \
        }                                                                                                            \
        static bool accept(PApiCallbackEnv env, pesapi_value value)                                                  \
        {                                                                                                            \
            return env.apis->is_instance_of(env.env, StaticTypeId<CLS>::get(), value) != 0;                          \
        }                                                                                                            \
    };                                                                                                               \
    }                                                                                                                \
    }

namespace PUERTS_NAMESPACE
{
#if !PUERTS_PESAPI_IN_UE_PLUGIN && !defined(BUILDING_PES_EXTENSION)
// linked into a host built from the plugin sources outside unreal (e.g. unreal/papi_test), defined in PesapiRegister.cpp
struct pesapi_registry_api* GetPesapiRegistryApi();
#endif

namespace pesapi_impl
{
// Lightweight call context: bundles the pesapi_ffi* (function table) with the pesapi_env.
// It is passed by value into all Converter/StringHolder calls so that every value-API
// invocation can route through the function-pointer table provided by the hosting engine.
struct PApiCallbackEnv
{
    struct pesapi_ffi* apis;
    pesapi_env env;
};

// The registry api table and registry handle are handed to the addon by the host when the module is loaded
// (see PESAPI_MODULE / PUERTS_PESAPI_MODULE). Static binding (DefineClass<T>().Register()) and UsingOtherModuleCppType
// use them, so they must be set before any class registration.
struct RegistryHolder
{
    static struct pesapi_registry_api*& Api()
    {
        static struct pesapi_registry_api* s_api = nullptr;
        return s_api;
    }
    static pesapi_registry& Registry()
    {
        static pesapi_registry s_registry = nullptr;
        return s_registry;
    }
};

inline void SetRegistry(struct pesapi_registry_api* registry_api, pesapi_registry registry)
{
    RegistryHolder::Api() = registry_api;
    RegistryHolder::Registry() = registry;
}

inline struct pesapi_registry_api* GetRegistryApi()
{
#if !defined(BUILDING_PES_EXTENSION)
    // not an addon: the classes are registered into the registry of the host it is linked into
    auto registry_api = RegistryHolder::Api();
    return registry_api ? registry_api : ::PUERTS_NAMESPACE::GetPesapiRegistryApi();
#else
    return RegistryHolder::Api();
#endif
}

// nullptr means the default registry
inline pesapi_registry GetRegistry()
{
    return RegistryHolder::Registry();
}

inline const void* FindTypeId(const char* module_name, const char* type_name)
{
    auto registry_api = GetRegistryApi();
    return registry_api ? registry_api->find_type_id(GetRegistry(), module_name, type_name) : nullptr;
}

template <typename T, typename Enable = void>
struct Converter;

template <typename T, typename = void>
struct CustomArgumentBufferType
{
    static constexpr bool enable = false;
};

// Gets the native "this" of a method/property callback. Specialized for UObject in UEDataBinding.hpp to check that the
// object is still valid (the same as v8_impl, which converts the holder by Converter<T*>).
template <typename T, typename Enable = void>
struct SelfChecker
{
    static T* Get(PApiCallbackEnv env, pesapi_callback_info info)
    {
        return static_cast<T*>(env.apis->get_native_holder_ptr(info));
    }
};

struct API
{
    typedef pesapi_callback_info CallbackInfoType;
    typedef PApiCallbackEnv ContextType;
    typedef pesapi_value ValueType;
    // The opaque API-table pointer type passed as the first parameter of every callback.
    // StaticCall.hpp / ScriptBackend.hpp should only reference this alias, never the raw
    // `struct pesapi_ffi*` type, so that the V8 backend can define its own ApisType.
    typedef struct pesapi_ffi* ApisType;
    typedef pesapi_callback FunctionCallbackType;
    typedef pesapi_constructor InitializeFuncType;
    struct GeneralFunctionInfo
    {
        const char* Name;
        FunctionCallbackType Callback;
        void* Data = nullptr;
        const CFunctionInfo* ReflectionInfo = nullptr;
    };

    struct GeneralPropertyInfo
    {
        const char* Name;
        FunctionCallbackType Getter;
        FunctionCallbackType Setter;
        void* GetterData = nullptr;
        void* SetterData = nullptr;
    };

    typedef NamedFunctionInfo GeneralFunctionReflectionInfo;
    typedef NamedPropertyInfo GeneralPropertyReflectionInfo;

    inline static int GetArgsLen(PApiCallbackEnv env, pesapi_callback_info info)
    {
        return env.apis->get_args_len(info);
    }

    inline static pesapi_value GetArg(PApiCallbackEnv env, pesapi_callback_info info, int index)
    {
        return env.apis->get_arg(info, index);
    }

    inline static PApiCallbackEnv GetContext(ApisType apis, pesapi_callback_info info)
    {
        return PApiCallbackEnv{apis, apis->get_env(info)};
    }

    // Returns the native object pointer (typed T*) associated with "this" of the current callback.
    template <typename T>
    inline static T* GetSelf(PApiCallbackEnv env, pesapi_callback_info info)
    {
        return SelfChecker<T>::Get(env, info);
    }

    // use where GetSelfFromData is true
    inline static void* GetFunctionData(PApiCallbackEnv env, pesapi_callback_info info)
    {
        return env.apis->get_userdata(info);
    }

    inline static void ThrowException(PApiCallbackEnv env, pesapi_callback_info info, const char* msg)
    {
        env.apis->throw_by_string(info, msg);
    }

    inline static void SetReturn(PApiCallbackEnv env, pesapi_callback_info info, pesapi_value value)
    {
        env.apis->add_return(info, value);
    }

    template <typename T1, typename T2>
    inline static void LinkOuter(PApiCallbackEnv env, pesapi_callback_info info, pesapi_value inner)
    {
#if PUERTS_PESAPI_IN_UE_PLUGIN
        // the holder may be a UStruct/UObject whose type id is not a registered c++ type id, link the holder object itself
        PapiDataTransfer::LinkOuter(env.apis, env.env, env.apis->get_this(info), inner);
#else
        auto outer_ptr = env.apis->get_native_holder_ptr(info);
        auto outer_type_id = env.apis->get_native_holder_typeid(info);
        if (!outer_ptr || !outer_type_id)
            return;
        auto outer_value = env.apis->native_object_to_value(env.env, outer_type_id, outer_ptr, false);
        env.apis->set_property_uint32(env.env, inner, 0, outer_value);
#endif
    }

    inline static void UpdateRefValue(PApiCallbackEnv env, pesapi_value holder, pesapi_value value)
    {
        if (env.apis->is_object(env.env, holder))
        {
            env.apis->update_boxed_value(env.env, holder, value);
        }
    }

    template <typename T>
    inline static T* FastGetNativeObjectPointer(PApiCallbackEnv env, pesapi_value value)
    {
        return static_cast<T*>(env.apis->get_native_object_ptr(env.env, value));
    }

    inline static pesapi_value GetUndefined(PApiCallbackEnv env)
    {
        return env.apis->create_undefined(env.env);
    }

    inline static bool IsNullOrUndefined(PApiCallbackEnv env, pesapi_value val)
    {
        return env.apis->is_null(env.env, val) || env.apis->is_undefined(env.env, val);
    }

    typedef pesapi_finalize FinalizeFuncType;

    template <typename T>
    static FinalizeFuncType MakeDeleteFinalize()
    {
        return [](struct pesapi_ffi* apis, void* ptr, void* class_data, void* env_private) { delete static_cast<T*>(ptr); };
    }

    template <typename T, typename CDB>
    static void Register(FinalizeFuncType Finalize, const CDB& Cdb)
    {
#if PUERTS_PESAPI_IN_UE_PLUGIN
        RegisterInPlugin<T>(Finalize, Cdb);
#else
        RegisterByRegistryApi<T>(Finalize, Cdb);
#endif
    }

#if PUERTS_PESAPI_IN_UE_PLUGIN
    // UE types (is_uetype) have no c++ type id and are keyed by UETypeName, which can not be done by pesapi_registry_api,
    // so the class definition is built here and registered by RegisterPesapiClass.
    template <typename T, typename CDB>
    static void RegisterInPlugin(FinalizeFuncType Finalize, const CDB& Cdb)
    {
        ::PUERTS_NAMESPACE::ScriptClassDefinition ClassDef = JSClassEmptyDefinition;

        // the registry copies ScriptName, a temporary string is fine
        ::PUERTS_NAMESPACE::PString ScriptNameWithModuleName;
        if (is_uetype<T>::value)
        {
            ClassDef.UETypeName = Cdb.className_;
        }
        else
        {
            ClassDef.ScriptName = Cdb.className_;
            const char* ModuleName = ::PUERTS_NAMESPACE::RegisteringModuleName();
            if (ModuleName && ModuleName[0] != '\0')
            {
                ScriptNameWithModuleName = ModuleName;
                ScriptNameWithModuleName += ".";
                ScriptNameWithModuleName += Cdb.className_;
                ClassDef.ScriptName = ScriptNameWithModuleName.c_str();
            }
            ClassDef.TypeId = StaticTypeId<T>::get();
            ClassDef.SuperTypeId = Cdb.superTypeId_;
        }
        ClassDef.Initialize = Cdb.constructor_;
        ClassDef.Finalize = Finalize;

        // the registry duplicates all arrays, so temporary storage is fine
        std::vector<::PUERTS_NAMESPACE::ScriptFunctionInfo> methods = ToScriptFunctionInfos(Cdb.methods_);
        std::vector<::PUERTS_NAMESPACE::ScriptFunctionInfo> functions = ToScriptFunctionInfos(Cdb.functions_);
        std::vector<::PUERTS_NAMESPACE::ScriptPropertyInfo> properties = ToScriptPropertyInfos(Cdb.properties_);
        std::vector<::PUERTS_NAMESPACE::ScriptPropertyInfo> variables = ToScriptPropertyInfos(Cdb.variables_);
        ClassDef.Methods = methods.data();
        ClassDef.Functions = functions.data();
        ClassDef.Properties = properties.data();
        ClassDef.Variables = variables.data();

        std::vector<NamedFunctionInfo> constructorInfos = Cdb.constructorInfos_;
        constructorInfos.push_back(NamedFunctionInfo{nullptr, nullptr});
        std::vector<NamedFunctionInfo> methodInfos = Cdb.methodInfos_;
        methodInfos.push_back(NamedFunctionInfo{nullptr, nullptr});
        std::vector<NamedFunctionInfo> functionInfos = Cdb.functionInfos_;
        functionInfos.push_back(NamedFunctionInfo{nullptr, nullptr});
        std::vector<NamedPropertyInfo> propertyInfos = Cdb.propertyInfos_;
        propertyInfos.push_back(NamedPropertyInfo{nullptr, nullptr});
        std::vector<NamedPropertyInfo> variableInfos = Cdb.variableInfos_;
        variableInfos.push_back(NamedPropertyInfo{nullptr, nullptr});
        ClassDef.ConstructorInfos = constructorInfos.data();
        ClassDef.MethodInfos = methodInfos.data();
        ClassDef.FunctionInfos = functionInfos.data();
        ClassDef.PropertyInfos = propertyInfos.data();
        ClassDef.VariableInfos = variableInfos.data();

        ::PUERTS_NAMESPACE::RegisterPesapiClass(
            reinterpret_cast<::PUERTS_NAMESPACE::ScriptClassRegistry*>(GetRegistry()), ClassDef);
    }

    static std::vector<::PUERTS_NAMESPACE::ScriptFunctionInfo> ToScriptFunctionInfos(const std::vector<GeneralFunctionInfo>& Infos)
    {
        std::vector<::PUERTS_NAMESPACE::ScriptFunctionInfo> Ret;
        Ret.reserve(Infos.size() + 1);
        for (const auto& Info : Infos)
        {
            ::PUERTS_NAMESPACE::ScriptFunctionInfo FunctionInfo;
            FunctionInfo.Name = Info.Name;
            FunctionInfo.Data = Info.Data;
            FunctionInfo.Callback = Info.Callback;
            Ret.push_back(FunctionInfo);
        }
        Ret.push_back(::PUERTS_NAMESPACE::ScriptFunctionInfo());
        return Ret;
    }

    static std::vector<::PUERTS_NAMESPACE::ScriptPropertyInfo> ToScriptPropertyInfos(const std::vector<GeneralPropertyInfo>& Infos)
    {
        std::vector<::PUERTS_NAMESPACE::ScriptPropertyInfo> Ret;
        Ret.reserve(Infos.size() + 1);
        for (const auto& Info : Infos)
        {
            ::PUERTS_NAMESPACE::ScriptPropertyInfo PropertyInfo;
            PropertyInfo.Name = Info.Name;
            PropertyInfo.GetterData = Info.GetterData;
            PropertyInfo.SetterData = Info.SetterData;
            PropertyInfo.Getter = Info.Getter;
            PropertyInfo.Setter = Info.Setter;
            Ret.push_back(PropertyInfo);
        }
        Ret.push_back(::PUERTS_NAMESPACE::ScriptPropertyInfo());
        return Ret;
    }
#endif

    template <typename T, typename CDB>
    static void RegisterByRegistryApi(FinalizeFuncType Finalize, const CDB& Cdb)
    {
        auto registry_api = GetRegistryApi();
        auto registry = GetRegistry();
        if (!registry_api)
        {
            // SetRegistry was not called (use PUERTS_PESAPI_MODULE or call pesapi_impl::SetRegistry in the module initializer)
            return;
        }
        const void* type_id = StaticTypeId<T>::get();

        registry_api->define_class(registry, type_id, Cdb.superTypeId_, ::PUERTS_NAMESPACE::RegisteringModuleName(), Cdb.className_,
            Cdb.constructor_, Finalize, nullptr, false);

        registry_api->set_property_info_size(registry, type_id, static_cast<int>(Cdb.methods_.size()),
            static_cast<int>(Cdb.functions_.size()), static_cast<int>(Cdb.properties_.size()),
            static_cast<int>(Cdb.variables_.size()));

        int index = 0;
        for (const auto& method : Cdb.methods_)
        {
            registry_api->set_method_info(registry, type_id, index++, method.Name, false, method.Callback, method.Data, false);
        }

        index = 0;
        for (const auto& func : Cdb.functions_)
        {
            registry_api->set_method_info(registry, type_id, index++, func.Name, true, func.Callback, func.Data, false);
        }

        index = 0;
        for (const auto& prop : Cdb.properties_)
        {
            registry_api->set_property_info(
                registry, type_id, index++, prop.Name, false, prop.Getter, prop.Setter, prop.GetterData, prop.SetterData, false);
        }

        index = 0;
        for (const auto& prop : Cdb.variables_)
        {
            registry_api->set_property_info(
                registry, type_id, index++, prop.Name, true, prop.Getter, prop.Setter, prop.GetterData, prop.SetterData, false);
        }

        static std::vector<NamedFunctionInfo> s_constructorInfos_{};
        static std::vector<NamedFunctionInfo> s_methodInfos_{};
        static std::vector<NamedFunctionInfo> s_functionInfos_{};
        static std::vector<NamedPropertyInfo> s_propertyInfos_{};
        static std::vector<NamedPropertyInfo> s_variableInfos_{};

        s_constructorInfos_ = std::move(Cdb.constructorInfos_);
        s_constructorInfos_.push_back(NamedFunctionInfo{nullptr, nullptr});

        s_methodInfos_ = std::move(Cdb.methodInfos_);
        s_methodInfos_.push_back(NamedFunctionInfo{nullptr, nullptr});

        s_functionInfos_ = std::move(Cdb.functionInfos_);
        s_functionInfos_.push_back(NamedFunctionInfo{nullptr, nullptr});

        s_propertyInfos_ = std::move(Cdb.propertyInfos_);
        s_propertyInfos_.push_back(NamedPropertyInfo{nullptr, nullptr});

        s_variableInfos_ = std::move(Cdb.variableInfos_);
        s_variableInfos_.push_back(NamedPropertyInfo{nullptr, nullptr});

        registry_api->class_type_info(registry, PUERTS_BINDING_PROTO_ID(), type_id, s_constructorInfos_.data(),
            s_methodInfos_.data(), s_functionInfos_.data(), s_propertyInfos_.data(), s_variableInfos_.data());
    }

    template <typename T>
    using Converter = Converter<T>;

    template <typename T>
    using CustomArgumentBufferType = CustomArgumentBufferType<T>;
};

class StringHolder
{
public:
    StringHolder(PApiCallbackEnv env, pesapi_value value) : str_(nullptr), needFree_(false)
    {
        if (!value)
            return;
        if (env.apis->is_binary(env.env, value))
        {
            size_t length = 0;
            str_ = (char*) env.apis->get_value_binary(env.env, value, &length);
        }
        else
        {
            size_t length = 0;
            str_ = (char*) env.apis->get_value_string_utf8(env.env, value, nullptr, &length);
            if (!str_)
            {
                str_ = new char[length + 1];
                env.apis->get_value_string_utf8(env.env, value, str_, &length);
                // the buffer size passed is the string length, the implementation may not write the null terminator
                str_[length] = 0;
                needFree_ = true;
            }
        }
    }

    // Disallow copying and assigning.
    StringHolder(const StringHolder&) = delete;
    void operator=(const StringHolder&) = delete;

    ~StringHolder()
    {
        if (needFree_ && str_)
        {
            delete[] str_;
        }
    }

    const char* Data() const
    {
        return str_;
    }

private:
    char* str_;

    bool needFree_;
};

template <>
struct CustomArgumentBufferType<const char*>
{
    using type = StringHolder;
    static constexpr bool enable = true;
};

template <typename T>
struct Converter<T, typename std::enable_if<std::is_integral<T>::value && sizeof(T) == 8 && std::is_signed<T>::value>::type>
{
    static pesapi_value toScript(PApiCallbackEnv env, T value)
    {
        return env.apis->create_int64(env.env, value);
    }

    static T toCpp(PApiCallbackEnv env, pesapi_value value)
    {
        return static_cast<T>(env.apis->get_value_int64(env.env, value));
    }

    static bool accept(PApiCallbackEnv env, pesapi_value value)
    {
        return env.apis->is_int64(env.env, value) != 0;
    }
};

template <typename T>
struct Converter<T, typename std::enable_if<std::is_integral<T>::value && sizeof(T) == 8 && !std::is_signed<T>::value>::type>
{
    static pesapi_value toScript(PApiCallbackEnv env, T value)
    {
        return env.apis->create_uint64(env.env, value);
    }

    static T toCpp(PApiCallbackEnv env, pesapi_value value)
    {
        return static_cast<T>(env.apis->get_value_uint64(env.env, value));
    }

    static bool accept(PApiCallbackEnv env, pesapi_value value)
    {
        return env.apis->is_uint64(env.env, value) != 0;
    }
};

template <typename T>
struct Converter<T, typename std::enable_if<std::is_integral<T>::value && sizeof(T) < 8 && std::is_signed<T>::value>::type>
{
    static pesapi_value toScript(PApiCallbackEnv env, T value)
    {
        return env.apis->create_int32(env.env, value);
    }

    static T toCpp(PApiCallbackEnv env, pesapi_value value)
    {
        return static_cast<T>(env.apis->get_value_int32(env.env, value));
    }

    static bool accept(PApiCallbackEnv env, pesapi_value value)
    {
        return env.apis->is_int32(env.env, value) != 0;
    }
};

template <typename T>
struct Converter<T, typename std::enable_if<std::is_integral<T>::value && sizeof(T) < 8 && !std::is_signed<T>::value>::type>
{
    static pesapi_value toScript(PApiCallbackEnv env, T value)
    {
        return env.apis->create_uint32(env.env, value);
    }

    static T toCpp(PApiCallbackEnv env, pesapi_value value)
    {
        return static_cast<T>(env.apis->get_value_uint32(env.env, value));
    }

    static bool accept(PApiCallbackEnv env, pesapi_value value)
    {
        return env.apis->is_uint32(env.env, value) != 0;
    }
};

template <typename T>
struct Converter<T, typename std::enable_if<std::is_enum<T>::value>::type>
{
    static pesapi_value toScript(PApiCallbackEnv env, T value)
    {
        return env.apis->create_int32(env.env, static_cast<int>(value));
    }

    static T toCpp(PApiCallbackEnv env, pesapi_value value)
    {
        return static_cast<T>(env.apis->get_value_int32(env.env, value));
    }

    static bool accept(PApiCallbackEnv env, pesapi_value value)
    {
        return env.apis->is_int32(env.env, value) != 0;
    }
};

template <typename T>
struct Converter<T, typename std::enable_if<std::is_floating_point<T>::value>::type>
{
    static pesapi_value toScript(PApiCallbackEnv env, T value)
    {
        return env.apis->create_double(env.env, value);
    }

    static T toCpp(PApiCallbackEnv env, pesapi_value value)
    {
        return static_cast<T>(env.apis->get_value_double(env.env, value));
    }

    static bool accept(PApiCallbackEnv env, pesapi_value value)
    {
        return env.apis->is_double(env.env, value) != 0;
    }
};

template <>
struct Converter<std::string>
{
    static pesapi_value toScript(PApiCallbackEnv env, std::string value)
    {
        return env.apis->create_string_utf8(env.env, value.c_str(), value.size());
    }

    static std::string toCpp(PApiCallbackEnv env, pesapi_value value)
    {
        size_t bufSize = 0;
        const char* str = env.apis->get_value_string_utf8(env.env, value, nullptr, &bufSize);
        if (str)
        {
            return std::string(str);
        }
        else
        {
            std::vector<char> buffer(bufSize + 1);
            str = env.apis->get_value_string_utf8(env.env, value, buffer.data(), &bufSize);
            return std::string(str, bufSize);
        }
    }

    static bool accept(PApiCallbackEnv env, pesapi_value value)
    {
        return env.apis->is_string(env.env, value) != 0;
    }
};

template <>
struct Converter<const char*>
{
    static pesapi_value toScript(PApiCallbackEnv env, const char* value)
    {
        return env.apis->create_string_utf8(env.env, value, strlen(value));
    }

    static bool accept(PApiCallbackEnv env, pesapi_value value)
    {
        return env.apis->is_string(env.env, value) != 0;
    }
};

template <>
struct Converter<void*>
{
    static pesapi_value toScript(PApiCallbackEnv env, void* value)
    {
        return env.apis->create_binary(env.env, value, 0);
    }

    static void* toCpp(PApiCallbackEnv env, pesapi_value value)
    {
        size_t bufsize;
        void* ptr = env.apis->get_value_binary(env.env, value, &bufsize);
        if (!ptr && env.apis->is_object(env.env, value))
        {
            // the same as v8_impl, a native object is accepted as void* too
            ptr = env.apis->get_native_object_ptr(env.env, value);
        }
        return ptr;
    }

    static bool accept(PApiCallbackEnv env, pesapi_value value)
    {
        return env.apis->is_binary(env.env, value) != 0;
    }
};

template <>
struct Converter<bool>
{
    static pesapi_value toScript(PApiCallbackEnv env, bool value)
    {
        return env.apis->create_boolean(env.env, value);
    }

    static bool toCpp(PApiCallbackEnv env, pesapi_value value)
    {
        return env.apis->get_value_bool(env.env, value) != 0;
    }

    static bool accept(PApiCallbackEnv env, pesapi_value value)
    {
        return env.apis->is_boolean(env.env, value) != 0;
    }
};

template <typename T>
struct Converter<std::reference_wrapper<T>, typename std::enable_if<!is_objecttype<T>::value && !is_uetype<T>::value>::type>
{
    static pesapi_value toScript(PApiCallbackEnv env, const T& value)
    {
        return env.apis->boxing(env.env, Converter<T>::toScript(env, value));
    }

    static T toCpp(PApiCallbackEnv env, pesapi_value value)
    {
        if (env.apis->is_object(env.env, value))
        {
            return Converter<T>::toCpp(env, env.apis->unboxing(env.env, value));
        }
        return {};
    }

    static bool accept(PApiCallbackEnv env, pesapi_value value)
    {
        return env.apis->is_boxed_value(env.env, value) != 0;    // do not checked inner
    }
};

template <typename T>
struct Converter<std::reference_wrapper<T>, typename std::enable_if<is_objecttype<T>::value || is_uetype<T>::value>::type>
{
    static pesapi_value toScript(PApiCallbackEnv env, const T& value)
    {
        return env.apis->boxing(env.env, Converter<T>::toScript(env, value));
    }

    static T* toCpp(PApiCallbackEnv env, pesapi_value value)
    {
        if (value && env.apis->is_object(env.env, value))
        {
            return Converter<typename std::decay<T>::type*>::toCpp(env, env.apis->unboxing(env.env, value));
        }
        return nullptr;
    }

    static bool accept(PApiCallbackEnv env, pesapi_value value)
    {
        return env.apis->is_boxed_value(env.env, value) != 0;    // do not checked inner
    }
};

template <typename T>
struct Converter<T,
    typename std::enable_if<is_script_type<typename std::remove_pointer<T>::type>::value && !std::is_array<T>::value &&
                            !std::is_const<typename std::remove_pointer<T>::type>::value && std::is_pointer<T>::value>::type>
{
    static pesapi_value toScript(PApiCallbackEnv env, T value)
    {
        return env.apis->create_binary(env.env, value, 0);
    }

    static T toCpp(PApiCallbackEnv env, pesapi_value value)
    {
        size_t bufsize;
        return static_cast<T>(env.apis->get_value_binary(env.env, value, &bufsize));
    }

    static bool accept(PApiCallbackEnv env, pesapi_value value)
    {
        return env.apis->is_binary(env.env, value) != 0;
    }
};

template <typename T, std::size_t Size>
struct Converter<T[Size], typename std::enable_if<is_script_type<T>::value && !std::is_const<T>::value>::type>
{
    static pesapi_value toScript(PApiCallbackEnv env, T value[Size])
    {
        return env.apis->create_binary(env.env, value, sizeof(T) * Size);
    }

    static bool accept(PApiCallbackEnv env, pesapi_value value)
    {
        return env.apis->is_binary(env.env, value) != 0;
    }
};

template <class T>
struct Converter<T, typename std::enable_if<std::is_copy_constructible<T>::value && std::is_constructible<T>::value &&
                                            is_objecttype<T>::value && !is_uetype<T>::value>::type>
{
    static pesapi_value toScript(PApiCallbackEnv env, T value)
    {
        return env.apis->native_object_to_value(env.env, DynamicTypeId<T>::get(&value), new T(value), true);
    }
    static T toCpp(PApiCallbackEnv env, pesapi_value value)
    {
        T* ptr = (static_cast<T*>(env.apis->get_native_object_ptr(env.env, value)));
        return ptr ? *ptr : T{};
    }
    static bool accept(PApiCallbackEnv env, pesapi_value value)
    {
        return env.apis->is_instance_of(env.env, StaticTypeId<T>::get(), value) != 0;
    }
};

template <class T>
struct Converter<const T*,
    typename std::enable_if<(is_objecttype<T>::value || std::is_same<T, void>::value || is_script_type<T>::value) &&
                            !is_uetype<T>::value && !std::is_same<T, char>::value>::type>
{
    static pesapi_value toScript(PApiCallbackEnv env, const T* value)
    {
        return Converter<T*>::toScript(env, const_cast<T*>(value));
    }
    static const T* toCpp(PApiCallbackEnv env, pesapi_value value)
    {
        return Converter<T*>::toCpp(env, value);
    }
    static bool accept(PApiCallbackEnv env, pesapi_value value)
    {
        return Converter<T*>::accept(env, value);
    }
};

}    // namespace pesapi_impl
}    // namespace PUERTS_NAMESPACE

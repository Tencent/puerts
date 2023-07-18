/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#if defined(BUILDING_PES_EXTENSION)

#include <type_traits>
#include <string>
#include <cstring>
#include <functional>
#include <vector>
#include <pesapi.h>
#include "TypeInfo.hpp"

#define __DefObjectType(CLS)                          \
    namespace puerts                                  \
    {                                                 \
    template <>                                       \
    struct is_objecttype<CLS> : public std::true_type \
    {                                                 \
    };                                                \
    }

#define __DefCDataPointerConverter(CLS)                                                                    \
    namespace puerts                                                                                       \
    {                                                                                                      \
    namespace pesapi_impl                                                                                  \
    {                                                                                                      \
    template <>                                                                                            \
    struct Converter<CLS*>                                                                                 \
    {                                                                                                      \
        static pesapi_value toScript(pesapi_env env, CLS* value)                                           \
        {                                                                                                  \
            return pesapi_create_native_object(env, puerts::DynamicTypeId<CLS>::get(value), value, false); \
        }                                                                                                  \
        static CLS* toCpp(pesapi_env env, pesapi_value value)                                              \
        {                                                                                                  \
            return static_cast<CLS*>(pesapi_get_native_object_ptr(env, value));                            \
        }                                                                                                  \
        static bool accept(pesapi_env env, pesapi_value value)                                             \
        {                                                                                                  \
            return pesapi_is_native_object(env, puerts::StaticTypeId<CLS>::get(), value);                  \
        }                                                                                                  \
    };                                                                                                     \
    }                                                                                                      \
    }

namespace puerts
{
namespace pesapi_impl
{
template <typename T, typename Enable = void>
struct Converter;

template <typename T, typename = void>
struct CustomArgumentBufferType
{
    static constexpr bool enable = false;
};

struct API
{
    typedef pesapi_callback_info CallbackInfoType;
    typedef pesapi_env ContextType;
    typedef pesapi_value ValueType;
    typedef void (*FunctionCallbackType)(pesapi_callback_info info);
    typedef void* (*InitializeFuncType)(pesapi_callback_info Info);
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
        void* Data = nullptr;
    };

    struct GeneralFunctionReflectionInfo
    {
        const char* Name;
        const CFunctionInfo* Type;
    };

    struct GeneralPropertyReflectionInfo
    {
        const char* Name;
        const CTypeInfo* Type;
    };

    inline static int GetArgsLen(pesapi_callback_info info)
    {
        return pesapi_get_args_len(info);
    }

    inline static pesapi_value GetArg(pesapi_callback_info info, int index)
    {
        return pesapi_get_arg(info, index);
    }

    inline static pesapi_env GetContext(pesapi_callback_info info)
    {
        return pesapi_get_env(info);
    }
    inline static pesapi_value GetThis(pesapi_callback_info info)
    {
        return pesapi_get_this(info);
    }

    inline static pesapi_value GetHolder(pesapi_callback_info info)
    {
        return pesapi_get_holder(info);
    }

    inline static void ThrowException(pesapi_callback_info info, const char* msg)
    {
        pesapi_throw_by_string(info, msg);
    }

    inline static void SetReturn(pesapi_callback_info info, pesapi_value value)
    {
        pesapi_add_return(info, value);
    }

    template <typename T1, typename T2>
    inline static void LinkOuter(pesapi_env env, pesapi_value outer, pesapi_value inner)
    {
        pesapi_set_property_uint32(env, inner, 0, outer);
    }

    inline static void UpdateRefValue(pesapi_env env, pesapi_value holder, pesapi_value value)
    {
        if (pesapi_is_object(env, holder))
        {
            pesapi_update_value_ref(env, holder, value);
        }
    }

    template <typename T>
    inline static T* FastGetNativeObjectPointer(pesapi_env env, pesapi_value value)
    {
        return static_cast<T*>(pesapi_get_native_object_ptr(env, value));
    }

    inline static pesapi_value GetUndefined(pesapi_env env)
    {
        return pesapi_create_undefined(env);
    }

    inline static bool IsNullOrUndefined(pesapi_env env, pesapi_value val)
    {
        return pesapi_is_null(env, val) || pesapi_is_undefined(env, val);
    }

    typedef void (*FinalizeFuncType)(void* Ptr);

    template <typename T, typename CDB>
    void Register(FinalizeFuncType Finalize, const CDB& Cdb)
    {
        size_t properties_count = Cdb.functions_.size() + Cdb.methods_.size() + Cdb.properties_.size() + Cdb.variables_.size();
        auto properties = pesapi_alloc_property_descriptors(properties_count);
        size_t pos = 0;
        for (const auto& func : Cdb.functions_)
        {
            pesapi_set_method_info(properties, pos++, func.Name, true, func.Callback, nullptr, nullptr);
        }

        for (const auto& method : Cdb.methods_)
        {
            pesapi_set_method_info(properties, pos++, method.Name, false, method.Callback, nullptr, nullptr);
        }

        for (const auto& prop : Cdb.properties_)
        {
            pesapi_set_property_info(properties, pos++, prop.Name, false, prop.Getter, prop.Setter, nullptr, nullptr);
        }

        for (const auto& prop : Cdb.variables_)
        {
            pesapi_set_property_info(properties, pos++, prop.Name, true, prop.Getter, prop.Setter, nullptr, nullptr);
        }

        pesapi_finalize finalize = Finalize;
        pesapi_define_class(
            StaticTypeId<T>::get(), Cdb.superTypeId_, Cdb.className_, Cdb.constructor_, finalize, properties_count, properties);
    }

    template <typename T>
    using Converter = Converter<T>;

    template <typename T>
    using CustomArgumentBufferType = CustomArgumentBufferType<T>;
};

class StringHolder
{
public:
    StringHolder(pesapi_env env, pesapi_value value)
    {
        if (!value)
            return;
        if (pesapi_is_binary(env, value))
        {
            needFree_ = false;
            size_t length = 0;
            str_ = (char*) pesapi_get_value_binary(env, value, &length);
        }
        else
        {
            size_t length = 0;
            str_ = (char*) pesapi_get_value_string_utf8(env, value, nullptr, &length);
            needFree_ = false;
            if (!str_)
            {
                str_ = new char[length + 1];
                pesapi_get_value_string_utf8(env, value, str_, &length);
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
    static pesapi_value toScript(pesapi_env env, T value)
    {
        return pesapi_create_int64(env, value);
    }

    static T toCpp(pesapi_env env, pesapi_value value)
    {
        return static_cast<T>(pesapi_get_value_int64(env, value));
    }

    static bool accept(pesapi_env env, pesapi_value value)
    {
        return pesapi_is_int64(env, value);
    }
};

template <typename T>
struct Converter<T, typename std::enable_if<std::is_integral<T>::value && sizeof(T) == 8 && !std::is_signed<T>::value>::type>
{
    static pesapi_value toScript(pesapi_env env, T value)
    {
        return pesapi_create_uint64(env, value);
    }

    static T toCpp(pesapi_env env, pesapi_value value)
    {
        return static_cast<T>(pesapi_get_value_uint64(env, value));
    }

    static bool accept(pesapi_env env, pesapi_value value)
    {
        return pesapi_is_uint64(env, value);
    }
};

template <typename T>
struct Converter<T, typename std::enable_if<std::is_integral<T>::value && sizeof(T) < 8 && std::is_signed<T>::value>::type>
{
    static pesapi_value toScript(pesapi_env env, T value)
    {
        return pesapi_create_int32(env, value);
    }

    static T toCpp(pesapi_env env, pesapi_value value)
    {
        return static_cast<T>(pesapi_get_value_int32(env, value));
    }

    static bool accept(pesapi_env env, pesapi_value value)
    {
        return pesapi_is_int32(env, value);
    }
};

template <typename T>
struct Converter<T, typename std::enable_if<std::is_integral<T>::value && sizeof(T) < 8 && !std::is_signed<T>::value>::type>
{
    static pesapi_value toScript(pesapi_env env, T value)
    {
        return pesapi_create_uint32(env, value);
    }

    static T toCpp(pesapi_env env, pesapi_value value)
    {
        return static_cast<T>(pesapi_get_value_uint32(env, value));
    }

    static bool accept(pesapi_env env, pesapi_value value)
    {
        return pesapi_is_uint32(env, value);
    }
};

template <typename T>
struct Converter<T, typename std::enable_if<std::is_enum<T>::value>::type>
{
    static pesapi_value toScript(pesapi_env env, T value)
    {
        return pesapi_create_int32(env, static_cast<int>(value));
    }

    static T toCpp(pesapi_env env, pesapi_value value)
    {
        return static_cast<T>(pesapi_get_value_int32(env, value));
    }

    static bool accept(pesapi_env env, pesapi_value value)
    {
        return pesapi_is_int32(env, value);
    }
};

template <typename T>
struct Converter<T, typename std::enable_if<std::is_floating_point<T>::value>::type>
{
    static pesapi_value toScript(pesapi_env env, T value)
    {
        return pesapi_create_double(env, value);
    }

    static T toCpp(pesapi_env env, pesapi_value value)
    {
        return static_cast<T>(pesapi_get_value_double(env, value));
    }

    static bool accept(pesapi_env env, pesapi_value value)
    {
        return pesapi_is_double(env, value);
    }
};

template <>
struct Converter<std::string>
{
    static pesapi_value toScript(pesapi_env env, std::string value)
    {
        return pesapi_create_string_utf8(env, value.c_str(), value.size());
    }

    static std::string toCpp(pesapi_env env, pesapi_value value)
    {
        size_t bufSize = 0;
        const char* str = pesapi_get_value_string_utf8(env, value, nullptr, &bufSize);
        if (str)
        {
            return std::string(str);
        }
        else
        {
            std::vector<char> buffer(bufSize + 1);
            str = pesapi_get_value_string_utf8(env, value, buffer.data(), &bufSize);
            return std::string(str);
        }
    }

    static bool accept(pesapi_env env, pesapi_value value)
    {
        return pesapi_is_string(env, value);
    }
};

template <>
struct Converter<const char*>
{
    static pesapi_value toScript(pesapi_env env, const char* value)
    {
        return pesapi_create_string_utf8(env, value, strlen(value));
    }

    static bool accept(pesapi_env env, pesapi_value value)
    {
        return pesapi_is_string(env, value);
    }
};

template <>
struct Converter<void*>
{
    static pesapi_value toScript(pesapi_env env, void* value)
    {
        return pesapi_create_binary(env, value, 0);
    }

    static void* toCpp(pesapi_env env, pesapi_value value)
    {
        size_t bufsize;
        return pesapi_get_value_binary(env, value, &bufsize);
    }

    static bool accept(pesapi_env env, pesapi_value value)
    {
        return pesapi_is_binary(env, value);
    }
};

template <>
struct Converter<bool>
{
    static pesapi_value toScript(pesapi_env env, bool value)
    {
        return pesapi_create_boolean(env, value);
    }

    static bool toCpp(pesapi_env env, pesapi_value value)
    {
        return pesapi_get_value_bool(env, value);
    }

    static bool accept(pesapi_env env, pesapi_value value)
    {
        return pesapi_is_boolean(env, value);
    }
};

template <typename T>
struct Converter<std::reference_wrapper<T>, typename std::enable_if<!is_objecttype<T>::value>::type>
{
    static pesapi_value toScript(pesapi_env env, const T& value)
    {
        return pesapi_create_ref(env, Converter<T>::toScript(env, value));
    }

    static T toCpp(pesapi_env env, pesapi_value value)
    {
        return Converter<T>::toCpp(env, pesapi_get_value_ref(env, value));
    }

    static bool accept(pesapi_env env, pesapi_value value)
    {
        return pesapi_is_ref(env, value);    // do not checked inner
    }
};

template <typename T>
struct Converter<std::reference_wrapper<T>, typename std::enable_if<is_objecttype<T>::value>::type>
{
    static pesapi_value toScript(pesapi_env env, const T& value)
    {
        return pesapi_create_ref(env, Converter<T>::toScript(env, value));
    }

    static T* toCpp(pesapi_env env, pesapi_value value)
    {
        if (pesapi_is_object(env, value))
        {
            return Converter<T*>::toCpp(env, pesapi_get_value_ref(env, value));
        }
        return nullptr;
    }

    static bool accept(pesapi_env env, pesapi_value value)
    {
        return pesapi_is_ref(env, value);    // do not checked inner
    }
};

template <typename T>
struct Converter<T,
    typename std::enable_if<is_script_type<typename std::remove_pointer<T>::type>::value && !std::is_array<T>::value &&
                            !std::is_const<typename std::remove_pointer<T>::type>::value && std::is_pointer<T>::value>::type>
{
    static pesapi_value toScript(pesapi_env env, T value)
    {
        return pesapi_create_binary(env, value, 0);
    }

    static T toCpp(pesapi_env env, pesapi_value value)
    {
        size_t bufsize;
        return static_cast<T>(pesapi_get_value_binary(env, value, &bufsize));
    }

    static bool accept(pesapi_env env, pesapi_value value)
    {
        return pesapi_is_binary(env, value);
    }
};

template <typename T, std::size_t Size>
struct Converter<T[Size], typename std::enable_if<is_script_type<T>::value && !std::is_const<T>::value>::type>
{
    static pesapi_value toScript(pesapi_env env, T value[Size])
    {
        return pesapi_create_binary(env, value, sizeof(T) * Size);
    }

    static bool accept(pesapi_env env, pesapi_value value)
    {
        return pesapi_is_binary(env, value);
    }
};

template <class T>
struct Converter<T, typename std::enable_if<std::is_copy_constructible<T>::value && std::is_constructible<T>::value &&
                                            is_objecttype<T>::value && !is_uetype<T>::value>::type>
{
    static pesapi_value toScript(pesapi_env env, T value)
    {
        return pesapi_create_native_object(env, puerts::DynamicTypeId<T>::get(&value), new T(value), true);
    }
    static T toCpp(pesapi_env env, pesapi_value value)
    {
        T* ptr = (static_cast<T*>(pesapi_get_native_object_ptr(env, value)));
        return ptr ? *ptr : T{};
    }
    static bool accept(pesapi_env env, pesapi_value value)
    {
        return pesapi_is_native_object(env, puerts::StaticTypeId<T>::get(), value);
    }
};

}    // namespace pesapi_impl

template <>
struct is_script_type<std::string> : std::true_type
{
};

template <typename T, size_t Size>
struct ScriptTypeName<T[Size], typename std::enable_if<is_script_type<T>::value && !std::is_const<T>::value>::type>
{
    static constexpr auto value()
    {
        return internal::Literal("ArrayBuffer");
    }
};

template <>
struct ScriptTypeName<void*>
{
    static constexpr auto value()
    {
        return internal::Literal("ArrayBuffer");
    }
};

template <>
struct ScriptTypeName<const void*>
{
    static constexpr auto value()
    {
        return internal::Literal("ArrayBuffer");
    }
};

}    // namespace puerts

#endif

/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#if defined(BUILDING_PES_EXTENSION)

#include <type_traits>
#include <string>
#include <functional>
#include <vector>
#include <pesapi.h>
#include "TypeInfo.hpp"

#define __DefObjectType(CLS) \
    namespace puerts { template<> struct is_objecttype<CLS> : public std::true_type {}; }

#define __DefCDataPointerConverter(CLS)                                                                          \
namespace puerts {                                                                                               \
namespace converter {                                                                                            \
    template <>                                                                                                  \
    struct Converter<CLS*> {                                                                                     \
        static pesapi_value toScript(pesapi_env env, CLS * value)                                                \
        {                                                                                                        \
            return pesapi_create_native_object(env, puerts::ScriptTypeName<CLS>::value, value, false);                                         \
        }                                                                                                        \
        static CLS * toCpp(pesapi_env env, pesapi_value value)                                                   \
        {                                                                                                        \
            return static_cast<CLS*>(pesapi_get_native_object_ptr(env, value));                                  \
        }                                                                                                        \
        static bool accept(pesapi_env env, pesapi_value value)                                                   \
        {                                                                                                        \
            return pesapi_is_native_object(env, puerts::ScriptTypeName<CLS>::value, value);                                                    \
        }                                                                                                        \
    };                                                                                                           \
}                                                                                                                \
}

namespace puerts
{
    typedef pesapi_callback_info CallbackInfoType;
    typedef pesapi_env ContextType;
    typedef pesapi_value ValueType;
    typedef void (*FunctionCallbackType)(pesapi_callback_info info);
    typedef void*(*InitializeFuncType)(pesapi_callback_info Info);
    struct GeneralFunctionInfo
    {
        const char* Name;
        FunctionCallbackType Callback;
        void *Data = nullptr;
    };

    struct GeneralPropertyInfo
    {
        const char* Name;
        FunctionCallbackType Getter;
        FunctionCallbackType Setter;
        void *Data = nullptr;
    };

    struct GeneralFunctionReflectionInfo
    {
        const char* Name;
        const CFunctionInfo* Type;
    };

    struct GeneralPropertyReflectionInfo
    {
        const char* Name;
        const char* Type;
    };

    inline int GetArgsLen(pesapi_callback_info info)
    {
        return pesapi_get_args_len(info);
    }

    inline pesapi_value GetArg(pesapi_callback_info info, int index)
    {
        return pesapi_get_arg(info, index);
    }

    inline pesapi_env GetContext(pesapi_callback_info info)
    {
        return pesapi_get_env(info);
    }
    inline pesapi_value GetThis(pesapi_callback_info info)
    {
        return pesapi_get_this(info);
    }
    
    inline pesapi_value GetHolder(pesapi_callback_info info)
    {
        return pesapi_get_holder(info);
    }

    inline void ThrowException(pesapi_env env, const char* msg)
    {
        pesapi_throw_by_string(env, msg);
    }

    inline void SetReturn(pesapi_callback_info info, pesapi_value value)
    {
        pesapi_add_return(info, value);
    }

    inline void UpdateRefValue(pesapi_env env, pesapi_value holder, pesapi_value value)
    {
        if (pesapi_is_object(env, holder))
        {
            pesapi_update_value_ref(env, holder, value);
        }
    }

    template<typename T>
    inline T * FastGetNativeObjectPointer(pesapi_env env, pesapi_value value)
    {
        return static_cast<T*>(pesapi_get_native_object_ptr(env, value));
    }
    
}


namespace puerts
{
namespace converter
{

template <typename T, typename Enable = void>
struct Converter;

template <typename T>
struct Converter<T, typename std::enable_if<std::is_integral<T>::value && sizeof(T) == 8 && std::is_signed<T>::value>::type> {
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
struct Converter<T, typename std::enable_if<std::is_integral<T>::value && sizeof(T) == 8 && !std::is_signed<T>::value>::type> {
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
struct Converter<T, typename std::enable_if<std::is_integral<T>::value && sizeof(T) < 8 && std::is_signed<T>::value>::type> {
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
struct Converter<T, typename std::enable_if<std::is_integral<T>::value && sizeof(T) < 8 && !std::is_signed<T>::value>::type> {
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
struct Converter<T, typename std::enable_if<std::is_enum<T>::value>::type> {
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
struct Converter<T, typename std::enable_if<std::is_floating_point<T>::value>::type> {
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
struct Converter<std::string> {
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
struct Converter<const char*> {
    static pesapi_value toScript(pesapi_env env, const char* value)
    {
        return pesapi_create_string_utf8(env, value, strlen(value));
    }

    static const char* toCpp(pesapi_env env, pesapi_value value)
    {
        return nullptr;
    }

    static bool accept(pesapi_env env, pesapi_value value)
    {
        return pesapi_is_string(env, value);
    }
};

template <>
struct Converter<bool> {
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
struct Converter<std::reference_wrapper<T>> {
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
        return pesapi_is_ref(env, value); // do not checked inner
    }
};

template <class T>                                                                                                         
struct Converter<T, typename std::enable_if<std::is_copy_constructible<T>::value && std::is_constructible<T>::value
                        && is_objecttype<T>::value && !is_uetype<T>::value>::type> {
    static pesapi_value toScript(pesapi_env env, T value)
    {
        return pesapi_create_native_object(env, puerts::ScriptTypeName<T>::value, new T(value), false);
    }
    static T toCpp(pesapi_env env, pesapi_value value)
    {
        return *(static_cast<T*>(pesapi_get_native_object_ptr(env, value))); 
    }
    static bool accept(pesapi_env env, pesapi_value value)    
    {
        return pesapi_is_native_object(env, puerts::ScriptTypeName<T>::value, value);
    }
};
    
}
}

#endif

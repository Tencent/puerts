/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include <string>
#ifdef WITH_V8_FAST_CALL
#include "V8FastCall.hpp"
#endif
#include "PuertsNamespaceDef.h"

#define __DefScriptTTypeName(CLSNAME, CLS)      \
    namespace PUERTS_NAMESPACE                  \
    {                                           \
    template <>                                 \
    struct ScriptTypeName<CLS>                  \
    {                                           \
        static constexpr auto value()           \
        {                                       \
            return internal::Literal(#CLSNAME); \
        }                                       \
    };                                          \
    }

#define PUERTS_BINDING_PROTO_ID() "fdq4falqlqcq"

#if defined(WITH_QJS_NAMESPACE_SUFFIX)
namespace v8_qjs
{
class CFunction;
}

namespace v8 = v8_qjs;
#else
namespace v8
{
class CFunction;
}
#endif

namespace PUERTS_NAMESPACE
{
namespace internal
{
template <std::size_t N>
class StringLiteral
{
public:
    template <typename... Characters>
    constexpr StringLiteral(Characters... characters) : m_value{characters..., '\0'}
    {
    }

    template <std::size_t... Indexes>
    constexpr StringLiteral(const char (&value)[N + 1], std::index_sequence<Indexes...> dummy) : StringLiteral(value[Indexes]...)
    {
    }

    constexpr StringLiteral(const char (&value)[N + 1]) : StringLiteral(value, std::make_index_sequence<N>{})
    {
    }

    constexpr char operator[](const std::size_t index) const
    {
        return m_value[index];
    }

    constexpr const char* Data() const
    {
        return m_value;
    }

    template <std::size_t Start, std::size_t... Index>
    constexpr StringLiteral<N - Start> Sub(std::index_sequence<Index...> dummy) const
    {
        return StringLiteral<N - Start>(m_value[Start + Index]...);
    }

    template <std::size_t Start>
    constexpr StringLiteral<N - Start> Sub() const
    {
        return Sub<Start>(std::make_index_sequence<N - Start>());
    }

private:
    const char m_value[N + 1];
};

template <typename Left, typename Right, std::size_t... IndexesLeft, std::size_t... IndexesRight>
constexpr StringLiteral<sizeof...(IndexesLeft) + sizeof...(IndexesRight)> ConcatStrings(
    const Left& lhs, const Right& rhs, std::index_sequence<IndexesLeft...> dummy1, std::index_sequence<IndexesRight...> dummy2)
{
    return StringLiteral<sizeof...(IndexesLeft) + sizeof...(IndexesRight)>(lhs[IndexesLeft]..., rhs[IndexesRight]...);
}

template <std::size_t X, std::size_t Y>
constexpr StringLiteral<X + Y> operator+(const StringLiteral<X>& lhs, const StringLiteral<Y>& rhs)
{
    return ConcatStrings(lhs, rhs, std::make_index_sequence<X>(), std::make_index_sequence<Y>());
}

template <std::size_t N>
constexpr auto Literal(const char (&value)[N])
{
    return StringLiteral<N - 1>(value, typename std::make_index_sequence<N - 1>{});
}

}    // namespace internal

template <typename T, typename Enable = void>
struct ScriptTypeName
{
};

template <typename T, typename Enable = void>
struct ScriptTypeNameWithNamespace
{
    static constexpr auto value()
    {
        return ScriptTypeName<T>::value();
    }
};

template <typename T>
struct ScriptTypeName<T*>
{
    static constexpr auto value()
    {
        return ScriptTypeName<typename std::remove_cv<T>::type>::value();
    }
};

template <typename T>
struct ScriptTypeName<T&>
{
    static constexpr auto value()
    {
        return ScriptTypeName<typename std::remove_cv<T>::type>::value();
    }
};

template <typename T>
struct ScriptTypeName<T&&>
{
    static constexpr auto value()
    {
        return ScriptTypeName<typename std::remove_cv<T>::type>::value();
    }
};

template <typename T>
struct ScriptTypeName<T, typename std::enable_if<std::is_integral<T>::value && sizeof(T) == 8>::type>
{
    static constexpr auto value()
    {
        return internal::Literal("bigint");
    }
};

template <typename T>
struct ScriptTypeName<T, typename std::enable_if<std::is_enum<T>::value>::type>
{
    static constexpr auto value()
    {
        return internal::Literal("number");
    }
};

template <typename T>
struct ScriptTypeName<T,
    typename std::enable_if<std::is_floating_point<T>::value || (std::is_integral<T>::value && sizeof(T) < 8)>::type>
{
    static constexpr auto value()
    {
        return internal::Literal("number");
    }
};

template <>
struct ScriptTypeName<std::string>
{
    static constexpr auto value()
    {
        return internal::Literal("string");
    }
};

template <>
struct ScriptTypeName<const char*>
{
    static constexpr auto value()
    {
        return internal::Literal("cstring");
    }
};

template <>
struct ScriptTypeName<bool>
{
    static constexpr auto value()
    {
        return internal::Literal("boolean");
    }
};

template <>
struct ScriptTypeName<void>
{
    static constexpr auto value()
    {
        return internal::Literal("void");
    }
};

template <typename T>
struct StaticTypeId
{
    static const void* get()
    {
        static T* dummy = nullptr;
        return &dummy;
    }
};

template <typename T, typename Enable = void>
struct DynamicTypeId
{
    static const void* get(T* Obj)
    {
        return StaticTypeId<T>::get();
    }
};

template <typename T>
struct is_uetype : std::false_type
{
};

template <typename T>
struct is_objecttype : std::false_type
{
};

template <typename T, typename Enable = void>
struct is_script_type : std::false_type
{
};

template <typename T>
struct is_script_type<T, typename std::enable_if<std::is_fundamental<T>::value && !std::is_same<T, void>::value>::type>
    : std::true_type
{
};

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
        return internal::Literal("any");
    }
};

template <>
struct ScriptTypeName<const void*>
{
    static constexpr auto value()
    {
        return internal::Literal("any");
    }
};

class CTypeInfo
{
public:
    virtual const char* Name() const = 0;
    virtual bool IsPointer() const = 0;
    virtual bool IsRef() const = 0;
    virtual bool IsConst() const = 0;
    virtual bool IsUEType() const = 0;
    virtual bool IsObjectType() const = 0;
};

class CFunctionInfo
{
public:
    virtual const CTypeInfo* Return() const = 0;
    virtual unsigned int ArgumentCount() const = 0;
    virtual unsigned int DefaultCount() const = 0;
    virtual const CTypeInfo* Argument(unsigned int index) const = 0;
    virtual const char* CustomSignature() const = 0;
    virtual const class v8::CFunction* FastCallInfo() const = 0;
};

template <typename T, bool ScriptTypePtrAsRef>
class CTypeInfoImpl : CTypeInfo
{
public:
    virtual const char* Name() const override
    {
        static auto NameLiteral = ScriptTypeName<T>::value();
        return NameLiteral.Data();
    }
    virtual bool IsPointer() const override
    {
        return std::is_pointer<T>::value && !ScriptTypePtrAsRef;
    };
    virtual bool IsRef() const override
    {
        return (std::is_reference<T>::value && !std::is_const<typename std::remove_reference<T>::type>::value) ||
               (std::is_pointer<T>::value &&
                   !std::is_same<void, typename std::decay<typename std::remove_pointer<T>::type>::type>::value &&
                   !std::is_same<char, typename std::decay<typename std::remove_pointer<T>::type>::type>::value &&
                   ScriptTypePtrAsRef && !IsUEType() && !IsObjectType());
    };
    virtual bool IsConst() const override
    {
        return std::is_const<typename std::remove_pointer<typename std::decay<T>::type>::type>::value;
    };
    virtual bool IsUEType() const override
    {
        return is_uetype<typename std::remove_const<typename std::remove_pointer<typename std::decay<T>::type>::type>::type>::value;
    };
    virtual bool IsObjectType() const override
    {
        return is_objecttype<
            typename std::remove_const<typename std::remove_pointer<typename std::decay<T>::type>::type>::type>::value;
    };

    static const CTypeInfo* get()
    {
        static CTypeInfoImpl instance;
        return &instance;
    }
};

template <typename Ret, bool ScriptTypePtrAsRef, std::size_t StartParameter, typename... Args>
class CFunctionInfoImpl : public CFunctionInfo
{
protected:
    const CTypeInfo* return_;
    const unsigned int argCount_;
    const CTypeInfo* arguments_[sizeof...(Args) + 1];
    unsigned int defaultCount_;

    CFunctionInfoImpl()
        : return_(CTypeInfoImpl<Ret, ScriptTypePtrAsRef>::get())
        , argCount_(sizeof...(Args))
        , arguments_{CTypeInfoImpl<Args, ScriptTypePtrAsRef>::get()...}
        , defaultCount_(0)
    {
    }

    virtual ~CFunctionInfoImpl()
    {
    }

public:
    virtual const CTypeInfo* Return() const override
    {
        return return_;
    }
    virtual unsigned int ArgumentCount() const override
    {
        return argCount_ - StartParameter;
    }
    virtual unsigned int DefaultCount() const override
    {
        return defaultCount_;
    }
    virtual const CTypeInfo* Argument(unsigned int index) const override
    {
        return arguments_[index + StartParameter];
    }
    virtual const char* CustomSignature() const override
    {
        return nullptr;
    }
    virtual const class v8::CFunction* FastCallInfo() const override
    {
        return nullptr;
    };

    static const CFunctionInfo* get(unsigned int defaultCount)
    {
        static CFunctionInfoImpl instance{};
        instance.defaultCount_ = defaultCount;
        return &instance;
    }
};

template <typename T, T, bool, std::size_t StartParameter = 0>
class CFunctionInfoByPtrImpl
{
};

template <typename Ret, typename... Args, Ret (*func)(Args...), bool ScriptTypePtrAsRef, std::size_t StartParameter>
class CFunctionInfoByPtrImpl<Ret (*)(Args...), func, ScriptTypePtrAsRef, StartParameter>
    : public CFunctionInfoImpl<Ret, ScriptTypePtrAsRef, StartParameter, Args...>
{
public:
    virtual ~CFunctionInfoByPtrImpl()
    {
    }
#ifdef WITH_V8_FAST_CALL
    virtual const class v8::CFunction* FastCallInfo() const override
    {
        return V8FastCall<Ret (*)(Args...), func>::info();
    };
#endif

    static const CFunctionInfo* get(unsigned int defaultCount)
    {
        static CFunctionInfoByPtrImpl instance{};
        instance.defaultCount_ = defaultCount;
        return &instance;
    }
};

template <typename Inc, typename Ret, typename... Args, Ret (Inc::*func)(Args...), bool ScriptTypePtrAsRef>
class CFunctionInfoByPtrImpl<Ret (Inc::*)(Args...), func, ScriptTypePtrAsRef>
    : public CFunctionInfoImpl<Ret, ScriptTypePtrAsRef, 0, Args...>
{
public:
    virtual ~CFunctionInfoByPtrImpl()
    {
    }
#ifdef WITH_V8_FAST_CALL
    virtual const class v8::CFunction* FastCallInfo() const override
    {
        return V8FastCall<Ret (Inc::*)(Args...), func>::info();
    };
#endif

    static const CFunctionInfo* get(unsigned int defaultCount)
    {
        static CFunctionInfoByPtrImpl instance{};
        instance.defaultCount_ = defaultCount;
        return &instance;
    }
};

template <typename Inc, typename Ret, typename... Args, Ret (Inc::*func)(Args...) const, bool ScriptTypePtrAsRef>
class CFunctionInfoByPtrImpl<Ret (Inc::*)(Args...) const, func, ScriptTypePtrAsRef>
    : public CFunctionInfoImpl<Ret, ScriptTypePtrAsRef, 0, Args...>
{
public:
    virtual ~CFunctionInfoByPtrImpl()
    {
    }
#ifdef WITH_V8_FAST_CALL
    virtual const class v8::CFunction* FastCallInfo() const override
    {
        return V8FastCall<Ret (Inc::*)(Args...) const, func>::info();
    };
#endif

    static const CFunctionInfo* get(unsigned int defaultCount)
    {
        static CFunctionInfoByPtrImpl instance{};
        instance.defaultCount_ = defaultCount;
        return &instance;
    }
};

class CFunctionInfoWithCustomSignature : public CFunctionInfo
{
    const char* _signature;

public:
    CFunctionInfoWithCustomSignature(const char* signature) : _signature(signature)
    {
    }

    virtual ~CFunctionInfoWithCustomSignature()
    {
    }

    virtual const CTypeInfo* Return() const override
    {
        return nullptr;
    }
    virtual unsigned int ArgumentCount() const override
    {
        return 0;
    }
    virtual unsigned int DefaultCount() const override
    {
        return 0;
    }
    virtual const CTypeInfo* Argument(unsigned int index) const override
    {
        return nullptr;
    }
    virtual const char* CustomSignature() const override
    {
        return _signature;
    }
    virtual const class v8::CFunction* FastCallInfo() const override
    {
        return nullptr;
    };
};

struct NamedFunctionInfo
{
    const char* Name;
    const CFunctionInfo* Type;
};

struct NamedPropertyInfo
{
    const char* Name;
    const CTypeInfo* Type;
};

}    // namespace PUERTS_NAMESPACE

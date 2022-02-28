/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include <string>

#define __DefScriptTTypeName(CLSNAME, CLS)             \
    namespace puerts                                   \
    {                                                  \
    template <>                                        \
    struct ScriptTypeName<CLS>                         \
    {                                                  \
        static constexpr const char* value = #CLSNAME; \
    };                                                 \
    }

namespace puerts
{
template <typename T, typename Enable = void>
struct ScriptTypeName
{
};

template <typename T>
struct ScriptTypeName<T*>
{
    static constexpr const char* value = ScriptTypeName<typename std::remove_cv<T>::type>::value;
};

template <typename T>
struct ScriptTypeName<T&>
{
    static constexpr const char* value = ScriptTypeName<typename std::remove_cv<T>::type>::value;
};

template <typename T>
struct ScriptTypeName<T&&>
{
    static constexpr const char* value = ScriptTypeName<typename std::remove_cv<T>::type>::value;
};

template <typename T>
struct ScriptTypeName<T, typename std::enable_if<std::is_integral<T>::value && sizeof(T) == 8>::type>
{
    static constexpr const char* value = "bigint";
};

template <typename T>
struct ScriptTypeName<T, typename std::enable_if<std::is_enum<T>::value>::type>
{
    static constexpr const char* value = "number";
};

template <typename T>
struct ScriptTypeName<T,
    typename std::enable_if<std::is_floating_point<T>::value || (std::is_integral<T>::value && sizeof(T) < 8)>::type>
{
    static constexpr const char* value = "number";
};

template <>
struct ScriptTypeName<std::string>
{
    static constexpr const char* value = "string";
};

template <>
struct ScriptTypeName<bool>
{
    static constexpr const char* value = "boolean";
};

template <>
struct ScriptTypeName<void>
{
    static constexpr const char* value = "void";
};

template <typename T>
struct is_uetype : public std::false_type
{
};

template <typename T>
struct is_objecttype : public std::false_type
{
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
    virtual const CTypeInfo* Argument(unsigned int index) const = 0;
};

template <typename T>
class CTypeInfoImpl : CTypeInfo
{
public:
    virtual const char* Name() const override
    {
        return ScriptTypeName<T>::value;
    }
    virtual bool IsPointer() const override
    {
        return std::is_pointer<T>::value;
    };
    virtual bool IsRef() const override
    {
        return std::is_reference<T>::value && !std::is_const<typename std::remove_reference<T>::type>::value;
    };
    virtual bool IsConst() const override
    {
        return std::is_const<T>::value;
    };
    virtual bool IsUEType() const override
    {
        return is_uetype<typename std::remove_pointer<typename std::decay<T>::type>::type>::value;
    };
    virtual bool IsObjectType() const override
    {
        return is_objecttype<typename std::remove_pointer<typename std::decay<T>::type>::type>::value;
    };

    static const CTypeInfo* get()
    {
        static CTypeInfoImpl instance;
        return &instance;
    }
};

template <typename Ret, typename... Args>
class CFunctionInfoImpl : CFunctionInfo
{
    const CTypeInfo* return_;
    const unsigned int argCount_;
    const CTypeInfo* arguments_[sizeof...(Args) + 1];

    CFunctionInfoImpl() : return_(CTypeInfoImpl<Ret>::get()), argCount_(sizeof...(Args)), arguments_{CTypeInfoImpl<Args>::get()...}
    {
    }

public:
    virtual const CTypeInfo* Return() const override
    {
        return return_;
    }
    virtual unsigned int ArgumentCount() const override
    {
        return argCount_;
    }
    virtual const CTypeInfo* Argument(unsigned int index) const override
    {
        return arguments_[index];
    }

    static const CFunctionInfo* get()
    {
        static CFunctionInfoImpl instance{};
        return &instance;
    }
};

}    // namespace puerts

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
struct ScriptTypeName<const char*>
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
struct StaticTypeId
{
    static void* get()
    {
        static T* dummy = nullptr;
        return &dummy;
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
struct is_script_type<T, typename std::enable_if<std::is_fundamental<T>::value>::type> : std::true_type
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
    virtual unsigned int DefaultCount() const = 0;
    virtual const CTypeInfo* Argument(unsigned int index) const = 0;
    virtual const char* CustomSignature() const = 0;
};

template <typename T, bool ScriptTypePtrAsRef>
class CTypeInfoImpl : CTypeInfo
{
public:
    virtual const char* Name() const override
    {
        return ScriptTypeName<T>::value;
    }
    virtual bool IsPointer() const override
    {
        return std::is_pointer<T>::value && !ScriptTypePtrAsRef;
    };
    virtual bool IsRef() const override
    {
        return std::is_reference<T>::value && !std::is_const<typename std::remove_reference<T>::type>::value ||
               std::is_pointer<T>::value && ScriptTypePtrAsRef && !IsConst() && !IsUEType() && !IsObjectType();
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

template <typename Ret, bool ScriptTypePtrAsRef, typename... Args>
class CFunctionInfoImpl : CFunctionInfo
{
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

public:
    virtual const CTypeInfo* Return() const override
    {
        return return_;
    }
    virtual unsigned int ArgumentCount() const override
    {
        return argCount_;
    }
    virtual unsigned int DefaultCount() const override
    {
        return defaultCount_;
    }
    virtual const CTypeInfo* Argument(unsigned int index) const override
    {
        return arguments_[index];
    }
    virtual const char* CustomSignature() const override
    {
        return nullptr;
    }

    static const CFunctionInfo* get(unsigned int defaultCount)
    {
        static CFunctionInfoImpl instance{};
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
};

}    // namespace puerts

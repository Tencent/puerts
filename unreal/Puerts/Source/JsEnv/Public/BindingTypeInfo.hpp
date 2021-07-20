/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#include <string>

#define __DefScriptTTypeName(CLSNAME, CLS)                  \
    template<>                                              \
    const char *::puerts::ScriptTypeName<CLS>::get()      \
    {                                                       \
        return #CLSNAME;                                    \
    }

namespace puerts
{
    
template<typename T , typename Enable = void>
struct ScriptTypeName {
    static const char *get();
};

template<typename T>
struct ScriptTypeName<const T *> {
    static const char *get()
    {
        return ScriptTypeName<T>::get();
    }
};

template<typename T>
struct ScriptTypeName<T *> {
    static const char *get()
    {
        return ScriptTypeName<T>::get();
    }
};

template<typename T>
struct ScriptTypeName<T &> {
    static const char *get()
    {
        return ScriptTypeName<T>::get();
    }
};

template<typename T>
struct ScriptTypeName<T, typename std::enable_if<std::is_integral<T>::value && sizeof(T) == 8>::type> {
    static const char *get()
    {
        return "bigint";
    }
};

template<typename T>
struct ScriptTypeName<T, typename std::enable_if<std::is_floating_point<T>::value || (std::is_integral<T>::value && sizeof(T) < 8)>::type> {
    static const char *get()
    {
        return "number";
    }
};


template<>
struct ScriptTypeName<std::string> {
    static const char *get()
    {
        return "string";
    }
};

template<>
struct ScriptTypeName<bool> {
    static const char *get()
    {
        return "boolean";
    }
};

template<>
struct ScriptTypeName<void> {
    static const char *get()
    {
        return "void";
    }
};

template<typename T>
constexpr bool is_uetype_v = false;

template <typename T>
class CTypeInfoImpl : CTypeInfo
{
public:
    virtual const char* Name() const override { return ScriptTypeName<T>::get(); }
    virtual bool IsPointer() const override { return std::is_pointer<T>::value; };
    virtual bool IsRef() const override { return std::is_reference<T>::value && !std::is_const<typename std::remove_reference<T>::type>::value; };
    virtual bool IsConst() const override { return std::is_const<T>::value; };
    virtual bool IsUEType() const override { return is_uetype_v<typename std::remove_pointer<typename std::decay<T>::type>::type>; };

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

    CFunctionInfoImpl():
        return_(CTypeInfoImpl<Ret>::get()),
        argCount_(sizeof...(Args)),
        arguments_{CTypeInfoImpl<Args>::get()...}
    {
    }

public:
    virtual const CTypeInfo* Return() const override { return return_; }
    virtual unsigned int ArgumentCount() const override { return argCount_; }
    virtual const CTypeInfo* Argument(unsigned int index) const override {
        return arguments_[index];
    }
    
    static const CFunctionInfo* get()
    {
        static CFunctionInfoImpl instance {};
        return &instance;
    }
};

}



/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#include <string>

#define __DefScriptTTypeName(CLSNAME, CLS)                  \
    template<>                                               \
    constexpr const char* ::puerts::script_type_name_v<CLS> = #CLSNAME;

namespace puerts
{

template<typename T , typename Enable = void>
constexpr const char* script_type_name_v = "";

template<typename T>
constexpr const char* script_type_name_v<const T *> = script_type_name_v<T>;

template<typename T>
constexpr const char* script_type_name_v<T *> = script_type_name_v<T>;

template<typename T>
constexpr const char* script_type_name_v<T &> = script_type_name_v<T>;

template<typename T>
constexpr const char* script_type_name_v<T, typename std::enable_if<std::is_integral<T>::value && sizeof(T) == 8>::type> = "bigint";

template<typename T>
constexpr const char* script_type_name_v<T, typename std::enable_if<std::is_floating_point<T>::value || (std::is_integral<T>::value && sizeof(T) < 8)>::type> = "number";

template<>
constexpr const char* script_type_name_v<std::string> = "string";

template<>
constexpr const char* script_type_name_v<bool> = "boolean";

template<>
constexpr const char* script_type_name_v<void> = "void";

template<typename T>
constexpr bool is_uetype_v = false;

template <typename T>
class CTypeInfoImpl : CTypeInfo
{
public:
    virtual const char* Name() const override { return script_type_name_v<T>; }
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



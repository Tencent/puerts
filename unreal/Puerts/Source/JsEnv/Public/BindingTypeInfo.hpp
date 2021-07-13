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
struct ScriptTypeName<T, std::enable_if_t<std::is_integral_v<T> && sizeof(T) == 8>> {
	static const char *get()
	{
		return "bigint";
	}
};

template<typename T>
struct ScriptTypeName<T, std::enable_if_t<std::is_floating_point_v<T> || (std::is_integral_v<T> && sizeof(T) < 8)>> {
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

template <typename Ret, typename... Args>
class CFunctionInfoImpl : CFunctionInfo
{
	const char* return_;
	const unsigned int argCount_;
	const char* arguments_[sizeof...(Args) + 1];

	CFunctionInfoImpl():
	    return_(ScriptTypeName<Ret>::get()),
	    argCount_(sizeof...(Args)),
	    arguments_{ScriptTypeName<Args>::get()...}
	{
	}

public:
	virtual const char* Return() const override { return return_; }
	virtual unsigned int ArgumentCount() const override { return argCount_; }
	virtual const char* Argument(unsigned int index) const override {
		return arguments_[index];
	}
	
	static const CFunctionInfo* get()
	{
		static CFunctionInfoImpl instance {};
		return &instance;
	}
};

}



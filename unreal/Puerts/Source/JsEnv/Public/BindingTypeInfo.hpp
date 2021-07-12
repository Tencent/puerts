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
    const char *::puerts::ScriptTypeName<CLS>::value()      \
    {                                                       \
        return #CLSNAME;                                    \
    }

namespace puerts
{
    
template<typename T , typename Enable = void>
struct ScriptTypeName {
	static const char *value();
};

template<typename T>
struct ScriptTypeName<const T *> {
	static const char *value()
	{
		return ScriptTypeName<T>::value();
	}
};

template<typename T>
struct ScriptTypeName<T *> {
	static const char *value()
	{
		return ScriptTypeName<T>::value();
	}
};

template<typename T>
struct ScriptTypeName<T, std::enable_if_t<std::is_integral_v<T> && sizeof(T) == 8>> {
	static const char *value()
	{
		return "bigint";
	}
};

template<typename T>
struct ScriptTypeName<T, std::enable_if_t<std::is_floating_point_v<T> || (std::is_integral_v<T> && sizeof(T) <= 8)>> {
	static const char *value()
	{
		return "number";
	}
};


template<>
struct ScriptTypeName<std::string> {
	static const char *value()
	{
		return "string";
	}
};

template<>
struct ScriptTypeName<bool> {
	static const char *value()
	{
		return "boolean";
	}
};

}



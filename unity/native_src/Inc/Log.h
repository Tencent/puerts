/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#ifdef __cplusplus
#include <string>

namespace puerts
{
enum LogLevel
{
    Log = 0,
    Warning = 1,
    Error = 2
};

void PLog(LogLevel Level, const char* Fmt, ...);

}
#else
void puerts_log(const char* fmt, ...);
#endif

typedef void(*LogCallback)(const char* value);

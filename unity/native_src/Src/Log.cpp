/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include "Log.h"
#include <stdarg.h>
#include "Common.h"

extern LogCallback GLogCallback;
extern LogCallback GLogWarningCallback;
extern LogCallback GLogErrorCallback;

namespace PUERTS_NAMESPACE
{

void PLog(LogLevel Level, const std::string Fmt, ...)
{
    static char SLogBuffer[1024];
    va_list list;
    va_start(list, Fmt);
    vsnprintf(SLogBuffer, sizeof(SLogBuffer), Fmt.c_str(), list);
    va_end(list);

    if (Level == Log && GLogCallback)
    {
        GLogCallback(SLogBuffer);
    }
    else if (Level == Warning && GLogWarningCallback)
    {
        GLogWarningCallback(SLogBuffer);
    }
    else if (Level == Error && GLogErrorCallback)
    {
        GLogErrorCallback(SLogBuffer);
    }
}

}
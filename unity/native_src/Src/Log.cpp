/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include "Log.h"
#include <stdarg.h>

extern LogCallback GLogCallback;
extern LogCallback GLogWarningCallback;
extern LogCallback GLogErrorCallback;

namespace puerts
{

void PLog(LogLevel Level, const char* Fmt, ...)
{
    static char SLogBuffer[1024];
    va_list list;
    va_start(list, Fmt);
    vsnprintf(SLogBuffer, sizeof(SLogBuffer), Fmt, list);
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

extern "C"         
{
    void puerts_log(const char* fmt, ...)
    {
        static char SLogBuffer[1024];
        va_list list;
        va_start(list, fmt);
        vsnprintf(SLogBuffer, sizeof(SLogBuffer), fmt, list);
        va_end(list);

        if (GLogCallback)
        {
            GLogCallback(SLogBuffer);
        }
    }
}

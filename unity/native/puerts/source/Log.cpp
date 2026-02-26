/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include "Log.h"
#include <stdarg.h>
#include <atomic>

extern std::atomic<LogCallback> GLogCallback;
extern std::atomic<LogCallback> GLogWarningCallback;
extern std::atomic<LogCallback> GLogErrorCallback;

namespace puerts
{

void PLog(LogLevel Level, const char* Fmt, ...)
{
    // Use thread_local instead of static to avoid data race on the buffer
    // when multiple threads call PLog concurrently
    thread_local char SLogBuffer[1024];
    va_list list;
    va_start(list, Fmt);
    vsnprintf(SLogBuffer, sizeof(SLogBuffer), Fmt, list);
    va_end(list);

    // Atomically load the callback pointer to prevent torn reads on ARM64
    // (weakly-ordered architecture) when SetLogCallback races with PLog
    LogCallback Cb = nullptr;
    if (Level == Log)
    {
        Cb = GLogCallback.load(std::memory_order_acquire);
    }
    else if (Level == Warning)
    {
        Cb = GLogWarningCallback.load(std::memory_order_acquire);
    }
    else if (Level == Error)
    {
        Cb = GLogErrorCallback.load(std::memory_order_acquire);
    }

    if (Cb)
    {
        Cb(SLogBuffer);
    }
}

}

extern "C"         
{
    void puerts_log(const char* fmt, ...)
    {
        thread_local char SLogBuffer[1024];
        va_list list;
        va_start(list, fmt);
        vsnprintf(SLogBuffer, sizeof(SLogBuffer), fmt, list);
        va_end(list);

        LogCallback Cb = GLogCallback.load(std::memory_order_acquire);
        if (Cb)
        {
            Cb(SLogBuffer);
        }
    }
}

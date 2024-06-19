/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include <stdint.h>
#include <functional>
#include <string>

#if !defined(PUERTS_NAMESPACE)
#if defined(WITH_QJS_NAMESPACE_SUFFIX)
#define PUERTS_NAMESPACE puerts_qjs
#else
#define PUERTS_NAMESPACE puerts
#endif
#endif

#ifndef PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS
#if defined(_MSC_VER)
#define PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS __pragma(warning(push)) __pragma(warning(disable : 4668))
#elif defined(__clang__)
#define PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS \
    _Pragma("clang diagnostic push") _Pragma("clang diagnostic ignored \"-Wundef\"")
#elif defined(__GNUC__)
#define PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS _Pragma("GCC diagnostic push") _Pragma("GCC diagnostic ignored \"-Wundef\"")
#endif
#endif    // PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS

#ifndef PRAGMA_ENABLE_UNDEFINED_IDENTIFIER_WARNINGS
#if defined(_MSC_VER)
#define PRAGMA_ENABLE_UNDEFINED_IDENTIFIER_WARNINGS __pragma(warning(pop))
#elif defined(__clang__)
#define PRAGMA_ENABLE_UNDEFINED_IDENTIFIER_WARNINGS _Pragma("clang diagnostic pop")
#elif defined(__GNUC__)
#define PRAGMA_ENABLE_UNDEFINED_IDENTIFIER_WARNINGS _Pragma("GCC diagnostic pop")
#endif
#endif    // PRAGMA_ENABLE_UNDEFINED_IDENTIFIER_WARNINGS

namespace PUERTS_NAMESPACE
{
class V8InspectorChannel
{
public:
    virtual void DispatchProtocolMessage(const std::string& Message) = 0;

    virtual void OnMessage(std::function<void(const std::string&)> Handler) = 0;

    virtual ~V8InspectorChannel()
    {
    }
};

class V8Inspector
{
public:
    virtual void Close() = 0;

    virtual bool Tick() = 0;

    virtual V8InspectorChannel* CreateV8InspectorChannel() = 0;

    virtual ~V8Inspector()
    {
    }
};

// 接受端口和v8::Local<v8::Context>指针，返回一个新的V8Inspector指针
V8Inspector* CreateV8Inspector(int32_t Port, void* InContextPtr);
};    // namespace PUERTS_NAMESPACE
/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#if !defined(PUERTS_NAMESPACE)
#if defined(WITH_QJS_NAMESPACE_SUFFIX)
#define PUERTS_NAMESPACE puerts_qjs
#else
#define PUERTS_NAMESPACE puerts
#endif
#endif

#if !defined(PUERTS_REG_NAMESPACE)
#if defined(WITH_QJS_NAMESPACE_SUFFIX)
#define PUERTS_REG_NAMESPACE puerts_qjs
#else
#define PUERTS_REG_NAMESPACE puerts
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

#ifndef MSVC_PRAGMA
#if !defined(__clang__) && defined(_MSC_VER)
#define MSVC_PRAGMA(Pragma) __pragma(Pragma)
#else
#define MSVC_PRAGMA(...)
#endif
#endif

#if defined(__clang__)
# define PUERTS_HAS_ATTRIBUTE_VISIBILITY (__has_attribute(visibility))
#elif defined(__GNUC__)
# define PUERTS_HAS_ATTRIBUTE_VISIBILITY 1
#else
# define PUERTS_HAS_ATTRIBUTE_VISIBILITY 0
#endif

#ifndef PUERTS_API
#ifdef _MSC_VER
#ifdef BUILDING_PUERTS_API_SHARED
# define PUERTS_API __declspec(dllexport)
#elif USING_PUERTS_API_SHARED
# define PUERTS_API __declspec(dllimport)
#else
# define PUERTS_API
#endif  // BUILDING_V8_SHARED

#else  // _MSC_VER

#if PUERTS_HAS_ATTRIBUTE_VISIBILITY
# ifdef BUILDING_PUERTS_API_SHARED
#  define PUERTS_API __attribute__ ((visibility("default")))
# else
#  define PUERTS_API
# endif
#else
# define PUERTS_API
#endif

#endif  // _MSC_VER
#endif

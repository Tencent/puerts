/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
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

#ifndef PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS
    #define PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS \
		#if defined(_MSC_VER) \
		    #pragma warning(push) \
		    #pragma warning(disable : 4668) \
		#elif defined(__clang__) \
		    #pragma clang diagnostic push \
		    #pragma clang diagnostic ignored "-Wundef" \
		#elif defined(__GNUC__) \
		    #pragma GCC diagnostic push \
		    #pragma GCC diagnostic ignored "-Wundef" \
		#endif
#endif // PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS

#ifndef PRAGMA_ENABLE_UNDEFINED_IDENTIFIER_WARNINGS
	#define PRAGMA_ENABLE_UNDEFINED_IDENTIFIER_WARNINGS \
		#if defined(_MSC_VER) \
		    #pragma warning(pop) \
		#elif defined(__clang__) \
		    #pragma clang diagnostic pop \
		#elif defined(__GNUC__) \
		    #pragma GCC diagnostic pop \
		#endif
#endif // PRAGMA_ENABLE_UNDEFINED_IDENTIFIER_WARNINGS


/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#include "CommonTypes.h"

#pragma warning(push, 0)  
#include <libplatform/libplatform.h>
#include <v8.h>
#pragma warning(pop)

#if !defined(PUERTS_NAMESPACE)
#define PUERTS_NAMESPACE puerts
#endif

#if defined(USING_QJS_SUFFIX) && defined(CUSTOMV8NAMESPACE)
namespace v8 = CUSTOMV8NAMESPACE;
#endif



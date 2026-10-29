/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "CoreMinimal.h"

// Python.h of the engine (the same as IncludePython.h of the PythonScriptPlugin)
#if WITH_PYTHON
#if PLATFORM_WINDOWS
#include "Windows/WindowsHWrapper.h"
#endif
THIRD_PARTY_INCLUDES_START
PRAGMA_DISABLE_REGISTER_WARNINGS
#include "Python.h"
PRAGMA_ENABLE_REGISTER_WARNINGS
THIRD_PARTY_INCLUDES_END
#endif

// the python backend needs python 3.9+ (PyConfig, vectorcall, ...), the python of UE4 (3.7) builds the stub, the same as
// WITH_PYTHON is 0
#if WITH_PYTHON && (PY_VERSION_HEX >= 0x03090000)
#define PUERTS_PAPI_PYTHON 1
#else
#define PUERTS_PAPI_PYTHON 0
#endif

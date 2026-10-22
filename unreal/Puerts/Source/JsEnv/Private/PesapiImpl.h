/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#ifndef WITH_QUICKJS

#include "pesapi.h"

namespace v8impl
{
// pesapi function table implemented by PesapiV8Impl.cpp
extern pesapi_ffi g_pesapi_ffi;
}    // namespace v8impl

namespace pesapi
{
namespace regimpl
{
// registry api implemented by PesapiRegister.cpp
extern pesapi_registry_api g_reg_apis;

// set module name here during loading, set nullptr after module loaded
extern const char* GPesapiModuleName;

// handle of the default class registry (a ScriptClassRegistry*), passed to addons and used by all unreal envs
pesapi_registry GetDefaultRegistry();
}    // namespace regimpl
}    // namespace pesapi

#endif

/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

// Selects the backend of the template binding, shared by ScriptBackend.hpp and Object.hpp so the v8 headers are only included
// when the v8_impl binding is selected.
//  - default (pesapi_impl): PesapiBackend.hpp, works with every script engine, no v8 header is included.
//  - PUERTS_BINDING_IMPL=v8_impl: V8Backend.hpp, for the business code that knows the engine is v8 and wants the v8 fast path.

#ifndef PUERTS_BINDING_IMPL
#define PUERTS_BINDING_IMPL pesapi_impl
#define PUERTS_BINDING_IS_PESAPI 1
#endif

// PUERTS_BINDING_IMPL defined by user without PUERTS_BINDING_IS_PESAPI: only v8_impl is supported besides pesapi_impl
#ifndef PUERTS_BINDING_IS_PESAPI
#define PUERTS_BINDING_IS_PESAPI 0
#endif

#if defined(BUILDING_PES_EXTENSION) && !PUERTS_BINDING_IS_PESAPI
#error "the pesapi based extension can only use the pesapi backend"
#endif

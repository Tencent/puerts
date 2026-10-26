/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

// Promise rejection tracking of the papi-v8 backend: forwards the promise reject events of the engine to a js handler,
//
//   handler(event, promise, value)
//
// event (the same values as node / v8):
//   0 a promise is rejected with no handler, value is the reason
//   1 a handler is added to a rejected promise (which was reported by 0), value is undefined
//   2 reject after the promise is resolved, value is the reason
//   3 resolve after the promise is resolved, value is the resolution
//
// The handler is called inside the engine (a microtask, a promise api), it should only record the events and process them
// later (see puerts/promises.js). An exception thrown by the handler does not propagate, it is reported by OnHandlerError.
//
// Engine independent interface, only pesapi types are used, it will be merged into the backend api of the shared papi dll.

#ifndef WITH_QUICKJS

#include "pesapi.h"
#include "NamespaceDef.h"

namespace PUERTS_NAMESPACE
{
namespace papi_v8
{
class FPromiseRejectTracker;

typedef void (*FPromiseRejectHandlerErrorCallback)(void* UserData, const char* Error);

// starts tracking the promise rejections of the env (one per isolate), no handler is set; OnHandlerError (may be null)
// receives the exception (as a string with the stack) thrown by the handler
FPromiseRejectTracker* CreatePromiseRejectTracker(
    pesapi_env Env, FPromiseRejectHandlerErrorCallback OnHandlerError, void* UserData);

// stops tracking and releases the handler, must be called before the object mapper of the env is uninitialized
void DestroyPromiseRejectTracker(FPromiseRejectTracker* Tracker);

// sets the handler, a value which is not a function (undefined, null) clears it; returns false if no tracker is created
bool SetPromiseRejectHandler(pesapi_env Env, pesapi_value Handler);
}    // namespace papi_v8
}    // namespace PUERTS_NAMESPACE

#endif

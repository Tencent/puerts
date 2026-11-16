/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

// Promise rejection tracking of the papi-quickjs backend, the same interface as papi_v8 (PapiV8PromiseReject.h):
//
//   handler(event, promise, value)
//
// quickjs only reports two events:
//   0 a promise is rejected with no handler, value is the reason
//   1 a handler is added to a rejected promise (which was reported by 0), value is undefined

#include "pesapi.h"
#include "NamespaceDef.h"

namespace PUERTS_NAMESPACE
{
namespace papi_qjs
{
class FPromiseRejectTracker;

typedef void (*FPromiseRejectHandlerErrorCallback)(void* UserData, const char* Error);

FPromiseRejectTracker* CreatePromiseRejectTracker(
    pesapi_env Env, FPromiseRejectHandlerErrorCallback OnHandlerError, void* UserData);

// stops tracking and releases the handler, must be called before the object mapper of the env is uninitialized
void DestroyPromiseRejectTracker(FPromiseRejectTracker* Tracker);

// sets the handler, a value which is not a function (undefined, null) clears it; returns false if no tracker is created
bool SetPromiseRejectHandler(pesapi_env Env, pesapi_value Handler);
}    // namespace papi_qjs
}    // namespace PUERTS_NAMESPACE

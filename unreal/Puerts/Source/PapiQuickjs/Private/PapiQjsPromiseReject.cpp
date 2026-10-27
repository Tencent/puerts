/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "PapiQjsPromiseReject.h"
#include "quickjs.h"
#include <mutex>
#include <string>
#include <unordered_map>

namespace PUERTS_NAMESPACE
{
namespace papi_qjs
{
class FPromiseRejectTracker
{
public:
    FPromiseRejectTracker(JSContext* InCtx, FPromiseRejectHandlerErrorCallback InOnHandlerError, void* InUserData)
        : Ctx(InCtx), OnHandlerError(InOnHandlerError), UserData(InUserData)
    {
    }

    ~FPromiseRejectTracker()
    {
        JS_FreeValue(Ctx, Handler);
    }

    JSContext* const Ctx;
    JSValue Handler = JS_UNDEFINED;
    FPromiseRejectHandlerErrorCallback OnHandlerError;
    void* UserData;

    void ReportHandlerError()
    {
        JSValue Ex = JS_GetException(Ctx);
        if (OnHandlerError)
        {
            std::string Error = "unknown exception";
            if (const char* Msg = JS_ToCString(Ctx, Ex))
            {
                Error = Msg;
                JS_FreeCString(Ctx, Msg);
            }
            if (JS_IsObject(Ex))
            {
                JSValue Stack = JS_GetPropertyStr(Ctx, Ex, "stack");
                if (JS_IsString(Stack))
                {
                    if (const char* StackStr = JS_ToCString(Ctx, Stack))
                    {
                        Error += "\n";
                        Error += StackStr;
                        JS_FreeCString(Ctx, StackStr);
                    }
                }
                JS_FreeValue(Ctx, Stack);
            }
            if (JS_HasException(Ctx))
            {
                JS_FreeValue(Ctx, JS_GetException(Ctx));
            }
            OnHandlerError(UserData, Error.c_str());
        }
        JS_FreeValue(Ctx, Ex);
    }

    static void OnPromiseReject(JSContext* ctx, JSValue promise, JSValue reason, JS_BOOL is_handled, void* opaque)
    {
        auto Tracker = static_cast<FPromiseRejectTracker*>(opaque);
        if (!Tracker || !JS_IsFunction(ctx, Tracker->Handler))
        {
            return;
        }
        // keep an exception being thrown (the tracker may be called while unwinding)
        JSValue Pending = JS_UNINITIALIZED;
        bool HadPending = JS_HasException(ctx) != 0;
        if (HadPending)
        {
            Pending = JS_GetException(ctx);
        }
        JSValue Args[] = {JS_NewInt32(ctx, is_handled ? 1 : 0), promise, is_handled ? JS_UNDEFINED : reason};
        JSValue Handler = JS_DupValue(ctx, Tracker->Handler);
        JSValue Ret = JS_Call(ctx, Handler, JS_UNDEFINED, 3, Args);
        JS_FreeValue(ctx, Handler);
        if (JS_IsException(Ret))
        {
            Tracker->ReportHandlerError();
        }
        else
        {
            JS_FreeValue(ctx, Ret);
        }
        if (HadPending)
        {
            JS_Throw(ctx, Pending);
        }
    }
};

static std::mutex GTrackersMutex;
static std::unordered_map<JSContext*, FPromiseRejectTracker*> GTrackers;

static FPromiseRejectTracker* FindTracker(JSContext* Ctx)
{
    std::lock_guard<std::mutex> Lock(GTrackersMutex);
    auto Iter = GTrackers.find(Ctx);
    return Iter == GTrackers.end() ? nullptr : Iter->second;
}

FPromiseRejectTracker* CreatePromiseRejectTracker(pesapi_env Env, FPromiseRejectHandlerErrorCallback OnHandlerError, void* UserData)
{
    JSContext* Ctx = reinterpret_cast<JSContext*>(Env);
    if (FindTracker(Ctx))
    {
        return nullptr;
    }
    auto Tracker = new FPromiseRejectTracker(Ctx, OnHandlerError, UserData);
    {
        std::lock_guard<std::mutex> Lock(GTrackersMutex);
        GTrackers[Ctx] = Tracker;
    }
    JS_SetHostPromiseRejectionTracker(JS_GetRuntime(Ctx), &FPromiseRejectTracker::OnPromiseReject, Tracker);
    return Tracker;
}

void DestroyPromiseRejectTracker(FPromiseRejectTracker* Tracker)
{
    if (Tracker)
    {
        JS_SetHostPromiseRejectionTracker(JS_GetRuntime(Tracker->Ctx), nullptr, nullptr);
        {
            std::lock_guard<std::mutex> Lock(GTrackersMutex);
            GTrackers.erase(Tracker->Ctx);
        }
        delete Tracker;
    }
}

bool SetPromiseRejectHandler(pesapi_env Env, pesapi_value Handler)
{
    JSContext* Ctx = reinterpret_cast<JSContext*>(Env);
    auto Tracker = FindTracker(Ctx);
    if (!Tracker)
    {
        return false;
    }
    JS_FreeValue(Ctx, Tracker->Handler);
    Tracker->Handler = JS_UNDEFINED;
    if (Handler)
    {
        JSValue Value = *reinterpret_cast<JSValue*>(Handler);
        if (JS_IsFunction(Ctx, Value))
        {
            Tracker->Handler = JS_DupValue(Ctx, Value);
        }
    }
    return true;
}
}    // namespace papi_qjs
}    // namespace PUERTS_NAMESPACE

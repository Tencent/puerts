/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "PapiV8PromiseReject.h"
#include "DataTransfer.h"
#include "PesapiImpl.h"

#include <string>

// the module loader takes PESAPI_PRIVATE_DATA_POS_IN_ISOLATE + 1, this is the last slot of v8 (kNumIsolateDataSlots is 4)
#define PUERTS_PROMISE_REJECT_DATA_POS_IN_ISOLATE (PESAPI_PRIVATE_DATA_POS_IN_ISOLATE + 2)

namespace PUERTS_NAMESPACE
{
namespace papi_v8
{
class FPromiseRejectTracker
{
public:
    FPromiseRejectTracker(v8::Isolate* InIsolate, v8::Local<v8::Context> InContext,
        FPromiseRejectHandlerErrorCallback InOnHandlerError, void* InUserData)
        : Isolate(InIsolate), Context(InIsolate, InContext), OnHandlerError(InOnHandlerError), UserData(InUserData)
    {
    }

    ~FPromiseRejectTracker()
    {
        Handler.Reset();
        Context.Reset();
    }

    v8::Isolate* const Isolate;
    v8::Global<v8::Context> Context;
    v8::Global<v8::Function> Handler;
    FPromiseRejectHandlerErrorCallback OnHandlerError;
    void* UserData;

    static FPromiseRejectTracker* Get(v8::Isolate* Isolate)
    {
        return static_cast<FPromiseRejectTracker*>(Isolate->GetData(PUERTS_PROMISE_REJECT_DATA_POS_IN_ISOLATE));
    }

    void ReportHandlerError(v8::Local<v8::Context> InContext, v8::TryCatch& TryCatch)
    {
        if (!OnHandlerError)
        {
            return;
        }
        v8::String::Utf8Value Exception(Isolate, TryCatch.Exception());
        std::string Error = *Exception ? *Exception : "unknown exception";
        v8::Local<v8::Value> Stack;
        if (TryCatch.StackTrace(InContext).ToLocal(&Stack) && Stack->IsString())
        {
            v8::String::Utf8Value StackStr(Isolate, Stack);
            if (*StackStr)
            {
                Error = *StackStr;
            }
        }
        OnHandlerError(UserData, Error.c_str());
    }

    static void OnPromiseReject(v8::PromiseRejectMessage Message)
    {
        auto Promise = Message.GetPromise();
        auto Isolate = Promise->GetIsolate();
        auto Tracker = Get(Isolate);
        if (!Tracker || Tracker->Handler.IsEmpty())
        {
            return;
        }

        auto Event = Message.GetEvent();
        if (Event != v8::kPromiseRejectWithNoHandler && Event != v8::kPromiseHandlerAddedAfterReject &&
            Event != v8::kPromiseRejectAfterResolved && Event != v8::kPromiseResolveAfterResolved)
        {
            return;
        }

        v8::HandleScope HandleScope(Isolate);
        auto Context = Tracker->Context.Get(Isolate);
        v8::Context::Scope ContextScope(Context);
        v8::Local<v8::Value> Value;
        if (Event != v8::kPromiseHandlerAddedAfterReject)
        {
            Value = Message.GetValue();
        }
        if (Value.IsEmpty())
        {
            Value = v8::Undefined(Isolate);
        }

        v8::Local<v8::Value> Args[] = {v8::Integer::New(Isolate, static_cast<int>(Event)), Promise, Value};
        // the handler must not throw into the engine, the callback may be called where no exception is expected
        v8::TryCatch TryCatch(Isolate);
        auto Handler = Tracker->Handler.Get(Isolate);
        if (Handler->Call(Context, v8::Undefined(Isolate), 3, Args).IsEmpty() && TryCatch.HasCaught() && !TryCatch.HasTerminated())
        {
            Tracker->ReportHandlerError(Context, TryCatch);
        }
    }
};

FPromiseRejectTracker* CreatePromiseRejectTracker(pesapi_env Env, FPromiseRejectHandlerErrorCallback OnHandlerError, void* UserData)
{
    v8::Local<v8::Context> Context;
    *reinterpret_cast<pesapi_env*>(&Context) = Env;
    auto Isolate = Context->GetIsolate();
    if (static_cast<uint32_t>(PUERTS_PROMISE_REJECT_DATA_POS_IN_ISOLATE) >= v8::Isolate::GetNumberOfDataSlots() ||
        FPromiseRejectTracker::Get(Isolate))
    {
        return nullptr;
    }
    auto Tracker = new FPromiseRejectTracker(Isolate, Context, OnHandlerError, UserData);
    Isolate->SetData(PUERTS_PROMISE_REJECT_DATA_POS_IN_ISOLATE, Tracker);
    Isolate->SetPromiseRejectCallback(&FPromiseRejectTracker::OnPromiseReject);
    return Tracker;
}

void DestroyPromiseRejectTracker(FPromiseRejectTracker* Tracker)
{
    if (Tracker)
    {
        Tracker->Isolate->SetPromiseRejectCallback(nullptr);
        Tracker->Isolate->SetData(PUERTS_PROMISE_REJECT_DATA_POS_IN_ISOLATE, nullptr);
        delete Tracker;
    }
}

bool SetPromiseRejectHandler(pesapi_env Env, pesapi_value Handler)
{
    v8::Local<v8::Context> Context;
    *reinterpret_cast<pesapi_env*>(&Context) = Env;
    auto Isolate = Context->GetIsolate();
    auto Tracker = FPromiseRejectTracker::Get(Isolate);
    if (!Tracker)
    {
        return false;
    }
    v8::Local<v8::Value> Value;
    if (Handler)
    {
        *reinterpret_cast<pesapi_value*>(&Value) = Handler;
    }
    if (!Value.IsEmpty() && Value->IsFunction())
    {
        Tracker->Handler.Reset(Isolate, Value.As<v8::Function>());
    }
    else
    {
        Tracker->Handler.Reset();
    }
    return true;
}
}    // namespace papi_v8
}    // namespace PUERTS_NAMESPACE

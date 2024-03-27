/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include "JSFunction.h"
#include "V8Utils.h"
#include "JSEngine.h"

namespace PUERTS_NAMESPACE
{
    JSObject::JSObject(v8::Isolate* InIsolate, v8::Local<v8::Context> InContext, v8::Local<v8::Object> InObject, int32_t InIndex) 
    {
        Isolate = InIsolate;
        Context.Reset(InIsolate, InContext);
        GObject.Reset(InIsolate, InObject);
        Index = InIndex;
    }

    JSObject::~JSObject() 
    {
        Context.Reset();
        GObject.Reset();
    }

#ifdef MULT_BACKENDS
    JSFunction::JSFunction(puerts::IPuertsPlugin* InPuertsPlugin, v8::Isolate* InIsolate, v8::Local<v8::Context> InContext, v8::Local<v8::Function> InFunction, int32_t InIndex)
    {
        ResultInfo.PuertsPlugin = InPuertsPlugin;
#else
    JSFunction::JSFunction(v8::Isolate* InIsolate, v8::Local<v8::Context> InContext, v8::Local<v8::Function> InFunction, int32_t InIndex)
    {
#endif
        ResultInfo.Isolate = InIsolate;
        ResultInfo.Context.Reset(InIsolate, InContext);
        GFunction.Reset(InIsolate, InFunction);
        Index = InIndex;
    }

    JSFunction::~JSFunction()
    {
        v8::Isolate* Isolate = ResultInfo.Isolate;
#ifdef THREAD_SAFE
        v8::Locker Locker(Isolate);
#endif
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = ResultInfo.Context.Get(Isolate);
        v8::Context::Scope ContextScope(Context);

        auto Function = GFunction.Get(Isolate);

        Function->Set(Context, FV8Utils::V8String(Isolate, FUNCTION_INDEX_KEY), v8::Undefined(Isolate));

        GFunction.Reset();
        ResultInfo.Result.Reset();
        ResultInfo.Context.Reset();
    }

    static v8::Local<v8::Value> ToV8(v8::Isolate* Isolate, v8::Local<v8::Context> Context, FValue &Value)
    {
        switch (Value.Type)
        {
        case puerts::NullOrUndefined:
            return v8::Null(Isolate);
        case puerts::BigInt:
            return v8::BigInt::New(Isolate, Value.BigInt);
        case puerts::Number:
            return v8::Number::New(Isolate, Value.Number);
        case puerts::Date:
            return v8::Date::New(Context, Value.Number).ToLocalChecked();
        case puerts::String:
            return FV8Utils::V8String(Isolate, Value.Str.c_str());
        case puerts::NativeObject:
            return Value.Persistent.Get(Isolate);
        case puerts::Function:
            return Value.FunctionPtr->GFunction.Get(Isolate);
        case puerts::JsObject:
            return Value.JSObjectPtr->GObject.Get(Isolate);
        case puerts::Boolean:
            return v8::Boolean::New(Isolate, Value.Boolean);
        case puerts::ArrayBuffer:
            return Value.Persistent.Get(Isolate);
        default:
            return v8::Undefined(Isolate);
        }
    }

    /*void JSFunction::SetResult(v8::MaybeLocal<v8::Value> maybeValue)
    {

    }*/

    bool JSFunction::Invoke(bool HasResult)
    {
        v8::Isolate* Isolate = ResultInfo.Isolate;
#ifdef THREAD_SAFE
        v8::Locker Locker(Isolate);
#endif
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = ResultInfo.Context.Get(Isolate);
        v8::Context::Scope ContextScope(Context);

        std::vector< v8::Local<v8::Value>> V8Args;
        for (int i = 0; i < Arguments.size(); ++i)
        {
            V8Args.push_back(ToV8(Isolate, Context, Arguments[i]));
            Arguments[i].Persistent.Reset();
        }
        Arguments.clear();
        v8::TryCatch TryCatch(Isolate);
        auto maybeValue = GFunction.Get(Isolate)->Call(Context, Context->Global(), static_cast<int>(V8Args.size()), V8Args.data());
        
        if (TryCatch.HasCaught())
        {
            v8::Local<v8::Value> Exception = TryCatch.Exception();
            const auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
            JsEngine->SetLastException(Exception);
            LastException.Reset(Isolate, Exception);
            LastExceptionInfo = FV8Utils::ExceptionToString(Isolate, Exception);
            return false;
        }
        else
        {
            if (HasResult && !maybeValue.IsEmpty())
            {
                ResultInfo.Result.Reset(Isolate, maybeValue.ToLocalChecked());
            }
            return true;
        }
    }
}
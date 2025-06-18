/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
#include "JSEngine.h"
#include <cstring>
#include "V8Utils.h"
#include "Log.h"
#include "pesapi.h"
#include "CppObjectMapper.h"


#define API_LEVEL 36

using puerts::JSEngine;
using puerts::FValue;
using puerts::FResultInfo;
using puerts::JSFunction;
using puerts::FV8Utils;
using puerts::FLifeCycleInfo;
using puerts::JsValueType;

#ifdef __cplusplus
extern "C" {
#endif

// deprecated, delete in 1.4 plz
V8_EXPORT int GetLibVersion()
{
    return API_LEVEL;
}
V8_EXPORT int GetApiLevel()
{
    return API_LEVEL;
}

V8_EXPORT int GetLibBackend(v8::Isolate *Isolate)
{
#if WITH_NODEJS
    return puerts::JSEngineBackend::Node;
#elif WITH_QUICKJS
    return puerts::JSEngineBackend::QuickJS;
#else
    return puerts::JSEngineBackend::V8;
#endif
}

V8_EXPORT v8::Isolate *CreateJSEngine(int backend)
{
#if WITH_QUICKJS
    if (backend != puerts::JSEngineBackend::QuickJS && backend != puerts::JSEngineBackend::Auto) return nullptr;
#else
    if (backend == puerts::JSEngineBackend::QuickJS && backend != puerts::JSEngineBackend::Auto) return nullptr;
#endif
    auto JsEngine = new JSEngine(nullptr, nullptr);
    return JsEngine->MainIsolate;
}

V8_EXPORT v8::Isolate *CreateJSEngineWithExternalEnv(int backend, void* external_quickjs_runtime, void* external_quickjs_context)
{
#if WITH_QUICKJS
    auto JsEngine = new JSEngine(external_quickjs_runtime, external_quickjs_context);
    return JsEngine->MainIsolate;
#else
    return nullptr;
#endif
}

V8_EXPORT void DestroyJSEngine(v8::Isolate *Isolate)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    delete JsEngine;
}

V8_EXPORT void TerminateExecution(v8::Isolate *Isolate)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    JsEngine->TerminateExecution();
}

V8_EXPORT pesapi_env_ref GetV8PapiEnvRef(v8::Isolate *Isolate)
{
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::Isolate::Scope IsolateScope(Isolate);
    auto jsEnv = FV8Utils::IsolateData<JSEngine>(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = jsEnv->BackendEnv.MainContext.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    
    auto env = reinterpret_cast<pesapi_env>(*Context); //TODO: 实现相关
    return v8impl::g_pesapi_ffi.create_env_ref(env);
}

V8_EXPORT pesapi_ffi* GetV8FFIApi()
{
    return &v8impl::g_pesapi_ffi;
}

V8_EXPORT void LowMemoryNotification(v8::Isolate *Isolate)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    JsEngine->LowMemoryNotification();
}
V8_EXPORT bool IdleNotificationDeadline(v8::Isolate *Isolate, double DeadlineInSeconds)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    return JsEngine->IdleNotificationDeadline(DeadlineInSeconds);
}
V8_EXPORT void RequestMinorGarbageCollectionForTesting(v8::Isolate *Isolate)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    JsEngine->RequestMinorGarbageCollectionForTesting();
}
V8_EXPORT void RequestFullGarbageCollectionForTesting(v8::Isolate *Isolate)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    JsEngine->RequestFullGarbageCollectionForTesting();
}


//-------------------------- begin debug --------------------------

V8_EXPORT void CreateInspector(v8::Isolate *Isolate, int32_t Port)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    JsEngine->CreateInspector(Port);
}

V8_EXPORT void DestroyInspector(v8::Isolate *Isolate)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    JsEngine->DestroyInspector();
}

V8_EXPORT int InspectorTick(v8::Isolate *Isolate)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    return JsEngine->InspectorTick() ? 1 : 0;
}

V8_EXPORT void LogicTick(v8::Isolate *Isolate)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    return JsEngine->LogicTick();
}

//-------------------------- end debug --------------------------

#ifdef __cplusplus
}
#endif
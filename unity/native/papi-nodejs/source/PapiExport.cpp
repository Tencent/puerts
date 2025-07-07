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
using puerts::FResultInfo;
using puerts::FV8Utils;
using puerts::JsValueType;

#ifdef __cplusplus
extern "C" {
#endif

V8_EXPORT int GetNodejsPapiVersion()
{
    return PESAPI_VERSION;
}

V8_EXPORT pesapi_env_ref GetNodejsPapiEnvRef(v8::Isolate *Isolate)
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

V8_EXPORT pesapi_ffi* GetNodejsFFIApi()
{
    return &v8impl::g_pesapi_ffi;
}

V8_EXPORT pesapi_env_ref CreateNodejsPapiEnvRef()
{
    auto jsEnv = new JSEngine(nullptr, nullptr);
#ifdef THREAD_SAFE
    v8::Locker Locker(jsEnv->MainIsolate);
#endif
    v8::Isolate::Scope IsolateScope(jsEnv->MainIsolate);
    v8::HandleScope HandleScope(jsEnv->MainIsolate);
    v8::Local<v8::Context> Context = jsEnv->BackendEnv.MainContext.Get(jsEnv->MainIsolate);
    v8::Context::Scope ContextScope(Context);
    
    auto env = reinterpret_cast<pesapi_env>(*Context); //TODO: 实现相关
    return v8impl::g_pesapi_ffi.create_env_ref(env);
}

V8_EXPORT void DestroyNodejsPapiEnvRef(pesapi_env_ref env_ref)
{
    auto scope = v8impl::g_pesapi_ffi.open_scope(env_ref);
    auto env = v8impl::g_pesapi_ffi.get_env_from_ref(env_ref);
    auto context = reinterpret_cast<v8::Context*>(env);
    v8::Isolate *isolate = context->GetIsolate();
    v8impl::g_pesapi_ffi.close_scope(scope);
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(isolate);
    delete JsEngine;
}

V8_EXPORT v8::Isolate *NodejsGetIsolate(pesapi_env_ref env_ref)
{
    auto scope = v8impl::g_pesapi_ffi.open_scope(env_ref);
    auto env = v8impl::g_pesapi_ffi.get_env_from_ref(env_ref);
    auto context = reinterpret_cast<v8::Context*>(env);
    v8::Isolate *isolate = context->GetIsolate();
    v8impl::g_pesapi_ffi.close_scope(scope);
    return isolate;
}

V8_EXPORT void NodejsLowMemoryNotification(v8::Isolate *Isolate)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    JsEngine->LowMemoryNotification();
}
V8_EXPORT bool NodejsIdleNotificationDeadline(v8::Isolate *Isolate, double DeadlineInSeconds)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    return JsEngine->IdleNotificationDeadline(DeadlineInSeconds);
}
V8_EXPORT void NodejsRequestMinorGarbageCollectionForTesting(v8::Isolate *Isolate)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    JsEngine->RequestMinorGarbageCollectionForTesting();
}
V8_EXPORT void NodejsRequestFullGarbageCollectionForTesting(v8::Isolate *Isolate)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    JsEngine->RequestFullGarbageCollectionForTesting();
}

//-------------------------- begin debug --------------------------

V8_EXPORT void NodejsCreateInspector(v8::Isolate *Isolate, int32_t Port)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    JsEngine->CreateInspector(Port);
}

V8_EXPORT void NodejsDestroyInspector(v8::Isolate *Isolate)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    JsEngine->DestroyInspector();
}

V8_EXPORT int NodejsInspectorTick(v8::Isolate *Isolate)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    return JsEngine->InspectorTick() ? 1 : 0;
}

V8_EXPORT void NodejsLogicTick(v8::Isolate *Isolate)
{
    auto JsEngine = FV8Utils::IsolateData<JSEngine>(Isolate);
    return JsEngine->LogicTick();
}


V8_EXPORT void NodejsTerminateExecution(v8::Isolate *Isolate)
{
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    Isolate->TerminateExecution();
}

//-------------------------- end debug --------------------------

#ifdef __cplusplus
}
#endif
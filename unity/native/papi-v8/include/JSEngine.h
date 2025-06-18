/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#include <vector>
#include <map>
#include <set>
#include <mutex>
#include <string>
#include <memory>
#include "Common.h"

#include "V8InspectorImpl.h"
#include "BackendEnv.h"
#ifdef MULT_BACKENDS
#include "IPuertsPlugin.h"
#endif
#include "CppObjectMapper.h"
#include "DataTransfer.h"

#if WITH_NODEJS
#pragma warning(push, 0)
#include "node.h"
#include "uv.h"
#pragma warning(pop)

#endif

namespace PUERTS_NAMESPACE
{
typedef char* (*CSharpModuleResolveCallback)(const char* identifer, int32_t jsEnvIdx, char*& pathForDebug);

#ifdef MULT_BACKENDS
typedef void(*CSharpFunctionCallback)(puerts::IPuertsPlugin* plugin, const v8::FunctionCallbackInfo<v8::Value>& Info, void* Self, int ParamLen, int64_t UserData);

typedef void* (*CSharpConstructorCallback)(puerts::IPuertsPlugin* plugin, const v8::FunctionCallbackInfo<v8::Value>& Info, int ParamLen, int64_t UserData);

typedef void (*JsFunctionFinalizeCallback)(puerts::IPuertsPlugin* plugin, int64_t UserData);
#else
typedef void(*CSharpFunctionCallback)(v8::Isolate* Isolate, const v8::FunctionCallbackInfo<v8::Value>& Info, void* Self, int ParamLen, int64_t UserData);

typedef void* (*CSharpConstructorCallback)(v8::Isolate* Isolate, const v8::FunctionCallbackInfo<v8::Value>& Info, int ParamLen, int64_t UserData);

typedef void (*JsFunctionFinalizeCallback)(v8::Isolate* Isolate, int64_t UserData);
#endif

typedef void(*CSharpDestructorCallback)(void* Self, int64_t UserData);

enum JSEngineBackend
{
    V8          = 0,
    Node        = 1,
    QuickJS     = 2,
    Auto = 3
};

struct FResultInfo
{
    v8::Isolate* Isolate;
    
    v8::UniquePersistent<v8::Context> Context;

    v8::UniquePersistent<v8::Value> Result;
};

class JSEngine
{
private: 
#if !WITH_QUICKJS
    static void HostInitializeImportMetaObject(v8::Local<v8::Context> context, v8::Local<v8::Module> module, v8::Local<v8::Object> meta);
#endif
public:
#ifdef MULT_BACKENDS
    JSEngine(puerts::IPuertsPlugin* InPuertsPlugin, void* external_quickjs_runtime, void* external_quickjs_context);
#else
    JSEngine(void* external_quickjs_runtime, void* external_quickjs_context);
#endif

    ~JSEngine();

    v8::UniquePersistent<v8::Value> LastException;
    std::string LastExceptionInfo;

    void SetLastException(v8::Local<v8::Value> Exception);

    CSharpDestructorCallback GeneralDestructor;

    void LowMemoryNotification();

    bool IdleNotificationDeadline(double DeadlineInSeconds);

    void RequestMinorGarbageCollectionForTesting();

    void RequestFullGarbageCollectionForTesting();

    void CreateInspector(int32_t Port);

    void DestroyInspector();

    bool InspectorTick();

    void LogicTick();
    
    void TerminateExecution()
    {
#if !WITH_QUICKJS
        MainIsolate->TerminateExecution();
#endif
    }

    v8::Isolate* MainIsolate;

    bool ClearModuleCache(const char* Path);

    std::vector<char> StrBuffer;

    FResultInfo ResultInfo;

    v8::UniquePersistent<v8::Function> JsPromiseRejectCallback;

    int32_t Idx;

    FBackendEnv BackendEnv;
    
private:

    FCppObjectMapper CppObjectMapperV8;
    
public:

    std::string GetJSStackTrace();
};
}

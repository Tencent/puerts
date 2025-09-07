/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
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

    static void HostInitializeImportMetaObject(v8::Local<v8::Context> context, v8::Local<v8::Module> module, v8::Local<v8::Object> meta);

public:

    JSEngine(void* external_quickjs_runtime, void* external_quickjs_context);

    ~JSEngine();

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
        MainIsolate->TerminateExecution();
    }

    v8::Isolate* MainIsolate;

    bool ClearModuleCache(const char* Path);

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

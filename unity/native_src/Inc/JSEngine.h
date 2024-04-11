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

#include "JSFunction.h"
#include "V8InspectorImpl.h"
#include "BackendEnv.h"
#ifdef MULT_BACKENDS
#include "IPuertsPlugin.h"
#endif

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
#else
typedef void(*CSharpFunctionCallback)(v8::Isolate* Isolate, const v8::FunctionCallbackInfo<v8::Value>& Info, void* Self, int ParamLen, int64_t UserData);

typedef void* (*CSharpConstructorCallback)(v8::Isolate* Isolate, const v8::FunctionCallbackInfo<v8::Value>& Info, int ParamLen, int64_t UserData);
#endif

typedef void(*CSharpDestructorCallback)(void* Self, int64_t UserData);

struct FCallbackInfo
{
    FCallbackInfo(bool InIsStatic, CSharpFunctionCallback InCallback, int64_t InData) : IsStatic(InIsStatic), Callback(InCallback), Data(InData) {}
    bool IsStatic;
    CSharpFunctionCallback Callback;
    int64_t Data;
};

struct FLifeCycleInfo
{
    FLifeCycleInfo(int InClassID, CSharpConstructorCallback InConstructor, CSharpDestructorCallback InDestructor, int64_t InData, int InSize)
        : ClassID(InClassID), Constructor(InConstructor), Destructor(InDestructor), Data(InData), Size(InSize){}
    int ClassID;
    CSharpConstructorCallback Constructor;
    CSharpDestructorCallback Destructor;
    int64_t Data;
    int Size;
};

v8::Local<v8::ArrayBuffer> NewArrayBuffer(v8::Isolate* Isolate, void *Ptr, size_t Size);

enum JSEngineBackend
{
    V8          = 0,
    Node        = 1,
    QuickJS     = 2,
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

    void SetGlobalFunction(const char *Name, CSharpFunctionCallback Callback, int64_t Data);

    bool Eval(const char *Code, const char* Path);

    int RegisterClass(const char *FullName, int BaseTypeId, CSharpConstructorCallback Constructor, CSharpDestructorCallback Destructor, int64_t Data, int Size);

    bool RegisterFunction(int ClassID, const char *Name, bool IsStatic, CSharpFunctionCallback Callback, int64_t Data);

    bool RegisterProperty(int ClassID, const char *Name, bool IsStatic, CSharpFunctionCallback Getter, int64_t GetterData, CSharpFunctionCallback Setter, int64_t SetterData, bool DontDelete);

    v8::Local<v8::Value> GetClassConstructor(int ClassID);

    v8::Local<v8::Value> FindOrAddObject(v8::Isolate* Isolate, v8::Local<v8::Context> Context, int ClassID, void *Ptr);

    void BindObject(FLifeCycleInfo* LifeCycleInfo, void* Ptr, v8::Local<v8::Object> JSObject);

    void UnBindObject(FLifeCycleInfo* LifeCycleInfo, void* Ptr);

    v8::UniquePersistent<v8::Value> LastException;
    std::string LastExceptionInfo;

    void SetLastException(v8::Local<v8::Value> Exception);

    CSharpDestructorCallback GeneralDestructor;

    void LowMemoryNotification();

    bool IdleNotificationDeadline(double DeadlineInSeconds);

    void RequestMinorGarbageCollectionForTesting();

    void RequestFullGarbageCollectionForTesting();

    JSFunction* CreateJSFunction(v8::Isolate* InIsolate, v8::Local<v8::Context> InContext, v8::Local<v8::Function> InFunction);

    void ReleaseJSFunction(JSFunction* InFunction);

    JSObject* CreateJSObject(v8::Isolate* InIsolate, v8::Local<v8::Context> InContext, v8::Local<v8::Object> InObject);

    void ReleaseJSObject(JSObject* InObject);

    void CreateInspector(int32_t Port);

    void DestroyInspector();

    bool InspectorTick();

    void LogicTick();

    v8::Isolate* MainIsolate;

    bool ClearModuleCache(const char* Path);

    std::vector<char> StrBuffer;

    FResultInfo ResultInfo;

    v8::UniquePersistent<v8::Function> JsPromiseRejectCallback;

    V8_INLINE static JSEngine * Get(v8::Isolate* Isolate)
    {
        return FV8Utils::IsolateData<JSEngine>(Isolate);
    }

    int32_t Idx;

    FBackendEnv BackendEnv;
    
private:
    std::vector<FCallbackInfo*> CallbackInfos;

    std::vector<FLifeCycleInfo*> LifeCycleInfos;

    std::vector<v8::UniquePersistent<v8::FunctionTemplate>> Templates;

    std::vector<v8::UniquePersistent<v8::Map>> Metadatas;

    std::map<std::string, int> NameToTemplateID;

    std::map<void*, v8::UniquePersistent<v8::Value>> ObjectMap;

    std::vector<JSFunction*> JSFunctions;

    v8::UniquePersistent<v8::Map> JSObjectIdMap;

    std::map<int32_t, JSObject*> JSObjectMap;

    std::vector<int32_t> ObjectMapFreeIndex;

    std::mutex JSFunctionsMutex;

    std::mutex JSObjectsMutex;

    JSFunction* ModuleExecutor = nullptr;
    
public:
    JSFunction* JSObjectValueGetter = nullptr;

    JSFunction* GetModuleExecutor();

    v8::Local<v8::FunctionTemplate> ToTemplate(v8::Isolate* Isolate, bool IsStatic, CSharpFunctionCallback Callback, int64_t Data);
};
}

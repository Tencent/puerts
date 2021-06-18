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

#pragma warning(push, 0)  
#include "libplatform/libplatform.h"
#include "v8.h"
#pragma warning(pop)

#include "JSFunction.h"
#include "V8InspectorImpl.h"

#if defined(PLATFORM_WINDOWS)

#if _WIN64
#include "Blob/Win64/SnapshotBlob.h"
#else
#include "Blob/Win32/SnapshotBlob.h"
#endif

#elif defined(PLATFORM_ANDROID_ARM)
#include "Blob/Android/armv7a/SnapshotBlob.h"
#elif defined(PLATFORM_ANDROID_ARM64)
#include "Blob/Android/arm64/SnapshotBlob.h"
#elif defined(PLATFORM_MAC)
#include "Blob/macOS/SnapshotBlob.h"
#elif defined(PLATFORM_IOS)
#include "Blob/iOS/arm64/SnapshotBlob.h"
#elif defined(PLATFORM_IOS_SIMULATOR)
#include "Blob/iOS/x64/SnapshotBlob.h"
#endif

typedef void(*CSharpFunctionCallback)(v8::Isolate* Isolate, const v8::FunctionCallbackInfo<v8::Value>& Info, void* Self, int ParamLen, int64_t UserData);

typedef void(*CSharpFunctionCallbackV2)(v8::Isolate* Isolate, const v8::Puerts::FunctionCallbackInfo& Info, void* Self, int ParamLen, int64_t UserData);

typedef void* (*CSharpConstructorCallback)(v8::Isolate* Isolate, const v8::FunctionCallbackInfo<v8::Value>& Info, int ParamLen, int64_t UserData);

typedef void(*CSharpDestructorCallback)(void* Self, int64_t UserData);

namespace puerts
{
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

static std::unique_ptr<v8::Platform> GPlatform;

v8::Local<v8::ArrayBuffer> NewArrayBuffer(v8::Isolate* Isolate, void *Ptr, size_t Size);

class JSEngine
{
public:
    JSEngine(void* external_quickjs_runtime, void* external_quickjs_context);

    ~JSEngine();

    void SetGlobalFunction(const char *Name, CSharpFunctionCallback Callback, int64_t Data);

    void SetGlobalFunctionV2(const char *Name, CSharpFunctionCallbackV2 Callback, int64_t Data);

    bool Eval(const char *Code, const char* Path);

    int RegisterClass(const char *FullName, int BaseTypeId, CSharpConstructorCallback Constructor, CSharpDestructorCallback Destructor, int64_t Data, int Size);

    bool RegisterFunction(int ClassID, const char *Name, bool IsStatic, CSharpFunctionCallback Callback, int64_t Data);

    bool RegisterProperty(int ClassID, const char *Name, bool IsStatic, CSharpFunctionCallback Getter, int64_t GetterData, CSharpFunctionCallback Setter, int64_t SetterData, bool DontDelete);

    v8::Local<v8::Value> GetClassConstructor(int ClassID);

    v8::Local<v8::Value> FindOrAddObject(v8::Isolate* Isolate, v8::Local<v8::Context> Context, int ClassID, void *Ptr);

    void BindObject(FLifeCycleInfo* LifeCycleInfo, void* Ptr, v8::Local<v8::Object> JSObject);

    void UnBindObject(FLifeCycleInfo* LifeCycleInfo, void* Ptr);

    std::string LastExceptionInfo;

    CSharpDestructorCallback GeneralDestructor;

    void LowMemoryNotification();

    JSFunction* CreateJSFunction(v8::Isolate* InIsolate, v8::Local<v8::Context> InContext, v8::Local<v8::Function> InFunction);

    void ReleaseJSFunction(JSFunction* InFunction);

    JSObject* CreateJSObject(v8::Isolate* InIsolate, v8::Local<v8::Context> InContext, v8::Local<v8::Object> InObject);

    void ReleaseJSObject(JSObject* InObject);

    void CreateInspector(int32_t Port);

    void DestroyInspector();

    bool InspectorTick();

    v8::Isolate* MainIsolate;

    std::vector<char> StrBuffer;

    FResultInfo ResultInfo;

    v8::UniquePersistent<v8::Function> JsPromiseRejectCallback;

    V8_INLINE static JSEngine * Get(v8::Isolate* Isolate)
    {
        return FV8Utils::IsolateData<JSEngine>(Isolate);
    }

private:
    v8::Isolate::CreateParams CreateParams;

    std::vector<FCallbackInfo*> CallbackInfos;

    std::vector<FLifeCycleInfo*> LifeCycleInfos;

    std::vector<v8::UniquePersistent<v8::FunctionTemplate>> Templates;

    std::map<std::string, int> NameToTemplateID;

    std::map<void*, v8::UniquePersistent<v8::Value>> ObjectMap;

    // 把已生成的JSFunction存起来，让重复的JSFunction传进来的时候可以复用
    std::vector<JSFunction*> JSFunctions;

    // 记录js对象到id的映射
    v8::UniquePersistent<v8::Map> JSObjectIdMap;
    // id到c++ jsobject对象的映射
    std::map<int32_t, JSObject*> JSObjectMap;
    // 从map里删除元素后，会产生一些空余的id，下次创建时从此处取出使用
    std::vector<int32_t> ObjectMapFreeIndex;

    std::mutex JSFunctionsMutex;

    std::mutex JSObjectsMutex;

    V8Inspector* Inspector;

private:
    v8::Local<v8::FunctionTemplate> ToTemplate(v8::Isolate* Isolate, bool IsStatic, CSharpFunctionCallback Callback, int64_t Data);
};
}

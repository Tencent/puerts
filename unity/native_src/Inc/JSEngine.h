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
#include "Blob/Win64/NativesBlob.h"
#include "Blob/Win64/SnapshotBlob.h"
#elif defined(PLATFORM_ANDROID_ARM)
#include "Blob/Android/armv7a/NativesBlob.h"
#include "Blob/Android/armv7a/SnapshotBlob.h"
#elif defined(PLATFORM_ANDROID_ARM64)
#include "Blob/Android/arm64/NativesBlob.h"
#include "Blob/Android/arm64/SnapshotBlob.h"
#elif defined(PLATFORM_MAC)
#include "Blob/macOS/NativesBlob.h"
#include "Blob/macOS/SnapshotBlob.h"
#elif defined(PLATFORM_IOS)
#include "Blob/iOS/arm64/NativesBlob.h"
#include "Blob/iOS/arm64/SnapshotBlob.h"
#endif

typedef void(*CSharpFunctionCallback)(v8::Isolate* Isolate, const v8::FunctionCallbackInfo<v8::Value>& Info, void* Self, int ParamLen, int64_t UserData);

typedef void* (*CSharpConstructorCallback)(v8::Isolate* Isolate, const v8::FunctionCallbackInfo<v8::Value>& Info, int ParamLen, int64_t UserData);

typedef void(*CSharpDestructorCallback)(void* Self, int64_t UserData);

typedef void(*CSharpIndexedGetterCallback)(v8::Isolate* Isolate, const v8::PropertyCallbackInfo<v8::Value>& Info, void* Self, uint32_t Index, int64_t UserData);

typedef void(*CSharpIndexedSetterCallback)(v8::Isolate* Isolate, const v8::PropertyCallbackInfo<v8::Value>& Info, void* Self, uint32_t Index, v8::Value *Value, int64_t UserData);

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

struct FIndexedInfo
{
    FIndexedInfo(CSharpIndexedGetterCallback InGetter, CSharpIndexedSetterCallback InSetter, int64_t InData): Getter(InGetter), Setter(InSetter), Data(InData){}
    CSharpIndexedGetterCallback Getter;
    CSharpIndexedSetterCallback Setter;
    int64_t Data;
};

static std::unique_ptr<v8::Platform> GPlatform;

class JSEngine
{
public:
    JSEngine();

    ~JSEngine();

    void SetGlobalFunction(const char *Name, CSharpFunctionCallback Callback, int64_t Data);

    bool Eval(const char *Code, const char* Path);

    int RegisterClass(const char *FullName, int BaseTypeId, CSharpConstructorCallback Constructor, CSharpDestructorCallback Destructor, int64_t Data, int Size);

    bool RegisterFunction(int ClassID, const char *Name, bool IsStatic, CSharpFunctionCallback Callback, int64_t Data);

    bool RegisterProperty(int ClassID, const char *Name, bool IsStatic, CSharpFunctionCallback Getter, int64_t GetterData, CSharpFunctionCallback Setter, int64_t SetterData);

    bool RegisterIndexedProperty(int ClassID, CSharpIndexedGetterCallback Getter, CSharpIndexedSetterCallback Setter, int64_t Data);

    v8::Local<v8::Value> GetClassConstructor(int ClassID);

    v8::Local<v8::Value> FindOrAddObject(v8::Isolate* Isolate, v8::Local<v8::Context> Context, int ClassID, void *Ptr);

    void BindObject(FLifeCycleInfo* LifeCycleInfo, void* Ptr, v8::Local<v8::Object> JSObject);

    void UnBindObject(FLifeCycleInfo* LifeCycleInfo, void* Ptr);

    std::string LastExceptionInfo;

    CSharpDestructorCallback GeneralDestructor;

    void LowMemoryNotification();

    JSFunction* CreateJSFunction(v8::Isolate* InIsolate, v8::Local<v8::Context> InContext, v8::Local<v8::Function> InFunction);

    void ReleaseJSFunction(JSFunction* InFunction);

    void CreateInspector(int32_t Port);

    void DestroyInspector();

    bool InspectorTick();

    v8::Isolate* MainIsolate;

    std::vector<char> StrBuffer;

    FResultInfo ResultInfo;

private:
    v8::Isolate::CreateParams CreateParams;
    
    std::unique_ptr<v8::StartupData> NativesBlob;

    std::unique_ptr<v8::StartupData> SnapshotBlob;

    std::vector<FCallbackInfo*> CallbackInfos;

    std::vector<FLifeCycleInfo*> LifeCycleInfos;

    std::vector<FIndexedInfo*> IndexedInfos;

    std::vector<v8::UniquePersistent<v8::FunctionTemplate>> Templates;

    std::map<std::string, int> NameToTemplateID;

    std::map<void*, v8::UniquePersistent<v8::Value>> ObjectMap;

    std::set<JSFunction*> JSFunctions;

    std::mutex JSFunctionsMutex;

    V8Inspector* Inspector;

private:
    v8::Local<v8::FunctionTemplate> ToTemplate(v8::Isolate* Isolate, bool IsStatic, CSharpFunctionCallback Callback, int64_t Data);
};
}

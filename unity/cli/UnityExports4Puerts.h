/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once
namespace puerts
{
struct PObjectRefInfo
{
    pesapi_env_ref EnvRef;
    pesapi_value_ref ValueRef;
    void* ExtraData;
    std::weak_ptr<int> EnvLifeCycleTracker; // TODO: 增加pesapi_env_ref有效性判断后去掉
};

#if defined(USE_OUTSIZE_UNITY)

typedef void* (*GetJsClassInfoFunc)(const void* TypeId, bool TryLazyLoad);

typedef void (*UnrefJsObjectFunc)(struct PObjectRefInfo* objectInfo);

typedef const void* (*CSharpTypeToTypeIdFunc)(const void *type);

typedef v8::Value* (*GetModuleExecutorFunc)(v8::Context* env);

#else
    
typedef struct JsClassInfoHeader* (*GetJsClassInfoFunc)(const void* TypeId, bool TryLazyLoad);

typedef void (*UnrefJsObjectFunc)(struct PObjectRefInfo* delegateInfo);

typedef const void* (*CSharpTypeToTypeIdFunc)(Il2CppObject *type);

typedef pesapi_value (*GetModuleExecutorFunc)(pesapi_env env);

#endif


typedef void* (*GetRuntimeObjectFromPersistentObjectFunc)(pesapi_env env, pesapi_value pvalue);

typedef void (*SetRuntimeObjectToPersistentObjectFunc)(pesapi_env env, pesapi_value pvalue, void* runtimeObject);

typedef void(*LogCallbackFunc)(const char* value);

typedef void (*SetExtraDataFunc)(pesapi_env env, struct PObjectRefInfo* objectInfo);

struct UnityExports
{
    //.cpp api
    CSharpTypeToTypeIdFunc CSharpTypeToTypeId = nullptr;

    //plugin api
    UnrefJsObjectFunc UnrefJsObject = nullptr;
    GetJsClassInfoFunc GetJsClassInfo = nullptr;

    GetModuleExecutorFunc GetModuleExecutor = nullptr;

    GetRuntimeObjectFromPersistentObjectFunc GetRuntimeObjectFromPersistentObject = nullptr;
    SetRuntimeObjectToPersistentObjectFunc SetRuntimeObjectToPersistentObject = nullptr;
    
    SetExtraDataFunc SetExtraData = nullptr;
    
    LogCallbackFunc LogCallback = nullptr;
};

}
/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#pragma warning(push, 0)
#include "v8.h"
#pragma warning(pop)

#include <map>
#include <unordered_map>
#include "JSClassRegister.h"
#include "ObjectCacheNode.h"
#include "ObjectMapper.h"

namespace puerts
{
typedef int32_t (*ObjectPoolAddFunc) (void * objectPool, void * obj, void* method);
typedef void* (*ObjectPoolRemoveFunc) (void * objectPool, int32_t index, void* method);

class FCppObjectMapper final : public ICppObjectMapper
{
public:
    void Initialize(v8::Isolate* InIsolate, v8::Local<v8::Context> InContext);
    
    v8::Local<v8::Function> LoadTypeByString(v8::Isolate* Isolate, v8::Local<v8::Context> Context, std::string TypeName);
    
    v8::Local<v8::Function> LoadTypeById(v8::Isolate* Isolate, v8::Local<v8::Context> Context, const void* TypeId);
    
    void LoadCppType(const v8::FunctionCallbackInfo<v8::Value>& Info);

    virtual bool IsInstanceOfCppObject(const void* TypeId, v8::Local<v8::Object> JsObject) override;

    virtual std::weak_ptr<int> GetJsEnvLifeCycleTracker() override;

    virtual v8::Local<v8::Value> FindOrAddCppObject(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* TypeId, void* Ptr, bool PassByPointer) override;

    virtual void UnBindCppObject(JSClassDefinition* ClassDefinition, void* Ptr) override;

    virtual void BindCppObject(v8::Isolate* Isolate, JSClassDefinition* ClassDefinition, void* Ptr, v8::Local<v8::Object> JSObject,
        bool PassByPointer) override;
        
    virtual void* GetPrivateData(v8::Local<v8::Context> Context, v8::Local<v8::Object> JSObject) override;

    virtual void SetPrivateData(v8::Local<v8::Context> Context, v8::Local<v8::Object> JSObject, void* Ptr) override;

    void UnInitialize(v8::Isolate* InIsolate);

    v8::Local<v8::FunctionTemplate> GetTemplateOfClass(v8::Isolate* Isolate, const void* TypeId);
    
    void* ObjectPoolAddMethodInfo = nullptr;
    
    ObjectPoolAddFunc ObjectPoolAdd = nullptr;
    
    void* ObjectPoolRemoveMethodInfo = nullptr;
   
    ObjectPoolRemoveFunc ObjectPoolRemove = nullptr;
    
    void* ObjectPoolInstance = nullptr;

private:
    std::unordered_map<void*, FObjectCacheNode> CDataCache;

    std::unordered_map<const void*, v8::UniquePersistent<v8::FunctionTemplate>> TypeIdToTemplateMap;

    v8::UniquePersistent<v8::FunctionTemplate> PointerTemplate;
    
    v8::Global<v8::Symbol> PrivateKey;

    std::unordered_map<void*, FinalizeFunc> CDataFinalizeMap;

    std::shared_ptr<int> Ref = std::make_shared<int>(0);
};

}    // namespace puerts
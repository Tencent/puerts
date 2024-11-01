/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "NamespaceDef.h"

PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS
#pragma warning(push, 0)
#include "v8.h"
#pragma warning(pop)
PRAGMA_ENABLE_UNDEFINED_IDENTIFIER_WARNINGS

#include <unordered_map>
#include "JSClassRegister.h"
#include "ObjectCacheNode.h"
#include "ObjectMapper.h"

namespace v8impl
{
extern pesapi_apis g_pesapi_apis;
}

namespace PUERTS_NAMESPACE
{
struct PointerHash
{
    std::size_t operator()(const void* ptr) const
    {
        return reinterpret_cast<std::size_t>(ptr);
    }
};

struct PointerEqual
{
    bool operator()(const void* lhs, const void* rhs) const
    {
        return lhs == rhs;
    }
};
class FCppObjectMapper final : public ICppObjectMapper
{
public:
    void Initialize(v8::Isolate* InIsolate, v8::Local<v8::Context> InContext);

    void LoadCppType(const v8::FunctionCallbackInfo<v8::Value>& Info);

    virtual bool IsInstanceOfCppObject(v8::Isolate* Isolate, const void* TypeId, v8::Local<v8::Object> JsObject) override;

    virtual std::weak_ptr<int> GetJsEnvLifeCycleTracker() override;

    virtual v8::Local<v8::Value> FindOrAddCppObject(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* TypeId, void* Ptr, bool PassByPointer) override;

    virtual void UnBindCppObject(v8::Isolate* Isolate, JSClassDefinition* ClassDefinition, void* Ptr) override;

    virtual void BindCppObject(v8::Isolate* Isolate, JSClassDefinition* ClassDefinition, void* Ptr, v8::Local<v8::Object> JSObject,
        bool PassByPointer) override;

    virtual void* GetPrivateData(v8::Local<v8::Context> Context, v8::Local<v8::Object> JSObject) override;

    virtual void SetPrivateData(v8::Local<v8::Context> Context, v8::Local<v8::Object> JSObject, void* Ptr) override;

    virtual v8::MaybeLocal<v8::Function> LoadTypeById(v8::Local<v8::Context> Context, const void* TypeId) override;

    void UnInitialize(v8::Isolate* InIsolate);

    v8::Local<v8::FunctionTemplate> GetTemplateOfClass(v8::Isolate* Isolate, const JSClassDefinition* ClassDefinition);

private:
    std::unordered_map<void*, FObjectCacheNode, PointerHash, PointerEqual> CDataCache;

    std::unordered_map<const void*, v8::UniquePersistent<v8::FunctionTemplate>, PointerHash, PointerEqual> TypeIdToTemplateMap;

    v8::UniquePersistent<v8::FunctionTemplate> PointerTemplate;

#ifndef WITH_QUICKJS
    v8::Global<v8::Symbol> PrivateKey;
#endif

    std::shared_ptr<int> Ref = std::make_shared<int>(0);
};

}    // namespace PUERTS_NAMESPACE
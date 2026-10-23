/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
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

#include <functional>
#include <unordered_map>
#include <vector>
#include "JSClassRegister.h"
#include "ObjectCacheNode.h"
#include "ObjectMapper.h"

namespace PUERTS_NAMESPACE
{
struct PointerHash
{
    std::size_t operator()(const void* ptr) const
    {
        // the low bits of (heap) addresses are zero because of the alignment, and std::unordered_map may take the low bits
        // of the hash as the bucket index (msvc), so they are shifted out and mixed with the higher bits
        const auto Value = reinterpret_cast<std::uintptr_t>(ptr);
        return static_cast<std::size_t>((Value >> 4) ^ (Value >> 16));
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

    virtual void SetRegistry(ScriptClassRegistry* InRegistry) override
    {
        Registry = InRegistry ? InRegistry : GetDefaultClassRegistry();
    }

    virtual ScriptClassRegistry* GetRegistry() override
    {
        return Registry;
    }

    virtual void InvalidateClass(const void* TypeId) override
    {
        TypeIdToTemplateMap.erase(TypeId);
    }

    virtual v8::Local<v8::Value> FindOrAddCppObject(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* TypeId, void* Ptr, bool PassByPointer) override;

    // the cached js object of (Ptr, TypeId), empty if there is none
    v8::Local<v8::Value> FindCppObject(v8::Isolate* Isolate, const void* TypeId, void* Ptr);

    virtual void UnBindCppObject(v8::Isolate* Isolate, JSClassDefinition* ClassDefinition, void* Ptr) override;

    virtual void BindCppObject(v8::Isolate* Isolate, JSClassDefinition* ClassDefinition, void* Ptr, v8::Local<v8::Object> JSObject,
        bool PassByPointer) override;

    virtual void* GetPrivateData(v8::Local<v8::Context> Context, v8::Local<v8::Object> JSObject) override;

    virtual void SetPrivateData(v8::Local<v8::Context> Context, v8::Local<v8::Object> JSObject, void* Ptr) override;

    virtual v8::MaybeLocal<v8::Function> LoadTypeById(v8::Local<v8::Context> Context, const void* TypeId) override;

#ifndef WITH_QUICKJS
    virtual v8::MaybeLocal<v8::Function> CreateFunction(v8::Local<v8::Context> Context, struct pesapi_ffi* Apis,
        pesapi_callback Callback, void* Data, pesapi_function_finalize Finalize) override;
#endif

    void UnInitialize(v8::Isolate* InIsolate);

    v8::Local<v8::FunctionTemplate> GetTemplateOfClass(v8::Isolate* Isolate, const JSClassDefinition* ClassDefinition);

#if USING_IN_UNREAL_ENGINE
    // unreal only: called when the template of a class is created (members and super class are set, not instantiated yet),
    // used by reflected classes to set the class name and keep the definition alive
    typedef std::function<void(
        v8::Isolate* Isolate, const JSClassDefinition* ClassDefinition, v8::Local<v8::FunctionTemplate> Template)>
        FTemplateCreatedHook;

    FTemplateCreatedHook OnTemplateCreated;
#endif

#ifndef WITH_QUICKJS
    struct FPesapiFunctionData
    {
        pesapi_callback Callback;
        void* Data;
        FCppObjectMapper* Mapper;
        v8::Global<v8::Function> JsFunction;
        pesapi_function_finalize Finalize;
        struct pesapi_ffi* Apis;
    };

private:
    static void PesapiFunctionDataGarbageCollected(const v8::WeakCallbackInfo<FPesapiFunctionData>& Data);

    std::vector<FPesapiFunctionData*> FunctionDatas;
#endif

private:
    std::unordered_map<void*, FObjectCacheNode, PointerHash, PointerEqual> CDataCache;

    std::unordered_map<const void*, v8::UniquePersistent<v8::FunctionTemplate>, PointerHash, PointerEqual> TypeIdToTemplateMap;

    v8::UniquePersistent<v8::FunctionTemplate> PointerTemplate;

#ifndef WITH_QUICKJS
    v8::Global<v8::Symbol> PrivateKey;
#endif

    std::shared_ptr<int> Ref = std::make_shared<int>(0);

    ScriptClassRegistry* Registry = GetDefaultClassRegistry();
};

}    // namespace PUERTS_NAMESPACE
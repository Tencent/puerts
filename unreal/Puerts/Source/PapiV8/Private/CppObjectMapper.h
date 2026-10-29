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
MSVC_PRAGMA(warning(push, 0))
#include "v8.h"
MSVC_PRAGMA(warning(pop))
PRAGMA_ENABLE_UNDEFINED_IDENTIFIER_WARNINGS

#include <functional>
#include <memory>
#include <unordered_map>
#include <vector>
#include "JSClassRegister.h"
#include "ObjectCacheNode.h"
#include "pesapi.h"

namespace PUERTS_NAMESPACE
{
// the object mapping of the v8 backend (native objects of class definitions), it is the isolate data (MAPPER_ISOLATE_DATA_POS)
// used by the v8 implementation of pesapi. Internal to the backend, the host does not implement it
class ICppObjectMapper
{
public:
    virtual void BindCppObject(v8::Isolate* Isolate, JSClassDefinition* ClassDefinition, void* Ptr, v8::Local<v8::Object> JSObject,
        bool PassByPointer) = 0;

    virtual void UnBindCppObject(v8::Isolate* Isolate, JSClassDefinition* ClassDefinition, void* Ptr) = 0;

    // pesapi unbind_native_object: detach (Ptr, TypeId) from its cached js object, false if it is not bound
    virtual bool UnbindNativeObject(v8::Isolate* Isolate, const void* TypeId, void* Ptr) = 0;

    virtual v8::Local<v8::Value> FindOrAddCppObject(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* TypeId, void* Ptr, bool PassByPointer) = 0;

    virtual bool IsInstanceOfCppObject(v8::Isolate* Isolate, const void* TypeId, v8::Local<v8::Object> JsObject) = 0;

    virtual void* GetPrivateData(v8::Local<v8::Context> Context, v8::Local<v8::Object> JSObject) = 0;

    virtual void SetPrivateData(v8::Local<v8::Context> Context, v8::Local<v8::Object> JSObject, void* Ptr) = 0;

    virtual v8::MaybeLocal<v8::Function> LoadTypeById(v8::Local<v8::Context> Context, const void* TypeId) = 0;

    virtual v8::MaybeLocal<v8::Function> CreateFunction(v8::Local<v8::Context> Context, struct pesapi_ffi* Apis,
        pesapi_callback Callback, void* Data, pesapi_function_finalize Finalize) = 0;

    virtual std::weak_ptr<int> GetJsEnvLifeCycleTracker() = 0;

    // class registry used by this env (pesapi set_registry), nullptr resets to the default registry
    virtual void SetRegistry(ScriptClassRegistry* InRegistry) = 0;

    virtual ScriptClassRegistry* GetRegistry() = 0;

    // pesapi invalidate_class: drop the cached script class of TypeId, the next use rebuilds it
    virtual void InvalidateClass(const void* TypeId) = 0;

    virtual ~ICppObjectMapper()
    {
    }
};

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
        if (OnClassInvalidated)
        {
            OnClassInvalidated(TypeId);
        }
        TypeIdToTemplateMap.erase(TypeId);
    }

    // called by InvalidateClass before the cached class is dropped, lets the host drop its caches of the type
    std::function<void(const void* TypeId)> OnClassInvalidated;

    virtual v8::Local<v8::Value> FindOrAddCppObject(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* TypeId, void* Ptr, bool PassByPointer) override;

    // the cached js object of (Ptr, TypeId), empty if there is none
    v8::Local<v8::Value> FindCppObject(v8::Isolate* Isolate, const void* TypeId, void* Ptr);

    virtual void UnBindCppObject(v8::Isolate* Isolate, JSClassDefinition* ClassDefinition, void* Ptr) override;

    virtual bool UnbindNativeObject(v8::Isolate* Isolate, const void* TypeId, void* Ptr) override;

    virtual void BindCppObject(v8::Isolate* Isolate, JSClassDefinition* ClassDefinition, void* Ptr, v8::Local<v8::Object> JSObject,
        bool PassByPointer) override;

    virtual void* GetPrivateData(v8::Local<v8::Context> Context, v8::Local<v8::Object> JSObject) override;

    virtual void SetPrivateData(v8::Local<v8::Context> Context, v8::Local<v8::Object> JSObject, void* Ptr) override;

    virtual v8::MaybeLocal<v8::Function> LoadTypeById(v8::Local<v8::Context> Context, const void* TypeId) override;

    virtual v8::MaybeLocal<v8::Function> CreateFunction(v8::Local<v8::Context> Context, struct pesapi_ffi* Apis,
        pesapi_callback Callback, void* Data, pesapi_function_finalize Finalize) override;

    void UnInitialize(v8::Isolate* InIsolate);

    v8::Local<v8::FunctionTemplate> GetTemplateOfClass(v8::Isolate* Isolate, const JSClassDefinition* ClassDefinition);

    // called when the script class of a definition is created (the template keeps referring to the definition), used by the
    // host to keep the definitions of reflected classes alive, returns whether the class is named by its ScriptName (the name
    // shown by debuggers and as constructor.name)
    std::function<bool(const JSClassDefinition* ClassDefinition)> OnClassCreated;

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

private:
    std::unordered_map<void*, FObjectCacheNode, PointerHash, PointerEqual> CDataCache;

    struct FTemplateEntry
    {
        v8::UniquePersistent<v8::FunctionTemplate> Template;
        // the definition the template is built from (the callbacks of the template refer to it), objects created with the
        // template are bound with it
        const JSClassDefinition* ClassDefinition;
    };

    std::unordered_map<const void*, FTemplateEntry, PointerHash, PointerEqual> TypeIdToTemplateMap;

    v8::UniquePersistent<v8::FunctionTemplate> PointerTemplate;

    v8::Global<v8::Symbol> PrivateKey;

    std::shared_ptr<int> Ref = std::make_shared<int>(0);

    ScriptClassRegistry* Registry = GetDefaultClassRegistry();
};

}    // namespace PUERTS_NAMESPACE
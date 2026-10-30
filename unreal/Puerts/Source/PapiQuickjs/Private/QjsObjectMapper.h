/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "NamespaceDef.h"
#include "pesapi.h"
#include "quickjs.h"
#include "JSClassRegister.h"
#include "QjsObjectCacheNode.h"
#include <functional>
#include <memory>
#include <unordered_map>
#include <unordered_set>

// a raw pointer stored in a JSValue (never ref counted, the same as unity)
#define JS_TAG_EXTERNAL (JS_TAG_FLOAT64 + 1)

namespace PUERTS_NAMESPACE
{
namespace qjsimpl
{
class FCppObjectMapper;

// the opaque of a native object (the "__papi_obj" class)
struct ObjectUserData
{
    const JSClassDefinition* typeInfo;
    // the type id of the object, the same as typeInfo->TypeId except for a pointer of an unknown class
    const void* typeId;
    void* ptr;
    bool callFinalize;
    // the object is in the cache (not for a pointer of an unknown class)
    bool cached;
};

// the opaque of the tracer object of a function created by create_function, its finalizer runs the finalize of the function
struct FuncFinalizeData
{
    pesapi_function_finalize finalize;
    void* data;
    FCppObjectMapper* mapper;
};

struct PointerHash
{
    std::size_t operator()(const void* ptr) const
    {
        const auto Value = reinterpret_cast<std::uintptr_t>(ptr);
        return static_cast<std::size_t>((Value >> 4) ^ (Value >> 16));
    }
};

// the object mapping of the quickjs backend, the runtime opaque (JS_GetRuntimeOpaque1) used by the quickjs implementation of
// pesapi. The same behavior as FCppObjectMapper of the v8 backend
class FCppObjectMapper
{
public:
    FCppObjectMapper() = default;
    ~FCppObjectMapper() = default;
    FCppObjectMapper(const FCppObjectMapper&) = delete;
    FCppObjectMapper& operator=(const FCppObjectMapper&) = delete;

    inline static FCppObjectMapper* Get(JSContext* ctx)
    {
        return reinterpret_cast<FCppObjectMapper*>(JS_GetRuntimeOpaque1(JS_GetRuntime(ctx)));
    }

    void Initialize(JSContext* InCtx);

    // finalizes the native objects and functions of the env, invalidates its refs, while the context is alive
    void UnInitialize();

    void SetRegistry(ScriptClassRegistry* InRegistry)
    {
        Registry = InRegistry ? InRegistry : GetDefaultClassRegistry();
    }

    ScriptClassRegistry* GetRegistry()
    {
        return Registry;
    }

    // called when the script class of a definition is created, returns whether the class is named by its ScriptName
    std::function<bool(const JSClassDefinition* ClassDefinition)> OnClassCreated;

    inline std::weak_ptr<int> GetEnvLifeCycleTracker()
    {
        return std::weak_ptr<int>(Ref);
    }

    inline const void* GetEnvPrivate() const
    {
        return EnvPrivate;
    }

    inline void SetEnvPrivate(const void* InEnvPrivate)
    {
        EnvPrivate = InEnvPrivate;
    }

    inline ObjectUserData* GetObjectUserData(JSValue val) const
    {
        return reinterpret_cast<ObjectUserData*>(JS_GetOpaque(val, ClassId));
    }

    inline void* GetNativeObjectPtr(JSValue val) const
    {
        ObjectUserData* object_udata = GetObjectUserData(val);
        return object_udata ? object_udata->ptr : nullptr;
    }

    inline const void* GetNativeObjectTypeId(JSValue val) const
    {
        ObjectUserData* object_udata = GetObjectUserData(val);
        return object_udata ? object_udata->typeId : nullptr;
    }

    bool GetPrivate(JSValue val, void** outPtr) const;

    bool SetPrivate(JSValue val, void* ptr);

    // a new reference, JS_EXCEPTION on failure
    JSValue CreateFunction(pesapi_callback Callback, void* Data, pesapi_function_finalize Finalize);

    // the constructor of the class (borrowed, owned by the mapper), JS_UNDEFINED if not found
    JSValue FindOrCreateClassByID(const void* TypeId);

    JSValue FindOrCreateClass(const JSClassDefinition* ClassDefinition);

    // a new reference: the cached object of (Ptr, TypeId) if passed by pointer, else a new object
    JSValue FindOrAddCppObject(const void* TypeId, void* Ptr, bool PassByPointer);

    bool IsInstanceOf(const void* TypeId, JSValue Obj);

    void BindCppObject(const JSClassDefinition* ClassDefinition, void* Ptr, JSValue Obj, bool PassByPointer);

    void UnBindCppObject(const JSClassDefinition* ClassDefinition, void* Ptr);

    // pesapi unbind_native_object: detach (Ptr, TypeId) from its cached js object, false if it is not bound
    bool UnbindNativeObject(const void* TypeId, void* Ptr);

    inline void AddStrongRefObject(JSValue* obj)
    {
        StrongRefObjects.insert(obj);
    }

    inline void RemoveStrongRefObject(JSValue* obj)
    {
        StrongRefObjects.erase(obj);
    }

    void RemoveFuncFinalizeData(FuncFinalizeData* Data)
    {
        FuncFinalizeDatas.erase(Data);
    }

    JSRuntime* rt = nullptr;
    JSContext* ctx = nullptr;
    JSClassID ClassId = 0;
    JSClassID FuncTracerClassId = 0;
    JSClassID WeakTracerClassId = 0;

private:
    JSValue MakeMethod(pesapi_callback Callback, void* Data);

    void InitMethod(JSFunctionInfo* FuncInfo, JSValue Obj);

    void InitProperty(JSPropertyInfo* PropInfo, JSValue Obj);

    JSValue NewObjectOfClass(JSValue Ctor);

    struct FClassEntry
    {
        JSValue Ctor;
        // the definition the class is built from (its callbacks refer to it), objects created with the class are bound with it
        const JSClassDefinition* ClassDefinition;
    };

    std::unordered_map<void*, FObjectCacheNode, PointerHash> CDataCache;

    std::unordered_map<const void*, FClassEntry, PointerHash> TypeIdToFunctionMap;

    std::unordered_set<JSValue*, PointerHash> StrongRefObjects;

    // the functions created by create_function which are not finalized yet
    std::unordered_set<FuncFinalizeData*, PointerHash> FuncFinalizeDatas;

    const void* EnvPrivate = nullptr;

    std::shared_ptr<int> Ref = std::make_shared<int>(0);

    JSClassDefinition PtrClassDef = JSClassEmptyDefinition;

    JSAtom PrivateDataKey = 0;

    JSAtom PrototypeAtom = 0;

    ScriptClassRegistry* Registry = GetDefaultClassRegistry();
};

}    // namespace qjsimpl
}    // namespace PUERTS_NAMESPACE

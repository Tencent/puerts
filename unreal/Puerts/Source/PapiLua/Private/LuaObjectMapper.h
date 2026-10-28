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
#include "lua.hpp"
#include "JSClassRegister.h"
#include "LuaObjectCacheNode.h"
#include <cstdint>
#include <functional>
#include <memory>
#include <string>
#include <unordered_map>
#include <unordered_set>

namespace PUERTS_NAMESPACE
{
namespace luaimpl
{
struct pesapi_scope__;
class FCppObjectMapper;

// the full userdata of a native object (uservalue 1: the owned object of set_owner, uservalue 2: the table of the extra fields
// set from lua)
struct FLuaCppObject
{
    void* Ptr;
    const JSClassDefinition* ClassDefinition;
    // the same as ClassDefinition->TypeId except for a pointer of an unknown class
    const void* TypeId;
    // the id in the weak cache table, 0 if not cached
    int64_t CacheId;
    bool CallFinalize;
};

// the full userdata hold by a function created by create_function, its __gc runs the finalize of the function
struct FFuncFinalizeData
{
    pesapi_function_finalize Finalize;
    void* Data;
};

// the full userdata of a binary (create_binary refers to the memory, create_binary_by_value copies it into Data)
struct FByteBuffer
{
    size_t Size;
    uint8_t* Ptr;
    uint8_t Data[1];
};

struct PointerHash
{
    std::size_t operator()(const void* ptr) const
    {
        const auto Value = reinterpret_cast<std::uintptr_t>(ptr);
        return static_cast<std::size_t>((Value >> 4) ^ (Value >> 16));
    }
};

// the mapper is kept in the extra space of the lua state (copied to the threads created later)
inline FCppObjectMapper* GetMapper(lua_State* L)
{
    return *static_cast<FCppObjectMapper**>(lua_getextraspace(L));
}

inline void SetMapper(lua_State* L, FCppObjectMapper* Mapper)
{
    *static_cast<FCppObjectMapper**>(lua_getextraspace(L)) = Mapper;
}

// the object mapping of the lua backend (CppObjectMapperLua of unity), the same behavior as the quickjs one. Lua errors are
// longjmps (lua is compiled as c): lua_error is only raised by the outermost c functions holding no c++ object, the operations
// which may run a metamethod are done in protected mode
class FCppObjectMapper
{
public:
    FCppObjectMapper() = default;
    ~FCppObjectMapper() = default;
    FCppObjectMapper(const FCppObjectMapper&) = delete;
    FCppObjectMapper& operator=(const FCppObjectMapper&) = delete;

    void Initialize(lua_State* L);

    // finalizes the native objects and functions of the env, invalidates its refs, while the state is alive
    void UnInitialize();

    void SetRegistry(ScriptClassRegistry* InRegistry)
    {
        Registry = InRegistry ? InRegistry : GetDefaultClassRegistry();
    }

    ScriptClassRegistry* GetRegistry()
    {
        return Registry;
    }

    void InvalidateClass(const void* TypeId);

    // called by InvalidateClass before the cached class is dropped
    std::function<void(const void* TypeId)> OnClassInvalidated;

    // called when the script class of a definition is created
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

    // the native object at Idx (an absolute index), nullptr if it is not one
    static FLuaCppObject* GetCppObject(lua_State* L, int Idx);

    FByteBuffer* GetByteBuffer(lua_State* L, int Idx);

    bool GetPrivate(lua_State* L, int Idx, void** OutPtr);

    bool SetPrivate(lua_State* L, int Idx, void* Ptr);

    // pushes the function
    void PushFunction(lua_State* L, pesapi_callback Callback, void* Data, pesapi_function_finalize Finalize);

    // pushes the class table, false (nothing pushed) if not found
    bool PushClassByID(lua_State* L, const void* TypeId);

    // pushes the cached object of (Ptr, TypeId) if passed by pointer, else a new object, nil for a null pointer
    void PushCppObject(lua_State* L, const void* TypeId, void* Ptr, bool PassByPointer);

    bool IsInstanceOf(lua_State* L, const void* TypeId, int Idx);

    // binds the object at ObjIdx (an absolute index)
    void BindCppObject(lua_State* L, const JSClassDefinition* ClassDefinition, void* Ptr, int ObjIdx, bool PassByPointer);

    void UnBindCppObject(const JSClassDefinition* ClassDefinition, void* Ptr);

    // pesapi unbind_native_object: detach (Ptr, TypeId) from its cached lua object, false if it is not bound
    bool UnbindNativeObject(lua_State* L, const void* TypeId, void* Ptr);

    // the __gc of a native object
    void OnObjectGc(FLuaCppObject* Obj);

    void PushBinary(lua_State* L, void* Bin, size_t Length, bool Copy);

    void RemoveFuncFinalizeData(FFuncFinalizeData* Data)
    {
        FuncFinalizeDatas.erase(Data);
    }

    // calls the function below the nargs arguments on the top with a message handler, the error is caught by the current
    // scope on failure (nothing left on the stack)
    bool ProtectedCall(lua_State* L, int NArgs, int NResults);

    // pops the error on the top into the current scope
    void CatchError(lua_State* L);

    void SetPendingError(const char* Msg)
    {
        PendingError = Msg ? Msg : "";
        HasPendingError = true;
    }

    lua_State* MainL = nullptr;

    pesapi_scope__* CurrentScope = nullptr;

    // the traceback of the last error caught by ProtectedCall
    std::string LastTraceback;

    // an error thrown by throw_error, raised by the callback or caught by the scope
    bool HasPendingError = false;
    std::string PendingError;

    // the weak value table of the weak value refs
    int WeakRefTableRef = LUA_NOREF;
    int64_t NextWeakId = 0;

private:
    struct FClassEntry
    {
        int ClsRef;
        int ObjMetaRef;
        int MRef;
        int GRef;
        int SRef;
        int SGRef;
        int SSRef;
        // the definition the class is built from (its callbacks refer to it), objects created with the class are bound with it
        const JSClassDefinition* ClassDefinition;
    };

    FClassEntry* FindOrCreateClass(lua_State* L, const JSClassDefinition* ClassDefinition);

    FClassEntry* FindOrCreateClassByID(lua_State* L, const void* TypeId);

    // pushes a new object userdata of the class
    FLuaCppObject* NewObject(lua_State* L, FClassEntry* Entry);

    void ReleaseClassEntry(lua_State* L, FClassEntry& Entry);

    std::unordered_map<void*, FObjectCacheNode, PointerHash> CDataCache;

    std::unordered_map<const void*, FClassEntry, PointerHash> TypeIdToClassMap;

    // the functions created by create_function which are not finalized yet
    std::unordered_set<FFuncFinalizeData*, PointerHash> FuncFinalizeDatas;

    const void* EnvPrivate = nullptr;

    std::shared_ptr<int> Ref = std::make_shared<int>(0);

    JSClassDefinition PtrClassDef = JSClassEmptyDefinition;

    // the weak value table of the cached objects
    int CacheTableRef = LUA_NOREF;
    int64_t NextCacheId = 0;

    // the cache ids of the objects unbound while waiting for __gc
    std::unordered_set<int64_t> UnboundCacheIds;

    // the weak key table of the private data
    int PrivateTableRef = LUA_NOREF;

    int BufferMetaRef = LUA_NOREF;

    int FuncTracerMetaRef = LUA_NOREF;

    ScriptClassRegistry* Registry = GetDefaultClassRegistry();
};

}    // namespace luaimpl
}    // namespace PUERTS_NAMESPACE

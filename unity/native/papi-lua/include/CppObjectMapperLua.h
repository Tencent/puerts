#pragma once

#include "pesapi.h"
#include "lua.hpp"
#include <EASTL/unordered_map.h>
#include <EASTL/vector.h>
#include <EASTL/allocator_malloc.h>
#include <EASTL/shared_ptr.h>
#include "ObjectCacheNodeLua.h"
#include "ScriptClassRegistry.h"

namespace pesapi
{
namespace luaimpl
{
    
extern pesapi_ffi g_pesapi_ffi;

typedef struct
{
    void* Ptr;
    const void* TypeId;
    bool NeedDelete;
} CppObject;

struct pesapi_callback_info__
{
    lua_State* L;
    int ArgStart; // 0 or 1
    int RetNum;
    void* Data;
};

struct PesapiCallbackData
{
    pesapi_callback Callback;
    void* Data;
    pesapi_function_finalize Finalize = nullptr;
    class CppObjectMapper* Mapper;
};

class CppObjectMapper
{
public:
    CppObjectMapper();
    void Initialize(lua_State* L);

    bool IsInstanceOfCppObject(lua_State* L, const void* TypeId, int ObjectIndex);

    inline eastl::weak_ptr<int> GetEnvLifeCycleTracker()
    {
        return eastl::weak_ptr<int>(ref);
    }

    inline static CppObjectMapper* Get(lua_State* L)
    {
        auto pmapper = (CppObjectMapper**)lua_getextraspace(L);
        return *pmapper;
    }

    inline static eastl::weak_ptr<int> GetEnvLifeCycleTracker(lua_State* L)
    {
        return CppObjectMapper::Get(L)->GetEnvLifeCycleTracker();
    }

    int FindOrAddCppObject(lua_State* L, const void* typeId, void* ptr, bool passByPointer);

    int CreateFunction(lua_State* L, pesapi_callback Callback, void* Data, pesapi_function_finalize Finalize);

    void UnBindCppObject(lua_State* L, const puerts::ScriptClassDefinition* classDefinition, void* Ptr);

    void BindCppObject(lua_State* L, const puerts::ScriptClassDefinition* classDefinition, void* ptr, bool PassByPointer);

    void* GetPrivateData(lua_State* L, int index) const;

    void SetPrivateData(lua_State* L, int index, void* ptr);

    int LoadTypeById(lua_State* L, const void* typeId);

    int CreateBufferByPointer(lua_State* L, unsigned char* ptr, size_t size);

    int CreateBufferCopy(lua_State* L, const unsigned char* data, size_t size);

    bool IsBuffer(lua_State* L, int index);
    
    unsigned char* GetBufferData(lua_State* L, int index, size_t* out_size);

    bool IsCppObject(lua_State* L, int index);

    CppObject* GetCppObject(lua_State* L, int index);
    
    void UnInitialize(lua_State* L);

    puerts::ScriptClassRegistry* registry = nullptr;
    pesapi_on_native_object_enter onEnter = nullptr;
    pesapi_on_native_object_exit onExit = nullptr;
    void* envPrivate = nullptr;

    inline void* GetEnvPrivate() const
    {
        return envPrivate;
    }

    inline void SetEnvPrivate(void* envPrivate_)
    {
        envPrivate = envPrivate_;
    }
    
    int m_BufferMetatableRef  = 0;

private:
    eastl::unordered_map<void*, FObjectCacheNode, eastl::hash<const void*>, eastl::equal_to<const void*>, eastl::allocator_malloc> m_DataCache;
    eastl::unordered_map<const void*, int, eastl::hash<const void*>, eastl::equal_to<const void*>, eastl::allocator_malloc> m_TypeIdToMetaMap;
    eastl::shared_ptr<int> ref = eastl::allocate_shared<int>(eastl::allocator_malloc("shared_ptr"), 0);

    int m_CacheRef = 0;
    int m_CachePrivateDataRef = 0;

    int GetMetaRefOfClass(lua_State* L, const puerts::ScriptClassDefinition* classDefinition);

};
}
}
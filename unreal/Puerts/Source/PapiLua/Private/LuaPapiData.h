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
#include "LuaObjectMapper.h"
#include <cstddef>
#include <cstdint>
#include <memory>
#include <string>

// a pesapi_value of the lua backend is an absolute index of the stack of the lua state of the env (0: none, the same as an
// absent argument), the values live until the scope they are created in is closed (its top is restored)

namespace PUERTS_NAMESPACE
{
namespace luaimpl
{
struct pesapi_env_ref__
{
    pesapi_env_ref__(lua_State* InL, FCppObjectMapper* Mapper)
        : L(InL), RefCount(1), Tracker(Mapper ? Mapper->GetEnvLifeCycleTracker() : std::weak_ptr<int>())
    {
    }

    // the main thread
    lua_State* L;
    int RefCount;
    std::weak_ptr<int> Tracker;
};

// a value ref, allocated with extra room for the internal fields (see ValueRefSize)
struct pesapi_value_ref__ : pesapi_env_ref__
{
    pesapi_value_ref__(lua_State* InL, FCppObjectMapper* Mapper, int InRef, uint32_t FieldCount)
        : pesapi_env_ref__(InL, Mapper), Ref(InRef), InternalFieldCount(FieldCount)
    {
        for (uint32_t i = 0; i < FieldCount; ++i)
        {
            InternalFields[i] = nullptr;
        }
    }

    // the registry ref of a strong ref
    int Ref;
    // a weak ref is kept in the weak table of the mapper by WeakId
    bool Weak = false;
    int64_t WeakId = 0;
    uint32_t InternalFieldCount;
    void* InternalFields[1];
};

inline size_t ValueRefSize(uint32_t FieldCount)
{
    size_t Size = offsetof(pesapi_value_ref__, InternalFields) + sizeof(void*) * FieldCount;
    return Size < sizeof(pesapi_value_ref__) ? sizeof(pesapi_value_ref__) : Size;
}

struct caught_exception_info
{
    // the registry ref of the error value
    int ExRef = LUA_NOREF;
    std::string Traceback;
    std::string Message;
};

struct pesapi_scope__
{
    pesapi_scope__(lua_State* InL, FCppObjectMapper* InMapper) : L(InL), Mapper(InMapper), Top(lua_gettop(InL)), Caught(nullptr)
    {
        Prev = Mapper ? Mapper->CurrentScope : nullptr;
        if (Mapper)
        {
            Mapper->CurrentScope = this;
        }
    }

    ~pesapi_scope__()
    {
        if (Caught)
        {
            luaL_unref(L, LUA_REGISTRYINDEX, Caught->ExRef);
            delete Caught;
            Caught = nullptr;
        }
        lua_settop(L, Top);
        if (Mapper)
        {
            Mapper->CurrentScope = Prev;
        }
    }

    // takes the registry ref of the error
    void SetCaught(int ExRef, const std::string& Traceback)
    {
        if (!Caught)
        {
            Caught = new caught_exception_info();
        }
        else
        {
            luaL_unref(L, LUA_REGISTRYINDEX, Caught->ExRef);
        }
        Caught->ExRef = ExRef;
        Caught->Traceback = Traceback;
        Caught->Message.clear();
    }

    lua_State* L;
    FCppObjectMapper* Mapper;
    int Top;
    pesapi_scope__* Prev;
    caught_exception_info* Caught;
};

static_assert(sizeof(pesapi_scope_memory) >= sizeof(pesapi_scope__), "sizeof(pesapi_scope__) > sizeof(pesapi_scope_memory)");

struct pesapi_callback_info__
{
    lua_State* L;
    // the index of the first argument
    int ArgBase;
    int Argc;
    // the index of this, 0 for none
    int ThisIdx;
    void* Data;
    // the index the return value is kept in
    int RetSlot;
    bool HasEx = false;
    std::string ExMsg;
};

// the result of a native callback (the same order as the quickjs backend): the error thrown by throw_by_string, then the one
// caught in the callback scope, else the return value. The error or the return value is put in RetSlot, returns -1 for an error
// message (the position is prepended by the caller), -2 for an error value, 1 for the return value
inline int FinishCallback(lua_State* L, pesapi_scope__& Scope, pesapi_callback_info__& Info)
{
    if (Info.HasEx)
    {
        lua_pushlstring(L, Info.ExMsg.data(), Info.ExMsg.size());
        lua_replace(L, Info.RetSlot);
        return -1;
    }
    if (Scope.Caught)
    {
        lua_rawgeti(L, LUA_REGISTRYINDEX, Scope.Caught->ExRef);
        lua_replace(L, Info.RetSlot);
        return -2;
    }
    return 1;
}

}    // namespace luaimpl
}    // namespace PUERTS_NAMESPACE

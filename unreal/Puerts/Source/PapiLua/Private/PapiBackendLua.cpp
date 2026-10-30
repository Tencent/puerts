/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "PapiBackendLua.h"
#include "PesapiLuaImpl.h"
#include "LuaObjectMapper.h"
#include "lua.hpp"
#include <cstring>

namespace PUERTS_NAMESPACE
{
static inline lua_State* StateOf(pesapi_env Env)
{
    return reinterpret_cast<lua_State*>(Env);
}

FPapiBackendLua::FPapiBackendLua(const FPapiBackendParams& InParams)
    : Params(InParams), CppObjectMapper(std::make_unique<luaimpl::FCppObjectMapper>())
{
    CppObjectMapper->OnClassInvalidated = Params.OnClassInvalidated;
    CppObjectMapper->OnClassCreated = Params.OnClassCreated;
}

FPapiBackendLua::~FPapiBackendLua()
{
    check(!MainL);
}

std::unique_ptr<IPapiBackend> FPapiBackendLua::Create(const FPapiBackendParams& InParams)
{
    return std::make_unique<FPapiBackendLua>(InParams);
}

int FPapiBackendLua::GetApiVersion()
{
    return PESAPI_VERSION;
}

struct pesapi_ffi* FPapiBackendLua::GetApi()
{
    return &luaimpl::g_pesapi_ffi;
}

pesapi_env_ref FPapiBackendLua::CreateEnvRef()
{
    check(!MainL);
    MainL = luaL_newstate();
    luaL_openlibs(MainL);

    // the object mapping used by the lua implementation of pesapi (kept in the extra space of the state)
    CppObjectMapper->Initialize(MainL);
    // after the mapper is initialized: the ref tracks the life cycle of the env, which starts there
    MainEnvRef = luaimpl::g_pesapi_ffi.create_env_ref(reinterpret_cast<pesapi_env>(MainL));
    return MainEnvRef;
}

void FPapiBackendLua::DestroyEnvRef(pesapi_env_ref EnvRef)
{
    if (!MainL)
    {
        return;
    }
    if (EnvRef)
    {
        luaimpl::g_pesapi_ffi.release_env_ref(EnvRef);
    }
    MainEnvRef = nullptr;
    // finalizes the native objects and invalidates the refs of the env
    CppObjectMapper->UnInitialize();
    if (Params.OnEnvReleased)
    {
        Params.OnEnvReleased();
    }
    lua_close(MainL);
    MainL = nullptr;
}

void FPapiBackendLua::OnEnter(IPapiScriptHost* Host)
{
    // print/console, the module searcher of the host, UE/CPP and the helpers used by the host (puerts.__xxx, puerts.argv)
    Host->ExecuteModule(TEXT("puerts/init.lua"));
}

void FPapiBackendLua::OnExit(IPapiScriptHost* Host)
{
}

pesapi_value FPapiBackendLua::ExecuteModule(pesapi_env Env, const char* Specifier, const char* Referrer, bool ByImport)
{
    // the require of lua: the modules are global (no referrer), import is the same as require. A missing require fails in
    // call_function (attempt to call a nil value) and is caught by the scope of the host
    struct pesapi_ffi* Apis = GetApi();
    pesapi_value Require = Apis->get_property(Env, Apis->global(Env), "require");
    pesapi_value Args[] = {Apis->create_string_utf8(Env, Specifier, strlen(Specifier))};
    return Apis->call_function(Env, Require, nullptr, 1, Args);
}

void FPapiBackendLua::RegisterBuiltinModule(pesapi_env Env, const char* Name, pesapi_value Exports)
{
    lua_State* L = StateOf(Env);
    lua_checkstack(L, 4);
    lua_getfield(L, LUA_REGISTRYINDEX, LUA_LOADED_TABLE);
    const int Idx = static_cast<int>(reinterpret_cast<intptr_t>(Exports));
    if (Idx == 0)
    {
        lua_pushnil(L);
    }
    else
    {
        lua_pushvalue(L, Idx);
    }
    lua_setfield(L, -2, Name);
    lua_pop(L, 1);
}

void FPapiBackendLua::LowMemoryNotification()
{
    lua_gc(MainL, LUA_GCCOLLECT, 0);
}

bool FPapiBackendLua::IdleNotificationDeadline(double DeadlineInSeconds)
{
    lua_gc(MainL, LUA_GCSTEP, 0);
    return true;
}

void FPapiBackendLua::RequestMinorGarbageCollectionForTesting()
{
    lua_gc(MainL, LUA_GCCOLLECT, 0);
}

void FPapiBackendLua::RequestFullGarbageCollectionForTesting()
{
    lua_gc(MainL, LUA_GCCOLLECT, 0);
}

FString FPapiBackendLua::GetStatisticsLog()
{
    if (!MainL)
    {
        return FString();
    }
    const int64 Bytes = static_cast<int64>(lua_gc(MainL, LUA_GCCOUNT, 0)) * 1024 + lua_gc(MainL, LUA_GCCOUNTB, 0);
    return FString::Printf(TEXT("------------------------\n"
                                "Dump Statistics of Lua:\n"
                                "memory_used_size: %lld\n"
                                "------------------------\n"),
        Bytes);
}

FString FPapiBackendLua::CurrentStackTrace()
{
    if (!MainL)
    {
        return FString();
    }
    lua_checkstack(MainL, 2);
    luaL_traceback(MainL, MainL, nullptr, 0);
    FString Ret = UTF8_TO_TCHAR(lua_tostring(MainL, -1));
    lua_pop(MainL, 1);
    return Ret;
}

ScriptClassRegistry* FPapiBackendLua::GetRegistry()
{
    return CppObjectMapper->GetRegistry();
}
}    // namespace PUERTS_NAMESPACE

/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "LuaObjectMapper.h"
#include "LuaPapiData.h"
#include "PesapiLuaImpl.h"
#include <cstdio>
#include <cstring>

namespace PUERTS_NAMESPACE
{
namespace luaimpl
{
// the addresses are the keys of the tags in the metatables
static const char ObjectTag = 0;
static const char BufferTag = 0;

static const int MaxSuperDepth = 64;

// ---------------------------------------------------------------- trampolines

// prefixes the message on the top with the position of the nearest lua function of the stack (a getter or a setter is
// called by the __index / __newindex c function)
static void PushWhere(lua_State* L)
{
    lua_Debug Ar;
    for (int Level = 1; lua_getstack(L, Level, &Ar); ++Level)
    {
        lua_getinfo(L, "Sl", &Ar);
        if (Ar.currentline > 0)
        {
            lua_pushfstring(L, "%s:%d: ", Ar.short_src, Ar.currentline);
            return;
        }
    }
    lua_pushliteral(L, "");
}

// raises the error left in the return slot by InvokeCallback, else returns the return value. Called by the outermost c
// functions only (no c++ object alive, lua_error longjmps)
static int RaiseOrReturn(lua_State* L, int Result)
{
    if (Result == -1)
    {
        PushWhere(L);
        lua_insert(L, -2);
        lua_concat(L, 2);
        return lua_error(L);
    }
    if (Result == -2)
    {
        return lua_error(L);
    }
    return 1;
}

// calls the callback with the arguments of the c function (a method if IsMethod: the first argument is this), returns the
// result of FinishCallback with the error or the return value on the top
static int InvokeCallback(lua_State* L, pesapi_callback Callback, void* Data, bool IsMethod)
{
    const int N = lua_gettop(L);
    lua_checkstack(L, LUA_MINSTACK);
    lua_pushnil(L);
    const int RetSlot = N + 1;
    int Result;
    {
        pesapi_scope__ Scope(L, GetMapper(L));
        pesapi_callback_info__ Info;
        Info.L = L;
        if (IsMethod)
        {
            Info.ArgBase = 2;
            Info.Argc = N > 0 ? N - 1 : 0;
            Info.ThisIdx = N > 0 ? 1 : 0;
        }
        else
        {
            Info.ArgBase = 1;
            Info.Argc = N;
            Info.ThisIdx = 0;
        }
        Info.Data = Data;
        Info.RetSlot = RetSlot;
        Callback(&g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&Info));
        Result = FinishCallback(L, Scope, Info);
    }
    lua_settop(L, RetSlot);
    return Result;
}

// upvalues: callback, data
static int MethodTrampoline(lua_State* L)
{
    if (!GetMapper(L))
    {
        return 0;
    }
    auto Callback = reinterpret_cast<pesapi_callback>(lua_touserdata(L, lua_upvalueindex(1)));
    void* Data = lua_touserdata(L, lua_upvalueindex(2));
    return RaiseOrReturn(L, InvokeCallback(L, Callback, Data, true));
}

// upvalues: callback, data, the finalize tracer (or nil)
static int FunctionTrampoline(lua_State* L)
{
    if (!GetMapper(L))
    {
        return 0;
    }
    auto Callback = reinterpret_cast<pesapi_callback>(lua_touserdata(L, lua_upvalueindex(1)));
    void* Data = lua_touserdata(L, lua_upvalueindex(2));
    return RaiseOrReturn(L, InvokeCallback(L, Callback, Data, false));
}

static void PushMethod(lua_State* L, pesapi_callback Callback, void* Data)
{
    lua_pushlightuserdata(L, reinterpret_cast<void*>(Callback));
    lua_pushlightuserdata(L, Data);
    lua_pushcclosure(L, MethodTrampoline, 2);
}

static void PushStaticFunction(lua_State* L, pesapi_callback Callback, void* Data)
{
    lua_pushlightuserdata(L, reinterpret_cast<void*>(Callback));
    lua_pushlightuserdata(L, Data);
    lua_pushnil(L);
    lua_pushcclosure(L, FunctionTrampoline, 3);
}

static int NewObjectImpl(lua_State* L, const JSClassDefinition* ClassDefinition, int N)
{
    lua_checkstack(L, LUA_MINSTACK);
    lua_pushnil(L);
    const int RetSlot = N + 1;
    FLuaCppObject* Obj = static_cast<FLuaCppObject*>(lua_newuserdatauv(L, sizeof(FLuaCppObject), 2));
    memset(Obj, 0, sizeof(FLuaCppObject));
    Obj->ClassDefinition = ClassDefinition;
    Obj->TypeId = ClassDefinition->TypeId;
    lua_pushvalue(L, lua_upvalueindex(2));
    lua_setmetatable(L, -2);
    const int Self = N + 2;
    int Result = 1;
    if (ClassDefinition->Initialize)
    {
        FCppObjectMapper* Mapper = GetMapper(L);
        pesapi_scope__ Scope(L, Mapper);
        pesapi_callback_info__ Info;
        Info.L = L;
        Info.ArgBase = 2;
        Info.Argc = N > 0 ? N - 1 : 0;
        Info.ThisIdx = Self;
        Info.Data = ClassDefinition->Data;
        Info.RetSlot = RetSlot;
        void* Ptr = ClassDefinition->Initialize(&g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&Info));
        Result = FinishCallback(L, Scope, Info);
        if (Result == 1 && Ptr)
        {
            Mapper->BindCppObject(L, ClassDefinition, Ptr, Self, false);
        }
    }
    if (Result == 1)
    {
        lua_pushvalue(L, Self);
        lua_replace(L, RetSlot);
    }
    lua_settop(L, RetSlot);
    return Result;
}

// the __call of a class table: (cls, ...), upvalues: the definition, the metatable of the objects
static int ObjectNew(lua_State* L)
{
    if (!GetMapper(L))
    {
        return 0;
    }
    auto ClassDefinition = static_cast<const JSClassDefinition*>(lua_touserdata(L, lua_upvalueindex(1)));
    return RaiseOrReturn(L, NewObjectImpl(L, ClassDefinition, lua_gettop(L)));
}

// the __index of the objects: (obj, key), upvalues: the methods, the getters
static int ObjIndex(lua_State* L)
{
    lua_settop(L, 2);
    lua_pushvalue(L, 2);
    lua_gettable(L, lua_upvalueindex(1));
    if (!lua_isnil(L, -1))
    {
        return 1;
    }
    lua_pop(L, 1);
    lua_pushvalue(L, 2);
    lua_gettable(L, lua_upvalueindex(2));
    if (lua_isfunction(L, -1))
    {
        lua_pushvalue(L, 1);
        lua_call(L, 1, 1);
        return 1;
    }
    lua_pop(L, 1);
    if (lua_getiuservalue(L, 1, 2) == LUA_TTABLE)
    {
        lua_pushvalue(L, 2);
        lua_rawget(L, -2);
        return 1;
    }
    lua_pushnil(L);
    return 1;
}

// the __newindex of the objects: (obj, key, value), upvalues: the setters, the getters
static int ObjNewIndex(lua_State* L)
{
    lua_settop(L, 3);
    lua_pushvalue(L, 2);
    lua_gettable(L, lua_upvalueindex(1));
    if (lua_isfunction(L, -1))
    {
        lua_pushvalue(L, 1);
        lua_pushvalue(L, 3);
        lua_call(L, 2, 0);
        return 0;
    }
    lua_pop(L, 1);
    lua_pushvalue(L, 2);
    lua_gettable(L, lua_upvalueindex(2));
    if (!lua_isnil(L, -1))
    {
        lua_pop(L, 1);
        return luaL_error(L, "property %s is read-only", lua_isstring(L, 2) ? lua_tostring(L, 2) : "?");
    }
    lua_pop(L, 1);
    if (lua_getiuservalue(L, 1, 2) != LUA_TTABLE)
    {
        lua_pop(L, 1);
        lua_newtable(L);
        lua_pushvalue(L, -1);
        lua_setiuservalue(L, 1, 2);
    }
    lua_pushvalue(L, 2);
    lua_pushvalue(L, 3);
    lua_rawset(L, -3);
    return 0;
}

static int ObjGc(lua_State* L)
{
    FCppObjectMapper* Mapper = GetMapper(L);
    FLuaCppObject* Obj = static_cast<FLuaCppObject*>(lua_touserdata(L, 1));
    if (Mapper && Mapper->MainL && Obj && Obj->Ptr)
    {
        Mapper->OnObjectGc(Obj);
    }
    return 0;
}

static int ObjToString(lua_State* L)
{
    FLuaCppObject* Obj = static_cast<FLuaCppObject*>(lua_touserdata(L, 1));
    const char* Name = (Obj && Obj->ClassDefinition && Obj->ClassDefinition->ScriptName) ? Obj->ClassDefinition->ScriptName : "?";
    lua_pushfstring(L, "%s: %p", Name, Obj ? Obj->Ptr : nullptr);
    return 1;
}

// the __index of a class table: (cls, key), upvalues: the static getters, the super class (or nil)
static int StaticIndex(lua_State* L)
{
    lua_settop(L, 2);
    lua_pushvalue(L, 2);
    lua_rawget(L, lua_upvalueindex(1));
    if (lua_isfunction(L, -1))
    {
        lua_call(L, 0, 1);
        return 1;
    }
    lua_pop(L, 1);
    if (!lua_isnil(L, lua_upvalueindex(2)))
    {
        lua_pushvalue(L, 2);
        lua_gettable(L, lua_upvalueindex(2));
        return 1;
    }
    lua_pushnil(L);
    return 1;
}

// the __newindex of a class table: (cls, key, value), upvalues: the static setters
static int StaticNewIndex(lua_State* L)
{
    lua_settop(L, 3);
    lua_pushvalue(L, 2);
    lua_rawget(L, lua_upvalueindex(1));
    if (lua_isfunction(L, -1))
    {
        lua_pushvalue(L, 3);
        lua_call(L, 1, 0);
        return 0;
    }
    lua_pop(L, 1);
    lua_rawset(L, 1);
    return 0;
}

// upvalues: the name
static int ClsToString(lua_State* L)
{
    lua_pushvalue(L, lua_upvalueindex(1));
    return 1;
}

static int FuncTracerGc(lua_State* L)
{
    FCppObjectMapper* Mapper = GetMapper(L);
    FFuncFinalizeData* Data = static_cast<FFuncFinalizeData*>(lua_touserdata(L, 1));
    if (Mapper && Mapper->MainL && Data)
    {
        if (Data->Finalize)
        {
            Data->Finalize(&g_pesapi_ffi, Data->Data, const_cast<void*>(Mapper->GetEnvPrivate()));
            Data->Finalize = nullptr;
        }
        Mapper->RemoveFuncFinalizeData(Data);
    }
    return 0;
}

static int BufferIndex(lua_State* L)
{
    FByteBuffer* Buffer = static_cast<FByteBuffer*>(lua_touserdata(L, 1));
    int IsNum = 0;
    lua_Integer I = lua_tointegerx(L, 2, &IsNum);
    if (Buffer && IsNum && I >= 1 && static_cast<size_t>(I) <= Buffer->Size)
    {
        lua_pushinteger(L, Buffer->Ptr[I - 1]);
        return 1;
    }
    lua_pushnil(L);
    return 1;
}

static int BufferNewIndex(lua_State* L)
{
    FByteBuffer* Buffer = static_cast<FByteBuffer*>(lua_touserdata(L, 1));
    int IsNum = 0;
    lua_Integer I = lua_tointegerx(L, 2, &IsNum);
    if (!Buffer || !IsNum || I < 1 || static_cast<size_t>(I) > Buffer->Size)
    {
        return luaL_error(L, "index out of range");
    }
    Buffer->Ptr[I - 1] = static_cast<uint8_t>(luaL_checkinteger(L, 3));
    return 0;
}

static int BufferLen(lua_State* L)
{
    FByteBuffer* Buffer = static_cast<FByteBuffer*>(lua_touserdata(L, 1));
    lua_pushinteger(L, Buffer ? static_cast<lua_Integer>(Buffer->Size) : 0);
    return 1;
}

static int MessageHandler(lua_State* L)
{
    FCppObjectMapper* Mapper = GetMapper(L);
    if (Mapper)
    {
        luaL_traceback(L, L, nullptr, 1);
        size_t Len = 0;
        const char* Str = lua_tolstring(L, -1, &Len);
        Mapper->LastTraceback.assign(Str ? Str : "", Str ? Len : 0);
        lua_pop(L, 1);
    }
    return 1;
}

static int NewWeakTable(lua_State* L, const char* Mode)
{
    lua_newtable(L);
    lua_newtable(L);
    lua_pushstring(L, "__mode");
    lua_pushstring(L, Mode);
    lua_rawset(L, -3);
    lua_setmetatable(L, -2);
    return luaL_ref(L, LUA_REGISTRYINDEX);
}

static void RawSetFunction(lua_State* L, int TableIdx, const char* Name, lua_CFunction Func)
{
    lua_pushstring(L, Name);
    lua_pushcfunction(L, Func);
    lua_rawset(L, TableIdx);
}

// ---------------------------------------------------------------- mapper

void FCppObjectMapper::Initialize(lua_State* L)
{
    MainL = L;
    SetMapper(L, this);
    if (!Ref)
    {
        Ref = std::make_shared<int>(0);
    }

    PtrClassDef.TypeId = &PtrClassDef;
    PtrClassDef.ScriptName = "__Pointer";

    CacheTableRef = NewWeakTable(L, "v");
    WeakRefTableRef = NewWeakTable(L, "v");
    PrivateTableRef = NewWeakTable(L, "k");

    lua_newtable(L);
    int MT = lua_gettop(L);
    RawSetFunction(L, MT, "__index", BufferIndex);
    RawSetFunction(L, MT, "__newindex", BufferNewIndex);
    RawSetFunction(L, MT, "__len", BufferLen);
    lua_pushboolean(L, 1);
    lua_rawsetp(L, MT, &BufferTag);
    BufferMetaRef = luaL_ref(L, LUA_REGISTRYINDEX);

    lua_newtable(L);
    MT = lua_gettop(L);
    RawSetFunction(L, MT, "__gc", FuncTracerGc);
    FuncTracerMetaRef = luaL_ref(L, LUA_REGISTRYINDEX);
}

FLuaCppObject* FCppObjectMapper::GetCppObject(lua_State* L, int Idx)
{
    if (Idx == 0 || lua_type(L, Idx) != LUA_TUSERDATA)
    {
        return nullptr;
    }
    if (!lua_getmetatable(L, Idx))
    {
        return nullptr;
    }
    lua_rawgetp(L, -1, &ObjectTag);
    bool IsObject = !lua_isnil(L, -1);
    lua_pop(L, 2);
    return IsObject ? static_cast<FLuaCppObject*>(lua_touserdata(L, Idx)) : nullptr;
}

FByteBuffer* FCppObjectMapper::GetByteBuffer(lua_State* L, int Idx)
{
    if (Idx == 0 || lua_type(L, Idx) != LUA_TUSERDATA)
    {
        return nullptr;
    }
    if (!lua_getmetatable(L, Idx))
    {
        return nullptr;
    }
    lua_rawgetp(L, -1, &BufferTag);
    bool IsBuffer = !lua_isnil(L, -1);
    lua_pop(L, 2);
    return IsBuffer ? static_cast<FByteBuffer*>(lua_touserdata(L, Idx)) : nullptr;
}

void FCppObjectMapper::PushBinary(lua_State* L, void* Bin, size_t Length, bool Copy)
{
    size_t Size = Copy ? offsetof(FByteBuffer, Data) + Length : sizeof(FByteBuffer);
    if (Size < sizeof(FByteBuffer))
    {
        Size = sizeof(FByteBuffer);
    }
    FByteBuffer* Buffer = static_cast<FByteBuffer*>(lua_newuserdatauv(L, Size, 0));
    Buffer->Size = Length;
    if (Copy)
    {
        if (Length && Bin)
        {
            memcpy(Buffer->Data, Bin, Length);
        }
        Buffer->Ptr = Buffer->Data;
    }
    else
    {
        Buffer->Ptr = static_cast<uint8_t*>(Bin);
    }
    lua_rawgeti(L, LUA_REGISTRYINDEX, BufferMetaRef);
    lua_setmetatable(L, -2);
}

static inline bool IsPrivateHolder(int Type)
{
    return Type == LUA_TTABLE || Type == LUA_TUSERDATA || Type == LUA_TFUNCTION;
}

bool FCppObjectMapper::GetPrivate(lua_State* L, int Idx, void** OutPtr)
{
    *OutPtr = nullptr;
    if (Idx == 0 || !IsPrivateHolder(lua_type(L, Idx)))
    {
        return false;
    }
    lua_rawgeti(L, LUA_REGISTRYINDEX, PrivateTableRef);
    lua_pushvalue(L, Idx);
    lua_rawget(L, -2);
    *OutPtr = lua_touserdata(L, -1);
    lua_pop(L, 2);
    return true;
}

bool FCppObjectMapper::SetPrivate(lua_State* L, int Idx, void* Ptr)
{
    if (Idx == 0 || !IsPrivateHolder(lua_type(L, Idx)))
    {
        return false;
    }
    lua_rawgeti(L, LUA_REGISTRYINDEX, PrivateTableRef);
    lua_pushvalue(L, Idx);
    lua_pushlightuserdata(L, Ptr);
    lua_rawset(L, -3);
    lua_pop(L, 1);
    return true;
}

void FCppObjectMapper::PushFunction(lua_State* L, pesapi_callback Callback, void* Data, pesapi_function_finalize Finalize)
{
    lua_pushlightuserdata(L, reinterpret_cast<void*>(Callback));
    lua_pushlightuserdata(L, Data);
    if (Finalize)
    {
        FFuncFinalizeData* FinalizeData = static_cast<FFuncFinalizeData*>(lua_newuserdatauv(L, sizeof(FFuncFinalizeData), 0));
        FinalizeData->Finalize = Finalize;
        FinalizeData->Data = Data;
        lua_rawgeti(L, LUA_REGISTRYINDEX, FuncTracerMetaRef);
        lua_setmetatable(L, -2);
        FuncFinalizeDatas.insert(FinalizeData);
    }
    else
    {
        lua_pushnil(L);
    }
    lua_pushcclosure(L, FunctionTrampoline, 3);
}

FCppObjectMapper::FClassEntry* FCppObjectMapper::FindOrCreateClass(lua_State* L, const JSClassDefinition* ClassDefinition)
{
    auto It = TypeIdToClassMap.find(ClassDefinition->TypeId);
    if (It != TypeIdToClassMap.end())
    {
        return &It->second;
    }

    const int Top = lua_gettop(L);
    lua_checkstack(L, 24);
    const int M = Top + 1;
    const int G = Top + 2;
    const int S = Top + 3;
    const int SG = Top + 4;
    const int SS = Top + 5;
    const int Cls = Top + 6;
    const int ObjMT = Top + 7;
    for (int i = 0; i < 7; ++i)
    {
        lua_newtable(L);
    }

    for (JSFunctionInfo* FunctionInfo = ClassDefinition->Methods; FunctionInfo && FunctionInfo->Name && FunctionInfo->Callback;
         ++FunctionInfo)
    {
        lua_pushstring(L, FunctionInfo->Name);
        PushMethod(L, FunctionInfo->Callback, FunctionInfo->Data);
        lua_rawset(L, M);
    }

    for (JSPropertyInfo* PropertyInfo = ClassDefinition->Properties; PropertyInfo && PropertyInfo->Name; ++PropertyInfo)
    {
        lua_pushstring(L, PropertyInfo->Name);
        if (PropertyInfo->Getter)
        {
            PushMethod(L, PropertyInfo->Getter, PropertyInfo->GetterData);
        }
        else
        {
            // a write only property, reads nil
            lua_pushboolean(L, 0);
        }
        lua_rawset(L, G);
        if (PropertyInfo->Setter)
        {
            lua_pushstring(L, PropertyInfo->Name);
            PushMethod(L, PropertyInfo->Setter, PropertyInfo->SetterData);
            lua_rawset(L, S);
        }
    }

    for (JSFunctionInfo* FunctionInfo = ClassDefinition->Functions; FunctionInfo && FunctionInfo->Name && FunctionInfo->Callback;
         ++FunctionInfo)
    {
        lua_pushstring(L, FunctionInfo->Name);
        PushStaticFunction(L, FunctionInfo->Callback, FunctionInfo->Data);
        lua_rawset(L, Cls);
    }

    for (JSPropertyInfo* PropertyInfo = ClassDefinition->Variables; PropertyInfo && PropertyInfo->Name; ++PropertyInfo)
    {
        if (PropertyInfo->Getter)
        {
            lua_pushstring(L, PropertyInfo->Name);
            PushStaticFunction(L, PropertyInfo->Getter, PropertyInfo->GetterData);
            lua_rawset(L, SG);
        }
        if (PropertyInfo->Setter)
        {
            lua_pushstring(L, PropertyInfo->Name);
            PushStaticFunction(L, PropertyInfo->Setter, PropertyInfo->SetterData);
            lua_rawset(L, SS);
        }
    }

    const char* ScriptName = ClassDefinition->ScriptName ? ClassDefinition->ScriptName : "";

    lua_pushstring(L, "__index");
    lua_pushvalue(L, M);
    lua_pushvalue(L, G);
    lua_pushcclosure(L, ObjIndex, 2);
    lua_rawset(L, ObjMT);
    lua_pushstring(L, "__newindex");
    lua_pushvalue(L, S);
    lua_pushvalue(L, G);
    lua_pushcclosure(L, ObjNewIndex, 2);
    lua_rawset(L, ObjMT);
    RawSetFunction(L, ObjMT, "__gc", ObjGc);
    RawSetFunction(L, ObjMT, "__tostring", ObjToString);
    lua_pushstring(L, "__name");
    lua_pushstring(L, ScriptName);
    lua_rawset(L, ObjMT);
    lua_pushvalue(L, Cls);
    lua_rawsetp(L, ObjMT, &ObjectTag);

    FClassEntry Entry;
    Entry.ClassDefinition = ClassDefinition;
    lua_pushvalue(L, M);
    Entry.MRef = luaL_ref(L, LUA_REGISTRYINDEX);
    lua_pushvalue(L, G);
    Entry.GRef = luaL_ref(L, LUA_REGISTRYINDEX);
    lua_pushvalue(L, S);
    Entry.SRef = luaL_ref(L, LUA_REGISTRYINDEX);
    lua_pushvalue(L, SG);
    Entry.SGRef = luaL_ref(L, LUA_REGISTRYINDEX);
    lua_pushvalue(L, SS);
    Entry.SSRef = luaL_ref(L, LUA_REGISTRYINDEX);
    lua_pushvalue(L, Cls);
    Entry.ClsRef = luaL_ref(L, LUA_REGISTRYINDEX);
    lua_pushvalue(L, ObjMT);
    Entry.ObjMetaRef = luaL_ref(L, LUA_REGISTRYINDEX);

    if (OnClassCreated)
    {
        OnClassCreated(ClassDefinition);
    }

    // registered before the super class, a cyclic super chain ends here (the elements of an unordered_map are stable)
    FClassEntry* Ret = &(TypeIdToClassMap[ClassDefinition->TypeId] = Entry);

    FClassEntry* SuperEntry = nullptr;
    if (ClassDefinition->SuperTypeId)
    {
        if (auto SuperDefinition = LoadClassByID(Registry, ClassDefinition->SuperTypeId))
        {
            SuperEntry = FindOrCreateClass(L, SuperDefinition);
        }
    }
    if (SuperEntry)
    {
        const int Tables[3] = {M, G, S};
        const int SuperRefs[3] = {SuperEntry->MRef, SuperEntry->GRef, SuperEntry->SRef};
        for (int i = 0; i < 3; ++i)
        {
            lua_newtable(L);
            lua_pushstring(L, "__index");
            lua_rawgeti(L, LUA_REGISTRYINDEX, SuperRefs[i]);
            lua_rawset(L, -3);
            lua_setmetatable(L, Tables[i]);
        }
    }

    lua_newtable(L);
    const int ClsMT = lua_gettop(L);
    lua_pushstring(L, "__call");
    lua_pushlightuserdata(L, const_cast<JSClassDefinition*>(ClassDefinition));
    lua_pushvalue(L, ObjMT);
    lua_pushcclosure(L, ObjectNew, 2);
    lua_rawset(L, ClsMT);
    lua_pushstring(L, "__index");
    lua_pushvalue(L, SG);
    if (SuperEntry)
    {
        lua_rawgeti(L, LUA_REGISTRYINDEX, SuperEntry->ClsRef);
    }
    else
    {
        lua_pushnil(L);
    }
    lua_pushcclosure(L, StaticIndex, 2);
    lua_rawset(L, ClsMT);
    lua_pushstring(L, "__newindex");
    lua_pushvalue(L, SS);
    lua_pushcclosure(L, StaticNewIndex, 1);
    lua_rawset(L, ClsMT);
    lua_pushstring(L, "__tostring");
    lua_pushfstring(L, "class %s", ScriptName);
    lua_pushcclosure(L, ClsToString, 1);
    lua_rawset(L, ClsMT);
    lua_setmetatable(L, Cls);

    lua_settop(L, Top);
    return Ret;
}

FCppObjectMapper::FClassEntry* FCppObjectMapper::FindOrCreateClassByID(lua_State* L, const void* TypeId)
{
    auto It = TypeIdToClassMap.find(TypeId);
    if (It != TypeIdToClassMap.end())
    {
        return &It->second;
    }
    auto ClassDefinition = LoadClassByID(Registry, TypeId);
    if (!ClassDefinition)
    {
        return nullptr;
    }
    return FindOrCreateClass(L, ClassDefinition);
}

bool FCppObjectMapper::PushClassByID(lua_State* L, const void* TypeId)
{
    FClassEntry* Entry = FindOrCreateClassByID(L, TypeId);
    if (!Entry)
    {
        return false;
    }
    lua_rawgeti(L, LUA_REGISTRYINDEX, Entry->ClsRef);
    return true;
}

void FCppObjectMapper::ReleaseClassEntry(lua_State* L, FClassEntry& Entry)
{
    const int Refs[7] = {Entry.ClsRef, Entry.ObjMetaRef, Entry.MRef, Entry.GRef, Entry.SRef, Entry.SGRef, Entry.SSRef};
    for (int R : Refs)
    {
        luaL_unref(L, LUA_REGISTRYINDEX, R);
    }
}

void FCppObjectMapper::InvalidateClass(const void* TypeId)
{
    if (OnClassInvalidated)
    {
        OnClassInvalidated(TypeId);
    }
    auto It = TypeIdToClassMap.find(TypeId);
    if (It != TypeIdToClassMap.end())
    {
        if (MainL)
        {
            ReleaseClassEntry(MainL, It->second);
        }
        TypeIdToClassMap.erase(It);
    }
}

FLuaCppObject* FCppObjectMapper::NewObject(lua_State* L, FClassEntry* Entry)
{
    FLuaCppObject* Obj = static_cast<FLuaCppObject*>(lua_newuserdatauv(L, sizeof(FLuaCppObject), 2));
    memset(Obj, 0, sizeof(FLuaCppObject));
    Obj->ClassDefinition = Entry->ClassDefinition;
    Obj->TypeId = Entry->ClassDefinition->TypeId;
    lua_rawgeti(L, LUA_REGISTRYINDEX, Entry->ObjMetaRef);
    lua_setmetatable(L, -2);
    return Obj;
}

void FCppObjectMapper::PushCppObject(lua_State* L, const void* TypeId, void* Ptr, bool PassByPointer)
{
    lua_checkstack(L, 8);
    if (!Ptr)
    {
        lua_pushnil(L);
        return;
    }

    if (PassByPointer)
    {
        auto Iter = CDataCache.find(Ptr);
        if (Iter != CDataCache.end())
        {
            auto CacheNodePtr = Iter->second.Find(TypeId);
            if (CacheNodePtr)
            {
                lua_rawgeti(L, LUA_REGISTRYINDEX, CacheTableRef);
                lua_rawgeti(L, -1, CacheNodePtr->Value);
                lua_remove(L, -2);
                if (!lua_isnil(L, -1))
                {
                    return;
                }
                lua_pop(L, 1);
                // collected but not finalized yet (removed from the weak table first), the object is bound again
                auto It = TypeIdToClassMap.find(TypeId);
                const JSClassDefinition* ClassDefinition =
                    It != TypeIdToClassMap.end() ? It->second.ClassDefinition : FindClassByID(Registry, TypeId);
                if (ClassDefinition)
                {
                    UnBindCppObject(ClassDefinition, Ptr);
                }
            }
        }
    }

    FClassEntry* Entry = FindOrCreateClassByID(L, TypeId);
    if (Entry)
    {
        NewObject(L, Entry);
        BindCppObject(L, Entry->ClassDefinition, Ptr, lua_gettop(L), PassByPointer);
        return;
    }

    // a pointer of an unknown class: not cached, not finalized
    Entry = FindOrCreateClass(L, &PtrClassDef);
    FLuaCppObject* Obj = NewObject(L, Entry);
    Obj->TypeId = TypeId;
    Obj->Ptr = Ptr;
    Obj->CallFinalize = false;
    Obj->CacheId = 0;
}

bool FCppObjectMapper::IsInstanceOf(lua_State* L, const void* TypeId, int Idx)
{
    FLuaCppObject* Obj = GetCppObject(L, Idx);
    if (!Obj)
    {
        return false;
    }
    if (Obj->TypeId == TypeId)
    {
        return true;
    }
    const JSClassDefinition* ClassDefinition = Obj->ClassDefinition;
    for (int i = 0; ClassDefinition && i < MaxSuperDepth; ++i)
    {
        if (ClassDefinition->TypeId == TypeId)
        {
            return true;
        }
        if (!ClassDefinition->SuperTypeId)
        {
            break;
        }
        ClassDefinition = LoadClassByID(Registry, ClassDefinition->SuperTypeId);
    }
    return false;
}

void FCppObjectMapper::BindCppObject(
    lua_State* L, const JSClassDefinition* ClassDefinition, void* Ptr, int ObjIdx, bool PassByPointer)
{
    FLuaCppObject* Obj = GetCppObject(L, ObjIdx);
    if (!Obj)
    {
        return;
    }
    Obj->Ptr = Ptr;
    Obj->ClassDefinition = ClassDefinition;
    Obj->TypeId = ClassDefinition->TypeId;
    Obj->CallFinalize = !PassByPointer;
    Obj->CacheId = ++NextCacheId;

    lua_rawgeti(L, LUA_REGISTRYINDEX, CacheTableRef);
    lua_pushvalue(L, ObjIdx);
    lua_rawseti(L, -2, Obj->CacheId);
    lua_pop(L, 1);

    auto Iter = CDataCache.find(Ptr);
    FObjectCacheNode* CacheNodePtr;
    if (Iter != CDataCache.end())
    {
        auto Temp = Iter->second.Find(ClassDefinition->TypeId);
        CacheNodePtr = Temp ? Temp : Iter->second.Add(ClassDefinition->TypeId);
    }
    else
    {
        auto Ret = CDataCache.insert({Ptr, FObjectCacheNode(ClassDefinition->TypeId)});
        CacheNodePtr = &Ret.first->second;
    }
    CacheNodePtr->Value = Obj->CacheId;
    CacheNodePtr->MustCallFinalize = !PassByPointer;

    if (ClassDefinition->OnEnter)
    {
        CacheNodePtr->UserData = ClassDefinition->OnEnter(Ptr, ClassDefinition->Data, const_cast<void*>(GetEnvPrivate()));
    }
}

void FCppObjectMapper::UnBindCppObject(const JSClassDefinition* ClassDefinition, void* Ptr)
{
    auto Iter = CDataCache.find(Ptr);
    if (Iter != CDataCache.end())
    {
        auto Node = Iter->second.Find(ClassDefinition->TypeId);
        if (!Node)
        {
            return;
        }
        if (ClassDefinition->OnExit)
        {
            ClassDefinition->OnExit(Ptr, ClassDefinition->Data, const_cast<void*>(GetEnvPrivate()), Node->UserData);
        }
        Iter->second.Remove(ClassDefinition->TypeId, true);
        if (!Iter->second.TypeId)    // last one
        {
            CDataCache.erase(Iter);
        }
    }
}

bool FCppObjectMapper::UnbindNativeObject(lua_State* L, const void* TypeId, void* Ptr)
{
    auto Iter = CDataCache.find(Ptr);
    if (Iter == CDataCache.end())
    {
        return false;
    }
    auto Node = Iter->second.Find(TypeId);
    if (!Node)
    {
        return false;
    }
    const int64_t CacheId = Node->Value;
    lua_checkstack(L, 4);
    lua_rawgeti(L, LUA_REGISTRYINDEX, CacheTableRef);
    lua_rawgeti(L, -1, CacheId);
    if (FLuaCppObject* Obj = GetCppObject(L, lua_gettop(L)))
    {
        // the object stays alive, its __gc does nothing
        Obj->Ptr = nullptr;
        Obj->CallFinalize = false;
        Obj->CacheId = 0;
        lua_pop(L, 1);
        lua_pushnil(L);
        lua_rawseti(L, -2, CacheId);
        lua_pop(L, 1);
    }
    else
    {
        // collected but waiting for __gc (removed from the weak table first), its __gc skips it
        lua_pop(L, 2);
        UnboundCacheIds.insert(CacheId);
    }
    void* UserData = Node->UserData;
    Iter->second.Remove(TypeId, true);
    if (!Iter->second.TypeId)    // last one
    {
        CDataCache.erase(Iter);
    }
    auto ClassIter = TypeIdToClassMap.find(TypeId);
    const JSClassDefinition* ClassDefinition =
        ClassIter != TypeIdToClassMap.end() ? ClassIter->second.ClassDefinition : FindClassByID(Registry, TypeId);
    if (ClassDefinition && ClassDefinition->OnExit)
    {
        ClassDefinition->OnExit(Ptr, ClassDefinition->Data, const_cast<void*>(GetEnvPrivate()), UserData);
    }
    return true;
}

void FCppObjectMapper::OnObjectGc(FLuaCppObject* Obj)
{
    const JSClassDefinition* ClassDefinition = Obj->ClassDefinition;
    void* Ptr = Obj->Ptr;
    Obj->Ptr = nullptr;
    if (!ClassDefinition || ClassDefinition == &PtrClassDef)
    {
        return;
    }
    // unbound while it was waiting for __gc (no longer in the weak table): the host owns the pointer now
    if (Obj->CacheId && UnboundCacheIds.erase(Obj->CacheId))
    {
        return;
    }
    if (Obj->CallFinalize && ClassDefinition->Finalize)
    {
        ClassDefinition->Finalize(&g_pesapi_ffi, Ptr, ClassDefinition->Data, const_cast<void*>(GetEnvPrivate()));
    }
    if (Obj->CacheId)
    {
        auto Iter = CDataCache.find(Ptr);
        if (Iter != CDataCache.end())
        {
            auto Node = Iter->second.Find(ClassDefinition->TypeId);
            // a newer object of the pointer is not unbound
            if (Node && Node->Value == Obj->CacheId)
            {
                UnBindCppObject(ClassDefinition, Ptr);
            }
        }
    }
}

bool FCppObjectMapper::ProtectedCall(lua_State* L, int NArgs, int NResults)
{
    const int FuncIdx = lua_gettop(L) - NArgs;
    LastTraceback.clear();
    lua_pushcfunction(L, MessageHandler);
    lua_insert(L, FuncIdx);
    int Ret = lua_pcall(L, NArgs, NResults, FuncIdx);
    lua_remove(L, FuncIdx);
    if (Ret != LUA_OK)
    {
        CatchError(L);
        return false;
    }
    return true;
}

void FCppObjectMapper::CatchError(lua_State* L)
{
    int ExRef = luaL_ref(L, LUA_REGISTRYINDEX);
    if (CurrentScope)
    {
        CurrentScope->SetCaught(ExRef, LastTraceback);
    }
    else
    {
        luaL_unref(L, LUA_REGISTRYINDEX, ExRef);
    }
    LastTraceback.clear();
}

void FCppObjectMapper::UnInitialize()
{
    lua_State* L = MainL;
    if (!L)
    {
        return;
    }
    void* PData = const_cast<void*>(GetEnvPrivate());
    // the objects still alive are detached before any callback runs (their __gc must not finalize again)
    auto Cache = std::move(CDataCache);
    CDataCache.clear();
    lua_rawgeti(L, LUA_REGISTRYINDEX, CacheTableRef);
    for (auto& KV : Cache)
    {
        for (FObjectCacheNode* PNode = &KV.second; PNode; PNode = PNode->Next)
        {
            lua_rawgeti(L, -1, PNode->Value);
            if (FLuaCppObject* Obj = GetCppObject(L, lua_gettop(L)))
            {
                Obj->Ptr = nullptr;
            }
            lua_pop(L, 1);
        }
    }
    lua_pop(L, 1);
    for (auto& KV : Cache)
    {
        for (FObjectCacheNode* PNode = &KV.second; PNode; PNode = PNode->Next)
        {
            const JSClassDefinition* ClassDefinition = FindClassByID(Registry, PNode->TypeId);
            if (ClassDefinition)
            {
                if (PNode->MustCallFinalize && ClassDefinition->Finalize)
                {
                    ClassDefinition->Finalize(&g_pesapi_ffi, KV.first, ClassDefinition->Data, PData);
                }
                if (ClassDefinition->OnExit)
                {
                    ClassDefinition->OnExit(KV.first, ClassDefinition->Data, PData, PNode->UserData);
                }
            }
        }
    }
    Cache.clear();
    UnboundCacheIds.clear();

    for (FFuncFinalizeData* Data : FuncFinalizeDatas)
    {
        if (Data->Finalize)
        {
            Data->Finalize(&g_pesapi_ffi, Data->Data, PData);
            Data->Finalize = nullptr;
        }
    }
    FuncFinalizeDatas.clear();

    for (auto& KV : TypeIdToClassMap)
    {
        ReleaseClassEntry(L, KV.second);
    }
    TypeIdToClassMap.clear();

    SetMapper(L, nullptr);
    MainL = nullptr;
    CurrentScope = nullptr;
    HasPendingError = false;
    PendingError.clear();

    Ref.reset();
}

}    // namespace luaimpl
}    // namespace PUERTS_NAMESPACE

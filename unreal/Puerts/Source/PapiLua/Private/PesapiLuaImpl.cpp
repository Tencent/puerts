/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

// the lua implementation of pesapi, ported from unity/native/papi-lua (PesapiLuaImpl.cpp), with the behavior aligned to the
// quickjs backend of unreal (PapiQuickjs). A pesapi_value is an absolute stack index of the lua state of the env (0: none)

#include "PesapiLuaImpl.h"
#include "LuaPapiData.h"
#include "LuaObjectMapper.h"
#include <cmath>
#include <cstdlib>
#include <cstring>
#include <new>
#include <string>

namespace PUERTS_NAMESPACE
{
namespace luaimpl
{
static inline lua_State* StateOf(pesapi_env Env)
{
    return reinterpret_cast<lua_State*>(Env);
}

static inline int IndexOf(pesapi_value Value)
{
    return static_cast<int>(reinterpret_cast<intptr_t>(Value));
}

static inline pesapi_value ValueOf(int Idx)
{
    return reinterpret_cast<pesapi_value>(static_cast<intptr_t>(Idx));
}

static inline pesapi_scope__* ScopeOf(pesapi_scope Scope)
{
    return reinterpret_cast<pesapi_scope__*>(Scope);
}

static inline pesapi_env_ref__* EnvRefOf(pesapi_env_ref Ref)
{
    return reinterpret_cast<pesapi_env_ref__*>(Ref);
}

static inline pesapi_value_ref__* ValueRefOf(pesapi_value_ref Ref)
{
    return reinterpret_cast<pesapi_value_ref__*>(Ref);
}

static inline pesapi_callback_info__* InfoOf(pesapi_callback_info Info)
{
    return reinterpret_cast<pesapi_callback_info__*>(Info);
}

// the type of a value, LUA_TNONE for 0
static inline int TypeOf(lua_State* L, pesapi_value Value)
{
    int Idx = IndexOf(Value);
    return Idx == 0 ? LUA_TNONE : lua_type(L, Idx);
}

// pushes the value (nil for 0)
static inline void PushVal(lua_State* L, pesapi_value Value)
{
    int Idx = IndexOf(Value);
    if (Idx == 0)
    {
        lua_pushnil(L);
    }
    else
    {
        lua_pushvalue(L, Idx);
    }
}

static inline pesapi_value Top(lua_State* L)
{
    return ValueOf(lua_gettop(L));
}

static inline void Reserve(lua_State* L, int N = 4)
{
    lua_checkstack(L, N);
}

static int GetTableThunk(lua_State* L)
{
    lua_gettable(L, 1);
    return 1;
}

static int SetTableThunk(lua_State* L)
{
    lua_settable(L, 1);
    return 0;
}

static int ToStringThunk(lua_State* L)
{
    luaL_tolstring(L, 1, nullptr);
    return 1;
}

// the string of a value (tostring of lua), false if __tostring failed
static bool ToStdString(lua_State* L, int Idx, std::string& Out)
{
    if (Idx == 0)
    {
        Out = "nil";
        return true;
    }
    Reserve(L);
    int Type = lua_type(L, Idx);
    size_t Len = 0;
    if (Type == LUA_TSTRING)
    {
        const char* Str = lua_tolstring(L, Idx, &Len);
        Out.assign(Str, Len);
        return true;
    }
    if (Type == LUA_TNUMBER)
    {
        lua_pushvalue(L, Idx);
        const char* Str = lua_tolstring(L, -1, &Len);
        Out.assign(Str, Len);
        lua_pop(L, 1);
        return true;
    }
    lua_pushcfunction(L, ToStringThunk);
    lua_pushvalue(L, Idx);
    if (lua_pcall(L, 1, 1, 0) != LUA_OK)
    {
        lua_pop(L, 1);
        Out.clear();
        return false;
    }
    const char* Str = lua_tolstring(L, -1, &Len);
    Out.assign(Str ? Str : "", Str ? Len : 0);
    lua_pop(L, 1);
    return true;
}

// ---------------------------------------------------------------- wtf-8 <-> utf-16

static void AppendWtf8(std::string& Out, uint32_t Cp)
{
    if (Cp < 0x80)
    {
        Out.push_back(static_cast<char>(Cp));
    }
    else if (Cp < 0x800)
    {
        Out.push_back(static_cast<char>(0xC0 | (Cp >> 6)));
        Out.push_back(static_cast<char>(0x80 | (Cp & 0x3F)));
    }
    else if (Cp < 0x10000)
    {
        Out.push_back(static_cast<char>(0xE0 | (Cp >> 12)));
        Out.push_back(static_cast<char>(0x80 | ((Cp >> 6) & 0x3F)));
        Out.push_back(static_cast<char>(0x80 | (Cp & 0x3F)));
    }
    else
    {
        Out.push_back(static_cast<char>(0xF0 | (Cp >> 18)));
        Out.push_back(static_cast<char>(0x80 | ((Cp >> 12) & 0x3F)));
        Out.push_back(static_cast<char>(0x80 | ((Cp >> 6) & 0x3F)));
        Out.push_back(static_cast<char>(0x80 | (Cp & 0x3F)));
    }
}

static void Utf16ToWtf8(const uint16_t* Str, size_t Length, std::string& Out)
{
    Out.reserve(Length * 3);
    for (size_t i = 0; i < Length; ++i)
    {
        uint32_t C = Str[i];
        if (C >= 0xD800 && C <= 0xDBFF && i + 1 < Length && Str[i + 1] >= 0xDC00 && Str[i + 1] <= 0xDFFF)
        {
            C = 0x10000 + ((C - 0xD800) << 10) + (Str[i + 1] - 0xDC00);
            ++i;
        }
        // a lone surrogate is kept (wtf-8)
        AppendWtf8(Out, C);
    }
}

// decodes wtf-8 (an invalid byte is U+FFFD), writes at most Cap units to Buf (if not null), returns the units of the string
static size_t Wtf8ToUtf16(const char* InStr, size_t Len, uint16_t* Buf, size_t Cap)
{
    const unsigned char* S = reinterpret_cast<const unsigned char*>(InStr);
    size_t Units = 0;
    auto Emit = [&](uint32_t U)
    {
        if (Buf && Units < Cap)
        {
            Buf[Units] = static_cast<uint16_t>(U);
        }
        ++Units;
    };
    size_t i = 0;
    while (i < Len)
    {
        uint32_t C = S[i];
        uint32_t Cp;
        size_t Need;
        uint32_t Min;
        if (C < 0x80)
        {
            Emit(C);
            ++i;
            continue;
        }
        else if ((C & 0xE0) == 0xC0)
        {
            Cp = C & 0x1F;
            Need = 1;
            Min = 0x80;
        }
        else if ((C & 0xF0) == 0xE0)
        {
            Cp = C & 0x0F;
            Need = 2;
            Min = 0x800;
        }
        else if ((C & 0xF8) == 0xF0)
        {
            Cp = C & 0x07;
            Need = 3;
            Min = 0x10000;
        }
        else
        {
            Emit(0xFFFD);
            ++i;
            continue;
        }
        if (i + Need >= Len + 0 && i + Need > Len - 1 + 1)
        {
            Emit(0xFFFD);
            ++i;
            continue;
        }
        bool Valid = true;
        for (size_t k = 1; k <= Need; ++k)
        {
            if ((S[i + k] & 0xC0) != 0x80)
            {
                Valid = false;
                break;
            }
            Cp = (Cp << 6) | (S[i + k] & 0x3F);
        }
        if (!Valid || Cp < Min || Cp > 0x10FFFF)
        {
            Emit(0xFFFD);
            ++i;
            continue;
        }
        if (Cp >= 0x10000)
        {
            Cp -= 0x10000;
            Emit(0xD800 + (Cp >> 10));
            Emit(0xDC00 + (Cp & 0x3FF));
        }
        else
        {
            Emit(Cp);
        }
        i += Need + 1;
    }
    return Units;
}

// ---------------------------------------------------------------- value process

static pesapi_value pesapi_create_null(pesapi_env env)
{
    auto L = StateOf(env);
    Reserve(L);
    lua_pushnil(L);
    return Top(L);
}

static pesapi_value pesapi_create_undefined(pesapi_env env)
{
    auto L = StateOf(env);
    Reserve(L);
    lua_pushnil(L);
    return Top(L);
}

static pesapi_value pesapi_create_boolean(pesapi_env env, int value)
{
    auto L = StateOf(env);
    Reserve(L);
    lua_pushboolean(L, value);
    return Top(L);
}

static pesapi_value pesapi_create_int32(pesapi_env env, int32_t value)
{
    auto L = StateOf(env);
    Reserve(L);
    lua_pushinteger(L, value);
    return Top(L);
}

static pesapi_value pesapi_create_uint32(pesapi_env env, uint32_t value)
{
    auto L = StateOf(env);
    Reserve(L);
    lua_pushinteger(L, static_cast<lua_Integer>(value));
    return Top(L);
}

static pesapi_value pesapi_create_int64(pesapi_env env, int64_t value)
{
    auto L = StateOf(env);
    Reserve(L);
    lua_pushinteger(L, static_cast<lua_Integer>(value));
    return Top(L);
}

static pesapi_value pesapi_create_uint64(pesapi_env env, uint64_t value)
{
    auto L = StateOf(env);
    Reserve(L);
    lua_pushinteger(L, static_cast<lua_Integer>(value));
    return Top(L);
}

static pesapi_value pesapi_create_double(pesapi_env env, double value)
{
    auto L = StateOf(env);
    Reserve(L);
    lua_pushnumber(L, value);
    return Top(L);
}

static pesapi_value pesapi_create_string_utf8(pesapi_env env, const char* str, size_t length)
{
    auto L = StateOf(env);
    Reserve(L);
    lua_pushlstring(L, str ? str : "", str ? length : 0);
    return Top(L);
}

static pesapi_value pesapi_create_string_utf16(pesapi_env env, const uint16_t* str, size_t length)
{
    auto L = StateOf(env);
    std::string Utf8;
    if (str)
    {
        Utf16ToWtf8(str, length, Utf8);
    }
    Reserve(L);
    lua_pushlstring(L, Utf8.data(), Utf8.size());
    return Top(L);
}

static pesapi_value pesapi_create_binary(pesapi_env env, void* bin, size_t length)
{
    auto L = StateOf(env);
    Reserve(L);
    GetMapper(L)->PushBinary(L, bin, length, false);
    return Top(L);
}

static pesapi_value pesapi_create_binary_by_value(pesapi_env env, void* bin, size_t length)
{
    auto L = StateOf(env);
    Reserve(L);
    GetMapper(L)->PushBinary(L, bin, length, true);
    return Top(L);
}

static pesapi_value pesapi_create_array(pesapi_env env)
{
    auto L = StateOf(env);
    Reserve(L);
    lua_newtable(L);
    return Top(L);
}

static pesapi_value pesapi_create_object(pesapi_env env)
{
    auto L = StateOf(env);
    Reserve(L);
    lua_newtable(L);
    return Top(L);
}

static pesapi_value pesapi_create_function(
    pesapi_env env, pesapi_callback native_impl, void* data, pesapi_function_finalize finalize)
{
    auto L = StateOf(env);
    Reserve(L, 8);
    GetMapper(L)->PushFunction(L, native_impl, data, finalize);
    return Top(L);
}

static pesapi_value pesapi_create_class(pesapi_env env, const void* type_id)
{
    auto L = StateOf(env);
    Reserve(L);
    if (!GetMapper(L)->PushClassByID(L, type_id))
    {
        return nullptr;
    }
    return Top(L);
}

static int pesapi_get_value_bool(pesapi_env env, pesapi_value pvalue)
{
    auto L = StateOf(env);
    int Type = TypeOf(L, pvalue);
    if (Type == LUA_TNUMBER)
    {
        return lua_tonumber(L, IndexOf(pvalue)) != 0;
    }
    if (Type == LUA_TNONE)
    {
        return 0;
    }
    return lua_toboolean(L, IndexOf(pvalue));
}

// ToInt32 / ToUint32 of js for a double
static uint32_t DoubleToUint32Bits(double D)
{
    if (!std::isfinite(D))
    {
        return 0;
    }
    D = std::trunc(D);
    double M = std::fmod(D, 4294967296.0);
    if (M < 0)
    {
        M += 4294967296.0;
    }
    return static_cast<uint32_t>(M);
}

static uint32_t ToUint32Bits(lua_State* L, pesapi_value pvalue)
{
    int Type = TypeOf(L, pvalue);
    if (Type == LUA_TNUMBER)
    {
        int Idx = IndexOf(pvalue);
        if (lua_isinteger(L, Idx))
        {
            return static_cast<uint32_t>(static_cast<uint64_t>(lua_tointeger(L, Idx)));
        }
        return DoubleToUint32Bits(lua_tonumber(L, Idx));
    }
    if (Type == LUA_TBOOLEAN)
    {
        return lua_toboolean(L, IndexOf(pvalue)) ? 1 : 0;
    }
    return 0;
}

static int32_t pesapi_get_value_int32(pesapi_env env, pesapi_value pvalue)
{
    return static_cast<int32_t>(ToUint32Bits(StateOf(env), pvalue));
}

static uint32_t pesapi_get_value_uint32(pesapi_env env, pesapi_value pvalue)
{
    return ToUint32Bits(StateOf(env), pvalue);
}

static int64_t pesapi_get_value_int64(pesapi_env env, pesapi_value pvalue)
{
    auto L = StateOf(env);
    if (TypeOf(L, pvalue) != LUA_TNUMBER)
    {
        return 0;
    }
    int Idx = IndexOf(pvalue);
    if (lua_isinteger(L, Idx))
    {
        return static_cast<int64_t>(lua_tointeger(L, Idx));
    }
    double D = lua_tonumber(L, Idx);
    if (!std::isfinite(D))
    {
        return 0;
    }
    D = std::trunc(D);
    if (D >= 9223372036854775807.0)
    {
        return INT64_MAX;
    }
    if (D <= -9223372036854775808.0)
    {
        return INT64_MIN;
    }
    return static_cast<int64_t>(D);
}

static uint64_t pesapi_get_value_uint64(pesapi_env env, pesapi_value pvalue)
{
    auto L = StateOf(env);
    if (TypeOf(L, pvalue) != LUA_TNUMBER)
    {
        return 0;
    }
    int Idx = IndexOf(pvalue);
    if (lua_isinteger(L, Idx))
    {
        return static_cast<uint64_t>(lua_tointeger(L, Idx));
    }
    double D = lua_tonumber(L, Idx);
    if (!std::isfinite(D) || D <= 0)
    {
        return 0;
    }
    D = std::trunc(D);
    if (D >= 18446744073709551615.0)
    {
        return UINT64_MAX;
    }
    return static_cast<uint64_t>(D);
}

static double pesapi_get_value_double(pesapi_env env, pesapi_value pvalue)
{
    auto L = StateOf(env);
    if (TypeOf(L, pvalue) != LUA_TNUMBER)
    {
        return 0;
    }
    return static_cast<double>(lua_tonumber(L, IndexOf(pvalue)));
}

static const char* pesapi_get_value_string_utf8(pesapi_env env, pesapi_value pvalue, char* buf, size_t* bufsize)
{
    auto L = StateOf(env);
    std::string Tmp;
    const char* Str = nullptr;
    size_t Len = 0;
    if (TypeOf(L, pvalue) == LUA_TSTRING)
    {
        Str = lua_tolstring(L, IndexOf(pvalue), &Len);
    }
    else
    {
        if (!ToStdString(L, IndexOf(pvalue), Tmp))
        {
            *bufsize = 0;
            return buf;
        }
        Str = Tmp.data();
        Len = Tmp.size();
    }
    if (buf == nullptr)
    {
        *bufsize = Len;
    }
    else
    {
        size_t N = Len < *bufsize ? Len : *bufsize;
        memcpy(buf, Str, N);
        if (N < *bufsize)
        {
            buf[N] = '\0';
        }
        *bufsize = N;
    }
    return buf;
}

static const uint16_t* pesapi_get_value_string_utf16(pesapi_env env, pesapi_value pvalue, uint16_t* buf, size_t* bufsize)
{
    auto L = StateOf(env);
    std::string Tmp;
    const char* Str = nullptr;
    size_t Len = 0;
    if (TypeOf(L, pvalue) == LUA_TSTRING)
    {
        Str = lua_tolstring(L, IndexOf(pvalue), &Len);
    }
    else
    {
        if (!ToStdString(L, IndexOf(pvalue), Tmp))
        {
            *bufsize = 0;
            return buf;
        }
        Str = Tmp.data();
        Len = Tmp.size();
    }
    if (buf == nullptr)
    {
        *bufsize = Wtf8ToUtf16(Str, Len, nullptr, 0);
    }
    else
    {
        size_t Cap = *bufsize;
        size_t Units = Wtf8ToUtf16(Str, Len, buf, Cap);
        size_t N = Units < Cap ? Units : Cap;
        if (N < Cap)
        {
            buf[N] = 0;
        }
        *bufsize = N;
    }
    return buf;
}

static void* pesapi_get_value_binary(pesapi_env env, pesapi_value pvalue, size_t* bufsize)
{
    auto L = StateOf(env);
    int Idx = IndexOf(pvalue);
    if (FByteBuffer* Buffer = GetMapper(L)->GetByteBuffer(L, Idx))
    {
        *bufsize = Buffer->Size;
        return Buffer->Ptr;
    }
    if (TypeOf(L, pvalue) == LUA_TSTRING)
    {
        // read only
        return const_cast<char*>(lua_tolstring(L, Idx, bufsize));
    }
    *bufsize = 0;
    return nullptr;
}

static uint32_t pesapi_get_array_length(pesapi_env env, pesapi_value pvalue)
{
    auto L = StateOf(env);
    if (TypeOf(L, pvalue) != LUA_TTABLE)
    {
        return 0;
    }
    return static_cast<uint32_t>(lua_rawlen(L, IndexOf(pvalue)));
}

static int pesapi_is_null(pesapi_env env, pesapi_value pvalue)
{
    int Type = TypeOf(StateOf(env), pvalue);
    return Type == LUA_TNONE || Type == LUA_TNIL;
}

static int pesapi_is_undefined(pesapi_env env, pesapi_value pvalue)
{
    int Type = TypeOf(StateOf(env), pvalue);
    return Type == LUA_TNONE || Type == LUA_TNIL;
}

static int pesapi_is_boolean(pesapi_env env, pesapi_value pvalue)
{
    return TypeOf(StateOf(env), pvalue) == LUA_TBOOLEAN;
}

static int pesapi_is_int32(pesapi_env env, pesapi_value pvalue)
{
    auto L = StateOf(env);
    if (TypeOf(L, pvalue) != LUA_TNUMBER)
    {
        return false;
    }
    int Idx = IndexOf(pvalue);
    if (lua_isinteger(L, Idx))
    {
        lua_Integer I = lua_tointeger(L, Idx);
        return I >= INT32_MIN && I <= INT32_MAX;
    }
    double D = lua_tonumber(L, Idx);
    return D >= -2147483648.0 && D <= 2147483647.0 && D == (double) (int32_t) D;
}

static int pesapi_is_uint32(pesapi_env env, pesapi_value pvalue)
{
    auto L = StateOf(env);
    if (TypeOf(L, pvalue) != LUA_TNUMBER)
    {
        return false;
    }
    int Idx = IndexOf(pvalue);
    if (lua_isinteger(L, Idx))
    {
        lua_Integer I = lua_tointeger(L, Idx);
        return I >= 0 && I <= UINT32_MAX;
    }
    double D = lua_tonumber(L, Idx);
    return D >= 0 && D <= 4294967295.0 && D == (double) (uint32_t) D;
}

static int IsIntegral(lua_State* L, pesapi_value pvalue)
{
    if (TypeOf(L, pvalue) != LUA_TNUMBER)
    {
        return false;
    }
    int Idx = IndexOf(pvalue);
    if (lua_isinteger(L, Idx))
    {
        return true;
    }
    double D = lua_tonumber(L, Idx);
    return std::isfinite(D) && D == std::trunc(D);
}

static int pesapi_is_int64(pesapi_env env, pesapi_value pvalue)
{
    return IsIntegral(StateOf(env), pvalue);
}

static int pesapi_is_uint64(pesapi_env env, pesapi_value pvalue)
{
    return IsIntegral(StateOf(env), pvalue);
}

static int pesapi_is_double(pesapi_env env, pesapi_value pvalue)
{
    return TypeOf(StateOf(env), pvalue) == LUA_TNUMBER;
}

static int pesapi_is_string(pesapi_env env, pesapi_value pvalue)
{
    return TypeOf(StateOf(env), pvalue) == LUA_TSTRING;
}

static int pesapi_is_object(pesapi_env env, pesapi_value pvalue)
{
    int Type = TypeOf(StateOf(env), pvalue);
    return Type == LUA_TTABLE || Type == LUA_TUSERDATA || Type == LUA_TFUNCTION;
}

static int pesapi_is_function(pesapi_env env, pesapi_value pvalue)
{
    return TypeOf(StateOf(env), pvalue) == LUA_TFUNCTION;
}

static int pesapi_is_binary(pesapi_env env, pesapi_value pvalue)
{
    auto L = StateOf(env);
    return GetMapper(L)->GetByteBuffer(L, IndexOf(pvalue)) != nullptr;
}

static int pesapi_is_array(pesapi_env env, pesapi_value pvalue)
{
    auto L = StateOf(env);
    if (TypeOf(L, pvalue) != LUA_TTABLE)
    {
        return false;
    }
    int Idx = IndexOf(pvalue);
    if (lua_rawlen(L, Idx) > 0)
    {
        return true;
    }
    Reserve(L);
    lua_pushnil(L);
    if (lua_next(L, Idx))
    {
        lua_pop(L, 2);
        return false;
    }
    return true;
}

static pesapi_value pesapi_native_object_to_value(pesapi_env env, const void* type_id, void* object_ptr, int call_finalize)
{
    auto L = StateOf(env);
    GetMapper(L)->PushCppObject(L, type_id, object_ptr, !call_finalize);
    return Top(L);
}

static void* pesapi_get_native_object_ptr(pesapi_env env, pesapi_value pvalue)
{
    auto Obj = FCppObjectMapper::GetCppObject(StateOf(env), IndexOf(pvalue));
    return Obj ? Obj->Ptr : nullptr;
}

static const void* pesapi_get_native_object_typeid(pesapi_env env, pesapi_value pvalue)
{
    auto Obj = FCppObjectMapper::GetCppObject(StateOf(env), IndexOf(pvalue));
    return Obj ? Obj->TypeId : nullptr;
}

static int pesapi_is_instance_of(pesapi_env env, const void* type_id, pesapi_value pvalue)
{
    auto L = StateOf(env);
    return GetMapper(L)->IsInstanceOf(L, type_id, IndexOf(pvalue));
}

static pesapi_value pesapi_boxing(pesapi_env env, pesapi_value pvalue)
{
    auto L = StateOf(env);
    Reserve(L);
    lua_createtable(L, 1, 0);
    PushVal(L, pvalue);
    lua_rawseti(L, -2, 1);
    return Top(L);
}

static pesapi_value pesapi_unboxing(pesapi_env env, pesapi_value p_boxed_value)
{
    auto L = StateOf(env);
    Reserve(L);
    if (TypeOf(L, p_boxed_value) != LUA_TTABLE)
    {
        lua_pushnil(L);
    }
    else
    {
        lua_rawgeti(L, IndexOf(p_boxed_value), 1);
    }
    return Top(L);
}

static void pesapi_update_boxed_value(pesapi_env env, pesapi_value p_boxed_value, pesapi_value pvalue)
{
    auto L = StateOf(env);
    if (TypeOf(L, p_boxed_value) != LUA_TTABLE)
    {
        return;
    }
    Reserve(L);
    PushVal(L, pvalue);
    lua_rawseti(L, IndexOf(p_boxed_value), 1);
}

static int pesapi_is_boxed_value(pesapi_env env, pesapi_value value)
{
    return TypeOf(StateOf(env), value) == LUA_TTABLE;
}

static int pesapi_get_args_len(pesapi_callback_info pinfo)
{
    return InfoOf(pinfo)->Argc;
}

static pesapi_value pesapi_get_arg(pesapi_callback_info pinfo, int index)
{
    auto Info = InfoOf(pinfo);
    if (index >= 0 && index < Info->Argc)
    {
        return ValueOf(Info->ArgBase + index);
    }
    return nullptr;
}

static pesapi_env pesapi_get_env(pesapi_callback_info pinfo)
{
    return reinterpret_cast<pesapi_env>(InfoOf(pinfo)->L);
}

static void* pesapi_get_native_holder_ptr(pesapi_callback_info pinfo)
{
    auto Info = InfoOf(pinfo);
    auto Obj = FCppObjectMapper::GetCppObject(Info->L, Info->ThisIdx);
    return Obj ? Obj->Ptr : nullptr;
}

static const void* pesapi_get_native_holder_typeid(pesapi_callback_info pinfo)
{
    auto Info = InfoOf(pinfo);
    auto Obj = FCppObjectMapper::GetCppObject(Info->L, Info->ThisIdx);
    return Obj ? Obj->TypeId : nullptr;
}

static void* pesapi_get_userdata(pesapi_callback_info pinfo)
{
    return InfoOf(pinfo)->Data;
}

static void pesapi_add_return(pesapi_callback_info pinfo, pesapi_value value)
{
    auto Info = InfoOf(pinfo);
    Reserve(Info->L);
    PushVal(Info->L, value);
    lua_replace(Info->L, Info->RetSlot);
}

static void pesapi_throw_by_string(pesapi_callback_info pinfo, const char* msg)
{
    auto Info = InfoOf(pinfo);
    Info->HasEx = true;
    Info->ExMsg = msg ? msg : "";
}

static pesapi_env_ref pesapi_create_env_ref(pesapi_env env)
{
    auto L = StateOf(env);
    auto Mapper = GetMapper(L);
    lua_State* MainL = Mapper && Mapper->MainL ? Mapper->MainL : L;
    return reinterpret_cast<pesapi_env_ref>(new pesapi_env_ref__(MainL, Mapper));
}

static int pesapi_env_ref_is_valid(pesapi_env_ref penv_ref)
{
    auto EnvRef = EnvRefOf(penv_ref);
    return EnvRef && !EnvRef->Tracker.expired();
}

static pesapi_env pesapi_get_env_from_ref(pesapi_env_ref penv_ref)
{
    auto EnvRef = EnvRefOf(penv_ref);
    if (!EnvRef || EnvRef->Tracker.expired())
    {
        return nullptr;
    }
    return reinterpret_cast<pesapi_env>(EnvRef->L);
}

static pesapi_env_ref pesapi_duplicate_env_ref(pesapi_env_ref penv_ref)
{
    ++EnvRefOf(penv_ref)->RefCount;
    return penv_ref;
}

static void pesapi_release_env_ref(pesapi_env_ref penv_ref)
{
    auto EnvRef = EnvRefOf(penv_ref);
    if (--EnvRef->RefCount == 0)
    {
        delete EnvRef;
    }
}

static pesapi_scope pesapi_open_scope(pesapi_env_ref penv_ref)
{
    auto EnvRef = EnvRefOf(penv_ref);
    if (!EnvRef || EnvRef->Tracker.expired())
    {
        return nullptr;
    }
    void* Mem = malloc(sizeof(pesapi_scope__));
    return reinterpret_cast<pesapi_scope>(new (Mem) pesapi_scope__(EnvRef->L, GetMapper(EnvRef->L)));
}

static pesapi_scope pesapi_open_scope_placement(pesapi_env_ref penv_ref, struct pesapi_scope_memory* memory)
{
    auto EnvRef = EnvRefOf(penv_ref);
    if (!EnvRef || EnvRef->Tracker.expired())
    {
        return nullptr;
    }
    memset(memory, 0, sizeof(struct pesapi_scope_memory));
    return reinterpret_cast<pesapi_scope>(new (memory) pesapi_scope__(EnvRef->L, GetMapper(EnvRef->L)));
}

static int pesapi_has_caught(pesapi_scope pscope)
{
    auto Scope = ScopeOf(pscope);
    if (!Scope)
    {
        return false;
    }
    return Scope->Caught != nullptr;
}

static const char* pesapi_get_exception_as_string(pesapi_scope pscope, int with_stack)
{
    auto Scope = ScopeOf(pscope);
    if (!Scope)
    {
        return nullptr;
    }
    if (!Scope->Caught)
    {
        return nullptr;
    }
    lua_State* L = Scope->L;
    Reserve(L);
    lua_rawgeti(L, LUA_REGISTRYINDEX, Scope->Caught->ExRef);
    if (!ToStdString(L, lua_gettop(L), Scope->Caught->Message))
    {
        Scope->Caught->Message = "(error object is not a string)";
    }
    lua_pop(L, 1);
    if (with_stack && !Scope->Caught->Traceback.empty())
    {
        Scope->Caught->Message += "\n";
        Scope->Caught->Message += Scope->Caught->Traceback;
    }
    return Scope->Caught->Message.c_str();
}

static void pesapi_close_scope(pesapi_scope pscope)
{
    auto Scope = ScopeOf(pscope);
    if (!Scope)
    {
        return;
    }
    Scope->~pesapi_scope__();
    free(Scope);
}

static void pesapi_close_scope_placement(pesapi_scope pscope)
{
    auto Scope = ScopeOf(pscope);
    if (!Scope)
    {
        return;
    }
    Scope->~pesapi_scope__();
}

static pesapi_value_ref pesapi_create_value_ref(pesapi_env env, pesapi_value pvalue, uint32_t internal_field_count)
{
    auto L = StateOf(env);
    auto Mapper = GetMapper(L);
    Reserve(L);
    PushVal(L, pvalue);
    int Ref = luaL_ref(L, LUA_REGISTRYINDEX);
    size_t TotalSize = ValueRefSize(internal_field_count);
    void* Mem = malloc(TotalSize);
    memset(Mem, 0, TotalSize);
    lua_State* MainL = Mapper && Mapper->MainL ? Mapper->MainL : L;
    auto Ret = new (Mem) pesapi_value_ref__(MainL, Mapper, Ref, internal_field_count);
    return reinterpret_cast<pesapi_value_ref>(Ret);
}

static pesapi_value_ref pesapi_duplicate_value_ref(pesapi_value_ref pvalue_ref)
{
    ++ValueRefOf(pvalue_ref)->RefCount;
    return pvalue_ref;
}

static void pesapi_release_value_ref(pesapi_value_ref pvalue_ref)
{
    auto ValueRef = ValueRefOf(pvalue_ref);
    if (--ValueRef->RefCount == 0)
    {
        if (!ValueRef->Tracker.expired())
        {
            lua_State* L = ValueRef->L;
            if (ValueRef->Weak)
            {
                FCppObjectMapper* Mapper = GetMapper(L);
                if (Mapper)
                {
                    Reserve(L);
                    lua_rawgeti(L, LUA_REGISTRYINDEX, Mapper->WeakRefTableRef);
                    lua_pushnil(L);
                    lua_rawseti(L, -2, ValueRef->WeakId);
                    lua_pop(L, 1);
                }
            }
            else
            {
                luaL_unref(L, LUA_REGISTRYINDEX, ValueRef->Ref);
            }
        }
        // the env is gone: only the memory is released
        ValueRef->~pesapi_value_ref__();
        free(ValueRef);
    }
}

static pesapi_value pesapi_get_value_from_ref(pesapi_env env, pesapi_value_ref pvalue_ref)
{
    auto ValueRef = ValueRefOf(pvalue_ref);
    auto L = StateOf(env);
    Reserve(L);
    if (ValueRef->Weak)
    {
        FCppObjectMapper* Mapper = GetMapper(L);
        if (!Mapper)
        {
            return nullptr;
        }
        lua_rawgeti(L, LUA_REGISTRYINDEX, Mapper->WeakRefTableRef);
        lua_rawgeti(L, -1, ValueRef->WeakId);
        lua_remove(L, -2);
        if (lua_isnil(L, -1))
        {
            lua_pop(L, 1);
            return nullptr;
        }
        return Top(L);
    }
    lua_rawgeti(L, LUA_REGISTRYINDEX, ValueRef->Ref);
    return Top(L);
}

static void pesapi_set_ref_weak(pesapi_env env, pesapi_value_ref pvalue_ref)
{
    auto ValueRef = ValueRefOf(pvalue_ref);
    auto L = StateOf(env);
    FCppObjectMapper* Mapper = GetMapper(L);
    if (ValueRef->Weak || !Mapper)
    {
        return;
    }
    Reserve(L);
    lua_rawgeti(L, LUA_REGISTRYINDEX, ValueRef->Ref);
    int Type = lua_type(L, -1);
    if (Type != LUA_TTABLE && Type != LUA_TUSERDATA && Type != LUA_TFUNCTION && Type != LUA_TTHREAD)
    {
        // a value which can not be collected is kept strongly
        lua_pop(L, 1);
        return;
    }
    int64_t Id = ++Mapper->NextWeakId;
    lua_rawgeti(L, LUA_REGISTRYINDEX, Mapper->WeakRefTableRef);
    lua_pushvalue(L, -2);
    lua_rawseti(L, -2, Id);
    lua_pop(L, 2);
    luaL_unref(L, LUA_REGISTRYINDEX, ValueRef->Ref);
    ValueRef->Ref = LUA_NOREF;
    ValueRef->Weak = true;
    ValueRef->WeakId = Id;
}

static int pesapi_set_owner(pesapi_env env, pesapi_value pvalue, pesapi_value powner)
{
    auto L = StateOf(env);
    int Type = TypeOf(L, powner);
    Reserve(L);
    if (Type == LUA_TUSERDATA)
    {
        PushVal(L, pvalue);
        return lua_setiuservalue(L, IndexOf(powner), 1);
    }
    if (Type == LUA_TTABLE)
    {
        lua_pushstring(L, "_p_i_only_one_child");
        PushVal(L, pvalue);
        lua_rawset(L, IndexOf(powner));
        return true;
    }
    return false;
}

static pesapi_env_ref pesapi_get_ref_associated_env(pesapi_value_ref value_ref)
{
    return reinterpret_cast<pesapi_env_ref>(static_cast<pesapi_env_ref__*>(ValueRefOf(value_ref)));
}

static void** pesapi_get_ref_internal_fields(pesapi_value_ref pvalue_ref, uint32_t* pinternal_field_count)
{
    auto ValueRef = ValueRefOf(pvalue_ref);
    *pinternal_field_count = ValueRef->InternalFieldCount;
    return &ValueRef->InternalFields[0];
}

// whether an access to the value may run a metamethod
static bool NeedProtected(lua_State* L, int Idx, int Type)
{
    if (Type == LUA_TUSERDATA)
    {
        return true;
    }
    if (!lua_getmetatable(L, Idx))
    {
        return false;
    }
    lua_pop(L, 1);
    return true;
}

// pushes obj[key] (the key on the top is consumed), nil on failure (the error is caught by the scope)
static void GetField(lua_State* L, int ObjIdx, int Type)
{
    if (!NeedProtected(L, ObjIdx, Type))
    {
        lua_rawget(L, ObjIdx);
        return;
    }
    FCppObjectMapper* Mapper = GetMapper(L);
    lua_pushcfunction(L, GetTableThunk);
    lua_pushvalue(L, ObjIdx);
    lua_rotate(L, -3, -1);    // thunk obj key
    if (!Mapper->ProtectedCall(L, 2, 1))
    {
        lua_pushnil(L);
    }
}

// obj[key] = value (the key and the value on the top are consumed)
static bool SetField(lua_State* L, int ObjIdx, int Type)
{
    if (!NeedProtected(L, ObjIdx, Type))
    {
        lua_rawset(L, ObjIdx);
        return true;
    }
    FCppObjectMapper* Mapper = GetMapper(L);
    lua_pushcfunction(L, SetTableThunk);
    lua_pushvalue(L, ObjIdx);
    lua_rotate(L, -4, 2);    // thunk obj key value
    return Mapper->ProtectedCall(L, 3, 0);
}

static pesapi_value pesapi_get_property(pesapi_env env, pesapi_value pobject, const char* key)
{
    auto L = StateOf(env);
    int Type = TypeOf(L, pobject);
    Reserve(L, 8);
    if (Type != LUA_TTABLE && Type != LUA_TUSERDATA)
    {
        lua_pushnil(L);
        return Top(L);
    }
    lua_pushstring(L, key);
    GetField(L, IndexOf(pobject), Type);
    return Top(L);
}

static int pesapi_set_property(pesapi_env env, pesapi_value pobject, const char* key, pesapi_value pvalue)
{
    auto L = StateOf(env);
    int Type = TypeOf(L, pobject);
    if (Type != LUA_TTABLE && Type != LUA_TUSERDATA)
    {
        return 0;
    }
    Reserve(L, 8);
    lua_pushstring(L, key);
    PushVal(L, pvalue);
    return SetField(L, IndexOf(pobject), Type);
}

static int pesapi_get_private(pesapi_env env, pesapi_value pobject, void** out_ptr)
{
    auto L = StateOf(env);
    Reserve(L);
    return GetMapper(L)->GetPrivate(L, IndexOf(pobject), out_ptr);
}

static int pesapi_set_private(pesapi_env env, pesapi_value pobject, void* ptr)
{
    auto L = StateOf(env);
    Reserve(L);
    return GetMapper(L)->SetPrivate(L, IndexOf(pobject), ptr);
}

// the index of js (0 based) is the index of lua (1 based) minus one
static pesapi_value pesapi_get_property_uint32(pesapi_env env, pesapi_value pobject, uint32_t key)
{
    auto L = StateOf(env);
    int Type = TypeOf(L, pobject);
    Reserve(L, 8);
    if (Type == LUA_TTABLE && !NeedProtected(L, IndexOf(pobject), Type))
    {
        lua_rawgeti(L, IndexOf(pobject), static_cast<lua_Integer>(key) + 1);
        return Top(L);
    }
    if (Type != LUA_TTABLE && Type != LUA_TUSERDATA)
    {
        lua_pushnil(L);
        return Top(L);
    }
    lua_pushinteger(L, static_cast<lua_Integer>(key) + 1);
    GetField(L, IndexOf(pobject), Type);
    return Top(L);
}

static int pesapi_set_property_uint32(pesapi_env env, pesapi_value pobject, uint32_t key, pesapi_value pvalue)
{
    auto L = StateOf(env);
    int Type = TypeOf(L, pobject);
    if (Type != LUA_TTABLE && Type != LUA_TUSERDATA)
    {
        return 0;
    }
    Reserve(L, 8);
    if (Type == LUA_TTABLE && !NeedProtected(L, IndexOf(pobject), Type))
    {
        PushVal(L, pvalue);
        lua_rawseti(L, IndexOf(pobject), static_cast<lua_Integer>(key) + 1);
        return 1;
    }
    lua_pushinteger(L, static_cast<lua_Integer>(key) + 1);
    PushVal(L, pvalue);
    return SetField(L, IndexOf(pobject), Type);
}

// this_object is ignored: a lua function has no this (a method takes the object as the first argument)
static pesapi_value pesapi_call_function(
    pesapi_env env, pesapi_value pfunc, pesapi_value this_object, int argc, const pesapi_value argv[])
{
    auto L = StateOf(env);
    FCppObjectMapper* Mapper = GetMapper(L);
    if (!Mapper)
    {
        return nullptr;
    }
    Reserve(L, argc + 8);
    PushVal(L, pfunc);
    for (int i = 0; i < argc; ++i)
    {
        PushVal(L, argv[i]);
    }
    if (!Mapper->ProtectedCall(L, argc, 1))
    {
        return nullptr;
    }
    return Top(L);
}

static pesapi_value pesapi_eval(pesapi_env env, const uint8_t* code, size_t code_size, const char* path)
{
    auto L = StateOf(env);
    FCppObjectMapper* Mapper = GetMapper(L);
    if (!Mapper)
    {
        return nullptr;
    }
    Reserve(L, 8);
    std::string ChunkName = "@";
    ChunkName += path ? path : "<eval>";
    if (luaL_loadbufferx(L, reinterpret_cast<const char*>(code), code_size, ChunkName.c_str(), "bt") != LUA_OK)
    {
        Mapper->LastTraceback.clear();
        Mapper->CatchError(L);
        return nullptr;
    }
    if (!Mapper->ProtectedCall(L, 0, 1))
    {
        return nullptr;
    }
    return Top(L);
}

static pesapi_value pesapi_global(pesapi_env env)
{
    auto L = StateOf(env);
    Reserve(L);
    lua_pushglobaltable(L);
    return Top(L);
}

static const void* pesapi_get_env_private(pesapi_env env)
{
    auto Mapper = GetMapper(StateOf(env));
    return Mapper ? Mapper->GetEnvPrivate() : nullptr;
}

static void pesapi_set_env_private(pesapi_env env, const void* ptr)
{
    auto Mapper = GetMapper(StateOf(env));
    if (Mapper)
    {
        Mapper->SetEnvPrivate(ptr);
    }
}

static void pesapi_set_registry(pesapi_env env, pesapi_registry registry)
{
    GetMapper(StateOf(env))->SetRegistry(reinterpret_cast<ScriptClassRegistry*>(registry));
}

static void pesapi_invalidate_class(pesapi_env env, const void* type_id)
{
    GetMapper(StateOf(env))->InvalidateClass(type_id);
}

static pesapi_value pesapi_get_this(pesapi_callback_info pinfo)
{
    auto Info = InfoOf(pinfo);
    if (Info->ThisIdx)
    {
        return ValueOf(Info->ThisIdx);
    }
    Reserve(Info->L);
    lua_pushnil(Info->L);
    return Top(Info->L);
}

static int pesapi_unbind_native_object(pesapi_env env, const void* type_id, void* ptr)
{
    lua_State* L = StateOf(env);
    auto Mapper = GetMapper(L);
    return Mapper ? Mapper->UnbindNativeObject(L, type_id, ptr) : false;
}

pesapi_ffi g_pesapi_ffi{
    &pesapi_create_null,
    &pesapi_create_undefined,
    &pesapi_create_boolean,
    &pesapi_create_int32,
    &pesapi_create_uint32,
    &pesapi_create_int64,
    &pesapi_create_uint64,
    &pesapi_create_double,
    &pesapi_create_string_utf8,
    &pesapi_create_string_utf16,
    &pesapi_create_binary,
    &pesapi_create_binary_by_value,
    &pesapi_create_array,
    &pesapi_create_object,
    &pesapi_create_function,
    &pesapi_create_class,
    &pesapi_get_value_bool,
    &pesapi_get_value_int32,
    &pesapi_get_value_uint32,
    &pesapi_get_value_int64,
    &pesapi_get_value_uint64,
    &pesapi_get_value_double,
    &pesapi_get_value_string_utf8,
    &pesapi_get_value_string_utf16,
    &pesapi_get_value_binary,
    &pesapi_get_array_length,
    &pesapi_is_null,
    &pesapi_is_undefined,
    &pesapi_is_boolean,
    &pesapi_is_int32,
    &pesapi_is_uint32,
    &pesapi_is_int64,
    &pesapi_is_uint64,
    &pesapi_is_double,
    &pesapi_is_string,
    &pesapi_is_object,
    &pesapi_is_function,
    &pesapi_is_binary,
    &pesapi_is_array,
    &pesapi_native_object_to_value,
    &pesapi_get_native_object_ptr,
    &pesapi_get_native_object_typeid,
    &pesapi_is_instance_of,
    &pesapi_boxing,
    &pesapi_unboxing,
    &pesapi_update_boxed_value,
    &pesapi_is_boxed_value,
    &pesapi_get_args_len,
    &pesapi_get_arg,
    &pesapi_get_env,
    &pesapi_get_native_holder_ptr,
    &pesapi_get_native_holder_typeid,
    &pesapi_get_userdata,
    &pesapi_add_return,
    &pesapi_throw_by_string,
    &pesapi_create_env_ref,
    &pesapi_env_ref_is_valid,
    &pesapi_get_env_from_ref,
    &pesapi_duplicate_env_ref,
    &pesapi_release_env_ref,
    &pesapi_open_scope,
    &pesapi_open_scope_placement,
    &pesapi_has_caught,
    &pesapi_get_exception_as_string,
    &pesapi_close_scope,
    &pesapi_close_scope_placement,
    &pesapi_create_value_ref,
    &pesapi_duplicate_value_ref,
    &pesapi_release_value_ref,
    &pesapi_get_value_from_ref,
    &pesapi_set_ref_weak,
    &pesapi_set_owner,
    &pesapi_get_ref_associated_env,
    &pesapi_get_ref_internal_fields,
    &pesapi_get_property,
    &pesapi_set_property,
    &pesapi_get_private,
    &pesapi_set_private,
    &pesapi_get_property_uint32,
    &pesapi_set_property_uint32,
    &pesapi_call_function,
    &pesapi_eval,
    &pesapi_global,
    &pesapi_get_env_private,
    &pesapi_set_env_private,
    &pesapi_set_registry,
    &pesapi_invalidate_class,
    &pesapi_get_this,
    &pesapi_unbind_native_object,
};

}    // namespace luaimpl
}    // namespace PUERTS_NAMESPACE

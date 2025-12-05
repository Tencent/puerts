#include "pesapi.h"
#include "CppObjectMapperLua.h"

namespace pesapi
{
namespace luaimpl
{
inline pesapi_value pesapiValueFromLuaValue(int v)
{
    return reinterpret_cast<pesapi_value>((intptr_t)v);
}

inline int luaValueFromPesapiValue(pesapi_value v)
{
    return (int)reinterpret_cast<intptr_t>(v);
}

inline pesapi_env pesapiEnvFromLuaState(lua_State *L)
{
    return reinterpret_cast<pesapi_env>(L);
}

inline lua_State* luaStateFromPesapiEnv(pesapi_env v)
{
    return reinterpret_cast<lua_State*>(v);
}

// value process
pesapi_value pesapi_create_null(pesapi_env env)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    lua_pushnil(L);
    return pesapiValueFromLuaValue(lua_gettop(L));
}

pesapi_value pesapi_create_undefined(pesapi_env env)
{
    return pesapi_create_null(env);
}

pesapi_value pesapi_create_boolean(pesapi_env env, int value)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    lua_pushboolean(L, value);
    return pesapiValueFromLuaValue(lua_gettop(L));
}

pesapi_value pesapi_create_int32(pesapi_env env, int32_t value)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    lua_pushinteger(L, value);
    return pesapiValueFromLuaValue(lua_gettop(L));
}

pesapi_value pesapi_create_uint32(pesapi_env env, uint32_t value)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    lua_pushinteger(L, value);
    return pesapiValueFromLuaValue(lua_gettop(L));
}

pesapi_value pesapi_create_int64(pesapi_env env, int64_t value)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    lua_pushinteger(L, value);
    return pesapiValueFromLuaValue(lua_gettop(L));
}

pesapi_value pesapi_create_uint64(pesapi_env env, uint64_t value)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    lua_pushinteger(L, value);
    return pesapiValueFromLuaValue(lua_gettop(L));
}

pesapi_value pesapi_create_double(pesapi_env env, double value)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    lua_pushnumber(L, value);
    return pesapiValueFromLuaValue(lua_gettop(L));
}

pesapi_value pesapi_create_string_utf8(pesapi_env env, const char *str, size_t length)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    lua_pushlstring(L, str, length);
    return pesapiValueFromLuaValue(lua_gettop(L));
}

pesapi_value pesapi_create_string_utf16(pesapi_env env, const uint16_t *str, size_t length)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    luaL_Buffer b;
    luaL_buffinit(L, &b);
    
    for (size_t i = 0; i < length; ++i) {
        uint16_t wc = str[i];
        if (wc <= 0x7F) {
            luaL_addchar(&b, static_cast<char>(wc));
        } else if (wc <= 0x7FF) {
            luaL_addchar(&b, static_cast<char>(0xC0 | ((wc >> 6) & 0x1F)));
            luaL_addchar(&b, static_cast<char>(0x80 | (wc & 0x3F)));
        } else {
            luaL_addchar(&b, static_cast<char>(0xE0 | ((wc >> 12) & 0x0F)));
            luaL_addchar(&b, static_cast<char>(0x80 | ((wc >> 6) & 0x3F)));
            luaL_addchar(&b, static_cast<char>(0x80 | (wc & 0x3F)));
        }
    }
    
    luaL_pushresult(&b);
    return pesapiValueFromLuaValue(lua_gettop(L));
}

// TODO: 搞个binary的类型，能支持在lua里写，支持指针传递
pesapi_value pesapi_create_binary(pesapi_env env, void *bin, size_t length)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    auto mapper = CppObjectMapper::Get(L);
    return pesapiValueFromLuaValue(mapper->CreateBufferByPointer(L, (unsigned char*)bin, length));
}

pesapi_value pesapi_create_binary_by_value(pesapi_env env, void *bin, size_t length)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    auto mapper = CppObjectMapper::Get(L);
    return pesapiValueFromLuaValue(mapper->CreateBufferCopy(L, (unsigned char*)bin, length));
}

pesapi_value pesapi_create_array(pesapi_env env)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    lua_newtable(L);
    return pesapiValueFromLuaValue(lua_gettop(L));
}

pesapi_value pesapi_create_object(pesapi_env env)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    lua_newtable(L);
    return pesapiValueFromLuaValue(lua_gettop(L));
}

pesapi_value pesapi_create_function(pesapi_env env, pesapi_callback native_impl, void* data, pesapi_function_finalize finalize)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    auto mapper = CppObjectMapper::Get(L);
    return pesapiValueFromLuaValue(mapper->CreateFunction(L, native_impl, data, finalize));
}

pesapi_value pesapi_create_class(pesapi_env env, const void* type_id)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    auto mapper = CppObjectMapper::Get(L);
    return pesapiValueFromLuaValue(mapper->LoadTypeById(L, type_id));
}

int pesapi_get_value_bool(pesapi_env env, pesapi_value pvalue)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int idx = luaValueFromPesapiValue(pvalue);
    return lua_toboolean(L, idx);
}

int32_t pesapi_get_value_int32(pesapi_env env, pesapi_value pvalue)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int idx = luaValueFromPesapiValue(pvalue);
    return (int32_t)lua_tointeger(L, idx);
}

uint32_t pesapi_get_value_uint32(pesapi_env env, pesapi_value pvalue)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int idx = luaValueFromPesapiValue(pvalue);
    return (uint32_t)lua_tointeger(L, idx);
}

int64_t pesapi_get_value_int64(pesapi_env env, pesapi_value pvalue)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int idx = luaValueFromPesapiValue(pvalue);
    return lua_tointeger(L, idx);
}

uint64_t pesapi_get_value_uint64(pesapi_env env, pesapi_value pvalue)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int idx = luaValueFromPesapiValue(pvalue);
    return lua_tointeger(L, idx);
}

double pesapi_get_value_double(pesapi_env env, pesapi_value pvalue)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int idx = luaValueFromPesapiValue(pvalue);
    return lua_tonumber(L, idx);
}

const char* pesapi_get_value_string_utf8(pesapi_env env, pesapi_value pvalue, char* buf, size_t* bufsize)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int idx = luaValueFromPesapiValue(pvalue);
    return lua_tolstring(L, idx, bufsize);
}

const uint16_t* pesapi_get_value_string_utf16(pesapi_env env, pesapi_value pvalue, uint16_t* buf, size_t* bufsize)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int idx = luaValueFromPesapiValue(pvalue);
    size_t len;
    const char* utf8str = lua_tolstring(L, idx, &len);
    
    // Calculate required UTF-16 buffer size
    size_t utf16_len = 0;
    const char* p = utf8str;
    const char* end = utf8str + len;
    while (p < end) {
        unsigned char c = *p;
        if (c < 0x80) {
            utf16_len++;
            p++;
        } else if ((c & 0xE0) == 0xC0) {
            utf16_len++;
            p += 2;
        } else if ((c & 0xF0) == 0xE0) {
            utf16_len++;
            p += 3;
        } else if ((c & 0xF8) == 0xF0) {
            utf16_len += 2; // Surrogate pair
            p += 4;
        } else {
            // Invalid UTF-8 sequence, skip byte
            p++;
        }
    }
    
    // If buf is NULL or too small, return required size
    if (buf == NULL || *bufsize < utf16_len) {
        if (bufsize) *bufsize = utf16_len;
        return NULL;
    }
    
    // Convert UTF-8 to UTF-16
    uint16_t* q = buf;
    p = utf8str;
    while (p < end) {
        unsigned char c = *p;
        if (c < 0x80) {
            *q++ = c;
            p++;
        } else if ((c & 0xE0) == 0xC0) {
            uint32_t code = ((c & 0x1F) << 6) | (p[1] & 0x3F);
            *q++ = static_cast<uint16_t>(code);
            p += 2;
        } else if ((c & 0xF0) == 0xE0) {
            uint32_t code = ((c & 0x0F) << 12) | ((p[1] & 0x3F) << 6) | (p[2] & 0x3F);
            *q++ = static_cast<uint16_t>(code);
            p += 3;
        } else if ((c & 0xF8) == 0xF0) {
            uint32_t code = ((c & 0x07) << 18) | ((p[1] & 0x3F) << 12) | ((p[2] & 0x3F) << 6) | (p[3] & 0x3F);
            code -= 0x10000;
            *q++ = static_cast<uint16_t>(0xD800 | (code >> 10));
            *q++ = static_cast<uint16_t>(0xDC00 | (code & 0x3FF));
            p += 4;
        } else {
            // Invalid UTF-8 sequence, skip byte
            p++;
        }
    }
    
    if (bufsize) *bufsize = utf16_len;
    return buf;
}

void* pesapi_get_value_binary(pesapi_env env, pesapi_value pvalue, size_t* bufsize)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int idx = luaValueFromPesapiValue(pvalue);
    
    auto mapper = CppObjectMapper::Get(L);
    return mapper->GetBufferData(L, idx, bufsize);
}

uint32_t pesapi_get_array_length(pesapi_env env, pesapi_value pvalue)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int idx = luaValueFromPesapiValue(pvalue);
    return (uint32_t)luaL_len(L, idx);
}

int pesapi_is_null(pesapi_env env, pesapi_value pvalue)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int idx = luaValueFromPesapiValue(pvalue);
    return lua_isnil(L, idx);
}

int pesapi_is_undefined(pesapi_env env, pesapi_value pvalue)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int idx = luaValueFromPesapiValue(pvalue);
    return lua_isnone(L, idx);
}

int pesapi_is_boolean(pesapi_env env, pesapi_value pvalue)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int idx = luaValueFromPesapiValue(pvalue);
    return lua_type(L, idx) == LUA_TBOOLEAN;
}

int pesapi_is_int32(pesapi_env env, pesapi_value pvalue)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int idx = luaValueFromPesapiValue(pvalue);
    return lua_type(L, idx) == LUA_TNUMBER;
}

int pesapi_is_uint32(pesapi_env env, pesapi_value pvalue)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int idx = luaValueFromPesapiValue(pvalue);
    return lua_type(L, idx) == LUA_TNUMBER;
}

int pesapi_is_int64(pesapi_env env, pesapi_value pvalue)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int idx = luaValueFromPesapiValue(pvalue);
    return lua_type(L, idx) == LUA_TNUMBER;
}

int pesapi_is_uint64(pesapi_env env, pesapi_value pvalue)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int idx = luaValueFromPesapiValue(pvalue);
    return lua_type(L, idx) == LUA_TNUMBER;
}

int pesapi_is_double(pesapi_env env, pesapi_value pvalue)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int idx = luaValueFromPesapiValue(pvalue);
    return lua_type(L, idx) == LUA_TNUMBER;
}

int pesapi_is_string(pesapi_env env, pesapi_value pvalue)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int idx = luaValueFromPesapiValue(pvalue);
    return lua_type(L, idx) == LUA_TSTRING;
}

int pesapi_is_object(pesapi_env env, pesapi_value pvalue)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int idx = luaValueFromPesapiValue(pvalue);
    int type = lua_type(L, idx);
    return type == LUA_TTABLE || type == LUA_TFUNCTION;
}

int pesapi_is_function(pesapi_env env, pesapi_value pvalue)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int idx = luaValueFromPesapiValue(pvalue);
    return lua_type(L, idx) == LUA_TFUNCTION;
}

int pesapi_is_binary(pesapi_env env, pesapi_value pvalue)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int idx = luaValueFromPesapiValue(pvalue);
    auto mapper = CppObjectMapper::Get(L);
    return mapper->IsBuffer(L, idx);
}

int pesapi_is_array(pesapi_env env, pesapi_value pvalue)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int idx = luaValueFromPesapiValue(pvalue);
    return lua_type(L, idx) == LUA_TTABLE;
}

pesapi_value pesapi_native_object_to_value(pesapi_env env, const void* type_id, void* object_ptr, int call_finalize)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    auto mapper = CppObjectMapper::Get(L);
    auto idx = mapper->FindOrAddCppObject(L, type_id, object_ptr, !call_finalize);
    return pesapiValueFromLuaValue(idx);
}

void* pesapi_get_native_object_ptr(pesapi_env env, pesapi_value pvalue)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int idx = luaValueFromPesapiValue(pvalue);
    auto mapper = CppObjectMapper::Get(L);
    CppObject* cppObject = mapper->GetCppObject(L, idx);
    return cppObject ? cppObject->Ptr : nullptr;
}

const void* pesapi_get_native_object_typeid(pesapi_env env, pesapi_value pvalue)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int idx = luaValueFromPesapiValue(pvalue);
    auto mapper = CppObjectMapper::Get(L);
    CppObject* cppObject = mapper->GetCppObject(L, idx);
    return cppObject ? cppObject->TypeId : nullptr;
}

int pesapi_is_instance_of(pesapi_env env, const void* type_id, pesapi_value pvalue)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int idx = luaValueFromPesapiValue(pvalue);
    auto mapper = CppObjectMapper::Get(L);
    
    return mapper->IsInstanceOfCppObject(L, type_id, idx);
}

pesapi_value pesapi_boxing(pesapi_env env, pesapi_value pvalue)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int idx = luaValueFromPesapiValue(pvalue);
    lua_createtable(L, 1, 0);
    lua_pushvalue(L, idx);
    lua_rawseti(L, -2, 1);
    return pesapiValueFromLuaValue(lua_gettop(L));
}

pesapi_value pesapi_unboxing(pesapi_env env, pesapi_value p_boxed_value)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int index = luaValueFromPesapiValue(p_boxed_value);
    index = lua_absindex(L, index);
    int top = lua_gettop(L);
    if (top < index)
    {
        return 0;
    }
    int t = lua_type(L, index);
    if (t == LUA_TTABLE)
    {
        lua_rawgeti(L, index, 1);
    }
    return pesapiValueFromLuaValue(lua_gettop(L));
}

void pesapi_update_boxed_value(pesapi_env env, pesapi_value p_boxed_value, pesapi_value pvalue)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int index = luaValueFromPesapiValue(p_boxed_value);
    int t = lua_type(L, index);
    if (t == LUA_TTABLE)
    {
        lua_pushvalue(L, luaValueFromPesapiValue(pvalue));
        lua_rawseti(L, index, 1);
    }
}

int pesapi_is_boxed_value(pesapi_env env, pesapi_value value)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    return lua_istable(L, luaValueFromPesapiValue(value));
}

int pesapi_get_args_len(pesapi_callback_info pinfo)
{
    auto info = reinterpret_cast<pesapi::luaimpl::pesapi_callback_info__*>(pinfo);
    return lua_gettop(info->L) - info->ArgStart;
}

pesapi_value pesapi_get_arg(pesapi_callback_info pinfo, int index)
{
    auto info = reinterpret_cast<pesapi::luaimpl::pesapi_callback_info__*>(pinfo);
    return pesapiValueFromLuaValue(info->ArgStart + index + 1);
}

pesapi_env pesapi_get_env(pesapi_callback_info pinfo)
{
    auto info = reinterpret_cast<pesapi::luaimpl::pesapi_callback_info__*>(pinfo);
    return pesapiEnvFromLuaState(info->L);
}

void* pesapi_get_native_holder_ptr(pesapi_callback_info pinfo)
{
    auto info = reinterpret_cast<pesapi::luaimpl::pesapi_callback_info__*>(pinfo);
    return pesapi_get_native_object_ptr(pesapiEnvFromLuaState(info->L), pesapiValueFromLuaValue(1));
}

const void* pesapi_get_native_holder_typeid(pesapi_callback_info pinfo)
{
    auto info = reinterpret_cast<pesapi::luaimpl::pesapi_callback_info__*>(pinfo);
    return pesapi_get_native_object_typeid(pesapiEnvFromLuaState(info->L), pesapiValueFromLuaValue(1));
}

void* pesapi_get_userdata(pesapi_callback_info pinfo)
{
    auto info = reinterpret_cast<pesapi::luaimpl::pesapi_callback_info__*>(pinfo);
    return info->Data;
}

void pesapi_add_return(pesapi_callback_info pinfo, pesapi_value value)
{
    auto info = reinterpret_cast<pesapi::luaimpl::pesapi_callback_info__*>(pinfo);
    lua_pushvalue(info->L, luaValueFromPesapiValue(value));
    info->RetNum++;
}

void pesapi_throw_by_string(pesapi_callback_info pinfo, const char* msg)
{
    auto info = reinterpret_cast<pesapi::luaimpl::pesapi_callback_info__*>(pinfo);
    luaL_error(info->L, "%s", msg);
}

struct pesapi_env_ref__
{
    explicit pesapi_env_ref__(lua_State* _L)
        : L(_L)
        , env_life_cycle_tracker(CppObjectMapper::GetEnvLifeCycleTracker(_L))
        , ref_count(1)
    {
    }
    lua_State* L;
    eastl::weak_ptr<int> env_life_cycle_tracker;
    int ref_count;
};

struct pesapi_scope__
{
    explicit pesapi_scope__(lua_State* _L)
        : L(_L)
        , scope_top(lua_gettop(L))
    {
    }
    lua_State* L;
    int scope_top;
};

pesapi_env_ref pesapi_create_env_ref(pesapi_env env)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    lua_rawgeti(L, LUA_REGISTRYINDEX, LUA_RIDX_MAINTHREAD);
    lua_State* mL = lua_tothread(L, -1);
    lua_pop(L, 1);
    auto ret = (pesapi_env_ref)malloc(sizeof(pesapi_env_ref__));
    memset(ret, 0, sizeof(pesapi_env_ref__));
    new (ret) pesapi::luaimpl::pesapi_env_ref__(mL);
    return ret;
}

int pesapi_env_ref_is_valid(pesapi_env_ref penv_ref)
{
    auto env_ref = reinterpret_cast<pesapi::luaimpl::pesapi_env_ref__*>(penv_ref);
    return !env_ref->env_life_cycle_tracker.expired();
}

pesapi_env pesapi_get_env_from_ref(pesapi_env_ref penv_ref)
{
    auto env_ref = reinterpret_cast<pesapi::luaimpl::pesapi_env_ref__*>(penv_ref);
    if (env_ref->env_life_cycle_tracker.expired())
    {
        return nullptr;
    }
    return pesapiEnvFromLuaState(env_ref->L);
}

pesapi_env_ref pesapi_duplicate_env_ref(pesapi_env_ref penv_ref)
{
    auto env_ref = reinterpret_cast<pesapi::luaimpl::pesapi_env_ref__*>(penv_ref);
    ++env_ref->ref_count;
    return penv_ref;
}

void pesapi_release_env_ref(pesapi_env_ref penv_ref)
{
    auto env_ref = reinterpret_cast<pesapi::luaimpl::pesapi_env_ref__*>(penv_ref);
    if (--env_ref->ref_count == 0)
    {
        if (!env_ref->env_life_cycle_tracker.expired())
        {
            env_ref->pesapi::luaimpl::pesapi_env_ref__::~pesapi_env_ref__();
        }
        free(env_ref);
    }
}

pesapi_scope pesapi_open_scope(pesapi_env_ref penv_ref)
{
    auto env_ref = reinterpret_cast<pesapi::luaimpl::pesapi_env_ref__*>(penv_ref);
    if (!env_ref || env_ref->env_life_cycle_tracker.expired())
    {
        return nullptr;
    }
    pesapi_scope ret = static_cast<pesapi_scope>(malloc(sizeof(pesapi::luaimpl::pesapi_scope__)));
    memset(ret, 0, sizeof(pesapi::luaimpl::pesapi_scope__));
    new (ret) pesapi::luaimpl::pesapi_scope__(env_ref->L);
    return ret;
}

pesapi_scope pesapi_open_scope_placement(pesapi_env_ref penv_ref, struct pesapi_scope_memory* memory)
{
    auto env_ref = reinterpret_cast<pesapi::luaimpl::pesapi_env_ref__*>(penv_ref);
    if (!env_ref || env_ref->env_life_cycle_tracker.expired())
    {
        return nullptr;
    }
    memset(memory, 0, sizeof(struct pesapi_scope_memory));
    new (memory) pesapi::luaimpl::pesapi_scope__(env_ref->L);
    return reinterpret_cast<pesapi_scope>(memory);
}

int pesapi_has_caught(pesapi_scope pscope)
{
    auto scope = reinterpret_cast<pesapi::luaimpl::pesapi_scope__*>(pscope);
    return lua_gettop(scope->L) > 0 && lua_tointeger(scope->L, -1) != 0;
}

const char* pesapi_get_exception_as_string(pesapi_scope pscope, int with_stack)
{
    auto scope = reinterpret_cast<pesapi::luaimpl::pesapi_scope__*>(pscope);
    return lua_tostring(scope->L, -2);
}

void pesapi_close_scope(pesapi_scope pscope)
{
    if (!pscope) return;
    auto scope = reinterpret_cast<pesapi::luaimpl::pesapi_scope__*>(pscope);
    lua_settop(scope->L, scope->scope_top); // release all value alloc in scope
    scope->pesapi::luaimpl::pesapi_scope__::~pesapi_scope__();
    free(scope);
}

void pesapi_close_scope_placement(pesapi_scope pscope)
{
    if (!pscope) return;
    auto scope = reinterpret_cast<pesapi::luaimpl::pesapi_scope__*>(pscope);
    lua_settop(scope->L, scope->scope_top); // release all value alloc in scope
    scope->pesapi::luaimpl::pesapi_scope__::~pesapi_scope__();
}

struct pesapi_value_ref__ : public pesapi_env_ref__
{
    pesapi_value_ref__(lua_State* _L, int _value_ref, uint32_t _internal_field_count)
        : pesapi_env_ref__(_L)
        , value_ref(_value_ref)
        , internal_field_count(_internal_field_count)
    {
    }
    int value_ref;
    uint32_t internal_field_count;
    void* internal_fields[1]; // 改为长度为1的数组
};

pesapi_value_ref pesapi_create_value_ref(pesapi_env env, pesapi_value pvalue, uint32_t internal_field_count)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    auto idx = luaValueFromPesapiValue(pvalue);
    lua_rawgeti(L, LUA_REGISTRYINDEX, LUA_RIDX_MAINTHREAD);
    lua_State* mL = lua_tothread(L, -1);
    lua_assert(mL);
    
    size_t totalSize = sizeof(pesapi_value_ref__) + 
                      (internal_field_count > 0 ? (internal_field_count - 1) : 0) * sizeof(void*);
    
    auto ret = (pesapi_value_ref)malloc(totalSize);
    memset(ret, 0, totalSize);

    lua_pop(L, 1);
    lua_pushvalue(L, idx);
    int ref = luaL_ref(L, LUA_REGISTRYINDEX);

    new (ret) pesapi::luaimpl::pesapi_value_ref__(mL, ref, internal_field_count);
    return ret;
}

pesapi_value_ref pesapi_duplicate_value_ref(pesapi_value_ref pvalue_ref)
{
    auto value_ref = reinterpret_cast<pesapi::luaimpl::pesapi_value_ref__*>(pvalue_ref);
    ++value_ref->ref_count;
    return pvalue_ref;
}

void pesapi_release_value_ref(pesapi_value_ref pvalue_ref)
{
    auto value_ref = reinterpret_cast<pesapi::luaimpl::pesapi_value_ref__*>(pvalue_ref);
    if (--value_ref->ref_count == 0)
    {
        if (!value_ref->env_life_cycle_tracker.expired())
        {
            value_ref->pesapi::luaimpl::pesapi_value_ref__::~pesapi_value_ref__();
        }
        free(value_ref);
    }
}

pesapi_value pesapi_get_value_from_ref(pesapi_env env, pesapi_value_ref pvalue_ref)
{
    auto value_ref = reinterpret_cast<pesapi::luaimpl::pesapi_value_ref__*>(pvalue_ref);
    if (value_ref->env_life_cycle_tracker.expired())
    {
        return 0;
    }
    lua_rawgeti(value_ref->L, LUA_REGISTRYINDEX, value_ref->value_ref);
    return pesapiValueFromLuaValue(lua_gettop(value_ref->L));
}

void pesapi_set_ref_weak(pesapi_env env, pesapi_value_ref pvalue_ref)
{
    auto value_ref = reinterpret_cast<pesapi::luaimpl::pesapi_value_ref__*>(pvalue_ref);
    luaL_unref(value_ref->L, LUA_REGISTRYINDEX, value_ref->value_ref);
}

int pesapi_set_owner(pesapi_env env, pesapi_value pvalue, pesapi_value powner)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int owner    = luaValueFromPesapiValue(powner);
    auto idx = luaValueFromPesapiValue(pvalue);
    if (lua_istable(L, owner))
    {
        lua_pushvalue(L, idx);
        lua_rawseti(L, owner, 0);
    }
    return true;
}

pesapi_env_ref pesapi_get_ref_associated_env(pesapi_value_ref value_ref)
{
    return reinterpret_cast<pesapi_env_ref>(value_ref);
}

void** pesapi_get_ref_internal_fields(pesapi_value_ref pvalue_ref, uint32_t* pinternal_field_count)
{
    auto value_ref = reinterpret_cast<pesapi::luaimpl::pesapi_value_ref__*>(pvalue_ref);
    *pinternal_field_count = value_ref->internal_field_count;
    return &value_ref->internal_fields[0];
}

pesapi_value pesapi_get_property(pesapi_env env, pesapi_value pobject, const char* key)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int obj = luaValueFromPesapiValue(pobject);
    lua_getfield(L, obj, key);
    if (lua_isnil(L, -1))
    {
        return 0;
    }
    return pesapiValueFromLuaValue(lua_gettop(L));
}

int pesapi_set_property(pesapi_env env, pesapi_value pobject, const char* key, pesapi_value pvalue)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int obj = luaValueFromPesapiValue(pobject);
    lua_pushvalue(L, luaValueFromPesapiValue(pvalue));
    lua_setfield(L, obj, key);
    return 1;
}

int pesapi_get_private(pesapi_env env, pesapi_value pobject, void** out_ptr)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int index    = luaValueFromPesapiValue(pobject);
    int tp       = lua_type(L, index);
    if (tp == LUA_TNIL || tp == LUA_TNONE)
    {
        *out_ptr = NULL;
        return false;
    }
    auto mapper = CppObjectMapper::Get(L);
    *out_ptr = mapper->GetPrivateData(L, index);
    return true;
}

int pesapi_set_private(pesapi_env env, pesapi_value pobject, void* ptr)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int index    = luaValueFromPesapiValue(pobject);
    int tp       = lua_type(L, index);
    if (tp == LUA_TNIL || tp == LUA_TNONE)
    {
        return false;
    }
    auto mapper = CppObjectMapper::Get(L);
    mapper->SetPrivateData(L, index, ptr);
    return true;
}

pesapi_value pesapi_get_property_uint32(pesapi_env env, pesapi_value pobject, uint32_t key)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    lua_rawgeti(L, luaValueFromPesapiValue(pobject), key);
    return pesapiValueFromLuaValue(lua_gettop(L));
}

int pesapi_set_property_uint32(pesapi_env env, pesapi_value pobject, uint32_t key, pesapi_value pvalue)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    if (pvalue == 0)
    {
        lua_pushnil(L);
    }
    else
    {
        lua_pushvalue(L, luaValueFromPesapiValue(pvalue));
    }
    lua_rawseti(L, luaValueFromPesapiValue(pobject), key);
    return 1;
}

static int error_func(lua_State* L)
{
    const char* msg = lua_tostring(L, 1);
    if (!msg)
        msg = "unknown error";
    luaL_traceback(L, L, msg, 1);
    return 1;
}

pesapi_value pesapi_call_function(pesapi_env env, pesapi_value pfunc, pesapi_value this_object, int argc, const pesapi_value argv[])
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int oldTop = lua_gettop(L);
    lua_pushcfunction(L, error_func);
    int errfunc = lua_gettop(L);

    lua_pushvalue(L, luaValueFromPesapiValue(pfunc));

    for (int i = 0; i < argc; i++)
    {
        lua_pushvalue(L, luaValueFromPesapiValue(argv[i]));
    }

    int res = lua_pcall(L, argc, 1, errfunc);

    lua_remove(L, errfunc);
    lua_pushinteger(L, res);
    //lua_insert(L, oldTop + 1);

    return pesapiValueFromLuaValue(oldTop + 1);
}

pesapi_value pesapi_eval(pesapi_env env, const uint8_t* code, size_t code_size, const char* path)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    int oldTop   = lua_gettop(L);
    lua_pushcfunction(L, error_func);
    int errfunc = lua_gettop(L);

    int ret = luaL_loadbuffer(L, reinterpret_cast<const char*>(code), code_size, path);
    if (ret == 0)
    {
        ret = lua_pcall(L, 0, 1, errfunc);
    }

    lua_remove(L, errfunc);
    lua_pushinteger(L, ret);
    //lua_insert(L, oldTop + 1);

    return pesapiValueFromLuaValue(oldTop + 1);
}

pesapi_value pesapi_global(pesapi_env env)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    lua_getglobal(L, "_G");
    return pesapiValueFromLuaValue(lua_gettop(L));
}

const void* pesapi_get_env_private(pesapi_env env)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    auto mapper = CppObjectMapper::Get(L);
    return mapper->GetEnvPrivate();
}

void pesapi_set_env_private(pesapi_env env, const void* ptr)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    auto mapper = CppObjectMapper::Get(L);
    mapper->SetEnvPrivate(const_cast<void*>(ptr));
}

void pesapi_set_registry(pesapi_env env, pesapi_registry registry)
{
    lua_State* L = luaStateFromPesapiEnv(env);
    auto mapper = CppObjectMapper::Get(L);
    mapper->registry = reinterpret_cast<puerts::ScriptClassRegistry*>(registry);
}

pesapi_ffi g_pesapi_ffi {
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
    &pesapi_set_registry
};

}    // namespace luaimpl
}    // namespace pesapi
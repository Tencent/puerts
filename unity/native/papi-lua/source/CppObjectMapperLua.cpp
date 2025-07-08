#include "CppObjectMapperLua.h"
#include "lua.hpp"
#include "pesapi.h"

namespace pesapi
{
namespace luaimpl
{

    static int dummy_idx_tag = 0;

    CppObjectMapper::CppObjectMapper()
    {
    }

    struct ByteBuffer {
        size_t size;
        unsigned char *ptr;
        unsigned char data[1];
    };

    static int bytebuffer_len(lua_State* L) {
        ByteBuffer* buf = (ByteBuffer*)lua_touserdata(L, 1);
        lua_pushinteger(L, buf->size);
        return 1;
    }

    static int bytebuffer_index(lua_State* L) {
        ByteBuffer* buf = (ByteBuffer*)lua_touserdata(L, 1);
        lua_Integer index = luaL_checkinteger(L, 2);
        if (index < 1 || index > (lua_Integer)buf->size) {
            return luaL_error(L, "index out of range (1 to %d)", buf->size);
        }
        lua_pushinteger(L, buf->ptr[index-1]);
        return 1;
    }

    static int bytebuffer_newindex(lua_State* L) {
        ByteBuffer* buf = (ByteBuffer*)lua_touserdata(L, 1);
        lua_Integer index = luaL_checkinteger(L, 2);
        lua_Integer value = luaL_checkinteger(L, 3);
        if (index < 1 || index > (lua_Integer)buf->size) {
            return luaL_error(L, "index out of range (1 to %d)", buf->size);
        }
        if (value < 0 || value > 255) {
            return luaL_error(L, "value must be between 0 and 255");
        }
        buf->ptr[index-1] = (unsigned char)value;
        return 0;
    }

    static int buffer_new(lua_State* L) {
        lua_Integer size = luaL_checkinteger(L, 1);
        if (size <= 0) return luaL_error(L, "buffer size must be positive");
        
        // 分配内存：结构体+数据区
        size_t total_size = sizeof(ByteBuffer) + size - 1;
        ByteBuffer* buf = (ByteBuffer*)lua_newuserdata(L, total_size);
        buf->size = size;
        buf->ptr = buf->data; // 指向内部数据
        memset(buf->data, 0, size); // 清零数据区
        
        // 获取CppObjectMapper实例
        auto pmapper = (CppObjectMapper**)lua_getextraspace(L);
        CppObjectMapper* mapper = *pmapper;
        
        // 使用预存储的元表引用设置元表
        lua_rawgeti(L, LUA_REGISTRYINDEX, mapper->m_BufferMetatableRef);
        lua_setmetatable(L, -2);
        
        return 1;
    }

    // 创建Buffer实例（持有外部指针）
    int CppObjectMapper::CreateBufferByPointer(lua_State* L, unsigned char* ptr, size_t size) {
        // 只分配结构体本身
        ByteBuffer* buf = (ByteBuffer*)lua_newuserdata(L, sizeof(ByteBuffer));
        buf->size = size;
        buf->ptr = ptr; // 指向外部数据
        
        // 使用预存储的元表引用设置元表
        lua_rawgeti(L, LUA_REGISTRYINDEX, m_BufferMetatableRef);
        lua_setmetatable(L, -2);
        
        return lua_gettop(L); // 返回创建值的index
    }

    // 创建Buffer实例（拷贝数据）
    int CppObjectMapper::CreateBufferCopy(lua_State* L, const unsigned char* data, size_t size) {
        // 分配内存：结构体+数据区
        size_t total_size = sizeof(ByteBuffer) + size - 1;
        ByteBuffer* buf = (ByteBuffer*)lua_newuserdata(L, total_size);
        buf->size = size;
        buf->ptr = buf->data; // 指向内部数据
        
        if (data) {
            memcpy(buf->data, data, size); // 拷贝数据
        } else {
            memset(buf->data, 0, size); // 清零数据区
        }
        
        // 使用预存储的元表引用设置元表
        lua_rawgeti(L, LUA_REGISTRYINDEX, m_BufferMetatableRef);
        lua_setmetatable(L, -2);
        
        return lua_gettop(L); // 返回创建值的index
    }

    bool CppObjectMapper::IsBuffer(lua_State* L, int index) {
        // 检查值是否为userdata
        if (!lua_isuserdata(L, index)) {
            return false;
        }
        
        // 获取值的元表
        if (!lua_getmetatable(L, index)) {
            return false;
        }
        
        // 获取预存储的ByteBuffer元表
        lua_rawgeti(L, LUA_REGISTRYINDEX, m_BufferMetatableRef);
        
        // 比较两个元表是否相同
        bool isBuffer = lua_rawequal(L, -1, -2) != 0;
        
        // 清理栈（弹出两个元表）
        lua_pop(L, 2);
        
        return isBuffer;
    }


    void CppObjectMapper::Initialize(lua_State* L)
    {
        lua_newtable(L);
        lua_newtable(L);
        lua_pushstring(L, "__mode");
        lua_pushstring(L, "v");
        lua_rawset(L, -3);
        lua_setmetatable(L, -2);
        m_CacheRef = luaL_ref(L, LUA_REGISTRYINDEX);

        lua_newtable(L);
        m_CachePrivateDataRef = luaL_ref(L, LUA_REGISTRYINDEX);
        auto pmapper = (CppObjectMapper**)lua_getextraspace(L);
        *pmapper = this;
        
        // 创建并存储ByteBuffer元表
        luaL_newmetatable(L, "ByteBuffer");
        lua_pushcfunction(L, bytebuffer_len);
        lua_setfield(L, -2, "__len");
        lua_pushcfunction(L, bytebuffer_index);
        lua_setfield(L, -2, "__index");
        lua_pushcfunction(L, bytebuffer_newindex);
        lua_setfield(L, -2, "__newindex");
        m_BufferMetatableRef = luaL_ref(L, LUA_REGISTRYINDEX);
        
        // 注册全局buffer函数
        lua_pushcfunction(L, buffer_new);
        lua_setglobal(L, "buffer");
    }

    static int PesapiFunctionCallback(lua_State* L)
    {
        PesapiCallbackData* FunctionInfo = reinterpret_cast<PesapiCallbackData*>(lua_touserdata(L, lua_upvalueindex(1)));
        pesapi_callback_info__ info{L, 0, 0, FunctionInfo->Data};
        FunctionInfo->Callback(&g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&info));
        return 1;
    }

    static int PesapiFunctionGC(lua_State* L)
    {
        PesapiCallbackData* FunctionInfo = reinterpret_cast<PesapiCallbackData*>(lua_touserdata(L, lua_upvalueindex(1)));
        if (FunctionInfo->Finalize)
        {
            FunctionInfo->Finalize(&g_pesapi_ffi, FunctionInfo->Data, const_cast<void*>(FunctionInfo->Mapper->GetEnvPrivate()));
        }
        return 0;
    }

    int CppObjectMapper::CreateFunction(lua_State* L, pesapi_callback Callback, void* Data, pesapi_function_finalize Finalize)
    {
        const auto CallbackData = (PesapiCallbackData*)lua_newuserdata(L, sizeof(PesapiCallbackData));
        lua_newtable(L);
        lua_pushlightuserdata(L, CallbackData);
        lua_pushcclosure(L, PesapiFunctionGC, 1);
        lua_setfield(L, -2, "__gc");
        lua_setmetatable(L, -2);
        CallbackData->Callback = Callback;
        CallbackData->Data     = Data;
        CallbackData->Finalize = Finalize;
        CallbackData->Mapper   = this;

        lua_pushcclosure(L, PesapiFunctionCallback, 1);
        return lua_gettop(L);
    }

    int CppObjectMapper::LoadTypeById(lua_State* L, const void* typeId)
    {
        if (const auto classDef = puerts::LoadClassByID(registry, typeId))
        {
            lua_createtable(L, 0, 0);
            const int meta_ref = GetMetaRefOfClass(L, classDef);
            lua_rawgeti(L, LUA_REGISTRYINDEX, meta_ref);
            lua_pushlightuserdata(L, &dummy_idx_tag);
            lua_rawget(L, -2);
            lua_remove(L, -2);
            if (!lua_isnil(L, -1))
            {
                lua_setmetatable(L, -2);
                return lua_gettop(L);
            }
            return luaL_error(L, "type meta not find");
        }
        return luaL_error(L, "no such type");
    }

    bool CppObjectMapper::IsInstanceOfCppObject(lua_State* L, const void* TypeId, int ObjectIndex)
    {
        CppObject* cppObject = (CppObject*)lua_touserdata(L, ObjectIndex);
        return cppObject && cppObject->TypeId == TypeId;
    }

    int CppObjectMapper::FindOrAddCppObject(lua_State* L, const void* typeId, void* ptr, bool passByPointer)
    {
        if (ptr == nullptr)
        {
            lua_pushnil(L);
            return lua_gettop(L);
        }

        if (passByPointer)
        {
            const auto iterator = m_DataCache.find(ptr);
            if (iterator != m_DataCache.end())
            {
                FObjectCacheNode* item = &(iterator->second);
                if (const FObjectCacheNode* node = item->Find(typeId))
                {
                    lua_rawgeti(L, LUA_REGISTRYINDEX, m_CacheRef);
                    if (lua_rawgeti(L, -1, node->Value) != LUA_TNIL)
                    {
                        lua_remove(L, -2);
                        return lua_gettop(L);
                    }
                    lua_pop(L, 2);
                    item->Remove(node->TypeId, item == node);
                    if (!item->TypeId)
                    {
                        m_DataCache.erase(iterator);
                    }
                }
            }
        }
        const puerts::ScriptClassDefinition* classDefinition = puerts::LoadClassByID(registry, typeId);
        BindCppObject(L, classDefinition, ptr, passByPointer);
        return lua_gettop(L);
    }

    void CppObjectMapper::BindCppObject(lua_State* L, const puerts::ScriptClassDefinition* classDefinition, void* ptr, bool passByPointer)
    {
        CppObject* obj           = static_cast<CppObject*>(lua_newuserdata(L, sizeof(CppObject)));
        obj->Ptr                 = ptr;
        obj->TypeId              = classDefinition->TypeId;
        obj->NeedDelete          = !passByPointer;
        const int meta_ref = GetMetaRefOfClass(L, classDefinition);
        lua_rawgeti(L, LUA_REGISTRYINDEX, meta_ref);
        lua_setmetatable(L, -2);

        lua_rawgeti(L, LUA_REGISTRYINDEX, m_CacheRef);
        lua_pushvalue(L, -2);
        int ref = luaL_ref(L, -2);
        lua_pop(L, 1);
        auto iterator = m_DataCache.find(ptr);
        FObjectCacheNode* cacheNodePtr;
        if (iterator != m_DataCache.end())
        {
            cacheNodePtr = iterator->second.Add(classDefinition->TypeId);
        }
        else
        {
            auto ret     = m_DataCache.insert({ptr, FObjectCacheNode(classDefinition->TypeId)});
            cacheNodePtr = &(ret.first->second);

        }
        cacheNodePtr->Value = ref;
        if (onEnter)
        {
            cacheNodePtr->UserData = onEnter(ptr, classDefinition->Data, GetEnvPrivate());
        }
    }

    void CppObjectMapper::UnBindCppObject(lua_State* L, const puerts::ScriptClassDefinition* classDefinition, void* ptr)
    {
        auto iterator = m_DataCache.find(ptr);
        if (iterator != m_DataCache.end())
        {
            if (onExit)
            {
                onExit(ptr, classDefinition->Data, GetEnvPrivate(), iterator->second.UserData);
            }
            auto Removed = iterator->second.Remove(classDefinition->TypeId, true);
            if (!iterator->second.TypeId)
            {
                m_DataCache.erase(ptr);
            }
        }
    }

    void* CppObjectMapper::GetPrivateData(lua_State* L, int index) const
    {
        index = lua_absindex(L, index);
        lua_rawgeti(L, LUA_REGISTRYINDEX, m_CachePrivateDataRef);
        lua_pushvalue(L, index);
        lua_rawget(L, -2);
        if (lua_isnil(L, -1))
        {
            lua_pop(L, 2);
            return nullptr;
        }
        void* data = lua_touserdata(L, -1);
        lua_pop(L, 2);
        return data;
    }

    void CppObjectMapper::SetPrivateData(lua_State* L, int index, void* ptr)
    {
        lua_rawgeti(L, LUA_REGISTRYINDEX, m_CachePrivateDataRef);
        lua_rawgeti(L, LUA_REGISTRYINDEX, index);
        if (ptr == nullptr)
        {
            lua_pushnil(L);
        }
        else
        {
            lua_pushlightuserdata(L, ptr);
        }
        lua_rawset(L, -3);
        lua_pop(L, 1);
    }

    void CppObjectMapper::UnInitialize(lua_State* L)
    {
        const auto PData = GetEnvPrivate();
        lua_rawgeti(L, LUA_REGISTRYINDEX, m_CacheRef);
        for (auto& KV : m_DataCache)
        {
            FObjectCacheNode* PNode = &KV.second;
            bool need_delete       = true;
            while (PNode)
            {
                if (need_delete)
                {
                    lua_rawgeti(L, -1, PNode->Value);
                    // lua_assert是私有宏，只有在lua中生效，GameCore中不生效
                    lua_assert(lua_isuserdata(L, -1));
                    const auto obj = (CppObject*) lua_touserdata(L, -1);
                    // RAX为0，地址真的是0，也就是说unbind的时候，userdata删掉了，但是注册表索引还在，有可能逻辑有问题，有可能GC的时候，没有及时同步过来，这里先做一下保护
                    if (obj != nullptr)
                    {
                        const puerts::ScriptClassDefinition* ClassDefinition = puerts::FindClassByID(registry, obj->TypeId);
                        // 值类型需要删除，所以这里必须要执行，但是执行之后，指针会被删除，所以下面的就不要执行了，虚拟机会销毁，所以lua不会内存泄露，LuaEnv也会销毁，所以C#也不会内存泄露
                        // 因为值类型的内存是手动申请的，所以必须要手动释放
                        if (ClassDefinition && ClassDefinition->Finalize && need_delete && obj->NeedDelete)
                        {
                            ClassDefinition->Finalize(&g_pesapi_ffi, KV.first, ClassDefinition->Data, PData);
                            need_delete = false;
                        }
                        if (this->onExit)
                        {
                            this->onExit(KV.first, ClassDefinition->Data, PData, KV.second.UserData);
                        }
                        lua_pop(L, 1);
                    }
                }
                PNode = PNode->Next;
            }
        }
        m_DataCache.clear();
        m_TypeIdToMetaMap.clear();
        luaL_unref(L, LUA_REGISTRYINDEX, m_CacheRef);
        luaL_unref(L, LUA_REGISTRYINDEX, m_CachePrivateDataRef);
    }

    // param   --- [1]: obj, [2]: key
    int object_indexer(lua_State* L)
    {
        // method
        if (!lua_isnil(L, lua_upvalueindex(1)))
        {
            lua_pushvalue(L, 2);
            lua_gettable(L, lua_upvalueindex(1));
            if (!lua_isnil(L, -1))
            { // has method
                return 1;
            }
            lua_pop(L, 1);
        }

        // getter
        if (!lua_isnil(L, lua_upvalueindex(2)))
        {
            lua_pushvalue(L, 2);
            lua_gettable(L, lua_upvalueindex(2));
            if (!lua_isnil(L, -1))
            { // has getter
                lua_pushvalue(L, 1);
                lua_call(L, 1, 1);
                return 1;
            }
            lua_pop(L, 1);
        }

        // parent
        if (!lua_isnil(L, lua_upvalueindex(3)))
        {
            lua_settop(L, 2);
            lua_pushvalue(L, lua_upvalueindex(3));
            lua_insert(L, 1);
            lua_call(L, 2, 1);
            return 1;
        }
        else
        {
            return 0;
        }
    }

    // upvalue --- [1]:setters, [2]:base_newindex
    // param   --- [1]: obj, [2]: key, [3]: value
    int obj_new_indexer(lua_State* L)
    {
        // setter
        if (!lua_isnil(L, lua_upvalueindex(2)))
        {
            lua_pushvalue(L, 2);
            lua_gettable(L, lua_upvalueindex(2));
            if (!lua_isnil(L, -1))
            { // has setter
                lua_pushvalue(L, 1);
                lua_pushvalue(L, 3);
                lua_call(L, 2, 0);
                return 0;
            }
            lua_pop(L, 1);
        }

        if (!lua_isnil(L, lua_upvalueindex(3)))
        {
            lua_settop(L, 3);
            lua_pushvalue(L, lua_upvalueindex(3));
            lua_insert(L, 1);
            lua_call(L, 3, 0);
            return 0;
        }
        else
        {
            return luaL_error(L, "class cannot set %s, no such field", lua_tostring(L, 2));
        }
    }

    int object_new(lua_State* L)
    {
        puerts::ScriptClassDefinition* class_definition = static_cast<puerts::ScriptClassDefinition*>(lua_touserdata(L, lua_upvalueindex(1)));
        pesapi_callback_info__ callback_info{L, 1, 0, class_definition->Data};
        CppObjectMapper::Get(L)->BindCppObject(L, class_definition, class_definition->Initialize(&g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&callback_info)), false);
        return 1;
    }

    int object_gc(lua_State* L)
    {
        puerts::ScriptClassDefinition* class_definition = (puerts::ScriptClassDefinition*)lua_touserdata(L, lua_upvalueindex(1));
        CppObject* cppObject = (CppObject*)lua_touserdata(L, -1);
        const auto instance  = CppObjectMapper::Get(L);
        instance->UnBindCppObject(L, class_definition, cppObject->Ptr);
        if (cppObject->NeedDelete)
        {
            if (class_definition->Finalize)
            {
                class_definition->Finalize(&g_pesapi_ffi, cppObject->Ptr, class_definition->Data, L);
            }
        }
        return 0;
    }

    // upvalue --- [1]:getters, [2]:fields, [3]:base_index
    // param   --- [1]: obj, [2]: key
    int static_indexer(lua_State* L)
    {
        if (!lua_isnil(L, lua_upvalueindex(1)))
        {
            lua_pushvalue(L, 2);
            lua_gettable(L, lua_upvalueindex(1));
            if (!lua_isnil(L, -1))
            { // has getter
                lua_call(L, 0, 1);
                return 1;
            }
            lua_pop(L, 1);
        }

        if (!lua_isnil(L, lua_upvalueindex(2)))
        {
            lua_pushvalue(L, 2);
            lua_rawget(L, lua_upvalueindex(2));
            if (!lua_isnil(L, -1))
            { // has field
                return 1;
            }
            lua_pop(L, 1);
        }

        if (!lua_isnil(L, lua_upvalueindex(3)))
        {
            lua_settop(L, 2);
            lua_pushvalue(L, lua_upvalueindex(3));
            lua_insert(L, 1);
            lua_call(L, 2, 1);
            return 1;
        }
        else
        {
            lua_pushnil(L);
            return 1;
        }
    }

    // upvalue --- [1]:setters, [2]:base_newindex
    // param   --- [1]: obj, [2]: key, [3]: value
    static int static_newindexer(lua_State* L)
    {
        if (!lua_isnil(L, lua_upvalueindex(1)))
        {
            lua_pushvalue(L, 2);
            lua_gettable(L, lua_upvalueindex(1));
            if (!lua_isnil(L, -1))
            { // has setter
                lua_pushvalue(L, 3);
                lua_call(L, 1, 0);
                return 0;
            }
        }

        if (!lua_isnil(L, lua_upvalueindex(2)))
        {
            lua_settop(L, 3);
            lua_pushvalue(L, lua_upvalueindex(2));
            lua_insert(L, 1);
            lua_call(L, 3, 0);
            return 0;
        }
        else
        {
            return luaL_error(L, "no static field %s", lua_tostring(L, 2));
        }
    }

    int property_getter_wrap(lua_State* L)
    {
        puerts::ScriptPropertyInfo* prop_info = (puerts::ScriptPropertyInfo*)lua_touserdata(L, lua_upvalueindex(1));
        pesapi_callback_info__ callback_info{L, 1, 0, prop_info->GetterData};
        prop_info->Getter(&g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&callback_info));
        return callback_info.RetNum;
    }

    static int property_setter_wrap(lua_State* L)
    {
        puerts::ScriptPropertyInfo* prop_info = (puerts::ScriptPropertyInfo*)lua_touserdata(L, lua_upvalueindex(1));
        pesapi_callback_info__ callback_info{L, 1, 0, prop_info->SetterData};
        prop_info->Setter(&g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&callback_info));
        return callback_info.RetNum;
    }

    static int variable_getter_wrap(lua_State* L)
    {

        puerts::ScriptPropertyInfo* prop_info = (puerts::ScriptPropertyInfo*)lua_touserdata(L, lua_upvalueindex(1));
        pesapi_callback_info__ callback_info{L, 0, 0,  prop_info->GetterData};
        prop_info->Getter(&g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&callback_info));
        return callback_info.RetNum;
    }

    static int variable_setter_wrap(lua_State* L)
    {
        puerts::ScriptPropertyInfo* prop_info = (puerts::ScriptPropertyInfo*)lua_touserdata(L, lua_upvalueindex(1));
        pesapi_callback_info__ callback_info{L, 0, 0, prop_info->SetterData};
        prop_info->Setter(&g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&callback_info));
        return callback_info.RetNum;
    }

    static int method_wrap(lua_State* L)
    {
        puerts::ScriptFunctionInfo* func_info = (puerts::ScriptFunctionInfo*)lua_touserdata(L, lua_upvalueindex(1));
        pesapi_callback_info__ callback_info{L, 1, 0, func_info->Data};
        func_info->Callback(&g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&callback_info));
        return callback_info.RetNum;
    }

    static int function_wrap(lua_State* L)
    {

        puerts::ScriptFunctionInfo* func_info = (puerts::ScriptFunctionInfo*)lua_touserdata(L, lua_upvalueindex(1));
        pesapi_callback_info__ callback_info{L, 0, 0, func_info->Data};
        func_info->Callback(&g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&callback_info));
        return callback_info.RetNum;
    }

    int CppObjectMapper::GetMetaRefOfClass(lua_State* L, const puerts::ScriptClassDefinition* classDefinition)
    {
        // requires at least 13 slots in stack: 8 fixed slots (obj_methods, obj_getters, obj_setters, static_functions, static_getters, static_setters, meta, cls_meta), 5 extension
        // slots (__index, obj_methods, obj_getters, super_meta_ref, __index)
        luaL_checkstack(L, 13, "not enough stack space for GetMetaRefOfClass");
        const auto iterator = m_TypeIdToMetaMap.find(classDefinition->TypeId);
        if (iterator == m_TypeIdToMetaMap.end())
        {
            int meta_ref = -1;
            int org_top = lua_gettop(L);
            int super_meta_ref = -1;
            bool has_super = false;
            if (classDefinition->SuperTypeId)
            {
                if (const puerts::ScriptClassDefinition* superDefinition = puerts::LoadClassByID(registry, classDefinition->SuperTypeId))
                {
                    super_meta_ref = GetMetaRefOfClass(L, superDefinition);
                    has_super = true;
                }
            }

            lua_createtable(L, 0, 0);
            int obj_methods = lua_gettop(L);
            lua_createtable(L, 0, 0);
            int obj_getters = lua_gettop(L);
            lua_createtable(L, 0, 0);
            int obj_setters = lua_gettop(L);

            lua_createtable(L, 0, 0);
            int static_functions = lua_gettop(L);
            lua_createtable(L, 0, 0);
            int static_getters = lua_gettop(L);
            lua_createtable(L, 0, 0);
            int static_setters = lua_gettop(L);

            lua_newtable(L);
            int meta = lua_gettop(L);

            puerts::ScriptPropertyInfo* PropertyInfo = classDefinition->Properties;
            while (PropertyInfo && PropertyInfo->Name)
            {
                if (PropertyInfo->Getter)
                {
                    lua_pushstring(L, PropertyInfo->Name);
                    lua_pushlightuserdata(L, PropertyInfo);
                    lua_pushcclosure(L, property_getter_wrap, 1);
                    lua_rawset(L, obj_getters);
                }
                if (PropertyInfo->Setter)
                {
                    lua_pushstring(L, PropertyInfo->Name);
                    lua_pushlightuserdata(L, PropertyInfo);
                    lua_pushcclosure(L, property_setter_wrap, 1);
                    lua_rawset(L, obj_setters);
                }
                ++PropertyInfo;
            }

            PropertyInfo = classDefinition->Variables;
            while (PropertyInfo && PropertyInfo->Name)
            {
                if (PropertyInfo->Getter)
                {
                    lua_pushstring(L, PropertyInfo->Name);
                    lua_pushlightuserdata(L, PropertyInfo);
                    lua_pushcclosure(L, variable_getter_wrap, 1);
                    lua_rawset(L, static_getters);
                }
                if (PropertyInfo->Setter)
                {
                    lua_pushstring(L, PropertyInfo->Name);
                    lua_pushlightuserdata(L, PropertyInfo);
                    lua_pushcclosure(L, variable_setter_wrap, 1);
                    lua_rawset(L, static_setters);
                }
                ++PropertyInfo;
            }

            puerts::ScriptFunctionInfo* FunctionInfo = classDefinition->Methods;
            while (FunctionInfo && FunctionInfo->Name && FunctionInfo->Callback)
            {
                lua_pushstring(L, FunctionInfo->Name);
                lua_pushlightuserdata(L, FunctionInfo);
                lua_pushcclosure(L, method_wrap, 1);
                lua_rawset(L, obj_methods);
                ++FunctionInfo;
            }
            
            FunctionInfo = classDefinition->Functions;
            while (FunctionInfo && FunctionInfo->Name && FunctionInfo->Callback)
            {
                lua_pushstring(L, FunctionInfo->Name);
                lua_pushlightuserdata(L, FunctionInfo);
                lua_pushcclosure(L, function_wrap, 1);
                lua_rawset(L, static_functions);
                ++FunctionInfo;
            }

            lua_pushstring(L, "__index");
            lua_pushvalue(L, obj_methods);
            lua_pushvalue(L, obj_getters);
            if (has_super)
            {
                lua_rawgeti(L, LUA_REGISTRYINDEX, super_meta_ref);
                lua_pushstring(L, "__index");
                lua_rawget(L, -2);
                lua_remove(L, -2);
            }
            else
            {
                lua_pushnil(L);
            }
            lua_pushcclosure(L, object_indexer, 3);
            lua_rawset(L, meta);

            lua_pushstring(L, "__newindex");
            lua_pushvalue(L, obj_setters);
            if (has_super)
            {
                lua_rawgeti(L, LUA_REGISTRYINDEX, super_meta_ref);
                lua_pushstring(L, "__newindex");
                lua_rawget(L, -2);
                lua_remove(L, -2);
            }
            else
            {
                lua_pushnil(L);
            }
            lua_pushcclosure(L, obj_new_indexer, 2);
            lua_rawset(L, meta);

            lua_pushstring(L, "__gc");
            lua_pushlightuserdata(L, const_cast<puerts::ScriptClassDefinition*>(classDefinition));
            lua_pushcclosure(L, object_gc, 1);
            lua_rawset(L, meta);

            lua_createtable(L, 0, 0);
            int cls_meta = lua_gettop(L);

            lua_pushstring(L, "__call");
            lua_pushlightuserdata(L, const_cast<puerts::ScriptClassDefinition*>(classDefinition));
            lua_pushcclosure(L, object_new, 1);
            lua_rawset(L, cls_meta);

            lua_pushstring(L, "__index");
            lua_pushvalue(L, static_getters);
            lua_pushvalue(L, static_functions);
            if (has_super)
            {
                lua_rawgeti(L, LUA_REGISTRYINDEX, super_meta_ref);
                lua_pushlightuserdata(L, &dummy_idx_tag);

                lua_rawget(L, -2);
                lua_remove(L, -2);
                if (!lua_isnil(L, -1))
                {
                    lua_pushstring(L, "__index");
                    lua_rawget(L, -2);
                    lua_remove(L, -2);
                }
            }
            else
            {
                lua_pushnil(L);
            }
            lua_pushcclosure(L, static_indexer, 3);
            lua_rawset(L, cls_meta);

            lua_pushstring(L, "__newindex");
            lua_pushvalue(L, static_setters);
            if (has_super)
            {
                lua_rawgeti(L, LUA_REGISTRYINDEX, super_meta_ref);
                lua_pushlightuserdata(L, &dummy_idx_tag);
                lua_rawget(L, -2);
                lua_remove(L, -2);
                if (!lua_isnil(L, -1))
                {
                    lua_pushstring(L, "__newindex");
                    lua_rawget(L, -2);
                    lua_remove(L, -2);
                }
            }
            else
            {
                lua_pushnil(L);
            }
            lua_pushcclosure(L, static_newindexer, 2);
            lua_rawset(L, cls_meta);

            lua_pushlightuserdata(L, &dummy_idx_tag);
            lua_insert(L, cls_meta);
            lua_rawset(L, meta);
            meta_ref = luaL_ref(L, LUA_REGISTRYINDEX);
            lua_pop(L, 6);

            if (org_top != lua_gettop(L))
            {
                luaL_error(L, "stack top changed ? %d, %d\n", org_top, lua_gettop(L));
            }
            m_TypeIdToMetaMap[classDefinition->TypeId] = meta_ref;
            return meta_ref;
        }
        return iterator->second;
    }
}
}
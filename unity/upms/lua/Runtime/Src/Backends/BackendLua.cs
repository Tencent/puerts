/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;


namespace Puerts
{
    public class BackendLua : Backend
    {
        private IntPtr envRef;

        private LuaLoader luaLoader;
        public BackendLua(LuaLoader loader)
        {
            luaLoader = loader;
        }

        public BackendLua()
        {
            luaLoader = new LuaDefaultLoader();
        }

        public override int GetApiVersion()
        {
            return PapiLuaNative.GetLuaPapiVersion();
        }

        public override IntPtr CreateEnvRef()
        {
            envRef = PapiLuaNative.CreateLuaPapiEnvRef();
            return envRef;
        }

        public override IntPtr GetApi()
        {
            return PapiLuaNative.GetLuaFFIApi();
        }

        public override void DestroyEnvRef(IntPtr envRef)
        {
            PapiLuaNative.DestroyLuaPapiEnvRef(envRef);
        }

        public override void LowMemoryNotification()
        {
            
        }

        public override IntPtr GetModuleExecutor(IntPtr env)
        {
            var papis = GetApi();
            var globalVal = PuertsNative.pesapi_global(papis, env);
            return PuertsNative.pesapi_get_property(papis, env, globalVal, "require");
        }

        public override object GetLoader()
        {
            return luaLoader;
        }

        public override void OnEnter(ScriptEnv scriptEnv)
        {
            // override print
            scriptEnv.Eval(@"
            local tudb = scriptEnv:GetTypeByString('UnityEngine.Debug')
            local loadType = loadType
            local scriptEnv = scriptEnv
            
            local outputStr
            if tudb then
                local Debug = loadType(tudb)
                outputStr = Debug and Debug.Log
            else
                local tc = scriptEnv:GetTypeByString('System.Console')
                outputStr = loadType(tc).WriteLine
            end
            function print(...)
                local args = {...}
                for i = 1, #args do
                    local arg = args[i]
                    args[i] = (type(arg) == 'userdata' and type(arg.ToString) == 'function') and arg:ToString() or tostring(arg)
                end
                outputStr(table.concat(args, '\t'))
            end
            ");

            scriptEnv.Eval(@"local metatable = {}
            local rawget = rawget
            local setmetatable = setmetatable
            local loadType = loadType
            local scriptEnv = scriptEnv
            local GET_MEMBER_FLAGS = nil
            local function process_nested_types(type, cls, ...)
                if not GET_MEMBER_FLAGS then
                    local BindingFlags = loadType(scriptEnv:GetTypeByString('System.Reflection.BindingFlags'))
                    GET_MEMBER_FLAGS = BindingFlags.DeclaredOnly | BindingFlags.Instance | BindingFlags.Static | BindingFlags.Public;
                end
                local nts = type:GetNestedTypes(GET_MEMBER_FLAGS)
                if nts and nts.Length > 0 then
                    for i = 0, nts.Length -1 do
                        local nt = nts:get_Item(i)
                        if nt.IsGenericTypeDefinition then
                            local n = select('#', ...)
                            if n == 0 then
                                nt = nil
                            end
                            nt = nt:MakeGenericType(...)
                        end
                        if nt then
                            local nc = loadType(nt)
                            rawset(nc, '__p_innerType', nt)
                            rawset(cls, nt.Name, nc)
                        end
                    end
                end
            end
            local function cs_type_to_lua(type, ...)
                if not type then return nil end
                local cls = loadType(type)
                if not cls then return nil end
                rawset(cls, '__p_innerType', type)
                process_nested_types(type, cls, ...)
                return cls
            end
            _G.cs_type_to_lua = cs_type_to_lua
            local function import_type(full_name)
                local type = scriptEnv:GetTypeByString(full_name)
                return cs_type_to_lua(type)
            end
            local function import_generic_type(full_name)
                local type = scriptEnv:GetTypeByString(full_name)
                return {__p_innerType = type}
            end

            function metatable:__index(key) 
                if key == '__p_innerType' then return end
                local fqn = rawget(self,'.fqn')
                local name = key
                local is_generic = false
                if name:match('_%d+$') then
                    name = name:gsub('_', '`', 1)
                    is_generic = true
                end

                fqn = ((fqn and fqn .. '.') or '') .. name

                local obj = is_generic and import_generic_type(fqn) or import_type(fqn)

                if obj == nil then
                    -- It might be an assembly, so we load it too.
                    obj = { ['.fqn'] = fqn }
                    setmetatable(obj, metatable)
                elseif obj == true then
                    return rawget(self, key)
                end

                -- Cache this lookup
                rawset(self, key, obj)
                return obj
            end

            function metatable:__newindex()
                error('No such type: ' .. rawget(self,'.fqn'), 2)
            end

            local CS = {}
            local puerts = {}
            setmetatable(CS, metatable)
            function puerts.typeof(t) return type(t) == 'table' and t.__p_innerType or nil end
            local function puerts_searcher(modname) 
                if modname == 'csharp' then
                    return function() return CS end
                elseif modname == 'puerts' then
                    return function() return puerts end
                else
                    return '\n\t[puerts_searcher] module ['..modname..'] not found'
                end
            end
            local searchers = package.searchers or package.loaders
            table.insert(searchers, puerts_searcher)
            ");

            scriptEnv.Eval(@"
            local loader = scriptEnv:GetLoader()
            local function cs_searcher(modname)
                local out_dbg_path = {}
                local content = loader:ReadFile(modname, out_dbg_path)

                if not content then
                    return '\n\t[cs_searcher] module ['..modname..'] not found'
                end
                return function()
                    local chunk, err = load(content, out_dbg_path[1], 't')
                    if not chunk then error(err) end
                    return chunk()
                end
            end
            local searchers = package.searchers or package.loaders
            table.insert(searchers, cs_searcher)
            ");

            scriptEnv.Eval(@"
            local loadType = loadType
            local scriptEnv = scriptEnv
            local cs_type_to_lua = _G.cs_type_to_lua
            local puerts = require('puerts')
            local CS = require('csharp')
            local unpack = unpack or table.unpack
            local createFunction = createFunction
            _G.createFunction = nil
            local changeArgStart = changeArgStart
            _G.changeArgStart = nil

            puerts.createFunction = createFunction

            function puerts.generic(l_type, ...)
                local cs_type = puerts.typeof(l_type)
                if not cs_type then error('the class must be a constructor') end
                local n = select('#', ...)
                if n == 0 then error('no generic argument') end
                local args = {}
                for i = 1, n do
                    local arg = puerts.typeof(select(i, ...))
                    if not arg then error('invalid Type for generic arguments '.. i) end
                    table.insert(args, arg)
                end
                return cs_type_to_lua(cs_type:MakeGenericType(unpack(args)), unpack(args))
            end

            function puerts.genericMethod(l_type, method_name, ...)
                local cs_type = puerts.typeof(l_type)
                if not cs_type then error('the class must be a constructor') end
                local n = select('#', ...)
                if n == 0 then error('no generic argument') end
                local args = {}
                for i = 1, n do
                    local arg = puerts.typeof(select(i, ...))
                    if not arg then error('invalid Type for generic arguments '.. i) end
                    table.insert(args, arg)
                end

                local members = CS.Puerts.Utils.GetMethodAndOverrideMethodByName(cs_type, method_name)

                local overloadFunctions = {}
                local isStatic = true
                for i = 0, members.Length -1 do
                    local method = members:GetValue(i)
                    if (method.IsGenericMethodDefinition and method:GetGenericArguments().Length == n) then
                        local methodImpl = method:MakeGenericMethod(unpack(args))
                        isStatic = methodImpl.IsStatic
                        table.insert(overloadFunctions, methodImpl)
                    end
                end
                if #overloadFunctions > 0 then
                    local res = createFunction(unpack(overloadFunctions))
                    if not isStatic then
                        changeArgStart(res, 1)
                    end
                    return res
                end
            end

            function puerts.ref(x) return {x} end
            function puerts.unref(r) return r[1] end
            function puerts.setref(r, x) r[1] = x end
            
            ");

            // clear global
            scriptEnv.Eval(@"
            loadType = nil
            scriptEnv = nil
            cs_type_to_lua = nil
            ");
        }
    }
}
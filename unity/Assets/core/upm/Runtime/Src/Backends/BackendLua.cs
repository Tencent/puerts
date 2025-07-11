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
            local function import_type(full_name)
                local type = scriptEnv:GetTypeByString(full_name)
                if not type then return nil end
                local cls = loadType(type)
                rawset(cls, '__p_innerType', type)
                return cls
            end

            function metatable:__index(key) 
                local fqn = rawget(self,'.fqn')
                fqn = ((fqn and fqn .. '.') or '') .. key

                local obj = import_type(fqn)

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
            function puerts.typeof(t) return t.__p_innerType end
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
        }
    }
}
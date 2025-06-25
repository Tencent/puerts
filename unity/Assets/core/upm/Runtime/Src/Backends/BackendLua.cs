/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;


namespace Puerts
{
    public class BackendLua : Backend
    {
        private IntPtr envRef;
        public BackendLua() { }

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
            // TODO
            return null;
        }

        public override void OnEnter(ScriptEnv scriptEnv)
        {
            // override print
            scriptEnv.Eval(@"
            local tudb = scriptEnv:GetTypeByString('UnityEngine.Debug')
            local Debug = loadType(tudb)
            local outputStr
            if tudb then
                outputStr = loadType(tudb).Log
            else
                local tc = scriptEnv:GetTypeByString('System.Console')
                outputStr = loadType(tc).WriteLine
            end
            function print(...)
                local args = {...}
                for i = 1, #args do
                    args[i] = tostring(args[i])
                end
                outputStr(table.concat(args, '\t'))
            end
            ");
        }
    }
}
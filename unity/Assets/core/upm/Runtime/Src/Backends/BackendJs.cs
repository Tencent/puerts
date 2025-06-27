/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;


namespace Puerts
{
    public abstract class BackendJs : Backend
    {
        private ILoader loader;

        public BackendJs(ILoader loader)
        {
            this.loader = loader;
        }
        public override IntPtr GetModuleExecutor(IntPtr env)
        {
            var papis = GetApi();
            var globalVal = PuertsNative.pesapi_global(papis, env);
            return PuertsNative.pesapi_get_property(papis, env, globalVal, "__puertsExecuteModule");
        }

        public override object GetLoader()
        {
            return loader;
        }

        public override void OnEnter(ScriptEnv scriptEnv)
        {
            string debugpath;
            string context = loader.ReadFile("puerts/esm_bootstrap.cjs", out debugpath);
            scriptEnv.Eval(context, debugpath);
            scriptEnv.ExecuteModule("puerts/init_il2cpp.mjs");
            scriptEnv.ExecuteModule("puerts/log.mjs");
            scriptEnv.ExecuteModule("puerts/csharp.mjs");

            scriptEnv.ExecuteModule("puerts/events.mjs");
            scriptEnv.ExecuteModule("puerts/timer.mjs");
            scriptEnv.ExecuteModule("puerts/promises.mjs");

            scriptEnv.ExecuteModule("puerts/websocketpp.mjs");
        }
    }
}
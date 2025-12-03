/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
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
            // TODO: 查下不禁用为什么会触发如下异常：
            // RuntimeError: table index is out of bounds
            //      at Type_GetMethod_m66AD062187F19497DBCA900823B0C268322DC231(http://localhost:50160/Build/webglbin.wasm:wasm-function[Type_GetMethod_m66AD062187F19497DBCA900823B0C268322DC231@27681]:0x71e8a2)
            //      at ScriptEnv_LoadAddon_m4A27319E673FE42F298B69E1FD43A099F293E7A3(http://localhost:50160/Build/webglbin.wasm:wasm-function[ScriptEnv_LoadAddon_m4A27319E673FE42F298B69E1FD43A099F293E7A3@38978]:0xbe718a)
#if !UNITY_WEBGL || UNITY_EDITOR
            scriptEnv.ExecuteModule("puerts/websocketpp.mjs");
#endif
        }
    }
}
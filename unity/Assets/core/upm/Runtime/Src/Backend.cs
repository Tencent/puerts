/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;


namespace Puerts
{
    public enum BackendType : int
    {
        V8 = 0,
        Node = 1,
        QuickJS = 2,
        Auto = 3
    }

    public abstract class Backend
    {
        public abstract int GetApiVersion();

        public abstract IntPtr CreateEnvRef();

        public abstract IntPtr GetApi();

        public abstract IntPtr GetModuleExecutor(IntPtr env);

        public abstract object GetLoader();

        public virtual void OnEnter(ScriptEnv scriptEnv)
        {
        }

        public virtual void OnTick()
        { 
        }

        public virtual void OnExit(ScriptEnv scriptEnv)
        {
        }

        public abstract void DestroyEnvRef(IntPtr envRef);

        public abstract void LowMemoryNotification();

        public virtual void RemoteDebuggerListen(int port)
        {
        }

        public virtual bool DebuggerTick()
        {
            return true;
        }

        public virtual void CloseRemoteDebugger()
        {
        }
    }

    public abstract class BackendJs: Backend
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

    public class BackendV8 : BackendJs
    {
        IntPtr isolate;

        public BackendV8(ILoader loader) : base(loader) { }

        public override int GetApiVersion()
        {
            return PapiV8Native.GetV8PapiVersion();
        }

        public override IntPtr CreateEnvRef()
        {
            var envRef = PapiV8Native.CreateV8PapiEnvRef();
            isolate = PapiV8Native.GetV8Isolate(envRef);
            return envRef;
        }

        public override IntPtr GetApi()
        {
            return PapiV8Native.GetV8FFIApi();
        }

        public override void OnTick() 
        {
            PapiV8Native.LogicTick(isolate);
        }


        public override void DestroyEnvRef(IntPtr envRef) 
        {
            PapiV8Native.DestroyV8PapiEnvRef(envRef);
        }

        public bool IdleNotificationDeadline(double DeadlineInSeconds)
        {
            return PapiV8Native.IdleNotificationDeadline(isolate, DeadlineInSeconds);
        }

        public override void LowMemoryNotification()
        {
            PapiV8Native.LowMemoryNotification(isolate);
        }

        public void RequestMinorGarbageCollectionForTesting()
        {
            PapiV8Native.RequestMinorGarbageCollectionForTesting(isolate);
        }

        public void RequestFullGarbageCollectionForTesting()
        {
            PapiV8Native.RequestFullGarbageCollectionForTesting(isolate);
        }

        public void TerminateExecution()
        {
            PapiV8Native.TerminateExecution(isolate);
        }

        public override void RemoteDebuggerListen(int debugPort)
        {
            PapiV8Native.CreateInspector(isolate, debugPort);
        }

        public override bool DebuggerTick()
        {
            return PapiV8Native.InspectorTick(isolate);
        }

        public override void CloseRemoteDebugger()
        {
            PapiV8Native.DestroyInspector(isolate);
        }
    }

    public class BackendNodeJS : BackendV8
    {
        public BackendNodeJS(ILoader loader) : base(loader) { }
    }

    public class BackendQuickJS : BackendJs
    {
        private IntPtr envRef;
        public BackendQuickJS(ILoader loader) : base(loader) { }

        public override int GetApiVersion()
        {
            return PapiQjsNative.GetQjsPapiVersion();
        }

        public override IntPtr CreateEnvRef()
        {
            envRef = PapiQjsNative.CreateQjsPapiEnvRef();
            return envRef;
        }

        public override IntPtr GetApi()
        {
            return PapiQjsNative.GetQjsFFIApi();
        }

        public override void DestroyEnvRef(IntPtr envRef)
        {
            PapiQjsNative.DestroyQjsPapiEnvRef(envRef);
        }

        public override void LowMemoryNotification()
        {
            PapiQjsNative.RunGC(envRef);
        }
    }
}
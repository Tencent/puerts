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

        public virtual void Tick(){ }

        public virtual bool DebuggerTick()
        {
            return true;
        }

        public abstract void DestroyEnvRef(IntPtr envRef);

        public abstract void LowMemoryNotification();
    }

    public abstract class BackendJs : Backend
    {
        public override IntPtr GetModuleExecutor(IntPtr env)
        {
            var papis = GetApi();
            var globalVal = PuertsNative.pesapi_global(papis, env);
            return PuertsNative.pesapi_get_property(papis, env, globalVal, "__puertsExecuteModule");
        }
    }

    public class BackendV8 : BackendJs
    {
        IntPtr isolate;

        public BackendV8()
        {
        }

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

        public override bool DebuggerTick()
        {
            return PapiV8Native.InspectorTick(isolate);
        }

        public override void Tick() 
        {
            PapiV8Native.LogicTick(isolate);
        }


        public override void DestroyEnvRef(IntPtr envRef) 
        {
            PapiV8Native.DestroyV8PapiEnvRef(envRef);
        }

        public bool IdleNotificationDeadline(double DeadlineInSeconds)
        {
#if THREAD_SAFE
            lock(this) {
#endif
            return PapiV8Native.IdleNotificationDeadline(isolate, DeadlineInSeconds);
#if THREAD_SAFE
            }
#endif
        }

        public override void LowMemoryNotification()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            PapiV8Native.LowMemoryNotification(isolate);
#if THREAD_SAFE
            }
#endif
        }

        public void RequestMinorGarbageCollectionForTesting()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            PapiV8Native.RequestMinorGarbageCollectionForTesting(isolate);
#if THREAD_SAFE
            }
#endif
        }

        public void RequestFullGarbageCollectionForTesting()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            PapiV8Native.RequestFullGarbageCollectionForTesting(isolate);
#if THREAD_SAFE
            }
#endif
        }

        public void TerminateExecution()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            PapiV8Native.TerminateExecution(isolate);
#if THREAD_SAFE
            }
#endif
        }

    }

    public class BackendNodeJS : BackendV8
    {
        public BackendNodeJS()
        {
        }
    }

    public class BackendQuickJS : BackendJs
    {
        public BackendQuickJS()
        {
        }

        public override int GetApiVersion()
        {
            return PapiQjsNative.GetQjsPapiVersion();
        }

        public override IntPtr CreateEnvRef()
        {
            return PapiQjsNative.CreateQjsPapiEnvRef();
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
#if THREAD_SAFE
            lock(this) {
#endif
            // TODO
#if THREAD_SAFE
            }
#endif
        }
    }
}
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
        protected JsEnv env;
        public Backend(JsEnv env)
        {
            this.env = env;
        }

        public abstract IntPtr CreateEnvRef();

        public abstract IntPtr GetApi();

        public abstract void DestroyEnvRef(IntPtr envRef);

        public abstract void LowMemoryNotification();
    }

    public class BackendV8 : Backend
    {
        public BackendV8(JsEnv env) : base(env)
        {
        }

        public override IntPtr CreateEnvRef()
        {
            return PapiV8Native.CreateV8PapiEnvRef();
        }

        public override IntPtr GetApi()
        {
            return PapiV8Native.GetV8FFIApi();
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
            // TODO
            return false;
#if THREAD_SAFE
            }
#endif
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

        public void RequestMinorGarbageCollectionForTesting()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            // TODO
#if THREAD_SAFE
            }
#endif
        }

        public void RequestFullGarbageCollectionForTesting()
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

    public class BackendNodeJS : BackendV8
    {
        public BackendNodeJS(JsEnv env) : base(env)
        {
        }
    }

    public class BackendQuickJS : Backend
    {
        public BackendQuickJS(JsEnv env) : base(env)
        {
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
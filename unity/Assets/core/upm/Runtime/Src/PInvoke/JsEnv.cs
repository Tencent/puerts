/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if PUERTS_DISABLE_IL2CPP_OPTIMIZATION || (!PUERTS_IL2CPP_OPTIMIZATION && UNITY_IPHONE) || !ENABLE_IL2CPP

using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
#if CSHARP_7_3_OR_NEWER
using System.Threading.Tasks;
#endif

namespace Puerts
{
    public class JsEnv : IDisposable
    {
        internal readonly int Idx;

        internal ObjectPool objectPool;

        private readonly ILoader loader;

        public Backend Backend;

        public ScriptEnv innerEnv;

        protected int debugPort;

        internal Action OnDispose;

        public JsEnv() 
            : this(new DefaultLoader(), -1, BackendType.Auto, IntPtr.Zero, IntPtr.Zero)
        {
        }

        public JsEnv(ILoader loader, int debugPort = -1)
             : this(loader, debugPort, BackendType.Auto, IntPtr.Zero, IntPtr.Zero)
        {
        }

        public JsEnv(ILoader loader, IntPtr externalRuntime, IntPtr externalContext)
            : this(loader, -1, BackendType.Auto, externalRuntime, externalContext)
        {
        }

        public static BackendType DefaultBackendType = BackendType.Auto;

        private void InitApi(BackendType backendExpect, int apiVersionExpect)
        {
            if (backendExpect == BackendType.V8)
                Backend = new BackendV8();
            else if (backendExpect == BackendType.Node)
                Backend = new BackendNodeJS();
            else if (backendExpect == BackendType.QuickJS)
                Backend = new BackendQuickJS();
            else
            {
                throw new InvalidProgramException("unexpected backend: " + backendExpect);
            }
            if (Backend.GetApiVersion() != apiVersionExpect)
            {
                throw new InvalidProgramException("backend: version not match for" + backendExpect + ", expect " + apiVersionExpect + ", but got " + Backend.GetApiVersion());
            }
            innerEnv = new ScriptEnv(loader, debugPort, Backend);
        }

        public JsEnv(ILoader loader, int debugPort, BackendType backendExpect, IntPtr externalRuntime, IntPtr externalContext)
        {
#if !UNITY_EDITOR && UNITY_WEBGL
            if (jsEnvs.Count == 0) PuertsDLL.InitPuertsWebGL();
#endif
            const int libVersionExpect = 11;
            int libVersion = PuertsNative.GetPapiVersion();
            if (libVersion != libVersionExpect)
            {
                disposed = true;
                throw new InvalidProgramException("expect lib version " + libVersionExpect + ", but got " + libVersion);
            }
            PuertsNative.SetLogCallback(LogCallback, LogWarningCallback, LogErrorCallback);
            this.loader = loader;

            backendExpect = (backendExpect == BackendType.Auto) ? DefaultBackendType : backendExpect;
            if (backendExpect == BackendType.Auto)
            {
                bool found = false;
                for(int i = 0; i < (int)BackendType.Auto; ++i)
                {
                    try
                    {
                        InitApi((BackendType)i, libVersionExpect);
                        found = true;
                        break;
                    } catch { }
                }
                if (!found)
                {
                    disposed = true;
                    throw new InvalidProgramException("can not find one backend for auto");
                }
            }
            else
            {
                try
                {
                    InitApi(backendExpect, libVersionExpect);
                }
                catch (Exception e)
                {
                    disposed = true;
                    throw e;
                }
            }
        }

        [Obsolete]
        public T ExecuteModule<T>(string specifier, string exportee)
        {
            if (exportee == "" && typeof(T) != typeof(JSObject))
            {
                throw new Exception("T must be Puerts.JSObject when getting the module namespace");
            }
            JSObject jso = innerEnv.ExecuteModule(specifier);
            if (exportee == "") return (T)(object)jso;

            return jso.Get<T>(exportee);
        }
        public JSObject ExecuteModule(string specifier)
        {
            return innerEnv.ExecuteModule(specifier);
        }

        struct __NOTHING { };

        public void Eval(string chunk, string chunkName = "chunk")
        {
            innerEnv.Eval(chunk, chunkName);
        }

        public TResult Eval<TResult>(string chunk, string chunkName = "chunk")
        {
            return innerEnv.Eval<TResult>(chunk, chunkName);
        }

        public void UsingAction<T1>()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            // TODO
#if THREAD_SAFE
            }
#endif
        }

        public void UsingAction<T1, T2>()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            // TODO
#if THREAD_SAFE
            }
#endif
        }

        public void UsingAction<T1, T2, T3>()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            // TODO
#if THREAD_SAFE
            }
#endif
        }

        public void UsingAction<T1, T2, T3, T4>()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            // TODO
#if THREAD_SAFE
            }
#endif
        }

        public void UsingFunc<TResult>()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            // TODO
#if THREAD_SAFE
            }
#endif
        }

        public void UsingFunc<T1, TResult>()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            // TODO
#if THREAD_SAFE
            }
#endif
        }

        public void UsingFunc<T1, T2, TResult>()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            // TODO
#if THREAD_SAFE
            }
#endif
        }

        public void UsingFunc<T1, T2, T3, TResult>()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            // TODO
#if THREAD_SAFE
            }
#endif
        }

        public void UsingFunc<T1, T2, T3, T4, TResult>()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            // TODO
#if THREAD_SAFE
            }
#endif
        }

        public void SetDefaultBindingMode(BindingMode bindingMode)
        {
#if THREAD_SAFE
            lock(this) {
#endif
            // TODO
#if THREAD_SAFE
            }
#endif
        }

        public void AddRegisterInfoGetter(Type type, Func<TypeMapping.RegisterInfo> getter)
        {
#if THREAD_SAFE
            lock(this) {
#endif
            // TODO
#if THREAD_SAFE
            }
#endif
        }

        public Action TickHandler;

        public void Tick()
        {
            innerEnv.Tick();
        }

        public void WaitDebugger()
        {

        }

        [MonoPInvokeCallback(typeof(LogCallback))]
        public static void LogCallback(string msg)
        {
#if PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
            Console.WriteLine(msg);
#else
            UnityEngine.Debug.Log(msg);
#endif
        }

        [MonoPInvokeCallback(typeof(LogCallback))]
        public static void LogWarningCallback(string msg)
        {
#if PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
            Console.WriteLine(msg);
#else
            UnityEngine.Debug.LogWarning(msg);
#endif
        }

        [MonoPInvokeCallback(typeof(LogCallback))]
        public static void LogErrorCallback(string msg)
        {
#if PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
            Console.WriteLine(msg);
#else
            UnityEngine.Debug.LogError(msg);
#endif
        }

        ~JsEnv()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            Dispose(false);
#if THREAD_SAFE
            }
#endif
        }

        public void Dispose()
        {
            Dispose(true);
        }

        private bool disposed = false;

        protected virtual void Dispose(bool dispose)
        {
            if (disposed) return;

            try
            {
                if (OnDispose != null) OnDispose();
            }
            catch { }

            disposed = true;
            innerEnv.Dispose();
        }

    }
}

#endif




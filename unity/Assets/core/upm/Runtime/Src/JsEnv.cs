/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
#if CSHARP_7_3_OR_NEWER
using System.Threading.Tasks;
#endif

namespace Puerts
{
    public enum BackendType : int
    {
#if !UNITY_EDITOR && UNITY_WEBGL
        WebGL = 0,
        QuickJS = 1,
        Auto = 2
#else
        V8 = 0,
        Node = 1,
        QuickJS = 2,
        Auto = 3
#endif
    }

    [Obsolete("use ScriptEnv instead")]
    public class JsEnv : IDisposable
    {
        internal readonly int Idx;

        public Backend Backend;

        public ScriptEnv env;

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

#if !UNITY_EDITOR && UNITY_WEBGL
        public static BackendType DefaultBackendType = BackendType.WebGL;
#else
        public static BackendType DefaultBackendType = BackendType.Auto;
#endif

        private void InitInnerEnv(BackendType backendExpect, int apiVersionExpect, ILoader loader, int debugPort)
        {

#if !UNITY_EDITOR && UNITY_WEBGL
            if (backendExpect == BackendType.WebGL)
            {
                Backend = Activator.CreateInstance(Type.GetType("Puerts.BackendWebGL"), loader) as Backend;
            }
#else
            if (backendExpect == BackendType.V8)
            {
                Backend = Activator.CreateInstance(Type.GetType("Puerts.BackendV8"), loader) as Backend;
            }

            if (backendExpect == BackendType.Node)
            {
                Backend = Activator.CreateInstance(Type.GetType("Puerts.BackendNodeJS"), loader) as Backend;
            }
#endif
            if (backendExpect == BackendType.QuickJS)
            {
                Backend = Activator.CreateInstance(Type.GetType("Puerts.BackendQuickJS"), loader) as Backend;
            }
            if (Backend == null)
            {
                throw new InvalidProgramException("unexpected backend: " + backendExpect);
            }
            
            if (Backend.GetApiVersion() != apiVersionExpect)
            {
                throw new InvalidProgramException("backend: version not match for " + backendExpect + ", expect " + apiVersionExpect + ", but got " + Backend.GetApiVersion());
            }

            env = new ScriptEnv(Backend, debugPort);
        }

        public JsEnv(ILoader loader, int debugPort, BackendType backendExpect, IntPtr externalRuntime, IntPtr externalContext)
        {
            const int libVersionExpect = 11;
            int libVersion = PuertsNative.GetPapiVersion();
            if (libVersion != libVersionExpect)
            {
                disposed = true;
                throw new InvalidProgramException("expect lib version " + libVersionExpect + ", but got " + libVersion);
            }
            PuertsNative.SetLogCallback(LogCallback, LogWarningCallback, LogErrorCallback);
            this.debugPort = debugPort;

            backendExpect = (backendExpect == BackendType.Auto) ? DefaultBackendType : backendExpect;
            if (backendExpect == BackendType.Auto)
            {
                bool found = false;
                for(int i = 0; i < (int)BackendType.Auto; ++i)
                {
                    try
                    {
                        InitInnerEnv((BackendType)i, libVersionExpect, loader, debugPort);
                        found = true;
                        break;
                    } catch (Exception e){ }
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
                    InitInnerEnv(backendExpect, libVersionExpect, loader, debugPort);
                }
                catch (Exception e)
                {
                    disposed = true;
                    throw e;
                }
            }
        }

        public T ExecuteModule<T>(string specifier, string exportee)
        {
            if (exportee == "" && typeof(T) != typeof(ScriptObject))
            {
                throw new Exception("T must be Puerts.ScriptObject when getting the module namespace");
            }
            ScriptObject jso = env.ExecuteModule(specifier);
            if (exportee == "") return (T)(object)jso;

            return jso.Get<T>(exportee);
        }
        public ScriptObject ExecuteModule(string specifier)
        {
            return env.ExecuteModule(specifier);
        }

        public void Eval(string chunk, string chunkName = "chunk")
        {
            env.Eval(chunk, chunkName);
        }

        public TResult Eval<TResult>(string chunk, string chunkName = "chunk")
        {
            return env.Eval<TResult>(chunk, chunkName);
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

        public void Tick()
        {
            env.Tick();
        }

        public void WaitDebugger()
        {
            env.WaitDebugger();
        }

#if CSHARP_7_3_OR_NEWER
        public Task WaitDebuggerAsync()
        {
            return env.WaitDebuggerAsync();
        }
#endif

        [MonoPInvokeCallback(typeof(LogCallback))]
        public static void LogCallback(IntPtr msg)
        {
            var msgStr = Marshal.PtrToStringUTF8(msg) ?? string.Empty;
#if PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
            Console.WriteLine(msgStr);
#else
            UnityEngine.Debug.Log(msgStr);
#endif
        }

        [MonoPInvokeCallback(typeof(LogCallback))]
        public static void LogWarningCallback(IntPtr msg)
        {
            var msgStr = Marshal.PtrToStringUTF8(msg) ?? string.Empty;
#if PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
            Console.WriteLine(msgStr);
#else
            UnityEngine.Debug.LogWarning(msgStr);
#endif
        }

        [MonoPInvokeCallback(typeof(LogCallback))]
        public static void LogErrorCallback(IntPtr msg)
        {
            var msgStr = Marshal.PtrToStringUTF8(msg) ?? string.Empty;
#if PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
            Console.WriteLine(msgStr);
#else
            UnityEngine.Debug.LogError(msgStr);
#endif
        }

        public void Dispose()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            Dispose(true);
#if THREAD_SAFE
            }
#endif
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

            Backend.CloseRemoteDebugger();

            OnDispose = null;
            env.Dispose();
            disposed = true;
        }
    }
}

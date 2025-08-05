/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if UNITY_2020_1_OR_NEWER
#if !PUERTS_DISABLE_IL2CPP_OPTIMIZATION && ENABLE_IL2CPP

using System;
using System.Collections.Generic;
using System.Reflection;
using System.Runtime.InteropServices;
#if CSHARP_7_3_OR_NEWER
using System.Threading.Tasks;
#endif
using Puerts.TypeMapping;

namespace Puerts
{
    public class ScriptEnv : IDisposable
    {
        private static List<ScriptEnv> scriptEnvs = new List<ScriptEnv>();
        private static bool isInitialized = false;
        private static IntPtr registry = IntPtr.Zero;
        private static Type persistentObjectInfoType;
        private static MethodInfo extensionMethodGetMethodInfo;
        private readonly int Idx;
        IntPtr papis;
        IntPtr envRef;
        IntPtr nativeScriptObjectsRefsMgr;

        private Func<string, ScriptObject> moduleExecutor;

        protected int debugPort;

        public Backend backend;
        
        PuertsIl2cpp.ObjectPool objectPool = new PuertsIl2cpp.ObjectPool();

        [UnityEngine.Scripting.Preserve]
        private void Preserver() 
        {
            var p1 = typeof(Type).GetNestedTypes();
        }
        
        [UnityEngine.Scripting.Preserve]
        public object GetLoader() 
        {
            return backend.GetLoader();
        }
        
        private void InitApi(int apiVersionExpect)
        {
            envRef = backend.CreateEnvRef();
            papis = backend.GetApi();
            if (backend.GetApiVersion() != apiVersionExpect)
            {
                throw new InvalidProgramException("backend: version not match for " + backend.GetType() + ", expect " + apiVersionExpect + ", but got " + backend.GetApiVersion());
            }
        }

        public ScriptEnv(Backend backend, int debugPort = -1)
        {
            this.backend = backend;
            disposed = true;
            if (!isInitialized)
            {
                lock (scriptEnvs)
                {
                    if (!isInitialized)
                    {
                        //only once is enough
                        Puerts.NativeAPI.SetLogCallback(LogCallback, LogWarningCallback, LogErrorCallback);
                        IntPtr prapi = PuertsNative.GetRegisterApi();
                        var reg_api = Marshal.PtrToStructure<pesapi_reg_api>(prapi);
                        registry = reg_api.create_registry();
                        Puerts.NativeAPI.InitialPuerts(prapi, registry);
                        extensionMethodGetMethodInfo = typeof(PuertsIl2cpp.ExtensionMethodInfo).GetMethod("Get");
                        Puerts.NativeAPI.SetExtensionMethodGet(extensionMethodGetMethodInfo);

                        persistentObjectInfoType = typeof(Puerts.ScriptObject);
                        Puerts.NativeAPI.SetGlobalType_TypedValue(typeof(TypedValue));
                        Puerts.NativeAPI.SetGlobalType_ArrayBuffer(typeof(ArrayBuffer));
                        Puerts.NativeAPI.SetGlobalType_ScriptObject(typeof(ScriptObject));

                        PuertsIl2cpp.ExtensionMethodInfo.LoadExtensionMethodInfo();
                        isInitialized = true;
                    }
                }
            }

            const int libVersionExpect = 11;
            int libVersion = PuertsNative.GetPapiVersion();
            if (libVersion != libVersionExpect)
            {
                throw new InvalidProgramException("expect lib version " + libVersionExpect + ", but got " + libVersion);
            }

            try
            {
                InitApi(libVersionExpect);
            }
            catch (Exception e)
            {
                throw e;
            }
            disposed = false;
            lock (scriptEnvs)
            {
                Idx = scriptEnvs.Count;
                scriptEnvs.Add(this);
            }
            
            var objectPoolType = typeof(PuertsIl2cpp.ObjectPool);
            nativeScriptObjectsRefsMgr = Puerts.NativeAPI.InitialPapiEnvRef(papis, envRef, objectPool, objectPoolType.GetMethod("Add"), objectPoolType.GetMethod("Remove"));
            
            var scope = PuertsNative.pesapi_open_scope(papis, envRef);
            var env = PuertsNative.pesapi_get_env_from_ref(papis, envRef);
            var moduleExecutorFunc = this.backend.GetModuleExecutor(env);
            moduleExecutor = Puerts.NativeAPI.PValueToCSharp(papis, env, moduleExecutorFunc, typeof(Func<string, ScriptObject>)) as Func<string, ScriptObject>;
            PuertsNative.pesapi_close_scope(papis, scope);

            Puerts.NativeAPI.SetObjectToGlobal(papis, envRef, "scriptEnv", this);


            if (debugPort != -1) {
                backend.OpenRemoteDebugger(debugPort);
            }

            this.debugPort = debugPort;
            
            this.backend.OnEnter(this);
        }
        
        [MonoPInvokeCallback(typeof(Puerts.NativeAPI.LogCallback))]
        public static void LogCallback(string msg)
        {
#if PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
#else
            UnityEngine.Debug.Log(msg);
#endif
        }

        [MonoPInvokeCallback(typeof(Puerts.NativeAPI.LogCallback))]
        public static void LogWarningCallback(string msg)
        {
#if PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
#else
            UnityEngine.Debug.Log(msg);
#endif
        }

        [MonoPInvokeCallback(typeof(Puerts.NativeAPI.LogCallback))]
        public static void LogErrorCallback(string msg)
        {
#if PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
#else
            UnityEngine.Debug.Log(msg);
#endif
        }
        

        public void AddRegisterInfoGetter(Type type, Func<RegisterInfo> getter)
        {
#if THREAD_SAFE
            lock (this)
            {
#endif
            TypeRegister.AddRegisterInfoGetter(type, getter);
#if THREAD_SAFE
            }
#endif
        }
        public void SetDefaultBindingMode(BindingMode bindingMode)
        {
            TypeRegister.RegisterInfoManager.DefaultBindingMode = bindingMode;
        }

        [UnityEngine.Scripting.Preserve]
        public Type GetTypeByString(string className)
        {
            return PuertsIl2cpp.TypeUtils.GetType(className);
        }
        
        [UnityEngine.Scripting.Preserve]
        public void LoadAddon(string name)
        {
            Type type = PuertsIl2cpp.TypeUtils.GetType("Puerts." + name + "Native");
            type.GetMethod("Register").Invoke(null, new object[] { PuertsNative.GetRegisterApi(), registry });
        }

        public void Eval(string chunk, string chunkName = "chunk")
        {
            Puerts.NativeAPI.EvalInternal(papis, envRef, System.Text.Encoding.UTF8.GetBytes(chunk), chunkName, null);
        }

        public T Eval<T>(string chunk, string chunkName = "chunk")
        {
            return (T)Puerts.NativeAPI.EvalInternal(papis, envRef, System.Text.Encoding.UTF8.GetBytes(chunk), chunkName, typeof(T));
        }

        public T ExecuteModule<T>(string specifier, string exportee)
        {
            if (exportee == "" && typeof(T) != typeof(ScriptObject)) {
                throw new Exception("T must be Puerts.ScriptObject when getting the module namespace");
            }
            ScriptObject jso = moduleExecutor(specifier);
            
            if (exportee == "") return (T)(object)jso;
            
            return jso.Get<T>(exportee);
        }
        public ScriptObject ExecuteModule(string specifier)
        {
            return moduleExecutor(specifier);
        }

        public Action TickHandler;
        public void Tick()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            Puerts.NativeAPI.CleanupPendingKillScriptObjects(nativeScriptObjectsRefsMgr);
            if (debugPort == -1 || backend.DebuggerTick())
            {
#if CSHARP_7_3_OR_NEWER
                if (waitDebugerTaskSource != null)
                {
                    var tmp = waitDebugerTaskSource;
                    waitDebugerTaskSource = null;
                    tmp.SetResult(true);
                }
#endif
            }
            backend.OnTick();
            if (TickHandler != null) TickHandler();
#if THREAD_SAFE
            }
#endif
        }

        public void WaitDebugger()
        {
            if (debugPort == -1) return;
#if THREAD_SAFE
            lock(this) {
#endif
            while (!backend.DebuggerTick()) { }
#if THREAD_SAFE
            }
#endif
        }

#if CSHARP_7_3_OR_NEWER
        TaskCompletionSource<bool> waitDebugerTaskSource;
        public Task WaitDebuggerAsync()
        {
            if (debugPort == -1) return null;
            waitDebugerTaskSource = new TaskCompletionSource<bool>();
            return waitDebugerTaskSource.Task;
        }
#endif
        
        ~ScriptEnv()
        {
            Dispose(true);
        }

        public void Dispose()
        {
            Dispose(true);
        }

        private bool disposed = false;

        protected virtual void Dispose(bool dispose)
        {
            lock (this)
            {
                if (disposed) return;
                
                // void JS_FreeRuntime(JSRuntime *): assertion "list_empty(&rt->gc_obj_list)" failed in android
                TickHandler = null;
                moduleExecutor = null;
                System.GC.Collect();
                System.GC.WaitForPendingFinalizers();
                Puerts.NativeAPI.CleanupPendingKillScriptObjects(nativeScriptObjectsRefsMgr);
                
                backend.DestroyEnvRef(envRef);
                Puerts.NativeAPI.DestroyJSEnvPrivate(nativeScriptObjectsRefsMgr);
                nativeScriptObjectsRefsMgr = IntPtr.Zero;
                disposed = true;
            }
            lock (scriptEnvs)
            {
                scriptEnvs[Idx] = null;
            }
        }
        
        public void UsingAction<T1>() { }
        public void UsingAction<T1, T2>() { }
        public void UsingAction<T1, T2, T3>() { }
        public void UsingAction<T1, T2, T3, T4>() { }
        public void UsingFunc<TResult>() { }
        public void UsingFunc<T1, TResult>() { }
        public void UsingFunc<T1, T2, TResult>() { }
        public void UsingFunc<T1, T2, T3, TResult>() { }
        public void UsingFunc<T1, T2, T3, T4, TResult>() { }
    }
}

#endif
#endif
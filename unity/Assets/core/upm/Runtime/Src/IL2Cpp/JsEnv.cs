/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if UNITY_2020_1_OR_NEWER
#if (!PUERTS_DISABLE_IL2CPP_OPTIMIZATION && !UNITY_IPHONE || PUERTS_IL2CPP_OPTIMIZATION) && ENABLE_IL2CPP

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
    [UnityEngine.Scripting.Preserve]
    public class JsEnv : IDisposable
    {
        private static List<JsEnv> jsEnvs = new List<JsEnv>();
        private static bool isInitialized = false;
        private static Type persistentObjectInfoType;
        private static MethodInfo extensionMethodGetMethodInfo;
        private readonly int Idx;
        IntPtr apis;
        IntPtr nativeJsEnv;
        IntPtr nativePesapiEnv;
        IntPtr nativeScriptObjectsRefsMgr;

        private Func<string, JSObject> moduleExecutor;

        ILoader loader;

        protected int debugPort;

        public Backend Backend;
        
        PuertsIl2cpp.ObjectPool objectPool = new PuertsIl2cpp.ObjectPool();

        [UnityEngine.Scripting.Preserve]
        private void Preserver() 
        {
            var p1 = typeof(Type).GetNestedTypes();
        }
        
        [UnityEngine.Scripting.Preserve]
        public ILoader GetLoader() 
        {
            return loader;
        }

        public JsEnv(): this(new DefaultLoader(), -1) {}

        public JsEnv(ILoader loader, int debugPort = -1, BackendType backend = BackendType.Auto, IntPtr externalRuntime = default(IntPtr), IntPtr externalContext = default(IntPtr))
        {
            this.loader = loader;
            disposed = true;
            if (!isInitialized)
            {
#if !UNITY_EDITOR && UNITY_WEBGL
                PuertsDLL.InitPuertsWebGL();
#endif
                lock (jsEnvs)
                {
                    if (!isInitialized)
                    {
                        //only once is enough
                        Puerts.NativeAPI.SetLogCallback(LogCallback, LogWarningCallback, LogErrorCallback);
                        Puerts.NativeAPI.InitialPuerts(Puerts.NativeAPI.GetRegsterApi());
                        extensionMethodGetMethodInfo = typeof(PuertsIl2cpp.ExtensionMethodInfo).GetMethod("Get");
                        Puerts.NativeAPI.SetExtensionMethodGet(extensionMethodGetMethodInfo);

                        persistentObjectInfoType = typeof(Puerts.JSObject);
                        Puerts.NativeAPI.SetGlobalType_TypedValue(typeof(TypedValue));
                        Puerts.NativeAPI.SetGlobalType_ArrayBuffer(typeof(ArrayBuffer));
                        Puerts.NativeAPI.SetGlobalType_JSObject(typeof(JSObject));

                        PuertsIl2cpp.ExtensionMethodInfo.LoadExtensionMethodInfo();
                        isInitialized = true;
                    }
                }
            }
#if UNITY_WEBGL
            else
            {
                throw new InvalidOperationException("more than one JsEnv instance is not supported in WebGL");
            }
#endif

            nativeJsEnv = Puerts.PuertsDLL.CreateJSEngine((int)backend);
            if (nativeJsEnv == IntPtr.Zero)
            {
                throw new InvalidProgramException("create jsengine fail for " + backend);
            }
            int libBackend = Puerts.PuertsDLL.GetLibBackend(nativeJsEnv);
            if (libBackend == 2)
            {
                apis = Puerts.NativeAPI.GetQjsFFIApi();
                nativePesapiEnv = Puerts.NativeAPI.GetQjsPapiEnvRef(nativeJsEnv);
            }
            else
            {
#if UNITY_WEBGL
                apis = Puerts.NativeAPI.GetWebGLFFIApi();
                nativePesapiEnv = Puerts.NativeAPI.GetWebGLPapiEnvRef(nativeJsEnv);
                Puerts.NativeAPI.PreservePuertsCPP();
#else
                apis = Puerts.NativeAPI.GetV8FFIApi();
                nativePesapiEnv = Puerts.NativeAPI.GetV8PapiEnvRef(nativeJsEnv);
#endif
            }
            if (nativePesapiEnv == IntPtr.Zero)
            {
                throw new InvalidProgramException("create jsengine fail for " + backend);
            }
            disposed = false;
            var objectPoolType = typeof(PuertsIl2cpp.ObjectPool);
            nativeScriptObjectsRefsMgr = Puerts.NativeAPI.InitialPapiEnvRef(apis, nativePesapiEnv, objectPool, objectPoolType.GetMethod("Add"), objectPoolType.GetMethod("Remove"));

            Puerts.NativeAPI.SetObjectToGlobal(apis, nativePesapiEnv, "jsEnv", this);

            //可以DISABLE掉自动注册，通过手动调用PuertsStaticWrap.AutoStaticCodeRegister.Register(jsEnv)来注册
#if !DISABLE_AUTO_REGISTER
            const string AutoStaticCodeRegisterClassName = "PuertsStaticWrap.PuerRegisterInfo_Gen";
            var autoRegister = Type.GetType(AutoStaticCodeRegisterClassName, false);
            if (autoRegister == null)
            {
                foreach (var assembly in AppDomain.CurrentDomain.GetAssemblies())
                {
                    autoRegister = assembly.GetType(AutoStaticCodeRegisterClassName, false);
                    if (autoRegister != null) break;
                }
            }
            if (autoRegister != null)
            {
                var methodInfoOfRegister = autoRegister.GetMethod("AddRegisterInfoGetterIntoJsEnv");
                methodInfoOfRegister.Invoke(null, new object[] { this });
            }
#endif

            if (libBackend == 0) 
                Backend = new BackendV8(this);
            else if (libBackend == 1)
                Backend = new BackendNodeJS(this);
            else if (libBackend == 2)
                Backend = new BackendQuickJS(this);

            if (debugPort != -1) {
                Puerts.PuertsDLL.CreateInspector(nativeJsEnv, debugPort);    
            }
#if !UNITY_WEBGL
            string debugpath;
            string context = loader.ReadFile("puerts/esm_bootstrap.cjs", out debugpath);
            Eval(context, debugpath);
#endif
            ExecuteModule("puerts/init_il2cpp.mjs");
            ExecuteModule("puerts/log.mjs");
            ExecuteModule("puerts/csharp.mjs");
            
            ExecuteModule("puerts/events.mjs");
            ExecuteModule("puerts/timer.mjs");
            ExecuteModule("puerts/promises.mjs");
#if !UNITY_WEBGL
            ExecuteModule("puerts/websocketpp.mjs");
#endif

            this.debugPort = debugPort;
            // prevent c# gc, manual call Dispose if you release this
            lock (jsEnvs)
            {
                Idx = -1;
                for (int i = 0; i < jsEnvs.Count; i++)
                {
                    if (jsEnvs[i] == null)
                    {
                        Idx = i;
                        jsEnvs[Idx] = this;
                        break;
                    }
                }
                if (Idx == -1)
                {
                    Idx = jsEnvs.Count;
                    jsEnvs.Add(this);
                }
            }
            if (loader is IBuiltinLoadedListener)
                (loader as IBuiltinLoadedListener).OnBuiltinLoaded(this);
            
            pesapi_ffi ffi = Marshal.PtrToStructure<pesapi_ffi>(apis);
            var scope = ffi.open_scope(nativePesapiEnv);
            var env = ffi.get_env_from_ref(nativePesapiEnv);
            var func = ffi.create_function(env, FooImpl, IntPtr.Zero, null);
            var global = ffi.global(env);
            ffi.set_property(env, global, "CSharpFoo", func);
            ffi.close_scope(scope);
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
        
        static IntPtr storeCallback = IntPtr.Zero;
        
        [MonoPInvokeCallback(typeof(Puerts.pesapi_callback))]
        static void FooImpl(pesapi_ffi ffi, IntPtr info)
        {
            var env = ffi.get_env(info);
            
            IntPtr p0 = ffi.get_arg(info, 0);
            if (ffi.is_function(env, p0))
            {
                if (storeCallback == IntPtr.Zero)
                {
                    storeCallback = ffi.create_value_ref(env, p0, 0);
                }
                return;
            }
            
            if (storeCallback != IntPtr.Zero)
            {
                IntPtr func = ffi.get_value_from_ref(env, storeCallback);
                IntPtr[] argv = new IntPtr[2] {p0, ffi.get_arg(info, 1)};
                IntPtr res = ffi.call_function(env, func, IntPtr.Zero, 2, argv);
                int sum = ffi.get_value_int32(env, res);
                UnityEngine.Debug.Log(string.Format("callback result = {0}", sum));
                return;
            }
            
            int x = ffi.get_value_int32(env, p0);
            int y = ffi.get_value_int32(env, ffi.get_arg(info, 1));
            UnityEngine.Debug.Log(string.Format("CSharpFoo called, x = {0}, y = {1}", x, y));
            ffi.add_return(info, ffi.create_int32(env, x + y));
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

        public void Eval(string chunk, string chunkName = "chunk")
        {
            Puerts.NativeAPI.EvalInternal(apis, nativePesapiEnv, System.Text.Encoding.UTF8.GetBytes(chunk), chunkName, null);
        }

        public T Eval<T>(string chunk, string chunkName = "chunk")
        {
            return (T)Puerts.NativeAPI.EvalInternal(apis, nativePesapiEnv, System.Text.Encoding.UTF8.GetBytes(chunk), chunkName, typeof(T));
        }
        
        Func<string, Puerts.JSObject> GetModuleExecutor()
        {
            if (moduleExecutor == null) 
            {
                moduleExecutor = Puerts.NativeAPI.GetModuleExecutor(apis, nativePesapiEnv, typeof(Func<string, JSObject>)) as Func<string, JSObject>;
            }
            return moduleExecutor;
        }

        public T ExecuteModule<T>(string specifier, string exportee)
        {
            if (exportee == "" && typeof(T) != typeof(JSObject)) {
                throw new Exception("T must be Puerts.JSObject when getting the module namespace");
            }
            JSObject jso = GetModuleExecutor()(specifier);
            
            if (exportee == "") return (T)(object)jso;
            
            return jso.Get<T>(exportee);
        }
        public JSObject ExecuteModule(string specifier)
        {
            return GetModuleExecutor()(specifier);
        }

        public Action TickHandler;
        public void Tick()
        {
            Puerts.NativeAPI.CleanupPendingKillScriptObjects(nativeScriptObjectsRefsMgr);
            Puerts.PuertsDLL.InspectorTick(nativeJsEnv);
            Puerts.PuertsDLL.LogicTick(nativeJsEnv);
            if (TickHandler != null) TickHandler();
        }

        public void WaitDebugger()
        {
            if (debugPort == -1) return;
#if THREAD_SAFE
            lock(this) {
#endif
            while (!Puerts.PuertsDLL.InspectorTick(nativeJsEnv)) { }
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
        
        ~JsEnv()
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
                
                Puerts.NativeAPI.CleanupPapiEnvRef(apis, nativePesapiEnv);
                Puerts.PuertsDLL.DestroyJSEngine(nativeJsEnv);
                Puerts.NativeAPI.DestroyJSEnvPrivate(nativeScriptObjectsRefsMgr);
                nativeScriptObjectsRefsMgr = IntPtr.Zero;
                disposed = true;
            }
            lock (jsEnvs)
            {
                jsEnvs[Idx] = null;
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
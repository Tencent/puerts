/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if UNITY_2020_1_OR_NEWER
#if EXPERIMENTAL_IL2CPP_PUERTS && ENABLE_IL2CPP

using System;
using System.Collections.Generic;
using System.Reflection;
#if CSHARP_7_3_OR_NEWER
using System.Threading.Tasks;
#endif
using Puerts.TypeMapping;

namespace Puerts
{
    [UnityEngine.Scripting.Preserve]
    public class JsEnv : IDisposable
    {
        IntPtr nativeJsEnv;
        IntPtr nativePesapiEnv;

        // TypeRegister TypeRegister;

        Type persistentObjectInfoType;
        MethodInfo objectPoolAddMethodInfo;
        MethodInfo objectPoolRemoveMethodInfo;
        MethodInfo tryLoadTypeMethodInfo;

        PuertsIl2cpp.ObjectPool objectPool = new PuertsIl2cpp.ObjectPool();

        private Func<string, JSObject> moduleExecutor;

        ILoader loader;

        protected int debugPort;

        public Backend Backend;

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

        public IntPtr Isolate {
            get {
                return PuertsIl2cpp.NativeAPI.GetIsolate(nativeJsEnv);
            }
        }

        public JsEnv(): this(new DefaultLoader(), -1) {}

        public JsEnv(ILoader loader, int debugPort = -1)
        {
            this.loader = loader;

            //only once is enough
            PuertsIl2cpp.NativeAPI.SetLogCallback(PuertsIl2cpp.NativeAPI.Log);
            PuertsIl2cpp.NativeAPI.InitialPuerts(PuertsIl2cpp.NativeAPI.GetPesapiImpl());
            PuertsIl2cpp.NativeAPI.ExchangeAPI(PuertsIl2cpp.NativeAPI.GetUnityExports());
            tryLoadTypeMethodInfo = typeof(TypeRegister).GetMethod("RegisterNoThrow");
            PuertsIl2cpp.NativeAPI.SetTryLoadCallback(PuertsIl2cpp.NativeAPI.GetMethodInfoPointer(tryLoadTypeMethodInfo), PuertsIl2cpp.NativeAPI.GetMethodPointer(tryLoadTypeMethodInfo));

            persistentObjectInfoType = typeof(Puerts.JSObject);
            PuertsIl2cpp.NativeAPI.SetGlobalType_TypedValue(typeof(TypedValue));
            PuertsIl2cpp.NativeAPI.SetGlobalType_ArrayBuffer(typeof(ArrayBuffer));
            PuertsIl2cpp.NativeAPI.SetGlobalType_JSObject(typeof(JSObject));

            nativeJsEnv = PuertsIl2cpp.NativeAPI.CreateNativeJSEnv();
            nativePesapiEnv = PuertsIl2cpp.NativeAPI.GetPesapiEnvHolder(nativeJsEnv);

            //PuertsIl2cpp.NativeAPI.SetObjectPool(objectPool, typeof(PuertsIl2cpp.ObjectPool).GetMethod("Add")); //TODO: remove....
            objectPoolAddMethodInfo = typeof(PuertsIl2cpp.ObjectPool).GetMethod("Add");
            objectPoolRemoveMethodInfo = typeof(PuertsIl2cpp.ObjectPool).GetMethod("Remove");
            PuertsIl2cpp.NativeAPI.SetObjectPool(nativeJsEnv, PuertsIl2cpp.NativeAPI.GetMethodInfoPointer(objectPoolAddMethodInfo), PuertsIl2cpp.NativeAPI.GetMethodPointer(objectPoolAddMethodInfo),
                PuertsIl2cpp.NativeAPI.GetMethodInfoPointer(objectPoolRemoveMethodInfo), PuertsIl2cpp.NativeAPI.GetMethodPointer(objectPoolRemoveMethodInfo),
                PuertsIl2cpp.NativeAPI.GetObjectPointer(objectPool));

            PuertsIl2cpp.NativeAPI.SetObjectToGlobal(nativeJsEnv, "jsEnv", PuertsIl2cpp.NativeAPI.GetObjectPointer(this));

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

            if (PuertsIl2cpp.NativeAPI.GetLibBackend() == 0) 
                Backend = new BackendV8(this);
            else if (PuertsIl2cpp.NativeAPI.GetLibBackend() == 1)
                Backend = new BackendNodeJS(this);
            else if (PuertsIl2cpp.NativeAPI.GetLibBackend() == 2)
                Backend = new BackendQuickJS(this);

            PuertsIl2cpp.ExtensionMethodInfo.LoadExtensionMethodInfo();

            if (debugPort != -1) {
                PuertsIl2cpp.NativeAPI.CreateInspector(nativeJsEnv, debugPort);    
            }
            ExecuteModule("puerts/init_il2cpp.mjs");
            ExecuteModule("puerts/log.mjs");
            ExecuteModule("puerts/csharp.mjs");
            
            ExecuteModule("puerts/events.mjs");
            ExecuteModule("puerts/timer.mjs");
            ExecuteModule("puerts/promises.mjs");
            ExecuteModule("puerts/websocketpp.mjs");

            this.debugPort = debugPort;
            if (loader is IBuiltinLoadedListener)
                (loader as IBuiltinLoadedListener).OnBuiltinLoaded(this);
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
            PuertsIl2cpp.NativeAPI.EvalInternal(nativePesapiEnv, System.Text.Encoding.UTF8.GetBytes(chunk + '\0'), chunkName, null);
        }

        public T Eval<T>(string chunk, string chunkName = "chunk")
        {
            return (T)PuertsIl2cpp.NativeAPI.EvalInternal(nativePesapiEnv, System.Text.Encoding.UTF8.GetBytes(chunk + '\0'), chunkName, typeof(T));
        }

        public T ExecuteModule<T>(string specifier, string exportee)
        {
            if (exportee == "" && typeof(T) != typeof(JSObject)) {
                throw new Exception("T must be Puerts.JSObject when getting the module namespace");
            }
            if (moduleExecutor == null) moduleExecutor = PuertsIl2cpp.NativeAPI.GetModuleExecutor(nativePesapiEnv, typeof(Func<string, JSObject>));
            JSObject jso = moduleExecutor(specifier);
            
            return jso.Get<T>(exportee);
        }
        public JSObject ExecuteModule(string specifier)
        {
            if (moduleExecutor == null) moduleExecutor = PuertsIl2cpp.NativeAPI.GetModuleExecutor(nativePesapiEnv, typeof(Func<string, JSObject>));
            return moduleExecutor(specifier);
        }

        public Action TickHandler;
        public void Tick()
        {
            PuertsIl2cpp.NativeAPI.ReleasePendingJsObjects(nativeJsEnv);
            PuertsIl2cpp.NativeAPI.InspectorTick(nativeJsEnv);
            PuertsIl2cpp.NativeAPI.LogicTick(nativeJsEnv);
            if (TickHandler != null) TickHandler();
        }

        public void WaitDebugger()
        {
            if (debugPort == -1) return;
#if THREAD_SAFE
            lock(this) {
#endif
            while (!PuertsIl2cpp.NativeAPI.InspectorTick(nativeJsEnv)) { }
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
                // TODO: nativePesapiEnv release
                PuertsIl2cpp.NativeAPI.DestroyNativeJSEnv(nativeJsEnv);
                disposed = true;
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
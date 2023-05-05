/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if EXPERIMENTAL_IL2CPP_PUERTS && ENABLE_IL2CPP

using System;
using System.Reflection;
#if CSHARP_7_3_OR_NEWER
using System.Threading.Tasks;
#endif


namespace Puerts
{
    [UnityEngine.Scripting.Preserve]
    public class JsEnv : IDisposable
    {
        IntPtr nativeJsEnv;
        IntPtr nativePesapiEnv;

        Type persistentObjectInfoType;
        MethodInfo objectPoolAddMethodInfo;
        MethodInfo objectPoolRemoveMethodInfo;
        MethodInfo tryLoadTypeMethodInfo;

        PuertsIl2cpp.ObjectPool objectPool = new PuertsIl2cpp.ObjectPool();

        private Func<string, JSObject> moduleExecuter;
        private delegate T JSOGetter<T>(JSObject jso, string s);

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

        public JsEnv(): this(new DefaultLoader(), -1) {}

        public JsEnv(ILoader loader, int debugPort = -1)
        {
            this.loader = loader;

            //only once is enough
            PuertsIl2cpp.NativeAPI.SetLogCallback(PuertsIl2cpp.NativeAPI.Log);
            PuertsIl2cpp.NativeAPI.InitialPuerts(PuertsIl2cpp.NativeAPI.GetPesapiImpl());
            PuertsIl2cpp.NativeAPI.ExchangeAPI(PuertsIl2cpp.NativeAPI.GetUnityExports());
            tryLoadTypeMethodInfo = typeof(PuertsIl2cpp.NativeAPI).GetMethod("RegisterNoThrow");
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

            Eval(PathHelper.JSCode + @"
                var global = this;
                (function() {
                    var loader = jsEnv.GetLoader();
                    global.__puer_resolve_module_url__ = function(specifier, referer) {
                        const originSp = specifier;
                        if (!loader.Resolve) {
                            let s = !__puer_path__.isRelative(specifier) ? specifier : __puer_path__.normalize(__puer_path__.dirname(referer) + '/' + specifier)
                            if (loader.FileExists(s)) {
                                return s
                            } else {
                                throw new Error(`module not found in js: ${originSp}`);
                            }

                        } else {
                            let p = loader.Resolve(specifier, referer)
                            if (!p) {
                                throw new Error(`module not found in js: ${originSp}`);
                            }
                            return p;
                        }
                    }
                    global.__puer_resolve_module_content__ = function(specifier) {
                        const debugpathRef = [], contentRef = [];
                        const originSp = specifier;

                        return loader.ReadFile(specifier, debugpathRef);                    
                    }
                })();
            ");
            
            moduleExecuter = Eval<Func<string, JSObject>>("__puer_execute_module_sync__");

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

            this.debugPort = debugPort;
            if (loader is IBuiltinLoadedListener)
                (loader as IBuiltinLoadedListener).OnBuiltinLoaded(this);
        }

        [UnityEngine.Scripting.Preserve]
        public Type GetTypeByString(string className)
        {
            return PuertsIl2cpp.TypeUtils.GetType(className);
        }

        public void Eval(string chunk, string chunkName = "chunk")
        {
            PuertsIl2cpp.NativeAPI.EvalInternal(nativePesapiEnv, System.Text.Encoding.UTF8.GetBytes(chunk), chunkName, null);
        }

        public T Eval<T>(string chunk, string chunkName = "chunk")
        {
            return (T)PuertsIl2cpp.NativeAPI.EvalInternal(nativePesapiEnv, System.Text.Encoding.UTF8.GetBytes(chunk), chunkName, typeof(T));
        }

        public T ExecuteModule<T>(string specifier, string exportee)
        {
            if (exportee == "" && typeof(T) != typeof(JSObject)) {
                throw new Exception("T must be Puerts.JSObject when getting the module namespace");
            }
            JSObject jso = moduleExecuter(specifier);
            JSOGetter<T> getter = Eval<JSOGetter<T>>("(function (jso, str) { return jso[str]; });");
            return getter(jso, exportee);
        }
        public JSObject ExecuteModule(string specifier)
        {
            return moduleExecuter(specifier);
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

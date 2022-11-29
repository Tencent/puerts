/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if EXPERIMENTAL_IL2CPP_PUERTS && ENABLE_IL2CPP

using System;
using System.Reflection;


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

        public Backend Backend;
        
        [UnityEngine.Scripting.Preserve]
        public ILoader GetLoader() 
        {
            return loader;
        }

        public JsEnv(): this(new DefaultLoader()){}

        public JsEnv(ILoader loader)
        {
            this.loader = loader;
            //only once is enough
            PuertsIl2cpp.NativeAPI.SetLogCallback(PuertsIl2cpp.NativeAPI.Log);
            PuertsIl2cpp.NativeAPI.InitialPuerts(PuertsIl2cpp.NativeAPI.GetPesapiImpl());
            PuertsIl2cpp.NativeAPI.ExchangeAPI(PuertsIl2cpp.NativeAPI.GetUnityExports());
            tryLoadTypeMethodInfo = typeof(PuertsIl2cpp.NativeAPI).GetMethod("RegisterNoThrow");
            PuertsIl2cpp.NativeAPI.SetTryLoadCallback(PuertsIl2cpp.NativeAPI.GetMethodInfoPointer(tryLoadTypeMethodInfo), PuertsIl2cpp.NativeAPI.GetMethodPointer(tryLoadTypeMethodInfo));

            persistentObjectInfoType = typeof(Puerts.JSObject);
            PuertsIl2cpp.NativeAPI.SetPersistentObjectInfoType(persistentObjectInfoType);

            nativeJsEnv = PuertsIl2cpp.NativeAPI.CreateNativeJSEnv();
            nativePesapiEnv = PuertsIl2cpp.NativeAPI.GetPesapiEnvHolder(nativeJsEnv);

            //PuertsIl2cpp.NativeAPI.SetObjectPool(objectPool, typeof(PuertsIl2cpp.ObjectPool).GetMethod("Add")); //TODO: remove....
            objectPoolAddMethodInfo = typeof(PuertsIl2cpp.ObjectPool).GetMethod("Add");
            objectPoolRemoveMethodInfo = typeof(PuertsIl2cpp.ObjectPool).GetMethod("Remove");
            PuertsIl2cpp.NativeAPI.SetObjectPool(nativeJsEnv, PuertsIl2cpp.NativeAPI.GetMethodInfoPointer(objectPoolAddMethodInfo), PuertsIl2cpp.NativeAPI.GetMethodPointer(objectPoolAddMethodInfo),
                PuertsIl2cpp.NativeAPI.GetMethodInfoPointer(objectPoolRemoveMethodInfo), PuertsIl2cpp.NativeAPI.GetMethodPointer(objectPoolRemoveMethodInfo),
                PuertsIl2cpp.NativeAPI.GetObjectPointer(objectPool));

            PuertsIl2cpp.NativeAPI.SetObjectToGlobal(nativeJsEnv, "jsEnv", PuertsIl2cpp.NativeAPI.GetObjectPointer(this));

            Eval(@"
                var global = this;
                (function() {
                    var loader = jsEnv.GetLoader();
                    global.__puerts_resolve_module_content__ = function(specifier, refer) {
                        const debugpathRef = [], contentRef = [];
                        const originSp = specifier;
                        if (specifier = loader.Resolve(specifier, debugpathRef)) {
                            loader.ReadFile(specifier, contentRef);
                            return contentRef[0];
                        } else {
                            throw new Error(`module not found in js: ${originSp}`);
                        }
                    }
                })()
            ");
            moduleExecuter = Eval<Func<string, JSObject>>("__puer_execute_module_sync__");

            if (PuertsIl2cpp.NativeAPI.GetLibBackend() == 0) 
                Backend = new BackendV8(this);
            else if (PuertsIl2cpp.NativeAPI.GetLibBackend() == 1)
                Backend = new BackendNodeJS(this);
            else if (PuertsIl2cpp.NativeAPI.GetLibBackend() == 2)
                Backend = new BackendQuickJS(this);

            ExecuteModule("puerts/init_il2cpp.mjs");
            ExecuteModule("puerts/log.mjs");
            ExecuteModule("puerts/csharp.mjs");
            ExecuteModule("puerts/events.mjs");
        }

        [UnityEngine.Scripting.Preserve]
        public Type GetTypeByString(string className)
        {
            return PuertsIl2cpp.TypeUtils.GetType(className);
        }

        public void Eval(string chunk, string chunkName = "chunk")
        {
#if THREAD_SAFE
            lock(this) {
#endif
            PuertsIl2cpp.NativeAPI.EvalInternal(nativePesapiEnv, System.Text.Encoding.UTF8.GetBytes(chunk), chunkName, null);
#if THREAD_SAFE
            }
#endif
        }

        public T Eval<T>(string chunk, string chunkName = "chunk")
        {
#if THREAD_SAFE
            lock(this) {
#endif
            return (T)PuertsIl2cpp.NativeAPI.EvalInternal(nativePesapiEnv, System.Text.Encoding.UTF8.GetBytes(chunk), chunkName, typeof(T));
#if THREAD_SAFE
            }
#endif
        }

        public T ExecuteModule<T>(string specifier, string exportee)
        {
            if (typeof(T) == typeof(JSObject)) {
                throw new Exception("T must not be Puerts.JSObject. use ExecuteModule without generic please");
            }
            JSObject jso = moduleExecuter(specifier);
            JSOGetter<T> getter = Eval<JSOGetter<T>>("(function (jso, str) { return jso[str]; });");
            return getter(jso, exportee);
        }
        public JSObject ExecuteModule(string specifier)
        {
            return moduleExecuter(specifier);
        }
        
        ~JsEnv()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            Dispose(true);
#if THREAD_SAFE
            }
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
            lock (this)
            {
                if (disposed) return;
                // TODO: nativePesapiEnv release
                PuertsIl2cpp.NativeAPI.DestroyNativeJSEnv(nativeJsEnv);
                disposed = true;
            }
        }
    }
}

#endif

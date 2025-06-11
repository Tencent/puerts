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
    public delegate void JSFunctionCallback(IntPtr isolate, IntPtr info, IntPtr self, int argumentsLen);
    public delegate object JSConstructorCallback(IntPtr isolate, IntPtr info, int argumentsLen);

    public class JsEnv : IDisposable
    {
        public static List<JsEnv> jsEnvs = new List<JsEnv>();

        internal readonly int Idx;

        internal IntPtr isolate;

        internal ObjectPool objectPool;

        private readonly ILoader loader;

        public Backend Backend;

        IntPtr papis;
        pesapi_ffi apis;
        IntPtr envRef;

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

        public JsEnv(ILoader loader, int debugPort, BackendType backendExpect, IntPtr externalRuntime, IntPtr externalContext)
        {
#if !UNITY_EDITOR && UNITY_WEBGL
            if (jsEnvs.Count == 0) PuertsDLL.InitPuertsWebGL();
#endif
            const int libVersionExpect = 36;
            int libVersion = PuertsDLL.GetApiLevel();
            if (libVersion != libVersionExpect)
            {
                throw new InvalidProgramException("expect lib version " + libVersionExpect + ", but got " + libVersion);
            }
            PuertsDLL.SetLogCallback(LogCallback, LogWarningCallback, LogErrorCallback);
            this.loader = loader;
            
            if (externalRuntime != IntPtr.Zero)
            {
                isolate = PuertsDLL.CreateJSEngineWithExternalEnv((int)backendExpect, externalRuntime, externalContext);
            }
            else
            {
                isolate = PuertsDLL.CreateJSEngine((int)backendExpect);
            }

#if UNITY_WEBGL && !UNITY_EDITOR
            if (PuertsDLL.GetLibBackend(isolate) != 2 && jsEnvs.Count > 0)
            {
                disposed = true;
                throw new InvalidOperationException("more than one JsEnv instance is not supported in WebGL");
            }
#endif

            if (isolate == IntPtr.Zero)
            {
                disposed = true;
                throw new InvalidProgramException("create jsengine fail for " + backendExpect);
            }
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

            objectPool = new ObjectPool();

            BackendType backend = (BackendType)PuertsDLL.GetLibBackend(isolate);
            if (backend == BackendType.V8) 
                Backend = new BackendV8(this);
            else if (backend == BackendType.Node)
                Backend = new BackendNodeJS(this);
            else if (backend == BackendType.QuickJS)
                Backend = new BackendQuickJS(this);

            if (backend == BackendType.V8 || backend == BackendType.Node)
            {
                envRef = Puerts.NativeAPI.GetV8PapiEnvRef(isolate);
                papis = Puerts.NativeAPI.GetV8FFIApi();
            }
            else if (backend == BackendType.QuickJS)
            {
                envRef = Puerts.NativeAPI.GetQjsPapiEnvRef(isolate);
                papis = Puerts.NativeAPI.GetQjsFFIApi();
            }
            else
            {
                throw new InvalidProgramException("unexpected backend: " + backend);
            }

            apis = Marshal.PtrToStructure<pesapi_ffi>(papis);

            var scope = apis.open_scope(envRef);

            var env = apis.get_env_from_ref(envRef);

            apis.set_registry(env, TypeRegister.Instance.Registry);

            apis.set_env_private(env, new IntPtr(Idx));

            // 这个和析构函数不一样，比如一个原生对象，如果传指针，不用做对象的delete，但如果宿主是带gc的语言，还是要处理引用持有的问题
            // 不过析构那如果参数带上是否要析构，设计上可以不需要这个回调
            // onObjectReleaseRef还有另外一个设定是和enter那配合使用，enter返回个userdata（比如objectPool索引），在exit那使用
            onObjectReleaseRefDelegate = onObjectReleaseRef;
            apis.trace_native_object_lifecycle(env, null, onObjectReleaseRefDelegate);

            var globalVal = apis.global(env);

            var globalObj = ExpressionsWrap.Helpper.ScriptToNative_ScriptObject(papis, env, globalVal);
            moduleExecutor = globalObj.Get<Func<string, JSObject>>("__puertsExecuteModule");
            //TODO: dispose globalObj

            //var print = apis.create_function(env, Print, IntPtr.Zero, null);
            //logDelegate = ExpressionsWrap.BuildMethodWrap(typeof(UnityEngine.Debug), typeof(UnityEngine.Debug).GetMethod("Log", new[] { typeof(object) }), true);
            //var print = apis.create_function(env, logDelegate, IntPtr.Zero, null);
            //apis.set_property(env, globalVal, "print", print);

            var jsJsEnv = apis.native_object_to_value(env, new IntPtr(TypeRegister.Instance.FindOrAddTypeId(typeof(JsEnv))), new IntPtr(objectPool.FindOrAddObject(this)), false);
            apis.set_property(env, globalVal, "jsEnv", jsJsEnv);

            loadTypeDelegate = ExpressionsWrap.BuildMethodWrap(typeof(ExpressionsWrap.NativeType), typeof(ExpressionsWrap.NativeType).GetMethod(nameof(ExpressionsWrap.NativeType.LoadType)), true);
            var loadType = apis.create_function(env, loadTypeDelegate, IntPtr.Zero, null);
            apis.set_property(env, globalVal, "loadType", loadType);

            createFunctionDelegate = createFunction;
            var createFunc = apis.create_function(env, createFunctionDelegate, IntPtr.Zero, null);
            apis.set_property(env, globalVal, "createFunction", createFunc);

            apis.close_scope(scope);

            PuertsIl2cpp.ExtensionMethodInfo.LoadExtensionMethodInfo();

            string debugpath;
            string context = loader.ReadFile("puerts/esm_bootstrap.cjs", out debugpath);
            Eval(context, debugpath);
            ExecuteModule("puerts/init_il2cpp.mjs");
            ExecuteModule("puerts/log.mjs");
            ExecuteModule("puerts/csharp.mjs");

            ExecuteModule("puerts/events.mjs");
            ExecuteModule("puerts/timer.mjs");
            ExecuteModule("puerts/promises.mjs");

            ExecuteModule("puerts/websocketpp.mjs");
        }

        public ILoader GetLoader()
        {
            return loader;
        }

        //private pesapi_callback logDelegate;

        private pesapi_callback loadTypeDelegate;

        private pesapi_on_native_object_exit onObjectReleaseRefDelegate;

        private Func<string, JSObject> moduleExecutor;

        private void onObjectReleaseRef(IntPtr ptr, IntPtr classData, IntPtr envPrivate, IntPtr userdata)
        {
            objectPool.Remove(ptr.ToInt32());
        }

        public Type GetTypeByString(string className)
        {
            return PuertsIl2cpp.TypeUtils.GetType(className);
        }

        /*
        [MonoPInvokeCallback(typeof(pesapi_callback))]
        static void Print(IntPtr apis, IntPtr info)
        {
            var env = NativeAPI.pesapi_get_env(apis, info);
            var str = NativeAPI.pesapi_get_arg(apis, info, 0);
            if (!NativeAPI.pesapi_is_string(apis, env, str))
            {
                NativeAPI.pesapi_throw_by_string(apis, info, "invalid arguments to Print");
                return;
            }

            UIntPtr bufsize = UIntPtr.Zero;
            NativeAPI.pesapi_get_value_string_utf16(apis, env, str, null, ref bufsize);
            byte[] buf = new byte[bufsize.ToUInt32() * 2];
            NativeAPI.pesapi_get_value_string_utf16(apis, env, str, buf, ref bufsize);
            string msg = System.Text.Encoding.Unicode.GetString(buf);
            UnityEngine.Debug.Log(msg);
        }
        */

        [MonoPInvokeCallback(typeof(pesapi_callback))]
        void createFunction(IntPtr apis, IntPtr info)
        {
            var env = NativeAPI.pesapi_get_env(apis, info);
            var argc = NativeAPI.pesapi_get_args_len(apis, info);
            var methods = new List<System.Reflection.MethodInfo>();
            for(int i = 0; i < argc; ++i)
            {
                var arg = NativeAPI.pesapi_get_arg(apis, info, i);
                var method = ExpressionsWrap.GetNativeTranlator<System.Reflection.MethodInfo>()(apis, env, arg);
                if (method != null) methods.Add(method);
            }

            if (methods.Count > 0)
            {
                var wrap = ExpressionsWrap.BuildMethodWrap(methods[0].DeclaringType, methods.ToArray(), true);
                TypeRegister.Instance.callbacksCache.Add(wrap);
                pesapi_function_finalize functionFinalize = null;
                functionFinalize = (IntPtr apis, IntPtr data, IntPtr env_private) =>
                {
                    TypeRegister.Instance.callbacksCache.Remove(wrap);
                    TypeRegister.Instance.callbacksCache.Remove(functionFinalize);
                };
                TypeRegister.Instance.callbacksCache.Add(functionFinalize);
                NativeAPI.pesapi_add_return(apis, info, NativeAPI.pesapi_create_function(apis, env, wrap, IntPtr.Zero, functionFinalize));
            }
            else
            {
                NativeAPI.pesapi_add_return(apis, info, NativeAPI.pesapi_create_null(apis, env));
            }
        }

        pesapi_callback createFunctionDelegate;

        public T ExecuteModule<T>(string specifier, string exportee)
        {
#if THREAD_SAFE
            lock(this) {
#endif
            if (exportee == "" && typeof(T) != typeof(JSObject))
            {
                throw new Exception("T must be Puerts.JSObject when getting the module namespace");
            }
            JSObject jso = moduleExecutor(specifier);
            if (exportee == "") return (T)(object)jso;

            return jso.Get<T>(exportee);
#if THREAD_SAFE
            }
#endif
        }
        public JSObject ExecuteModule(string specifier)
        {
#if THREAD_SAFE
            lock(this) {
#endif
            return moduleExecutor(specifier);
#if THREAD_SAFE
            }
#endif
        }

        struct __NOTHING { };

        public void Eval(string chunk, string chunkName = "chunk")
        {
            Eval<__NOTHING>(chunk, chunkName);
        }

        public TResult Eval<TResult>(string chunk, string chunkName = "chunk")
        {
#if THREAD_SAFE
            lock(this) {
#endif
            var scope = apis.open_scope(envRef);
            try
            {

                var env = apis.get_env_from_ref(envRef);

                byte[] codeBuff = System.Text.Encoding.UTF8.GetBytes(chunk);
                var res = apis.eval(env, codeBuff, new UIntPtr((uint)codeBuff.Length), chunkName);

                if (apis.has_caught(scope))
                {
                    string msg = Marshal.PtrToStringUTF8(apis.get_exception_as_string(scope, true));
                    throw new InvalidOperationException(msg);
                }

                return typeof(__NOTHING) == typeof(TResult) ? default(TResult) : ExpressionsWrap.GetNativeTranlator<TResult>()(papis, env, res);
            }
            finally
            {
                apis.close_scope(scope);
            }
#if THREAD_SAFE
            }
#endif
        }

        public int Index
        {
            get
            {
                return Idx;
            }
        }

        private List<IntPtr> tickHandler = new List<IntPtr>();

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
#if THREAD_SAFE
            lock(this) {
#endif
            cleanupPendingKillScriptObjects();
            PuertsDLL.InspectorTick(isolate);
            PuertsDLL.LogicTick(isolate);
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
                while (!PuertsDLL.InspectorTick(isolate)) { }
#if THREAD_SAFE
            }
#endif
        }

#if CSHARP_7_3_OR_NEWER
        TaskCompletionSource<bool> waitDebugerTaskSource;
        public Task WaitDebuggerAsync()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            if (debugPort == -1) return null;
            waitDebugerTaskSource = new TaskCompletionSource<bool>();
            return waitDebugerTaskSource.Task;
#if THREAD_SAFE
            }
#endif
        }
#endif

        [MonoPInvokeCallback(typeof(LogCallback))]
        public static void LogCallback(string msg)
        {
#if PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
#else
            UnityEngine.Debug.Log(msg);
#endif
        }

        [MonoPInvokeCallback(typeof(LogCallback))]
        public static void LogWarningCallback(string msg)
        {
#if PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
#else
            UnityEngine.Debug.Log(msg);
#endif
        }

        [MonoPInvokeCallback(typeof(LogCallback))]
        public static void LogErrorCallback(string msg)
        {
#if PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
#else
            UnityEngine.Debug.Log(msg);
#endif
        }

        List<IntPtr> pendingKillScriptObjectRefs = new List<IntPtr>();

        internal void addPendingKillScriptObjects(IntPtr objRef)
        {
            lock (pendingKillScriptObjectRefs)
            {
                pendingKillScriptObjectRefs.Add(objRef);
                //UnityEngine.Debug.Log($"addPendingKillScriptObjects {objRef}");
            }
        }

        internal void cleanupPendingKillScriptObjects()
        {
            lock (pendingKillScriptObjectRefs)
            {
                if (pendingKillScriptObjectRefs.Count == 0) return;
                var scope = apis.open_scope(envRef);
                try
                {
                    var env = apis.get_env_from_ref(envRef);
                    while (pendingKillScriptObjectRefs.Count > 0)
                    {
                        var lastIndex = pendingKillScriptObjectRefs.Count - 1;
                        var objRef = pendingKillScriptObjectRefs[lastIndex];
                        pendingKillScriptObjectRefs.RemoveAt(lastIndex);

                        uint internal_field_count = 0;
                        IntPtr weakHandlePtr = apis.get_ref_internal_fields(objRef, out internal_field_count);
                        if (internal_field_count != 1)
                        {
                            throw new InvalidProgramException($"invalud internal fields count {internal_field_count}!");
                        }

                        IntPtr weakHandle = Marshal.PtrToStructure<IntPtr>(weakHandlePtr);

                        if (weakHandle != IntPtr.Zero)
                        {
                            var handle = GCHandle.FromIntPtr(weakHandle);
                            if (handle.Target == null)
                            {
                                var obj = apis.get_value_from_ref(env, objRef);
                                apis.set_private(env, obj, IntPtr.Zero);
                                //UnityEngine.Debug.Log($"cleanupPendingKillScriptObjects {objRef}");
                                apis.release_value_ref(objRef);
                            }
                        }
                    }
                }
                finally
                {
                    apis.close_scope(scope);
                }
            }
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
            lock (jsEnvs)
            {
                if (disposed) return;
                if (OnDispose != null) OnDispose();
                jsEnvs[Idx] = null;

                var scope = apis.open_scope(envRef);
                var env = apis.get_env_from_ref(envRef);
                apis.trace_native_object_lifecycle(env, null, null);
                apis.close_scope(scope);

                apis.release_env_ref(envRef);
                PuertsDLL.DestroyJSEngine(isolate);
                isolate = IntPtr.Zero;
                disposed = true;
            }
        }

        internal bool CheckLiveness(bool shouldThrow = true)
        {
            if (disposed && shouldThrow)
            {
                throw new InvalidOperationException("JsEnv has been disposed!");
            }
            return !disposed;
        }

    }
}

#endif




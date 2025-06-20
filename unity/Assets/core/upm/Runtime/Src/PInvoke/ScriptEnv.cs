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
    public class ScriptEnv : IDisposable
    {
        public static List<ScriptEnv> scriptEnvs = new List<ScriptEnv>();

        internal readonly int Idx;

        internal ObjectPool objectPool;

        private readonly ILoader loader;

        public Backend Backend;

        IntPtr papis;
        IntPtr envRef;

        protected int debugPort;

        internal Action OnDispose;

        public static BackendType DefaultBackendType = BackendType.Auto;

        private void InitApi(int apiVersionExpect)
        {
            if (Backend.GetApiVersion() != apiVersionExpect)
            {
                throw new InvalidProgramException("backend: version not match for " + Backend.GetType() + ", expect " + apiVersionExpect + ", but got " + Backend.GetApiVersion());
            }
            envRef = Backend.CreateEnvRef();
            papis = Backend.GetApi();
        }

        public ScriptEnv(ILoader loader, int debugPort, Backend backend)
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
            Backend = backend;

            try
            {
                InitApi(libVersionExpect);
            }
            catch (Exception e)
            {
                disposed = true;
                throw e;
            }
            //Console.Error.WriteLine($"++++++++++++++++++++++ {backendExpect} {Backend.GetType()}");

            lock (scriptEnvs)
            {
                Idx = scriptEnvs.Count;
                scriptEnvs.Add(this);
            }

            objectPool = new ObjectPool();

            var scope = PuertsNative.pesapi_open_scope(papis, envRef);

            var env = PuertsNative.pesapi_get_env_from_ref(papis, envRef);

            PuertsNative.pesapi_set_registry(papis, env, TypeRegister.Instance.Registry);

            PuertsNative.pesapi_set_env_private(papis, env, new IntPtr(Idx));

            // ���������������һ��������һ��ԭ�����������ָ�룬�����������delete������������Ǵ�gc�����ԣ�����Ҫ�������ó��е�����
            // ����������������������Ƿ�Ҫ����������Ͽ��Բ���Ҫ����ص�
            // onObjectReleaseRef��������һ���趨�Ǻ�enter�����ʹ�ã�enter���ظ�userdata������objectPool����������exit��ʹ��
            onObjectReleaseRefDelegate = onObjectReleaseRef;
            PuertsNative.pesapi_trace_native_object_lifecycle(papis, env, null, onObjectReleaseRefDelegate);

            var globalVal = PuertsNative.pesapi_global(papis, env);

            var moduleExecutorFunc = Backend.GetModuleExecutor(env);
            moduleExecutor = ExpressionsWrap.GetNativeTranlator<Func<string, JSObject>>()(papis, env, moduleExecutorFunc);

            logDelegate = ExpressionsWrap.BuildMethodWrap(typeof(Console), typeof(Console).GetMethod(nameof(Console.WriteLine), new[] { typeof(object) }), true);
            var print = PuertsNative.pesapi_create_function(papis, env, logDelegate, IntPtr.Zero, null);
            PuertsNative.pesapi_set_property(papis, env, globalVal, "print", print);

            var jsJsEnv = PuertsNative.pesapi_native_object_to_value(papis, env, new IntPtr(TypeRegister.Instance.FindOrAddTypeId(this.GetType())), new IntPtr(objectPool.FindOrAddObject(this)), false);
            PuertsNative.pesapi_set_property(papis, env, globalVal, "jsEnv", jsJsEnv);

            loadTypeDelegate = ExpressionsWrap.BuildMethodWrap(typeof(ExpressionsWrap.NativeType), typeof(ExpressionsWrap.NativeType).GetMethod(nameof(ExpressionsWrap.NativeType.LoadType)), true);
            var loadType = PuertsNative.pesapi_create_function(papis, env, loadTypeDelegate, IntPtr.Zero, null);
            PuertsNative.pesapi_set_property(papis, env, globalVal, "loadType", loadType);

            createFunctionDelegate = createFunction;
            var createFunc = PuertsNative.pesapi_create_function(papis, env, createFunctionDelegate, IntPtr.Zero, null);
            PuertsNative.pesapi_set_property(papis, env, globalVal, "createFunction", createFunc);

            PuertsNative.pesapi_close_scope(papis, scope);

            PuertsIl2cpp.ExtensionMethodInfo.LoadExtensionMethodInfo();

            if (debugPort != -1)
            {
                Backend.RemoteDebuggerListen(debugPort);
            }

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

        private pesapi_callback logDelegate;

        private pesapi_callback loadTypeDelegate;

        private pesapi_on_native_object_exit onObjectReleaseRefDelegate;

        private Func<string, JSObject> moduleExecutor;

        private void onObjectReleaseRef(IntPtr ptr, IntPtr classData, IntPtr envPrivate, IntPtr userdata)
        {
            try
            {
                objectPool.Remove(ptr.ToInt32());
            }
            catch
            {
                // ������������Ӧ����ô�ϱ��أ�
                //Console.Error.WriteLine($"onObjectReleaseRef for {ptr} throw {e}");
            }
        }

        public Type GetTypeByString(string className)
        {
            return PuertsIl2cpp.TypeUtils.GetType(className);
        }

        /*
        [MonoPInvokeCallback(typeof(pesapi_callback))]
        static void Print(IntPtr apis, IntPtr info)
        {
            var env = PuertsNative.pesapi_get_env(apis, info);
            var str = PuertsNative.pesapi_get_arg(apis, info, 0);
            if (!PuertsNative.pesapi_is_string(apis, env, str))
            {
                PuertsNative.pesapi_throw_by_string(apis, info, "invalid arguments to Print");
                return;
            }

            UIntPtr bufsize = UIntPtr.Zero;
            PuertsNative.pesapi_get_value_string_utf16(apis, env, str, null, ref bufsize);
            byte[] buf = new byte[bufsize.ToUInt32() * 2];
            PuertsNative.pesapi_get_value_string_utf16(apis, env, str, buf, ref bufsize);
            string msg = System.Text.Encoding.Unicode.GetString(buf);
            UnityEngine.Debug.Log(msg);
        }
        */

        [MonoPInvokeCallback(typeof(pesapi_callback))]
        void createFunction(IntPtr apis, IntPtr info)
        {
            var env = PuertsNative.pesapi_get_env(apis, info);
            var argc = PuertsNative.pesapi_get_args_len(apis, info);
            var methods = new List<System.Reflection.MethodInfo>();
            for (int i = 0; i < argc; ++i)
            {
                var arg = PuertsNative.pesapi_get_arg(apis, info, i);
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
                PuertsNative.pesapi_add_return(apis, info, PuertsNative.pesapi_create_function(apis, env, wrap, IntPtr.Zero, functionFinalize));
            }
            else
            {
                PuertsNative.pesapi_add_return(apis, info, PuertsNative.pesapi_create_null(apis, env));
            }
        }

        pesapi_callback createFunctionDelegate;

        [Obsolete]
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
            var scope = PuertsNative.pesapi_open_scope(papis, envRef);
            try
            {
                var env = PuertsNative.pesapi_get_env_from_ref(papis, envRef);
                byte[] codeBuff = System.Text.Encoding.UTF8.GetBytes(chunk);
                var res = PuertsNative.pesapi_eval(papis, env, codeBuff, new UIntPtr((uint)codeBuff.Length), chunkName);
                if (PuertsNative.pesapi_has_caught(papis, scope))
                {
                    IntPtr ptr = PuertsNative.pesapi_get_exception_as_string(papis, scope, true);
                    string msg = Marshal.PtrToStringUTF8(ptr);
                    throw new InvalidOperationException(msg);
                }
                return typeof(__NOTHING) == typeof(TResult) ? default(TResult) : ExpressionsWrap.GetNativeTranlator<TResult>()(papis, env, res);
            }
            finally
            {
                PuertsNative.pesapi_close_scope(papis, scope);
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
            if (Backend.DebuggerTick())
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
            Backend.Tick();
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
            while (!Backend.DebuggerTick()) { }
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
            // TODO: move to backend
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

        List<WeakReference<JSObject>> allocedJsObject = new List<WeakReference<JSObject>>();

        internal void addAllocedJsObject(JSObject obj)
        {
            foreach (var weakRef in allocedJsObject)
            {
                JSObject d;
                if (!weakRef.TryGetTarget(out d))
                {
                    weakRef.SetTarget(obj);
                    return;
                }
            }
            allocedJsObject.Add(new WeakReference<JSObject>(obj));
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
                var scope = PuertsNative.pesapi_open_scope(papis, envRef);
                try
                {
                    var env = PuertsNative.pesapi_get_env_from_ref(papis, envRef);
                    while (pendingKillScriptObjectRefs.Count > 0)
                    {
                        var lastIndex = pendingKillScriptObjectRefs.Count - 1;
                        var objRef = pendingKillScriptObjectRefs[lastIndex];
                        pendingKillScriptObjectRefs.RemoveAt(lastIndex);

                        JSObject.ReleaseObjRef(papis, env, objRef, false);
                    }
                }
                finally
                {
                    PuertsNative.pesapi_close_scope(papis, scope);
                }
            }
        }

        ~ScriptEnv()
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
            // quickjs void JS_FreeRuntime(JSRuntime *): assertion "list_empty(&rt->gc_obj_list)"
            TickHandler = null;
            moduleExecutor = null;
            GC.Collect();
            GC.WaitForPendingFinalizers();
            cleanupPendingKillScriptObjects();

            foreach (var weakRef in allocedJsObject)
            {
                JSObject obj;
                if (weakRef.TryGetTarget(out obj))
                {
                    obj.ForceDispose();
                }
            }
            allocedJsObject.Clear();

            var scope = PuertsNative.pesapi_open_scope(papis, envRef);
            var env = PuertsNative.pesapi_get_env_from_ref(papis, envRef);
            PuertsNative.pesapi_trace_native_object_lifecycle(papis, env, null, null);
            PuertsNative.pesapi_close_scope(papis, scope);

            Backend.DestroyEnvRef(envRef);
            disposed = true;

            lock (scriptEnvs)
            {
                scriptEnvs[Idx] = null;
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




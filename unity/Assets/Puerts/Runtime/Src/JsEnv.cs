/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if !EXPERIMENTAL_IL2CPP_PUERTS || !ENABLE_IL2CPP

using System;
using System.Collections.Generic;
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

        internal readonly GeneralGetterManager GeneralGetterManager;

        internal readonly GeneralSetterManager GeneralSetterManager;

        internal readonly TypeRegister TypeRegister = null;

        internal readonly GenericDelegateFactory genericDelegateFactory;

        internal readonly JSObjectFactory jsObjectFactory;

        internal IntPtr isolate;

        internal ObjectPool objectPool;

        private readonly ILoader loader;
        private bool loaderCanCheckESM;

        public Backend Backend;

#if UNITY_EDITOR
        public delegate void JsEnvCreateCallback(JsEnv env, ILoader loader, int debugPort);
        public delegate void JsEnvDisposeCallback(JsEnv env);
        public static JsEnvCreateCallback OnJsEnvCreate;
        public static JsEnvDisposeCallback OnJsEnvDispose;

        public int debugPort;
#endif

        internal Action OnDispose;

        public JsEnv() 
            : this(new DefaultLoader(), -1, IntPtr.Zero, IntPtr.Zero)
        {
        }

        public JsEnv(ILoader loader, int debugPort = -1)
             : this(loader, debugPort, IntPtr.Zero, IntPtr.Zero)
        {
        }

        public JsEnv(ILoader loader, IntPtr externalRuntime, IntPtr externalContext)
            : this(loader, -1, externalRuntime, externalContext)
        {
        }

        public JsEnv(ILoader loader, int debugPort, IntPtr externalRuntime, IntPtr externalContext)
        {
            const int libVersionExpect = 19;
            int libVersion = PuertsDLL.GetApiLevel();
            if (libVersion != libVersionExpect)
            {
                throw new InvalidProgramException("expect lib version " + libVersionExpect + ", but got " + libVersion);
            }
            // PuertsDLL.SetLogCallback(LogCallback, LogWarningCallback, LogErrorCallback);
            this.loader = loader;
            this.loaderCanCheckESM = loader is IModuleChecker;
            
            if (externalRuntime != IntPtr.Zero)
            {
                isolate = PuertsDLL.CreateJSEngineWithExternalEnv(externalRuntime, externalContext);
            }
            else
            {
                isolate = PuertsDLL.CreateJSEngine();
            }
            
            if (isolate == IntPtr.Zero)
            {
                throw new InvalidProgramException("create jsengine fail");
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
            TypeRegister = new TypeRegister(this);
            genericDelegateFactory = new GenericDelegateFactory(this);
            jsObjectFactory = new JSObjectFactory();

            GeneralGetterManager = new GeneralGetterManager();
            GeneralSetterManager = new GeneralSetterManager();

            if (PuertsDLL.GetLibBackend() == 0) 
                Backend = new BackendV8(this);
            else if (PuertsDLL.GetLibBackend() == 1)
                Backend = new BackendNodeJS(this);
            else if (PuertsDLL.GetLibBackend() == 2)
                Backend = new BackendQuickJS(this);

            // 注册JS对象通用GC回调
            PuertsDLL.SetGeneralDestructor(isolate, StaticCallbacks.GeneralDestructor);

            // 把JSEnv的id和Callback的id拼成一个long存起来，并将StaticCallbacks.JsEnvCallbackWrap注册给V8。而后通过StaticCallbacks.JsEnvCallbackWrap从long中取出函数和envid并调用。
            PuertsDLL.SetGlobalFunction(isolate, "__tgjsRegisterTickHandler", StaticCallbacks.JsEnvCallbackWrap, AddCallback(RegisterTickHandler));
            PuertsDLL.SetGlobalFunction(isolate, "__tgjsGetGenericMethod", StaticCallbacks.JsEnvCallbackWrap, AddCallback(GetGenericMethod));
            PuertsDLL.SetGlobalFunction(isolate, "__tgjsLoadType", StaticCallbacks.JsEnvCallbackWrap, AddCallback(LoadType));
            PuertsDLL.SetGlobalFunction(isolate, "__tgjsGetNestedTypes", StaticCallbacks.JsEnvCallbackWrap, AddCallback(GetNestedTypes));
            PuertsDLL.SetGlobalFunction(isolate, "__tgjsGetLoader", StaticCallbacks.JsEnvCallbackWrap, AddCallback(GetLoader));

            PuertsDLL.SetModuleResolver(isolate, StaticCallbacks.ModuleResolverCallback, Idx);

            //可以DISABLE掉自动注册，通过手动调用PuertsStaticWrap.AutoStaticCodeRegister.Register(jsEnv)来注册
#if !DISABLE_AUTO_REGISTER
            const string AutoStaticCodeRegisterClassName = "PuertsStaticWrap.AutoStaticCodeRegister";
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
                var methodInfoOfRegister = autoRegister.GetMethod("Register");
                methodInfoOfRegister.Invoke(null, new object[] { this });
            }
#endif
            TypeRegister.InitArrayTypeId(isolate);

            if (debugPort != -1)
            {
                PuertsDLL.CreateInspector(isolate, debugPort);
            }
            try 
            {
                ExecuteModule("puerts/init.mjs");
                ExecuteModule("puerts/log.mjs");
                ExecuteModule("puerts/csharp.mjs");
                ExecuteModule("puerts/events.mjs");
                
                if (externalContext == IntPtr.Zero || externalRuntime == IntPtr.Zero) 
                {
                    ExecuteModule("puerts/timer.mjs");
                    ExecuteModule("puerts/promises.mjs");
                }
                else 
                {
                    OnDispose += ExecuteModule<Action>("puerts/dispose.mjs", "default");
                }
#if !PUERTS_GENERAL
                if (!(Backend is BackendNodeJS)) 
                {
#endif
                    ExecuteModule("puerts/polyfill.mjs");
#if !PUERTS_GENERAL
                }
                else
                {
                    ExecuteModule("puerts/nodepatch.mjs");
                }
#endif
                ExecuteModule("puerts/cjsload.mjs");
                ExecuteModule("puerts/modular.mjs");

#if UNITY_EDITOR
                if (OnJsEnvCreate != null) 
                {
                    OnJsEnvCreate(this, loader, debugPort);
                }
                OnDispose += () => {
                    if (OnJsEnvDispose != null) 
                    {
                        OnJsEnvDispose(this);
                    }
                };
                this.debugPort = debugPort;
#endif
            } 
            catch (Exception ex)
            {
                Dispose();
                throw ex;
            }
        }

        internal string ResolveModuleContent(string identifer, out string pathForDebug) 
        {
            pathForDebug = identifer;
            if (identifer == "csharp" || identifer == "puerts") 
            {
                return String.Format("export default globalThis.{0}", identifer);
            }
            if (!loader.FileExists(identifer)) 
            {
                return null;
            }
            if (loaderCanCheckESM ? 
                !((IModuleChecker)loader).IsESM(identifer) :
                identifer.Length < 4 || !identifer.EndsWith(".mjs")
            )
            {
                pathForDebug = "";
                return String.Format(@"
                    export default puerts.require('{0}');

                ", identifer);
            } 
            else 
            {
                return loader.ReadFile(identifer, out pathForDebug);
            }
        }

        /**
        * execute the module and get the result
        * when exportee is null, get the module namespace
        * when exportee is not null, get the specified member of the module namespace
        *
        * example: JsEnv.ExecuteModule("main.mjs")
        */
        public T ExecuteModule<T>(string filename, string exportee = "")
        {
            if (exportee == "" && typeof(T) != typeof(JSObject)) {
                throw new Exception("T must be Puerts.JSObject when getting the module namespace");
            }
#if THREAD_SAFE
            lock(this) {
#endif
                IntPtr resultInfo = PuertsDLL.ExecuteModule(isolate, filename, exportee);
                if (resultInfo == IntPtr.Zero)
                {
                    string exceptionInfo = PuertsDLL.GetLastExceptionInfo(isolate);
                    throw new Exception(exceptionInfo);
                }
                T result = StaticTranslate<T>.Get(Idx, isolate, NativeValueApi.GetValueFromResult, resultInfo, false);
                PuertsDLL.ResetResult(resultInfo);

                return result;
#if THREAD_SAFE
            }
#endif
        }

        public void ExecuteModule(string filename)
        {
#if THREAD_SAFE
            lock(this) {
#endif
                IntPtr resultInfo = PuertsDLL.ExecuteModule(isolate, filename, null);
                if (resultInfo == IntPtr.Zero)
                {
                    string exceptionInfo = PuertsDLL.GetLastExceptionInfo(isolate);
                    throw new Exception(exceptionInfo);
                }
                PuertsDLL.ResetResult(resultInfo);
#if THREAD_SAFE
            }
#endif
        }

        public void Eval(string chunk, string chunkName = "chunk")
        {
#if THREAD_SAFE
            lock(this) {
#endif
            IntPtr resultInfo = PuertsDLL.EvalChecked(isolate, chunk, chunkName);
            if (resultInfo == IntPtr.Zero)
            {
                string exceptionInfo = PuertsDLL.GetLastExceptionInfo(isolate);
                throw new Exception(exceptionInfo);
            }
            PuertsDLL.ResetResult(resultInfo);
#if THREAD_SAFE
            }
#endif
        }

        public TResult Eval<TResult>(string chunk, string chunkName = "chunk")
        {
#if THREAD_SAFE
            lock(this) {
#endif
            IntPtr resultInfo = PuertsDLL.EvalChecked(isolate, chunk, chunkName);
            if (resultInfo == IntPtr.Zero)
            {
                string exceptionInfo = PuertsDLL.GetLastExceptionInfo(isolate);
                throw new Exception(exceptionInfo);
            }
            TResult result = StaticTranslate<TResult>.Get(Idx, isolate, NativeValueApi.GetValueFromResult, resultInfo, false);
            PuertsDLL.ResetResult(resultInfo);
            return result;
#if THREAD_SAFE
            }
#endif
        }

        public void ClearModuleCache ()
        {
            Eval("global.clearModuleCache()");
        }

        public static void ClearAllModuleCaches () 
        {
            lock (jsEnvs)
            {
                foreach (var jsEnv in jsEnvs)
                {
                    jsEnv.ClearModuleCache();
                }
            }
        }

        public void AddLazyStaticWrapLoader(Type type, Func<TypeRegisterInfo> lazyStaticWrapLoader)
        {
#if THREAD_SAFE
            lock (this)
            {
#endif
            TypeRegister.AddLazyStaticWrapLoader(type, lazyStaticWrapLoader);
#if THREAD_SAFE
            }
#endif
        }

        public void AddLazyStaticWrapLoaderGenericDefinition(Type typeDefinition, Type[] genericArgumentsType, Type wrapperDefinition)
        {
            
#if THREAD_SAFE
            lock (this)
            {
#endif
                TypeRegister.AddLazyStaticWrapLoaderGenericDefinition(typeDefinition, genericArgumentsType, wrapperDefinition);
#if THREAD_SAFE
            }
#endif
        }

        private readonly List<JSFunctionCallback> callbacks = new List<JSFunctionCallback>();

        internal void InvokeCallback(IntPtr isolate, int callbackIdx, IntPtr info, IntPtr self, int paramLen)
        {
            callbacks[callbackIdx](isolate, info, self, paramLen);
        }

        internal long AddCallback(JSFunctionCallback callback)
        {
            int callbackIdx = callbacks.Count;
            callbacks.Add(callback);
            return Utils.TwoIntToLong(Idx, callbackIdx);
        }

        private readonly List<JSConstructorCallback> constructorCallbacks = new List<JSConstructorCallback>();

        internal IntPtr InvokeConstructor(IntPtr isolate, int callbackIdx, IntPtr info, int paramLen)
        {
            object obj = constructorCallbacks[callbackIdx](isolate, info, paramLen);
            if (obj == null) return IntPtr.Zero;
            int objectId = objectPool.FindOrAddObject(obj);
            return new IntPtr(objectId);
        }

        internal long AddConstructor(JSConstructorCallback callback)
        {
            int callbackIdx = constructorCallbacks.Count;
            constructorCallbacks.Add(callback);
            return Utils.TwoIntToLong(Idx, callbackIdx);
        }

        internal void JsReleaseObject(int objectID)
        {
            objectPool.Remove(objectID);
            //if (obj != null) UnityEngine.Debug.Log("release " + obj + "(" + obj.GetHashCode() + ")");
        }

        void GetLoader(IntPtr isolate, IntPtr info, IntPtr self, int paramLen)
        {
            GeneralSetterManager.AnyTranslator(Idx, isolate, NativeValueApi.SetValueToResult, info, loader);
        }

        public void RegisterGeneralGetSet(Type type, GeneralGetter getter, GeneralSetter setter)
        {
            if (getter != null) GeneralGetterManager.RegisterGetter(type, getter);
            if (setter != null) GeneralSetterManager.RegisterSetter(type, setter);
        }
        
        //use by BlittableCopy
        public int GetTypeId(Type type)
        {
            return TypeRegister.GetTypeId(isolate, type);
        }

        internal GenericDelegate ToGenericDelegate(IntPtr ptr)
        {
            return genericDelegateFactory.ToGenericDelegate(ptr);
        }

        public int Index
        {
            get
            {
                return Idx;
            }
        }

        private List<IntPtr> tickHandler = new List<IntPtr>(); 
        
        void RegisterTickHandler(IntPtr isolate, IntPtr info, IntPtr self, int paramLen)
        {
            try
            {
                if (paramLen != 1)
                {
                    return;
                }

                IntPtr fn = IntPtr.Zero;
                var value1 = PuertsDLL.GetArgumentValue(info, 0);
                if (PuertsDLL.GetJsValueType(isolate, value1, false) == JsValueType.Function)
                {
                    fn = PuertsDLL.GetFunctionFromValue(isolate, value1, false);
                    if (fn == IntPtr.Zero)
                    {
                        return;
                    }
                    tickHandler.Add(fn);

                }
            }
            catch (Exception e)
            {
                PuertsDLL.ThrowException(isolate,
                    "registerTickHandler throw c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
            
        }

        Type GetTypeFromJs(IntPtr isolate, IntPtr info, IntPtr self, int paramLen)
        {
            Type type = null;
            var value = PuertsDLL.GetArgumentValue(info, 0);
            if (PuertsDLL.GetJsValueType(isolate, value, false) == JsValueType.String)
            {
                string classFullName = PuertsDLL.GetStringFromValue(isolate, value, false);
                var maybeType = TypeRegister.GetType(classFullName);
                if (paramLen == 1)
                {
                    type = maybeType;
                }
                else if (maybeType != null
                    && maybeType.IsGenericTypeDefinition
                    && maybeType.GetGenericArguments().Length == (paramLen - 1)) //泛型
                {
                    var genericArguments = new Type[paramLen - 1];
                    for (int i = 1; i < paramLen; i++)
                    {
                        value = PuertsDLL.GetArgumentValue(info, i);
                        if (PuertsDLL.GetJsValueType(isolate, value, false) != JsValueType.Function) return null;
                        var argTypeId = PuertsDLL.GetTypeIdFromValue(isolate, value, false);
                        if (argTypeId == -1) return null;
                        genericArguments[i - 1] = TypeRegister.GetType(argTypeId);
                    }
                    type = maybeType.MakeGenericType(genericArguments);
                }
            }
            else if (PuertsDLL.GetJsValueType(isolate, value, false) == JsValueType.NativeObject)
            {
                type = StaticTranslate<Type>.Get(Index, isolate, NativeValueApi.GetValueFromArgument, value, false);
            }

            return type;
        }

        void GetGenericMethod(IntPtr isolate, IntPtr info, IntPtr self, int paramLen)
        {
            try
            {
                if (paramLen < 3) {
                    throw new Exception("invalid arguments length");
                }
                var csTypeJSValue = PuertsDLL.GetArgumentValue(info, 0);
                if (PuertsDLL.GetJsValueType(isolate, csTypeJSValue, false) != JsValueType.NativeObject) {
                    throw new Exception("the class must be a constructor");
                }
                Type type = StaticTranslate<Type>.Get(Index, isolate, NativeValueApi.GetValueFromArgument, csTypeJSValue, false);
                string methodName = PuertsDLL.GetStringFromValue(isolate, PuertsDLL.GetArgumentValue(info, 1), false);
                
                var genericArguments = new Type[paramLen - 2];
                for (int i = 2; i < paramLen; i++)
                {
                    var value = PuertsDLL.GetArgumentValue(info, i);
                    if (PuertsDLL.GetJsValueType(isolate, value, false) != JsValueType.Function) 
                    {
                        throw new Exception("invalid Type for generic arguments " + (i - 2));
                    };
                    var argTypeId = PuertsDLL.GetTypeIdFromValue(isolate, value, false);
                    if (argTypeId == -1) 
                    {
                        throw new Exception("invalid Type for generic arguments " + (i - 2));
                    };
                    genericArguments[i - 2] = TypeRegister.GetType(argTypeId);
                }

                PuertsDLL.ReturnCSharpFunctionCallback(isolate, info, StaticCallbacks.JsEnvCallbackWrap, AddCallback(new GenericMethodWrap(methodName, this, type, genericArguments).Invoke));
            }
            catch(Exception e)
            {
                PuertsDLL.ThrowException(isolate, "GetGenericMethod throw c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }

        void LoadType(IntPtr isolate, IntPtr info, IntPtr self, int paramLen)
        {
            try
            {
                Type type = GetTypeFromJs(isolate, info, self, paramLen);
                
                if (type != null)
                {
                    int typeId = TypeRegister.GetTypeId(isolate, type);
                    PuertsDLL.ReturnClass(isolate, info, typeId);
                }
            }
            catch(Exception e)
            {
                PuertsDLL.ThrowException(isolate, "loadClass throw c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }

        void GetNestedTypes(IntPtr isolate, IntPtr info, IntPtr self, int paramLen)
        {
            try
            {
                Type type = GetTypeFromJs(isolate, info, self, paramLen);
                if (type != null)
                {
                    StaticTranslate<Type[]>.Set(Index, isolate, NativeValueApi.SetValueToResult, info, type.GetNestedTypes());
                }
            }
            catch (Exception e)
            {
                PuertsDLL.ThrowException(isolate, "GetNestedType throw c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }

        public void UsingAction<T1>()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            genericDelegateFactory.RegisterAction<T1>();
#if THREAD_SAFE
            }
#endif
        }

        public void UsingAction<T1, T2>()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            genericDelegateFactory.RegisterAction<T1, T2>();
#if THREAD_SAFE
            }
#endif
        }

        public void UsingAction<T1, T2, T3>()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            genericDelegateFactory.RegisterAction<T1, T2, T3>();
#if THREAD_SAFE
            }
#endif
        }

        public void UsingAction<T1, T2, T3, T4>()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            genericDelegateFactory.RegisterAction<T1, T2, T3, T4>();
#if THREAD_SAFE
            }
#endif
        }

        public void UsingFunc<TResult>()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            genericDelegateFactory.RegisterFunc<TResult>();
#if THREAD_SAFE
            }
#endif
        }

        public void UsingFunc<T1, TResult>()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            genericDelegateFactory.RegisterFunc<T1, TResult>();
#if THREAD_SAFE
            }
#endif
        }

        public void UsingFunc<T1, T2, TResult>()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            genericDelegateFactory.RegisterFunc<T1, T2, TResult>();
#if THREAD_SAFE
            }
#endif
        }

        public void UsingFunc<T1, T2, T3, TResult>()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            genericDelegateFactory.RegisterFunc<T1, T2, T3, TResult>();
#if THREAD_SAFE
            }
#endif
        }

        public void UsingFunc<T1, T2, T3, T4, TResult>()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            genericDelegateFactory.RegisterFunc<T1, T2, T3, T4, TResult>();
#if THREAD_SAFE
            }
#endif
        }

        public void Tick()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            CheckLiveness();
            ReleasePendingJSFunctions();
            ReleasePendingJSObjects();
            if (PuertsDLL.InspectorTick(isolate))
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
            PuertsDLL.LogicTick(isolate);
            foreach (var fn in tickHandler)
            {
                IntPtr resultInfo = PuertsDLL.InvokeJSFunction(fn, false);
                if (resultInfo==IntPtr.Zero)
                {
                    var exceptionInfo = PuertsDLL.GetFunctionLastExceptionInfo(fn);
                    throw new Exception(exceptionInfo);
                }
            }
#if THREAD_SAFE
            }
#endif
        }

        public void WaitDebugger()
        {
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
            waitDebugerTaskSource = new TaskCompletionSource<bool>();
            return waitDebugerTaskSource.Task;
        }
#endif

//         [MonoPInvokeCallback(typeof(LogCallback))]
//         private static void LogCallback(string msg)
//         {
// #if PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
// #else
//             UnityEngine.Debug.Log(msg);
// #endif
//         }

//         [MonoPInvokeCallback(typeof(LogCallback))]
//         private static void LogWarningCallback(string msg)
//         {
// #if PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
// #else
//             UnityEngine.Debug.Log(msg);
// #endif
//         }

//         [MonoPInvokeCallback(typeof(LogCallback))]
//         private static void LogErrorCallback(string msg)
//         {
// #if PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
// #else
//             UnityEngine.Debug.Log(msg);
// #endif
//         }

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
                PuertsDLL.DestroyJSEngine(isolate);
                isolate = IntPtr.Zero;
                disposed = true;
            }
        }

        internal void CheckLiveness()
        {
            if (disposed)
            {
                throw new InvalidOperationException("JsEnv had disposed!");
            }
        }

        Dictionary<IntPtr, int> funcRefCount = new Dictionary<IntPtr, int>();
        Dictionary<IntPtr, int> JSObjRefCount = new Dictionary<IntPtr, int>();

        internal void IncFuncRef(IntPtr nativeJsFuncPtr)
        {
            if (disposed || nativeJsFuncPtr == IntPtr.Zero) return;
            lock (funcRefCount)
            {
                int refCount;
                if (funcRefCount.TryGetValue(nativeJsFuncPtr, out refCount))
                {
                    ++refCount;
                }
                else
                {
                    refCount = 1;
                }
                funcRefCount[nativeJsFuncPtr] = refCount;
            }
        }

        internal void DecFuncRef(IntPtr nativeJsFuncPtr)
        {
            if (disposed || nativeJsFuncPtr == IntPtr.Zero) return;

            lock (funcRefCount)
            {
                funcRefCount[nativeJsFuncPtr] = funcRefCount[nativeJsFuncPtr] - 1;
            }
        }

        internal void IncJSObjRef(IntPtr nativeJSObjectPtr)
        {
            if (disposed || nativeJSObjectPtr == IntPtr.Zero) return;
            lock (JSObjRefCount)
            {
                int refCount;
                if (JSObjRefCount.TryGetValue(nativeJSObjectPtr, out refCount))
                {
                    ++refCount;
                }
                else
                {
                    refCount = 1;
                }
                JSObjRefCount[nativeJSObjectPtr] = refCount;
            }
        }

        internal void DecJSObjRef(IntPtr nativeJSObjectPtr)
        {
            if (disposed || nativeJSObjectPtr == IntPtr.Zero) return;

            lock (JSObjRefCount)
            {
                JSObjRefCount[nativeJSObjectPtr] = JSObjRefCount[nativeJSObjectPtr] - 1;
            }
        }

        List<IntPtr> pendingRemovedList = new List<IntPtr>();

        internal void ReleasePendingJSFunctions()
        {
            lock (funcRefCount)
            {
                pendingRemovedList.Clear();
                foreach (var kv in funcRefCount)
                {
                    if (kv.Value <= 0) pendingRemovedList.Add(kv.Key);
                }
                for(int i = 0; i  < pendingRemovedList.Count; ++i)
                {
                    var nativeJsFuncPtr = pendingRemovedList[i];
                    funcRefCount.Remove(nativeJsFuncPtr);
                    if (!genericDelegateFactory.IsJsFunctionAlive(nativeJsFuncPtr))
                    {
                        genericDelegateFactory.RemoveGenericDelegate(nativeJsFuncPtr);
                        PuertsDLL.ReleaseJSFunction(isolate, nativeJsFuncPtr);
                    }
                }
                pendingRemovedList.Clear();
            }
        }

        List<IntPtr> pendingRemovedJsObjList = new List<IntPtr>();

        internal void ReleasePendingJSObjects()
        {
            lock (JSObjRefCount)
            {
                pendingRemovedJsObjList.Clear();
                foreach (var kv in JSObjRefCount)
                {
                    if (kv.Value <= 0) pendingRemovedJsObjList.Add(kv.Key);
                }
                for(int i = 0; i  < pendingRemovedJsObjList.Count; ++i)
                {
                    var nativeJsObjPtr = pendingRemovedJsObjList[i];
                    JSObjRefCount.Remove(nativeJsObjPtr);
                    if (!jsObjectFactory.IsJsObjectAlive(nativeJsObjPtr))
                    {
                        jsObjectFactory.RemoveJSObject(nativeJsObjPtr);
                        PuertsDLL.ReleaseJSObject(isolate, nativeJsObjPtr);
                    }
                }
                pendingRemovedJsObjList.Clear();
            }
        }
    }
}

#endif

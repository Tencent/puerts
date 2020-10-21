/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;
using System.Collections.Generic;

namespace Puerts
{
    public delegate void FunctionCallback(IntPtr isolate, IntPtr info, IntPtr self, int argumentsLen);
    public delegate object ConstructorCallback(IntPtr isolate, IntPtr info, int argumentsLen);

    public class JsEnv : IDisposable
    {
        internal readonly int Idx;

        internal readonly GeneralGetterManager GeneralGetterManager;

        internal readonly GeneralSetterManager GeneralSetterManager;

        internal readonly TypeRegister TypeRegister = null;

        private readonly ILoader loader;

        internal static List<JsEnv> jsEnvs = new List<JsEnv>();

        internal IntPtr isolate;

        internal ObjectPool objectPool;

        public JsEnv() : this(new DefaultLoader(), -1)
        {
        }

        public JsEnv(ILoader loader, int debugPort = -1)
        {
            const int libVersionExpect = 7;
            int libVersion = PuertsDLL.GetLibVersion();
            if (libVersion != libVersionExpect)
            {
                throw new InvalidProgramException("expect lib version " + libVersionExpect + ", but got " + libVersion);
            }
            //PuertsDLL.SetLogCallback(LogCallback, LogWarningCallback, LogErrorCallback);
            this.loader = loader;
            isolate = PuertsDLL.CreateJSEngine();
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

            GeneralGetterManager = new GeneralGetterManager(this);
            GeneralSetterManager = new GeneralSetterManager(this);

            PuertsDLL.SetGeneralDestructor(isolate, StaticCallbacks.GeneralDestructor);

            TypeRegister.InitArrayTypeId(isolate);

            PuertsDLL.SetGlobalFunction(isolate, "__tgjsRegisterTickHandler", StaticCallbacks.JsEnvCallbackWrap, AddCallback(RegisterTickHandler));
            PuertsDLL.SetGlobalFunction(isolate, "__tgjsLoadType", StaticCallbacks.JsEnvCallbackWrap, AddCallback(LoadType));
            PuertsDLL.SetGlobalFunction(isolate, "__tgjsGetNestedTypes", StaticCallbacks.JsEnvCallbackWrap, AddCallback(GetNestedTypes));
            PuertsDLL.SetGlobalFunction(isolate, "__tgjsGetLoader", StaticCallbacks.JsEnvCallbackWrap, AddCallback(GetLoader));

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

            if (debugPort != -1)
            {
                PuertsDLL.CreateInspector(isolate, debugPort);
            }

            ExecuteFile("puerts/init.js");
            ExecuteFile("puerts/log.js");
            ExecuteFile("puerts/cjsload.js");
            ExecuteFile("puerts/modular.js");
            ExecuteFile("puerts/csharp.js");
            ExecuteFile("puerts/timer.js");
            ExecuteFile("puerts/events.js");
            ExecuteFile("puerts/promises.js");
            ExecuteFile("puerts/polyfill.js");
        }

        void ExecuteFile(string filename)
        {
            if (loader.FileExists(filename))
            {
                string debugPath;
                var context = loader.ReadFile(filename, out debugPath);
                if (context == null)
                {
                    throw new InvalidProgramException("can not find " + filename);
                }
                Eval(context, debugPath);
            }
            else
            {
                throw new InvalidProgramException("can not find " + filename);
            }
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

        private readonly List<FunctionCallback> callbacks = new List<FunctionCallback>();

        internal void InvokeCallback(IntPtr isolate, int callbackIdx, IntPtr info, IntPtr self, int paramLen)
        {
            callbacks[callbackIdx](isolate, info, self, paramLen);
        }

        internal long AddCallback(FunctionCallback callback)
        {
            int callbackIdx = callbacks.Count;
            callbacks.Add(callback);
            return Utils.TwoIntToLong(Idx, callbackIdx);
        }

        private readonly List<ConstructorCallback> constructorCallbacks = new List<ConstructorCallback>();

        internal IntPtr InvokeConstructor(IntPtr isolate, int callbackIdx, IntPtr info, int paramLen)
        {
            object obj = constructorCallbacks[callbackIdx](isolate, info, paramLen);
            if (obj == null) return IntPtr.Zero;
            int objectId = objectPool.FindOrAddObject(obj);
            return new IntPtr(objectId);
        }

        internal long AddConstructor(ConstructorCallback callback)
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
            GeneralSetterManager.AnyTranslator(isolate, NativeValueApi.SetValueToResult, info, loader);
        }

        public void RegisterGeneralGetSet(Type type, GeneralGetter getter, GeneralSetter setter)
        {
            GeneralGetterManager.RegisterGetter(type, getter);
            GeneralSetterManager.RegisterSetter(type, setter);
        }
        
        //use by BlittableCopy
        public int GetTypeId(Type type)
        {
            return TypeRegister.GetTypeId(isolate, type);
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
            GeneralGetterManager.genericDelegateFactory.RegisterAction<T1>();
#if THREAD_SAFE
            }
#endif
        }

        public void UsingAction<T1, T2>()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            GeneralGetterManager.genericDelegateFactory.RegisterAction<T1, T2>();
#if THREAD_SAFE
            }
#endif
        }

        public void UsingAction<T1, T2, T3>()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            GeneralGetterManager.genericDelegateFactory.RegisterAction<T1, T2, T3>();
#if THREAD_SAFE
            }
#endif
        }

        public void UsingAction<T1, T2, T3, T4>()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            GeneralGetterManager.genericDelegateFactory.RegisterAction<T1, T2, T3, T4>();
#if THREAD_SAFE
            }
#endif
        }

        public void UsingFunc<TResult>()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            GeneralGetterManager.genericDelegateFactory.RegisterFunc<TResult>();
#if THREAD_SAFE
            }
#endif
        }

        public void UsingFunc<T1, TResult>()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            GeneralGetterManager.genericDelegateFactory.RegisterFunc<T1, TResult>();
#if THREAD_SAFE
            }
#endif
        }

        public void UsingFunc<T1, T2, TResult>()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            GeneralGetterManager.genericDelegateFactory.RegisterFunc<T1, T2, TResult>();
#if THREAD_SAFE
            }
#endif
        }

        public void UsingFunc<T1, T2, T3, TResult>()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            GeneralGetterManager.genericDelegateFactory.RegisterFunc<T1, T2, T3, TResult>();
#if THREAD_SAFE
            }
#endif
        }

        public void UsingFunc<T1, T2, T3, T4, TResult>()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            GeneralGetterManager.genericDelegateFactory.RegisterFunc<T1, T2, T3, T4, TResult>();
#if THREAD_SAFE
            }
#endif
        }

        public void LowMemoryNotification()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            PuertsDLL.LowMemoryNotification(isolate);
#if THREAD_SAFE
            }
#endif
        }

        public void Tick()
        {
#if THREAD_SAFE
            lock(this) {
#endif
            ReleasePendingJSFunctions();
            PuertsDLL.InspectorTick(isolate);
            tickHandler.ForEach(fn =>
            {
                IntPtr resultInfo = PuertsDLL.InvokeJSFunction(fn, false);
                if (resultInfo==IntPtr.Zero)
                {
                    var exceptionInfo = PuertsDLL.GetFunctionLastExceptionInfo(fn);
                    throw new Exception(exceptionInfo);
                }

            });
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

        /*[MonoPInvokeCallback(typeof(LogCallback))]
        private static void LogCallback(string msg)
        {
            UnityEngine.Debug.Log(msg);
        }

        [MonoPInvokeCallback(typeof(LogCallback))]
        private static void LogWarningCallback(string msg)
        {
            UnityEngine.Debug.LogWarning(msg);
        }

        [MonoPInvokeCallback(typeof(LogCallback))]
        private static void LogErrorCallback(string msg)
        {
            UnityEngine.Debug.LogError(msg);
        }*/

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

        Queue<IntPtr> jsFuncQueue = new Queue<IntPtr>();

        internal void EnqueueJSFunction(IntPtr nativeJsFuncPtr)
        {
            if (disposed || nativeJsFuncPtr == IntPtr.Zero) return;

            lock (jsFuncQueue)
            {
                jsFuncQueue.Enqueue(nativeJsFuncPtr);
            }
        }

        internal void ReleasePendingJSFunctions()
        {
            lock (jsFuncQueue)
            {
                while (jsFuncQueue.Count > 0)
                {
                    IntPtr nativeJsFuncPtr = jsFuncQueue.Dequeue();
                    PuertsDLL.ReleaseJSFunction(isolate, nativeJsFuncPtr);
                }
            }
        }
    }
}
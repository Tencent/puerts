﻿/*
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

        public JsEnv(ILoader loader, int port = -1)
        {
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

            PuertsDLL.SetGlobalFunction(isolate, "__tgjsLoadType", StaticCallbacks.JsEnvCallbackWrap, AddCallback(LoadType));
            PuertsDLL.SetGlobalFunction(isolate, "__tgjsGetLoader", StaticCallbacks.JsEnvCallbackWrap, AddCallback(GetLoader));

            var autoRegister = Type.GetType("PuertsStaticWrap.AutoStaticCodeRegister", false);
            if (autoRegister != null)
            {
                var methodInfoOfRegister = autoRegister.GetMethod("Register");
                methodInfoOfRegister.Invoke(null, new object[] { this });
            }

            if (port != -1)
            {
                PuertsDLL.CreateInspector(isolate, port);
            }

            ExecuteFile("puerts/init.js");
            ExecuteFile("puerts/log.js");
            ExecuteFile("puerts/cjsload.js");
            ExecuteFile("puerts/modular.js");
            ExecuteFile("puerts/csharp.js");
        }

        void ExecuteFile(string filename)
        {
            if (loader.FileExists(filename))
            {
                string debugPath;
                var context = loader.ReadFile(filename, out debugPath);
                Eval(context, debugPath);
            }
        }

        public void Eval(string chunk, string chunkName = "chunk")
        {
            IntPtr resultInfo = PuertsDLL.Eval(isolate, chunk, chunkName);
            if (resultInfo == IntPtr.Zero)
            {
                string exceptionInfo = PuertsDLL.GetLastExceptionInfo(isolate);
                throw new Exception(exceptionInfo);
            }
            PuertsDLL.ResetResult(resultInfo);
        }

        public TResult Eval<TResult>(string chunk, string chunkName = "chunk")
        {
            IntPtr resultInfo = PuertsDLL.Eval(isolate, chunk, chunkName);
            if (resultInfo == IntPtr.Zero)
            {
                string exceptionInfo = PuertsDLL.GetLastExceptionInfo(isolate);
                throw new Exception(exceptionInfo);
            }
            TResult result = StaticTranslate<TResult>.Get(Idx, isolate, NativeValueApi.GetValueFromResult, resultInfo, false);
            PuertsDLL.ResetResult(resultInfo);
            return result;
        }

        public void AddLazyStaticWrapLoader(Type type, Func<TypeRegisterInfo> lazyStaticWrapLoader)
        {
            TypeRegister.AddLazyStaticWrapLoader(type, lazyStaticWrapLoader);
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

        void LoadType(IntPtr isolate, IntPtr info, IntPtr self, int paramLen)
        {
            try
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
                            if (PuertsDLL.GetJsValueType(isolate, value, false) != JsValueType.Function) return;
                            var argTypeId = PuertsDLL.GetTypeIdFromValue(isolate, value, false);
                            if (argTypeId == -1) return;
                            genericArguments[i - 1] = TypeRegister.GetType(argTypeId);
                        }
                        type = maybeType.MakeGenericType(genericArguments);
                        //UnityEngine.Debug.Log(type);
                    }
                }
                if (type == null)
                {
                    return;
                }
                int typeId = TypeRegister.GetTypeId(isolate, type);
                PuertsDLL.ReturnClass(isolate, info, typeId);
            }
            catch(Exception e)
            {
                PuertsDLL.ThrowException(isolate, "loadClass throw c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }

        public void UsingAction<T1>()
        {
            GeneralGetterManager.genericDelegateFactory.RegisterAction<T1>();
        }

        public void UsingAction<T1, T2>()
        {
            GeneralGetterManager.genericDelegateFactory.RegisterAction<T1, T2>();
        }

        public void UsingAction<T1, T2, T3>()
        {
            GeneralGetterManager.genericDelegateFactory.RegisterAction<T1, T2, T3>();
        }

        public void UsingAction<T1, T2, T3, T4>()
        {
            GeneralGetterManager.genericDelegateFactory.RegisterAction<T1, T2, T3, T4>();
        }

        public void UsingFunc<TResult>()
        {
            GeneralGetterManager.genericDelegateFactory.RegisterFunc<TResult>();
        }

        public void UsingFunc<T1, TResult>()
        {
            GeneralGetterManager.genericDelegateFactory.RegisterFunc<T1, TResult>();
        }

        public void UsingFunc<T1, T2, TResult>()
        {
            GeneralGetterManager.genericDelegateFactory.RegisterFunc<T1, T2, TResult>();
        }

        public void UsingFunc<T1, T2, T3, TResult>()
        {
            GeneralGetterManager.genericDelegateFactory.RegisterFunc<T1, T2, T3, TResult>();
        }

        public void UsingFunc<T1, T2, T3, T4, TResult>()
        {
            GeneralGetterManager.genericDelegateFactory.RegisterFunc<T1, T2, T3, T4, TResult>();
        }

        public void LowMemoryNotification()
        {
            PuertsDLL.LowMemoryNotification(isolate);
        }

        public void Tick()
        {
            PuertsDLL.InspectorTick(isolate);
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
            Dispose(true);
        }

        public void Dispose()
        {
            Dispose(true);
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
    }
}
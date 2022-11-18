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
    public class JsEnv : IDisposable
    {
        IntPtr nativeJsEnv;
        IntPtr nativePesapiEnv;

        Type persistentObjectInfoType;
        MethodInfo objectPoolAddMethodInfo;
        MethodInfo objectPoolRemoveMethodInfo;
        MethodInfo tryLoadTypeMethodInfo;

        PuertsIl2cpp.ObjectPool objectPool = new PuertsIl2cpp.ObjectPool();

        DefaultLoader loader;

        public JsEnv(): this(new DefaultLoader()){}

        public JsEnv(DefaultLoader loader)
        {
            //only once is enough
            PuertsIl2cpp.NativeAPI.SetLogCallback(PuertsIl2cpp.NativeAPI.Log);
            PuertsIl2cpp.NativeAPI.InitialPuerts(PuertsIl2cpp.NativeAPI.GetPesapiImpl());
            PuertsIl2cpp.NativeAPI.ExchangeAPI(PuertsIl2cpp.NativeAPI.GetUnityExports());
            tryLoadTypeMethodInfo = typeof(PuertsIl2cpp.NativeAPI).GetMethod("RegisterNoThrow");
            PuertsIl2cpp.NativeAPI.SetTryLoadCallback(PuertsIl2cpp.NativeAPI.GetMethodInfoPointer(tryLoadTypeMethodInfo), PuertsIl2cpp.NativeAPI.GetMethodPointer(tryLoadTypeMethodInfo));

            persistentObjectInfoType = typeof(PuertsIl2cpp.PersistentObjectInfo);
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
            PuertsIl2cpp.NativeAPI.SetObjectToGlobal(nativeJsEnv, "__puer__loader", PuertsIl2cpp.NativeAPI.GetObjectPointer(loader));
        }

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

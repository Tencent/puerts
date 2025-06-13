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

namespace Puerts
{
    // TODO: rename to ScriptObject
    public class JSObject : IDisposable
    {
        internal IntPtr apis;
        internal IntPtr objRef;
        internal Dictionary<Type, Delegate> delegateCache = new Dictionary<Type, Delegate>();
        private JsEnv jsEnv;

        internal JSObject(JsEnv jsEnv, IntPtr apis, IntPtr valueRef)
        {
            this.jsEnv = jsEnv;
            this.apis = apis;
            this.objRef = valueRef;
            jsEnv.addAllocedJsObject(this);
        }

        public T Get<T>(string key) 
        {
            var envRef = NativeAPI.pesapi_get_ref_associated_env(apis, objRef);
            if (!NativeAPI.pesapi_env_ref_is_valid(apis, envRef))
            {
                throw new InvalidOperationException("associated script env has disposed!");
            }
            var scope = NativeAPI.pesapi_open_scope(apis, envRef);
            var env = NativeAPI.pesapi_get_env_from_ref(apis, envRef);
            var obj = NativeAPI.pesapi_get_value_from_ref(apis, env, objRef);
            var value = NativeAPI.pesapi_get_property(apis, env, obj, key);
            try
            {
                return ExpressionsWrap.GetNativeTranlator<T>()(apis, env, value);
            }
            finally
            {
                NativeAPI.pesapi_close_scope(apis, scope);
            }
        }

        public void Dispose()
        {
            Dispose(true);
        }

        private bool disposed = false;

        internal static void ReleaseObjRef(IntPtr apis, IntPtr env, IntPtr objRef)
        {
            uint internal_field_count = 0;
            IntPtr weakHandlePtr = NativeAPI.pesapi_get_ref_internal_fields(apis, objRef, out internal_field_count);
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
                    var obj = NativeAPI.pesapi_get_value_from_ref(apis, env, objRef);
                    NativeAPI.pesapi_set_private(apis, env, obj, IntPtr.Zero);
                    //UnityEngine.Debug.Log($"cleanupPendingKillScriptObjects {objRef}");
                    NativeAPI.pesapi_release_value_ref(apis, objRef);
                }
            }
        }

        protected virtual void Dispose(bool dispose)
        {
            if (disposed) return;

#if THREAD_SAFE
            lock(jsEnv) 
            {
#endif
            disposed = true;
            var envRef = NativeAPI.pesapi_get_ref_associated_env(apis, objRef);
            if (!NativeAPI.pesapi_env_ref_is_valid(apis, envRef))
            {
                NativeAPI.pesapi_release_env_ref(apis, envRef);
            }
            else
            {
                if (dispose)
                {
                    var scope = NativeAPI.pesapi_open_scope(apis, envRef);
                    try
                    {
                        var env = NativeAPI.pesapi_get_env_from_ref(apis, envRef);
                        ReleaseObjRef(apis, env, objRef);
                    }
                    finally
                    {
                        NativeAPI.pesapi_close_scope(apis, scope);
                    }
                }
                else
                {
                    // from gc
                    jsEnv.addPendingKillScriptObjects(objRef);
                }
            }
            objRef = IntPtr.Zero;
            jsEnv = null;
#if THREAD_SAFE
            }
#endif
        }

        ~JSObject() 
        {
            Dispose(false);
        }


        public T cacheDelegate<T>(T del) where T : Delegate
        {
            delegateCache.Add(typeof(T), del);
            return del;
        }

        public bool tryGetCachedDelegate<T>(out T del) where T : Delegate
        {
            Delegate ret;
            if (delegateCache.TryGetValue(typeof(T), out ret))
            {
                del = ret as T;
                return true;
            }
            del = null;
            return false;
        }
    }

}

#endif

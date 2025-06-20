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
        private ScriptEnv scriptEnv;

        internal JSObject(ScriptEnv env, IntPtr apis, IntPtr valueRef)
        {
            scriptEnv = env;
            this.apis = apis;
            this.objRef = valueRef;
            scriptEnv.addAllocedJsObject(this);
        }

        public T Get<T>(string key) 
        {
            scriptEnv.CheckLiveness();
            var envRef = PuertsNative.pesapi_get_ref_associated_env(apis, objRef);
            if (!PuertsNative.pesapi_env_ref_is_valid(apis, envRef))
            {
                throw new InvalidOperationException("associated script env has disposed!");
            }
            var scope = PuertsNative.pesapi_open_scope(apis, envRef);
            var env = PuertsNative.pesapi_get_env_from_ref(apis, envRef);
            var obj = PuertsNative.pesapi_get_value_from_ref(apis, env, objRef);
            var value = PuertsNative.pesapi_get_property(apis, env, obj, key);
            try
            {
                return ExpressionsWrap.GetNativeTranlator<T>()(apis, env, value);
            }
            finally
            {
                PuertsNative.pesapi_close_scope(apis, scope);
            }
        }

        public void Dispose()
        {
            Dispose(true);
        }

        private bool disposed = false;

        internal static void ReleaseObjRef(IntPtr apis, IntPtr env, IntPtr objRef, bool force)
        {
            uint internal_field_count = 0;
            IntPtr weakHandlePtr = PuertsNative.pesapi_get_ref_internal_fields(apis, objRef, out internal_field_count);
            if (internal_field_count != 1)
            {
                throw new InvalidProgramException($"invalud internal fields count {internal_field_count}!");
            }

            IntPtr weakHandle = Marshal.PtrToStructure<IntPtr>(weakHandlePtr);

            bool targetReleased = false;

            if (weakHandle != IntPtr.Zero)
            {
                var handle = GCHandle.FromIntPtr(weakHandle);
                if (handle.Target == null)
                {
                    targetReleased = true;
                }
            }
            if (targetReleased || force)
            {
                var obj = PuertsNative.pesapi_get_value_from_ref(apis, env, objRef);
                PuertsNative.pesapi_set_private(apis, env, obj, IntPtr.Zero);
                //UnityEngine.Debug.Log($"cleanupPendingKillScriptObjects {objRef}");
                PuertsNative.pesapi_release_value_ref(apis, objRef);
            }
        }

        internal void ForceDispose()
        {
            if (disposed) return;
#if THREAD_SAFE
            lock(jsEnv) 
            {
#endif
            disposed = true;
            var envRef = PuertsNative.pesapi_get_ref_associated_env(apis, objRef);
            if (!PuertsNative.pesapi_env_ref_is_valid(apis, envRef))
            {
                PuertsNative.pesapi_release_value_ref(apis, objRef);
            }
            else
            {
                var scope = PuertsNative.pesapi_open_scope(apis, envRef);
                try
                {
                    var env = PuertsNative.pesapi_get_env_from_ref(apis, envRef);
                    ReleaseObjRef(apis, env, objRef, true);
                }
                finally
                {
                    PuertsNative.pesapi_close_scope(apis, scope);
                }
            }
            objRef = IntPtr.Zero;
            scriptEnv = null;
#if THREAD_SAFE
            }
#endif
        }

        protected virtual void Dispose(bool dispose)
        {
            if (disposed) return;

#if THREAD_SAFE
            lock(jsEnv) 
            {
#endif
            disposed = true;
            var envRef = PuertsNative.pesapi_get_ref_associated_env(apis, objRef);
            if (!PuertsNative.pesapi_env_ref_is_valid(apis, envRef))
            {
                PuertsNative.pesapi_release_value_ref(apis, objRef);
            }
            else
            {
                if (dispose)
                {
                    var scope = PuertsNative.pesapi_open_scope(apis, envRef);
                    try
                    {
                        var env = PuertsNative.pesapi_get_env_from_ref(apis, envRef);
                        ReleaseObjRef(apis, env, objRef, false);
                    }
                    finally
                    {
                        PuertsNative.pesapi_close_scope(apis, scope);
                    }
                }
                else
                {
                    // from gc
                    scriptEnv.addPendingKillScriptObjects(objRef);
                }
            }
            objRef = IntPtr.Zero;
            scriptEnv = null;
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

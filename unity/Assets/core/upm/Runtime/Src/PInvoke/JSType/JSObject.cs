/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if PUERTS_DISABLE_IL2CPP_OPTIMIZATION || (!PUERTS_IL2CPP_OPTIMIZATION && UNITY_IPHONE) || !ENABLE_IL2CPP

using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace Puerts
{
    // TODO: rename to ScriptObject
    public class JSObject
    {
        internal IntPtr apis;
        internal IntPtr objRef;
        internal Dictionary<Type, Delegate> delegateCache = new Dictionary<Type, Delegate>();

        internal JSObject(IntPtr apis, IntPtr valueRef)
        {
            this.apis = apis;
            this.objRef = valueRef;
        }

        public T Get<T>(string key) 
        {
            var envRef = NativeAPI.pesapi_get_ref_associated_env(apis, objRef);
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

        ~JSObject() 
        {
#if THREAD_SAFE
            lock(jsEnv) 
            {
#endif
            
#if THREAD_SAFE
            }
#endif
        }


        internal T cacheDelegate<T>(Type type, T del) where T : Delegate
        {
            delegateCache.Add(type, del);
            return del;
        }

        internal bool tryGetCachedDelegate<T>(out T del) where T : Delegate
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

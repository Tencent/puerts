/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace Puerts
{
    internal class JSObjectFactory
    {
        private Dictionary<IntPtr, WeakReference> nativePtrToJSObject = new Dictionary<IntPtr, WeakReference>();

        public JSObject GetOrCreateJSObject(IntPtr ptr, JsEnv jsEnv) 
        {
            WeakReference maybeOne;
            if (nativePtrToJSObject.TryGetValue(ptr, out maybeOne) && maybeOne.IsAlive)
            {
               return maybeOne.Target as JSObject;
            }
            JSObject jsObject = new JSObject(ptr, jsEnv);
            nativePtrToJSObject[ptr] = new WeakReference(jsObject);
            return jsObject;
        }

        public void RemoveJSObject(IntPtr ptr) {
            WeakReference maybeOne;
            if (nativePtrToJSObject.TryGetValue(ptr, out maybeOne) && ! maybeOne.IsAlive) {
                nativePtrToJSObject.Remove(ptr);
            }
        }

        internal bool IsJsObjectAlive(IntPtr ptr)
        {
            WeakReference maybeOne;
            return nativePtrToJSObject.TryGetValue(ptr, out maybeOne) && maybeOne.IsAlive;
        }

    }

    public class JSObject
    {
        private readonly JsEnv jsEnv;

        private IntPtr nativeJsObjectPtr;

        public IntPtr getJsObjPtr() {
            return nativeJsObjectPtr;
        }

        internal JSObject(IntPtr nativeJsObjectPtr, JsEnv jsEnv)
        {
            this.nativeJsObjectPtr = nativeJsObjectPtr;
            this.jsEnv = jsEnv;
            jsEnv.IncJSObjRef(nativeJsObjectPtr);
        }

        // Func<JSObject, string, object> MemberGetter;
        // public T Get<T>(string key) 
        // {
        //     if (MemberGetter == null) 
        //     {
        //         MemberGetter = jsEnv.Eval<Func<JSObject, string, object>>("(function(obj, key) { return obj[key] })");
        //     }
        //     object value = MemberGetter(this, key);
            
        //     Type maybeDelegateType = typeof(T);
        //     if (typeof(Delegate).IsAssignableFrom(typeof(T))) {
        //         return (T)(object)jsEnv.genericDelegateFactory.Create(typeof(T), (IntPtr)value);
        //     }
            
        //     return (T)value;
        // }

        ~JSObject() 
        {
#if THREAD_SAFE
            lock(jsEnv) 
            {
#endif
            jsEnv.DecJSObjRef(nativeJsObjectPtr);
#if THREAD_SAFE
            }
#endif
        }
    }

}
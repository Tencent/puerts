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

    public class JSObject
    {
        private readonly JsEnv jsEnv;

        private IntPtr nativeJsObjectPtr;


        internal JSObject(IntPtr nativeJsObjectPtr, JsEnv jsEnv)
        {
        }

        public T Get<T>(string key) 
        {
            return default(T);
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
    }

}

#endif

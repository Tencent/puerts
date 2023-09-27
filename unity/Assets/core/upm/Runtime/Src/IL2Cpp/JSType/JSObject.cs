/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if UNITY_2020_1_OR_NEWER
#if EXPERIMENTAL_IL2CPP_PUERTS && ENABLE_IL2CPP

using System;
using System.Runtime.CompilerServices;

namespace Puerts
{
    [UnityEngine.Scripting.Preserve]
    public class JSObject
    {
        long placeHold0;
        long placeHold1;
        long placeHold2;
        long placeHold3;
        long placeHold4;
        long placeHold5;
        long placeHold6;
        long placeHold7;

        [MethodImpl(MethodImplOptions.InternalCall)]
        void releaseScriptObject()
        {
            throw new NotImplementedException();
        }

        [MethodImpl(MethodImplOptions.InternalCall)]
        object GetJSObjectValue(string key, Type resultType)
        {
            throw new NotImplementedException();
        }

        public T Get<T>(string key) 
        {
            return (T)GetJSObjectValue(key, typeof(T));
        }

        ~JSObject()
        {
            releaseScriptObject();
        }
    }
}

#endif
#endif
/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;

namespace Puerts
{
    internal class StaticCallbacks
    {
        [MonoPInvokeCallback(typeof(V8FunctionCallback))]
        internal static void JsEnvCallbackWrap(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
            int jsEnvIdx, callbackIdx;
            Utils.LongToTwoInt(data, out jsEnvIdx, out callbackIdx);
            JsEnv.jsEnvs[jsEnvIdx].InvokeCallback(isolate, callbackIdx, info, self, paramLen);
        }

        [MonoPInvokeCallback(typeof(V8DestructorCallback))]
        internal static void GeneralDestructor(IntPtr self, long data)
        {
            int jsEnvIdx, callbackIdx;
            Utils.LongToTwoInt(data, out jsEnvIdx, out callbackIdx);
            JsEnv.jsEnvs[jsEnvIdx].JsReleaseObject(self.ToInt32());
        }

        [MonoPInvokeCallback(typeof(V8DestructorCallback))]
        internal static IntPtr ConstructorWrap(IntPtr isolate, IntPtr info, int paramLen, long data)
        {
            int jsEnvIdx, callbackIdx;
            Utils.LongToTwoInt(data, out jsEnvIdx, out callbackIdx);
            return JsEnv.jsEnvs[jsEnvIdx].InvokeConstructor(isolate, callbackIdx, info, paramLen);
        }

        [MonoPInvokeCallback(typeof(V8IndexedGetterCallback))]
        internal static void IndexedGetterWrap(IntPtr isolate, IntPtr info, IntPtr self, uint index, long data)
        {
            int jsEnvIdx, callbackIdx;
            Utils.LongToTwoInt(data, out jsEnvIdx, out callbackIdx);
            JsEnv.jsEnvs[jsEnvIdx].TypeRegister.ArrayGet(isolate, info, self, index);
        }

        [MonoPInvokeCallback(typeof(V8IndexedSetterCallback))]
        internal static void IndexedSetterWrap(IntPtr isolate, IntPtr info, IntPtr self, uint index, IntPtr value, long data)
        {
            int jsEnvIdx, callbackIdx;
            Utils.LongToTwoInt(data, out jsEnvIdx, out callbackIdx);
            JsEnv.jsEnvs[jsEnvIdx].TypeRegister.ArraySet(isolate, info, self, index, value);
        }

        [MonoPInvokeCallback(typeof(V8FunctionCallback))]
        internal static void ReturnTrue(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
            PuertsDLL.ReturnBoolean(isolate, info, true);
        }
    }
}
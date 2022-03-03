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
        [MonoPInvokeCallback(typeof(ModuleResolveCallback))]
        internal static string ModuleResolverWrap(string identifer, int jsEnvIdx)
        {
            JsEnv env = JsEnv.jsEnvs[jsEnvIdx];
            try
            {
                return env.ResolveModuleContent(identifer);
            }
            catch (Exception e)
            {
                // 因为只是C++到C#的通信，此处C++侧没有加v8::TryCatch。不能用PuertsDLL.ThrowException
                // PuertsDLL.ThrowException(env.isolate, "ModuleResolverWrap c# exception:" + e.Message + ",stack:" + e.StackTrace);
                return "throw new Error('resolve module " + identifer + " error: " + e.Message + "')";
            }
        }

        [MonoPInvokeCallback(typeof(V8FunctionCallback))]
        internal static void JsEnvCallbackWrap(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
            try
            {
                int jsEnvIdx, callbackIdx;
                Utils.LongToTwoInt(data, out jsEnvIdx, out callbackIdx);
                JsEnv.jsEnvs[jsEnvIdx].InvokeCallback(isolate, callbackIdx, info, self, paramLen);
            }
            catch (Exception e)
            {
                PuertsDLL.ThrowException(isolate, "JsEnvCallbackWrap c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }

        [MonoPInvokeCallback(typeof(V8DestructorCallback))]
        internal static void GeneralDestructor(IntPtr self, long data)
        {
            try
            {
                int jsEnvIdx, callbackIdx;
                Utils.LongToTwoInt(data, out jsEnvIdx, out callbackIdx);
                JsEnv.jsEnvs[jsEnvIdx].JsReleaseObject(self.ToInt32());
            }
            catch {}
        }

        [MonoPInvokeCallback(typeof(V8ConstructorCallback))]
        internal static IntPtr ConstructorWrap(IntPtr isolate, IntPtr info, int paramLen, long data)
        {
            try
            {
                int jsEnvIdx, callbackIdx;
                Utils.LongToTwoInt(data, out jsEnvIdx, out callbackIdx);
                var ret = JsEnv.jsEnvs[jsEnvIdx].InvokeConstructor(isolate, callbackIdx, info, paramLen);
                return ret;
            }
            catch (Exception e)
            {
                PuertsDLL.ThrowException(isolate, "ConstructorWrap c# exception:" + e.Message + ",stack:" + e.StackTrace);
                return IntPtr.Zero;
            }
        }

        [MonoPInvokeCallback(typeof(V8FunctionCallback))]
        internal static void ReturnTrue(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
            PuertsDLL.ReturnBoolean(isolate, info, true);
        }
    }
}
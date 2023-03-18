/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using NUnit.Framework;
using System;

namespace Puerts.UnitTest.TranslatorTest
{
    public class CSToJSTest
    {
        [Test]
        public void RecursiveJSFunctionInvoke()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            jsEnv.UsingFunc<int, int>();
            int result = jsEnv.Eval<int>(@"
                function fibonacci(num) {
                    if (num == 0 || num == 1) { return num }
                    return CS.Puerts.UnitTest.Util.InvokeJSFunctionIntInt(fibonacci, num - 1) + CS.Puerts.UnitTest.Util.InvokeJSFunctionIntInt(fibonacci, num - 2)
                }

                CS.Puerts.UnitTest.Util.InvokeJSFunctionIntInt(fibonacci, 6);
            ");
            Assert.AreEqual(8, result);
        }
        [Test]
        public void JSFunctionInvokeWithArrayBuffer()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            jsEnv.UsingFunc<Puerts.ArrayBuffer, int, Puerts.ArrayBuffer>();

            Func<Puerts.ArrayBuffer, int, Puerts.ArrayBuffer> callback = jsEnv.Eval<Func<Puerts.ArrayBuffer, int, Puerts.ArrayBuffer>>(@"
                (function() {
                    return function(data, length) {
                        return data.slice(0, length - 1)
                    };
                })()
            ");
            Puerts.ArrayBuffer ab = callback(new Puerts.ArrayBuffer(new byte[] { 1, 2, 3 }), 3);
            Assert.True(ab.Count == 2);
        }
    }
}
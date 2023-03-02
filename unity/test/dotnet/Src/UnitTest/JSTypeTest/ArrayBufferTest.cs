/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using NUnit.Framework;
using System;

namespace Puerts.UnitTest.JSTypeTest
{
    public class ArrayBufferClass
    {
        public ArrayBuffer AB;

        public ArrayBufferClass()
        {
            AB = new ArrayBuffer(new byte[] { 1, 2, 3 });
        }

        public int Sum(ArrayBuffer ab)
        {
            int sum = 0;
            foreach(var b in ab.Bytes)
            {
                sum += b;
            }
            return sum;
        }

        public ArrayBuffer GetMe(ArrayBuffer ab)
        {
            return ab;
        }
    }
    
    public class ArrayBufferTest
    {
        
        [Test]
        public void Test1()
        {
            var jsEnv = new JsEnv(new TxtLoader());

            int ret = jsEnv.Eval<int>(@"
                let obj = new CS.Puerts.UnitTest.JSTypeTest.ArrayBufferClass();
                let ab = obj.AB;
                let arr = new Uint8Array(ab);
                arr[1];
            ");

            jsEnv.Dispose();

            Assert.AreEqual(2, ret);
        }
        
        [Test]
        public void Test2()
        {
            var jsEnv = new JsEnv(new TxtLoader());

            int ret = jsEnv.Eval<int>(@"
                let obj = new CS.Puerts.UnitTest.JSTypeTest.ArrayBufferClass();
                let ab = obj.AB;
                let arr = new Uint8Array(ab,1);
                ab = arr;
                let ab2 = obj.AB;
                let arr2 = new Uint8Array(ab);
                arr2[1];
            ");

            jsEnv.Dispose();

            Assert.AreEqual(3, ret);
        }
        
        [Test]
        public void Test3()
        {
            var jsEnv = new JsEnv(new TxtLoader());

            int ret = jsEnv.Eval<int>(@"
                let obj = new CS.Puerts.UnitTest.JSTypeTest.ArrayBufferClass();
                let ab = obj.AB;
                let arr = new Uint8Array(ab,1);
                obj.Sum(arr);
            ");

            jsEnv.Dispose();

            Assert.AreEqual(5, ret);
        }
        
        [Test]
        public void Test4()
        {
            var jsEnv = new JsEnv(new TxtLoader());

            int ret = jsEnv.Eval<int>(@"
                let obj = new CS.Puerts.UnitTest.JSTypeTest.ArrayBufferClass();
                let ab = obj.AB;
                let arr = new Uint8Array(ab,1);
                obj.Sum(arr.buffer);
            ");

            jsEnv.Dispose();

            Assert.AreEqual(6, ret);
        }
        
        [Test]
        public void Test5()
        {
            var jsEnv = new JsEnv(new TxtLoader());

            int ret = jsEnv.Eval<int>(@"
                let obj = new CS.Puerts.UnitTest.JSTypeTest.ArrayBufferClass();
                let arr = new Uint16Array([1,2,3]);
                let ab = obj.GetMe(arr);
                let arr2 = new Uint8Array(ab);
                arr2[1]
            ");

            jsEnv.Dispose();

            Assert.AreEqual(0, ret);
        }
        
        [Test]
        public void Test6()
        {
            var jsEnv = new JsEnv(new TxtLoader());

            ArrayBufferClass ret = jsEnv.Eval<ArrayBufferClass>(@"
                let obj = new CS.Puerts.UnitTest.JSTypeTest.ArrayBufferClass();
                let arr = new Uint8Array(obj.AB);
                arr[1] = 100;
                obj;
            ");

            jsEnv.Dispose();

            Assert.AreEqual(2, ret.AB.Bytes[1]);
        }
        
        [Test]
        public void Test7()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            jsEnv.UsingFunc<Puerts.ArrayBuffer, string>();

            Func<Puerts.ArrayBuffer, string> func = jsEnv.Eval<Func<Puerts.ArrayBuffer, string>>(@"
                (function(ab) {
                    return '' + new Uint8Array(ab)[0];
                });
            ");

            var res = func(new ArrayBuffer(new byte[] { 1, 2, 3 }));

            jsEnv.Dispose();

            Assert.AreEqual("1", res);
        }

        
        [Test]
        public void Test8()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            jsEnv.UsingAction<int, Puerts.ArrayBuffer, bool>();
            jsEnv.UsingFunc<int, Puerts.ArrayBuffer, bool, string>();

            Action<int, Puerts.ArrayBuffer, bool> action = jsEnv.Eval<Action<int, Puerts.ArrayBuffer, bool>>(@"
                (function(i, ab, b) {
                });
            ");
            Func<int, Puerts.ArrayBuffer, bool, string> func = jsEnv.Eval<Func<int, Puerts.ArrayBuffer, bool, string>>(@"
                (function(i, ab, b) {
                    return '' + new Uint8Array(ab)[0];
                });
            ");

            action(1, new ArrayBuffer(new byte[] { 1, 2, 3 }), false);
            var res = func(1, new ArrayBuffer(new byte[] { 1, 2, 3 }), false);

            jsEnv.Dispose();

            Assert.AreEqual("1", res);
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
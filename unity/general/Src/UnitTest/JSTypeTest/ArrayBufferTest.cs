/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using NUnit.Framework;

namespace Puerts.UnitTest
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
                const CS = require('csharp');
                let obj = new CS.Puerts.UnitTest.ArrayBufferClass();
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
                const CS = require('csharp');
                let obj = new CS.Puerts.UnitTest.ArrayBufferClass();
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
                const CS = require('csharp');
                let obj = new CS.Puerts.UnitTest.ArrayBufferClass();
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
                const CS = require('csharp');
                let obj = new CS.Puerts.UnitTest.ArrayBufferClass();
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
                const CS = require('csharp');
                let obj = new CS.Puerts.UnitTest.ArrayBufferClass();
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
                const CS = require('csharp');
                let obj = new CS.Puerts.UnitTest.ArrayBufferClass();
                let arr = new Uint8Array(obj.AB);
                arr[1] = 100;
                obj;
            ");

            jsEnv.Dispose();

            Assert.AreEqual(2, ret.AB.Bytes[1]);
        }

    }
}
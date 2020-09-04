/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using NUnit.Framework;
using System.IO;

namespace Puerts.UnitTest
{
    public class TxtLoader : ILoader
    {
        private string root = "../../Assets/Puerts/Src/Resources";

        public bool FileExists(string filepath)
        {
            return File.Exists(Path.Combine(root, filepath + ".txt"));
        }

        public string ReadFile(string filepath, out string debugpath)
        {
            debugpath = Path.Combine(root, filepath);
            return File.ReadAllText(debugpath + ".txt");
        }
    }

    [TestFixture]
    public class PuertsTest
    {
        [OneTimeSetUp]
        public static void Init()
        {
        }

        [Test]
        public void BaseTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());

            int ret = jsEnv.Eval<int>(@"
                const CS = require('csharp');
                let obj = new CS.Puerts.UnitTest.DerivedClass();
                obj.Id(100);
            ");

            jsEnv.Dispose();

            Assert.AreEqual(100, ret);
        }

        [Test]
        public void ArrayBuffer()
        {
            var jsEnv = new JsEnv(new TxtLoader());

            int ret = jsEnv.Eval<int>(@"
                const CS = require('csharp');
                let obj = new CS.Puerts.UnitTest.ArrayBufferTest();
                let ab = obj.AB;
                //CS.System.Console.WriteLine(ab.constructor.toString());
                if (obj.Sum(ab) != 6) {
                    throw new Error('sum of c# ab')
                }
                let uint8Array = new Uint8Array(ab);
                if (obj.Sum(uint8Array) != 6) {
                    throw new Error('sum of c# ab')
                }
                let u8a = new Uint8Array(2);
                u8a[0] = 123;
                u8a[1] = 101;
                if (obj.Sum(u8a) != 224) {
                    throw new Error('sum of js ab')
                }
                uint8Array.length;
            ");

            jsEnv.Dispose();

            Assert.AreEqual(3, ret);
        }
    }
}
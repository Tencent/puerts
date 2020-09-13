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
            
            using (StreamReader reader = new StreamReader(debugpath + ".txt"))
            {
                return reader.ReadToEnd();
            }
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
        public void NestTypeTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());

            int ret = jsEnv.Eval<int>(@"
                const CS = require('csharp');
                let obj = new CS.Puerts.UnitTest.DerivedClass.Inner();
                obj.Add(obj.A, 1);
            ");

            jsEnv.Dispose();

            Assert.AreEqual(101, ret);
        }

        [Test]
        public void NullString()
        {
            var jsEnv = new JsEnv(new TxtLoader());

            bool ret = jsEnv.Eval<bool>(@"
                const CS = require('csharp');
                let obj = new CS.Puerts.UnitTest.DerivedClass();
                obj.IsStringNull(null);
            ");

            jsEnv.Dispose();

            Assert.True(ret);
        }

        [Test]
        public void GenericDelegate()
        {
            var jsEnv = new JsEnv(new TxtLoader());

            var ret = jsEnv.Eval<double>(@"
                const CS = require('csharp');
                let obj = new CS.Puerts.UnitTest.JsObjectTest();
                let jsObj = {'c': 100};
                obj.Setter = (path, value) => {
                    let tmp = jsObj;
                    let nodes = path.split('.');
                    let lastNode = nodes.pop();
                    nodes.forEach(n => {
                        if (typeof tmp[n] === 'undefined') tmp[n] = {};
                        tmp = tmp[n];
                    });
                    tmp[lastNode] = value;
                }

                obj.Getter = (path) => {
                    let tmp = jsObj;
                    let nodes = path.split('.');
                    let lastNode = nodes.pop();
                    nodes.forEach(n => {
                        if (typeof tmp != 'undefined') tmp = tmp[n];
                    });
                    return tmp[lastNode];
                }
                obj.SetSomeData();
                obj.GetSomeData();
                jsObj.a + jsObj.c;
            ");

            jsEnv.Dispose();

            Assert.AreEqual(101, ret);
        }

        [Test]
        public void Array()
        {
            var jsEnv = new JsEnv(new TxtLoader());

            var ret = jsEnv.Eval<string>(@"
                const CS = require('csharp');
                let obj = new CS.Puerts.UnitTest.ArrayTest();
                let sum = 0;
                for (var i = 0; i < 10; i++) {
                    for (var j = 0; j < obj['a' + i].length; j++) {
                        sum += Number(obj['a' + i][j]);
                    }
                }
                for (var i = 0; i < obj.astr.length; i++) {
                    sum += obj.astr[i];
                }
                for (var i = 0; i < obj.ab.length; i++) {
                    sum += obj.ab[i];
                }
                let sum2 = 0;
                for (var i = 0; i < 10; i++) {
                    for (var j = 0; j < obj['a' + i].length; j++) {
                        obj['a' + i][j] += obj['a' + i][j];
                    }
                }
                for (var i = 0; i < 10; i++) {
                    for (var j = 0; j < obj['a' + i].length; j++) {
                        sum2 += Number(obj['a' + i][j]);
                    }
                }
                //CS.System.Console.WriteLine('sum = ' + sum2 );
                sum + sum2;
            ");

            jsEnv.Dispose();

            Assert.AreEqual("240hellojohntruefalsetruefalse480", ret);
        }

        [Test]
        public void Long()
        {
            Assert.Catch(() => {
                var jsEnv1 = new JsEnv(new TxtLoader());
                jsEnv1.Eval(@"
                    const CS = require('csharp');
                    let obj = new CS.Puerts.UnitTest.DerivedClass();
                    obj.Long(1);
                ");
            });

            var jsEnv = new JsEnv(new TxtLoader());
            var ret = jsEnv.Eval<long>(@"
                    const CS = require('csharp');
                    let obj = new CS.Puerts.UnitTest.DerivedClass();
                    obj.Long(1n);
                ");
            Assert.AreEqual((long)1, ret);

            Assert.Catch(() =>
            {
                var jsEnv2 = new JsEnv(new TxtLoader());
                jsEnv2.Eval<long>("1");
            });

            jsEnv.Dispose();
        }
    }
}


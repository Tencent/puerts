/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using NUnit.Framework;
using System.IO;
using System.Reflection;

namespace Puerts.UnitTest
{
    public class TxtLoader : ILoader
    {
        private string root = Path.Combine(
            System.Text.RegularExpressions.Regex.Replace(Path.GetDirectoryName(Assembly.GetExecutingAssembly().GetName().CodeBase), "^file:\\\\", ""),
            ".. /../Assets/Puerts/Src/Resources");

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
                    for (var j = 0; j < obj['a' + i].Length; j++) {
                        sum += Number(obj['a' + i].get_Item(j));
                    }
                }
                for (var i = 0; i < obj.astr.Length; i++) {
                    sum += obj.astr.get_Item(i);
                }
                for (var i = 0; i < obj.ab.Length; i++) {
                    sum += obj.ab.get_Item(i);
                }
                let sum2 = 0;
                for (var i = 0; i < 10; i++) {
                    for (var j = 0; j < obj['a' + i].Length; j++) {
                        obj['a' + i].set_Item(j, obj['a' + i].get_Item(j) + obj['a' + i].get_Item(j));
                    }
                }
                for (var i = 0; i < 10; i++) {
                    for (var j = 0; j < obj['a' + i].Length; j++) {
                        sum2 += Number(obj['a' + i].get_Item(j));
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

        [Test]
        public void NestTypeStaticMethodTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());

            int ret = jsEnv.Eval<int>(@"
                const CS = require('csharp');
                const PUERTS = require('puerts');
                let res = PUERTS.$ref(0);
                CS.Puerts.UnitTest.DerivedClass.Inner.Sub(10,5,res);
                PUERTS.$unref (res);
            ");

            jsEnv.Dispose();

            Assert.AreEqual(5, ret);
        }

        [Test]
        public void VirtualTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());

            string ret = jsEnv.Eval<string>(@"
                const CS = require('csharp');
                let obj = new CS.Puerts.UnitTest.DerivedClass();
                let ret = obj.TestVirt(3,'gyx');
                ret;
            ");

            jsEnv.Dispose();

            Assert.AreEqual("gyx30 10", ret);
        }

        [Test]
        public void CallBaseVirt()
        {
            var jsEnv = new JsEnv(new TxtLoader());

            string ret = jsEnv.Eval<string>(@"
                const CS = require('csharp');
                let obj = new CS.Puerts.UnitTest.DerivedClass();
                let ret = obj.TestBaseVirt();
                ret;
            ");

            jsEnv.Dispose();

            Assert.AreEqual("base print fixed-base-static-field ", ret);
        }

        [Test]
        public void InterfaceTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            string ret = jsEnv.Eval<string>(@"
                const CS = require('csharp');
                let iSubObj = new CS.Puerts.UnitTest.ISubA();
                let deriveObj = new CS.Puerts.UnitTest.DerivedClass();
                let res = iSubObj.TestDerivedObj(deriveObj,3,'gyx') + iSubObj.TestArr(iSubObj.a8) + iSubObj.running;
                res;
            ");
            jsEnv.Dispose();
            Assert.AreEqual(ret, "gyx30 10789true");
        }

        [Test]
        public void AbstractRefParamTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            string name = jsEnv.Eval<string>(@"
                const CS = require('csharp');
                const PUERTS = require('puerts');
                let obj = new CS.Puerts.UnitTest.C();
                let name = PUERTS.$ref ('gyx');
                let res =  PUERTS.$ref ('');
                obj.TestRef(name,res);
                PUERTS.$unref (name) + PUERTS.$unref(res);
            ");
            jsEnv.Dispose();
            Assert.AreEqual(name, "annagyx23");

        }

        [Test]
        public void StructTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            string res = jsEnv.Eval<string>(@"
                const CS = require('csharp');
                let s = new CS.Puerts.UnitTest.S(22,'haha');
                let obj = new CS.Puerts.UnitTest.DerivedClass();
                let res = s.TestParamObj(obj);
                res;
            ");
            jsEnv.Dispose();
            Assert.AreEqual(res, "haha220 111");
        }

        [Test]
        public void ParamStructTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            var age = jsEnv.Eval<int>(@"
                const CS = require('csharp');
                let s = new CS.Puerts.UnitTest.S(22,'gyx');
                let obj = new CS.Puerts.UnitTest.DerivedClass();
                let res = obj.PrintStruct(s);
                s.Age;
            ");
            jsEnv.Dispose();
            Assert.AreEqual(age, 22);
        }

        [Test]
        public void ParamStructRefTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            var age = jsEnv.Eval<int>(@"
                const CS = require('csharp');
                const PUERTS = require('puerts');
                let s = PUERTS.$ref(new CS.Puerts.UnitTest.S(22,'gyx'));
                let obj = new CS.Puerts.UnitTest.DerivedClass();
                obj.PrintStructRef(s);
                PUERTS.$unref(s).Age;
            ");
            jsEnv.Dispose();
            Assert.AreEqual(age, 20);
        }

        [Test]
        public void OverloadTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            string res = jsEnv.Eval<string>(@"
                const CS = require('csharp');
                let obj = new CS.Puerts.UnitTest.DerivedClass();
                let i = '1';
                let j = '2';
                let res = obj.Adds(i,j);
                res;
            ");
            Assert.AreEqual(res, "12");
        }

        [Test]
        public void EventTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            var res = jsEnv.Eval<string>(@"
                const CS = require('csharp');
                const PUERTS = require('puerts');
                let obj = new CS.Puerts.UnitTest.EventTest();
                let dele = new CS.Puerts.UnitTest.MyCallBack((str) => { return str; });
                obj.myCallBack = CS.System.Delegate.Combine(obj.myCallBack, dele);
                obj.add_myEvent(dele);
                CS.Puerts.UnitTest.EventTest.add_myStaticEvent(dele);
                let res = obj.Trigger();
                res;
            ");
            Assert.AreEqual(res, "start  delegate  event  static-event  end");
        }

        [Test]
        public void ListGenericTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            var res = jsEnv.Eval<int>(@"
                const CS = require('csharp');
                const PUERTS = require('puerts');
                let obj = new CS.Puerts.UnitTest.DerivedClass();
                let List = PUERTS.$generic(CS.System.Collections.Generic.List$1,CS.System.Int32);
                let ls = new List();
                ls.Add(1);
                ls.Add(2);
                ls.Add(3);
                let res = obj.TestList(ls);
                res;
            ");
            Assert.AreEqual(res, 6);
        }

        [Test]
        public void ExceptionTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            var res = jsEnv.Eval<int>(@"
                const CS = require('csharp');
                let obj = new CS.Puerts.UnitTest.DerivedClass();
                let res;
                try{obj.adds(i,j);}catch(e){res = -1;}
                res;
            ");
            Assert.AreEqual(res, -1);
        }

        [Test]
        public void TryCatchFinallyTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            string res = jsEnv.Eval<string>(@"
                const CS = require('csharp');
                const PUERTS = require('puerts');
                let obj = new CS.Puerts.UnitTest.DerivedClass();
                let t = PUERTS.$ref(false);
                let c = PUERTS.$ref(false);
                let f = PUERTS.$ref(false);
                let e = PUERTS.$ref(false);
                let res = obj.TryCatchFinally(true, t, c, f, e);
                res;
            ");
            Assert.AreEqual(res, "cfe");
        }

        [Test]
        public void CatchByNextLevelTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            string res = jsEnv.Eval<string>(@"
                const CS = require('csharp');
                const PUERTS = require('puerts');
                let obj = new CS.Puerts.UnitTest.DerivedClass();
                let f1 = PUERTS.$ref(false);
                let f2 = PUERTS.$ref(false);
                let f3 = PUERTS.$ref(false);
                let res = obj.CatchByNextLevel(f1,f2, f3);
                res;
            ");
            Assert.AreEqual(res, "try-try-finally-catch-finally");
        }

        [Test]
        public void ListRangeTest()
        {
            Assert.Catch(() => {
                var jsEnv = new JsEnv(new TxtLoader());
                jsEnv.Eval(@"
                    const CS = require('csharp');
                    const PUERTS = require('puerts');
                    let obj = new CS.Puerts.UnitTest.DerivedClass();
                    let List = PUERTS.$generic(CS.System.Collections.Generic.List$1, CS.System.Int32);
                    let ls = new List();
                    ls.Add(1);
                    ls.Add(2);
                    let res = obj.testListRange(ls,2);"
                );
            });
        }
        [Test]
        public void DefaultParamTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            string res = jsEnv.Eval<string>(@"
                const CS = require('csharp');
                let obj = new CS.Puerts.UnitTest.DerivedClass();
                let res = obj.TestDefaultParam();
                res;
            ");
            Assert.AreEqual(res, "1str");
        }


        [Test]
        public void ErrorParamTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            int res = jsEnv.Eval<int>(@"
                const CS = require('csharp');
                let obj = new CS.Puerts.UnitTest.DerivedClass();
                let res;
                try { res = obj.TestErrorParam('1');} catch(e){res = -1};
                res;
            ");
            Assert.AreEqual(res, -1);
        }

        [Test]
        public void ErrorParamStructTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            int res = jsEnv.Eval<int>(@"
                const CS = require('csharp');
                let obj = new CS.Puerts.UnitTest.DerivedClass();
                let s = new CS.Puerts.UnitTest.S(1,'anna');
                let res;
                try { res = obj.TestErrorParamStruct(1);} catch(e){res = -1};
                res;
            ");
            Assert.AreEqual(res, -1);
        }

        [Test]
        public void ErrorParamClassTest()
        {
            Assert.Catch(() => {
                var jsEnv = new JsEnv(new TxtLoader());
                jsEnv.Eval(@"
                    const CS = require('csharp');
                    let obj = new CS.Puerts.UnitTest.DerivedClass();
                    let iobj = new CS.Puerts.UnitTest.ISubA();
                    obj.TestErrorParamClass(i);"
                );
            });
        }

        [Test]
        public void ErrorParamDerivedClassTest()
        {

            var jsEnv = new JsEnv(new TxtLoader());
            var res = jsEnv.Eval<int>(@"
                const CS = require('csharp');
                let obj = new CS.Puerts.UnitTest.BaseClass();
                let iobj = new CS.Puerts.UnitTest.ISubA();
                let res;
                try {res = iobj.TestDerivedObj(obj,1,'gyx');} catch(e){res = -1;}
                res;
            ");
            Assert.AreEqual(res, -1);
        }

        [Test]
        public void ParamBaseClassTest()
        {

            var jsEnv = new JsEnv(new TxtLoader());
            var res = jsEnv.Eval<string>(@"
                const CS = require('csharp');
                let obj = new CS.Puerts.UnitTest.DerivedClass();
                let iobj = new CS.Puerts.UnitTest.ISubA();
                let res;
                res = iobj.TestBaseObj(obj,1,'gyx');
                res;
            ");
            Assert.AreEqual(res, "gyx10 10");
        }

        [Test]
        public void ErrorParamRefStructTest()
        {
            Assert.Catch(() => {
                var jsEnv = new JsEnv(new TxtLoader());
                jsEnv.Eval(@"
                    const CS = require('csharp');
                    const PUERTS = require('puerts');
                    let obj = new CS.Puerts.UnitTest.DerivedClass();
                    let s = new CS.Puerts.UnitTest.S(1,'gyx');
                    obj.PrintStructRef(s);"
                );
            });
        }

        [Test]
        public void ParamIntArrayTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            int res = jsEnv.Eval<int>(@"
                const CS = require('csharp');
                const PUERTS = require('puerts');
                let obj = new CS.Puerts.UnitTest.ISubA();
                let arrayInt = CS.System.Array.CreateInstance(PUERTS.$typeof(CS.System.Int32), 3);
                arrayInt.set_Item(0, 111);
                arrayInt.set_Item(1, 222);
                arrayInt.set_Item(2, 333);
                let res = obj.TestArrInt(arrayInt);
                res;
            ");
            Assert.AreEqual(res, 666);
        }

        [Test]
        public void ErrorParamStringArrayTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            int res = jsEnv.Eval<int>(@"
                const CS = require('csharp');
                const PUERTS = require('puerts');
                let obj = new CS.Puerts.UnitTest.ISubA();
                let arrayString = CS.System.Array.CreateInstance(PUERTS.$typeof(CS.System.String), 3);
                arrayString.set_Item(0, '111');
                arrayString.set_Item(1, '222');
                arrayString.set_Item(2, '333');
                try {let res = obj.TestArrInt(arrayString); } catch(e){res = -1;}
                res;
            ");
            Assert.AreEqual(res, -1);
        }
    }
}


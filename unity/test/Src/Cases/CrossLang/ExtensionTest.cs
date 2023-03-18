/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using NUnit.Framework;

namespace Puerts.UnitTest
{
    [UnityEngine.Scripting.Preserve]
    public class ExtensionTestHelper {}
    [UnityEngine.Scripting.Preserve]
    public class ExtensionTestHelperDerived: ExtensionTestHelper {}

    [UnityEngine.Scripting.Preserve]
    public class ExtensionTestHelper1 {}
    [UnityEngine.Scripting.Preserve]
    public class ExtensionTestHelperDerived1 : ExtensionTestHelper1 {}

    [UnityEngine.Scripting.Preserve]
    public static class HelperExtension
    {
        [UnityEngine.Scripting.Preserve]
        public static int PrimitiveExtension(this ExtensionTestHelper a)
        {
            return 111;
        }
        [UnityEngine.Scripting.Preserve]
        public static string PlainExtension(this ExtensionTestHelper a)
        {
            return "PlainExtension";
        }

        [UnityEngine.Scripting.Preserve]
        public static T Extension<T>(this T a) where T : ExtensionTestHelper
        {
            return a;
        }

        [UnityEngine.Scripting.Preserve]
        public static T Extension1<T>(this T a, string b) where T : ExtensionTestHelper
        {
            return a;
        }

        [UnityEngine.Scripting.Preserve]
        public static string Extension2<T1, T2>(this T1 a, T2 b) where T1 : ExtensionTestHelper where T2 : ExtensionTestHelper1
        {
            return (string.Format("Extension2<{0},{1}>", typeof(T1), typeof(T2)));
        }
    }

    [TestFixture]
    public class ExtensionTest
    {
        [Test]
        public void ExtensionPrimitiveTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            var res = jsEnv.Eval<int>(@"
                (function() {
                    let obj = new CS.Puerts.UnitTest.ExtensionTestHelper();
                    let res = obj.PrimitiveExtension();
                    return res;
                })()
            ");
            Assert.AreEqual(res, 111);
        }

        [Test]
        public void ExtensionPlainTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            var res = jsEnv.Eval<string>(@"
                (function() {
                    let obj = new CS.Puerts.UnitTest.ExtensionTestHelper();
                    let res = obj.PlainExtension();
                    return res;
                })()
            ");
            Assert.AreEqual(res, "PlainExtension");
        }

        [Test]
        public void ExtensionGenerateBaseTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            var res = jsEnv.Eval<ExtensionTestHelper>(@"
                (function() {
                    let obj = new CS.Puerts.UnitTest.ExtensionTestHelper();
                    let res = obj.Extension();
                    return res;
                })()
            ");
            Assert.AreEqual(res.ToString(), "Puerts.UnitTest.ExtensionTestHelper");
        }

        public void ExtensionGenerateBaseTest_1()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            var res = jsEnv.Eval<ExtensionTestHelper>(@"
                (function() {
                    let obj = new CS.Puerts.UnitTest.ExtensionTestHelper();
                    let res = obj.Extension1('123');
                    return res;
                })()
            ");
            Assert.AreEqual(res.ToString(), "Puerts.UnitTest.ExtensionTestHelper");
        }

        [Test]
        public void ExtensionGenerateBaseBase1Test_2()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            var res = jsEnv.Eval<string>(@"
                (function() {
                    let obj = new CS.Puerts.UnitTest.ExtensionTestHelper();
                    let obj1 = new CS.Puerts.UnitTest.ExtensionTestHelper1();
                    let res = obj.Extension2(obj1);
                    return res;
                })()
            ");
            Assert.AreEqual(res, "Extension2<Puerts.UnitTest.ExtensionTestHelper,Puerts.UnitTest.ExtensionTestHelper1>");
        }

        [Test]
        public void ExtensionGenerateDerivedTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            var res = jsEnv.Eval<ExtensionTestHelper>(@"
                (function() {
                    let obj = new CS.Puerts.UnitTest.ExtensionTestHelperDerived();
                    let res = obj.Extension();
                    return res;
                })()
            ");
            Assert.AreEqual(res.ToString(), "Puerts.UnitTest.ExtensionTestHelperDerived");
        }

        [Test]
        public void ExtensionGenerateDerivedBase1Test_2()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            var res = jsEnv.Eval<string>(@"
                (function() {
                    let obj = new CS.Puerts.UnitTest.ExtensionTestHelperDerived();
                    let obj1 = new CS.Puerts.UnitTest.ExtensionTestHelper1();
                    let res = obj.Extension2(obj1);
                    return res;
                })()
            ");
            Assert.AreEqual(res, "Extension2<Puerts.UnitTest.ExtensionTestHelper,Puerts.UnitTest.ExtensionTestHelper1>");
        }

        [Test]
        public void ExtensionGenerateDerivedDerived1Test_2()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            var res = jsEnv.Eval<string>(@"
                (function() {
                    let obj = new CS.Puerts.UnitTest.ExtensionTestHelperDerived();
                    let obj1 = new CS.Puerts.UnitTest.ExtensionTestHelperDerived1();
                    let res = obj.Extension2(obj1);
                    return res;
                })()
            ");
            Assert.AreEqual(res, "Extension2<Puerts.UnitTest.ExtensionTestHelper,Puerts.UnitTest.ExtensionTestHelper1>");
        }
    }
}
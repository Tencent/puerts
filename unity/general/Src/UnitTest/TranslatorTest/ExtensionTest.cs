/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using NUnit.Framework;

namespace Puerts.UnitTest.UnitTest.TranslatorTest
{
    public class ExtensionTest
    {
        [Test]
        public void ExtensionPrimitiveTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            var res = jsEnv.Eval<int>(@"
                let obj = new CS.Puerts.UnitTest.BaseClass();
                puerts.$extension(CS.Puerts.UnitTest.BaseClass, CS.Puerts.UnitTest.BaseClassExtension);
                let res = obj.PrimitiveExtension();
                res;
            ");
            jsEnv.Dispose();
            Assert.AreEqual(res, 111);
        }

        [Test]
        public void ExtensionPlainTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            var res = jsEnv.Eval<string>(@"
                let obj = new CS.Puerts.UnitTest.BaseClass();
                puerts.$extension(CS.Puerts.UnitTest.BaseClass, CS.Puerts.UnitTest.BaseClassExtension);
                let res = obj.PlainExtension();
                res;
            ");
            jsEnv.Dispose();
            Assert.AreEqual(res, "PlainExtension");
        }

        [Test]
        public void ExtensionGenerateBaseTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            var res = jsEnv.Eval<BaseClass>(@"
                let obj = new CS.Puerts.UnitTest.BaseClass();
                puerts.$extension(CS.Puerts.UnitTest.BaseClass, CS.Puerts.UnitTest.BaseClassExtension);
                let res = obj.Extension();
                res;
            ");
            jsEnv.Dispose();
            Assert.AreEqual(res.ToString(), "Puerts.UnitTest.BaseClass");
        }

        public void ExtensionGenerateBaseTest_1()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            var res = jsEnv.Eval<BaseClass>(@"
                let obj = new CS.Puerts.UnitTest.BaseClass();
                puerts.$extension(CS.Puerts.UnitTest.BaseClass, CS.Puerts.UnitTest.BaseClassExtension);
                let res = obj.Extension1('123');
                res;
            ");
            jsEnv.Dispose();
            Assert.AreEqual(res.ToString(), "Puerts.UnitTest.BaseClass");
        }

        [Test]
        public void ExtensionGenerateBaseBase1Test_2()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            var res = jsEnv.Eval<string>(@"
                let obj = new CS.Puerts.UnitTest.BaseClass();
                let obj1 = new CS.Puerts.UnitTest.BaseClass1();
                puerts.$extension(CS.Puerts.UnitTest.BaseClass, CS.Puerts.UnitTest.BaseClassExtension);
                let res = obj.Extension2(obj1);
                res;
            ");
            jsEnv.Dispose();
            Assert.AreEqual(res, "Extension2<Puerts.UnitTest.BaseClass,Puerts.UnitTest.BaseClass1>");
        }

        [Test]
        public void ExtensionGenerateDerivedTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            var res = jsEnv.Eval<BaseClass>(@"
                let obj = new CS.Puerts.UnitTest.DerivedClass();
                puerts.$extension(CS.Puerts.UnitTest.BaseClass, CS.Puerts.UnitTest.BaseClassExtension);
                let res = obj.Extension();
                res;
            ");
            jsEnv.Dispose();
            Assert.AreEqual(res.ToString(), "Puerts.UnitTest.DerivedClass");
        }

        [Test]
        public void ExtensionGenerateDerivedBase1Test_2()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            var res = jsEnv.Eval<string>(@"
                let obj = new CS.Puerts.UnitTest.DerivedClass();
                let obj1 = new CS.Puerts.UnitTest.BaseClass1();
                puerts.$extension(CS.Puerts.UnitTest.BaseClass, CS.Puerts.UnitTest.BaseClassExtension);
                let res = obj.Extension2(obj1);
                res;
            ");
            jsEnv.Dispose();
            Assert.AreEqual(res, "Extension2<Puerts.UnitTest.BaseClass,Puerts.UnitTest.BaseClass1>");
        }

        [Test]
        public void ExtensionGenerateDerivedDerived1Test_2()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            var res = jsEnv.Eval<string>(@"
                let obj = new CS.Puerts.UnitTest.DerivedClass();
                let obj1 = new CS.Puerts.UnitTest.DerivedClass1();
                puerts.$extension(CS.Puerts.UnitTest.BaseClass, CS.Puerts.UnitTest.BaseClassExtension);
                let res = obj.Extension2(obj1);
                res;
            ");
            jsEnv.Dispose();
            Assert.AreEqual(res, "Extension2<Puerts.UnitTest.BaseClass,Puerts.UnitTest.BaseClass1>");
        }
    }
}
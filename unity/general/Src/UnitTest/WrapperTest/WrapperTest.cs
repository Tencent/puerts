using NUnit.Framework;
using System;

namespace Puerts.UnitTest 
{
    [TestFixture]
    public class WrapperUnitTest
    {
        [Test]
        public void PropertyTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            PuertsStaticWrap.AutoStaticCodeRegister.Register(jsEnv);
            string ret = jsEnv.Eval<string>(@"
                const CS = require('csharp');
                const i1 = CS.Puerts.UnitTest.WrapperTest.StaticProperty;
                CS.Puerts.UnitTest.WrapperTest.StaticProperty = 'Puerts'
                i1 + ' ' + CS.Puerts.UnitTest.WrapperTest.StaticProperty;
            ");

            jsEnv.Dispose();

            Assert.AreEqual("StaticProperty Puerts", ret);
        }

        [Test]
        public void GenericTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            PuertsStaticWrap.AutoStaticCodeRegister.Register(jsEnv);
            Type secondGenericType = jsEnv.Eval<Type>(@"
                const CS = require('csharp');
                const G1 = puerts.$generic(CS.Puerts.UnitTest.GenericGenTest$2, CS.System.Type, CS.System.Type);
                (new G1).GetGeneric2();
            ");

            jsEnv.Dispose();

            Assert.AreEqual(typeof(Type), secondGenericType);
        }

        [Test]
        public void GenericTest2()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            PuertsStaticWrap.AutoStaticCodeRegister.Register(jsEnv);
            Type secondGenericType = jsEnv.Eval<Type>(@"
                const CS = require('csharp');
                const G1 = new CS.Puerts.UnitTest.GenericGenTest2();
                G1.GetTypeTest('');
            ");

            jsEnv.Dispose();

            Assert.AreEqual(typeof(WrapperTestBase), secondGenericType);
        }

        [Test]
        public void GenericTest3()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            PuertsStaticWrap.AutoStaticCodeRegister.Register(jsEnv);
            Type secondGenericType = jsEnv.Eval<Type>(@"
                const CS = require('csharp');
                CS.Puerts.UnitTest.GenericGenTest2.GetGenericType();
            ");

            jsEnv.Dispose();

            Assert.AreEqual(typeof(GenericGenTest2), secondGenericType);
        }
    }
}
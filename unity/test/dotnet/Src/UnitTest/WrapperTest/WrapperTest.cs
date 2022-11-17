using NUnit.Framework;
using System;

namespace PuerTS.UnitTest 
{
    [TestFixture]
    public class WrapperUnitTest
    {
        [Test]
        public void PropertyTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            Utils.RegisterStaticWrapper(jsEnv);
            string ret = jsEnv.Eval<string>(@"
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
            Utils.RegisterStaticWrapper(jsEnv);
            Type secondGenericType = jsEnv.Eval<Type>(@"
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
            Utils.RegisterStaticWrapper(jsEnv);
            Type secondGenericType = jsEnv.Eval<Type>(@"
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
            Utils.RegisterStaticWrapper(jsEnv);
            Type secondGenericType = jsEnv.Eval<Type>(@"
                CS.Puerts.UnitTest.GenericGenTest2.GetGenericType();
            ");

            jsEnv.Dispose();

            Assert.AreEqual(typeof(GenericGenTest2), secondGenericType);
        }
    }
}
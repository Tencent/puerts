using NUnit.Framework;
using System;

namespace Puerts.UnitTest
{
    [TestFixture]
    public class ScriptEngineImpl
    {
        [Test]
        public void PassBaseClassAndDerivedClass()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            var b = jsEnv.Eval<ScriptObject>(@"
                class __BaseClassToPass {}
                __BaseClassToPass;
            ");
            var d = jsEnv.Eval<ScriptObject>(@"
                class __DerivedClassToPass extends __BaseClassToPass {}
                __DerivedClassToPass;
            ");
            Assert.AreNotEqual(b, d);
        }

        [Test]
        public void PassObjectAffect()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            var keys1 = jsEnv.Eval<string>(@"
                __PassObjectAffect = Object.create(null);
                __PassObjectAffect.a = 1;
                __PassObjectAffect.b = 2;
                Object.keys(__PassObjectAffect).join(',');
            ");
            jsEnv.Eval<ScriptObject>("__PassObjectAffect");
            var keys2 = jsEnv.Eval<string>(@"Object.keys(__PassObjectAffect).join(',');");
            Assert.AreEqual(keys1, keys2);
        }
    }
}
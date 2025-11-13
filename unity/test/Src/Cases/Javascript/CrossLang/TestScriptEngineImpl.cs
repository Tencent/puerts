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
    }
}
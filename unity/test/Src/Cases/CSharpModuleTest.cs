using NUnit.Framework;
using System;

namespace Puerts.UnitTest
{
    [TestFixture]
    public class CSharpModuleTest
    {
        public class Inner {
            [UnityEngine.Scripting.Preserve]
            public const int i = 3;
        }
        [Test]
        public void ConsoleLog()
        {
            var loader = UnitTestEnv.GetLoader();
            loader.AddMockFileContent("CSharpModuleTest-ConsoleLog/test.mjs", @"
                console.log('console.log ok')
                CS.UnityEngine.Debug.Log('CS.UnityEngine.Debug.Log ok')
            ");
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.ExecuteModule("CSharpModuleTest-ConsoleLog/test.mjs");
        }

        [Test]
        public void AccessInnerClass()
        {
            var loader = UnitTestEnv.GetLoader();
            loader.AddMockFileContent("CSharpModuleTest-AccessInnerClass/test.mjs", @"
                export default CS.Puerts.UnitTest.CSharpModuleTest.Inner.i
            ");
            var jsEnv = UnitTestEnv.GetEnv();
            int res = jsEnv.ExecuteModule<int>("CSharpModuleTest-AccessInnerClass/test.mjs", "default");
            Assert.AreEqual(res, Inner.i);
        }
    }
}
#if !UNITY_WEBGL
using NUnit.Framework;
using System;
// python不支持把class传递给C#，所以这个测试用例先注释
/*
namespace Puerts.UnitTest
{
    [TestFixture]
    public class ScriptEngineImplPython
    {
        [Test]
        public void PassBaseClassAndDerivedClass()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            pythonEnv.Eval(@"
exec('''
class __BaseClassToPass:
    pass
''')");
            var b = pythonEnv.Eval<ScriptObject>("__BaseClassToPass");
            
            pythonEnv.Eval(@"
exec('''
class __DerivedClassToPass(__BaseClassToPass):
    pass
''')");
            var d = pythonEnv.Eval<ScriptObject>("__DerivedClassToPass");
            
            Assert.AreNotEqual(b, d);
            pythonEnv.Dispose();
        }
    }
}
*/
#endif
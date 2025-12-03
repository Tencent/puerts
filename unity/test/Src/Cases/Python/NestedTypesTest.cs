#if !UNITY_WEBGL && !UNITY_IOS && !UNITY_ANDROID || FORCE_TEST_PYTHON
using System;

namespace Puerts.UnitTest
{
    [UnityEngine.Scripting.Preserve]
    public class TestNestedTypes
    {
        [UnityEngine.Scripting.Preserve]
        public class InnerClassA
        {
            public string Foo { get; set; } = "Hello";
            public InnerClassA()
            {

            }
        }
        [UnityEngine.Scripting.Preserve]
        public class InnerClassB
        {
            public string Bar { get; set; } = "Hello";
            public InnerClassB()
            {

            }
        }
        [UnityEngine.Scripting.Preserve]
        public class InnerClassB<T>
        {
            public string Bar { get; set; } = "Hello";
            public InnerClassB()
            {

            }
        }
        [UnityEngine.Scripting.Preserve]
        public class InnerClassB<T1, T2>
        {
            public string Bar { get; set; } = "Hello";
            public InnerClassB()
            {

            }
        }
    }

    [TestFixture]
    public class NestedTypesTestPython
    {
        [Test]
        public void TestNestedTypeInstantiation()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            pythonEnv.Eval(@"
exec('''
import Puerts.UnitTest.TestHelper as TestHelper
from System import Console, Int32, String
from Puerts.UnitTest import TestNestedTypes
assertAndPrint = TestHelper.AssertAndPrint
InnerClassA = TestNestedTypes.InnerClassA
InnerClassB = TestNestedTypes.InnerClassB
InnerClassB__T1 = puerts.generic(TestNestedTypes.InnerClassB__T1, Int32)
InnerClassB__T2 = puerts.generic(TestNestedTypes.InnerClassB__T2, Int32, String)
x = InnerClassA()
o = InnerClassB()
y = InnerClassB__T1()
z = InnerClassB__T2()
''')
");
            pythonEnv.Dispose();
        }
    }
}
#endif
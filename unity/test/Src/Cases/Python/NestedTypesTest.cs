#if !UNITY_WEBGL && !UNITY_IOS && !UNITY_ANDROID || FORCE_TEST_PYTHON
using System;
using NUnit.Framework;

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
InnerClassA = TestNestedTypes.InnerClassA
InnerClassB = TestNestedTypes.InnerClassB
InnerClassB_1 = TestNestedTypes.InnerClassB[Int32]
InnerClassB_2 = TestNestedTypes.InnerClassB[Int32, String]
x = InnerClassA()
o = InnerClassB()
y = InnerClassB_1()
z = InnerClassB_2()
''')
");
            pythonEnv.Dispose();
        }
    }
}
#endif
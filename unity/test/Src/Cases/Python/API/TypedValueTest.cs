#if !UNITY_WEBGL && !UNITY_IOS && !UNITY_ANDROID || FORCE_TEST_PYTHON
using NUnit.Framework;
using Puerts.UnitTest.JSTypeTest;
using System;

namespace Puerts.UnitTest.PythonTypeTest
{
    
    [TestFixture]
    public class TypedValueTestPython
    {
        [Test]
        public void Int64Value()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());

            pythonEnv.Eval(@"
exec('''
value = puerts.load_type('Puerts.Int64Value')(512)
puerts.load_type('Puerts.UnitTest.JSTypeTest.TypedValueTestHelper').Callback(value)
''')
");

            Assert.True(TypedValueTestHelper.GetLastCallbackValueType() == typeof(System.Int64));
            Assert.False(TypedValueTestHelper.GetLastCallbackValueType() == typeof(System.Int32));
            pythonEnv.Dispose();
        }

        [Test]
        public void FloatValue()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());

            pythonEnv.Eval(@"
exec('''
import Puerts
value = Puerts.FloatValue(512.256)
Puerts.UnitTest.JSTypeTest.TypedValueTestHelper.Callback(value)
''')
");

            Assert.True(TypedValueTestHelper.GetLastCallbackValueType() == typeof(System.Single));
            Assert.False(TypedValueTestHelper.GetLastCallbackValueType() == typeof(System.Int32));
            pythonEnv.Dispose();
        }
    }
}

#endif
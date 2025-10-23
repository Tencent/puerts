#if !UNITY_WEBGL
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
CS = CSharp()
# In Python, we use Int64Value to explicitly create int64 values
value = CS.load_type('Puerts.Int64Value')(512)
CS.load_type('Puerts.UnitTest.JSTypeTest.TypedValueTestHelper').Callback(value)
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
CS = CSharp()
# In Python, we need to explicitly cast to float
value = CS.load_type('Puerts.FloatValue')(512.256)
CS.load_type('Puerts.UnitTest.JSTypeTest.TypedValueTestHelper').Callback(value)
''')
");

            Assert.True(TypedValueTestHelper.GetLastCallbackValueType() == typeof(System.Single));
            Assert.False(TypedValueTestHelper.GetLastCallbackValueType() == typeof(System.Int32));
            pythonEnv.Dispose();
        }
    }
}

#endif
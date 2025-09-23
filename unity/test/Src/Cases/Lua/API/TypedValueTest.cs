using NUnit.Framework;
using Puerts.UnitTest.JSTypeTest;
using System;

namespace Puerts.UnitTest.LuaTypeTest
{
    
    [TestFixture]
    public class TypedValueTestLua
    {
        [Test]
        public void Int64Value()
        {
            var luaEnv = new ScriptEnv(new BackendLua());

            luaEnv.Eval(@"
                local CS = require('csharp')
                -- In Lua, we use regular numbers for int64 values
                local value = CS.Puerts.Int64Value(512)
                CS.Puerts.UnitTest.JSTypeTest.TypedValueTestHelper.Callback(value)
            ");

            Assert.True(TypedValueTestHelper.GetLastCallbackValueType() == typeof(System.Int64));
            Assert.False(TypedValueTestHelper.GetLastCallbackValueType() == typeof(System.Int32));
            luaEnv.Dispose();
        }

        [Test]
        public void FloatValue()
        {
            var luaEnv = new ScriptEnv(new BackendLua());

            luaEnv.Eval(@"
                local CS = require('csharp')
                -- In Lua, we need to explicitly cast to float
                local value = CS.Puerts.FloatValue(512.256)
                CS.Puerts.UnitTest.JSTypeTest.TypedValueTestHelper.Callback(value)
            ");

            Assert.True(TypedValueTestHelper.GetLastCallbackValueType() == typeof(System.Single));
            Assert.False(TypedValueTestHelper.GetLastCallbackValueType() == typeof(System.Int32));
            luaEnv.Dispose();
        }
    }
}
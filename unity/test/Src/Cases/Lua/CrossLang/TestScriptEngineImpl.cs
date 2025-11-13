using NUnit.Framework;
using System;

namespace Puerts.UnitTest
{
    [TestFixture]
    public class ScriptEngineImplLua
    {
        [Test]
        public void PassBaseClassAndDerivedClass()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            var b = luaEnv.Eval<ScriptObject>(@"
                __BaseClassToPass = {}
                __BaseClassToPass.__index = __BaseClassToPass
                return __BaseClassToPass
            ");
            var d = luaEnv.Eval<ScriptObject>(@"
                __DerivedClassToPass = {}
                __DerivedClassToPass.__index = __DerivedClassToPass
                setmetatable(__DerivedClassToPass, {__index = __BaseClassToPass})
                return __DerivedClassToPass
            ");
            Assert.AreNotEqual(b, d);
            luaEnv.Dispose();
        }
    }
}
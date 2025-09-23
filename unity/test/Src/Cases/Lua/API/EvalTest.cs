using NUnit.Framework;
using System;

namespace Puerts.UnitTest
{
    [TestFixture]
    public class EvalTestLua
    {
        [Test]
        public void EvalError()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            Assert.Catch(() =>
            {
                luaEnv.Eval(@"
                    local obj = {}; obj.func();
                ");
            });
            luaEnv.Dispose();
        }
        
        [Test]
        public void LuaModuleNotFound()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            try 
            {
                luaEnv.Eval("require('notfound/whatever')");
            } 
            catch(Exception e) 
            {
                StringAssert.Contains("notfound/whatever", e.Message);
                luaEnv.Dispose();
                return;
            }
            luaEnv.Dispose();
            throw new Exception("unexpected to reach here");
        }

        [Test]
        public void LuaCompileError()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            try 
            {
                luaEnv.Eval(@"
                    local function test()
                        return 1 +
                    end
                ");
            } 
            catch(Exception e) 
            {
                StringAssert.Contains("unexpected symbol near 'end'", e.Message);
                luaEnv.Dispose();
                return;
            }
            luaEnv.Dispose();
            throw new Exception("unexpected to reach here");
        }
        
        [Test]
        public void LuaRuntimeError()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            try 
            {
                luaEnv.Eval(@"
                    local obj = {}
                    obj.nonexistent()
                ");
            } 
            catch(Exception e) 
            {
                StringAssert.Contains("attempt to call", e.Message);
                luaEnv.Dispose();
                return;
            }
            luaEnv.Dispose();
            throw new Exception("unexpected to reach here");
        }

        [Test]
        public void PassNullLuaTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            luaEnv.Eval(@"
                local CS = require('csharp')
                local TestHelper = CS.Puerts.UnitTest.TestHelper
                local testHelper = TestHelper.GetInstance()
                testHelper:PassStr(nil)
                testHelper:PassObj(nil)
            ");
            luaEnv.Dispose();
        }
        
        [Test]
        public void ThrowNil()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            Assert.Catch(() =>
            {
                luaEnv.Eval(@"
                    error(nil)
                ");
            });
            luaEnv.Dispose();
        }
        
        [Test]
        public void ThrowString()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            Assert.Catch(() =>
            {
                luaEnv.Eval(@"
                    error('test error message')
                ");
            });
            luaEnv.Dispose();
        }
        
        [Test]
        public void ThrowInFunction()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            Assert.Catch(() =>
            {
                var foo = luaEnv.Eval<Action>(@"
                    return function()
                        error('test error in function')
                    end
                ");
                foo();
            });
            luaEnv.Dispose();
        }
    }
}
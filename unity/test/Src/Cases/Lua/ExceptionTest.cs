using NUnit.Framework;
using System;

namespace Puerts.UnitTest
{
    [UnityEngine.Scripting.Preserve]
    public class ExceptionTestHelperLua
    {
        [UnityEngine.Scripting.Preserve]
        public struct TestStruct { 
            public int Age; 
            public TestStruct(int a) { Age = a; } 
            public TestStruct(bool a) { 
                // testing checkLuaArguments
                Age = 0;
            } 
        }
        [UnityEngine.Scripting.Preserve]
        public class TestBaseClass { 
        }
        [UnityEngine.Scripting.Preserve]
        public class TestDerivedClass: TestBaseClass { 
        }

        [UnityEngine.Scripting.Preserve]
        public static void ArgAction(Action d) {
        }
        [UnityEngine.Scripting.Preserve]
        public static void ArgAction() {
            // just testing checkLuaArguments
        }

        [UnityEngine.Scripting.Preserve]
        public static void ArgDelegate(Delegate d) {
        }
        [UnityEngine.Scripting.Preserve]
        public static void ArgDelegate() {
            // just testing checkLuaArguments
        }

        [UnityEngine.Scripting.Preserve]
        public static void ArgMulticastDelegate(MulticastDelegate d) {
        }
        [UnityEngine.Scripting.Preserve]
        public static void ArgMulticastDelegate() {
            // just testing checkLuaArguments
        }

        [UnityEngine.Scripting.Preserve]
        public static long ArgLong(long l) {
            // no checkLuaArguments
            return l;
        }

        
        [UnityEngine.Scripting.Preserve]
        public static void ArgInt(int i) {
            
        }
        [UnityEngine.Scripting.Preserve]
        public static void ArgInt() {
            // testing checkLuaArguments
        }
        [UnityEngine.Scripting.Preserve]
        public static void ArgStruct(TestStruct s) {
            
        }
        [UnityEngine.Scripting.Preserve]
        public static void ArgStruct() {
            // testing checkLuaArguments
        }
        
        [UnityEngine.Scripting.Preserve]
        public static void ArgRefStruct(ref TestStruct s) {
            
        }
        [UnityEngine.Scripting.Preserve]
        public static void ArgRefStruct() {
            // testing checkLuaArguments
        }

        [UnityEngine.Scripting.Preserve]
        public string ArgDerivedClass(TestDerivedClass obj, int a, string b)
        {
            return b;
        }
    }

    [TestFixture]
    public class ExceptionTestLua
    {
        [Test]
        public void PassLuaFunctionToAction()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            luaEnv.Eval(@"
                local CS = require('csharp')
                CS.Puerts.UnitTest.ExceptionTestHelperLua.ArgAction(function() end)
            ");
            luaEnv.Dispose();
        }
        
        [Test]
        public void PassLuaFunctionToDelegate()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            Assert.Catch(()=> {
                luaEnv.Eval(@"
                    local CS = require('csharp')
                    CS.Puerts.UnitTest.ExceptionTestHelperLua.ArgDelegate(function() end)
                ");
            }, "invalid arguments");
            luaEnv.Dispose();
        }
        
        [Test]
        public void PassLuaFunctionToMulticastDelegate()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            Assert.Catch(()=> {
                luaEnv.Eval(@"
                    local CS = require('csharp')
                    CS.Puerts.UnitTest.ExceptionTestHelperLua.ArgMulticastDelegate(function() end)
                ");
            }, "invalid arguments");
            luaEnv.Dispose();
        }

        [Test]
        public void PassTableToLong()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            long ret = luaEnv.Eval<long>(@"
                local CS = require('csharp')
                return CS.Puerts.UnitTest.ExceptionTestHelperLua.ArgLong({})
            ");
            Assert.AreEqual(ret, 0);
            luaEnv.Dispose();
        }

        [Test]
        public void FunctionNotExistsException()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            Assert.Catch(()=> {
                luaEnv.Eval(@"
                    local CS = require('csharp')
                    local obj = CS.Puerts.UnitTest.ExceptionTestHelperLua()
                    obj:adds(1, 2)
                ");
            });
            luaEnv.Dispose();
        }

        [Test]
        public void InvalidArgumentsException()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            Assert.Catch(()=> {
                luaEnv.Eval(@"
                    local CS = require('csharp')
                    CS.Puerts.UnitTest.ExceptionTestHelperLua.ArgInt('gloria')
                ");
            });
            luaEnv.Dispose();
        }

        [Test]
        public void InvalidStructArgumentsException()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            Assert.Catch(()=> {
                luaEnv.Eval(@"
                    local CS = require('csharp')
                    local s = CS.Puerts.UnitTest.ExceptionTestHelperLua.TestStruct(1)
                    CS.Puerts.UnitTest.ExceptionTestHelperLua.ArgStruct('gloria')
                ");
            });
            luaEnv.Dispose();
        }
        
        [Test]
        public void PolymorphismMismatchedArgumentsException()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            Assert.Catch(()=> {
                luaEnv.Eval(@"
                    local CS = require('csharp')
                    local tbc = CS.Puerts.UnitTest.ExceptionTestHelperLua.TestBaseClass()
                    local helper = CS.Puerts.UnitTest.ExceptionTestHelperLua()
                    helper:ArgDerivedClass(tbc, 1, 'gloria')
                ");
            });
            luaEnv.Dispose();
        }
        
        [Test]
        public void InvalidRefStructArgumentsException()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            Assert.Catch(() =>
            {
                luaEnv.Eval(@"
                    local CS = require('csharp')
                    local ts = CS.Puerts.UnitTest.ExceptionTestHelperLua.TestStruct(1)
                    CS.Puerts.UnitTest.ExceptionTestHelperLua.ArgRefStruct(ts)
                ");
            });
            luaEnv.Dispose();
        }

        [Test]
        public void ConstructorArgumentsTypeMismatchedException()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            Assert.Catch(() =>
            {
                luaEnv.Eval(@"
                    local CS = require('csharp')
                    CS.Puerts.UnitTest.ExceptionTestHelperLua.TestStruct('expect to be a int')
                ");
            });
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
                    error('test error')
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
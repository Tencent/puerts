using NUnit.Framework;
using System;
using System.Reflection;

namespace Puerts.UnitTest
{
    public class OverloadTestB2Lua {
        [UnityEngine.Scripting.Preserve]
        public static int foo(bool x) {return 7;}
        [UnityEngine.Scripting.Preserve]
        public int foo(string x) {return 1;}
        [UnityEngine.Scripting.Preserve]
        public int foo(int x) {return 2;}
        [UnityEngine.Scripting.Preserve]
        public virtual int foo() {return 3;}
    }

    public class OverloadTestB1Lua : OverloadTestB2Lua {
        [UnityEngine.Scripting.Preserve]
        public static new int foo(string x) {return 8;}
        [UnityEngine.Scripting.Preserve]
        public new int foo(int x) {return 4;}
        [UnityEngine.Scripting.Preserve]
        public override int foo() {return 5;}
    }

    [UnityEngine.Scripting.Preserve]
    public class OverloadTestLua : OverloadTestB1Lua {
        [UnityEngine.Scripting.Preserve]
        public override int foo() {return 6;}
    }

    [UnityEngine.Scripting.Preserve]
    public class GenericMethodTestLua {
        public int Boo<A>(short x) {return 4;}
        public int Foo<A>() {return 1;}
        public void Foo<A>(ref int x) { x += 2; }
        public int Foo<A, B>() {return 3;}
        public void Foo<A, B>(int x) { }
        public C Foo<A, B, C>(out int x) { x = 5; return default; }
    }

    [TestFixture]
    public class CSharpModuleTestLua
    {
        [Test]
        public void ConsoleLog()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            luaEnv.Eval(@"
                local CS = require('csharp')
                print('Hello from Lua console')
            ");
            luaEnv.Dispose();
        }
        
        [Test]
        public void EmptyModule()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            luaEnv.Eval(@"
                -- Empty Lua module test
                local empty = {}
                return empty
            ");
            luaEnv.Dispose();
        }

        public class Inner {
            [UnityEngine.Scripting.Preserve]
            public const int i = 3;
        }

        [Test]
        public void AccessInnerClass()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            var result = luaEnv.Eval<int>(@"
                local CS = require('csharp')
                local inner = CS.Puerts.UnitTest.CSharpModuleTestLua.Inner
                return inner.i
            ");
            Assert.AreEqual(3, result);
            luaEnv.Dispose();
        }

        [Test]
        public void GenericMethodTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            
            // preserve generic implementations
            var x = new GenericMethodTestLua();
            x.Foo<int>();
            x.Boo<int>(0);
            int z = 1;
            x.Foo<int>(ref z);
            x.Foo<int, string>();
            x.Foo<int, string>(1);
            x.Foo<int, string, int>(out var y);
            
            luaEnv.Eval(@"
                local CS = require('csharp')
                local puerts = require('puerts')
                local obj = CS.Puerts.UnitTest.GenericMethodTestLua()
                
                -- Test generic method calls
                local func1 = puerts.genericMethod(CS.Puerts.UnitTest.GenericMethodTestLua, 'Foo', CS.System.Int32)
                local result1 = func1(obj)
                assert(result1 == 1, 'Generic method Foo<int>() should return 1')
                
                local func2 = puerts.genericMethod(CS.Puerts.UnitTest.GenericMethodTestLua, 'Foo', CS.System.Int32, CS.System.String)
                local result2 = func2(obj)
                assert(result2 == 3, 'Generic method Foo<int, string>() should return 3')
            ");
            luaEnv.Dispose();
        }
    }
}
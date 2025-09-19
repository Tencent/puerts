using NUnit.Framework;
using System;
using System.Reflection;

namespace Puerts.UnitTest
{
    public class OverloadTestB2 {
        [UnityEngine.Scripting.Preserve]
        public static int foo(bool x) {return 7;}
        [UnityEngine.Scripting.Preserve]
        public int foo(string x) {return 1;}
        [UnityEngine.Scripting.Preserve]
        public int foo(int x) {return 2;}
        [UnityEngine.Scripting.Preserve]
        public virtual int foo() {return 3;}
    }

    public class OverloadTestB1 : OverloadTestB2 {
        [UnityEngine.Scripting.Preserve]
        public static new int foo(string x) {return 8;}
        [UnityEngine.Scripting.Preserve]
        public new int foo(int x) {return 4;}
        [UnityEngine.Scripting.Preserve]
        public override int foo() {return 5;}
    }

    [UnityEngine.Scripting.Preserve]
    public class OverloadTest : OverloadTestB1 {
        [UnityEngine.Scripting.Preserve]
        public override int foo() {return 6;}
    }

    [UnityEngine.Scripting.Preserve]
    public class GenericMethodTest {
        public int Boo<A>(short x) {return 4;}
        public int Foo<A>() {return 1;}
        public void Foo<A>(ref int x) { x += 2; }
        public int Foo<A, B>() {return 3;}
        public void Foo<A, B>(int x) { }
        public C Foo<A, B, C>(out int x) { x = 5; return default; }
    }

    [TestFixture]
    public class CSharpModuleTest
    {
        [Test]
        public void ConsoleLog()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.ExecuteModule("CSharpModuleTest/console_log_test.mjs");
        }
        
        [Test]
        public void EmptyModule()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.ExecuteModule("CSharpModuleTest/empty.mjs");
        }

        public class Inner {
            [UnityEngine.Scripting.Preserve]
            public const int i = 3;
        }

        [Test]
        public void AccessInnerClass()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.ExecuteModule("CSharpModuleTest/access_innerclass_test.mjs");
        }

#if !UNITY_WEBGL
        [Test]
        public void ArrayExtension()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.ExecuteModule("CSharpModuleTest/array_extension_test.mjs");
        }
#endif
//         [Test]
//         public void ParentOverloadTest()
//         {
//             var jsEnv = UnitTestEnv.GetEnv();
//             var loader  =UnitTestEnv.GetLoader()
//             loader.AddMockFileContent("CSharpModuleTest/parent_overload_test.mjs", @"
// let Assert_AreEqual = CS.NUnit.Framework.Assert.AreEqual
// Assert_AreEqual((new CS.Puerts.UnitTest.OverloadTest()).foo(), 6)
// Assert_AreEqual((new CS.Puerts.UnitTest.OverloadTest()).foo(1), 4)
// Assert_AreEqual((new CS.Puerts.UnitTest.OverloadTest()).foo('1'), 1)
// Assert_AreEqual((new CS.Puerts.UnitTest.OverloadTestB1()).foo(), 5)
// Assert_AreEqual((new CS.Puerts.UnitTest.OverloadTestB1()).foo(1), 4)
// Assert_AreEqual((new CS.Puerts.UnitTest.OverloadTestB1()).foo('1'), 1)
// Assert_AreEqual((new CS.Puerts.UnitTest.OverloadTestB2()).foo(), 3)
// Assert_AreEqual((new CS.Puerts.UnitTest.OverloadTestB2()).foo(1), 2)
// Assert_AreEqual((new CS.Puerts.UnitTest.OverloadTestB2()).foo('1'), 1)
// Assert_AreEqual(CS.Puerts.UnitTest.OverloadTest.foo(true), 7)
// Assert_AreEqual(CS.Puerts.UnitTest.OverloadTest.foo('1'), 8)
// Assert_AreEqual(CS.Puerts.UnitTest.OverloadTestB1.foo(true), 7)
// Assert_AreEqual(CS.Puerts.UnitTest.OverloadTestB1.foo('1'), 8)
// Assert_AreEqual(CS.Puerts.UnitTest.OverloadTestB2.foo(true), 7)
// ")
//             jsEnv.ExecuteModule("CSharpModuleTest/parent_overload_test.mjs");
//         }

        [Test]
        public void GenericMethodTest()
        {
            // preserve generic implementations
            var x = new GenericMethodTest();
            x.Foo<int>();
            x.Boo<int>(0);
            int z = 1;
            x.Foo<int>(ref z);
            x.Foo<int, string>();
            x.Foo<int, string>(1);
            x.Foo<int, string, int>(out var y);
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.ExecuteModule("CSharpModuleTest/generic_method_test.mjs");
        }
    }
}
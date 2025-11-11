#if !UNITY_WEBGL
using NUnit.Framework;
using System;
using System.Reflection;

namespace Puerts.UnitTest
{
    public class OverloadTestB2Python {
        [UnityEngine.Scripting.Preserve]
        public static int foo(bool x) {return 7;}
        [UnityEngine.Scripting.Preserve]
        public int foo(string x) {return 1;}
        [UnityEngine.Scripting.Preserve]
        public int foo(int x) {return 2;}
        [UnityEngine.Scripting.Preserve]
        public virtual int foo() {return 3;}
    }

    public class OverloadTestB1Python : OverloadTestB2Python {
        [UnityEngine.Scripting.Preserve]
        public static new int foo(string x) {return 8;}
        [UnityEngine.Scripting.Preserve]
        public new int foo(int x) {return 4;}
        [UnityEngine.Scripting.Preserve]
        public override int foo() {return 5;}
    }

    [UnityEngine.Scripting.Preserve]
    public class OverloadTestPython : OverloadTestB1Python {
        [UnityEngine.Scripting.Preserve]
        public override int foo() {return 6;}
    }

    [UnityEngine.Scripting.Preserve]
    public class GenericMethodTestPython {
        public int Boo<A>(short x) {return 4;}
        public int Foo<A>() {return 1;}
        public void Foo<A>(ref int x) { x += 2; }
        public int Foo<A, B>() {return 3;}
        public void Foo<A, B>(int x) { }
        public C Foo<A, B, C>(out int x) { x = 5; return default; }
    }

    [TestFixture]
    public class CSharpModuleTestPython
    {
        [Test]
        public void ConsoleLog()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            pythonEnv.Eval(@"
exec('''
print('Hello from Python console')
''')
");
            pythonEnv.Dispose();
        }
        
        [Test]
        public void EmptyModule()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            pythonEnv.Eval(@"
exec('''
# Empty Python module test
empty = {}
''')
");
            pythonEnv.Dispose();
        }

        public class Inner {
            [UnityEngine.Scripting.Preserve]
            public const int i = 3;
        }

        [Test]
        public void AccessInnerClass()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            var result = pythonEnv.Eval<int>(@"
(lambda: (
    inner := puerts.load_type('Puerts.UnitTest.CSharpModuleTestPython+Inner'),
    inner.get_i()
)[-1])()
");
            Assert.AreEqual(3, result);
            pythonEnv.Dispose();
        }

        [Test]
        public void NameSpaceAccessTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            // 1 level namespace
            pythonEnv.Eval(@"
exec('''
import System.Console
''')
");
            // 2 level namespace
            pythonEnv.Eval(@"
exec('''
import System.Diagnostics
''')
");
            // 2 level namespace with class
            pythonEnv.Eval(@"
exec('''
import System.Diagnostics.Debug
''')
");
            // 2 level namespace with NameSpaceProxy Access
            pythonEnv.Eval(@"
exec('''
import System.Diagnostics
System.Diagnostics.Debug.WriteLine('Test')
''')
");

            // 2 level namespace with NameSpaceProxy Access
            pythonEnv.Eval(@"
exec('''
import System.Diagnostics as Diagnostics
Diagnostics.Debug.WriteLine('Test')
''')
");

            try
            {
                pythonEnv.Eval(@"
exec('''
import System.Diagnostics
System.Diagnostics.Hello
''')
");
            }
            catch (Exception e)
            {
                Assert.True(e.Message.Contains("ModuleNotFoundError: No namespace or type named System.Diagnostics.Hello"), "Unexpected error message" + e.Message);
            }

            try
            {
                pythonEnv.Eval(@"
exec('''
import System.Diagnostics as Diagnostics
Diagnostics.Hello
''')
");
            }
            catch (Exception e)
            {
                Assert.True(e.Message.Contains("ModuleNotFoundError: No namespace or type named System.Diagnostics.Hello"), "Unexpected error message" + e.Message);
            }
            pythonEnv.Dispose();
        }
        /*
        [Test]
        public void GenericMethodTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            
            // preserve generic implementations
            var x = new GenericMethodTestPython();
            x.Foo<int>();
            x.Boo<int>(0);
            int z = 1;
            x.Foo<int>(ref z);
            x.Foo<int, string>();
            x.Foo<int, string>(1);
            x.Foo<int, string, int>(out var y);
            
            pythonEnv.Eval(@"
exec('''
CS = CSharp()
obj = CS.load_type('Puerts.UnitTest.GenericMethodTestPython')()

# Test generic method calls
Int32 = CS.load_type('System.Int32')
String = CS.load_type('System.String')

# Get generic method and call it
cls = CS.load_type('Puerts.UnitTest.GenericMethodTestPython')
methods = CS.load_type('Puerts.Utils').GetMethodAndOverrideMethodByName($1, 'Foo')

# Find the Foo<A>() method
for i in range(methods.Length):
    method = methods.GetValue(i)
    if method.GetParameters().Length == 0 and method.GetGenericArguments().Length == 1:
        generic_method = method.MakeGenericMethod(Int32)
        result1 = generic_method.Invoke(obj, None)
        assert result1 == 1, 'Generic method Foo<int>() should return 1'
        break

# Find the Foo<A, B>() method
for i in range(methods.Length):
    method = methods.GetValue(i)
    if method.GetParameters().Length == 0 and method.GetGenericArguments().Length == 2:
        generic_method = method.MakeGenericMethod(Int32, String)
        result2 = generic_method.Invoke(obj, None)
        assert result2 == 3, 'Generic method Foo<int, string>() should return 3'
        break
''')
");
            pythonEnv.Dispose();
        }
        */
    }
}

#endif
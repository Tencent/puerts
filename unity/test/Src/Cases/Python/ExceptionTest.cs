#if !UNITY_WEBGL
using NUnit.Framework;
using System;

namespace Puerts.UnitTest
{
    [UnityEngine.Scripting.Preserve]
    public class ExceptionTestHelperPython
    {
        [UnityEngine.Scripting.Preserve]
        public struct TestStruct { 
            public int Age; 
            public TestStruct(int a) { Age = a; } 
            public TestStruct(bool a) { 
                // testing checkPythonArguments
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
            // just testing checkPythonArguments
        }

        [UnityEngine.Scripting.Preserve]
        public static void ArgDelegate(Delegate d) {
        }
        [UnityEngine.Scripting.Preserve]
        public static void ArgDelegate() {
            // just testing checkPythonArguments
        }

        [UnityEngine.Scripting.Preserve]
        public static void ArgMulticastDelegate(MulticastDelegate d) {
        }
        [UnityEngine.Scripting.Preserve]
        public static void ArgMulticastDelegate() {
            // just testing checkPythonArguments
        }

        [UnityEngine.Scripting.Preserve]
        public static long ArgLong(long l) {
            // no checkPythonArguments
            return l;
        }

        
        [UnityEngine.Scripting.Preserve]
        public static void ArgInt(int i) {
            
        }
        [UnityEngine.Scripting.Preserve]
        public static void ArgInt() {
            // testing checkPythonArguments
        }
        [UnityEngine.Scripting.Preserve]
        public static void ArgStruct(TestStruct s) {
            
        }
        [UnityEngine.Scripting.Preserve]
        public static void ArgStruct() {
            // testing checkPythonArguments
        }
        
        [UnityEngine.Scripting.Preserve]
        public static void ArgRefStruct(ref TestStruct s) {
            
        }
        [UnityEngine.Scripting.Preserve]
        public static void ArgRefStruct() {
            // testing checkPythonArguments
        }

        [UnityEngine.Scripting.Preserve]
        public string ArgDerivedClass(TestDerivedClass obj, int a, string b)
        {
            return b;
        }
    }

    [TestFixture]
    public class ExceptionTestPython
    {
        [Test]
        public void PassPythonFunctionToAction()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            pythonEnv.Eval(@"
exec('''
CS = CSharp()
CS.load_type('Puerts.UnitTest.ExceptionTestHelperPython').ArgAction(lambda: None)
''')
");
            pythonEnv.Dispose();
        }
        
        [Test]
        public void PassPythonFunctionToDelegate()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            Assert.Catch(()=> {
                pythonEnv.Eval(@"
exec('''
CS = CSharp()
CS.load_type('Puerts.UnitTest.ExceptionTestHelperPython').ArgDelegate(lambda: None)
''')
");
            }, "invalid arguments");
            pythonEnv.Dispose();
        }
        
        [Test]
        public void PassPythonFunctionToMulticastDelegate()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            Assert.Catch(()=> {
                pythonEnv.Eval(@"
exec('''
CS = CSharp()
CS.load_type('Puerts.UnitTest.ExceptionTestHelperPython').ArgMulticastDelegate(lambda: None)
''')
");
            }, "invalid arguments");
            pythonEnv.Dispose();
        }

        // 不同版本py表现不一样，有的会抛异常，有的不会，先去掉这个测试
        /*
        [Test]
        public void PassDictToLong()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            Assert.Catch(()=> {
            pythonEnv.Eval(@"
(lambda: (
    CS := CSharp(),
    CS.load_type('Puerts.UnitTest.ExceptionTestHelperPython').ArgLong({})
)[-1])()
");
            }, "'dict' object cannot be interpreted as an integer");
            pythonEnv.Dispose();
        }
        */

        [Test]
        public void FunctionNotExistsException()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            Assert.Catch(()=> {
                pythonEnv.Eval(@"
exec('''
CS = CSharp()
obj = CS.load_type('Puerts.UnitTest.ExceptionTestHelperPython')()
obj.adds(1, 2)
''')
");
            });
            pythonEnv.Dispose();
        }

        [Test]
        public void InvalidArgumentsException()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            Assert.Catch(()=> {
                pythonEnv.Eval(@"
exec('''
CS = CSharp()
CS.load_type('Puerts.UnitTest.ExceptionTestHelperPython').ArgInt('gloria')
''')
");
            });
            pythonEnv.Dispose();
        }

        [Test]
        public void InvalidStructArgumentsException()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            Assert.Catch(()=> {
                pythonEnv.Eval(@"
exec('''
CS = CSharp()
TestStruct = CS.load_type('Puerts.UnitTest.ExceptionTestHelperPython+TestStruct')
s = TestStruct(1)
CS.load_type('Puerts.UnitTest.ExceptionTestHelperPython').ArgStruct('gloria')
''')
");
            });
            pythonEnv.Dispose();
        }
        
        [Test]
        public void PolymorphismMismatchedArgumentsException()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            Assert.Catch(()=> {
                pythonEnv.Eval(@"
exec('''
CS = CSharp()
TestBaseClass = CS.load_type('Puerts.UnitTest.ExceptionTestHelperPython+TestBaseClass')
tbc = TestBaseClass()
helper = CS.load_type('Puerts.UnitTest.ExceptionTestHelperPython')()
helper.ArgDerivedClass(tbc, 1, 'gloria')
''')
");
            });
            pythonEnv.Dispose();
        }
        
        [Test]
        public void InvalidRefStructArgumentsException()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            Assert.Catch(() =>
            {
                pythonEnv.Eval(@"
exec('''
CS = CSharp()
TestStruct = CS.load_type('Puerts.UnitTest.ExceptionTestHelperPython+TestStruct')
ts = TestStruct(1)
CS.load_type('Puerts.UnitTest.ExceptionTestHelperPython').ArgRefStruct(ts)
''')
");
            });
            pythonEnv.Dispose();
        }

        [Test]
        public void ConstructorArgumentsTypeMismatchedException()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            Assert.Catch(() =>
            {
                pythonEnv.Eval(@"
exec('''
CS = CSharp()
TestStruct = CS.load_type('Puerts.UnitTest.ExceptionTestHelperPython+TestStruct')
TestStruct('expect to be a int')
''')
");
            });
            pythonEnv.Dispose();
        }
        
        [Test]
        public void ThrowNone()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            Assert.Catch(() =>
            {
                pythonEnv.Eval(@"
exec('''
raise Exception(None)
''')
");
            });
            pythonEnv.Dispose();
        }
        
        [Test]
        public void ThrowString()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            Assert.Catch(() =>
            {
                pythonEnv.Eval(@"
exec('''
raise Exception('test error')
''')
");
            });
            pythonEnv.Dispose();
        }
        
        [Test]
        public void ThrowInFunction()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            Assert.Catch(() =>
            {
                var foo = pythonEnv.Eval<Action>(@"
exec('''
def foo():
    raise Exception('test error in function')
''')
foo
");
                foo();
            });
            pythonEnv.Dispose();
        }
    }
}

#endif
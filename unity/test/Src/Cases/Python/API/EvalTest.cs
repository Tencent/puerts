using NUnit.Framework;
using System;

namespace Puerts.UnitTest
{
    [TestFixture]
    public class EvalTestPython
    {
        [Test]
        public void EvalError()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            Assert.Catch(() =>
            {
                pythonEnv.Eval(@"
exec('''
obj = {}
obj['func']()
''')
");
            });
            pythonEnv.Dispose();
        }
        
        [Test]
        public void PythonModuleNotFound()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            try 
            {
                pythonEnv.Eval("__import__('notfound.whatever')");
            } 
            catch(Exception e) 
            {
                StringAssert.Contains("notfound", e.Message);
                pythonEnv.Dispose();
                return;
            }
            pythonEnv.Dispose();
            throw new Exception("unexpected to reach here");
        }

        [Test]
        public void PythonCompileError()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            try 
            {
                pythonEnv.Eval(@"
exec('''
def test():
    return 1 +
''')
");
            } 
            catch(Exception e) 
            {
                StringAssert.Contains("SyntaxError", e.Message);
                pythonEnv.Dispose();
                return;
            }
            pythonEnv.Dispose();
            throw new Exception("unexpected to reach here");
        }
        
        [Test]
        public void PythonRuntimeError()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            try 
            {
                pythonEnv.Eval(@"
exec('''
obj = {}
obj['nonexistent']()
''')
");
            } 
            catch(Exception e) 
            {
                StringAssert.Contains("KeyError", e.Message);
                pythonEnv.Dispose();
                return;
            }
            pythonEnv.Dispose();
            throw new Exception("unexpected to reach here");
        }

        [Test]
        public void PassNullPythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            pythonEnv.Eval(@"
exec('''
CS = CSharp()
TestHelper = CS.load_type('Puerts.UnitTest.TestHelper')
testHelper = TestHelper.GetInstance()
testHelper.PassStr(None)
testHelper.PassObj(None)
''')
");
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
raise Exception('test error message')
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

#if !UNITY_WEBGL && !UNITY_IOS && !UNITY_ANDROID || FORCE_TEST_PYTHON
using NUnit.Framework;
using System;
using System.Runtime.InteropServices;

namespace Puerts.UnitTest
{
    [TestFixture]
    public class GenericUnitPythonTest
    {
        [Test]
        public void ListGenericPythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            var res = pythonEnv.Eval<int>(@"
(lambda: (
    ListInt := puerts.generic(puerts.load_type('System.Collections.Generic.List`1'), puerts.load_type('System.Int32')),
    ls := ListInt(),
    ls.Add(1),
    ls.Add(2),
    ls.Add(3),
    puerts.load_type('Puerts.UnitTest.GenericTestHelper').TestList(ls)
)[-1])()
");
            Assert.AreEqual(res, 6);
            pythonEnv.Dispose();
        }

        [Test]
        public void StaticGenericMethodPythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            string genericTypeName1 = pythonEnv.Eval<string>(@"
(lambda: (
    GenericTestClass := puerts.load_type('Puerts.UnitTest.GenericTestClass'),
    Int32 := puerts.load_type('System.Int32'),
    puerts.generic_method(GenericTestClass, 'StaticGenericMethod', Int32)()
)[-1])()
");
            Assert.AreEqual(genericTypeName1, "Int32");
            pythonEnv.Dispose();
        }


        [Test]
        public void ListRangePythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            pythonEnv.Eval(@"
exec('''
import System.Collections.Generic.List_1 as List_1
import System
ListInt = puerts.generic(List_1, System.Int32)
ls = ListInt()
ls.Add(1)
ls.Add(2)
result = puerts.load_type('Puerts.UnitTest.GenericTestHelper').TestListRange(ls, 1)
''')
");

            pythonEnv.Dispose();
        }

        [Test]
        public void StaticGenericMethodInvalidGenericArgumentsPythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            try
            {
                pythonEnv.Eval<string>(@"
(lambda: (
    GenericTestClass := puerts.load_type('Puerts.UnitTest.GenericTestClass'),
    func := puerts.generic_method(GenericTestClass, 'StaticGenericMethod', 3),
    func()
)[-1])()
");
                Assert.True(false);
            }
            catch (Exception e)
            {
                Assert.True(e.Message.Contains("invalid Type for generic arguments") || e.Message.Contains("MakeGenericMethod"));
            }
            pythonEnv.Dispose();
        }

        [Test]
        public void StaticGenericMethodInvalidCallArgumentsPythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            Assert.Catch(() =>
            {
                string genericTypeName1 = pythonEnv.Eval<string>(@"
(lambda: (
    GenericTestClass := puerts.load_type('Puerts.UnitTest.GenericTestClass'),
    Int32 := puerts.load_type('System.Int32'),
    func := puerts.generic_method(GenericTestClass, 'StaticGenericMethod', Int32),
    func('hello')
)[-1])()
");
            }, "invalid arguments to StaticGenericMethod");
            pythonEnv.Dispose();
        }

        [Test]
        public void StaticGenericMethodTestOverloadPythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            string result = pythonEnv.Eval<string>(@"
(lambda: (
    GenericTestClass := puerts.load_type('Puerts.UnitTest.GenericTestClass'),
    Int32 := puerts.load_type('System.Int32'),
    func := puerts.generic_method(GenericTestClass, 'StaticGenericMethod', Int32),
    func(3)
)[-1])()
");
            Assert.AreEqual(result, "3");
            pythonEnv.Dispose();
        }

        /*[Test]
        public void InstanceGenericMethodPythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            string result = pythonEnv.Eval<string>(@"
(lambda: (
    GenericTestClass := puerts.load_type('Puerts.UnitTest.GenericTestClass'),
    Int32 := puerts.load_type('System.Int32'),
    testobj := GenericTestClass(),
    setattr(testobj, 'stringProp', 'world'),
    method := puerts.generic_method(GenericTestClass, 'InstanceGenericMethod', Int32),
    method(testobj)
)[-1])()
");
            Assert.AreEqual(result, "world_Int32");
            pythonEnv.Dispose();
        }*/

        [Test]
        public void GenericAccessPythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            string result = pythonEnv.Eval<string>(@"
(lambda: (
    GenericTestClass_T1 := puerts.load_type('Puerts.UnitTest.GenericTestClass`1'),
    String := puerts.load_type('System.String'),
    GenericTestClass := puerts.generic(GenericTestClass_T1, String),
    setattr(GenericTestClass, 'v', '6'),
    Inner := GenericTestClass.Inner,
    Inner(),
    Inner.stringProp
)[-1])()
");
            Assert.AreEqual(result, "hello");
            pythonEnv.Dispose();
        }

        [Test]
        public void GenericAccessGetItemSyntaxPythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            string result = pythonEnv.Eval<string>(@"
(lambda: (
    GenericTestClass_T1 := puerts.load_type('Puerts.UnitTest.GenericTestClass`1'),
    String := puerts.load_type('System.String'),
    GenericTestClass := GenericTestClass_T1[String],
    setattr(GenericTestClass, 'v', '6'),
    Inner := GenericTestClass.Inner,
    Inner(),
    Inner.stringProp
)[-1])()
");
            Assert.AreEqual(result, "hello");
            pythonEnv.Dispose();
        }

#if !UNITY_WEBGL || UNITY_EDITOR
        [Test]
        public void CreateFunctionByMethodInfoPythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            string result = pythonEnv.Eval<string>(@"
(lambda: (
    GenericTestClass := puerts.load_type('Puerts.UnitTest.GenericTestClass'),
    Int32 := puerts.load_type('System.Int32'),

    func := puerts.generic_method(GenericTestClass, 'StaticGenericMethod', Int32),
    result := func() + func(1024),
    result
)[-1])()
");
            Assert.AreEqual(result, "Int321024");
            pythonEnv.Dispose();
        }
#endif

    }
}

#endif
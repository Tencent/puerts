#if !UNITY_WEBGL && !UNITY_IOS && !UNITY_ANDROID
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
        
        /*[Test]
        public void StaticGenericMethodPythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            string genericTypeName1 = pythonEnv.Eval<string>(@"
(lambda: (
    CS := CSharp(),
    GenericTestClass := CS.load_type('Puerts.UnitTest.GenericTestClass'),
    Int32 := CS.load_type('System.Int32'),
    Utils := CS.load_type('Puerts.Utils'),
    methods := Utils.GetMethodAndOverrideMethodByName($1, 'StaticGenericMethod'),
    result := [None],
    [
        (
            result.__setitem__(0, method.MakeGenericMethod(Int32).Invoke(None, None))
            if method.GetParameters().Length == 0 and method.GetGenericArguments().Length == 1
            else None
        )
        for i in range(methods.Length)
        for method in [methods.GetValue(i)]
    ],
    result[0]
)[-1])()
");
            Assert.AreEqual(genericTypeName1, "Int32");
            pythonEnv.Dispose();
        }
        */

        [Test]
        public void ListRangePythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            pythonEnv.Eval(@"
exec('''
import System.Collections.Generic.List__T1 as List
import System
ListInt = puerts.generic(List, System.Int32)
ls = ListInt()
ls.Add(1)
ls.Add(2)
result = puerts.load_type('Puerts.UnitTest.GenericTestHelper').TestListRange(ls, 1)
''')
");

            pythonEnv.Dispose();
        }
        /*
        [Test]
        public void StaticGenericMethodInvalidClassPythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            try
            {
                pythonEnv.Eval<string>(@"
exec('''
CS = CSharp()
Int32 = CS.load_type('System.Int32')
Utils = CS.load_type('Puerts.Utils')
TypeExtensions = CS.load_type('Puerts.TypeExtensions')
UnitTest = CS.load_type('Puerts.UnitTest')
methods = Utils.GetMethodAndOverrideMethodByName($1, 'StaticGenericMethod')
result = ''
''')
result
");
            }
            catch (Exception e)
            {
                StringAssert.Contains("the class must be a constructor", e.Message);
                pythonEnv.Dispose();
                return;
            }
            pythonEnv.Dispose();
            throw new Exception("unexpected reach here");
        }

        [Test]
        public void StaticGenericMethodInvalidGenericArgumentsPythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            try
            {
                pythonEnv.Eval<string>(@"
exec('''
CS = CSharp()
GenericTestClass = CS.load_type('Puerts.UnitTest.GenericTestClass')
Utils = CS.load_type('Puerts.Utils')
TypeExtensions = CS.load_type('Puerts.TypeExtensions')
methods = Utils.GetMethodAndOverrideMethodByName($1, 'StaticGenericMethod')

# Try to use invalid type argument (number instead of Type)
for i in range(methods.Length):
    method = methods.GetValue(i)
    if method.GetParameters().Length == 0 and method.GetGenericArguments().Length == 1:
        generic_method = method.MakeGenericMethod(3)
        result = generic_method.Invoke(None, None)
        break
''')
result
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
    CS := CSharp(),
    GenericTestClass := CS.load_type('Puerts.UnitTest.GenericTestClass'),
    Int32 := CS.load_type('System.Int32'),
    Utils := CS.load_type('Puerts.Utils'),
    TypeExtensions := CS.load_type('Puerts.TypeExtensions'),
    methods := Utils.GetMethodAndOverrideMethodByName(GenericTestClass, 'StaticGenericMethod'),
    result := [
        (
            generic_method := methods.GetValue(i).MakeGenericMethod(Int32),
            Array := CS.load_type('System.Array'),
            args := Array.CreateInstance(CS.load_type('System.Object'), 1),
            args.SetValue('hello', 0),
            generic_method.Invoke(None, args)
        )[-1]
        for i in range(methods.Length)
        if methods.GetValue(i).GetParameters().Length == 1 and methods.GetValue(i).GetGenericArguments().Length == 1
    ],
    ''
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
    CS := CSharp(),
    GenericTestClass := CS.load_type('Puerts.UnitTest.GenericTestClass'),
    Int32 := CS.load_type('System.Int32'),
    Utils := CS.load_type('Puerts.Utils'),
    methods := Utils.GetMethodAndOverrideMethodByName($1, 'StaticGenericMethod'),
    Array := CS.load_type('System.Array'),
    result := [None],
    [
        (
            args := Array.CreateInstance(CS.load_type('System.Object'), 1),
            args.SetValue(3, 0),
            result.__setitem__(0, method.MakeGenericMethod(Int32).Invoke(None, args))
        )[-1]
        if (params := method.GetParameters()).Length == 1 and method.GetGenericArguments().Length == 1
        else None
        for i in range(methods.Length)
        for method in [methods.GetValue(i)]
    ],
    result[0]
)[-1])()
");
            Assert.AreEqual(result, "3");
            pythonEnv.Dispose();
        }

        [Test]
        public void InstanceGenericMethodPythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            string result = pythonEnv.Eval<string>(@"
(lambda: (
    CS := CSharp(),
    GenericTestClass := CS.load_type('Puerts.UnitTest.GenericTestClass'),
    Int32 := CS.load_type('System.Int32'),
    testobj := GenericTestClass(),
    setattr(testobj, 'stringProp', 'world'),
    Utils := CS.load_type('Puerts.Utils'),
    methods := Utils.GetMethodAndOverrideMethodByName($1, 'InstanceGenericMethod'),
    result := [None],
    [
        (
            result.__setitem__(0, method.MakeGenericMethod(Int32).Invoke(testobj, None))
            if method.GetParameters().Length == 0 and method.GetGenericArguments().Length == 1
            else None
        )
        for i in range(methods.Length)
        for method in [methods.GetValue(i)]
    ],
    result[0]
)[-1])()
");
            Assert.AreEqual(result, "world_Int32");
            pythonEnv.Dispose();
        }

        [Test]
        public void GenericAccessPythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            string result = pythonEnv.Eval<string>(@"
(lambda: (
    CS := CSharp(),
    GenericTestClass_1 := CS.load_type('Puerts.UnitTest.GenericTestClass`1'),
    String := CS.load_type('System.String'),
    GenericTestClass := GenericTestClass_1[String],
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
exec('''
CS = CSharp()
GenericTestClass = CS.load_type('Puerts.UnitTest.GenericTestClass')
Int32 = CS.load_type('System.Int32')
Utils = CS.load_type('Puerts.Utils')
TypeExtensions = CS.load_type('Puerts.TypeExtensions')
cls = TypeExtensions.GetType(GenericTestClass)
methods = Utils.GetMethodAndOverrideMethodByName($1, 'StaticGenericMethod')

# Collect all overloads
overloads = []
for i in range(methods.Length):
    method = methods.GetValue(i)
    overloads.append(method.MakeGenericMethod(Int32))

# Test both overloads
result1 = ''''
result2 = ''''
for method in overloads:
    params = method.GetParameters()
    if params.Length == 0:
        result1 = method.Invoke(None, None)
    elif params.Length == 1:
        Array = CS.load_type('System.Array')
        args = Array.CreateInstance(CS.load_type('System.Object'), 1)
        args.SetValue(1024, 0)
        result2 = method.Invoke(None, args)

result = result1 + result2
')
result
");
            Assert.AreEqual(result, "Int321024");
            pythonEnv.Dispose();
        }
#endif
        */
    }
}

#endif
#if !UNITY_WEBGL && !UNITY_IOS
using NUnit.Framework;
using System;
using System.Runtime.InteropServices;
using System.Security.Cryptography;

namespace Puerts.UnitTest
{
    [TestFixture]
    public class CrossLangTestPython
    {
        /*[Test]
        public void ArrayBufferInstancePythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            pythonEnv.Eval(@"
exec(
'''
CS = CSharp()

TestHelper = CS.load_type('Puerts.UnitTest.TestHelper')
assertAndPrint = TestHelper.AssertAndPrint
testHelper = TestHelper.GetInstance()

outRef = [None]

oAB = bytes([1])

def callback_func(bi):
    assertAndPrint('PythonGetArrayBufferArgFromCS', bi[0], 2)
    res = bytearray([3])
    return res

rAB = testHelper.ArrayBufferTestPipeLine(oAB, outRef, callback_func)

assertAndPrint('PythonGetArrayBufferOutArgFromCS', outRef[0][0], 4)
assertAndPrint('PythonGetArrayBufferReturnFromCS', rAB[0], 5)

testHelper.arrayBufferTestField = bytes([192])
testHelper.arrayBufferTestProp = bytes([192])
TestHelper.set_arrayBufferTestFieldStatic(bytes([192]))
TestHelper.set_arrayBufferTestPropStatic(bytes([192]))

tmp = TestHelper.get_arrayBufferTestPropStatic

testHelper.ArrayBufferTestCheckMemberValue()

assertAndPrint('PythonArrayBufferShouldBeCopied', tmp[0], 192)
''')
");
            pythonEnv.Dispose();
        }*/

        /*[Test]
        public void ScriptFunctionInstancePythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            pythonEnv.Eval(@"
exec('''
CS = CSharp()
TestHelper = CS.load_type('Puerts.UnitTest.TestHelper')
assertAndPrint = TestHelper.AssertAndPrint
testHelper = TestHelper.GetInstance()

def oFunc():
    return 3

def callback(func):
    return oFunc

def evfn():
    return 30

testHelper.add_functionEvent(evfn)

testHelper.functionTestField = lambda: 3
testHelper.functionTestProp = lambda: 3
TestHelper.set_functionTestFieldStatic(lambda: 3)
TestHelper.set_functionTestPropStatic(lambda: 3)

testHelper.JSFunctionTestCheckMemberValue()

testHelper.remove_functionEvent(evfn)
''')
");
            pythonEnv.Dispose();
        }*/

        [Test]
        public void StringInstancePythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            pythonEnv.Eval(@"
exec('''
import Puerts.UnitTest.TestHelper
TestHelper = Puerts.UnitTest.TestHelper
assertAndPrint = TestHelper.AssertAndPrint
testHelper = TestHelper.GetInstance()
outRef = ['abc']
oStr = outRef[0]

def string_callback(str_arg):
    assertAndPrint('PyGetStringArgFromCS', str_arg, 'abcd')
    return 'abcde'

rStr = testHelper.StringTestPipeLine(oStr, outRef, string_callback)

assertAndPrint('PyGetStringOutArgFromCS', outRef[0], oStr + 'def')
assertAndPrint('PyGetStringReturnFromCS', rStr, oStr + 'defg')

testHelper.ClearStringTestMemberValue()
testHelper.stringTestField = 'Puer'
testHelper.stringTestProp = 'Puer'
TestHelper.set_stringTestFieldStatic('Puer')
TestHelper.set_stringTestPropStatic('Puer')

testHelper.StringTestCheckMemberValue()

ustr = testHelper.UnicodeStr('你好')
assertAndPrint('UnicodeStr', ustr, '小马哥')
''')
");
            pythonEnv.Dispose();
        }

        [Test]
        public void NativeObjectInstancePythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            pythonEnv.Eval(@"
exec('''
import Puerts.UnitTest.TestHelper as TestHelper
import Puerts.UnitTest.TestObject as TestObject
assertAndPrint = TestHelper.AssertAndPrint
testHelper = TestHelper.GetInstance()

oNativeObject = TestObject(1)
outRef = [oNativeObject]

def native_object_callback(obj):
    assertAndPrint('PythonGetNativeObjectArgFromCS', obj.value, oNativeObject.value)
    return oNativeObject

rNativeObject = testHelper.NativeObjectTestPipeLine(oNativeObject, outRef, native_object_callback)

assertAndPrint('PythonGetNativeObjectOutArgFromCS', outRef[0].value, oNativeObject.value)
assertAndPrint('PythonGetNativeObjectReturnFromCS', rNativeObject.value, oNativeObject.value)

testHelper.ClearStringTestMemberValue()
testHelper.nativeObjectTestField = TestObject(678)
testHelper.nativeObjectTestProp = TestObject(678)
TestHelper.set_nativeObjectTestFieldStatic(TestObject(678))
TestHelper.set_nativeObjectTestPropStatic(TestObject(678))

testHelper.NativeObjectTestCheckMemberValue()
''')
");
            pythonEnv.Dispose();
        }
        
/*        [Test]
        public void ScriptObjectInstancePythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            pythonEnv.Eval(@"
exec('''
import Puerts
TestHelper = CS.load_type('Puerts.UnitTest.TestHelper')
assertAndPrint = TestHelper.AssertAndPrint
testHelper = TestHelper.GetInstance()
Debug = CS.load_type('System.Diagnostics.Debug')
oJSObject = {'puerts': 'niubi'}

def js_object_callback(obj):
    assertAndPrint('PythonGetJSObjectArgFromCS', obj['puerts'], oJSObject['puerts'])
    return oJSObject

rJSObject = testHelper.JSObjectTestPipeLine(oJSObject, js_object_callback)

assertAndPrint('PythonGetJSObjectReturnFromCS', rJSObject == oJSObject)

testHelper.jsObjectTestField = {'puerts': 'niubi'}
testHelper.jsObjectTestProp = {'puerts': 'niubi'}
TestHelper.set_jsObjectTestFieldStatic({'puerts': 'niubi'})
TestHelper.set_jsObjectTestPropStatic({'puerts': 'niubi'})

testHelper.JSObjectTestCheckMemberValue()
''')
");
            pythonEnv.Dispose();
        }*/

        [Test]
        public void DateTimePythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            pythonEnv.Eval(@"
exec('''
import Puerts.UnitTest.CrossLangTestHelper as CrossLangTestHelper
import System.DateTime as DateTime

helper = CrossLangTestHelper()
val = helper.GetDateTime()

result = val.GetType() == puerts.typeof(DateTime)
''')
");
            var ret = pythonEnv.Eval<string>("str(result).lower()");
            Assert.AreEqual("true", ret);
            pythonEnv.Dispose();
        }

        [Test]
        public void EnumPythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            pythonEnv.Eval(@"
exec('''
import Puerts.UnitTest.CrossLangTestHelper as CrossLangTestHelper
import Puerts.UnitTest.TestEnum as TestEnum
helper = CrossLangTestHelper()
fstart = helper.EnumField
helper.EnumField = TestEnum.get_A()
fend = helper.EnumField
ret = helper.GetEnum()
''')
");
            var ret = pythonEnv.Eval<string>("str(fstart) + ' ' + str(fend) + ' ' + str(ret)");
            Assert.AreEqual("213 1 213", ret);
            pythonEnv.Dispose();
        }

        [Test]
        public void AccessExplicitInterfaceImplementationPythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            var ret = pythonEnv.Eval<float>(@"puerts.load_type('Puerts.UnitTest.FooVE').Instance().foo.width");
            Assert.AreEqual(125f, ret);
            pythonEnv.Dispose();
        }

        [Test]
        public void OverloadPythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            pythonEnv.Eval(@"
exec('''
import Puerts.UnitTest.OverloadTestObject as OverloadTestObject
o = OverloadTestObject()
o.WithObjectParam('tt')
''')");
            Assert.AreEqual(1, OverloadTestObject.LastCall);
            pythonEnv.Eval(@"
exec('''
import Puerts.UnitTest.OverloadTestObject as OverloadTestObject
o = OverloadTestObject()
o.WithObjectParam(888)
''')");
            Assert.AreEqual(2, OverloadTestObject.LastCall);
            pythonEnv.Dispose();
        }

        // python的函数是不支持直接设置属性的
        /*
        [Test]
        public void FuncAsScriptObjectPythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            pythonEnv.Eval(@"
exec('''
def foo():
    pass
''')
");
            var jso = pythonEnv.Eval<ScriptObject>(@"foo");
            Assert.True(jso != null);
            pythonEnv.Dispose();
        }
        */

        [Test]
        public void EnumParamCheckPythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            pythonEnv.Eval(@"puerts.load_type('Puerts.UnitTest.CrossLangTestHelper').TestEnumCheck('a', 1, 2)");
            pythonEnv.Dispose();
        }

        [Test]
        public void PassNullPythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            pythonEnv.Eval(@"
exec('''
import Puerts.UnitTest.TestHelper as TestHelper
testHelper = TestHelper.GetInstance()
testHelper.PassStr(None)
testHelper.PassObj(None)
''')");
            pythonEnv.Dispose();
        }

        [Test]
        public void WriteOnlyPythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            pythonEnv.Eval(@"
exec('''
import Puerts.UnitTest.TestObject as TestObject
o = TestObject(1)
o.WriteOnly = 2
TestObject.set_StaticWriteOnly(3)
''')");
            Assert.Catch(() =>
            {
                pythonEnv.Eval("o.WriteOnly");
            });

            Assert.Catch(() =>
            {
                pythonEnv.Eval("TestObject.get_StaticWriteOnly");
            });

            pythonEnv.Dispose();
        }

        [Test]
        public void TestStructAccessPythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            var ret = pythonEnv.Eval<string>(@"puerts.load_type('Puerts.UnitTest.TestStruct2')(5345, 3214, 'fqpziq').ToString()");
            Assert.AreEqual("5345:3214:fqpziq", ret);
            pythonEnv.Dispose();
        }

        [Test]
        public void CallDelegateAfterpythonEnvDisposedTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            var callback = pythonEnv.Eval<Action>(@"lambda: print('hello')");
            callback();
            pythonEnv.Dispose();
            Assert.Catch(() =>
            {
                callback();
            });
        }

#if !UNITY_WEBGL || UNITY_EDITOR
        [Test]
        public void TestPythonGCTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            TestGC.ObjCount = 0;
            pythonEnv.Eval(@"
exec('''
import random
objs = []
def func():
    import Puerts.UnitTest.TestGC as TestGC
    random_count = random.randint(1, 51)
    for i in range(random_count):
        objs.append(TestGC())
    return random_count
''')
");
            var objCount = pythonEnv.Eval<int>(@"func()");

            pythonEnv.Eval("__import__('gc').collect()");

            GC.Collect();
            GC.WaitForPendingFinalizers();
            GC.Collect();

            Assert.AreEqual(objCount, TestGC.ObjCount);
            Assert.True(objCount > 0);

            pythonEnv.Eval("exec('del objs')");
            pythonEnv.Eval("__import__('gc').collect()");

            GC.Collect();
            GC.WaitForPendingFinalizers();
            GC.Collect();

            Assert.AreEqual(0, TestGC.ObjCount);

            pythonEnv.Dispose();
        }

        [Test]
        public void TestPythonStructGCTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            TestGC.ObjCount = 0;
            pythonEnv.Eval(@"
exec('''
import random
objs = []
def func():
    import Puerts.UnitTest.TakeTestGC as TakeTestGC
    random_count = random.randint(1, 51)
    for i in range(random_count):
        objs.append(TakeTestGC(1))
    return random_count
''')
");
            var objCount = pythonEnv.Eval<int>(@"func()");

            pythonEnv.Eval("__import__('gc').collect()");

            GC.Collect();
            GC.WaitForPendingFinalizers();
            GC.Collect();

            Assert.AreEqual(objCount, TestGC.ObjCount);
            Assert.True(objCount > 0);

            pythonEnv.Eval("exec('del objs')");
            pythonEnv.Eval("__import__('gc').collect()");

            GC.Collect();
            GC.WaitForPendingFinalizers();
            GC.Collect();

            Assert.AreEqual(0, TestGC.ObjCount);

            pythonEnv.Dispose();
        }
#endif

        [Test]
        public void PythonOptionalParametersTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            pythonEnv.Eval(@"
exec('''
__GMSG = ""test""
def __GCB(a, b = 0):
    if b == 0:
        globals()[""__GMSG""] = str(a)
    else:
        globals()[""__GMSG""] = str(a) + str(b)
''')
");
            // Cast as Action<int>
            var cb1 = pythonEnv.Eval<Action<int>>("__GCB");
            cb1(1);
            var msg1 = pythonEnv.Eval<string>("__GMSG");
            Assert.AreEqual("1", msg1);

            // Cast as Action<string, long>
            var cb2 = pythonEnv.Eval<Action<string, long>>("__GCB");
            cb2("hello", 999);
            var msg2 = pythonEnv.Eval<string>("__GMSG");
            Assert.AreEqual("hello999", msg2);
        }

        [Test]
        public void NotGenericPythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            pythonEnv.Eval(@"
exec('''
def __NGTF(a):
    return str(a)
''')
");

            var cb = pythonEnv.Eval<Func<long, string>>("__NGTF");
            var ret = cb(9999);
            Assert.AreEqual("9999", ret);
            pythonEnv.Dispose();
        }

        [Test]
        public void BigIntInstancePythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            pythonEnv.Eval(@"
exec('''
import Puerts.UnitTest.TestHelper as TestHelper
assertAndPrint = TestHelper.AssertAndPrint
testHelper = TestHelper.GetInstance()
testHelper.ClearNumberTestMemberValue()
outRef = [0]
oBigint = 9007199254740992
outRef[0] = oBigint

def callback_function(bigint):
    assertAndPrint('PythonGetBigintArgFromCS', bigint, oBigint + 1)
    return oBigint + 2

rBigint = testHelper.BigIntTestPipeLine(oBigint, outRef, callback_function)

assertAndPrint('PythonGetBigintOutArgFromCS', outRef[0], oBigint + 3)
assertAndPrint('PythonGetBigintReturnFromCS', rBigint, oBigint + 4)
testHelper.ClearBigintTestMemberValue();
testHelper.bigintTestField = 9007199254740987
testHelper.bigintTestProp = 9007199254740987
TestHelper.set_bigintTestFieldStatic(9007199254740987)
TestHelper.set_bigintTestPropStatic(9007199254740987)
testHelper.BigintTestCheckMemberValue()
''')
");
            pythonEnv.Dispose();
        }

/*        [Test]
        public void EnumArrayPythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            var ret = pythonEnv.Eval<string>(@"str(type(CSharp().load_type('Puerts.UnitTest.CrossLangTestHelper')().EnumArray[0]))");
            Assert.AreEqual("number", ret);
            pythonEnv.Dispose();
        }*/

        [Test]
        public void BigULongPythonTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            pythonEnv.Eval(@"
exec('''
import Puerts.UnitTest.TestHelper as TestHelper
assertAndPrint = TestHelper.AssertAndPrint
testHelper = TestHelper.GetInstance()
''')
");
            var res = pythonEnv.Eval<string>(@"str(testHelper.GetBigULong())");
            Assert.AreEqual((((ulong)long.MaxValue) + 1).ToString(), res);
            pythonEnv.Dispose();
        }
    }
}
#endif
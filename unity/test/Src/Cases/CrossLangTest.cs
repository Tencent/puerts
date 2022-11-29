using NUnit.Framework;
using System;

namespace Puerts.UnitTest
{
    [TestFixture]
    public class CrossLangTest
    {
        [Test]
        public void JSFunctionInstanceTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const TestHelper = loadType(jsEnv.GetTypeByString('Puerts.UnitTest.TestHelper'))
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

                    const testHelper = TestHelper.GetInstance(jsEnv);

                    const oFunc = testHelper.functionTestStartValue
                    testHelper.JSFunctionTestPipeLine(oFunc, function (func) {
                        testHelper.functionTestEndValue = () => 3;
                        return testHelper.functionTestEndValue;
                    });
                })()
            ");
        }
        [Test]
        public void NumberInstanceTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const TestHelper = loadType(jsEnv.GetTypeByString('Puerts.UnitTest.TestHelper'))
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

                    const testHelper = TestHelper.GetInstance(jsEnv);

                    const outRef = [];
                    const oNum = outRef[0] = testHelper.numberTestStartValue;
                    const rNum = testHelper.NumberTestPipeLine(oNum, outRef, function (num) {
                        assertAndPrint('JSGetNumberArgFromCS', num, oNum + 1);
                        testHelper.numberTestEndValue = oNum + 2;
                        return testHelper.numberTestEndValue;
                    });
                    assertAndPrint('JSGetNumberOutArgFromCS', outRef[0], oNum + 3);
                    assertAndPrint('JSGetNumberReturnFromCS', rNum, oNum + 4);
                })()
            ");
        }
        [Test]
        public void StringInstanceTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const TestHelper = loadType(jsEnv.GetTypeByString('Puerts.UnitTest.TestHelper'))
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

                    const testHelper = TestHelper.GetInstance(jsEnv);

                    const outRef = [];
                    const oNum = outRef[0] = testHelper.numberTestStartValue;
                    const rNum = testHelper.NumberTestPipeLine(oNum, outRef, function (num) {
                        assertAndPrint('JSGetNumberArgFromCS', num, oNum + 1);
                        testHelper.numberTestEndValue = oNum + 2;
                        return testHelper.numberTestEndValue;
                    });
                    assertAndPrint('JSGetNumberOutArgFromCS', outRef[0], oNum + 3);
                    assertAndPrint('JSGetNumberReturnFromCS', rNum, oNum + 4);
                })()
            ");
        }
        [Test]
        public void BoolInstanceTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const TestHelper = loadType(jsEnv.GetTypeByString('Puerts.UnitTest.TestHelper'))
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

                    const testHelper = TestHelper.GetInstance(jsEnv);

                    const outRef = [];
                    const oBool = outRef[0] = testHelper.boolTestStartValue;
                    const rBool = testHelper.BoolTestPipeLine(oBool, outRef, function (b) {
                        assertAndPrint('JSGetBoolArgFromCS', b, false);
                        testHelper.boolTestEndValue = true;
                        return testHelper.boolTestEndValue;
                    });
                    assertAndPrint('JSGetBoolOutArgFromCS', outRef[0], false);
                    assertAndPrint('JSGetBoolReturnFromCS', rBool, false);
                })()
            ");
        }
        //

        [Test]
        public void BigIntInstanceTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const TestHelper = loadType(jsEnv.GetTypeByString('Puerts.UnitTest.TestHelper'))
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

                    const testHelper = TestHelper.GetInstance(jsEnv);

                    const outRef = [];
                    const oBigInt = outRef[0] = testHelper.bigIntTestStartValue;
                    const rBigInt = testHelper.BigIntTestPipeLine(oBigInt, outRef, function (bi) {
                        assertAndPrint('JSGetBigIntArgFromCS', bi == oBigInt + 1n);
                        testHelper.bigIntTestEndValue = oBigInt + 2n;
                        return testHelper.bigIntTestEndValue;
                    });
                    assertAndPrint('JSGetBigIntOutArgFromCS', outRef[0] == oBigInt + 3n);
                    assertAndPrint('JSGetBigIntReturnFromCS', rBigInt == oBigInt + 4n);
                })()
            ");
        }
        [Test]
        public void NativeStructInstanceTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const TestHelper = loadType(jsEnv.GetTypeByString('Puerts.UnitTest.TestHelper'))
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

                    const testHelper = TestHelper.GetInstance(jsEnv);

                    const outRef = [];
                    const oNativeObjectStruct = outRef[0] = testHelper.nativeObjectStructTestStartValue;
                    const rNativeObjectStruct = testHelper.NativeObjectStructTestPipeLine(oNativeObjectStruct, outRef, function (obj) {
                        assertAndPrint('JSGetNativeObjectStructArgFromCS', obj.value == oNativeObjectStruct.value);
                        testHelper.nativeObjectStructTestEndValue = oNativeObjectStruct;
                        return testHelper.nativeObjectStructTestEndValue;
                    });
                    assertAndPrint('JSGetNativeObjectStructOutArgFromCS', outRef[0].value == oNativeObjectStruct.value);
                    assertAndPrint('JSGetNativeObjectStructReturnFromCS', rNativeObjectStruct.value == oNativeObjectStruct.value);

                })()
            ");
        }
        [Test]
        public void NativeObjectInstanceTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const TestHelper = loadType(jsEnv.GetTypeByString('Puerts.UnitTest.TestHelper'))
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

                    const testHelper = TestHelper.GetInstance(jsEnv);

                    const outRef = [];
                    const oNativeObject = outRef[0] = testHelper.nativeObjectTestStartValue;;
                    const rNativeObject = testHelper.NativeObjectTestPipeLine(oNativeObject, outRef, function (obj) {
                        assertAndPrint('JSGetNativeObjectArgFromCS', obj, oNativeObject);
                        testHelper.nativeObjectTestEndValue = oNativeObject;
                        return testHelper.nativeObjectTestEndValue;
                    });
                    assertAndPrint('JSGetNativeObjectOutArgFromCS', outRef[0], oNativeObject);
                    assertAndPrint('JSGetNativeObjectReturnFromCS', rNativeObject, oNativeObject);
                })()
            ");
        }
        // [Test]
        // public void JSObjectInstanceTest()
        // {
        //     var jsEnv = UnitTestEnv.GetEnv();
        //     jsEnv.Eval(@"
        //         (function() {
        //             const TestHelper = loadType(jsEnv.GetTypeByString('Puerts.UnitTest.TestHelper'))
        //             const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

        //             const testHelper = TestHelper.GetInstance(jsEnv);

        //             const oJSObject = { 'puerts': 'niubi' };
        //             const rJSObject = testHelper.JSObjectTestPipeLine(oJSObject, function(obj) {
        //                 assertAndPrint('JSGetJSObjectArgFromCS', obj == oJSObject);
        //                 return oJSObject
        //             });
        //             assertAndPrint('JSGetJSObjectReturnFromCS', rJSObject == oJSObject);

        //         })()
        //     ");
        // }
        // [Test]
        // public void DateTimeInstanceTest()
        // {
        //     var jsEnv = UnitTestEnv.GetEnv();
        //     jsEnv.Eval(@"
        //         (function() {
        //             const TestHelper = loadType(jsEnv.GetTypeByString('Puerts.UnitTest.TestHelper'))
        //             const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

        //             const testHelper = TestHelper.GetInstance(jsEnv);

        //             const outRef = [];
        //             const oDate = outRef[0] = new Date('1998-11-11');
        //             const rDate = testHelper.DateTestPipeLine(oDate, outRef, function(date) {
        //                 assertAndPrint('JSGetDateArgFromCS', date.getTime(), oDate.getTime());
        //                 return oDate;
        //             });
        //             assertAndPrint('JSGetDateOutArgFromCS', outRef[0].getTime(), oDate.getTime());
        //             assertAndPrint('JSGetDateReturnFromCS', rDate.getTime(), oDate.getTime());
        //         })()
        //     ");
        // }
        // [Test]
        // public void ArrayBufferInstanceTest()
        // {
        //     var jsEnv = UnitTestEnv.GetEnv();
        //     jsEnv.Eval(@"
        //         (function() {
        //             const TestHelper = loadType(jsEnv.GetTypeByString('Puerts.UnitTest.TestHelper'))
        //             const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

        //             const testHelper = TestHelper.GetInstance(jsEnv);

        //             const outRef = [];
        //             const oAB = new Uint8Array([1]).buffer;
        //             const rAB = testHelper.ArrayBufferTestPipeLine(oAB, outRef, function(bi) {
        //                 assertAndPrint('JSGetArrayBufferArgFromCS', new Uint8Array(bi), 2);
        //                 return new Uint8Array([3]).buffer
        //             });
        //             assertAndPrint('JSGetArrayBufferOutArgFromCS', new Uint8Array(outRef[0]), 4);
        //             assertAndPrint('JSGetArrayBufferReturnFromCS', new Uint8Array(rAB), 5);
        //         })()
        //     ");
        // }
    }

    public class TestObject
    {
        public int value;
        public TestObject(int val)
        {
            value = val;
        }
    }
    public struct TestStruct
    {
        public int value;
        public TestStruct(int val)
        {
            value = val;
        }
    }
    public class TestHelper
    {
        protected static TestHelper instance;
        public static TestHelper GetInstance(JsEnv env) 
        { 
            if (instance == null) 
            {
                instance = new TestHelper(env);
            }
            return instance; 
        }

        public static void AssertAndPrint(string name, object a, object b)
        {
            bool success = true;
            if ((a == null || b == null) && a != b) 
            {
                success = false;
            }
            else 
            {
                Type aType = a.GetType();
                Type bType = b.GetType();
                if (
                    (aType.IsPrimitive || aType == typeof(string)) &&
                    (bType.IsPrimitive || bType == typeof(string)) ?
                    a.ToString() != b.ToString() : a != b
                ) {
                    success = false;
                }
            }
            if (!success)
            {
                throw new Exception($"{name} expect equals but failed: got {a} == {b}! ");
            }
        }

        public static void AssertAndPrint(string name, bool passed)
        {
            if (passed)
            {
            }
            else
            {                
                throw new Exception($"{name} failed! ");
            }
        }

        public TestHelper(JsEnv env)
        {
        }

        /**
        * 保证初始值返回3.后续每次交互用的都是同一个初始值
        */
        public Func<int> JSFunctionTestPipeLine(Func<int> initialValue, Func<Func<int>, Func<int>> JSValueHandler)
        {
            AssertAndPrint("CSGetFunctionFieldFromCS", initialValue(), functionTestStartValue());
            AssertAndPrint("CSGetFunctionArgFromJS", initialValue(), 3);
            AssertAndPrint("CSGetFunctionReturnFromJS", JSValueHandler(initialValue)(), initialValue());
            AssertAndPrint("CSSetFunctionFieldFromJS", functionTestEndValue(), 3);
            return functionTestEndValue;
        }
        public Func<int> functionTestStartValue = () => 3;
        public Func<int> functionTestEndValue = null;
        /**
        * 初始值1，每次交互+1
        */
        public int NumberTestPipeLine(int initialValue, out int outArg, Func<int, int> JSValueHandler)
        {
            AssertAndPrint("CSGetNumberFieldFromCS", initialValue, numberTestStartValue);
            AssertAndPrint("CSGetNumberArgFromJS", initialValue, 1);
            AssertAndPrint("CSGetNumberReturnFromJS", JSValueHandler(initialValue + 1), 3);
            AssertAndPrint("CSSetNumberFieldFromJS", numberTestEndValue, 3);
            outArg = 4;
            return 5;
        }
        public int numberTestStartValue = 1;
        public int numberTestEndValue = 0;
        /**
        * 判断引用即可
        */
        public DateTime DateTestPipeLine(DateTime initialValue, out DateTime outArg, Func<DateTime, DateTime> JSValueHandler)
        {
            AssertAndPrint("CSGetDateArgFromJS", initialValue.ToString(), "1998/11/11 0:00:00");
            AssertAndPrint("CSGetDateReturnFromJS", JSValueHandler(initialValue), initialValue);
            outArg = initialValue;
            return initialValue;
        }
        /**
        * 初始值 'abc'
        * 后续每次交互往后多加一个字母
        */
        public string StringTestPipeLine(string initialValue, out string outArg, Func<string, string> JSValueHandler)
        {
            AssertAndPrint("CSGetStringFieldFromCS", initialValue, stringTestStartValue);
            AssertAndPrint("CSGetStringArgFromJS", initialValue, "abc");
            AssertAndPrint("CSGetStringReturnFromJS", JSValueHandler(initialValue + "d"), "abcde");
            AssertAndPrint("CSSetStringFieldFromJS", stringTestEndValue, "abcde");
            outArg = "abcdef";
            return "abcdefg";
        }
        public string stringTestStartValue = "abc";
        public string stringTestEndValue = "";
        /**
        * js到cs都是true，cs到js都是false
        */
        public bool BoolTestPipeLine(bool initialValue, out bool outArg, Func<bool, bool> JSValueHandler)
        {
            AssertAndPrint("CSGetBoolFieldFromCS", initialValue, boolTestStartValue);
            AssertAndPrint("CSGetBoolArgFromJS", initialValue);
            AssertAndPrint("CSGetBoolReturnFromJS", JSValueHandler(false));
            AssertAndPrint("CSSetBoolFieldFromJS", boolTestEndValue);
            outArg = false;
            return false;
        }
        public bool boolTestStartValue = true;
        public bool boolTestEndValue = false;
        /**
        * 初始值 9007199254740992 (js侧Number.MAX_SAFE_INTEGER+1)
        * 后续每次交互都+1
        */
        public long BigIntTestPipeLine(long initialValue, out long outArg, Func<long, long> JSValueHandler)
        {
            AssertAndPrint("CSGetBigIntFieldFromCS", initialValue, bigIntTestStartValue);
            AssertAndPrint("CSGetBigIntArgFromJS", initialValue, 9007199254740992);
            AssertAndPrint("CSGetBigIntReturnFromJS", JSValueHandler(initialValue + 1), initialValue + 2);
            AssertAndPrint("CSSetBigIntFieldFromJS", bigIntTestEndValue, initialValue + 2);
            outArg = initialValue + 3;
            return initialValue + 4;
        }
        public long bigIntTestStartValue = 9007199254740992;
        public long bigIntTestEndValue = 0;
        /**
        */
        // public Puerts.ArrayBuffer ArrayBufferTestPipeLine(Puerts.ArrayBuffer initialValue, out Puerts.ArrayBuffer outArg, Func<Puerts.ArrayBuffer, Puerts.ArrayBuffer> JSValueHandler) 
        // {
        //     AssertAndPrint("CSGetArrayBufferArgFromJS", initialValue.Bytes.Length == 1 && initialValue.Bytes[0] == 1);
        //     initialValue.Bytes[0] = 2;
        //     AssertAndPrint("CSGetArrayBufferReturnFromJS", JSValueHandler(initialValue).Bytes[0] == 3);
        //     initialValue.Bytes[0] = 4;
        //     outArg = initialValue;
        //     byte[] bytes = new byte[1] { 5 };
        //     return new Puerts.ArrayBuffer(bytes);
        // }
        /**
        * 判断引用即可
        */
        public TestObject NativeObjectTestPipeLine(TestObject initialValue, out TestObject outArg, Func<TestObject, TestObject> JSValueHandler)
        {
            AssertAndPrint("CSGetNativeObjectFieldFromCS", initialValue, nativeObjectTestStartValue);
            AssertAndPrint("CSGetNativeObjectArgFromJS", initialValue != null && initialValue.value == 1);
            AssertAndPrint("CSGetNativeObjectReturnFromJS", JSValueHandler(initialValue), initialValue);
            AssertAndPrint("CSSetNativeObjectFieldFromJS", nativeObjectTestEndValue, initialValue);

            outArg = initialValue;
            return initialValue;
        }
        public TestObject nativeObjectTestStartValue = new TestObject(1);
        public TestObject nativeObjectTestEndValue = null;
        /**
        * 结构体，判断值相等
        */
        public TestStruct NativeObjectStructTestPipeLine(TestStruct initialValue, out TestStruct outArg, Func<TestStruct, TestStruct> JSValueHandler)
        {
            AssertAndPrint("CSGetNativeObjectStructFieldFromCS", initialValue.value, nativeObjectStructTestStartValue.value);
            AssertAndPrint("CSGetNativeObjectStructArgFromJS", initialValue.value, 1);
            AssertAndPrint("CSGetNativeObjectStructReturnFromJS", JSValueHandler(initialValue).value, initialValue.value);
            AssertAndPrint("CSSetNativeObjectStructFieldFromJS", nativeObjectStructTestEndValue.value, initialValue.value);

            outArg = initialValue;
            return initialValue;
        }
        public TestStruct nativeObjectStructTestStartValue = new TestStruct(1);
        public TestStruct nativeObjectStructTestEndValue = default(TestStruct);
        /**
        * CS侧暂无法处理，判断引用即可
        */
        public JSObject JSObjectTestPipeLine(JSObject initialValue, Func<JSObject, JSObject> JSValueHandler) 
        {
            AssertAndPrint("CSGetJSObjectArgFromJS", initialValue != null);
            AssertAndPrint("CSGetJSObjectReturnFromJS", JSValueHandler(initialValue) == initialValue);
            return initialValue;
        }

        public Func<object> ReturnAnyTestFunc;

        public void InvokeReturnAnyTestFunc(TestStruct srcValue)
        {
            var ret = (TestStruct)ReturnAnyTestFunc.Invoke();
            AssertAndPrint("InvokeReturnNativeObjectStructTestFunc", srcValue.value, ret.value);
        }
    }
}
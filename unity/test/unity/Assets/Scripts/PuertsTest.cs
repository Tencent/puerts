using UnityEngine;
using Puerts;
using System;
using System.Runtime.InteropServices;

//Number
//Date
//String
//Boolean
//BigInt
//Object
//Struct
//Function
//JSObject
//ArrayBuffer

namespace PuertsTest
{

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
        public static TestHelper instance;
        public static TestHelper GetInstance() { return instance; }

        public static void AssertAndPrint(string name, object a, object b)
        {
            Type aType = a.GetType();
            Type bType = b.GetType();
            if (
                (aType.IsPrimitive || aType == typeof(string)) &&
                (bType.IsPrimitive || bType == typeof(string)) ?
                a.ToString() != b.ToString() : a != b
            )
            {
#if !UNITY_EDITOR
                UnityEngine.Debug.LogError($"TestCase {name} expect {a} == {b} but failed! ");
#else
                UnityEngine.Debug.LogError($"<color=magenta>TestCase {name} expect {a} == {b} but failed!</color>");
#endif
            } else {
#if !UNITY_EDITOR
                UnityEngine.Debug.Log($"TestCase {name} success!");
#else
                UnityEngine.Debug.Log($"<color=cyan>TestCase {name} success!</color>");
#endif
            }
        }

        public static void AssertAndPrint(string name, bool passed)
        {
            if (passed)
            {
#if !UNITY_EDITOR
                UnityEngine.Debug.Log($"TestCase {name} success!");
#else
                UnityEngine.Debug.Log($"<color=cyan>TestCase {name} success!</color>");
#endif
            }
            else
            {
#if !UNITY_EDITOR
                UnityEngine.Debug.LogError($"TestCase {name} failed!");
#else
                UnityEngine.Debug.LogError($"<color=magenta>TestCase {name} failed!</color>");
#endif
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
            AssertAndPrint("CSGetFunctionArgFromJS", initialValue(), 3);
            AssertAndPrint("CSGetFunctionReturnFromJS", JSValueHandler(initialValue), initialValue);
            return initialValue;
        }
        /**
        * 初始值1，每次交互+1
        */
        public int NumberTestPipeLine(int initialValue, out int outArg, Func<int, int> JSValueHandler) 
        {
            AssertAndPrint("CSGetNumberArgFromJS", initialValue, 1);
            AssertAndPrint("CSGetNumberReturnFromJS", JSValueHandler(initialValue + 1), 3);
            outArg = 4;
            return 5;
        }
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
            AssertAndPrint("CSGetStringArgFromJS", initialValue, "abc");
            AssertAndPrint("CSGetStringReturnFromJS", JSValueHandler(initialValue + "d"), "abcde");
            outArg = "abcdef";
            return "abcdefg";
        }
        /**
        * js到cs都是true，cs到js都是false
        */
        public bool BoolTestPipeLine(bool initialValue, out bool outArg, Func<bool, bool> JSValueHandler) 
        {
            AssertAndPrint("CSGetBoolArgFromJS", initialValue);
            AssertAndPrint("CSGetBoolReturnFromJS", JSValueHandler(false));
            outArg = false;
            return false;
        }
        /**
        * 初始值 9007199254740992 (js侧Number.MAX_SAFE_INTEGER+1)
        * 后续每次交互都+1
        */
        public long BigIntTestPipeLine(long initialValue, out long outArg, Func<long, long> JSValueHandler) 
        {
            AssertAndPrint("CSGetBigIntArgFromJS", initialValue, 9007199254740992);
            AssertAndPrint("CSGetBigIntReturnFromJS", JSValueHandler(initialValue + 1), initialValue + 2);
            outArg = initialValue + 3;
            return initialValue + 4;
        }
        /**
        * 初始值 9007199254740992 (js侧Number.MAX_SAFE_INTEGER+1)
        * 后续每次交互都+1
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
            AssertAndPrint("CSGetNativeObjectArgFromJS", initialValue != null && initialValue.value == 1);
            AssertAndPrint("CSGetNativeObjectReturnFromJS", JSValueHandler(initialValue), initialValue);
            outArg = initialValue;
            return initialValue;
        }
        /**
        * 结构体，判断值相等
        */
        public TestStruct NativeObjectStructTestPipeLine(TestStruct initialValue, out TestStruct outArg, Func<TestStruct, TestStruct> JSValueHandler) 
        {
            AssertAndPrint("CSGetNativeObjectStructArgFromJS", initialValue.value, 1);
            AssertAndPrint("CSGetNativeObjectStructReturnFromJS", JSValueHandler(initialValue).value, initialValue.value);
            outArg = initialValue;
            return initialValue;
        }
        /**
        * CS侧暂无法处理，判断引用即可
        */
        // public JSObject JSObjectTestPipeLine(JSObject initialValue, Func<JSObject, JSObject> JSValueHandler) 
        // {
        //     AssertAndPrint("CSGetJSObjectArgFromJS", initialValue != null);
        //     AssertAndPrint("CSGetJSObjectReturnFromJS", JSValueHandler(initialValue) == initialValue);
        //     return initialValue;
        // }

        public Func<object> ReturnAnyTestFunc;

        public void InvokeReturnAnyTestFunc(TestStruct srcValue){
            var ret = (TestStruct)ReturnAnyTestFunc.Invoke();
            AssertAndPrint("InvokeReturnNativeObjectStructTestFunc", srcValue.value, ret.value);
        }
    }

    public class PuertsTest : MonoBehaviour
    {
        void Awake()
        {
        }

        void Start()
        {
            var jsEnv = new JsEnv();
            var helper = new TestHelper(jsEnv);
            TestHelper.instance = helper;
            var JSContent = Resources.Load<TextAsset>("datatype-test").text;
            jsEnv.Eval(JSContent);
            // Action<TestHelper> doTest = jsEnv.Eval<Action<TestHelper>>(JSContent);
            // UnityEngine.Debug.Log(doTest);
            // doTest(helper);
            // UnityEngine.Debug.Log(22222);
            jsEnv.Dispose();
        }

        void Update()
        {
        }
    }
}
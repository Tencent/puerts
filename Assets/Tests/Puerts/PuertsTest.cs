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
    }
    public class TestHelper
    {
        public static void AssertAndPrint(string name, bool passed)
        {
            if (passed)
            {
#if UNITY_WEBGL && !UNITY_EDITOR
                UnityEngine.Debug.Log($"TestCase {name} success!");
#else
                UnityEngine.Debug.Log($"<color=cyan>TestCase {name} success!</color>");
#endif
            }
            else
            {
#if UNITY_WEBGL && !UNITY_EDITOR
                UnityEngine.Debug.LogError($"TestCase {name} failed!");
#else
                UnityEngine.Debug.LogError($"<color=red>TestCase {name} failed!</color>");
#endif
            }
        }

        public TestHelper(JsEnv env)
        {
            env.UsingFunc<int>();
            env.UsingFunc<DateTime>();
            env.UsingFunc<string>();
            env.UsingFunc<bool>();
            env.UsingFunc<long>();
        }

        public void GetNumberFromJSArgument(int jsarg)
        {
            AssertAndPrint("GetNumberFromJSArgument", jsarg == 3);
        }
        public void GetDateFromJSArgument(DateTime date)
        {
            AssertAndPrint("GetDateFromJSArgument", date.ToString() == "11/11/1998 12:00:00 AM");
        }
        public void GetStringFromJSArgument(string jsarg)
        {
            AssertAndPrint("GetStringFromJSArgument", "Hello World" == jsarg);
        }
        public void GetBooleanFromJSArgument(bool jsarg)
        {
            AssertAndPrint("GetBooleanFromJSArgument", jsarg);
        }
        public void GetBigIntFromJSArgument(long jsarg)
        {
            AssertAndPrint("GetBigIntFromJSArgument", jsarg == 9007199254740992);

        }
        public void GetObjectFromJSArgument(TestObject jsarg)
        {
            AssertAndPrint("GetObjectFromJSArgument", jsarg.value == 3);
        }
        public void GetStructFromJSArgument(TestStruct jsarg)
        {
            AssertAndPrint("GetStructFromJSArgument", jsarg.value == 3);
        }
        public void GetFunctionFromJSArgument(Func<int> jsarg)
        {
            AssertAndPrint("GetFunctionFromJSArgument", jsarg() == 3);
        }
        public void GetJSObjectFromJSArgument()
        {

        }
        public void GetArrayBufferFromJSArgument(Puerts.ArrayBuffer jsarg)
        {
            AssertAndPrint("GetArrayBufferFromJSArgument", jsarg.Count == 1 && jsarg.Bytes[0] == 3);
        }

        public void GetNumberFromResult(Func<int> jsFunc)
        {
            var jsres = jsFunc();
            AssertAndPrint("GetNumberFromResult", jsres == 3);
        }
        public void GetDateFromResult(Func<DateTime> jsFunc)
        {
            var date = jsFunc();
            AssertAndPrint("GetDateFromResult", date.ToString() == "11/11/1998 12:00:00 AM");
        }
        public void GetStringFromResult(Func<string> jsFunc)
        {
            var jsres = jsFunc();
            AssertAndPrint("GetStringFromResult", jsres == "Hello World");
        }
        public void GetBooleanFromResult(Func<bool> jsFunc)
        {
            var jsres = jsFunc();
            AssertAndPrint("GetBooleanFromResult", jsres);
        }
        public void GetBigIntFromResult(Func<long> jsFunc)
        {
            var jsres = jsFunc();
            AssertAndPrint("GetBigIntFromResult", jsres == 9007199254740992);
        }
        public void GetObjectFromResult(Func<TestObject> jsFunc)
        {
            var jsres = jsFunc();
            AssertAndPrint("GetObjectFromResult", jsres.value == 3);
        }
        public void GetFunctionFromResult(Func<Func<int>> jsFunc)
        {
            var jsres = jsFunc();
            AssertAndPrint("GetFunctionFromResult", jsres() == 3);
        }
        public void GetJSObjectFromResult(Func<int> jsFunc)
        {

        }
        public void GetArrayBufferFromResult(Func<Puerts.ArrayBuffer> jsFunc)
        {
            var jsres = jsFunc();
            AssertAndPrint("GetArrayBufferFromResult", jsres.Count == 1 && jsres.Bytes[0] == 3);
        }
        // public void SetNumberToOutValue(out int jsOutArg) {

        // }
        // public void SetDateToOutValue(out DateTime jsOutArg) {

        // }
        // public void SetStringToOutValue(out string jsOutArg) {

        // }
        // public void SetBooleanToOutValue(out bool jsOutArg) {

        // }
        // public void SetBigIntToOutValue(out long jsOutArg) {

        // }
        // public void SetObjectToOutValue(out TestObject jsOutArg) {

        // }
        // public void SetNullToOutValue(out object jsOutArg) {

        // }
        // public void SetArrayBufferToOutValue(out byte[] jsOutArg) {

        // }
        public int ReturnNumber()
        {
            return 3;
        }
        public DateTime ReturnDate()
        {
            return DateTime.Parse("11/11/1998 0:00 AM");
        }
        public string ReturnString()
        {
            return "Hello World";
        }
        public bool ReturnBoolean()
        {
            return true;
        }
        public long ReturnBigInt()
        {
            return 9007199254740992;
        }
        public TestObject ReturnObject(int val)
        {
            return new TestObject(3);
        }
        public TestStruct ReturnStruct(int val)
        {
            var ts = new TestStruct();
            ts.value = val;
            return ts;
        }
        public Func<int> ReturnFunction()
        {
            return () => 3;
        }
        // public Puerts.JSObject ReturnJSObject() { }
        public Puerts.ArrayBuffer ReturnArrayBuffer()
        {
            byte[] bytes = new byte[1] { 3 };
            return new Puerts.ArrayBuffer(bytes);
        }
    }

    public class PuertsTest : MonoBehaviour
    {
        void Awake()
        {
        }

        void Start()
        {
            var jsEnv = new Puerts.JsEnv();
            var helper = new TestHelper(jsEnv);
            Action<TestHelper> doTest = jsEnv.ExecuteModule<Action<TestHelper>>("unittest.mjs", "init");
            doTest(helper);
            jsEnv.Dispose();
        }

        void Update()
        {
        }
    }
}
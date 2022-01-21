using UnityEngine;
using Puerts;
using System;
using System.Runtime.InteropServices;

namespace PuertsTest
{
    public class TestObject {
        public int value;
        public TestObject(int val) {
            value = val;
        }
    }
    public struct TestStruct {
        public int value;
    }
    public class TestHelper {
        static void OutputTestResult(string name, bool passed) {
            if (passed) {
                UnityEngine.Debug.Log($"TestCase {name} success!");

            } else {
                UnityEngine.Debug.LogError($"TestCase {name} failed!");

            }
        }
        
        public void GetNumberFromJSArgument(int jsarg) {
            OutputTestResult("GetNumberFromJSArgument", jsarg == 3);
        }
        public void GetDateFromJSArgument(DateTime date) {
            UnityEngine.Debug.Log(date);
            // OutputTestResult("GetNumberFromJSArgument", );
        }
        public void GetStringFromJSArgument(string jsarg) {
            OutputTestResult("GetStringFromJSArgument", "Hello World" == jsarg);
        }
        public void GetBooleanFromJSArgument(bool jsarg) {
            OutputTestResult("GetBooleanFromJSArgument", jsarg);
        }
        public void GetBigIntFromJSArgument(long jsarg) {
            // OutputTestResult("GetBigIntFromJSArgument", jsarg);
        }
        public void GetObjectFromJSArgument(TestObject jsarg) {
            OutputTestResult("GetObjectFromJSArgument", jsarg.value == 3);
        }
        public void GetStructFromJSArgument(TestStruct jsarg) {
            OutputTestResult("GetStructFromJSArgument", jsarg.value == 3);
        }
        public void GetFunctionFromJSArgument() {
            
        }
        public void GetJSObjectFromJSArgument() {
            
        }
        public void GetArrayBufferFromJSArgument(byte[] jsarg) {   
            OutputTestResult("GetArrayBufferFromJSArgument", jsarg.Length == 1 && jsarg[0] == 3);
        }

        public void GetNumberFromResult(Func<int> jsFunc) {
            var jsres = jsFunc();
            OutputTestResult("GetNumberFromResult", jsres == 3);
        }
        public void GetDateFromResult(Func<DateTime> jsFunc) {

        }
        public void GetStringFromResult(Func<string> jsFunc) {
            var jsres = jsFunc();
            OutputTestResult("GetStringFromResult", jsres == "Hello World");
        }
        public void GetBooleanFromResult(Func<bool> jsFunc) {
            var jsres = jsFunc();
            OutputTestResult("GetBooleanFromResult", jsres);
        }
        public void GetBigIntFromResult(Func<long> jsFunc) {

        }
        public void GetObjectFromResult(Func<TestObject> jsFunc) {
            var jsres = jsFunc();
            OutputTestResult("GetObjectFromResult", jsres.value == 3);
        }
        public void GetFunctionFromResult(Func<int> jsFunc) {

        }
        public void GetJSObjectFromResult(Func<int> jsFunc) {

        }
        public void GetArrayBufferFromResult(Func<byte[]> jsFunc) {
            var jsres = jsFunc();
            OutputTestResult("GetArrayBufferFromResult", jsres.Length == 1 && jsres[0] == 3);
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
        public TestStruct ReturnStruct(int val) 
        {
            var ts = new TestStruct();
            ts.value = val;
            return ts;
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
            var helper = new TestHelper();
            Action<TestHelper> doTest = jsEnv.ExecuteModule<Action<TestHelper>>("unittest.mjs", "init");
            doTest(helper);
            jsEnv.Dispose();
        }

        void Update()
        {
        }
    }
}
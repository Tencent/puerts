using NUnit.Framework;
using System;
using System.Runtime.InteropServices;

namespace Puerts.UnitTest
{
    [UnityEngine.Scripting.Preserve]
    public class TestGC
    {
        public static int ObjCount = 0;

        [UnityEngine.Scripting.Preserve]
        public TestGC()
        {
            ++ObjCount;
        }

        [UnityEngine.Scripting.Preserve]

        ~TestGC()
        {
            --ObjCount;
        }
    }

    [UnityEngine.Scripting.Preserve]
    public struct TakeTestGC
    {
        [UnityEngine.Scripting.Preserve]
        public TakeTestGC(int n)
        {
            testGC = new TestGC();
        }

        public TestGC testGC;
    }

    [UnityEngine.Scripting.Preserve]
    public class OverloadTestObject
    {
        public static int LastCall = 999;

        [UnityEngine.Scripting.Preserve]
        public void WithObjectParam(string str)
        {
            LastCall = 1;
        }

        [UnityEngine.Scripting.Preserve]
        public void WithObjectParam(object str)
        {
            LastCall = 2;
        }
    }

    public class TestObject
    {
        public int value;
        public TestObject(int val)
        {
            value = val;
        }
        
        static int tmp;
        
        public int WriteOnly
        {
            set {
                tmp = value;
            }
        }
        
        public static int StaticWriteOnly
        {
            set {
                tmp = value;
            }
        }
    }
    public struct TestStruct
    {
        public float value;
        public float value2;
        public float value3;
        public TestStruct(float val)
        {
            value = val;
            value2 = 0;
            value3 = 0;
        }
    }
    [UnityEngine.Scripting.Preserve]
    public struct TestStruct2
    {
        public int v1;
        public int v2;
        public string v3;

        [UnityEngine.Scripting.Preserve]
        public TestStruct2(int p1, int p2, string p3)
        {
            v1 = p1;
            v2 = p2;
            v3 = p3;
        }

        [UnityEngine.Scripting.Preserve]
        public override string ToString()
        {
            return v1 + ":" + v2 + ":" + v3;
        }


        [UnityEngine.Scripting.Preserve]
        public string GetString()
        {
            return v1 + ":" + v2 + ":" + v3;
        }
    }
    [StructLayout(LayoutKind.Sequential)]
    [UnityEngine.Scripting.Preserve]
    public unsafe struct TestUnsafeStruct
    {
        public uint uintField;
        public bool boolField;
        public byte* bytePointerField;
        public TestUnsafeStruct* anotherStructField;

        [UnityEngine.Scripting.Preserve]
        public TestUnsafeStruct(uint input)
        {
            uintField = input;
            boolField = false;
            byte b = 8;
            bytePointerField = &b;
            anotherStructField = (TestUnsafeStruct*)Marshal.AllocHGlobal(Marshal.SizeOf<TestUnsafeStruct>());
            anotherStructField->uintField = input;
            anotherStructField->anotherStructField = null;
            anotherStructField->bytePointerField = &b;
            anotherStructField->boolField = false;
        }
    }

    public enum TestEnum
    {
        [UnityEngine.Scripting.Preserve] A = 1,
        [UnityEngine.Scripting.Preserve] B = 213
    }

    [UnityEngine.Scripting.Preserve]
    public class CrossLangTestHelper
    {
        [UnityEngine.Scripting.Preserve]
        public DateTime GetDateTime()
        {
            return DateTime.Now;
        }

        [UnityEngine.Scripting.Preserve]
        public TestEnum EnumField = TestEnum.B;
        [UnityEngine.Scripting.Preserve]
        public TestEnum GetEnum()
        {
            return TestEnum.B;
        }
        
        [UnityEngine.Scripting.Preserve]
        public TestEnum[] EnumArray = { TestEnum.A, TestEnum.B };

        [UnityEngine.Scripting.Preserve]
        public static void TestEnumCheck(string a, TestEnum e = TestEnum.A, int b = 10) // 有默认值会促使其检查参数类型
        {

        }
    }

    public enum ConstructorParam
    {
        A, B, C, D, E, F, G, H
    }

    [UnityEngine.Scripting.Preserve]
    public class ConstructorOverload
    {
        public int selected;
        public uint heroID;

        [UnityEngine.Scripting.Preserve]
        public ConstructorOverload(uint heroID, ConstructorParam iconType = ConstructorParam.A, ConstructorParam useDazeItemType = ConstructorParam.A, bool ignoreRegisterSale = false)
        {
            selected = 1;
            this.heroID = heroID;
        }

        [UnityEngine.Scripting.Preserve]
        public ConstructorOverload(uint heroID, uint skinID, ConstructorParam iconType = ConstructorParam.A, ConstructorParam useDazeItemType = ConstructorParam.A)
        {
            selected = 2;
            this.heroID = heroID;
        }
        [UnityEngine.Scripting.Preserve]
        public ConstructorOverload(uint heroID, uint skinID, uint avatarCfgId, ConstructorParam iconType = ConstructorParam.A, ConstructorParam useDazeItemType = ConstructorParam.A)
        {
            selected = 3;
            this.heroID = heroID;
        }
        [UnityEngine.Scripting.Preserve]
        public ConstructorOverload(ConstructorOverload product, ConstructorParam iconType = ConstructorParam.A, bool selfBuy = true, uint buyCount = 1)
        {
            selected = 4;
            this.heroID = 123;
        }
        [UnityEngine.Scripting.Preserve]
        public ConstructorOverload(ConstructorParam resItemType, uint resId, ConstructorParam iconType = ConstructorParam.A, bool selfBuy = true, uint buyCount = 1)
        {
            selected = 5;
            this.heroID = 456;
        }
    }

    public class ConstructorOverloadFactory
    {
        [UnityEngine.Scripting.Preserve]
        public static ConstructorOverload Create(ConstructorParam type, int cnt, uint heroID)
        {
            return new ConstructorOverload(heroID);
        }
        [UnityEngine.Scripting.Preserve]
        public static float? LogAppEvent(string logEvent, float? valueToSum = null, System.Collections.Generic.Dictionary<string, object> parameters = null)
        {
            Value = valueToSum.HasValue ? valueToSum.Value : 0f;
            var res = (logEvent == null ? (float?)null : valueToSum);
            //UnityEngine.Debug.Log($"LogAppEvent: {logEvent}, valueToSum: {valueToSum}, res: {res}");
            return res;
        }

        public static uint FloatAsUInt(uint rewardId, bool needBackup = true)
        {
            return rewardId;
        }

        [UnityEngine.Scripting.Preserve]
        public static float Value;
    }

    public unsafe class TestHelper
    {
        protected static TestHelper instance;
        public static TestHelper GetInstance() 
        { 
            if (instance == null) 
            {
                instance = new TestHelper();
            }
            return instance; 
        }

        public static void AssertAndPrint(string name, object a, object b)
        {
            bool success = true;
            if (a == null && b == null)
            {
                success = true;
            }
            else if ((a == null || b == null) && a != b) 
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

        public TestHelper()
        {
#if UNITY_EDITOR || PUERTS_DISABLE_IL2CPP_OPTIMIZATION || (!PUERTS_IL2CPP_OPTIMIZATION && UNITY_IPHONE)
            var env = UnitTestEnv.GetEnv();
            env.UsingFunc<int>();
            env.UsingFunc<int, int>();
            env.UsingFunc<DateTime, DateTime>();
            env.UsingFunc<string, string>();
            env.UsingFunc<bool, bool>();
            env.UsingFunc<long, long>();
            env.UsingFunc<TestStruct, TestStruct>();
            env.UsingFunc<TestStruct?, TestStruct?>();
            env.UsingFunc<TestUnsafeStruct, TestUnsafeStruct>();
#endif
        }

        public Func<int> JSFunctionTestPipeLine(Func<int> initialValue, Func<Func<int>, Func<int>> JSValueHandler)
        {
            AssertAndPrint("CSGetFunctionArgFromJS", initialValue(), 3);
            AssertAndPrint("CSGetFunctionReturnFromJS", JSValueHandler(initialValue), initialValue); // 这里判断一下引用
            return initialValue;
        }
        public event Func<int> functionEvent;

        public void JSFunctionTestCheckMemberValue()
        {
            AssertAndPrint("CSFunctionTestField", functionTestField(), 3);
            AssertAndPrint("CSFunctionTestProp", functionTestProp(), 3);
            AssertAndPrint("CSFunctionTestFieldStatic", functionTestFieldStatic(), 3);
            AssertAndPrint("CSFunctionTestPropStatic", functionTestPropStatic(), 3);

            AssertAndPrint("CSInvokeFunctionEvent", functionEvent(), 30);
        }
        public Func<int> functionTestField = null;
        protected Func<int> _functionTestProp = null;
        public Func<int> functionTestProp 
        {
            get { return _functionTestProp; }
            set { _functionTestProp = value; }
        }
        public static Func<int> functionTestFieldStatic = null;
        protected static Func<int> _functionTestPropStatic = null;
        public static Func<int> functionTestPropStatic
        {
            get { return _functionTestPropStatic; }
            set { _functionTestPropStatic = value; }
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

        public int numberTestField = 0;
        protected int _numberTestProp = 0;
        public int numberTestProp 
        {
            get { return _numberTestProp; }
            set { _numberTestProp = value; }
        }
        public static int numberTestFieldStatic = 0;
        protected static int _numberTestPropStatic = 0;
        public static int numberTestPropStatic
        {
            get { return _numberTestPropStatic; }
            set { _numberTestPropStatic = value; }
        }

        public void NumberTestCheckMemberValue()
        {
            AssertAndPrint("CSNumberTestField", numberTestField, 3);
            AssertAndPrint("CSNumberTestProp", numberTestProp, 3);
            AssertAndPrint("CSNumberTestFieldStatic", numberTestFieldStatic, 3);
            AssertAndPrint("CSNumberTestPropStatic", numberTestPropStatic, 3);
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

        public string UnicodeStr(string str)
        {
            AssertAndPrint("UnicodeStr", str, "你好");
            return "小马哥";
        }

        public string PassStr(string str)
        {
            return str;
        }
        public void PassStr(string str, int a)
        {

        }

        public TestHelper PassObj(TestHelper test)
        {
            return test;
        }

        public void PassObj(TestHelper test, int a)
        {
        }

        public string stringTestField = null;
        protected string _stringTestProp = null;
        public string stringTestProp 
        {
            get { return _stringTestProp; }
            set { _stringTestProp = value; }
        }
        public static string stringTestFieldStatic = null;
        protected static string _stringTestPropStatic = null;
        public static string stringTestPropStatic
        {
            get { return _stringTestPropStatic; }
            set { _stringTestPropStatic = value; }
        }

        public void StringTestCheckMemberValue()
        {
            AssertAndPrint("CSStringTestField", stringTestField, "Puer");
            AssertAndPrint("CSStringTestProp", stringTestProp, "Puer");
            AssertAndPrint("CSStringTestFieldStatic", stringTestFieldStatic, "Puer");
            AssertAndPrint("CSStringTestPropStatic", stringTestPropStatic, "Puer");
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
        public bool boolTestField = false;
        protected bool _boolTestProp = false;
        public bool boolTestProp 
        {
            get { return _boolTestProp; }
            set { _boolTestProp = value; }
        }
        public static bool boolTestFieldStatic = false;
        protected static bool _boolTestPropStatic = false;
        public static bool boolTestPropStatic
        {
            get { return _boolTestPropStatic; }
            set { _boolTestPropStatic = value; }
        }

        public void BoolTestCheckMemberValue()
        {
            AssertAndPrint("CSBoolTestField", boolTestField, true);
            AssertAndPrint("CSBoolTestProp", boolTestProp, true);
            AssertAndPrint("CSBoolTestFieldStatic", boolTestFieldStatic, true);
            AssertAndPrint("CSBoolTestPropStatic", boolTestPropStatic, true);
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
        public long bigintTestField = 0;
        protected long _bigintTestProp = 0;
        public long bigintTestProp 
        {
            get { return _bigintTestProp; }
            set { _bigintTestProp = value; }
        }
        public static long bigintTestFieldStatic = 0;
        protected static long _bigintTestPropStatic = 0;
        public static long bigintTestPropStatic
        {
            get { return _bigintTestPropStatic; }
            set { _bigintTestPropStatic = value; }
        }

        public void BigintTestCheckMemberValue()
        {
            AssertAndPrint("CSBigintTestField", bigintTestField, 9007199254740987);
            AssertAndPrint("CSBigintTestProp", bigintTestProp, 9007199254740987);
            AssertAndPrint("CSBigintTestFieldStatic", bigintTestFieldStatic, 9007199254740987);
            AssertAndPrint("CSBigintTestPropStatic", bigintTestPropStatic, 9007199254740987);
        }
        /**
        */
        public Puerts.ArrayBuffer ArrayBufferTestPipeLine(Puerts.ArrayBuffer initialValue, out Puerts.ArrayBuffer outArg, Func<Puerts.ArrayBuffer, Puerts.ArrayBuffer> JSValueHandler) 
        {
            AssertAndPrint("CSGetArrayBufferArgFromJS", initialValue.Bytes.Length == 1 && initialValue.Bytes[0] == 1);
            initialValue.Bytes[0] = 2;
            AssertAndPrint("CSGetArrayBufferReturnFromJS", JSValueHandler(initialValue).Bytes[0] == 3);
            initialValue.Bytes[0] = 4;
            outArg = initialValue;
            byte[] bytes = new byte[1] { 5 };
            return new Puerts.ArrayBuffer(bytes);
        }
        public Puerts.ArrayBuffer arrayBufferTestField = null;
        protected Puerts.ArrayBuffer _arrayBufferTestProp = null;
        public Puerts.ArrayBuffer arrayBufferTestProp 
        {
            get { return _arrayBufferTestProp; }
            set { _arrayBufferTestProp = value; }
        }
        public static Puerts.ArrayBuffer arrayBufferTestFieldStatic = null;
        protected static Puerts.ArrayBuffer _arrayBufferTestPropStatic = null;
        public static Puerts.ArrayBuffer arrayBufferTestPropStatic
        {
            get { return _arrayBufferTestPropStatic; }
            set { _arrayBufferTestPropStatic = value; }
        }

        public void ArrayBufferTestCheckMemberValue()
        {
            AssertAndPrint("CSArrayBufferTestField", arrayBufferTestField.Bytes[0], 192);
            AssertAndPrint("CSArrayBufferTestProp", arrayBufferTestProp.Bytes[0], 192);
            AssertAndPrint("CSArrayBufferTestFieldStatic", arrayBufferTestFieldStatic.Bytes[0], 192);
            AssertAndPrint("CSArrayBufferTestPropStatic", arrayBufferTestPropStatic.Bytes[0], 192);
            arrayBufferTestPropStatic.Bytes[0] = 193;
        }
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
        public TestObject nativeObjectTestField = null;
        protected TestObject _nativeObjectTestProp = null;
        public TestObject nativeObjectTestProp 
        {
            get { return _nativeObjectTestProp; }
            set { _nativeObjectTestProp = value; }
        }
        public static TestObject nativeObjectTestFieldStatic = null;
        protected static TestObject _nativeObjectTestPropStatic = null;
        public static TestObject nativeObjectTestPropStatic
        {
            get { return _nativeObjectTestPropStatic; }
            set { _nativeObjectTestPropStatic = value; }
        }

        public void NativeObjectTestCheckMemberValue()
        {
            AssertAndPrint("CSNativeObjectTestField", nativeObjectTestField.value, 678);
            AssertAndPrint("CSNativeObjectTestProp", nativeObjectTestProp.value, 678);
            AssertAndPrint("CSNativeObjectTestFieldStatic", nativeObjectTestFieldStatic.value, 678);
            AssertAndPrint("CSNativeObjectTestPropStatic", nativeObjectTestPropStatic.value, 678);
        }
        /**
        * 结构体，判断值相等
        */
        public TestStruct NativeStructTestPipeLine(TestStruct initialValue, out TestStruct outArg, Func<TestStruct, TestStruct> JSValueHandler)
        {
            AssertAndPrint("CSGetNativeStructArgFromJS", initialValue.value, 1);
            AssertAndPrint("CSGetNativeStructReturnFromJS", JSValueHandler(initialValue).value, initialValue.value);

            outArg = initialValue;
            return initialValue;
        }
        public TestStruct nativeStructTestField = default(TestStruct);
        protected TestStruct _nativeStructTestProp = default(TestStruct);
        public TestStruct nativeStructTestProp 
        {
            get { return _nativeStructTestProp; }
            set { _nativeStructTestProp = value; }
        }
        public static TestStruct nativeStructTestFieldStatic = default(TestStruct);
        protected static TestStruct _nativeStructTestPropStatic = default(TestStruct);
        public static TestStruct nativeStructTestPropStatic
        {
            get { return _nativeStructTestPropStatic; }
            set { _nativeStructTestPropStatic = value; }
        }
        public void NativeStructTestCheckMemberValue()
        {
            AssertAndPrint("CSNativeStructTestField", nativeStructTestField.value, 765);
            AssertAndPrint("CSNativeStructTestProp", nativeStructTestProp.value, 765);
            AssertAndPrint("CSNativeStructTestFieldStatic", nativeStructTestFieldStatic.value, 765);
            AssertAndPrint("CSNativeStructTestPropStatic", nativeStructTestPropStatic.value, 765);
        }

        /**
        * nullable结构体
        */
        public TestStruct? NullableNativeStructTestPipeLine(TestStruct? initialValue, out TestStruct? outArg, Func<TestStruct?, TestStruct?> JSValueHandler)
        {
            AssertAndPrint("CSGetNativeStructArgFromJS", initialValue, null);
            AssertAndPrint("CSGetNativeStructReturnFromJS", JSValueHandler(initialValue), null);

            outArg = initialValue;
            return initialValue;
        }
        public TestStruct? nullableNativeStructTestField = default(TestStruct);
        protected TestStruct? _nullableNativeStructTestProp = default(TestStruct);
        public TestStruct? nullableNativeStructTestProp 
        {
            get { return _nullableNativeStructTestProp; }
            set { _nullableNativeStructTestProp = value; }
        }
        public static TestStruct? nullableNativeStructTestFieldStatic = default(TestStruct);
        protected static TestStruct? _nullableNativeStructTestPropStatic = default(TestStruct);
        public static TestStruct? nullableNativeStructTestPropStatic
        {
            get { return _nullableNativeStructTestPropStatic; }
            set { _nullableNativeStructTestPropStatic = value; }
        }
        public void NullableNativeStructTestCheckMemberValue()
        {
            AssertAndPrint("CSNullableNativeStructTestField", nullableNativeStructTestField, null);
            AssertAndPrint("CSNullableNativeStructTestProp", nullableNativeStructTestProp, null);
            AssertAndPrint("CSNullableNativeStructTestFieldStatic", nullableNativeStructTestFieldStatic, null);
            AssertAndPrint("CSNullableNativeStructTestPropStatic", nullableNativeStructTestPropStatic, null);
        }

        /**
        * unsafe结构体，判断指针的值
        */
        public TestUnsafeStruct NativeUnsafeStructTestPipeLine(TestUnsafeStruct initialValue, out TestUnsafeStruct outArg, Func<TestUnsafeStruct, TestUnsafeStruct> JSValueHandler)
        {
            AssertAndPrint("CSGetNativeUnsafeStructArgFromJS", initialValue.uintField, initialValue.anotherStructField->uintField);
            AssertAndPrint("CSGetNativeUnsafeStructReturnFromJS", JSValueHandler(initialValue).anotherStructField->uintField, initialValue.anotherStructField->uintField);

            outArg = initialValue;
            return initialValue;
        }
        public TestUnsafeStruct nativeUnsafeStructTestField = default(TestUnsafeStruct);
        protected TestUnsafeStruct _nativeUnsafeStructTestProp = default(TestUnsafeStruct);
        public TestUnsafeStruct nativeUnsafeStructTestProp 
        {
            get { return _nativeUnsafeStructTestProp; }
            set { _nativeUnsafeStructTestProp = value; }
        }
        public static TestUnsafeStruct nativeUnsafeStructTestFieldStatic = default(TestUnsafeStruct);
        protected static TestUnsafeStruct _nativeUnsafeStructTestPropStatic = default(TestUnsafeStruct);
        public static TestUnsafeStruct nativeUnsafeStructTestPropStatic
        {
            get { return _nativeUnsafeStructTestPropStatic; }
            set { _nativeUnsafeStructTestPropStatic = value; }
        }
        public void NativeUnsafeStructTestCheckMemberValue()
        {
            AssertAndPrint("CSNativeUnsafeStructTestField", nativeUnsafeStructTestField.anotherStructField->uintField, 765);
            AssertAndPrint("CSNativeUnsafeStructTestProp", nativeUnsafeStructTestProp.anotherStructField->uintField, 765);
            AssertAndPrint("CSNativeUnsafeStructTestFieldStatic", nativeUnsafeStructTestFieldStatic.anotherStructField->uintField, 765);
            AssertAndPrint("CSNativeUnsafeStructTestPropStatic", nativeUnsafeStructTestPropStatic.anotherStructField->uintField, 765);
        }

        /**
        * JSObject
        */
        public JSObject jsObjectTestField = default(JSObject);
        protected JSObject _jsObjectTestProp = default(JSObject);
        public JSObject jsObjectTestProp 
        {
            get { return _jsObjectTestProp; }
            set { _jsObjectTestProp = value; }
        }
        public static JSObject jsObjectTestFieldStatic = default(JSObject);
        protected static JSObject _jsObjectTestPropStatic = default(JSObject);
        public static JSObject jsObjectTestPropStatic
        {
            get { return _jsObjectTestPropStatic; }
            set { _jsObjectTestPropStatic = value; }
        }
        public void JSObjectTestCheckMemberValue()
        {
            AssertAndPrint("CSJSObjectTestField", jsObjectTestField.Get<string>("puerts") == "niubi");
            AssertAndPrint("CSJSObjectTestProp", jsObjectTestProp.Get<string>("puerts") == "niubi");
            AssertAndPrint("CSJSObjectTestFieldStatic", jsObjectTestFieldStatic.Get<string>("puerts") == "niubi");
            AssertAndPrint("CSJSObjectTestPropStatic", jsObjectTestPropStatic.Get<string>("puerts") == "niubi");
        }
        public JSObject JSObjectTestPipeLine(JSObject initialValue, Func<JSObject, JSObject> JSValueHandler) 
        {
            AssertAndPrint("CSGetJSObjectArgFromJS", initialValue.Get<string>("puerts") == "niubi");
            AssertAndPrint("CSGetJSObjectReturnFromJS", JSValueHandler(initialValue) == initialValue);
            return initialValue;
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

        public Func<object> ReturnAnyTestFunc;

        public void InvokeReturnAnyTestFunc(TestStruct srcValue)
        {
            var ret = (TestStruct)ReturnAnyTestFunc.Invoke();
            AssertAndPrint("InvokeReturnNativeStructTestFunc", srcValue.value, ret.value);
        }
    }
    
            
    public class FooVE
    {
        public IFoo foo;

        public FooVE()
        {
            foo = new FooAccess();
        }
        
        static FooVE _instance;

        public static FooVE Instance()
        {
            if (_instance == null) _instance = new FooVE();
            return _instance;
        }
    }

    public interface IFoo
    {
        float width { get; }
    }

    internal class FooAccess : IFoo
    {
        float IFoo.width => 125f; // Note the explicit interface `IFoo.`
    }

    [TestFixture]
    public class CrossLangTest
    {
        [Test]
        public void JSFunctionInstanceTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const TestHelper = CS.Puerts.UnitTest.TestHelper;
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

                    const testHelper = TestHelper.GetInstance();

                    const oFunc = () => 3
                    const rFunc = testHelper.JSFunctionTestPipeLine(oFunc, function (func) {
                        testHelper.functionTestEndValue = oFunc;
                        return testHelper.functionTestEndValue;
                    });

                    const evfn = () => 30;
                    testHelper.add_functionEvent(evfn);
                    testHelper.functionTestField = () => 3
                    testHelper.functionTestProp = () => 3
                    TestHelper.functionTestFieldStatic = () => 3
                    TestHelper.functionTestPropStatic = () => 3
                    testHelper.JSFunctionTestCheckMemberValue();
                    testHelper.remove_functionEvent(evfn);

                })()
            ");
            jsEnv.Tick();
        }
        
        [Test]
        public void WriteOnlyTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    let o = new CS.Puerts.UnitTest.TestObject(1);
                    let v = o.WriteOnly;
                    let sv = CS.Puerts.UnitTest.TestObject.StaticWriteOnly
                })()
            ");
            jsEnv.Tick();
        }
        
        [Test]
        public void NoNewOnStaticFunction()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            try 
            {
                jsEnv.Eval(@"
                    (function() {
                        const TestHelper = CS.Puerts.UnitTest.TestHelper;
                        new TestHelper.GetInstance();
                    })()
                ");
            } 
            catch(Exception e) 
            {
                StringAssert.Contains("not a constructor", e.Message);
                jsEnv.Tick();
                return;
            }
            throw new Exception("unexpected to reach here");
        }
        [Test]
        public void NumberInstanceTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const TestHelper = CS.Puerts.UnitTest.TestHelper;
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

                    const testHelper = TestHelper.GetInstance();

                    const outRef = [];
                    const oNum = outRef[0] = 1;
                    const rNum = testHelper.NumberTestPipeLine(oNum, outRef, function (num) {
                        assertAndPrint('JSGetNumberArgFromCS', num, oNum + 1);
                        return oNum + 2;
                    });
                    assertAndPrint('JSGetNumberOutArgFromCS', outRef[0], oNum + 3);
                    assertAndPrint('JSGetNumberReturnFromCS', rNum, oNum + 4);
                    testHelper.numberTestField = 3
                    testHelper.numberTestProp = 3
                    TestHelper.numberTestFieldStatic = 3
                    TestHelper.numberTestPropStatic = 3
                    testHelper.NumberTestCheckMemberValue();
                })()
            ");
            jsEnv.Tick();
        }
        [Test]
        public void StringInstanceTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const TestHelper = CS.Puerts.UnitTest.TestHelper;
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

                    const testHelper = TestHelper.GetInstance();

                    const outRef = [];
                    const oStr = outRef[0] = 'abc';
                    const rStr = testHelper.StringTestPipeLine(oStr, outRef, function (str) {
                        assertAndPrint('JSGetStringArgFromCS', str, 'abcd');
                        return 'abcde';
                    });
                    
                    assertAndPrint('JSGetStringOutArgFromCS', outRef[0], oStr + 'def');
                    assertAndPrint('JSGetStringReturnFromCS', rStr, oStr + 'defg');

                    testHelper.stringTestField = 'Puer'
                    testHelper.stringTestProp = 'Puer'
                    TestHelper.stringTestFieldStatic = 'Puer'
                    TestHelper.stringTestPropStatic = 'Puer'
                    testHelper.StringTestCheckMemberValue();
                    const ustr = testHelper.UnicodeStr('你好');
                    assertAndPrint('UnicodeStr', ustr, '小马哥');
                })()
            ");
            jsEnv.Tick();
        }
        [Test]
        public void BoolInstanceTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const TestHelper = CS.Puerts.UnitTest.TestHelper;
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

                    const testHelper = TestHelper.GetInstance();

                    const outRef = [];
                    const oBool = outRef[0] = true;
                    const rBool = testHelper.BoolTestPipeLine(oBool, outRef, function (b) {
                        assertAndPrint('JSGetBoolArgFromCS', b, false);
                        return true;
                    });
                    assertAndPrint('JSGetBoolOutArgFromCS', outRef[0], false);
                    assertAndPrint('JSGetBoolReturnFromCS', rBool, false);
                    
                    testHelper.boolTestField = true
                    testHelper.boolTestProp = true
                    TestHelper.boolTestFieldStatic = true
                    TestHelper.boolTestPropStatic = true
                    testHelper.BoolTestCheckMemberValue();
                })()
            ");
            jsEnv.Tick();
        }
        //
#if !UNITY_WEBGL
        [Test]
        public void BigIntInstanceTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const TestHelper = CS.Puerts.UnitTest.TestHelper;
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

                    const testHelper = TestHelper.GetInstance();

                    const outRef = [];
                    const oBigInt = outRef[0] = 9007199254740992n;
                    const rBigInt = testHelper.BigIntTestPipeLine(oBigInt, outRef, function (bi) {
                        assertAndPrint('JSGetBigIntArgFromCS', bi == oBigInt + 1n);
                        return 9007199254740994n;
                    });
                    assertAndPrint('JSGetBigIntOutArgFromCS', outRef[0] == oBigInt + 3n);
                    assertAndPrint('JSGetBigIntReturnFromCS', rBigInt == oBigInt + 4n);
                    
                    testHelper.bigintTestField = 9007199254740987n
                    testHelper.bigintTestProp = 9007199254740987n
                    TestHelper.bigintTestFieldStatic = 9007199254740987n
                    TestHelper.bigintTestPropStatic = 9007199254740987n
                    testHelper.BigintTestCheckMemberValue();
                })()
            ");
            jsEnv.Tick();
        }
#endif
        [Test]
        public void ArrayBufferInstanceTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const TestHelper = CS.Puerts.UnitTest.TestHelper;
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);
                    const testHelper = TestHelper.GetInstance();

                    const outRef = [];
                    const oAB = new Uint8Array([1]).buffer;
                    const rAB = testHelper.ArrayBufferTestPipeLine(oAB, outRef, function(bi) {
                        assertAndPrint('JSGetArrayBufferArgFromCS', new Uint8Array(bi)[0], 2);
                        return new Uint8Array([3]).buffer
                    });
                    assertAndPrint('JSGetArrayBufferOutArgFromCS', new Uint8Array(outRef[0])[0], 4);
                    assertAndPrint('JSGetArrayBufferReturnFromCS', new Uint8Array(rAB)[0], 5);
                    
                    testHelper.arrayBufferTestField = new Uint8Array([192]).buffer
                    testHelper.arrayBufferTestProp = new Uint8Array([192]).buffer
                    TestHelper.arrayBufferTestFieldStatic = new Uint8Array([192]).buffer
                    TestHelper.arrayBufferTestPropStatic = new Uint8Array([192]).buffer
                    const tmp = TestHelper.arrayBufferTestPropStatic;
                    testHelper.ArrayBufferTestCheckMemberValue();
                    assertAndPrint('JSArrayBufferShouldBeCopied', new Uint8Array(tmp)[0], 192);
                })()
            ");
            jsEnv.Tick();
        }
        [Test]
        public void NativeObjectInstanceTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const TestHelper = CS.Puerts.UnitTest.TestHelper;
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

                    const testHelper = TestHelper.GetInstance();

                    const outRef = [];
                    const oNativeObject = outRef[0] = new CS.Puerts.UnitTest.TestObject(1);
                    const rNativeObject = testHelper.NativeObjectTestPipeLine(oNativeObject, outRef, function (obj) {
                        assertAndPrint('JSGetNativeObjectArgFromCS', obj, oNativeObject);
                        return oNativeObject;
                    });
                    assertAndPrint('JSGetNativeObjectOutArgFromCS', outRef[0], oNativeObject);
                    assertAndPrint('JSGetNativeObjectReturnFromCS', rNativeObject, oNativeObject);
                    
                    testHelper.nativeObjectTestField = new CS.Puerts.UnitTest.TestObject(678)
                    testHelper.nativeObjectTestProp = new CS.Puerts.UnitTest.TestObject(678)
                    TestHelper.nativeObjectTestFieldStatic = new CS.Puerts.UnitTest.TestObject(678)
                    TestHelper.nativeObjectTestPropStatic = new CS.Puerts.UnitTest.TestObject(678)
                    testHelper.NativeObjectTestCheckMemberValue();
                })()
            ");
            jsEnv.Tick();
        }
        [Test]
        public void NativeStructInstanceTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const TestHelper = CS.Puerts.UnitTest.TestHelper;
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

                    const testHelper = TestHelper.GetInstance();

                    const outRef = [];
                    const oNativeStruct = outRef[0] = new CS.Puerts.UnitTest.TestStruct(1);
                    const rNativeStruct = testHelper.NativeStructTestPipeLine(oNativeStruct, outRef, function (obj) {
                        assertAndPrint('JSGetNativeStructArgFromCS', obj.value == oNativeStruct.value);
                        return oNativeStruct;
                    });
                    assertAndPrint('JSGetNativeStructOutArgFromCS', outRef[0].value == oNativeStruct.value);
                    assertAndPrint('JSGetNativeStructReturnFromCS', rNativeStruct.value == oNativeStruct.value);

                    testHelper.nativeStructTestField = new CS.Puerts.UnitTest.TestStruct(765)
                    testHelper.nativeStructTestProp = new CS.Puerts.UnitTest.TestStruct(765)
                    TestHelper.nativeStructTestFieldStatic = new CS.Puerts.UnitTest.TestStruct(765)
                    TestHelper.nativeStructTestPropStatic = new CS.Puerts.UnitTest.TestStruct(765)
                    testHelper.NativeStructTestCheckMemberValue();
                })()
            ");
            jsEnv.Tick();
        }
        [Test]
        public void TestStructAccess()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            // preload
            jsEnv.Eval(@"
                 (function() {
                     return CS.Puerts.UnitTest.TestStruct2
                 })()
            ");
            var res = jsEnv.Eval<string>(@"
                 (function() {
                     const s1 = new CS.Puerts.UnitTest.TestStruct2(5345, 3214, 'fqpziq');
                     return s1.ToString();
                 })()
            ");
            Assert.AreEqual("5345:3214:fqpziq", res);
        }
        [Test]
        public void NullableNativeStructInstanceTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const TestHelper = CS.Puerts.UnitTest.TestHelper;
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

                    const testHelper = TestHelper.GetInstance();

                    const outRef = [];
                    const oNativeStruct = outRef[0] = null;
                    const rNativeStruct = testHelper.NullableNativeStructTestPipeLine(oNativeStruct, outRef, function (obj) {
                        assertAndPrint('JSGetNullableNativeStructArgFromCS', obj == null);
                        return null;
                    });
                    assertAndPrint('JSGetNullableNativeStructOutArgFromCS', outRef[0] == null);
                    assertAndPrint('JSGetNullableNativeStructReturnFromCS', rNativeStruct == null);

                    testHelper.nullableNativeStructTestField = null
                    testHelper.nullableNativeStructTestProp = null
                    TestHelper.nullableNativeStructTestFieldStatic = null
                    TestHelper.nullableNativeStructTestPropStatic = null
                    testHelper.NullableNativeStructTestCheckMemberValue();
                })()
            ");
            jsEnv.Tick();
        }
        [Test]
        public void NativeUnsafeStructInstanceTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const TestHelper = CS.Puerts.UnitTest.TestHelper;
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

                    const testHelper = TestHelper.GetInstance();

                    const outRef = [];
                    const oNativeUnsafeStruct = outRef[0] = new CS.Puerts.UnitTest.TestUnsafeStruct(1);
                    const rNativeUnsafeStruct = testHelper.NativeUnsafeStructTestPipeLine(oNativeUnsafeStruct, outRef, function (obj) {
                        assertAndPrint('JSGetNativeUnsafeStructArgFromCS', obj.value == oNativeUnsafeStruct.value);
                        return oNativeUnsafeStruct;
                    });
                    assertAndPrint('JSGetNativeUnsafeStructOutArgFromCS', outRef[0].value == oNativeUnsafeStruct.value);
                    assertAndPrint('JSGetNativeUnsafeStructReturnFromCS', rNativeUnsafeStruct.value == oNativeUnsafeStruct.value);

                    testHelper.nativeUnsafeStructTestField = new CS.Puerts.UnitTest.TestUnsafeStruct(765)
                    testHelper.nativeUnsafeStructTestProp = new CS.Puerts.UnitTest.TestUnsafeStruct(765)
                    TestHelper.nativeUnsafeStructTestFieldStatic = new CS.Puerts.UnitTest.TestUnsafeStruct(765)
                    TestHelper.nativeUnsafeStructTestPropStatic = new CS.Puerts.UnitTest.TestUnsafeStruct(765)
                    testHelper.NativeUnsafeStructTestCheckMemberValue();
                })()
            ");
            jsEnv.Tick();
        }
        [Test]
        public void JSObjectInstanceTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const TestHelper = CS.Puerts.UnitTest.TestHelper;
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

                    const testHelper = TestHelper.GetInstance();

                    const oJSObject = { 'puerts': 'niubi' };
                    const rJSObject = testHelper.JSObjectTestPipeLine(oJSObject, function(obj) {
                        assertAndPrint('JSGetJSObjectArgFromCS', obj.puerts == oJSObject.puerts);
                        return oJSObject
                    });
                    assertAndPrint('JSGetJSObjectReturnFromCS', rJSObject == oJSObject);

                    assertAndPrint('JSGetJSObjectField', testHelper.jsObjectTestField == null);
                    assertAndPrint('JSGetJSObjectStaticField', TestHelper.jsObjectTestFieldStatic == null);
                    testHelper.jsObjectTestField = { 'puerts': 'niubi' }
                    testHelper.jsObjectTestProp = { 'puerts': 'niubi' }
                    TestHelper.jsObjectTestFieldStatic = { 'puerts': 'niubi' }
                    TestHelper.jsObjectTestPropStatic = { 'puerts': 'niubi' }
                    testHelper.JSObjectTestCheckMemberValue();
                })()
            ");
            jsEnv.Tick();
        }
        [Test]
        public void DateTimeTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            var ret = jsEnv.Eval<string>(@"
                (function() {
                    const helper = new CS.Puerts.UnitTest.CrossLangTestHelper();
                    const val = helper.GetDateTime();
                    return '' + (val instanceof CS.System.DateTime) + (val instanceof Date)
                })()
            ");
            Assert.AreEqual("truefalse", ret);
            jsEnv.Tick();
        }
        [Test]
        public void EnumTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            var ret = jsEnv.Eval<string>(@"
                (function() {
                    const helper = new CS.Puerts.UnitTest.CrossLangTestHelper();
                    const fstart = helper.EnumField;
                    helper.EnumField = CS.Puerts.UnitTest.TestEnum.A;
                    const fend = helper.EnumField;
                    const ret = helper.GetEnum();
                    return `${fstart} ${fend} ${ret}`
                })()
            ");
            Assert.AreEqual("213 1 213", ret);
            jsEnv.Tick();
        }
        [Test]
        public void EnumArrayTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            var ret = jsEnv.Eval<string>(@"
                (function() {
                    const helper = new CS.Puerts.UnitTest.CrossLangTestHelper();
                    return typeof helper.EnumArray.get_Item(0)
                })()
            ");
            Assert.AreEqual("number", ret);
            jsEnv.Tick();
        }

        [Test]
        public void EnumNameTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            var ret = jsEnv.Eval<string>(@"
                    CS.Puerts.UnitTest.TestEnum[CS.Puerts.UnitTest.TestEnum.A];
            ");
            Assert.AreEqual("A", ret);
            jsEnv.Tick();
        }

        [Test]
        public void AccessExplicitnterfaceImplementation()
        {
            var jsEnv = UnitTestEnv.GetEnv();

            var ret = jsEnv.Eval<float>(@"
                (function() {
                    const foove = CS.Puerts.UnitTest.FooVE.Instance();
                    console.log(foove);
                    console.log(foove.foo);
                    console.log(foove.foo.width);
                    return foove.foo.width;
                })()
            ");
            Assert.AreEqual(FooVE.Instance().foo.width, ret);
            jsEnv.Tick();
        }

#if !UNITY_WEBGL || UNITY_EDITOR
        [Test]
        public void CallDelegateAfterJsEnvDisposed()
        {
#if PUERTS_GENERAL
            var jsEnv = new JsEnv(new TxtLoader());
#else
            var jsEnv = new JsEnv(new DefaultLoader());
#endif
            var callback = jsEnv.Eval<Action>("() => console.log('hello')");
            callback();
            jsEnv.Dispose();
            Assert.Catch(() =>
            {
                callback();
            });
        }

        //看上去GC.Collect()对webgl无效，先去掉
        [Test]
        public void TestJsGC()
        {
#if PUERTS_GENERAL
            var jsEnv = new JsEnv(new TxtLoader());
#else
            var jsEnv = new JsEnv(new DefaultLoader());
#endif
            TestGC.ObjCount = 0;
            var objCount = jsEnv.Eval<int>(@"
            const randomCount = Math.floor(Math.random() * 50) + 1;

            var objs = []
            for (let i = 0; i < randomCount; i++) {
                objs.push(new CS.Puerts.UnitTest.TestGC())
            }
            randomCount;
            ");

            if (jsEnv.Backend is BackendV8)
            {
                jsEnv.Eval("gc()");
            }

            GC.Collect();
            GC.WaitForPendingFinalizers();
            GC.Collect();

            Assert.AreEqual(objCount, TestGC.ObjCount);
            Assert.True(objCount > 0);

            jsEnv.Eval("objs = undefined");

            if (jsEnv.Backend is BackendV8)
            {
                jsEnv.Eval("gc()");
            }

            GC.Collect();
            GC.WaitForPendingFinalizers();
            GC.Collect();

            Assert.AreEqual(0, TestGC.ObjCount);

            jsEnv.Dispose();
        }

        [Test]
        public void TestJsStructGC()
        {
#if PUERTS_GENERAL
            var jsEnv = new JsEnv(new TxtLoader());
#else
            var jsEnv = new JsEnv(new DefaultLoader());
#endif
            TestGC.ObjCount = 0;
            var objCount = jsEnv.Eval<int>(@"
            const randomCount = Math.floor(Math.random() * 50) + 1;

            var objs = []
            for (let i = 0; i < randomCount; i++) {
                objs.push(new CS.Puerts.UnitTest.TakeTestGC(1))
            }
            randomCount;
            ");

            if (jsEnv.Backend is BackendV8)
            {
                jsEnv.Eval("gc()");
            }

            GC.Collect();
            GC.WaitForPendingFinalizers();
            GC.Collect();

            Assert.AreEqual(objCount, TestGC.ObjCount);
            Assert.True(objCount > 0);

            jsEnv.Eval("objs = undefined");

            if (jsEnv.Backend is BackendV8)
            {
                jsEnv.Eval("gc()");
            }

            GC.Collect();
            GC.WaitForPendingFinalizers();
            GC.Collect();

            Assert.AreEqual(0, TestGC.ObjCount);

            jsEnv.Dispose();
        }
#endif

        [Test]
        public void OverloadTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();

            jsEnv.Eval(@"
            (function() {
            const o = new CS.Puerts.UnitTest.OverloadTestObject();
            o.WithObjectParam('tt');
            console.log('call with string ');
            }) ();
            ");

            Assert.AreEqual(1, OverloadTestObject.LastCall);

            jsEnv.Eval(@"
            (function() {
            const o = new CS.Puerts.UnitTest.OverloadTestObject();
            o.WithObjectParam(888);
             console.log('call with int ');
            }) ();
            ");

            Assert.AreEqual(2, OverloadTestObject.LastCall);
        }

        [Test]
        public void FuncAsJsObject()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            var jso = jsEnv.Eval<JSObject>(@"
            (function() {
                function t(){}
                return t;
            }) ();
            ");
            Assert.True(jso != null);
        }

        [Test]
        public void EnumParamCheck() // https://github.com/Tencent/puerts/issues/2018
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
            (function() {
                CS.Puerts.UnitTest.CrossLangTestHelper.TestEnumCheck('a', 1, 2);
            }) ();
            ");
        }

        [Test]
        public void PassNullTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const TestHelper = CS.Puerts.UnitTest.TestHelper;
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

                    const testHelper = TestHelper.GetInstance();
                    testHelper.PassStr(null);
                    testHelper.PassStr(undefined);
                    testHelper.PassObj(null);
                    testHelper.PassObj(undefined);
                    
                })()
            ");
            Assert.Catch(() =>
            {
                jsEnv.Eval(@"
                (function() {
                    const TestHelper = CS.Puerts.UnitTest.TestHelper;
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

                    const testHelper = TestHelper.GetInstance();
                    testHelper.PassObj('aaaaaa');
                    
                })()
            ");
            }, "invalid arguments to PassObj");
            jsEnv.Tick();
        }

        [Test]
        public void CastJsFunctionAsTwoDiffDelegate()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.UsingAction<int>();
            jsEnv.UsingAction<string, long>();
            var cb1 = jsEnv.Eval<Action<int>>(@"
            function __GCB(a, b) {
              __GMSG = `${a}${b}`
            }
            __GCB;
            ");
            cb1(1);
            Assert.AreEqual("1undefined", jsEnv.Eval<string>("__GMSG"));
            var cb2 = jsEnv.Eval<Action<string, long>>("__GCB");
            cb2("hello", 999);
            Assert.AreEqual("hello999", jsEnv.Eval<string>("__GMSG"));
        }

        public delegate string NotGenericTestFunc(long t);

        [Test]
        public void NotGenericTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.UsingFunc<long, string>();
            var cb1 = jsEnv.Eval<NotGenericTestFunc>(@"
            function __NGTF(a) {
              return `${a}`
            }
            __NGTF;
            ");
            ;
            Assert.AreEqual("9999", cb1(9999));
        }

#if !PUERTS_GENERAL
        [Test]
        public void PassDestroyedUnityObjectTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.UsingFunc<UnityEngine.Object, bool>();
            // 无效的UnityEninge.Object会以null的形式传入脚本
            var is_null = jsEnv.Eval<Func<UnityEngine.Object, bool>>(@"
function __PDUOTF(o){
    return o === null;
}
__PDUOTF;");
            Assert.AreEqual(true, is_null(null));
            UnityEngine.Texture2D tex2D = new UnityEngine.Texture2D(1, 1);
            try
            {
                Assert.AreEqual(false, is_null(tex2D));
            }
            finally
            {
                UnityEngine.Object.DestroyImmediate(tex2D);
            }
            Assert.AreEqual(true, is_null(tex2D));
        }
#endif
        delegate bool PassJsObject(JSObject obj);

        [Test]
        public void JsObjectCrossJsEnvs()
        {
            var jsEnv1 = new JsEnv(UnitTestEnv.GetLoader());
            jsEnv1.UsingFunc<JSObject, bool>();
            var jsEnv2 = new JsEnv(UnitTestEnv.GetLoader());
            jsEnv2.UsingFunc<JSObject, bool>();
            var jsObj1 = jsEnv1.Eval<JSObject>("Object.create(null)");
            var test1 = jsEnv1.Eval<PassJsObject>("(obj) => !!obj");
            var test2 = jsEnv2.Eval<PassJsObject>("(obj) => !!obj");
            Assert.True(test1(jsObj1));
            Assert.False(test2(jsObj1));
            jsEnv1.Dispose();
            Assert.False(test2(jsObj1));
        }
		
		[Test]
        public void DisposeJsEnvJsObject()
        {
            var jsEnv1 = new JsEnv(UnitTestEnv.GetLoader());
            jsEnv1.UsingFunc<JSObject, bool>();
            var jsObj1 = jsEnv1.Eval<JSObject>("Object.create(null)");
            var test1 = jsEnv1.Eval<PassJsObject>("(obj) => !!obj");
            Assert.True(test1(jsObj1));
            jsEnv1.Dispose();
            jsEnv1 = new JsEnv(UnitTestEnv.GetLoader());
            jsEnv1.UsingFunc<JSObject, bool>();
            test1 = jsEnv1.Eval<PassJsObject>("(obj) => !!obj");
            Assert.False(test1(jsObj1));
        }

        [Test]
        public void AutoConvertStringToNumber()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            var res = jsEnv.Eval<uint>(@"
                (function() {
                    const ConstructorOverloadFactory = CS.Puerts.UnitTest.ConstructorOverloadFactory;
                    const obj = ConstructorOverloadFactory.Create(1, 1, '3001385');
                    console.log('>>>>>>>>>>>>>>>>>>>>>>>>> obj.heroID: ' + obj.heroID)
                    return obj.heroID
                })()
            ");
            Assert.AreEqual(3001385u, res);
        }

        [Test]
        public void PassBigIntToUInt()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const ConstructorOverloadFactory = CS.Puerts.UnitTest.ConstructorOverloadFactory;
                    ConstructorOverloadFactory.Create(1, 1, 3001385n);
                })()
            ");
        }

        [Test]
        public void TestConstructorOverload()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const ConstructorOverload = CS.Puerts.UnitTest.ConstructorOverload;
                    const AssertAndPrint = CS.Puerts.UnitTest.TestHelper.AssertAndPrint;
                    const obj = new ConstructorOverload(1, 1, 1, 0, 0);
                    AssertAndPrint(`TestConstructorOverload obj.selected: ${obj.selected} expected 3`, obj.selected == 3);
                })()
            ");
        }

        [Test]
        public void TestNullablbeFloat()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            var res = jsEnv.Eval<float>(@"
                (function() {
                    const ConstructorOverloadFactory = CS.Puerts.UnitTest.ConstructorOverloadFactory;
                    const AssertAndPrint = CS.Puerts.UnitTest.TestHelper.AssertAndPrint;
                    AssertAndPrint('check 1',  ConstructorOverloadFactory.LogAppEvent(null, 113) == null);
                    AssertAndPrint('check 2', ConstructorOverloadFactory.LogAppEvent('11', null) == null);
                    AssertAndPrint('check 3', ConstructorOverloadFactory.LogAppEvent('11', 113) == 113);
                    return ConstructorOverloadFactory.Value
                })()
            ");
            Assert.AreEqual(113f, res);
        }

        public delegate void DelegateWithDefaultValue(uint callSeq, ulong resourceKey, double a , int param = 0);

        [Test]
        public void DelegateWithDefaultValueTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.UsingAction<uint, ulong, double, int>();
            var cb1 = jsEnv.Eval<DelegateWithDefaultValue>(@"
            function __DWDV(a) {
            }
            __DWDV;
            ");
            cb1(1, 2, 6, 3);
        }

        [Test]
        public void TestFloatAsUInt()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const ConstructorOverloadFactory = CS.Puerts.UnitTest.ConstructorOverloadFactory;
                    const AssertAndPrint = CS.Puerts.UnitTest.TestHelper.AssertAndPrint;
                    AssertAndPrint('TestFloatAsUInt check 1',  ConstructorOverloadFactory.FloatAsUInt(113.123, false) == 113);
                })()
            ");
        }

        [Test]
        public void TestNegativeAsUInt()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const ConstructorOverloadFactory = CS.Puerts.UnitTest.ConstructorOverloadFactory;
                    const AssertAndPrint = CS.Puerts.UnitTest.TestHelper.AssertAndPrint;
                    AssertAndPrint(`TestNegativeAsUInt got ${ConstructorOverloadFactory.FloatAsUInt(-1, false)}`,  ConstructorOverloadFactory.FloatAsUInt(-1, false) == 4294967295);
                })()
            ");
        }

    }
}
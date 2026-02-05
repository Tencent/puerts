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

    public class NewObject
    {

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

        [UnityEngine.Scripting.Preserve]
        public NewObject PushObject()
        {
            return new NewObject();
        }

        [UnityEngine.Scripting.Preserve]
        public static string AddPackage(string descFilePath)
        {
            return descFilePath;
        }

        [UnityEngine.Scripting.Preserve]
        public static string AddPackage(string assetPath, LoadResource loadFunc)
        {
            return assetPath;
        }

        public delegate object LoadResource(string name, string extension, System.Type type, out TestEnum destroyMethod);
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
        [UnityEngine.Scripting.Preserve]
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
#if UNITY_EDITOR || PUERTS_DISABLE_IL2CPP_OPTIMIZATION
            LegacyBridageConfig.UsingFunc<int>();
            LegacyBridageConfig.UsingFunc<int, int>();
            LegacyBridageConfig.UsingFunc<DateTime, DateTime>();
            LegacyBridageConfig.UsingFunc<string, string>();
            LegacyBridageConfig.UsingFunc<bool, bool>();
            LegacyBridageConfig.UsingFunc<long, long>();
            LegacyBridageConfig.UsingFunc<TestStruct, TestStruct>();
            LegacyBridageConfig.UsingFunc<TestStruct?, TestStruct?>();
            LegacyBridageConfig.UsingFunc<TestUnsafeStruct, TestUnsafeStruct>();
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

        public void ClearNumberTestMemberValue()
        {
            numberTestField = 0;
            numberTestProp = 0;
            numberTestFieldStatic = 0;
            numberTestPropStatic = 0;
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

        public void ClearStringTestMemberValue()
        {
            stringTestField = null;
            stringTestProp = null;
            stringTestFieldStatic = null;
            stringTestPropStatic = null;
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

        public void ClearBoolTestMemberValue()
        {
            boolTestField = false;
            boolTestProp = false;
            boolTestFieldStatic = false;
            boolTestPropStatic = false;
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

        public void ClearBigintTestMemberValue()
        {
            bigintTestField = 0;
            bigintTestProp = 0;
            bigintTestFieldStatic = 0;
            bigintTestPropStatic = 0;
        }

        public ulong GetBigULong()
        {
            return ((ulong)long.MaxValue) + 1;
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
        public ScriptObject jsObjectTestField = default(ScriptObject);
        protected ScriptObject _jsObjectTestProp = default(ScriptObject);
        public ScriptObject jsObjectTestProp 
        {
            get { return _jsObjectTestProp; }
            set { _jsObjectTestProp = value; }
        }
        public static ScriptObject jsObjectTestFieldStatic = default(ScriptObject);
        protected static ScriptObject _jsObjectTestPropStatic = default(ScriptObject);
        public static ScriptObject jsObjectTestPropStatic
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
        public ScriptObject JSObjectTestPipeLine(ScriptObject initialValue, Func<ScriptObject, ScriptObject> JSValueHandler) 
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

    [UnityEngine.Scripting.Preserve]
    public class BoxValueContainer
    {
        public object BoxedValue;

        [UnityEngine.Scripting.Preserve]
        public BoxValueContainer()
        {
            BoxedValue = 123;
        }
    }

    [UnityEngine.Scripting.Preserve]
    public struct StaticFieldStruct
    {
        [UnityEngine.Scripting.Preserve]
        public float instanceField;
    }

    [UnityEngine.Scripting.Preserve]
    public static class OnlyStaticFieldClass
    {
        [UnityEngine.Scripting.Preserve]
        public static StaticFieldStruct staticFieldStruct;

        [UnityEngine.Scripting.Preserve]
        static OnlyStaticFieldClass()
        {
            staticFieldStruct = new StaticFieldStruct { instanceField = 3 };
        }
    }

    public struct Struct2Field
    {
        public int X;
        public int Y;
    }

    [UnityEngine.Scripting.Preserve]
    public class ClassHasNullableField
    {
        [UnityEngine.Scripting.Preserve]
        public ClassHasNullableField()
        {
            struct2Filed = new Struct2Field() { X = 10, Y = 20 };
            nullableIntField = 100;
        }
        [UnityEngine.Scripting.Preserve]
        public Struct2Field? struct2Filed;
        [UnityEngine.Scripting.Preserve]
        public int? nullableIntField;
    }

    [UnityEngine.Scripting.Preserve]
    public class BaseWithVirtual
    {
        protected virtual bool VirtualMethod(bool f)
        {
            return f;
        }

        [UnityEngine.Scripting.Preserve]
        public bool VirtualMethod()
        {
            return VirtualMethod(true);
        }
    }

    [UnityEngine.Scripting.Preserve]
    public class DerivedOverrideVirtual : BaseWithVirtual
    {
        [UnityEngine.Scripting.Preserve]
        protected override bool VirtualMethod(bool f)
        {
            return f;
        }
    }

    [UnityEngine.Scripting.Preserve]
    public struct FieldStruct
    {
        public int b;
        public int a;
        public object obj;
    }

    [UnityEngine.Scripting.Preserve]
    public class FieldClass
    {
        public static int ObjCount = 0;
        public FieldClass()
        {
            ObjCount++;
        }
        ~FieldClass()
        {
            ObjCount--;
        }
    }

    [UnityEngine.Scripting.Preserve]
    public struct StructWithObjectField
    {
        public TestEnum testEnum;
        public byte TabEnum;
        public uint eqrdeq;
        public int vaq;
        public object obj;
        public TestEnum gdfaqw;
        public TestEnum ggdasq;
    }

    [UnityEngine.Scripting.Preserve]
    public class FieldClass2
    {
        public static int ObjCount = 0;
        public FieldClass2()
        {
            ObjCount++;
        }
        ~FieldClass2()
        {
            ObjCount--;
        }
    }

    [UnityEngine.Scripting.Preserve]
    public struct StructWithObjectFieldNested
    {
        public int abc;
        public StructWithObjectField nested;
    }


    [TestFixture]
    public class CrossLangTest
    {
        [Test]
        public void ScriptFunctionInstanceTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const TestHelper = CS.Puerts.UnitTest.TestHelper;
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

                    const testHelper = TestHelper.GetInstance();

                    const oFunc = () => 3
                    const rFunc = testHelper.JSFunctionTestPipeLine(oFunc, function (func) {
                        return oFunc;
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
                    testHelper.ClearNumberTestMemberValue();
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

                    testHelper.ClearStringTestMemberValue();
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
                    
                    testHelper.ClearBoolTestMemberValue();
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
                    
                    testHelper.ClearBigintTestMemberValue();
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
        public void ScriptObjectInstanceTest()
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
            var backend = new Puerts.BackendV8(new TxtLoader());
            var jsEnv = new ScriptEnv(backend);
#else
            var backend = new Puerts.BackendV8(new DefaultLoader());
            var jsEnv = new ScriptEnv(backend);
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
            var backend = new Puerts.BackendV8(new TxtLoader());
            var jsEnv = new ScriptEnv(backend);
#else
            var backend = new Puerts.BackendV8(new DefaultLoader());
            var jsEnv = new ScriptEnv(backend);
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

            if (backend is BackendV8 || backend.GetType().Name == "BackendNodeJS")
            {
                jsEnv.Eval("gc()");
            }

            GC.Collect();
            GC.WaitForPendingFinalizers();
            GC.Collect();

            Assert.AreEqual(objCount, TestGC.ObjCount);
            Assert.True(objCount > 0);

            jsEnv.Eval("objs = undefined");

            if (backend is BackendV8 || backend.GetType().Name == "BackendNodeJS")
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
            var backend = new Puerts.BackendV8(new TxtLoader());
            var jsEnv = new ScriptEnv(backend);
#else
            var backend = new Puerts.BackendV8(new DefaultLoader());
            var jsEnv = new ScriptEnv(backend);
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

            if (backend is BackendV8 || backend.GetType().Name == "BackendNodeJS")
            {
                jsEnv.Eval("gc()");
            }

            GC.Collect();
            GC.WaitForPendingFinalizers();
            GC.Collect();

            Assert.AreEqual(objCount, TestGC.ObjCount);
            Assert.True(objCount > 0);

            jsEnv.Eval("objs = undefined");

            if (backend is BackendV8 || backend.GetType().Name == "BackendNodeJS")
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
            var jso = jsEnv.Eval<ScriptObject>(@"
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
        public void AddPackageTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            // Test AddPackage with single string parameter
            var result1 = jsEnv.Eval<string>(@"
                (function() {
                    const CrossLangTestHelper = CS.Puerts.UnitTest.CrossLangTestHelper;
                    const result = CrossLangTestHelper.AddPackage('test/path/to/desc.json');
                    return result;
                })()
            ");
            Assert.AreEqual("test/path/to/desc.json", result1);

            // Test AddPackage with string and delegate parameters
            var result2 = jsEnv.Eval<string>(@"
                (function() {
                    const CrossLangTestHelper = CS.Puerts.UnitTest.CrossLangTestHelper;
                    const TestEnum = CS.Puerts.UnitTest.TestEnum;
                    
                    // Create a load function delegate
                    const loadFunc = function(name, extension, type, outDestroyMethod) {
                        // outDestroyMethod is an out parameter, set it to TestEnum.A
                        outDestroyMethod.value = TestEnum.A;
                        return { name: name, ext: extension };
                    };
                    
                    const result = CrossLangTestHelper.AddPackage('test/asset/path', loadFunc);
                    return result;
                })()
            ");
            Assert.AreEqual("test/asset/path", result2);
            jsEnv.Tick();
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
            LegacyBridageConfig.UsingAction<int>();
            LegacyBridageConfig.UsingAction<string, long>();
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
            LegacyBridageConfig.UsingFunc<long, string>();
            var cb1 = jsEnv.Eval<NotGenericTestFunc>(@"
            function __NGTF(a) {
              return `${a}`
            }
            __NGTF;
            ");
            ;
            Assert.AreEqual("9999", cb1(9999));
        }

        [Test]
        public void BigULongTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            var res = jsEnv.Eval<string>(@"
                (function() {
                    const TestHelper = CS.Puerts.UnitTest.TestHelper;
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);
                
                    const testHelper = TestHelper.GetInstance();
                    const bulong = testHelper.GetBigULong();
                    assertAndPrint('ULongCmp', 9223372036854775807n < bulong);
                    return bulong
                })()
            ");

            // 9223372036854775808
            Assert.AreEqual((((ulong)long.MaxValue) + 1).ToString(), res);
        }
#if !PUERTS_GENERAL
        [Test]
        public void PassDestroyedUnityObjectTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            LegacyBridageConfig.UsingFunc<UnityEngine.Object, bool>();
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
        delegate bool PassScriptObject(ScriptObject obj);

#if !UNITY_WEBGL || UNITY_EDITOR
        [Test]
        public void JsObjectCrossJsEnvs()
        {
            var backend1 = new Puerts.BackendV8(UnitTestEnv.GetLoader());
            var jsEnv1 = new ScriptEnv(backend1);
            var backend2 = new Puerts.BackendV8(UnitTestEnv.GetLoader());
            var jsEnv2 = new ScriptEnv(backend2);
            var jsObj1 = jsEnv1.Eval<ScriptObject>("Object.create(null)");
            var test1 = jsEnv1.Eval<PassScriptObject>("(obj) => !!obj");
            var test2 = jsEnv2.Eval<PassScriptObject>("(obj) => !!obj");
            Assert.True(test1(jsObj1));
			Assert.Catch(() =>
            {
                test2(jsObj1);
			});
            jsEnv1.Dispose();
			Assert.Catch(() =>
            {
                Assert.False(test2(jsObj1));
			});
        }
		
		[Test]
        public void DisposeJsEnvJsObject()
        {
            var backend1 = new Puerts.BackendV8(UnitTestEnv.GetLoader());
            var jsEnv1 = new ScriptEnv(backend1);
            var jsObj1 = jsEnv1.Eval<ScriptObject>("Object.create(null)");
            var test1 = jsEnv1.Eval<PassScriptObject>("(obj) => !!obj");
            Assert.True(test1(jsObj1));
            jsEnv1.Dispose();
            backend1 = new Puerts.BackendV8(UnitTestEnv.GetLoader());
            jsEnv1 = new ScriptEnv(backend1);
            test1 = jsEnv1.Eval<PassScriptObject>("(obj) => !!obj");
			Assert.Catch(() =>
            {
                Assert.False(test1(jsObj1));
			});
        }
#endif

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
            LegacyBridageConfig.UsingAction<uint, ulong, double, int>();
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
                    const res = ConstructorOverloadFactory.FloatAsUInt(-1, false);
                    AssertAndPrint(`TestNegativeAsUInt got ${ConstructorOverloadFactory.FloatAsUInt(-1, false)}`,   res == 4294967295 || res == 0); // depending on .net runtime
                })()
            ");
        }

        [Test]
        public void TestVirtualCall()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            var res = jsEnv.Eval<string>(@"
                (function() {
                    const StringBuilder = CS.System.Text.StringBuilder;
                    const sb = new StringBuilder();
                    sb.Append('ToStringOverrideTest: 123');
                    const res = CS.System.Object.prototype.ToString.call(sb);
                    return res;
                })()
            ");
            Assert.AreEqual("ToStringOverrideTest: 123", res);
        }

        [Test]
        public void BoxValueTest()
        {
            
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const BoxValueContainer = CS.Puerts.UnitTest.BoxValueContainer;
                    const AssertAndPrint = CS.Puerts.UnitTest.TestHelper.AssertAndPrint;
                    const obj = new BoxValueContainer();
                    AssertAndPrint(`BoxValueTest value`,   obj.BoxedValue == 123);
                    AssertAndPrint(`BoxValueTest type`,   typeof obj.BoxedValue == 'number');

                    obj.BoxedValue = 999
                    AssertAndPrint(`BoxValueTest changed value`,   obj.BoxedValue == 999);
                    AssertAndPrint(`BoxValueTest changed type`,   typeof obj.BoxedValue == 'number');
                })()
            ");
        }

        [Test]
        public void AccessOnlyStaticFieldClass()
        {

            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const OnlyStaticFieldClass = CS.Puerts.UnitTest.OnlyStaticFieldClass;
                    const AssertAndPrint = CS.Puerts.UnitTest.TestHelper.AssertAndPrint;
                    AssertAndPrint(`OnlyStaticFieldClass.staticFieldStruct.instanceField`,  OnlyStaticFieldClass.staticFieldStruct.instanceField == 3);
                })()
            ");
        }

        [Test]
        public void TestClassHasNullableField()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const ClassHasNullableField = CS.Puerts.UnitTest.ClassHasNullableField;
                    const obj = new ClassHasNullableField();
                    const AssertAndPrint = CS.Puerts.UnitTest.TestHelper.AssertAndPrint;
                    AssertAndPrint('check obj.struct2Filed.X', obj.struct2Filed.X == 10);
                    AssertAndPrint('check obj.struct2Filed.Y', obj.struct2Filed.Y == 20);
                    AssertAndPrint('check obj.nullableIntField', obj.nullableIntField == 100);
                    const s = obj.struct2Filed;
                    s.X = 100;
                    s.Y = 200;
                    obj.struct2Filed = s;
                    obj.nullableIntField = 500;
                    console.log('after set ', obj.struct2Filed.X, obj.struct2Filed.Y, obj.nullableIntField);
                    AssertAndPrint(`after set check obj.struct2Filed.X ${ obj.struct2Filed.X }`, obj.struct2Filed.X == 100);
                    AssertAndPrint(`after set check obj.struct2Filed.Y ${ obj.struct2Filed.Y }`, obj.struct2Filed.Y == 200);
                    AssertAndPrint(`after set check obj.nullableIntField ${ obj.nullableIntField }`, obj.nullableIntField == 500);
                })()
            ");
        }

        [Test]
        public void TestDerivedOverrideVirtual()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            var res = jsEnv.Eval<bool>(@"
                (function() {
                    return new CS.Puerts.UnitTest.DerivedOverrideVirtual().VirtualMethod();
                })()
            ");
            Assert.AreEqual(true, res);
        }

        // gc相关测试在webgl下不稳定，先去掉
#if !UNITY_WEBGL || UNITY_EDITOR
        [Test]
        public void TestObjectFieldRefAStruct()
        {
            FieldClass.ObjCount = 0;
            FieldClass2.ObjCount = 0;
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval("CS.Puerts.UnitTest.StructWithObjectField, CS.Puerts.UnitTest.FieldStruct, CS.Puerts.UnitTest.FieldClass");
            var res = jsEnv.Eval<int>(@"
                globalThis.__TestObjectFieldRefAStruct = new CS.Puerts.UnitTest.StructWithObjectField();
                globalThis.__StructWithObjectFieldNested = new CS.Puerts.UnitTest.StructWithObjectFieldNested();
                (function() {
                    const o = new CS.Puerts.UnitTest.FieldStruct();
                    o.a = 8766
                    __TestObjectFieldRefAStruct.obj = o;
                    const n =  __StructWithObjectFieldNested.nested; // valuetype is copy by value
                    n.obj =  new CS.Puerts.UnitTest.FieldClass2();
                    __StructWithObjectFieldNested.nested = n;
                })()
                __TestObjectFieldRefAStruct.obj.a;
            ");

            jsEnv.Backend.LowMemoryNotification();
            Assert.AreEqual(8766, res);
            GC.Collect();
            GC.WaitForPendingFinalizers();
            jsEnv.Eval(@"
                 (function() {
                    for (let i = 0; i < 1000; i++) {
                        const o = new CS.Puerts.UnitTest.FieldStruct();
                        o.a = i
                    }
                 })()
             ");
            jsEnv.Backend.LowMemoryNotification();
            GC.Collect();
            GC.WaitForPendingFinalizers();
            

            res = jsEnv.Eval<int>("__TestObjectFieldRefAStruct.obj.a;");
            Assert.AreEqual(8766, res);

            jsEnv.Eval("__TestObjectFieldRefAStruct.obj = new CS.Puerts.UnitTest.FieldClass()");
            jsEnv.Backend.LowMemoryNotification();
            GC.Collect();
            GC.WaitForPendingFinalizers();
            TestHelper.AssertAndPrint("FieldClass", 1, FieldClass.ObjCount);
            TestHelper.AssertAndPrint("FieldClass2", 1, FieldClass2.ObjCount);

            jsEnv.Eval(@"
                (function() {
                    __TestObjectFieldRefAStruct.obj = null
                    const n =  __StructWithObjectFieldNested.nested; // valuetype is copy by value
                    n.obj =  null;
                    __StructWithObjectFieldNested.nested = n;
                })()
            ");
            jsEnv.Backend.LowMemoryNotification();
            GC.Collect();
            GC.WaitForPendingFinalizers();
            TestHelper.AssertAndPrint("FieldClass", 0, FieldClass.ObjCount);
            TestHelper.AssertAndPrint("FieldClass2", 0, FieldClass2.ObjCount);
        }
#endif

    }
}
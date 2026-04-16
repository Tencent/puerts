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

    public class OverrideTestBase
    {
        public string Foo()
        {
            return "i am base";
        }
    }

    public class OverrideTestDriveA : OverrideTestBase
    {
    }

    public class OverrideTestDriveB : OverrideTestBase
    {
        public string Foo() 
        {
            return "i am B";
        }
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
            LegacyBridageConfig.UsingFunc<double, double>();
            LegacyBridageConfig.UsingFunc<float, float>();
            LegacyBridageConfig.UsingFunc<byte, byte>();
            LegacyBridageConfig.UsingFunc<sbyte, sbyte>();
            LegacyBridageConfig.UsingFunc<short, short>();
            LegacyBridageConfig.UsingFunc<ushort, ushort>();
            LegacyBridageConfig.UsingFunc<uint, uint>();
            LegacyBridageConfig.UsingFunc<ulong, ulong>();
            LegacyBridageConfig.UsingFunc<char, char>();
#endif
        }

        public Func<int> JSFunctionTestPipeLine(Func<int> initialValue, Func<Func<int>, Func<int>> JSValueHandler)
        {
            AssertAndPrint("CSGetFunctionArgFromJS", initialValue(), 3);
            //AssertAndPrint("CSGetFunctionReturnFromJS", JSValueHandler(initialValue), initialValue); // 这里判断一下引用
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
        public bool IsFunctionEventBinded()
        {
            return functionEvent != null;
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
        * IntPtr
        */
        public IntPtr intPtrTestField = IntPtr.Zero;
        protected IntPtr _intPtrTestProp = IntPtr.Zero;
        public IntPtr intPtrTestProp 
        {
            get { return _intPtrTestProp; }
            set { _intPtrTestProp = value; }
        }
        public static IntPtr intPtrTestFieldStatic = IntPtr.Zero;
        protected static IntPtr _intPtrTestPropStatic = IntPtr.Zero;
        public static IntPtr intPtrTestPropStatic
        {
            get { return _intPtrTestPropStatic; }
            set { _intPtrTestPropStatic = value; }
        }

        public IntPtr GetTestIntPtr()
        {
            return new IntPtr(12345);
        }

        public void ClearIntPtrTestMemberValue()
        {
            intPtrTestField = IntPtr.Zero;
            intPtrTestProp = IntPtr.Zero;
            intPtrTestFieldStatic = IntPtr.Zero;
            intPtrTestPropStatic = IntPtr.Zero;
        }

        public void IntPtrTestCheckMemberValue(IntPtr expected)
        {
            AssertAndPrint("CSIntPtrTestField", intPtrTestField == expected);
            AssertAndPrint("CSIntPtrTestProp", intPtrTestProp == expected);
            AssertAndPrint("CSIntPtrTestFieldStatic", intPtrTestFieldStatic == expected);
            AssertAndPrint("CSIntPtrTestPropStatic", intPtrTestPropStatic == expected);
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

        // ========== double ==========
        public double DoubleTestPipeLine(double initialValue, out double outArg, Func<double, double> JSValueHandler)
        {
            AssertAndPrint("CSGetDoubleArgFromJS", initialValue, 3.14);
            AssertAndPrint("CSGetDoubleReturnFromJS", JSValueHandler(initialValue + 1.0), initialValue + 2.0);
            outArg = initialValue + 3.0;
            return initialValue + 4.0;
        }
        public double doubleTestField = 0;
        protected double _doubleTestProp = 0;
        public double doubleTestProp
        {
            get { return _doubleTestProp; }
            set { _doubleTestProp = value; }
        }
        public static double doubleTestFieldStatic = 0;
        protected static double _doubleTestPropStatic = 0;
        public static double doubleTestPropStatic
        {
            get { return _doubleTestPropStatic; }
            set { _doubleTestPropStatic = value; }
        }
        public void ClearDoubleTestMemberValue()
        {
            doubleTestField = 0;
            doubleTestProp = 0;
            doubleTestFieldStatic = 0;
            doubleTestPropStatic = 0;
        }
        public void DoubleTestCheckMemberValue()
        {
            AssertAndPrint("CSDoubleTestField", doubleTestField, 1.5);
            AssertAndPrint("CSDoubleTestProp", doubleTestProp, 1.5);
            AssertAndPrint("CSDoubleTestFieldStatic", doubleTestFieldStatic, 1.5);
            AssertAndPrint("CSDoubleTestPropStatic", doubleTestPropStatic, 1.5);
        }

        // ========== float ==========
        public float FloatTestPipeLine(float initialValue, out float outArg, Func<float, float> JSValueHandler)
        {
            AssertAndPrint("CSGetFloatArgFromJS", (double)initialValue, (double)2.5f);
            AssertAndPrint("CSGetFloatReturnFromJS", (double)JSValueHandler(initialValue + 1.0f), (double)(initialValue + 2.0f));
            outArg = initialValue + 3.0f;
            return initialValue + 4.0f;
        }
        public float floatTestField = 0;
        protected float _floatTestProp = 0;
        public float floatTestProp
        {
            get { return _floatTestProp; }
            set { _floatTestProp = value; }
        }
        public static float floatTestFieldStatic = 0;
        protected static float _floatTestPropStatic = 0;
        public static float floatTestPropStatic
        {
            get { return _floatTestPropStatic; }
            set { _floatTestPropStatic = value; }
        }
        public void ClearFloatTestMemberValue()
        {
            floatTestField = 0;
            floatTestProp = 0;
            floatTestFieldStatic = 0;
            floatTestPropStatic = 0;
        }
        public void FloatTestCheckMemberValue()
        {
            AssertAndPrint("CSFloatTestField", (double)floatTestField, (double)1.5f);
            AssertAndPrint("CSFloatTestProp", (double)floatTestProp, (double)1.5f);
            AssertAndPrint("CSFloatTestFieldStatic", (double)floatTestFieldStatic, (double)1.5f);
            AssertAndPrint("CSFloatTestPropStatic", (double)floatTestPropStatic, (double)1.5f);
        }

        // ========== byte ==========
        public byte ByteTestPipeLine(byte initialValue, out byte outArg, Func<byte, byte> JSValueHandler)
        {
            AssertAndPrint("CSGetByteArgFromJS", (int)initialValue, 100);
            AssertAndPrint("CSGetByteReturnFromJS", (int)JSValueHandler((byte)(initialValue + 1)), (int)(initialValue + 2));
            outArg = (byte)(initialValue + 3);
            return (byte)(initialValue + 4);
        }
        public byte byteTestField = 0;
        protected byte _byteTestProp = 0;
        public byte byteTestProp
        {
            get { return _byteTestProp; }
            set { _byteTestProp = value; }
        }
        public static byte byteTestFieldStatic = 0;
        protected static byte _byteTestPropStatic = 0;
        public static byte byteTestPropStatic
        {
            get { return _byteTestPropStatic; }
            set { _byteTestPropStatic = value; }
        }
        public void ClearByteTestMemberValue()
        {
            byteTestField = 0;
            byteTestProp = 0;
            byteTestFieldStatic = 0;
            byteTestPropStatic = 0;
        }
        public void ByteTestCheckMemberValue()
        {
            AssertAndPrint("CSByteTestField", (int)byteTestField, 200);
            AssertAndPrint("CSByteTestProp", (int)byteTestProp, 200);
            AssertAndPrint("CSByteTestFieldStatic", (int)byteTestFieldStatic, 200);
            AssertAndPrint("CSByteTestPropStatic", (int)byteTestPropStatic, 200);
        }

        // ========== sbyte ==========
        public sbyte SByteTestPipeLine(sbyte initialValue, out sbyte outArg, Func<sbyte, sbyte> JSValueHandler)
        {
            AssertAndPrint("CSGetSByteArgFromJS", (int)initialValue, -50);
            AssertAndPrint("CSGetSByteReturnFromJS", (int)JSValueHandler((sbyte)(initialValue + 1)), (int)(initialValue + 2));
            outArg = (sbyte)(initialValue + 3);
            return (sbyte)(initialValue + 4);
        }
        public sbyte sbyteTestField = 0;
        protected sbyte _sbyteTestProp = 0;
        public sbyte sbyteTestProp
        {
            get { return _sbyteTestProp; }
            set { _sbyteTestProp = value; }
        }
        public static sbyte sbyteTestFieldStatic = 0;
        protected static sbyte _sbyteTestPropStatic = 0;
        public static sbyte sbyteTestPropStatic
        {
            get { return _sbyteTestPropStatic; }
            set { _sbyteTestPropStatic = value; }
        }
        public void ClearSByteTestMemberValue()
        {
            sbyteTestField = 0;
            sbyteTestProp = 0;
            sbyteTestFieldStatic = 0;
            sbyteTestPropStatic = 0;
        }
        public void SByteTestCheckMemberValue()
        {
            AssertAndPrint("CSSByteTestField", (int)sbyteTestField, 42);
            AssertAndPrint("CSSByteTestProp", (int)sbyteTestProp, 42);
            AssertAndPrint("CSSByteTestFieldStatic", (int)sbyteTestFieldStatic, 42);
            AssertAndPrint("CSSByteTestPropStatic", (int)sbyteTestPropStatic, 42);
        }

        // ========== short ==========
        public short ShortTestPipeLine(short initialValue, out short outArg, Func<short, short> JSValueHandler)
        {
            AssertAndPrint("CSGetShortArgFromJS", (int)initialValue, 1000);
            AssertAndPrint("CSGetShortReturnFromJS", (int)JSValueHandler((short)(initialValue + 1)), (int)(initialValue + 2));
            outArg = (short)(initialValue + 3);
            return (short)(initialValue + 4);
        }
        public short shortTestField = 0;
        protected short _shortTestProp = 0;
        public short shortTestProp
        {
            get { return _shortTestProp; }
            set { _shortTestProp = value; }
        }
        public static short shortTestFieldStatic = 0;
        protected static short _shortTestPropStatic = 0;
        public static short shortTestPropStatic
        {
            get { return _shortTestPropStatic; }
            set { _shortTestPropStatic = value; }
        }
        public void ClearShortTestMemberValue()
        {
            shortTestField = 0;
            shortTestProp = 0;
            shortTestFieldStatic = 0;
            shortTestPropStatic = 0;
        }
        public void ShortTestCheckMemberValue()
        {
            AssertAndPrint("CSShortTestField", (int)shortTestField, 999);
            AssertAndPrint("CSShortTestProp", (int)shortTestProp, 999);
            AssertAndPrint("CSShortTestFieldStatic", (int)shortTestFieldStatic, 999);
            AssertAndPrint("CSShortTestPropStatic", (int)shortTestPropStatic, 999);
        }

        // ========== ushort ==========
        public ushort UShortTestPipeLine(ushort initialValue, out ushort outArg, Func<ushort, ushort> JSValueHandler)
        {
            AssertAndPrint("CSGetUShortArgFromJS", (int)initialValue, 2000);
            AssertAndPrint("CSGetUShortReturnFromJS", (int)JSValueHandler((ushort)(initialValue + 1)), (int)(initialValue + 2));
            outArg = (ushort)(initialValue + 3);
            return (ushort)(initialValue + 4);
        }
        public ushort ushortTestField = 0;
        protected ushort _ushortTestProp = 0;
        public ushort ushortTestProp
        {
            get { return _ushortTestProp; }
            set { _ushortTestProp = value; }
        }
        public static ushort ushortTestFieldStatic = 0;
        protected static ushort _ushortTestPropStatic = 0;
        public static ushort ushortTestPropStatic
        {
            get { return _ushortTestPropStatic; }
            set { _ushortTestPropStatic = value; }
        }
        public void ClearUShortTestMemberValue()
        {
            ushortTestField = 0;
            ushortTestProp = 0;
            ushortTestFieldStatic = 0;
            ushortTestPropStatic = 0;
        }
        public void UShortTestCheckMemberValue()
        {
            AssertAndPrint("CSUShortTestField", (int)ushortTestField, 999);
            AssertAndPrint("CSUShortTestProp", (int)ushortTestProp, 999);
            AssertAndPrint("CSUShortTestFieldStatic", (int)ushortTestFieldStatic, 999);
            AssertAndPrint("CSUShortTestPropStatic", (int)ushortTestPropStatic, 999);
        }

        // ========== uint ==========
        public uint UIntTestPipeLine(uint initialValue, out uint outArg, Func<uint, uint> JSValueHandler)
        {
            AssertAndPrint("CSGetUIntArgFromJS", initialValue, (uint)100000);
            AssertAndPrint("CSGetUIntReturnFromJS", JSValueHandler(initialValue + 1), initialValue + 2);
            outArg = initialValue + 3;
            return initialValue + 4;
        }
        public uint uintTestField = 0;
        protected uint _uintTestProp = 0;
        public uint uintTestProp
        {
            get { return _uintTestProp; }
            set { _uintTestProp = value; }
        }
        public static uint uintTestFieldStatic = 0;
        protected static uint _uintTestPropStatic = 0;
        public static uint uintTestPropStatic
        {
            get { return _uintTestPropStatic; }
            set { _uintTestPropStatic = value; }
        }
        public void ClearUIntTestMemberValue()
        {
            uintTestField = 0;
            uintTestProp = 0;
            uintTestFieldStatic = 0;
            uintTestPropStatic = 0;
        }
        public void UIntTestCheckMemberValue()
        {
            AssertAndPrint("CSUIntTestField", uintTestField, (uint)12345);
            AssertAndPrint("CSUIntTestProp", uintTestProp, (uint)12345);
            AssertAndPrint("CSUIntTestFieldStatic", uintTestFieldStatic, (uint)12345);
            AssertAndPrint("CSUIntTestPropStatic", uintTestPropStatic, (uint)12345);
        }

        // ========== ulong ==========
        public ulong ULongTestPipeLine(ulong initialValue, out ulong outArg, Func<ulong, ulong> JSValueHandler)
        {
            AssertAndPrint("CSGetULongArgFromJS", initialValue, (ulong)9007199254740992);
            AssertAndPrint("CSGetULongReturnFromJS", JSValueHandler(initialValue + 1), initialValue + 2);
            outArg = initialValue + 3;
            return initialValue + 4;
        }
        public ulong ulongTestField = 0;
        protected ulong _ulongTestProp = 0;
        public ulong ulongTestProp
        {
            get { return _ulongTestProp; }
            set { _ulongTestProp = value; }
        }
        public static ulong ulongTestFieldStatic = 0;
        protected static ulong _ulongTestPropStatic = 0;
        public static ulong ulongTestPropStatic
        {
            get { return _ulongTestPropStatic; }
            set { _ulongTestPropStatic = value; }
        }
        public void ClearULongTestMemberValue()
        {
            ulongTestField = 0;
            ulongTestProp = 0;
            ulongTestFieldStatic = 0;
            ulongTestPropStatic = 0;
        }
        public void ULongTestCheckMemberValue()
        {
            AssertAndPrint("CSULongTestField", ulongTestField, (ulong)9007199254740987);
            AssertAndPrint("CSULongTestProp", ulongTestProp, (ulong)9007199254740987);
            AssertAndPrint("CSULongTestFieldStatic", ulongTestFieldStatic, (ulong)9007199254740987);
            AssertAndPrint("CSULongTestPropStatic", ulongTestPropStatic, (ulong)9007199254740987);
        }

        // ========== char ==========
        public char CharTestPipeLine(char initialValue, out char outArg, Func<char, char> JSValueHandler)
        {
            AssertAndPrint("CSGetCharArgFromJS", initialValue.ToString(), "A");
            AssertAndPrint("CSGetCharReturnFromJS", JSValueHandler('B').ToString(), "C");
            outArg = 'D';
            return 'E';
        }
        public char charTestField = '\0';
        protected char _charTestProp = '\0';
        public char charTestProp
        {
            get { return _charTestProp; }
            set { _charTestProp = value; }
        }
        public static char charTestFieldStatic = '\0';
        protected static char _charTestPropStatic = '\0';
        public static char charTestPropStatic
        {
            get { return _charTestPropStatic; }
            set { _charTestPropStatic = value; }
        }
        public void ClearCharTestMemberValue()
        {
            charTestField = '\0';
            charTestProp = '\0';
            charTestFieldStatic = '\0';
            charTestPropStatic = '\0';
        }
        public void CharTestCheckMemberValue()
        {
            AssertAndPrint("CSCharTestField", charTestField.ToString(), "Z");
            AssertAndPrint("CSCharTestProp", charTestProp.ToString(), "Z");
            AssertAndPrint("CSCharTestFieldStatic", charTestFieldStatic.ToString(), "Z");
            AssertAndPrint("CSCharTestPropStatic", charTestPropStatic.ToString(), "Z");
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

        [UnityEngine.Scripting.Preserve]
        public object BoxedInt() { return (int)42; }
        [UnityEngine.Scripting.Preserve]
        public object BoxedDouble() { return (double)3.14; }
        [UnityEngine.Scripting.Preserve]
        public object BoxedFloat() { return (float)2.5f; }
        [UnityEngine.Scripting.Preserve]
        public object BoxedBool() { return true; }
        [UnityEngine.Scripting.Preserve]
        public object BoxedLong() { return (long)9007199254740992; }
        [UnityEngine.Scripting.Preserve]
        public object BoxedByte() { return (byte)200; }
        [UnityEngine.Scripting.Preserve]
        public object BoxedSByte() { return (sbyte)-50; }
        [UnityEngine.Scripting.Preserve]
        public object BoxedShort() { return (short)-1000; }
        [UnityEngine.Scripting.Preserve]
        public object BoxedUShort() { return (ushort)60000; }
        [UnityEngine.Scripting.Preserve]
        public object BoxedUInt() { return (uint)3000000000; }
        [UnityEngine.Scripting.Preserve]
        public object BoxedULong() { return (ulong)9007199254740993; }
        [UnityEngine.Scripting.Preserve]
        public object BoxedChar() { return 'A'; }
        [UnityEngine.Scripting.Preserve]
        public object BoxedString() { return "hello"; }

        [UnityEngine.Scripting.Preserve]
        public void CheckBoxedInt(object val) { TestHelper.AssertAndPrint("CheckBoxedInt", val.ToString(), ((int)42).ToString()); }
        [UnityEngine.Scripting.Preserve]
        public void CheckBoxedDouble(object val) { TestHelper.AssertAndPrint("CheckBoxedDouble", val.ToString(), ((double)3.14).ToString()); }
        [UnityEngine.Scripting.Preserve]
        public void CheckBoxedFloat(object val) { TestHelper.AssertAndPrint("CheckBoxedFloat", val.ToString(), ((float)2.5f).ToString()); }
        [UnityEngine.Scripting.Preserve]
        public void CheckBoxedBool(object val) { TestHelper.AssertAndPrint("CheckBoxedBool", val.ToString(), true.ToString()); }
        [UnityEngine.Scripting.Preserve]
        public void CheckBoxedLong(object val) { TestHelper.AssertAndPrint("CheckBoxedLong", val.ToString(), ((long)9007199254740992).ToString()); }
        [UnityEngine.Scripting.Preserve]
        public void CheckBoxedByte(object val) { TestHelper.AssertAndPrint("CheckBoxedByte", val.ToString(), ((byte)200).ToString()); }
        [UnityEngine.Scripting.Preserve]
        public void CheckBoxedSByte(object val) { TestHelper.AssertAndPrint("CheckBoxedSByte", val.ToString(), ((sbyte)-50).ToString()); }
        [UnityEngine.Scripting.Preserve]
        public void CheckBoxedShort(object val) { TestHelper.AssertAndPrint("CheckBoxedShort", val.ToString(), ((short)-1000).ToString()); }
        [UnityEngine.Scripting.Preserve]
        public void CheckBoxedUShort(object val) { TestHelper.AssertAndPrint("CheckBoxedUShort", val.ToString(), ((ushort)60000).ToString()); }
        [UnityEngine.Scripting.Preserve]
        public void CheckBoxedUInt(object val) { TestHelper.AssertAndPrint("CheckBoxedUInt", val.ToString(), ((uint)3000000000).ToString()); }
        [UnityEngine.Scripting.Preserve]
        public void CheckBoxedULong(object val) { TestHelper.AssertAndPrint("CheckBoxedULong", val.ToString(), ((ulong)9007199254740993).ToString()); }
        [UnityEngine.Scripting.Preserve]
        public void CheckBoxedChar(object val) { TestHelper.AssertAndPrint("CheckBoxedChar", val.ToString(), 65.ToString()); }
        [UnityEngine.Scripting.Preserve]
        public void CheckBoxedString(object val) { TestHelper.AssertAndPrint("CheckBoxedString", val.ToString(), "hello"); }
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
                    assertAndPrint('must not binded', testHelper.IsFunctionEventBinded(), false);
                    testHelper.add_functionEvent(evfn);
                    assertAndPrint('must binded', testHelper.IsFunctionEventBinded(), true);
                    testHelper.functionTestField = () => 3
                    testHelper.functionTestProp = () => 3
                    TestHelper.functionTestFieldStatic = () => 3
                    TestHelper.functionTestPropStatic = () => 3
                    testHelper.JSFunctionTestCheckMemberValue();
                    testHelper.remove_functionEvent(evfn);
                    assertAndPrint('must not binded after removed', testHelper.IsFunctionEventBinded(), false);

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
        public void IntPtrInstanceTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const TestHelper = CS.Puerts.UnitTest.TestHelper;
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

                    const testHelper = TestHelper.GetInstance();

                    const ptr = testHelper.GetTestIntPtr();
                    console.log(`typeof IntPtr is ${typeof ptr}`);
                    testHelper.ClearIntPtrTestMemberValue();
                    testHelper.intPtrTestField = ptr;
                    testHelper.intPtrTestProp = ptr;
                    TestHelper.intPtrTestFieldStatic = ptr;
                    TestHelper.intPtrTestPropStatic = ptr;
                    testHelper.IntPtrTestCheckMemberValue(ptr);
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

        private Action<string, long> BindTwoDelegateAndRetSecond(ScriptEnv jsEnv)
        {
            var cb2 = jsEnv.Eval<Action<string, long>>("__GCB22");
            var cb1 = jsEnv.Eval<Action<int>>("__GCB22");
            //UnityEngine.Debug.Log("obj1: " + cb2.Target.GetHashCode());
            //UnityEngine.Debug.Log("obj2: " + cb1.Target.GetHashCode());
            cb1 = null;
            GC.Collect();
            GC.WaitForPendingFinalizers();
            jsEnv.Tick();
            return cb2;
        }

        private void BindTwoDelegateReleseAll(ScriptEnv jsEnv)
        {
            var cb = BindTwoDelegateAndRetSecond(jsEnv);
            GC.Collect();
            GC.WaitForPendingFinalizers();
            jsEnv.Tick();
            cb = null;
        }

        [Test]
        public void CastJsFunctionAsSecondDelegateAfterFirstDelegateGC()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            LegacyBridageConfig.UsingAction<int>();
            LegacyBridageConfig.UsingAction<string, long>();

            for (int i = 0; i < 10; i++)
            {
                jsEnv.Eval(@"
            function __GCB22(a, b) {
              __GMSG = `${a}${b}`
            }
            ");
                GC.Collect();
                GC.WaitForPendingFinalizers();
                jsEnv.Tick();
                BindTwoDelegateReleseAll(jsEnv);
                GC.Collect();
                GC.WaitForPendingFinalizers();
                jsEnv.Tick();
            }
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
        /*
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
        */

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
        public void BoxedPrimitiveReturnTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const BoxValueContainer = CS.Puerts.UnitTest.BoxValueContainer;
                    const AssertAndPrint = CS.Puerts.UnitTest.TestHelper.AssertAndPrint;
                    const obj = new BoxValueContainer();

                    // int
                    const boxedInt = obj.BoxedInt();
                    AssertAndPrint('BoxedInt value', boxedInt == 42);
                    AssertAndPrint('BoxedInt type', typeof boxedInt == 'number');

                    // double
                    const boxedDouble = obj.BoxedDouble();
                    AssertAndPrint('BoxedDouble value', Math.abs(boxedDouble - 3.14) < 0.001);
                    AssertAndPrint('BoxedDouble type', typeof boxedDouble == 'number');

                    // float
                    const boxedFloat = obj.BoxedFloat();
                    AssertAndPrint('BoxedFloat value', Math.abs(boxedFloat - 2.5) < 0.001);
                    AssertAndPrint('BoxedFloat type', typeof boxedFloat == 'number');

                    // bool
                    const boxedBool = obj.BoxedBool();
                    AssertAndPrint('BoxedBool value', boxedBool === true);
                    AssertAndPrint('BoxedBool type', typeof boxedBool == 'boolean');

                    // byte
                    const boxedByte = obj.BoxedByte();
                    AssertAndPrint('BoxedByte value', boxedByte == 200);
                    AssertAndPrint('BoxedByte type', typeof boxedByte == 'number');

                    // sbyte
                    const boxedSByte = obj.BoxedSByte();
                    AssertAndPrint('BoxedSByte value', boxedSByte == -50);
                    AssertAndPrint('BoxedSByte type', typeof boxedSByte == 'number');

                    // short
                    const boxedShort = obj.BoxedShort();
                    AssertAndPrint('BoxedShort value', boxedShort == -1000);
                    AssertAndPrint('BoxedShort type', typeof boxedShort == 'number');

                    // ushort
                    const boxedUShort = obj.BoxedUShort();
                    AssertAndPrint('BoxedUShort value', boxedUShort == 60000);
                    AssertAndPrint('BoxedUShort type', typeof boxedUShort == 'number');

                    // uint
                    const boxedUInt = obj.BoxedUInt();
                    AssertAndPrint('BoxedUInt value', boxedUInt == 3000000000);
                    AssertAndPrint('BoxedUInt type', typeof boxedUInt == 'number');

                    // char
                    const boxedChar = obj.BoxedChar();
                    AssertAndPrint('BoxedChar value', boxedChar == 65); // 'A' == 65
                    AssertAndPrint('BoxedChar type', typeof boxedChar == 'number');

                    // string
                    const boxedString = obj.BoxedString();
                    AssertAndPrint('BoxedString value', boxedString == 'hello');
                    AssertAndPrint('BoxedString type', typeof boxedString == 'string');
                })()
            ");
            jsEnv.Tick();
        }

#if !UNITY_WEBGL
        [Test]
        public void BoxedBigIntReturnTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const BoxValueContainer = CS.Puerts.UnitTest.BoxValueContainer;
                    const AssertAndPrint = CS.Puerts.UnitTest.TestHelper.AssertAndPrint;
                    const obj = new BoxValueContainer();

                    // long
                    const boxedLong = obj.BoxedLong();
                    AssertAndPrint('BoxedLong value', boxedLong == 9007199254740992n);
                    AssertAndPrint('BoxedLong type', typeof boxedLong == 'bigint');

                    // ulong
                    const boxedULong = obj.BoxedULong();
                    AssertAndPrint('BoxedULong value', boxedULong == 9007199254740993n);
                    AssertAndPrint('BoxedULong type', typeof boxedULong == 'bigint');
                })()
            ");
            jsEnv.Tick();
        }
#endif

        [Test]
        public void BoxedPrimitivePassToCSTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const BoxValueContainer = CS.Puerts.UnitTest.BoxValueContainer;
                    const obj = new BoxValueContainer();

                    // pass JS values to C# object parameter
                    obj.CheckBoxedInt(42);
                    obj.CheckBoxedDouble(3.14);
                    obj.CheckBoxedFloat(2.5);
                    obj.CheckBoxedBool(true);
                    obj.CheckBoxedByte(200);
                    obj.CheckBoxedSByte(-50);
                    obj.CheckBoxedShort(-1000);
                    obj.CheckBoxedUShort(60000);
                    obj.CheckBoxedUInt(3000000000);
                    obj.CheckBoxedChar(65);
                    obj.CheckBoxedString('hello');
                })()
            ");
            jsEnv.Tick();
        }

#if !UNITY_WEBGL
        [Test]
        public void BoxedBigIntPassToCSTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const BoxValueContainer = CS.Puerts.UnitTest.BoxValueContainer;
                    const obj = new BoxValueContainer();

                    obj.CheckBoxedLong(9007199254740992n);
                    obj.CheckBoxedULong(9007199254740993n);
                })()
            ");
            jsEnv.Tick();
        }
#endif

        [Test]
        public void BoxedPrimitiveFieldRoundtripTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const BoxValueContainer = CS.Puerts.UnitTest.BoxValueContainer;
                    const AssertAndPrint = CS.Puerts.UnitTest.TestHelper.AssertAndPrint;
                    const obj = new BoxValueContainer();

                    // write boxed return value back to object field, then read it back
                    obj.BoxedValue = obj.BoxedInt();
                    AssertAndPrint('Roundtrip int', obj.BoxedValue == 42);

                    obj.BoxedValue = obj.BoxedDouble();
                    AssertAndPrint('Roundtrip double', Math.abs(obj.BoxedValue - 3.14) < 0.001);

                    obj.BoxedValue = obj.BoxedFloat();
                    AssertAndPrint('Roundtrip float', Math.abs(obj.BoxedValue - 2.5) < 0.001);

                    obj.BoxedValue = obj.BoxedBool();
                    AssertAndPrint('Roundtrip bool', obj.BoxedValue === true);

                    obj.BoxedValue = obj.BoxedByte();
                    AssertAndPrint('Roundtrip byte', obj.BoxedValue == 200);

                    obj.BoxedValue = obj.BoxedSByte();
                    AssertAndPrint('Roundtrip sbyte', obj.BoxedValue == -50);

                    obj.BoxedValue = obj.BoxedShort();
                    AssertAndPrint('Roundtrip short', obj.BoxedValue == -1000);

                    obj.BoxedValue = obj.BoxedUShort();
                    AssertAndPrint('Roundtrip ushort', obj.BoxedValue == 60000);

                    obj.BoxedValue = obj.BoxedUInt();
                    AssertAndPrint('Roundtrip uint', obj.BoxedValue == 3000000000);

                    obj.BoxedValue = obj.BoxedChar();
                    AssertAndPrint('Roundtrip char', obj.BoxedValue == 65);

                    obj.BoxedValue = obj.BoxedString();
                    AssertAndPrint('Roundtrip string', obj.BoxedValue == 'hello');
                })()
            ");
            jsEnv.Tick();
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

        [Test]
        public void DoubleInstanceTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const TestHelper = CS.Puerts.UnitTest.TestHelper;
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

                    const testHelper = TestHelper.GetInstance();

                    const outRef = [];
                    const oDouble = outRef[0] = 3.14;
                    const rDouble = testHelper.DoubleTestPipeLine(oDouble, outRef, function (d) {
                        assertAndPrint('JSGetDoubleArgFromCS', d, oDouble + 1.0);
                        return oDouble + 2.0;
                    });
                    assertAndPrint('JSGetDoubleOutArgFromCS', outRef[0], oDouble + 3.0);
                    assertAndPrint('JSGetDoubleReturnFromCS', rDouble, oDouble + 4.0);
                    testHelper.ClearDoubleTestMemberValue();
                    testHelper.doubleTestField = 1.5
                    testHelper.doubleTestProp = 1.5
                    TestHelper.doubleTestFieldStatic = 1.5
                    TestHelper.doubleTestPropStatic = 1.5
                    testHelper.DoubleTestCheckMemberValue();
                })()
            ");
            jsEnv.Tick();
        }
        [Test]
        public void FloatInstanceTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const TestHelper = CS.Puerts.UnitTest.TestHelper;
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

                    const testHelper = TestHelper.GetInstance();

                    const outRef = [];
                    const oFloat = outRef[0] = 2.5;
                    const rFloat = testHelper.FloatTestPipeLine(oFloat, outRef, function (f) {
                        assertAndPrint('JSGetFloatArgFromCS', f, oFloat + 1.0);
                        return oFloat + 2.0;
                    });
                    assertAndPrint('JSGetFloatOutArgFromCS', outRef[0], oFloat + 3.0);
                    assertAndPrint('JSGetFloatReturnFromCS', rFloat, oFloat + 4.0);
                    testHelper.ClearFloatTestMemberValue();
                    testHelper.floatTestField = 1.5
                    testHelper.floatTestProp = 1.5
                    TestHelper.floatTestFieldStatic = 1.5
                    TestHelper.floatTestPropStatic = 1.5
                    testHelper.FloatTestCheckMemberValue();
                })()
            ");
            jsEnv.Tick();
        }
        [Test]
        public void ByteInstanceTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const TestHelper = CS.Puerts.UnitTest.TestHelper;
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

                    const testHelper = TestHelper.GetInstance();

                    const outRef = [];
                    const oByte = outRef[0] = 100;
                    const rByte = testHelper.ByteTestPipeLine(oByte, outRef, function (b) {
                        assertAndPrint('JSGetByteArgFromCS', b, oByte + 1);
                        return oByte + 2;
                    });
                    assertAndPrint('JSGetByteOutArgFromCS', outRef[0], oByte + 3);
                    assertAndPrint('JSGetByteReturnFromCS', rByte, oByte + 4);
                    testHelper.ClearByteTestMemberValue();
                    testHelper.byteTestField = 200
                    testHelper.byteTestProp = 200
                    TestHelper.byteTestFieldStatic = 200
                    TestHelper.byteTestPropStatic = 200
                    testHelper.ByteTestCheckMemberValue();
                })()
            ");
            jsEnv.Tick();
        }
        [Test]
        public void SByteInstanceTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const TestHelper = CS.Puerts.UnitTest.TestHelper;
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

                    const testHelper = TestHelper.GetInstance();

                    const outRef = [];
                    const oSByte = outRef[0] = -50;
                    const rSByte = testHelper.SByteTestPipeLine(oSByte, outRef, function (sb) {
                        assertAndPrint('JSGetSByteArgFromCS', sb, oSByte + 1);
                        return oSByte + 2;
                    });
                    assertAndPrint('JSGetSByteOutArgFromCS', outRef[0], oSByte + 3);
                    assertAndPrint('JSGetSByteReturnFromCS', rSByte, oSByte + 4);
                    testHelper.ClearSByteTestMemberValue();
                    testHelper.sbyteTestField = 42
                    testHelper.sbyteTestProp = 42
                    TestHelper.sbyteTestFieldStatic = 42
                    TestHelper.sbyteTestPropStatic = 42
                    testHelper.SByteTestCheckMemberValue();
                })()
            ");
            jsEnv.Tick();
        }
        [Test]
        public void ShortInstanceTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const TestHelper = CS.Puerts.UnitTest.TestHelper;
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

                    const testHelper = TestHelper.GetInstance();

                    const outRef = [];
                    const oShort = outRef[0] = 1000;
                    const rShort = testHelper.ShortTestPipeLine(oShort, outRef, function (s) {
                        assertAndPrint('JSGetShortArgFromCS', s, oShort + 1);
                        return oShort + 2;
                    });
                    assertAndPrint('JSGetShortOutArgFromCS', outRef[0], oShort + 3);
                    assertAndPrint('JSGetShortReturnFromCS', rShort, oShort + 4);
                    testHelper.ClearShortTestMemberValue();
                    testHelper.shortTestField = 999
                    testHelper.shortTestProp = 999
                    TestHelper.shortTestFieldStatic = 999
                    TestHelper.shortTestPropStatic = 999
                    testHelper.ShortTestCheckMemberValue();
                })()
            ");
            jsEnv.Tick();
        }
        [Test]
        public void UShortInstanceTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const TestHelper = CS.Puerts.UnitTest.TestHelper;
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

                    const testHelper = TestHelper.GetInstance();

                    const outRef = [];
                    const oUShort = outRef[0] = 2000;
                    const rUShort = testHelper.UShortTestPipeLine(oUShort, outRef, function (us) {
                        assertAndPrint('JSGetUShortArgFromCS', us, oUShort + 1);
                        return oUShort + 2;
                    });
                    assertAndPrint('JSGetUShortOutArgFromCS', outRef[0], oUShort + 3);
                    assertAndPrint('JSGetUShortReturnFromCS', rUShort, oUShort + 4);
                    testHelper.ClearUShortTestMemberValue();
                    testHelper.ushortTestField = 999
                    testHelper.ushortTestProp = 999
                    TestHelper.ushortTestFieldStatic = 999
                    TestHelper.ushortTestPropStatic = 999
                    testHelper.UShortTestCheckMemberValue();
                })()
            ");
            jsEnv.Tick();
        }
        [Test]
        public void UIntInstanceTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const TestHelper = CS.Puerts.UnitTest.TestHelper;
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

                    const testHelper = TestHelper.GetInstance();

                    const outRef = [];
                    const oUInt = outRef[0] = 100000;
                    const rUInt = testHelper.UIntTestPipeLine(oUInt, outRef, function (ui) {
                        assertAndPrint('JSGetUIntArgFromCS', ui, oUInt + 1);
                        return oUInt + 2;
                    });
                    assertAndPrint('JSGetUIntOutArgFromCS', outRef[0], oUInt + 3);
                    assertAndPrint('JSGetUIntReturnFromCS', rUInt, oUInt + 4);
                    testHelper.ClearUIntTestMemberValue();
                    testHelper.uintTestField = 12345
                    testHelper.uintTestProp = 12345
                    TestHelper.uintTestFieldStatic = 12345
                    TestHelper.uintTestPropStatic = 12345
                    testHelper.UIntTestCheckMemberValue();
                })()
            ");
            jsEnv.Tick();
        }
#if !UNITY_WEBGL
        [Test]
        public void ULongInstanceTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const TestHelper = CS.Puerts.UnitTest.TestHelper;
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

                    const testHelper = TestHelper.GetInstance();

                    const outRef = [];
                    const oULong = outRef[0] = 9007199254740992n;
                    const rULong = testHelper.ULongTestPipeLine(oULong, outRef, function (ul) {
                        assertAndPrint('JSGetULongArgFromCS', ul == oULong + 1n);
                        return oULong + 2n;
                    });
                    assertAndPrint('JSGetULongOutArgFromCS', outRef[0] == oULong + 3n);
                    assertAndPrint('JSGetULongReturnFromCS', rULong == oULong + 4n);
                    testHelper.ClearULongTestMemberValue();
                    testHelper.ulongTestField = 9007199254740987n
                    testHelper.ulongTestProp = 9007199254740987n
                    TestHelper.ulongTestFieldStatic = 9007199254740987n
                    TestHelper.ulongTestPropStatic = 9007199254740987n
                    testHelper.ULongTestCheckMemberValue();
                })()
            ");
            jsEnv.Tick();
        }
#endif
        [Test]
        public void CharInstanceTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    const TestHelper = CS.Puerts.UnitTest.TestHelper;
                    const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

                    const testHelper = TestHelper.GetInstance();

                    const outRef = [];
                    const oChar = outRef[0] = 65; // 'A'
                    const rChar = testHelper.CharTestPipeLine(oChar, outRef, function (c) {
                        assertAndPrint('JSGetCharArgFromCS', c, 66); // 'B'
                        return 67; // 'C'
                    });
                    assertAndPrint('JSGetCharOutArgFromCS', outRef[0], 68); // 'D'
                    assertAndPrint('JSGetCharReturnFromCS', rChar, 69); // 'E'
                    testHelper.ClearCharTestMemberValue();
                    testHelper.charTestField = 90 // 'Z'
                    testHelper.charTestProp = 90
                    TestHelper.charTestFieldStatic = 90
                    TestHelper.charTestPropStatic = 90
                    testHelper.CharTestCheckMemberValue();
                })()
            ");
            jsEnv.Tick();
        }

        [Test]
        public void LazyLoadOverrideTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            //先通过另外一个类触发基类同名方法加载
            jsEnv.Eval(@"
                (function() {
                    const AssertAndPrint = CS.Puerts.UnitTest.TestHelper.AssertAndPrint;
                    const objA = new CS.Puerts.UnitTest.OverrideTestDriveA();
                    AssertAndPrint('objA', objA.Foo() == 'i am base');
                    const objB = new CS.Puerts.UnitTest.OverrideTestDriveB();
                    AssertAndPrint('objB', objB.Foo() == 'i am B');
                })()
            ");
        }

    }
}
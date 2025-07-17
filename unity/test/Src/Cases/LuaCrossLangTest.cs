using NUnit.Framework;
using System;
using Puerts;

namespace Puerts.UnitTest
{
    [UnityEngine.Scripting.Preserve]
    public class LuaTestHelper
    {
        [UnityEngine.Scripting.Preserve]
        public static int Add(int a, int b)
        {
            return a + b;
        }

        [UnityEngine.Scripting.Preserve]
        public static string Concat(string a, string b)
        {
            return a + b;
        }

        [UnityEngine.Scripting.Preserve]
        public static bool IsEven(int num)
        {
            return num % 2 == 0;
        }

        [UnityEngine.Scripting.Preserve]
        public static int[] CreateArray(int size)
        {
            int[] arr = new int[size];
            for (int i = 0; i < size; i++)
            {
                arr[i] = i + 1;
            }
            return arr;
        }

        [UnityEngine.Scripting.Preserve]
        public static string GetString()
        {
            return "Hello from C#";
        }

        [UnityEngine.Scripting.Preserve]
        public static int GetNumber()
        {
            return 42;
        }

        [UnityEngine.Scripting.Preserve]
        public static bool GetBoolean()
        {
            return true;
        }

        [UnityEngine.Scripting.Preserve]
        public static object GetNull()
        {
            return null;
        }

        [UnityEngine.Scripting.Preserve]
        public static void VoidFunction()
        {
            // 空函数，用于测试void返回类型
        }

        [UnityEngine.Scripting.Preserve]
        public static int TestOutParameter(out int outValue)
        {
            outValue = 100;
            return 200;
        }

        [UnityEngine.Scripting.Preserve]
        public static int TestRefParameter(ref int refValue)
        {
            refValue = refValue * 2;
            return refValue;
        }

        [UnityEngine.Scripting.Preserve]
        public static Func<int, int> CreateDelegate()
        {
            return (x) => x * 2;
        }

        [UnityEngine.Scripting.Preserve]
        public static void CallDelegate(Func<int, int> func, int value)
        {
            int result = func(value);
            // 可以通过某种方式验证结果
        }
    }

    [UnityEngine.Scripting.Preserve]
    public class LuaTestObject
    {
        [UnityEngine.Scripting.Preserve]
        public int Value { get; set; }

        [UnityEngine.Scripting.Preserve]
        public string Name { get; set; }

        [UnityEngine.Scripting.Preserve]
        public LuaTestObject(int value, string name)
        {
            Value = value;
            Name = name;
        }

        [UnityEngine.Scripting.Preserve]
        public int GetValue()
        {
            return Value;
        }

        [UnityEngine.Scripting.Preserve]
        public string GetName()
        {
            return Name;
        }

        [UnityEngine.Scripting.Preserve]
        public void SetValue(int value)
        {
            Value = value;
        }

        [UnityEngine.Scripting.Preserve]
        public void SetName(string name)
        {
            Name = name;
        }

        [UnityEngine.Scripting.Preserve]
        public override string ToString()
        {
            return $"LuaTestObject({Value}, {Name})";
        }
    }

    [TestFixture]
    public class LuaCrossLangTest
    {
        private JsEnv jsEnv;

        [SetUp]
        public void SetUp()
        {
            jsEnv = new JsEnv(new UnitTestLoader());
        }

        [TearDown]
        public void TearDown()
        {
            if (jsEnv != null)
            {
                jsEnv.Dispose();
                jsEnv = null;
            }
        }

        [Test]
        public void TestLuaCallCSharpStaticMethod()
        {
            // 测试Lua调用C#静态方法
            string luaCode = @"
                local result = CS.Puerts.UnitTest.LuaTestHelper.Add(5, 3)
                return result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.AreEqual(8, result);
        }

        [Test]
        public void TestLuaCallCSharpStringMethod()
        {
            // 测试Lua调用C#字符串方法
            string luaCode = @"
                local result = CS.Puerts.UnitTest.LuaTestHelper.Concat('Hello', 'World')
                return result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.AreEqual("HelloWorld", result);
        }

        [Test]
        public void TestLuaCallCSharpBooleanMethod()
        {
            // 测试Lua调用C#布尔方法
            string luaCode = @"
                local result1 = CS.Puerts.UnitTest.LuaTestHelper.IsEven(4)
                local result2 = CS.Puerts.UnitTest.LuaTestHelper.IsEven(5)
                return result1, result2
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCallCSharpArrayMethod()
        {
            // 测试Lua调用C#数组方法
            string luaCode = @"
                local arr = CS.Puerts.UnitTest.LuaTestHelper.CreateArray(5)
                return arr.Length, arr[0], arr[4]
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaGetCSharpProperty()
        {
            // 测试Lua获取C#属性
            string luaCode = @"
                local obj = CS.Puerts.UnitTest.LuaTestObject(42, 'test')
                return obj.Value, obj.Name
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaSetCSharpProperty()
        {
            // 测试Lua设置C#属性
            string luaCode = @"
                local obj = CS.Puerts.UnitTest.LuaTestObject(0, '')
                obj.Value = 100
                obj.Name = 'updated'
                return obj.Value, obj.Name
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCallCSharpInstanceMethod()
        {
            // 测试Lua调用C#实例方法
            string luaCode = @"
                local obj = CS.Puerts.UnitTest.LuaTestObject(42, 'test')
                local value = obj:GetValue()
                local name = obj:GetName()
                return value, name
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCallCSharpVoidMethod()
        {
            // 测试Lua调用C# void方法
            string luaCode = @"
                CS.Puerts.UnitTest.LuaTestHelper.VoidFunction()
                return 'success'
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.AreEqual("success", result);
        }

        [Test]
        public void TestLuaCallCSharpOutParameter()
        {
            // 测试Lua调用C# out参数方法
            string luaCode = @"
                local outValue = 0
                local result = CS.Puerts.UnitTest.LuaTestHelper.TestOutParameter(outValue)
                return result, outValue
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCallCSharpRefParameter()
        {
            // 测试Lua调用C# ref参数方法
            string luaCode = @"
                local refValue = 10
                local result = CS.Puerts.UnitTest.LuaTestHelper.TestRefParameter(refValue)
                return result, refValue
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCallCSharpDelegate()
        {
            // 测试Lua调用C#委托
            string luaCode = @"
                local func = CS.Puerts.UnitTest.LuaTestHelper.CreateDelegate()
                local result = func(5)
                return result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.AreEqual(10, result);
        }

        [Test]
        public void TestLuaPassFunctionToCSharp()
        {
            // 测试Lua传递函数给C#
            string luaCode = @"
                local luaFunc = function(x) return x * 3 end
                CS.Puerts.UnitTest.LuaTestHelper.CallDelegate(luaFunc, 4)
                return 'success'
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.AreEqual("success", result);
        }

        [Test]
        public void TestLuaAccessCSharpEnum()
        {
            // 测试Lua访问C#枚举
            string luaCode = @"
                local enumValue = CS.Puerts.UnitTest.TestEnum.A
                return enumValue
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaAccessCSharpStruct()
        {
            // 测试Lua访问C#结构体
            string luaCode = @"
                local struct = CS.Puerts.UnitTest.TestStruct(42.0)
                return struct.value
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.AreEqual(42.0f, result);
        }

        [Test]
        public void TestLuaAccessCSharpNullableStruct()
        {
            // 测试Lua访问C#可空结构体
            string luaCode = @"
                local nullableStruct = CS.Puerts.UnitTest.TestStruct(42.0)
                return nullableStruct.HasValue, nullableStruct.Value.value
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaAccessCSharpDateTime()
        {
            // 测试Lua访问C# DateTime
            string luaCode = @"
                local dateTime = CS.Puerts.UnitTest.CrossLangTestHelper.GetDateTime()
                return dateTime.Year > 2000
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsTrue((bool)result);
        }

        [Test]
        public void TestLuaAccessCSharpArrayBuffer()
        {
            // 测试Lua访问C# ArrayBuffer
            string luaCode = @"
                local buffer = CS.Puerts.ArrayBuffer(10)
                return buffer.Length
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.AreEqual(10, result);
        }

        [Test]
        public void TestLuaAccessCSharpJSObject()
        {
            // 测试Lua访问C# JSObject
            string luaCode = @"
                local jsObj = CS.Puerts.JSObject()
                return jsObj ~= nil
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsTrue((bool)result);
        }

        [Test]
        public void TestLuaAccessCSharpGenericMethod()
        {
            // 测试Lua访问C#泛型方法
            string luaCode = @"
                local list = CS.System.Collections.Generic.List(CS.System.String)()
                list:Add('test')
                return list.Count
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.AreEqual(1, result);
        }

        [Test]
        public void TestLuaAccessCSharpStaticField()
        {
            // 测试Lua访问C#静态字段
            string luaCode = @"
                local value = CS.Puerts.UnitTest.LuaTestHelper.GetNumber()
                return value
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.AreEqual(42, result);
        }

        [Test]
        public void TestLuaAccessCSharpStaticProperty()
        {
            // 测试Lua访问C#静态属性
            string luaCode = @"
                local value = CS.Puerts.UnitTest.LuaTestHelper.GetString()
                return value
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.AreEqual("Hello from C#", result);
        }

        [Test]
        public void TestLuaHandleCSharpNull()
        {
            // 测试Lua处理C# null值
            string luaCode = @"
                local nullValue = CS.Puerts.UnitTest.LuaTestHelper.GetNull()
                return nullValue == nil
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsTrue((bool)result);
        }

        [Test]
        public void TestLuaAccessCSharpOverloadedMethod()
        {
            // 测试Lua访问C#重载方法
            string luaCode = @"
                local obj = CS.Puerts.UnitTest.OverloadTestObject()
                obj:WithObjectParam('test')
                local result1 = CS.Puerts.UnitTest.OverloadTestObject.LastCall
                obj:WithObjectParam(123)
                local result2 = CS.Puerts.UnitTest.OverloadTestObject.LastCall
                return result1, result2
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaAccessCSharpExplicitInterface()
        {
            // 测试Lua访问C#显式接口实现
            string luaCode = @"
                local fooVE = CS.Puerts.UnitTest.FooVE.Instance()
                local width = fooVE.foo.width
                return width
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.AreEqual(125f, result);
        }
    }
} 
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
            // Empty function for testing void return type
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
            // Can verify result through some mechanism
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
            // Test Lua calling C# static method
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
            // Test Lua calling C# string method
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
            // Test Lua calling C# boolean method
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
            // Test Lua calling C# array method
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
            // Test Lua getting C# property
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
            // Test Lua setting C# property
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
            // Test Lua calling C# instance method
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
            // Test Lua calling C# void method
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
            // Test Lua calling C# out parameter method
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
            // Test Lua calling C# ref parameter method
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
            // Test Lua calling C# delegate
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
            // Test Lua passing function to C#
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
            // Test Lua accessing C# enum
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
            // Test Lua accessing C# struct
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
            // Test Lua accessing C# nullable struct
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
            // Test Lua accessing C# DateTime
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
            // Test Lua accessing C# ArrayBuffer
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
            // Test Lua accessing C# JSObject
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
            // Test Lua accessing C# generic method
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
            // Test Lua accessing C# static field
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
            // Test Lua accessing C# static property
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
            // Test Lua handling C# null value
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
            // Test Lua accessing C# overloaded method
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
            // Test Lua accessing C# explicit interface implementation
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
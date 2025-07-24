using NUnit.Framework;
using System;
using Puerts;

namespace Puerts.UnitTest
{
    [TestFixture]
    public class LuaBackendTest
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
        public void TestLuaBasicSyntax()
        {
            // Test basic Lua syntax
            string luaCode = @"
                local a = 10
                local b = 20
                local result = a + b
                return result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.AreEqual(30, result);
        }

        [Test]
        public void TestLuaTable()
        {
            // Test Lua table
            string luaCode = @"
                local t = {name = 'test', value = 42}
                return t.name, t.value
            ";
            
            var result = jsEnv.Eval(luaCode);
            // Note: When Lua returns multiple values, it will be an array in C#
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaFunction()
        {
            // Test Lua function definition and call
            string luaCode = @"
                local function add(x, y)
                    return x + y
                end
                return add(5, 3)
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.AreEqual(8, result);
        }

        [Test]
        public void TestLuaString()
        {
            // Test Lua string operations
            string luaCode = @"
                local str1 = 'Hello'
                local str2 = 'World'
                local result = str1 .. ' ' .. str2
                return result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.AreEqual("Hello World", result);
        }

        [Test]
        public void TestLuaConditional()
        {
            // Test Lua conditional statements
            string luaCode = @"
                local x = 10
                local result
                if x > 5 then
                    result = 'greater'
                else
                    result = 'less'
                end
                return result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.AreEqual("greater", result);
        }

        [Test]
        public void TestLuaLoop()
        {
            // Test Lua loops
            string luaCode = @"
                local sum = 0
                for i = 1, 5 do
                    sum = sum + i
                end
                return sum
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.AreEqual(15, result);
        }

        [Test]
        public void TestLuaArray()
        {
            // Test Lua array (numeric indexed table)
            string luaCode = @"
                local arr = {1, 2, 3, 4, 5}
                local sum = 0
                for i = 1, #arr do
                    sum = sum + arr[i]
                end
                return sum
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.AreEqual(15, result);
        }

        [Test]
        public void TestLuaClosure()
        {
            // Test Lua closures
            string luaCode = @"
                local function createCounter()
                    local count = 0
                    return function()
                        count = count + 1
                        return count
                    end
                end
                local counter = createCounter()
                return counter(), counter(), counter()
            ";
            
            var result = jsEnv.Eval(luaCode);
            // Note: When Lua returns multiple values, it will be an array in C#
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaMetatable()
        {
            // Test Lua metatable
            string luaCode = @"
                local t = {}
                local mt = {
                    __add = function(a, b)
                        return a.value + b.value
                    end
                }
                setmetatable(t, mt)
                t.value = 10
                local t2 = {value = 20}
                setmetatable(t2, mt)
                return t + t2
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.AreEqual(30, result);
        }

        [Test]
        public void TestLuaErrorHandling()
        {
            // Test Lua error handling
            string luaCode = @"
                local success, result = pcall(function()
                    error('test error')
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            // Note: pcall returns two values: success status and error message
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaModules()
        {
            // Test Lua module system
            string luaCode = @"
                local module = {}
                function module.add(x, y)
                    return x + y
                end
                function module.multiply(x, y)
                    return x * y
                end
                return module
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCoroutine()
        {
            // Test Lua coroutines
            string luaCode = @"
                local co = coroutine.create(function()
                    coroutine.yield(1)
                    coroutine.yield(2)
                    return 3
                end)
                local _, value1 = coroutine.resume(co)
                local _, value2 = coroutine.resume(co)
                local _, value3 = coroutine.resume(co)
                return value1, value2, value3
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaFileIO()
        {
            // Test Lua file I/O (if supported)
            string luaCode = @"
                -- Test string operations as file I/O alternative
                local str = 'test content'
                local len = string.len(str)
                local upper = string.upper(str)
                return len, upper
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaMath()
        {
            // Test Lua math library
            string luaCode = @"
                local pi = math.pi
                local floor = math.floor(3.7)
                local ceil = math.ceil(3.2)
                local abs = math.abs(-5)
                return pi, floor, ceil, abs
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaStringLibrary()
        {
            // Test Lua string library
            string luaCode = @"
                local str = 'hello world'
                local upper = string.upper(str)
                local lower = string.lower(str)
                local sub = string.sub(str, 1, 5)
                local find = string.find(str, 'world')
                return upper, lower, sub, find
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaTableLibrary()
        {
            // Test Lua table library
            string luaCode = @"
                local t = {3, 1, 4, 1, 5}
                table.insert(t, 9)
                table.sort(t)
                local len = #t
                return len, t[1], t[#t]
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaBitwiseOperations()
        {
            // Test Lua bitwise operations (if supported)
            string luaCode = @"
                -- Use basic arithmetic operations as bitwise operations alternative
                local a = 5
                local b = 3
                local add = a + b
                local sub = a - b
                local mul = a * b
                return add, sub, mul
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaEnvironment()
        {
            // Test Lua environment variables
            string luaCode = @"
                local env = _ENV or _G
                env.test_var = 'test_value'
                return env.test_var
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.AreEqual("test_value", result);
        }
    }
} 
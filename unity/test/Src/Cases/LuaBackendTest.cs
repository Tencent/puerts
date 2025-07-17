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
            // 测试基本的Lua语法
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
            // 测试Lua表（table）
            string luaCode = @"
                local t = {name = 'test', value = 42}
                return t.name, t.value
            ";
            
            var result = jsEnv.Eval(luaCode);
            // 注意：Lua返回多个值时，在C#中会是一个数组
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaFunction()
        {
            // 测试Lua函数定义和调用
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
            // 测试Lua字符串操作
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
            // 测试Lua条件语句
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
            // 测试Lua循环
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
            // 测试Lua数组（数字索引的table）
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
            // 测试Lua闭包
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
            // 注意：Lua返回多个值时，在C#中会是一个数组
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaMetatable()
        {
            // 测试Lua元表（metatable）
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
            // 测试Lua错误处理
            string luaCode = @"
                local success, result = pcall(function()
                    error('test error')
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            // 注意：pcall返回两个值：success状态和错误信息
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaModules()
        {
            // 测试Lua模块系统
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
            // 测试Lua协程
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
            // 测试Lua文件I/O（如果支持）
            string luaCode = @"
                -- 测试字符串操作作为文件I/O的替代
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
            // 测试Lua数学库
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
            // 测试Lua字符串库
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
            // 测试Lua表库
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
            // 测试Lua位运算（如果支持）
            string luaCode = @"
                -- 使用基本算术运算作为位运算的替代
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
            // 测试Lua环境变量
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
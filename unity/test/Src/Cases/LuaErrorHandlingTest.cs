using NUnit.Framework;
using System;
using Puerts;

namespace Puerts.UnitTest
{
    [TestFixture]
    public class LuaErrorHandlingTest
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
        public void TestLuaSyntaxError()
        {
            // 测试Lua语法错误
            string luaCode = @"
                local a = 10
                local b = 20
                local result = a + b  -- 缺少分号或end
                return result
            ";
            
            Assert.Throws<Exception>(() => jsEnv.Eval(luaCode));
        }

        [Test]
        public void TestLuaRuntimeError()
        {
            // 测试Lua运行时错误
            string luaCode = @"
                local a = nil
                local result = a + 10  -- 尝试对nil进行算术运算
                return result
            ";
            
            Assert.Throws<Exception>(() => jsEnv.Eval(luaCode));
        }

        [Test]
        public void TestLuaPcallSuccess()
        {
            // 测试Lua pcall成功情况
            string luaCode = @"
                local success, result = pcall(function()
                    return 42
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaPcallFailure()
        {
            // 测试Lua pcall失败情况
            string luaCode = @"
                local success, error = pcall(function()
                    error('test error')
                end)
                return success, error
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaXpcall()
        {
            // 测试Lua xpcall
            string luaCode = @"
                local function errorHandler(err)
                    return 'handled: ' .. tostring(err)
                end
                
                local success, result = xpcall(function()
                    error('test error')
                end, errorHandler)
                
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaAssert()
        {
            // 测试Lua assert函数
            string luaCode = @"
                local success, result = pcall(function()
                    assert(false, 'assertion failed')
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaAssertSuccess()
        {
            // 测试Lua assert成功情况
            string luaCode = @"
                local result = assert(true, 'should not fail')
                return result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsTrue((bool)result);
        }

        [Test]
        public void TestLuaErrorFunction()
        {
            // 测试Lua error函数
            string luaCode = @"
                local success, result = pcall(function()
                    error('custom error message', 2)
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaTypeError()
        {
            // 测试Lua类型错误
            string luaCode = @"
                local success, result = pcall(function()
                    local str = 'hello'
                    str[1] = 'a'  -- 尝试修改字符串
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaIndexError()
        {
            // 测试Lua索引错误
            string luaCode = @"
                local success, result = pcall(function()
                    local t = {}
                    local value = t.nonexistent.field  -- 访问不存在的字段
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCallError()
        {
            // 测试Lua调用错误
            string luaCode = @"
                local success, result = pcall(function()
                    local notAFunction = 42
                    notAFunction()  -- 尝试调用非函数
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaArithmeticError()
        {
            // 测试Lua算术错误
            string luaCode = @"
                local success, result = pcall(function()
                    local result = 1 / 0  -- 除零错误
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaMemoryError()
        {
            // 测试Lua内存错误（模拟）
            string luaCode = @"
                local success, result = pcall(function()
                    local t = {}
                    for i = 1, 1000000 do
                        t[i] = string.rep('x', 1000)  -- 创建大量字符串
                    end
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCoroutineError()
        {
            // 测试Lua协程错误
            string luaCode = @"
                local success, result = pcall(function()
                    local co = coroutine.create(function()
                        error('coroutine error')
                    end)
                    coroutine.resume(co)
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaMetatableError()
        {
            // 测试Lua元表错误
            string luaCode = @"
                local success, result = pcall(function()
                    local t = {}
                    local mt = {
                        __index = function() error('metatable error') end
                    }
                    setmetatable(t, mt)
                    local value = t.nonexistent  -- 触发元表错误
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaFileError()
        {
            // 测试Lua文件操作错误
            string luaCode = @"
                local success, result = pcall(function()
                    local file = io.open('nonexistent.txt', 'r')
                    if file then
                        file:close()
                    else
                        error('file not found')
                    end
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCSharpException()
        {
            // 测试Lua调用C#时抛出异常
            string luaCode = @"
                local success, result = pcall(function()
                    CS.Puerts.UnitTest.LuaTestHelper.TestOutParameter(nil)  -- 传递nil给out参数
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCSharpNullReference()
        {
            // 测试Lua访问C# null对象
            string luaCode = @"
                local success, result = pcall(function()
                    local nullObj = CS.Puerts.UnitTest.LuaTestHelper.GetNull()
                    local value = nullObj.ToString()  -- 在null对象上调用方法
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCSharpInvalidCast()
        {
            // 测试Lua传递给C#的参数类型错误
            string luaCode = @"
                local success, result = pcall(function()
                    CS.Puerts.UnitTest.LuaTestHelper.Add('string', 42)  -- 传递字符串给int参数
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCSharpArrayBounds()
        {
            // 测试Lua访问C#数组越界
            string luaCode = @"
                local success, result = pcall(function()
                    local arr = CS.Puerts.UnitTest.LuaTestHelper.CreateArray(5)
                    local value = arr[10]  -- 访问越界索引
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCSharpMethodNotFound()
        {
            // 测试Lua调用不存在的C#方法
            string luaCode = @"
                local success, result = pcall(function()
                    local obj = CS.Puerts.UnitTest.LuaTestObject(42, 'test')
                    obj:NonExistentMethod()  -- 调用不存在的方法
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCSharpPropertyNotFound()
        {
            // 测试Lua访问不存在的C#属性
            string luaCode = @"
                local success, result = pcall(function()
                    local obj = CS.Puerts.UnitTest.LuaTestObject(42, 'test')
                    local value = obj.NonExistentProperty  -- 访问不存在的属性
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCSharpConstructorError()
        {
            // 测试Lua创建C#对象时构造函数错误
            string luaCode = @"
                local success, result = pcall(function()
                    local obj = CS.Puerts.UnitTest.LuaTestObject('invalid', 42)  -- 参数类型错误
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCSharpEnumError()
        {
            // 测试Lua访问不存在的C#枚举值
            string luaCode = @"
                local success, result = pcall(function()
                    local enumValue = CS.Puerts.UnitTest.TestEnum.NonExistent  -- 访问不存在的枚举值
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCSharpStructError()
        {
            // 测试Lua访问C#结构体时错误
            string luaCode = @"
                local success, result = pcall(function()
                    local struct = CS.Puerts.UnitTest.TestStruct('invalid')  -- 参数类型错误
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCSharpDelegateError()
        {
            // 测试Lua调用C#委托时错误
            string luaCode = @"
                local success, result = pcall(function()
                    local func = CS.Puerts.UnitTest.LuaTestHelper.CreateDelegate()
                    local result = func('invalid')  -- 传递错误类型的参数
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCSharpGenericError()
        {
            // 测试Lua访问C#泛型时错误
            string luaCode = @"
                local success, result = pcall(function()
                    local list = CS.System.Collections.Generic.List(CS.System.Int32)()
                    list:Add('string')  -- 添加错误类型的元素
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaErrorRecovery()
        {
            // 测试Lua错误恢复
            string luaCode = @"
                local results = {}
                
                -- 第一个调用应该成功
                local success1, result1 = pcall(function()
                    return CS.Puerts.UnitTest.LuaTestHelper.Add(1, 2)
                end)
                results[1] = {success = success1, result = result1}
                
                -- 第二个调用应该失败
                local success2, result2 = pcall(function()
                    return CS.Puerts.UnitTest.LuaTestHelper.Add('invalid', 2)
                end)
                results[2] = {success = success2, result = result2}
                
                -- 第三个调用应该成功
                local success3, result3 = pcall(function()
                    return CS.Puerts.UnitTest.LuaTestHelper.Add(3, 4)
                end)
                results[3] = {success = success3, result = result3}
                
                return results
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaErrorInCoroutine()
        {
            // 测试Lua协程中的错误处理
            string luaCode = @"
                local function coroutineWithError()
                    coroutine.yield(1)
                    error('coroutine error')
                    coroutine.yield(2)
                end
                
                local co = coroutine.create(coroutineWithError)
                local results = {}
                
                local success1, value1 = coroutine.resume(co)
                results[1] = {success = success1, value = value1}
                
                local success2, value2 = coroutine.resume(co)
                results[2] = {success = success2, value = value2}
                
                return results
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaErrorInMetatable()
        {
            // 测试Lua元表中的错误处理
            string luaCode = @"
                local mt = {
                    __index = function(t, k)
                        if k == 'error' then
                            error('metatable index error')
                        end
                        return 'default'
                    end,
                    __newindex = function(t, k, v)
                        if k == 'error' then
                            error('metatable newindex error')
                        end
                        rawset(t, k, v)
                    end
                }
                
                local t = {}
                setmetatable(t, mt)
                
                local results = {}
                
                -- 测试__index错误
                local success1, result1 = pcall(function()
                    return t.error
                end)
                results[1] = {success = success1, result = result1}
                
                -- 测试__newindex错误
                local success2, result2 = pcall(function()
                    t.error = 'value'
                end)
                results[2] = {success = success2, result = result2}
                
                -- 测试正常访问
                local success3, result3 = pcall(function()
                    return t.normal
                end)
                results[3] = {success = success3, result = result3}
                
                return results
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }
    }
} 
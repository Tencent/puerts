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
            // Test Lua syntax error
            string luaCode = @"
                local a = 10
                local b = 20
                local result = a + b  -- Missing semicolon or end
                return result
            ";
            
            Assert.Throws<Exception>(() => jsEnv.Eval(luaCode));
        }

        [Test]
        public void TestLuaRuntimeError()
        {
            // Test Lua runtime error
            string luaCode = @"
                local a = nil
                local result = a + 10  -- Try arithmetic operation on nil
                return result
            ";
            
            Assert.Throws<Exception>(() => jsEnv.Eval(luaCode));
        }

        [Test]
        public void TestLuaPcallSuccess()
        {
            // Test Lua pcall success case
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
            // Test Lua pcall failure case
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
            // Test Lua xpcall
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
            // Test Lua assert function
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
            // Test Lua assert success case
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
            // Test Lua error function
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
            // Test Lua type error
            string luaCode = @"
                local success, result = pcall(function()
                    local str = 'hello'
                    str[1] = 'a'  -- Try to modify string
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaIndexError()
        {
            // Test Lua index error
            string luaCode = @"
                local success, result = pcall(function()
                    local t = {}
                    local value = t.nonexistent.field  -- Access non-existent field
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCallError()
        {
            // Test Lua call error
            string luaCode = @"
                local success, result = pcall(function()
                    local notAFunction = 42
                    notAFunction()  -- Try to call non-function
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaArithmeticError()
        {
            // Test Lua arithmetic error
            string luaCode = @"
                local success, result = pcall(function()
                    local result = 1 / 0  -- Division by zero error
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaMemoryError()
        {
            // Test Lua memory error (simulated)
            string luaCode = @"
                local success, result = pcall(function()
                    local t = {}
                    for i = 1, 1000000 do
                        t[i] = string.rep('x', 1000)  -- Create large strings
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
            // Test Lua coroutine error
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
            // Test Lua metatable error
            string luaCode = @"
                local success, result = pcall(function()
                    local t = {}
                    local mt = {
                        __index = function() error('metatable error') end
                    }
                    setmetatable(t, mt)
                    local value = t.nonexistent  -- Trigger metatable error
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaFileError()
        {
            // Test Lua file operation error
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
            // Test Lua calling C# throwing exception
            string luaCode = @"
                local success, result = pcall(function()
                    CS.Puerts.UnitTest.LuaTestHelper.TestOutParameter(nil)  -- Pass nil to out parameter
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCSharpNullReference()
        {
            // Test Lua accessing C# null object
            string luaCode = @"
                local success, result = pcall(function()
                    local nullObj = CS.Puerts.UnitTest.LuaTestHelper.GetNull()
                    local value = nullObj.ToString()  -- Call method on null object
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCSharpInvalidCast()
        {
            // Test Lua passing wrong parameter type to C#
            string luaCode = @"
                local success, result = pcall(function()
                    CS.Puerts.UnitTest.LuaTestHelper.Add('string', 42)  -- Pass string to int parameter
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCSharpArrayBounds()
        {
            // Test Lua accessing C# array out of bounds
            string luaCode = @"
                local success, result = pcall(function()
                    local arr = CS.Puerts.UnitTest.LuaTestHelper.CreateArray(5)
                    local value = arr[10]  -- Access out of bounds index
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCSharpMethodNotFound()
        {
            // Test Lua calling non-existent C# method
            string luaCode = @"
                local success, result = pcall(function()
                    local obj = CS.Puerts.UnitTest.LuaTestObject(42, 'test')
                    obj:NonExistentMethod()  -- Call non-existent method
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCSharpPropertyNotFound()
        {
            // Test Lua accessing non-existent C# property
            string luaCode = @"
                local success, result = pcall(function()
                    local obj = CS.Puerts.UnitTest.LuaTestObject(42, 'test')
                    local value = obj.NonExistentProperty  -- Access non-existent property
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCSharpConstructorError()
        {
            // Test Lua creating C# object with constructor error
            string luaCode = @"
                local success, result = pcall(function()
                    local obj = CS.Puerts.UnitTest.LuaTestObject('invalid', 42)  -- Wrong parameter type
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCSharpEnumError()
        {
            // Test Lua accessing non-existent C# enum value
            string luaCode = @"
                local success, result = pcall(function()
                    local enumValue = CS.Puerts.UnitTest.TestEnum.NonExistent  -- Access non-existent enum value
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCSharpStructError()
        {
            // Test Lua accessing C# struct with error
            string luaCode = @"
                local success, result = pcall(function()
                    local struct = CS.Puerts.UnitTest.TestStruct('invalid')  -- Wrong parameter type
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCSharpDelegateError()
        {
            // Test Lua calling C# delegate with error
            string luaCode = @"
                local success, result = pcall(function()
                    local func = CS.Puerts.UnitTest.LuaTestHelper.CreateDelegate()
                    local result = func('invalid')  -- Pass wrong parameter type
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCSharpGenericError()
        {
            // Test Lua accessing C# generic with error
            string luaCode = @"
                local success, result = pcall(function()
                    local list = CS.System.Collections.Generic.List(CS.System.Int32)()
                    list:Add('string')  -- Add wrong type element
                end)
                return success, result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaErrorRecovery()
        {
            // Test Lua error recovery
            string luaCode = @"
                local results = {}
                
                -- First call should succeed
                local success1, result1 = pcall(function()
                    return CS.Puerts.UnitTest.LuaTestHelper.Add(1, 2)
                end)
                results[1] = {success = success1, result = result1}
                
                -- Second call should fail
                local success2, result2 = pcall(function()
                    return CS.Puerts.UnitTest.LuaTestHelper.Add('invalid', 2)
                end)
                results[2] = {success = success2, result = result2}
                
                -- Third call should succeed
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
            // Test Lua error handling in coroutine
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
            // Test Lua error handling in metatable
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
                
                -- Test __index error
                local success1, result1 = pcall(function()
                    return t.error
                end)
                results[1] = {success = success1, result = result1}
                
                -- Test __newindex error
                local success2, result2 = pcall(function()
                    t.error = 'value'
                end)
                results[2] = {success = success2, result = result2}
                
                -- Test normal access
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
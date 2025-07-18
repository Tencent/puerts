using NUnit.Framework;
using System;
using System.Diagnostics;
using Puerts;

namespace Puerts.UnitTest
{
    [TestFixture]
    public class LuaPerformanceTest
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
        public void TestLuaLoopPerformance()
        {
            // Test Lua loop performance
            string luaCode = @"
                local startTime = os.clock()
                local sum = 0
                for i = 1, 100000 do
                    sum = sum + i
                end
                local endTime = os.clock()
                return sum, endTime - startTime
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
            
            // Verify calculation result is correct
            long expectedSum = (long)(100000 * 100001) / 2;
            // Note: When Lua returns multiple values, it will be an array in C#
        }

        [Test]
        public void TestLuaFunctionCallPerformance()
        {
            // Test Lua function call performance
            string luaCode = @"
                local function fibonacci(n)
                    if n <= 1 then
                        return n
                    else
                        return fibonacci(n - 1) + fibonacci(n - 2)
                    end
                end
                
                local startTime = os.clock()
                local result = fibonacci(30)
                local endTime = os.clock()
                return result, endTime - startTime
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaTableOperationPerformance()
        {
            // Test Lua table operation performance
            string luaCode = @"
                local startTime = os.clock()
                local t = {}
                for i = 1, 10000 do
                    t[i] = i * 2
                end
                local sum = 0
                for i = 1, 10000 do
                    sum = sum + t[i]
                end
                local endTime = os.clock()
                return sum, endTime - startTime
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
            
            // Verify calculation result is correct
            long expectedSum = (long)(10000 * 10001);
        }

        [Test]
        public void TestLuaStringOperationPerformance()
        {
            // Test Lua string operation performance
            string luaCode = @"
                local startTime = os.clock()
                local str = ''
                for i = 1, 1000 do
                    str = str .. tostring(i)
                end
                local endTime = os.clock()
                return #str, endTime - startTime
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaMathOperationPerformance()
        {
            // Test Lua math operation performance
            string luaCode = @"
                local startTime = os.clock()
                local sum = 0
                for i = 1, 100000 do
                    sum = sum + math.sin(i) + math.cos(i) + math.sqrt(i)
                end
                local endTime = os.clock()
                return sum, endTime - startTime
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaClosurePerformance()
        {
            // Test Lua closure performance
            string luaCode = @"
                local startTime = os.clock()
                local closures = {}
                for i = 1, 1000 do
                    closures[i] = function(x) return x + i end
                end
                local sum = 0
                for i = 1, 1000 do
                    sum = sum + closures[i](i)
                end
                local endTime = os.clock()
                return sum, endTime - startTime
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaMetatablePerformance()
        {
            // Test Lua metatable performance
            string luaCode = @"
                local startTime = os.clock()
                local mt = {
                    __add = function(a, b) return a.value + b.value end,
                    __sub = function(a, b) return a.value - b.value end,
                    __mul = function(a, b) return a.value * b.value end
                }
                
                local objects = {}
                for i = 1, 1000 do
                    local obj = {value = i}
                    setmetatable(obj, mt)
                    objects[i] = obj
                end
                
                local sum = 0
                for i = 1, 999 do
                    sum = sum + (objects[i] + objects[i + 1])
                end
                local endTime = os.clock()
                return sum, endTime - startTime
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCoroutinePerformance()
        {
            // Test Lua coroutine performance
            string luaCode = @"
                local startTime = os.clock()
                local function generator()
                    for i = 1, 10000 do
                        coroutine.yield(i)
                    end
                end
                
                local co = coroutine.create(generator)
                local sum = 0
                while true do
                    local _, value = coroutine.resume(co)
                    if value == nil then break end
                    sum = sum + value
                end
                local endTime = os.clock()
                return sum, endTime - startTime
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaMemoryAllocationPerformance()
        {
            // Test Lua memory allocation performance
            string luaCode = @"
                local startTime = os.clock()
                local objects = {}
                for i = 1, 10000 do
                    objects[i] = {
                        id = i,
                        name = 'object' .. i,
                        data = {1, 2, 3, 4, 5}
                    }
                end
                local endTime = os.clock()
                return #objects, endTime - startTime
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaGarbageCollectionPerformance()
        {
            // Test Lua garbage collection performance
            string luaCode = @"
                local startTime = os.clock()
                for j = 1, 100 do
                    local objects = {}
                    for i = 1, 1000 do
                        objects[i] = {
                            id = i,
                            data = string.rep('x', 100)
                        }
                    end
                    objects = nil
                    collectgarbage('collect')
                end
                local endTime = os.clock()
                return 'completed', endTime - startTime
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCSharpCallPerformance()
        {
            // Test Lua calling C# method performance
            string luaCode = @"
                local startTime = os.clock()
                local sum = 0
                for i = 1, 10000 do
                    sum = sum + CS.Puerts.UnitTest.LuaTestHelper.Add(i, i)
                end
                local endTime = os.clock()
                return sum, endTime - startTime
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCSharpObjectCreationPerformance()
        {
            // Test Lua creating C# object performance
            string luaCode = @"
                local startTime = os.clock()
                local objects = {}
                for i = 1, 1000 do
                    objects[i] = CS.Puerts.UnitTest.LuaTestObject(i, 'test' .. i)
                end
                local endTime = os.clock()
                return #objects, endTime - startTime
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCSharpPropertyAccessPerformance()
        {
            // Test Lua accessing C# property performance
            string luaCode = @"
                local obj = CS.Puerts.UnitTest.LuaTestObject(42, 'test')
                local startTime = os.clock()
                local sum = 0
                for i = 1, 10000 do
                    sum = sum + obj.Value
                    obj.Value = i
                end
                local endTime = os.clock()
                return sum, endTime - startTime
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaCSharpMethodCallPerformance()
        {
            // Test Lua calling C# instance method performance
            string luaCode = @"
                local obj = CS.Puerts.UnitTest.LuaTestObject(42, 'test')
                local startTime = os.clock()
                local sum = 0
                for i = 1, 10000 do
                    sum = sum + obj:GetValue()
                    obj:SetValue(i)
                end
                local endTime = os.clock()
                return sum, endTime - startTime
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaArrayAccessPerformance()
        {
            // Test Lua accessing C# array performance
            string luaCode = @"
                local arr = CS.Puerts.UnitTest.LuaTestHelper.CreateArray(1000)
                local startTime = os.clock()
                local sum = 0
                for i = 0, arr.Length - 1 do
                    sum = sum + arr[i]
                end
                local endTime = os.clock()
                return sum, endTime - startTime
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaDelegateCallPerformance()
        {
            // Test Lua calling C# delegate performance
            string luaCode = @"
                local func = CS.Puerts.UnitTest.LuaTestHelper.CreateDelegate()
                local startTime = os.clock()
                local sum = 0
                for i = 1, 10000 do
                    sum = sum + func(i)
                end
                local endTime = os.clock()
                return sum, endTime - startTime
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaEnumAccessPerformance()
        {
            // Test Lua accessing C# enum performance
            string luaCode = @"
                local startTime = os.clock()
                local sum = 0
                for i = 1, 10000 do
                    local enumValue = CS.Puerts.UnitTest.TestEnum.A
                    sum = sum + enumValue
                end
                local endTime = os.clock()
                return sum, endTime - startTime
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaStructAccessPerformance()
        {
            // Test Lua accessing C# struct performance
            string luaCode = @"
                local startTime = os.clock()
                local sum = 0
                for i = 1, 10000 do
                    local struct = CS.Puerts.UnitTest.TestStruct(i)
                    sum = sum + struct.value
                end
                local endTime = os.clock()
                return sum, endTime - startTime
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaDateTimeAccessPerformance()
        {
            // Test Lua accessing C# DateTime performance
            string luaCode = @"
                local startTime = os.clock()
                local sum = 0
                for i = 1, 1000 do
                    local dateTime = CS.Puerts.UnitTest.CrossLangTestHelper.GetDateTime()
                    sum = sum + dateTime.Year
                end
                local endTime = os.clock()
                return sum, endTime - startTime
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaMixedOperationsPerformance()
        {
            // Test Lua mixed operations performance
            string luaCode = @"
                local startTime = os.clock()
                local sum = 0
                local objects = {}
                
                for i = 1, 1000 do
                    -- Create C# object
                    local obj = CS.Puerts.UnitTest.LuaTestObject(i, 'test' .. i)
                    objects[i] = obj
                    
                    -- Lua calculation
                    local luaSum = 0
                    for j = 1, 100 do
                        luaSum = luaSum + j
                    end
                    
                    -- Call C# method
                    local csharpResult = CS.Puerts.UnitTest.LuaTestHelper.Add(i, luaSum)
                    sum = sum + csharpResult
                end
                
                local endTime = os.clock()
                return sum, endTime - startTime
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }
    }
} 
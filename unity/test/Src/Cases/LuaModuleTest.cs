using NUnit.Framework;
using System;
using Puerts;

namespace Puerts.UnitTest
{
    [TestFixture]
    public class LuaModuleTest
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
        public void TestLuaModuleDefinition()
        {
            // Test Lua module definition
            string luaCode = @"
                local module = {}
                
                function module.add(a, b)
                    return a + b
                end
                
                function module.multiply(a, b)
                    return a * b
                end
                
                function module.divide(a, b)
                    return a / b
                end
                
                return module
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaModuleUsage()
        {
            // Test Lua module usage
            string luaCode = @"
                local mathModule = {}
                
                function mathModule.add(a, b)
                    return a + b
                end
                
                function mathModule.multiply(a, b)
                    return a * b
                end
                
                local result1 = mathModule.add(5, 3)
                local result2 = mathModule.multiply(4, 6)
                
                return result1, result2
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaModuleWithLocalVariables()
        {
            // Test Lua module with local variables
            string luaCode = @"
                local module = {}
                local privateVar = 42
                
                function module.getPrivateVar()
                    return privateVar
                end
                
                function module.setPrivateVar(value)
                    privateVar = value
                end
                
                return module
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaModuleWithMetatable()
        {
            // Test Lua module using metatable
            string luaCode = @"
                local module = {}
                local mt = {
                    __index = function(t, k)
                        if k == 'default' then
                            return 0
                        end
                        return rawget(t, k)
                    end
                }
                
                setmetatable(module, mt)
                
                function module.getValue(key)
                    return module[key]
                end
                
                return module
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaModuleInheritance()
        {
            // Test Lua module inheritance
            string luaCode = @"
                local baseModule = {}
                
                function baseModule.baseMethod()
                    return 'base'
                end
                
                local derivedModule = {}
                setmetatable(derivedModule, {__index = baseModule})
                
                function derivedModule.derivedMethod()
                    return 'derived'
                end
                
                local result1 = derivedModule:baseMethod()
                local result2 = derivedModule:derivedMethod()
                
                return result1, result2
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaModuleSingleton()
        {
            // Test Lua singleton module
            string luaCode = @"
                local singleton = {}
                local instance = nil
                
                function singleton.getInstance()
                    if instance == nil then
                        instance = {
                            data = 0,
                            getData = function(self) return self.data end,
                            setData = function(self, value) self.data = value end
                        }
                    end
                    return instance
                end
                
                local obj1 = singleton.getInstance()
                local obj2 = singleton.getInstance()
                
                obj1:setData(42)
                local result = obj2:getData()
                
                return result, obj1 == obj2
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaModuleFactory()
        {
            // Test Lua module factory pattern
            string luaCode = @"
                local factory = {}
                
                function factory.createObject(type)
                    if type == 'type1' then
                        return {
                            type = 'type1',
                            method = function() return 'type1 method' end
                        }
                    elseif type == 'type2' then
                        return {
                            type = 'type2',
                            method = function() return 'type2 method' end
                        }
                    else
                        return nil
                    end
                end
                
                local obj1 = factory.createObject('type1')
                local obj2 = factory.createObject('type2')
                
                local result1 = obj1:method()
                local result2 = obj2:method()
                
                return result1, result2
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaModuleObserver()
        {
            // 测试Lua观察者模式模块
            string luaCode = @"
                local subject = {
                    observers = {},
                    data = 0
                }
                
                function subject:addObserver(observer)
                    table.insert(self.observers, observer)
                end
                
                function subject:removeObserver(observer)
                    for i, obs in ipairs(self.observers) do
                        if obs == observer then
                            table.remove(self.observers, i)
                            break
                        end
                    end
                end
                
                function subject:notifyObservers()
                    for _, observer in ipairs(self.observers) do
                        observer:update(self.data)
                    end
                end
                
                function subject:setData(data)
                    self.data = data
                    self:notifyObservers()
                end
                
                local observer1 = {
                    update = function(self, data) self.lastData = data end,
                    lastData = 0
                }
                
                local observer2 = {
                    update = function(self, data) self.lastData = data * 2 end,
                    lastData = 0
                }
                
                subject:addObserver(observer1)
                subject:addObserver(observer2)
                subject:setData(10)
                
                return observer1.lastData, observer2.lastData
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaModuleState()
        {
            // 测试Lua状态机模块
            string luaCode = @"
                local stateMachine = {
                    currentState = 'idle',
                    states = {}
                }
                
                function stateMachine:addState(name, enterFunc, exitFunc, updateFunc)
                    self.states[name] = {
                        enter = enterFunc,
                        exit = exitFunc,
                        update = updateFunc
                    }
                end
                
                function stateMachine:changeState(newState)
                    if self.states[self.currentState] and self.states[self.currentState].exit then
                        self.states[self.currentState].exit()
                    end
                    
                    self.currentState = newState
                    
                    if self.states[self.currentState] and self.states[self.currentState].enter then
                        self.states[self.currentState].enter()
                    end
                end
                
                function stateMachine:update()
                    if self.states[self.currentState] and self.states[self.currentState].update then
                        self.states[self.currentState].update()
                    end
                end
                
                local result = stateMachine.currentState
                return result
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaModuleEventSystem()
        {
            // 测试Lua事件系统模块
            string luaCode = @"
                local eventSystem = {
                    events = {}
                }
                
                function eventSystem:addEventListener(eventName, listener)
                    if not self.events[eventName] then
                        self.events[eventName] = {}
                    end
                    table.insert(self.events[eventName], listener)
                end
                
                function eventSystem:removeEventListener(eventName, listener)
                    if self.events[eventName] then
                        for i, l in ipairs(self.events[eventName]) do
                            if l == listener then
                                table.remove(self.events[eventName], i)
                                break
                            end
                        end
                    end
                end
                
                function eventSystem:dispatchEvent(eventName, data)
                    if self.events[eventName] then
                        for _, listener in ipairs(self.events[eventName]) do
                            listener(data)
                        end
                    end
                end
                
                local receivedData = nil
                local listener = function(data)
                    receivedData = data
                end
                
                eventSystem:addEventListener('test', listener)
                eventSystem:dispatchEvent('test', 'test data')
                
                return receivedData
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaModuleConfiguration()
        {
            // 测试Lua配置模块
            string luaCode = @"
                local config = {
                    settings = {}
                }
                
                function config:set(key, value)
                    self.settings[key] = value
                end
                
                function config:get(key, defaultValue)
                    return self.settings[key] or defaultValue
                end
                
                function config:loadFromTable(table)
                    for k, v in pairs(table) do
                        self.settings[k] = v
                    end
                end
                
                function config:saveToTable()
                    local result = {}
                    for k, v in pairs(self.settings) do
                        result[k] = v
                    end
                    return result
                end
                
                config:set('debug', true)
                config:set('maxConnections', 100)
                
                local debugValue = config:get('debug', false)
                local maxConnections = config:get('maxConnections', 10)
                
                return debugValue, maxConnections
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaModuleCache()
        {
            // 测试Lua缓存模块
            string luaCode = @"
                local cache = {
                    data = {},
                    maxSize = 100
                }
                
                function cache:set(key, value)
                    if #self.data >= self.maxSize then
                        table.remove(self.data, 1)
                    end
                    self.data[key] = value
                end
                
                function cache:get(key)
                    return self.data[key]
                end
                
                function cache:remove(key)
                    self.data[key] = nil
                end
                
                function cache:clear()
                    self.data = {}
                end
                
                function cache:size()
                    local count = 0
                    for _ in pairs(self.data) do
                        count = count + 1
                    end
                    return count
                end
                
                cache:set('key1', 'value1')
                cache:set('key2', 'value2')
                
                local value1 = cache:get('key1')
                local value2 = cache:get('key2')
                local size = cache:size()
                
                return value1, value2, size
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaModuleValidation()
        {
            // 测试Lua验证模块
            string luaCode = @"
                local validator = {}
                
                function validator:isString(value)
                    return type(value) == 'string'
                end
                
                function validator:isNumber(value)
                    return type(value) == 'number'
                end
                
                function validator:isBoolean(value)
                    return type(value) == 'boolean'
                end
                
                function validator:isTable(value)
                    return type(value) == 'table'
                end
                
                function validator:isFunction(value)
                    return type(value) == 'function'
                end
                
                function validator:isNil(value)
                    return type(value) == 'nil'
                end
                
                function validator:isPositiveNumber(value)
                    return self:isNumber(value) and value > 0
                end
                
                function validator:isNonEmptyString(value)
                    return self:isString(value) and #value > 0
                end
                
                local results = {
                    string = validator:isString('test'),
                    number = validator:isNumber(42),
                    boolean = validator:isBoolean(true),
                    table = validator:isTable({}),
                    function = validator:isFunction(function() end),
                    nil = validator:isNil(nil),
                    positive = validator:isPositiveNumber(10),
                    empty = validator:isNonEmptyString('')
                }
                
                return results
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaModuleSerialization()
        {
            // 测试Lua序列化模块
            string luaCode = @"
                local serializer = {}
                
                function serializer:serializeTable(t, indent)
                    indent = indent or 0
                    local result = '{'
                    local first = true
                    
                    for k, v in pairs(t) do
                        if not first then
                            result = result .. ','
                        end
                        first = false
                        
                        if type(k) == 'string' then
                            result = result .. '[' .. string.format('%q', k) .. ']='
                        else
                            result = result .. '[' .. tostring(k) .. ']='
                        end
                        
                        if type(v) == 'table' then
                            result = result .. self:serializeTable(v, indent + 1)
                        elseif type(v) == 'string' then
                            result = result .. string.format('%q', v)
                        else
                            result = result .. tostring(v)
                        end
                    end
                    
                    result = result .. '}'
                    return result
                end
                
                function serializer:deserializeTable(str)
                    local func, err = load('return ' .. str)
                    if func then
                        return func()
                    else
                        return nil, err
                    end
                end
                
                local testTable = {
                    name = 'test',
                    value = 42,
                    items = {1, 2, 3}
                }
                
                local serialized = serializer:serializeTable(testTable)
                local deserialized = serializer:deserializeTable(serialized)
                
                return serialized, deserialized.name
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaModuleTimer()
        {
            // 测试Lua定时器模块
            string luaCode = @"
                local timer = {
                    timers = {},
                    nextId = 1
                }
                
                function timer:setTimeout(callback, delay)
                    local id = self.nextId
                    self.nextId = self.nextId + 1
                    
                    self.timers[id] = {
                        callback = callback,
                        delay = delay,
                        remaining = delay
                    }
                    
                    return id
                end
                
                function timer:clearTimeout(id)
                    self.timers[id] = nil
                end
                
                function timer:update(deltaTime)
                    local toRemove = {}
                    
                    for id, t in pairs(self.timers) do
                        t.remaining = t.remaining - deltaTime
                        if t.remaining <= 0 then
                            t.callback()
                            table.insert(toRemove, id)
                        end
                    end
                    
                    for _, id in ipairs(toRemove) do
                        self.timers[id] = nil
                    end
                end
                
                local callbackCalled = false
                local callback = function()
                    callbackCalled = true
                end
                
                local id = timer:setTimeout(callback, 1.0)
                timer:update(1.0)
                
                return callbackCalled
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }

        [Test]
        public void TestLuaModulePool()
        {
            // 测试Lua对象池模块
            string luaCode = @"
                local pool = {
                    objects = {},
                    factory = nil
                }
                
                function pool:setFactory(factoryFunc)
                    self.factory = factoryFunc
                end
                
                function pool:get()
                    if #self.objects > 0 then
                        return table.remove(self.objects)
                    elseif self.factory then
                        return self.factory()
                    else
                        return nil
                    end
                end
                
                function pool:returnObject(obj)
                    if obj.reset then
                        obj:reset()
                    end
                    table.insert(self.objects, obj)
                end
                
                function pool:clear()
                    self.objects = {}
                end
                
                function pool:size()
                    return #self.objects
                end
                
                local objectFactory = function()
                    return {
                        id = 0,
                        reset = function(self)
                            self.id = 0
                        end
                    }
                end
                
                pool:setFactory(objectFactory)
                
                local obj1 = pool:get()
                local obj2 = pool:get()
                
                obj1.id = 1
                obj2.id = 2
                
                pool:returnObject(obj1)
                pool:returnObject(obj2)
                
                local size = pool:size()
                
                return size
            ";
            
            var result = jsEnv.Eval(luaCode);
            Assert.IsNotNull(result);
        }
    }
} 
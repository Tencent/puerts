-- Lua测试模块
local module = {}

-- 基本数学运算
function module.add(a, b)
    return a + b
end

function module.subtract(a, b)
    return a - b
end

function module.multiply(a, b)
    return a * b
end

function module.divide(a, b)
    if b == 0 then
        error("Division by zero")
    end
    return a / b
end

-- 字符串操作
function module.concat(str1, str2)
    return str1 .. str2
end

function module.upper(str)
    return string.upper(str)
end

function module.lower(str)
    return string.lower(str)
end

-- 表操作
function module.createTable()
    return {}
end

function module.setTableValue(t, key, value)
    t[key] = value
end

function module.getTableValue(t, key)
    return t[key]
end

function module.tableSize(t)
    local count = 0
    for _ in pairs(t) do
        count = count + 1
    end
    return count
end

-- 工具函数
function module.isNumber(value)
    return type(value) == 'number'
end

function module.isString(value)
    return type(value) == 'string'
end

function module.isTable(value)
    return type(value) == 'table'
end

function module.isFunction(value)
    return type(value) == 'function'
end

-- 常量
module.PI = 3.14159
module.VERSION = "1.0.0"

-- 私有变量（通过闭包实现）
local privateCounter = 0

function module.getCounter()
    return privateCounter
end

function module.incrementCounter()
    privateCounter = privateCounter + 1
    return privateCounter
end

function module.resetCounter()
    privateCounter = 0
end

-- 返回模块
return module 
-- Lua test module
local module = {}

-- Basic math operations
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

-- String operations
function module.concat(str1, str2)
    return str1 .. str2
end

function module.upper(str)
    return string.upper(str)
end

function module.lower(str)
    return string.lower(str)
end

-- Table operations
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

-- Utility functions
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

-- Constants
module.PI = 3.14159
module.VERSION = "1.0.0"

-- Private variables (implemented through closure)
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

-- Return module
return module 
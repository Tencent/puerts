local f = require('tests/lua/framework')
local UE, test, note, observe, catchError = f.UE, f.test, f.note, f.observe, f.catchError

local obj = UE.PuertsTestObject()

test('wrong arguments', function()
    note('wrong arg type', catchError(function()
        obj:Add('a', 'b')
    end))
    note('too few args', catchError(function()
        obj:Concat('a')
    end))
    note('static with wrong args', catchError(function()
        UE.PuertsTestObject.StaticAdd('x')
    end))
end)

test('wrong property values', function()
    note('int from string', catchError(function()
        obj.IntValue = 'abc'
    end))
    note('object from number', catchError(function()
        obj.ObjectValue = 1
    end))
end)

test('missing members', function()
    note('call missing method', catchError(function()
        obj:NoSuchMethod()
    end))
    note('unknown class', catchError(function()
        return UE.NoSuchClassAnywhere.StaticClass()
    end))
end)

test('error values', function()
    note('error with table', catchError(function()
        error({ code = 1 })
    end))
    note('error with level 0', catchError(function()
        error('plain', 0)
    end))
end)

f.run()

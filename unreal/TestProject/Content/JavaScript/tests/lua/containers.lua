local f = require('tests/lua/framework')
local UE, test, eq, assert, note, observe, catchError = f.UE, f.test, f.eq, f.assert, f.note, f.observe, f.catchError

local obj = UE.PuertsTestObject()

test('array property', function()
    local a = obj.IntArray
    eq(a:Num(), 0)
    a:Add(1)
    a:Add(2)
    a:Add(3)
    eq(obj.IntArray:Num(), 3, 'property returns a view, not a copy')
    eq(a:Get(1), 2)
    a:Set(1, 20)
    eq(obj.IntArray:Get(1), 20)
    eq(a:Contains(20), true)
    eq(a:FindIndex(3), 2)
    a:RemoveAt(0)
    eq(a:Num(), 2)
    eq(a:IsValidIndex(5), false)
    a:Empty()
    eq(a:Num(), 0)
end)

test('array of string', function()
    local a = obj.StringArray
    a:Add('x')
    a:Add('y')
    eq(a:Get(1), 'y')
end)

test('array of struct', function()
    local a = obj.StructArray
    local s = UE.PuertsTestStruct()
    s.X = 5
    a:Add(s)
    eq(a:Get(0).X, 5)
    observe('array struct element modify', function()
        a:Get(0).X = 6
        return a:Get(0).X
    end)
end)

test('array out of range', function()
    observe('array get out of range', function()
        return obj.IntArray:Get(100)
    end)
end)

test('array assign', function()
    local b = UE.NewArray(UE.BuiltinInt)
    b:Add(7)
    obj.IntArray = b
    eq(obj.IntArray:Num(), 1)
    b:Add(8)
    eq(obj.IntArray:Num(), 1, 'assignment copies')
end)

test('set', function()
    local s = obj.StringSet
    s:Add('a')
    s:Add('b')
    s:Add('a')
    eq(s:Num(), 2)
    eq(s:Contains('b'), true)
    s:RemoveAt(s:FindIndex('b'))
    eq(s:Contains('b'), false)
    observe('set Get', function()
        return s:Get(s:FindIndex('a'))
    end)
end)

test('map', function()
    local m = obj.StringIntMap
    m:Add('one', 1)
    m:Add('two', 2)
    eq(m:Num(), 2)
    eq(m:Get('two'), 2)
    m:Set('two', 22)
    eq(m:Get('two'), 22)
    observe('map get missing', function()
        return m:Get('missing')
    end)
    m:Remove('one')
    eq(m:Num(), 1)
    local keys = {}
    for i = m:GetMaxIndex() - 1, 0, -1 do
        if m:IsValidIndex(i) then
            keys[#keys + 1] = m:GetKey(i)
        end
    end
    eq(keys, { 'two' })
end)

test('new containers', function()
    local m = UE.NewMap(UE.BuiltinString, UE.PuertsTestStruct)
    local s = UE.PuertsTestStruct()
    s.X = 1
    m:Add('a', s)
    eq(m:Get('a').X, 1)
    local set = UE.NewSet(UE.BuiltinInt)
    set:Add(3)
    eq(set:Num(), 1)
    local objs = UE.NewArray(UE.PuertsTestObject)
    objs:Add(obj)
    assert(objs:Get(0) == obj, 'object element identity')
end)

test('container shape', function()
    observe('array type', function()
        return type(obj.IntArray)
    end)
    observe('array index', function()
        return obj.IntArray[0]
    end)
    observe('array length operator', function()
        return #obj.IntArray
    end)
end)

test('new container bad types', function()
    note('NewArray unknown builtin', catchError(function()
        UE.NewArray(9999)
    end))
    note('NewMap unknown value type', catchError(function()
        UE.NewMap(UE.BuiltinInt, 9999)
    end))
    observe('NewArray of struct', function()
        return UE.NewArray(UE.PuertsTestStruct):Num()
    end)
    observe('NewSet of object', function()
        return UE.NewSet(UE.PuertsTestObject):Num()
    end)
end)

test('blueprint.tojs', function()
    local tojs = require('puerts').blueprint.tojs
    assert(tojs(UE.PuertsTestObject.StaticClass()) == UE.PuertsTestObject, 'class')
    assert(tojs(UE.PuertsTestStruct.StaticClass()) == UE.PuertsTestStruct, 'struct')
    observe('enum tojs type', function()
        return type(tojs(UE.Enum.Load('/Script/PuertsTest.EPuertsTestEnum')))
    end)
    note('tojs number', catchError(function()
        tojs(1)
    end))
end)

f.run()

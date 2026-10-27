local f = require('tests/lua/framework')
local UE, test, eq, near, assert, observe = f.UE, f.test, f.eq, f.near, f.assert, f.observe

local obj = UE.PuertsTestObject()

test('bool', function()
    eq(obj.BoolValue, false)
    obj.BoolValue = true
    eq(obj.BoolValue, true)
end)

test('bitfield', function()
    obj.bBitA = true
    eq(obj.bBitA, true)
    eq(obj.bBitB, false, 'neighbour bit untouched')
    obj.bBitB = true
    obj.bBitA = false
    eq(obj.bBitA, false)
    eq(obj.bBitB, true)
end)

test('byte', function()
    obj.ByteValue = 200
    eq(obj.ByteValue, 200)
end)

test('int32', function()
    obj.IntValue = -12345
    eq(obj.IntValue, -12345)
    obj.IntValue = 2147483647
    eq(obj.IntValue, 2147483647)
end)

test('int64', function()
    obj.Int64Value = 9007199254740993
    eq(obj.Int64Value, 9007199254740993)
    observe('int64 math.type', function()
        return math.type(obj.Int64Value)
    end)
end)

test('float/double', function()
    obj.FloatValue = 1.5
    eq(obj.FloatValue, 1.5)
    obj.FloatValue = 0.1
    near(obj.FloatValue, 0.1, 1e-7)
    obj.DoubleValue = 0.1
    eq(obj.DoubleValue, 0.1)
    observe('int to double property', function()
        obj.DoubleValue = 3
        return obj.DoubleValue
    end)
end)

test('string', function()
    obj.StringValue = 'hello 世界 🙂'
    eq(obj.StringValue, 'hello 世界 🙂')
    obj.StringValue = ''
    eq(obj.StringValue, '')
end)

test('name', function()
    obj.NameValue = 'SomeName'
    eq(obj.NameValue, 'SomeName')
    observe('name type', function()
        return type(obj.NameValue)
    end)
end)

test('text', function()
    obj.TextValue = 'some text'
    eq(obj.TextValue, 'some text')
    observe('text type', function()
        return type(obj.TextValue)
    end)
end)

test('enum', function()
    eq(UE.EPuertsTestEnum.A, 0)
    eq(UE.EPuertsTestEnum.B, 1)
    eq(UE.EPuertsTestEnum.C, 10)
    obj.EnumValue = UE.EPuertsTestEnum.C
    eq(obj.EnumValue, 10)
end)

test('vector', function()
    obj.VectorValue = UE.Vector(1, 2, 3)
    local v = obj.VectorValue
    eq(v.X, 1)
    eq(v.Y, 2)
    eq(v.Z, 3)
end)

test('struct', function()
    local s = UE.PuertsTestStruct()
    s.X = 3
    s.S = 'abc'
    obj.StructValue = s
    eq(obj.StructValue.X, 3)
    eq(obj.StructValue.S, 'abc')
    s.X = 4
    eq(obj.StructValue.X, 3, 'assignment copies')
    observe('struct property get then modify', function()
        local ref = obj.StructValue
        ref.X = 99
        return obj.StructValue.X
    end)
    observe('struct property get twice identical', function()
        return obj.StructValue == obj.StructValue
    end)
end)

test('object', function()
    eq(obj.ObjectValue, nil)
    local other = UE.PuertsTestObject()
    obj.ObjectValue = other
    assert(obj.ObjectValue == other, 'same lua object')
    obj.ObjectValue = nil
    eq(obj.ObjectValue, nil)
end)

test('class', function()
    obj.ClassValue = UE.PuertsTestDerived.StaticClass()
    eq(obj.ClassValue:GetName(), 'PuertsTestDerived')
end)

test('weak/soft object', function()
    local other = UE.PuertsTestObject()
    obj.WeakObject = other
    assert(obj.WeakObject == other, 'weak ptr returns same object')
    local soft = obj.SoftObject
    eq(soft:Get(), nil)
    eq(soft:LoadSynchronous(), nil)
    observe('assign uobject to soft object', function()
        obj.SoftObject = other
    end)
end)

test('fixed array', function()
    local a = obj.FixedInts
    eq(a:Num(), 3)
    a:Set(1, 11)
    eq(obj.FixedInts:Get(1), 11)
end)

test('reflection shape', function()
    observe('type of class', function()
        return type(UE.PuertsTestObject)
    end)
    observe('type of object', function()
        return type(obj)
    end)
    observe('tostring class', function()
        return tostring(UE.PuertsTestObject)
    end)
    observe('StaticClass name', function()
        return UE.PuertsTestObject.StaticClass():GetName()
    end)
    observe('unknown property', function()
        return obj.NoSuchProperty
    end)
    observe('expando field', function()
        obj.LuaField = 5
        return obj.LuaField
    end)
end)

test('derived', function()
    local d = UE.PuertsTestDerived()
    eq(d.DerivedValue, 42)
    d.IntValue = 5
    eq(d.IntValue, 5)
    eq(d:WhoAmI(), 'Derived')
    eq(d:Add(1, 2), 3)
end)

f.run()

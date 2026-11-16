local f = require('tests/lua/framework')
local UE, puerts, test, step, eq, observe = f.UE, f.puerts, f.test, f.step, f.eq, f.observe

local obj = UE.PuertsTestObject()

test('single delegate', function()
    eq(obj:CallIntDelegate(1), -1, 'unbound')
    obj.IntDelegate:Bind(function(v)
        return v * 2
    end)
    eq(obj.IntDelegate:IsBound(), true)
    eq(obj:CallIntDelegate(21), 42)
    eq(obj.IntDelegate:Execute(5), 10, 'execute from lua')
    obj.IntDelegate:Unbind()
    eq(obj.IntDelegate:IsBound(), false)
    eq(obj:CallIntDelegate(1), -1)
end)

test('rebind', function()
    obj.IntDelegate:Bind(function(v)
        return v + 1
    end)
    obj.IntDelegate:Bind(function(v)
        return v + 2
    end)
    eq(obj:CallIntDelegate(1), 3)
    obj.IntDelegate:Unbind()
end)

test('multicast', function()
    local got = {}
    local f1 = function(m)
        got[#got + 1] = '1' .. m
    end
    local f2 = function(m)
        got[#got + 1] = '2' .. m
    end
    obj.Multicast:Add(f1)
    obj.Multicast:Add(f2)
    obj:BroadcastMulticast('a')
    obj.Multicast:Remove(f1)
    obj:BroadcastMulticast('b')
    obj.Multicast:Broadcast('c')
    obj.Multicast:Clear()
    obj:BroadcastMulticast('d')
    table.sort(got)
    eq(got, { '1a', '2a', '2b', '2c' })
    observe('multicast IsBound after clear', function()
        return obj.Multicast:IsBound()
    end)
end)

test('delegate shape', function()
    observe('delegate same view', function()
        return obj.IntDelegate == obj.IntDelegate
    end)
end)

-- closure captured by a delegate must stay alive across GC while bound
local captured = { value = 100 }
test('bind closure', function()
    local c = captured
    obj.IntDelegate:Bind(function(v)
        return v + c.value
    end)
    captured = nil
end)

step(function()
    test('closure survives gc', function()
        eq(obj:CallIntDelegate(1), 101)
        obj.IntDelegate:Unbind()
    end)
end)

-- ---------- lua function passed as a delegate argument ----------
local Reporter = UE.PuertsTestReporter
local state = {}

test('function argument', function()
    local o = UE.PuertsTestObject()
    local fn = puerts.toManualReleaseDelegate(function(v)
        return v * 3
    end)
    o:SetIntDelegate(fn)
    eq(o:CallIntDelegate(4), 12)
    eq(o.IntDelegate:Execute(5), 15, 'execute the copied delegate from lua')
end)

test('function argument: {owner, function}', function()
    local owner = UE.PuertsTestObject()
    local o = UE.PuertsTestObject()
    o:SetIntDelegate({ owner, function(v)
        return v + 1000
    end })
    eq(o:CallIntDelegate(1), 1001)
    Reporter.MarkGarbage(owner)
    state.autoRelease = o
end)

test('function argument: {object, ufunction name}', function()
    local o = UE.PuertsTestObject()
    o:SetIntDelegate({ o, 'Identity' })
    eq(o:CallIntDelegate(7), 7)
    observe('ufunction bound IsBound', function()
        return o.IntDelegate:IsBound()
    end)
end)

test('delegate object argument copies', function()
    local a = UE.PuertsTestObject()
    local b = UE.PuertsTestObject()
    a.IntDelegate:Bind(function(v)
        return v - 1
    end)
    b:SetIntDelegate(a.IntDelegate)
    eq(b:CallIntDelegate(10), 9)
    a.IntDelegate:Unbind()
    b.IntDelegate:Unbind()
end)

test('void delegate signature', function()
    local o = UE.PuertsTestObject()
    local got = {}
    o.StepDelegate:Bind(function(s)
        got[#got + 1] = s
    end)
    eq(o:CallStepDelegate(3), true)
    o.StepDelegate:Unbind()
    eq(o:CallStepDelegate(4), false)
    eq(got, { 3 })
end)

test('execute unbound', function()
    local o = UE.PuertsTestObject()
    observe('execute unbound single', function()
        return o.IntDelegate:Execute(1)
    end)
    observe('broadcast empty multicast', function()
        return o.Multicast:Broadcast('x')
    end)
end)

test('multicast edge cases', function()
    local o = UE.PuertsTestObject()
    local got = {}
    local fn = function(m)
        got[#got + 1] = m
    end
    o.Multicast:Add(fn)
    o.Multicast:Add(fn)
    o:BroadcastMulticast('twice')
    observe('same function added twice', function()
        return #got
    end)
    o.Multicast:Remove(fn)
    o:BroadcastMulticast('after remove once')
    observe('after removing once', function()
        return #got
    end)
    o.Multicast:Remove(fn)
    observe('multicast IsBound after removing all', function()
        return o.Multicast:IsBound()
    end)
    o.Multicast:Clear()
end)

step(function()
    test('{owner, function} after owner destroyed', function()
        observe('auto release call', function()
            return state.autoRelease:CallIntDelegate(1)
        end)
    end)
end)

f.run()

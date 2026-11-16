local f = require('tests/lua/framework')
local UE, test, step, eq, assert, observe = f.UE, f.test, f.step, f.eq, f.assert, f.observe

local Obj = UE.PuertsTestObject
local Reporter = UE.PuertsTestReporter
local state = {}

-- objects created by lua and dropped are collected by the lua GC and then by the UE GC
test('create and drop', function()
    state.before = Obj.GetLiveCount()
    for _ = 1, 10 do
        local o = Obj()
        o.IntValue = 1
    end
    assert(Obj.GetLiveCount() >= state.before + 10, 'created')
end)

-- an object referenced by lua stays alive
test('kept by lua', function()
    state.kept = Obj()
    state.kept.IntValue = 77
    state.keptLive = Obj.GetLiveCount()
end)

-- the lua object of an UObject is cached (the same userdata) while it is referenced
test('identity cache', function()
    local o = Obj()
    assert(o:GetSelf() == o, 'same userdata')
    state.weak = setmetatable({ o:GetSelf() }, { __mode = 'v' })
end)

-- structs are owned by lua
test('struct lifetime', function()
    state.countedBefore = Obj.GetCountedLiveCount()
    local holder = Obj()
    for i = 1, 5 do
        holder:MakeCounted(i)
    end
    state.keptStruct = holder:MakeCounted(42)
end)

-- an object destroyed by UE (MarkGarbage + GC) while lua references it
test('destroyed by UE', function()
    state.dead = Obj()
    Reporter.MarkGarbage(state.dead)
end)

step(function()
    test('dropped objects collected', function()
        observe('live count back to before', function()
            return Obj.GetLiveCount() <= state.before + 3
        end)
    end)

    test('kept object alive', function()
        eq(state.kept.IntValue, 77)
        eq(Reporter.IsAlive(state.kept), true)
    end)

    test('weak cache cleared', function()
        observe('weak entry after gc', function()
            return state.weak[1]
        end)
    end)

    test('structs collected', function()
        eq(state.keptStruct.V, 42)
        observe('counted structs alive', function()
            return Obj.GetCountedLiveCount() - state.countedBefore
        end)
        state.keptStruct = nil
    end)

    test('access destroyed object', function()
        observe('IsAlive', function()
            return Reporter.IsAlive(state.dead)
        end)
        observe('read property of destroyed', function()
            return state.dead.IntValue
        end)
        observe('call method of destroyed', function()
            return state.dead:Add(1, 2)
        end)
        state.dead = nil
    end)
end)

step(function()
    test('struct released', function()
        observe('counted structs alive after release', function()
            return Obj.GetCountedLiveCount() - state.countedBefore
        end)
    end)
end)

f.run()

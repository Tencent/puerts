-- The lua counterpart of tests/blueprint.js: blueprint classes and user defined structs changed and recompiled (editor
-- only) while the script holds their classes. A struct instance does not live across a layout change.
local f = require('tests/lua/framework')
local UE, test, step, eq, assert, note, observe, catchError = f.UE, f.test, f.step, f.eq, f.assert, f.note, f.observe, f.catchError
local puerts = f.puerts

local BP = UE.PuertsTestBlueprintUtils
local Reporter = UE.PuertsTestReporter
local tojs = puerts.blueprint.tojs
local state = {}

local function must(v, what)
    assert(v, what .. ' failed (needs the editor)')
    return v
end

-- ---------------- blueprint class ----------------

test('class: create', function()
    local cls = must(BP.CreateBlueprintClass(UE.PuertsTestObject.StaticClass()), 'CreateBlueprintClass')
    local withScore = must(BP.AddClassVariable(cls, 'Score', 'int'), 'AddClassVariable')
    observe('class: add variable keeps the UClass', function()
        return withScore == cls
    end)
    state.cls = cls
    state.Cls = tojs(cls)
    observe('class: tojs is cached', function()
        return tojs(cls) == state.Cls
    end)
    observe('class: StaticClass', function()
        return state.Cls.StaticClass() == cls
    end)
    local a = state.Cls()
    a.Score = 3
    a.IntValue = 5
    eq(a.Score, 3)
    eq(a.IntValue, 5)
    eq(a:Add(1, 2), 3)
    observe('class: instance GetClass', function()
        return a:GetClass() == cls
    end)
    note('class: merge', catchError(function()
        puerts.merge(a, { Score = 10, IntValue = 11 })
    end))
    observe('class: merged', function()
        return { a.Score, a.IntValue }
    end)
    state.a0 = a
end)

test('class: create derived', function()
    local child = must(BP.CreateBlueprintClass(state.cls), 'CreateBlueprintClass(derived)')
    state.child = child
    state.Child = tojs(child)
    local c = state.Child()
    c.Score = 4
    eq(c.Score, 4)
    eq(c:Add(2, 2), 4)
    state.c0 = c
end)

step(function()
    test('class: recompile unchanged', function()
        local cls = must(BP.RecompileClass(state.cls), 'RecompileClass')
        observe('recompile: same UClass', function()
            return cls == state.cls
        end)
        observe('recompile: same lua class', function()
            return tojs(cls) == state.Cls
        end)
        observe('recompile: old instance alive', function()
            return Reporter.IsAlive(state.a0)
        end)
        observe('recompile: old instance Score', function()
            return state.a0.Score
        end)
        local a = state.Cls()
        a.Score = 6
        eq(a.Score, 6)
    end)

    test('class: add variable', function()
        local cls = must(BP.AddClassVariable(state.cls, 'Label', 'string'), 'AddClassVariable')
        observe('add: same lua class', function()
            return tojs(cls) == state.Cls
        end)
        observe('add: has Label', function()
            return BP.HasOwnProperty(cls, 'Label')
        end)
        local a = state.Cls()
        a.Score = 7
        observe('add: new instance Score', function()
            return a.Score
        end)
        observe('add: new instance Label', function()
            return a.Label
        end)
        note('add: write Label', catchError(function()
            a.Label = 'hello'
        end))
        observe('add: read Label after write', function()
            return a.Label
        end)
        state.a1 = a
        local m = state.Cls()
        note('add: merge after recompile', catchError(function()
            puerts.merge(m, { Score = 12, IntValue = 13, Label = 'm' })
        end))
        observe('add: merged', function()
            return { m.Score, m.IntValue }
        end)
        local c = state.Child()
        c.Score = 8
        observe('add: derived new instance Score', function()
            return c.Score
        end)
    end)
end)

step(function()
    test('class: instances after reinstancing and gc', function()
        observe('gc: first instance Score', function()
            return state.a0.Score
        end)
        observe('gc: second instance Score', function()
            return state.a1.Score
        end)
        observe('gc: derived instance alive', function()
            return Reporter.IsAlive(state.c0)
        end)
    end)

    test('class: remove variable', function()
        local cls = must(BP.RemoveClassVariable(state.cls, 'Score'), 'RemoveClassVariable')
        observe('remove: same lua class', function()
            return tojs(cls) == state.Cls
        end)
        local a = state.Cls()
        observe('remove: new instance read Score', function()
            return a.Score
        end)
        note('remove: new instance write Score', catchError(function()
            a.Score = 1
        end))
        observe('remove: kept instance read Score', function()
            return state.a1.Score
        end)
        local m = state.Cls()
        note('remove: merge', catchError(function()
            puerts.merge(m, { Score = 1, IntValue = 2 })
        end))
        observe('remove: merged IntValue', function()
            return m.IntValue
        end)
    end)
end)

step(function()
    test('class: change variable type', function()
        local cls = must(BP.ChangeClassVariableType(state.cls, 'Label', 'int'), 'ChangeClassVariableType')
        observe('change type: property type', function()
            return BP.PropertyTypeOf(cls, 'Label')
        end)
        local a = state.Cls()
        note('change type: write int', catchError(function()
            a.Label = 12
        end))
        observe('change type: read', function()
            return a.Label
        end)
    end)

    test('class: add the removed variable back with another type', function()
        local cls = must(BP.AddClassVariable(state.cls, 'Score', 'float'), 'AddClassVariable')
        observe('add back: property type', function()
            return BP.PropertyTypeOf(cls, 'Score')
        end)
        local a = state.Cls()
        note('add back: write', catchError(function()
            a.Score = 1.5
        end))
        observe('add back: read', function()
            return a.Score
        end)
    end)
end)

step(function()
    test('class: identity at the end', function()
        observe('end: tojs', function()
            return tojs(state.cls) == state.Cls
        end)
        observe('end: derived tojs', function()
            return tojs(state.child) == state.Child
        end)
        local c = state.Child()
        observe('end: derived GetClass', function()
            return c:GetClass() == state.child
        end)
        c.IntValue = 9
        eq(c.IntValue, 9)
        state.a0, state.a1, state.c0 = nil, nil, nil
    end)
end)

-- ---------------- user defined struct ----------------

test('struct: create', function()
    local s = must(BP.CreateUserStruct('Value', 'int'), 'CreateUserStruct')
    state.S = s
    state.St = tojs(s)
    observe('struct: tojs is cached', function()
        return tojs(s) == state.St
    end)
    local v = state.St()
    observe('struct: default Value', function()
        return v.Value
    end)
    v.Value = 7
    eq(v.Value, 7)
    local arr = UE.NewArray(state.St)
    arr:Add(v)
    observe('struct: copied into array', function()
        return arr:Get(0).Value
    end)
    note('struct: table into array', catchError(function()
        arr:Add({ Value = 3 })
    end))
    observe('struct: table element', function()
        return arr:Get(1).Value
    end)
    note('struct: merge', catchError(function()
        puerts.merge(v, { Value = 21 })
    end))
    observe('struct: merged', function()
        return v.Value
    end)
end)

step(function()
    test('struct: add variable', function()
        must(BP.AddUserStructVariable(state.S, 'Extra', 'string'), 'AddUserStructVariable')
        observe('struct add: same lua class', function()
            return tojs(state.S) == state.St
        end)
        local v = state.St()
        v.Value = 2
        observe('struct add: Value', function()
            return v.Value
        end)
        observe('struct add: Extra', function()
            return v.Extra
        end)
        local arr = UE.NewArray(state.St)
        note('struct add: table into array', catchError(function()
            arr:Add({ Value = 4, Extra = 'x' })
        end))
        observe('struct add: element Value', function()
            return arr:Get(0).Value
        end)
        -- containers made after the layout change must use the new element size, or the elements overlap and the strings of
        -- Extra are corrupted (crash at the destruction by Empty)
        local many = UE.NewArray(state.St)
        for i = 1, 8 do
            many:Add({ Value = i, Extra = 'a string long enough to be allocated ' .. i })
        end
        local function values(a)
            local r = {}
            for i = 0, a:Num() - 1 do
                r[#r + 1] = tostring(a:Get(i).Value)
            end
            return table.concat(r, ',')
        end
        observe('struct add: many elements', function()
            return values(many)
        end)
        many:RemoveAt(0)
        many:Add({ Value = 9, Extra = 'last' })
        observe('struct add: many elements after remove', function()
            return values(many)
        end)
        many:Empty()
        observe('struct add: emptied', function()
            return many:Num()
        end)
        local map = UE.NewMap(UE.BuiltinString, state.St)
        for i = 1, 4 do
            map:Add('k' .. i, { Value = i * 10, Extra = 'map value string ' .. i })
        end
        observe('struct add: map values', function()
            local r = {}
            for i = 1, 4 do
                r[#r + 1] = tostring(map:Get('k' .. i).Value)
            end
            return table.concat(r, ',')
        end)
        map:Empty()
    end)
end)

step(function()
    test('struct: rename variable', function()
        must(BP.RenameUserStructVariable(state.S, 'Value', 'Amount'), 'RenameUserStructVariable')
        local v = state.St()
        observe('struct rename: Value', function()
            return v.Value
        end)
        observe('struct rename: Amount', function()
            return v.Amount
        end)
        note('struct rename: merge', catchError(function()
            puerts.merge(v, { Value = 1, Amount = 2 })
        end))
    end)
end)

step(function()
    test('struct: change type and remove', function()
        must(BP.ChangeUserStructVariableType(state.S, 'Extra', 'int'), 'ChangeUserStructVariableType')
        must(BP.RemoveUserStructVariable(state.S, 'Extra'), 'RemoveUserStructVariable')
        observe('struct remove: has Extra', function()
            return BP.HasOwnProperty(state.S, 'Extra')
        end)
        local v = state.St()
        observe('struct remove: Value', function()
            return v.Value
        end)
        local arr = UE.NewArray(state.St)
        note('struct remove: table into array', catchError(function()
            arr:Add({ Extra = 1 })
        end))
        observe('struct remove: array length', function()
            return arr:Num()
        end)
    end)
end)

f.run()

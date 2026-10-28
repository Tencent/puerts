local f = require('tests/lua/framework')
local UE, puerts, test, eq, assert, note, observe, catchError =
    f.UE, f.puerts, f.test, f.eq, f.assert, f.note, f.observe, f.catchError

test('require lua module', function()
    local a = require('tests/lua/modules_data/mod_a')
    eq(a.name, 'mod_a')
    eq(a.b.value, 2, 'nested require')
    assert(require('tests/lua/modules_data/mod_a') == a, 'cached')
end)

test('dotted name', function()
    local b = require('tests.lua.modules_data.mod_b')
    eq(b.value, 2)
    observe('dotted and slash names are different entries', function()
        return require('tests/lua/modules_data/mod_b') == b
    end)
end)

test('with extension', function()
    observe('require with .lua', function()
        return require('tests/lua/modules_data/mod_b.lua').value
    end)
end)

test('module arguments', function()
    local args = require('tests/lua/modules_data/args')
    eq(args.name, 'tests/lua/modules_data/args')
    note('path', f.normalizePath(args.path))
end)

test('builtin modules', function()
    assert(require('puerts') == puerts, 'puerts')
    assert(require('ue') == UE, 'ue')
    assert(require('ue') == _G.UE, 'global UE')
    puerts.registerBuildinModule('my_builtin', { v = 1 })
    eq(require('my_builtin').v, 1)
end)

test('missing module', function()
    note('missing', catchError(function()
        require('tests/lua/modules_data/no_such_module')
    end))
end)

test('syntax error', function()
    note('syntax error', catchError(function()
        require('tests/lua/modules_data/syntax_err')
    end))
end)

test('throwing module', function()
    note('throws', catchError(function()
        require('tests/lua/modules_data/throws')
    end))
    observe('not cached after throw', function()
        return package.loaded['tests/lua/modules_data/throws']
    end)
end)

test('globals', function()
    observe('package.path', function()
        return package.path
    end)
    observe('searchers count', function()
        return #package.searchers
    end)
    observe('console', function()
        return type(console.log)
    end)
    observe('host globals removed', function()
        return { __tgjsNewObject == nil, __tgjsMixin == nil }
    end)
end)

f.run()

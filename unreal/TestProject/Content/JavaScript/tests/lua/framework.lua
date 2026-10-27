-- Minimal test framework shared by tests/lua/*.lua (the lua counterpart of tests/framework.js).
-- - test(name, fn): register a case in the current step
-- - step(fn): cases registered inside fn run in the next step; C++ runs a lua full GC + UE GC between steps
-- - note(key, value): record an observed behaviour; notes are compared with Baseline/Lua/<Test>.txt

local puerts = require('puerts')
local UE = require('ue')
local reporter = puerts.argv.getByName('Reporter')

local steps = { {} }
local registering = 1

local function test(name, fn)
    local list = steps[registering]
    list[#list + 1] = { name = name, fn = fn }
end

local function step(fn)
    local saved = registering
    registering = #steps + 1
    steps[registering] = {}
    fn()
    registering = saved
end

-- the absolute paths of the scripts (chunk names, may be shortened by lua) are replaced by <js-root>
local function normalizePath(s)
    s = s:gsub('[^%s\'"]*JavaScript[\\/]', '<js-root>/')
    return (s:gsub('\\', '/'))
end

local fmt

local function isSequence(t)
    local n = #t
    local count = 0
    for _ in pairs(t) do
        count = count + 1
    end
    return count == n
end

fmt = function(v)
    local t = type(v)
    if t == 'nil' then
        return 'nil'
    elseif t == 'string' then
        return string.format('%q', v)
    elseif t == 'number' then
        if v ~= v then
            return 'nan'
        end
        return tostring(v)
    elseif t == 'boolean' then
        return tostring(v)
    elseif t == 'function' then
        return 'function'
    elseif t == 'userdata' then
        local s = tostring(v)
        return '<' .. (s:match('^(.-): ') or s) .. '>'
    elseif t == 'table' then
        local mt = getmetatable(v)
        if mt and mt.__tostring then
            return '<class ' .. tostring(v) .. '>'
        end
        if isSequence(v) then
            local parts = {}
            for i = 1, #v do
                parts[i] = fmt(v[i])
            end
            return '[' .. table.concat(parts, ', ') .. ']'
        end
        local keys = {}
        for k in pairs(v) do
            keys[#keys + 1] = tostring(k)
        end
        table.sort(keys)
        local parts = {}
        for i, k in ipairs(keys) do
            parts[i] = k .. ': ' .. fmt(v[k])
        end
        return '{' .. table.concat(parts, ', ') .. '}'
    end
    return '<' .. t .. '>'
end

local function same(a, b)
    if a == b then
        return true
    end
    if type(a) == 'number' and type(b) == 'number' and a ~= a and b ~= b then
        return true
    end
    if type(a) == 'table' and type(b) == 'table' and getmetatable(a) == nil and getmetatable(b) == nil then
        if #a ~= #b then
            return false
        end
        for i = 1, #a do
            if not same(a[i], b[i]) then
                return false
            end
        end
        return true
    end
    return false
end

local function eq(actual, expected, msg)
    if not same(actual, expected) then
        error((msg and (msg .. ': ') or '') .. 'expected ' .. fmt(expected) .. ', got ' .. fmt(actual), 2)
    end
end

local function near(actual, expected, eps, msg)
    if type(actual) ~= 'number' or math.abs(actual - expected) > (eps or 1e-6) then
        error((msg and (msg .. ': ') or '') .. 'expected ~' .. tostring(expected) .. ', got ' .. fmt(actual), 2)
    end
end

local function assert_(cond, msg)
    if not cond then
        error(msg or 'assertion failed', 2)
    end
end

local function errorText(e)
    if type(e) == 'string' then
        -- a baseline line per note
        return (normalizePath(e):gsub('%s*\n%s*', ' | '))
    end
    return '<thrown ' .. fmt(e) .. '>'
end

-- returns the message of the error fn throws, or "<no throw>"
local function catchError(fn)
    local ok, e = pcall(fn)
    if ok then
        return '<no throw>'
    end
    return errorText(e)
end

local function note(key, value)
    reporter:Note(key .. ': ' .. (type(value) == 'string' and value or fmt(value)))
end

-- note the result of fn(), or the error it throws
local function observe(key, fn)
    local ok, r = pcall(fn)
    local text
    if ok then
        text = fmt(r)
    else
        text = 'throws ' .. errorText(r)
    end
    reporter:Note(key .. ': ' .. text)
end

local function runStep(index)
    for _, c in ipairs(steps[index + 1]) do
        local ok, e = xpcall(c.fn, function(err)
            return debug.traceback(tostring(err), 2)
        end)
        if ok then
            reporter:Pass(c.name)
        else
            reporter:Fail(c.name, normalizePath(e))
        end
    end
    reporter.FinishedSteps = index + 1
end

local function run()
    reporter.StepCount = #steps
    if #steps > 1 then
        reporter.OnStep:Bind(function(i)
            runStep(i)
        end)
    end
    runStep(0)
end

return {
    puerts = puerts,
    UE = UE,
    reporter = reporter,
    test = test,
    step = step,
    eq = eq,
    near = near,
    assert = assert_,
    catchError = catchError,
    note = note,
    observe = observe,
    fmt = fmt,
    normalizePath = normalizePath,
    run = run,
}

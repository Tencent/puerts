--[[
Tencent is pleased to support the open source community by making Puerts available.
Copyright (C) 2020 Tencent.  All rights reserved.
Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
]]

-- the bootstrap script of the lua backend (PapiLua), executed by FPapiBackendLua::OnEnter after the host bound its functions.
-- The lua counterpart of puerts/log.js, puerts/argv.js and puerts/uelazyload.js. Static functions and functions of puerts are
-- called with a dot (UE.KismetSystemLibrary.PrintString(...)), methods with a colon (obj:GetName())

local puerts = puerts
local rawget, rawset, setmetatable, type, tostring, select, pcall, error, load =
    rawget, rawset, setmetatable, type, tostring, select, pcall, error, load
local concat, tremove, unpack = table.concat, table.remove, table.unpack

---------------------------------------------------------------------------------------------------------------------------
-- log
---------------------------------------------------------------------------------------------------------------------------
local tgjsLog = __tgjsLog

local function format_args(...)
    local n = select('#', ...)
    local args = {}
    for i = 1, n do
        args[i] = tostring((select(i, ...)))
    end
    return concat(args, '\t')
end

function print(...)
    tgjsLog(0, format_args(...))
end

console = {
    log = function(...) tgjsLog(0, format_args(...)) end,
    info = function(...) tgjsLog(1, format_args(...)) end,
    warn = function(...) tgjsLog(2, format_args(...)) end,
    error = function(...) tgjsLog(3, format_args(...)) end,
}

---------------------------------------------------------------------------------------------------------------------------
-- module system: the sources are resolved and loaded by the host (the same module loader as js)
---------------------------------------------------------------------------------------------------------------------------
local host_resolve = __puer_host_resolve__
local host_load = __puer_host_load__

local function puerts_searcher(name)
    local spec = name
    if not spec:match('%.lua$') then
        spec = spec:gsub('%.', '/') .. '.lua'
    end
    local ok, url = pcall(host_resolve, spec, '', 'require')
    if not ok then
        return '\n\t[puerts] ' .. tostring(url)
    end
    return function(modname, path)
        local m = host_load(path, 'require')
        local chunk, err = load(m.content, '@' .. m.debugPath, 'bt')
        if not chunk then
            error(err, 0)
        end
        return chunk(modname, path)
    end, url
end

package.path = ''
package.cpath = ''
package.searchers = { package.searchers[1], puerts_searcher }

function puerts.registerBuildinModule(name, value)
    package.loaded[name] = value
end

package.loaded.puerts = puerts

---------------------------------------------------------------------------------------------------------------------------
-- argv
---------------------------------------------------------------------------------------------------------------------------
do
    local argList = {}
    local argMap = {}
    puerts.argv = {
        -- 0 based, as js
        getByIndex = function(index) return argList[index + 1] end,
        getByName = function(name) return argMap[name] end,
        add = function(name, value)
            argList[#argList + 1] = value
            argMap[name] = value
        end,
    }
end

---------------------------------------------------------------------------------------------------------------------------
-- UE / CPP
---------------------------------------------------------------------------------------------------------------------------
local loadUEType = puerts.loadUEType
local loadCPPType = puerts.loadCPPType

local UE = setmetatable({}, {
    __index = function(t, name)
        local cls = loadUEType(name)
        rawset(t, name, cls)
        return cls
    end,
})

local CPP = setmetatable({}, {
    __index = function(t, name)
        local cls = loadCPPType(name)
        rawset(t, name, cls)
        return cls
    end,
})

package.loaded.ue = UE
package.loaded.cpp = CPP
_G.UE = UE
_G.CPP = CPP

rawset(UE, 'NewObject', __tgjsNewObject)
__tgjsNewObject = nil
rawset(UE, 'NewStruct', __tgjsNewStruct)
__tgjsNewStruct = nil
rawset(UE, 'MakeWeakObjectPtr', __tgjsMakeWeakObjectPtr)
__tgjsMakeWeakObjectPtr = nil
rawset(UE, 'FNameLiteral', __tgjsFNameToArrayBuffer)
__tgjsFNameToArrayBuffer = nil

-- a ref is a table with the value at [1] (index 0 of js)
function puerts.ref(x) return { x } end
function puerts.unref(r) return r[1] end
function puerts.setref(r, x) r[1] = x end

puerts.merge = __tgjsMergeObject
__tgjsMergeObject = nil
puerts.setJsTakeRef = __tgjsSetJsTakeRef
__tgjsSetJsTakeRef = nil
-- classes of the script can not be injected into UE in lua (no mixin)
__tgjsMixin = nil

local UEClassToJSClass = __tgjsUEClassToJSClass
__tgjsUEClassToJSClass = nil

-- blueprint
local TNAMESPACE, TENUM, TBLUEPRINT, TSTRUCT = 0, 1, 2, 3

local blueprint = {}
local create_node

local function node_path(node, tail)
    local c = node
    while c and rawget(c, '__path') do
        tail = '/' .. rawget(c, '__path') .. tail
        c = rawget(c, '__parent')
    end
    return tail
end

local function blueprint_load(cls)
    local name = rawget(cls, '__path')
    if not name then
        error('argument #1 is not a unload type', 2)
    end
    local path = node_path(rawget(cls, '__parent'), '.' .. name)
    local ufield = UE.Field.Load(path, true)
    if not ufield then
        error('load ' .. path .. ' fail!', 2)
    end
    local luaclass = UEClassToJSClass(ufield)
    rawset(luaclass, '__puerts_ufield', ufield)
    local parent = rawget(cls, '__parent')
    if parent then
        rawset(luaclass, '__parent', parent)
        rawset(luaclass, '__name', name)
        rawset(parent, name, luaclass)
    end
    return luaclass
end

local node_mt = {
    __index = function(node, name)
        if name == '__parent' or name == '__path' or type(name) ~= 'string' then
            return nil
        end
        if rawget(node, '__type') == TENUM then
            local res = create_node(name, node, TNAMESPACE)
            rawset(node, name, res)
            return blueprint_load(res)
        end
        local newType = rawget(node, '__type')
        if newType == TNAMESPACE then
            local obj = UE.Object.Load(node_path(node, '/' .. name .. '.' .. name), true)
            if obj then
                local typeName = obj:GetClass():GetName()
                if typeName == 'UserDefinedEnum' then
                    newType = TENUM
                elseif typeName == 'UserDefinedStruct' then
                    newType = TSTRUCT
                else
                    newType = TBLUEPRINT
                end
            end
        end
        local res = create_node(name, node, newType)
        rawset(node, name, res)
        return res
    end,
}

create_node = function(path, parent, nodeType)
    return setmetatable({ __path = path, __parent = parent, __type = nodeType }, node_mt)
end

rawset(UE, 'Game', create_node('Game', nil, TNAMESPACE))

local bpns = { Game = true }

function blueprint.namespace(ns)
    if not bpns[ns] then
        rawset(UE, ns, create_node(ns, nil, TNAMESPACE))
        bpns[ns] = true
    end
end

function blueprint.unload(cls)
    if rawget(cls, '__puerts_ufield') then
        rawset(cls, '__puerts_ufield', nil)
        local parent = rawget(cls, '__parent')
        if parent then
            rawset(parent, rawget(cls, '__name'), create_node(rawget(cls, '__name'), parent, TNAMESPACE))
        end
    end
end

blueprint.load = blueprint_load
blueprint.tojs = UEClassToJSClass
puerts.blueprint = blueprint

-- containers
local newContainer = __tgjsNewContainer
__tgjsNewContainer = nil

local function translateType(t)
    if type(t) == 'number' then
        return t
    end
    local ufield = type(t) == 'table' and rawget(t, '__puerts_ufield') or nil
    if ufield then
        return ufield
    end
    return t.StaticClass()
end

rawset(UE, 'BuiltinBool', 0)
rawset(UE, 'BuiltinByte', 1)
rawset(UE, 'BuiltinInt', 2)
rawset(UE, 'BuiltinFloat', 3)
rawset(UE, 'BuiltinDouble', 4)
rawset(UE, 'BuiltinInt64', 5)
rawset(UE, 'BuiltinString', 6)
rawset(UE, 'BuiltinText', 7)
rawset(UE, 'BuiltinName', 8)

rawset(UE, 'NewArray', function(t1) return newContainer(0, translateType(t1)) end)
rawset(UE, 'NewSet', function(t1) return newContainer(1, translateType(t1)) end)
rawset(UE, 'NewMap', function(t1, t2) return newContainer(2, translateType(t1), translateType(t2)) end)

-- delegates
puerts.toManualReleaseDelegate = function(x) return x end
puerts.toDelegate = function(o, k) return { o, k } end

---------------------------------------------------------------------------------------------------------------------------
-- the helpers used by the host
---------------------------------------------------------------------------------------------------------------------------
function puerts.__mergePrototype(from, to, exclude)
    for k, v in pairs(from) do
        if exclude == nil or exclude[k] == nil then
            rawset(to, k, v)
        end
    end
end

-- the list of the functions bound to a multicast delegate (a sequence)
function puerts.__removeListItem(list, item)
    for i = 1, #list do
        if list[i] == item then
            tremove(list, i)
            return
        end
    end
end

function puerts.__genListApply(lst)
    return function(...)
        local list = { unpack(lst) }
        local ret
        for i = 1, #list do
            ret = list[i](...)
        end
        return ret
    end
end

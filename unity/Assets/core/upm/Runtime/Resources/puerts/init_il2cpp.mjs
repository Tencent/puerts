/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
 * This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
 */

var global = global || globalThis || (function () { return this; }());
// polyfill old code after use esm module.
global.global = global;

let puer = global.puer = global.puerts = global.puer || global.puerts || {};

const EXPERIMENTAL_IL2CPP_PUERTS = true;

puer.loadType = function(nameOrCSType) {
    let csType = nameOrCSType
    if (typeof nameOrCSType == "string") {
        csType = jsEnv.GetTypeByString(nameOrCSType)
    }
    if (csType) {
        let cls = loadType(csType)
        cls.__p_innerType = csType
        // todo
        cls.__puertsMetadata = cls.__puertsMetadata || new Map();
        return cls
    }
}

let BindingFlags = puer.loadType("System.Reflection.BindingFlags")
let GET_MEMBER_FLAGS = BindingFlags.DeclaredOnly | BindingFlags.Instance | BindingFlags.Static | BindingFlags.Public;
puer.getNestedTypes = function(nameOrCSType) {
    let csType = nameOrCSType
    if (typeof nameOrCSType == "string") {
        csType = jsEnv.GetTypeByString(nameOrCSType)
    }
    if (csType) {
        return csType.GetNestedTypes(GET_MEMBER_FLAGS)
    }
}


let System_Array = puer.loadType("System.Array")
let System_Array_CreateInstance = System_Array.CreateInstance
function jsArrToCsArr(jsarr, type) {
    type = type || puer.$typeof(CS.System.Object)
    let arr = System_Array_CreateInstance(type, jsarr.length)
    for (let i = 0; i < arr.Length; i++) {
        arr.SetValue(jsarr[i], i)
    }
    return arr
}

let MemberTypes = puer.loadType("System.Reflection.MemberTypes")
let MemberTypes_Method = MemberTypes.Method
let GENERIC_INVOKE_ERR_ARG_CHECK_FAILED = {}
puer.getGenericMethod = function(csType, methodName, ...genericArgs) {
    let members = csType.GetMember(methodName, MemberTypes_Method, GET_MEMBER_FLAGS);
    let typeof_System_RuntimeType = puer.$typeof(CS.System.Type)
    let overloadfunctions = [];
    for (let i = 0; i < members.Length; i++) {
        let method = members.GetValue(i)
        if (method.IsGenericMethodDefinition && method.GetGenericArguments().Length == genericArgs.length) {
            let methodImpl = EXPERIMENTAL_IL2CPP_PUERTS
                ? method.MakeGenericMethod(jsArrToCsArr(genericArgs.map(x => puer.$typeof(x)), typeof_System_RuntimeType))
                : method.MakeGenericMethod(...genericArgs.map(x => puer.$typeof(x)))
            overloadfunctions.push({method : methodImpl})
        }
    }
    if (overloadfunctions.length == 0) {
        console.error("puer.getGenericMethod not found", csType.Name, methodName, genericArgs.map(x => puer.$typeof(x).Name).join(","))
        return null
    }
    let createOverloadFunctionWrap = function(o) {
        let argIsOut = []
        let typeof_System_Object = puer.$typeof(CS.System.Object)
        let paramsd = o.method.GetParameters();
        let argCount = paramsd.Length
        for (let i = 0; i < paramsd.Length; i++) {
            // TODO ref support
            if (paramsd.GetValue(i).IsOut || paramsd.GetValue(i).ParameterType.IsByRef)
                argIsOut[i] = true
        }
        let argscs = System_Array_CreateInstance(typeof_System_Object, argCount) 
        o.checkArgs = function (...args) {
            // TODO check arg types
            if (argCount != (args ? args.length : 0)) return GENERIC_INVOKE_ERR_ARG_CHECK_FAILED
            if (argCount == 0) return null
            for (let i = 0; i < argCount; i++) {
                argscs.SetValue(argIsOut[i] ? null : args[i], i)
            }
            return argscs;
        }
        o.invoke = function (...args) {
            let argscs = o.checkArgs(...args)
            if (argscs === GENERIC_INVOKE_ERR_ARG_CHECK_FAILED)
                return GENERIC_INVOKE_ERR_ARG_CHECK_FAILED
            let ret = o.method.Invoke(this, 0, null, argscs, null)
            for (let i = 0; i < argIsOut.length; i++) {
                if (argIsOut[i])
                    args[i].value = argscs.GetValue(i)
            }
            return ret
        }
        return o.invoke
    }
    let invokes = overloadfunctions.map(x => createOverloadFunctionWrap(x))
    if (invokes.length == 1) {
        return invokes[0];
    } else {
        return function(...args) {
            for (let i = 0; i < invokes.length; i++) {
                let ret = invokes[i].call(this, ...args)
                if (ret === GENERIC_INVOKE_ERR_ARG_CHECK_FAILED)
                    continue
                return ret;
            }
            console.error("puer.getGenericMethod.overloadfunctions.invoke no match overload")
        }
    }
}

puer.getLastException = function() {
    // todo
}
puer.evalScript = eval

let loader = jsEnv.GetLoader();
function loadFile(path) {
    let resolved, content
    if (resolved = loader.Resolve(path)) {
        let contents = []
        loader.ReadFile(resolved, contents);
        content = contents[0]
    }
    return { content: content, debugPath: resolved };
}
puer.loadFile = loadFile;

puer.fileExists = loader.Resolve.bind(loader);

// TODO: temporary polyfill Array.get_Item used in csharp.mjs
let proto_System_Array = System_Array.prototype
proto_System_Array.get_Item = proto_System_Array.GetValue




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

puer.loadType = function(nameOrCSType, ...genericArgs) {
    let csType = nameOrCSType
    if (typeof nameOrCSType == "string") { // convert string to csType
        csType = jsEnv.GetTypeByString(nameOrCSType)
    }
    if (csType) {
        if (genericArgs && csType.IsGenericTypeDefinition) {
            genericArgs = genericArgs.map(g => puer.$typeof(g));
            csType = csType.MakeGenericType(...genericArgs);
        }
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

function jsArrToCsArr(jsarr, type) {
    type = type || puer.$typeof(CS.System.Object)
    let arr = CS.System.Array.CreateInstance(type, jsarr.length)
    for (let i = 0; i < arr.Length; i++) {
        arr.SetValue(jsarr[i], i)
    }
    return arr
}

let MemberTypes = puer.loadType("System.Reflection.MemberTypes")
let MemberTypes_Method = MemberTypes.Method
let GENERIC_INVOKE_ERR_ARG_CHECK_FAILED = {}
let ARG_FLAG_OUT = 0x01
let ARG_FLAG_REF = 0x02
puer.getGenericMethod = function(csType, methodName, ...genericArgs) {
    if (!csType || (typeof csType.GetMember != 'function')) {
        throw new Error('the class must be a constructor');
    }
    let members = CS.Puerts.Utils.GetMethodAndOverrideMethodByName(csType, methodName);
    let overloadFunctions = [];
    for (let i = 0; i < members.Length; i++) {
        let method = members.GetValue(i)
        if (method.IsGenericMethodDefinition && method.GetGenericArguments().Length == genericArgs.length) {
            let methodImpl = method.MakeGenericMethod(...genericArgs.map((x, index) => {
                const ret = puer.$typeof(x);
                if (!ret) {
                    throw new Error("invalid Type for generic arguments " + index);
                }
                return ret;
            }))
            overloadFunctions.push(methodImpl)
        }
    }
    let overloadCount = overloadFunctions.length
    if (overloadCount == 0) {
        console.error("puer.getGenericMethod not found", csType.Name, methodName, genericArgs.map(x => puer.$typeof(x).Name).join(","))
        return null
    }
    let createOverloadFunctionWrap = function(method) {
        let typeof_System_Object = puer.$typeof(CS.System.Object)
        let paramDefs = method.GetParameters();
        let needArgCount = paramDefs.Length
        let argFlags = needArgCount > 0 ? [] : null;
        let needArgTypeCode = needArgCount > 0 ? [] : null;
        for (let i = 0; i < paramDefs.Length; i++) {
            let paramDef = paramDefs.GetValue(i)
            let paramType = paramDef.ParameterType
            if (paramDef.IsOut) argFlags[i] = (argFlags[i] ?? 0) | ARG_FLAG_OUT
            if (paramType.IsByRef) {
                argFlags[i] = (argFlags[i] ?? 0) | ARG_FLAG_REF
                needArgTypeCode[i] = CS.System.Type.GetTypeCode(paramType.GetElementType())
            } else {
                needArgTypeCode[i] = CS.System.Type.GetTypeCode(paramType)
            }
        }
        let argsCsArr
        let checkArgs = function (...args) {
            if (needArgCount != (args ? args.length : 0)) return GENERIC_INVOKE_ERR_ARG_CHECK_FAILED
            if (needArgCount == 0) return null
            argsCsArr = argsCsArr ?? CS.System.Array.CreateInstance(typeof_System_Object, needArgCount)
            // set args to c# array
            for (let i = 0; i < needArgCount; i++) {
                let val = (argFlags[i] & ARG_FLAG_REF)
                    ? (argFlags[i] & ARG_FLAG_OUT 
                        ? null 
                        : puer.$unref(args[i])) 
                    : args[i]
                let jsValType = typeof val
                if (jsValType === "number" || jsValType == 'bigint') {
                    argsCsArr.set_Item(i, createTypedValueByTypeCode(val, needArgTypeCode[i]))
                } else {
                    argsCsArr.set_Item(i, val)
                }
            }
            return argsCsArr;
        }
        let invoke = function (...args) {
            let argscs = checkArgs(...args)
            if (argscs === GENERIC_INVOKE_ERR_ARG_CHECK_FAILED)
                return overloadCount == 1 ? undefined : GENERIC_INVOKE_ERR_ARG_CHECK_FAILED
            let ret = method.Invoke(this, 0, null, argscs, null)
            // set args to js array for ref type
            if (argFlags) {
                for (let i = 0; i < argFlags.length; i++) {
                    if (argFlags[i] & ARG_FLAG_REF)
                        args[i][0] = argscs.GetValue(i)
                }
            }
            return ret
        }
        return invoke
    }
    let invokes = overloadFunctions.map(x => createOverloadFunctionWrap(x))
    if (overloadCount == 1) {
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
// function loadFile(path) {
//     let resolved, content
//     if (resolved = loader.Resolve(path)) {
//         let contents = []
//         loader.ReadFile(resolved, contents);
//         content = contents[0]
//     }
//     return { content: content, debugPath: resolved };
// }
// puer.loadFile = loadFile;

// puer.fileExists = loader.Resolve.bind(loader);
function loadFile(path) {
    let debugPath = {};
    var content = loader.ReadFile(path, debugPath);
    return { content: content, debugPath: debugPath.value };
}
puer.loadFile = loadFile;

puer.fileExists = loader.FileExists.bind(loader);

global.__tgjsRegisterTickHandler = function(fn) {
    fn = new CS.System.Action(fn);
    jsEnv.TickHandler = CS.System.Delegate.Combine(jsEnv.TickHandler, fn)
}

function createTypedValueByTypeCode(value, typecode) {
    switch (typecode) {
        case CS.System.TypeCode.Char: return new CS.Puerts.CharValue(value);
        case CS.System.TypeCode.SByte: return new CS.Puerts.SByteValue(value);
        case CS.System.TypeCode.Byte: return new CS.Puerts.ByteValue(value);
        case CS.System.TypeCode.Int16: return new CS.Puerts.Int16Value(value);
        case CS.System.TypeCode.UInt16: return new CS.Puerts.UInt16Value(value);
        case CS.System.TypeCode.Int32: return new CS.Puerts.Int32Value(value);
        case CS.System.TypeCode.UInt32: return new CS.Puerts.UInt32Value(value);
        case CS.System.TypeCode.Int64: return new CS.Puerts.Int64Value(value);
        case CS.System.TypeCode.UInt64: return new CS.Puerts.UInt64Value(value);
        case CS.System.TypeCode.Single: return new CS.Puerts.FloatValue(value);
        case CS.System.TypeCode.Double: return new CS.Puerts.DoubleValue(value);
        default: return value;
    }
}
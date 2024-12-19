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
        let cls = loadType(csType);
        if (!cls) {
            console.warn(`load ${csType.Name || csType} fail!`);
            return;
        }
        cls.__p_innerType = csType;
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

puer.createFunction = global.createFunction;
global.createFunction = undefined;

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
    return puer.createFunction(...overloadFunctions);
}

puer.getLastException = global.__puertsGetLastException
global.__puertsGetLastException = undefined;

puer.evalScript = global.__tgjsEvalScript || function (script, debugPath) {
    return eval(script);
}
global.__tgjsEvalScript = undefined;

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
    let debugPath = [];
    var content = loader.ReadFile(path, debugPath);
    return { content: content, debugPath: debugPath[0] };
}
puer.loadFile = loadFile;

puer.fileExists = loader.FileExists.bind(loader);

global.__tgjsRegisterTickHandler = function(fn) {
    fn = new CS.System.Action(fn);
    jsEnv.TickHandler = CS.System.Delegate.Combine(jsEnv.TickHandler, fn)
}


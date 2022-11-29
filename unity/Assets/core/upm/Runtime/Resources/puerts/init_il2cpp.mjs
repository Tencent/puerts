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

puer.loadType = function(nameOrCSType) {
    let csType = nameOrCSType
    if (typeof nameOrCSType == "string") {
        csType = jsEnv.GetTypeByString(nameOrCSType)
    }
    if (csType) {
        var cls = loadType(csType)
        // todo
        cls.__puertsMetadata = cls.__puertsMetadata || new Map();
        return cls
    }
}

puer.getNestedTypes = function() {
    // todo
}
puer.getGenericMethod = function() {
    // todo
}
puer.getLastException = function() {
    // todo
}
puer.evalScript = global.jsEnv.Eval || function (script, debugPath) {
    return eval(script);
}

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

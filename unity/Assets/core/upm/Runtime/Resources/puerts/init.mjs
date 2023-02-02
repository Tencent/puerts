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

puer.loadType = global.__tgjsLoadType;
delete global.__tgjsLoadType;
puer.getNestedTypes = global.__tgjsGetNestedTypes;
delete global.__tgjsGetNestedTypes;
puer.getGenericMethod = global.__tgjsGetGenericMethod;
delete global.__tgjsGetGenericMethod;

puer.evalScript = global.__tgjsEvalScript || function (script, debugPath) {
    return eval(script);
}
delete global.__tgjsEvalScript;

puer.getLastException = global.__puertsGetLastException
delete global.__puertsGetLastException;

let loader = global.__tgjsGetLoader();
delete global.__tgjsGetLoader;

function loadFile(path) {
    let debugPath = [];
    var content = loader.ReadFile(path, debugPath);
    return { content: content, debugPath: debugPath[0] };
}
puer.loadFile = loadFile;

puer.fileExists = loader.FileExists.bind(loader);
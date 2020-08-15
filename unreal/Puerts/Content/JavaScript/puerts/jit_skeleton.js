/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

let puerts = require("puerts");

let loadedModules = Object.create(null);

puerts.registerRequestHandler('requestModuleMethod', (data, onFinished) => {
    let split = data.indexOf('#');
    let split2 = data.indexOf('#', split + 1);
    let moduleName = data.substring(0, split);
    let moduleMethodName = data.substring(split + 1, split2);
    let invokeArgs = data.substring(split2 + 1);
    let module = loadedModules[moduleName];
    if (!module) {
        module = require(moduleName);
        loadedModules[moduleName] = module;
    }
    let method = module[moduleMethodName];
    let args = JSON.parse(invokeArgs);
    let result = method.apply(module, args);
    onFinished(undefined, JSON.stringify(result));
});

console.log("jit_skeleton.js loaded!!");

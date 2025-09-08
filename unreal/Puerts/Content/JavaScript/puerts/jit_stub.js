/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

var global = global || (function () { return this; }());
(function (global) {
    "use strict";
    
    let requestJitModuleMethod = global.__tgjsRequestJitModuleMethod;
    global.__tgjsRequestJitModuleMethod = undefined;
    
    puerts.requestJitModuleMethod = function(moduleName, methodName, callback, ... args) {
        let data = moduleName + "#" + methodName + "#" + JSON.stringify(args);
        requestJitModuleMethod(data, (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback(undefined, JSON.parse(result));
            }
        });
    }
}(global));

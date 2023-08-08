/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

var global = global || (function () { return this; }());
(function (global) {
    "use strict";
    
    function pathBasename(path) {
        const regex = /^(.*[\/\\])?(.+)$/;
        const match = path.match(regex);
        return match ? match[2] : '';
    }

    function pathDirname(path) {
        const regex = /^(.*[\/\\])?/;
        const match = path.match(regex);
        return match ? (match[1] || '.').replace(/[\/\\]$/, '') : '.';
    }
    
    const org_load = global.puerts.load;
    const dll_ext = global.puerts.dll_ext;
    const moduleCache = {};
    
    function load(filepath) {
        const iswin = dll_ext === '.dll';
        const filename = pathBasename(filepath);
        if (filepath && typeof filepath === 'string' && filename.indexOf('.') === -1) {
            const prefix = iswin ? '' : 'lib';
            filepath = `${pathDirname(filepath)}${iswin? '\\' : '/'}${prefix}${filename}${dll_ext}`;
        }
        if (!(filepath in moduleCache)) {
            const module_name = org_load(filepath);
            moduleCache[filepath] = new Proxy({__name : module_name}, {
                get: function(classCache, className) {
                    if (!(className in classCache)) {
                        classCache[className] = puerts.loadCPPType(`${module_name}.${className}`);
                    }
                    return classCache[className];
                }
            });
        }
        return moduleCache[filepath];
    }
    
    global.puerts.load = load;
    
}(global));

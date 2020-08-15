/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

var global = global || (function () { return this; }());
(function (global) {
    "use strict";
    let puerts = global.puerts = global.puerts || {};
    
    let sendRequestSync = puerts.sendRequestSync;

    function normalize(name) {
        if ('./' === name.substr(0,2)) {
            name = name.substr(2);
        }
        return name;
    }

    let evalScript = global.__tgjsEvalScript || function(script, debugPath) {
        return eval(script);
    }
    global.__tgjsEvalScript = undefined;
    
    let loadModule = global.__tgjsLoadModule || function(moduleName, requiringDir) {
        return sendRequestSync('loadModule', moduleName + '#' + requiringDir);
    }
    global.__tgjsLoadModule = undefined;
    
    let findModule = global.__tgjsFindModule;
    global.__tgjsFindModule = undefined;

    let moduleCache = Object.create(null);
    let buildinModule = Object.create(null);
    function executeModule(fullPath, script, debugPath) {
        let fullPathInJs = fullPath.replace(/\\/g, '\\\\');
        let fullDirInJs = (fullPath.indexOf('/') != -1) ? fullPath.substring(0, fullPath.lastIndexOf("/")) : fullPath.substring(0, fullPath.lastIndexOf("\\")).replace(/\\/g, '\\\\');
        let executeScript = "(function() { var __filename = '"
            + fullPathInJs + "', __dirname = '"
            + fullDirInJs + "', exports ={}, module =  { exports : exports, filename : __filename }; (function (exports, require, console, prompt) { "
            + script + "\n})(exports, puerts.genRequire('"
            + fullDirInJs + "'), puerts.console); return module.exports})()";
        return evalScript(executeScript, debugPath);
    }
    
    function genRequire(requiringDir) {
        let localModuleCache = Object.create(null);
        function require(moduleName) {
            moduleName = normalize(moduleName);
            if (moduleName in localModuleCache) return localModuleCache[moduleName];
            if (moduleName in buildinModule) return buildinModule[moduleName];
            let nativeModule = findModule(moduleName);
            if (nativeModule) {
                buildinModule[moduleName] = nativeModule;
                return nativeModule;
            }
            let moduleInfo = loadModule(moduleName, requiringDir);
            let split = moduleInfo.indexOf('\n');
            let split2 = moduleInfo.indexOf('\n', split + 1);
            let fullPath = moduleInfo.substring(0, split);
            let debugPath = moduleInfo.substring(split + 1, split2);
            let script = moduleInfo.substring(split2 + 1);
            let key = fullPath;
            if (key in moduleCache) {
                localModuleCache[moduleName] = moduleCache[key];
                return localModuleCache[moduleName];
            }
            let m
            if (fullPath.endsWith("package.json")) {
                let packageConfigure = JSON.parse(script);
                let fullDirInJs = (fullPath.indexOf('/') != -1) ? fullPath.substring(0, fullPath.lastIndexOf("/")) : fullPath.substring(0, fullPath.lastIndexOf("\\")).replace(/\\/g, '\\\\');
                let tmpRequire = genRequire(fullDirInJs);
                m = tmpRequire(packageConfigure.main);
            } else {
                m = executeModule(fullPath, script, debugPath);
            }
            localModuleCache[moduleName] = m;
            moduleCache[key] = m;
            return m;
        }

        return require;
    }
    
    function registerBuildinModule(name, module) {
        buildinModule[name] = module;
    }
    
    registerBuildinModule("puerts", puerts)

    puerts.genRequire = genRequire;
    
    puerts.registerBuildinModule = registerBuildinModule;

    puerts.loadModule = loadModule;
}(global));

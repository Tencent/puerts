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
    
    let tmpModuleStorage = [];
    
    function addModule(m) {
        for (var i = 0; i < tmpModuleStorage.length; i++) {
            if (!tmpModuleStorage[i]) {
                tmpModuleStorage[i] = m;
                return i;
            }
        }
        return tmpModuleStorage.push(m) - 1;
    }
    
    function getModuleBySID(id) {
        return tmpModuleStorage[id];
    }

    let moduleCache = Object.create(null);
    let buildinModule = Object.create(null);
    function executeModule(fullPath, script, debugPath, sid) {
        sid = (typeof sid == 'undefined') ? 0 : sid;
        let fullPathInJs = fullPath.replace(/\\/g, '\\\\');
        let fullDirInJs = (fullPath.indexOf('/') != -1) ? fullPath.substring(0, fullPath.lastIndexOf("/")) : fullPath.substring(0, fullPath.lastIndexOf("\\")).replace(/\\/g, '\\\\');
        let exports = {};
        let module = puerts.getModuleBySID(sid);
        module.exports = exports;
        let wrapped = evalScript(
            // Wrap the script in the same way NodeJS does it. It is important since IDEs (VSCode) will use this wrapper pattern
            // to enable stepping through original source in-place.
            "(function (exports, require, module, __filename, __dirname) { " + script + "\n});", 
            debugPath
        )
        wrapped(exports, puerts.genRequire(fullDirInJs), module, fullPathInJs, fullDirInJs)
        return module.exports;
    }
    
    function genRequire(requiringDir) {
        let localModuleCache = Object.create(null);
        function require(moduleName) {
            moduleName = normalize(moduleName);
            let forceReload = false;
            if ((moduleName in localModuleCache)) {
                let m = localModuleCache[moduleName];
                if (!m.__forceReload) {
                    return localModuleCache[moduleName].exports;
                } else {
                    forceReload = true;
                }
            }
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
            if ((key in moduleCache) && !forceReload) {
                localModuleCache[moduleName] = moduleCache[key];
                return localModuleCache[moduleName].exports;
            }
            let m = {"exports":{}};
            localModuleCache[moduleName] = m;
            moduleCache[key] = m;
            let sid = addModule(m);
            if (fullPath.endsWith(".json")) {
                let packageConfigure = JSON.parse(script);
                
                if (fullPath.endsWith("package.json") && packageConfigure.main) {
                    let fullDirInJs = (fullPath.indexOf('/') != -1) ? fullPath.substring(0, fullPath.lastIndexOf("/")) : fullPath.substring(0, fullPath.lastIndexOf("\\")).replace(/\\/g, '\\\\');
                    let tmpRequire = genRequire(fullDirInJs);
                    let r = tmpRequire(packageConfigure.main);
                    tmpModuleStorage[sid] = undefined;
                    m.exports = r;
                } else {
                    tmpModuleStorage[sid] = undefined;
                    m.exports = packageConfigure;
                }
            } else {
                executeModule(fullPath, script, debugPath, sid);
                tmpModuleStorage[sid] = undefined;
            }
            return m.exports;
        }

        return require;
    }
    
    function registerBuildinModule(name, module) {
        buildinModule[name] = module;
    }
    
    function reload(reloadModuleKey) {
        if (reloadModuleKey) {
            reloadModuleKey = normalize(reloadModuleKey);
        }
        let reloaded = false;
        for(var moduleKey in moduleCache) {
            if (!reloadModuleKey || (reloadModuleKey == moduleKey)) {
                moduleCache[moduleKey].__forceReload = true;
                reloaded = true;
                if (reloadModuleKey) break;
            }
        }
        if (!reloaded && reloadModuleKey) {
            console.warn(`reload not loaded module: ${reloadModuleKey}!`);
        }
    }
    
    registerBuildinModule("puerts", puerts)

    puerts.genRequire = genRequire;
    
    puerts.__require = genRequire("");
    
    puerts.__reload = reload;
    
    puerts.getModuleBySID = getModuleBySID;
    
    puerts.registerBuildinModule = registerBuildinModule;

    puerts.loadModule = loadModule;
}(global));

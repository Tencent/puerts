/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
 * This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
 */

var global = global || globalThis || (function () { return this; }());
    
let moduleCache = Object.create(null); // key to sid
let tmpModuleStorage = []; // sid to module

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

let buildinModule = Object.create(null);
function executeModule(fullPath, script, debugPath, sid) {
    sid = (typeof sid == 'undefined') ? 0 : sid;
    let fullPathInJs = fullPath.replace(/\\/g, '\\\\');
    let fullDirInJs = (fullPath.indexOf('/') != -1) ? fullPath.substring(0, fullPath.lastIndexOf("/")) : fullPath.substring(0, fullPath.lastIndexOf("\\")).replace(/\\/g, '\\\\');
    let exports = {};
    let module = puerts.getModuleBySID(sid);
    module.exports = exports;
    let wrapped = puerts.evalScript(
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
        moduleName = moduleName.startsWith('./') ? moduleName.substr(2) : moduleName;
        if (moduleName in localModuleCache) return localModuleCache[moduleName].exports;
        if (moduleName in buildinModule) return buildinModule[moduleName];
        
        let fullPath = puerts.searchModule(requiringDir, moduleName);
        if (!fullPath) {
            try {
                return nodeRequire(moduleName);
                
            } catch(e) {
                throw new Error("can not find " + moduleName);
            }
        }

        let key = fullPath;
        if (key in moduleCache) {
            localModuleCache[moduleName] = moduleCache[key];
            return localModuleCache[moduleName].exports;
        }
        
        let {context, debugPath} = puerts.loadFile(fullPath);
        const script = context;

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
                return r;
            } else {
                tmpModuleStorage[sid] = undefined;
                m.exports = packageConfigure;
                return packageConfigure;
            }
        } else {
            executeModule(fullPath, script, debugPath, sid);
            tmpModuleStorage[sid] = undefined;
            return m.exports;
        }
    }
    require.clearModuleCache = () => {
        localModuleCache = Object.create(null);
    }

    return require;
}

function registerBuildinModule(name, module) {
    buildinModule[name] = module;
}

registerBuildinModule("puerts", puerts)

puerts.genRequire = genRequire;

puerts.getModuleBySID = getModuleBySID;

puerts.registerBuildinModule = registerBuildinModule;

let nodeRequire = global.require;
if (nodeRequire) {
    global.require = global.puertsRequire = genRequire("");
    global.nodeRequire = nodeRequire;
} else {
    global.require = genRequire("");
}

function clearModuleCache () {
    tmpModuleStorage = [];
    moduleCache = Object.create(null);
    global.require.clearModuleCache();
}
global.clearModuleCache = clearModuleCache;

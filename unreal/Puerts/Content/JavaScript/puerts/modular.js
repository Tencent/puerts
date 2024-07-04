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
    
    let loadModule = global.__tgjsLoadModule;
    global.__tgjsLoadModule = undefined;
    
    let searchModule = global.__tgjsSearchModule;
    global.__tgjsSearchModule = undefined;
    
    let org_require = global.require;
    
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
    function executeModule(fullPath, script, debugPath, sid, isESM, bytecode) {
        sid = (typeof sid == 'undefined') ? 0 : sid;
        let fullPathInJs = fullPath.replace(/\\/g, '\\\\');
        let fullDirInJs = (fullPath.indexOf('/') != -1) ? fullPath.substring(0, fullPath.lastIndexOf("/")) : fullPath.substring(0, fullPath.lastIndexOf("\\")).replace(/\\/g, '\\\\');
        let exports = {};
        let module = puerts.getModuleBySID(sid);
        module.exports = exports;
        let wrapped = evalScript(
            // Wrap the script in the same way NodeJS does it. It is important since IDEs (VSCode) will use this wrapper pattern
            // to enable stepping through original source in-place.
            (isESM || bytecode) ? script: "(function (exports, require, module, __filename, __dirname) { " + script + "\n});", 
            debugPath, isESM, fullPath, bytecode
        )
        if (isESM) return wrapped;
        wrapped(exports, puerts.genRequire(fullDirInJs), module, fullPathInJs, fullDirInJs)
        return module.exports;
    }
    
    function getESMMain(script) {
        let packageConfigure = JSON.parse(script);
        return (packageConfigure && packageConfigure.type === "module") ? packageConfigure.main : undefined;
    }
    
    function getSourceLengthFromBytecode(buf, isESM) {
        let sourceHash = (new Uint32Array(buf))[2];
        //console.log(`sourceHash:${sourceHash}`);
        const kModuleFlagMask = (1 << 31);
        const mask = isESM ? kModuleFlagMask : 0;

        // Remove the mask to get the original length
        const length = sourceHash & ~mask;

        return length;
    }
    
    let baseString
    function generateEmptyCode(length) {
        if (baseString === undefined) {
            baseString = " ".repeat(128*1024);
        }
        if (length <= baseString.length) {
            return baseString.slice(0, length);
        } else {
            const fullString = baseString.repeat(Math.floor(length / baseString.length));
            const remainingLength = length % baseString.length;
            return fullString.concat(baseString.slice(0, remainingLength));
        }
    }
    
    function genRequire(requiringDir, outerIsESM) {
        let localModuleCache = Object.create(null);
        function require(moduleName) {
            if (org_require) {
                try {
                    return org_require(moduleName);
                } catch (e) {}
            }
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
            let moduleInfo = searchModule(moduleName, requiringDir);
            if (!moduleInfo) {
                throw new Error(`can not find ${moduleName} in ${requiringDir}`);
            }
            
            let [fullPath, debugPath] = moduleInfo;
            if(debugPath.startsWith("Pak: ")){
                debugPath = fullPath
            }
            
            let key = fullPath;
            if ((key in moduleCache) && !forceReload) {
                localModuleCache[moduleName] = moduleCache[key];
                return localModuleCache[moduleName].exports;
            }
            let m = {"exports":{}};
            localModuleCache[moduleName] = m;
            moduleCache[key] = m;
            let sid = addModule(m);
            let isESM = outerIsESM === true || fullPath.endsWith(".mjs") || fullPath.endsWith(".mbc");
            if (fullPath.endsWith(".cjs") || fullPath.endsWith(".cbc")) isESM = false;
            let script = isESM ? undefined : loadModule(fullPath);
            let bytecode = undefined;
            if (fullPath.endsWith(".mbc") || fullPath.endsWith(".cbc")) {
                bytecode = script;
                script = generateEmptyCode(getSourceLengthFromBytecode(bytecode));
            }
            try {
                if (fullPath.endsWith(".json")) {
                    let packageConfigure = JSON.parse(script);
                    
                    if (fullPath.endsWith("package.json")) {
                        isESM = packageConfigure.type === "module"
                        let url = packageConfigure.main || "index.js";
                        if (isESM) {
                            let packageExports = packageConfigure.exports && packageConfigure.exports["."];
                            if (packageExports)
                                url =
                                    (packageExports["default"] && packageExports["default"]["require"]) ||
                                    (packageExports["require"] && packageExports["require"]["default"]) ||
                                    packageExports["require"];                        
                            if (!url) {
                                throw new Error("can not require a esm in cjs module!");
                            }
                        }
                        let fullDirInJs = (fullPath.indexOf('/') != -1) ? fullPath.substring(0, fullPath.lastIndexOf("/")) : fullPath.substring(0, fullPath.lastIndexOf("\\")).replace(/\\/g, '\\\\');
                        let tmpRequire = genRequire(fullDirInJs, isESM);
                        let r = tmpRequire(url);
                        
                        m.exports = r;
                    } else {
                        m.exports = packageConfigure;
                    }
                } else {
                    let r = executeModule(fullPath, script, debugPath, sid, isESM, bytecode);
                    if (isESM) {
                        m.exports = r;
                    }
                }
            } catch(e) {
                localModuleCache[moduleName] = undefined;
                moduleCache[key] = undefined;
                throw e;
            } finally {
                tmpModuleStorage[sid] = undefined;
            }
            return m.exports;
        }

        return require;
    }
    
    function registerBuildinModule(name, module) {
        buildinModule[name] = module;
    }
    
    function forceReload(reloadModuleKey) {
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
    
    function getModuleByUrl(url) {
        if (url) {
            url = normalize(url);
            return moduleCache[url];
        }
    }
    
    registerBuildinModule("puerts", puerts)

    puerts.genRequire = genRequire;
    
    puerts.getESMMain = getESMMain;
    
    puerts.__require = genRequire("");
    
    global.require = puerts.__require;
    
    puerts.getModuleBySID = getModuleBySID;
    
    puerts.registerBuildinModule = registerBuildinModule;

    puerts.loadModule = loadModule;
    
    puerts.forceReload = forceReload;
    
    puerts.getModuleByUrl = getModuleByUrl;
    
    puerts.generateEmptyCode = generateEmptyCode;
}(global));

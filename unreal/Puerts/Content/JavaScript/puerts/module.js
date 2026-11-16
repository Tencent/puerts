/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
 * This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
 */

// the commonjs module system, ported from unity (upms/core/Runtime/Resources/puerts/module.mjs):
// - the path of a module is the specifier joined to the directory of the requiring module, without searching, the
//   extension must be written ("./foo.js", not "./foo"), puerts/module_node.js is an extension of node rules (loaded by
//   default in FJsEnv / FJsEnvGroup)
// - require is lazy by default: a proxy is returned and the module is loaded on its first use, require(specifier, true)
//   loads it immediately
// - the exports are cached weakly by default (a module is unloaded if no one refers to it, and loaded again on the next
//   require), a module exports `__auto_release: false` to be cached strongly; cached strongly by default on quickjs
// - *.mjs/*.mbc are esm, evaluated by the module loader of the backend synchronously
(function (puerts, global) {
    'use strict';

    const importSync = puerts.__importSync;
    const compileCjs = puerts.__compileCjs;
    const setModuleHooks = puerts.__setModuleHooks;
    const getBuiltinModule = puerts.__getBuiltinModule;
    const registerBuiltinModule = puerts.__registerBuiltinModule;
    const loadFile = puerts.__loadFile;
    for (const key of ['__importSync', '__compileCjs', '__setModuleHooks', '__getBuiltinModule', '__registerBuiltinModule',
        '__loadFile']) {
        delete puerts[key];
    }

    const CHAR_DOT = 46;
    const CHAR_FORWARD_SLASH = 47;
    const CHAR_BACKWARD_SLASH = 92;

    function isPathSeparator(code) {
        return code === CHAR_FORWARD_SLASH || code === CHAR_BACKWARD_SLASH;
    }

    function normalizeString(path, allowAboveRoot) {
        let res = '';
        let lastSegmentLength = 0;
        let lastSlash = -1;
        let dots = 0;
        let code = 0;
        for (let i = 0; i <= path.length; ++i) {
            if (i < path.length) {
                code = path.charCodeAt(i);
            } else if (isPathSeparator(code)) {
                break;
            } else {
                code = CHAR_FORWARD_SLASH;
            }

            if (isPathSeparator(code)) {
                if (lastSlash === i - 1 || dots === 1) {
                    // NOOP
                } else if (dots === 2) {
                    if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== CHAR_DOT ||
                        res.charCodeAt(res.length - 2) !== CHAR_DOT) {
                        if (res.length > 2) {
                            const lastSlashIndex = res.lastIndexOf('/');
                            if (lastSlashIndex === -1) {
                                res = '';
                                lastSegmentLength = 0;
                            } else {
                                res = res.slice(0, lastSlashIndex);
                                lastSegmentLength = res.length - 1 - res.lastIndexOf('/');
                            }
                            lastSlash = i;
                            dots = 0;
                            continue;
                        } else if (res.length !== 0) {
                            res = '';
                            lastSegmentLength = 0;
                            lastSlash = i;
                            dots = 0;
                            continue;
                        }
                    }
                    if (allowAboveRoot) {
                        res += res.length > 0 ? '/..' : '..';
                        lastSegmentLength = 2;
                    }
                } else {
                    if (res.length > 0) {
                        res += `/${path.slice(lastSlash + 1, i)}`;
                    } else {
                        res = path.slice(lastSlash + 1, i);
                    }
                    lastSegmentLength = i - lastSlash - 1;
                }
                lastSlash = i;
                dots = 0;
            } else if (code === CHAR_DOT && dots !== -1) {
                ++dots;
            } else {
                dots = -1;
            }
        }
        return res;
    }

    function normalizeAsPosix(path) {
        if (path.length === 0) {
            return '.';
        }
        const isAbsolute = isPathSeparator(path.charCodeAt(0));
        const trailingSeparator = isPathSeparator(path.charCodeAt(path.length - 1));
        path = normalizeString(path, !isAbsolute);
        if (path.length === 0) {
            if (isAbsolute) {
                return '/';
            }
            return trailingSeparator ? './' : '.';
        }
        if (trailingSeparator) {
            path += '/';
        }
        return isAbsolute ? `/${path}` : path;
    }

    function joinAsPosix(...args) {
        let joined;
        for (const arg of args) {
            if (arg.length > 0) {
                joined = joined === undefined ? arg : `${joined}/${arg}`;
            }
        }
        return joined === undefined ? '.' : normalizeAsPosix(joined);
    }

    function dirname(path) {
        let end = -1;
        let matchedSlash = true;
        for (let i = path.length - 1; i >= 0; --i) {
            if (isPathSeparator(path.charCodeAt(i))) {
                if (!matchedSlash) {
                    end = i;
                    break;
                }
            } else {
                matchedSlash = false;
            }
        }
        return end === -1 ? '' : path.slice(0, end);
    }

    function isBareName(specifier) {
        return !specifier.startsWith('./') && !specifier.startsWith('../') && !specifier.startsWith('/');
    }

    const hasWeakRef = typeof WeakRef === 'function';

    // path -> exports, weak (WeakRef) or strong
    class ModuleCache {
        constructor() {
            this.map = new Map();
        }

        // {value} if cached, undefined if not (or released)
        lookup(key) {
            const entry = this.map.get(key);
            if (entry === undefined) {
                return undefined;
            }
            if (!entry.isWeak) {
                return entry;
            }
            const value = entry.ref.deref();
            if (value === undefined) {
                this.map.delete(key);
                return undefined;
            }
            return { value };
        }

        set(key, value, isWeak) {
            const t = typeof value;
            // only an object can be referred weakly
            if (isWeak && hasWeakRef && ((t === 'object' && value !== null) || t === 'function')) {
                this.map.set(key, { ref: new WeakRef(value), isWeak: true });
            } else {
                this.map.set(key, { value, isWeak: false });
            }
        }

        get(key) {
            const entry = this.lookup(key);
            return entry && entry.value;
        }

        has(key) {
            return this.lookup(key) !== undefined;
        }

        delete(key) {
            return this.map.delete(key);
        }

        clear() {
            this.map.clear();
        }

        stat() {
            let res = 'key\tweak?\tvalid?\n';
            for (const [key, entry] of this.map) {
                res += `${key}\t${entry.isWeak}\t${!entry.isWeak || entry.ref.deref() !== undefined}\n`;
            }
            return res;
        }

        gc() {
            for (const [key, entry] of this.map) {
                if (entry.isWeak && entry.ref.deref() === undefined) {
                    this.map.delete(key);
                }
            }
        }
    }

    const exportsCache = new ModuleCache();
    // the modules being executed, for the cyclic requires
    const tmpModuleStorage = new Map();
    const builtinModules = new Map([['puerts', puerts]]);
    // weak by default, but not on quickjs: it frees an object as soon as its reference count is zero, the exports would be
    // released (and the module executed again) right after each use
    const isQuickJS = typeof scriptEnv === 'object' && scriptEnv !== null && typeof scriptEnv.isQuickJS === 'function' &&
        scriptEnv.isQuickJS();
    let defaultIsWeak = !isQuickJS;
    let resolveHook;

    // the builtin module (registered by registerBuildinModule, by the host or an addon loaded on its first use)
    function getBuiltin(name) {
        let m = builtinModules.get(name);
        if (m !== undefined) {
            return m;
        }
        if (name.indexOf('.') === -1 && name.indexOf('/') === -1 && name.indexOf('\\') === -1) {
            m = getBuiltinModule(name);
            if (m !== undefined) {
                builtinModules.set(name, m);
            }
        }
        return m;
    }

    function resolve(specifier, requiringDir) {
        if (resolveHook) {
            const path = resolveHook(specifier, requiringDir);
            if (typeof path === 'string') {
                return path;
            }
        }
        return joinAsPosix(requiringDir, specifier);
    }

    // loads (or gets the cached) module of the path, the specifier is for the require of node only
    function loadModule(fullPath, specifier) {
        const cached = exportsCache.lookup(fullPath);
        if (cached !== undefined) {
            return cached.value;
        }
        const tmpModule = tmpModuleStorage.get(fullPath);
        if (tmpModule) {
            return tmpModule.exports;
        }
        if (fullPath.endsWith('.mjs') || fullPath.endsWith('.mbc')) {
            // cached by the module loader of the backend
            return importSync(fullPath);
        }

        const file = loadFile(fullPath);
        if (file === undefined) {
            const nodeRequire = puerts.__nodeRequire;
            if (typeof nodeRequire === 'function' && specifier !== undefined && isBareName(specifier)) {
                return nodeRequire(specifier);
            }
            throw new Error(`load ${fullPath} fail!`);
        }

        const module = { exports: {} };
        tmpModuleStorage.set(fullPath, module);
        try {
            if (fullPath.endsWith('.json')) {
                module.exports = JSON.parse(file.content);
            } else {
                const debugPath = file.debugPath;
                // wrapped as node does, (exports, require, module, __filename, __dirname)
                const wrapped = compileCjs(file.content, debugPath, fullPath);
                const exports = module.exports;
                wrapped.call(exports, exports, createRequireOfDir(dirname(fullPath)), module, debugPath, dirname(debugPath));
            }
            const exports = module.exports;
            const t = typeof exports;
            const autoRelease = (t === 'object' && exports !== null) || t === 'function' ? exports.__auto_release : undefined;
            exportsCache.set(fullPath, exports, typeof autoRelease === 'boolean' ? autoRelease : defaultIsWeak);
        } catch (e) {
            exportsCache.delete(fullPath);
            throw e;
        } finally {
            tmpModuleStorage.delete(fullPath);
        }
        return module.exports;
    }

    function doRequire(target) {
        const m = target.__require(target.__specifier, true);
        const t = typeof m;
        if ((t === 'object' && m !== null) || t === 'function') {
            delete target.__specifier;
            delete target.__require;
            // faster than getters, but the exports can not be set by the requiring module (ts does not allow that either)
            Object.setPrototypeOf(target, m);
        }
        return m;
    }

    const lazyHandler = {
        get: function (target, name, receiver) {
            if (name === '__esModule') {
                return true;
            }
            const m = doRequire(target);
            return m === null || m === undefined ? undefined : Reflect.get(Object(m), name, receiver);
        },
        set: function (target, name) {
            throw new Error(`readonly property ${name}`);
        },
    };

    // the require of the modules in requiringDir, require(specifier, immediate)
    function createRequireOfDir(requiringDir) {
        function require(specifier, immediate) {
            if (typeof specifier !== 'string') {
                throw new TypeError(`the specifier of require must be a string, got ${typeof specifier}`);
            }
            const builtin = getBuiltin(specifier);
            if (builtin !== undefined) {
                return builtin;
            }
            if (immediate) {
                return loadModule(resolve(specifier, requiringDir), specifier);
            }
            const res = { __specifier: specifier, __require: require };
            Object.setPrototypeOf(res, new Proxy(res, lazyHandler));
            return res;
        }
        return require;
    }

    // the require of the module (path or url), as unity
    function createRequire(referrer) {
        const path = referrer.startsWith('file:') || referrer.startsWith('puer:') ? referrer.substr(5) : referrer;
        return createRequireOfDir(dirname(normalizeAsPosix(path)));
    }

    puerts.genRequire = function (dir) {
        return createRequireOfDir(dir ? normalizeAsPosix(dir) : '');
    };

    puerts.registerBuildinModule = function (name, value) {
        builtinModules.set(name, value);
        registerBuiltinModule(name, value);
    };

    function applyHooks() {
        // the require of the host (the entry module, the cjs imported by an esm), the path is resolved already
        setModuleHooks((path) => loadModule(path, path), resolveHook);
    }

    puerts.module = {
        createRequire,
        clearModuleCache: () => exportsCache.clear(),
        statModuleCache: () => exportsCache.stat(),
        gcModuleCache: () => exportsCache.gc(),
        deleteModuleCache: (path) => exportsCache.delete(path),
        hasModuleCache: (path) => exportsCache.has(path),
        // whether the exports are cached weakly if the module does not export __auto_release (true by default, false on quickjs)
        setDefaultAutoRelease: (isWeak) => {
            defaultIsWeak = !!isWeak;
        },
        // fn(specifier, requiringDir): the path of the module, or undefined for the default rule; used by require and import,
        // not called for the builtin modules
        setResolveHook: (fn) => {
            resolveHook = typeof fn === 'function' ? fn : undefined;
            applyHooks();
        },
        // {content, debugPath} of the path (relative to the script root), undefined if not found
        loadFile,
        joinPath: joinAsPosix,
        dirname,
    };

    global.require = createRequireOfDir('');
    applyHooks();
})(puerts, globalThis);

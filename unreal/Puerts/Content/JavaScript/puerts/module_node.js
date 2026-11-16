/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
 * This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
 */

// an extension of puerts/module.js: resolves the modules as node (and the old loader of puerts) does, for both require
// and import. FJsEnv / FJsEnvGroup (the JsEnv module) load it by default, FScriptEnv does not, load it once before Start
// (FScriptEnv::PreloadModule(TEXT("puerts/module_node.js"))) or at the beginning of the entry module, e.g.
//     puerts.genRequire('')('puerts/module_node.js', true);
// - the extension can be omitted: path, path.js, path.mjs, path.cjs, path.json (path.mbc, path.cbc for bytecode)
// - a directory: the entry of its package.json ("exports"["."] or "main"), or its index.js
// - a bare name ("foo", "foo/bar.js"): the requiring directory, the node_modules of it and its ancestors, the script root
// - the "type" of package.json is not supported: *.js is commonjs, *.mjs is esm
// every candidate is checked by reading the file, the results are cached (clearCache() to drop them), the webpack-like
// bundling is preferred for the large third party packages
'use strict';

const M = puerts.module;
const { loadFile, joinPath, dirname } = M;

const EXTENSIONS = ['.js', '.mjs', '.cjs', '.json', '.mbc', '.cbc'];
const INDEXES = ['index.js', 'index.mjs', 'index.cjs', 'index.json'];

// path -> whether the file exists
const existence = new Map();
// requiringDir + '\0' + specifier -> resolved path (null if not found)
const resolutions = new Map();

function exists(path) {
    let r = existence.get(path);
    if (r === undefined) {
        r = loadFile(path) !== undefined;
        existence.set(path, r);
    }
    return r;
}

function hasExtension(path) {
    const base = path.slice(path.lastIndexOf('/') + 1);
    return base.lastIndexOf('.') > 0;
}

function resolveFile(path) {
    if (hasExtension(path) && exists(path)) {
        return path;
    }
    for (const ext of EXTENSIONS) {
        if (exists(path + ext)) {
            return path + ext;
        }
    }
    return undefined;
}

// the entry of "exports"["."]: a string, or {require, default, import} (the first string of them)
function exportsEntry(exp) {
    if (exp === null || exp === undefined) {
        return undefined;
    }
    if (typeof exp === 'object' && !Array.isArray(exp) && exp['.'] !== undefined) {
        exp = exp['.'];
    }
    if (typeof exp === 'string') {
        return exp;
    }
    if (typeof exp === 'object') {
        for (const condition of ['require', 'default', 'import']) {
            if (typeof exp[condition] === 'string') {
                return exp[condition];
            }
        }
    }
    return undefined;
}

function resolveDirectory(dir) {
    const pkgPath = joinPath(dir, 'package.json');
    if (exists(pkgPath)) {
        let pkg;
        try {
            pkg = JSON.parse(loadFile(pkgPath).content);
        } catch (e) {
            throw new Error(`invalid ${pkgPath}: ${e.message}`);
        }
        const main = exportsEntry(pkg.exports) || pkg.main;
        if (typeof main === 'string') {
            const path = joinPath(dir, main);
            const r = resolveFile(path) || resolveIndex(path);
            if (r) {
                return r;
            }
        }
    }
    return resolveIndex(dir);
}

function resolveIndex(dir) {
    for (const index of INDEXES) {
        const path = joinPath(dir, index);
        if (exists(path)) {
            return path;
        }
    }
    return undefined;
}

function resolveAt(path) {
    return resolveFile(path) || resolveDirectory(path);
}

function resolveUncached(specifier, requiringDir) {
    if (specifier.startsWith('./') || specifier.startsWith('../') || specifier.startsWith('/')) {
        return resolveAt(joinPath(requiringDir, specifier));
    }
    // the requiring directory (as the old loader of puerts)
    let r = requiringDir && resolveAt(joinPath(requiringDir, specifier));
    if (r) {
        return r;
    }
    // the node_modules of the requiring directory and its ancestors
    for (let dir = requiringDir; ; dir = dirname(dir)) {
        if (dir.slice(dir.lastIndexOf('/') + 1) !== 'node_modules') {
            r = resolveAt(joinPath(dir, 'node_modules', specifier));
            if (r) {
                return r;
            }
        }
        if (dir === '') {
            break;
        }
    }
    // the script root
    return resolveAt(specifier);
}

function resolve(specifier, requiringDir) {
    const key = `${requiringDir}\0${specifier}`;
    let r = resolutions.get(key);
    if (r === undefined) {
        r = resolveUncached(specifier, requiringDir) || null;
        resolutions.set(key, r);
    }
    // undefined: the default rule of puerts/module.js (the error of a missing module)
    return r === null ? undefined : r;
}

function clearCache() {
    existence.clear();
    resolutions.clear();
}

M.setResolveHook(resolve);

module.exports = { resolve, clearCache, __auto_release: false };

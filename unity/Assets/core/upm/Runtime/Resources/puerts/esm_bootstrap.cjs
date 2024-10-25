/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

//begin move from ExecuteModuleJSCode.h
(function() {
    var global = global || globalThis || (function () { return this; }());
    /* eslint-disable max-depth, max-statements, complexity, max-lines-per-function */
    const SLASH = 47
    const DOT = 46

    const assertPath = (path) => {
        const t = typeof path
        if (t !== 'string') {
            throw new TypeError(`Expected a string, got a ${t}`)
        }
    }

    // this function is directly from node source
    const posixNormalize = (path, allowAboveRoot) => {
        let res = ''
        let lastSegmentLength = 0
        let lastSlash = -1
        let dots = 0
        let code

        for (let i = 0; i <= path.length; ++i) {
            if (i < path.length) {
                code = path.charCodeAt(i)
            } else if (code === SLASH) {
                break
            } else {
                code = SLASH
            }
            if (code === SLASH) {
                if (lastSlash === i - 1 || dots === 1) {
                    // NOOP
                } else if (lastSlash !== i - 1 && dots === 2) {
                    if (
                        res.length < 2 ||
                        lastSegmentLength !== 2 ||
                        res.charCodeAt(res.length - 1) !== DOT ||
                        res.charCodeAt(res.length - 2) !== DOT
                    ) {
                        if (res.length > 2) {
                            const lastSlashIndex = res.lastIndexOf('/')
                            if (lastSlashIndex !== res.length - 1) {
                                if (lastSlashIndex === -1) {
                                    res = ''
                                    lastSegmentLength = 0
                                } else {
                                    res = res.slice(0, lastSlashIndex)
                                    lastSegmentLength = res.length - 1 - res.lastIndexOf('/')
                                }
                                lastSlash = i
                                dots = 0
                                continue
                            }
                        } else if (res.length === 2 || res.length === 1) {
                            res = ''
                            lastSegmentLength = 0
                            lastSlash = i
                            dots = 0
                            continue
                        }
                    }
                    if (allowAboveRoot) {
                        if (res.length > 0) {
                            res += '/..'
                        } else {
                            res = '..'
                        }
                        lastSegmentLength = 2
                    }
                } else {
                    if (res.length > 0) {
                        res += '/' + path.slice(lastSlash + 1, i)
                    } else {
                        res = path.slice(lastSlash + 1, i)
                    }
                    lastSegmentLength = i - lastSlash - 1
                }
                lastSlash = i
                dots = 0
            } else if (code === DOT && dots !== -1) {
                ++dots
            } else {
                dots = -1
            }
        }

        return res
    }

    const decode = (s) => {
        try {
            return decodeURIComponent(s)
        } catch {
            return s
        }
    }

    const normalize = (p) => {
        assertPath(p)

        let path = p
        if (path.length === 0) {
            return '.'
        }

        const isAbsolute = path.charCodeAt(0) === SLASH
        const trailingSeparator = path.charCodeAt(path.length - 1) === SLASH

        path = decode(path)
        path = posixNormalize(path, !isAbsolute)

        if (path.length === 0 && !isAbsolute) {
            path = '.'
        }
        if (path.length > 0 && trailingSeparator) {
            path += '/'
        }
        if (isAbsolute) {
            return '/' + path
        }

        return path
    }

    global.__puer_path__ = {
        normalize: normalize,
        isAbsolute(filepath) {
            return !(
                !/^[\\\\\\/]{2,}[^\\\\\\/]+[\\\\\\/]+[^\\\\\\/]+/.test(filepath) &&
                !/^([a-z]:)?[\\\\\\/]/i.test(filepath)
            )
        },
        isRelative(filepath) {
            if (filepath[0] == '.') {
                if (filepath.length == 1 || filepath[1] == '/') return true;
                if (filepath[1] == '.') {
                    if (filepath.length == 2 || filepath[2] == '/') return true;
                }
            }
            return false;
        },
        dirname: function dirname(path) {
            if (path.length === 0) return '.';
            var code = path.charCodeAt(0);
            var hasRoot = code === 47 /*/*/;
            var end = -1;
            var matchedSlash = true;
            for (var i = path.length - 1; i >= 1; --i) {
                code = path.charCodeAt(i);
                if (code === 47 /*/*/) {
                    if (!matchedSlash) {
                        end = i;
                        break;
                    }
                    } else {
                    // We saw the first non-path separator
                    matchedSlash = false;
                }
            }

            if (end === -1) return hasRoot ? '/' : '.';
            if (hasRoot && end === 1) return '//';
            return path.slice(0, end);
        }
    }

    var __loader = undefined;
    const getLoader = () => {
        if (!__loader) {
            __loader = typeof jsEnv != 'undefined' ? jsEnv.GetLoader() : __tgjsGetLoader();
        }
        return __loader;
    }

    global.__puer_resolve_module_url__ = function(specifier, referer) {
        const originSp = specifier;
        const loader = getLoader();
        if (!loader.Resolve) {
            let s = !__puer_path__.isRelative(specifier) ? specifier :
                __puer_path__.normalize(__puer_path__.dirname(referer) + '/' + specifier)
            if (loader.FileExists(s)) {
                return s
            } else {
                throw new Error(`[Puer002]import ${originSp} failed: module not found`);
            }

        } else {
            let p = loader.Resolve(specifier, referer)
            if (!p) {
                throw new Error(`[Puer002]import ${originSp} failed: module not found`);
            }
            return p;
        }
    }

    global.__puer_resolve_module_content__ = function(specifier, debugpathRef = []) {
        const originSp = specifier;
        const loader = getLoader();
        let isESM = true;
        if (loader.IsESM) isESM = specifier.startsWith('puerts/') || loader.IsESM(specifier)
        if (!isESM && puer.require) return `export default puer.require('${specifier}')['default']`
        const content = loader.ReadFile(specifier, debugpathRef);
        if (content === undefined) {
            throw new Error(`[Puer003]import ${originSp} failed: module not found`);
        }
        return content
    }
})();
//end move from ExecuteModuleJSCode.h
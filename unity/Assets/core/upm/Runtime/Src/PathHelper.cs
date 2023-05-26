/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System.IO;
using System;

namespace Puerts
{
    public class PathHelper
    {
        private static char SLASH = (char)47;
        private static char DOT = (char)46;
        public static bool IsRelative(string filepath)
        {
            if (filepath[0] == '.') {
                if (filepath.Length == 1 || filepath[1] == '/') return true;
                if (filepath[1] == '.') {
                    if (filepath.Length == 2 || filepath[2] == '/') return true;
                }
            }
            return false;
        }
        public static string Dirname(string filepath)
        {
            if (filepath.Length == 0) return ".";
            char code = filepath[0];
            bool hasRoot = code == '/';
            int end = -1;
            bool matchedSlash = true;
            for (int i = filepath.Length - 1; i >= 1; --i)
            {
                code = filepath[i];
                if (code == '/')
                {
                    if (!matchedSlash)
                    {
                        end = i;
                        break;
                    }
                }
                else
                {
// We saw the first non-path separator
                    matchedSlash = false;
                }
            }

            if (end == -1) return hasRoot ? "/" : ".";
            if (hasRoot && end == 1) return "//";
            return filepath.Substring(0, end);
        }
        
        protected static string posixNormalize(string path, bool allowAboveRoot)
        {
            string res = "";
            int lastSegmentLength = 0;
            int lastSlash = -1;
            int dots = 0;
            char code = (char)0;

            for (int i = 0; i <= path.Length; ++i)
            {
                if (i < path.Length)
                {
                    code = path[i];
                }
                else if (code == '/')
                {
                    break;
                }
                else
                {
                    code = '/';
                }
                if (code == '/')
                {
                    if (lastSlash == i - 1 || dots == 1)
                    {
                        // NOOP
                    }
                    else if (lastSlash != i - 1 && dots == 2)
                    {
                        if (
                            res.Length < 2 ||
                            lastSegmentLength != 2 ||
                            res[res.Length - 1] != '.' ||
                            res[res.Length - 2] != '.'
                        )
                        {
                            if (res.Length > 2)
                            {
                                int lastSlashIndex = res.LastIndexOf('/');
                                if (lastSlashIndex != res.Length - 1)
                                {
                                    if (lastSlashIndex == -1)
                                    {
                                        res = "";
                                        lastSegmentLength = 0;
                                    }
                                    else
                                    {
                                        res = res.Substring(0, lastSlashIndex);
                                        lastSegmentLength = res.Length - 1 - res.LastIndexOf('/');
                                    }
                                    lastSlash = i;
                                    dots = 0;
                                    continue;
                                }
                            }
                            else if (res.Length == 2 || res.Length == 1)
                            {
                                res = "";
                                lastSegmentLength = 0;
                                lastSlash = i;
                                dots = 0;
                                continue;
                            }
                        }
                        if (allowAboveRoot)
                        {
                            if (res.Length > 0)
                            {
                                res += "/..";
                            }
                            else
                            {
                                res = "..";
                            }
                            lastSegmentLength = 2;
                        }
                    }
                    else
                    {
                        if (res.Length > 0)
                        {
                            res += "/" + path.Substring(lastSlash + 1, i - (lastSlash + 1));
                        }
                        else
                        {
                            res = path.Substring(lastSlash + 1, i - (lastSlash + 1));
                        }
                        lastSegmentLength = i - lastSlash - 1;
                    }
                    lastSlash = i;
                    dots = 0;
                }
                else if (code == '.' && dots != -1)
                {
                    ++dots;
                }
                else
                {
                    dots = -1;
                }
            }

            return res;
        }
        
        protected static string decode(string s)
        {
            try
            {
                return Uri.UnescapeDataString(s);
            }
            catch
            {
                return s;
            }
        }

        public static string normalize(string p)
        {
            if (p == null) throw new Exception("invalid filepath");

            string path = p;
            if (path.Length == 0)
            {
                return ".";
            }

            bool isAbsolute = path[0] == SLASH;
            bool trailingSeparator = path[path.Length - 1] == SLASH;

            path = decode(path);
            path = posixNormalize(path, !isAbsolute);

            if (path.Length == 0 && !isAbsolute)
            {
                path = ".";
            }
            if (path.Length > 0 && trailingSeparator)
            {
                path += "/";
            }
            if (isAbsolute)
            {
                return "/" + path;
            }

            return path;
        }

        
        internal static string JSCode = @"
    var global = this;
    (function() {
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
                    !/^[\\\/]{2,}[^\\\/]+[\\\/]+[^\\\/]+/.test(filepath) && 
                    !/^([a-z]:)?[\\\/]/i.test(filepath)
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
    })()
            ";
    }
}
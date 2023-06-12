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
    }
}
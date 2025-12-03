/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;
using System.Runtime.InteropServices;

#if UNITY_WEBGL && !UNITY_EDITOR
namespace Puerts
{
    public class PapiWebGLNative
    {
        const string PAPIDLLNAME = "__Internal";

        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void InitPuertsWebGL();

        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern int GetWebGLPapiVersion();

        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr GetWebGLFFIApi();
        
        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr CreateWebGLPapiEnvRef();
        
        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void PreservePuertsCPP();
    }
}
#endif

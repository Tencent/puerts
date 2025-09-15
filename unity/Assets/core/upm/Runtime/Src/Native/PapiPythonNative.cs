/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;
using System.Runtime.InteropServices;

namespace Puerts;

public class PapiPythonNative
{
#if (UNITY_IPHONE || UNITY_TVOS || UNITY_WEBGL || UNITY_SWITCH) && !UNITY_EDITOR
        const string PAPIDLLNAME = "__Internal";
#else
    const string PAPIDLLNAME = "PapiPython";
#endif
    [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
    public static extern int GetPythonPapiVersion();

    [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
    public static extern IntPtr GetPythonFFIApi();

    [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
    public static extern IntPtr CreatePythonPapiEnvRef();

    [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
    public static extern void DestroyPythonPapiEnvRef(IntPtr envRef);
    
    [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
    public static extern void RunGC(IntPtr envRef);
}
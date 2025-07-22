/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;
using System.Runtime.InteropServices;
using System.Text;

namespace Puerts
{

    public class WSPPAddonNative
    {
#if (UNITY_IPHONE || UNITY_TVOS || UNITY_WEBGL || UNITY_SWITCH) && !UNITY_EDITOR
        const string PUERTSDLLNAME = "__Internal";
#else
        const string PUERTSDLLNAME = "WSPPAddon";
#endif

#if !UNITY_WEBGL || UNITY_EDITOR
        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void pesapi_register_WSPPAddon_v11(IntPtr reg_api, IntPtr registry);

        static object obj = new object();
        static bool inited = false;
#endif

        public static void Register(IntPtr reg_api, IntPtr registry)
        {
#if !UNITY_WEBGL || UNITY_EDITOR
            lock (obj)
            {
                if(!inited)
                {
                    pesapi_register_WSPPAddon_v11(reg_api, registry);
                    inited = true;
                }
            }
#endif
        }
    }
}

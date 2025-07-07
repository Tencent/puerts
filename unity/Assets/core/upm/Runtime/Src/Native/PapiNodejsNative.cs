/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;
using System.Runtime.InteropServices;
using System.Text;

namespace Puerts
{
    public class PapiNodejsNative
    {
#if (UNITY_IPHONE || UNITY_TVOS || UNITY_WEBGL || UNITY_SWITCH) && !UNITY_EDITOR
        const string PAPIDLLNAME = "__Internal";
#else
        const string PAPIDLLNAME = "PapiNodejs";
#endif
        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern int GetNodejsPapiVersion();

        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr GetNodejsFFIApi();

        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr CreateNodejsPapiEnvRef();

        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void DestroyNodejsPapiEnvRef(IntPtr envRef);

        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr GetNodejsIsolate(IntPtr envRef);

        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void NodejsLowMemoryNotification(IntPtr isolate);

        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool NodejsIdleNotificationDeadline(IntPtr isolate, double DeadlineInSeconds);

        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void NodejsRequestMinorGarbageCollectionForTesting(IntPtr isolate);

        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void NodejsRequestFullGarbageCollectionForTesting(IntPtr isolate);

        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void NodejsCreateInspector(IntPtr isolate, int port);

        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void NodejsDestroyInspector(IntPtr isolate);

        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool NodejsInspectorTick(IntPtr isolate);

        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void NodejsLogicTick(IntPtr isolate);

        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void NodejsTerminateExecution(IntPtr isolate);
    }
}

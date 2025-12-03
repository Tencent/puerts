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
    public class PapiV8Native
    {
#if (UNITY_IPHONE || UNITY_TVOS || UNITY_WEBGL || UNITY_SWITCH) && !UNITY_EDITOR
        const string PAPIDLLNAME = "__Internal";
#else
        const string PAPIDLLNAME = "PapiV8";
#endif
        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern int GetV8PapiVersion();

        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr GetV8FFIApi();

        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr CreateV8PapiEnvRef();

        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void DestroyV8PapiEnvRef(IntPtr envRef);

        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr GetV8Isolate(IntPtr envRef);

        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void LowMemoryNotification(IntPtr isolate);

        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool IdleNotificationDeadline(IntPtr isolate, double DeadlineInSeconds);

        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void RequestMinorGarbageCollectionForTesting(IntPtr isolate);

        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void RequestFullGarbageCollectionForTesting(IntPtr isolate);

        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void CreateInspector(IntPtr isolate, int port);

        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void DestroyInspector(IntPtr isolate);

        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool InspectorTick(IntPtr isolate);

        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void LogicTick(IntPtr isolate);

        [DllImport(PAPIDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void TerminateExecution(IntPtr isolate);
    }
}

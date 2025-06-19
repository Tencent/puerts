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
#pragma warning disable 414
    public class MonoPInvokeCallbackAttribute : System.Attribute
    {
        private Type type;
        public MonoPInvokeCallbackAttribute(Type t)
        {
            type = t;
        }
    }
#pragma warning restore 414

#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate void V8FunctionCallback(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data);

#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate void JsFunctionFinalizeCallback(IntPtr isolate, long data);

#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr V8ConstructorCallback(IntPtr isolate, IntPtr info, int paramLen, long data);

#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate void V8DestructorCallback(IntPtr self, long data);

#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate void LogCallback(string content);

    [Flags]
    public enum JsValueType
    {
        Invalid = 0,
        NullOrUndefined = 1,
        BigInt = 2,
        Number = 4,
        String = 8,
        Boolean = 16,
        NativeObject = 32,
        JsObject = 64,
        Array = 128,
        Function = 256,
        Date = 512,
        ArrayBuffer = 1024,
        Unknow = 2048,
        Any = NullOrUndefined | BigInt | Number | String | Boolean | NativeObject | JsObject | Array | Function | Date | ArrayBuffer,
    };

    public class PuertsDLL
    {
#if (UNITY_IPHONE || UNITY_TVOS || UNITY_WEBGL || UNITY_SWITCH) && !UNITY_EDITOR
        const string PUERTSDLLNAME = "__Internal";
        const string PAPIV8DLLNAME = "__Internal";
#else
        const string PUERTSDLLNAME = "puerts";
        const string PAPIV8DLLNAME = "papiqjs";
#endif

        [DllImport(PAPIV8DLLNAME, CallingConvention = CallingConvention.Cdecl, EntryPoint = "GetApiLevel")]
        protected static extern int _GetApiLevel();

        [DllImport(PAPIV8DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern int GetLibVersion();

        public static int GetApiLevel() {
            try
            {
                return _GetApiLevel();
            }
            catch (DllNotFoundException)
            {
#if !PUERTS_GENERAL
                UnityEngine.Debug.LogError("[Puer001] DllNotFoundException detected. You can solve this problem following the FAQ.");
#endif
                throw;
            }
            catch (Exception)
            {
                return GetLibVersion();
            }
        }

        [DllImport(PAPIV8DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern int GetLibBackend(IntPtr isolate);

        [DllImport(PAPIV8DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr CreateJSEngine(int backendType);

        [DllImport(PAPIV8DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr CreateJSEngineWithExternalEnv(int backendType, IntPtr externalRuntime, IntPtr externalContext);

        [DllImport(PAPIV8DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void DestroyJSEngine(IntPtr isolate);

        [DllImport(PAPIV8DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void LowMemoryNotification(IntPtr isolate);

        [DllImport(PAPIV8DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool IdleNotificationDeadline(IntPtr isolate, double DeadlineInSeconds);

        [DllImport(PAPIV8DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void RequestMinorGarbageCollectionForTesting(IntPtr isolate);

        [DllImport(PAPIV8DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void RequestFullGarbageCollectionForTesting(IntPtr isolate);

        [DllImport(PAPIV8DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void CreateInspector(IntPtr isolate, int port);

        [DllImport(PAPIV8DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void DestroyInspector(IntPtr isolate);

        [DllImport(PAPIV8DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool InspectorTick(IntPtr isolate);

        [DllImport(PAPIV8DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void LogicTick(IntPtr isolate);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void SetLogCallback(IntPtr log, IntPtr logWarning, IntPtr logError);

        public static void SetLogCallback(LogCallback log, LogCallback logWarning, LogCallback logError)
        {
#if PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
            GCHandle.Alloc(log);
            GCHandle.Alloc(logWarning);
            GCHandle.Alloc(logError);
#endif
            IntPtr fn1 = log == null ? IntPtr.Zero : Marshal.GetFunctionPointerForDelegate(log);
            IntPtr fn2 = logWarning == null ? IntPtr.Zero : Marshal.GetFunctionPointerForDelegate(logWarning);
            IntPtr fn3 = logError == null ? IntPtr.Zero : Marshal.GetFunctionPointerForDelegate(logError);

            SetLogCallback(fn1, fn2, fn3);
        }

#if !UNITY_EDITOR && UNITY_WEBGL
        [DllImport("__Internal", CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr InitPuertsWebGL();
#endif
    }
}

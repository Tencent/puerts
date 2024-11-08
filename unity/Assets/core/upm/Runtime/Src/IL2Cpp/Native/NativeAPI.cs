/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if UNITY_2020_1_OR_NEWER
#if PUERTS_IL2CPP_OPTIMIZATION && ENABLE_IL2CPP

using System;
using System.Runtime.InteropServices;
using System.Runtime.CompilerServices;
using System.Reflection;
using System.Collections.Generic;

namespace PuertsIl2cpp
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

    public class NativeAPI
    {
#if (UNITY_IPHONE || UNITY_TVOS || UNITY_WEBGL || UNITY_SWITCH) && !UNITY_EDITOR
        const string DLLNAME = "__Internal";
#else
        const string DLLNAME = "puerts_il2cpp";
#endif

        [DllImport("__Internal", CallingConvention = CallingConvention.Cdecl)]
        public static extern void InitialPuerts(IntPtr PesapiImpl);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern int GetLibBackend();

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr CreateNativeJSEnv();

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void DestroyNativeJSEnv(IntPtr jsEnv);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr GetRegsterApi();
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr GetFFIApi();

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr GetPapiEnvRef(IntPtr jsEnv);
        
        [MethodImpl(MethodImplOptions.InternalCall)]
        public static IntPtr InitialPapiEnvRef(IntPtr api, IntPtr envRef, Object obj, MethodBase addMethodBase, MethodBase removeMethodBase)
        {
            throw new NotImplementedException();
        }
        
        [MethodImpl(MethodImplOptions.InternalCall)]
        public static void CleanupPapiEnvRef(IntPtr api, IntPtr envRef)
        {
            throw new NotImplementedException();
        }

        [MethodImpl(MethodImplOptions.InternalCall)]
        public static void DestroyJSEnvPrivate(IntPtr jsEnvPrivate)
        {
            throw new NotImplementedException();
        }

        [DllImport("__Internal", CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr CreateCSharpTypeInfo(string name, IntPtr type_id, IntPtr super_type_id, bool isValueType, bool isDelegate, string delegateSignature);

        [DllImport("__Internal", CallingConvention = CallingConvention.Cdecl)]
        public static extern void ReleaseCSharpTypeInfo(IntPtr classInfo);

        [DllImport("__Internal", CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr FindWrapFunc(string signature);

        [DllImport("__Internal", CallingConvention = CallingConvention.Cdecl)]
        public static extern void FindFieldWrap(string signature, out IntPtr getter, out IntPtr setter);

        [DllImport("__Internal", CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr AddConstructor(IntPtr classInfo, string signature, IntPtr WrapFunc, IntPtr method, IntPtr methodPointer, int typeInfoNum);

        [DllImport("__Internal", CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr AddMethod(IntPtr classInfo, string signature, IntPtr WrapFunc, string name, bool isStatic, bool isExtensionethod, bool isGetter, bool isSetter, IntPtr method, IntPtr methodPointer, int typeInfoNum);

        [DllImport("__Internal", CallingConvention = CallingConvention.Cdecl)]
        public static extern bool AddField(IntPtr classInfo, IntPtr getter, IntPtr setter, string name, bool isStatic, IntPtr fieldInfo, int offset, IntPtr fieldTypeInfo);

        [DllImport("__Internal", CallingConvention = CallingConvention.Cdecl)]
        public static extern void SetTypeInfo(IntPtr wrapData, int index, IntPtr typeId);

        [DllImport("__Internal", CallingConvention = CallingConvention.Cdecl)]
        public static extern bool RegisterCSharpType(IntPtr classInfo);

        //[DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        //public static extern void SetObjectPool(IntPtr jsEnv, IntPtr objectPoolAddMethodInfo, IntPtr objectPoolAdd, IntPtr objectPoolRemoveMethodInfo, IntPtr objectPoolRemove, IntPtr objectPoolInstance);

        [MethodImpl(MethodImplOptions.InternalCall)]
        public static void SetRegisterNoThrow(MethodBase methodInfo)
        {
        }

        [MethodImpl(MethodImplOptions.InternalCall)]
        public static void SetObjectToGlobal(IntPtr apis, IntPtr envRef, string key, Object obj)
        {
            throw new NotImplementedException();
        }

        [DllImport("__Internal", CallingConvention = CallingConvention.Cdecl)]
        public static extern void AddPendingKillScriptObjects(IntPtr ffiApi, IntPtr jsEnv, IntPtr valueRef);
        
        [DllImport("__Internal", CallingConvention = CallingConvention.Cdecl)]
        public static extern void CleanupPendingKillScriptObjects(IntPtr jsEnv);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void CreateInspector(IntPtr jsEnv, int port);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void DestroyInspector(IntPtr jsEnv);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool InspectorTick(IntPtr jsEnv);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool LogicTick(IntPtr jsEnv);

        [MethodImpl(MethodImplOptions.InternalCall)]
        public static object GetModuleExecutor(IntPtr apis, IntPtr NativeJsEnvPtr, Type type)
        {
            throw new NotImplementedException();
        }

        [MethodImpl(MethodImplOptions.InternalCall)]
        public static IntPtr GetMethodPointer(MethodBase methodInfo)
        {
            throw new NotImplementedException();
        }

        [MethodImpl(MethodImplOptions.InternalCall)]
        public static IntPtr GetMethodInfoPointer(MethodBase methodInfo)
        {
            throw new NotImplementedException();
        }

        [MethodImpl(MethodImplOptions.InternalCall)]
        public static int GetFieldOffset(FieldInfo fieldInfo, bool isInValueType)
        {
            throw new NotImplementedException();
        }

        [MethodImpl(MethodImplOptions.InternalCall)]
        public static IntPtr GetFieldInfoPointer(FieldInfo fieldInfo)
        {
            throw new NotImplementedException();
        }

        [MethodImpl(MethodImplOptions.InternalCall)]
        public static IntPtr GetTypeId(Type type)
        {
            throw new NotImplementedException();
        }

        [MethodImpl(MethodImplOptions.InternalCall)]
        public static Type TypeIdToType(IntPtr typeId)
        {
            throw new NotImplementedException();
        }

        [MethodImpl(MethodImplOptions.InternalCall)]
        public static void SetGlobalType_JSObject(Type type)
        {
            throw new NotImplementedException();
        }

        [MethodImpl(MethodImplOptions.InternalCall)]
        public static void SetGlobalType_ArrayBuffer(Type type)
        {
            throw new NotImplementedException();
        }
        
        [MethodImpl(MethodImplOptions.InternalCall)]
        public static void SetGlobalType_TypedValue(Type type)
        {
            throw new NotImplementedException();
        }

        [MethodImpl(MethodImplOptions.InternalCall)]
        public static void PesapiCallTest(Type type)
        {
            throw new NotImplementedException();
        }

        [MethodImpl(MethodImplOptions.InternalCall)]
        public static object EvalInternal(IntPtr apis, IntPtr envHolder, byte[] code, string path, Type type)
        {
            throw new NotImplementedException();
        }

#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
        [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
        public delegate void LogCallback(string content);

        [MonoPInvokeCallback(typeof(LogCallback))]
        public static void LogImpl(string msg)
        {
            UnityEngine.Debug.Log("debug msg: " + msg);
        }

        public static LogCallback Log = LogImpl;

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void SetLogCallback(IntPtr log);
        
        [DllImport("__Internal", CallingConvention = CallingConvention.Cdecl)]
        public static extern void SetLogCallbackInternal(IntPtr log);

        //[UnityEngine.Scripting.RequiredByNativeCodeAttribute()]
        public static void SetLogCallback(LogCallback log)
        {
#if PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR) || UNITY_STANDALONE_WIN
            GCHandle.Alloc(log);
#endif
            IntPtr fn1 = log == null ? IntPtr.Zero : Marshal.GetFunctionPointerForDelegate(log);

            try 
            {
                SetLogCallback(fn1);
                SetLogCallbackInternal(fn1);
            }
            catch(DllNotFoundException)
            {
                UnityEngine.Debug.LogError("[Puer001] PuerTS's Native Plugin(s) is missing. You can solve this problem following the FAQ.");
                throw;
            }
        }
    }
}

#endif
#endif
﻿/*
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
        Any = NullOrUndefined | BigInt | Number | String | Boolean | NativeObject | Array | Function | Date | ArrayBuffer,
    };

    public class PuertsDLL
    {
#if (UNITY_IPHONE || UNITY_TVOS || UNITY_WEBGL || UNITY_SWITCH) && !UNITY_EDITOR
        const string DLLNAME = "__Internal";
#else
        const string DLLNAME = "puerts";
#endif

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern int GetLibVersion();

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr CreateJSEngine();

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void DestroyJSEngine(IntPtr isolate);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void SetGlobalFunction(IntPtr isolate, string name, IntPtr v8FunctionCallback, long data);

        public static void SetGlobalFunction(IntPtr isolate, string name, V8FunctionCallback v8FunctionCallback, long data)
        {
#if PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
            GCHandle.Alloc(v8FunctionCallback);
#endif
            IntPtr fn = v8FunctionCallback == null ? IntPtr.Zero : Marshal.GetFunctionPointerForDelegate(v8FunctionCallback);
            SetGlobalFunction(isolate, name, fn, data);
        }

        private static string GetStringFromNative(IntPtr str, int strlen)
        {
            if (str != IntPtr.Zero)
            {
#if PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
                byte[] buffer = new byte[strlen];
                Marshal.Copy(str, buffer, 0, strlen);
                return Encoding.UTF8.GetString(buffer);
#else
                string ret = Marshal.PtrToStringAnsi(str, strlen);
                if (ret == null)
                {
                    int len = strlen;
                    byte[] buffer = new byte[len];
                    Marshal.Copy(str, buffer, 0, len);
                    return Encoding.UTF8.GetString(buffer);
                }
                return ret;
#endif
            }
            else
            {
                return null;
            }
        }

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr GetLastExceptionInfo(IntPtr isolate, out int strlen);

        public static string GetLastExceptionInfo(IntPtr isolate)
        {
            int strlen;
            IntPtr str = GetLastExceptionInfo(isolate, out strlen);
            return GetStringFromNative(str, strlen);
        }

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void LowMemoryNotification(IntPtr isolate);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void SetGeneralDestructor(IntPtr isolate, IntPtr generalDestructor);

        public static void SetGeneralDestructor(IntPtr isolate, V8DestructorCallback generalDestructor)
        {
#if PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
            GCHandle.Alloc(generalDestructor);
#endif
            IntPtr fn = generalDestructor == null ? IntPtr.Zero : Marshal.GetFunctionPointerForDelegate(generalDestructor);
            SetGeneralDestructor(isolate, fn);
        }

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr Eval(IntPtr isolate, string code, string path);

        public static IntPtr EvalChecked(IntPtr isolate, string code, string path)
        {
            if (code == null)
            {
                throw new InvalidProgramException("eval null string");
            }
            return Eval(isolate, code, path);
        }

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern int RegisterClass(IntPtr isolate, int BaseTypeId, string fullName, IntPtr constructor, IntPtr destructor, long data);

        public static int RegisterClass(IntPtr isolate, int BaseTypeId, string fullName, V8ConstructorCallback constructor, V8DestructorCallback destructor, long data)
        {
#if PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
            GCHandle.Alloc(constructor);
            GCHandle.Alloc(destructor);
#endif
            IntPtr fn1 = constructor == null ? IntPtr.Zero: Marshal.GetFunctionPointerForDelegate(constructor);
            IntPtr fn2 = destructor == null ? IntPtr.Zero : Marshal.GetFunctionPointerForDelegate(destructor);

            return RegisterClass(isolate, BaseTypeId, fullName, fn1, fn2, data);
        }

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern int RegisterStruct(IntPtr isolate, int BaseTypeId, string fullName, IntPtr constructor, IntPtr destructor, long data, int size);

        public static int RegisterStruct(IntPtr isolate, int BaseTypeId, string fullName, V8ConstructorCallback constructor, V8DestructorCallback destructor, long data, int size)
        {
#if PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
            GCHandle.Alloc(constructor);
            GCHandle.Alloc(destructor);
#endif
            IntPtr fn1 = constructor == null ? IntPtr.Zero : Marshal.GetFunctionPointerForDelegate(constructor);
            IntPtr fn2 = destructor == null ? IntPtr.Zero : Marshal.GetFunctionPointerForDelegate(destructor);

            return RegisterStruct(isolate, BaseTypeId, fullName, fn1, fn2, data, size);
        }

        //切记注册的回调不能抛C#异常，必须先catch，然后转js异常
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool RegisterFunction(IntPtr isolate, int classID, string name, bool isStatic, IntPtr callback, long data);

        public static bool RegisterFunction(IntPtr isolate, int classID, string name, bool isStatic, V8FunctionCallback callback, long data)
        {
#if PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
            GCHandle.Alloc(callback);
#endif
            IntPtr fn = callback == null ? IntPtr.Zero : Marshal.GetFunctionPointerForDelegate(callback);

            return RegisterFunction(isolate, classID, name, isStatic, fn, data);
        }

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool RegisterProperty(IntPtr isolate, int classID, string name, bool isStatic, IntPtr getter, long getterData, IntPtr setter, long setterData, bool dontDelete);

        public static bool RegisterProperty(IntPtr isolate, int classID, string name, bool isStatic, V8FunctionCallback getter, long getterData, V8FunctionCallback setter, long setterData, bool dontDelete)
        {
#if PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
            GCHandle.Alloc(getter);
            GCHandle.Alloc(setter);
#endif
            IntPtr fn1 = getter == null ? IntPtr.Zero : Marshal.GetFunctionPointerForDelegate(getter);
            IntPtr fn2 = setter == null ? IntPtr.Zero : Marshal.GetFunctionPointerForDelegate(setter);

            return RegisterProperty(isolate, classID, name, isStatic, fn1, getterData, fn2, setterData, dontDelete);
        }

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void ReturnClass(IntPtr isolate, IntPtr info, int classID);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void ReturnObject(IntPtr isolate, IntPtr info, int classID, IntPtr self);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void ReturnNumber(IntPtr isolate, IntPtr info, double number);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl, EntryPoint = "ReturnString")]
        public static extern void __ReturnString(IntPtr isolate, IntPtr info, string str);

        public static void ReturnString(IntPtr isolate, IntPtr info, string str)
        {
            if (str == null)
            {
                ReturnNull(isolate, info);
            }
            else
            {
                __ReturnString(isolate, info, str);
            }
        }

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void ReturnBigInt(IntPtr isolate, IntPtr info, long number);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void ReturnBoolean(IntPtr isolate, IntPtr info, bool b);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void ReturnDate(IntPtr isolate, IntPtr info, double date);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void ReturnNull(IntPtr isolate, IntPtr info);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr GetArgumentValue(IntPtr info, int index);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern JsValueType GetJsValueType(IntPtr isolate, IntPtr value, bool isByRef);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern JsValueType GetArgumentType(IntPtr isolate, IntPtr info, int index, bool isByRef);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern double GetNumberFromValue(IntPtr isolate, IntPtr value, bool isByRef);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern double GetDateFromValue(IntPtr isolate, IntPtr value, bool isByRef);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr GetStringFromValue(IntPtr isolate, IntPtr value, out int len, bool isByRef);

        public static string GetStringFromValue(IntPtr isolate, IntPtr value, bool isByRef)
        {
            int strlen;
            IntPtr str = GetStringFromValue(isolate, value, out strlen, isByRef);
            return GetStringFromNative(str, strlen);
        }

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool GetBooleanFromValue(IntPtr isolate, IntPtr value, bool isByRef);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool ValueIsBigInt(IntPtr isolate, IntPtr value, bool isByRef);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern long GetBigIntFromValue(IntPtr isolate, IntPtr value, bool isByRef);

        public static long GetBigIntFromValueChecked(IntPtr isolate, IntPtr value, bool isByRef)
        {
            if (!ValueIsBigInt(isolate, value, isByRef))
            {
                throw new InvalidOperationException("expect a bigint");
            }
            return GetBigIntFromValue(isolate, value, isByRef);
        }

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr GetObjectFromValue(IntPtr isolate, IntPtr value, bool isByRef);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern int GetTypeIdFromValue(IntPtr isolate, IntPtr value, bool isByRef);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr GetFunctionFromValue(IntPtr isolate, IntPtr value, bool isByRef);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void SetNumberToOutValue(IntPtr isolate, IntPtr value, double number);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void SetDateToOutValue(IntPtr isolate, IntPtr value, double date);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void SetStringToOutValue(IntPtr isolate, IntPtr value, string str);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void SetBooleanToOutValue(IntPtr isolate, IntPtr value, bool b);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void SetBigIntToOutValue(IntPtr isolate, IntPtr value, long bigInt);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void SetObjectToOutValue(IntPtr isolate, IntPtr value, int classId, IntPtr ptr);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void SetNullToOutValue(IntPtr isolate, IntPtr value);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void ThrowException(IntPtr isolate, byte[] message);

        public static void ThrowException(IntPtr isolate, string message)
        {
            var bytes = Encoding.UTF8.GetBytes(message);
            ThrowException(isolate, bytes);
        }

        //begin cs call js
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void PushNullForJSFunction(IntPtr function);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void PushDateForJSFunction(IntPtr function, double dateValue);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void PushBooleanForJSFunction(IntPtr function, bool b);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void PushBigIntForJSFunction(IntPtr function, long l);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl, EntryPoint = "PushStringForJSFunction")]
        public static extern void __PushStringForJSFunction(IntPtr function, string str);

        public static void PushStringForJSFunction(IntPtr function, string str)
        {
            if (str == null)
            {
                PushNullForJSFunction(function);
            }
            else
            {
                __PushStringForJSFunction(function, str);
            }
        }

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void PushNumberForJSFunction(IntPtr function, double d);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void PushObjectForJSFunction(IntPtr function, int classId, IntPtr objectId);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr InvokeJSFunction(IntPtr function, bool hasResult);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr GetFunctionLastExceptionInfo(IntPtr function, out int len);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void ReleaseJSFunction(IntPtr isolate, IntPtr function);

        public static string GetFunctionLastExceptionInfo(IntPtr function)
        {
            int strlen;
            IntPtr str = GetFunctionLastExceptionInfo(function, out strlen);
            return GetStringFromNative(str, strlen);
        }

        //保守方案
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern JsValueType GetResultType(IntPtr resultInfo);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern double GetNumberFromResult(IntPtr resultInfo);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern double GetDateFromResult(IntPtr resultInfo);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr GetStringFromResult(IntPtr resultInfo, out int len);

        public static string GetStringFromResult(IntPtr resultInfo)
        {
            int strlen;
            IntPtr str = GetStringFromResult(resultInfo, out strlen);
            return GetStringFromNative(str, strlen);
        }

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool GetBooleanFromResult(IntPtr resultInfo);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool ResultIsBigInt(IntPtr resultInfo);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern long GetBigIntFromResult(IntPtr resultInfo);

        public static long GetBigIntFromResultCheck(IntPtr resultInfo)
        {
            if (!ResultIsBigInt(resultInfo))
            {
                throw new InvalidOperationException("expect a bigint");
            }
            return GetBigIntFromResult(resultInfo);
        }

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr GetObjectFromResult(IntPtr resultInfo);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern int GetTypeIdFromResult(IntPtr resultInfo);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr GetFunctionFromResult(IntPtr resultInfo);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void ResetResult(IntPtr resultInfo);
        //end cs call js

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void CreateInspector(IntPtr isolate, int port);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void DestroyInspector(IntPtr isolate);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool InspectorTick(IntPtr isolate);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
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

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void ReturnArrayBuffer(IntPtr isolate, IntPtr info, byte[] bytes, int Length);
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void SetArrayBufferToOutValue(IntPtr isolate, IntPtr value, Byte[] bytes, int length);
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void PushArrayBufferForJSFunction(IntPtr function, byte[] bytes, int length);
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr GetArrayBufferFromValue(IntPtr isolate, IntPtr value, out int length, bool isOut);
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr GetArrayBufferFromResult(IntPtr function, out int length);
    }
}



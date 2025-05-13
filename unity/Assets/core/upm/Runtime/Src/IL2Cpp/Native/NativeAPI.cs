/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;
using System.Runtime.InteropServices;
using System.Runtime.CompilerServices;
using System.Reflection;
using System.Collections.Generic;

namespace Puerts
{
    public class NativeAPI
    {
#if (UNITY_IPHONE || UNITY_TVOS || UNITY_WEBGL || UNITY_SWITCH) && !UNITY_EDITOR
        const string DLLNAME = "__Internal";
#else
        const string DLLNAME = "puerts";
#endif

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr GetRegsterApi();

#if !UNITY_WEBGL || UNITY_EDITOR
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr GetV8FFIApi();

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr GetV8PapiEnvRef(IntPtr isolate);
#endif

#if !PUERTS_DISABLE_IL2CPP_OPTIMIZATION && (PUERTS_IL2CPP_OPTIMIZATION || !UNITY_IPHONE) && ENABLE_IL2CPP
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr GetQjsFFIApi();

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr GetQjsPapiEnvRef(IntPtr isolate);
        
        [DllImport("__Internal", CallingConvention = CallingConvention.Cdecl)]
        public static extern void InitialPuerts(IntPtr PesapiImpl);

        [DllImport("__Internal", CallingConvention = CallingConvention.Cdecl)]
        public static extern void AddPendingKillScriptObjects(IntPtr ffiApi, IntPtr jsEnv, IntPtr valueRef);
        
        [DllImport("__Internal", CallingConvention = CallingConvention.Cdecl)]
        public static extern void CleanupPendingKillScriptObjects(IntPtr jsEnv);

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

        [MethodImpl(MethodImplOptions.InternalCall)]
        public static void SetExtensionMethodGet(MethodBase methodInfo)
        {
        }

        [MethodImpl(MethodImplOptions.InternalCall)]
        public static void SetObjectToGlobal(IntPtr apis, IntPtr envRef, string key, Object obj)
        {
            throw new NotImplementedException();
        }

        [MethodImpl(MethodImplOptions.InternalCall)]
        public static object GetModuleExecutor(IntPtr apis, IntPtr NativeJsEnvPtr, Type type)
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
#if PUERTS_GENERAL
            System.Console.WriteLine("debug msg: " + msg);
#else
            UnityEngine.Debug.Log("debug msg: " + msg);
#endif
        }

        public static LogCallback Log = LogImpl;
        
        [DllImport("__Internal", CallingConvention = CallingConvention.Cdecl)]
        public static extern void SetLogCallbackInternal(IntPtr log);

        //[UnityEngine.Scripting.RequiredByNativeCodeAttribute()]
        public static void SetLogCallback(LogCallback log, LogCallback logWarning, LogCallback logError)
        {
#if PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR) || UNITY_STANDALONE_WIN
            GCHandle.Alloc(log);
            GCHandle.Alloc(logWarning);
            GCHandle.Alloc(logError);
#endif
            IntPtr fn1 = log == null ? IntPtr.Zero : Marshal.GetFunctionPointerForDelegate(log);
            IntPtr fn2 = logWarning == null ? IntPtr.Zero : Marshal.GetFunctionPointerForDelegate(logWarning);
            IntPtr fn3 = logError == null ? IntPtr.Zero : Marshal.GetFunctionPointerForDelegate(logError);

            try 
            {
                //SetLogCallback(fn1);
                SetLogCallbackInternal(fn1);
                PuertsDLL.SetLogCallback(fn1, fn2, fn3);
            }
            catch(DllNotFoundException)
            {
#if PUERTS_GENERAL
                System.Console.WriteLine("[Puer001] PuerTS's Native Plugin(s) is missing. You can solve this problem following the FAQ.");
#else
                UnityEngine.Debug.LogError("[Puer001] PuerTS's Native Plugin(s) is missing. You can solve this problem following the FAQ.");
#endif
                throw;
            }
        }

        
#if UNITY_WEBGL
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr GetWebGLFFIApi();
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr GetWebGLPapiEnvRef(IntPtr isolate);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void PreservePuertsCPP();
#endif
#endif
    }

#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate void pesapi_callback(pesapi_ffi apis, IntPtr info);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate void pesapi_function_finalize(pesapi_ffi apis, IntPtr data, IntPtr env_private);

#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_create_null_func(IntPtr env);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_create_undefined_func(IntPtr env);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_create_boolean_func(IntPtr env, bool value);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_create_int32_func(IntPtr env, int value);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_create_uint32_func(IntPtr env, uint value);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_create_int64_func(IntPtr env, long value);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_create_uint64_func(IntPtr env, ulong value);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_create_double_func(IntPtr env, double value);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_create_string_utf8_func(IntPtr env, string str, UIntPtr length);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_create_string_utf16_func(IntPtr env, string str, UIntPtr length);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_create_binary_func(IntPtr env, IntPtr str, UIntPtr length);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_create_array_func(IntPtr env);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_create_object_func(IntPtr env);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_create_function_func(IntPtr env, pesapi_callback native_impl, IntPtr data, pesapi_function_finalize finalize);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_create_class_func(IntPtr env, IntPtr type_id);

#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate bool pesapi_get_value_bool_func(IntPtr env, IntPtr value);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate int pesapi_get_value_int32_func(IntPtr env, IntPtr value);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate uint pesapi_get_value_uint32_func(IntPtr env, IntPtr value);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate long pesapi_get_value_int64_func(IntPtr env, IntPtr value);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate ulong pesapi_get_value_uint64_func(IntPtr env, IntPtr value);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate double pesapi_get_value_double_func(IntPtr env, IntPtr value);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_get_value_string_utf8_func(IntPtr env, IntPtr value, IntPtr buf, ref UIntPtr bufsize);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_get_value_string_utf16_func(IntPtr env, IntPtr value, IntPtr buf, ref UIntPtr bufsize);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_get_value_binary_func(IntPtr env, IntPtr pvalue, ref UIntPtr bufsize);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate uint pesapi_get_array_length_func(IntPtr env, IntPtr value);

#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate bool pesapi_is_null_func(IntPtr env, IntPtr value);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate bool pesapi_is_undefined_func(IntPtr env, IntPtr value);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate bool pesapi_is_boolean_func(IntPtr env, IntPtr value);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate bool pesapi_is_int32_func(IntPtr env, IntPtr value);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate bool pesapi_is_uint32_func(IntPtr env, IntPtr value);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate bool pesapi_is_int64_func(IntPtr env, IntPtr value);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate bool pesapi_is_uint64_func(IntPtr env, IntPtr value);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate bool pesapi_is_double_func(IntPtr env, IntPtr value);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate bool pesapi_is_string_func(IntPtr env, IntPtr value);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate bool pesapi_is_object_func(IntPtr env, IntPtr value);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate bool pesapi_is_function_func(IntPtr env, IntPtr value);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate bool pesapi_is_binary_func(IntPtr env, IntPtr value);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate bool pesapi_is_array_func(IntPtr env, IntPtr value);

#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_native_object_to_value_func(IntPtr env, IntPtr type_id, IntPtr object_ptr, bool call_finalize);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_get_native_object_ptr_func(IntPtr env, IntPtr value);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_get_native_object_typeid_func(IntPtr env, IntPtr value);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate bool pesapi_is_instance_of_func(IntPtr env, IntPtr type_id, IntPtr value);

#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_boxing_func(IntPtr env, IntPtr value);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_unboxing_func(IntPtr env, IntPtr value);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate void pesapi_update_boxed_value_func(IntPtr env, IntPtr boxed_value, IntPtr value);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate bool pesapi_is_boxed_value_func(IntPtr env, IntPtr value);

#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate int pesapi_get_args_len_func(IntPtr info);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_get_arg_func(IntPtr info, int index);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_get_env_func(IntPtr info);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_get_native_holder_ptr_func(IntPtr info);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_get_native_holder_typeid_func(IntPtr info);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_get_userdata_func(IntPtr info);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate void pesapi_add_return_func(IntPtr info, IntPtr value);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate void pesapi_throw_by_string_func(IntPtr pinfo, string msg);

#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_create_env_ref_func(IntPtr env);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate bool pesapi_env_ref_is_valid_func(IntPtr env);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_get_env_from_ref_func(IntPtr env_ref);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_duplicate_env_ref_func(IntPtr env_ref);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate void pesapi_release_env_ref_func(IntPtr env_ref);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_open_scope_func(IntPtr env_ref);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_open_scope_placement_func(IntPtr env_ref, IntPtr memory);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate bool pesapi_has_caught_func(IntPtr scope);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_get_exception_as_string_func(IntPtr scope, bool with_stack);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate void pesapi_close_scope_func(IntPtr scope);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate void pesapi_close_scope_placement_func(IntPtr scope);

#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_create_value_ref_func(IntPtr env, IntPtr value, uint internal_field_count);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_duplicate_value_ref_func(IntPtr value_ref);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate void pesapi_release_value_ref_func(IntPtr value_ref);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_get_value_from_ref_func(IntPtr env, IntPtr value_ref);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate void pesapi_set_ref_weak_func(IntPtr env, IntPtr value_ref);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate bool pesapi_set_owner_func(IntPtr env, IntPtr value, IntPtr owner);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_get_ref_associated_env_func(IntPtr value_ref);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_get_ref_internal_fields_func(IntPtr value_ref, ref uint pinternal_field_count);

#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_get_property_func(IntPtr env, IntPtr objectPtr, string key);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate void pesapi_set_property_func(IntPtr env, IntPtr objectPtr, string key, IntPtr value);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate bool pesapi_get_private_func(IntPtr env, IntPtr objectPtr, out IntPtr outPtr);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate bool pesapi_set_private_func(IntPtr env, IntPtr objectPtr, IntPtr ptr);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_get_property_uint32_func(IntPtr env, IntPtr objectPtr, uint key);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate void pesapi_set_property_uint32_func(IntPtr env, IntPtr objectPtr, uint key, IntPtr value);

#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_call_function_func(IntPtr env, IntPtr func, IntPtr this_object, int argc, IntPtr[] argv);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_eval_func(IntPtr env, IntPtr code, UIntPtr code_size, string path);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_global_func(IntPtr env);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_get_env_private_func(IntPtr env);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate void pesapi_set_env_private_func(IntPtr env, IntPtr ptr);

    [StructLayout(LayoutKind.Sequential)]
    public struct pesapi_ffi
    {
        public pesapi_create_null_func create_null;
        public pesapi_create_undefined_func create_undefined;
        public pesapi_create_boolean_func create_boolean;
        public pesapi_create_int32_func create_int32;
        public pesapi_create_uint32_func create_uint32;
        public pesapi_create_int64_func create_int64;
        public pesapi_create_uint64_func create_uint64;
        public pesapi_create_double_func create_double;
        public pesapi_create_string_utf8_func create_string_utf8;
        public pesapi_create_string_utf16_func create_string_utf16;
        public pesapi_create_binary_func create_binary;
        public pesapi_create_array_func create_array;
        public pesapi_create_object_func create_object;
        public pesapi_create_function_func create_function;
        public pesapi_create_class_func create_class;
        public pesapi_get_value_bool_func get_value_bool;
        public pesapi_get_value_int32_func get_value_int32;
        public pesapi_get_value_uint32_func get_value_uint32;
        public pesapi_get_value_int64_func get_value_int64;
        public pesapi_get_value_uint64_func get_value_uint64;
        public pesapi_get_value_double_func get_value_double;
        public pesapi_get_value_string_utf8_func get_value_string_utf8;
        public pesapi_get_value_string_utf16_func get_value_string_utf16;
        public pesapi_get_value_binary_func get_value_binary;
        public pesapi_get_array_length_func get_array_length;
        public pesapi_is_null_func is_null;
        public pesapi_is_undefined_func is_undefined;
        public pesapi_is_boolean_func is_boolean;
        public pesapi_is_int32_func is_int32;
        public pesapi_is_uint32_func is_uint32;
        public pesapi_is_int64_func is_int64;
        public pesapi_is_uint64_func is_uint64;
        public pesapi_is_double_func is_double;
        public pesapi_is_string_func is_string;
        public pesapi_is_object_func is_object;
        public pesapi_is_function_func is_function;
        public pesapi_is_binary_func is_binary;
        public pesapi_is_array_func is_array;
        public pesapi_native_object_to_value_func native_object_to_value;
        public pesapi_get_native_object_ptr_func get_native_object_ptr;
        public pesapi_get_native_object_typeid_func get_native_object_typeid;
        public pesapi_is_instance_of_func is_instance_of;
        public pesapi_boxing_func boxing;
        public pesapi_unboxing_func unboxing;
        public pesapi_update_boxed_value_func update_boxed_value;
        public pesapi_is_boxed_value_func is_boxed_value;
        public pesapi_get_args_len_func get_args_len;
        public pesapi_get_arg_func get_arg;
        public pesapi_get_env_func get_env;
        public pesapi_get_native_holder_ptr_func get_native_holder_ptr;
        public pesapi_get_native_holder_typeid_func get_native_holder_typeid;
        public pesapi_get_userdata_func get_userdata;
        public pesapi_add_return_func add_return;
        public pesapi_throw_by_string_func throw_by_string;
        public pesapi_create_env_ref_func create_env_ref;
        public pesapi_env_ref_is_valid_func env_ref_is_valid;
        public pesapi_get_env_from_ref_func get_env_from_ref;
        public pesapi_duplicate_env_ref_func duplicate_env_ref;
        public pesapi_release_env_ref_func release_env_ref;
        public pesapi_open_scope_func open_scope;
        public pesapi_open_scope_placement_func open_scope_placement;
        public pesapi_has_caught_func has_caught;
        public pesapi_get_exception_as_string_func get_exception_as_string;
        public pesapi_close_scope_func close_scope;
        public pesapi_close_scope_placement_func close_scope_placement;
        public pesapi_create_value_ref_func create_value_ref;
        public pesapi_duplicate_value_ref_func duplicate_value_ref;
        public pesapi_release_value_ref_func release_value_ref;
        public pesapi_get_value_from_ref_func get_value_from_ref;
        public pesapi_set_ref_weak_func set_ref_weak;
        public pesapi_set_owner_func set_owner;
        public pesapi_get_ref_associated_env_func get_ref_associated_env;
        public pesapi_get_ref_internal_fields_func get_ref_internal_fields;
        public pesapi_get_property_func get_property;
        public pesapi_set_property_func set_property;
        public pesapi_get_private_func get_private;
        public pesapi_set_private_func set_private;
        public pesapi_get_property_uint32_func get_property_uint32;
        public pesapi_set_property_uint32_func set_property_uint32;
        public pesapi_call_function_func call_function;
        public pesapi_eval_func eval;
        public pesapi_global_func global;
        public pesapi_get_env_private_func get_env_private;
        public pesapi_set_env_private_func set_env_private;
    }
}

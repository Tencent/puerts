/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
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
#if !ENABLE_IL2CPP
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_null(IntPtr apis, IntPtr env);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_undefined(IntPtr apis, IntPtr env);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_boolean(IntPtr apis, IntPtr env, bool value);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_int32(IntPtr apis, IntPtr env, int value);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_uint32(IntPtr apis, IntPtr env, uint value);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_int64(IntPtr apis, IntPtr env, long value);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_uint64(IntPtr apis, IntPtr env, ulong value);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_double(IntPtr apis, IntPtr env, double value);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_string_utf8(IntPtr apis, IntPtr env, string str, UIntPtr length);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_string_utf16(IntPtr apis, IntPtr env, string str, UIntPtr length);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_binary(IntPtr apis, IntPtr env, IntPtr data, UIntPtr length);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_array(IntPtr apis, IntPtr env);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_object(IntPtr apis, IntPtr env);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_function(IntPtr apis, IntPtr env, pesapi_callback native_impl, IntPtr data, pesapi_function_finalize finalize);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_class(IntPtr apis, IntPtr env, IntPtr type_id);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_get_value_bool(IntPtr apis, IntPtr env, IntPtr value);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern int pesapi_get_value_int32(IntPtr apis, IntPtr env, IntPtr value);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern uint pesapi_get_value_uint32(IntPtr apis, IntPtr env, IntPtr value);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern long pesapi_get_value_int64(IntPtr apis, IntPtr env, IntPtr value);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern ulong pesapi_get_value_uint64(IntPtr apis, IntPtr env, IntPtr value);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern double pesapi_get_value_double(IntPtr apis, IntPtr env, IntPtr value);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_value_string_utf8(IntPtr apis, IntPtr env, IntPtr value, IntPtr buf, ref UIntPtr bufsize);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_value_string_utf16(IntPtr apis, IntPtr env, IntPtr value, IntPtr buf, ref UIntPtr bufsize);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_value_binary(IntPtr apis, IntPtr env, IntPtr pvalue, ref UIntPtr bufsize);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern uint pesapi_get_array_length(IntPtr apis, IntPtr env, IntPtr value);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_is_null(IntPtr apis, IntPtr env, IntPtr value);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_is_undefined(IntPtr apis, IntPtr env, IntPtr value);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_is_boolean(IntPtr apis, IntPtr env, IntPtr value);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_is_int32(IntPtr apis, IntPtr env, IntPtr value);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_is_uint32(IntPtr apis, IntPtr env, IntPtr value);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_is_int64(IntPtr apis, IntPtr env, IntPtr value);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_is_uint64(IntPtr apis, IntPtr env, IntPtr value);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_is_double(IntPtr apis, IntPtr env, IntPtr value);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_is_string(IntPtr apis, IntPtr env, IntPtr value);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_is_object(IntPtr apis, IntPtr env, IntPtr value);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_is_function(IntPtr apis, IntPtr env, IntPtr value);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_is_binary(IntPtr apis, IntPtr env, IntPtr value);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_is_array(IntPtr apis, IntPtr env, IntPtr value);

        // Native object handling
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_native_object_to_value(IntPtr apis, IntPtr env, IntPtr type_id, IntPtr object_ptr, bool call_finalize);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_native_object_ptr(IntPtr apis, IntPtr env, IntPtr value);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_native_object_typeid(IntPtr apis, IntPtr env, IntPtr value);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_is_instance_of(IntPtr apis, IntPtr env, IntPtr type_id, IntPtr value);

        // Callback handling
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern int pesapi_get_args_len(IntPtr apis, IntPtr info);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_arg(IntPtr apis, IntPtr info, int index);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_env(IntPtr apis, IntPtr info);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_native_holder_ptr(IntPtr apis, IntPtr info);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_native_holder_typeid(IntPtr apis, IntPtr info);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_userdata(IntPtr apis, IntPtr info);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void pesapi_add_return(IntPtr apis, IntPtr info, IntPtr value);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void pesapi_throw_by_string(IntPtr apis, IntPtr pinfo, string msg);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_env_ref(IntPtr apis, IntPtr env);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_env_ref_is_valid(IntPtr apis, IntPtr env);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_env_from_ref(IntPtr apis, IntPtr env_ref);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_duplicate_env_ref(IntPtr apis, IntPtr env_ref);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void pesapi_release_env_ref(IntPtr apis, IntPtr env_ref);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_open_scope(IntPtr apis, IntPtr env_ref);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_open_scope_placement(IntPtr apis, IntPtr env_ref, IntPtr memory);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_has_caught(IntPtr apis, IntPtr scope);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_exception_as_string(IntPtr apis, IntPtr scope, bool with_stack);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void pesapi_close_scope(IntPtr apis, IntPtr scope);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void pesapi_close_scope_placement(IntPtr apis, IntPtr scope);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_value_ref(IntPtr apis, IntPtr env, IntPtr value, uint internal_field_count);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_duplicate_value_ref(IntPtr apis, IntPtr value_ref);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void pesapi_release_value_ref(IntPtr apis, IntPtr value_ref);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_value_from_ref(IntPtr apis, IntPtr env, IntPtr value_ref);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void pesapi_set_ref_weak(IntPtr apis, IntPtr env, IntPtr value_ref);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_set_owner(IntPtr apis, IntPtr env, IntPtr value, IntPtr owner);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_ref_associated_env(IntPtr apis, IntPtr value_ref);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_ref_internal_fields(IntPtr apis, IntPtr value_ref, ref uint pinternal_field_count);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_property(IntPtr apis, IntPtr env, IntPtr obj, string key);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void pesapi_set_property(IntPtr apis, IntPtr env, IntPtr obj, string key, IntPtr value);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_get_private(IntPtr apis, IntPtr env, IntPtr obj, out IntPtr out_ptr);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_set_private(IntPtr apis, IntPtr env, IntPtr obj, IntPtr ptr);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_property_uint32(IntPtr apis, IntPtr env, IntPtr obj, uint key);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void pesapi_set_property_uint32(IntPtr apis, IntPtr env, IntPtr obj, uint key, IntPtr value);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_call_function(IntPtr apis, IntPtr env, IntPtr func, IntPtr this_object, int argc, IntPtr argv);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_eval(IntPtr apis, IntPtr env, IntPtr code, UIntPtr code_size, string path);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_global(IntPtr apis, IntPtr env);

        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_env_private(IntPtr apis, IntPtr env);
        
        [DllImport(DLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void pesapi_set_env_private(IntPtr apis, IntPtr env, IntPtr ptr);
#endif
    }
}

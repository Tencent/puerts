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
    public delegate void LogCallback(string content);

    public class PuertsNative
    {
#if (UNITY_IPHONE || UNITY_TVOS || UNITY_WEBGL || UNITY_SWITCH) && !UNITY_EDITOR
        const string PUERTSDLLNAME = "__Internal";
#else
        const string PUERTSDLLNAME = "PuertsCore";
#endif

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern int GetPapiVersion();

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr GetRegisterApi();

#if !ENABLE_IL2CPP
        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_null(IntPtr apis, IntPtr env);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_undefined(IntPtr apis, IntPtr env);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_boolean(IntPtr apis, IntPtr env, bool value);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_int32(IntPtr apis, IntPtr env, int value);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_uint32(IntPtr apis, IntPtr env, uint value);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_int64(IntPtr apis, IntPtr env, long value);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_uint64(IntPtr apis, IntPtr env, ulong value);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_double(IntPtr apis, IntPtr env, double value);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_string_utf8(IntPtr apis, IntPtr env, byte[] str, UIntPtr length);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_string_utf16(IntPtr apis, IntPtr env, byte[] str, UIntPtr length);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_binary(IntPtr apis, IntPtr env, byte[] data, UIntPtr length);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_array(IntPtr apis, IntPtr env);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_object(IntPtr apis, IntPtr env);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_function(IntPtr apis, IntPtr env, pesapi_callback native_impl, IntPtr data, pesapi_function_finalize finalize);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_class(IntPtr apis, IntPtr env, IntPtr type_id);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_get_value_bool(IntPtr apis, IntPtr env, IntPtr value);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern int pesapi_get_value_int32(IntPtr apis, IntPtr env, IntPtr value);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern uint pesapi_get_value_uint32(IntPtr apis, IntPtr env, IntPtr value);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern long pesapi_get_value_int64(IntPtr apis, IntPtr env, IntPtr value);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern ulong pesapi_get_value_uint64(IntPtr apis, IntPtr env, IntPtr value);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern double pesapi_get_value_double(IntPtr apis, IntPtr env, IntPtr value);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_value_string_utf8(IntPtr apis, IntPtr env, IntPtr value, byte[] buf, ref UIntPtr bufsize);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_value_string_utf16(IntPtr apis, IntPtr env, IntPtr value, byte[] buf, ref UIntPtr bufsize);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_value_binary(IntPtr apis, IntPtr env, IntPtr pvalue, ref UIntPtr bufsize);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern uint pesapi_get_array_length(IntPtr apis, IntPtr env, IntPtr value);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_is_null(IntPtr apis, IntPtr env, IntPtr value);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_is_undefined(IntPtr apis, IntPtr env, IntPtr value);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_is_boolean(IntPtr apis, IntPtr env, IntPtr value);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_is_int32(IntPtr apis, IntPtr env, IntPtr value);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_is_uint32(IntPtr apis, IntPtr env, IntPtr value);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_is_int64(IntPtr apis, IntPtr env, IntPtr value);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_is_uint64(IntPtr apis, IntPtr env, IntPtr value);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_is_double(IntPtr apis, IntPtr env, IntPtr value);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_is_string(IntPtr apis, IntPtr env, IntPtr value);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_is_object(IntPtr apis, IntPtr env, IntPtr value);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_is_function(IntPtr apis, IntPtr env, IntPtr value);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_is_binary(IntPtr apis, IntPtr env, IntPtr value);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_is_array(IntPtr apis, IntPtr env, IntPtr value);

        // Native object handling
        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_native_object_to_value(IntPtr apis, IntPtr env, IntPtr type_id, IntPtr object_ptr, bool call_finalize);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_native_object_ptr(IntPtr apis, IntPtr env, IntPtr value);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_native_object_typeid(IntPtr apis, IntPtr env, IntPtr value);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_is_instance_of(IntPtr apis, IntPtr env, IntPtr type_id, IntPtr value);

        // Callback handling
        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern int pesapi_get_args_len(IntPtr apis, IntPtr info);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_arg(IntPtr apis, IntPtr info, int index);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_env(IntPtr apis, IntPtr info);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_native_holder_ptr(IntPtr apis, IntPtr info);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_native_holder_typeid(IntPtr apis, IntPtr info);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_userdata(IntPtr apis, IntPtr info);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void pesapi_add_return(IntPtr apis, IntPtr info, IntPtr value);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void pesapi_throw_by_string(IntPtr apis, IntPtr pinfo, string msg);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_env_ref(IntPtr apis, IntPtr env);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_env_ref_is_valid(IntPtr apis, IntPtr env);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_env_from_ref(IntPtr apis, IntPtr env_ref);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_duplicate_env_ref(IntPtr apis, IntPtr env_ref);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void pesapi_release_env_ref(IntPtr apis, IntPtr env_ref);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_open_scope(IntPtr apis, IntPtr env_ref);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_open_scope_placement(IntPtr apis, IntPtr env_ref, IntPtr memory);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_has_caught(IntPtr apis, IntPtr scope);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_exception_as_string(IntPtr apis, IntPtr scope, bool with_stack);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void pesapi_close_scope(IntPtr apis, IntPtr scope);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void pesapi_close_scope_placement(IntPtr apis, IntPtr scope);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_create_value_ref(IntPtr apis, IntPtr env, IntPtr value, uint internal_field_count);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_duplicate_value_ref(IntPtr apis, IntPtr value_ref);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void pesapi_release_value_ref(IntPtr apis, IntPtr value_ref);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_value_from_ref(IntPtr apis, IntPtr env, IntPtr value_ref);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void pesapi_set_ref_weak(IntPtr apis, IntPtr env, IntPtr value_ref);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_set_owner(IntPtr apis, IntPtr env, IntPtr value, IntPtr owner);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_ref_associated_env(IntPtr apis, IntPtr value_ref);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_ref_internal_fields(IntPtr apis, IntPtr value_ref, out uint pinternal_field_count);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_property(IntPtr apis, IntPtr env, IntPtr obj, string key);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void pesapi_set_property(IntPtr apis, IntPtr env, IntPtr obj, string key, IntPtr value);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_get_private(IntPtr apis, IntPtr env, IntPtr obj, out IntPtr out_ptr);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_set_private(IntPtr apis, IntPtr env, IntPtr obj, IntPtr ptr);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_property_uint32(IntPtr apis, IntPtr env, IntPtr obj, uint key);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void pesapi_set_property_uint32(IntPtr apis, IntPtr env, IntPtr obj, uint key, IntPtr value);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_call_function(IntPtr apis, IntPtr env, IntPtr func, IntPtr this_object, int argc, IntPtr[] argv);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_eval(IntPtr apis, IntPtr env, byte[] code, UIntPtr code_size, string path);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_global(IntPtr apis, IntPtr env);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern IntPtr pesapi_get_env_private(IntPtr apis, IntPtr env);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void pesapi_set_env_private(IntPtr apis, IntPtr env, IntPtr ptr);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern bool pesapi_trace_native_object_lifecycle(IntPtr apis, IntPtr env, pesapi_on_native_object_enter on_enter, pesapi_on_native_object_exit on_exit);

        [DllImport(PUERTSDLLNAME, CallingConvention = CallingConvention.Cdecl)]
        public static extern void pesapi_set_registry(IntPtr apis, IntPtr env, IntPtr registry);
#endif

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
    }


#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate void pesapi_callback(IntPtr apis, IntPtr info);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate void pesapi_function_finalize(IntPtr apis, IntPtr data, IntPtr env_private);

    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
    public delegate IntPtr pesapi_on_native_object_enter(IntPtr ptr, IntPtr class_data, IntPtr env_private);

    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
    public delegate void pesapi_on_native_object_exit(IntPtr ptr, IntPtr class_data, IntPtr env_private, IntPtr userdata);


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
    public delegate IntPtr pesapi_create_string_utf8_func(IntPtr env, byte[] str, UIntPtr length);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_create_string_utf16_func(IntPtr env, byte[] str, UIntPtr length);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN || PUERTS_GENERAL || (UNITY_WSA && !UNITY_EDITOR)
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
#endif
    public delegate IntPtr pesapi_create_binary_func(IntPtr env, byte[] buff, UIntPtr length);
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
    public delegate IntPtr pesapi_get_ref_internal_fields_func(IntPtr value_ref, out uint pinternal_field_count);

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
    public delegate IntPtr pesapi_eval_func(IntPtr env, byte[] code, UIntPtr code_size, string path);
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

    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
    [return: MarshalAs(UnmanagedType.U1)]
    public delegate bool pesapi_trace_native_object_lifecycle_func(IntPtr env,
        pesapi_on_native_object_enter on_enter,
        pesapi_on_native_object_exit on_exit);

    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
    public delegate void pesapi_set_registry_func(IntPtr env, IntPtr registry);

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
        public pesapi_trace_native_object_lifecycle_func trace_native_object_lifecycle;
        public pesapi_set_registry_func set_registry;
    }

    //register api
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
    [return: MarshalAs(UnmanagedType.U1)]
    public delegate bool pesapi_class_not_found_callback(IntPtr type_id);

    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
    public delegate IntPtr pesapi_constructor(IntPtr apis, IntPtr info);

    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
    public delegate void pesapi_finalize(IntPtr apis, IntPtr ptr, IntPtr class_data, IntPtr env_private);

    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
    public delegate IntPtr pesapi_create_registry_func();

    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
    public delegate IntPtr pesapi_alloc_type_infos_func(UIntPtr count);

    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
    public delegate void pesapi_set_type_info_func(
        IntPtr type_infos, UIntPtr index,
        [MarshalAs(UnmanagedType.LPStr)] string name,
        [MarshalAs(UnmanagedType.U1)] bool is_pointer,
        [MarshalAs(UnmanagedType.U1)] bool is_const,
        [MarshalAs(UnmanagedType.U1)] bool is_ref,
        [MarshalAs(UnmanagedType.U1)] bool is_primitive);

    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
    public delegate IntPtr pesapi_create_signature_info_func(
        IntPtr return_type, UIntPtr parameter_count, IntPtr parameter_types);

    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
    public delegate IntPtr pesapi_alloc_property_descriptors_func(UIntPtr count);

    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
    public delegate void pesapi_set_method_info_func(
        IntPtr properties, UIntPtr index,
        IntPtr name,
        [MarshalAs(UnmanagedType.U1)] bool is_static,
        pesapi_callback method,
        IntPtr data,
        IntPtr signature_info);

    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
    public delegate void pesapi_set_property_info_func(
        IntPtr properties, UIntPtr index,
        IntPtr name,
        [MarshalAs(UnmanagedType.U1)] bool is_static,
        pesapi_callback getter,
        pesapi_callback setter,
        IntPtr getter_data,
        IntPtr setter_data,
        IntPtr type_info);

    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
    public delegate void pesapi_define_class_func(
        IntPtr registry,
        IntPtr type_id, IntPtr super_type_id,
        [MarshalAs(UnmanagedType.LPStr)] string module_name,
        [MarshalAs(UnmanagedType.LPStr)] string type_name,
        pesapi_constructor constructor,
        pesapi_finalize finalize,
        UIntPtr property_count,
        IntPtr properties,
        IntPtr data,
        [MarshalAs(UnmanagedType.U1)] bool copy_str);

    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
    public delegate IntPtr pesapi_get_class_data_func(IntPtr registry, IntPtr type_id, [MarshalAs(UnmanagedType.U1)] bool force_load);

    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
    public delegate void pesapi_on_class_not_found_func(IntPtr registry, pesapi_class_not_found_callback callback);

    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
    public delegate void pesapi_class_type_info_func(
        IntPtr registry,
        [MarshalAs(UnmanagedType.LPStr)] string proto_magic_id,
        IntPtr type_id,
        IntPtr constructor_info,
        IntPtr methods_info,
        IntPtr functions_info,
        IntPtr properties_info,
        IntPtr variables_info);

    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
    public delegate IntPtr pesapi_find_type_id_func(
        IntPtr registry,
        [MarshalAs(UnmanagedType.LPStr)] string module_name,
        [MarshalAs(UnmanagedType.LPStr)] string type_name);

    [StructLayout(LayoutKind.Sequential)]
    public struct pesapi_reg_api
    {
        public pesapi_create_registry_func create_registry;
        public pesapi_alloc_type_infos_func alloc_type_infos;
        public pesapi_set_type_info_func set_type_info;
        public pesapi_create_signature_info_func create_signature_info;
        public pesapi_alloc_property_descriptors_func alloc_property_descriptors;
        public pesapi_set_method_info_func set_method_info;
        public pesapi_set_property_info_func set_property_info;
        public pesapi_define_class_func define_class;
        public pesapi_get_class_data_func get_class_data;
        public pesapi_on_class_not_found_func on_class_not_found;
        public pesapi_class_type_info_func class_type_info;
        public pesapi_find_type_id_func find_type_id;
    }
}

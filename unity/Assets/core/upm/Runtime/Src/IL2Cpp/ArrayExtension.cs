/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if UNITY_2020_1_OR_NEWER
#if !PUERTS_DISABLE_IL2CPP_OPTIMIZATION && (PUERTS_IL2CPP_OPTIMIZATION || !UNITY_IPHONE)
using System;

namespace PuertsIl2cpp
{
    public static class ArrayExtension
    {
        [UnityEngine.Scripting.Preserve] public static int get_Item(this int[] arr, int idx) { return arr[idx]; }
        [UnityEngine.Scripting.Preserve] public static float get_Item(this float[] arr, int idx) { return arr[idx]; }
        [UnityEngine.Scripting.Preserve] public static double get_Item(this double[] arr, int idx) { return arr[idx]; }
        [UnityEngine.Scripting.Preserve] public static bool get_Item(this bool[] arr, int idx) { return arr[idx]; }
        [UnityEngine.Scripting.Preserve] public static long get_Item(this long[] arr, int idx) { return arr[idx]; }
        [UnityEngine.Scripting.Preserve] public static ulong get_Item(this ulong[] arr, int idx) { return arr[idx]; }
        [UnityEngine.Scripting.Preserve] public static sbyte get_Item(this sbyte[] arr, int idx) { return arr[idx]; }
        [UnityEngine.Scripting.Preserve] public static byte get_Item(this byte[] arr, int idx) { return arr[idx]; }
        [UnityEngine.Scripting.Preserve] public static ushort get_Item(this ushort[] arr, int idx) { return arr[idx]; }
        [UnityEngine.Scripting.Preserve] public static short get_Item(this short[] arr, int idx) { return arr[idx]; }
        [UnityEngine.Scripting.Preserve] public static char get_Item(this char[] arr, int idx) { return arr[idx]; }
        [UnityEngine.Scripting.Preserve] public static uint get_Item(this uint[] arr, int idx) { return arr[idx]; }
        [UnityEngine.Scripting.Preserve] public static string get_Item(this string[] arr, int idx) { return arr[idx]; }
        [UnityEngine.Scripting.Preserve] public static object get_Item(this System.Array arr, int idx) { return arr.GetValue(idx); }
        [UnityEngine.Scripting.Preserve] public static void set_Item(this int[] arr, int idx, int val) { arr[idx] = val; }
        [UnityEngine.Scripting.Preserve] public static void set_Item(this float[] arr, int idx, float val) { arr[idx] = val; }
        [UnityEngine.Scripting.Preserve] public static void set_Item(this double[] arr, int idx, double val) { arr[idx] = val; }
        [UnityEngine.Scripting.Preserve] public static void set_Item(this bool[] arr, int idx, bool val) { arr[idx] = val; }
        [UnityEngine.Scripting.Preserve] public static void set_Item(this long[] arr, int idx, long val) { arr[idx] = val; }
        [UnityEngine.Scripting.Preserve] public static void set_Item(this ulong[] arr, int idx, ulong val) { arr[idx] = val; }
        [UnityEngine.Scripting.Preserve] public static void set_Item(this sbyte[] arr, int idx, sbyte val) { arr[idx] = val; }
        [UnityEngine.Scripting.Preserve] public static void set_Item(this byte[] arr, int idx, byte val) { arr[idx] = val; }
        [UnityEngine.Scripting.Preserve] public static void set_Item(this ushort[] arr, int idx, ushort val) { arr[idx] = val; }
        [UnityEngine.Scripting.Preserve] public static void set_Item(this short[] arr, int idx, short val) { arr[idx] = val; }
        [UnityEngine.Scripting.Preserve] public static void set_Item(this char[] arr, int idx, char val) { arr[idx] = val; }
        [UnityEngine.Scripting.Preserve] public static void set_Item(this uint[] arr, int idx, uint val) { arr[idx] = val; }
        [UnityEngine.Scripting.Preserve] public static void set_Item(this string[] arr, int idx, string val) { arr[idx] = val; }
        [UnityEngine.Scripting.Preserve] public static void set_Item(this System.Array arr, int idx, object val) 
        { 
            if (val != null && typeof(Puerts.TypedValue).IsAssignableFrom(val.GetType())) 
            {
                val = ((Puerts.TypedValue)val).Target;
            }
            arr.SetValue(val, idx); 
        }
    }
}
#else 

namespace PuertsIl2cpp
{
    public static class ArrayExtension
    {
    }
}
#endif
#endif
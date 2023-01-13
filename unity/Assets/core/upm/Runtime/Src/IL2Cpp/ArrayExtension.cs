using System;

namespace PuertsIl2cpp
{
    // public static class ArrayExtensionUtils
    // {
    //     public static object castDoubleToObject(double val, TypeCode toType)
    //     {
    //         switch (toType)
    //         {
    //             case TypeCode.Empty: throw new InvalidCastException("Object cannot be cast to Empty.");
    //             case TypeCode.Object: return val;
    //             case TypeCode.DBNull: throw new InvalidCastException("Object cannot be cast to DBNull.");
    //             case TypeCode.Boolean: return Convert.ToBoolean(val);
    //             case TypeCode.Char: return Convert.ToChar(val);
    //             case TypeCode.SByte: return Convert.ToSByte(val);
    //             case TypeCode.Byte: return Convert.ToByte(val);
    //             case TypeCode.Int16: return Convert.ToInt16(val);
    //             case TypeCode.UInt16: return Convert.ToUInt16(val);
    //             case TypeCode.Int32: return Convert.ToInt32(val);
    //             case TypeCode.UInt32: return Convert.ToUInt32(val);
    //             case TypeCode.Int64: return Convert.ToInt64(val);
    //             case TypeCode.UInt64: return Convert.ToUInt64(val);
    //             case TypeCode.Single: return Convert.ToSingle(val);
    //             case TypeCode.Double: return val;
    //             case TypeCode.Decimal: return Convert.ToDecimal(val);
    //             case TypeCode.DateTime: return Convert.ToDateTime(val);
    //             case TypeCode.String: return Convert.ToString(val);
    //             default: throw new InvalidCastException($"Object cannot be cast to invalid type code ${toType}.");
    //         }
    //     }
    //     public static object castLongToObject(long val, TypeCode toType)
    //     {
    //         switch (toType)
    //         {
    //             case TypeCode.Empty: throw new InvalidCastException("Object cannot be cast to Empty.");
    //             case TypeCode.Object: return val;
    //             case TypeCode.DBNull: throw new InvalidCastException("Object cannot be cast to DBNull.");
    //             case TypeCode.Boolean: return Convert.ToBoolean(val);
    //             case TypeCode.Char: return Convert.ToChar(val);
    //             case TypeCode.SByte: return Convert.ToSByte(val);
    //             case TypeCode.Byte: return Convert.ToByte(val);
    //             case TypeCode.Int16: return Convert.ToInt16(val);
    //             case TypeCode.UInt16: return Convert.ToUInt16(val);
    //             case TypeCode.Int32: return Convert.ToInt32(val);
    //             case TypeCode.UInt32: return Convert.ToUInt32(val);
    //             case TypeCode.Int64: return val;
    //             case TypeCode.UInt64: return Convert.ToUInt64(val);
    //             case TypeCode.Single: return Convert.ToSingle(val);
    //             case TypeCode.Double: return Convert.ToDouble(val);;
    //             case TypeCode.Decimal: return Convert.ToDecimal(val);
    //             case TypeCode.DateTime: return Convert.ToDateTime(val);
    //             case TypeCode.String: return Convert.ToString(val);
    //             default: throw new InvalidCastException($"Object cannot be cast to invalid type code ${toType}.");
    //         }
    //     }
    // }

    // public static class ArrayExtension2
    // {
    //     // used by object[], to specify type of element
    //     [UnityEngine.Scripting.Preserve] public static void set_ItemBigInt(this System.Array arr, int idx, long val, TypeCode toTypeCode) 
    //     { 
    //         arr.SetValue(ArrayExtensionUtils.castLongToObject(val, toTypeCode), idx);
    //     }
    //     [UnityEngine.Scripting.Preserve] public static void set_ItemNumber(this System.Array arr, int idx, double val, TypeCode toTypeCode) 
    //     { 
    //         arr.SetValue(ArrayExtensionUtils.castDoubleToObject(val, toTypeCode), idx);
    //     }
    // }

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
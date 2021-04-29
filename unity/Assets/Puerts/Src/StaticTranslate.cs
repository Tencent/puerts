/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;

namespace Puerts
{
    public static class StaticTranslate<T>
    {
        public delegate void PushFunc(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr function, T o);

        public delegate T GetFunc(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr holder, bool isByRef);

        public static PushFunc Set = DefaultPush;

        public static GetFunc Get = DefaultGetResult;

        private static void DefaultPush(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr function, T o)
        {
            JsEnv.jsEnvs[jsEnvIdx].GeneralSetterManager.GetTranslateFunc(typeof(T))(isolate, setValueApi, function, o);
        }

        private static T DefaultGetResult(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            object obj = JsEnv.jsEnvs[jsEnvIdx].GeneralGetterManager.GetTranslateFunc(typeof(T))(isolate, getValueApi, value, isByRef);
            if (obj == null)
            {
                return default(T);
            }
            else
            {
                return (T)obj;
            }
        }

        public static void ReplaceDefault(PushFunc pushFunc, GetFunc getFunc)
        {
            Set = pushFunc;
            Get = getFunc;
        }
    }

    public static class PrimitiveTypeTranslate
    {
        public static void PushChar(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, char i)
        {
            setValueApi.SetNumber(isolate, holder, i);
        }

        public static char GetChar(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr holder, bool isByRef)
        {
            return (char)getValueApi.GetNumber(isolate, holder, isByRef);
        }

        public static void PushSByte(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, sbyte i)
        {
            setValueApi.SetNumber(isolate, holder, i);
        }

        public static sbyte GetSByte(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr holder, bool isByRef)
        {
            return (sbyte)getValueApi.GetNumber(isolate, holder, isByRef);
        }

        public static void PushByte(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, byte i)
        {
            setValueApi.SetNumber(isolate, holder, i);
        }

        public static byte GetByte(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr holder, bool isByRef)
        {
            return (byte)getValueApi.GetNumber(isolate, holder, isByRef);
        }

        public static void PushInt16(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, short i)
        {
            setValueApi.SetNumber(isolate, holder, i);
        }

        public static short GetInt16(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr holder, bool isByRef)
        {
            return (short)getValueApi.GetNumber(isolate, holder, isByRef);
        }

        public static void PushUInt16(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, ushort i)
        {
            setValueApi.SetNumber(isolate, holder, i);
        }

        public static ushort GetUInt16(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr holder, bool isByRef)
        {
            return (ushort)getValueApi.GetNumber(isolate, holder, isByRef);
        }

        public static void PushInt32(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, int i)
        {
            setValueApi.SetNumber(isolate, holder, i);
        }

        public static int GetInt32(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr holder, bool isByRef)
        {
            return (int)getValueApi.GetNumber(isolate, holder, isByRef);
        }

        public static void PushUInt32(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, uint i)
        {
            setValueApi.SetNumber(isolate, holder, i);
        }

        public static uint GetUInt32(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr holder, bool isByRef)
        {
            return (uint)getValueApi.GetNumber(isolate, holder, isByRef);
        }

        public static void PushInt64(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, long i)
        {
            setValueApi.SetBigInt(isolate, holder, i);
        }

        public static long GetInt64(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr holder, bool isByRef)
        {
            return getValueApi.GetBigInt(isolate, holder, isByRef);
        }

        public static void PushUInt64(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, ulong i)
        {
            setValueApi.SetBigInt(isolate, holder, (long)i);
        }

        public static ulong GetUInt64(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr holder, bool isByRef)
        {
            return (ulong)getValueApi.GetBigInt(isolate, holder, isByRef);
        }

        public static void PushDouble(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, double i)
        {
            setValueApi.SetNumber(isolate, holder, i);
        }

        public static double GetDouble(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr holder, bool isByRef)
        {
            return getValueApi.GetNumber(isolate, holder, isByRef);
        }

        public static void PushFloat(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, float i)
        {
            setValueApi.SetNumber(isolate, holder, i);
        }

        public static float GetFloat(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr holder, bool isByRef)
        {
            return (float)getValueApi.GetNumber(isolate, holder, isByRef);
        }

        public static void PushBoolean(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, bool i)
        {
            setValueApi.SetBoolean(isolate, holder, i);
        }

        public static bool GetBoolean(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr holder, bool isByRef)
        {
            return getValueApi.GetBoolean(isolate, holder, isByRef);
        }

        public static void PushString(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, string i)
        {
            setValueApi.SetString(isolate, holder, i);
        }

        public static string GetString(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr holder, bool isByRef)
        {
            return getValueApi.GetString(isolate, holder, isByRef);
        }

        public static void PushDateTime(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, DateTime date)
        {
            setValueApi.SetDate(isolate, holder, (date - new DateTime(1970, 1, 1)).TotalMilliseconds);
        }

        public static DateTime GetDateTime(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr holder, bool isByRef)
        {
            var ticks = getValueApi.GetDate(isolate, holder, isByRef);
            return (new DateTime(1970, 1, 1)).AddMilliseconds(ticks);
        }

        public static void PushArrayBuffer(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, ArrayBuffer arrayBuffer)
        {
            setValueApi.SetArrayBuffer(isolate, holder, arrayBuffer);
        }

        public static ArrayBuffer GetArrayBuffer(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr holder, bool isByRef)
        {
            return getValueApi.GetArrayBuffer(isolate, holder, isByRef);
        }

        internal static void Init()
        {
            StaticTranslate<bool>.ReplaceDefault(PushBoolean, GetBoolean);
            StaticTranslate<char>.ReplaceDefault(PushChar, GetChar);
            StaticTranslate<sbyte>.ReplaceDefault(PushSByte, GetSByte);
            StaticTranslate<byte>.ReplaceDefault(PushByte, GetByte);
            StaticTranslate<short>.ReplaceDefault(PushInt16, GetInt16);
            StaticTranslate<ushort>.ReplaceDefault(PushUInt16, GetUInt16);
            StaticTranslate<int>.ReplaceDefault(PushInt32, GetInt32);
            StaticTranslate<uint>.ReplaceDefault(PushUInt32, GetUInt32);
            StaticTranslate<long>.ReplaceDefault(PushInt64, GetInt64);
            StaticTranslate<ulong>.ReplaceDefault(PushUInt64, GetUInt64);
            StaticTranslate<double>.ReplaceDefault(PushDouble, GetDouble);
            StaticTranslate<float>.ReplaceDefault(PushFloat, GetFloat);
            StaticTranslate<string>.ReplaceDefault(PushString, GetString);
            StaticTranslate<DateTime>.ReplaceDefault(PushDateTime, GetDateTime);
            StaticTranslate<ArrayBuffer>.ReplaceDefault(PushArrayBuffer, GetArrayBuffer);
        }
    }
}
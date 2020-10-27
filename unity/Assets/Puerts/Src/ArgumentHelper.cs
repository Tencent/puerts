/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;

namespace Puerts
{
    public struct ArgumentHelper
    {
        private readonly int jsEnvIdx;
        private readonly IntPtr isolate;
        private readonly IntPtr value;
        private readonly JsValueType valueType;
        private object obj;
        private Type csType;

        public ArgumentHelper(int jsEnvIdx, IntPtr isolate, IntPtr info, int index)
        {
            this.jsEnvIdx = jsEnvIdx;
            this.isolate = isolate;
            value = PuertsDLL.GetArgumentValue(info, index);
            valueType = PuertsDLL.GetJsValueType(isolate, value, false);
            obj = null;
            csType = null;
        }

        public bool IsMatch(JsValueType expectJsType, Type expectCsType, bool isByRef, bool isOut)
        {
            var jsType = this.valueType;
            if (jsType == JsValueType.JsObject)
            {
                if (!isByRef) return false;
                if (isOut) return true;
                jsType = PuertsDLL.GetJsValueType(isolate, value, true);
            }
            if ((expectJsType & jsType) != jsType)
            {
                return false;
            }
            if (jsType == JsValueType.NativeObject)
            {
                if (expectCsType.IsArray)
                {
                    if (obj == null)
                    {
                        obj = JsEnv.jsEnvs[jsEnvIdx].GeneralGetterManager.AnyTranslator(isolate, NativeValueApi.GetValueFromArgument, value, isByRef);
                    }

                    return expectCsType != null && expectCsType.IsAssignableFrom(obj.GetType());
                }
                else
                {
                    if (csType == null)
                    {
                        var typeId = NativeValueApi.GetValueFromArgument.GetTypeId(isolate, value, isByRef);
                        if (typeId >= 0)
                        {
                            csType = JsEnv.jsEnvs[jsEnvIdx].TypeRegister.GetType(typeId);
                        }
                    }
                    return csType != null && expectCsType != null && expectCsType.IsAssignableFrom(csType);
                }
            }
            return true;
        }

        public char GetChar(bool isByRef)
        {
            return (char)PuertsDLL.GetNumberFromValue(isolate, value, isByRef);
        }

        public void SetByRefValue(char val)
        {
            PuertsDLL.SetNumberToOutValue(isolate, value, val);
        }

        public sbyte GetSByte(bool isByRef)
        {
            return (sbyte)PuertsDLL.GetNumberFromValue(isolate, value, isByRef);
        }

        public void SetByRefValue(sbyte val)
        {
            PuertsDLL.SetNumberToOutValue(isolate, value, val);
        }

        public byte GetByte(bool isByRef)
        {
            return (byte)PuertsDLL.GetNumberFromValue(isolate, value, isByRef);
        }

        public void SetByRefValue(byte val)
        {
            PuertsDLL.SetNumberToOutValue(isolate, value, val);
        }

        public short GetInt16(bool isByRef)
        {
            return (short)PuertsDLL.GetNumberFromValue(isolate, value, isByRef);
        }

        public void SetByRefValue(short val)
        {
            PuertsDLL.SetNumberToOutValue(isolate, value, val);
        }

        public ushort GetUInt16(bool isByRef)
        {
            return (ushort)PuertsDLL.GetNumberFromValue(isolate, value, isByRef);
        }

        public void SetByRefValue(ushort val)
        {
            PuertsDLL.SetNumberToOutValue(isolate, value, val);
        }

        public int GetInt32(bool isByRef)
        {
            return (int)PuertsDLL.GetNumberFromValue(isolate, value, isByRef);
        }

        public void SetByRefValue(int val)
        {
            PuertsDLL.SetNumberToOutValue(isolate, value, val);
        }

        public uint GetUInt32(bool isByRef)
        {
            return (uint)PuertsDLL.GetNumberFromValue(isolate, value, isByRef);
        }

        public void SetByRefValue(uint val)
        {
            PuertsDLL.SetNumberToOutValue(isolate, value, val);
        }

        public long GetInt64(bool isByRef)
        {
            return PuertsDLL.GetBigIntFromValueChecked(isolate, value, isByRef);
        }

        public void SetByRefValue(long val)
        {
            PuertsDLL.SetBigIntToOutValue(isolate, value, val);
        }

        public ulong GetUInt64(bool isByRef)
        {
            return (ulong)PuertsDLL.GetBigIntFromValueChecked(isolate, value, isByRef);
        }

        public void SetByRefValue(ulong val)
        {
            PuertsDLL.SetBigIntToOutValue(isolate, value, (long)val);
        }

        public double GetDouble(bool isByRef)
        {
            return PuertsDLL.GetNumberFromValue(isolate, value, isByRef);
        }

        public void SetByRefValue(double val)
        {
            PuertsDLL.SetNumberToOutValue(isolate, value, val);
        }

        public float GetFloat(bool isByRef)
        {
            return (float)PuertsDLL.GetNumberFromValue(isolate, value, isByRef);
        }

        public void SetByRefValue(float val)
        {
            PuertsDLL.SetNumberToOutValue(isolate, value, val);
        }

        public bool GetBoolean(bool isByRef)
        {
            return PuertsDLL.GetBooleanFromValue(isolate, value, isByRef);
        }

        public void SetByRefValue(bool val)
        {
            PuertsDLL.SetBooleanToOutValue(isolate, value, val);
        }

        public string GetString(bool isByRef)
        {
            return PuertsDLL.GetStringFromValue(isolate, value, isByRef);
        }

        public void SetByRefValue(string val)
        {
            PuertsDLL.SetStringToOutValue(isolate, value, val);
        }

        public DateTime GetDateTime(bool isByRef)
        {
            var ticks = PuertsDLL.GetDateFromValue(isolate, value, isByRef);
            return (new DateTime(1970, 1, 1)).AddMilliseconds(ticks);
        }

        public void SetByRefValue(DateTime val)
        {
            PuertsDLL.SetDateToOutValue(isolate, value, (val - new DateTime(1970, 1, 1)).TotalMilliseconds);
        }

        public T Get<T>(bool isByRef)
        {
            if (obj != null) return (T)obj;
            return StaticTranslate<T>.Get(jsEnvIdx, isolate, NativeValueApi.GetValueFromArgument, value, isByRef);
        }

        public T[] GetParams<T>(IntPtr info, int start, int end)
        {
            T[] result = new T[end - start];

            for(int i = start; i < end; i++)
            {
                var val = PuertsDLL.GetArgumentValue(info, i);
                result[i - start] = StaticTranslate<T>.Get(jsEnvIdx, isolate, NativeValueApi.GetValueFromArgument, val, false);
            }

            return result;
        }

        public void SetByRefValue<T>(T val)
        {
            StaticTranslate<T>.Set(jsEnvIdx, isolate, NativeValueApi.SetValueToByRefArgument, value, val);
        }
    }

    public struct ResultHelper
    {
        public static void Set<T>(int jsEnvIdx, IntPtr isolate, IntPtr info, T result)
        {
            StaticTranslate<T>.Set(jsEnvIdx, isolate, NativeValueApi.SetValueToResult, info, result);
        }
    }
}

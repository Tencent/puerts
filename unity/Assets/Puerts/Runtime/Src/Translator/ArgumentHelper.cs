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
        private readonly IntPtr info;
        private JsValueType valueType;
        private object obj;
        private Type csType;

        public ArgumentHelper(int jsEnvIdx, IntPtr isolate, IntPtr info, int index)
        {
            this.jsEnvIdx = jsEnvIdx;
            this.isolate = isolate;
            this.info = info;
            value = PuertsDLL.GetArgumentValue(info, index);
            valueType = JsValueType.Invalid;
            obj = null;
            csType = null;
        }

        public bool IsMatchParams(JsValueType expectJsType, Type expectCsType, int start, int end)
        {
            if (!IsMatch(expectJsType, expectCsType, false, false)) 
            {
                return false;
            }
            for (int i = start + 1; i < end; i++)
            {
                var argHelper = new Puerts.ArgumentHelper(jsEnvIdx, isolate, info, i);
                if (!argHelper.IsMatch(expectJsType, expectCsType, false, false))
                {
                    return false;
                }
            }

            return true;
        }

        public bool IsMatch(JsValueType expectJsType, Type expectCsType, bool isByRef, bool isOut)
        {
            if (this.valueType == JsValueType.Invalid)
                this.valueType = PuertsDLL.GetJsValueType(isolate, value, false);
            var jsType = this.valueType;
            if (jsType == JsValueType.JsObject)
            {
                if (isByRef) 
                {
                    if (isOut) return true;
                    jsType = PuertsDLL.GetJsValueType(isolate, value, true);
                } 
                else if ((expectJsType & jsType) == jsType)
                {
                    return true;
                }
                else 
                {
                    return false;
                }
            } 

            if (jsType == JsValueType.NativeObject && expectCsType.IsPrimitive)
            {
                if (obj == null)
                {
                    obj = JsEnv.jsEnvs[jsEnvIdx].GeneralGetterManager.AnyTranslator(jsEnvIdx, isolate, NativeValueApi.GetValueFromArgument, value, isByRef);
                }
                if (obj.GetType() == expectCsType) 
                {
                    return true;
                }
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
                        obj = JsEnv.jsEnvs[jsEnvIdx].GeneralGetterManager.AnyTranslator(jsEnvIdx, isolate, NativeValueApi.GetValueFromArgument, value, isByRef);
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
            return StaticTranslate<char>.Get(jsEnvIdx, isolate, Puerts.NativeValueApi.GetValueFromArgument, value, isByRef);
        }

        public void SetByRefValue(char val)
        {
            StaticTranslate<char>.Set(jsEnvIdx, isolate, Puerts.NativeValueApi.SetValueToByRefArgument, value, val);        
        }

        public sbyte GetSByte(bool isByRef)
        {
            return StaticTranslate<sbyte>.Get(jsEnvIdx, isolate, Puerts.NativeValueApi.GetValueFromArgument, value, isByRef);
        }

        public void SetByRefValue(sbyte val)
        {
            StaticTranslate<sbyte>.Set(jsEnvIdx, isolate, Puerts.NativeValueApi.SetValueToByRefArgument, value, val);        
        }

        public byte GetByte(bool isByRef)
        {
            return StaticTranslate<byte>.Get(jsEnvIdx, isolate, Puerts.NativeValueApi.GetValueFromArgument, value, isByRef);
        }

        public void SetByRefValue(byte val)
        {
            StaticTranslate<byte>.Set(jsEnvIdx, isolate, Puerts.NativeValueApi.SetValueToByRefArgument, value, val);        
        }

        public short GetInt16(bool isByRef)
        {
            return StaticTranslate<short>.Get(jsEnvIdx, isolate, Puerts.NativeValueApi.GetValueFromArgument, value, isByRef);
        }

        public void SetByRefValue(short val)
        {
            StaticTranslate<short>.Set(jsEnvIdx, isolate, Puerts.NativeValueApi.SetValueToByRefArgument, value, val);        
        }

        public ushort GetUInt16(bool isByRef)
        {
            return StaticTranslate<ushort>.Get(jsEnvIdx, isolate, Puerts.NativeValueApi.GetValueFromArgument, value, isByRef);
        }

        public void SetByRefValue(ushort val)
        {
            StaticTranslate<ushort>.Set(jsEnvIdx, isolate, Puerts.NativeValueApi.SetValueToByRefArgument, value, val);
        }

        public int GetInt32(bool isByRef)
        {
            return StaticTranslate<int>.Get(jsEnvIdx, isolate, Puerts.NativeValueApi.GetValueFromArgument, value, isByRef);
        }

        public void SetByRefValue(int val)
        {
            StaticTranslate<int>.Set(jsEnvIdx, isolate, Puerts.NativeValueApi.SetValueToByRefArgument, value, val);
        }

        public uint GetUInt32(bool isByRef)
        {
            return StaticTranslate<uint>.Get(jsEnvIdx, isolate, Puerts.NativeValueApi.GetValueFromArgument, value, isByRef);
        }

        public void SetByRefValue(uint val)
        {
            StaticTranslate<uint>.Set(jsEnvIdx, isolate, Puerts.NativeValueApi.SetValueToByRefArgument, value, val);
        }

        public long GetInt64(bool isByRef)
        {
            return StaticTranslate<long>.Get(jsEnvIdx, isolate, Puerts.NativeValueApi.GetValueFromArgument, value, isByRef);
        }

        public void SetByRefValue(long val)
        {
            StaticTranslate<long>.Set(jsEnvIdx, isolate, Puerts.NativeValueApi.SetValueToByRefArgument, value, val);
        }

        public ulong GetUInt64(bool isByRef)
        {
            return StaticTranslate<ulong>.Get(jsEnvIdx, isolate, Puerts.NativeValueApi.GetValueFromArgument, value, isByRef);
        }

        public void SetByRefValue(ulong val)
        {
            StaticTranslate<ulong>.Set(jsEnvIdx, isolate, Puerts.NativeValueApi.SetValueToByRefArgument, value, val);
        }

        public double GetDouble(bool isByRef)
        {
            return StaticTranslate<double>.Get(jsEnvIdx, isolate, Puerts.NativeValueApi.GetValueFromArgument, value, isByRef);
        }

        public void SetByRefValue(double val)
        {
            StaticTranslate<double>.Set(jsEnvIdx, isolate, Puerts.NativeValueApi.SetValueToByRefArgument, value, val);
        }

        public float GetFloat(bool isByRef)
        {
            return StaticTranslate<float>.Get(jsEnvIdx, isolate, Puerts.NativeValueApi.GetValueFromArgument, value, isByRef);
        }

        public void SetByRefValue(float val)
        {
            StaticTranslate<float>.Set(jsEnvIdx, isolate, Puerts.NativeValueApi.SetValueToByRefArgument, value, val);
        }

        public bool GetBoolean(bool isByRef)
        {
            return StaticTranslate<bool>.Get(jsEnvIdx, isolate, Puerts.NativeValueApi.GetValueFromArgument, value, isByRef);
        }

        public void SetByRefValue(bool val)
        {
            StaticTranslate<bool>.Set(jsEnvIdx, isolate, Puerts.NativeValueApi.SetValueToByRefArgument, value, val);
        }

        public string GetString(bool isByRef)
        {
            return StaticTranslate<string>.Get(jsEnvIdx, isolate, Puerts.NativeValueApi.GetValueFromArgument, value, isByRef);
        }

        public void SetByRefValue(string val)
        {
            StaticTranslate<string>.Set(jsEnvIdx, isolate, Puerts.NativeValueApi.SetValueToByRefArgument, value, val);
        }

        public DateTime GetDateTime(bool isByRef)
        {
            return StaticTranslate<DateTime>.Get(jsEnvIdx, isolate, Puerts.NativeValueApi.GetValueFromArgument, value, isByRef);
        }

        public void SetByRefValue(DateTime val)
        {
            StaticTranslate<DateTime>.Set(jsEnvIdx, isolate, Puerts.NativeValueApi.SetValueToByRefArgument, value, val);
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

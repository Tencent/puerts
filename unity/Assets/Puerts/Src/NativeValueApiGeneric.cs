/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;

namespace Puerts
{
    public class ArrayBuffer
    {
        public byte[] Bytes;

        public ArrayBuffer(byte[] bytes)
        {
            Bytes = bytes;
        }

        public ArrayBuffer(IntPtr ptr, int length)
        {
            if (ptr != IntPtr.Zero)
            {
                Bytes = new byte[length];
                System.Runtime.InteropServices.Marshal.Copy(ptr, Bytes, 0, length);
            }
        }
    }

    public static class NativeValueApi
    {
        public static IGetValueFromJs GetValueFromArgument = new GetValueFromArgumentImpl();

        public static IGetValueFromJs GetValueFromResult = new GetValueFromResultImpl();

        public static ISetValueToJs SetValueToResult = new SetValueToResultImpl();

        public static ISetValueToJs SetValueToByRefArgument = new SetValueToByRefArgumentImpl();

        public static ISetValueToJs SetValueToArgument = new SetValueToArgumentImpl();
    }

    public interface ISetValueToJs
    {
        void SetNativeObject(IntPtr isolate, IntPtr holder, int classID, IntPtr self);

        void SetJSObject(IntPtr isolate, IntPtr holder, IntPtr JSObject);

        void SetFunction(IntPtr isolate, IntPtr holder, IntPtr JSFunction);

        void SetNumber(IntPtr isolate, IntPtr holder, double number);

        void SetString(IntPtr isolate, IntPtr holder, string str);

        void SetBigInt(IntPtr isolate, IntPtr holder, long number);

        void SetBoolean(IntPtr isolate, IntPtr holder, bool b);

        void SetDate(IntPtr isolate, IntPtr holder, double date);

        void SetNull(IntPtr isolate, IntPtr holder);

        void SetArrayBuffer(IntPtr isolate, IntPtr holder, ArrayBuffer arrayBuffer);
    }

    public interface IGetValueFromJs
    {
        JsValueType GetJsValueType(IntPtr isolate, IntPtr holder, bool isByRef);

        double GetNumber(IntPtr isolate, IntPtr holder, bool isByRef);

        double GetDate(IntPtr isolate, IntPtr holder, bool isByRef);

        string GetString(IntPtr isolate, IntPtr holder, bool isByRef);

        bool GetBoolean(IntPtr isolate, IntPtr holder, bool isByRef);

        long GetBigInt(IntPtr isolate, IntPtr holder, bool isByRef);

        IntPtr GetNativeObject(IntPtr isolate, IntPtr holder, bool isByRef);

        int GetTypeId(IntPtr isolate, IntPtr holder, bool isByRef);

        IntPtr GetJSObject(IntPtr isolate, IntPtr holder, bool isByRef);

        IntPtr GetFunction(IntPtr isolate, IntPtr holder, bool isByRef);

        ArrayBuffer GetArrayBuffer(IntPtr isolate, IntPtr holder, bool isByRef);
    }

    public class GetValueFromResultImpl : IGetValueFromJs
    {
        public long GetBigInt(IntPtr isolate, IntPtr holder, bool isByRef)
        {
            return PuertsDLL.GetBigIntFromResultCheck(holder);
        }

        public bool GetBoolean(IntPtr isolate, IntPtr holder, bool isByRef)
        {
            return PuertsDLL.GetBooleanFromResult(holder);
        }

        public double GetDate(IntPtr isolate, IntPtr holder, bool isByRef)
        {
            return PuertsDLL.GetDateFromResult(holder);
        }

        public IntPtr GetFunction(IntPtr isolate, IntPtr holder, bool isByRef)
        {
            return PuertsDLL.GetFunctionFromResult(holder);
        }

        public IntPtr GetJSObject(IntPtr isolate, IntPtr holder, bool isByRef)
        {
            return PuertsDLL.GetJSObjectFromResult(holder);
        }

        public JsValueType GetJsValueType(IntPtr isolate, IntPtr holder, bool isByRef)
        {
            return PuertsDLL.GetResultType(holder);
        }

        public double GetNumber(IntPtr isolate, IntPtr holder, bool isByRef)
        {
            return PuertsDLL.GetNumberFromResult(holder);
        }

        public IntPtr GetNativeObject(IntPtr isolate, IntPtr holder, bool isByRef)
        {
            return PuertsDLL.GetObjectFromResult(holder);
        }

        public int GetTypeId(IntPtr isolate, IntPtr holder, bool isByRef)
        {
            return PuertsDLL.GetTypeIdFromResult(holder);
        }

        public string GetString(IntPtr isolate, IntPtr holder, bool isByRef)
        {
            return PuertsDLL.GetStringFromResult(holder);
        }

        public ArrayBuffer GetArrayBuffer(IntPtr isolate, IntPtr holder, bool isByRef)
        {
            int length;
            var ptr = PuertsDLL.GetArrayBufferFromResult(holder, out length);
            return new ArrayBuffer(ptr, length);
        }
    }

    public class GetValueFromArgumentImpl : IGetValueFromJs
    {
        public long GetBigInt(IntPtr isolate, IntPtr holder, bool isByRef)
        {
            return PuertsDLL.GetBigIntFromValueChecked(isolate, holder, isByRef);
        }

        public bool GetBoolean(IntPtr isolate, IntPtr holder, bool isByRef)
        {
            return PuertsDLL.GetBooleanFromValue(isolate, holder, isByRef);
        }

        public double GetDate(IntPtr isolate, IntPtr holder, bool isByRef)
        {
            return PuertsDLL.GetDateFromValue(isolate, holder, isByRef);
        }

        public IntPtr GetFunction(IntPtr isolate, IntPtr holder, bool isByRef)
        {
            return PuertsDLL.GetFunctionFromValue(isolate, holder, isByRef);
        }

        public IntPtr GetJSObject(IntPtr isolate, IntPtr holder, bool isByRef)
        {
            return PuertsDLL.GetJSObjectFromValue(isolate, holder, isByRef);
        }

        public JsValueType GetJsValueType(IntPtr isolate, IntPtr holder, bool isByRef)
        {
            return PuertsDLL.GetJsValueType(isolate, holder, isByRef);
        }

        public double GetNumber(IntPtr isolate, IntPtr holder, bool isByRef)
        {
            return PuertsDLL.GetNumberFromValue(isolate, holder, isByRef);
        }

        public IntPtr GetNativeObject(IntPtr isolate, IntPtr holder, bool isByRef)
        {
            return PuertsDLL.GetObjectFromValue(isolate, holder, isByRef);
        }

        public int GetTypeId(IntPtr isolate, IntPtr holder, bool isByRef)
        {
            return PuertsDLL.GetTypeIdFromValue(isolate, holder, isByRef);
        }

        public string GetString(IntPtr isolate, IntPtr holder, bool isByRef)
        {
            return PuertsDLL.GetStringFromValue(isolate, holder, isByRef);
        }

        public ArrayBuffer GetArrayBuffer(IntPtr isolate, IntPtr holder, bool isByRef)
        {
            int length;
            var ptr = PuertsDLL.GetArrayBufferFromValue(isolate, holder, out length, isByRef);
            return new ArrayBuffer(ptr, length);
        }
    }

    public class SetValueToResultImpl : ISetValueToJs
    {
        public void SetArrayBuffer(IntPtr isolate, IntPtr holder, ArrayBuffer arrayBuffer)
        {
            if (arrayBuffer == null || arrayBuffer.Bytes == null)
            {
                PuertsDLL.ReturnArrayBuffer(isolate, holder, null, 0);
            }
            else
            {
                PuertsDLL.ReturnArrayBuffer(isolate, holder, arrayBuffer.Bytes, arrayBuffer.Bytes.Length);
            }
        }

        public void SetBigInt(IntPtr isolate, IntPtr holder, long number)
        {
            PuertsDLL.ReturnBigInt(isolate, holder, number);
        }

        public void SetBoolean(IntPtr isolate, IntPtr holder, bool b)
        {
            PuertsDLL.ReturnBoolean(isolate, holder, b);
        }

        public void SetDate(IntPtr isolate, IntPtr holder, double date)
        {
            PuertsDLL.ReturnDate(isolate, holder, date);
        }

        public void SetNull(IntPtr isolate, IntPtr holder)
        {
            PuertsDLL.ReturnNull(isolate, holder);
        }

        public void SetNumber(IntPtr isolate, IntPtr holder, double number)
        {
            PuertsDLL.ReturnNumber(isolate, holder, number);
        }

        public void SetNativeObject(IntPtr isolate, IntPtr holder, int classID, IntPtr self)
        {
            PuertsDLL.ReturnObject(isolate, holder, classID, self);
        }

        public void SetFunction(IntPtr isolate, IntPtr holder, IntPtr JSFunction)
        {
            PuertsDLL.ReturnFunction(isolate, holder, JSFunction);
        }

        public void SetJSObject(IntPtr isolate, IntPtr holder, IntPtr JSObject)
        {
            PuertsDLL.ReturnJSObject(isolate, holder, JSObject);
        }

        public void SetString(IntPtr isolate, IntPtr holder, string str)
        {
            PuertsDLL.ReturnString(isolate, holder, str);
        }
    }

    public class SetValueToByRefArgumentImpl : ISetValueToJs
    {
        public void SetArrayBuffer(IntPtr isolate, IntPtr holder, ArrayBuffer arrayBuffer)
        {
            if (arrayBuffer == null || arrayBuffer.Bytes == null)
            {
                PuertsDLL.SetArrayBufferToOutValue(isolate, holder, null, 0);
            }
            else
            {
                PuertsDLL.SetArrayBufferToOutValue(isolate, holder, arrayBuffer.Bytes, arrayBuffer.Bytes.Length);
            }
        }

        public void SetBigInt(IntPtr isolate, IntPtr holder, long number)
        {
            PuertsDLL.SetBigIntToOutValue(isolate, holder, number);
        }

        public void SetBoolean(IntPtr isolate, IntPtr holder, bool b)
        {
            PuertsDLL.SetBooleanToOutValue(isolate, holder, b);
        }

        public void SetDate(IntPtr isolate, IntPtr holder, double date)
        {
            PuertsDLL.SetDateToOutValue(isolate, holder, date);
        }

        public void SetNull(IntPtr isolate, IntPtr holder)
        {
            PuertsDLL.SetNullToOutValue(isolate, holder);
        }

        public void SetNumber(IntPtr isolate, IntPtr holder, double number)
        {
            PuertsDLL.SetNumberToOutValue(isolate, holder, number);
        }

        public void SetNativeObject(IntPtr isolate, IntPtr holder, int classID, IntPtr self)
        {
            PuertsDLL.SetObjectToOutValue(isolate, holder, classID, self);
        }

        public void SetFunction(IntPtr isolate, IntPtr holder, IntPtr JSFunction)
        {
            throw new Exception("not implemented yet");
        }

        public void SetJSObject(IntPtr isolate, IntPtr holder, IntPtr JSObject)
        {
            throw new Exception("not implemented yet");
        }

        public void SetString(IntPtr isolate, IntPtr holder, string str)
        {
            PuertsDLL.SetStringToOutValue(isolate, holder, str);
        }
    }


    public class SetValueToArgumentImpl : ISetValueToJs
    {
        public void SetArrayBuffer(IntPtr isolate, IntPtr holder, ArrayBuffer arrayBuffer)
        {
            if (arrayBuffer == null || arrayBuffer.Bytes == null)
            {
                PuertsDLL.PushArrayBufferForJSFunction(holder, null, 0);
            }
            else
            {
                PuertsDLL.PushArrayBufferForJSFunction(holder, arrayBuffer.Bytes, arrayBuffer.Bytes.Length);
            }
        }

        public void SetBigInt(IntPtr isolate, IntPtr holder, long number)
        {
            PuertsDLL.PushBigIntForJSFunction(holder, number);
        }

        public void SetBoolean(IntPtr isolate, IntPtr holder, bool b)
        {
            PuertsDLL.PushBooleanForJSFunction(holder, b);
        }

        public void SetDate(IntPtr isolate, IntPtr holder, double date)
        {
            PuertsDLL.PushDateForJSFunction(holder, date);
        }

        public void SetNull(IntPtr isolate, IntPtr holder)
        {
            PuertsDLL.PushNullForJSFunction(holder);
        }

        public void SetNumber(IntPtr isolate, IntPtr holder, double number)
        {
            PuertsDLL.PushNumberForJSFunction(holder, number);
        }

        public void SetNativeObject(IntPtr isolate, IntPtr holder, int classID, IntPtr self)
        {
            PuertsDLL.PushObjectForJSFunction(holder, classID, self);
        }

        public void SetFunction(IntPtr isolate, IntPtr holder, IntPtr JSFunction)
        {
            PuertsDLL.PushJSFunctionForJSFunction(holder, JSFunction);
        }

        public void SetJSObject(IntPtr isolate, IntPtr holder, IntPtr JSObject)
        {
            PuertsDLL.PushJSObjectForJSFunction(holder, JSObject);
        }

        public void SetString(IntPtr isolate, IntPtr holder, string str)
        {
            PuertsDLL.PushStringForJSFunction(holder, str);
        }
    }

}
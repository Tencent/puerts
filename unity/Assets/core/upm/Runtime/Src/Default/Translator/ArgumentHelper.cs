/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if !EXPERIMENTAL_IL2CPP_PUERTS || !ENABLE_IL2CPP

using System;

namespace Puerts
{
    public struct ArgHelper
    {
        public static T[] GetParams<T>(int jsEnvIdx, IntPtr isolate, IntPtr info, int start, int end, IntPtr v8Value)
        {
            T[] result = new T[end - start];

            for (int i = start; i < end; i++)
            {
                var val = i == start ? v8Value : PuertsDLL.GetArgumentValue(info, i);
                result[i - start] = StaticTranslate<T>.Get(jsEnvIdx, isolate, NativeValueApi.GetValueFromArgument, val, false);
            }

            return result;
        }

        public static bool IsMatchParams(
            int jsEnvIdx,
            IntPtr isolate,
            IntPtr info,

            JsValueType expectJsType,
            Type expectCsType,
            int start,
            int end,

            IntPtr v8Value,
            ref object arg,
            ref JsValueType argValueType
        )
        {
            if (!IsMatch(jsEnvIdx, isolate, expectJsType, expectCsType, false, false,  v8Value, ref arg, ref argValueType))
            {
                return false;
            }
            for (int i = start + 1; i < end; i++)
            {
                IntPtr value = PuertsDLL.GetArgumentValue(info, i);
                object argObj = null;
                JsValueType valueType = JsValueType.Invalid;
                if (!ArgHelper.IsMatch(jsEnvIdx, isolate,  expectJsType, expectCsType, false, false,  value, ref argObj, ref valueType))
                {
                    return false;
                }
            }

            return true;
        }

        public static bool IsMatch(
            int jsEnvIdx,
            IntPtr isolate,

            JsValueType expectJsType,
            Type expectCsType,
            bool isByRef,
            bool isOut,

            IntPtr v8Value,
            ref object arg,
            ref JsValueType argValueType//,
                                        // ref Type csType
        )
        {
            Type csType = null;
            if (argValueType == JsValueType.Invalid)
                argValueType = PuertsDLL.GetJsValueType(isolate, v8Value, false);
            if (argValueType == JsValueType.JsObject)
            {
                if (isByRef)
                {
                    if (isOut) return true;
                    argValueType = PuertsDLL.GetJsValueType(isolate, v8Value, true);
                }
                else if ((expectJsType & argValueType) == argValueType)
                {
                    return true;
                }
                else
                {
                    return false;
                }
            }

            if (argValueType == JsValueType.NativeObject && expectCsType.IsPrimitive)
            {
                if (arg == null)
                {
                    arg = JsEnv.jsEnvs[jsEnvIdx].GeneralGetterManager.AnyTranslator(jsEnvIdx, isolate, NativeValueApi.GetValueFromArgument, v8Value, isByRef);
                }
                if (arg.GetType() == expectCsType)
                {
                    return true;
                }
            }
            if ((expectJsType & argValueType) != argValueType)
            {
                return false;
            }
            if (argValueType == JsValueType.NativeObject)
            {
                if (expectCsType.IsArray)
                {
                    if (arg == null)
                    {
                        arg = JsEnv.jsEnvs[jsEnvIdx].GeneralGetterManager.AnyTranslator(jsEnvIdx, isolate, NativeValueApi.GetValueFromArgument, v8Value, isByRef);
                    }

                    return expectCsType != null && expectCsType.IsAssignableFrom(arg.GetType());
                }
                else
                {
                    if (csType == null)
                    {
                        var typeId = NativeValueApi.GetValueFromArgument.GetTypeId(isolate, v8Value, isByRef);
                        if (typeId >= 0)
                        {
                            csType = JsEnv.jsEnvs[jsEnvIdx].TypeManager.GetType(typeId);
                        }
                    }
                    return csType != null && expectCsType != null && expectCsType.IsAssignableFrom(csType);
                }
            }
            return true;
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

#endif

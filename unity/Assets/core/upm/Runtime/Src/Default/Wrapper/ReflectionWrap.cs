/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if !EXPERIMENTAL_IL2CPP_PUERTS || !ENABLE_IL2CPP

using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace Puerts
{
    public struct JSCallInfo
    {
        public IntPtr Isolate;
        public IntPtr Info;
        public IntPtr Self;
        public int Length;

        public JsValueType[] JsTypes;

        public object[] Values;

        public IntPtr[] NativePtrs;

        public JSCallInfo(IntPtr isolate, IntPtr info, IntPtr self, int len)
        {
            Isolate = isolate;
            Info = info;
            Self = self;
            Length = len;

            JsTypes = new JsValueType[Length];
            Values = new object[Length];
            NativePtrs = new IntPtr[Length];

            for(int i = 0; i < Length; i++)
            {
                var nativeValuePtr = PuertsDLL.GetArgumentValue(info, i);
                NativePtrs[i] = nativeValuePtr;
                var type = PuertsDLL.GetJsValueType(isolate, nativeValuePtr, false);
                JsTypes[i] = type;
            }
        }
    }

    public class Parameters
    {
        internal readonly int paramLength;

        private readonly JsEnv jsEnv;

        private bool hasParamsArray = false;

        private JsValueType[] paramJSTypeMasks = null;

        internal int optionalParamPos = 0;
        
        private Type[] paramTypes = null;

        private object[] args = null;

        private bool[] paramIsByRef = null;

        private bool[] isOut = null;

        private GeneralGetter[] argsTranslateFuncs = null;

        private GeneralSetter[] byRefValueSetFuncs = null;

#if NET_2_0 || NET_2_0_SUBSET
        public object[] defaultValueArray;
#endif 

        public Parameters(ParameterInfo[] parameterInfos, JsEnv jsEnv)
        {
            this.jsEnv = jsEnv;
            paramLength = parameterInfos.Length;
            paramJSTypeMasks = new JsValueType[parameterInfos.Length];
            paramTypes = new Type[parameterInfos.Length];
            args = new object[parameterInfos.Length];
            argsTranslateFuncs = new GeneralGetter[parameterInfos.Length];
            byRefValueSetFuncs = new GeneralSetter[parameterInfos.Length];
            paramIsByRef = new bool[parameterInfos.Length];
            isOut = new bool[parameterInfos.Length];
            optionalParamPos = this.paramLength; 
            List<object> defaultValueList = new List<object>();
            
            for (int i = 0; i < parameterInfos.Length; i++)
            {
                var parameterInfo = parameterInfos[i];
                var parameterType = parameterInfo.ParameterType;
                if (parameterInfo.IsDefined(typeof(ParamArrayAttribute), false))
                {
                    parameterType = parameterType.GetElementType();
                    hasParamsArray = true;
                }
                paramTypes[i] = parameterType.IsByRef ? parameterType.GetElementType() : parameterType;
                paramJSTypeMasks[i] = GeneralGetterManager.GetJsTypeMask(parameterType);
                argsTranslateFuncs[i] = jsEnv.GeneralGetterManager.GetTranslateFunc(parameterType);
                paramIsByRef[i] = parameterType.IsByRef;
                if (parameterType.IsByRef)
                {
                    byRefValueSetFuncs[i] = jsEnv.GeneralSetterManager.GetTranslateFunc(parameterType.GetElementType());
                }
                isOut[i] = parameterType.IsByRef && parameterInfo.IsOut && !parameterInfo.IsIn;
                if (i < optionalParamPos && parameterInfo.IsOptional)
                {
                    optionalParamPos = i;
                }
#if NET_2_0 || NET_2_0_SUBSET
                var defaultValue = parameterInfo.DefaultValue;
                if (parameterInfo.IsOptional)
                {
                    if (defaultValue != null && defaultValue.GetType() != parameterInfo.ParameterType)
                    {
                        defaultValue = defaultValue.GetType() == typeof(Missing) ? 
                            (parameterInfo.ParameterType.IsValueType() ? Activator.CreateInstance(parameterInfo.ParameterType) : Missing.Value) 
                            : Convert.ChangeType(defaultValue, parameterInfo.ParameterType);
                    }
                }
                defaultValueList.Add(parameterInfo.IsOptional ? defaultValue : null);
#endif 
            }
#if NET_2_0 || NET_2_0_SUBSET
            defaultValueArray = defaultValueList.ToArray();
#endif 
        }

        public bool IsMatch(JSCallInfo jsCallInfo)
        {
            if (hasParamsArray && optionalParamPos >= paramLength)
            {
                if (jsCallInfo.Length < paramLength - 1)
                {
                    return false;
                }
            }
            else if (jsCallInfo.Length > paramLength)
            {
                return false;
            }
            else if (jsCallInfo.Length < optionalParamPos)
            {
                return false;
            }

            for (int i = 0; i < jsCallInfo.Length; i++)
            {
                if (i < paramLength)
                {
                    var argJsType = jsCallInfo.JsTypes[i];
                    if (paramIsByRef[i])
                    {
                        if (argJsType != JsValueType.JsObject) // 如果是ref类型，js参数首先必须是个jsobject
                        {
                            return false;
                        }
                        
                        if (isOut[i]) // 是out直接过
                        {
                            continue;
                        }
                        else // 是ref则取里面的类型
                        {
                            argJsType = PuertsDLL.GetJsValueType(jsCallInfo.Isolate, jsCallInfo.NativePtrs[i], true);
                        }
                    }
                    if (
                        !Utils.IsJsValueTypeMatchType(argJsType, paramTypes[i], paramJSTypeMasks[i], () =>
                        {
                            jsCallInfo.Values[i] = jsEnv.GeneralGetterManager.AnyTranslator(jsEnv.Idx,
                                jsCallInfo.Isolate,
                                NativeValueApi.GetValueFromArgument, jsCallInfo.NativePtrs[i], paramIsByRef[i]);

                            return jsCallInfo.Values[i];
                        }, jsCallInfo.Values[i])
                    )
                    {
                        return false;
                    }
                }
            }

            return true;
        }

        public object[] GetArguments(JSCallInfo callInfo)
        {
            for (int i = 0; i < paramLength; i++)
            {
                if(hasParamsArray && i == paramLength - 1)
                {
                    Array paramArray = Array.CreateInstance(paramTypes[paramLength - 1],
                        callInfo.Length  < paramLength ? 0 : (callInfo.Length + 1 - paramLength));
                    
                    var translateFunc = argsTranslateFuncs[i];
                    for (int j = i; j < callInfo.Length; j++)
                    {
                        paramArray.SetValue(
                            translateFunc(jsEnv.Idx, callInfo.Isolate, NativeValueApi.GetValueFromArgument, callInfo.NativePtrs[j],
                                false), j - i);
                    }

                    args[i] = paramArray;
                    
                }
				else if (i >= callInfo.Length && i >= optionalParamPos)
                {
#if NET_2_0 || NET_2_0_SUBSET
                    args[i] = defaultValueArray[i];
#else
                    args[i] = Type.Missing;
#endif
                }
                else
                {
                    if (!isOut[i])
                    {
                        if (callInfo.Values[i] != null)
                        {
                            args[i] = callInfo.Values[i];
                        }
                        else
                        {
                            args[i] = argsTranslateFuncs[i](jsEnv.Idx, callInfo.Isolate, NativeValueApi.GetValueFromArgument, callInfo.NativePtrs[i], paramIsByRef[i]);
                        }
                    }
                }
            }
            return args;
        }

        public void FillByRefParameters(JSCallInfo callInfo)
        {
            for (int i = 0; i < paramLength; i++)
            {
                if (paramIsByRef[i])
                {
                    byRefValueSetFuncs[i](jsEnv.Idx, callInfo.Isolate, NativeValueApi.SetValueToByRefArgument, callInfo.NativePtrs[i], args[i]);
                }
            }
        }

        public void ClearArguments()
        {
            for (int i = 0; i < args.Length; i++)
            {
                args[i] = null;
            }
        }
    }

    public class OverloadReflectionWrap
    {
        JsEnv jsEnv;

        internal Parameters parameters = null;

        MethodInfo methodInfo = null;

        ConstructorInfo constructorInfo = null;

        Type type = null;

        GeneralSetter resultSetter = null;

        bool extensionMethod = false;

        public OverloadReflectionWrap(MethodBase methodBase, JsEnv jsEnv, bool extensionMethod = false)
        {
            parameters = new Parameters(methodBase.GetParameters().Skip(extensionMethod ? 1 : 0).ToArray(), jsEnv);
            
            this.extensionMethod = extensionMethod;

            if (methodBase.IsConstructor)
            {
                constructorInfo = methodBase as ConstructorInfo;
            }
            else
            {
                methodInfo = methodBase as MethodInfo;
                resultSetter = jsEnv.GeneralSetterManager.GetTranslateFunc(methodInfo.ReturnType);
            }
            this.jsEnv = jsEnv;
        }

        // 供struct的无参默认构造函数使用
        public OverloadReflectionWrap(Type type, JsEnv jsEnv)
        {
            ParameterInfo[] info = { };
            parameters = new Parameters(info, jsEnv);

            this.jsEnv = jsEnv;

            this.type = type;
        }

        public bool IsMatch(JSCallInfo jsCallInfo)
        {
            return parameters.IsMatch(jsCallInfo);
        }

        public void Invoke(JSCallInfo jsCallInfo)
        {
            try
            {
                object target = methodInfo.IsStatic ? null : jsEnv.GeneralGetterManager.GetSelf(jsEnv.Idx, jsCallInfo.Self);
                object[] args = parameters.GetArguments(jsCallInfo);
                if (this.extensionMethod)
                {
                    args = new object[] { jsEnv.GeneralGetterManager.GetSelf(jsEnv.Idx, jsCallInfo.Self) }.Concat(args).ToArray();
                }
                object ret = methodInfo.Invoke(target, args);
                parameters.FillByRefParameters(jsCallInfo);
                resultSetter(jsEnv.Idx, jsCallInfo.Isolate, NativeValueApi.SetValueToResult, jsCallInfo.Info, ret);
            }
            finally
            {
                parameters.ClearArguments();
            }
        }

        public object Construct(JSCallInfo callInfo)
        {
            if (constructorInfo == null && type != null) 
            {
                return Activator.CreateInstance(type);
            }
            return constructorInfo.Invoke(parameters.GetArguments(callInfo));
        }
    }

    public class DelegateConstructWrap
    {
        private Type delegateType;

        private GeneralGetter translateFunc;

        private int jsEnvIdx;

        public DelegateConstructWrap(Type delegateType, JsEnv jsEnv)
        {
            this.delegateType = delegateType;
            translateFunc = jsEnv.GeneralGetterManager.GetTranslateFunc(delegateType);
            jsEnvIdx = jsEnv.Idx;
        }

        public object Construct(IntPtr isolate, IntPtr info, int argumentsLen)
        {
            if (argumentsLen == 1)
            {
                try
                {
                    var arg0 = PuertsDLL.GetArgumentValue(info, 0);
                    var arg0type = NativeValueApi.GetValueFromArgument.GetJsValueType(isolate, arg0, false);
                    if (arg0type == JsValueType.Function || arg0type == JsValueType.NativeObject)
                    {
                        object obj = translateFunc(jsEnvIdx, isolate, NativeValueApi.GetValueFromArgument, arg0, false);
                        if (obj != null)
                        {
                            return obj;
                        }
                    }
                }
                catch(Exception e)
                {
                    PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
                    return null;
                }
            }
            PuertsDLL.ThrowException(isolate, "invalid arguments to constructor of " + delegateType.GetFriendlyName());
            return null;
        }
    }

    public class MethodReflectionWrap
    {
        private string name;

        private List<OverloadReflectionWrap> overloads;

        public MethodReflectionWrap(string name, List<OverloadReflectionWrap> overloads)
        {
            this.name = name;
            this.overloads = overloads;
        }

        public void Invoke(IntPtr isolate, IntPtr info, IntPtr self, int argumentsLen)
        {
            try
            {
                JSCallInfo callInfo = new JSCallInfo(isolate, info, self, argumentsLen);
                if (
                    overloads.Count == 1 && 
                    overloads[0].parameters.optionalParamPos == overloads[0].parameters.paramLength &&
                    overloads[0].parameters.paramLength == callInfo.Length
                ) {
                    overloads[0].Invoke(callInfo);
                    return;
                } 
                else 
                {
                    for (int i = 0; i < overloads.Count; ++i)
                    {
                        var overload = overloads[i];
                        if (overload.IsMatch(callInfo))
                        {
                            overload.Invoke(callInfo);
                            return;
                        }
                    }
                }
                PuertsDLL.ThrowException(isolate, "invalid arguments to " + name + " or the overload is striped by unity");
            }
            catch (TargetInvocationException e)
            {
                PuertsDLL.ThrowException(isolate, "c# exception:" + e.InnerException.Message + ",stack:" + e.InnerException.StackTrace);
            }
            catch (Exception e)
            {
                PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }

        public object Construct(IntPtr isolate, IntPtr info, int argumentsLen)
        {
            JSCallInfo jsCallInfo = new JSCallInfo(isolate, info, IntPtr.Zero, argumentsLen);

            try
            {
                for (int i = 0; i < overloads.Count; ++i)
                {
                    var overload = overloads[i];
                    if (overload.IsMatch(jsCallInfo))
                    {
                        return overload.Construct(jsCallInfo);
                    }
                }
                PuertsDLL.ThrowException(isolate, "invalid arguments to " + name + " or the overload is striped by unity");
            }
            catch (TargetInvocationException e)
            {
                PuertsDLL.ThrowException(isolate, "c# exception:" + e.InnerException.Message + ",stack:" + e.InnerException.StackTrace);
            }
            catch (Exception e)
            {
                PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
            return null;
        }
    }
}

#endif

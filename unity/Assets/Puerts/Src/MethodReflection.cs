/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace Puerts
{
    public struct CallInfo
    {
        public IntPtr Isolate;
        public IntPtr Info;
        public IntPtr Self;
        public int Length;

        public JsValueType[] JsTypes;

        public object[] Values;

        public IntPtr[] NativePtrs;

        public CallInfo(IntPtr isolate, IntPtr info, IntPtr self, int len)
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
        private readonly int length;

        private readonly GeneralGetterManager generalGetterManager;

        private bool hasParamArray = false;

        private JsValueType[] typeMasks = null;

        private int beginOptional = 0;
        
        private Type[] types = null;

        private object[] args = null;

        private bool[] byRef = null;

        private bool[] isOut = null;

        private GeneralGetter[] argsTranslateFuncs = null;

        private GeneralSetter[] byRefValueSetFuncs = null;

        public Parameters(ParameterInfo[] parameterInfos, GeneralGetterManager generalGetterManager, GeneralSetterManager generalSetterManager)
        {
            this.generalGetterManager = generalGetterManager;
            length = parameterInfos.Length;
            typeMasks = new JsValueType[parameterInfos.Length];
            types = new Type[parameterInfos.Length];
            args = new object[parameterInfos.Length];
            argsTranslateFuncs = new GeneralGetter[parameterInfos.Length];
            byRefValueSetFuncs = new GeneralSetter[parameterInfos.Length];
            byRef = new bool[parameterInfos.Length];
            isOut = new bool[parameterInfos.Length];
            beginOptional = this.length + 1;
            for (int i = 0; i < parameterInfos.Length; i++)
            {
                var parameterInfo = parameterInfos[i];
                var parameterType = parameterInfo.ParameterType;
                if (parameterInfo.IsDefined(typeof(ParamArrayAttribute), false))
                {
                    parameterType = parameterType.GetElementType();
                    hasParamArray = true;
                }
                types[i] = parameterType.IsByRef ? parameterType.GetElementType() : parameterType;
                typeMasks[i] = GeneralGetterManager.GetJsTypeMask(parameterType);
                argsTranslateFuncs[i] = generalGetterManager.GetTranslateFunc(parameterType);
                byRef[i] = parameterType.IsByRef && !parameterInfo.IsIn;
                if (byRef[i])
                {
                    byRefValueSetFuncs[i] = generalSetterManager.GetTranslateFunc(parameterType.GetElementType());
                }
                isOut[i] = parameterType.IsByRef && parameterInfo.IsOut && !parameterInfo.IsIn;
                if (i < beginOptional && parameterInfo.IsOptional)
                {
                    beginOptional = i;
                }
            }
        }

        public bool IsMatch(CallInfo callInfo)
        {
            if (hasParamArray && beginOptional > length)
            {
                if (callInfo.Length < length - 1)
                {
                    return false;
                }
            }
            else if (callInfo.Length > length)
            {
                return false;
            }
            else if (callInfo.Length < beginOptional - 1)
            {
                return false;
            }

            for (int i = 0; i < callInfo.Length; i++)
            {
                if (i < length)
                {
                    var argJsType = callInfo.JsTypes[i];
                    if (byRef[i])
                    {
                        if (argJsType != JsValueType.JsObject)
                        {
                            return false;
                        }
                        if (isOut[i])
                        {
                            continue;
                        }
                        else
                        {
                            argJsType = PuertsDLL.GetJsValueType(callInfo.Isolate, callInfo.NativePtrs[i], true);
                        }
                    }
                    if (argJsType == JsValueType.NativeObject && types[i] == typeof(JSObject)) 
                    {
                        // 非要把一个NativeObject赋值给JSObject是允许的。
                        continue;
                    }
                    if ((typeMasks[i] & argJsType) != argJsType)
                    {
                        //UnityEngine.Debug.Log("arg " + i + " not match, expected " + typeMasks[i] + ", but got " + argJsType);
                        return false;
                    }
                    if (argJsType == JsValueType.NativeObject)
                    {
                        if (callInfo.Values[i] == null)
                        {
                            callInfo.Values[i] = generalGetterManager.AnyTranslator(callInfo.Isolate, NativeValueApi.GetValueFromArgument, callInfo.NativePtrs[i], byRef[i]);
                        }
                        if (!types[i].IsAssignableFrom(callInfo.Values[i].GetType()))
                        {
                            return false;
                        }
                    }
                }
            }

            return true;
        }

        public object[] GetArguments(CallInfo callInfo)
        {
            for (int i = 0; i < length; i++)
            {
                if(hasParamArray && i == length - 1)
                {
                    Array paramArray = Array.CreateInstance(types[length - 1],
                        callInfo.Length  < length ? 0 : (callInfo.Length + 1 - length));
                    
                    var translateFunc = argsTranslateFuncs[i];
                    for (int j = i; j < callInfo.Length; j++)
                    {
                        paramArray.SetValue(
                            translateFunc(callInfo.Isolate, NativeValueApi.GetValueFromArgument, callInfo.NativePtrs[j],
                                false), j - i);
                    }

                    args[i] = paramArray;
                    
                }
				else if (i >= callInfo.Length && i >= beginOptional)
                {
                    args[i] = Type.Missing;
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
                            args[i] = argsTranslateFuncs[i](callInfo.Isolate, NativeValueApi.GetValueFromArgument, callInfo.NativePtrs[i], byRef[i]);
                        }
                    }
                }
            }
            return args;
        }

        public void FillByRefParameters(CallInfo callInfo)
        {
            for (int i = 0; i < length; i++)
            {
                if (byRef[i])
                {
                    byRefValueSetFuncs[i](callInfo.Isolate, NativeValueApi.SetValueToByRefArgument, callInfo.NativePtrs[i], args[i]);
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
        Parameters parameters = null;

        MethodInfo methodInfo = null;

        ConstructorInfo constructorInfo = null;

        Type type = null;


        GeneralGetterManager generalGetterManager = null;

        GeneralSetter resultSetter = null;
        bool extensionMethod = false;

        public OverloadReflectionWrap(MethodBase methodBase, GeneralGetterManager generalGetterManager, GeneralSetterManager generalSetterManager, bool extensionMethod = false)
        {
            parameters = new Parameters(methodBase.GetParameters().Skip(extensionMethod ? 1 : 0).ToArray(), generalGetterManager, generalSetterManager);
            
            this.generalGetterManager = generalGetterManager;
            this.extensionMethod = extensionMethod;

            if (methodBase.IsConstructor)
            {
                constructorInfo = methodBase as ConstructorInfo;
            }
            else
            {
                methodInfo = methodBase as MethodInfo;
                resultSetter = generalSetterManager.GetTranslateFunc(methodInfo.ReturnType);
            }
        }

        // 供struct的无参默认构造函数使用
        public OverloadReflectionWrap(Type type, GeneralGetterManager generalGetterManager)
        {
            ParameterInfo[] info = { };
            parameters = new Parameters(info, generalGetterManager, null);

            this.generalGetterManager = generalGetterManager;

            this.type = type;
        }

        public bool IsMatch(CallInfo callInfo)
        {
            return parameters.IsMatch(callInfo);
        }

        public void Invoke(CallInfo callInfo)
        {
            try
            {
                object target = methodInfo.IsStatic ? null : generalGetterManager.GetSelf(callInfo.Self);
                object[] args = parameters.GetArguments(callInfo);
                if (this.extensionMethod)
                {
                    args = new object[] { generalGetterManager.GetSelf(callInfo.Self) }.Concat(args).ToArray();
                }
                object ret = methodInfo.Invoke(target, args);
                parameters.FillByRefParameters(callInfo);
                resultSetter(callInfo.Isolate, NativeValueApi.SetValueToResult, callInfo.Info, ret);
            }
            finally
            {
                parameters.ClearArguments();
            }
        }

        public object Construct(CallInfo callInfo)
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

        public DelegateConstructWrap(Type delegateType, GeneralGetterManager generalGetterManager)
        {
            this.delegateType = delegateType;
            translateFunc = generalGetterManager.GetTranslateFunc(delegateType);
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
                        object obj = translateFunc(isolate, NativeValueApi.GetValueFromArgument, arg0, false);
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
                CallInfo callInfo = new CallInfo(isolate, info, self, argumentsLen);
                for (int i = 0; i < overloads.Count; ++i)
                {
                    var overload = overloads[i];
                    if (overload.IsMatch(callInfo))
                    {
                        overload.Invoke(callInfo);
                        return;
                    }
                }
                PuertsDLL.ThrowException(isolate, "invalid arguments to " + name);
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
            CallInfo callInfo = new CallInfo(isolate, info, IntPtr.Zero, argumentsLen);

            try
            {
                for (int i = 0; i < overloads.Count; ++i)
                {
                    var overload = overloads[i];
                    if (overload.IsMatch(callInfo))
                    {
                        return overload.Construct(callInfo);
                    }
                }
                PuertsDLL.ThrowException(isolate, "invalid arguments to " + name);
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

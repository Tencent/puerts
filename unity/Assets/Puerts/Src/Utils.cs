/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;
using System.Reflection;

namespace Puerts
{
    public static class Utils
    {
        public static long TwoIntToLong(int a, int b)
        {
            return (long)a << 32 | b & 0xFFFFFFFFL;
        }

        public static void LongToTwoInt(long c, out int a, out int b)
        {
            a = (int)(c >> 32);
            b = (int)c;
        }

        public static IntPtr GetObjectPtr(int jsEnvIdx, Type type, object obj)
        {
            var jsEnv = JsEnv.jsEnvs[jsEnvIdx];
            return new IntPtr(type.IsValueType() ? jsEnv.objectPool.AddBoxedValueType(obj) : jsEnv.objectPool.FindOrAddObject(obj));
        }

        public static object GetSelf(int jsEnvIdx, IntPtr self)
        {
            return JsEnv.jsEnvs[jsEnvIdx].objectPool.Get(self.ToInt32());
        }

        public static bool IsSupportedMethod(MethodInfo method)
        {
            if (!method.ContainsGenericParameters)
                return true;
            var methodParameters = method.GetParameters();
            var returnType = method.ReturnType;
            var hasValidGenericParameter = false;
            var returnTypeValid = !returnType.IsGenericParameter;
            for (var i = 0; i < methodParameters.Length; i++)
            {
                var parameterType = methodParameters[i].ParameterType;
                if (parameterType.IsGenericParameter)
                {
                    if (parameterType.BaseType != null && parameterType.BaseType.IsValueType) return false;
                    var parameterConstraints = parameterType.GetGenericParameterConstraints();
                    if (parameterConstraints.Length == 0) return false;
                    foreach (var parameterConstraint in parameterConstraints)
                    {
                        if (!parameterConstraint.IsClass() || (parameterConstraint == typeof(ValueType)))
                            return false;
                    }
                    hasValidGenericParameter = true;
                    if (!returnTypeValid)
                    {
                        if (parameterType == returnType)
                        {
                            returnTypeValid = true;
                        }
                    }
                }
            }
            return hasValidGenericParameter && returnTypeValid;
        }
    }
}
/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System.Collections.Generic;
using Puerts;
using System.Reflection;
using Puerts.TypeMapping;

//1、配置类必须打[Configure]标签
//2、必须放Editor目录
[Configure]
public class U2018Compatible
{
#if UNITY_2018_1_OR_NEWER
    [Filter]
    static BindingMode Filter(MemberInfo memberInfo)
    {
        try
        {
            if (memberInfo.DeclaringType.IsGenericType && memberInfo.DeclaringType.GetGenericTypeDefinition() == typeof(Dictionary<,>))
            {
                if (memberInfo.MemberType == MemberTypes.Constructor)
                {
                    ConstructorInfo constructorInfo = memberInfo as ConstructorInfo;
                    var parameterInfos = constructorInfo.GetParameters();
                    if (parameterInfos.Length > 0)
                    {
                        if (typeof(System.Collections.IEnumerable).IsAssignableFrom(parameterInfos[0].ParameterType))
                        {
                            return BindingMode.DontBinding;
                        }
                    }
                }
                else if (memberInfo.MemberType == MemberTypes.Method)
                {
                    var methodInfo = memberInfo as MethodInfo;
                    if (methodInfo.Name == "TryAdd" || methodInfo.Name == "Remove" && methodInfo.GetParameters().Length == 2)
                    {
                        return BindingMode.DontBinding;
                    }
                }
            }
            if (memberInfo.DeclaringType.IsGenericType && memberInfo.DeclaringType.GetGenericTypeDefinition() == typeof(HashSet<>))
            {
                if (memberInfo.MemberType == MemberTypes.Constructor)
                {
                    ConstructorInfo constructorInfo = memberInfo as ConstructorInfo;
                    var parameterInfos = constructorInfo.GetParameters();
                    if (parameterInfos.Length > 0 && parameterInfos[0].ParameterType == typeof(int))
                    {
                        return BindingMode.DontBinding;
                    }
                }
                else if (memberInfo.MemberType == MemberTypes.Method)
                {
                    var methodInfo = memberInfo as MethodInfo;
                    if (methodInfo.Name == "TryGetValue" && methodInfo.GetParameters().Length == 2)
                    {
                        return BindingMode.DontBinding;
                    }
                }
            }
            if (memberInfo.DeclaringType.ToString() == "System.Type" && memberInfo.Name == "IsSZArray")
            {
                return BindingMode.DontBinding;
            }
            if (memberInfo.DeclaringType.ToString() == "System.Threading.Tasks.Task" && memberInfo.Name == "IsCompletedSuccessfully")
            {
                return BindingMode.DontBinding;
            }
            return BindingMode.FastBinding;
        }
        catch
        {
            return BindingMode.DontBinding;
        }
    }
#endif
}

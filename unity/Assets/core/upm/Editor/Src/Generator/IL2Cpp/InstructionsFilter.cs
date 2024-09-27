/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
#if UNITY_2020_1_OR_NEWER

using System.Collections.Generic;
using Puerts;
using System.Reflection;
using Puerts.TypeMapping;
using System.Linq;

[Configure]
public class InstructionsFilter
{
    static HashSet<string> skipAssembles = new HashSet<string>()
    {
        "mscorlib",
        "System.Core",
        "System.Xml",
        "System.Data",
        "System.Windows.Forms",
        "System.ComponentModel.DataAnnotations",
        "UnityEngine.CoreModule",
        "UnityEditor.CoreModule",
        "UnityEditor.Graphs",
        "Unity.Plastic.Newtonsoft.Json",
        "nunit.framework",
        "UnityEditor.GraphViewModule",
    };

    [Filter]
    static bool GetFilterClass(FilterAction filterAction, MemberInfo mbi)
    {
        if (filterAction == FilterAction.MethodInInstructions) 
            return skipAssembles.Contains(mbi.DeclaringType.Assembly.GetName().Name);
        return false;
    }

    static Dictionary<System.Type, bool> filterValueTypeCache = new Dictionary<System.Type, bool>();

    public static bool IsBigValueType(System.Type type)
    {
        if (!type.IsValueType || type.IsPrimitive) return false;
        if (filterValueTypeCache.ContainsKey(type))
        {
            return filterValueTypeCache[type];
        }

        bool res = false;

        if (type.Name == "FixedBytes4094")
        {
            res = true;
        }
        else
        {
            foreach (var field in type.GetFields(BindingFlags.DeclaredOnly | BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic))
            {
                var fieldType = field.FieldType;
                if (IsBigValueType(fieldType))
                {
                    res = true;
                    break;
                }
            }
        }

        filterValueTypeCache.Add(type, res);
        return res;
    }

    [Filter]
    static BindingMode FilterBigStruct(MemberInfo memberInfo)
    {
        MethodBase methodBase = memberInfo as MethodBase;
        if (methodBase != null)
        {
            var paramTypes = methodBase.GetParameters().Select(p => (p.ParameterType.IsByRef || p.ParameterType.IsPointer) ? p.ParameterType.GetElementType() : p.ParameterType).Where(t => IsBigValueType(t));
            if (paramTypes.Count() > 0)
            {
                //UnityEngine.Debug.Log("filter1:" + methodInfo);
                return BindingMode.DontBinding;
            }
        }

        MethodInfo methodInfo = memberInfo as MethodInfo;
        if (methodInfo != null)
        {
            var paramTypes = methodInfo.GetParameters().Select(p => (p.ParameterType.IsByRef || p.ParameterType.IsPointer) ? p.ParameterType.GetElementType() : p.ParameterType).Where(t => IsBigValueType(t));
            if (paramTypes.Count() > 0)
            {
                //UnityEngine.Debug.Log("filter1:" + methodInfo);
                return BindingMode.DontBinding;
            }
            if (IsBigValueType(methodInfo.ReturnType))
            {
                //UnityEngine.Debug.Log("filter2:" + methodInfo);
                return BindingMode.DontBinding;
            }
        }

        FieldInfo fieldInfo = memberInfo as FieldInfo;
        if (fieldInfo != null)
        {
            if (IsBigValueType(fieldInfo.FieldType))
            {
                //UnityEngine.Debug.Log("filter3:" + fieldInfo);
                return BindingMode.DontBinding;
            }
        }
        return BindingMode.FastBinding;
    }
}
#endif
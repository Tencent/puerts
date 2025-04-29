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

    public static int FieldCount(System.Type type)
    {
        int count = 0;
        foreach (var field in type.GetFields(BindingFlags.DeclaredOnly | BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic))
        {
            var fieldType = field.FieldType;
            count += (fieldType.IsValueType && !fieldType.IsPrimitive && !fieldType.IsPointer && !fieldType.IsByRef ? FieldCount(fieldType) : 1);
        }
        return count;
    }

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
            res = FieldCount(type) > 1024;
        }

        filterValueTypeCache.Add(type, res);
        return res;
    }

    public static bool IsPointerOfPointer(System.Type type)
    {
        if (!type.IsByRef && !type.IsPointer) return false;
        var etype = type.GetElementType();
        return etype.IsByRef || etype.IsPointer || etype == typeof(System.IntPtr) || etype == typeof(System.UIntPtr);
    }

    [Filter]
    static BindingMode FilterBigStructAndPointerOfPointerAndDisallowedType(MemberInfo memberInfo)
    {
        try
        {
            bool useSlowBinding = false;
            MethodBase methodBase = memberInfo as MethodBase;
            if (methodBase != null)
            {
                foreach (var pinfo in methodBase.GetParameters())
                {
                    var ptype = pinfo.ParameterType;
                    ptype = (ptype.IsByRef || ptype.IsPointer) ? ptype.GetElementType() : ptype;
                    if (IsBigValueType(ptype))
                    {
                        return BindingMode.DontBinding;
                    }
                    if (ptype.IsByRef || ptype.IsPointer)
                    {
                        return BindingMode.DontBinding;
                    }
                    if (Puerts.Editor.Generator.Utils.isDisallowedType(ptype))
                    {
                        return BindingMode.DontBinding;
                    }
                    if (ptype == typeof(System.IntPtr) || ptype == typeof(System.UIntPtr))
                    {
                        useSlowBinding = true;
                    }
                }
            }

            MethodInfo methodInfo = memberInfo as MethodInfo;
            if (methodInfo != null)
            {
                if (IsBigValueType(methodInfo.ReturnType) || IsPointerOfPointer(methodInfo.ReturnType) || Puerts.Editor.Generator.Utils.isDisallowedType(methodInfo.ReturnType))
                {
                    return BindingMode.DontBinding;
                }
            }

            FieldInfo fieldInfo = memberInfo as FieldInfo;
            if (fieldInfo != null)
            {
                if (IsBigValueType(fieldInfo.FieldType) || IsPointerOfPointer(fieldInfo.FieldType) || Puerts.Editor.Generator.Utils.isDisallowedType(fieldInfo.FieldType))
                {
                    return BindingMode.DontBinding;
                }
            }
            return useSlowBinding ? BindingMode.SlowBinding : BindingMode.FastBinding;
        }
        catch
        {
            return BindingMode.DontBinding;
        }
    }
}
#endif
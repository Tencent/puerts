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
}
#endif
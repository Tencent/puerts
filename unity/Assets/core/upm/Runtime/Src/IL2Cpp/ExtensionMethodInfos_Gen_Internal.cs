/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if UNITY_2020_1_OR_NEWER
#if !PUERTS_DISABLE_IL2CPP_OPTIMIZATION && (PUERTS_IL2CPP_OPTIMIZATION || !UNITY_IPHONE) && ENABLE_IL2CPP
using System;
using System.Collections.Generic;
using System.Reflection;
namespace PuertsIl2cpp
{
public static class ExtensionMethodInfos_Gen_Internal
{
    [UnityEngine.Scripting.Preserve]
    public static MethodInfo[] TryLoadExtensionMethod(string assemblyQualifiedName)
    {
        if (false) {}
        else if (typeof(System.Int32[]).AssemblyQualifiedName == assemblyQualifiedName)
        {
            return ExtensionMethodInfo.GetExtensionMethods(typeof(System.Int32[]), typeof(PuertsIl2cpp.ArrayExtension));
        }
        else if (typeof(System.Single[]).AssemblyQualifiedName == assemblyQualifiedName)
        {
            return ExtensionMethodInfo.GetExtensionMethods(typeof(System.Single[]), typeof(PuertsIl2cpp.ArrayExtension));
        }
        else if (typeof(System.Double[]).AssemblyQualifiedName == assemblyQualifiedName)
        {
            return ExtensionMethodInfo.GetExtensionMethods(typeof(System.Double[]), typeof(PuertsIl2cpp.ArrayExtension));
        }
        else if (typeof(System.Boolean[]).AssemblyQualifiedName == assemblyQualifiedName)
        {
            return ExtensionMethodInfo.GetExtensionMethods(typeof(System.Boolean[]), typeof(PuertsIl2cpp.ArrayExtension));
        }
        else if (typeof(System.Int64[]).AssemblyQualifiedName == assemblyQualifiedName)
        {
            return ExtensionMethodInfo.GetExtensionMethods(typeof(System.Int64[]), typeof(PuertsIl2cpp.ArrayExtension));
        }
        else if (typeof(System.UInt64[]).AssemblyQualifiedName == assemblyQualifiedName)
        {
            return ExtensionMethodInfo.GetExtensionMethods(typeof(System.UInt64[]), typeof(PuertsIl2cpp.ArrayExtension));
        }
        else if (typeof(System.SByte[]).AssemblyQualifiedName == assemblyQualifiedName)
        {
            return ExtensionMethodInfo.GetExtensionMethods(typeof(System.SByte[]), typeof(PuertsIl2cpp.ArrayExtension));
        }
        else if (typeof(System.Byte[]).AssemblyQualifiedName == assemblyQualifiedName)
        {
            return ExtensionMethodInfo.GetExtensionMethods(typeof(System.Byte[]), typeof(PuertsIl2cpp.ArrayExtension));
        }
        else if (typeof(System.UInt16[]).AssemblyQualifiedName == assemblyQualifiedName)
        {
            return ExtensionMethodInfo.GetExtensionMethods(typeof(System.UInt16[]), typeof(PuertsIl2cpp.ArrayExtension));
        }
        else if (typeof(System.Int16[]).AssemblyQualifiedName == assemblyQualifiedName)
        {
            return ExtensionMethodInfo.GetExtensionMethods(typeof(System.Int16[]), typeof(PuertsIl2cpp.ArrayExtension));
        }
        else if (typeof(System.Char[]).AssemblyQualifiedName == assemblyQualifiedName)
        {
            return ExtensionMethodInfo.GetExtensionMethods(typeof(System.Char[]), typeof(PuertsIl2cpp.ArrayExtension));
        }
        else if (typeof(System.UInt32[]).AssemblyQualifiedName == assemblyQualifiedName)
        {
            return ExtensionMethodInfo.GetExtensionMethods(typeof(System.UInt32[]), typeof(PuertsIl2cpp.ArrayExtension));
        }
        else if (typeof(System.String[]).AssemblyQualifiedName == assemblyQualifiedName)
        {
            return ExtensionMethodInfo.GetExtensionMethods(typeof(System.String[]), typeof(PuertsIl2cpp.ArrayExtension));
        }
        else if (typeof(System.Array).AssemblyQualifiedName == assemblyQualifiedName)
        {
            return ExtensionMethodInfo.GetExtensionMethods(typeof(System.Array), typeof(PuertsIl2cpp.ArrayExtension));
        }
        return null;
    }
}
}
#endif
#endif
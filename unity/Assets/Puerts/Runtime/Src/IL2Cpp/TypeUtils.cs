/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if EXPERIMENTAL_IL2CPP_PUERTS && ENABLE_IL2CPP

using System;
using System.Reflection;

namespace Puerts
{
    public static class TypeUtils
    {
        private static Type GetType(string className, bool isQualifiedName)
        {
            Type type = Type.GetType(className, false);
            if (type != null)
            {
                return type;
            }
            foreach (Assembly assembly in AppDomain.CurrentDomain.GetAssemblies())
            {
                type = assembly.GetType(className);

                if (type != null)
                {
                    return type;
                }
            }
            int p1 = className.IndexOf('[');
            if (p1 > 0 && !isQualifiedName)
            {
                string qualified_name = className.Substring(0, p1 + 1);
                string[] generic_params = className.Substring(p1 + 1, className.Length - qualified_name.Length - 1).Split(',');
                for (int i = 0; i < generic_params.Length; i++)
                {
                    Type generic_param = GetType(generic_params[i].Trim(), false);
                    if (generic_param == null)
                    {
                        return null;
                    }
                    if (i != 0)
                    {
                        qualified_name += ", ";
                    }
                    qualified_name = qualified_name + "[" + generic_param.AssemblyQualifiedName + "]";
                }
                qualified_name += "]";
                return GetType(qualified_name, true);
            }
            return null;
        }

        public static Type GetType(string className)
        {
            return GetType(className, false);
        }
    }
}

#endif

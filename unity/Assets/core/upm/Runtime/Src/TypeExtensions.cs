/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if !EXPERIMENTAL_IL2CPP_PUERTS || !ENABLE_IL2CPP

using System;
using System.Linq;

namespace Puerts
{
    public static class TypeExtensions
    {
        internal static bool IsValueType(this Type type)
        {
#if !UNITY_WSA || UNITY_EDITOR
            return type.IsValueType;
#else
            return type.GetTypeInfo().IsValueType;
#endif
        }

        internal static bool IsEnum(this Type type)
        {
#if !UNITY_WSA || UNITY_EDITOR
            return type.IsEnum;
#else
            return type.GetTypeInfo().IsEnum;
#endif
        }

        internal static bool IsPrimitive(this Type type)
        {
#if !UNITY_WSA || UNITY_EDITOR
            return type.IsPrimitive;
#else
            return type.GetTypeInfo().IsPrimitive;
#endif
        }

        internal static bool IsAbstract(this Type type)
        {
#if !UNITY_WSA || UNITY_EDITOR
            return type.IsAbstract;
#else
            return type.GetTypeInfo().IsAbstract;
#endif
        }

        internal static bool IsSealed(this Type type)
        {
#if !UNITY_WSA || UNITY_EDITOR
            return type.IsSealed;
#else
            return type.GetTypeInfo().IsSealed;
#endif
        }

        internal static bool IsInterface(this Type type)
        {
#if !UNITY_WSA || UNITY_EDITOR
            return type.IsInterface;
#else
            return type.GetTypeInfo().IsInterface;
#endif
        }

        internal static bool IsClass(this Type type)
        {
#if !UNITY_WSA || UNITY_EDITOR
            return type.IsClass;
#else
            return type.GetTypeInfo().IsClass;
#endif
        }

        internal static Type BaseType(this Type type)
        {
#if !UNITY_WSA || UNITY_EDITOR
            return type.BaseType;
#else
            return type.GetTypeInfo().BaseType;
#endif
        }

        internal static bool IsGenericType(this Type type)
        {
#if !UNITY_WSA || UNITY_EDITOR
            return type.IsGenericType;
#else
            return type.GetTypeInfo().IsGenericType;
#endif
        }

        internal static bool IsGenericTypeDefinition(this Type type)
        {
#if !UNITY_WSA || UNITY_EDITOR
            return type.IsGenericTypeDefinition;
#else
            return type.GetTypeInfo().IsGenericTypeDefinition;
#endif
        }

#if UNITY_WSA && !UNITY_EDITOR
        internal static bool IsSubclassOf(this Type type, Type c)
        {
            return type.GetTypeInfo().IsSubclassOf(c);
        }

        internal static bool IsDefined(this Type type, Type attributeType, bool inherit)
        {
            return type.GetTypeInfo().IsDefined(attributeType, inherit);
        }

        internal static Type[] GetGenericParameterConstraints(this Type type)
        {
            return type.GetTypeInfo().GetGenericParameterConstraints();
        }
#endif

        internal static bool IsNestedPublic(this Type type)
        {
#if !UNITY_WSA || UNITY_EDITOR
            return type.IsNestedPublic;
#else
            return type.GetTypeInfo().IsNestedPublic;
#endif        
        }

        internal static bool IsPublic(this Type type)
        {
#if !UNITY_WSA || UNITY_EDITOR
            return type.IsPublic;
#else
            return type.GetTypeInfo().IsPublic;
#endif        
        }

        internal static bool IsStruct(this Type type)
        {
            return type.IsValueType() && !type.IsEnum() && !type.IsPrimitive();
        }

        static string GetNameWithoutNamespace(Type type)
        {
            if (type.IsGenericType)
            {
                var genericArgumentNames = type.GetGenericArguments()
                    .Select(x => GetFriendlyName(x)).ToArray();
                return type.Name.Split('`')[0] + "<" + string.Join(", ", genericArgumentNames) + ">";
            }
            else
            {
                return type.Name;
            }
        }

        public static string GetFriendlyName(this Type type, Type[] genericArguments = null)
        {
            if (type == typeof(int))
                return "int";
            if (type == typeof(uint))
                return "uint";
            else if (type == typeof(short))
                return "short";
            else if (type == typeof(byte))
                return "byte";
            else if (type == typeof(sbyte))
                return "sbyte";
            else if (type == typeof(ushort))
                return "ushort";
            else if (type == typeof(bool))
                return "bool";
            else if (type == typeof(long))
                return "long";
            else if (type == typeof(ulong))
                return "ulong";
            else if (type == typeof(float))
                return "float";
            else if (type == typeof(double))
                return "double";
            else if (type == typeof(decimal))
                return "decimal";
            else if (type == typeof(string))
                return "string";
            else if (type == typeof(void))
                return "void";
            else if (type.IsArray)
            {
                if (type.GetArrayRank() > 1)
                {
                    return GetFriendlyName(type.GetElementType()) + "[" + new String(',', type.GetArrayRank() - 1) + "]";
                }
                else
                {
                    return GetFriendlyName(type.GetElementType()) + "[]";
                }
            }
            else if (type.IsGenericParameter)
            {
                return type.Name;
            }
            else if (type.IsNested)
            {
                if (type.DeclaringType.IsNested) {
                    if (type.DeclaringType.IsGenericTypeDefinition) 
                        return GetFriendlyName(type.DeclaringType, type.GetGenericArguments())+ '.' + type.Name;
                    else 
                        return GetFriendlyName(type.DeclaringType)+ '.' + type.Name;
                }
                else if (type.DeclaringType.IsGenericTypeDefinition)
                {
                    var genericArgumentNames = (genericArguments == null ? type.GetGenericArguments() : genericArguments)
                        .Select(x => GetFriendlyName(x)).ToArray();
                    return type.DeclaringType.FullName.Split('`')[0] + "<" + string.Join(", ", genericArgumentNames) + ">" + '.' + type.Name;
                }
                else
                {
                    return GetFriendlyName(type.DeclaringType) + '.' + GetNameWithoutNamespace(type);
                }
            }
            else if (type.IsGenericType)
            {
                var genericArgumentNames = type.GetGenericArguments()
                    .Select(x => GetFriendlyName(x)).ToArray();
                return (type.FullName == null ? type.Namespace + "." + type.Name : type.FullName).Split('`')[0] + "<" + string.Join(", ", genericArgumentNames) + ">";
            }
            else
                return type.FullName;
        }
    }
}

#endif

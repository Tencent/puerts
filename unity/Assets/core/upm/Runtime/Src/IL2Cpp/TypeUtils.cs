/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if EXPERIMENTAL_IL2CPP_PUERTS || UNITY_EDITOR

using System;
using System.Reflection;
using System.Collections.Generic;
using System.Linq;

namespace PuertsIl2cpp
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


        public static string GetValueTypeFieldsSignature(Type type)
        {
            if (!type.IsValueType)
            {
                throw new Exception(type + " is not a valuetype");
            }
            System.Text.StringBuilder sb = new System.Text.StringBuilder();
            if (type.BaseType.IsValueType)
            {
                sb.Append(GetValueTypeFieldsSignature(type.BaseType));
            }
            foreach (var field in type.GetFields(BindingFlags.DeclaredOnly | BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic))
            {
                sb.Append((field.FieldType.IsValueType && !field.FieldType.IsPrimitive) ? GetValueTypeFieldsSignature(field.FieldType) : GetTypeSignature(field.FieldType));
            }
            return sb.ToString();
        }

        public static string GetTypeSignature(Type type)
        {
            if (type == typeof(void))
            {
                return "v";
            }
            else if (type == typeof(bool))
            {
                return "b";
            }
            else if (type == typeof(byte))
            {
                return "u1";
            }
            else if (type == typeof(sbyte))
            {
                return "i1";
            }
            else if (type == typeof(short))
            {
                return "i2";
            }
            else if (type == typeof(ushort))
            {
                return "u2";
            }
            else if (type == typeof(int))
            {
                return "i4";
            }
            else if (type == typeof(uint))
            {
                return "u4";
            }
            else if (type == typeof(long))
            {
                return "i8";
            }
            else if (type == typeof(ulong))
            {
                return "u8";
            }
            else if (type == typeof(char))
            {
                return "c";
            }
            else if (type == typeof(double))
            {
                return "r8";
            }
            else if (type == typeof(float))
            {
                return "r4";
            }
            else if (type == typeof(IntPtr) || type == typeof(UIntPtr))
            {
                return "p";
            }
            else if (type == typeof(DateTime)) //是否要支持？
            {
                return "d";
            }
            else if (type == typeof(string))
            {
                return "s";
            }
            else if (type == typeof(object)) //object特殊处理，比如check可以不用判断，比如return可以优化
            {
                return "O";
            }
            else if (type.IsByRef || type.IsPointer)
            {
                return "P" + GetTypeSignature(type.GetElementType());
            }
            //TODO: ArrayBuffer...
            else if (!type.IsValueType)
            {
                return "o";
            }
            else if (type.IsValueType && !type.IsPrimitive)
            {
                //return "s" + Marshal.SizeOf(type);
                return "s_" + GetValueTypeFieldsSignature(type) + "_";
            }
            throw new NotSupportedException("no support type: " + type);
        }

        public static string GetParamerterSignature(ParameterInfo parameterInfo)
        {
            return GetTypeSignature(parameterInfo.ParameterType);
        }

        public static string GetThisSignature(MethodBase methodBase)
        {
            if (methodBase is ConstructorInfo)
            {
                return "t";
            }
            else if (methodBase is MethodInfo)
            {
                bool isDelegate = typeof(MulticastDelegate).IsAssignableFrom(methodBase.DeclaringType);
                var methodInfo = methodBase as MethodInfo;
                if (!isDelegate && !methodInfo.IsStatic)
                {
                    return methodBase.DeclaringType == typeof(object) ? "T" : "t";
                }
            }
            return "";
        }
        public static string GetMethodSignature(MethodBase methodBase, bool isDelegateInvoke = false)
        {
            string signature = "";
            if (methodBase is ConstructorInfo)
            {
                signature += "vt";
                var constructorInfo = methodBase as ConstructorInfo;
                foreach (var p in constructorInfo.GetParameters())
                {
                    signature += GetParamerterSignature(p);
                }

            }
            else if (methodBase is MethodInfo)
            {
                var methodInfo = methodBase as MethodInfo;
                signature += GetTypeSignature(methodInfo.ReturnType);
                if (!methodInfo.IsStatic && !isDelegateInvoke) signature += methodBase.DeclaringType == typeof(object) ? "T" : "t";
                foreach (var p in methodInfo.GetParameters())
                {
                    signature += GetParamerterSignature(p);
                }

            }
            return signature;
        }

        public static bool TypeInfoPassToJsFilter(Type type)
        {
            return type != typeof(void) && !type.IsPrimitive;
        }

        public static List<Type> GetUsedTypes(MethodBase methodBase)
        {
            List<Type> types = new List<Type>();
            if (methodBase is MethodInfo)
            {
                var returnType = (methodBase as MethodInfo).ReturnType;
                if (TypeInfoPassToJsFilter(returnType))
                {
                    types.Add(returnType);
                }
            }
            types.AddRange(methodBase.GetParameters().Select(m => m.ParameterType.IsByRef ? m.ParameterType.GetElementType() : m.ParameterType).Where(TypeInfoPassToJsFilter));
            return types;
        }

    }
}

#endif

/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if UNITY_2020_1_OR_NEWER
#if EXPERIMENTAL_IL2CPP_PUERTS || UNITY_EDITOR || PUERTS_GENERAL

using System;
using System.Reflection;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;

namespace PuertsIl2cpp
{
	public static class ExtensionMethodInfo
	{
        private static Type GetExtendedType(MethodInfo method)
        {
            var type = method.GetParameters()[0].ParameterType;
            if (!type.IsGenericParameter)
                return type;
            var parameterConstraints = type.GetGenericParameterConstraints();
            if (parameterConstraints.Length == 0)
                throw new InvalidOperationException();
            var firstParameterConstraint = parameterConstraints[0];
            if (!firstParameterConstraint.IsClass)
                throw new InvalidOperationException();
            return firstParameterConstraint;
        }
        
        // Call By Gen Code
        public static IEnumerable<MethodInfo> GetExtensionMethods(Type type, params Type[] extensions)
        {
            return from e in extensions from m in e.GetMethods(BindingFlags.Static | BindingFlags.Public) 
                where !m.IsSpecialName && GetExtendedType(m) == type select m;
        }

        public static IEnumerable<MethodInfo> Get(Type type)
        {
            if (LoadExtensionMethod != null)
                return LoadExtensionMethod(type);
            return null;
        }

        public static Func<Type, IEnumerable<MethodInfo>> LoadExtensionMethod;

        public static bool LoadExtensionMethodInfo() {
            var ExtensionMethodInfos_Gen = (from assembly in AppDomain.CurrentDomain.GetAssemblies()
                select assembly.GetType("PuertsIl2cpp.ExtensionMethodInfos_Gen")).FirstOrDefault(x => x != null);
            if (ExtensionMethodInfos_Gen == null)
                ExtensionMethodInfos_Gen = (from assembly in AppDomain.CurrentDomain.GetAssemblies()
                select assembly.GetType("PuertsIl2cpp.ExtensionMethodInfos_Gen_Internal")).FirstOrDefault(x => x != null);
            var TryLoadExtensionMethod = ExtensionMethodInfos_Gen.GetMethod("TryLoadExtensionMethod");
            if (TryLoadExtensionMethod == null) return false;
            LoadExtensionMethod = (Func<Type, IEnumerable<MethodInfo>>)Delegate.CreateDelegate(
                typeof(Func<Type, IEnumerable<MethodInfo>>), null, TryLoadExtensionMethod);
            return true;
        }
	}
	
    public static class TypeUtils
    {
        public class TypeSignatures
        {
            public static string Void = "v";
            public static string Bool = "b";
            public static string Byte = "u1";
            public static string Sbyte = "i1";
            public static string Short = "i2";
            public static string Ushort = "u2";
            public static string Int = "i4";
            public static string Uint = "u4";
            public static string Long = "i8";
            public static string Ulong = "u8";
            public static string Char = "c";
            public static string Double = "r8";
            public static string Float = "r4";
            public static string IntPtr = "p";
            public static string String = "s";
            public static string ArrayBuffer = "a";
            public static string SystemObject = "O";
            public static string RefOrPointerPrefix = "P";
            public static string Object = "o";
            public static string StructPrefix = "S_";
            public static string NullableStructPrefix = "N_";
        }
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
                sb.Append(GetTypeSignature(type.BaseType));
            }
            foreach (var field in type.GetFields(BindingFlags.DeclaredOnly | BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic))
            {
                // special handling circular definition by pointer
                if (
                    (field.FieldType.IsByRef || field.FieldType.IsPointer) &&
                    field.FieldType.GetElementType() == type
                ) {
                    sb.Append("Pv");
                } 
                else
                    sb.Append(GetTypeSignature(field.FieldType));
            }
            return sb.ToString();
        }

        public static string GetTypeSignature(Type type)
        {
            if (type == typeof(void))
            {
                return TypeSignatures.Void;
            }
            else if (type == typeof(bool))
            {
                return TypeSignatures.Bool;
            }
            else if (type == typeof(byte))
            {
                return TypeSignatures.Byte;
            }
            else if (type == typeof(sbyte))
            {
                return TypeSignatures.Sbyte;
            }
            else if (type == typeof(short))
            {
                return TypeSignatures.Short;
            }
            else if (type == typeof(ushort))
            {
                return TypeSignatures.Ushort;
            }
            else if (type == typeof(int))
            {
                return TypeSignatures.Int;
            }
            else if (type == typeof(uint))
            {
                return TypeSignatures.Uint;
            }
            else if (type == typeof(long))
            {
                return TypeSignatures.Long;
            }
            else if (type == typeof(ulong))
            {
                return TypeSignatures.Ulong;
            }
            else if (type == typeof(char))
            {
                return TypeSignatures.Char;
            }
            else if (type == typeof(double))
            {
                return TypeSignatures.Double;
            }
            else if (type == typeof(float))
            {
                return TypeSignatures.Float;
            }
            else if (type == typeof(Puerts.ArrayBuffer))
            {
                return TypeSignatures.ArrayBuffer;
            }
            else if (type == typeof(IntPtr) || type == typeof(UIntPtr))
            {
                return TypeSignatures.IntPtr;
            }
            //else if (type == typeof(DateTime)) //是否要支持？
            //{
            //    return "d";
            //}
            else if (type == typeof(string))
            {
                return TypeSignatures.String;
            }
            else if (type == typeof(object)) //object特殊处理，比如check可以不用判断，比如return可以优化
            {
                return TypeSignatures.SystemObject;
            }
            else if (type.IsByRef || type.IsPointer)
            {
                return TypeSignatures.RefOrPointerPrefix + GetTypeSignature(type.GetElementType());
            }
            else if (type.IsEnum)
            {
                if (type.IsGenericParameter)
                    return "";
                else
                    return GetTypeSignature(Enum.GetUnderlyingType(type));
            }
            else if (!type.IsValueType)
            {
                return TypeSignatures.Object;
            }
            else if (type.IsValueType && !type.IsPrimitive)
            {
                //return "s" + Marshal.SizeOf(type);
                if (Nullable.GetUnderlyingType(type) != null) 
                    return TypeSignatures.NullableStructPrefix + GetValueTypeFieldsSignature(type) + "_";
                else 
                    return TypeSignatures.StructPrefix + GetValueTypeFieldsSignature(type) + "_";
            }
            throw new NotSupportedException("no support type: " + type);
        }

        public static string GetParameterSignature(ParameterInfo parameterInfo)
        {
            bool isParams = parameterInfo.IsDefined(typeof(ParamArrayAttribute), false) && parameterInfo.ParameterType.IsArray;
            if (isParams)
            {
                return "V" + GetTypeSignature(parameterInfo.ParameterType.GetElementType());
            }

            if (parameterInfo.IsOptional)
            {
                return "D" + GetTypeSignature(parameterInfo.ParameterType);
            }
            
            return GetTypeSignature(parameterInfo.ParameterType);
        }

        public static string GetThisSignature(MethodBase methodBase, bool isExtensionMethod = false)
        {
            if (methodBase is ConstructorInfo)
            {
                return "t";
            }
            else if (methodBase is MethodInfo)
            {
                bool isDelegate = typeof(MulticastDelegate).IsAssignableFrom(methodBase.DeclaringType);
                var methodInfo = methodBase as MethodInfo;
                if ((!isDelegate && !methodInfo.IsStatic) || isExtensionMethod)
                {
                    return methodBase.DeclaringType == typeof(object) ? "T" : "t";
                }
            }
            return "";
        }
        public static string GetMethodSignature(MethodBase methodBase, bool isDelegateInvoke = false, bool isExtensionMethod = false)
        {
            string signature = "";
            if (methodBase is ConstructorInfo)
            {
                signature += "vt";
                var constructorInfo = methodBase as ConstructorInfo;
                foreach (var p in constructorInfo.GetParameters())
                {
                    signature += GetParameterSignature(p);
                }
            }
            else if (methodBase is MethodInfo)
            {
                var methodInfo = methodBase as MethodInfo;
                signature += GetTypeSignature(methodInfo.ReturnType);
                if (!methodInfo.IsStatic && !isDelegateInvoke) signature += methodBase.DeclaringType == typeof(object) ? "T" : "t";
                var parameterInfos = methodInfo.GetParameters();
                for (int i = 0; i < parameterInfos.Length; ++i)
                {
                    if (i == 0 && isExtensionMethod)
                    {
                        signature += parameterInfos[0].ParameterType == typeof(object) ? "T" : "t";
                    }
                    else
                    {
                        signature += GetParameterSignature(parameterInfos[i]);
                    }
                }

            }

            // UnityEngine.Debug.Log("GetMethodSignature " + methodBase.DeclaringType + "." + methodBase.Name + "->" + signature);
            return signature;
        }

        public static bool TypeInfoPassToJsFilter(Type type)
        {
            return type != typeof(void) && !type.IsPrimitive && !type.IsEnum;
        }

        public static List<Type> GetUsedTypes(MethodBase methodBase, bool isExtensionMethod = false)
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
            types.AddRange(methodBase.GetParameters().Skip(isExtensionMethod ? 1 : 0).Select(m => m.ParameterType.IsByRef ? m.ParameterType.GetElementType() : m.ParameterType).Where(TypeInfoPassToJsFilter));
            return types;
        }

        public static MethodInfo HandleMaybeGenericMethod(MethodInfo method, ParameterInfo[] pinfos = null)
        {
            if (method.IsGenericMethodDefinition)
            {
                if (!IsNonGenericOrValidGeneric(method, pinfos))
                {
                    return null;
                }
                var genericArguments = method.GetGenericArguments();
                var constraintedArgumentTypes = new Type[genericArguments.Length];
                for (var j = 0; j < genericArguments.Length; j++)
                {
                    constraintedArgumentTypes[j] = genericArguments[j].BaseType;
                }
                method = method.MakeGenericMethod(constraintedArgumentTypes);
            }
            return method;
        }

        internal static bool IsNonGenericOrValidGeneric(MethodInfo method, ParameterInfo[] pinfos = null)
        {
            // 不包含泛型参数，肯定支持
            if (!method.ContainsGenericParameters)
                return true;

            List<Type> validGenericParameter = new List<Type>();

            if (pinfos == null) pinfos = method.GetParameters(); 
            foreach (var parameters in pinfos)
            {
                Type parameterType = parameters.ParameterType;

                if (!HasValidContraint(parameterType, validGenericParameter)) { 
                    return false; 
                }
            }

            return validGenericParameter.Count > 0 && (
                // 返回值也需要判断，必须是非泛型，或者是可用泛型参数里正好也包括返回类型
                !method.ReturnType.IsGenericParameter ||
                validGenericParameter.Contains(method.ReturnType)
            );
        }

        internal static bool HasValidContraint(Type type, List<Type> validTypes)
        {
            if (type.IsGenericType)
            {
                Type[] genericArguments = type.GetGenericArguments();
                foreach (Type argument in genericArguments)
                {
                    if (!HasValidContraint(argument, validTypes))
                    {
                        return false;
                    }
                }

                // validTypes.Add(type);
                return true;
            }
            else if (type.IsGenericParameter)
            {
                if (
                    type.BaseType != null && type.BaseType.IsValueType
                ) return false;

                var parameterConstraints = type.GetGenericParameterConstraints();

                if (parameterConstraints.Length == 0) return false;
                foreach (var parameterConstraint in parameterConstraints)
                {
                    // the constraint could not be another genericType #533
                    if (
                        !IsClass(parameterConstraint) ||
                        parameterConstraint == typeof(ValueType) ||
                        (
                            parameterConstraint.IsGenericType &&
                            !parameterConstraint.IsGenericTypeDefinition
                        )
                    )
                    {
                        return false;
                    }
                }

                validTypes.Add(type);
                return true;
            }
            else
            {
                return true;
            }
        }

        internal static bool IsClass(Type type)
        {
#if !UNITY_WSA || UNITY_EDITOR
            return type.IsClass;
#else
            return type.GetTypeInfo().IsClass;
#endif
        }
    }
}

#endif
#endif
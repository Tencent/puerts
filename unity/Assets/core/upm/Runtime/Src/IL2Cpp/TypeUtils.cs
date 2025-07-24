/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

<<<<<<< HEAD
=======
#if UNITY_2020_1_OR_NEWER
#if !PUERTS_DISABLE_IL2CPP_OPTIMIZATION && (PUERTS_IL2CPP_OPTIMIZATION || !UNITY_IPHONE) || UNITY_EDITOR || PUERTS_GENERAL

>>>>>>> fix-issue-2013-debug-crash
using System;
using System.Reflection;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;

namespace PuertsIl2cpp
{
	public static class ExtensionMethodInfo
	{
<<<<<<< HEAD
        internal static Type GetExtendedType(MethodInfo method)
=======
        private static Type GetExtendedType(MethodInfo method)
>>>>>>> fix-issue-2013-debug-crash
        {
            var paramInfo = method.GetParameters();
            if (paramInfo.Length == 0)
            {
                return null;
            }
            if (method.GetCustomAttribute<ExtensionAttribute>() == null)
            {
                return null;
            }
            var type = method.GetParameters()[0].ParameterType;
            if (!type.IsGenericParameter)
                return type;
            var parameterConstraints = type.GetGenericParameterConstraints();
            if (parameterConstraints.Length == 0)
            {
                return null;
            }
            var firstParameterConstraint = parameterConstraints[0];
            if (!firstParameterConstraint.IsClass)
            {
                return null;
            }
            return firstParameterConstraint;
        }
        
        // Call By Gen Code
        public static MethodInfo[] GetExtensionMethods(Type type, params Type[] extensions)
        {
            return (from e in extensions from m in e.GetMethods(BindingFlags.Static | BindingFlags.Public) 
                where !m.IsSpecialName && GetExtendedType(m) == type select m).ToArray();
        }

        [UnityEngine.Scripting.Preserve]
        public static MethodInfo[] Get(string assemblyQualifiedName)
        {
            if (LoadExtensionMethod != null)
                return LoadExtensionMethod(assemblyQualifiedName);
            return null;
        }

        public static Func<string, MethodInfo[]> LoadExtensionMethod;

<<<<<<< HEAD
        private static volatile Dictionary<Type, MethodInfo[]> extensionMethodMap = null;

        static MethodInfo[] EmptyMethodInfos = new MethodInfo[] { };

        public static MethodInfo[] ReflectionGetExtensionMethodsOf(string typeName)
        {
            Type type_to_be_extend = Type.GetType(typeName);
            if (type_to_be_extend == null) return EmptyMethodInfos;
            if (extensionMethodMap == null)
            {
                List<Type> type_def_extention_method = new List<Type>();

                IEnumerator<Type> enumerator = GetAllTypes().GetEnumerator();

                while (enumerator.MoveNext())
                {
                    Type type = enumerator.Current;
                    if (type.IsDefined(typeof(ExtensionAttribute), false))
                    {
                        type_def_extention_method.Add(type);
                    }
                }
                enumerator.Dispose();

                extensionMethodMap = (from type in type_def_extention_method.Distinct()
                                                         // #if UNITY_EDITOR
                                                         //                                       where !type.Assembly.Location.Contains("Editor")
                                                         // #endif
                                                     from method in type.GetMethods(BindingFlags.Static | BindingFlags.Public)
                                                     where method.IsDefined(typeof(ExtensionAttribute), false) && IsSupportedMethod(method)
                                                     group method by GetExtendedType(method)).Where(g => g.Key != null).ToDictionary(g => g.Key, g => g.ToArray());
            }
            MethodInfo[] ret = null;
            extensionMethodMap.TryGetValue(type_to_be_extend, out ret);
            return ret;
        }

        public static bool IsSupportedMethod(MethodInfo method)
        {
            if (!method.ContainsGenericParameters)
                return true;
            var methodParameters = method.GetParameters();
            var returnType = method.ReturnType;
            var hasValidGenericParameter = false;
            var returnTypeValid = !returnType.IsGenericParameter;
            // 在参数列表里找得到和泛型参数相同的参数
            for (var i = 0; i < methodParameters.Length; i++)
            {
                var parameterType = methodParameters[i].ParameterType;
                // 如果参数是泛型参数
                if (parameterType.IsGenericParameter)
                {
                    // 所有参数的基类都不是值类型，且不是另一个泛型
                    if (
                        parameterType.BaseType != null && (
                            parameterType.BaseType.IsValueType ||
                            (
                                parameterType.BaseType.IsGenericType &&
                                !parameterType.BaseType.IsGenericTypeDefinition
                            )
                        )
                    ) return false;
                    var parameterConstraints = parameterType.GetGenericParameterConstraints();
                    // 所有泛型参数都有值类型约束
                    if (parameterConstraints.Length == 0) return false;
                    foreach (var parameterConstraint in parameterConstraints)
                    {
                        // 所有泛型参数的类型约束都不是值类型
                        if (parameterConstraint.IsValueType || (parameterConstraint == typeof(ValueType)))
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
        public static List<Type> GetAllTypes(bool exclude_generic_definition = true)
        {
            List<Type> allTypes = new List<Type>();
            var assemblies = AppDomain.CurrentDomain.GetAssemblies();
            for (int i = 0; i < assemblies.Length; i++)
            {
                try
                {
#if (UNITY_EDITOR || PUERTS_GENERAL) && !NET_STANDARD_2_0
                    if (!(assemblies[i].ManifestModule is System.Reflection.Emit.ModuleBuilder))
                    {
#endif
                    allTypes.AddRange(assemblies[i].GetTypes()
                        .Where(type => exclude_generic_definition ? !type.IsGenericTypeDefinition : true));
#if (UNITY_EDITOR || PUERTS_GENERAL) && !NET_STANDARD_2_0
                    }
#endif
                }
                catch (Exception)
                {
                }
            }

            return allTypes;
        }

        public static bool LoadExtensionMethodInfo() {
            var ExtensionMethodInfos_Gen = (from assembly in AppDomain.CurrentDomain.GetAssemblies()
                select assembly.GetType("PuertsIl2cpp.ExtensionMethodInfos_Gen")).FirstOrDefault(x => x != null);
            bool noGen = false;
            if (ExtensionMethodInfos_Gen == null)
            {
                ExtensionMethodInfos_Gen = (from assembly in AppDomain.CurrentDomain.GetAssemblies()
                                            select assembly.GetType("PuertsIl2cpp.ExtensionMethodInfos_Gen_Internal")).FirstOrDefault(x => x != null);
                noGen = true;
            }
            var TryLoadExtensionMethod = ExtensionMethodInfos_Gen.GetMethod("TryLoadExtensionMethod");
            if (TryLoadExtensionMethod == null)
            {
                LoadExtensionMethod = ReflectionGetExtensionMethodsOf;
            }
            if (noGen)
            {
                var staticGetExtensionMethodsOf = (Func<string, MethodInfo[]>)Delegate.CreateDelegate(
                    typeof(Func<string, MethodInfo[]>), null, TryLoadExtensionMethod);
                LoadExtensionMethod = (name) =>
                {
                    var ret = staticGetExtensionMethodsOf(name);
                    if (ret == null || ret.Length == 0)
                    {
                        ret = ReflectionGetExtensionMethodsOf(name);
                    }
                    return ret;
                };
            }
            else
            {
                LoadExtensionMethod = (Func<string, MethodInfo[]>)Delegate.CreateDelegate(
                    typeof(Func<string, MethodInfo[]>), null, TryLoadExtensionMethod);
            }
=======
        public static bool LoadExtensionMethodInfo() {
            var ExtensionMethodInfos_Gen = (from assembly in AppDomain.CurrentDomain.GetAssemblies()
                select assembly.GetType("PuertsIl2cpp.ExtensionMethodInfos_Gen")).FirstOrDefault(x => x != null);
            if (ExtensionMethodInfos_Gen == null)
                ExtensionMethodInfos_Gen = (from assembly in AppDomain.CurrentDomain.GetAssemblies()
                select assembly.GetType("PuertsIl2cpp.ExtensionMethodInfos_Gen_Internal")).FirstOrDefault(x => x != null);
            var TryLoadExtensionMethod = ExtensionMethodInfos_Gen.GetMethod("TryLoadExtensionMethod");
            if (TryLoadExtensionMethod == null) return false;
            LoadExtensionMethod = (Func<string, MethodInfo[]>)Delegate.CreateDelegate(
                typeof(Func<string, MethodInfo[]>), null, TryLoadExtensionMethod);
>>>>>>> fix-issue-2013-debug-crash
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
                if (field.FieldType.IsPointer || (field.FieldType.IsByRef && field.FieldType.GetElementType() == type))
                {
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
            else if (type.IsPointer)
            {
                return TypeSignatures.RefOrPointerPrefix + "v";
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
        public static string GetMethodSignature(MethodBase methodBase, bool isBridge = false, bool isExtensionMethod = false)
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
                if (!methodInfo.IsStatic && !isBridge) signature += methodBase.DeclaringType == typeof(object) ? "T" : "t";
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
<<<<<<< HEAD
=======

#endif
#endif
>>>>>>> fix-issue-2013-debug-crash

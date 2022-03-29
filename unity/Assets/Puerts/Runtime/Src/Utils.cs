/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Runtime.CompilerServices;

namespace Puerts
{
    public static class Utils
    {
        public static long TwoIntToLong(int a, int b)
        {
            return (long)a << 32 | b & 0xFFFFFFFFL;
        }

        public static void LongToTwoInt(long c, out int a, out int b)
        {
            a = (int)(c >> 32);
            b = (int)c;
        }

        public static IntPtr GetObjectPtr(int jsEnvIdx, Type type, object obj)
        {
            var jsEnv = JsEnv.jsEnvs[jsEnvIdx];
            return new IntPtr(type.IsValueType() ? jsEnv.objectPool.AddBoxedValueType(obj) : jsEnv.objectPool.FindOrAddObject(obj));
        }

        public static object GetSelf(int jsEnvIdx, IntPtr self)
        {
            return JsEnv.jsEnvs[jsEnvIdx].objectPool.Get(self.ToInt32());
        }

        public static void SetSelf(int jsEnvIdx, IntPtr self, object obj)
        {
            JsEnv.jsEnvs[jsEnvIdx].objectPool.ReplaceValueType(self.ToInt32(), obj);
        }

        private static bool HasValidContraint(Type type, List<Type> validTypes)
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
                        !parameterConstraint.IsClass() ||
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

        public static bool IsNotGenericOrValidGeneric(MethodInfo method)
        {
            // 不包含泛型参数，肯定支持
            if (!method.ContainsGenericParameters)
                return true;

            List<Type> validGenericParameter = new List<Type>();

            foreach (var parameters in method.GetParameters())
            {
                Type parameterType = parameters.ParameterType;

                if (!HasValidContraint(parameterType, validGenericParameter)) { return false; }
            }

            return validGenericParameter.Count > 0 && (
                // 返回值也需要判断，必须是非泛型，或者是可用泛型参数里正好也包括返回类型
                !method.ReturnType.IsGenericParameter ||
                validGenericParameter.Contains(method.ReturnType)
            );
        }

        public static bool IsSupportedMethod(MethodInfo method)
        {
#if !UNITY_EDITOR && ENABLE_IL2CPP && !PUERTS_REFLECT_ALL_EXTENSION
            if (method.IsGenericMethodDefinition) return false;
#endif
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
                        if (!parameterConstraint.IsClass() || (parameterConstraint == typeof(ValueType)))
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

        public static MethodInfo[] GetMethodAndOverrideMethodByName(Type type, string name)
        {
            MethodInfo[] allMethods = type.GetMember(name).Select(m => (MethodInfo)m).ToArray();

            Dictionary<string, IEnumerable<Type[]>> errorMethods = type.GetMethods()
                .Where(m => m.DeclaringType != type && IsObsoleteError(m))
                .GroupBy(m => m.Name)
                .ToDictionary(i => i.Key, i => i.Cast<MethodInfo>().Select(m => m.GetParameters().Select(o => o.ParameterType).ToArray()));
            IEnumerable<Type[]> matchTypes;

            Type objType = typeof(Object);
            while (type.BaseType != null && type.BaseType != objType)
            {
                type = type.BaseType;
                MethodInfo[] methods = type.GetMember(name)
                    .Select(m => (MethodInfo)m)
                    .Where(m => !IsObsoleteError(m) && !IsVirtualMethod(m))
                    .Where(m => !errorMethods.TryGetValue(m.Name, out matchTypes) || !IsMatchParameters(matchTypes, m.GetParameters().Select(o => o.ParameterType).ToArray()))  //filter override method
                    .ToArray();
                if (methods.Length > 0)
                {
                    allMethods = allMethods.Concat(methods).ToArray();
                }
            }

            return allMethods;
        }

        public static MethodInfo[] GetMethodAndOverrideMethod(Type type, BindingFlags flag)
        {
            MethodInfo[] allMethods = type.GetMethods(flag);
            string[] methodNames = allMethods.Select(m => m.Name).ToArray();

            Dictionary<string, IEnumerable<Type[]>> errorMethods = type.GetMethods()
                .Where(m => m.DeclaringType != type && IsObsoleteError(m))
                .GroupBy(m => m.Name)
                .ToDictionary(i => i.Key, i => i.Cast<MethodInfo>().Select(m => m.GetParameters().Select(o => o.ParameterType).ToArray()));
            IEnumerable<Type[]> matchTypes;

            Type objType = typeof(Object);
            while (type.BaseType != null && type.BaseType != objType)
            {
                type = type.BaseType;
                MethodInfo[] methods = type.GetMethods(flag)
                    .Where(m => Array.IndexOf<string>(methodNames, m.Name) != -1)
                    .Where(m => !IsObsoleteError(m) && !IsVirtualMethod(m))
                    .Where(m => !m.IsSpecialName || !m.Name.StartsWith("get_") && !m.Name.StartsWith("set_"))   //filter property
                    .Where(m => !errorMethods.TryGetValue(m.Name, out matchTypes) || !IsMatchParameters(matchTypes, m.GetParameters().Select(o => o.ParameterType).ToArray()))  //filter override method
                    .ToArray();
                if (methods.Length > 0)
                {
                    allMethods = allMethods.Concat(methods).ToArray();
                }
            }

            return allMethods;
        }
        private static bool IsVirtualMethod(MethodInfo memberInfo)
        {
            return memberInfo.IsAbstract || (memberInfo.Attributes & MethodAttributes.NewSlot) == MethodAttributes.NewSlot;
        }
        private static bool IsObsoleteError(MemberInfo memberInfo)
        {
            var obsolete = memberInfo.GetCustomAttributes(typeof(ObsoleteAttribute), true).FirstOrDefault() as ObsoleteAttribute;
            return obsolete != null && obsolete.IsError;
        }
        private static bool IsMatchParameters(IEnumerable<Type[]> typeList, Type[] pTypes)
        {
            foreach (var types in typeList)
            {
                if (types.Length != pTypes.Length)
                    continue;

                bool exclude = true;
                for (int i = 0; i < pTypes.Length && exclude; i++)
                {
                    if (pTypes[i] != types[i])
                        exclude = false;
                }
                if (exclude)
                    return true;
            }
            return false;
        }

        public static IEnumerable<MethodInfo> GetExtensionMethodsOf(Type type_to_be_extend)
        {
            if (Utils_Internal.extensionMethodMap == null)
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

                    if (!type.IsAbstract() || !type.IsSealed()) continue;

                    var fields = type.GetFields(BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.DeclaredOnly);
                    for (int i = 0; i < fields.Length; i++)
                    {
                        var field = fields[i];
                        if ((typeof(IEnumerable<Type>)).IsAssignableFrom(field.FieldType))
                        {
                            var types = field.GetValue(null) as IEnumerable<Type>;
                            if (types != null)
                            {
                                type_def_extention_method.AddRange(types.Where(t => t != null && t.IsDefined(typeof(ExtensionAttribute), false)));
                            }
                        }
                    }

                    var props = type.GetProperties(BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.DeclaredOnly);
                    for (int i = 0; i < props.Length; i++)
                    {
                        var prop = props[i];
                        if ((typeof(IEnumerable<Type>)).IsAssignableFrom(prop.PropertyType))
                        {
                            var types = prop.GetValue(null, null) as IEnumerable<Type>;
                            if (types != null)
                            {
                                type_def_extention_method.AddRange(types.Where(t => t != null && t.IsDefined(typeof(ExtensionAttribute), false)));
                            }
                        }
                    }
                }
                enumerator.Dispose();

                Utils_Internal.extensionMethodMap = (from type in type_def_extention_method.Distinct()
#if UNITY_EDITOR
                                      where !type.Assembly.Location.Contains("Editor")
#endif
                                                     from method in type.GetMethods(BindingFlags.Static | BindingFlags.Public)
                                                     where method.IsDefined(typeof(ExtensionAttribute), false) && IsSupportedMethod(method)
                                                     group method by GetExtendedType(method)).ToDictionary(g => g.Key, g => g as IEnumerable<MethodInfo>);
            }
            IEnumerable<MethodInfo> ret = null;
            Utils_Internal.extensionMethodMap.TryGetValue(type_to_be_extend, out ret);
            return ret;
        }

        private static Type GetExtendedType(MethodInfo method)
        {
            var type = method.GetParameters()[0].ParameterType;
            if (!type.IsGenericParameter)
                return type;
            var parameterConstraints = type.GetGenericParameterConstraints();
            if (parameterConstraints.Length == 0)
                throw new InvalidOperationException();

            var firstParameterConstraint = parameterConstraints[0];
            if (!firstParameterConstraint.IsClass())
                throw new InvalidOperationException();
            return firstParameterConstraint;
        }

#if (UNITY_WSA && !ENABLE_IL2CPP) && !UNITY_EDITOR
        public static List<Assembly> _assemblies;
        public static List<Assembly> GetAssemblies()
        {
            if (_assemblies == null)
            {
                System.Threading.Tasks.Task t = new System.Threading.Tasks.Task(() =>
                {
                    _assemblies = GetAssemblyList().Result;
                });
                t.Start();
                t.Wait();
            }
            return _assemblies;
            
        }
        public static async System.Threading.Tasks.Task<List<Assembly>> GetAssemblyList()
        {
            List<Assembly> assemblies = new List<Assembly>();
            //return assemblies;
            var files = await Windows.ApplicationModel.Package.Current.InstalledLocation.GetFilesAsync();
            if (files == null)
                return assemblies;

            foreach (var file in files.Where(file => file.FileType == ".dll" || file.FileType == ".exe"))
            {
                try
                {
                    assemblies.Add(Assembly.Load(new AssemblyName(file.DisplayName)));
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine(ex.Message);
                }

            }
            return assemblies;
        }
        public static IEnumerable<Type> GetAllTypes(bool exclude_generic_definition = true)
        {
            var assemblies = GetAssemblies();
            return from assembly in assemblies
                   where !(assembly.IsDynamic)
                   from type in assembly.GetTypes()
                   where exclude_generic_definition ? !type.GetTypeInfo().IsGenericTypeDefinition : true
                   select type;
        }
#else
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
                            .Where(type => exclude_generic_definition ? !type.IsGenericTypeDefinition() : true));
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
#endif
    }
    internal static class Utils_Internal
    {
        internal static volatile Dictionary<Type, IEnumerable<MethodInfo>> extensionMethodMap = null;
    }
}
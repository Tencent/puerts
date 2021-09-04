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
        private static volatile Dictionary<Type, IEnumerable<MethodInfo>> extensionMethodMap = null;

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

        public static bool IsSupportedMethod(MethodInfo method)
        {
            if (!method.ContainsGenericParameters)
                return true;
            var methodParameters = method.GetParameters();
            var returnType = method.ReturnType;
            var hasValidGenericParameter = false;
            var returnTypeValid = !returnType.IsGenericParameter;
            for (var i = 0; i < methodParameters.Length; i++)
            {
                var parameterType = methodParameters[i].ParameterType;
                if (parameterType.IsGenericParameter)
                {
                    if (parameterType.BaseType != null && parameterType.BaseType.IsValueType) return false;
                    var parameterConstraints = parameterType.GetGenericParameterConstraints();
                    if (parameterConstraints.Length == 0) return false;
                    foreach (var parameterConstraint in parameterConstraints)
                    {
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
        
        public static IEnumerable<MethodInfo> GetExtensionMethodsOf(Type type_to_be_extend)
        {
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
                                type_def_extention_method.AddRange(types.Where(t => t.IsDefined(typeof(ExtensionAttribute), false)));
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
                                type_def_extention_method.AddRange(types.Where(t => t.IsDefined(typeof(ExtensionAttribute), false)));
                            }
                        }
                    }
                }
                enumerator.Dispose();

                extensionMethodMap = (from type in type_def_extention_method.Distinct()
#if UNITY_EDITOR
                                      where !type.Assembly.Location.Contains("Editor")
#endif
                                      from method in type.GetMethods(BindingFlags.Static | BindingFlags.Public)
                                      where method.IsDefined(typeof(ExtensionAttribute), false) && IsSupportedMethod(method)
                                      group method by GetExtendedType(method)).ToDictionary(g => g.Key, g => g as IEnumerable<MethodInfo>);
            }
            IEnumerable<MethodInfo> ret = null;
            extensionMethodMap.TryGetValue(type_to_be_extend, out ret);
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
}
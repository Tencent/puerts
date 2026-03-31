/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if UNITY_EDITOR || UNITY_STANDALONE || UNITY_ANDROID || PUERTS_GENERAL || PUERTS_NUGET

using System;
using System.Collections.Generic;
using System.Reflection;

namespace Puerts
{
    public class PythonLoader : ILoader
    {
        public static NamespaceManager NamespaceManager { get; } = new NamespaceManager();

        public bool FileExists(string filepath)
        {
            throw new NotImplementedException();
        }

        public string ReadFile(string filepath, out string debugpath)
        {
            throw new NotImplementedException();
        }
    }

    public class NamespaceManager
    {
        private readonly HashSet<string> namespaces = new HashSet<string>(StringComparer.Ordinal);

        private readonly Dictionary<string, TypeParameterState> typePrefixStates = new Dictionary<string, TypeParameterState>(StringComparer.Ordinal);

        private readonly object @lock = new object();

        public NamespaceManager()
        {
            AppDomain.CurrentDomain.AssemblyLoad += OnAssemblyLoad;
            LoadNamespacesFromLoadedAssemblies();
        }

        private void LoadNamespacesFromLoadedAssemblies()
        {
            lock (@lock)
            {
                var assemblies = AppDomain.CurrentDomain.GetAssemblies();
                foreach (var assembly in assemblies)
                {
                    AddNamespacesFromAssembly(assembly);
                }
            }
        }

        private void OnAssemblyLoad(object sender, AssemblyLoadEventArgs args)
        {
            lock (@lock)
            {
                AddNamespacesFromAssembly(args.LoadedAssembly);
            }
        }

        private void AddNamespacesFromAssembly(Assembly assembly)
        {
            try
            {
                var types = assembly.GetTypes();
                foreach (var type in types)
                {
                    AddType(type);
                }
            }
            catch (ReflectionTypeLoadException ex)
            {
                foreach (var type in ex.Types)
                {
                    if (type != null)
                    {
                        AddType(type);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error on loading assembly {assembly.FullName}: {ex.Message}");
            }
        }

        private void AddType(Type type)
        {
            if (!string.IsNullOrEmpty(type.Namespace))
            {
                namespaces.Add(type.Namespace);
            }

            CacheTypePrefix(type);
        }

        private void CacheTypePrefix(Type type)
        {
            var fullName = type.FullName;
            if (string.IsNullOrEmpty(fullName))
            {
                return;
            }

            var tickIndex = fullName.IndexOf('`');
            bool isGeneric = tickIndex >= 0;
            var prefix = isGeneric ? fullName.Substring(0, tickIndex) : fullName;
            if (typePrefixStates.TryGetValue(prefix, out var existingState))
            {
                typePrefixStates[prefix] = MergeTypeParameterState(existingState, isGeneric);
            }
            else
            {
                typePrefixStates[prefix] = isGeneric
                    ? TypeParameterState.HasOneMoreParameter
                    : TypeParameterState.NoParameter;
            }
        }

        private static TypeParameterState MergeTypeParameterState(TypeParameterState existingState, bool isGeneric)
        {
            switch (existingState)
            {
                case TypeParameterState.NoType:
                    return isGeneric ? TypeParameterState.HasOneMoreParameter : TypeParameterState.NoParameter;
                case TypeParameterState.NoParameter:
                    return isGeneric ? TypeParameterState.HasZeroAndMoreParameter : TypeParameterState.NoParameter;
                case TypeParameterState.HasOneMoreParameter:
                    return isGeneric
                        ? TypeParameterState.HasOneMoreParameter
                        : TypeParameterState.HasZeroAndMoreParameter;
                case TypeParameterState.HasZeroAndMoreParameter:
                    return TypeParameterState.HasZeroAndMoreParameter;
                default:
                    return existingState;
            }
        }

        public bool IsValidNamespace(string namespaceName)
        {
            lock (@lock)
            {
                return namespaces.Contains(namespaceName);
            }
        }
        
        //  2 => T<...>
        //  1 => T, T<...>
        //  0 => T
        // -1 => Not exist
        public int GetTypeParameterStateByPrefix(string typeNamePrefix)
        {
            if (string.IsNullOrEmpty(typeNamePrefix))
            {
                return (int)TypeParameterState.NoType;
            }

            lock (@lock)
            {
                return typePrefixStates.TryGetValue(typeNamePrefix, out var state)
                    ? (int)state
                    : (int)TypeParameterState.NoType;
            }
        }

        private enum TypeParameterState
        {
            NoType = -1,
            NoParameter = 0,
            HasZeroAndMoreParameter = 1,
            HasOneMoreParameter = 2
        }
    }


    public class PythonDefaultLoader : PythonLoader
    {
    }
}

#endif
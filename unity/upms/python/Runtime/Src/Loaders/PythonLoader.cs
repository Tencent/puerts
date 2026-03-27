/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if UNITY_EDITOR || UNITY_STANDALONE || UNITY_ANDROID || PUERTS_GENERAL || PUERTS_NUGET

using System;
using System.Collections.Generic;
using System.Linq;
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
        private readonly HashSet<string> _namespaces = new HashSet<string>(StringComparer.Ordinal);
        private readonly HashSet<string> _genericTypePrefixes = new HashSet<string>(StringComparer.Ordinal);
        private static readonly object _lock = new object();

        public NamespaceManager()
        {
            AppDomain.CurrentDomain.AssemblyLoad += OnAssemblyLoad;
            LoadNamespacesFromLoadedAssemblies();
        }

        private void LoadNamespacesFromLoadedAssemblies()
        {
            lock (_lock)
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
            lock (_lock)
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
                _namespaces.Add(type.Namespace);
            }

            CacheGenericTypePrefix(type);
        }

        private void CacheGenericTypePrefix(Type type)
        {
            if (!type.IsGenericTypeDefinition)
                return;

            var names = new Stack<string>();
            var current = type;

            while (current != null)
            {
                var name = current.Name;
                var tickIndex = name.IndexOf('`');
                if (tickIndex >= 0)
                {
                    name = name[..tickIndex];
                }

                names.Push(name);
                current = current.DeclaringType;
            }

            var joinedByPlus = string.Join("+", names);
            var joinedByDot = string.Join(".", names);

            if (!string.IsNullOrEmpty(type.Namespace))
            {
                _genericTypePrefixes.Add($"{type.Namespace}.{joinedByPlus}");
                _genericTypePrefixes.Add($"{type.Namespace}.{joinedByDot}");
            }
            else
            {
                _genericTypePrefixes.Add(joinedByPlus);
                _genericTypePrefixes.Add(joinedByDot);
            }
        }

        public IEnumerable<string> GetAllNamespaces()
        {
            lock (_lock)
            {
                return _namespaces.OrderBy(ns => ns).ToList();
            }
        }

        public bool IsValidNamespace(string namespaceName)
        {
            lock (_lock)
            {
                return _namespaces.Contains(namespaceName);
            }
        }

        // typeName: System.Collections.Generic.List
        // exist types: System.Collections.Generic.List`1 => valid
        public bool IsValidGenericTypePrefix(string typeName)
        {
            if (string.IsNullOrWhiteSpace(typeName))
                return false;

            var normalized = typeName.Trim();

            var tickIndex = normalized.IndexOf('`');
            if (tickIndex >= 0)
            {
                normalized = normalized[..tickIndex];
            }

            var genericStartIndex = normalized.IndexOf('<');
            if (genericStartIndex >= 0)
            {
                normalized = normalized[..genericStartIndex];
            }

            lock (_lock)
            {
                return _genericTypePrefixes.Contains(normalized);
            }
        }
    }


    public class PythonDefaultLoader : PythonLoader
    {
    }
}

#endif
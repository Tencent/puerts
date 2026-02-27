/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if UNITY_EDITOR || UNITY_STANDALONE

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
        private readonly HashSet<string> _namespaces = new HashSet<string>();
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
                    if (!string.IsNullOrEmpty(type.Namespace))
                    {
                        _namespaces.Add(type.Namespace);
                    }
                }
            }
            catch (ReflectionTypeLoadException ex)
            {
                foreach (var type in ex.Types)
                {
                    if (type != null && !string.IsNullOrEmpty(type.Namespace))
                    {
                        _namespaces.Add(type.Namespace);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error on loading assembly {assembly.FullName}: {ex.Message}");
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
    }

    public class PythonDefaultLoader : PythonLoader
    {
    }
}

#endif

/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if UNITY_2020_1_OR_NEWER
#if !PUERTS_GENERAL
using System;
using System.IO;
using System.Text;
using System.Linq;
using System.Collections.Generic;
using System.Reflection;
using UnityEngine;
using Puerts.TypeMapping;

namespace Puerts.Editor.Generator
{
    /// <summary>
    /// Static C# wrapper code generation using the Expression Tree → C# source code translation pipeline.
    /// </summary>
    public static class StaticWrapperMenu
    {
        /// <summary>
        /// Core generation logic — can be called from both Unity Editor and command line.
        /// </summary>
        public static void GenerateStaticWrappersTo(string outputDir)
        {
            // Collect binding types from [Configure] classes
            var configureByTags = Puerts.Configure.GetConfigureByTags(new List<string>
            {
                typeof(BindingAttribute).ToString()
            });

            var bindingTypes = configureByTags[typeof(BindingAttribute).ToString()]
                .Select(kv => kv.Key)
                .Where(o => o is Type)
                .Cast<Type>()
                .Distinct()
                .ToList();

            if (bindingTypes.Count == 0)
            {
                Debug.LogWarning("[PuerTS] No types found with [Binding] attribute. Nothing to generate.");
                return;
            }

            // Collect filters — handle both 1-param (MemberInfo) and 2-param (FilterAction, MemberInfo) signatures
            var filters = Puerts.Configure.GetFilters();
            Func<MemberInfo, bool> filterFunc = (memberInfo) =>
            {
                foreach (var filter in filters)
                {
                    try
                    {
                        if (filter.GetParameters().Length == 2)
                        {
                            // 2-param filter: (FilterAction, MemberInfo) or (FilterAction, Type)
                            var paramType = filter.GetParameters()[1].ParameterType;
                            if (paramType == typeof(MemberInfo))
                            {
                                if (filter.ReturnType == typeof(bool))
                                {
                                    if ((bool)filter.Invoke(null, new object[] { FilterAction.BindingMode, memberInfo }))
                                        return true;
                                }
                                else if (filter.ReturnType == typeof(BindingMode))
                                {
                                    var mode = (BindingMode)filter.Invoke(null, new object[] { FilterAction.BindingMode, memberInfo });
                                    if (mode == BindingMode.DontBinding)
                                        return true;
                                }
                            }
                            // Skip (FilterAction, Type) filters — they are for type-level filtering, not member-level
                        }
                        else if (filter.GetParameters().Length == 1)
                        {
                            // 1-param filter: (MemberInfo)
                            if (filter.ReturnType == typeof(bool))
                            {
                                if ((bool)filter.Invoke(null, new object[] { memberInfo }))
                                    return true;
                            }
                            else if (filter.ReturnType == typeof(BindingMode))
                            {
                                var mode = (BindingMode)filter.Invoke(null, new object[] { memberInfo });
                                if (mode == BindingMode.DontBinding)
                                    return true;
                            }
                        }
                    }
                    catch (Exception)
                    {
                        // Skip filters that fail to invoke
                    }
                }
                return false;
            };

            // Load extension methods
            Puerts.ExtensionMethodInfo.LoadExtensionMethodInfo();

            // Generate wrappers for each type
            var wrapperResults = new List<StaticWrapperGenerator.TypeWrapperResult>();
            int successCount = 0;
            int failCount = 0;

            foreach (var type in bindingTypes)
            {
                try
                {
                    var result = StaticWrapperGenerator.GenerateWrapperForType(type, filterFunc);
                    wrapperResults.Add(result);

                    // Write wrapper file
                    string fileName = result.ClassName + ".cs";
                    string filePath = Path.Combine(outputDir, fileName);
                    File.WriteAllText(filePath, result.SourceCode, Encoding.UTF8);
                    successCount++;

                    Debug.Log($"[PuerTS] Generated wrapper: {fileName}");
                }
                catch (Exception e)
                {
                    failCount++;
                    Debug.LogWarning($"[PuerTS] Failed to generate wrapper for {type.FullName}: {e.Message}");
                }
            }

            // Generate RegisterInfo file
            string registerInfoCode = StaticWrapperGenerator.GenerateRegisterInfo(wrapperResults);
            string registerInfoPath = Path.Combine(outputDir, "RegisterInfo_Gen.cs");
            File.WriteAllText(registerInfoPath, registerInfoCode, Encoding.UTF8);

            // Generate ExtensionMethodInfos
            CSharpFileExporter.GenExtensionMethodInfos(outputDir);

            Debug.Log($"[PuerTS] Static wrapper generation complete: {successCount} succeeded, {failCount} failed, {bindingTypes.Count} total types.");
        }
    }
}
#endif
#endif

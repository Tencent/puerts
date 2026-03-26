/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file
* 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if UNITY_2020_1_OR_NEWER && !PUERTS_GENERAL
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Reflection;
using System.Runtime.CompilerServices;
using Puerts.Editor.Generator;
using Puerts.TypeMapping;
using Mono.Reflection;
using UnityEditor;
using UnityEngine;

namespace Puerts.Editor.Generator
{
    /// <summary>
    /// Pure C# file exporter for IL2CPP.
    /// Reuses data collection logic from FileExporter but generates C++ code via CSharpCodeGen
    /// instead of JS templates, eliminating the V8 dependency.
    /// </summary>
    public static class CSharpFileExporter
    {
        /// <summary>
        /// Generate all IL2CPP C++ files using pure C# (no JS/V8 dependency).
        /// Equivalent to FileExporter.GenCPPWrap + CopyXIl2cppCPlugin + GenMarcoHeader
        /// </summary>
        public static void GenAll(string saveTo, bool onlyConfigure = false, bool noWrapper = false)
        {
            GenCPPWrap(saveTo, onlyConfigure, noWrapper);
            CopyStaticResources(saveTo);
            GenMacroHeader(saveTo);
        }

        /// <summary>
        /// Generate the C++ wrapper/bridge/field wrapper/value type files via pure C#.
        /// This mirrors FileExporter.GenCPPWrap but replaces JS template rendering with CSharpCodeGen.
        /// </summary>
        public static void GenCPPWrap(string saveTo, bool onlyConfigure = false, bool noWrapper = false)
        {
            Utils.SetFilters(Puerts.Configure.GetFilters());

            var types = from assembly in AppDomain.CurrentDomain.GetAssemblies()
                        where !(assembly.ManifestModule is System.Reflection.Emit.ModuleBuilder)
                        from type in assembly.GetTypes()
                        where type.IsPublic && !Utils.IsBigValueType(type) && !type.IsGenericTypeDefinition
                        select type;

            const BindingFlags flag = BindingFlags.DeclaredOnly | BindingFlags.Instance | BindingFlags.Static | BindingFlags.Public;
            const BindingFlags flagForPuer = BindingFlags.DeclaredOnly | BindingFlags.Instance | BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic;

            var typeExcludeDelegate = types.Where(t => !typeof(MulticastDelegate).IsAssignableFrom(t));

            var ctorToWrapper = typeExcludeDelegate
                .SelectMany(t => t.GetConstructors(t.FullName.Contains("Puer") ? flagForPuer : flag))
                .Where(m => Utils.getBindingMode(m) != Puerts.BindingMode.DontBinding);

            var methodToWrap = typeExcludeDelegate
                .SelectMany(t => t.GetMethods(t.FullName.Contains("Puer") ? flagForPuer : flag))
                .Where(m => Utils.getBindingMode(m) != Puerts.BindingMode.DontBinding);

            var fieldToWrapper = typeExcludeDelegate
                .SelectMany(t => t.GetFields(t.FullName.Contains("Puer") ? flagForPuer : flag))
                .Where(m => Utils.getBindingMode(m) != Puerts.BindingMode.DontBinding);

            var wrapperUsedTypes = types
                .Concat(ctorToWrapper.SelectMany(c => c.GetParameters()).Select(pi => GetUnrefParameterType(pi)))
                .Concat(methodToWrap.SelectMany(m => m.GetParameters()).Select(pi => GetUnrefParameterType(pi)))
                .Concat(methodToWrap.Select(m => m.ReturnType))
                .Concat(fieldToWrapper.Select(f => f.FieldType))
                .Distinct();

            Type[] PuerDelegates = {
                typeof(Func<string, Puerts.ScriptObject>),
                typeof(Func<Puerts.ScriptObject, string, string>),
                typeof(Func<Puerts.ScriptObject, string, int>),
                typeof(Func<Puerts.ScriptObject, string, uint>),
                typeof(Func<Puerts.ScriptObject, string, long>),
                typeof(Func<Puerts.ScriptObject, string, ulong>),
                typeof(Func<Puerts.ScriptObject, string, short>),
                typeof(Func<Puerts.ScriptObject, string, ushort>),
                typeof(Func<Puerts.ScriptObject, string, float>),
                typeof(Func<Puerts.ScriptObject, string, double>),
                typeof(Func<Puerts.ScriptObject, string, Puerts.ScriptObject>)
            };

            HashSet<Type> typeInGenericArgument = new HashSet<Type>();
            HashSet<MethodBase> processed = new HashSet<MethodBase>();
            foreach (var method in methodToWrap)
            {
                GenericArgumentInInstructions(method, typeInGenericArgument, processed, mb =>
                {
                    try
                    {
                        if (mb.GetMethodBody() == null || mb.IsGenericMethodDefinition || mb.IsAbstract) return new MethodBase[] { };
                        return mb.GetInstructions()
                            .Select(i => i.Operand)
                            .Where(o => o is MethodBase)
                            .Cast<MethodBase>();
                    }
                    catch (Exception e)
                    {
                        UnityEngine.Debug.LogWarning(string.Format("get instructions of {0} ({2}:{3}) throw {1}", mb, e.Message, mb.DeclaringType == null ? "" : mb.DeclaringType.Assembly.Location, mb.DeclaringType));
                        return new MethodBase[] { };
                    }
                });
            }

            HashSet<Type> allTypes = new HashSet<Type>();
            foreach (var type in wrapperUsedTypes.Concat(PuerDelegates).Concat(typeInGenericArgument))
            {
                IterateAllType(type, allTypes);
            }

            var delegateToBridge = allTypes.Distinct().Where(t => typeof(MulticastDelegate).IsAssignableFrom(t));
            var delegateInvokes = delegateToBridge.Select(t => t.GetMethod("Invoke")).Where(m => m != null).ToList();
            var delegateUsedTypes = delegateInvokes.SelectMany(m => m.GetParameters()).Select(pi => GetUnrefParameterType(pi))
                .Concat(delegateInvokes.Select(m => m.ReturnType));

            var valueTypeInfos = new List<CSharpCodeGen.ValueTypeInfo>();
            foreach (var type in wrapperUsedTypes.Concat(delegateUsedTypes))
            {
                IterateAllValueType(type, valueTypeInfos);
            }
            valueTypeInfos = valueTypeInfos.GroupBy(s => s.Signature).Select(s => s.FirstOrDefault()).ToList();

            var bridgeInfos = delegateInvokes
                .Select(m => new CSharpCodeGen.SignatureInfo
                {
                    Signature = Puerts.TypeUtils.GetMethodSignature(m, true),
                    CsName = m.ToString() + " declare in " + (m.DeclaringType != null ? m.DeclaringType.ToString() : "unknow class"),
                    ReturnSignature = Puerts.TypeUtils.GetTypeSignature(m.ReturnType),
                    ThisSignature = null,
                    ParameterSignatures = m.GetParameters().Select(p => Puerts.TypeUtils.GetParameterSignature(p, true)).ToList()
                })
                .GroupBy(s => s.Signature)
                .Select(s => s.FirstOrDefault())
                .ToList();

            var genWrapperCtor = ctorToWrapper;
            var genWrapperMethod = methodToWrap;
            var genWrapperField = fieldToWrapper;

            if (noWrapper)
            {
                genWrapperCtor = new ConstructorInfo[] { };
                genWrapperMethod = new MethodInfo[] { };
                genWrapperField = new FieldInfo[] { };

                valueTypeInfos = new List<CSharpCodeGen.ValueTypeInfo>();
                foreach (var type in delegateUsedTypes)
                {
                    IterateAllValueType(type, valueTypeInfos);
                }
                valueTypeInfos = valueTypeInfos.GroupBy(s => s.Signature).Select(s => s.FirstOrDefault()).ToList();
            }

            Action<string, string, List<string>> addBridgeInfo = (returnSignature, csName, parameterSignatureList) =>
            {
                bridgeInfos.Add(new CSharpCodeGen.SignatureInfo()
                {
                    Signature = returnSignature + string.Join("", parameterSignatureList),
                    CsName = csName,
                    ReturnSignature = returnSignature,
                    ThisSignature = null,
                    ParameterSignatures = parameterSignatureList.ToList()
                });
            };

            if (onlyConfigure)
            {
                var configureTypes = new List<Type>();
                var configure = Puerts.Configure.GetConfigureByTags(new List<string>() { "Puerts.BindingAttribute" });

                configureTypes = configure["Puerts.BindingAttribute"].Select(kv => kv.Key)
                    .Where(o => o is Type)
                    .Cast<Type>()
                    .Where(t => !t.IsGenericTypeDefinition && !t.Name.StartsWith("<"))
                    .Distinct()
                    .ToList();

                if (!noWrapper)
                {
                    var configureTypesExcludeDelegate = configureTypes.Where(t => !typeof(MulticastDelegate).IsAssignableFrom(t));

                    genWrapperCtor = configureTypesExcludeDelegate
                        .SelectMany(t => t.GetConstructors(flag))
                        .Where(m => !Utils.IsNotSupportedMember(m, true))
                        .Where(m => Utils.getBindingMode(m) != Puerts.BindingMode.DontBinding);

                    genWrapperMethod = configureTypesExcludeDelegate
                        .SelectMany(t => t.GetMethods(flag))
                        .Where(m => !Utils.IsNotSupportedMember(m, true))
                        .Where(m => Utils.getBindingMode(m) != Puerts.BindingMode.DontBinding);

                    genWrapperField = configureTypesExcludeDelegate
                        .SelectMany(t => t.GetFields(flag))
                        .Where(m => !Utils.IsNotSupportedMember(m, true))
                        .Where(m => Utils.getBindingMode(m) != Puerts.BindingMode.DontBinding);
                }

                delegateInvokes = configureTypes.Where(t => typeof(MulticastDelegate).IsAssignableFrom(t))
                    .Select(t => t.GetMethod("Invoke"))
                    .Where(m => m != null)
                    .ToList();

                var configureUsedTypes = configureTypes
                    .Concat(genWrapperCtor.SelectMany(c => c.GetParameters()).Select(pi => GetUnrefParameterType(pi)))
                    .Concat(genWrapperMethod.SelectMany(m => m.GetParameters()).Select(pi => GetUnrefParameterType(pi)))
                    .Concat(genWrapperMethod.Select(m => m.ReturnType))
                    .Concat(genWrapperField.Select(f => f.FieldType))
                    .Distinct();

                valueTypeInfos = new List<CSharpCodeGen.ValueTypeInfo>();
                foreach (var type in configureUsedTypes)
                {
                    IterateAllValueType(type, valueTypeInfos);
                }

                var allTypeMayContainUsing = (from assembly in AppDomain.CurrentDomain.GetAssemblies()
                                             where !(assembly.ManifestModule is System.Reflection.Emit.ModuleBuilder)
                                             from type in assembly.GetTypes()
                                             where !type.IsGenericTypeDefinition
                                             select type).ToList();
#pragma warning disable CS0618
                var usingDecls = allTypeMayContainUsing.SelectMany(t =>
                    {
                        var methodFlag = BindingFlags.DeclaredOnly | BindingFlags.Instance | BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic;
                        return t.GetMethods(methodFlag).Cast<MethodBase>().Concat(t.GetConstructors(methodFlag));
                    })
                    .Where(m =>
                    {
                        try { return m.GetMethodBody() != null && !m.IsGenericMethodDefinition && !m.IsAbstract; }
                        catch { return false; }
                    }).SelectMany(
                    mb =>
                    {
                        try { return mb.GetInstructions(); }
                        catch { }
return new List<Instruction>();
                    }).Select(i => i.Operand).Where(o => o is MethodInfo)
                    .Cast<MethodInfo>().Where(mb => mb.IsGenericMethod && (mb.DeclaringType == typeof(Puerts.JsEnv) || mb.DeclaringType == typeof(Puerts.LegacyBridageConfig)) && (mb.Name == "UsingAction" || mb.Name == "UsingFunc"));
#pragma warning restore CS0618

                bridgeInfos = new List<CSharpCodeGen.SignatureInfo>();
                foreach (var decl in usingDecls)
                {
                    string returnSignature = null;
                    List<string> parameterSignatureList = new List<string>();
                    var genericArguments = decl.GetGenericArguments();
                    if (decl.Name == "UsingAction")
                    {
                        returnSignature = "v";
                        foreach (var ga in genericArguments)
                        {
                            parameterSignatureList.Add(TypeUtils.GetTypeSignature(ga));
                        }
                    }
                    else
                    {
                        returnSignature = TypeUtils.GetTypeSignature(genericArguments.Last());
                        foreach (var ga in genericArguments.Take(genericArguments.Length - 1))
                        {
                            parameterSignatureList.Add(TypeUtils.GetTypeSignature(ga));
                        }
                    }
                    foreach (var ga in genericArguments)
                    {
                        IterateAllValueType(ga, valueTypeInfos);
                    }
                    addBridgeInfo(returnSignature, decl.ToString(), parameterSignatureList);
                }
                foreach (var d in delegateInvokes)
                {
                    addBridgeInfo(TypeUtils.GetTypeSignature(d.ReturnType), d.DeclaringType.ToString(), d.GetParameters().Select(p => TypeUtils.GetTypeSignature(p.ParameterType)).ToList());
                }

                valueTypeInfos = valueTypeInfos.GroupBy(s => s.Signature).Select(s => s.FirstOrDefault()).ToList();

                Utils.SetFilters(null);
            }

            // Add shared bridge signatures (Action/Func variants)
            var ps = new List<string>();
            var vs = TypeUtils.GetTypeSignature(typeof(void));
            var os = TypeUtils.GetTypeSignature(typeof(Console));
            for (int i = 0; i < 10; ++i)
            {
                addBridgeInfo(vs, "Action_Shared_" + ps.Count, ps);
                addBridgeInfo(os, "Func_Shared_" + ps.Count, ps);
                ps.Add(os);
            }

            bridgeInfos = bridgeInfos
                .GroupBy(s => s.Signature)
                .Select(s => s.FirstOrDefault())
                .ToList();
            bridgeInfos.Sort((x, y) => string.CompareOrdinal(x.Signature, y.Signature));

            var wrapperInfos = genWrapperMethod
                .Where(m => !m.IsGenericMethodDefinition && !m.IsAbstract)
                .Select(m =>
                {
                    var isExtensionMethod = m.IsDefined(typeof(ExtensionAttribute));
                    return new CSharpCodeGen.SignatureInfo
                    {
                        Signature = Puerts.TypeUtils.GetMethodSignature(m, false, isExtensionMethod),
                        CsName = m.ToString() + " declare in " + (m.DeclaringType != null ? m.DeclaringType.ToString() : "unknow class"),
                        ReturnSignature = Puerts.TypeUtils.GetTypeSignature(m.ReturnType),
                        ThisSignature = Puerts.TypeUtils.GetThisSignature(m, isExtensionMethod),
                        ParameterSignatures = m.GetParameters().Skip(isExtensionMethod ? 1 : 0).Select(p => Puerts.TypeUtils.GetParameterSignature(p, false)).ToList()
                    };
                })
                .Concat(
                    genWrapperCtor.Select(m =>
                    {
                        return new CSharpCodeGen.SignatureInfo
                        {
                            Signature = Puerts.TypeUtils.GetMethodSignature(m, false, false),
                            CsName = m.ToString() + " declare in " + (m.DeclaringType != null ? m.DeclaringType.ToString() : "unknow class"),
                            ReturnSignature = "v",
                            ThisSignature = "t",
                            ParameterSignatures = m.GetParameters().Select(p => Puerts.TypeUtils.GetParameterSignature(p, false)).ToList()
                        };
                    })
                )
                .GroupBy(s => s.Signature)
                .Select(s => s.FirstOrDefault())
                .ToList();
            wrapperInfos.Sort((x, y) => string.CompareOrdinal(x.Signature, y.Signature));

            var fieldWrapperInfos = genWrapperField
                .Select(f => new CSharpCodeGen.SignatureInfo
                {
                    Signature = (f.IsStatic ? "" : "t") + Puerts.TypeUtils.GetTypeSignature(f.FieldType),
                    CsName = f.ToString() + " declare in " + (f.DeclaringType != null ? f.DeclaringType.ToString() : "unknow class"),
                    ReturnSignature = Puerts.TypeUtils.GetTypeSignature(f.FieldType),
                    ThisSignature = (f.IsStatic ? "" : "t"),
                    ParameterSignatures = null
                })
                .GroupBy(s => s.Signature)
                .Select(s => s.FirstOrDefault())
                .ToList();
            fieldWrapperInfos.Sort((x, y) => string.CompareOrdinal(x.Signature, y.Signature));

            // --- Generate all files using pure C# ---

            // PuertsIl2cppWrapper.cpp (declarations + lookup table)
            WriteFile(Path.Combine(saveTo, "PuertsIl2cppWrapper.cpp"), CSharpCodeGen.GenWrapperFile(wrapperInfos));

            // PuertsValueType.h
            WriteFile(Path.Combine(saveTo, "PuertsValueType.h"), CSharpCodeGen.GenValueTypeFile(valueTypeInfos));

            // PuertsIl2cppFieldWrapper.cpp
            WriteFile(Path.Combine(saveTo, "PuertsIl2cppFieldWrapper.cpp"), CSharpCodeGen.GenFieldWrapperFile(fieldWrapperInfos));

            // PuertsIl2cppBridge.cpp
            WriteFile(Path.Combine(saveTo, "PuertsIl2cppBridge.cpp"), CSharpCodeGen.GenBridgeFile(bridgeInfos));

            // Clear previous WrapperDef files
            if (Directory.Exists(saveTo))
            {
                string[] files = Directory.GetFiles(saveTo);
                string pattern = @"^PuertsIl2cppWrapperDef\d+\.cpp(\.meta)?$";
                foreach (string file in files)
                {
                    string fileName = Path.GetFileName(file);
                    if (System.Text.RegularExpressions.Regex.IsMatch(fileName, pattern))
                    {
                        try { File.Delete(file); }
                        catch (Exception ex) { Debug.LogWarning("Error deleting file " + fileName + ": " + ex.Message); }
                    }
                }
            }

            // PuertsIl2cppWrapperDefN.cpp (1000 wrappers per file)
            const int MAX_WRAPPER_PER_FILE = 1000;
            for (int i = 0; i < wrapperInfos.Count; i += MAX_WRAPPER_PER_FILE)
            {
                var saveFileName = "PuertsIl2cppWrapperDef" + (i / MAX_WRAPPER_PER_FILE) + ".cpp";
                var chunk = wrapperInfos.GetRange(i, Math.Min(MAX_WRAPPER_PER_FILE, wrapperInfos.Count - i));
                Debug.Log(saveFileName + " with " + chunk.Count + " wrappers!");
                WriteFile(Path.Combine(saveTo, saveFileName), CSharpCodeGen.GenWrapperDefFile(chunk));
            }
        }

        /// <summary>
        /// Generate ExtensionMethodInfos_Gen.cs using pure C#.
        /// </summary>
        public static void GenExtensionMethodInfos(string outDir)
        {
            var configure = Puerts.Configure.GetConfigureByTags(new List<string>() { "Puerts.BindingAttribute" });

            var genTypes = new HashSet<Type>(configure["Puerts.BindingAttribute"].Select(kv => kv.Key)
                .Where(o => o is Type)
                .Cast<Type>()
                .Where(t => !t.IsGenericTypeDefinition && !t.Name.StartsWith("<"))
                .Distinct()
                .ToList());

            genTypes.Add(typeof(Puerts.ArrayExtension));

            var extendedType2extensionType = (from type in genTypes
#if UNITY_EDITOR
                where !System.IO.Path.GetFileName(type.Assembly.Location).Contains("Editor")
#endif
                from method in type.GetMethods(BindingFlags.Static | BindingFlags.Public)
                    .Select(method => TypeUtils.HandleMaybeGenericMethod(method))
                    .Where(method => method != null)
                where method.IsDefined(typeof(ExtensionAttribute), false)
                group type by GetExtendedTypeOf(method)).ToDictionary(g => g.Key, g => (g as IEnumerable<Type>).Distinct().ToList()).ToList();

            var filePath = outDir + "ExtensionMethodInfos_Gen.cs";
            WriteFile(filePath, CSharpCodeGen.GenExtensionMethodInfos(extendedType2extensionType));
        }

        /// <summary>
        /// Generate link.xml using pure C#.
        /// </summary>
        public static void GenLinkXml(string outDir)
        {
            var configure = Puerts.Configure.GetConfigureByTags(new List<string>() { "Puerts.BindingAttribute" });
            var genTypes = configure["Puerts.BindingAttribute"].Select(kv => kv.Key)
                .Where(o => o is Type)
                .Cast<Type>()
                .Where(t => !t.IsGenericTypeDefinition && !t.Name.StartsWith("<"))
                .Distinct()
                .ToList();

            string linkXMLContent = CSharpCodeGen.GenLinkXml(genTypes);
            var linkXMLPath = outDir + "link.xml";
            WriteFile(linkXMLPath, linkXMLContent);
        }

        /// <summary>
        /// Generate the macro header file using pure C#.
        /// </summary>
        public static void GenMacroHeader(string outDir)
        {
            var defines = new List<string>()
            {
#if UNITY_2021_1_OR_NEWER
                "UNITY_2021_1_OR_NEWER",
#endif
#if UNITY_2022_1_OR_NEWER
                "UNITY_2022_1_OR_NEWER",
#endif
#if UNITY_6000_0_OR_NEWER
                "UNITY_6000_0_OR_NEWER",
#endif
#if !UNITY_IPHONE && !UNITY_WEBGL && !UNITY_SWITCH
                "PUERTS_SHARED",
#endif
#if TUANJIE_1_1_OR_NEWER
                "TUANJIE_1_1_OR_NEWER",
#endif
            };
            WriteFile(outDir + "unityenv_for_puerts.h", CSharpCodeGen.GenMacroHeader(defines));
        }

        /// <summary>
        /// Copy static resource files (pesapi.h, pesapi_webgl.h, pesapi_webgl.cpp, TDataTrans.h, Puerts_il2cpp.cpp).
        /// For TDataTrans.h and Puerts_il2cpp.cpp, we do a simple ${...} substitution for invokePapi calls.
        /// </summary>
        public static void CopyStaticResources(string outDir)
        {
            // Copy pesapi files directly
            Dictionary<string, string> cPluginCode = new Dictionary<string, string>()
            {
                { "pesapi.h", Resources.Load<TextAsset>("puerts/xil2cpp/pesapi.h").text },
                { "pesapi_webgl.h", Resources.Load<TextAsset>("puerts/xil2cpp/pesapi_webgl.h").text },
                { "pesapi_webgl.cpp", Resources.Load<TextAsset>("puerts/xil2cpp/pesapi_webgl.cpp").text }
            };

            foreach (var cPlugin in cPluginCode)
            {
                WriteFile(outDir + cPlugin.Key, cPlugin.Value);
            }

            // For TDataTrans.h and Puerts_il2cpp.cpp, these use JS template strings with ${invokePapi('xxx')}
            // Since USE_STATIC_PAPI is not set, invokePapi always returns "apis->xxx"
            // We perform regex substitution to replace ${invokePapi('xxx')} with apis->xxx
            string dataTransTemplate = Resources.Load<TextAsset>("puerts/xil2cpp/TDataTrans.h").text;
            string dataTransContent = ProcessTemplateSubstitutions(dataTransTemplate);
            WriteFile(outDir + "TDataTrans.h", dataTransContent);

            string puertsIl2cppTemplate = Resources.Load<TextAsset>("puerts/xil2cpp/Puerts_il2cpp.cpp").text;
            string puertsIl2cppContent = ProcessTemplateSubstitutions(puertsIl2cppTemplate);
            WriteFile(outDir + "Puerts_il2cpp.cpp", puertsIl2cppContent);
        }

        /// <summary>
        /// Process JS template string substitutions in resource files.
        /// Replaces ${invokePapi('xxx')} with apis->xxx (since USE_STATIC_PAPI is not set).
        /// Also handles other ${...} expressions that may exist.
        /// </summary>
        private static string ProcessTemplateSubstitutions(string template)
        {
            // Replace ${invokePapi('xxx')} or ${invokePapi("xxx")} with apis->xxx
            string result = System.Text.RegularExpressions.Regex.Replace(
                template,
                @"\$\{invokePapi\(['""](\w+)['""]\)\}",
                "apis->$1"
            );
            return result;
        }

        #region Utility methods (moved from FileExporter)

        public static List<string> GetValueTypeFieldSignatures(Type type)
        {
            List<string> ret = new List<string>();
            if (type.BaseType != null && type.BaseType.IsValueType) ret.Add(Puerts.TypeUtils.GetTypeSignature(type.BaseType));
            foreach (var field in type.GetFields(BindingFlags.DeclaredOnly | BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic))
            {
                ret.Add(Puerts.TypeUtils.GetTypeSignature(field.FieldType));
            }
            return ret;
        }

        public static Type GetUnrefParameterType(ParameterInfo parameterInfo)
        {
            return (parameterInfo.ParameterType.IsByRef || parameterInfo.ParameterType.IsPointer) ? parameterInfo.ParameterType.GetElementType() : parameterInfo.ParameterType;
        }

        public static void GenericArgumentInInstructions(MethodBase node, HashSet<Type> result, HashSet<MethodBase> proceed, Func<MethodBase, IEnumerable<MethodBase>> callingMethodsGetter)
        {
            var declaringType = node.DeclaringType;
            if (proceed.Contains(node)) return;
            if (node.IsGenericMethod && !node.IsGenericMethodDefinition)
            {
                foreach (var t in node.GetGenericArguments())
                {
                    if (!t.IsDefined(typeof(CompilerGeneratedAttribute)))
                    {
                        result.Add(t);
                    }
                }
            }
            if (declaringType != null && Utils.shouldNotGetArgumentsInInstructions(node)) return;

            proceed.Add(node);

            var callingMethods = callingMethodsGetter(node);
            foreach (var callingMethod in callingMethods)
            {
                GenericArgumentInInstructions(callingMethod, result, proceed, callingMethodsGetter);
            }
        }

        #endregion

        #region Helper methods

        private static Type GetExtendedTypeOf(MethodInfo method)
        {
            var type = method.GetParameters()[0].ParameterType;
            return type.IsGenericParameter ? type.BaseType : type;
        }

        private static void IterateAllValueType(Type type, List<CSharpCodeGen.ValueTypeInfo> list)
        {
            if (Utils.isDisallowedType(type)) return;
            if (type.IsPrimitive) return;

            Type baseType = type.BaseType;
            while (baseType != null && baseType != typeof(System.Object))
            {
                IterateAllValueType(baseType, list);
                baseType = baseType.BaseType;
            }

            foreach (var field in type.GetFields(BindingFlags.DeclaredOnly | BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic))
            {
                if (field.FieldType.IsValueType && !field.FieldType.IsPrimitive)
                {
                    IterateAllValueType(field.FieldType, list);
                }
            }

            if (!type.IsValueType) return;

            int value = -1;
            if (Nullable.GetUnderlyingType(type) != null)
            {
                var fields = type.GetFields(BindingFlags.DeclaredOnly | BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);
                for (var i = 0; i < fields.Length; i++)
                {
                    if (fields[i].Name == "hasValue" || fields[i].Name == "has_value")
                    {
                        value = i;
                        break;
                    }
                }
            }

            list.Add(new CSharpCodeGen.ValueTypeInfo
            {
                Signature = Puerts.TypeUtils.GetTypeSignature(type),
                CsName = type.Name,
                FieldSignatures = GetValueTypeFieldSignatures(type),
                NullableHasValuePosition = value
            });
        }

        private static bool IsSelfRefGenericType(Type type, Type typeDef)
        {
            if (type.IsGenericType)
            {
                if (type.GetGenericTypeDefinition() == typeDef) return true;
                foreach (var ga in type.GetGenericArguments())
                {
                    if (IsSelfRefGenericType(ga, typeDef)) return true;
                }
            }
            return false;
        }

        private static void IterateAllType(Type type, HashSet<Type> allTypes)
        {
            if (!allTypes.Contains(type))
            {
                allTypes.Add(type);
                try
                {
                    var fields = type.GetFields(BindingFlags.DeclaredOnly | BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);
                    foreach (var field in fields) IterateAllType(field.FieldType, allTypes);
                }
                catch { }

                MethodInfo[] methods = new MethodInfo[] { };
                try
                {
                    methods = type.GetMethods(BindingFlags.DeclaredOnly | BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);
                    foreach (var method in methods)
                    {
                        if (type.IsGenericType && IsSelfRefGenericType(method.ReturnType, type.GetGenericTypeDefinition())) continue;
                        IterateAllType(method.ReturnType, allTypes);
                    }
                }
                catch { }

                try
                {
                    var methodBases = methods.Cast<MethodBase>()
                        .Concat(type.GetConstructors(BindingFlags.DeclaredOnly | BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic));
                    foreach (var methodBase in methodBases)
                    {
                        foreach (var pi in methodBase.GetParameters())
                        {
                            if (type.IsGenericType && IsSelfRefGenericType(pi.ParameterType, type.GetGenericTypeDefinition())) continue;
                            IterateAllType(pi.ParameterType, allTypes);
                        }
                    }
                }
                catch { }
            }
        }

        private static void WriteFile(string path, string content)
        {
            using (StreamWriter textWriter = new StreamWriter(path, false, Encoding.UTF8))
            {
                textWriter.Write(content);
                textWriter.Flush();
            }
        }

        #endregion
    }
}
#endif

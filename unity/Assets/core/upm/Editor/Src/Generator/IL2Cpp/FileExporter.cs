/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
#if UNITY_2020_1_OR_NEWER
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Reflection;
using System.Runtime.CompilerServices;
using Puerts.Editor.Generator;
using Puerts.TypeMapping;

#if !PUERTS_GENERAL && !UNITY_WEBGL
using Mono.Reflection;
using UnityEngine;

namespace PuertsIl2cpp.Editor
{
    namespace Generator
    {
        public class FileExporter
        {
            public static List<string> GetValueTypeFieldSignatures(Type type)
            {
                List<string> ret = new List<string>();
                if (type.BaseType != null && type.BaseType.IsValueType) ret.Add(PuertsIl2cpp.TypeUtils.GetTypeSignature(type.BaseType));
                foreach (var field in type.GetFields(BindingFlags.DeclaredOnly | BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic))
                {
                    // if ((field.FieldType.IsValueType && !field.FieldType.IsPrimitive))
                    // {
                    //     ret.AddRange(GetValueTypeFieldSignatures(field.FieldType));
                    // }
                    // else
                    // {
                        ret.Add(PuertsIl2cpp.TypeUtils.GetTypeSignature(field.FieldType));
                    // }
                }
                return ret;
            }

            class ValueTypeInfo
            {
                public string Signature;
                public string CsName;
                public List<string> FieldSignatures;
                public int NullableHasValuePosition;
            }

            class SignatureInfo
            {
                public string Signature;
                public string CsName;
                public string ReturnSignature;
                public string ThisSignature;
                public List<string> ParameterSignatures;
            }

            class CppWrappersInfo
            {
                public List<ValueTypeInfo> ValueTypeInfos;

                public List<SignatureInfo> WrapperInfos;

                public List<SignatureInfo> BridgeInfos;

                public List<SignatureInfo> FieldWrapperInfos;
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

            private static bool IterateAllValueType(Type type, List<ValueTypeInfo> list)
            {
                if (Utils.isDisallowedType(type)) return false;
                if (type.IsPrimitive) {
                    return true;
                }
                Type baseType = type.BaseType;
                while (baseType != null && baseType != typeof(System.Object))
                {
                    if (baseType.IsValueType) {
                        if (!IterateAllValueType(baseType, list)) return false;
                    }
                    baseType = baseType.BaseType;
                }
                
                foreach (var field in type.GetFields(BindingFlags.DeclaredOnly | BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic))
                {
                    if (field.FieldType.IsValueType && !field.FieldType.IsPrimitive) 
                        if (!IterateAllValueType(field.FieldType, list)) return false;
                }

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

                list.Add(new ValueTypeInfo { 
                    Signature = PuertsIl2cpp.TypeUtils.GetTypeSignature(type), 
                    CsName = type.Name, 
                    FieldSignatures = GetValueTypeFieldSignatures(type),
                    NullableHasValuePosition = value
                });
                return true;
            }

            public static void GenCPPWrap(string saveTo, bool onlyConfigure = false)
            {
                Utils.SetFilters(Puerts.Configure.GetFilters());
                
                var types = from assembly in AppDomain.CurrentDomain.GetAssemblies()
                                // where assembly.FullName.Contains("puerts") || assembly.FullName.Contains("Assembly-CSharp") || assembly.FullName.Contains("Unity")
                            where !(assembly.ManifestModule is System.Reflection.Emit.ModuleBuilder)
                            from type in assembly.GetTypes()
                            where type.IsPublic
                            select type;

                const BindingFlags flag = BindingFlags.DeclaredOnly | BindingFlags.Instance | BindingFlags.Static | BindingFlags.Public;
                const BindingFlags flagForPuer = BindingFlags.DeclaredOnly | BindingFlags.Instance | BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic;

                var typeExcludeDelegate = types
                    .Where(t => !typeof(MulticastDelegate).IsAssignableFrom(t));

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
                    typeof(Func<string, Puerts.JSObject>),
                    typeof(Func<Puerts.JSObject, string, string>),
                    typeof(Func<Puerts.JSObject, string, int>),
                    typeof(Func<Puerts.JSObject, string, uint>),
                    typeof(Func<Puerts.JSObject, string, long>),
                    typeof(Func<Puerts.JSObject, string, ulong>),
                    typeof(Func<Puerts.JSObject, string, short>),
                    typeof(Func<Puerts.JSObject, string, ushort>),
                    typeof(Func<Puerts.JSObject, string, float>),
                    typeof(Func<Puerts.JSObject, string, double>),
                    typeof(Func<Puerts.JSObject, string, Puerts.JSObject>)
                };

                HashSet<Type> typeInGenericArgument = new HashSet<Type>();
                HashSet<MethodBase> processed = new HashSet<MethodBase>();
#if !PUERTS_GENERAL
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
                            UnityEngine.Debug.LogWarning(string.Format("get instructions of {0} ({2}:{3}) throw {1}", mb, e.Message, mb.DeclaringType == null ? "" : mb.DeclaringType.Assembly.GetName().Name, mb.DeclaringType));
                            return new MethodBase[] { };
                        }
                    });
                }
#endif

                var delegateToBridge = wrapperUsedTypes
                    .Concat(PuerDelegates)
                    .Concat(typeInGenericArgument)
                    .Where(t => typeof(MulticastDelegate).IsAssignableFrom(t));

                var delegateInvokes = delegateToBridge
                    .Select(t => t.GetMethod("Invoke"))
                    .Where(m => m != null);

                var delegateUsedTypes = delegateInvokes.SelectMany(m => m.GetParameters()).Select(pi => GetUnrefParameterType(pi))
                    .Concat(delegateInvokes.Select(m => m.ReturnType));

                var valueTypeInfos = new List<ValueTypeInfo>();
                foreach (var type in wrapperUsedTypes.Concat(delegateUsedTypes))
                {
                    IterateAllValueType(type, valueTypeInfos);
                }
                
                valueTypeInfos = valueTypeInfos
                    .GroupBy(s => s.Signature)
                    .Select(s => s.FirstOrDefault())
                    .ToList();

                var bridgeInfos = delegateInvokes
                    .Select(m => new SignatureInfo
                    {
                        Signature = PuertsIl2cpp.TypeUtils.GetMethodSignature(m, true),
                        CsName = m.ToString(),
                        ReturnSignature = PuertsIl2cpp.TypeUtils.GetTypeSignature(m.ReturnType),
                        ThisSignature = null,
                        ParameterSignatures = m.GetParameters().Select(p => PuertsIl2cpp.TypeUtils.GetParameterSignature(p)).ToList()
                    })
                    .GroupBy(s => s.Signature)
                    .Select(s => s.FirstOrDefault())
                    .ToList();
                bridgeInfos.Sort((x, y) => string.CompareOrdinal(x.Signature, y.Signature));

                var genWrapperCtor = ctorToWrapper;
                var genWrapperMethod = methodToWrap;
                var genWrapperField = fieldToWrapper;

                if (onlyConfigure)
                {
                    var configure = Puerts.Configure.GetConfigureByTags(new List<string>() {
                        "Puerts.BindingAttribute",
                    });

                    var configureTypes = new HashSet<Type>(configure["Puerts.BindingAttribute"].Select(kv => kv.Key)
                        .Where(o => o is Type)
                        .Cast<Type>()
                        .Where(t => !typeof(MulticastDelegate).IsAssignableFrom(t))
                        .Where(t => !t.IsGenericTypeDefinition && !t.Name.StartsWith("<"))
                        .Distinct()
                        .ToList());

                    // configureTypes.Clear();

                    genWrapperCtor = configureTypes
                        .SelectMany(t => t.GetConstructors(flag))
                        .Where(m => !Utils.IsNotSupportedMember(m, true))
                        .Where(m => Utils.getBindingMode(m) != Puerts.BindingMode.DontBinding);

                    genWrapperMethod = configureTypes
                        .SelectMany(t => t.GetMethods(flag))
                        .Where(m => !Utils.IsNotSupportedMember(m, true))
                        .Where(m => Utils.getBindingMode(m) != Puerts.BindingMode.DontBinding);

                    genWrapperField = configureTypes
                        .SelectMany(t => t.GetFields(flag))
                        .Where(m => !Utils.IsNotSupportedMember(m, true))
                        .Where(m => Utils.getBindingMode(m) != Puerts.BindingMode.DontBinding);

                    var configureUsedTypes = configureTypes
                        .Concat(genWrapperCtor.SelectMany(c => c.GetParameters()).Select(pi => GetUnrefParameterType(pi)))
                        .Concat(genWrapperMethod.SelectMany(m => m.GetParameters()).Select(pi => GetUnrefParameterType(pi)))
                        .Concat(genWrapperMethod.Select(m => m.ReturnType))
                        .Concat(genWrapperField.Select(f => f.FieldType))
                        .Distinct();
                    
                    valueTypeInfos = new List<ValueTypeInfo>();
                    foreach (var type in configureUsedTypes.Concat(delegateUsedTypes))
                    {
                        IterateAllValueType(type, valueTypeInfos);
                    }
                    
                    valueTypeInfos = valueTypeInfos
                        .GroupBy(s => s.Signature)
                        .Select(s => s.FirstOrDefault())
                        .ToList();

                    Utils.SetFilters(null);
                }

                var wrapperInfos = genWrapperMethod
                    .Where(m => !m.IsGenericMethodDefinition && !m.IsAbstract)
                    .Select(m =>
                    {
                        var isExtensionMethod = m.IsDefined(typeof(ExtensionAttribute));
                        return new SignatureInfo
                        {
                            Signature = PuertsIl2cpp.TypeUtils.GetMethodSignature(m, false, isExtensionMethod),
                            CsName = m.ToString(),
                            ReturnSignature = PuertsIl2cpp.TypeUtils.GetTypeSignature(m.ReturnType),
                            ThisSignature = PuertsIl2cpp.TypeUtils.GetThisSignature(m, isExtensionMethod),
                            ParameterSignatures = m.GetParameters().Skip(isExtensionMethod ? 1 : 0).Select(p => PuertsIl2cpp.TypeUtils.GetParameterSignature(p)).ToList()
                        };
                    })
                    .Concat(
                        genWrapperCtor
                            .Select(m =>
                            {
                                var isExtensionMethod = false;
                                return new SignatureInfo
                                {
                                    Signature = PuertsIl2cpp.TypeUtils.GetMethodSignature(m, false, isExtensionMethod),
                                    CsName = m.ToString(),
                                    ReturnSignature = "v",
                                    ThisSignature = "t",
                                    ParameterSignatures = m.GetParameters().Skip(isExtensionMethod ? 1 : 0).Select(p => PuertsIl2cpp.TypeUtils.GetParameterSignature(p)).ToList()
                                };
                            })
                    )
                    .GroupBy(s => s.Signature)
                    .Select(s => s.FirstOrDefault())
                    .ToList();
                wrapperInfos.Sort((x, y) => string.CompareOrdinal(x.Signature, y.Signature));

                var fieldWrapperInfos = genWrapperField
                    .Select(f => new SignatureInfo
                    {
                        Signature = (f.IsStatic ? "" : "t") + PuertsIl2cpp.TypeUtils.GetTypeSignature(f.FieldType),
                        CsName = f.ToString(),
                        ReturnSignature = PuertsIl2cpp.TypeUtils.GetTypeSignature(f.FieldType),
                        ThisSignature = (f.IsStatic ? "" : "t"),
                        ParameterSignatures = null
                    })
                    .GroupBy(s => s.Signature)
                    .Select(s => s.FirstOrDefault())
                    .ToList();
                fieldWrapperInfos.Sort((x, y) => string.CompareOrdinal(x.Signature, y.Signature));

                using (var jsEnv = new Puerts.JsEnv())
                {
                    jsEnv.UsingFunc<CppWrappersInfo, string>();
                    var cppWrapRender = jsEnv.ExecuteModule<Func<CppWrappersInfo, string>>("puerts/templates/cppwrapper.tpl.mjs", "default");
                    using (StreamWriter textWriter = new StreamWriter(Path.Combine(saveTo, "FunctionBridge.Gen.h"), false, Encoding.UTF8))
                    {
                        string fileContext = cppWrapRender(new CppWrappersInfo
                        {
                            ValueTypeInfos = valueTypeInfos,
                            WrapperInfos = wrapperInfos,
                            BridgeInfos = bridgeInfos,
                            FieldWrapperInfos = fieldWrapperInfos
                        });
                        textWriter.Write(fileContext);
                        textWriter.Flush();
                    }
                }
            }

            public static void GenExtensionMethodInfos(string outDir)
            {
                var configure = Puerts.Configure.GetConfigureByTags(new List<string>() {
                    "Puerts.BindingAttribute",
                });

                var genTypes = new HashSet<Type>(configure["Puerts.BindingAttribute"].Select(kv => kv.Key)
                    .Where(o => o is Type)
                    .Cast<Type>()
                    .Where(t => !t.IsGenericTypeDefinition && !t.Name.StartsWith("<"))
                    .Distinct()
                    .ToList());

                genTypes.Add(typeof(PuertsIl2cpp.ArrayExtension));
                // genTypes.Add(typeof(PuertsIl2cpp.ArrayExtension2));
                var extendedType2extensionType = (from type in genTypes
#if UNITY_EDITOR
                    where !System.IO.Path.GetFileName(type.Assembly.Location).Contains("Editor")
#endif
                                                  from method in type.GetMethods(BindingFlags.Static | BindingFlags.Public).Select(method => TypeUtils.HandleMaybeGenericMethod(method)).Where(method => method != null)
                                                  where Utils.isDefined(method, typeof(ExtensionAttribute))
                                                  group type by Utils.getExtendedType(method)).ToDictionary(g => g.Key, g => (g as IEnumerable<Type>).Distinct().ToList()).ToList();

                using (var jsEnv = new Puerts.JsEnv())
                {
                    var wrapRender = jsEnv.ExecuteModule<Func<List<KeyValuePair<Type, List<Type>>>, string>>(
                        "puerts/templates/extension_methods_gen.tpl.mjs", "default");
                    string fileContent = wrapRender(extendedType2extensionType);
                    var filePath = outDir + "ExtensionMethodInfos_Gen.cs";
                    using (StreamWriter textWriter = new StreamWriter(filePath, false, Encoding.UTF8))
                    {
                        textWriter.Write(fileContent);
                        textWriter.Flush();
                    }
                }
            }

            public static void GenLinkXml(string outDir)
            {
                var configure = Puerts.Configure.GetConfigureByTags(new List<string>() {
                        "Puerts.BindingAttribute",
                    });
                var genTypes = configure["Puerts.BindingAttribute"].Select(kv => kv.Key)
                    .Where(o => o is Type)
                    .Cast<Type>()
                    .Where(t => !t.IsGenericTypeDefinition && !t.Name.StartsWith("<"))
                    .Distinct()
                    .ToList();
                using (var jsEnv = new Puerts.JsEnv())
                {
                    var linkXMLRender = jsEnv.ExecuteModule<Func<List<Type>, string>>("puerts/templates/linkxmlgen.tpl.mjs", "LinkXMLTemplate");
                    string linkXMLContent = linkXMLRender(genTypes);
                    var linkXMLPath = outDir + "link.xml";
                    using (StreamWriter textWriter = new StreamWriter(linkXMLPath, false, Encoding.UTF8))
                    {
                        textWriter.Write(linkXMLContent);
                        textWriter.Flush();
                    }
                }
            }

            public static void CopyXIl2cppCPlugin(string outDir)
            {
                Dictionary<string, string> cPluginCode = new Dictionary<string, string>()
                {
                    { "pesapi_adpt.c", Resources.Load<TextAsset>("puerts/xil2cpp/pesapi_adpt.c").text },
                    { "pesapi.h", Resources.Load<TextAsset>("puerts/xil2cpp/pesapi.h").text },
                    { "Puerts_il2cpp.cpp", Resources.Load<TextAsset>("puerts/xil2cpp/Puerts_il2cpp.cpp").text },
                    { "UnityExports4Puerts.h", Resources.Load<TextAsset>("puerts/xil2cpp/UnityExports4Puerts.h").text }
                };

                foreach (var cPlugin in cPluginCode)
                {
                    var path = outDir + cPlugin.Key;
                    using (StreamWriter textWriter = new StreamWriter(path, false, Encoding.UTF8))
                    {
                        textWriter.Write(cPlugin.Value);
                        textWriter.Flush();
                    }
                }
            }

            public static void GenMarcoHeader(string outDir)
            {
                var filePath = outDir + "unityenv_for_puerts.h";

                using (var jsEnv = new Puerts.JsEnv())
                {
                    var macroHeaderRender = jsEnv.ExecuteModule<Func<bool, bool, string>>("puerts/xil2cpp/unityenv_for_puerts.h.tpl.mjs", "default");
                    string macroHeaderContent = macroHeaderRender(              
#if !UNITY_2021_1_OR_NEWER
                        false,
#else
                        true,
#endif
#if UNITY_ANDROID || UNITY_IPHONE
                        false
#else
                        true
#endif
                    );

                    using (StreamWriter textWriter = new StreamWriter(filePath, false, Encoding.UTF8))
                    {
                        textWriter.Write(macroHeaderContent);
                        textWriter.Flush();
                    }
                }
            }
        }
    }
}
#endif
#endif
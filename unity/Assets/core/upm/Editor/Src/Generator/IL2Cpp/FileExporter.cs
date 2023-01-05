/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Reflection;
using System.Runtime.CompilerServices;
using Puerts.Editor.Generator;

namespace PuertsIl2cpp.Editor
{
    namespace Generator {
        public class FileExporter {
            public static List<string> GetValueTypeFieldSignatures(Type type)
            {
                List<string> ret = (type.BaseType != null && type.BaseType.IsValueType) ? GetValueTypeFieldSignatures(type.BaseType) : new List<string>();
                foreach (var field in type.GetFields(BindingFlags.DeclaredOnly | BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic))
                {
                    if ((field.FieldType.IsValueType && !field.FieldType.IsPrimitive))
                    {
                        ret.AddRange(GetValueTypeFieldSignatures(field.FieldType));
                    }
                    else
                    {
                        ret.Add(PuertsIl2cpp.TypeUtils.GetTypeSignature(field.FieldType));
                    }
                }
                return ret;
            }

            class ValueTypeInfo
            {
                public string Signature;
                public string CsName;
                public List<string> FieldSignatures;
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

            public static void GenCPPWrap(string saveTo)
            {
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
                    .SelectMany(t => t.GetConstructors(t.FullName.Contains("Puer") ? flagForPuer : flag));

                var methodToWrap = typeExcludeDelegate
                    .SelectMany(t => t.GetMethods(t.FullName.Contains("Puer") ? flagForPuer : flag));

                var fieldToWrapper = typeExcludeDelegate
                    .SelectMany(t => t.GetFields(t.FullName.Contains("Puer") ? flagForPuer : flag));

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
                var delegateToBridge = wrapperUsedTypes
                    .Concat(PuerDelegates)
                    .Where(t => typeof(MulticastDelegate).IsAssignableFrom(t));

                var delegateInvokes = delegateToBridge
                    .Select(t => t.GetMethod("Invoke"))
                    .Where(m => m != null);

                var delegateUsedTypes = delegateInvokes.SelectMany(m => m.GetParameters()).Select(pi => GetUnrefParameterType(pi))
                    .Concat(delegateInvokes.Select(m => m.ReturnType));

                var valueTypeInfos = wrapperUsedTypes.Concat(delegateUsedTypes)
                    .Where(t => t.IsValueType && !t.IsPrimitive && !t.IsEnum)
                    .Select(t => new ValueTypeInfo { Signature = PuertsIl2cpp.TypeUtils.GetTypeSignature(t), CsName = t.Name, FieldSignatures = GetValueTypeFieldSignatures(t) })
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

                var wrapperInfos = methodToWrap
                    .Select(m  => { 
                        var isExtensionMethod = m.IsDefined(typeof(ExtensionAttribute));
                        return new SignatureInfo {
                            Signature = PuertsIl2cpp.TypeUtils.GetMethodSignature(m, false, isExtensionMethod),
                            CsName = m.ToString(),
                            ReturnSignature = PuertsIl2cpp.TypeUtils.GetTypeSignature(m.ReturnType),
                            ThisSignature = PuertsIl2cpp.TypeUtils.GetThisSignature(m, isExtensionMethod),
                            ParameterSignatures = m.GetParameters().Skip(isExtensionMethod ? 1 : 0).Select(p => PuertsIl2cpp.TypeUtils.GetParameterSignature(p)).ToList()
                        };
                    })
                    .Concat(
                        ctorToWrapper
                            .Select(m  => { 
                                var isExtensionMethod = false;
                                return new SignatureInfo {
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

                var fieldWrapperInfos = fieldToWrapper
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
                        string fileContext = cppWrapRender(new CppWrappersInfo { 
                            ValueTypeInfos  = valueTypeInfos,
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
                genTypes.Add(typeof(PuertsIl2cpp.ArrayExtension2));
                var extendedType2extensionType = (from type in genTypes
#if UNITY_EDITOR
                    where !type.Assembly.Location.Contains("Editor")
#endif
                    from method in type.GetMethods(BindingFlags.Static | BindingFlags.Public)
                    where Utils.isDefined(method, typeof(ExtensionAttribute)) && Puerts.Utils.IsNotGenericOrValidGeneric(method)
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
                    var wrapRender = jsEnv.ExecuteModule<Func<List<Type>, string>>("puerts/templates/linkxmlgen.tpl.mjs", "default");
                    string fileContent = wrapRender(genTypes);
                    var filePath = outDir + "link.xml";
                    using (StreamWriter textWriter = new StreamWriter(filePath, false, Encoding.UTF8))
                    {
                        textWriter.Write(fileContent);
                        textWriter.Flush();
                    }
                }
            }
        }
    }
}
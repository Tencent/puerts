/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;
using System.Collections.Generic;
using System.Reflection;
using System.Linq;
using System.Runtime.CompilerServices;

namespace Puerts.Editor
{
    namespace Generator {

        namespace DTS {

            public class TsNamespaceGenInfo
            {
                public string Name;
                public TsTypeGenInfo[] Types;
            }

            public class TsParameterGenInfo
            {
                public string Name;
                public bool IsByRef;
                public string TypeName;
                public bool IsParams;
                public bool IsOptional;
                public override bool Equals(object obj)
                {
                    if (obj != null && obj is TsParameterGenInfo)
                    {
                        TsParameterGenInfo info = (TsParameterGenInfo)obj;
                        return this.Name == info.Name &&
                            this.TypeName == info.TypeName &&
                            this.IsByRef == info.IsByRef &&
                            this.IsParams == info.IsParams &&
                            this.IsOptional == info.IsOptional;
                    }
                    return base.Equals(obj);
                }
                public override int GetHashCode()
                {
                    return base.GetHashCode();
                }
                public override string ToString()
                {
                    return base.ToString();
                }

                public static TsParameterGenInfo FromParameterInfo(ParameterInfo parameterInfo, bool isGenericTypeDefinition)
                {
                    var isParams = parameterInfo.IsDefined(typeof(ParamArrayAttribute), false);
                    return new TsParameterGenInfo()
                    {
                        Name = parameterInfo.Name,
                        IsByRef = parameterInfo.ParameterType.IsByRef,
                        TypeName = Utils.GetTsTypeName(Utils.ToConstraintType(parameterInfo.ParameterType, isGenericTypeDefinition), isParams),
                        IsParams = isParams,
                        IsOptional = parameterInfo.IsOptional
                    };
                }

            }

            public class TsMethodGenInfoComparer : IEqualityComparer<TsMethodGenInfo>
            {
                public bool Equals(TsMethodGenInfo x, TsMethodGenInfo y) { return x.Equals(y); }

                public int GetHashCode(TsMethodGenInfo obj) { return 0; }
            }

            public class TsMethodGenInfo
            {
                public string Name;
                public string Document;
                public TsParameterGenInfo[] ParameterInfos;
                public string TypeName;
                public bool IsConstructor;
                public bool IsStatic;
                public override bool Equals(object obj)
                {
                    if (obj != null && obj is TsMethodGenInfo)
                    {
                        TsMethodGenInfo info = (TsMethodGenInfo)obj;
                        if (this.ParameterInfos.Length != info.ParameterInfos.Length ||
                            this.Name != info.Name ||
                            this.TypeName != info.TypeName ||
                            this.IsConstructor != info.IsConstructor ||
                            this.IsStatic != info.IsStatic)
                        {
                            return false;
                        }

                        for (int i = 0; i < this.ParameterInfos.Length; i++)
                        {
                            if (!this.ParameterInfos[i].Equals(info.ParameterInfos[i]))
                                return false;
                        }
                        return true;
                    }
                    return base.Equals(obj);
                }
                public override int GetHashCode()
                {
                    return base.GetHashCode();
                }
                public override string ToString()
                {
                    return base.ToString();
                }

                public static TsMethodGenInfo FromMethodBase(MethodBase methodBase, bool isGenericTypeDefinition, bool skipExtentionMethodThis)
                {
                    return new TsMethodGenInfo()
                    {
                        Name = methodBase.IsConstructor ? "constructor" : methodBase.Name,
                        Document = DocResolver.GetTsDocument(methodBase),
                        ParameterInfos = methodBase.GetParameters()
                            .Skip(skipExtentionMethodThis && Utils.isDefined(methodBase, typeof(ExtensionAttribute)) ? 1 : 0)
                            .Select(info => TsParameterGenInfo.FromParameterInfo(info, isGenericTypeDefinition)).ToArray(),
                        TypeName = methodBase.IsConstructor ? "" : Utils.GetTsTypeName(Utils.ToConstraintType((methodBase as MethodInfo).ReturnType, isGenericTypeDefinition)),
                        IsConstructor = methodBase.IsConstructor,
                        IsStatic = methodBase.IsStatic,
                    };
                }

                public static TsMethodGenInfo[] FromType(Type type, HashSet<Type> genTypeSet)
                {
                    var declMethods = type.GetMethods(Utils.Flags)
                        .Where(m => m.GetBaseDefinition() == m || !genTypeSet.Contains(m.DeclaringType)).ToArray();

                    var methodNames = declMethods.Select(m => m.Name).ToArray();

                    //var methods = type.GetMethods(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Static)
                    var methods = type.GetMethods(Utils.Flags)
                        .Where(m => genTypeSet.Contains(m.DeclaringType) && methodNames.Contains(m.Name))
                        .Concat(declMethods)
                        .Where(m => !Utils.IsNotSupportedMember(m, true) && !Utils.IsGetterOrSetter(m) && (type.IsGenericTypeDefinition && !m.IsGenericMethodDefinition || Puerts.Utils.IsNotGenericOrValidGeneric(m)))
                        .Where(m => Utils.getBindingMode(m) != BindingMode.DontBinding)
                        .Cast<MethodBase>()
                        .Distinct();

                    if (!type.IsAbstract && !type.IsInterface)
                    {
                        methods = methods.Concat(type.GetConstructors(Utils.Flags).Where(m => !Utils.IsNotSupportedMember(m)).Cast<MethodBase>());
                    }

                    return methods
                        .Select(m => TsMethodGenInfo.FromMethodBase(m, type.IsGenericTypeDefinition, false))
                        .ToArray();
                }

                public static TsMethodGenInfo[] FromTsGenTypeInfos(Dictionary<string, TsTypeGenInfo> tsGenTypeInfos, TsTypeGenInfo info, bool getBaseMethods)
                {
                    var result = new List<TsMethodGenInfo>();
                    if (info.Methods != null)
                        result.AddRange(info.Methods);
                    if (info.ExtensionMethods != null)
                    {
                        result.AddRange(info.ExtensionMethods.Select(m => new TsMethodGenInfo()
                        {
                            Name = m.Name,
                            Document = m.Document,
                            ParameterInfos = m.ParameterInfos,
                            IsConstructor = m.IsConstructor,
                            IsStatic = false,
                        }));
                    }
                    if (getBaseMethods)
                    {
                        TsTypeGenInfo taregtInfo;
                        if (info.BaseType != null && tsGenTypeInfos.TryGetValue(info.BaseType.FullName, out taregtInfo))
                        {
                            result.AddRange(TsMethodGenInfo.FromTsGenTypeInfos(tsGenTypeInfos, taregtInfo, true));
                        }
                        if (info.IsInterface && info.interfaces != null)
                        {
                            foreach (var iface in info.interfaces)
                            {
                                if (tsGenTypeInfos.TryGetValue(iface.FullName, out taregtInfo))
                                    result.AddRange(TsMethodGenInfo.FromTsGenTypeInfos(tsGenTypeInfos, taregtInfo, true));
                            }
                        }
                    }
                    return result.Distinct(new TsMethodGenInfoComparer()).ToArray();
                }
            }

            public class TsPropertyGenInfo
            {
                public string Name;
                public string Document;
                public string TypeName;
                public bool IsStatic;
                public bool HasGetter;
                public bool HasSetter;

                public static TsPropertyGenInfo[] FromTsTypeGenInfo(Dictionary<string, TsTypeGenInfo> tsGenTypeInfos, TsTypeGenInfo info, bool getBaseMethods)
                {
                    var result = new List<TsPropertyGenInfo>();
                    if (info.Properties != null)
                        result.AddRange(info.Properties);

                    if (getBaseMethods)
                    {
                        TsTypeGenInfo taregtInfo;
                        if (info.BaseType != null && tsGenTypeInfos.TryGetValue(info.BaseType.FullName, out taregtInfo))
                        {
                            result.AddRange(TsPropertyGenInfo.FromTsTypeGenInfo(tsGenTypeInfos, taregtInfo, true));
                        }
                        if (info.IsInterface && info.interfaces != null)
                        {
                            foreach (var iface in info.interfaces)
                            {
                                if (tsGenTypeInfos.TryGetValue(iface.FullName, out taregtInfo))
                                    result.AddRange(TsPropertyGenInfo.FromTsTypeGenInfo(tsGenTypeInfos, taregtInfo, true));
                            }
                        }
                    }
                    return result.Distinct().ToArray();
                }
            }

            public class TsTypeGenInfo
            {
                public string Name;
                public string Document;
                public TsMethodGenInfo[] Methods;
                public TsPropertyGenInfo[] Properties;
                public bool IsGenericTypeDefinition;
                public string[] GenericParameters;
                public bool IsDelegate;
                public string DelegateDef;
                public bool IsInterface;
                public string Namespace;
                public TsTypeGenInfo BaseType;
                public TsTypeGenInfo[] interfaces;
                public bool IsEnum;
                public string EnumKeyValues;
                public TsMethodGenInfo[] ExtensionMethods;
                public bool IsCheckOk = false;
                public string FullName
                {
                    get
                    {
                        var name = (string.IsNullOrEmpty(Namespace) ? "" : (Namespace + ".")) + Name;
                        if (IsGenericTypeDefinition)
                            name += "<" + string.Join(",", GenericParameters) + ">";
                        return name;
                    }
                }

                public static TsTypeGenInfo FromType(Type type, HashSet<Type> genTypeSet)
                {
                    var result = new TsTypeGenInfo()
                    {
                        Name = type.Name.Replace('`', '$'),
                        Document = DocResolver.GetTsDocument(type),
                        Methods = genTypeSet.Contains(type) ? TsMethodGenInfo.FromType(type, genTypeSet) : new TsMethodGenInfo[] { },
                        Properties = genTypeSet.Contains(type) ? type.GetFields(Utils.Flags)
                            .Where(m => !Utils.IsNotSupportedMember(m, true))
                            .Where(m => Utils.getBindingMode(m) != BindingMode.DontBinding)
                            .Select(f => new TsPropertyGenInfo()
                            {
                                Name = f.Name,
                                Document = DocResolver.GetTsDocument(f),
                                TypeName = Utils.GetTsTypeName(f.FieldType),
                                IsStatic = f.IsStatic
                            })
                            .Concat(
                                type.GetProperties(Utils.Flags).Where(m => m.Name != "Item")
                                .Where(m => !Utils.IsNotSupportedMember(m, true))
                                .Where(m => Utils.getBindingMode(m) != BindingMode.DontBinding)
                                .Select(p => new TsPropertyGenInfo()
                                {
                                    Name = p.Name,
                                    Document = DocResolver.GetTsDocument(p),
                                    TypeName = Utils.GetTsTypeName(p.PropertyType),
                                    IsStatic = Utils.IsStatic(p),
                                    HasGetter = p.GetGetMethod() != null && p.GetGetMethod().IsPublic,
                                    HasSetter = p.GetSetMethod() != null && p.GetSetMethod().IsPublic
                                })
                            )
                            .ToArray() : new TsPropertyGenInfo[] { },
                        IsGenericTypeDefinition = type.IsGenericTypeDefinition,
                        IsDelegate = (Utils.IsDelegate(type) && type != typeof(Delegate)),
                        IsInterface = type.IsInterface,
                        Namespace = type.Namespace,
                        ExtensionMethods = Utils.GetExtensionMethods(type, genTypeSet).Select(m => TsMethodGenInfo.FromMethodBase(m, type.IsGenericTypeDefinition, true)).ToArray()
                    };

                    if (result.IsGenericTypeDefinition)
                    {
                        result.GenericParameters = type.GetGenericArguments().Select(t => t.ToString()).ToArray();
                    }

                    if (result.IsDelegate)
                    {
                        if (type == typeof(Delegate) || type == typeof(System.MulticastDelegate))
                        {
                            result.DelegateDef = "(...args:any[]) => any";
                        }
                        else
                        {
                            var m = type.GetMethod("Invoke");
                            var tsFuncDef = "(" + string.Join(", ", m.GetParameters().Select(p => p.Name + ": " + Utils.GetTsTypeName(p.ParameterType)).ToArray()) + ") => " + Utils.GetTsTypeName(m.ReturnType);
                            result.DelegateDef = tsFuncDef;
                        }
                    }

                    Type[] interfaces = type.GetInterfaces();
                    if (interfaces != null && interfaces.Length > 0)
                    {
                        List<TsTypeGenInfo> genInfoList = new List<TsTypeGenInfo>();
                        for (int i = 0; i < interfaces.Length; i++)
                        {
                            var interfaceTypeGenInfo = new TsTypeGenInfo()
                            {
                                Name = interfaces[i].IsGenericType ? Utils.GetTsTypeName(interfaces[i]) : interfaces[i].Name.Replace('`', '$'),
                                Document = DocResolver.GetTsDocument(interfaces[i]),
                                Namespace = interfaces[i].Namespace
                            };
                            if (interfaces[i].IsNested)
                            {
                                List<string> p = new List<string>();
                                Type temp = interfaces[i];
                                while (temp.IsNested)
                                {
                                    p.Add(temp.DeclaringType.Name.Replace('`', '$'));
                                    temp = temp.DeclaringType;
                                }
                                p.Reverse();
                                if (interfaces[i].Namespace != null)
                                {
                                    interfaceTypeGenInfo.Namespace = interfaces[i].Namespace + '.' + string.Join(".", p.ToArray());
                                }
                                else
                                {
                                    interfaceTypeGenInfo.Namespace = string.Join(".", p.ToArray());
                                }
                            }
                            if (interfaces[i].IsGenericType && interfaces[i].Namespace != null)
                            {
                                interfaceTypeGenInfo.Name = interfaceTypeGenInfo.Name.Substring(interfaceTypeGenInfo.Namespace.Length + 1);
                            }
                            genInfoList.Add(interfaceTypeGenInfo);
                        }
                        result.interfaces = genInfoList.ToArray();
                    }

                    if (type.IsNested)
                    {
                        List<string> p = new List<string>();
                        Type temp = type;
                        while (temp.IsNested)
                        {
                            p.Add(temp.DeclaringType.Name.Replace('`', '$'));
                            temp = temp.DeclaringType;
                        }
                        p.Reverse();
                        if (type.Namespace != null)
                        {
                            result.Namespace = type.Namespace + '.' + string.Join(".", p.ToArray());
                        }
                        else
                        {
                            result.Namespace = string.Join(".", p.ToArray());
                        }
                    }

                    if (!type.IsEnum && type.BaseType != null && type != typeof(object) && !result.IsDelegate && !result.IsInterface)
                    {
                        result.BaseType = new TsTypeGenInfo()
                        {
                            Name = type.BaseType.IsGenericType ? Utils.GetTsTypeName(type.BaseType) : type.BaseType.Name.Replace('`', '$'),
                            Document = DocResolver.GetTsDocument(type.BaseType),
                            Namespace = type.BaseType.Namespace
                        };
                        if (type.BaseType.IsNested)
                        {
                            List<string> p = new List<string>();
                            Type temp = type.BaseType;
                            while (temp.IsNested)
                            {
                                p.Add(temp.DeclaringType.Name.Replace('`', '$'));
                                temp = temp.DeclaringType;
                            }
                            p.Reverse();
                            if (type.BaseType.Namespace != null)
                            {
                                result.BaseType.Namespace = type.BaseType.Namespace + '.' + string.Join(".", p.ToArray());
                            }
                            else
                            {
                                result.BaseType.Namespace = string.Join(".", p.ToArray());
                            }
                        }
                        if (type.BaseType.IsGenericType && type.BaseType.Namespace != null)
                        {
                            result.BaseType.Name = result.BaseType.Name.Substring(result.BaseType.Namespace.Length + 1);
                        }
                    }

                    if (type.IsEnum)
                    {
                        result.IsEnum = true;
                        var KeyValues = type.GetFields(BindingFlags.Static | BindingFlags.Public)
                            .Where(f => f.Name != "value__")
                            .Select(f => f.Name + " = " + Convert.ChangeType(f.GetValue(null), Enum.GetUnderlyingType(type))).ToArray();
                        result.EnumKeyValues = string.Join(", ", KeyValues);
                    }

                    return result;
                }
            }

            public class TypingGenInfo
            {
                public TsNamespaceGenInfo[] NamespaceInfos;

                public string TaskDef;

                public static TypingGenInfo FromTypes(IEnumerable<Type> types)
                {
                    HashSet<Type> genTypeSet = new HashSet<Type>();

                    HashSet<Type> workTypes = new HashSet<Type>();
                    HashSet<Type> refTypes = new HashSet<Type>();

                    foreach (var type in types)
                    {
                        AddRefType(workTypes, refTypes, type);
                        var defType = type.IsGenericType ? type.GetGenericTypeDefinition() : type;
                        if (!genTypeSet.Contains(defType)) genTypeSet.Add(defType);
                        foreach (var field in type.GetFields(Utils.Flags))
                        {
                            AddRefType(workTypes, refTypes, field.FieldType);
                        }

                        foreach (var method in type.GetMethods(Utils.Flags))
                        {
                            AddRefType(workTypes, refTypes, method.ReturnType);
                            foreach (var pinfo in method.GetParameters())
                            {
                                AddRefType(workTypes, refTypes, pinfo.ParameterType);
                            }
                        }
                        foreach (var constructor in type.GetConstructors())
                        {
                            foreach (var pinfo in constructor.GetParameters())
                            {
                                AddRefType(workTypes, refTypes, pinfo.ParameterType);
                            }
                        }
                    }

                    if (!genTypeSet.Contains(typeof(Array)) && !refTypes.Contains(typeof(Array))) AddRefType(workTypes, refTypes, typeof(Array));

                    var tsTypeGenInfos = new Dictionary<string, TsTypeGenInfo>();
                    foreach (var t in refTypes.Distinct())
                    {
                        var info = TsTypeGenInfo.FromType(t, genTypeSet);
                        tsTypeGenInfos.Add(info.FullName, info);
                    }
                    foreach (var info in tsTypeGenInfos)
                    {
                        CheckGenInfos(tsTypeGenInfos, info.Value);
                    }

                    return new TypingGenInfo()
                    {
                        NamespaceInfos = tsTypeGenInfos.Values.GroupBy(t => t.Namespace)
                            .Select(g => new TsNamespaceGenInfo()
                            {
                                Name = g.Key,
                                Types = g.ToArray()
                            }).ToArray(),
        #if CSHARP_7_3_OR_NEWER
                        TaskDef = refTypes.Contains(typeof(System.Threading.Tasks.Task<>)) ?
                            "type $Task<T> = System.Threading.Tasks.Task$1<T>"
                                : "interface $Task<T> {}",
        #else
                        TaskDef = "interface $Task<T> {}",
        #endif
                    };
                }

                private static Dictionary<string, List<TsMethodGenInfo>> MethodGenInfosToDict(IEnumerable<TsMethodGenInfo> methodInfos, Dictionary<string, List<TsMethodGenInfo>> result = null)
                {
                    if (result == null)
                        result = new Dictionary<string, List<TsMethodGenInfo>>();

                    foreach (var info in methodInfos)
                    {
                        List<TsMethodGenInfo> list;
                        if (!result.TryGetValue(info.Name, out list))
                        {
                            list = new List<TsMethodGenInfo>();
                            result.Add(info.Name, list);
                        }
                        list.Add(info);
                    }
                    return result;
                }
                /// <summary>
                /// resolve implemented/override and overload method
                /// </summary>
                private static void CheckGenInfos(Dictionary<string, TsTypeGenInfo> tsGenTypeInfos, TsTypeGenInfo info)
                {
                    if (info.IsCheckOk || info.BaseType == null && info.interfaces == null /* || info.IsInterface */)
                    {
                        info.IsCheckOk = true;
                        return;
                    }
                    info.IsCheckOk = true;

                    TsTypeGenInfo targetInfo;
                    //find baseType methods
                    Dictionary<string, List<TsMethodGenInfo>> baseMethods = null;
                    TsPropertyGenInfo[] baseProperties = null;
                    if (info.BaseType != null && tsGenTypeInfos.TryGetValue(info.BaseType.FullName, out targetInfo))
                    {
                        CheckGenInfos(tsGenTypeInfos, targetInfo);
                        baseMethods = MethodGenInfosToDict(TsMethodGenInfo.FromTsGenTypeInfos(tsGenTypeInfos, targetInfo, true));
                        baseProperties = TsPropertyGenInfo.FromTsTypeGenInfo(tsGenTypeInfos, targetInfo, true);
                    }

                    //find interfaces
                    TsMethodGenInfo[] ifaceMethods = null;
                    TsPropertyGenInfo[] ifaceProperties = null;
                    if (info.interfaces != null)
                    {
                        List<TsMethodGenInfo> methods = new List<TsMethodGenInfo>();
                        List<TsPropertyGenInfo> properties = new List<TsPropertyGenInfo>();
                        foreach (var iface in info.interfaces)
                        {
                            if (!tsGenTypeInfos.TryGetValue(iface.FullName, out targetInfo))
                                continue;
                            methods.AddRange(TsMethodGenInfo.FromTsGenTypeInfos(tsGenTypeInfos, targetInfo, true));
                            properties.AddRange(TsPropertyGenInfo.FromTsTypeGenInfo(tsGenTypeInfos, targetInfo, true));
                        }
                        ifaceMethods = methods.ToArray();
                        ifaceProperties = properties.ToArray();
                    }

                    if (baseMethods == null && ifaceMethods == null)
                        return;

                    Dictionary<string, List<TsMethodGenInfo>> ownMethods = MethodGenInfosToDict(TsMethodGenInfo.FromTsGenTypeInfos(tsGenTypeInfos, info, false));
                    TsPropertyGenInfo[] ownProperties = TsPropertyGenInfo.FromTsTypeGenInfo(tsGenTypeInfos, info, false);

                    //implemented method
                    if (ifaceMethods != null)
                    {
                        List<TsMethodGenInfo> infos;
                        var implMethods = ifaceMethods.Where(
                            method => !((
                                ownMethods.TryGetValue(method.Name, out infos) && 
                                infos.FirstOrDefault(m => method.Equals(m)) != null
                            ) || (
                                baseMethods != null && 
                                baseMethods.TryGetValue(method.Name, out infos) && 
                                infos.FirstOrDefault(m => method.Equals(m)) != null
                            ))
                        );
                        var implProperties = ifaceProperties.Where(
                            prop => !((
                                ownProperties.FirstOrDefault(p => prop.Name.Equals(p.Name)) != null
                            ) || (
                                baseProperties != null && 
                                baseProperties.FirstOrDefault(p => prop.Name.Equals(p.Name)) != null
                            ))
                        );
                        info.Methods = info.Methods.Concat(implMethods).ToArray();
                        info.Properties = info.Properties.Concat(implProperties).ToArray();

                        ownMethods = MethodGenInfosToDict(info.Methods);
                    }
                    //override/overload method
                    if (baseMethods != null)
                    {
                        var selectMethods = new List<TsMethodGenInfo>(info.Methods);
                        foreach (var pair in baseMethods)
                        {
                            var methodName = pair.Key;
                            List<TsMethodGenInfo> oMethods;
                            if (!ownMethods.TryGetValue(methodName, out oMethods) || oMethods.Count == 0)
                                continue;
                            List<TsMethodGenInfo> bMethods = pair.Value.Distinct().ToList();

                            var diffMethods = new List<TsMethodGenInfo>();
                            foreach (var bMethod in bMethods)
                            {
                                if (oMethods.FirstOrDefault(m => bMethod.Equals(m)) == null)
                                {
                                    diffMethods.Add(bMethod);
                                }
                            }
                            if (oMethods.Count + diffMethods.Count != bMethods.Count)
                            {
                                selectMethods.AddRange(diffMethods);
                            }
                        }
                        info.Methods = selectMethods.ToArray();
                    }
                    info.Methods = info.Methods.Distinct(new TsMethodGenInfoComparer()).ToArray();
                }

                static void AddRefType(HashSet<Type> workTypes, HashSet<Type> refTypes, Type type)
                {
                    if (type.Name.StartsWith("<")) return;
                    if (workTypes.Contains(type)) return;
                    workTypes.Add(type);

                    var rawType = Utils.GetRawType(type);

                    if (type.IsGenericType)
                    {
                        foreach (var gt in type.GetGenericArguments())
                        {
                            AddRefType(workTypes, refTypes, gt);
                        }
                    }

                    if (refTypes.Contains(rawType) || type.IsPointer || rawType.IsPointer) return;
                    if (!rawType.IsGenericParameter)
                    {
                        refTypes.Add(rawType);
                    }

                    if (Utils.IsDelegate(type) && type != typeof(Delegate) && type != typeof(MulticastDelegate))
                    {
                        MethodInfo delegateMethod = type.GetMethod("Invoke");
                        AddRefType(workTypes, refTypes, delegateMethod.ReturnType);
                        foreach (var pinfo in delegateMethod.GetParameters())
                        {
                            AddRefType(workTypes, refTypes, pinfo.ParameterType);
                        }
                    }

                    var baseType = type.BaseType;
                    while (baseType != null)
                    {
                        AddRefType(workTypes, refTypes, baseType);
                        baseType = baseType.BaseType;
                    }

                    Type[] interfaces = type.GetInterfaces();
                    if (interfaces != null && interfaces.Length > 0)
                    {
                        for (int i = 0; i < interfaces.Length; i++)
                        {
                            AddRefType(workTypes, refTypes, interfaces[i]);
                        }
                    }
                }

            }
        }

    }
}
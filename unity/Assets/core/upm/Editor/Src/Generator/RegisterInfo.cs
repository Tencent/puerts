/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
using Puerts.TypeMapping;
using System.Reflection;
using System.Collections.Generic;
using System.Linq;
using System;

namespace Puerts.Editor
{
    namespace Generator
    {
        internal class MemberRegisterInfoForGenerate : MemberRegisterInfo
        {
            // use string to work well in js
            new public string MemberType;

            new public string UseBindingMode;

            new public string Constructor;

            new public string Method;

            new public string PropertyGetter;

            new public string PropertySetter;

        }
        internal class RegisterInfoForGenerate : RegisterInfo
        {
            public Type Type;

            public string WrapperName;

            public new List<MemberRegisterInfoForGenerate> Members;
        }
        internal class RegisterInfoGenerator
        {
            private class MRICollector
            {

                private Dictionary<string, MemberRegisterInfoForGenerate> Collector = new Dictionary<string, MemberRegisterInfoForGenerate>();
                private Dictionary<string, MemberRegisterInfoForGenerate> CollectorStatic = new Dictionary<string, MemberRegisterInfoForGenerate>();

                internal void Add(string Name, MemberRegisterInfoForGenerate newMRI, bool isStatic)
                {
                    Dictionary<string, MemberRegisterInfoForGenerate> dict = isStatic ? CollectorStatic : Collector;
                    MemberRegisterInfoForGenerate oldMRI;
                    if (dict.TryGetValue(Name, out oldMRI))
                    {
                        if ((int)Enum.Parse(typeof(BindingMode), newMRI.UseBindingMode) > (int)Enum.Parse(typeof(BindingMode), oldMRI.UseBindingMode))
                            oldMRI.UseBindingMode = newMRI.UseBindingMode;
                    }
                    else
                    {
                        dict.Add(Name, newMRI);
                    }
                }

                internal List<MemberRegisterInfoForGenerate> GetAllMember()
                {
                    return Collector.Select(kv => kv.Value).Concat(CollectorStatic.Select(kv => kv.Value)).ToList();
                }
            }

            public static List<RegisterInfoForGenerate> GetRegisterInfos(List<Type> genTypes, HashSet<Type> blittableCopyTypes)
            {
                BindingFlags flag = BindingFlags.DeclaredOnly | BindingFlags.Instance | BindingFlags.Static | BindingFlags.Public;

                return genTypes.Where(type => 
                        !(type.IsEnum || type.IsArray || (Generator.Utils.IsDelegate(type) && type != typeof(Delegate)))
                    )
                    .Select(type =>
                    {
                        var Collector = new MRICollector();

                        var ctors = type.GetConstructors(flag).ToArray();
                        var hasParamlessCtor = false;
                        foreach (var m in ctors)
                        {
                            if (m.GetParameters().Length == 0) hasParamlessCtor = true;
                            Collector.Add(m.Name, new MemberRegisterInfoForGenerate
                            {
                                Name = m.Name,
                                UseBindingMode = Utils.getBindingMode(m).ToString(),
                                MemberType = "Constructor",
                                IsStatic = false,

                                Constructor = "Constructor",
                            }, false);
                        }
                        if (!hasParamlessCtor && type.IsValueType)
                        {
                            Collector.Add(".ctor", new MemberRegisterInfoForGenerate
                            {
                                Name = ".ctor",
                                UseBindingMode = "FastBinding",
                                MemberType = "Constructor",
                                IsStatic = false,

                                Constructor = "Constructor",
                            }, false);
                        }

                        foreach (var m in Puerts.Utils.GetMethodAndOverrideMethod(type, flag)
                                    .Where(m => !Utils.IsNotSupportedMember(m))
                                    .Where(m => Puerts.Utils.IsNotGenericOrValidGeneric(m))
                                    .ToArray()
                        )
                        {
                            if (m.DeclaringType == type && m.IsSpecialName && m.Name.StartsWith("op_") && m.IsStatic)
                            {
                                if (m.Name == "op_Explicit" || m.Name == "op_Implicit") continue;
                                Collector.Add(m.Name, new MemberRegisterInfoForGenerate
                                {
                                    Name = m.Name,
                                    UseBindingMode = Utils.getBindingMode(m).ToString(),
                                    MemberType = "Method",
                                    IsStatic = m.IsStatic,

                                    Method = "O_" + m.Name,
                                }, false);
                            }
                            else if (!m.IsSpecialName)
                            {

                                Collector.Add(m.Name, new MemberRegisterInfoForGenerate
                                {
                                    Name = m.Name,
                                    UseBindingMode = Utils.getBindingMode(m).ToString(),
                                    MemberType = "Method",
                                    IsStatic = m.IsStatic,

                                    Method = (m.IsStatic ? "F_" : "M_") + m.Name,
                                }, m.IsStatic);
                            }
                        }

                        foreach (var m in Puerts
                                    .Editor
                                    .Generator
                                    .Utils
                                    .GetExtensionMethods(type, new HashSet<Type>(genTypes))
                                    .Where(m => !Utils.IsNotSupportedMember(m))
                                    .Where(m => !m.IsGenericMethodDefinition || Puerts.Utils.IsNotGenericOrValidGeneric(m)).ToArray()
                                    .Where(m => genTypes == null ? true : genTypes.Contains(m.DeclaringType))
                                    .ToArray()
                        )
                        {
                            Collector.Add(m.Name, new MemberRegisterInfoForGenerate
                            {
                                Name = m.Name,
                                UseBindingMode = Utils.getBindingMode(m).ToString(),
                                MemberType = "Method",
                                IsStatic = false,

                                Method = "M_" + m.Name,
                            }, false);
                        }

                        foreach (var m in type
                                    .GetEvents(Utils.Flags)
                                    .Where(m => !Utils.IsNotSupportedMember(m))
                                    .ToArray()
                        )
                        {
                            var addMethod = m.GetAddMethod();
                            var removeMethod = m.GetRemoveMethod();

                            if (addMethod != null && addMethod.IsPublic)
                            {
                                Collector.Add("add_" + m.Name, new MemberRegisterInfoForGenerate
                                {
                                    Name = "add_" + m.Name,
                                    UseBindingMode = Utils.getBindingMode(m).ToString(),
                                    MemberType = "Method",
                                    IsStatic = addMethod.IsStatic,

                                    Method = "A_" + m.Name,
                                }, false);
                            }
                            if (removeMethod != null && removeMethod.IsPublic)
                            {
                                Collector.Add("remove_" + m.Name, new MemberRegisterInfoForGenerate
                                {
                                    Name = "remove_" + m.Name,
                                    UseBindingMode = Utils.getBindingMode(m).ToString(),
                                    MemberType = "Method",
                                    IsStatic = removeMethod.IsStatic,

                                    Method = "R_" + m.Name,
                                }, false);
                            }
                        }

                        foreach (var m in type
                                    .GetProperties(flag)
                                    .Where(m => !Utils.IsNotSupportedMember(m))
                                    .ToArray()
                        )
                        {
                            if (m.GetIndexParameters().GetLength(0) == 1)
                            {
                                var getMethod = m.GetGetMethod();
                                var setMethod = m.GetSetMethod();
                                if (getMethod != null && getMethod.IsPublic)
                                {
                                    Collector.Add("get_Item", new MemberRegisterInfoForGenerate
                                    {
                                        Name = "get_Item",
                                        UseBindingMode = Utils.getBindingMode(m).ToString(),
                                        MemberType = "Method",
                                        IsStatic = getMethod.IsStatic,

                                        Method = "GetItem",
                                    }, false);
                                }
                                if (setMethod != null && setMethod.IsPublic)
                                {
                                    Collector.Add("set_Item", new MemberRegisterInfoForGenerate
                                    {
                                        Name = "set_Item",
                                        UseBindingMode = Utils.getBindingMode(m).ToString(),
                                        MemberType = "Method",
                                        IsStatic = setMethod.IsStatic,

                                        Method = "SetItem",
                                    }, false);
                                }
                            }
                            else if (m.GetIndexParameters().GetLength(0) == 0 && !m.IsSpecialName)
                            {

                                Collector.Add(m.Name, new MemberRegisterInfoForGenerate
                                {
                                    Name = m.Name,
                                    UseBindingMode = Utils.getBindingMode(m).ToString(),
                                    MemberType = "Property",
                                    IsStatic = m.GetAccessors(false).Any(x => x.IsStatic),

                                    PropertyGetter = m.GetGetMethod() != null ? "G_" + m.Name : null,
                                    PropertySetter = m.GetSetMethod() != null ? "S_" + m.Name : null,
                                }, m.GetAccessors(false).Any(x => x.IsStatic));
                            }
                        }

                        foreach (var m in type
                            .GetFields(flag)
                            .Where(f => !Utils.IsNotSupportedMember(f))
                            .ToArray()
                        )
                        {
                            Collector.Add(m.Name, new MemberRegisterInfoForGenerate
                            {
                                Name = m.Name,
                                UseBindingMode = Utils.getBindingMode(m).ToString(),
                                MemberType = "Property",
                                IsStatic = m.IsStatic,

                                PropertyGetter = "G_" + m.Name,
                                PropertySetter = !m.IsInitOnly && !m.IsLiteral ? "S_" + m.Name : null,
                            }, m.IsStatic);
                        }

                        return new RegisterInfoForGenerate
                        {
                            WrapperName = Utils.GetWrapTypeName(type),

                            BlittableCopy = blittableCopyTypes.Contains(type),

                            Type = type,

                            Members = Collector.GetAllMember(),
                        };
                    })
                    .ToList();
            }
        }
    }
}
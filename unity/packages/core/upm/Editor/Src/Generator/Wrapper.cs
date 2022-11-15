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

namespace Puerts.Editor
{
    namespace Generator
    {

        namespace Wrapper
        {
            public class LazyMemberCollector
            {
                public Dictionary<string, LazyMemberRegisterInfo> LazyMembers = new Dictionary<string, LazyMemberRegisterInfo>();

                public void Add(MethodInfo m)
                {
                    if (LazyMembers.ContainsKey(m.Name)) return;

                    LazyMembers.Add(m.Name, new LazyMemberRegisterInfo
                    {
                        Name = m.Name,
                        IsStatic = m.IsStatic,
                        Type = LazyMemberType.Method
                    });
                }
                public void Add(ConstructorInfo m)
                {
                    if (LazyMembers.ContainsKey(m.Name)) return;

                    LazyMembers.Add(m.Name, new LazyMemberRegisterInfo
                    {
                        Name = m.Name,
                        IsStatic = m.IsStatic,
                        Type = LazyMemberType.Constructor
                    });
                }
                public void Add(FieldInfo f)
                {
                    if (LazyMembers.ContainsKey(f.Name)) return;

                    LazyMembers.Add(f.Name, new LazyMemberRegisterInfo
                    {
                        Name = f.Name,
                        IsStatic = f.IsStatic,
                        Type = LazyMemberType.Field,
                        HasGetter = true,
                        HasSetter = !f.IsInitOnly && !f.IsLiteral
                    });
                }
                public void Add(PropertyInfo p)
                {
                    if (LazyMembers.ContainsKey(p.Name)) return;

                    var getMethod = p.GetGetMethod();
                    var setMethod = p.GetSetMethod();
                    bool isStatic = getMethod == null ? setMethod.IsStatic : getMethod.IsStatic;

                    LazyMembers.Add(p.Name, new LazyMemberRegisterInfo
                    {
                        Name = p.Name,
                        IsStatic = isStatic,
                        Type = LazyMemberType.Property,
                        HasGetter = getMethod != null && getMethod.IsPublic,
                        HasSetter = setMethod != null && setMethod.IsPublic
                    });
                }

                public bool Contains(string name)
                {
                    return LazyMembers.ContainsKey(name);
                }

                public void Remove(string name)
                {
                    LazyMembers.Remove(name);
                }
                public LazyMemberRegisterInfo[] ToArray()
                {
                    return LazyMembers.Select(kv => kv.Value).ToArray();
                }
            }

            public class StaticWrapperInfo
            {

                public class TypeGenericArgumentsGenInfo {
                    public string Name;
                    public string[] Constraints;
                }
                public string Name;
                public string WrapClassName;
                public string CSharpTypeName;
                public bool IsGenericWrapper;
                public TypeGenericArgumentsGenInfo[] GenericArgumentsInfo;
                public string[] Namespaces;
                public MethodGenInfo[] Methods;
                public bool IsValueType;
                public MethodGenInfo Constructor;
                public PropertyGenInfo[] Properties;
                public IndexGenInfo[] GetIndexs;
                public IndexGenInfo[] SetIndexs;
                public MethodGenInfo[] Operators;
                public EventGenInfo[] Events;
                public LazyMemberRegisterInfo[] LazyMembers;
                public bool BlittableCopy;

                public static StaticWrapperInfo FromType(Type type, List<Type> genTypes)
                {
                    bool IsGenericWrapper = false;
                    TypeGenericArgumentsGenInfo[] GenericArgumentsInfos = null;
#if PUERTS_GENERAL || UNITY_2019_OR_NEWER
                    // 如果是泛型类，且泛型参数对于PuerTS来说是一个NativeObject类型，则Wrapper可以用泛型处理。
                    // 这里要先识别出NativeObject的参数位置，并将其替换
                    if (type.IsGenericType) {
                        var genericArguments = type.GetGenericArguments();
                        if (
                            genericArguments
                                .Where((t, index) => !t.IsPrimitive && t != typeof(System.String) && t != typeof(DateTime))
                                .Count() > 0
                        )
                        {
                            var definitionType = type.GetGenericTypeDefinition();
                            var definitionGenericArguments = definitionType.GetGenericArguments();
                            IsGenericWrapper = true;
                            type = definitionType.MakeGenericType(
                                definitionGenericArguments.Select((dType, index)=> {
                                    Type t = genericArguments[index];
                                    if (!t.IsPrimitive && t != typeof(System.String) && t != typeof(DateTime)) return dType;
                                    else return t;
                                }).ToArray()
                            );

                            GenericArgumentsInfos = definitionGenericArguments.Select((ga, index) =>
                            {
                                Type t = genericArguments[index];
                                if (!(!t.IsPrimitive && t != typeof(System.String) && t != typeof(DateTime))) return null;

                                var constraintsInfo = new List<string>();

                                var contraintTypes = ga.GetGenericParameterConstraints();
                                GenericParameterAttributes constraints = ga.GenericParameterAttributes &
                                    GenericParameterAttributes.SpecialConstraintMask;

                                bool hasValueTypeConstraint = false;
                                for (var i = 0; i < contraintTypes.Length; i++)
                                {
                                    if (contraintTypes[i] == typeof(System.ValueType))
                                    {
                                        hasValueTypeConstraint = true;
                                        continue;
                                    }
                                    constraintsInfo.Add(contraintTypes[i].GetFriendlyName());
                                }
                                if ((constraints & GenericParameterAttributes.ReferenceTypeConstraint) != 0)
                                    constraintsInfo.Add("class");
                                if (hasValueTypeConstraint && (constraints & GenericParameterAttributes.DefaultConstructorConstraint) != 0 && (constraints & GenericParameterAttributes.NotNullableValueTypeConstraint) != 0)
                                    constraintsInfo.Add("struct");
                                else if ((constraints & GenericParameterAttributes.DefaultConstructorConstraint) != 0)
                                    constraintsInfo.Add("new()");

                                var genericArgumentsGenInfo = new TypeGenericArgumentsGenInfo();
                                genericArgumentsGenInfo.Constraints = constraintsInfo.ToArray();
                                genericArgumentsGenInfo.Name = ga.Name;

                                return genericArgumentsGenInfo;
                            }).Where(t => t != null).ToArray();
                        }
                    }
#endif
                    // 关于懒绑定的成员函数：先全部丢进lazy收集器中。尔后如果发现有同名方法是不lazy的，那么它也要变成不lazy
                    // 做这个事情的原因是目前还没法做到重载级别的lazy。
                    LazyMemberCollector lazyCollector = new LazyMemberCollector();

                    var methodLists = Puerts.Utils.GetMethodAndOverrideMethod(type, Utils.Flags)
                        .Where(m => !Utils.IsNotSupportedMember(m))
                        .Where(m => !m.IsSpecialName && Puerts.Utils.IsNotGenericOrValidGeneric(m))
                        .Where(m => 
                        { 
                            BindingMode mode = Utils.getBindingMode(m);
                            if (mode == BindingMode.DontBinding) return false;
                            if (mode == BindingMode.LazyBinding) lazyCollector.Add(m); 
                            return true; 
                        })
                        .ToArray();

                    var extensionMethodsList = Puerts.Editor.Generator.Utils.GetExtensionMethods(type, new HashSet<Type>(genTypes));
                    if (extensionMethodsList != null)
                    {
                        extensionMethodsList = new List<MethodInfo>(extensionMethodsList)
                            .Where(m => !Utils.IsNotSupportedMember(m))
                            .Where(m => !m.IsGenericMethodDefinition || Puerts.Utils.IsNotGenericOrValidGeneric(m)).ToArray();
                        if (genTypes != null)
                        {
                            extensionMethodsList = extensionMethodsList.Where(m => genTypes.Contains(m.DeclaringType)).ToArray();
                        }
                        extensionMethodsList
                            .Where(m => 
                            { 
                                BindingMode mode = Utils.getBindingMode(m);
                                if (mode == BindingMode.DontBinding) return false;
                                if (mode == BindingMode.LazyBinding) lazyCollector.Add(m); 
                                return true; 
                            });
                    }

                    foreach (var m in methodLists)
                    {
                        if (lazyCollector.Contains(m.Name) && Utils.getBindingMode(m) != BindingMode.LazyBinding)
                        {
                            lazyCollector.Remove(m.Name);
                        }
                    }
                    if (extensionMethodsList != null)
                    {
                        foreach (var m in extensionMethodsList)
                        {
                            if (lazyCollector.Contains(m.Name) && Utils.getBindingMode(m) != BindingMode.LazyBinding)
                            { 
                                lazyCollector.Remove(m.Name); 
                            }
                        }
                    }

                    var methodGroups = methodLists
                        .Where(m => !lazyCollector.Contains(m.Name))
                        .GroupBy(m => new MethodKey { Name = m.Name, IsStatic = m.IsStatic })
                        .ToDictionary(i => i.Key, i => i.Cast<MethodBase>().ToList());
                    var extensionMethodGroup = extensionMethodsList != null ? extensionMethodsList
                        .Where(m => !lazyCollector.Contains(m.Name))
                        .GroupBy(m => new MethodKey { Name = m.Name, IsStatic = false })
                        .ToDictionary(i => i.Key, i => i.Cast<MethodBase>().ToList()) : new Dictionary<MethodKey, List<MethodBase>>();

                    var indexs = type.GetProperties(Utils.Flags)
                        .Where(m => !Utils.IsNotSupportedMember(m))
                        .Where(p => p.GetIndexParameters().GetLength(0) == 1)
                        .Select(p => IndexGenInfo.FromPropertyInfo(p))
                        .ToArray();
                    var operatorGroups = type.GetMethods(Utils.Flags)
                        .Where(m => !Utils.IsNotSupportedMember(m) && m.IsSpecialName && m.Name.StartsWith("op_") && m.IsStatic)
                        .Where(m =>
                        { 
                            if (m.Name == "op_Explicit" || m.Name == "op_Implicit")  { lazyCollector.Add(m); return false; }
                            BindingMode mode = Utils.getBindingMode(m);
                            if (mode == BindingMode.DontBinding) return false;
                            if (mode == BindingMode.LazyBinding) { lazyCollector.Add(m); return false; }
                            return true; 
                        })
                        .GroupBy(m => new MethodKey { Name = m.Name, IsStatic = m.IsStatic })
                        .Select(i => i.Cast<MethodBase>().ToList());
                    var constructors = type.GetConstructors(Utils.Flags)
                        .Where(m => !Utils.IsNotSupportedMember(m))
                        .Where(m =>
                        { 
                            BindingMode mode = Utils.getBindingMode(m);
                            if (mode == BindingMode.DontBinding) return false;
                            // constrcutor is not allowed to be lazy
                            // if (mode == BindingMode.LazyBinding) { lazyCollector.Add(m); return false; }
                            return true; 
                        })
                        .Cast<MethodBase>()
                        .ToList();
                    
                    return new StaticWrapperInfo
                    {
                        WrapClassName = Utils.GetWrapTypeName(type),
                        Namespaces = (extensionMethodsList != null ? extensionMethodsList
                            .Select(m => m.DeclaringType.Namespace)
                            .Where(name => !string.IsNullOrEmpty(name)) : new string[0])
                            .Concat(new[] { "System" })
                            .Distinct()
                            .ToArray(),
                        Name = type.GetFriendlyName(),
                        IsValueType = type.IsValueType,
                        IsGenericWrapper = IsGenericWrapper,
                        GenericArgumentsInfo = GenericArgumentsInfos,

                        Methods = methodGroups
                            .Select(kv =>
                            {
                                List<MethodBase> exOverloads = null;
                                extensionMethodGroup.TryGetValue(kv.Key, out exOverloads);
                                extensionMethodGroup.Remove(kv.Key);
                                return MethodGenInfo.FromType(type, false, kv.Value, exOverloads);
                            })
                            .Concat(
                                extensionMethodGroup.Select(kv => MethodGenInfo.FromType(type, false, null, kv.Value))
                            )
                            .ToArray(),
                        Constructor = !type.IsAbstract ? MethodGenInfo.FromType(type, true, constructors) : null,
                        Properties = type.GetProperties(Utils.Flags)
                            .Where(p => !Utils.IsNotSupportedMember(p))
                            .Where(p => !p.IsSpecialName && p.GetIndexParameters().GetLength(0) == 0)
                            .Where(p =>
                            { 
                                BindingMode mode = Utils.getBindingMode(p);
                                if (mode == BindingMode.DontBinding) return false;
                                if (mode == BindingMode.LazyBinding) { lazyCollector.Add(p); return false; }
                                return true; 
                            })
                            .Select(p => PropertyGenInfo.FromPropertyInfo(p))
                            .Concat(
                                type.GetFields(Utils.Flags)
                                    .Where(f => !Utils.IsNotSupportedMember(f))
                                    .Where(f =>
                                    { 
                                        BindingMode mode = Utils.getBindingMode(f);
                                        if (mode == BindingMode.DontBinding) return false;
                                        if (mode == BindingMode.LazyBinding) { lazyCollector.Add(f); return false; }
                                        return true; 
                                    })
                                    .Select(f => PropertyGenInfo.FromFieldInfo(f))
                            )
                            .ToArray(),
                        GetIndexs = indexs.Where(i => i.HasGetter).ToArray(),
                        SetIndexs = indexs.Where(i => i.HasSetter).ToArray(),
                        Operators = operatorGroups.Select(o => MethodGenInfo.FromType(type, false, o)).ToArray(),
                        Events = type.GetEvents(Utils.Flags)
                            .Where(m => !Utils.IsNotSupportedMember(m))
                            .Where(e =>
                            { 
                                BindingMode mode = Utils.getBindingMode(e);
                                if (mode == BindingMode.DontBinding) return false;
                                if (mode == BindingMode.LazyBinding) 
                                { 
                                    var adder = e.GetAddMethod();
                                    var remover = e.GetRemoveMethod();
                                    if (adder != null && adder.IsPublic) lazyCollector.Add(adder);
                                    if (remover != null && remover.IsPublic) lazyCollector.Add(remover);

                                    return false; 
                                }
                                return true; 
                            })
                            .Select(e => EventGenInfo.FromEventInfo(e))
                            .ToArray(),

                        LazyMembers = lazyCollector.ToArray()
                    };
                }
            }

            public class DataTypeInfo
            {
                public string TypeName; // If it is a methodGenInfo, TypeName represents the return type
                public bool IsEnum;
                public string UnderlyingTypeName;
            }

            // represent a javascript function's parameter
            public class ParameterGenInfo : DataTypeInfo
            {
                public bool IsIn;
                public bool IsOut;
                public bool IsByRef;
                public string ExpectJsType;
                public string ExpectCsType; 
                public bool IsParams;
                public string DefaultValue;

                public static ParameterGenInfo FromParameterInfo(ParameterInfo parameterInfo)
                {
                    bool isParams = parameterInfo.IsDefined(typeof(ParamArrayAttribute), false);
                    JsValueType ExpectJsType = isParams ?
                        GeneralGetterManager.GetJsTypeMask(parameterInfo.ParameterType.GetElementType()) :
                        GeneralGetterManager.GetJsTypeMask(parameterInfo.ParameterType);
                    var result = new ParameterGenInfo()
                    {
                        IsOut = !parameterInfo.IsIn && parameterInfo.IsOut && parameterInfo.ParameterType.IsByRef,
                        IsIn = parameterInfo.IsIn,
                        IsByRef = parameterInfo.ParameterType.IsByRef,
                        TypeName = Utils.RemoveRefAndToConstraintType(parameterInfo.ParameterType).GetFriendlyName(),
                        ExpectJsType = Utils.ToCode(ExpectJsType),
                        IsParams = isParams
                    };
                    if (result.IsParams)
                    {
                        result.TypeName = Utils.RemoveRefAndToConstraintType(parameterInfo.ParameterType.GetElementType()).GetFriendlyName();
                    }
                    result.ExpectCsType = string.Format("typeof({0})", result.TypeName);//((ExpectJsType & JsValueType.NativeObject) == JsValueType.NativeObject) ? string.Format("typeof({0})", result.TypeName) : "null";
                    result.DefaultValue = ConvertDefaultValueToString(parameterInfo.DefaultValue, result.TypeName);
                    Utils.FillEnumInfo(result, parameterInfo.ParameterType);
                    return result;
                }

                private static string ConvertDefaultValueToString(object value, string typeName)
                {
                    if (value != null)
                    {
                        Type valueType = value.GetType();
                        if (valueType == typeof(string))
                        {
                            return "\"" + value + "\"";
                        }
                        else if (valueType.IsEnum)
                        {
                            return valueType.FullName.Replace("+", ".") + "." + value.ToString();
                        } 
                        else if (valueType.IsPrimitive)
                        {
                            if (valueType == typeof(bool)) 
                                return value.ToString().ToLower();
                            else if (valueType == typeof(float)) 
                            {
                                if ((float)value == float.PositiveInfinity) return nameof(Single) + "." + nameof(float.PositiveInfinity);
                                if ((float)value == float.NegativeInfinity) return nameof(Single) + "." + nameof(float.NegativeInfinity);
                                if ((float)value == float.NaN) return nameof(Single) + "." + nameof(float.NaN);
                                return value.ToString() + "f";
                            }
                            else if (valueType == typeof(double))
                            {
                                if ((double)value == double.PositiveInfinity) return nameof(Double) + "." + nameof(double.PositiveInfinity);
                                if ((double)value == double.NegativeInfinity) return nameof(Double) + "." + nameof(double.NegativeInfinity);
                                if ((double)value == double.NaN) return nameof(Double) + "." + nameof(double.NaN);

                                return value.ToString();
                            } 
                            else if (valueType == typeof(char)) 
                                return "(char)" + ((ushort)((char)value)); 

                            return value.ToString();
                        }
                    }

                    return "default(" + typeName + ")";
                }
            }

            // represent a javascript class's property
            public class PropertyGenInfo : DataTypeInfo
            {
                public string Name;
                public bool IsStatic;
                public bool HasGetter;
                public bool HasSetter;

                public static PropertyGenInfo FromPropertyInfo(PropertyInfo propertyInfo)
                {
                    var getMethod = propertyInfo.GetGetMethod();
                    var setMethod = propertyInfo.GetSetMethod();
                    bool isStatic = getMethod == null ? setMethod.IsStatic : getMethod.IsStatic;
                    var result = new PropertyGenInfo()
                    {
                        Name = propertyInfo.Name,
                        TypeName = propertyInfo.PropertyType.GetFriendlyName(),
                        IsStatic = isStatic,
                        HasGetter = getMethod != null && getMethod.IsPublic,
                        HasSetter = setMethod != null && setMethod.IsPublic
                    };
                    Utils.FillEnumInfo(result, propertyInfo.PropertyType);
                    return result;
                }

                public static PropertyGenInfo FromFieldInfo(FieldInfo fieldInfo)
                {
                    var result = new PropertyGenInfo()
                    {
                        Name = fieldInfo.Name,
                        TypeName = fieldInfo.FieldType.GetFriendlyName(),
                        IsStatic = fieldInfo.IsStatic,
                        HasGetter = true,
                        HasSetter = !fieldInfo.IsInitOnly && !fieldInfo.IsLiteral
                    };
                    Utils.FillEnumInfo(result, fieldInfo.FieldType);
                    return result;
                }
            }

            // represent a javascript class's index getter/setter
            public class IndexGenInfo : DataTypeInfo
            {
                public ParameterGenInfo IndexParameter;
                public bool HasGetter;
                public bool HasSetter;

                public static IndexGenInfo FromPropertyInfo(PropertyInfo propertyInfo)
                {
                    var getMethod = propertyInfo.GetGetMethod();
                    var setMethod = propertyInfo.GetSetMethod();
                    var result = new IndexGenInfo()
                    {
                        TypeName = propertyInfo.PropertyType.GetFriendlyName(),
                        IndexParameter = ParameterGenInfo.FromParameterInfo(propertyInfo.GetIndexParameters()[0]),
                        HasGetter = getMethod != null && getMethod.IsPublic,
                        HasSetter = setMethod != null && setMethod.IsPublic,
                    };
                    Utils.FillEnumInfo(result, propertyInfo.PropertyType);
                    return result;
                }
            }

            // represent a add/remove method in javascript class
            public class EventGenInfo : DataTypeInfo
            {
                public string Name;
                public bool IsStatic;
                public bool HasAdd;
                public bool HasRemove;

                public static EventGenInfo FromEventInfo(EventInfo eventInfo)
                {
                    var addMethod = eventInfo.GetAddMethod();
                    var removeMethod = eventInfo.GetRemoveMethod();
                    bool isStatic = addMethod == null ? removeMethod.IsStatic : addMethod.IsStatic;
                    return new EventGenInfo()
                    {
                        Name = eventInfo.Name,
                        TypeName = eventInfo.EventHandlerType.GetFriendlyName(),
                        IsStatic = isStatic,
                        HasAdd = addMethod != null && addMethod.IsPublic,
                        HasRemove = removeMethod != null && removeMethod.IsPublic,
                    };
                }
            }

            // represent a method's overloads in javascript class
            public class OverloadGenInfo : DataTypeInfo
            {
                public ParameterGenInfo[] ParameterInfos;
                public ParameterGenInfo[] EllipsisedParameterInfos;
                public bool IsVoid;
                public bool HasParams;

                private string ParameterInfosMark = null;
                internal string GetParameterInfosMark()
                {
                    if (ParameterInfosMark == null)
                    {
                        ParameterInfosMark = String.Join("|", ParameterInfos.Select(pinfo => pinfo.TypeName).ToArray());
                    }

                    return ParameterInfosMark;
                }

                public static List<OverloadGenInfo> FromMethodBase(MethodBase methodBase, bool extensionMethod = false)
                {
                    List<OverloadGenInfo> ret = new List<OverloadGenInfo>();
                    if (methodBase is MethodInfo)
                    {
                        var methodInfo = methodBase as MethodInfo;
                        var parameters = methodInfo.GetParameters().Skip(extensionMethod ? 1 : 0).ToArray();
                        OverloadGenInfo mainInfo = new OverloadGenInfo()
                        {
                            ParameterInfos = parameters.Select(info => ParameterGenInfo.FromParameterInfo(info)).ToArray(),
                            EllipsisedParameterInfos = new ParameterGenInfo[] {},
                            TypeName = Utils.RemoveRefAndToConstraintType(methodInfo.ReturnType).GetFriendlyName(),
                            IsVoid = methodInfo.ReturnType == typeof(void),
                        };
                        Utils.FillEnumInfo(mainInfo, methodInfo.ReturnType);
                        mainInfo.HasParams = mainInfo.ParameterInfos.Any(info => info.IsParams);
                        ret.Add(mainInfo);
                        var ps = parameters;
                        for (int i = ps.Length - 1; i >= 0; i--)
                        {
                            OverloadGenInfo optionalInfo = null;
                            if (ps[i].IsOptional || mainInfo.ParameterInfos[i].IsParams)
                            {
                                ParameterInfo[] pinfos = parameters.Take(i).ToArray();
                                ParameterInfo[] ellipsisedPInfos = parameters.Where((item, index) => index >= i).ToArray();
                                if (!Puerts.Utils.IsNotGenericOrValidGeneric((MethodInfo)methodBase, pinfos)) continue;
                                optionalInfo = new OverloadGenInfo()
                                {
                                    ParameterInfos = pinfos.Select(info => ParameterGenInfo.FromParameterInfo(info)).ToArray(),
                                    EllipsisedParameterInfos = ellipsisedPInfos.Select(info => ParameterGenInfo.FromParameterInfo(info)).ToArray(),
                                    TypeName = Utils.RemoveRefAndToConstraintType(methodInfo.ReturnType).GetFriendlyName(),
                                    IsVoid = methodInfo.ReturnType == typeof(void),
                                }; 
                                Utils.FillEnumInfo(optionalInfo, methodInfo.ReturnType);
                                optionalInfo.HasParams = optionalInfo.ParameterInfos.Any(info => info.IsParams);
                                ret.Add(optionalInfo); 
                            }
                            else
                            {
                                break; 
                            }
                        }
                    }
                    else if (methodBase is ConstructorInfo)
                    {
                        var constructorInfo = methodBase as ConstructorInfo;
                        OverloadGenInfo mainInfo = new OverloadGenInfo()
                        {
                            ParameterInfos = constructorInfo.GetParameters().Select(info => ParameterGenInfo.FromParameterInfo(info)).ToArray(),
                            EllipsisedParameterInfos = new ParameterGenInfo[] {},
                            TypeName = constructorInfo.DeclaringType.GetFriendlyName(),
                            IsVoid = false,
                        };
                        mainInfo.HasParams = mainInfo.ParameterInfos.Any(info => info.IsParams);
                        ret.Add(mainInfo);
                        var ps = constructorInfo.GetParameters();
                        for (int i = ps.Length - 1; i >= 0; i--)
                        {
                            OverloadGenInfo optionalInfo = null;
                            if (ps[i].IsOptional || mainInfo.ParameterInfos[i].IsParams)
                            {
                                optionalInfo = new OverloadGenInfo()
                                {
                                    ParameterInfos = constructorInfo.GetParameters().Select(info => ParameterGenInfo.FromParameterInfo(info)).Take(i).ToArray(),
                                    EllipsisedParameterInfos = new ParameterGenInfo[] {},
                                    TypeName = constructorInfo.DeclaringType.GetFriendlyName(),
                                    IsVoid = false,
                                };
                                optionalInfo.HasParams = optionalInfo.ParameterInfos.Any(info => info.IsParams);
                                ret.Add(optionalInfo);
                            }
                            else
                            {
                                break;
                            }
                        }
                    }
                    else
                    {
                        throw new NotSupportedException();
                    }

                    return ret;
                }
            }

            // represent a method in javascript class
            public class MethodGenInfo
            {
                public string Name;
                public bool IsStatic;
                public OverloadGenInfo[][] OverloadGroups;
                public bool HasOverloads;
                public int OverloadCount;
                public bool IsLazyMember;
                public static MethodGenInfo FromType(Type type, bool isCtor, List<MethodBase> overloads, List<MethodBase> extensionOverloads = null)
                {
                    var ret = new List<OverloadGenInfo>();
                    if (overloads != null)
                    {
                        foreach (var iBase in overloads)
                        {
                            ret.AddRange(OverloadGenInfo.FromMethodBase(iBase));
                        }
                    }
                    if (extensionOverloads != null)
                    {
                        foreach (var iBase in extensionOverloads)
                        {
                            ret.AddRange(OverloadGenInfo.FromMethodBase(iBase, true));
                        }
                    }

                    string name;
                    bool isStatic;
                    if (isCtor)
                    {
                        if (type.IsValueType)//值类型添加无参构造
                        {
                            if (!ret.Exists(m => m.ParameterInfos.Length == 0))
                            {
                                ret.Add(new OverloadGenInfo()
                                {
                                    ParameterInfos = new ParameterGenInfo[] { },
                                    TypeName = type.GetFriendlyName(),
                                    IsVoid = false
                                });
                            }
                        }
                        // 如果是构造函数此处固定赋值，因为像结构体的情况overloads不一定有含有元素
                        name = ".ctor";
                        isStatic = false;

                    }
                    else if (overloads != null)
                    {
                        name = overloads[0].Name;
                        isStatic = overloads[0].IsStatic;
                    }
                    else
                    {
                        name = extensionOverloads[0].Name;
                        isStatic = false;
                    }

                    var result = new MethodGenInfo()
                    {
                        Name = name,
                        IsStatic = isStatic,
                        HasOverloads = ret.Count > 1,
                        OverloadCount = ret.Count,
                        OverloadGroups = ret
                            .GroupBy(m => m.ParameterInfos.Length + (m.HasParams ? 0 : 9999))
                            .Select(lst =>
                            {
                                // some overloads are from the base class, some overloads may have the same parameters, so we need to distinct the overloads with same parameterinfo
                                Dictionary<string, OverloadGenInfo> distincter = new Dictionary<string, OverloadGenInfo>();

                                foreach (var overload in lst)
                                {
                                    // ambigious call handle.
                                    // use the first overload. same as reflection mode
                                    string mark = overload.GetParameterInfosMark();
                                    OverloadGenInfo existedOverload = null;
                                    if (!distincter.TryGetValue(mark, out existedOverload))
                                    {
                                        distincter.Add(mark, overload); 
                                    }
                                }
                                return distincter.Values.ToList().Where(item => item != null).ToArray();
                            })
                            .Where(lst => lst.Count() > 0)
                            .ToArray()
                    };
                    return result;
                }
            }
        }

    }

}

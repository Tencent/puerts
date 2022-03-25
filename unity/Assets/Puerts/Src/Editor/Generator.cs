/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if !PUERTS_GENERAL
using UnityEngine;
using UnityEditor;
#endif
using System;
using System.Linq;
using System.Reflection;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Runtime.CompilerServices;

namespace Puerts.Editor
{
    namespace Generator {
        class Utils {
            public const BindingFlags Flags = BindingFlags.Public | BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly;

            public static List<MethodInfo> filters = null;

            public static string GetGenName(Type type)
            {
                if (type.IsGenericType)
                {
                    var argNames = type.GetGenericArguments().Select(x => GetGenName(x)).ToArray();
                    return type.FullName.Split('`')[0] + "<" + string.Join(", ", argNames) + ">";
                }
                else
                    return type.FullName;
            }

            public static Dictionary<Type, bool> blittableTypes = new Dictionary<Type, bool>()
            {
                { typeof(byte), true },
                { typeof(sbyte), true },
                { typeof(short), true },
                { typeof(ushort), true },
                { typeof(int), true },
                { typeof(uint), true },
                { typeof(long), true },
                { typeof(ulong), true },
                { typeof(float), true },
                { typeof(double), true },
                { typeof(IntPtr), true },
                { typeof(UIntPtr), true },
                { typeof(char), false },
                { typeof(bool), false }
            };

            public static bool isBlittableType(Type type)
            {
                if (type.IsValueType)
                {
                    bool ret;
                    if (!blittableTypes.TryGetValue(type, out ret))
                    {
                        ret = true;
                        if (type.IsPrimitive) return false;
                        foreach (var fieldInfo in type.GetFields(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.DeclaredOnly))
                        {
                            if (!isBlittableType(fieldInfo.FieldType))
                            {
                                ret = false;
                                break;
                            }
                        }
                        blittableTypes[type] = ret;
                    }
                    return ret;
                }
                else
                {
                    return false;
                }
            }

            public static bool IsDelegate(Type type)
            {
                if (type == null)
                {
                    return false;
                }
                else if (type == typeof(Delegate))
                {
                    return true;
                }
                else
                {
                    return IsDelegate(type.BaseType);
                }
            }

            public static bool IsStatic(PropertyInfo propertyInfo)
            {
                var getMethod = propertyInfo.GetGetMethod();
                var setMethod = propertyInfo.GetSetMethod();
                return getMethod == null ? setMethod.IsStatic : getMethod.IsStatic;
            }
            public enum BindingMode {
                FastBinding = 0,
                SlowBinding = 1,
                LazyBinding = 2,
                DontBinding = 3,
            }

            internal static BindingMode getBindingMode(MemberInfo mbi) 
            {
                if (filters != null && filters.Count > 0)
                {
                    foreach (var filter in filters)
                    {
                        if ((bool)filter.Invoke(null, new object[] { mbi }))
                        {
                            return BindingMode.LazyBinding;
                        }
                    }
                }
                return BindingMode.FastBinding;
            }

            public static bool isFiltered(MemberInfo mbi, bool notFiltEII = false)
            {
                if (mbi == null) return false;
                ObsoleteAttribute oa = mbi.GetCustomAttributes(typeof(ObsoleteAttribute), false).FirstOrDefault() as ObsoleteAttribute;
                if (oa != null/* && oa.IsError*/) //希望只过滤掉Error类别过时方法可以把oa.IsError加上
                {
                    return true;
                }

                if (mbi is FieldInfo)
                {
                    FieldInfo fi = (mbi as FieldInfo);
                    if (fi.FieldType.IsPointer)
                    {
                        return true;
                    }
                    if (!fi.IsPublic)
                    {
                        if (notFiltEII)
                        {
                            return !fi.Name.Contains("."); /*explicit interface implementation*/
                        }
                        return true;
                    }
                };
                if (mbi is PropertyInfo)
                {
                    PropertyInfo pi = (mbi as PropertyInfo);
                    if (pi.PropertyType.IsPointer)
                    {
                        return true;
                    }
                    if (!(
                        (pi.GetGetMethod() != null && pi.GetGetMethod().IsPublic) ||
                        (pi.GetSetMethod() != null && pi.GetSetMethod().IsPublic)
                    ))
                    {
                        if (notFiltEII)
                        {
                            return !pi.Name.Contains(".");
                        }
                        return true;
                    }
                }
                if (mbi is MethodInfo)
                {
                    MethodInfo mi = mbi as MethodInfo;
                    if (mi.ReturnType.IsPointer)
                    {
                        return true;
                    }
                    if (!mi.IsPublic)
                    {
                        if (notFiltEII)
                        {
                            return !mi.Name.Contains(".");
                        }
                        return true;
                    }
                }

                if (mbi is MethodBase)
                {
                    MethodBase mb = mbi as MethodBase;
                    if (mb.GetParameters().Any(pInfo => pInfo.ParameterType.IsPointer))
                    {
                        return true;
                    }
                    if (!mb.IsPublic)
                    {
                        return true;
                    }
                }
                return false;
            }
        
            public static bool isDefined(MethodBase test, Type type)
            {
    #if PUERTS_GENERAL
                return test.GetCustomAttributes(false).Any(ca => ca.GetType().ToString() == type.ToString());
    #else
                return test.IsDefined(type, false);
    #endif
            }
        
            public static Type ToConstraintType(Type type, bool isGenericTypeDefinition)
            {
                if (!isGenericTypeDefinition && type.IsGenericParameter && type.BaseType != null && type.BaseType != typeof(object) && type.BaseType != typeof(ValueType)) return ToConstraintType(type.BaseType, false);
                else return type;
            }
        
            public static bool IsGetterOrSetter(MethodInfo method)
            {
                return (method.IsSpecialName && method.Name.StartsWith("get_") && method.GetParameters().Length != 1)
                    || (method.IsSpecialName && method.Name.StartsWith("set_") && method.GetParameters().Length != 2);
            }

            public static void FillEnumInfo(GenClass.DataTypeInfo info, Type type)
            {
                if (type.IsEnum)
                {
                    info.IsEnum = true;
                    info.UnderlyingTypeName = Enum.GetUnderlyingType(type).GetFriendlyName();
                }
            }

            public static string GetWrapTypeName(Type type)
            {
                return type.ToString().Replace("+", "_").Replace(".", "_").Replace("`", "_").Replace("&", "_").Replace("[", "_").Replace("]", "_").Replace(",", "_") + "_Wrap";
            }

            public static string ToCode(JsValueType ExpectJsType)
            {
                return string.Join(" | ", ExpectJsType.ToString().Split(',').Select(s => "Puerts.JsValueType." + s.Trim()).ToArray());
            }

            public static Type RemoveRefAndToConstraintType(Type type)
            {
                if (type.IsGenericParameter && type.BaseType != null && type.BaseType != typeof(object) && type.BaseType != typeof(ValueType)) return RemoveRefAndToConstraintType(type.BaseType);
                else if (type.IsByRef) return RemoveRefAndToConstraintType(type.GetElementType());
                else return type;
            }

            public static Dictionary<Type, MethodInfo[]> extensionMethods = null;

            public static Type getExtendedType(MethodInfo method)
            {
                var type = method.GetParameters()[0].ParameterType;
                return type.IsGenericParameter ? type.BaseType : type;
            }

            public static MethodInfo[] GetExtensionMethods(Type checkType, HashSet<Type> genTypeSet)
            {
                if (extensionMethods == null)
                {
                    extensionMethods = (from type in genTypeSet
                                        from method in type.GetMethods(BindingFlags.Static | BindingFlags.Public)
                                        where isDefined(method, typeof(ExtensionAttribute)) && Puerts.Utils.IsMethodSupportGenerate(method)
                                        group method by getExtendedType(method)).ToDictionary(g => g.Key, g => g.ToArray());
                }
                MethodInfo[] ret;
                if (!extensionMethods.TryGetValue(checkType, out ret))
                {
                    return new MethodInfo[] { };
                }
                return ret;
            }

            // #lizard forgives
            public static string GetTsTypeName(Type type, bool isParams = false)
            {
                if (type == typeof(int))
                    return "number";
                if (type == typeof(uint))
                    return "number";
                else if (type == typeof(short))
                    return "number";
                else if (type == typeof(byte))
                    return "number";
                else if (type == typeof(sbyte))
                    return "number";
                else if (type == typeof(char))
                    return "number";
                else if (type == typeof(ushort))
                    return "number";
                else if (type == typeof(bool))
                    return "boolean";
                else if (type == typeof(long))
                    return "bigint";
                else if (type == typeof(ulong))
                    return "bigint";
                else if (type == typeof(float))
                    return "number";
                else if (type == typeof(double))
                    return "number";
                else if (type == typeof(string))
                    return "string";
                else if (type == typeof(void))
                    return "void";
                else if (type == typeof(DateTime))
                    return "Date";
                else if (type == typeof(Puerts.ArrayBuffer))
                    return "ArrayBuffer";
                else if (type == typeof(object))
                    return "any";
                else if (type == typeof(Delegate) || type == typeof(Puerts.GenericDelegate))
                    return "Function";
                else if (type.IsByRef)
                    return "$Ref<" + GetTsTypeName(type.GetElementType()) + ">";
                else if (type.IsArray)
                    return isParams ? (GetTsTypeName(type.GetElementType()) + "[]") : ("System.Array$1<" + GetTsTypeName(type.GetElementType()) + ">");
                else if (type.IsGenericType)
                {
                    var fullName = type.FullName == null ? type.ToString() : type.FullName;
                    var parts = fullName.Replace('+', '.').Split('`');
                    var argTypenames = type.GetGenericArguments()
                        .Select(x => GetTsTypeName(x)).ToArray();
                    return parts[0] + '$' + parts[1].Split('[')[0] + "<" + string.Join(", ", argTypenames) + ">";
                }
                else if (type.FullName == null)
                    return type.ToString();
                else
                    return type.FullName.Replace('+', '.');
            }

            public static Type GetRawType(Type type)
            {
                if (type.IsByRef || type.IsArray)
                {
                    return GetRawType(type.GetElementType());
                }
                if (type.IsGenericType) return type.GetGenericTypeDefinition();
                return type;
            }
        }

        namespace GenClass {
            public class TypeGenInfo
            {
                public string Name;
                public string WrapClassName;
                public string[] Namespaces;
                public MethodGenInfo[] Methods;
                public bool IsValueType;
                public MethodGenInfo Constructor;
                public PropertyGenInfo[] Properties;
                public IndexGenInfo[] GetIndexs;
                public IndexGenInfo[] SetIndexs;
                public MethodGenInfo[] Operators;
                public EventGenInfo[] Events;
                public bool BlittableCopy;

                public static TypeGenInfo FromType(Type type, List<Type> genTypes)
                {
                    var methodGroups = Puerts.Utils.GetMethodAndOverrideMethod(type, Utils.Flags)
                        .Where(m => !Utils.isFiltered(m))
                        .Where(m => !m.IsSpecialName && Puerts.Utils.IsMethodSupportGenerate(m))
                        .GroupBy(m => new MethodKey { Name = m.Name, IsStatic = m.IsStatic, IsLazyMember = Utils.getBindingMode(m) == Utils.BindingMode.LazyBinding })
                        .ToDictionary(i => i.Key, i => i.Cast<MethodBase>().ToList());
                    var extensionMethods = Puerts.Utils.GetExtensionMethodsOf(type);
                    if (extensionMethods != null)
                    {
                        extensionMethods = extensionMethods
                            .Where(m => !Utils.isFiltered(m))
                            .Where(m => !m.IsGenericMethodDefinition || Puerts.Utils.IsMethodSupportGenerate(m));
                        if (genTypes != null)
                        {
                            extensionMethods = extensionMethods.Where(m => genTypes.Contains(m.DeclaringType));
                        }
                    }
                    var extensionMethodGroup = extensionMethods != null ? extensionMethods
                        .GroupBy(m => new MethodKey { Name = m.Name, IsStatic = false, IsLazyMember = Utils.getBindingMode(m) == Utils.BindingMode.LazyBinding })
                        .ToDictionary(i => i.Key, i => i.Cast<MethodBase>().ToList()) : new Dictionary<MethodKey, List<MethodBase>>();

                    var indexs = type.GetProperties(Utils.Flags)
                        .Where(m => !Utils.isFiltered(m))
                        .Where(p => p.GetIndexParameters().GetLength(0) == 1)
                        .Select(p => IndexGenInfo.FromPropertyInfo(p))
                        .ToArray();
                    var operatorGroups = type.GetMethods(Utils.Flags)
                        .Where(m => !Utils.isFiltered(m) && m.IsSpecialName && m.Name.StartsWith("op_") && m.IsStatic)
                        .Where(m => m.Name != "op_Explicit" && m.Name != "op_Implicit")
                        .GroupBy(m => new MethodKey { Name = m.Name, IsStatic = m.IsStatic, IsLazyMember = Utils.getBindingMode(m) == Utils.BindingMode.LazyBinding })
                        .Select(i => i.Cast<MethodBase>().ToList());

                    var constructors = type.GetConstructors(Utils.Flags)
                        .Where(m => !Utils.isFiltered(m) && Utils.getBindingMode(m) != Utils.BindingMode.LazyBinding)
                        .Cast<MethodBase>()
                        .ToList();

                    return new TypeGenInfo
                    {
                        WrapClassName = Utils.GetWrapTypeName(type),
                        Namespaces = (extensionMethods != null ? extensionMethods
                            .Select(m => m.DeclaringType.Namespace)
                            .Where(name => !string.IsNullOrEmpty(name)) : new string[0])
                            .Concat(new[] { "System" })
                            .Distinct()
                            .ToArray(),
                        Name = type.GetFriendlyName(),
                        IsValueType = type.IsValueType,
                        
                        Methods = methodGroups
                            .Select(kv =>
                            {
                                List<MethodBase> exOverloads = null;
                                extensionMethodGroup.TryGetValue(kv.Key, out exOverloads);
                                extensionMethodGroup.Remove(kv.Key);
                                return MethodGenInfo.FromType(type, false, kv.Value, exOverloads);
                            })
                            .Concat(
                                extensionMethodGroup
                                    .Select(kv => MethodGenInfo.FromType(type, false, null, kv.Value))
                            )
                            .ToArray(),
                        Constructor = !type.IsAbstract ? MethodGenInfo.FromType(type, true, constructors) : null,
                        Properties = type.GetProperties(Utils.Flags)
                            .Where(m => !Utils.isFiltered(m))
                            .Where(p => !p.IsSpecialName && p.GetIndexParameters().GetLength(0) == 0)
                            .Select(p => PropertyGenInfo.FromPropertyInfo(p))
                            .Concat(
                                type.GetFields(Utils.Flags)
                                    .Where(m => !Utils.isFiltered(m))
                                    .Select(f => PropertyGenInfo.FromFieldInfo(f))
                            )
                            .ToArray(),
                        GetIndexs = indexs.Where(i => i.HasGetter).ToArray(),
                        SetIndexs = indexs.Where(i => i.HasSetter).ToArray(),
                        Operators = operatorGroups.Select(m => MethodGenInfo.FromType(type, false, m)).ToArray(),
                        Events = type.GetEvents(Utils.Flags)
                            .Where(m => !Utils.isFiltered(m))
                            .Select(e => EventGenInfo.FromEventInfo(e))
                            .ToArray(),
                    };
                }
            }

            public class DataTypeInfo
            {
                public string TypeName;
                public bool IsEnum;
                public string UnderlyingTypeName;
            }

            // represent a javascript function's parameter
            public class ParameterGenInfo : DataTypeInfo
            {
                public bool IsOut;
                public bool IsByRef;
                public string ExpectJsType;
                public string ExpectCsType;
                public bool IsParams;
                        
                public static ParameterGenInfo FromParameterInfo(ParameterInfo parameterInfo)
                {
                    bool isParams = parameterInfo.IsDefined(typeof(ParamArrayAttribute), false);
                    JsValueType ExpectJsType = isParams ?
                        GeneralGetterManager.GetJsTypeMask(parameterInfo.ParameterType.GetElementType()) : 
                        GeneralGetterManager.GetJsTypeMask(parameterInfo.ParameterType);
                    var result = new ParameterGenInfo()
                    {
                        IsOut = !parameterInfo.IsIn && parameterInfo.IsOut && parameterInfo.ParameterType.IsByRef,
                        IsByRef = parameterInfo.ParameterType.IsByRef,
                        TypeName = Utils.RemoveRefAndToConstraintType(parameterInfo.ParameterType).GetFriendlyName(),
                        ExpectJsType = Utils.ToCode(ExpectJsType),
                        IsParams = isParams,
                    };
                    if (result.IsParams)
                    {
                        result.TypeName = Utils.RemoveRefAndToConstraintType(parameterInfo.ParameterType.GetElementType()).GetFriendlyName();
                    }
                    result.ExpectCsType = ((ExpectJsType & JsValueType.NativeObject) == JsValueType.NativeObject) ? string.Format("typeof({0})", result.TypeName) : "null";
                    Utils.FillEnumInfo(result, parameterInfo.ParameterType);
                    return result;
                }
            }

            // represent a javascript class's property
            public class PropertyGenInfo : DataTypeInfo
            {
                public string Name;
                public bool IsStatic;
                public bool HasGetter;
                public bool HasSetter;
                // 虽然还没实现，但是先占坑。Register阶段用反射代替
                public bool IsLazyMember;

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
                        HasSetter = setMethod != null && setMethod.IsPublic,
                        IsLazyMember = Utils.getBindingMode(propertyInfo) == Utils.BindingMode.LazyBinding
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
                        HasSetter = !fieldInfo.IsInitOnly && !fieldInfo.IsLiteral,
                        IsLazyMember = Utils.getBindingMode(fieldInfo) == Utils.BindingMode.LazyBinding
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
                // 虽然还没实现，但是先占坑。Register阶段用反射代替
                public bool IsLazyMember;

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
                    result.IsLazyMember = Utils.getBindingMode(propertyInfo) == Utils.BindingMode.LazyBinding;
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
                // 虽然还没实现，但是先占坑。Register阶段用反射代替
                public bool IsLazyMember;

                public static EventGenInfo FromEventInfo(EventInfo eventInfo)
                {
                    var addMethod = eventInfo.GetAddMethod();
                    var removeMethod = eventInfo.GetRemoveMethod();
                    bool isStatic = addMethod == null ? removeMethod.IsStatic : addMethod.IsStatic;
                    return new EventGenInfo()
                    {
                        IsLazyMember = Utils.getBindingMode(eventInfo) == Utils.BindingMode.LazyBinding,
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
                public bool IsVoid;
                public bool HasParams;
                public bool EllipsisedParameters;

                private string ParameterInfosMark = null;
                internal string GetParameterInfosMark() 
                {
                    if (ParameterInfosMark == null)
                    {
                        ParameterInfosMark = String.Join("|", ParameterInfos.Select(pinfo=> pinfo.TypeName).ToArray());
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
                            TypeName = Utils.RemoveRefAndToConstraintType(methodInfo.ReturnType).GetFriendlyName(),
                            IsVoid = methodInfo.ReturnType == typeof(void),
                            EllipsisedParameters = false,
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
                                optionalInfo = new OverloadGenInfo()
                                {
                                    ParameterInfos = parameters.Select(info => ParameterGenInfo.FromParameterInfo(info)).Take(i).ToArray(),
                                    TypeName = Utils.RemoveRefAndToConstraintType(methodInfo.ReturnType).GetFriendlyName(),
                                    IsVoid = methodInfo.ReturnType == typeof(void),
                                    EllipsisedParameters = true,
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
                            TypeName = constructorInfo.DeclaringType.GetFriendlyName(),
                            IsVoid = false,
                            EllipsisedParameters = false,
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
                                    TypeName = constructorInfo.DeclaringType.GetFriendlyName(),
                                    IsVoid = false,
                                    EllipsisedParameters = true,
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

                    var FirstOverload = overloads != null && overloads.Count > 0 ? overloads[0] : (
                        extensionOverloads != null && extensionOverloads.Count > 0 ? extensionOverloads[0] : null
                    );

                    var result = new MethodGenInfo()
                    {
                        Name = name,
                        IsStatic = isStatic,
                        IsLazyMember = FirstOverload == null ? false : Utils.getBindingMode(FirstOverload) == Utils.BindingMode.LazyBinding,
                        HasOverloads = ret.Count > 1,
                        OverloadCount = ret.Count,
                        OverloadGroups = ret
                            .GroupBy(m => m.ParameterInfos.Length + (m.HasParams ? 0 : 9999))
                            .Select(lst => {
                                // some overloads are from the base class, some overloads may have the same parameters, so we need to distinct the overloads with same parameterinfo
                                Dictionary<string, OverloadGenInfo> distincter = new Dictionary<string, OverloadGenInfo>();

                                foreach (var overload in lst) 
                                {
                                    string mark = overload.GetParameterInfosMark();
                                    OverloadGenInfo existedOverload = null;
                                    if (!distincter.TryGetValue(mark, out existedOverload)) 
                                    {
                                        distincter.Add(mark, overload);
                                    }
                                    else 
                                    {
                                        // if the value in distincter is null. Means that this overload is unavailable(will cause ambigious)
                                        if (existedOverload == null) 
                                        {
                                            continue;
                                        }
                                        if (!overload.EllipsisedParameters)
                                        {
                                            if (existedOverload == null || existedOverload.EllipsisedParameters) 
                                            {
                                                distincter[mark] = overload;
                                            }
                                        }
                                        else 
                                        {
                                            if (existedOverload.EllipsisedParameters)
                                            {
                                                distincter[mark] = null;
                                            }
                                        }
                                    }
                                }
                                return distincter.Values.ToList().Where(item=> item != null).ToArray();
                            })
                            .Where(lst => lst.Count() > 0)
                            .ToArray()
                    };
                    return result;
                }
            }
        }

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
                        .Where(m => !Utils.isFiltered(m, true) && !Utils.IsGetterOrSetter(m) && (type.IsGenericTypeDefinition && !m.IsGenericMethodDefinition || Puerts.Utils.IsMethodSupportGenerate(m)))
                        .Cast<MethodBase>()
                        .Distinct();

                    if (!type.IsAbstract && !type.IsInterface)
                    {
                        methods = methods.Concat(type.GetConstructors(Utils.Flags).Where(m => !Utils.isFiltered(m)).Cast<MethodBase>());
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
                        Properties = genTypeSet.Contains(type) ? type.GetFields(Utils.Flags).Where(m => !Utils.isFiltered(m, true))
                            .Select(f => new TsPropertyGenInfo()
                            {
                                Name = f.Name,
                                Document = DocResolver.GetTsDocument(f),
                                TypeName = Utils.GetTsTypeName(f.FieldType),
                                IsStatic = f.IsStatic
                            })
                            .Concat(
                                type.GetProperties(Utils.Flags).Where(m => m.Name != "Item").Where(m => !Utils.isFiltered(m, true))
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

        public class Menu {
#if !PUERTS_GENERAL
            [MenuItem("Puerts/Generate Code", false, 1)]
            public static void GenerateCode()
            {
                var start = DateTime.Now;
                var saveTo = Configure.GetCodeOutputDirectory();
                Directory.CreateDirectory(saveTo);
                Directory.CreateDirectory(Path.Combine(saveTo, "Typing/csharp"));
                GenerateWrapper(saveTo);
                GenerateDTS(saveTo);
                Debug.Log("finished! use " + (DateTime.Now - start).TotalMilliseconds + " ms");
                AssetDatabase.Refresh();

                Utils.filters = null;
            }

            [MenuItem("Puerts/Generate index.d.ts", false, 1)]
            public static void GenerateDTS()
            {
                var start = DateTime.Now;
                var saveTo = Configure.GetCodeOutputDirectory();
                Directory.CreateDirectory(saveTo);
                Directory.CreateDirectory(Path.Combine(saveTo, "Typing/csharp"));
                GenerateDTS(saveTo);
                Debug.Log("finished! use " + (DateTime.Now - start).TotalMilliseconds + " ms");
                AssetDatabase.Refresh();
                
                Utils.filters = null;
            }

            [MenuItem("Puerts/Generate index.d.ts ESM compatible (unstable)", false, 1)]
            public static void GenerateDTSESM()
            {
                var start = DateTime.Now;
                var saveTo = Configure.GetCodeOutputDirectory();
                Directory.CreateDirectory(saveTo);
                Directory.CreateDirectory(Path.Combine(saveTo, "Typing/csharp"));
                GenerateDTS(saveTo, true);
                Debug.Log("finished! use " + (DateTime.Now - start).TotalMilliseconds + " ms");
                AssetDatabase.Refresh();
                
                Utils.filters = null;
            }

            [MenuItem("Puerts/Clear Generated Code", false, 2)]
            public static void ClearAll()
            {
                var saveTo = Configure.GetCodeOutputDirectory();
                if (Directory.Exists(saveTo))
                {
                    Directory.Delete(saveTo, true);
                    AssetDatabase.DeleteAsset(saveTo.Substring(saveTo.IndexOf("Assets") + "Assets".Length));
                    AssetDatabase.Refresh();
                }
            }

#endif
            public static Dictionary<string, List<KeyValuePair<object, int>>> configure;
            public static List<Type> genTypes;

            public static void GenerateDTS(string saveTo, bool esmMode = false, ILoader loader = null)
            {
                if (Utils.filters == null)
                {
                    Utils.filters = Configure.GetFilters();
                    configure = Configure.GetConfigureByTags(new List<string>() {
                        "Puerts.BindingAttribute",
                        "Puerts.BlittableCopyAttribute",
                        "Puerts.TypingAttribute",
                    });

                    genTypes = configure["Puerts.BindingAttribute"].Select(kv => kv.Key)
                        .Where(o => o is Type)
                        .Cast<Type>()
                        .Where(t => !t.IsGenericTypeDefinition && !t.Name.StartsWith("<"))
                        .Distinct()
                        .ToList();
                }

                var tsTypes = configure["Puerts.TypingAttribute"].Select(kv => kv.Key)
                    .Where(o => o is Type)
                    .Cast<Type>()
                    .Where(t => !t.IsGenericTypeDefinition)
                    .Concat(genTypes)
                    .Distinct();

                if (loader == null)
                {
                    loader = new DefaultLoader();
                }
                using (var jsEnv = new JsEnv(loader))
                {
                    jsEnv.UsingFunc<DTS.TypingGenInfo, bool, string>();
                    var typingRender = jsEnv.Eval<Func<DTS.TypingGenInfo, bool, string>>("require('puerts/templates/dts.tpl.cjs')");
                    using (StreamWriter textWriter = new StreamWriter(saveTo + "Typing/csharp/index.d.ts", false, Encoding.UTF8))
                    {
                        string fileContext = typingRender(DTS.TypingGenInfo.FromTypes(tsTypes), esmMode);
                        textWriter.Write(fileContext);
                        textWriter.Flush();
                    }
                }
            }


            public static void GenerateWrapper(string saveTo, ILoader loader = null)
            {
                if (Utils.filters == null)
                {
                    Utils.filters = Configure.GetFilters();
                    configure = Configure.GetConfigureByTags(new List<string>() {
                        "Puerts.BindingAttribute",
                        "Puerts.BlittableCopyAttribute",
                        "Puerts.TypingAttribute",
                    });

                    genTypes = configure["Puerts.BindingAttribute"].Select(kv => kv.Key)
                        .Where(o => o is Type)
                        .Cast<Type>()
                        .Where(t => !t.IsGenericTypeDefinition && !t.Name.StartsWith("<"))
                        .Distinct()
                        .ToList();
                }

                var blittableCopyTypes = new HashSet<Type>(configure["Puerts.BlittableCopyAttribute"].Select(kv => kv.Key)
                    .Where(o => o is Type)
                    .Cast<Type>()
                    .Where(t => !t.IsPrimitive && Utils.isBlittableType(t))
                    .Distinct());

                if (loader == null)
                {
                    loader = new DefaultLoader();
                }
                using (var jsEnv = new JsEnv(loader))
                {
                    var wrapRender = jsEnv.Eval<Func<GenClass.TypeGenInfo, string>>("require('puerts/templates/wrapper.tpl.cjs')");

                    var typeGenInfos = new List<GenClass.TypeGenInfo>();

                    Dictionary<string, bool> makeFileUniqueMap = new Dictionary<string, bool>();
                    foreach (var type in genTypes)
                    {
                        if (type.IsEnum || type.IsArray || (Generator.Utils.IsDelegate(type) && type != typeof(Delegate))) continue;
                        GenClass.TypeGenInfo typeGenInfo = GenClass.TypeGenInfo.FromType(type, genTypes);
                        typeGenInfo.BlittableCopy = blittableCopyTypes.Contains(type);
                        typeGenInfos.Add(typeGenInfo);
                        string filePath = saveTo + typeGenInfo.WrapClassName + ".cs";

                        int uniqueId = 1;
                        while (makeFileUniqueMap.ContainsKey(filePath.ToLower()))
                        {
                            filePath = saveTo + typeGenInfo.WrapClassName + "_" + uniqueId + ".cs";
                            uniqueId++;
                        }
                        makeFileUniqueMap.Add(filePath.ToLower(), true);

                        string fileContext = wrapRender(typeGenInfo);
                        using (StreamWriter textWriter = new StreamWriter(filePath, false, Encoding.UTF8))
                        {
                            textWriter.Write(fileContext);
                            textWriter.Flush();
                        }
                    }

                    var autoRegisterRender = jsEnv.Eval<Func<GenClass.TypeGenInfo[], string>>("require('puerts/templates/wrapper-reg.tpl.cjs')");
                    using (StreamWriter textWriter = new StreamWriter(saveTo + "AutoStaticCodeRegister.cs", false, Encoding.UTF8))
                    {
                        string fileContext = autoRegisterRender(typeGenInfos.ToArray());
                        textWriter.Write(fileContext);
                        textWriter.Flush();
                    }
                }
            }
        }
    }

}

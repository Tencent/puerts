/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using UnityEngine;
using UnityEditor;
using System;
using System.Linq;
using System.Reflection;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Runtime.CompilerServices;

namespace Puerts.Editor
{
    public class Generator
    {
        const BindingFlags Flags = BindingFlags.Public | BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly;

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

        static List<MethodInfo> filters;

        public class TypeGenInfo
        {
            public string Name;
            public string WrapClassName;
            public MethodGenInfo[] Methods;
            public bool IsValueType;
            public MethodGenInfo Constructor;
            public PropertyGenInfo[] Properties;
            public IndexGenInfo[] GetIndexs;
            public IndexGenInfo[] SetIndexs;
            public MethodGenInfo[] Operators;
            public EventGenInfo[] Events;
            public bool BlittableCopy;
        }

        public class DataTypeInfo
        {
            public string TypeName;
            public bool IsEnum;
            public string UnderlyingTypeName;
        }

        public class ParameterGenInfo : DataTypeInfo
        {
            public bool IsOut;
            public bool IsByRef;
            public string ExpectJsType;
            public string ExpectCsType;
            public bool IsParams;
        }

        public class PropertyGenInfo : DataTypeInfo
        {
            public string Name;
            public bool IsStatic;
            public bool HasGetter;
            public bool HasSetter;
        }

        public class IndexGenInfo : DataTypeInfo
        {
            public ParameterGenInfo IndexParameter;
            public bool HasGetter;
            public bool HasSetter;
        }

        public class EventGenInfo : DataTypeInfo
        {
            public string Name;
            public bool IsStatic;
            public bool HasAdd;
            public bool HasRemove;
        }

        public class OverloadGenInfo : DataTypeInfo
        {
            public ParameterGenInfo[] ParameterInfos;
            public bool IsVoid;
            public bool HasParams;
        }

        public class MethodGenInfo
        {
            public string Name;
            public bool IsStatic;
            public OverloadGenInfo[][] OverloadGroups;
            public bool HasOverloads;
            public int OverloadCount;
        }

        static string ToCode(JsValueType ExpectJsType)
        {
            return string.Join(" | ", ExpectJsType.ToString().Split(',').Select(s => "Puerts.JsValueType." + s.Trim()).ToArray());
        }

        static void FillEnumInfo(DataTypeInfo info, Type type)
        {
            if (type.IsEnum)
            {
                info.IsEnum = true;
                info.UnderlyingTypeName = Enum.GetUnderlyingType(type).GetFriendlyName();
            }
        }

        static Type RemoveRefAndToConstraintType(Type type)
        {
            if (type.IsGenericParameter && type.BaseType != null && type.BaseType != typeof(object) && type.BaseType != typeof(ValueType)) return RemoveRefAndToConstraintType(type.BaseType);
            else if (type.IsByRef) return RemoveRefAndToConstraintType(type.GetElementType());
            else return type;
        }

        static Type ToConstraintType(Type type, bool isGenericTypeDefinition)
        {
            if (!isGenericTypeDefinition && type.IsGenericParameter && type.BaseType != null && type.BaseType != typeof(object) && type.BaseType != typeof(ValueType)) return ToConstraintType(type.BaseType, false);
            else return type;
        }

        static ParameterGenInfo ToParameterGenInfo(ParameterInfo parameterInfo)
        {
            var ExpectJsType = GeneralGetterManager.GetJsTypeMask(parameterInfo.ParameterType);
            var result = new ParameterGenInfo()
            {
                IsOut = !parameterInfo.IsIn && parameterInfo.IsOut && parameterInfo.ParameterType.IsByRef,
                IsByRef = parameterInfo.ParameterType.IsByRef,
                TypeName = RemoveRefAndToConstraintType(parameterInfo.ParameterType).GetFriendlyName(),
                ExpectJsType = ToCode(ExpectJsType),
                IsParams = parameterInfo.IsDefined(typeof(ParamArrayAttribute), false),
            };
            if (result.IsParams)
            {
                result.TypeName = RemoveRefAndToConstraintType(parameterInfo.ParameterType.GetElementType()).GetFriendlyName();
            }
            result.ExpectCsType = ((ExpectJsType & JsValueType.NativeObject) == JsValueType.NativeObject) ? string.Format("typeof({0})", result.TypeName) : "null";
            FillEnumInfo(result, parameterInfo.ParameterType);
            return result;
        }

        static IndexGenInfo ToIndexGenInfo(PropertyInfo propertyInfo)
        {
            var getMethod = propertyInfo.GetGetMethod();
            var setMethod = propertyInfo.GetSetMethod();
            var result = new IndexGenInfo()
            {
                TypeName = propertyInfo.PropertyType.GetFriendlyName(),
                IndexParameter = ToParameterGenInfo(propertyInfo.GetIndexParameters()[0]),
                HasGetter = getMethod != null && getMethod.IsPublic,
                HasSetter = setMethod != null && setMethod.IsPublic,
            };
            FillEnumInfo(result, propertyInfo.PropertyType);
            return result;
        }

        static PropertyGenInfo ToPropertyGenInfo(PropertyInfo propertyInfo)
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
            };
            FillEnumInfo(result, propertyInfo.PropertyType);
            return result;
        }

        static EventGenInfo ToEventGenInfo(EventInfo eventInfo)
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

        static PropertyGenInfo ToPropertyGenInfo(FieldInfo fieldInfo)
        {
            var result = new PropertyGenInfo()
            {
                Name = fieldInfo.Name,
                TypeName = fieldInfo.FieldType.GetFriendlyName(),
                IsStatic = fieldInfo.IsStatic,
                HasGetter = true,
                HasSetter = !fieldInfo.IsInitOnly && !fieldInfo.IsLiteral,
            };
            FillEnumInfo(result, fieldInfo.FieldType);
            return result;
        }

        static MethodGenInfo ToMethodGenInfo(Type type, bool isCtor, List<MethodBase> overloads)
        {
            var ret = new List<OverloadGenInfo>();
            foreach (var iBase in overloads)
            {
                ret.AddRange(ToOverloadGenInfo(iBase));
            }
            if (type.IsValueType && isCtor)//值类型添加无参构造
            {
                if (!overloads.Exists(m => m.GetParameters().Length == 0))
                {
                    ret.Add(new OverloadGenInfo()
                    {
                        ParameterInfos = new ParameterGenInfo[] { },
                        TypeName = type.GetFriendlyName(),
                        IsVoid = false
                    });
                }
            }
            var result = new MethodGenInfo()
            {
                Name = overloads[0].Name,
                IsStatic = overloads[0].IsStatic,
                HasOverloads = ret.Count > 1,
                OverloadCount = ret.Count,
                OverloadGroups = ret.GroupBy(m => m.ParameterInfos.Length + (m.HasParams ? 0 : 9999)).Select(lst => lst.ToArray()).ToArray()
            };
            return result;
        }

        static List<OverloadGenInfo> ToOverloadGenInfo(MethodBase methodBase)
        {
            List<OverloadGenInfo> ret = new List<OverloadGenInfo>();
            if (methodBase is MethodInfo)
            {
                var methodInfo = methodBase as MethodInfo;
                OverloadGenInfo mainInfo = new OverloadGenInfo()
                {
                    ParameterInfos = methodInfo.GetParameters().Select(info => ToParameterGenInfo(info)).ToArray(),
                    TypeName = RemoveRefAndToConstraintType(methodInfo.ReturnType).GetFriendlyName(),
                    IsVoid = methodInfo.ReturnType == typeof(void)
                };
                FillEnumInfo(mainInfo, methodInfo.ReturnType);
                mainInfo.HasParams = mainInfo.ParameterInfos.Any(info => info.IsParams);
                ret.Add(mainInfo);
                var ps = methodInfo.GetParameters();
                for (int i = ps.Length - 1; i >= 0; i--)
                {
                    OverloadGenInfo optionalInfo = null;
                    if (ps[i].IsOptional)
                    {
                        optionalInfo = new OverloadGenInfo()
                        {
                            ParameterInfos = methodInfo.GetParameters().Select(info => ToParameterGenInfo(info)).Take(i).ToArray(),
                            TypeName = RemoveRefAndToConstraintType(methodInfo.ReturnType).GetFriendlyName(),
                            IsVoid = methodInfo.ReturnType == typeof(void)
                        };
                        FillEnumInfo(optionalInfo, methodInfo.ReturnType);
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
                    ParameterInfos = constructorInfo.GetParameters().Select(info => ToParameterGenInfo(info)).ToArray(),
                    TypeName = constructorInfo.DeclaringType.GetFriendlyName(),
                    IsVoid = false
                };
                mainInfo.HasParams = mainInfo.ParameterInfos.Any(info => info.IsParams);
                ret.Add(mainInfo);
                var ps = constructorInfo.GetParameters();
                for (int i = ps.Length - 1; i >= 0; i--)
                {
                    OverloadGenInfo optionalInfo = null;
                    if (ps[i].IsOptional)
                    {
                        optionalInfo = new OverloadGenInfo()
                        {
                            ParameterInfos = constructorInfo.GetParameters().Select(info => ToParameterGenInfo(info)).Take(i).ToArray(),
                            TypeName = constructorInfo.DeclaringType.GetFriendlyName(),
                            IsVoid = false
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

        static bool isDefined(MethodBase test, Type type)
        {
#if PUERTS_GENERAL
            return test.GetCustomAttributes(false).Any(ca => ca.GetType().ToString() == type.ToString());
#else
            return test.IsDefined(type, false);
#endif
        }

        static Dictionary<Type, MethodInfo[]> extensionMethods = null;

        static bool IsClass(Type type)
        {
#if !UNITY_WSA || UNITY_EDITOR
            return type.IsClass;
#else
            return type.GetTypeInfo().IsClass;
#endif
        }

        static Type getExtendedType(MethodInfo method)
        {
            var type = method.GetParameters()[0].ParameterType;
            return type.IsGenericParameter ? type.BaseType : type;
        }

        static MethodInfo[] GetExtensionMethods(Type checkType, HashSet<Type> genTypeSet)
        {
            if (extensionMethods == null)
            {
                extensionMethods = (from type in genTypeSet
                                       from method in type.GetMethods(BindingFlags.Static | BindingFlags.Public)
                                         where isDefined(method, typeof(ExtensionAttribute)) && Utils.IsSupportedMethod(method)
                                         group method by getExtendedType(method)).ToDictionary(g =>g.Key, g=>g.ToArray());
            }
            MethodInfo[] ret;
            if (!extensionMethods.TryGetValue(checkType, out ret))
            {
                return new MethodInfo[] { };
            }
            return ret;
        }

        static TypeGenInfo ToTypeGenInfo(Type type)
        {
            var methodGroups = type.GetMethods(Flags).Where(m => !isFiltered(m))
                .Where(m => !m.IsSpecialName && Puerts.Utils.IsSupportedMethod(m))
                .GroupBy(m => new MethodKey { Name = m.Name, IsStatic = m.IsStatic })
                .Select(i => i.Cast<MethodBase>().ToList());
            var indexs = type.GetProperties(Flags).Where(m => !isFiltered(m))
                .Where(p => p.GetIndexParameters().GetLength(0) == 1).Select(p => ToIndexGenInfo(p)).ToArray();
            var operatorGroups = type.GetMethods(Flags)
                .Where(m => !isFiltered(m) && m.IsSpecialName && m.Name.StartsWith("op_") && m.IsStatic)
                .Where(m => m.Name != "op_Explicit" && m.Name != "op_Implicit")
                .GroupBy(m => new MethodKey { Name = m.Name, IsStatic = m.IsStatic })
                .Select(i => i.Cast<MethodBase>().ToList());

            var constructors = type.GetConstructors(Flags).Where(m => !isFiltered(m)).Cast<MethodBase>().ToList();

            return new TypeGenInfo
            {
                WrapClassName = GetWrapTypeName(type),
                Name = type.GetFriendlyName(),
                Methods = methodGroups.Select(m => ToMethodGenInfo(type, false, m)).ToArray(),
                IsValueType = type.IsValueType,
                Constructor = (!type.IsAbstract && constructors.Count > 0) ? ToMethodGenInfo(type, true, constructors) : null,
                Properties = type.GetProperties(Flags)
                    .Where(m => !isFiltered(m))
                    .Where(p => !p.IsSpecialName && p.GetIndexParameters().GetLength(0) == 0)
                    .Select(p => ToPropertyGenInfo(p)).Concat(
                        type.GetFields(Flags).Where(m => !isFiltered(m)).Select(f => ToPropertyGenInfo(f))).ToArray(),
                GetIndexs = indexs.Where(i => i.HasGetter).ToArray(),
                SetIndexs = indexs.Where(i => i.HasSetter).ToArray(),
                Operators = operatorGroups.Select(m => ToMethodGenInfo(type, false, m)).ToArray(),
                Events = type.GetEvents(Flags).Where(m => !isFiltered(m)).Select(e => ToEventGenInfo(e)).ToArray(),
            };
        }

        static string GetWrapTypeName(Type type)
        {
            return type.ToString().Replace("+", "_").Replace(".", "_").Replace("`", "_").Replace("&", "_").Replace("[", "_").Replace("]", "_").Replace(",", "_") + "_Wrap";
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
                    var info = (TsParameterGenInfo)obj;
                    return this.Name == info.Name && this.TypeName == info.TypeName && this.IsByRef != info.IsByRef && this.IsParams != info.IsParams && this.IsOptional != info.IsOptional;
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
        }

        // #lizard forgives
        static string GetTsTypeName(Type type, bool isParams = false)
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
            else if (type == typeof(Delegate))
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

        static TsParameterGenInfo ToTsParameterGenInfo(ParameterInfo parameterInfo, bool isGenericTypeDefinition)
        {
            var isParams = parameterInfo.IsDefined(typeof(ParamArrayAttribute), false);
            return new TsParameterGenInfo()
            {
                Name = parameterInfo.Name,
                IsByRef = parameterInfo.ParameterType.IsByRef,
                TypeName = GetTsTypeName(ToConstraintType(parameterInfo.ParameterType, isGenericTypeDefinition), isParams),
                IsParams = isParams,
                IsOptional = parameterInfo.IsOptional
            };
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
                    var info = (TsMethodGenInfo)obj;
                    if (this.ParameterInfos.Length != info.ParameterInfos.Length || this.Name != info.Name || this.TypeName != info.TypeName || this.IsConstructor != info.IsConstructor || this.IsStatic != info.IsStatic)
                        return false;
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
        }

        public class TsPropertyGenInfo
        {
            public string Name;
            public string Document;
            public string TypeName;
            public bool IsStatic;
            public bool HasGetter;
            public bool HasSetter;
        }

        public static TsMethodGenInfo ToTsMethodGenInfo(MethodBase methodBase, bool isGenericTypeDefinition, bool skipExtentionMethodThis)
        {
            return new TsMethodGenInfo()
            {
                Name = methodBase.IsConstructor ? "constructor" : methodBase.Name,
                Document = DocResolver.GetTsDocument(methodBase), 
                ParameterInfos = methodBase.GetParameters()
                    .Skip(skipExtentionMethodThis && isDefined(methodBase, typeof(ExtensionAttribute)) ? 1 : 0)
                    .Select(info => ToTsParameterGenInfo(info, isGenericTypeDefinition)).ToArray(),
                TypeName = methodBase.IsConstructor ? "" : GetTsTypeName(ToConstraintType((methodBase as MethodInfo).ReturnType, isGenericTypeDefinition)),
                IsConstructor = methodBase.IsConstructor,
                IsStatic = methodBase.IsStatic,
            };
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
            public bool IsEnum;
            public string EnumKeyValues;
            public TsMethodGenInfo[] ExtensionMethods;
            public bool IsCheckOk = false;
        }

        public static bool IsGetterOrSetter(MethodInfo method)
        {
            return (method.IsSpecialName && method.Name.StartsWith("get_") && method.GetParameters().Length != 1)
                || (method.IsSpecialName && method.Name.StartsWith("set_") && method.GetParameters().Length != 2);
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

        static bool IsStatic(PropertyInfo propertyInfo)
        {
            var getMethod = propertyInfo.GetGetMethod();
            var setMethod = propertyInfo.GetSetMethod();
            return getMethod == null ? setMethod.IsStatic : getMethod.IsStatic;
        }

        static MethodInfo[] GetMethodsForTsTypeGen(Type type, HashSet<Type> genTypeSet)
        {
            var declMethods = type.GetMethods(Flags)
                .Where(m => m.GetBaseDefinition() == m || !genTypeSet.Contains(m.GetBaseDefinition().DeclaringType)).ToArray();

            var methodNames = declMethods.Select(m => m.Name).ToArray();

            return type.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.Static)
                .Where(m => genTypeSet.Contains(m.DeclaringType) && methodNames.Contains(m.Name))
                .Concat(declMethods).Distinct().ToArray();
        }

        public static TsTypeGenInfo ToTsTypeGenInfo(Type type, HashSet<Type> genTypeSet)
        {
            var result = new TsTypeGenInfo()
            {
                Name = type.Name.Replace('`', '$'),
                Document = DocResolver.GetTsDocument(type), 
                Methods = genTypeSet.Contains(type) ? (type.IsAbstract ? new MethodBase[] { } : type.GetConstructors(Flags).Where(m => !isFiltered(m)).Cast<MethodBase>())
                    .Concat(GetMethodsForTsTypeGen(type, genTypeSet)
                        .Where(m => !isFiltered(m) && !IsGetterOrSetter(m) && (type.IsGenericTypeDefinition && !m.IsGenericMethodDefinition || Puerts.Utils.IsSupportedMethod(m)))
                        .Cast<MethodBase>())
                    .Select(m => ToTsMethodGenInfo(m, type.IsGenericTypeDefinition, false)).ToArray() : new TsMethodGenInfo[] { },
                Properties = genTypeSet.Contains(type) ? type.GetFields(Flags).Where(m => !isFiltered(m))
                    .Select(f => new TsPropertyGenInfo() { Name = f.Name, Document = DocResolver.GetTsDocument(f),  TypeName = GetTsTypeName(f.FieldType), IsStatic = f.IsStatic })
                    .Concat(
                        type.GetProperties(Flags).Where(m => m.Name != "Item").Where(m => !isFiltered(m))
                        .Select(p => new TsPropertyGenInfo() { Name = p.Name, Document = DocResolver.GetTsDocument(p),  TypeName = GetTsTypeName(p.PropertyType), IsStatic = IsStatic(p), HasGetter = p.GetMethod != null && p.GetMethod.IsPublic, HasSetter = p.SetMethod != null && p.SetMethod.IsPublic }))
                    .ToArray() : new TsPropertyGenInfo[] { },
                IsGenericTypeDefinition = type.IsGenericTypeDefinition,
                IsDelegate = (IsDelegate(type) && type != typeof(Delegate)),
                IsInterface = type.IsInterface,
                Namespace = type.Namespace,
                ExtensionMethods = GetExtensionMethods(type, genTypeSet).Select(m => ToTsMethodGenInfo(m, type.IsGenericTypeDefinition, true)).ToArray()
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
                    var tsFuncDef = "(" + string.Join(", ", m.GetParameters().Select(p => p.Name + ": " + GetTsTypeName(p.ParameterType)).ToArray()) + ") => " + GetTsTypeName(m.ReturnType);
                    result.DelegateDef = tsFuncDef;
                }
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
                    Name = type.BaseType.IsGenericType ? GetTsTypeName(type.BaseType): type.BaseType.Name.Replace('`', '$'),
                    Document = DocResolver.GetTsDocument(type.BaseType), 
                    Namespace = type.BaseType.Namespace
                };
                if (type.BaseType.IsGenericType && type.BaseType.Namespace != null)
                {
                    result.BaseType.Name = result.BaseType.Name.Substring(type.BaseType.Namespace.Length + 1);
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

        public class TsNamespaceGenInfo
        {
            public string Name;
            public TsTypeGenInfo[] Types;
        }

        public class TsTypingGenInfo
        {
            public TsNamespaceGenInfo[] Namespaces;

            public TsTypeGenInfo[] Types;
        }

        static Type GetRawType(Type type)
        {
            if (type.IsByRef || type.IsArray)
            {
                return GetRawType(type.GetElementType());
            }
            if (type.IsGenericType) return type.GetGenericTypeDefinition();
            return type;
        }

        static bool isFiltered(MemberInfo mb)
        {
            if (mb == null) return false;
            ObsoleteAttribute oa = mb.GetCustomAttributes(typeof(ObsoleteAttribute), false).FirstOrDefault() as ObsoleteAttribute;
            if (oa != null/* && oa.IsError*/) //希望只过滤掉Error类别过时方法可以把oa.IsError加上
            {
                return true;
            }

            if (mb is FieldInfo && (mb as FieldInfo).FieldType.IsPointer) return true;
            if (mb is PropertyInfo && (mb as PropertyInfo).PropertyType.IsPointer) return true;
            if (mb is MethodInfo && (mb as MethodInfo).ReturnType.IsPointer) return true;

            if (filters != null && filters.Count > 0)
            {
                foreach (var filter in filters)
                {
                    if ((bool)filter.Invoke(null, new object[] { mb }))
                    {
                        return true;
                    }
                }
            }

            if (mb is MethodBase && (mb as MethodBase).GetParameters().Any(pInfo => pInfo.ParameterType.IsPointer)) return true;

            return false;
        }

        static void AddRefType(HashSet<Type> workTypes, HashSet<Type> refTypes, Type type)
        {
            if(workTypes.Contains(type)) return;
            workTypes.Add(type);

            var rawType = GetRawType(type);
				
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

            if (IsDelegate(type) && type != typeof(Delegate) && type != typeof(MulticastDelegate))
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
            
        }

        public class TypingGenInfo
        {
            public TsNamespaceGenInfo[] NamespaceInfos;

            public string TaskDef;
        }

        static TsMethodGenInfo[] GetMethodGenInfos(Dictionary<string, TsTypeGenInfo> tsGenTypeInfos, TsTypeGenInfo info, bool getBaseMethods)
        {
            var result = new List<TsMethodGenInfo>();
            if (info.Methods != null) result.AddRange(info.Methods);
            if (info.ExtensionMethods != null)
            {
                foreach (var m in info.ExtensionMethods)
                {
                    result.Add(new TsMethodGenInfo()
                    {
                        Name = m.Name,
                        Document = m.Document,
                        ParameterInfos = m.ParameterInfos,
                        IsConstructor = m.IsConstructor,
                        IsStatic = false,
                    });
                }
            }
            if (getBaseMethods && info.BaseType != null)
            {
                var baseInfo = info.BaseType;
                var baseName = (!string.IsNullOrEmpty(baseInfo.Namespace) ? (baseInfo.Namespace + ".") : "") + baseInfo.Name;
                if (tsGenTypeInfos.TryGetValue(baseName, out baseInfo))
                {
                    foreach (var m in GetMethodGenInfos(tsGenTypeInfos, baseInfo, true))
                    {
                        if (!result.Contains(m)) result.Add(m);
                    }
                }
            }
            return result.ToArray();
        }
        static Dictionary<string, List<TsMethodGenInfo>> SelectMethodGenInfos(Dictionary<string, TsTypeGenInfo> tsGenTypeInfos, TsTypeGenInfo info, bool getBaseMethods)
        {
            var result = new Dictionary<string, List<TsMethodGenInfo>>();
            foreach (var m in GetMethodGenInfos(tsGenTypeInfos, info, getBaseMethods))
            {
                if (!result.ContainsKey(m.Name))
                    result.Add(m.Name, new List<TsMethodGenInfo>());
                result[m.Name].Add(m);
            }
            return result;
        }
        static void CheckMethodGenInfos(Dictionary<string, TsTypeGenInfo> tsGenTypeInfos, TsTypeGenInfo info)
        {
            if (info.IsCheckOk || info.BaseType == null)
                return;

            var baseInfo = info.BaseType;
            var baseName = (!string.IsNullOrEmpty(baseInfo.Namespace) ? (baseInfo.Namespace + ".") : "") + baseInfo.Name;
            if (tsGenTypeInfos.TryGetValue(baseName, out baseInfo) && info.Methods != null && baseInfo.Methods != null)
            {
                CheckMethodGenInfos(tsGenTypeInfos, baseInfo);

                var methods1 = SelectMethodGenInfos(tsGenTypeInfos, baseInfo, true);
                var methods2 = SelectMethodGenInfos(tsGenTypeInfos, info, false);

                var select = new List<TsMethodGenInfo>(info.Methods);
                foreach (var pair in methods1)
                {
                    var name = pair.Key;
                    if (!methods2.ContainsKey(name))
                        continue;
                    var ms1 = pair.Value;
                    var ms2 = methods2[name];
                    if (ms2.Count == 0)
                        continue;
                    var diffms = new List<TsMethodGenInfo>();
                    foreach (var m1 in ms1)
                    {
                        var diff = true;
                        foreach (var m2 in ms2)
                        {
                            if (m1.Equals(m2)) { diff = false; break; }
                        }
                        if (diff) diffms.Add(m1);
                    }
                    if (ms2.Count + diffms.Count != ms1.Count)
                    {
                        select.AddRange(diffms);
                    }
                }
                info.Methods = select.ToArray();
            }
            info.IsCheckOk = true;
        }
        static TypingGenInfo ToTypingGenInfo(IEnumerable<Type> types)
        {
            HashSet<Type> genTypeSet = new HashSet<Type>();

            HashSet<Type> workTypes = new HashSet<Type>();
            HashSet<Type> refTypes = new HashSet<Type>();

            foreach (var type in types)
            {
                AddRefType(workTypes, refTypes, type);
                var defType = type.IsGenericType ? type.GetGenericTypeDefinition() : type;
                if (!genTypeSet.Contains(defType)) genTypeSet.Add(defType);
                foreach (var field in type.GetFields(Flags))
                {
                    AddRefType(workTypes, refTypes, field.FieldType);
                }

                foreach(var method in type.GetMethods(Flags))
                {
                    AddRefType(workTypes, refTypes, method.ReturnType);
                    foreach(var pinfo in method.GetParameters())
                    {
                        AddRefType(workTypes, refTypes, pinfo.ParameterType);
                    }
                }
                foreach(var constructor in type.GetConstructors())
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
                var info = ToTsTypeGenInfo(t, genTypeSet);
                var name = (string.IsNullOrEmpty(info.Namespace) ? "" : (info.Namespace + ".")) + info.Name;
                if (info.IsGenericTypeDefinition)
                    name += "<" + string.Join(",", info.GenericParameters) + ">";
                tsTypeGenInfos.Add(name, info);
            }
            foreach (var info in tsTypeGenInfos)
            {
                CheckMethodGenInfos(tsTypeGenInfos, info.Value);
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

        [MenuItem("Puerts/Generate Code", false, 1)]
        public static void GenerateCode()
        {
            var start = DateTime.Now;
            var saveTo = Configure.GetCodeOutputDirectory();
            Directory.CreateDirectory(saveTo);
            Directory.CreateDirectory(Path.Combine(saveTo, "Typing/csharp"));
            GenerateCode(saveTo);
            Debug.Log("finished! use " + (DateTime.Now - start).TotalMilliseconds + " ms");
            AssetDatabase.Refresh();
        }

        [MenuItem("Puerts/Generate index.d.ts", false, 1)]
        public static void GenerateDTS()
        {
            var start = DateTime.Now;
            var saveTo = Configure.GetCodeOutputDirectory();
            Directory.CreateDirectory(saveTo);
            Directory.CreateDirectory(Path.Combine(saveTo, "Typing/csharp"));
            GenerateCode(saveTo, true);
            Debug.Log("finished! use " + (DateTime.Now - start).TotalMilliseconds + " ms");
            AssetDatabase.Refresh();
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

        static Dictionary<Type, bool> blittableTypes = new Dictionary<Type, bool>()
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

        static bool isBlittableType(Type type)
        {
            if (type.IsValueType)
            {
                bool ret;
                if (!blittableTypes.TryGetValue(type, out ret))
                {
                    ret = true;
                    if (type.IsPrimitive) return false;
                    foreach(var fieldInfo in type.GetFields(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.DeclaredOnly))
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

        public static void GenerateCode(string saveTo, bool tsOnly = false)
        {
            filters = Configure.GetFilters();
            var configure = Configure.GetConfigureByTags(new List<string>() {
                "Puerts.BindingAttribute",
                "Puerts.BlittableCopyAttribute",
                "Puerts.TypingAttribute",
            });

            var genTypes = configure["Puerts.BindingAttribute"].Select( kv => kv.Key)
                .Where(o => o is Type)
                .Cast<Type>()
                .Where(t => !t.IsGenericTypeDefinition);

            var blittableCopyTypes = new HashSet<Type>(configure["Puerts.BlittableCopyAttribute"].Select(kv => kv.Key)
                .Where(o => o is Type)
                .Cast<Type>()
                .Where(t => !t.IsPrimitive && isBlittableType(t))
                .Distinct());

            var tsTypes = configure["Puerts.TypingAttribute"].Select(kv => kv.Key)
                .Where(o => o is Type)
                .Cast<Type>()
                .Where(t => !t.IsGenericTypeDefinition)
                .Concat(genTypes)
                .Distinct();

            using (var jsEnv = new JsEnv())
            {
                var templateGetter = jsEnv.Eval<Func<string, Func<object, string>>>("require('puerts/gencode/main.js')");
                var wrapRender = templateGetter("type.tpl");

                if (!tsOnly)
                {
                    var typeGenInfos = new List<TypeGenInfo>();
                    foreach (var type in genTypes)
                    {
                        if (type.IsEnum || type.IsArray || (IsDelegate(type) && type != typeof(Delegate))) continue;
                        TypeGenInfo typeGenInfo = ToTypeGenInfo(type);
                        typeGenInfo.BlittableCopy = blittableCopyTypes.Contains(type);
                        typeGenInfos.Add(typeGenInfo);
                        string filePath = saveTo + typeGenInfo.WrapClassName + ".cs";
                        string fileContext = wrapRender(typeGenInfo);
                        using (StreamWriter textWriter = new StreamWriter(filePath, false, Encoding.UTF8))
                        {
                            textWriter.Write(fileContext);
                            textWriter.Flush();
                        }
                    }

                    var autoRegisterRender = templateGetter("autoreg.tpl");
                    using (StreamWriter textWriter = new StreamWriter(saveTo + "AutoStaticCodeRegister.cs", false, Encoding.UTF8))
                    {
                        string fileContext = autoRegisterRender(typeGenInfos.ToArray());
                        textWriter.Write(fileContext);
                        textWriter.Flush();
                    }
                }

                var typingRender = templateGetter("typing.tpl");
                using (StreamWriter textWriter = new StreamWriter(saveTo + "Typing/csharp/index.d.ts", false, Encoding.UTF8))
                {
                    string fileContext = typingRender(ToTypingGenInfo(tsTypes));
                    textWriter.Write(fileContext);
                    textWriter.Flush();
                }
            }
        }
    }
}

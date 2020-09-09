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

        static ParameterGenInfo ToParameterGenInfo(ParameterInfo parameterInfo)
        {
            var ExpectJsType = GeneralGetterManager.GetJsTypeMask(parameterInfo.ParameterType);
            var result = new ParameterGenInfo()
            {
                IsOut = !parameterInfo.IsIn && parameterInfo.IsOut && parameterInfo.ParameterType.IsByRef,
                IsByRef = parameterInfo.ParameterType.IsByRef,
                TypeName = (parameterInfo.ParameterType.IsByRef ? parameterInfo.ParameterType.GetElementType() : parameterInfo.ParameterType).GetFriendlyName(),
                ExpectJsType = ToCode(ExpectJsType),
                IsParams = parameterInfo.IsDefined(typeof(ParamArrayAttribute), false),
            };
            if (result.IsParams)
            {
                result.TypeName = parameterInfo.ParameterType.GetElementType().GetFriendlyName();
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

        static MethodGenInfo ToMethodGenInfo(List<MethodBase> overloads)
        {
            var ret = new List<OverloadGenInfo>();
            foreach (var iBase in overloads)
            {
                ret.AddRange(ToOverloadGenInfo(iBase));
            }
            var result = new MethodGenInfo()
            {
                Name = overloads[0].Name,
                IsStatic = overloads[0].IsStatic,
                HasOverloads = ret.Count > 1,
                OverloadCount = ret.Count,
                OverloadGroups = ret.GroupBy(m => m.ParameterInfos.Length).Select(lst => lst.ToArray()).ToArray()
            };
            return result;
        }
        
        static object HasValue(ParameterInfo parameter)
        {
            if (!parameter.IsOptional)
                return null;
            return parameter.DefaultValue;
        }
        
        static List<OverloadGenInfo> ToOverloadGenInfo(MethodBase methodBase)
        {
            List<OverloadGenInfo> ret = new List<OverloadGenInfo>();
            OverloadGenInfo result = null;
            if (methodBase is MethodInfo)
            {
                var methodInfo = methodBase as MethodInfo;
                result = new OverloadGenInfo()
                {
                    ParameterInfos = methodInfo.GetParameters().Select(info => ToParameterGenInfo(info)).ToArray(),
                    TypeName = methodInfo.ReturnType.GetFriendlyName(),
                    IsVoid = methodInfo.ReturnType == typeof(void)
                };
                FillEnumInfo(result, methodInfo.ReturnType);
                result.HasParams = result.ParameterInfos.Any(info => info.IsParams);
                ret.Add(result);
                var ps = methodInfo.GetParameters();
                for (int i = ps.Length - 1; i >= 0; i--)
                {
                    var value = HasValue(ps[i]);
                    if (value!=null)
                    {
                        result = new OverloadGenInfo()
                        {
                            ParameterInfos = methodInfo.GetParameters().Select(info => ToParameterGenInfo(info)).Take(i).ToArray(),
                            TypeName = methodInfo.ReturnType.GetFriendlyName(),
                            IsVoid = methodInfo.ReturnType == typeof(void)
                        };
                        FillEnumInfo(result, methodInfo.ReturnType);
                        result.HasParams = result.ParameterInfos.Any(info => info.IsParams);
                        ret.Add(result);
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
                result = new OverloadGenInfo()
                {
                    ParameterInfos = constructorInfo.GetParameters().Select(info => ToParameterGenInfo(info)).ToArray(),
                    TypeName = constructorInfo.DeclaringType.GetFriendlyName(),
                    IsVoid = false
                };
                result.HasParams = result.ParameterInfos.Any(info => info.IsParams);
                ret.Add(result);
                var ps = constructorInfo.GetParameters();
                for (int i = ps.Length - 1; i >= 0; i--)
                {
                    var value = HasValue(ps[i]);
                    if (value!=null)
                    {
                        result = new OverloadGenInfo()
                        {
                            ParameterInfos = constructorInfo.GetParameters().Select(info => ToParameterGenInfo(info)).Take(i).ToArray(),
                            TypeName = constructorInfo.DeclaringType.GetFriendlyName(),
                            IsVoid = false
                        };
                        result.HasParams = result.ParameterInfos.Any(info => info.IsParams);
                        ret.Add(result);
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

        static TypeGenInfo ToTypeGenInfo(Type type)
        {
            var methodGroups = type.GetMethods(Flags).Where(m => !isFiltered(m))
                .Where(m => !m.IsSpecialName && !m.IsGenericMethodDefinition)
                .GroupBy(m => new MethodKey { Name = m.Name, IsStatic = m.IsStatic })
                .Select(i => i.Cast<MethodBase>().ToList());
            var indexs = type.GetProperties(Flags).Where(m => !isFiltered(m))
                .Where(p => p.GetIndexParameters().GetLength(0) == 1).Select(p => ToIndexGenInfo(p)).ToArray();
            var operatorGroups = type.GetMethods(Flags)
                .Where(m => !isFiltered(m) && m.IsSpecialName && m.Name.StartsWith("op_") && m.IsStatic)
                .GroupBy(m => new MethodKey { Name = m.Name, IsStatic = m.IsStatic })
                .Select(i => i.Cast<MethodBase>().ToList());

            var constructors = type.GetConstructors(Flags).Where(m => !isFiltered(m)).Cast<MethodBase>().ToList();

            return new TypeGenInfo
            {
                WrapClassName = GetWrapTypeName(type),
                Name = type.GetFriendlyName(),
                Methods = methodGroups.Select(m => ToMethodGenInfo(m)).ToArray(),
                IsValueType = type.IsValueType,
                Constructor = (!type.IsAbstract && constructors.Count > 0) ? ToMethodGenInfo(constructors) : null,
                Properties = type.GetProperties(Flags)
                    .Where(m => !isFiltered(m))
                    .Where(p => !p.IsSpecialName && p.GetIndexParameters().GetLength(0) == 0)
                    .Select(p => ToPropertyGenInfo(p)).Concat(
                        type.GetFields(Flags).Where(m => !isFiltered(m)).Select(f => ToPropertyGenInfo(f))).ToArray(),
                GetIndexs = indexs.Where(i => i.HasGetter).ToArray(),
                SetIndexs = indexs.Where(i => i.HasSetter).ToArray(),
                Operators = operatorGroups.Select(m => ToMethodGenInfo(m)).ToArray(),
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

        }

        // #lizard forgives
        static string GetTsTypeName(Type type)
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
                return GetTsTypeName(type.GetElementType()) + "[]";
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

        static TsParameterGenInfo ToTsParameterGenInfo(ParameterInfo parameterInfo)
        {
            return new TsParameterGenInfo()
            {
                Name = parameterInfo.Name,
                IsByRef = parameterInfo.ParameterType.IsByRef,
                TypeName = GetTsTypeName(parameterInfo.ParameterType),
                IsParams = parameterInfo.IsDefined(typeof(ParamArrayAttribute), false),
                IsOptional = parameterInfo.IsOptional
            };
        }

        public class TsMethodGenInfo
        {
            public string Name;
            public TsParameterGenInfo[] ParameterInfos;
            public string TypeName;
            public bool IsConstructor;
            public bool IsStatic;
        }

        public class TsPropertyGenInfo
        {
            public string Name;
            public string TypeName;
            public bool IsStatic;
        }

        public static TsMethodGenInfo ToTsMethodGenInfo(MethodBase methodBase)
        {
            return new TsMethodGenInfo()
            {
                Name = methodBase.IsConstructor ? "constructor" : methodBase.Name,
                ParameterInfos = methodBase.GetParameters().Select(info => ToTsParameterGenInfo(info)).ToArray(),
                TypeName = methodBase.IsConstructor ? "" : GetTsTypeName((methodBase as MethodInfo).ReturnType),
                IsConstructor = methodBase.IsConstructor,
                IsStatic = methodBase.IsStatic,
            };
        }

        public class TsTypeGenInfo
        {
            public string Name;
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

        public static TsTypeGenInfo ToTsTypeGenInfo(Type type, HashSet<Type> genTypeSet)
        {
            var result = new TsTypeGenInfo()
            {
                Name = type.Name.Replace('`', '$'),
                Methods = genTypeSet.Contains(type) ? (type.IsAbstract ? new MethodBase[] { } : type.GetConstructors(Flags).Where(m => !isFiltered(m)).Cast<MethodBase>())
                    .Concat(type.GetMethods(Flags)
                        .Where(m => !isFiltered(m) && !IsGetterOrSetter(m) && !m.IsGenericMethodDefinition)
                        .Cast<MethodBase>())
                    .Select(m => ToTsMethodGenInfo(m)).ToArray() : new TsMethodGenInfo[] { },
                Properties = genTypeSet.Contains(type) ? type.GetFields(Flags).Where(m => !isFiltered(m))
                    .Select(f => new TsPropertyGenInfo() { Name = f.Name, TypeName = GetTsTypeName(f.FieldType), IsStatic = f.IsStatic })
                    .Concat(
                        type.GetProperties(Flags).Where(m => m.Name != "Item").Where(m => !isFiltered(m))
                        .Select(p => new TsPropertyGenInfo() { Name = p.Name, TypeName = GetTsTypeName(p.PropertyType), IsStatic = IsStatic(p)}))
                    .ToArray() : new TsPropertyGenInfo[] { },
                IsGenericTypeDefinition = type.IsGenericTypeDefinition,
                IsDelegate = (IsDelegate(type) && type != typeof(Delegate)),
                IsInterface = type.IsInterface,
                Namespace = type.Namespace,
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

        static void AddRefType(HashSet<Type> refTypes, Type type)
        {
            var rawType = GetRawType(type);
            if (refTypes.Contains(rawType) || type.IsPointer || rawType.IsPointer) return;
            if (!rawType.IsGenericParameter)
            {
                refTypes.Add(rawType);
            }
            if (type.IsGenericType)
            {
                foreach (var gt in type.GetGenericArguments())
                {
                    AddRefType(refTypes, gt);
                }
            }

            if (IsDelegate(type) && type != typeof(Delegate) && type != typeof(MulticastDelegate))
            {
                MethodInfo delegateMethod = type.GetMethod("Invoke");
                AddRefType(refTypes, delegateMethod.ReturnType);
                foreach (var pinfo in delegateMethod.GetParameters())
                {
                    AddRefType(refTypes, pinfo.ParameterType);
                }
            }

            var baseType = type.BaseType;
            while (baseType != null)
            {
                AddRefType(refTypes, baseType);
                baseType = baseType.BaseType;
            }
            
        }

        public class TypingGenInfo
        {
            public TsNamespaceGenInfo[] NamespaceInfos;

            public string TaskDef;
        }

        static TypingGenInfo ToTypingGenInfo(IEnumerable<Type> types)
        {
            HashSet<Type> genTypeSet = new HashSet<Type>();

            HashSet<Type> refTypes = new HashSet<Type>();

            foreach(var type in types)
            {
                AddRefType(refTypes, type);
                var defType = type.IsGenericType ? type.GetGenericTypeDefinition() : type;
                if (!genTypeSet.Contains(defType)) genTypeSet.Add(defType);
                foreach (var field in type.GetFields(Flags))
                {
                    AddRefType(refTypes, field.FieldType);
                }

                foreach(var method in type.GetMethods(Flags))
                {
                    AddRefType(refTypes, method.ReturnType);
                    foreach(var pinfo in method.GetParameters())
                    {
                        AddRefType(refTypes, pinfo.ParameterType);
                    }
                }
                foreach(var constructor in type.GetConstructors())
                {
                    foreach (var pinfo in constructor.GetParameters())
                    {
                        AddRefType(refTypes, pinfo.ParameterType);
                    }
                }
            }

            return new TypingGenInfo()
            {
                NamespaceInfos = refTypes.Distinct().Select(t => ToTsTypeGenInfo(t, genTypeSet)).GroupBy(t => t.Namespace)
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

        [MenuItem("puerts/Generate Code", false, 1)]
        public static void GenerateCode()
        {
            var start = DateTime.Now;
            var saveTo = Application.dataPath + "/Gen/";
            Directory.CreateDirectory(saveTo);
            Directory.CreateDirectory(saveTo + "Typing/csharp");
            GenerateCode(saveTo);
            Debug.Log("finished! use " + (DateTime.Now - start).TotalMilliseconds + " ms");
            AssetDatabase.Refresh();
        }

        [MenuItem("puerts/Generate index.d.ts", false, 1)]
        public static void GenerateDTS()
        {
            var start = DateTime.Now;
            var saveTo = Application.dataPath + "/Gen/";
            Directory.CreateDirectory(saveTo);
            Directory.CreateDirectory(saveTo + "Typing/csharp");
            GenerateCode(saveTo, true);
            Debug.Log("finished! use " + (DateTime.Now - start).TotalMilliseconds + " ms");
            AssetDatabase.Refresh();
        }

        [MenuItem("puerts/Clear Generated Code", false, 2)]
        public static void ClearAll()
        {
            var saveTo = Application.dataPath + "/Gen/";
            if (Directory.Exists(saveTo))
            {
                Directory.Delete(saveTo, true);
                AssetDatabase.DeleteAsset(saveTo.Substring(saveTo.IndexOf("Assets") + "Assets".Length));
                AssetDatabase.Refresh();
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
                .Where(t => t.IsValueType && !t.IsPrimitive)
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
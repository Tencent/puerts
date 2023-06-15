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
using System.Runtime.CompilerServices;
using Puerts.TypeMapping;

namespace Puerts.Editor
{
    namespace Generator {

        class Utils {

            public const BindingFlags Flags = BindingFlags.Public | BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly;

            private static List<Func<MemberInfo, bool>> InstructionsFilters = new List<Func<MemberInfo, bool>>();
            private static List<Func<Type, bool>> DisallowedTypeFilters = new List<Func<Type, bool>>();
            private static List<Func<MemberInfo, BindingMode>> BindingModeFilters = new List<Func<MemberInfo, BindingMode>>();
            
            public static bool HasFilter = false;
            public static void SetFilters(List<MethodInfo> filters)
            {
                if (filters == null) 
                {
                    HasFilter = false;
                    InstructionsFilters.Clear();
                    BindingModeFilters.Clear();
                    DisallowedTypeFilters.Clear();
                    return;
                }

                HasFilter = true;
                foreach (var filter in filters)
                {
                    if (filter.GetParameters().Length == 2)
                    {
                        if (filter.ReturnType == typeof(BindingMode)) 
                        {
                            var dlg = (Func<FilterAction, MemberInfo, BindingMode>)Delegate.CreateDelegate(typeof(Func<FilterAction, MemberInfo, BindingMode>), filter);

                            BindingModeFilters.Add((MemberInfo mbi) => {
                                return dlg(FilterAction.BindingMode, mbi);
                            });
                        }
                        else if (filter.ReturnType == typeof(bool))
                        {
                            Type pType = filter.GetParameters()[1].ParameterType;
                            if (pType == typeof(MemberInfo))
                            {
                                var dlg = (Func<FilterAction, MemberInfo, bool>)Delegate.CreateDelegate(typeof(Func<FilterAction, MemberInfo, bool>), filter);

                                BindingModeFilters.Add((MemberInfo mbi) => {
                                    bool res = dlg(FilterAction.BindingMode, mbi);
                                    return res ? BindingMode.SlowBinding : BindingMode.FastBinding;
                                });
                                InstructionsFilters.Add((MemberInfo mbi) => {
                                    return dlg(FilterAction.MethodInInstructions, mbi);
                                });
                            }
                            else if (pType == typeof(Type))
                            {
                                var dlg = (Func<FilterAction, Type, bool>)Delegate.CreateDelegate(typeof(Func<FilterAction, Type, bool>), filter);
                                
                                DisallowedTypeFilters.Add((Type type) => {
                                    return dlg(FilterAction.DisallowedType, type);
                                });
                            }
                        }
                    }
                    else 
                    {
                        if (filter.ReturnType == typeof(BindingMode)) 
                        {
                            BindingModeFilters.Add((Func<MemberInfo, BindingMode>)Delegate.CreateDelegate(typeof(Func<MemberInfo, BindingMode>), filter));
                        }
                        else if (filter.ReturnType == typeof(bool))
                        {
                            var dlg = (Func<MemberInfo, bool>)Delegate.CreateDelegate(typeof(Func<MemberInfo, bool>), filter);
                            BindingModeFilters.Add((MemberInfo mbi) => {
                                bool res = dlg(mbi);
                                return res ? BindingMode.SlowBinding : BindingMode.FastBinding;
                            });
                        }
                    }   

                    // else if (filter.ReturnType == typeof(FilterClass))
                    // {
                    //     FilterClass fc = (FilterClass)filter.Invoke(null, new object[] {});
                    //      InstructionsFilters.Add(fc.InstructionsFilter);
                    //      BindingModeFilters.Add(fc.BindingModeFilter);
                    // }
                }
            }

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

            internal static bool isDisallowedType(Type type) 
            {
                var result = false;
                foreach (var filter in DisallowedTypeFilters)
                {
                    result = result || filter(type);
                }
                return result;
            }

            internal static BindingMode getBindingMode(MemberInfo mbi) 
            {
                BindingMode strictestMode = BindingMode.FastBinding;
                foreach (var filter in BindingModeFilters)
                {
                    var mode = filter(mbi);
                    strictestMode = strictestMode > mode ? mode : strictestMode;
                }
                return strictestMode;
            }

            internal static bool shouldNotGetArgumentsInInstructions(MemberInfo mbi) 
            {
                var result = false;
                foreach (var filter in InstructionsFilters)
                {
                    result = result || filter(mbi);
                }
                return result;
            }

            protected static bool IsObsolete(MemberInfo mbi)
            {
                return (mbi.GetCustomAttributes(typeof(ObsoleteAttribute), false).FirstOrDefault() as ObsoleteAttribute) != null;
            }

            public static bool IsNotSupportedMember(MemberInfo mbi, bool notFiltEII = false)
            {
                if (mbi == null) return false;
                if (IsObsolete(mbi)/* && oa.IsError*/) //希望只过滤掉Error类别过时方法可以把oa.IsError加上
                {
                    return true;
                }

                if (mbi is FieldInfo)
                {
                    FieldInfo fi = (mbi as FieldInfo);
                    if (
                        fi.FieldType.IsPointer
#if UNITY_2021_2_OR_NEWER
                        || fi.FieldType.IsByRefLike
#endif
                    )
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
                    if (
                        pi.PropertyType.IsPointer
#if UNITY_2021_2_OR_NEWER
                        || pi.PropertyType.IsByRefLike
#endif
                    )
                    {
                        return true;
                    }

                    var getMethod = pi.GetGetMethod();
                    var setMethod = pi.GetSetMethod();
                    if (!(
                        (getMethod != null && getMethod.IsPublic && !IsObsolete(getMethod)) ||
                        (setMethod != null && setMethod.IsPublic && !IsObsolete(setMethod))
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

                    if (mi.Name.Contains("$")) 
                    {
                        // fix #964
                        return true;
                    }
                    if (mi.ReturnType.IsPointer
#if UNITY_2021_2_OR_NEWER
                        || mi.ReturnType.IsByRefLike
#endif
                    )
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
                    if (
                        mb.GetParameters().Any(pInfo => pInfo.ParameterType.IsPointer
#if UNITY_2021_2_OR_NEWER
                        || pInfo.ParameterType.IsByRefLike
#endif
                    ))
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
                if (type.IsGenericType)
                    return type.GetGenericTypeDefinition().MakeGenericType(
                        type.GetGenericArguments().Select(t=> ToConstraintType(t, isGenericTypeDefinition)).ToArray()
                    );
                else if (!isGenericTypeDefinition && type.IsGenericParameter && type.BaseType != null && type.BaseType != typeof(object) && type.BaseType != typeof(ValueType)) 
                    return ToConstraintType(type.BaseType, false);
                else 
                    return type;
            }
        
            public static bool IsGetterOrSetter(MethodInfo method)
            {
                return (method.IsSpecialName && method.Name.StartsWith("get_") && method.GetParameters().Length != 1)
                    || (method.IsSpecialName && method.Name.StartsWith("set_") && method.GetParameters().Length != 2);
            }

            public static void FillEnumInfo(Wrapper.DataTypeInfo info, Type type)
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
                if (type.IsGenericType)
                    return type.GetGenericTypeDefinition().MakeGenericType(
                        type.GetGenericArguments().Select(t=> RemoveRefAndToConstraintType(t)).ToArray()
                    );
                else if (type.IsGenericParameter && type.BaseType != null && type.BaseType != typeof(object) && type.BaseType != typeof(ValueType))
                    return RemoveRefAndToConstraintType(type.BaseType);
                else if (type.IsByRef) 
                    return RemoveRefAndToConstraintType(type.GetElementType());
                else 
                    return type;
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
                                        where isDefined(method, typeof(ExtensionAttribute)) && Puerts.Utils.IsNotGenericOrValidGeneric(method)
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
#if CSHARP_7_3_OR_NEWER
                else if (type == typeof(System.Threading.Tasks.Task)) 
                    return "$Task<any>";
#endif
                else if (type.IsByRef)
                    return "$Ref<" + GetTsTypeName(type.GetElementType()) + ">";
                else if (type.IsArray)
                    return isParams ? (GetTsTypeName(type.GetElementType()) + "[]") : ("System.Array$1<" + GetTsTypeName(type.GetElementType()) + ">");
                else if (type.IsGenericType)
                {
                    var underlyingType = Nullable.GetUnderlyingType(type);
                    if (underlyingType != null)
                    {
                        return GetTsTypeName(underlyingType) + " | null";
                    }
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
    }
}
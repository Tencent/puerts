/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
#if UNITY_2020_1_OR_NEWER
#if EXPERIMENTAL_IL2CPP_PUERTS && ENABLE_IL2CPP

using System;
using System.Collections.Generic;
using System.Reflection;
using System.Linq;
using PuertsIl2cpp;

namespace Puerts.TypeMapping
{
    internal class TypeRegister
    {
        internal static RegisterInfoManager RegisterInfoManager = null;

        internal static void AddRegisterInfoGetter(Type type, Func<RegisterInfo> getter)
        {
            if (RegisterInfoManager == null) RegisterInfoManager = new RegisterInfoManager();
                
            RegisterInfoManager.Add(type, getter);
        }

        private static IntPtr ReflectionWrapperFunc = IntPtr.Zero;
        private static IntPtr ReflectionFieldWrappers = IntPtr.Zero;
        private static BindingMode GetBindingMode(RegisterInfo info, string name, bool isStatic)
        {
            var _name = name + (isStatic ? "_static": "");
            if (info == null || !info.Members.ContainsKey(_name)) return RegisterInfoManager.DefaultBindingMode;
            return info.Members[_name].UseBindingMode;
        }
        private static IntPtr GetWrapperFunc(RegisterInfo registerInfo, MemberInfo member, string signature)
        {
            string name = member.Name;
            bool isMethod = member is MethodInfo;
            if (isMethod) 
            {
                var method = (MethodInfo)member;
                if (method.IsSpecialName && method.Name != "get_Item" && (method.Name.StartsWith("get_") || method.Name.StartsWith("set_")))
                {
                    name = member.Name.Substring(4);
                }
            }
            BindingMode bindingMode = GetBindingMode(registerInfo, name, isMethod ? ((MethodInfo)member).IsStatic : false);
            IntPtr wrapper = IntPtr.Zero;
            if (bindingMode == BindingMode.FastBinding) 
            {
                wrapper = NativeAPI.FindWrapFunc(signature);
            } 

            if (wrapper == IntPtr.Zero && bindingMode != BindingMode.DontBinding)
            {
                wrapper = ReflectionWrapperFunc;
            }
            
            return wrapper;
        }
        private static IntPtr GetFieldWrapper(RegisterInfo registerInfo, string name, bool isStatic, string signature)
        {
            BindingMode bindingMode = GetBindingMode(registerInfo, name, isStatic);
            IntPtr wrapper = IntPtr.Zero;
            if (bindingMode == BindingMode.FastBinding) 
            {
                wrapper = NativeAPI.FindFieldWrap(signature);
            } 

            if (wrapper == IntPtr.Zero && bindingMode != BindingMode.DontBinding)
            {
                wrapper = ReflectionFieldWrappers;
            }
            
            return wrapper;
        }

        //call by native, do not throw!!
        public static void RegisterNoThrow(IntPtr typeId, bool includeNonPublic)
        {
            if (ReflectionWrapperFunc == IntPtr.Zero) ReflectionWrapperFunc = NativeAPI.FindWrapFunc(null);
            if (ReflectionFieldWrappers == IntPtr.Zero) ReflectionFieldWrappers = NativeAPI.FindFieldWrap(null);
            if (RegisterInfoManager == null) RegisterInfoManager = new RegisterInfoManager();
                
            try
            {
                Type type = NativeAPI.TypeIdToType(typeId);
                if (type == null) return;
                //UnityEngine.Debug.Log(string.Format("try load type {0}", type));
                Register(type, includeNonPublic);
            }
            catch (Exception e)
            {
                UnityEngine.Debug.LogError(string.Format("try load type throw {0}", e));
            }
        }

        private static void Register(Type type, bool includeNonPublic, bool throwIfMemberFail = false)
        {
            BindingFlags flag = BindingFlags.DeclaredOnly | BindingFlags.Instance | BindingFlags.Static | BindingFlags.Public;
            if (includeNonPublic)
            {
                flag = flag | BindingFlags.NonPublic;
            }

            Register(type, type.GetConstructors(flag), type.GetMethods(flag), type.GetProperties(flag), type.GetFields(flag), throwIfMemberFail);
        }

        private static void Register(Type type, MethodBase[] ctors = null, MethodBase[] methods = null, PropertyInfo[] properties = null, FieldInfo[] fields = null, bool throwIfMemberFail = false)
        {
            IntPtr typeInfo = IntPtr.Zero;
            try
            {
                bool isDelegate = typeof(MulticastDelegate).IsAssignableFrom(type) && type != typeof(MulticastDelegate);
                var typeId = NativeAPI.GetTypeId(type);
                //UnityEngine.Debug.Log(string.Format("{0} typeId is {1}", type, typeId));
                var superTypeId = (isDelegate || type == typeof(object) || type.BaseType == null) ? IntPtr.Zero : NativeAPI.GetTypeId(type.BaseType);

                Func<RegisterInfo> getRegisterInfoFunc;
                bool hasRegisterInfo = RegisterInfoManager.TryGetValue(type, out getRegisterInfoFunc);
                RegisterInfo registerInfo = null;
                if (hasRegisterInfo) registerInfo = getRegisterInfoFunc();

                typeInfo = NativeAPI.CreateCSharpTypeInfo(type.ToString(), typeId, superTypeId, typeId, type.IsValueType, isDelegate, isDelegate ? TypeUtils.GetMethodSignature(type.GetMethod("Invoke"), true) : "");
                if (typeInfo == IntPtr.Zero)
                {
                    if (isDelegate) throw new Exception(string.Format("create TypeInfo for {0} fail. maybe the BridgeInfo is not found, try to regenerate the FunctionBridge.Gen.h", type));
                    throw new Exception(string.Format("create TypeInfo for {0} fail", type));
                }
                if (!isDelegate)
                {
                    if (ctors != null && ctors.Length > 0 && (!type.IsArray || type == typeof(System.Array)))
                    {
                        foreach (var ctor in ctors)
                        {
                            if (ctor.IsGenericMethodDefinition) continue;
                            List<Type> usedTypes = TypeUtils.GetUsedTypes(ctor);
                            var signature = TypeUtils.GetMethodSignature(ctor);

                            var wrapper = GetWrapperFunc(registerInfo, ctor, signature);
                            if (wrapper == IntPtr.Zero)
                            {
                                UnityEngine.Debug.LogWarning(string.Format("wrapper is null for {0}", type));
                                continue;
                            }
                            //UnityEngine.Debug.Log(string.Format("add ctor {0}, usedTypes count: {1}", ctor, usedTypes.Count));

                            var methodInfoPointer = NativeAPI.GetMethodInfoPointer(ctor);
                            var methodPointer = NativeAPI.GetMethodPointer(ctor);
                            if (methodInfoPointer == IntPtr.Zero)
                            {
                                UnityEngine.Debug.LogWarning(string.Format("cannot get method info for {0}:{1}, signature:{2}", type, ctor, TypeUtils.GetMethodSignature(ctor)));
                                continue;
                            }
                            if (methodPointer == IntPtr.Zero)
                            {
                                UnityEngine.Debug.LogWarning(string.Format("cannot get method pointer for {0}:{1}, signature:{2}", type, ctor, TypeUtils.GetMethodSignature(ctor)));
                                continue;
                            }
                            var wrapData = NativeAPI.AddConstructor(
                                typeInfo, 
                                signature,
                                wrapper, 
                                methodInfoPointer, 
                                methodPointer, 
                                usedTypes.Count
                            );
                            if (wrapData == IntPtr.Zero)
                            {
                                if (!throwIfMemberFail)
                                {
#if WARNING_IF_MEMBERFAIL
                                    UnityEngine.Debug.LogWarning(string.Format("add constructor for {0} fail, signature:{1}", type, TypeUtils.GetMethodSignature(ctor)));
#endif
                                    continue;
                                }
                                throw new Exception(string.Format("add constructor for {0} fail, signature:{1}", type, TypeUtils.GetMethodSignature(ctor)));
                            }
                            for (int i = 0; i < usedTypes.Count; ++i)
                            {
                                var usedTypeId = NativeAPI.GetTypeId(usedTypes[i]);
                                //UnityEngine.Debug.Log(string.Format("set used type for ctor {0}: {1}={2}, typeId:{3}", ctor, i, usedTypes[i], usedTypeId));
                                NativeAPI.SetTypeInfo(wrapData, i, usedTypeId);
                            }
                        }
                    }

                    Action<string, MethodInfo, bool, bool, bool> AddMethodToType = (string name, MethodInfo method, bool isGetter, bool isSetter, bool isExtensionMethod) =>
                    {
                        method = TypeUtils.HandleMaybeGenericMethod(method);
                        if (method == null) return;
                        List<Type> usedTypes = TypeUtils.GetUsedTypes(method, isExtensionMethod);
                        var signature = TypeUtils.GetMethodSignature(method, false, isExtensionMethod);
                        // UnityEngine.Debug.Log(string.Format("add method {0}, usedTypes count: {1}", method, usedTypes.Count));

                        var wrapper = GetWrapperFunc(registerInfo, method, signature);
                        if (wrapper == IntPtr.Zero)
                        {
                            UnityEngine.Debug.LogWarning(string.Format("wrapper is null for {0}:{1}, signature:{2}", type, method, TypeUtils.GetMethodSignature(method, false, isExtensionMethod)));
                            return;
                        }
                         
                        var methodInfoPointer = NativeAPI.GetMethodInfoPointer(method);
                        var methodPointer = NativeAPI.GetMethodPointer(method);
                        if (methodInfoPointer == IntPtr.Zero)
                        {
                            UnityEngine.Debug.LogWarning(string.Format("cannot get method info for {0}:{1}, signature:{2}", type, method, TypeUtils.GetMethodSignature(method, false, isExtensionMethod)));
                            return;
                        }
                        if (methodPointer == IntPtr.Zero)
                        {
                            UnityEngine.Debug.LogWarning(string.Format("cannot get method pointer for {0}:{1}, signature:{2}", type, method, TypeUtils.GetMethodSignature(method, false, isExtensionMethod)));
                            return;
                        }
                        var wrapData = NativeAPI.AddMethod(
                            typeInfo, 
                            signature,
                            wrapper,
                            name, 
                            !isExtensionMethod && method.IsStatic, 
                            isExtensionMethod, 
                            isGetter, 
                            isSetter, 
                            methodInfoPointer, 
                            methodPointer, 
                            usedTypes.Count
                        );
                        if (wrapData == IntPtr.Zero)
                        {
                            if (throwIfMemberFail)
                            {
                                throw new Exception(string.Format("add method for {0}:{1} fail, signature:{2}", type, method, TypeUtils.GetMethodSignature(method, false, isExtensionMethod)));
                            }
                            else
                            {
    #if WARNING_IF_MEMBERFAIL
                                UnityEngine.Debug.LogWarning(string.Format("add method for {0}:{1} fail, signature:{2}", type, method, TypeUtils.GetMethodSignature(method, false, isExtensionMethod)));
    #endif
                                return;
                            }
                        }
                        for (int i = 0; i < usedTypes.Count; ++i)
                        {
                            var usedTypeId = NativeAPI.GetTypeId(usedTypes[i]);
                            //UnityEngine.Debug.Log(string.Format("set used type for method {0}: {1}={2}, typeId:{3}", method, i, usedTypes[i], usedTypeId));
                            NativeAPI.SetTypeInfo(wrapData, i, usedTypeId);
                        }
                    };

                    if (methods != null && (!type.IsArray || type == typeof(System.Array)))
                    {
                        foreach (var method in methods)
                        {
                            if (method.IsAbstract) continue;
                            AddMethodToType(method.Name, method as MethodInfo, false, false, false);
                        }
                    }
					
					var extensionMethods = ExtensionMethodInfo.Get(type);
					if (extensionMethods != null)
                    {
                        foreach (var method in extensionMethods)
                        {
                            AddMethodToType(method.Name, method as MethodInfo, false, false, true);
                        }
                    }

                    if (properties != null)
                    {
                        foreach (var prop in properties)
                        {
                            var getter = prop.GetGetMethod();
                            if (getter != null && !getter.IsGenericMethodDefinition && !getter.IsAbstract)
                            {
                                AddMethodToType(prop.Name, getter, true, false, false);
                            }
                            var setter = prop.GetSetMethod();
                            if (setter != null && !setter.IsGenericMethodDefinition && !setter.IsAbstract)
                            {
                                AddMethodToType(prop.Name, setter, false, true, false);
                            }
                        }
                    }

                    if (fields != null)
                    {
                        foreach (var field in fields)
                        {
                            string signature = (field.IsStatic ? "" : "t") + TypeUtils.GetTypeSignature(field.FieldType);
                            var name = field.Name;
                            
                            var wrapper = GetFieldWrapper(registerInfo, name, field.IsStatic, signature);
                            if (wrapper == IntPtr.Zero)
                            {
                                UnityEngine.Debug.LogWarning(string.Format("wrapper is null for {0}:{1}, signature:{2}", type, name, signature));
                                continue;
                            }

                            if (!NativeAPI.AddField(
                                typeInfo, 
                                wrapper, 
                                name, 
                                field.IsStatic, 
                                NativeAPI.GetFieldInfoPointer(field), 
                                NativeAPI.GetFieldOffset(field, type.IsValueType), 
                                NativeAPI.GetTypeId(field.FieldType))
                            )
                            {
                                if (!throwIfMemberFail)
                                {
#if WARNING_IF_MEMBERFAIL
                                    UnityEngine.Debug.LogWarning(string.Format("add field for {0}:{1} fail, signature:{2}", type, field, signature));
#endif
                                    continue;
                                }
                                throw new Exception(string.Format("add field for {0}:{1} fail, signature:{2}", type, field, signature));
                            }
                            //UnityEngine.Debug.Log(string.Format("AddField {0} of {1} ok offset={2}", field, type, GetFieldOffset(field, type.IsValueType)));
                        }
                    }
                }

                if (!NativeAPI.RegisterCSharpType(typeInfo))
                {
                    throw new Exception(string.Format("Register for {0} fail", type));
                }
            }
            catch(Exception e)
            {
                NativeAPI.ReleaseCSharpTypeInfo(typeInfo);
                throw e;
            }
        }
    }
}
#endif
#endif
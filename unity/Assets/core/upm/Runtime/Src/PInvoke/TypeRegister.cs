/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if PUERTS_DISABLE_IL2CPP_OPTIMIZATION || (!PUERTS_IL2CPP_OPTIMIZATION && UNITY_IPHONE) || !ENABLE_IL2CPP
using System;
using System.Text;
using System.Linq;
using System.Reflection;
using System.Collections.Concurrent;
using System.Runtime.InteropServices;
using System.Collections.Generic;

namespace Puerts
{
    public sealed class TypeRegister
    {
        private static volatile TypeRegister instance;
        private static readonly object instanceLock = new object();

        private readonly object writeLock = new object();
        private volatile Type[] typeArray = new Type[] { null }; // id not zero
        private readonly ConcurrentDictionary<Type, int> typeToId = new ConcurrentDictionary<Type, int>();
        private readonly ConcurrentDictionary<int, bool> registerFinished = new ConcurrentDictionary<int, bool>();

        private readonly pesapi_reg_api reg_api;
        private readonly IntPtr registry;
        private readonly pesapi_class_not_found_callback onTypeNotFoundDelegate;
        internal readonly List<Delegate> callbacksCache = new List<Delegate>();

        private TypeRegister()
        {
            reg_api = Marshal.PtrToStructure<pesapi_reg_api>(PuertsNative.GetRegisterApi());
            registry = reg_api.create_registry();
            onTypeNotFoundDelegate = new pesapi_class_not_found_callback(OnTypeNotFound);
            reg_api.on_class_not_found(registry, onTypeNotFoundDelegate);
        }

        public static TypeRegister Instance
        {
            get
            {
                if (instance == null)
                {
                    lock (instanceLock)
                    {
                        if (instance == null)
                        {
                            instance = new TypeRegister();
                        }
                    }
                }
                return instance;
            }
        }

        public IntPtr Registry
        {
            get
            {
                return registry;
            }
        }

        public int FindOrAddTypeId(Type type)
        {
            if (typeToId.TryGetValue(type, out int existingId))
            {
                return existingId;
            }

            lock (writeLock)
            {
                if (typeToId.TryGetValue(type, out existingId))
                {
                    return existingId;
                }

                int newId = typeArray.Length;
                var newArray = new Type[newId + 1];
                Array.Copy(typeArray, newArray, newId);
                newArray[newId] = type;

                typeArray = newArray;
                typeToId[type] = newId;
                return newId;
            }
        }

        public Type FindTypeById(int id)
        {
            var current = typeArray; 
            return (uint)id < (uint)current.Length ? current[id] : null;
        }

        public static IntPtr StringToIntPtr(string str)
        {
            if (str == null)
                return IntPtr.Zero;

            byte[] utf8Bytes = Encoding.UTF8.GetBytes(str);

            IntPtr ptr = Marshal.AllocHGlobal(utf8Bytes.Length + 1);

            try
            {
                Marshal.Copy(utf8Bytes, 0, ptr, utf8Bytes.Length);
                Marshal.WriteByte(ptr, utf8Bytes.Length, 0);

                return ptr;
            }
            catch
            {
                Marshal.FreeHGlobal(ptr);
                throw;
            }
        }

        struct MemberKey
        {
            public MemberKey(string n, bool b)
            {
                Name = n;
                IsStatic = b;
            }
            public string Name;
            public bool IsStatic;
        }

        class AccessorInfo
        {
            public pesapi_callback Getter;
            public pesapi_callback Setter;
        }

        private bool parameterTypeNotAcceptable(Type type)
        {
            if (type.IsByRef && type.GetElementType().IsByRefLike) return true;
            return type == typeof(IntPtr) || type == typeof(TypedReference) || type.IsPointer || (type.IsValueType && !type.IsPrimitive && type.IsByRefLike);
        }

        private bool returnTypeNotAcceptable(Type type)
        {
            return parameterTypeNotAcceptable(type) || type.IsByRef;
        }

        public int Register(Type type)
        {
            int typeId = FindOrAddTypeId(type);
            if (registerFinished.ContainsKey(typeId)) return typeId;

            BindingFlags flag = BindingFlags.DeclaredOnly | BindingFlags.Instance | BindingFlags.Static | BindingFlags.Public;
            var methodInfos = type.GetMethods(flag | BindingFlags.NonPublic).ToList();
            FieldInfo[] fieldInfos = type.GetFields(flag);
            Dictionary<MemberKey, List<MethodInfo>> methodCallbacks = new Dictionary<MemberKey, List<MethodInfo>>();
            Dictionary<MemberKey, AccessorInfo> propertyCallbacks = new Dictionary<MemberKey, AccessorInfo>();
            int staticPropertyCount = 0;
            int instancePropertyCount = 0;
            Action<MemberKey, pesapi_callback, pesapi_callback> addPropertyCallback = (key, getter, setter) =>
            {
                AccessorInfo accessorCallbackPair;
                if (!propertyCallbacks.TryGetValue(key, out accessorCallbackPair))
                {
                    if (key.IsStatic)
                    {
                        ++staticPropertyCount;
                    }
                    else
                    {
                        ++instancePropertyCount;
                    }
                    accessorCallbackPair = new AccessorInfo();
                    propertyCallbacks.Add(key, accessorCallbackPair);
                }
                if (getter != null)
                {
                    accessorCallbackPair.Getter = getter;
                    callbacksCache.Add(getter);
                }
                if (setter != null)
                {
                    accessorCallbackPair.Setter = setter;
                    callbacksCache.Add(setter);
                }
            };
            int staticMethodCount = 0;
            int instanceMethodCount = 0;
            Action<MemberKey, MethodInfo> addOverload = (key, methodInfo) =>
            {
                List<MethodInfo> overloads;
                if (!methodCallbacks.TryGetValue(key, out overloads))
                {
                    if (key.IsStatic)
                    {
                        ++staticMethodCount;
                    }
                    else
                    {
                        ++instanceMethodCount;
                    }
                    overloads = new List<MethodInfo>();
                    methodCallbacks.Add(key, overloads);
                }
                overloads.Add(methodInfo);
            };
            foreach (var fieldInfo in fieldInfos)
            {
                try
                {
                    if (returnTypeNotAcceptable(fieldInfo.FieldType)) continue;
                    var getter = ExpressionsWrap.BuildFieldGetter(fieldInfo);
                    callbacksCache.Add(getter);
                    addPropertyCallback(new MemberKey(fieldInfo.Name, fieldInfo.IsStatic), getter, null);
                    if (!fieldInfo.IsInitOnly && !fieldInfo.IsLiteral)
                    {
                        var setter = ExpressionsWrap.BuildFieldSetter(fieldInfo);
                        callbacksCache.Add(setter);
                        addPropertyCallback(new MemberKey(fieldInfo.Name, fieldInfo.IsStatic), null, setter);
                    }
                }
                catch (Exception e)
                {
                    var msg = $"wrap {fieldInfo} fail! message: {e.Message}, stack: {e.StackTrace}";
#if UNITY_EDITOR
                    UnityEngine.Debug.LogWarning(msg);
#else
                    Console.WriteLine(msg);
#endif
                }
            }
            var extensionMethods = PuertsIl2cpp.ExtensionMethodInfo.Get(type.AssemblyQualifiedName);
            if(extensionMethods != null && extensionMethods.Length > 0)
            {
                foreach (var extensionMethod in extensionMethods)
                {
                    var method = extensionMethod;
                    if (method.IsGenericMethodDefinition)
                    {
                        var genericArguments = method.GetGenericArguments();
                        var constraintedArgumentTypes = new Type[genericArguments.Length];
                        for (var j = 0; j < genericArguments.Length; j++)
                        {
                            constraintedArgumentTypes[j] = genericArguments[j].BaseType;
                        }
                        method = method.MakeGenericMethod(constraintedArgumentTypes);
                    }
                    methodInfos.Add(method);
                }
            }
            foreach (var methodInfo in methodInfos)
            {
                if (methodInfo.IsGenericMethodDefinition) continue;
                if (methodInfo.GetParameters().Any(pi => parameterTypeNotAcceptable(pi.ParameterType)) || returnTypeNotAcceptable(methodInfo.ReturnType)) continue;
                var clsCompliant = methodInfo.GetCustomAttribute<CLSCompliantAttribute>(false);
                if (clsCompliant != null && !clsCompliant.IsCompliant) continue;

                string methodName = methodInfo.Name;

                if (!methodInfo.IsPublic)
                {
                    int dotPos = methodName.LastIndexOf('.');
                    if (dotPos == -1) continue;
                    methodName = methodName.Substring(dotPos + 1);
                }
                try
                {
                    //AccessorCallbackPair accessorCallbackPair = null;
                    if (methodInfo.IsSpecialName && methodName.StartsWith("get_") && methodInfo.GetParameters().Length == 0) // getter of property
                    {
                        addPropertyCallback(new MemberKey(methodName.Substring(4), methodInfo.IsStatic), ExpressionsWrap.BuildMethodWrap(type, methodInfo, false), null);
                    }
                    else if (methodInfo.IsSpecialName && methodName.StartsWith("set_") && methodInfo.GetParameters().Length == 1) // setter of property
                    {
                        addPropertyCallback(new MemberKey(methodName.Substring(4), methodInfo.IsStatic), null, ExpressionsWrap.BuildMethodWrap(type, methodInfo, false));
                    }
                    else
                    {
                        addOverload(new MemberKey(methodName, methodInfo.IsStatic && PuertsIl2cpp.ExtensionMethodInfo.GetExtendedType(methodInfo) != type), methodInfo);
                    }
                    //UnityEngine.Debug.Log("wrap " + method + " ok");
                }
                catch (Exception e)
                {
                    var msg = $"wrap {methodInfo} fail! message: {e.Message}, stack: {e.StackTrace}";
#if UNITY_EDITOR
                    UnityEngine.Debug.LogWarning(msg);
#else
                    Console.WriteLine(msg);
#endif
                }
            }
            
            int baseTypeId = type.BaseType == null ? 0 : Register(type.BaseType);
            
            pesapi_constructor ctorWrap = null;

            try
            {
                if ((typeof(MulticastDelegate).IsAssignableFrom(type) && type != typeof(MulticastDelegate)))
                {
                    ctorWrap = ExpressionsWrap.BuildDelegateConstructorWrap(type, type.GetConstructors(), false);
                }
                else
                {
                    var ctors = type.GetConstructors()
                        .Where(ctorInfo => !ctorInfo.GetParameters().Any(pi => parameterTypeNotAcceptable(pi.ParameterType)))
                        .ToArray();
                    if (ctors.Length > 0)
                    {
                        ctorWrap = ExpressionsWrap.BuildConstructorWrap(type, ctors, false);
                    }
                }
            }
            catch (Exception e)
            {
                var msg = $"wrap ctor for {type} fail! message: {e.Message}, stack: {e.StackTrace}";
#if UNITY_EDITOR
                UnityEngine.Debug.LogWarning(msg);
#else
                Console.WriteLine(msg);
#endif
            }
            if (ctorWrap == null)
            {
                ctorWrap = (apis, info) =>
                {
                    PuertsNative.pesapi_throw_by_string(apis, info, $"no constructor for {type}");
                    return IntPtr.Zero;
                };
            }
            callbacksCache.Add(ctorWrap);
            reg_api.define_class(registry, new IntPtr(typeId), new IntPtr(baseTypeId), type.Namespace, type.Name, ctorWrap, null, IntPtr.Zero, true);
            ++staticMethodCount; // for __p_innerType
            reg_api.set_property_info_size(registry, new IntPtr(typeId), instanceMethodCount, staticMethodCount, instancePropertyCount, staticPropertyCount);

            int ipidx = 0;
            int spidx = 0;
            foreach (var kv in propertyCallbacks)
            {
                try
                {
                    reg_api.set_property_info(registry, new IntPtr(typeId), kv.Key.IsStatic ? spidx++ : ipidx++, kv.Key.Name, kv.Key.IsStatic, kv.Value.Getter, kv.Value.Setter, IntPtr.Zero, IntPtr.Zero, true);
                }
                catch { }

            }
            int imidx = 0;
            int smidx = 0;
            foreach (var kv in methodCallbacks)
            {
                try
                {
                    pesapi_callback callback = ExpressionsWrap.BuildMethodWrap(type, kv.Value.ToArray(), false);
                    callbacksCache.Add(callback);
                    reg_api.set_method_info(registry, new IntPtr(typeId), kv.Key.IsStatic ? smidx++ : imidx++, kv.Key.Name, kv.Key.IsStatic, callback, IntPtr.Zero, true);
                }
                catch (Exception e)
                {
                    var msg = $"wrap {kv.Key.Name} of {type} fail! message: {e.Message}, stack: {e.StackTrace}";
#if UNITY_EDITOR
                    UnityEngine.Debug.LogWarning(msg);
#else
                    Console.WriteLine(msg);
#endif
                }
            }

            registerFinished[typeId] = true;
            return typeId;
        }

        public bool OnTypeNotFound(IntPtr type_id)
        {
            Type type = FindTypeById(type_id.ToInt32());
            Register(type);
            return true;
        }
    }
}
#endif

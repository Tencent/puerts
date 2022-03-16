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

namespace Puerts
{
    internal class TypeRegister
    {
        public TypeRegister(JsEnv jsEnv)
        {
            this.jsEnv = jsEnv;

#if (UNITY_WSA && !ENABLE_IL2CPP) && !UNITY_EDITOR
            var assembliesUsorted = Utils.GetAssemblies();
#else
            assemblies.Add(Assembly.GetExecutingAssembly());
            var assembliesUsorted = AppDomain.CurrentDomain.GetAssemblies();
#endif
            AddAssemblieByName(assembliesUsorted, "mscorlib,"); //为了让这几个程序集排前面
            AddAssemblieByName(assembliesUsorted, "System,");
            AddAssemblieByName(assembliesUsorted, "System.Core,");
            foreach (Assembly assembly in assembliesUsorted)
            {
                if (!assemblies.Contains(assembly))
                {
                    assemblies.Add(assembly);
                }
            }
        }

        void ArrayLength(IntPtr isolate, IntPtr info, IntPtr self, int argumentsLen)
        {
            try
            {
                Array array = jsEnv.GeneralGetterManager.GetSelf(self) as Array;
                PuertsDLL.ReturnNumber(isolate, info, array.Length);
            }
            catch (Exception e)
            {
                PuertsDLL.ThrowException(isolate, "array.length throw c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }

        bool FastArrayGet(IntPtr isolate, IntPtr info, IntPtr self, object obj, uint index)
        {
            bool hited = true;
            var type = obj.GetType();

            if (type == typeof(int[]))
            {
                int[] array = obj as int[];
                PuertsDLL.ReturnNumber(isolate, info, array[index]);
            }
            else if (type == typeof(float[]))
            {
                float[] array = obj as float[];
                PuertsDLL.ReturnNumber(isolate, info, array[index]);
            }
            else if (type == typeof(double[]))
            {
                double[] array = obj as double[];
                PuertsDLL.ReturnNumber(isolate, info, array[index]);
            }
            else if (type == typeof(bool[]))
            {
                bool[] array = obj as bool[];
                PuertsDLL.ReturnBoolean(isolate, info, array[index]);
            }
            else if (type == typeof(long[]))
            {
                long[] array = obj as long[];
                PuertsDLL.ReturnBigInt(isolate, info, array[index]);
            }
            else if (type == typeof(ulong[]))
            {
                ulong[] array = obj as ulong[];
                PuertsDLL.ReturnBigInt(isolate, info, (long)array[index]);
            }
            else if (type == typeof(sbyte[]))
            {
                sbyte[] array = obj as sbyte[];
                PuertsDLL.ReturnNumber(isolate, info, array[index]);
            }
            else if (type == typeof(short[]))
            {
                short[] array = obj as short[];
                PuertsDLL.ReturnNumber(isolate, info, array[index]);
            }
            else if (type == typeof(ushort[]))
            {
                ushort[] array = obj as ushort[];
                PuertsDLL.ReturnNumber(isolate, info, array[index]);
            }
            else if (type == typeof(char[]))
            {
                char[] array = obj as char[];
                PuertsDLL.ReturnNumber(isolate, info, array[index]);
            }
            else if (type == typeof(uint[]))
            {
                uint[] array = obj as uint[];
                PuertsDLL.ReturnNumber(isolate, info, array[index]);
            }
            else if (type == typeof(string[]))
            {
                string[] array = obj as string[];
                string str = array[index]; 
                if (str == null)
                {
                    PuertsDLL.ReturnNull(isolate, info);
                }
                else
                {
                    PuertsDLL.ReturnString(isolate, info, str);
                }
            }
            else
            {
                hited = false;
            }
            return hited;
        }

        bool FastArraySet(IntPtr isolate, IntPtr info, IntPtr self, object obj, uint index, IntPtr value)
        {
            bool hited = true;
            var jsType = PuertsDLL.GetJsValueType(isolate, value, false);
            var type = obj.GetType();

            if (type == typeof(int[]) && jsType == JsValueType.Number)
            {
                int[] array = obj as int[];
                array[index] = (int)PuertsDLL.GetNumberFromValue(isolate, value, false);
            }
            else if (type == typeof(float[]) && jsType == JsValueType.Number)
            {
                float[] array = obj as float[];
                array[index] = (float)PuertsDLL.GetNumberFromValue(isolate, value, false);
            }
            else if (type == typeof(double[]) && jsType == JsValueType.Number)
            {
                double[] array = obj as double[];
                array[index] = PuertsDLL.GetNumberFromValue(isolate, value, false);
            }
            else if (type == typeof(bool[]) && jsType == JsValueType.Boolean)
            {
                bool[] array = obj as bool[];
                array[index] = PuertsDLL.GetBooleanFromValue(isolate, value, false);
            }
            else if (type == typeof(long[]) && jsType == JsValueType.BigInt)
            {
                long[] array = obj as long[];
                array[index] = PuertsDLL.GetBigIntFromValueChecked(isolate, value, false);
            }
            else if (type == typeof(ulong[]) && jsType == JsValueType.BigInt)
            {
                ulong[] array = obj as ulong[];
                array[index] = (ulong)PuertsDLL.GetBigIntFromValueChecked(isolate, value, false);
            }
            else if (type == typeof(sbyte[]) && jsType == JsValueType.Number)
            {
                sbyte[] array = obj as sbyte[];
                array[index] = (sbyte)PuertsDLL.GetNumberFromValue(isolate, value, false);
            }
            else if (type == typeof(short[]) && jsType == JsValueType.Number)
            {
                short[] array = obj as short[];
                array[index] = (short)PuertsDLL.GetNumberFromValue(isolate, value, false);
            }
            else if (type == typeof(ushort[]) && jsType == JsValueType.Number)
            {
                ushort[] array = obj as ushort[];
                array[index] = (ushort)PuertsDLL.GetNumberFromValue(isolate, value, false);
            }
            else if (type == typeof(char[]) && jsType == JsValueType.Number)
            {
                char[] array = obj as char[];
                array[index] = (char)PuertsDLL.GetNumberFromValue(isolate, value, false);
            }
            else if (type == typeof(uint[]) && jsType == JsValueType.Number)
            {
                uint[] array = obj as uint[];
                array[index] = (uint)PuertsDLL.GetNumberFromValue(isolate, value, false);
            }
            else if (type == typeof(string[]) && jsType == JsValueType.String)
            {
                string[] array = obj as string[];
                array[index] = PuertsDLL.GetStringFromValue(isolate, value, false);
            }
            else if (type == typeof(string[]) && jsType == JsValueType.NullOrUndefined)
            {
                string[] array = obj as string[];
                array[index] = null;
            }
            else
            {
                hited = false;
            }
            return hited;
        }

        private int arrayTypeId = -1;

        internal void InitArrayTypeId(IntPtr isolate)
        {
            arrayTypeId = PuertsDLL.RegisterClass(jsEnv.isolate, GetTypeId(isolate, typeof(Array)), "__puerts.Array", null, null, Utils.TwoIntToLong(jsEnv.Idx, 0));
            var lengthFuncId = jsEnv.AddCallback(ArrayLength);
            PuertsDLL.RegisterProperty(jsEnv.isolate, arrayTypeId, "Length", false, callbackWrap, lengthFuncId, null, 0, true);

            PuertsDLL.RegisterFunction(jsEnv.isolate, arrayTypeId, "get_Item", false, callbackWrap, jsEnv.AddCallback((IntPtr isolate1, IntPtr info, IntPtr self, int argumentsLen) =>
            {
                try
                {
                    Array array = jsEnv.GeneralGetterManager.GetSelf(self) as Array;
                    uint index = (uint)PuertsDLL.GetNumberFromValue(isolate1, PuertsDLL.GetArgumentValue(info, 0), false);
                    if (FastArrayGet(isolate1, info, self, array, index)) return;
                    var transalteFunc = jsEnv.GeneralSetterManager.GetTranslateFunc(array.GetType().GetElementType());
                    transalteFunc(isolate1, NativeValueApi.SetValueToResult, info, array.GetValue((int)index));
                }
                catch (Exception e)
                {
                    PuertsDLL.ThrowException(isolate1, "array.get throw c# exception:" + e.Message + ",stack:" + e.StackTrace);
                }
            }));

            PuertsDLL.RegisterFunction(jsEnv.isolate, arrayTypeId, "set_Item", false, callbackWrap, jsEnv.AddCallback((IntPtr isolate1, IntPtr info, IntPtr self, int argumentsLen) =>
            {
                try
                {
                    Array array = jsEnv.GeneralGetterManager.GetSelf(self) as Array;
                    uint index = (uint)PuertsDLL.GetNumberFromValue(isolate1, PuertsDLL.GetArgumentValue(info, 0), false);
                    var val = PuertsDLL.GetArgumentValue(info, 1);
                    if (FastArraySet(isolate1, info, self, array, index, val)) return;
                    var transalteFunc = jsEnv.GeneralGetterManager.GetTranslateFunc(array.GetType().GetElementType());
                    array.SetValue(transalteFunc(isolate1, NativeValueApi.GetValueFromArgument, val, false), index);
                }
                catch (Exception e)
                {
                    PuertsDLL.ThrowException(isolate1, "array.get throw c# exception:" + e.Message + ",stack:" + e.StackTrace);
                }
            }));
        }

        void AddAssemblieByName(IEnumerable<Assembly> assembliesUsorted, string name)
        {
            foreach (var assemblie in assembliesUsorted)
            {
                if (assemblie.FullName.StartsWith(name) && !assemblies.Contains(assemblie))
                {
                    assemblies.Add(assemblie);
                    break;
                }
            }
        }

#if (UNITY_WSA && !ENABLE_IL2CPP) && !UNITY_EDITOR
        public static List<Assembly> GetAssemblies()
        {
            List<Assembly> assembliesCache = null;
            System.Threading.Tasks.Task t = new System.Threading.Tasks.Task(() =>
            {
                assembliesCache = GetAssemblyList().Result;
            });
            t.Start();
            t.Wait();
            return assembliesCache;
            
        }

        public static async System.Threading.Tasks.Task<List<Assembly>> GetAssemblyList()
        {
            List<Assembly> assemblies = new List<Assembly>();
            //return assemblies;
            var files = await Windows.ApplicationModel.Package.Current.InstalledLocation.GetFilesAsync();
            if (files == null)
                return assemblies;

            foreach (var file in files.Where(file => file.FileType == ".dll" || file.FileType == ".exe"))
            {
                try
                {
                    assemblies.Add(Assembly.Load(new AssemblyName(file.DisplayName)));
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine(ex.Message);
                }

            }
            return assemblies;
        }
#endif
        internal Type GetType(string className, bool isQualifiedName = false)
        {
            Type type = Type.GetType(className, false);
            if (type != null)
            {
                return type;
            }
            foreach (Assembly assembly in assemblies)
            {
                type = assembly.GetType(className);

                if (type != null)
                {
                    return type;
                }
            }
            int p1 = className.IndexOf('[');
            if (p1 > 0 && !isQualifiedName)
            {
                string qualified_name = className.Substring(0, p1 + 1);
                string[] generic_params = className.Substring(p1 + 1, className.Length - qualified_name.Length - 1).Split(',');
                for (int i = 0; i < generic_params.Length; i++)
                {
                    Type generic_param = GetType(generic_params[i].Trim());
                    if (generic_param == null)
                    {
                        return null;
                    }
                    if (i != 0)
                    {
                        qualified_name += ", ";
                    }
                    qualified_name = qualified_name + "[" + generic_param.AssemblyQualifiedName + "]";
                }
                qualified_name += "]";
                return GetType(qualified_name, true);
            }
            return null;
        }

        private readonly V8FunctionCallback callbackWrap = new V8FunctionCallback(StaticCallbacks.JsEnvCallbackWrap);

        private readonly V8FunctionCallback returnTrue = new V8FunctionCallback(StaticCallbacks.ReturnTrue);

        private readonly V8ConstructorCallback constructorWrap = new V8ConstructorCallback(StaticCallbacks.ConstructorWrap);

        private readonly Dictionary<Type, int> typeIdMap = new Dictionary<Type, int>();

        private readonly Dictionary<int, Type> typeMap = new Dictionary<int, Type>();

        private readonly JsEnv jsEnv;

        private readonly List<Assembly> assemblies = new List<Assembly>();

        class ProperyMethods
        {
            public MethodInfo Getter;
            public MethodInfo Setter;
        }

        private JSFunctionCallback GenFieldGetter(Type type, FieldInfo field)
        {
            var translateFunc = jsEnv.GeneralSetterManager.GetTranslateFunc(field.FieldType);
            if (field.IsStatic)
            {
                return (IntPtr isolate, IntPtr info, IntPtr self, int argumentsLen) =>
                {
                    translateFunc(isolate, NativeValueApi.SetValueToResult, info, field.GetValue(null));
                };
            }
            else
            {
                return (IntPtr isolate, IntPtr info, IntPtr self, int argumentsLen) =>
                {
                    var me = jsEnv.GeneralGetterManager.GetSelf(self);
                    translateFunc(isolate, NativeValueApi.SetValueToResult, info, field.GetValue(me));
                };
            }
        }

        private JSFunctionCallback GenFieldSetter(Type type, FieldInfo field)
        {
            var translateFunc = jsEnv.GeneralGetterManager.GetTranslateFunc(field.FieldType);
            var typeMask = GeneralGetterManager.GetJsTypeMask(field.FieldType);
            if (field.IsStatic)
            {
                return (IntPtr isolate, IntPtr info, IntPtr self, int argumentsLen) =>
                {
                    var valuePtr = PuertsDLL.GetArgumentValue(info, 0);
                    var valueType = PuertsDLL.GetJsValueType(isolate, valuePtr, false);
                    if ((typeMask & valueType) != valueType)
                    {
                        PuertsDLL.ThrowException(isolate, "expect " + typeMask + " but got " + valueType);
                    }
                    else
                    {
                        field.SetValue(null, translateFunc(isolate, NativeValueApi.GetValueFromArgument, valuePtr, false));
                    }
                };
            }
            else
            {
                return (IntPtr isolate, IntPtr info, IntPtr self, int argumentsLen) =>
                {
                    var valuePtr = PuertsDLL.GetArgumentValue(info, 0);
                    var valueType = PuertsDLL.GetJsValueType(isolate, valuePtr, false);
                    if ((typeMask & valueType) != valueType)
                    {
                        PuertsDLL.ThrowException(isolate, "expect " + typeMask + " but got " + valueType);
                    }
                    else
                    {
                        var me = jsEnv.GeneralGetterManager.GetSelf(self);
                        field.SetValue(me, translateFunc(isolate, NativeValueApi.GetValueFromArgument, valuePtr, false));
                    }
                };
            }
        }

        Dictionary<Type, Func<TypeRegisterInfo>> lazyStaticWrapLoaders = new Dictionary<Type, Func<TypeRegisterInfo>>();

        internal void AddLazyStaticWrapLoader(Type type, Func<TypeRegisterInfo> lazyStaticWrapLoader)
        {
            lazyStaticWrapLoaders.Add(type, lazyStaticWrapLoader);
        }

        // #lizard forgives
        private int RegisterType(IntPtr isolate, Type type, bool includeNoPublic)
        {
            TypeRegisterInfo registerInfo = null;

            if (lazyStaticWrapLoaders.ContainsKey(type))
            {
                registerInfo = lazyStaticWrapLoaders[type]();
                lazyStaticWrapLoaders.Remove(type);
            }

            BindingFlags flag = BindingFlags.DeclaredOnly | BindingFlags.Instance | BindingFlags.Static | BindingFlags.Public;
            if (includeNoPublic)
            {
                flag = flag | BindingFlags.NonPublic;
            }

            // baseType
            int baseTypeId = -1;
            if (type.BaseType != null)
            {
                baseTypeId = GetTypeId(isolate, type.BaseType);
            }

            Dictionary<MethodKey, List<MethodInfo>> slowBindingMethodGroup = new Dictionary<MethodKey, List<MethodInfo>>();
            Dictionary<string, ProperyMethods> slowBindingProperties = new Dictionary<string, ProperyMethods>();
            List<FieldInfo> slowBindingFields = new List<FieldInfo>();
            
            Dictionary<MethodKey, List<MethodInfo>> lazyBindingMethodGroup = new Dictionary<MethodKey, List<MethodInfo>>();
            Dictionary<string, ProperyMethods> lazyBindingProperties = new Dictionary<string, ProperyMethods>();
            List<FieldInfo> lazyBindingFields = new List<FieldInfo>();

            Func<MethodKey, MethodInfo, bool> AddMethodToSlowBindingGroup = (MethodKey methodKey, MethodInfo method) =>
            {
                if (method.IsGenericMethodDefinition)
                {
                    if (!Utils.IsSupportedMethod(method))
                    {
                        return false;
                    }
                    var genericArguments = method.GetGenericArguments();
                    var constraintedArgumentTypes = new Type[genericArguments.Length];
                    for (var j = 0; j < genericArguments.Length; j++)
                    {
                        constraintedArgumentTypes[j] = genericArguments[j].BaseType;
                    }
                    method = method.MakeGenericMethod(constraintedArgumentTypes);
                }

                if (method.IsSpecialName && method.Name.StartsWith("get_") && method.GetParameters().Length != 1) // getter of property
                {
                    string propName = method.Name.Substring(4);
                    ProperyMethods properyMethods;
                    if (!slowBindingProperties.TryGetValue(propName, out properyMethods))
                    {
                        properyMethods = new ProperyMethods();
                        slowBindingProperties.Add(propName, properyMethods);
                    }
                    properyMethods.Getter = method;
                }
                else if (method.IsSpecialName && method.Name.StartsWith("set_") && method.GetParameters().Length != 2) // setter of property
                {
                    string propName = method.Name.Substring(4);
                    ProperyMethods properyMethods;
                    if (!slowBindingProperties.TryGetValue(propName, out properyMethods))
                    {
                        properyMethods = new ProperyMethods();
                        slowBindingProperties.Add(propName, properyMethods);
                    }
                    properyMethods.Setter = method;
                }
                else
                {
                    List<MethodInfo> overloads;
                    if (!slowBindingMethodGroup.TryGetValue(methodKey, out overloads))
                    {
                        overloads = new List<MethodInfo>();
                        slowBindingMethodGroup.Add(methodKey, overloads);
                    }
                    overloads.Add(method);
                }

                return true;
            };
            HashSet<string> readonlyStaticFields = new HashSet<string>();

            int typeId = -1;
            if (registerInfo == null)
            {
                // registerInfo is null, then all the member use the SlowBinding

                // constructors
                JSConstructorCallback constructorCallback = null;

                if (typeof(Delegate).IsAssignableFrom(type))
                {
                    DelegateConstructWrap delegateConstructWrap = new DelegateConstructWrap(type, jsEnv.GeneralGetterManager);
                    constructorCallback = delegateConstructWrap.Construct;
                }
                else
                {
                    bool hasNoParametersCtor = false;
                    var constructorWraps = type.GetConstructors(flag)
                        .Select(m =>
                        {
                            if (m.GetParameters().Length == 0)
                            {
                                hasNoParametersCtor = true;
                            }
                            return new OverloadReflectionWrap(m, jsEnv.GeneralGetterManager, jsEnv.GeneralSetterManager);
                        })
                        .ToList();
                    if (type.IsValueType && !hasNoParametersCtor)
                    {
                        constructorWraps.Add(new OverloadReflectionWrap(type, jsEnv.GeneralGetterManager));
                    }
                    MethodReflectionWrap constructorReflectionWrap = new MethodReflectionWrap(".ctor", constructorWraps);
                    constructorCallback = constructorReflectionWrap.Construct;
                }

                typeId = PuertsDLL.RegisterClass(jsEnv.isolate, baseTypeId, type.AssemblyQualifiedName, constructorWrap, null, jsEnv.AddConstructor(constructorCallback));

                // methods and properties
                MethodInfo[] methods = Puerts.Utils.GetMethodAndOverrideMethod(type, flag);

                for (int i = 0; i < methods.Length; ++i)
                {
                    MethodInfo method = methods[i];

                    MethodKey methodKey = new MethodKey { Name = method.Name, IsStatic = method.IsStatic };

                    if (!method.IsConstructor)
                    {
                        AddMethodToSlowBindingGroup(methodKey, method);
                    }
                }

                // extensionMethods
                // 因为内存问题与crash问题移入宏中
#if PUERTS_REFLECT_ALL_EXTENSION || UNITY_EDITOR
                IEnumerable<MethodInfo> extensionMethods = Utils.GetExtensionMethodsOf(type);
                if (extensionMethods != null)
                {
                    var enumerator = extensionMethods.GetEnumerator();
                    while (enumerator.MoveNext())
                    {
                        MethodInfo method = enumerator.Current;
                        MethodKey methodKey = new MethodKey { Name = method.Name, IsStatic = false, IsExtension = true };

                        AddMethodToSlowBindingGroup(methodKey, method);
                    }
                }
#endif

                // fields
                var fields = type.GetFields(flag);

                foreach (var field in fields)
                {
                    slowBindingFields.Add(field);
                    if (field.IsStatic && (field.IsInitOnly || field.IsLiteral))
                    {
                        readonlyStaticFields.Add(field.Name);
                    }
                }
            }
            else
            {
                // otherwise when registerInfo is not null, most of member use FastBinding, some member with IsLazyMember=true use LazyBinding

                if (registerInfo.BlittableCopy)
                {
                    typeId = PuertsDLL.RegisterStruct(jsEnv.isolate, -1, type.AssemblyQualifiedName, registerInfo.Constructor,
                        null, jsEnv.Idx, System.Runtime.InteropServices.Marshal.SizeOf(type));
                }
                else
                {
                    typeId = PuertsDLL.RegisterClass(jsEnv.isolate, baseTypeId, type.AssemblyQualifiedName, registerInfo.Constructor, null, jsEnv.Idx);
                }

                foreach (var kv in registerInfo.Methods)
                {
                    PuertsDLL.RegisterFunction(jsEnv.isolate, typeId, kv.Key.Name, kv.Key.IsStatic, kv.Value, jsEnv.Idx);
                    if (kv.Key.Name == "ToString" && registerInfo.BlittableCopy)
                    {
                        PuertsDLL.RegisterFunction(jsEnv.isolate, typeId, "toString", false, kv.Value, jsEnv.Idx);
                    }

                }

                foreach (var kv in registerInfo.Properties)
                {
                    PuertsDLL.RegisterProperty(jsEnv.isolate, typeId, kv.Key, kv.Value.IsStatic, kv.Value.Getter, jsEnv.Idx, kv.Value.Setter, jsEnv.Idx, !readonlyStaticFields.Contains(kv.Key));
                }

                foreach (LazyMemberRegisterInfo lazyinfo in registerInfo.LazyMembers)
                {
                    switch (lazyinfo.Type)
                    {
                        case LazyMemberType.Method:
                            LazyMethodWrap lazyMethodWrap = new LazyMethodWrap(lazyinfo.Name, jsEnv, type);
                            long callback = jsEnv.AddCallback(lazyMethodWrap.Invoke);
                            PuertsDLL.RegisterFunction(jsEnv.isolate, typeId, lazyinfo.Name, lazyinfo.IsStatic, callbackWrap, callback);
                            if (lazyinfo.Name == "ToString" && registerInfo.BlittableCopy)
                            {
                                PuertsDLL.RegisterFunction(jsEnv.isolate, typeId, "toString", false, callbackWrap, jsEnv.Idx);
                            }
                            break;
                        case LazyMemberType.Constructor:
                            // TODO
                            break;
                        case LazyMemberType.Field:
                            LazyFieldWrap lazyFieldWrap = new LazyFieldWrap(lazyinfo.Name, jsEnv, type);
                            PuertsDLL.RegisterProperty(
                                jsEnv.isolate, typeId, lazyinfo.Name, lazyinfo.IsStatic,
                                callbackWrap, jsEnv.AddCallback(lazyFieldWrap.InvokeGetter),
                                lazyinfo.HasSetter ? callbackWrap : null, lazyinfo.HasSetter ? jsEnv.AddCallback(lazyFieldWrap.InvokeSetter) : 0,
                                !readonlyStaticFields.Contains(lazyinfo.Name)
                            );
                            break;
                        case LazyMemberType.Property:
                            LazyPropertyWrap getterLazyPropertyWrap = new LazyPropertyWrap("get_" + lazyinfo.Name, jsEnv, type);
                            LazyPropertyWrap setterLazyPropertyWrap = new LazyPropertyWrap("set_" + lazyinfo.Name, jsEnv, type);
                            PuertsDLL.RegisterProperty(
                                jsEnv.isolate, typeId, lazyinfo.Name, lazyinfo.IsStatic,
                                lazyinfo.HasGetter ? callbackWrap : null, lazyinfo.HasGetter ? jsEnv.AddCallback(getterLazyPropertyWrap.Invoke) : 0,
                                lazyinfo.HasSetter ? callbackWrap : null, lazyinfo.HasSetter ? jsEnv.AddCallback(setterLazyPropertyWrap.Invoke) : 0,
                                true
                            );
                            break;
                    }
                }

                //if (registerInfo.LazyMethods != null) 
                //{
                //    // register all the methods marked as lazy
                //    foreach (var kv in registerInfo.LazyMethods)
                //    {
                //        //TODO: change to LazyBinding instead of SlowBinding
                //        MethodKey methodKey = kv.Key;
                //        MemberInfo[] members = type.GetMember(methodKey.Name, flag);

                //        var enumerator = members.GetEnumerator();
                //        while (enumerator.MoveNext())
                //        {
                //            AddMethodToSlowBindingGroup(methodKey, (MethodInfo)enumerator.Current);
                //        }
                //    }
                //}

                //if (registerInfo.LazyProperties != null)
                //{
                //    // register all the properties marked as lazy
                //    foreach (var kv in registerInfo.LazyProperties)
                //    {
                //        //TODO: change to LazyBinding instead of SlowBinding
                //        string name = kv.Key;

                //        MethodKey getMethodKey = new MethodKey { Name = "get_" + name, IsStatic = kv.Value.IsStatic };
                //        MethodInfo getMethod = type.GetMethod(getMethodKey.Name, flag);

                //        MethodKey setMethodKey = new MethodKey { Name = "set_" + name, IsStatic = kv.Value.IsStatic };
                //        MethodInfo setMethod = type.GetMethod(getMethodKey.Name, flag);

                //        if (getMethod != null)
                //        {
                //            AddMethodToSlowBindingGroup(getMethodKey, getMethod);
                //        }
                //        if (setMethod != null)
                //        {
                //            AddMethodToSlowBindingGroup(setMethodKey, setMethod);
                //        }
                //    }
                //}
            }

            foreach (var kv in slowBindingMethodGroup)
            {
                var overloadWraps = kv.Value.Select(m => new OverloadReflectionWrap(m, jsEnv.GeneralGetterManager, jsEnv.GeneralSetterManager, kv.Key.IsExtension)).ToList();
                MethodReflectionWrap methodReflectionWrap = new MethodReflectionWrap(kv.Key.Name, overloadWraps);
                PuertsDLL.RegisterFunction(jsEnv.isolate, typeId, kv.Key.Name, kv.Key.IsStatic, callbackWrap, jsEnv.AddCallback(methodReflectionWrap.Invoke));
            }
            foreach (var kv in slowBindingProperties)
            {
                V8FunctionCallback getter = null;
                long getterData = 0;
                bool isStatic = false;
                if (kv.Value.Getter != null)
                {
                    getter = callbackWrap;
                    MethodReflectionWrap methodReflectionWrap = new MethodReflectionWrap(kv.Value.Getter.Name, new List<OverloadReflectionWrap>() {
                        new OverloadReflectionWrap(kv.Value.Getter, jsEnv.GeneralGetterManager, jsEnv.GeneralSetterManager)
                    });
                    getterData = jsEnv.AddCallback(methodReflectionWrap.Invoke);
                    isStatic = kv.Value.Getter.IsStatic;
                }
                V8FunctionCallback setter = null;
                long setterData = 0;
                if (kv.Value.Setter != null)
                {
                    setter = callbackWrap;
                    MethodReflectionWrap methodReflectionWrap = new MethodReflectionWrap(kv.Value.Setter.Name, new List<OverloadReflectionWrap>() {
                        new OverloadReflectionWrap(kv.Value.Setter, jsEnv.GeneralGetterManager, jsEnv.GeneralSetterManager)
                    });
                    setterData = jsEnv.AddCallback(methodReflectionWrap.Invoke);
                    isStatic = kv.Value.Setter.IsStatic;
                }
                PuertsDLL.RegisterProperty(jsEnv.isolate, typeId, kv.Key, isStatic, getter, getterData, setter, setterData, true);
            }
            foreach (var field in slowBindingFields)
            {
                var getterData = jsEnv.AddCallback(GenFieldGetter(type, field));

                V8FunctionCallback setter = null;
                long setterData = 0;

                if (!field.IsInitOnly && !field.IsLiteral)
                {
                    setter = callbackWrap;
                    setterData = jsEnv.AddCallback(GenFieldSetter(type, field));
                }

                PuertsDLL.RegisterProperty(jsEnv.isolate, typeId, field.Name, field.IsStatic, callbackWrap, getterData, setter, setterData, !readonlyStaticFields.Contains(field.Name));
            }

            var translateFunc = jsEnv.GeneralSetterManager.GetTranslateFunc(typeof(Type));
            PuertsDLL.RegisterProperty(jsEnv.isolate, typeId, "__p_innerType", true, callbackWrap, jsEnv.AddCallback((IntPtr isolate1, IntPtr info, IntPtr self, int argumentsLen) =>
            {
                translateFunc(isolate1, NativeValueApi.SetValueToResult, info, type);
            }), null, 0, true);

            if (type.IsEnum)
            {
                PuertsDLL.RegisterProperty(jsEnv.isolate, typeId, "__p_isEnum", true, returnTrue, 0, null, 0, false);
            }

            return typeId;
        }
        /*
        unsafe private int RegisterTestStruct(IntPtr isolate, Type type)
        {
            int typeId = PuertsDLL.RegisterStruct(jsEnv.isolate, -1, type.AssemblyQualifiedName, TestStructWrap.Constructor, null, 0, System.Runtime.InteropServices.Marshal.SizeOf(type));
            PuertsDLL.RegisterProperty(jsEnv.isolate, typeId, "X", false, TestStructWrap.GetX, 0, TestStructWrap.SetX, 0);
            PuertsDLL.RegisterProperty(jsEnv.isolate, typeId, "Y", false, TestStructWrap.GetY, 0, TestStructWrap.SetY, 0);
            jsEnv.generalGetterManager.RegisterTranslateFunc(type, (IntPtr isolate1, IJsValueApi nativeTranslateApi, IntPtr value, bool isByRef) =>
            {
                TestStruct* testStruct = (TestStruct*)nativeTranslateApi.GetObject(isolate1, value, isByRef);
                return *testStruct;
            });
            
            return typeId;
        }
        */
        public int GetTypeId(IntPtr isolate, Type type, out bool isFirst)
        {
            if (type.IsArray)
            {
                isFirst = false;
                return arrayTypeId;
            }
            int typeId;
            isFirst = false;
            if (!typeIdMap.TryGetValue(type, out typeId))
            {
                isFirst = true;
                typeId = /*typeof(TestStruct) == type ? RegisterTestStruct(isolate, type) : */RegisterType(isolate, type, false);
                typeIdMap[type] = typeId;
                typeMap[typeId] = type;
            }
            return typeId;
        }

        public bool IsArray(int typeId)
        {
            return typeId == arrayTypeId;
        }

        public int GetTypeId(IntPtr isolate, Type type)
        {
            bool isFirst;
            return GetTypeId(isolate, type, out isFirst);
        }

        public Type GetType(int typeId)
        {
            return typeMap[typeId];
        }
    }
}
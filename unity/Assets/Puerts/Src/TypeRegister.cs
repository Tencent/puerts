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
            AddAssemblieByName(assembliesUsorted, "mscorlib,"); //Ϊ�����⼸��������ǰ��
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
            catch(Exception e)
            {
                PuertsDLL.ThrowException(isolate, "array.length throw c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }

        internal void ArrayGet(IntPtr isolate, IntPtr info, IntPtr self, uint index)
        {
            try
            {
                Array array = jsEnv.GeneralGetterManager.GetSelf(self) as Array;
                var transalteFunc = jsEnv.GeneralSetterManager.GetTranslateFunc(array.GetType().GetElementType());
                transalteFunc(isolate, NativeValueApi.SetValueToIndexResult, info, array.GetValue((int)index));
            }
            catch (Exception e)
            {
                PuertsDLL.ThrowException(isolate, "array.get throw c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }

        internal void ArraySet(IntPtr isolate, IntPtr info, IntPtr self, uint index, IntPtr value)
        {
            try
            {
                Array array = jsEnv.GeneralGetterManager.GetSelf(self) as Array;
                var transalteFunc = jsEnv.GeneralGetterManager.GetTranslateFunc(array.GetType().GetElementType());
                var val = transalteFunc(isolate, NativeValueApi.GetValueFromArgument, value, false);
                array.SetValue(val, (int)index);
            }
            catch (Exception e)
            {
                PuertsDLL.ThrowException(isolate, "array.get throw c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }

        private int arrayTypeId = -1;
        internal void InitArrayTypeId(IntPtr isolate)
        {
            arrayTypeId = PuertsDLL.RegisterClass(jsEnv.isolate, GetTypeId(isolate, typeof(Array)), "__puerts.Array", null, null, 0);
            PuertsDLL.RegisterProperty(jsEnv.isolate, arrayTypeId, "length", false, callbackWrap, jsEnv.AddCallback(ArrayLength), null, 0);
            PuertsDLL.RegisterIndexedProperty(jsEnv.isolate, arrayTypeId, StaticCallbacks.IndexedGetterWrap, StaticCallbacks.IndexedSetterWrap, Utils.TwoIntToLong(jsEnv.Idx, 0));
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

        private FunctionCallback GenFieldGetter(Type type, FieldInfo field)
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

        private FunctionCallback GenFieldSetter(Type type, FieldInfo field)
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

            MethodInfo[] methods = type.GetMethods(flag);
            Dictionary<MethodKey, List<MethodInfo>> methodGroup = new Dictionary<MethodKey, List<MethodInfo>>();
            Dictionary<string, ProperyMethods> propertyGroup = new Dictionary<string, ProperyMethods>();

            for (int i = 0; i < methods.Length; ++i)
            {
                MethodInfo method = methods[i];
                if (method.IsConstructor || method.IsGenericMethodDefinition)
                {
                    continue;
                }

                MethodKey methodKey = new MethodKey { Name = method.Name, IsStatic = method.IsStatic };

                if (registerInfo != null && registerInfo.Methods.ContainsKey(methodKey))
                {
                    continue;
                }

                if (method.IsSpecialName && method.Name.StartsWith("get_") && method.GetParameters().Length != 1) // getter of property
                {
                    string propName = method.Name.Substring(4);
                    if (registerInfo != null && registerInfo.Properties.ContainsKey(propName))
                    {
                        continue;
                    }
                    ProperyMethods properyMethods;
                    if (!propertyGroup.TryGetValue(propName, out properyMethods))
                    {
                        properyMethods = new ProperyMethods();
                        propertyGroup.Add(propName, properyMethods);
                    }
                    properyMethods.Getter = method;
                    continue;
                }
                else if (method.IsSpecialName && method.Name.StartsWith("set_") && method.GetParameters().Length != 2) // setter of property
                {
                    string propName = method.Name.Substring(4);
                    if (registerInfo != null && registerInfo.Properties.ContainsKey(propName))
                    {
                        continue;
                    }
                    ProperyMethods properyMethods;
                    if (!propertyGroup.TryGetValue(propName, out properyMethods))
                    {
                        properyMethods = new ProperyMethods();
                        propertyGroup.Add(propName, properyMethods);
                    }
                    properyMethods.Setter = method;
                    continue;
                }

                List<MethodInfo> overloads;
                if (!methodGroup.TryGetValue(methodKey, out overloads))
                {
                    overloads = new List<MethodInfo>();
                    methodGroup.Add(methodKey, overloads);
                }
                overloads.Add(method);
            }

            ConstructorCallback constructorCallback = null;

            if (typeof(Delegate).IsAssignableFrom(type))
            {
                DelegateConstructWrap delegateConstructWrap = new DelegateConstructWrap(type, jsEnv.GeneralGetterManager);
                constructorCallback = delegateConstructWrap.Construct;
            }
            else
            {
                var constructorWraps = type.GetConstructors(flag)
                    .Select(m => new OverloadReflectionWrap(m, jsEnv.GeneralGetterManager, jsEnv.GeneralSetterManager)).ToList();
                MethodReflectionWrap constructorReflectionWrap = new MethodReflectionWrap(".ctor", constructorWraps);
                constructorCallback = constructorReflectionWrap.Construct;
            }

            int baseTypeId = -1;
            if (type.BaseType != null)
            {
                baseTypeId = GetTypeId(isolate, type.BaseType);
            }

            int typeId = -1;
            if (registerInfo == null)
            {
                typeId = PuertsDLL.RegisterClass(jsEnv.isolate, baseTypeId, type.AssemblyQualifiedName, constructorWrap, null, jsEnv.AddConstructor(constructorCallback));
            }
            else
            {
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
                }

                foreach (var kv in registerInfo.Properties)
                {
                    PuertsDLL.RegisterProperty(jsEnv.isolate, typeId, kv.Key, kv.Value.IsStatic, kv.Value.Getter, jsEnv.Idx, kv.Value.Setter, jsEnv.Idx);
                }
            }
            
            //int typeId = PuertsDLL.RegisterClass(jsEngine, type.AssemblyQualifiedName, null, null, Utils.TwoIntToLong(idx, 0));

            foreach (var kv in methodGroup)
            {
                MethodReflectionWrap methodReflectionWrap = new MethodReflectionWrap(kv.Key.Name, kv.Value.Select(m => new OverloadReflectionWrap(m, jsEnv.GeneralGetterManager, jsEnv.GeneralSetterManager)).ToList());
                PuertsDLL.RegisterFunction(jsEnv.isolate, typeId, kv.Key.Name, kv.Key.IsStatic, callbackWrap, jsEnv.AddCallback(methodReflectionWrap.Invoke));
            }

            foreach(var kv in propertyGroup)
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
                PuertsDLL.RegisterProperty(jsEnv.isolate, typeId, kv.Key, isStatic, getter, getterData, setter, setterData);
            }

            foreach(var field in type.GetFields(flag))
            {
                if (registerInfo != null && registerInfo.Properties.ContainsKey(field.Name))
                {
                    continue;
                }
                var getterData = jsEnv.AddCallback(GenFieldGetter(type, field));

                V8FunctionCallback setter = null;
                long setterData = 0;

                if (!field.IsInitOnly && !field.IsLiteral)
                {
                    setter = callbackWrap;
                    setterData = jsEnv.AddCallback(GenFieldSetter(type, field));
                }

                PuertsDLL.RegisterProperty(jsEnv.isolate, typeId, field.Name, field.IsStatic, callbackWrap, getterData, setter, setterData);
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
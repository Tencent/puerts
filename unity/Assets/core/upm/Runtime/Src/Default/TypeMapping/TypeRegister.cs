/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if !EXPERIMENTAL_IL2CPP_PUERTS || !ENABLE_IL2CPP
using System;
using System.Linq;
using System.Reflection;
using System.Collections.Generic;
using Puerts.TypeMapping;

namespace Puerts
{
    class PropertyMethods
    {
        public MethodInfo Getter;
        public MethodInfo Setter;
    }

    class SlowBindingRegister
    {
        public RegisterInfo registerInfo;
        public Dictionary<MethodKey, List<MethodInfo>> slowBindingMethodGroup = new Dictionary<MethodKey, List<MethodInfo>>();
        public Dictionary<string, PropertyMethods> slowBindingProperties = new Dictionary<string, PropertyMethods>();
        public List<FieldInfo> slowBindingFields = new List<FieldInfo>();

        public SlowBindingRegister()
        {

        }
        public bool needFillSlowBindingConstructor = false;
        public List<string> needFillSlowBindingMethod = new List<string>();
        public List<string> needFillSlowBindingProperty = new List<string>();

        internal bool AddMethod(MethodKey methodKey, MethodInfo method)
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
                if (registerInfo == null || needFillSlowBindingProperty.Contains(propName))
                {
                    PropertyMethods properyMethods;
                    if (!slowBindingProperties.TryGetValue(propName, out properyMethods))
                    {
                        properyMethods = new PropertyMethods();
                        slowBindingProperties.Add(propName, properyMethods);
                    }
                    properyMethods.Getter = method;
                }
            }
            else if (method.IsSpecialName && method.Name.StartsWith("set_") && method.GetParameters().Length != 2) // setter of property
            {
                string propName = method.Name.Substring(4);
                if (registerInfo == null || needFillSlowBindingProperty.Contains(propName))
                {
                    PropertyMethods properyMethods;
                    if (!slowBindingProperties.TryGetValue(propName, out properyMethods))
                    {
                        properyMethods = new PropertyMethods();
                        slowBindingProperties.Add(propName, properyMethods);
                    }
                    properyMethods.Setter = method;
                }
            }
            else
            {
                if (registerInfo == null || needFillSlowBindingMethod.Contains(methodKey.Name))
                {
                    List<MethodInfo> overloads;
                    if (!slowBindingMethodGroup.TryGetValue(methodKey, out overloads))
                    {
                        overloads = new List<MethodInfo>();
                        slowBindingMethodGroup.Add(methodKey, overloads);
                    }
                    overloads.Add(method);
                }
            }

            return true;
        }

        internal void AddField(FieldInfo fieldInfo)
        {
            if (registerInfo == null || needFillSlowBindingProperty.Contains(fieldInfo.Name))
                slowBindingFields.Add(fieldInfo);
        }
    }

    internal class TypeRegister
    {

        private JsEnv jsEnv;

        private RegisterInfoManager RegisterInfoManager;

        public TypeRegister(JsEnv jsEnv, RegisterInfoManager RegisterInfoManager)
        {
            this.jsEnv = jsEnv;
            this.RegisterInfoManager = RegisterInfoManager;
        }

        private readonly V8FunctionCallback callbackWrap = new V8FunctionCallback(StaticCallbacks.JsEnvCallbackWrap);

        private readonly V8FunctionCallback returnTrue = new V8FunctionCallback(StaticCallbacks.ReturnTrue);

        private readonly V8ConstructorCallback constructorWrap = new V8ConstructorCallback(StaticCallbacks.ConstructorWrap);

        internal int InitArrayTypeId(int csArrayTypeId)
        {
            var isolate = jsEnv.isolate;
            var arrayTypeId = PuertsDLL.RegisterClass(jsEnv.isolate, csArrayTypeId, "__puerts.Array", null, null, jsEnv.Idx);
            var lengthFuncId = jsEnv.AddCallback(ArrayLength);
            PuertsDLL.RegisterProperty(jsEnv.isolate, arrayTypeId, "Length", false, callbackWrap, lengthFuncId, null, 0, true);

            PuertsDLL.RegisterFunction(jsEnv.isolate, arrayTypeId, "get_Item", false, callbackWrap, jsEnv.AddCallback((IntPtr isolate1, IntPtr info, IntPtr self, int argumentsLen) =>
            {
                try
                {
                    Array array = jsEnv.GeneralGetterManager.GetSelf(jsEnv.Idx, self) as Array;
                    uint index = (uint)PuertsDLL.GetNumberFromValue(isolate1, PuertsDLL.GetArgumentValue(info, 0), false);
                    if (FastArrayGet(isolate1, info, self, array, index)) return;
                    var transalteFunc = jsEnv.GeneralSetterManager.GetTranslateFunc(array.GetType().GetElementType());
                    transalteFunc(jsEnv.Idx, isolate1, NativeValueApi.SetValueToResult, info, array.GetValue((int)index));
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
                    Array array = jsEnv.GeneralGetterManager.GetSelf(jsEnv.Idx, self) as Array;
                    uint index = (uint)PuertsDLL.GetNumberFromValue(isolate1, PuertsDLL.GetArgumentValue(info, 0), false);
                    var val = PuertsDLL.GetArgumentValue(info, 1);
                    if (FastArraySet(isolate1, info, self, array, index, val)) return;
                    var transalteFunc = jsEnv.GeneralGetterManager.GetTranslateFunc(array.GetType().GetElementType());
                    array.SetValue(transalteFunc(jsEnv.Idx, isolate1, NativeValueApi.GetValueFromArgument, val, false), index);
                }
                catch (Exception e)
                {
                    PuertsDLL.ThrowException(isolate1, "array.get throw c# exception:" + e.Message + ",stack:" + e.StackTrace);
                }
            }));

            return arrayTypeId;
        }

        private void ArrayLength(IntPtr isolate, IntPtr info, IntPtr self, int argumentsLen)
        {
            try
            {
                Array array = jsEnv.GeneralGetterManager.GetSelf(jsEnv.Idx, self) as Array;
                PuertsDLL.ReturnNumber(isolate, info, array.Length);
            }
            catch (Exception e)
            {
                PuertsDLL.ThrowException(isolate, "array.length throw c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }

        private bool FastArrayGet(IntPtr isolate, IntPtr info, IntPtr self, object obj, uint index)
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

        private bool FastArraySet(IntPtr isolate, IntPtr info, IntPtr self, object obj, uint index, IntPtr value)
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

        internal int RegisterType(
            Type type,
            int baseTypeId,
            bool includeNoPublic)
        {
            var isolate = jsEnv.isolate;
            // TypeRegisterInfo registerInfo = null;
            RegisterInfo registerInfo = null;
            Func<RegisterInfo> registerInfoGetter = null;

            // find RegisterInfo
            if (RegisterInfoManager.TryGetValue(type, out registerInfoGetter))
            {
                registerInfo = registerInfoGetter();
                RegisterInfoManager.Remove(type);
                // }
                // else if (type.IsGenericType)
                // {
                //     Type WrapperDefinition = GenericWrapperTree.FindWrapperDefinition(type);
                //     if (WrapperDefinition == null) 
                //     {
                //         lazyStaticWrapLoaders.Add(type, null);
                //     }
                //     else
                //     {
                //         Type WrapperType = WrapperDefinition.MakeGenericType(type.GetGenericArguments());
                //         registerInfo = WrapperType.GetMethod("GetRegisterInfo").Invoke(null, null) as TypeRegisterInfo;
                //     }
            }

            BindingFlags flag = BindingFlags.DeclaredOnly | BindingFlags.Instance | BindingFlags.Static | BindingFlags.Public;
            if (includeNoPublic)
            {
                flag = flag | BindingFlags.NonPublic;
            }

            SlowBindingRegister sbr = new SlowBindingRegister();
            sbr.registerInfo = registerInfo;

            HashSet<string> readonlyStaticFields = new HashSet<string>();

            int typeId = RegisterConstructor(type, registerInfo, baseTypeId, flag);
            if (registerInfo != null)
            {
                // foreach (var memberRegisterInfo in registerInfo.Members)
                var keys = registerInfo.Members.Keys.ToList();
                for (int i = 0, l = keys.Count; i < l; i++)
                {
                    var memberRegisterInfo = registerInfo.Members[keys[i]];
                    if (memberRegisterInfo.MemberType == MemberType.Constructor)
                    {
                    }
                    else if (memberRegisterInfo.MemberType == MemberType.Method)
                    {
                        if (memberRegisterInfo.Method == null || memberRegisterInfo.UseBindingMode != BindingMode.FastBinding) 
                        {
                            if (RegisterInfoManager.DefaultBindingMode != BindingMode.DontBinding) sbr.needFillSlowBindingMethod.Add(memberRegisterInfo.Name);
                            continue;
                        }
                        var result = PuertsDLL.RegisterFunction(jsEnv.isolate, typeId, memberRegisterInfo.Name, memberRegisterInfo.IsStatic, memberRegisterInfo.Method, jsEnv.Idx);
                        // System.Console.WriteLine("*" + typeId + "_" + type + "." + memberRegisterInfo.Name + "->" + result);
                        if (memberRegisterInfo.Name == "ToString" && registerInfo.BlittableCopy)
                        {
                            PuertsDLL.RegisterFunction(jsEnv.isolate, typeId, "toString", false, memberRegisterInfo.Method, jsEnv.Idx);
                        }
                    }
                    else if (memberRegisterInfo.MemberType == MemberType.Property)
                    {
                        if ((memberRegisterInfo.PropertyGetter == null && memberRegisterInfo.PropertySetter == null) || memberRegisterInfo.UseBindingMode != BindingMode.FastBinding)
                        {
                            if (RegisterInfoManager.DefaultBindingMode != BindingMode.DontBinding) sbr.needFillSlowBindingProperty.Add(memberRegisterInfo.Name);
                            continue;
                        }
                        PuertsDLL.RegisterProperty(jsEnv.isolate, typeId, memberRegisterInfo.Name, memberRegisterInfo.IsStatic, memberRegisterInfo.PropertyGetter, jsEnv.Idx, memberRegisterInfo.PropertySetter, jsEnv.Idx, !readonlyStaticFields.Contains(memberRegisterInfo.Name));
                    }
                }
            // } else {
            //     System.Console.WriteLine(type);
            }
            
            if (registerInfo == null || (sbr.needFillSlowBindingProperty.Count > 0 || sbr.needFillSlowBindingMethod.Count > 0))
            {

                // methods and properties
                MethodInfo[] methods = Puerts.Utils.GetMethodAndOverrideMethod(type, flag);

                for (int i = 0; i < methods.Length; ++i)
                {
                    MethodInfo method = methods[i];

                    MethodKey methodKey = new MethodKey { Name = method.Name, IsStatic = method.IsStatic };

                    if (!method.IsConstructor)
                    {
                        sbr.AddMethod(methodKey, method);
                    }
                }

                // extensionMethods
                // 因为内存问题与crash问题移入宏中
#if PUERTS_REFLECT_ALL_EXTENSION || UNITY_EDITOR
// #if UNITY_EDITOR && !PUERTS_REFLECT_ALL_EXTENSION && !EXPERIMENTAL_IL2CPP_PUERTS
//                 if (!UnityEditor.EditorApplication.isPlaying) 
// #endif
                {
                    IEnumerable<MethodInfo> extensionMethods = Utils.GetExtensionMethodsOf(type);
                    if (extensionMethods != null)
                    {
                        var enumerator = extensionMethods.GetEnumerator();
                        while (enumerator.MoveNext())
                        {
                            MethodInfo method = enumerator.Current;
                            MethodKey methodKey = new MethodKey { Name = method.Name, IsStatic = false, IsExtension = true };

                            sbr.AddMethod(methodKey, method);
                        }
                    }
                }
#endif

                // fields
                var fields = type.GetFields(flag);

                foreach (var field in fields)
                {
                    sbr.AddField(field);
                    if (field.IsStatic && (field.IsInitOnly || field.IsLiteral))
                    {
                        readonlyStaticFields.Add(field.Name);
                    }
                }
            }

            foreach (var kv in sbr.slowBindingMethodGroup)
            {
                var overloadWraps = kv.Value.Select(m => new OverloadReflectionWrap(m, jsEnv, kv.Key.IsExtension)).ToList();
                MethodReflectionWrap methodReflectionWrap = new MethodReflectionWrap(kv.Key.Name, overloadWraps);
                PuertsDLL.RegisterFunction(jsEnv.isolate, typeId, kv.Key.Name, kv.Key.IsStatic, callbackWrap, jsEnv.AddCallback(methodReflectionWrap.Invoke));
            }
            foreach (var kv in sbr.slowBindingProperties)
            {
                V8FunctionCallback getter = null;
                long getterData = 0;
                bool isStatic = false;
                if (kv.Value.Getter != null)
                {
                    getter = callbackWrap;
                    MethodReflectionWrap methodReflectionWrap = new MethodReflectionWrap(kv.Value.Getter.Name, new List<OverloadReflectionWrap>() {
                        new OverloadReflectionWrap(kv.Value.Getter, jsEnv)
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
                        new OverloadReflectionWrap(kv.Value.Setter, jsEnv)
                    });
                    setterData = jsEnv.AddCallback(methodReflectionWrap.Invoke);
                    isStatic = kv.Value.Setter.IsStatic;
                }
                PuertsDLL.RegisterProperty(jsEnv.isolate, typeId, kv.Key, isStatic, getter, getterData, setter, setterData, true);
            }
            foreach (var field in sbr.slowBindingFields)
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
                translateFunc(jsEnv.Idx, isolate1, NativeValueApi.SetValueToResult, info, type);
            }), null, 0, true);

            if (type.IsEnum)
            {
                PuertsDLL.RegisterProperty(jsEnv.isolate, typeId, "__p_isEnum", true, returnTrue, 0, null, 0, false);
            }

            return typeId;
        }

        private int RegisterConstructor(Type type, RegisterInfo registerInfo, int baseTypeId, BindingFlags flag)
        {
            var reflectConstructor = true;
            int typeId = 0;
            if (registerInfo != null)
            {
                // foreach (var memberRegisterInfo in registerInfo.Members)
                var keys = registerInfo.Members.Keys.ToList();
                for (int i = 0, l = keys.Count; i < l; i++)
                {
                    var memberRegisterInfo = registerInfo.Members[keys[i]];
                    if (memberRegisterInfo.MemberType == MemberType.Constructor)
                    {
                        if (memberRegisterInfo.Constructor == null || memberRegisterInfo.UseBindingMode != BindingMode.FastBinding) 
                        {
                            reflectConstructor = RegisterInfoManager.DefaultBindingMode != BindingMode.DontBinding;
                            break;
                        }
                        reflectConstructor = false;
                        if (registerInfo.BlittableCopy)
                        {
                            typeId = PuertsDLL.RegisterStruct(jsEnv.isolate, -1, type.AssemblyQualifiedName, memberRegisterInfo.Constructor,
                                null, jsEnv.Idx, System.Runtime.InteropServices.Marshal.SizeOf(type));
                        }
                        else
                        {
                            typeId = PuertsDLL.RegisterClass(jsEnv.isolate, baseTypeId, type.AssemblyQualifiedName, memberRegisterInfo.Constructor, null, jsEnv.Idx);
                        }
                    }
                }
            }

            if (reflectConstructor)
            {
                JSConstructorCallback constructorCallback = null;

                if (typeof(Delegate).IsAssignableFrom(type))
                {
                    DelegateConstructWrap delegateConstructWrap = new DelegateConstructWrap(type, jsEnv);
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
                            return new OverloadReflectionWrap(m, jsEnv);
                        })
                        .ToList();
                    if (type.IsValueType && !hasNoParametersCtor)
                    {
                        constructorWraps.Add(new OverloadReflectionWrap(type, jsEnv));
                    }
                    MethodReflectionWrap constructorReflectionWrap = new MethodReflectionWrap(".ctor", constructorWraps);
                    constructorCallback = constructorReflectionWrap.Construct;
                }

                typeId = PuertsDLL.RegisterClass(jsEnv.isolate, baseTypeId, type.AssemblyQualifiedName, constructorWrap, null, jsEnv.AddConstructor(constructorCallback));
            
            }

            return typeId;
        }

        private JSFunctionCallback GenFieldGetter(Type type, FieldInfo field)
        {
            var translateFunc = jsEnv.GeneralSetterManager.GetTranslateFunc(field.FieldType);
            if (field.IsStatic)
            {
                return (IntPtr isolate, IntPtr info, IntPtr self, int argumentsLen) =>
                {
                    translateFunc(jsEnv.Idx, isolate, NativeValueApi.SetValueToResult, info, field.GetValue(null));
                };
            }
            else
            {
                return (IntPtr isolate, IntPtr info, IntPtr self, int argumentsLen) =>
                {
                    var me = jsEnv.GeneralGetterManager.GetSelf(jsEnv.Idx, self);
                    translateFunc(jsEnv.Idx, isolate, NativeValueApi.SetValueToResult, info, field.GetValue(me));
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
                    object value = null;
                    if (
                        !Utils.IsJsValueTypeMatchType(valueType, field.FieldType, typeMask, () =>
                        {
                            value = translateFunc(jsEnv.Idx, isolate, NativeValueApi.GetValueFromArgument, valuePtr,
                                false);
                            return value;
                        }, value)
                    )
                    {
                        PuertsDLL.ThrowException(isolate, "expect " + typeMask + " but got " + valueType);
                    }
                    else
                    {
                        if (value == null)
                        {
                            value = translateFunc(jsEnv.Idx, isolate, NativeValueApi.GetValueFromArgument, valuePtr,
                                false);
                        }

                        field.SetValue(null, value);
                    }
                };
            }
            else
            {
                return (IntPtr isolate, IntPtr info, IntPtr self, int argumentsLen) =>
                {
                    var valuePtr = PuertsDLL.GetArgumentValue(info, 0);
                    var valueType = PuertsDLL.GetJsValueType(isolate, valuePtr, false);
                    object value = null;
                    if (
                        !Utils.IsJsValueTypeMatchType(valueType, field.FieldType, typeMask, () =>
                        {
                            value = translateFunc(jsEnv.Idx, isolate, NativeValueApi.GetValueFromArgument, valuePtr,
                                false);
                            return value;
                        }, value)
                    )
                    {
                        PuertsDLL.ThrowException(isolate, "expect " + typeMask + " but got " + valueType);
                    }
                    else
                    {
                        var me = jsEnv.GeneralGetterManager.GetSelf(jsEnv.Idx, self);
                        field.SetValue(me, translateFunc(jsEnv.Idx, isolate, NativeValueApi.GetValueFromArgument, valuePtr, false));
                    }
                };
            }
        }
    }
}
#endif
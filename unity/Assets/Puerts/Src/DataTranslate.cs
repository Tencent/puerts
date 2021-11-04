/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;
using System.Collections.Generic;

namespace Puerts
{
    //target参js对象静默转换到c#对象时有用
    public delegate object GeneralGetter(IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef);

    public class GeneralGetterManager
    {
        private ObjectPool objectPool;

        private TypeRegister typeRegister;

        private readonly JsEnv jsEnv;

        private Dictionary<Type, GeneralGetter> generalGetterMap = new Dictionary<Type, GeneralGetter>();

        private Dictionary<Type, GeneralGetter> nullableTypeGeneralGetterMap = new Dictionary<Type, GeneralGetter>();

        internal GenericDelegateFactory genericDelegateFactory;

        internal GeneralGetterManager(JsEnv jsEnv)
        {
            this.jsEnv = jsEnv;
            objectPool = jsEnv.objectPool;
            typeRegister = jsEnv.TypeRegister;
            genericDelegateFactory = jsEnv.genericDelegateFactory;

            generalGetterMap[typeof(char)] = CharTranslator;
            generalGetterMap[typeof(sbyte)] = SbyteTranslator;
            generalGetterMap[typeof(byte)] = ByteTranslator;
            generalGetterMap[typeof(short)] = ShortTranslator;
            generalGetterMap[typeof(ushort)] = UshortTranslator;
            generalGetterMap[typeof(int)] = IntTranslator;
            generalGetterMap[typeof(uint)] = UintTranslator;
            generalGetterMap[typeof(long)] = LongTranslator;
            generalGetterMap[typeof(ulong)] = UlongTranslator;
            generalGetterMap[typeof(double)] = DoubleTranslator;
            generalGetterMap[typeof(float)] = FloatTranslator;
            //translatorMap[typeof(decimal)] = decimalTranslator;
            generalGetterMap[typeof(bool)] = BooleanTranslator;
            generalGetterMap[typeof(string)] = StringTranslator;
            generalGetterMap[typeof(DateTime)] = DateTranslator;
            generalGetterMap[typeof(ArrayBuffer)] = ArrayBufferTranslator;
            generalGetterMap[typeof(GenericDelegate)] = GenericDelegateTranslator;
            generalGetterMap[typeof(JSObject)] = JSObjectTranslator;
            generalGetterMap[typeof(object)] = AnyTranslator;
            //special type
            //translatorMap[typeof(LuaTable)] = getLuaTable;
            //translatorMap[typeof(LuaFunction)] = getLuaFunction;
        }


        private static object CharTranslator(IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            return (char)getValueApi.GetNumber(isolate, value, isByRef);
        }

        private static object SbyteTranslator(IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            return (sbyte)getValueApi.GetNumber(isolate, value, isByRef);
        }

        private static object ByteTranslator(IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            return (byte)getValueApi.GetNumber(isolate, value, isByRef);
        }

        private static object ShortTranslator(IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            return (short)getValueApi.GetNumber(isolate, value, isByRef);
        }

        private static object UshortTranslator(IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            return (ushort)getValueApi.GetNumber(isolate, value, isByRef);
        }

        private static object IntTranslator(IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            return (int)getValueApi.GetNumber(isolate, value, isByRef);
        }

        private static object UintTranslator(IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            return (uint)getValueApi.GetNumber(isolate, value, isByRef);
        }

        private static object LongTranslator(IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            return getValueApi.GetBigInt(isolate, value, isByRef);
        }

        private static object UlongTranslator(IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            return (ulong)getValueApi.GetBigInt(isolate, value, isByRef);
        }

        private static object DoubleTranslator(IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            return getValueApi.GetNumber(isolate, value, isByRef);
        }

        private static object FloatTranslator(IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            return (float)getValueApi.GetNumber(isolate, value, isByRef);
        }

        private static object BooleanTranslator(IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            return getValueApi.GetBoolean(isolate, value, isByRef);
        }

        private static object StringTranslator(IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            return getValueApi.GetString(isolate, value, isByRef);
        }

        private static object DateTranslator(IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            var ticks = getValueApi.GetDate(isolate, value, isByRef);
            return (new DateTime(1970, 1, 1)).AddMilliseconds(ticks);
        }

        private static object ArrayBufferTranslator(IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            return getValueApi.GetArrayBuffer(isolate, value, isByRef);
        }

        private object JSObjectTranslator(IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            var jsValueType = getValueApi.GetJsValueType(isolate, value, isByRef);
            if (jsValueType == JsValueType.JsObject)
            {
                IntPtr DLLJSObjectPtr = getValueApi.GetJSObject(isolate, value, isByRef);
                return jsEnv.jsObjectFactory.GetOrCreateJSObject(DLLJSObjectPtr, jsEnv);
            }
            else
            {
                return AnyTranslator(isolate, getValueApi, value, isByRef);
            }
        }

        private object GenericDelegateTranslator(IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            var jsValueType = getValueApi.GetJsValueType(isolate, value, isByRef);
            if (jsValueType == JsValueType.Function)
            {
                var nativePtr = getValueApi.GetFunction(isolate, value, isByRef);
                return jsEnv.ToGenericDelegate(nativePtr);
            }
            else
            {
                return AnyTranslator(isolate, getValueApi, value, isByRef);
            }
        }

        internal object AnyTranslator(IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            var type = getValueApi.GetJsValueType(isolate, value, isByRef);
            switch (type)
            {
                case JsValueType.BigInt:
                    return getValueApi.GetBigInt(isolate, value, isByRef);
                case JsValueType.Boolean:
                    return getValueApi.GetBoolean(isolate, value, isByRef);
                case JsValueType.Date:
                    return DateTranslator(isolate, getValueApi, value, isByRef);
                case JsValueType.ArrayBuffer:
                    return getValueApi.GetArrayBuffer(isolate, value, isByRef);
                case JsValueType.Function:
                    return getValueApi.GetFunction(isolate, value, isByRef);
                case JsValueType.JsObject:
                    return JSObjectTranslator(isolate, getValueApi, value, isByRef);
                case JsValueType.NativeObject:
                    var typeId = getValueApi.GetTypeId(isolate, value, isByRef);
                    if (!typeRegister.IsArray(typeId))
                    {
                        var objType = typeRegister.GetType(typeId);
                        if (objType != typeof(object) && generalGetterMap.ContainsKey(objType))
                        {
                            return generalGetterMap[objType](isolate, getValueApi, value, isByRef);
                        }
                    }
                    var objPtr = getValueApi.GetNativeObject(isolate, value, isByRef);
                    var result = objectPool.Get(objPtr.ToInt32());

                    var typedValueResult = result as TypedValue;
                    if (typedValueResult != null)
                    {
                        return typedValueResult.Target;
                    }

                    return result;
                case JsValueType.Number:
                    return getValueApi.GetNumber(isolate, value, isByRef);
                case JsValueType.String:
                    return getValueApi.GetString(isolate, value, isByRef);
                default:
                    return null;
            }
        }

        GeneralGetter MakeNullableTranslateFunc(GeneralGetter jvt)
        {
            return (IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef) =>
            {
                if (getValueApi.GetJsValueType(isolate, value, isByRef) == JsValueType.NullOrUndefined)
                {
                    return null;
                }
                else
                {
                    return jvt(isolate, getValueApi, value, isByRef);
                }
            };
        }

        private GeneralGetter MakeTranslateFunc(Type type)
        {
            GeneralGetter fixTypeGetter = (IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef) =>
            {
                if (getValueApi.GetJsValueType(isolate, value, isByRef) == JsValueType.NativeObject)
                {
                    var objPtr = getValueApi.GetNativeObject(isolate, value, isByRef);
                    var obj = objectPool.Get(objPtr.ToInt32());
                    return (obj != null && type.IsAssignableFrom(obj.GetType())) ? obj : null;
                }
                return null;
            };

            if (typeof(Delegate).IsAssignableFrom(type))
            {
                return (IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef) =>
                {
                    var jsValueType = getValueApi.GetJsValueType(isolate, value, isByRef);
                    if (jsValueType == JsValueType.Function)
                    {
                        var nativePtr = getValueApi.GetFunction(isolate, value, isByRef);
                        var result = genericDelegateFactory.Create(type, nativePtr);
                        if (result == null)
                        {
                            throw new Exception("can not find delegate bridge for " + type.GetFriendlyName());
                        }
                        return result;
                    }
                    else
                    {
                        return fixTypeGetter(isolate, getValueApi, value, isByRef);
                    }
                };
            }

            return fixTypeGetter;
        }

        public GeneralGetter GetTranslateFunc(Type type)
        {
            if (type.IsByRef) return GetTranslateFunc(type.GetElementType());

            Type underlyingType = Nullable.GetUnderlyingType(type);
            if (underlyingType != null)
            {
                GeneralGetter jvt;
                if (!nullableTypeGeneralGetterMap.TryGetValue(underlyingType, out jvt))
                {
                    jvt = MakeNullableTranslateFunc(GetTranslateFunc(underlyingType));
                    nullableTypeGeneralGetterMap.Add(underlyingType, jvt);
                }
                return jvt;
            }
            else
            {
                if (type.IsEnum)
                {
                    return GetTranslateFunc(Enum.GetUnderlyingType(type));
                }
                GeneralGetter jvt;
                if (!generalGetterMap.TryGetValue(type, out jvt))
                {
                    jvt = MakeTranslateFunc(type);
                    generalGetterMap.Add(type, jvt);
                }
                return jvt;
            }
        }

        public void RegisterGetter(Type type, GeneralGetter generalGetter)
        {
            Type underlyingType = Nullable.GetUnderlyingType(type);
            if (underlyingType != null)
            {
                nullableTypeGeneralGetterMap.Add(underlyingType, generalGetter);
            }
            else
            {
                generalGetterMap.Add(type, generalGetter);
            }
        }

        public object GetSelf(IntPtr Self)
        {
            return objectPool.Get(Self.ToInt32());
        }

        static private Dictionary<Type, JsValueType> primitiveTypeMap = new Dictionary<Type, JsValueType>()
        {
            { typeof(sbyte), JsValueType.Number },
            { typeof(byte), JsValueType.Number },
            { typeof(short), JsValueType.Number },
            { typeof(ushort), JsValueType.Number },
            { typeof(int), JsValueType.Number },
            { typeof(uint), JsValueType.Number },
            { typeof(long), JsValueType.BigInt },
            { typeof(ulong), JsValueType.BigInt },
            { typeof(double), JsValueType.Number },
            { typeof(char), JsValueType.Number },
            { typeof(float), JsValueType.Number },
            //{ typeof(decimal), JsValueType.Number }, TODO: 把decimal by value 传递到js
            { typeof(bool), JsValueType.Boolean },
            { typeof(string), JsValueType.String | JsValueType.NullOrUndefined },
            { typeof(object), JsValueType.Any}
        };

        public static JsValueType GetJsTypeMask(Type type)
        {
            if (type.IsByRef)
            {
                return GetJsTypeMask(type.GetElementType());
            }

            Type underlyingType = Nullable.GetUnderlyingType(type);
            if (underlyingType != null)
            {
                return GetJsTypeMask(underlyingType) | JsValueType.NullOrUndefined;
            }

            if (type.IsEnum)
            {
                return GetJsTypeMask(Enum.GetUnderlyingType(type));
            }

            JsValueType mask = 0;
            if (primitiveTypeMap.ContainsKey(type))
            {
                mask = primitiveTypeMap[type];
            }
            else if (type.IsArray)
            {
                mask = JsValueType.NativeObject | JsValueType.NullOrUndefined;
            }
            else if (type == typeof(DateTime))
            {
                mask = JsValueType.Date;
            }
            else if (type == typeof(ArrayBuffer))
            {
                mask = JsValueType.ArrayBuffer;
            }
            else if (type == typeof(JSObject))
            {
                mask = JsValueType.JsObject | JsValueType.NullOrUndefined;
            }
            else if (type == typeof(GenericDelegate))
            {
                mask = JsValueType.Function | JsValueType.NativeObject | JsValueType.NullOrUndefined;
            }
            else if (!type.IsAbstract() && typeof(Delegate).IsAssignableFrom(type))
            {
                mask = JsValueType.Function | JsValueType.NativeObject | JsValueType.NullOrUndefined;
            }
            else if (type.IsValueType())
            {
                mask = JsValueType.NativeObject/* | JsValueType.JsObject*/; //TODO: 支持js对象到C#对象静默转换
            }
            else
            {
                mask = JsValueType.NativeObject | JsValueType.NullOrUndefined;
                /*if ((type.IsClass() && type.GetConstructor(System.Type.EmptyTypes) != null))
                {
                    mash = mash | JsValueType.JsObject;
                }*/
            }

            return mask;
        }
    }

    public delegate void GeneralSetter(IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj);

    public class GeneralSetterManager
    {
        private ObjectPool objectPool;

        private TypeRegister typeRegister;

        private Dictionary<Type, GeneralSetter> generalSetterMap = new Dictionary<Type, GeneralSetter>();

        public GeneralSetterManager(JsEnv jsEnv)
        {
            objectPool = jsEnv.objectPool;
            typeRegister = jsEnv.TypeRegister;

            generalSetterMap[typeof(char)] = CharTranslator;
            generalSetterMap[typeof(sbyte)] = SbyteTranslator;
            generalSetterMap[typeof(byte)] = ByteTranslator;
            generalSetterMap[typeof(short)] = ShortTranslator;
            generalSetterMap[typeof(ushort)] = UshortTranslator;
            generalSetterMap[typeof(int)] = IntTranslator;
            generalSetterMap[typeof(uint)] = UintTranslator;
            generalSetterMap[typeof(long)] = LongTranslator;
            generalSetterMap[typeof(ulong)] = UlongTranslator;
            generalSetterMap[typeof(double)] = DoubleTranslator;
            generalSetterMap[typeof(float)] = FloatTranslator;
            //translatorMap[typeof(decimal)] = decimalTranslator;
            generalSetterMap[typeof(bool)] = BooleanTranslator;
            generalSetterMap[typeof(string)] = StringTranslator;
            generalSetterMap[typeof(DateTime)] = DateTranslator;
            generalSetterMap[typeof(ArrayBuffer)] = ArrayBufferTranslator;
            generalSetterMap[typeof(GenericDelegate)] = GenericDelegateTranslator;
            generalSetterMap[typeof(JSObject)] = JSObjectTranslator;
            generalSetterMap[typeof(void)] = VoidTranslator;
            generalSetterMap[typeof(object)] = AnyTranslator;
        }

        private static void VoidTranslator(IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
        }

        private static void CharTranslator(IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            setValueApi.SetNumber(isolate, holder, (char)obj);
        }

        private static void SbyteTranslator(IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            setValueApi.SetNumber(isolate, holder, (sbyte)obj);
        }

        private static void ByteTranslator(IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            setValueApi.SetNumber(isolate, holder, (byte)obj);
        }

        private static void ShortTranslator(IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            setValueApi.SetNumber(isolate, holder, (short)obj);
        }

        private static void UshortTranslator(IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            setValueApi.SetNumber(isolate, holder, (ushort)obj);
        }

        private static void IntTranslator(IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            setValueApi.SetNumber(isolate, holder, (int)obj);
        }

        private static void UintTranslator(IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            setValueApi.SetNumber(isolate, holder, (uint)obj);
        }

        private static void LongTranslator(IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            setValueApi.SetBigInt(isolate, holder, (long)obj);
        }

        private static void UlongTranslator(IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            setValueApi.SetBigInt(isolate, holder, (long)(ulong)obj);
        }

        private static void DoubleTranslator(IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            setValueApi.SetNumber(isolate, holder, (double)obj);
        }

        private static void FloatTranslator(IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            setValueApi.SetNumber(isolate, holder, (float)obj);
        }

        private static void BooleanTranslator(IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            setValueApi.SetBoolean(isolate, holder, (bool)obj);
        }

        private static void StringTranslator(IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            setValueApi.SetString(isolate, holder, obj as string);
        }

        private static void DateTranslator(IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            DateTime date = (DateTime)obj;
            setValueApi.SetDate(isolate, holder, (date - new DateTime(1970, 1, 1)).TotalMilliseconds);
        }

        private static void ArrayBufferTranslator(IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            setValueApi.SetArrayBuffer(isolate, holder, (ArrayBuffer)obj);
        }

        private static void GenericDelegateTranslator(IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            setValueApi.SetFunction(isolate, holder, ((GenericDelegate)obj).getJsFuncPtr());
        }

        private static void JSObjectTranslator(IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            setValueApi.SetJSObject(isolate, holder, ((JSObject)obj).getJsObjPtr());
        }

        internal void AnyTranslator(IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            if (obj == null)
            {
                setValueApi.SetNull(isolate, holder);
            }
            else
            {
                Type realType = obj.GetType();
                if (realType == typeof(object))
                {
                    int typeId = typeRegister.GetTypeId(isolate, realType);
                    int objectId = objectPool.FindOrAddObject(obj);
                    setValueApi.SetNativeObject(isolate, holder, typeId, new IntPtr(objectId));
                }
                else
                {
                    GetTranslateFunc(realType)(isolate, setValueApi, holder, obj);
                }
            }
        }

        private GeneralSetter MakeTranslateFunc(Type type)
        {
            if (type.IsValueType)
            {
                return (IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj) =>
                {
                    if (obj == null)
                    {
                        setValueApi.SetNull(isolate, holder);
                    }
                    else
                    {
                        int typeId = typeRegister.GetTypeId(isolate, obj.GetType());
                        int objectId = objectPool.AddBoxedValueType(obj);
                        setValueApi.SetNativeObject(isolate, holder, typeId, new IntPtr(objectId));
                    }
                };
            }
            else
            {
                return (IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj) =>
                {
                    if (obj == null)
                    {
                        setValueApi.SetNull(isolate, holder);
                    }
                    else
                    {
                        int typeId = typeRegister.GetTypeId(isolate, obj.GetType());
                        int objectId = objectPool.FindOrAddObject(obj);
                        setValueApi.SetNativeObject(isolate, holder, typeId, new IntPtr(objectId));
                    }
                };
            }
        }

        public GeneralSetter GetTranslateFunc(Type type)
        {
            if (type.IsByRef) return GetTranslateFunc(type.GetElementType());

            if (type.IsEnum) return GetTranslateFunc(Enum.GetUnderlyingType(type));

            GeneralSetter jvt;
            if (!generalSetterMap.TryGetValue(type, out jvt))
            {
                jvt = MakeTranslateFunc(type);
                generalSetterMap.Add(type, jvt);
            }
            return jvt;
        }

        public void RegisterSetter(Type type, GeneralSetter generalSetter)
        {
            generalSetterMap.Add(type, generalSetter);
        }
    }
}
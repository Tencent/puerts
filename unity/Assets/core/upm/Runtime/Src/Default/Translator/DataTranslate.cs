/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if !EXPERIMENTAL_IL2CPP_PUERTS || !ENABLE_IL2CPP

using System;
using System.Collections.Generic;

namespace Puerts
{
    //target参js对象静默转换到c#对象时有用
    public delegate object GeneralGetter(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef);

    public class GeneralGetterManager
    {
        private Dictionary<Type, GeneralGetter> generalGetterMap = new Dictionary<Type, GeneralGetter>();

        private Dictionary<Type, GeneralGetter> nullableTypeGeneralGetterMap = new Dictionary<Type, GeneralGetter>();

        internal GeneralGetterManager()
        {
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
            // generalGetterMap[typeof(DateTime)] = DateTranslator;
            generalGetterMap[typeof(ArrayBuffer)] = ArrayBufferTranslator;
            generalGetterMap[typeof(GenericDelegate)] = GenericDelegateTranslator;
            generalGetterMap[typeof(JSObject)] = JSObjectTranslator;
            generalGetterMap[typeof(object)] = AnyTranslator;
            //special type
            //translatorMap[typeof(LuaTable)] = getLuaTable;
            //translatorMap[typeof(LuaFunction)] = getLuaFunction;
        }


        private static object CharTranslator(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            return PrimitiveTypeTranslate.GetChar(jsEnvIdx, isolate, getValueApi, value, isByRef);
        }

        private static object SbyteTranslator(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            return PrimitiveTypeTranslate.GetSByte(jsEnvIdx, isolate, getValueApi, value, isByRef);
        }

        private static object ByteTranslator(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            return PrimitiveTypeTranslate.GetByte(jsEnvIdx, isolate, getValueApi, value, isByRef);
        }

        private static object ShortTranslator(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            return PrimitiveTypeTranslate.GetInt16(jsEnvIdx, isolate, getValueApi, value, isByRef);
        }

        private static object UshortTranslator(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            return PrimitiveTypeTranslate.GetUInt16(jsEnvIdx, isolate, getValueApi, value, isByRef);
        }

        private static object IntTranslator(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            return PrimitiveTypeTranslate.GetInt32(jsEnvIdx, isolate, getValueApi, value, isByRef);
        }

        private static object UintTranslator(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            return PrimitiveTypeTranslate.GetUInt32(jsEnvIdx, isolate, getValueApi, value, isByRef);
        }

        private static object LongTranslator(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            return PrimitiveTypeTranslate.GetInt64(jsEnvIdx, isolate, getValueApi, value, isByRef);
        }

        private static object UlongTranslator(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            return PrimitiveTypeTranslate.GetUInt64(jsEnvIdx, isolate, getValueApi, value, isByRef);
        }

        private static object DoubleTranslator(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            return PrimitiveTypeTranslate.GetDouble(jsEnvIdx, isolate, getValueApi, value, isByRef);
        }

        private static object FloatTranslator(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            return PrimitiveTypeTranslate.GetFloat(jsEnvIdx, isolate, getValueApi, value, isByRef);
        }

        private static object BooleanTranslator(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            return PrimitiveTypeTranslate.GetBoolean(jsEnvIdx, isolate, getValueApi, value, isByRef);
        }

        private static object StringTranslator(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            return PrimitiveTypeTranslate.GetString(jsEnvIdx, isolate, getValueApi, value, isByRef);
        }

        // private static object DateTranslator(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        // {
        //     return PrimitiveTypeTranslate.GetDateTime(jsEnvIdx, isolate, getValueApi, value, isByRef);
        // }

        private static object ArrayBufferTranslator(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            return PrimitiveTypeTranslate.GetArrayBuffer(jsEnvIdx, isolate, getValueApi, value, isByRef);
        }

        private object JSObjectTranslator(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            var jsValueType = getValueApi.GetJsValueType(isolate, value, isByRef);
            if (jsValueType == JsValueType.JsObject || jsValueType == JsValueType.Function)
            {
                var jsEnv = JsEnv.jsEnvs[jsEnvIdx];
                IntPtr DLLJSObjectPtr = getValueApi.GetJSObject(isolate, value, isByRef);
                return jsEnv.jsObjectFactory.GetOrCreateJSObject(DLLJSObjectPtr, jsEnv);
            }
            else
            {
                return AnyTranslator(jsEnvIdx, isolate, getValueApi, value, isByRef);
            }
        }

        private object GenericDelegateTranslator(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            var jsValueType = getValueApi.GetJsValueType(isolate, value, isByRef);
            if (jsValueType == JsValueType.Function)
            {
                var nativePtr = getValueApi.GetFunction(isolate, value, isByRef);
                return JsEnv.jsEnvs[jsEnvIdx].ToGenericDelegate(nativePtr);
            }
            else
            {
                return AnyTranslator(jsEnvIdx, isolate, getValueApi, value, isByRef);
            }
        }

        internal object AnyTranslator(int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef)
        {
            var type = getValueApi.GetJsValueType(isolate, value, isByRef);
            var jsEnv = JsEnv.jsEnvs[jsEnvIdx];
            switch (type)
            {
                case JsValueType.BigInt:
                    return LongTranslator(jsEnvIdx, isolate, getValueApi, value, isByRef);
                case JsValueType.Boolean:
                    return BooleanTranslator(jsEnvIdx, isolate, getValueApi, value, isByRef);
                // case JsValueType.Date:
                //     return DateTranslator(jsEnvIdx, isolate, getValueApi, value, isByRef);
                case JsValueType.ArrayBuffer:
                    return ArrayBufferTranslator(jsEnvIdx, isolate, getValueApi, value, isByRef);
                case JsValueType.Function:
                    return getValueApi.GetFunction(isolate, value, isByRef);
                case JsValueType.JsObject:
                    return JSObjectTranslator(jsEnvIdx, isolate, getValueApi, value, isByRef);
                case JsValueType.NativeObject:
                    var typeId = getValueApi.GetTypeId(isolate, value, isByRef);
                    if (!jsEnv.TypeManager.IsArray(typeId))
                    {
                        var objType = jsEnv.TypeManager.GetType(typeId);
                        if (objType != typeof(object) && generalGetterMap.ContainsKey(objType))
                        {
                            return generalGetterMap[objType](jsEnvIdx, isolate, getValueApi, value, isByRef);
                        }
                    }
                    var objPtr = getValueApi.GetNativeObject(isolate, value, isByRef);
                    var result = jsEnv.objectPool.Get(objPtr.ToInt32());

                    var typedValueResult = result as TypedValue;
                    if (typedValueResult != null)
                    {
                        return typedValueResult.Target;
                    }

                    return result;
                case JsValueType.Number:
                    return DoubleTranslator(jsEnvIdx, isolate, getValueApi, value, isByRef);
                case JsValueType.String:
                    return StringTranslator(jsEnvIdx, isolate, getValueApi, value, isByRef);
                default:
                    return null;
            }
        }

        GeneralGetter MakeNullableTranslateFunc(GeneralGetter jvt)
        {
            return (int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef) =>
            {
                if (getValueApi.GetJsValueType(isolate, value, isByRef) == JsValueType.NullOrUndefined)
                {
                    return null;
                }
                else
                {
                    return jvt(jsEnvIdx, isolate, getValueApi, value, isByRef);
                }
            };
        }

        private GeneralGetter MakeTranslateFunc(Type type)
        {
            GeneralGetter fixTypeGetter = (int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef) =>
            {
                if (getValueApi.GetJsValueType(isolate, value, isByRef) == JsValueType.NativeObject)
                {
                    var objPtr = getValueApi.GetNativeObject(isolate, value, isByRef);
                    var obj = JsEnv.jsEnvs[jsEnvIdx].objectPool.Get(objPtr.ToInt32());
                    return (obj != null && type.IsAssignableFrom(obj.GetType())) ? obj : null;
                }
                return null;
            };

            if (typeof(Delegate).IsAssignableFrom(type))
            {
                return (int jsEnvIdx, IntPtr isolate, IGetValueFromJs getValueApi, IntPtr value, bool isByRef) =>
                {
                    var jsValueType = getValueApi.GetJsValueType(isolate, value, isByRef);
                    if (jsValueType == JsValueType.Function)
                    {
                        var nativePtr = getValueApi.GetFunction(isolate, value, isByRef);
                        var result = JsEnv.jsEnvs[jsEnvIdx].genericDelegateFactory.Create(type, nativePtr);
                        if (result == null)
                        {
                            throw new Exception("can not find delegate bridge for " + type.GetFriendlyName() + ", Please use JsEnv.UsingAction() Or JsEnv.UsingFunc() following the FAQ.");
                        }
                        return result;
                    }
                    else
                    {
                        return fixTypeGetter(jsEnvIdx, isolate, getValueApi, value, isByRef);
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
                //generalGetterMap.Add(type, generalGetter);
                generalGetterMap[type] = generalGetter;
            }
        }

        public object GetSelf(int jsEnvIdx, IntPtr Self)
        {
            return JsEnv.jsEnvs[jsEnvIdx].objectPool.Get(Self.ToInt32());
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
            // else if (type == typeof(DateTime))
            // {
            //     mask = JsValueType.Date;
            // }
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

    public delegate void GeneralSetter(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj);

    public class GeneralSetterManager
    {
        private Dictionary<Type, GeneralSetter> generalSetterMap = new Dictionary<Type, GeneralSetter>();

        public GeneralSetterManager()
        {
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
            // generalSetterMap[typeof(DateTime)] = DateTranslator;
            generalSetterMap[typeof(ArrayBuffer)] = ArrayBufferTranslator;
            generalSetterMap[typeof(GenericDelegate)] = GenericDelegateTranslator;
            generalSetterMap[typeof(JSObject)] = JSObjectTranslator;
            generalSetterMap[typeof(void)] = VoidTranslator;
            generalSetterMap[typeof(object)] = AnyTranslator;
        }

        private static void VoidTranslator(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
        }

        private static void CharTranslator(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            PrimitiveTypeTranslate.PushChar(jsEnvIdx, isolate, setValueApi, holder, (char)obj);
        }

        private static void SbyteTranslator(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            PrimitiveTypeTranslate.PushSByte(jsEnvIdx, isolate, setValueApi, holder, (sbyte)obj);
        }

        private static void ByteTranslator(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            PrimitiveTypeTranslate.PushByte(jsEnvIdx, isolate, setValueApi, holder, (byte)obj);
        }

        private static void ShortTranslator(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            PrimitiveTypeTranslate.PushInt16(jsEnvIdx, isolate, setValueApi, holder, (short)obj);
        }

        private static void UshortTranslator(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            PrimitiveTypeTranslate.PushUInt16(jsEnvIdx, isolate, setValueApi, holder, (ushort)obj);
        }

        private static void IntTranslator(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            PrimitiveTypeTranslate.PushInt32(jsEnvIdx, isolate, setValueApi, holder, (int)obj);
        }

        private static void UintTranslator(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            PrimitiveTypeTranslate.PushUInt32(jsEnvIdx, isolate, setValueApi, holder, (uint)obj);
        }

        private static void LongTranslator(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            PrimitiveTypeTranslate.PushInt64(jsEnvIdx, isolate, setValueApi, holder, (long)obj);
        }

        private static void UlongTranslator(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            PrimitiveTypeTranslate.PushUInt64(jsEnvIdx, isolate, setValueApi, holder, (ulong)obj);
        }

        private static void DoubleTranslator(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            PrimitiveTypeTranslate.PushDouble(jsEnvIdx, isolate, setValueApi, holder, (double)obj);
        }

        private static void FloatTranslator(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            PrimitiveTypeTranslate.PushFloat(jsEnvIdx, isolate, setValueApi, holder, (float)obj);
        }

        private static void BooleanTranslator(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            PrimitiveTypeTranslate.PushBoolean(jsEnvIdx, isolate, setValueApi, holder, (bool)obj);
        }

        private static void StringTranslator(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            PrimitiveTypeTranslate.PushString(jsEnvIdx, isolate, setValueApi, holder, obj as string);
        }

        // private static void DateTranslator(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        // {
        //     PrimitiveTypeTranslate.PushDateTime(jsEnvIdx, isolate, setValueApi, holder, (DateTime)obj);
        // }

        private static void ArrayBufferTranslator(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            PrimitiveTypeTranslate.PushArrayBuffer(jsEnvIdx, isolate, setValueApi, holder, (ArrayBuffer)obj);
        }

        private static void GenericDelegateTranslator(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            setValueApi.SetFunction(isolate, holder, ((GenericDelegate)obj).getJsFuncPtr());
        }

        private static void JSObjectTranslator(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            setValueApi.SetJSObject(isolate, holder, ((JSObject)obj).getJsObjPtr());
        }

        internal void AnyTranslator(int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj)
        {
            if (obj == null)
            {
                setValueApi.SetNull(isolate, holder);
            }
            else
            {
                Type realType = obj.GetType();
                var jsEnv = JsEnv.jsEnvs[jsEnvIdx];
                if (realType == typeof(object))
                {
                    int typeId = jsEnv.TypeManager.GetTypeId(isolate, realType);
                    int objectId = jsEnv.objectPool.FindOrAddObject(obj);
                    setValueApi.SetNativeObject(isolate, holder, typeId, new IntPtr(objectId));
                }
                else
                {
                    GetTranslateFunc(realType)(jsEnvIdx, isolate, setValueApi, holder, obj);
                }
            }
        }

        private GeneralSetter MakeTranslateFunc(Type type)
        {
            if (type.IsValueType)
            {
                return (int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj) =>
                {
                    var jsEnv = JsEnv.jsEnvs[jsEnvIdx];
                    if (obj == null)
                    {
                        setValueApi.SetNull(isolate, holder);
                    }
                    else
                    {
                        int typeId = jsEnv.TypeManager.GetTypeId(isolate, obj.GetType());
                        int objectId = jsEnv.objectPool.AddBoxedValueType(obj);
                        setValueApi.SetNativeObject(isolate, holder, typeId, new IntPtr(objectId));
                    }
                };
            }
            else
            {
                return (int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj) =>
                {
                    var jsEnv = JsEnv.jsEnvs[jsEnvIdx];
                    if (obj == null)
                    {
                        setValueApi.SetNull(isolate, holder);
                    }
                    else
                    {
                        int typeId = jsEnv.TypeManager.GetTypeId(isolate, obj.GetType());
                        int objectId = jsEnv.objectPool.FindOrAddObject(obj);
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
            generalSetterMap[type] = generalSetter;
            // generalSetterMap.Add(type, generalSetter);
        }
    }
}

#endif

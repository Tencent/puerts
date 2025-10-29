/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if PUERTS_DISABLE_IL2CPP_OPTIMIZATION || !ENABLE_IL2CPP

using System;
using System.Text;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Collections.Generic;
using System.Runtime.InteropServices;

namespace Puerts
{
    public static class UnmanagedTypeUtils
    {
        public static bool IsUnmanaged(Type type)
        {
            if (type.IsPrimitive || type.IsEnum || type.IsPointer)
                return true;

            if (!type.IsValueType)
                return false;

            if (type.IsGenericType)
            {
                Type[] genericArgs = type.GetGenericArguments();
                foreach (Type arg in genericArgs)
                {
                    if (!IsUnmanaged(arg))
                        return false;
                }
            }

            FieldInfo[] fields = type.GetFields(
                BindingFlags.Instance |
                BindingFlags.Public |
                BindingFlags.NonPublic
            );

            foreach (FieldInfo field in fields)
            {
                if (!IsUnmanaged(field.FieldType))
                    return false;
            }

            return true;
        }

        public static void PtrToUnmanaged<T>(IntPtr ptr, out T structure) where T : unmanaged
        {
            unsafe
            {
                structure = *((T*)ptr.ToPointer());
            }
        }

        public static void UnmanagedToPtr<T>(T structure, IntPtr ptr) where T : unmanaged
        {
            unsafe
            {
                *((T*)ptr.ToPointer()) = structure;
            }
        }
    }

    public static class ExpressionsWrap
    {
        internal class NativeType
        {
            public int typeId;

            public static NativeType LoadType(Type type)
            {
                return new NativeType()
                {
                    typeId = TypeRegister.Instance.FindOrAddTypeId(type)
                };
            }
        }
        internal static class Helpper // 为了简化Express Tree生成复杂度的封装
        {
            public static T GetSelf<T>(IntPtr api, IntPtr env, IntPtr info)
            {
                var envIdx = PuertsNative.pesapi_get_env_private(api, env).ToInt32();
                var objIdx = PuertsNative.pesapi_get_native_holder_ptr(api, info).ToInt32();
                return (T)ScriptEnv.scriptEnvs[envIdx].objectPool.Get(objIdx);
            }

            public static IntPtr FindOrAddObject(IntPtr apis, IntPtr env, object obj)
            {
                var envIdx = PuertsNative.pesapi_get_env_private(apis, env).ToInt32();
                return new IntPtr(ScriptEnv.scriptEnvs[envIdx].objectPool.FindOrAddObject(obj));
            }

            // do not find, just Add for ValueType
            public static IntPtr AddValueType<T>(IntPtr apis, IntPtr env, T val) where T : struct
            {
                var envIdx = PuertsNative.pesapi_get_env_private(apis, env).ToInt32();
                return new IntPtr(ScriptEnv.scriptEnvs[envIdx].objectPool.AddBoxedValueType(val));
            }

            public static int GetEnvIndex(IntPtr api, IntPtr env)
            {
                return PuertsNative.pesapi_get_env_private(api, env).ToInt32();
            }

            public static int GetSelfId(IntPtr api, IntPtr info)
            {
                return PuertsNative.pesapi_get_native_holder_ptr(api, info).ToInt32();
            }

            public static T GetSelfDirect<T>(int envIdx, int objId)
            {
                return (T)ScriptEnv.scriptEnvs[envIdx].objectPool.Get(objId);
            }

            public static void UpdateValueType<T>(int envIdx, int objId, T val) where T : struct
            {
                ScriptEnv.scriptEnvs[envIdx].objectPool.ReplaceValueType(objId, val);
            }

            public static void CheckException(IntPtr apis, IntPtr scope)
            {
                if (PuertsNative.pesapi_has_caught(apis, scope))
                {
                    string msg = Marshal.PtrToStringUTF8(PuertsNative.pesapi_get_exception_as_string(apis, scope, true));
                    throw new InvalidOperationException(msg);
                }
            }

            public static IntPtr NativeToScript_String(IntPtr apis, IntPtr env, string str)
            {
                if (str == null)
                {
                    return PuertsNative.pesapi_create_null(apis, env);
                }
                byte[] utf16 = Encoding.Unicode.GetBytes(str);
                return PuertsNative.pesapi_create_string_utf16(apis, env, utf16, new UIntPtr((uint)str.Length));
            }

            public static IntPtr NativeToScript_ScriptObject(IntPtr apis, IntPtr env, ScriptObject obj)
            {
                if (obj == null)
                {
                    return PuertsNative.pesapi_create_null(apis, env);
                }

                if (apis != obj.apis)
                {
                    throw new InvalidCastException("ScriptObject form other papi provider!");
                }

                // apis is the same, using apis
                var objEnvRef = PuertsNative.pesapi_get_ref_associated_env(apis, obj.objRef);
                if (objEnvRef == IntPtr.Zero || !PuertsNative.pesapi_env_ref_is_valid(apis, objEnvRef))
                {
                    throw new InvalidCastException("ScriptObject env is invalid!");
                }
                
                var scope = PuertsNative.pesapi_open_scope(apis, objEnvRef);

                //目前的实现，apis相等而且env private(env index)相等表示是同一个虚拟机实例
                var isEnvEq = PuertsNative.pesapi_get_env_private(apis, PuertsNative.pesapi_get_env_from_ref(apis, objEnvRef)) == PuertsNative.pesapi_get_env_private(apis,env);
                PuertsNative.pesapi_close_scope(apis, scope);
                if (!isEnvEq)
                {
                    throw new InvalidCastException("ScriptObject own by anther env!");
                }
                return PuertsNative.pesapi_get_value_from_ref(apis, env, obj.objRef);
            }

            public static IntPtr NativeToScript_NativeType(IntPtr apis, IntPtr env, NativeType t)
            {
                return PuertsNative.pesapi_create_class(apis, env, new IntPtr(t.typeId));
            }

            public static IntPtr NativeToScript_ArrayBuffer(IntPtr apis, IntPtr env, ArrayBuffer arrayBuffer)
            {
                return PuertsNative.pesapi_create_binary_by_value(apis, env, arrayBuffer.Bytes, new UIntPtr((uint)arrayBuffer.Count));
            }

            public static IntPtr NativeToScript_Object(IntPtr apis, IntPtr env, object t)
            {
                if(t == null)
                {
                    return PuertsNative.pesapi_create_null(apis, env);
                }
                else if (t is int intValue)
                {
                    return PuertsNative.pesapi_create_int32(apis, env, intValue);
                }
                else if (t is uint uintValue)
                {
                    return PuertsNative.pesapi_create_uint32(apis, env, uintValue);
                }
                else if (t is long longValue)
                {
                    return PuertsNative.pesapi_create_int64(apis, env, longValue);
                }
                else if (t is ulong ulongValue)
                {
                    return PuertsNative.pesapi_create_uint64(apis, env, ulongValue);
                }
                else if (t is double doubleValue)
                {
                    return PuertsNative.pesapi_create_double(apis, env, doubleValue);
                }
                else if (t is float floatValue)
                {
                    return PuertsNative.pesapi_create_double(apis, env, floatValue);
                }
                else if (t is char charValue)
                {
                    return PuertsNative.pesapi_create_int32(apis, env, charValue);
                }
                else if (t is bool boolValue)
                {
                    return PuertsNative.pesapi_create_boolean(apis, env, boolValue);
                }
                else if (t is string strValue)
                {
                    return NativeToScript_String(apis, env, strValue);
                }
                else if (t is ScriptObject scriptObject)
                {
                    return NativeToScript_ScriptObject(apis, env, scriptObject);
                }
                else if (t is ArrayBuffer arrayBuffer)
                {
                    return NativeToScript_ArrayBuffer(apis, env, arrayBuffer);
                }
                Type type = t.GetType();
                if (!type.IsValueType)
                {
                    return NativeToScript_T<object>(apis, env, t);
                }
                else if(type.IsValueType && !type.IsPrimitive)
                {
                    if (type.IsEnum)
                    {
                        return NativeToScript_Object(apis, env, Convert.ChangeType(t, Enum.GetUnderlyingType(type)));
                    }
                    else
                    {
                        return NativeToScript_ValueType_Boxed(apis, env, t);
                    }
                }
                throw new NotSupportedException($"NativeToScript_Object does not support type: {t.GetType()}");
            }

            public static IntPtr NativeToScript_T<T>(IntPtr apis, IntPtr env, T value) where T : class
            {
                if (value == null)
                {
                    return PuertsNative.pesapi_create_null(apis, env);
                }
#if !PUERTS_GENERAL
                if (value is UnityEngine.Object && (value as UnityEngine.Object) == null)
                {
                    return PuertsNative.pesapi_create_null(apis, env);
                }
#endif
                var envIdx = PuertsNative.pesapi_get_env_private(apis, env).ToInt32();
                var objectPool = ScriptEnv.scriptEnvs[envIdx].objectPool;
                var typeId = TypeRegister.Instance.FindOrAddTypeId(value.GetType());
                var objId = objectPool.FindOrAddObject(value);
                return PuertsNative.pesapi_native_object_to_value(apis, env, new IntPtr(typeId), new IntPtr(objId), false);
            }

            public static IntPtr NativeToScript_ValueType_Boxed(IntPtr apis, IntPtr env, object value)
            {
                var envIdx = PuertsNative.pesapi_get_env_private(apis, env).ToInt32();
                var objectPool = ScriptEnv.scriptEnvs[envIdx].objectPool;
                var typeId = TypeRegister.Instance.FindOrAddTypeId(value.GetType());
                var objId = objectPool.AddBoxedValueType(value);
                return PuertsNative.pesapi_native_object_to_value(apis, env, new IntPtr(typeId), new IntPtr(objId), false);
            }

            public static IntPtr NativeToScript_ValueType<T>(IntPtr apis, IntPtr env, T value) where T : struct
            {
                return NativeToScript_ValueType_Boxed(apis, env, value);
            }

            public static T ScriptToNative_T<T>(IntPtr apis, IntPtr env, IntPtr obj)
            {
                var envIdx = PuertsNative.pesapi_get_env_private(apis, env).ToInt32();
                var objIdx = PuertsNative.pesapi_get_native_object_ptr(apis, env, obj).ToInt32();
                if (objIdx == 0) return default(T);
                return (T)ScriptEnv.scriptEnvs[envIdx].objectPool.Get(objIdx);
            }

            public static bool IsAssignable_ByRef<T>(IntPtr apis, IntPtr env, IntPtr value)
            {
                var typeId = PuertsNative.pesapi_get_native_object_typeid(apis, env, value).ToInt32();
                if (typeId == 0)
                {
                    // TODO: 考虑到兼容性，目前先支持undefined，默认应该只支持null
                    return PuertsNative.pesapi_is_null(apis, env, value) || PuertsNative.pesapi_is_undefined(apis, env, value);
                }
                return typeId != 0 && typeof(T).IsAssignableFrom(TypeRegister.Instance.FindTypeById(typeId));
            }

            public static bool IsAssignable_ValueType<TValueType>(IntPtr apis, IntPtr env, IntPtr obj) where TValueType : struct
            {
                var typeId = PuertsNative.pesapi_get_native_object_typeid(apis, env, obj).ToInt32();
                return typeId != 0 && typeof(TValueType).IsAssignableFrom(TypeRegister.Instance.FindTypeById(typeId));
            }

            public static ScriptObject ScriptToNative_ScriptObject_CheckObject(IntPtr apis, IntPtr env, IntPtr value)
            {
                return PuertsNative.pesapi_is_object(apis, env, value) ? ScriptToNative_ScriptObject(apis, env, value) : null;
            }

            public static ScriptObject ScriptToNative_ScriptObject(IntPtr apis, IntPtr env, IntPtr value)
            {
                IntPtr valueRef;
                bool hasLastRef = true;
                if (!PuertsNative.pesapi_get_private(apis, env, value, out valueRef) || valueRef == IntPtr.Zero)
                {
                    valueRef = PuertsNative.pesapi_create_value_ref(apis, env, value, 1);
                    PuertsNative.pesapi_set_private(apis, env, value, valueRef);
                    hasLastRef = false;
                }
                uint internal_field_count = 0;
                IntPtr weakHandlePtr = PuertsNative.pesapi_get_ref_internal_fields(apis, valueRef, out internal_field_count);
                if (internal_field_count != 1)
                {
                    throw new InvalidProgramException($"invalud internal fields count {internal_field_count}!");
                }
                if (!hasLastRef)
                {
                    Marshal.StructureToPtr(IntPtr.Zero, weakHandlePtr, false);
                }

                ScriptObject ret = null;

                IntPtr weakHandle = Marshal.PtrToStructure<IntPtr>(weakHandlePtr);

                if (weakHandle != IntPtr.Zero)
                {
                    ret = GCHandle.FromIntPtr(weakHandle).Target as ScriptObject;
                }
                if (ret == null)
                {
                    var envIdx = PuertsNative.pesapi_get_env_private(apis, env).ToInt32();
                    ret = new ScriptObject(ScriptEnv.scriptEnvs[envIdx], apis, valueRef);
                    weakHandle = GCHandle.ToIntPtr(GCHandle.Alloc(ret, GCHandleType.Weak));
                    Marshal.StructureToPtr(weakHandle, weakHandlePtr, false);
                }
                return ret;
            }

            public static string ScriptToNative_String(IntPtr apis, IntPtr env, IntPtr value)
            {
                if (PuertsNative.pesapi_is_null(apis, env, value) || PuertsNative.pesapi_is_undefined(apis, env, value))
                {
                    return null;
                }
                UIntPtr outLen = UIntPtr.Zero;
                PuertsNative.pesapi_get_value_string_utf16(apis, env, value, null, ref outLen);
                byte[] buf = new byte[outLen.ToUInt32() * 2];
                PuertsNative.pesapi_get_value_string_utf16(apis, env, value, buf, ref outLen);
                return Encoding.Unicode.GetString(buf);
            }

            public static ArrayBuffer ScriptToNative_ArrayBuffer(IntPtr apis, IntPtr env, IntPtr value)
            {
                UIntPtr outLen = UIntPtr.Zero;
                IntPtr ptr = PuertsNative.pesapi_get_value_binary(apis, env, value, ref outLen);
                return new ArrayBuffer(ptr, (int)outLen.ToUInt32());
            }

            public static object ScriptToNative_Object(IntPtr apis, IntPtr env, IntPtr value)
            {
                if (PuertsNative.pesapi_is_null(apis, env, value) || PuertsNative.pesapi_is_undefined(apis, env, value))
                {
                    return null;
                }
                else if (PuertsNative.pesapi_is_boolean(apis, env, value))
                {
                    return PuertsNative.pesapi_get_value_bool(apis, env, value);
                }
                else if (PuertsNative.pesapi_is_int32(apis, env, value))
                {
                    return PuertsNative.pesapi_get_value_int32(apis, env, value);
                }
                else if (PuertsNative.pesapi_is_uint32(apis, env, value))
                {
                    return PuertsNative.pesapi_get_value_uint32(apis, env, value);
                }
                else if (PuertsNative.pesapi_is_int64(apis, env, value))
                {
                    return PuertsNative.pesapi_get_value_int64(apis, env, value);
                }
                else if (PuertsNative.pesapi_is_uint64(apis, env, value))
                {
                    return PuertsNative.pesapi_get_value_uint64(apis, env, value);
                }
                else if (PuertsNative.pesapi_is_double(apis, env, value))
                {
                    return PuertsNative.pesapi_get_value_double(apis, env, value);
                }
                else if (PuertsNative.pesapi_is_string(apis, env, value))
                {
                    return ScriptToNative_String(apis, env, value);
                }
                else if (PuertsNative.pesapi_is_array(apis, env, value))
                {
                    return ScriptToNative_ScriptObject(apis, env, value);
                }
                else if (PuertsNative.pesapi_is_binary(apis, env, value))
                {
                    return ScriptToNative_ArrayBuffer(apis, env, value);
                }
                else if (PuertsNative.pesapi_is_function(apis, env, value))
                {
                    return ScriptToNative_ScriptObject(apis, env, value);
                }
                var objId = PuertsNative.pesapi_get_native_object_ptr(apis, env, value);
                if (objId != IntPtr.Zero)
                {
                    var envIdx = PuertsNative.pesapi_get_env_private(apis, env).ToInt32();
                    var res = ScriptEnv.scriptEnvs[envIdx].objectPool.Get(objId.ToInt32());
                    var typedValue = res as TypedValue;
                    return typedValue == null ? res : typedValue.Target;
                }
                else if (PuertsNative.pesapi_is_object(apis, env, value))
                {
                    return ScriptToNative_ScriptObject(apis, env, value);
                }
                throw new NotSupportedException("Unsupported value type");
            }

            private static Dictionary<string, MethodInfo> methodInfoCache = new Dictionary<string, MethodInfo>();

            internal static MethodInfo GetMethod(string methodName)
            {
                lock (methodInfoCache)
                {
                    MethodInfo res;
                    if (!methodInfoCache.TryGetValue(methodName, out res))
                    {
                        res = typeof(Helpper).GetMethod(methodName);
                        methodInfoCache.Add(methodName, res);
                    }
                    return res;
                }
            }

            private static Dictionary<string, Dictionary<Type, MethodInfo>> genericMethodInfoCache = new Dictionary<string, Dictionary<Type, MethodInfo>>();

            internal static MethodInfo MakeGenericMethod(string methodName, Type type)
            {
                lock(genericMethodInfoCache)
                {
                    Dictionary<Type, MethodInfo> cache;
                    if (!genericMethodInfoCache.TryGetValue(methodName, out cache))
                    {
                        cache = new Dictionary<Type, MethodInfo>();
                        genericMethodInfoCache.Add(methodName, cache);
                    }

                    MethodInfo res;
                    if (!cache.TryGetValue(type, out res))
                    {
                        res = GetMethod(methodName).MakeGenericMethod(type);
                        cache.Add(type, res);
                    }

                    return res;
                }
            }
        }

        class CompileContext
        {
            public List<ParameterExpression> Variables;
            public List<Expression> BlockExpressions;
            public ParameterExpression Apis;
            public Expression Env;
        }

        private static Dictionary<string, MethodInfo> papiMethodCache = new Dictionary<string, MethodInfo>();

        private static MethodInfo GetPApiMethodInfo(string apiName)
        {
            lock(papiMethodCache)
            {
                MethodInfo res;
                if (!papiMethodCache.TryGetValue(apiName, out res))
                {
                    res = typeof(PuertsNative).GetMethod("pesapi_" + apiName);
                    papiMethodCache.Add(apiName, res);
                }
                return res;
            }
        }

        private static Expression callPApi(Expression apis, string apiName, params Expression[] arguments)
        {
            /*
            // call struct pesapi_ffi
            var fieldInfo = typeof(pesapi_ffi).GetField(apiName);
            var getField = Expression.Field(apis, fieldInfo);
            var callField = Expression.Call(getField, fieldInfo.FieldType.GetMethod("Invoke"), arguments);
            return callField;
            */
            // call PuertsNative
            var methodInfo = GetPApiMethodInfo(apiName);
            return Expression.Call(null, methodInfo, new [] { apis }.Concat(arguments));
        }

        private static Expression nativeToScript(CompileContext context, Type type, Expression value)
        {
            Type underlyingType = Nullable.GetUnderlyingType(type);
            if (underlyingType != null)
            {
                return Expression.Condition(Expression.Equal(value, Expression.Constant(null, type)), callPApi(context.Apis, "create_null", context.Env), nativeToScript(context, underlyingType, Expression.Convert(value, underlyingType)));
            }
            Type tranType = type.IsEnum ? Enum.GetUnderlyingType(type) : type;
            if (type.IsEnum)
            {
                value = Expression.Convert(value, tranType);
            }
            if (tranType == typeof(int))
            {
                //apis.create_int32(env, value)
                return callPApi(context.Apis, "create_int32", context.Env, value);
            }
            else if (tranType == typeof(uint))
            {
                return callPApi(context.Apis, "create_uint32", context.Env, value);
            }
            else if (tranType == typeof(long))
            {
                return callPApi(context.Apis, "create_int64", context.Env, value);
            }
            else if (tranType == typeof(ulong))
            {
                return callPApi(context.Apis, "create_uint64", context.Env, value);
            }
            else if (tranType == typeof(double))
            {
                return callPApi(context.Apis, "create_double", context.Env, value);
            }
            else if (tranType == typeof(float))
            {
                return callPApi(context.Apis, "create_double", context.Env, Expression.Convert(value, typeof(double)));
            }
            else if (tranType == typeof(char))
            {
                return callPApi(context.Apis, "create_int32", context.Env, Expression.Convert(value, typeof(int)));
            }
            else if (tranType == typeof(bool))
            {
                return callPApi(context.Apis, "create_boolean", context.Env, value);
            }
            else if (tranType == typeof(string))
            {
                var toScriptMethod = Helpper.GetMethod(nameof(Helpper.NativeToScript_String));
                return Expression.Call(toScriptMethod, context.Apis, context.Env, value);
            }
            //TODO: 用例没有覆盖
            else if (tranType == typeof(byte) || tranType == typeof(sbyte) || tranType == typeof(short) || tranType == typeof(ushort))
            {
                return callPApi(context.Apis, "create_int32", context.Env, Expression.Convert(value, typeof(int)));
            }
            else if (tranType == typeof(ScriptObject))
            {
                var toScriptMethod = Helpper.GetMethod(nameof(Helpper.NativeToScript_ScriptObject));
                return Expression.Call(toScriptMethod, context.Apis, context.Env, value);
            }
            else if (tranType == typeof(NativeType))
            {
                var toScriptMethod = Helpper.GetMethod(nameof(Helpper.NativeToScript_NativeType));
                return Expression.Call(toScriptMethod, context.Apis, context.Env, value);
            }
            else if (tranType == typeof(ArrayBuffer))
            {
                var toScriptMethod = Helpper.GetMethod(nameof(Helpper.NativeToScript_ArrayBuffer));
                return Expression.Call(toScriptMethod, context.Apis, context.Env, value);
            }
            else if (tranType == typeof(object))
            {
                var toScriptMethod = Helpper.GetMethod(nameof(Helpper.NativeToScript_Object));
                return Expression.Call(toScriptMethod, context.Apis, context.Env, value);
            }
            else if (tranType.IsByRef)
            {
                throw new Exception("nativeToScript: byref type " + tranType + " not support yet!");
            }
            else if (!tranType.IsValueType)
            {
                var toScriptMethod = Helpper.MakeGenericMethod(nameof(Helpper.NativeToScript_T), tranType);
                return Expression.Call(toScriptMethod, context.Apis, context.Env, value);
            }
            else if (tranType.IsValueType && !tranType.IsPrimitive)
            {
                var toScriptMethod = Helpper.MakeGenericMethod(nameof(Helpper.NativeToScript_ValueType), tranType);
                return Expression.Call(toScriptMethod, context.Apis, context.Env, value);
            }
            else
            {
                throw new Exception("nativeToScript: " + tranType + " not support yet!");
            }
        }

        private static MethodInfo stringFormatMethod = typeof(string).GetMethod(nameof(string.Format), new[] { typeof(string), typeof(object[]) });

#if UNITY_EDITOR
        private static MethodInfo logMethod = typeof(UnityEngine.Debug).GetMethod(nameof(UnityEngine.Debug.Log), new[] { typeof(object) });
#else
        private static MethodInfo logMethod = typeof(Console).GetMethod(nameof(Console.WriteLine), new[] { typeof(object) });
#endif
        private static Expression Printf(string format, params Expression[] arguments)
        {
            var formatString = Expression.Constant(format);
            
            // Convert all arguments to object array
            var convertedArgs = arguments.Select(arg => 
                Expression.Convert(arg, typeof(object))
            ).ToArray();
            
            var argsArray = Expression.NewArrayInit(typeof(object), convertedArgs);
            
            var formattedMessage = Expression.Call(
                stringFormatMethod,
                formatString,
                argsArray
            );

            return Expression.Call(logMethod, formattedMessage);
        }

        private static Expression createFunctionAdapter(CompileContext outsideContext, Type type, Expression scriptObject)
        {
            // cache existed?
            var result = Expression.Variable(type);
            outsideContext.Variables.Add(result);
            var tryGetMethod = typeof(ScriptObject).GetMethod(nameof(ScriptObject.tryGetCachedDelegate)).MakeGenericMethod(type);
            var callTryGet = Expression.Call(
                scriptObject,
                tryGetMethod,
                result
            );

            var invokeMethodInfo = type.GetMethod("Invoke");
            var delegateParams = invokeMethodInfo.GetParameters()
                .Select(pi => Expression.Parameter(pi.ParameterType, pi.Name))
                .ToArray();
            
            var checkException = Helpper.GetMethod(nameof(Helpper.CheckException));

            // 打印各参数，用作调试
            //var printArgs = delegateParams
            //    .Select(param => Printf($"{{1}} {param.Name}: {{0}}", param, Expression.Constant(type.Name)))
            //    .Cast<Expression>();
            
            var lambdaVariables = new List<ParameterExpression>();
            var lambdaExpressions = new List<Expression>();

            var apis = Expression.Variable(typeof(IntPtr));
            lambdaVariables.Add(apis);
            lambdaExpressions.Add(Expression.Assign(apis, Expression.Field(scriptObject, nameof(ScriptObject.apis))));

            var funcRef = Expression.Variable(typeof(IntPtr));
            lambdaVariables.Add(funcRef);
            lambdaExpressions.Add(Expression.Assign(funcRef, Expression.Field(scriptObject, nameof(ScriptObject.objRef))));

            var envRef = Expression.Variable(typeof(IntPtr));
            lambdaVariables.Add(envRef);
            lambdaExpressions.Add(Expression.Assign(envRef, callPApi(apis, "get_ref_associated_env", funcRef)));

            // var scope = apis.open_scope(envRef);
            var scope = Expression.Variable(typeof(IntPtr));
            lambdaVariables.Add(scope);
            lambdaExpressions.Add(Expression.Assign(scope, callPApi(apis, "open_scope", envRef)));

            var tryBlockvariables = new List<ParameterExpression>();
            //var tryBlockvariables = new List<Expression>(printArgs);
            var tryBlockExpressions = new List<Expression>();

            // Check if env is IntPtr.Zero and throw exception
            tryBlockExpressions.Add(
                Expression.IfThen(
                    Expression.Equal(scope, Expression.Constant(IntPtr.Zero)),
                    Expression.Throw(
                        Expression.New(
                            typeof(InvalidOperationException).GetConstructor(new[] { typeof(string) }),
                            Expression.Constant("JsEnv had been destroy")
                        )
                    )
                )
            );

            var env = Expression.Variable(typeof(IntPtr));
            tryBlockvariables.Add(env);
            tryBlockExpressions.Add(Expression.Assign(env, callPApi(apis, "get_env_from_ref", envRef)));

            var tryBlockContext = new CompileContext()
            {
                Variables = tryBlockvariables,
                BlockExpressions = tryBlockExpressions,
                Apis = apis,
                Env = env
            };

            List<Expression> scriptValues = invokeMethodInfo.GetParameters().Select((ParameterInfo pi, int index) => nativeToScript(tryBlockContext, pi.ParameterType, delegateParams[index])).ToList();

            var argv = Expression.Variable(typeof(IntPtr[]));
            tryBlockvariables.Add(argv);
            tryBlockExpressions.Add(Expression.Assign(argv, Expression.NewArrayInit(typeof(IntPtr), scriptValues)));

            var func = callPApi(apis, "get_value_from_ref", env, funcRef);

            // res = pesapi_call_function(apis, env, func, default(IntPtr), argc, argv);
            var res = Expression.Variable(typeof(IntPtr));
            tryBlockvariables.Add(res);

            var callFunc = callPApi(apis, "call_function", env, func, Expression.Default(typeof(IntPtr)), Expression.Constant(scriptValues.Count), argv);
            tryBlockExpressions.Add(Expression.Assign(res, callFunc));

            tryBlockExpressions.Add(Expression.Call(checkException, apis, scope));

            if (invokeMethodInfo.ReturnType != typeof(void))
            {
                tryBlockExpressions.Add(scriptToNative(tryBlockContext, invokeMethodInfo.ReturnType, res));
            }

            lambdaExpressions.Add(Expression.TryFinally(Expression.Block(tryBlockvariables, tryBlockExpressions), callPApi(apis, "close_scope", scope)));
            var lambda = Expression.Lambda(type, Expression.Block(lambdaVariables, lambdaExpressions), delegateParams);

            var cacheMethod = typeof(ScriptObject).GetMethod(nameof(ScriptObject.cacheDelegate)).MakeGenericMethod(type);
            
            var condition = Expression.Condition(
                callTryGet,
                result,
                Expression.Call(scriptObject, cacheMethod, lambda)
            );

            return condition;
        }

        private static Expression scriptToNative(CompileContext context, Type type, Expression value)
        {
            Type tranType = type.IsEnum ? Enum.GetUnderlyingType(type) : type;
            Expression ret = null;
            if (tranType == typeof(int))
            {
                ret = callPApi(context.Apis, "get_value_int32", context.Env, value);
            }
            else if (tranType == typeof(uint))
            {
                ret = callPApi(context.Apis, "get_value_uint32", context.Env, value);
            }
            else if (tranType == typeof(long))
            {
                ret = callPApi(context.Apis, "get_value_int64", context.Env, value);
            }
            else if (tranType == typeof(ulong))
            {
                ret = callPApi(context.Apis, "get_value_uint64", context.Env, value);
            }
            else if (tranType == typeof(double))
            {
                ret = callPApi(context.Apis, "get_value_double", context.Env, value);
            }
            else if (tranType == typeof(byte))
            {
                ret = Expression.Convert(callPApi(context.Apis, "get_value_int32", context.Env, value), typeof(byte));
            }
            else if (tranType == typeof(sbyte))
            {
                ret = Expression.Convert(callPApi(context.Apis, "get_value_int32", context.Env, value), typeof(sbyte));
            }
            else if (tranType == typeof(short))
            {
                ret = Expression.Convert(callPApi(context.Apis, "get_value_int32", context.Env, value), typeof(short));
            }
            else if (tranType == typeof(ushort))
            {
                ret = Expression.Convert(callPApi(context.Apis, "get_value_int32", context.Env, value), typeof(ushort));
            }
            else if (tranType == typeof(char))
            {
                ret = Expression.Convert(callPApi(context.Apis, "get_value_int32", context.Env, value), typeof(char));
            }
            else if (tranType == typeof(float))
            {
                ret = Expression.Convert(callPApi(context.Apis, "get_value_double", context.Env, value), typeof(float));
            }
            else if (tranType == typeof(bool))
            {
                ret = callPApi(context.Apis, "get_value_bool", context.Env, value);
            }
            else if (tranType == typeof(string))
            {
                var scriptToNativeMethod = Helpper.GetMethod(nameof(Helpper.ScriptToNative_String));
                ret = Expression.Call(scriptToNativeMethod, context.Apis, context.Env, value);
            }
            else if (typeof(ArrayBuffer) == tranType)
            {
                var scriptToNativeMethod = Helpper.GetMethod(nameof(Helpper.ScriptToNative_ArrayBuffer));
                ret = Expression.Call(scriptToNativeMethod, context.Apis, context.Env, value);
            }
            else if (typeof(object) == tranType)
            {
                var scriptToNativeMethod = Helpper.GetMethod(nameof(Helpper.ScriptToNative_Object));
                ret = Expression.Call(scriptToNativeMethod, context.Apis, context.Env, value);
            }
            else if (typeof(ScriptObject) == tranType)
            {
                var scriptToNativeMethod = Helpper.GetMethod(nameof(Helpper.ScriptToNative_ScriptObject_CheckObject));
                ret = Expression.Call(scriptToNativeMethod, context.Apis, context.Env, value);
            }
            else if (typeof(Delegate).IsAssignableFrom(tranType) && tranType != typeof(Delegate) && tranType != typeof(MulticastDelegate))
            {
                var test = callPApi(context.Apis, "is_function", context.Env, value);

                var ifTrueVariables = new List<ParameterExpression>();
                var ifTrueExpressions = new List<Expression>();
                var ifTrueContext = new CompileContext()
                {
                    Variables = ifTrueVariables,
                    BlockExpressions = ifTrueExpressions,
                    Apis = context.Apis,
                    Env = context.Env
                };

                var scriptObject = Expression.Variable(typeof(ScriptObject));
                ifTrueVariables.Add(scriptObject);
                var scriptToNativeMethod = Helpper.GetMethod(nameof(Helpper.ScriptToNative_ScriptObject));
                ifTrueExpressions.Add(Expression.Assign(scriptObject, Expression.Call(scriptToNativeMethod, context.Apis, context.Env, value)));
                ifTrueExpressions.Add(createFunctionAdapter(ifTrueContext, tranType, scriptObject));
                var ifTrue = Expression.Block(ifTrueVariables, ifTrueExpressions);

                var ifFalse = Expression.Call(Helpper.MakeGenericMethod(nameof(Helpper.ScriptToNative_T), tranType), context.Apis, context.Env, value);
                return Expression.Condition(test, ifTrue, ifFalse);
            }
            else if (tranType.IsByRef)
            {
                ret = scriptToNative(context, type.GetElementType(), callPApi(context.Apis, "unboxing", context.Env, value));
            }
            else if (!tranType.IsValueType)
            {
                var scriptToNativeMethod = Helpper.MakeGenericMethod(nameof(Helpper.ScriptToNative_T), tranType);
                ret = Expression.Call(scriptToNativeMethod, context.Apis, context.Env, value);
            }
            else if (tranType.IsValueType && !tranType.IsPrimitive) // the same as byref
            {
                var scriptToNativeMethod = Helpper.MakeGenericMethod(nameof(Helpper.ScriptToNative_T), tranType);
                ret = Expression.Call(scriptToNativeMethod, context.Apis, context.Env, value);
            }
            /*else if (type.IsValueType && !type.IsPrimitive && UnmanagedType.IsUnmanaged(type))
            {
                // IntPtr ptr = get_native_object_ptr(env, val);
                var ptr = callPApi(context.Apis, "get_native_object_ptr", context.Env, value);

                context.BlockExpressions.Add(Expression.Call(typeof(UnityEngine.Debug), "Log", null, Expression.Convert(ptr, typeof(object))));

                var ptrToStruct = typeof(UnmanagedType).GetMethod("PtrToUnmanaged").MakeGenericMethod(type);
                var val = Expression.Variable(type);
                context.Variables.Add(val);
                context.BlockExpressions.Add(Expression.Call(null, ptrToStruct, ptr, val));
                return val;
            }*/
            else
            {
                throw new Exception("scriptToNative: " + tranType + " not support yet!");
            }
            if (type.IsEnum)
            {
                ret = Expression.Convert(ret, type);
            }
            return ret;
        }

        private static Expression scriptToNative(CompileContext context, ParameterInfo parameterInfo, int parameterInfoIndex, Expression info, Expression value)
        {
            var totalArgc = callPApi(context.Apis, "get_args_len", info);
            if (parameterInfo.IsDefined(typeof(ParamArrayAttribute), false))
            {
                var test = Expression.Call(
                    Helpper.MakeGenericMethod(nameof(Helpper.IsAssignable_ByRef), parameterInfo.ParameterType),
                    context.Apis,
                    context.Env,
                    value
                );

                Expression trueBranch = scriptToNative(context, parameterInfo.ParameterType, value);

                var argcVar = Expression.Variable(typeof(int), "argc");
                var arrayVar = Expression.Variable(parameterInfo.ParameterType, "array");
                var indexVar = Expression.Variable(typeof(int), "index");
                var loopLabel = Expression.Label();

                var elementType = parameterInfo.ParameterType.GetElementType();
                var falseBranch = Expression.Block(
                    new[] { argcVar, arrayVar, indexVar },
                    Expression.Assign(argcVar,
                        Expression.Subtract(totalArgc, Expression.Constant(parameterInfoIndex))),
                    Expression.IfThen(
                        Expression.LessThan(argcVar, Expression.Constant(0)),
                        Expression.Assign(argcVar, Expression.Constant(0))
                    ),
                    Expression.Assign(arrayVar,
                        Expression.NewArrayBounds(elementType, argcVar)),
                    Expression.Assign(indexVar, Expression.Constant(0)),
                    Expression.Loop(
                        Expression.IfThenElse(
                            Expression.LessThan(indexVar, argcVar),
                            Expression.Block(
                                Expression.Assign(
                                    Expression.ArrayAccess(arrayVar, indexVar),
                                    scriptToNative(
                                        context,
                                        elementType,
                                        callPApi(context.Apis, "get_arg", info,
                                            Expression.Add(indexVar, Expression.Constant(parameterInfoIndex)))
                                )),
                                Expression.PostIncrementAssign(indexVar)
                            ),
                            Expression.Break(loopLabel)
                        ),
                        loopLabel
                    ),
                    arrayVar
                );

                return Expression.Condition(test, trueBranch, falseBranch);
            }
            else
            {
                var res = scriptToNative(context, parameterInfo.ParameterType, value);
                if (parameterInfo.HasDefaultValue)
                {
                    return Expression.Condition(callPApi(context.Apis, "is_undefined", context.Env, value),
                        (parameterInfo.DefaultValue == null && parameterInfo.ParameterType.IsValueType) 
                        ? ((Expression)Expression.Default(parameterInfo.ParameterType)) 
                        : ((Expression)Expression.Constant(parameterInfo.DefaultValue, parameterInfo.ParameterType)), res);
                }
                else
                {
                    return res;
                }
            }
        }

        private static Expression returnToScript(CompileContext context, Type type, ParameterExpression info, Expression value)
        {
            if (type == typeof(void))
            {
                return null;
            }
            return callPApi(context.Apis, "add_return", info, nativeToScript(context, type, value));
        }

        private static Expression directCheckArgumentConditions(Expression apis, Expression env, Expression value, params string[] apiNames)
        {
            return buildOrExpression(apiNames.Select(n => callPApi(apis, n, env, value)));
        }

        private static Expression checkArgument(CompileContext context, Type type, Expression value)
        {
            Type underlyingType = Nullable.GetUnderlyingType(type);
            if (underlyingType != null)
            {
                var isNullOrUndefined = Expression.OrElse(callPApi(context.Apis, "is_null", context.Env, value), callPApi(context.Apis, "is_undefined", context.Env, value)); // TODO: 太多pinvoke了，添加获取类型更好？
                return Expression.OrElse(isNullOrUndefined, checkArgument(context, underlyingType, value));
            }
            if (type.IsEnum)
            {
                type = Enum.GetUnderlyingType(type);
            }
            if (type == typeof(int))
            {
                // !apis.is_int32(env, value);
                return directCheckArgumentConditions(context.Apis, context.Env, value, "is_int32");
            }
            else if (type == typeof(string))
            {
                return directCheckArgumentConditions(context.Apis, context.Env, value, "is_null", "is_undefined", "is_string");
            }
            else if (type == typeof(object))
            {
                return Expression.Constant(true); // accpet any type
            }
            else if (type == typeof(ScriptObject))
            {
                return directCheckArgumentConditions(context.Apis, context.Env, value, "is_null", "is_undefined", "is_object");
            }
            else if (type == typeof(bool))
            {
                return directCheckArgumentConditions(context.Apis, context.Env, value, "is_boolean");
            }
            else if (type == typeof(uint))
            {
                return directCheckArgumentConditions(context.Apis, context.Env, value, "is_uint32");
            }
            else if (type == typeof(long))
            {
                return directCheckArgumentConditions(context.Apis, context.Env, value, "is_int64");
            }
            else if (type == typeof(ulong))
            {
                return directCheckArgumentConditions(context.Apis, context.Env, value, "is_uint64");
            }
            else if (type == typeof(float))
            {
                return directCheckArgumentConditions(context.Apis, context.Env, value, "is_double");
            }
            else if (type == typeof(sbyte) || type == typeof(short))
            {
                return directCheckArgumentConditions(context.Apis, context.Env, value, "is_int32");
            }
            else if (type == typeof(byte) || type == typeof(ushort))
            {
                return directCheckArgumentConditions(context.Apis, context.Env, value, "is_int32", "is_uint32");
            }
            else if (type == typeof(char))
            {
                return directCheckArgumentConditions(context.Apis, context.Env, value, "is_int32");
            }
            else if (type == typeof(double))
            {
                return directCheckArgumentConditions(context.Apis, context.Env, value, "is_double");
            }
            else if (type == typeof(ArrayBuffer))
            {
                return directCheckArgumentConditions(context.Apis, context.Env, value, "is_null", "is_undefined", "is_binary");
            }
            else if (typeof(Delegate).IsAssignableFrom(type) && type != typeof(Delegate) && type != typeof(MulticastDelegate))
            {
                var isAssignableMethod = Helpper.MakeGenericMethod(nameof(Helpper.IsAssignable_ByRef), type);
                return buildOrExpression(new string[] { "is_null", "is_function" }.Select(n => callPApi(context.Apis, n, context.Env, value))
                    .Concat(new Expression[] { Expression.Call(isAssignableMethod, context.Apis, context.Env, value) })
                    );
            }
            else if (type.IsByRef)
            {
                return directCheckArgumentConditions(context.Apis, context.Env, value, "is_boxed_value");
            }
            else if (type == typeof(System.TypedReference))
            {
                // 用TypedReference去实例化一个泛型函数，会导致mono崩溃，崩溃时报这个信息：
                // Assertion at C:\build\output\Unity-Technologies\mono\mono\metadata\reflection.c:2658, condition `is_ok (error)' not met, function:reflection_bind_generic_method_parameters, MVAR 0 cannot be expanded with type 0x16
                // 似乎是内部写死的规则，先禁用
                // TODO: 后续可以通过按特殊类（比如上面的int之类）处理来支持
                throw new Exception("checkArgument: " + type + " will cause crash!");
            }
            else if (!type.IsValueType)
            {
                var isAssignableMethod = Helpper.MakeGenericMethod(nameof(Helpper.IsAssignable_ByRef), type);
                return Expression.Call(isAssignableMethod, context.Apis, context.Env, value);
            }
            else if (type.IsValueType && !type.IsPrimitive)
            {
                var isAssignableMethod = Helpper.MakeGenericMethod(nameof(Helpper.IsAssignable_ValueType), type);
                return Expression.Call(isAssignableMethod, context.Apis, context.Env, value);
            }
            else
            {
                throw new Exception("checkArgument: " + type + " not support yet!");
            }
        }

        private static Expression checkArgument(CompileContext context, ParameterInfo parameterInfo, Expression value)
        {
            var hasParams = parameterInfo.IsDefined(typeof(ParamArrayAttribute), false);
            var test = checkArgument(context, parameterInfo.ParameterType, value);
            if (hasParams)
            {
                test = Expression.OrElse(test, checkArgument(context, parameterInfo.ParameterType.GetElementType(), value));
            }
            return (parameterInfo.HasDefaultValue || hasParams) ? Expression.OrElse(callPApi(context.Apis, "is_undefined", context.Env, value), test) : test;
        }

        private static Expression getArgument(CompileContext context, ParameterExpression info, int index)
        {
            //var temp = apis.get_arg(info, index);
            var temp = Expression.Variable(typeof(IntPtr));
            context.Variables.Add(temp);
            context.BlockExpressions.Add(Expression.Assign(temp, callPApi(context.Apis, "get_arg", info, Expression.Constant(index))));
            return temp;
        }

        private static Expression buildOrExpression(IEnumerable<Expression> conditions)
        {
            if (!conditions.Any())
                return Expression.Constant(false);

            if (conditions.Count() == 1)
                return conditions.First();

            return conditions.Aggregate((left, right) =>
                Expression.OrElse(left, right));
        }

        private static Expression buildAndExpression(IEnumerable<Expression> conditions)
        {
            if (!conditions.Any())
                return Expression.Constant(false);

            if (conditions.Count() == 1)
                return conditions.First();

            return conditions.Aggregate((left, right) =>
                Expression.AndAlso(left, right));
        }

        private static Expression buildAndExpression(params Expression[] conditions)
        {
            return buildAndExpression((IEnumerable<Expression>)conditions);
        }

        private static Expression buildArgumentsLengthCheck(MethodBase methodBase, bool isExtensionMethod, ParameterExpression jsArgc)
        {
            bool hasDefault = false;
            bool hasParams = false;
            int expectArgc = 0;

            var ps = methodBase.GetParameters();
            for (int i = 0; i < ps.Length; ++i)
            {
                var pi = ps[i];
                if (pi.HasDefaultValue)
                {
                    hasDefault = true; ;
                }
                else if (i == ps.Length - 1 && pi.IsDefined(typeof(ParamArrayAttribute), false))
                {
                    hasParams = true;
                }
                else
                {
                    ++expectArgc;
                }
            }

            expectArgc -=  isExtensionMethod ? 1 : 0;

            if (hasParams)
            {
                return Expression.GreaterThanOrEqual(jsArgc, Expression.Constant(expectArgc));
            }
            else if (hasDefault)
            {
                return buildAndExpression(Expression.GreaterThanOrEqual(jsArgc, Expression.Constant(expectArgc)), Expression.LessThanOrEqual(jsArgc, Expression.Constant(ps.Length)));
            }
            else
            {
                return Expression.Equal(jsArgc, Expression.Constant(expectArgc));
            }

        }

        private static Expression buildArgumentsCheck(CompileContext context, MethodBase methodBase, bool isExtensionMethod, ParameterExpression jsArgc, Func<int, Expression> getJsArg)
        {
            List<Expression> expressions = new List<Expression>();
            expressions.Add(buildArgumentsLengthCheck(methodBase, isExtensionMethod, jsArgc));
            if (methodBase.GetParameters().Length > 0)
            {
                expressions.AddRange(methodBase.GetParameters()
                    .Skip(isExtensionMethod ? 1 : 0)
                    .Select((ParameterInfo pi, int index) => checkArgument(context, pi, getJsArg(index))));
            }
            return buildAndExpression(expressions);
        }

        private static Expression buildConditionalChain(
            Expression[] tests,
            Expression[] ifTrues,
            Expression ifFalse)
        {
            Expression result = ifFalse;
            for (int i = tests.Length - 1; i >= 0; i--)
            {
                result = Expression.Condition(tests[i], ifTrues[i], result);
            }
            return result;
        }

        private static Expression buildVoidIfElseIfChain(
            Expression[] tests,
            Expression[] ifTrues,
            Expression ifFalse)
        {
            var endLabel = Expression.Label("End");
            var blocks = new List<Expression>();

            for (int i = 0; i < tests.Length; i++)
            {
                blocks.Add(
                    Expression.IfThen(
                        tests[i],
                        Expression.Block(
                            ifTrues[i],
                            Expression.Goto(endLabel)
                        )
                    )
                );
            }

            blocks.Add(ifFalse);
            blocks.Add(Expression.Label(endLabel));

            return Expression.Block(blocks);
        }

        private static bool isExtensionOf(MethodInfo methodInfo, Type type)
        {
            return type != null && methodInfo != null && type == PuertsIl2cpp.ExtensionMethodInfo.GetExtendedType(methodInfo);
        }

        private static T BuildMethodBaseWrap<T>(Type type, MethodBase[] methodBases, bool forceCheckArgs, Func<CompileContext, MethodBase, ParameterExpression, ParameterExpression, Func<int, Expression>, Expression> buildBody)
        {
            bool checkArgs = forceCheckArgs || methodBases.Length > 1;
            var methodBase0 = methodBases[0];
            foreach (var pi in methodBase0.GetParameters())
            {
                if (pi.HasDefaultValue || pi.IsDefined(typeof(ParamArrayAttribute), false))
                {
                    // TODO: 和原来版本保持一致，3.0了，可以考虑是否去掉这规则
                    checkArgs = true;
                    break;
                }
            }
            bool isValueTypeMethod = type.IsValueType;
            Type returnType = typeof(T).GetMethod("Invoke").ReturnType;
            var isLambdaVoid = returnType == typeof(void);

            var variables = new List<ParameterExpression>();
            var blockExpressions = new List<Expression>();

            var apis = Expression.Parameter(typeof(IntPtr), "apis");
            var info = Expression.Parameter(typeof(IntPtr), "info");

            // var env = ffi.get_env(info);
            var env = Expression.Variable(typeof(IntPtr));
            variables.Add(env);
            blockExpressions.Add(Expression.Assign(env, callPApi(apis, "get_env", info)));

            var context = new CompileContext()
            {
                Variables = variables,
                BlockExpressions = blockExpressions,
                Apis = apis,
                Env = env
            };

            // var argc = ffi.get_args_len(info)
            var jsArgc = Expression.Variable(typeof(int));
            variables.Add(jsArgc);
            blockExpressions.Add(Expression.Assign(jsArgc, callPApi(context.Apis, "get_args_len", info)));

            var envIdx = Expression.Variable(typeof(int));
            variables.Add(envIdx);
            blockExpressions.Add(Expression.Assign(envIdx, Expression.Call(Helpper.GetMethod(nameof(Helpper.GetEnvIndex)), apis, env)));

            List<Expression> lazyjsArgs = new List<Expression>();
            Func<int, Expression> getJsArg = (index) =>
            {
                if (index < lazyjsArgs.Count && lazyjsArgs[index] != null) return lazyjsArgs[index];
                var arg = getArgument(context, info, index);
                int addCount = index + 1 - lazyjsArgs.Count;
                for (int i = 0; i < addCount; ++i) lazyjsArgs.Add(null);
                lazyjsArgs[index] = arg;
                return arg;
            };

            ParameterExpression selfId = null;

            Func<ParameterExpression> GetSelfId = () =>
            {
                if (selfId == null)
                {
                    selfId = Expression.Variable(typeof(int));
                    variables.Add(selfId);
                    blockExpressions.Add(Expression.Assign(selfId, Expression.Call(Helpper.GetMethod(nameof(Helpper.GetSelfId)), apis, info)));
                }
                return selfId;
            };

            ParameterExpression self = null;

            Func<ParameterExpression> GetSelf = () =>
            {
                if (self == null)
                {
                    // Class1 self = Helpper.Get<Class1>(apis, env, info);
                    var getSelfMethod = Helpper.MakeGenericMethod(nameof(Helpper.GetSelfDirect), type);
                    self = Expression.Variable(type);
                    variables.Add(self);
                    var callGetSelf = Expression.Call(getSelfMethod, envIdx, GetSelfId());
                    blockExpressions.Add(Expression.Assign(self, callGetSelf));
                }
                return self;
            };

            Expression invokeBlock = null;

            if (checkArgs)
            {
                var tests = methodBases.Select(mb => buildArgumentsCheck(context, mb, isExtensionOf(mb as MethodInfo, type), jsArgc, getJsArg)).ToArray();

                var ifTrues = methodBases.Select(mb => buildBody(context, mb, info, (!mb.IsStatic && !mb.IsConstructor) || isExtensionOf(mb as MethodInfo, type) ? GetSelf() : null, getJsArg)).ToArray();

                var throwToJs = callPApi(apis, "throw_by_string", info, Expression.Constant($"invalid arguments to {methodBase0.Name} of {type.Name}"));
                var ifFalse = isLambdaVoid ? throwToJs : Expression.Block(throwToJs, Expression.Default(returnType));

                invokeBlock = isLambdaVoid ? buildVoidIfElseIfChain(tests, ifTrues, ifFalse) : buildConditionalChain(tests, ifTrues, ifFalse);
            }
            else // methodBases.Length == 1;
            {
                invokeBlock = buildBody(context, methodBase0, info, (!methodBase0.IsStatic && !methodBase0.IsConstructor) || isExtensionOf(methodBase0 as MethodInfo, type) ? GetSelf() : null, getJsArg);
            }

            blockExpressions.Add(invokeBlock);

            if (!methodBase0.IsStatic && !methodBase0.IsConstructor && isValueTypeMethod)
            {
                var updateMethod = Helpper.MakeGenericMethod(nameof(Helpper.UpdateValueType), type);
                var updateCall = Expression.Call(updateMethod, envIdx, GetSelfId(), GetSelf());
                if (isLambdaVoid)
                {
                    blockExpressions.Add(updateCall);
                }
                else
                {
                    var temp = Expression.Variable(returnType);
                    variables.Add(temp);
                    blockExpressions.Add(Expression.Assign(temp, invokeBlock));

                    blockExpressions.Add(updateCall);

                    blockExpressions.Add(temp);
                }
            }


            var block = Expression.Block(variables, blockExpressions);

            var exVar = Expression.Variable(typeof(Exception), "ex");

            var formatExpr = Expression.Call(
                stringFormatMethod,
                Expression.Constant("C# Exception: {0}, Stack: {1}"),
                Expression.NewArrayInit(
                    typeof(object),
                    Expression.Convert(Expression.Property(exVar, "Message"), typeof(object)),
                    Expression.Convert(Expression.Property(exVar, "StackTrace"), typeof(object))
                )
            );

            var catchBlock = Expression.Block(
                returnType,
                callPApi(apis, "throw_by_string", info, formatExpr),
                Expression.Default(returnType)
            );

            var tryCatchExpr = Expression.TryCatch(
                Expression.Block(returnType, block),
                Expression.Catch(exVar, catchBlock)
            );

            return Expression.Lambda<T>(tryCatchExpr, $"{type.Name}_m_{methodBase0.Name}", new[] { apis, info }).Compile();
        }

        public static pesapi_callback BuildMethodWrap(Type type, MethodInfo[] methodInfos, bool forceCheckArgs)
        {
            return BuildMethodBaseWrap<pesapi_callback>(type, methodInfos, forceCheckArgs, (contextOutside, methodBase, info, self, getJsArg) =>
            {
                var methodInfo = methodBase as MethodInfo;

                var extensionMethod = isExtensionOf(methodInfo, type);

                var variables = new List<ParameterExpression>();
                var blockExpressions = new List<Expression>();
                var context = new CompileContext()
                {
                    Variables = variables,
                    BlockExpressions = blockExpressions,
                    Apis = contextOutside.Apis,
                    Env = contextOutside.Env
                };

                var tempVariables = methodInfo.GetParameters().Select(pi => Expression.Variable(pi.ParameterType.IsByRef ? pi.ParameterType.GetElementType() : pi.ParameterType)).ToArray();
                variables.AddRange(tempVariables);
                var argStartPos = extensionMethod ? 1 : 0;
                var assignments = methodInfo.GetParameters().Select((ParameterInfo pi, int index) => (extensionMethod && index == 0) ? Expression.Assign(tempVariables[index], self) : Expression.Assign(tempVariables[index], scriptToNative(context, pi, index - argStartPos, info, getJsArg(index - argStartPos))));
                blockExpressions.AddRange(assignments);

                var callMethod = Expression.Call(extensionMethod ? null : self, methodInfo, tempVariables);

                // call method
                ParameterExpression tempResult = null;
                if (methodInfo.ReturnType != typeof(void))
                {
                    tempResult = Expression.Variable(methodInfo.ReturnType);
                    variables.Add(tempResult);
                    blockExpressions.Add(Expression.Assign(tempResult, callMethod));
                }
                else
                {
                    blockExpressions.Add(callMethod);
                }

                var parameters = methodBase.GetParameters();
                for (int i = 0; i < parameters.Length; ++i)
                {
                    var parameter = parameters[i];
                    if (parameter.ParameterType.IsByRef)
                    {
                        blockExpressions.Add(callPApi(context.Apis, "update_boxed_value", context.Env, getJsArg(i), nativeToScript(context, parameter.ParameterType.GetElementType(), tempVariables[i])));
                    }
                }

                // return if needed
                if (methodInfo.ReturnType != typeof(void))
                {
                    blockExpressions.Add(returnToScript(context, methodInfo.ReturnType, info, tempResult));
                }

                return Expression.Block(variables, blockExpressions);
            });

        }

        public static pesapi_callback BuildMethodWrap(Type type, MethodInfo methodInfo, bool forceCheckArgs)
        {
            return BuildMethodWrap(type, new MethodInfo[] { methodInfo }, forceCheckArgs);
        }

        public static pesapi_constructor BuildDelegateConstructorWrap(Type type, ConstructorInfo[] constructorInfos, bool forceCheckArgs)
        {
            return BuildMethodBaseWrap<pesapi_constructor>(type, constructorInfos.Take(1).ToArray(), false, (contextOutside, methodBase, info, self, getJsArg) =>
            {
                var constructorInfo = methodBase as ConstructorInfo;

                var variables = new List<ParameterExpression>();
                var blockExpressions = new List<Expression>();
                var context = new CompileContext()
                {
                    Variables = variables,
                    BlockExpressions = blockExpressions,
                    Apis = contextOutside.Apis,
                    Env = contextOutside.Env
                };

                var arg0 = getJsArg(0);

                var delObj = scriptToNative(context, type, arg0);

                var result = Expression.Variable(typeof(IntPtr));
                variables.Add(result);
                var addToObjectPoolMethod = Helpper.GetMethod(nameof(Helpper.FindOrAddObject));
                var addToObjectPool = Expression.Call(addToObjectPoolMethod, context.Apis, context.Env, delObj);
                blockExpressions.Add(Expression.Assign(result, addToObjectPool));

                blockExpressions.Add(result);

                return Expression.Block(variables, blockExpressions);
            });
            
        }

        public static pesapi_constructor BuildConstructorWrap(Type type, ConstructorInfo[] constructorInfos, bool forceCheckArgs)
        {
            return BuildMethodBaseWrap<pesapi_constructor>(type, constructorInfos, forceCheckArgs, (contextOutside, methodBase, info, self, getJsArg) =>
            {
                var constructorInfo = methodBase as ConstructorInfo;

                var variables = new List<ParameterExpression>();
                var blockExpressions = new List<Expression>();
                var context = new CompileContext()
                {
                    Variables = variables,
                    BlockExpressions = blockExpressions,
                    Apis = contextOutside.Apis,
                    Env = contextOutside.Env
                };

                var tempVariables = constructorInfo.GetParameters().Select(pi => Expression.Variable(pi.ParameterType.IsByRef ? pi.ParameterType.GetElementType() : pi.ParameterType)).ToArray();
                variables.AddRange(tempVariables);
                var assignments = constructorInfo.GetParameters().Select((ParameterInfo pi, int index) => Expression.Assign(tempVariables[index], scriptToNative(context, pi, index, info, getJsArg(index))));
                blockExpressions.AddRange(assignments);

                var callNew = Expression.New(constructorInfo, tempVariables);

                var result = Expression.Variable(typeof(IntPtr));
                variables.Add(result);
                var isValueType = constructorInfo.DeclaringType.IsValueType;
                var addToObjectPoolMethod = isValueType ? Helpper.MakeGenericMethod(nameof(Helpper.AddValueType), constructorInfo.DeclaringType) : Helpper.GetMethod(nameof(Helpper.FindOrAddObject));
                var addToObjectPool = Expression.Call(addToObjectPoolMethod, context.Apis, context.Env, callNew);
                blockExpressions.Add(Expression.Assign(result, addToObjectPool));

                var parameters = methodBase.GetParameters();
                for (int i = 0; i < parameters.Length; ++i)
                {
                    var parameter = parameters[i];
                    if (parameter.ParameterType.IsByRef)
                    {
                        blockExpressions.Add(callPApi(context.Apis, "update_boxed_value", context.Env, getJsArg(i), nativeToScript(context, parameter.ParameterType.GetElementType(), tempVariables[i])));
                    }
                }

                blockExpressions.Add(result);

                return Expression.Block(variables, blockExpressions);
            });
        }

        public static pesapi_callback BuildFieldGetter(FieldInfo fieldInfo)
        {
            var variables = new List<ParameterExpression>();
            var blockExpressions = new List<Expression>();

            var apis = Expression.Parameter(typeof(IntPtr), "apis");
            var info = Expression.Parameter(typeof(IntPtr), "info");

            // var env = ffi.get_env(info);
            var env = Expression.Variable(typeof(IntPtr));
            variables.Add(env);
            blockExpressions.Add(Expression.Assign(env, callPApi(apis, "get_env", info)));

            var context = new CompileContext()
            {
                Variables = variables,
                BlockExpressions = blockExpressions,
                Apis = apis,
                Env = env
            };

            ParameterExpression self = null;

            if (!fieldInfo.IsStatic)
            {
                // Class1 self = Helpper.Get<Class1>(apis, env, info);
                var getSelfMethod = Helpper.MakeGenericMethod(nameof(Helpper.GetSelf), fieldInfo.DeclaringType);
                self = Expression.Variable(fieldInfo.DeclaringType, "self");
                variables.Add(self);
                var callGetSelf = Expression.Call(getSelfMethod, apis, env, info);
                blockExpressions.Add(Expression.Assign(self, callGetSelf));
            }

            var field = Expression.Field(self, fieldInfo);
            var addReturn = returnToScript(context, fieldInfo.FieldType, info, field);
            blockExpressions.Add(addReturn);

            var block = Expression.Block(variables, blockExpressions);

            var exVar = Expression.Variable(typeof(Exception), "ex");

            var formatExpr = Expression.Call(
                stringFormatMethod,
                Expression.Constant("C# Exception: {0}, Stack: {1}"),
                Expression.NewArrayInit(
                    typeof(object),
                    Expression.Convert(Expression.Property(exVar, "Message"), typeof(object)),
                    Expression.Convert(Expression.Property(exVar, "StackTrace"), typeof(object))
                )
            );

            var tryCatchExpr = Expression.TryCatch(
                block,
                Expression.Catch(exVar, callPApi(apis, "throw_by_string", info, formatExpr))
            );

            return (Expression.Lambda<pesapi_callback>(tryCatchExpr, $"{fieldInfo.DeclaringType.Name}_g_{fieldInfo.Name}", new[] { apis, info })).Compile();
        }

        public static pesapi_callback BuildFieldSetter(FieldInfo fieldInfo)
        {
            var variables = new List<ParameterExpression>();
            var blockExpressions = new List<Expression>();

            var apis = Expression.Parameter(typeof(IntPtr), "apis");
            var info = Expression.Parameter(typeof(IntPtr), "info");

            // var env = ffi.get_env(info);
            var env = Expression.Variable(typeof(IntPtr));
            variables.Add(env);
            blockExpressions.Add(Expression.Assign(env, callPApi(apis, "get_env", info)));

            var envIdx = Expression.Variable(typeof(int));
            variables.Add(envIdx);
            blockExpressions.Add(Expression.Assign(envIdx, Expression.Call(Helpper.GetMethod(nameof(Helpper.GetEnvIndex)), apis, env)));

            var selfId = Expression.Variable(typeof(int));
            variables.Add(selfId);
            blockExpressions.Add(Expression.Assign(selfId, Expression.Call(Helpper.GetMethod(nameof(Helpper.GetSelfId)), apis, info)));

            var context = new CompileContext()
            {
                Variables = variables,
                BlockExpressions = blockExpressions,
                Apis = apis,
                Env = env
            };

            ParameterExpression self = null;

            if (!fieldInfo.IsStatic)
            {
                var getSelfMethod = Helpper.MakeGenericMethod(nameof(Helpper.GetSelfDirect), fieldInfo.DeclaringType);
                self = Expression.Variable(fieldInfo.DeclaringType, "self");
                variables.Add(self);
                var callGetSelf = Expression.Call(getSelfMethod, envIdx, selfId);
                blockExpressions.Add(Expression.Assign(self, callGetSelf));
            }

            var field = Expression.Field(self, fieldInfo);
            var jsValue = getArgument(context, info, 0);
            blockExpressions.Add(Expression.Assign(field, scriptToNative(context, fieldInfo.FieldType, jsValue)));

            if (!fieldInfo.IsStatic && fieldInfo.DeclaringType.IsValueType)
            {
                var updateMethod = Helpper.MakeGenericMethod(nameof(Helpper.UpdateValueType), fieldInfo.DeclaringType);
                var updateCall = Expression.Call(updateMethod, envIdx, selfId, self);
                blockExpressions.Add(updateCall);
            }

            var block = Expression.Block(typeof(void), variables, blockExpressions);

            var exVar = Expression.Variable(typeof(Exception), "ex");

            var formatExpr = Expression.Call(
                stringFormatMethod,
                Expression.Constant("C# Exception: {0}, Stack: {1}"),
                Expression.NewArrayInit(
                    typeof(object),
                    Expression.Convert(Expression.Property(exVar, "Message"), typeof(object)),
                    Expression.Convert(Expression.Property(exVar, "StackTrace"), typeof(object))
                )
            );

            var tryCatchExpr = Expression.TryCatch(
                block,
                Expression.Catch(exVar, callPApi(apis, "throw_by_string", info, formatExpr))
            );

            return (Expression.Lambda<pesapi_callback>(tryCatchExpr, $"{fieldInfo.DeclaringType.Name}_s_{fieldInfo.Name}", new[] { apis, info })).Compile();
        }

        private static Dictionary<Type, Delegate> NativeTranlatorCache = new Dictionary<Type, Delegate>();

        public static Func<IntPtr, IntPtr, IntPtr, TResult> GetNativeTranlator<TResult>()
        {
            Delegate ret;
            if (!NativeTranlatorCache.TryGetValue(typeof(TResult), out ret))
            {
                var apis = Expression.Parameter(typeof(IntPtr), "apis");
                var env = Expression.Parameter(typeof(IntPtr), "env");
                var value = Expression.Parameter(typeof(IntPtr), "value");

                var variables = new List<ParameterExpression>();
                var blockExpressions = new List<Expression>();

                var context = new CompileContext()
                {
                    Variables = variables,
                    BlockExpressions = blockExpressions,
                    Apis = apis,
                    Env = env
                };

                blockExpressions.Add(scriptToNative(context, typeof(TResult), value));
                
                ret = Expression.Lambda(typeof(Func<IntPtr, IntPtr, IntPtr, TResult>), Expression.Block(variables, blockExpressions), apis, env, value).Compile();
                NativeTranlatorCache.Add(typeof(TResult), ret);
            }

            return ret as Func<IntPtr, IntPtr, IntPtr, TResult>;
        }
    }
}
#endif

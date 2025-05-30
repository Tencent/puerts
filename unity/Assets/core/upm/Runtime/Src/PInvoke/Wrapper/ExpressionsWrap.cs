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
                var envIdx = NativeAPI.pesapi_get_env_private(api, env).ToInt32();
                var objIdx = NativeAPI.pesapi_get_native_holder_ptr(api, info).ToInt32();
                return (T)JsEnv.jsEnvs[envIdx].objectPool.Get(objIdx);
            }

            public static IntPtr FindOrAddObject(IntPtr apis, IntPtr env, object obj)
            {
                var envIdx = NativeAPI.pesapi_get_env_private(apis, env).ToInt32();
                return new IntPtr(JsEnv.jsEnvs[envIdx].objectPool.FindOrAddObject(obj));
            }

            // do not find, just Add for ValueType
            public static IntPtr AddValueType<T>(IntPtr apis, IntPtr env, T val) where T : struct
            {
                var envIdx = NativeAPI.pesapi_get_env_private(apis, env).ToInt32();
                return new IntPtr(JsEnv.jsEnvs[envIdx].objectPool.AddBoxedValueType(val));
            }

            public static void CheckException(IntPtr apis, IntPtr scope)
            {
                if (NativeAPI.pesapi_has_caught(apis, scope))
                {
                    string msg = Marshal.PtrToStringUTF8(NativeAPI.pesapi_get_exception_as_string(apis, scope, true));
                    throw new InvalidOperationException(msg);
                }
            }

            public static IntPtr NativeToScript_String(IntPtr apis, IntPtr env, string str)
            {
                if (str == null)
                {
                    return NativeAPI.pesapi_create_null(apis, env);
                }
                byte[] utf16 = Encoding.Unicode.GetBytes(str);
                return NativeAPI.pesapi_create_string_utf16(apis, env, utf16, new UIntPtr((uint)str.Length));
            }

            public static IntPtr NativeToScript_ScriptObject(IntPtr apis, IntPtr env, JSObject obj)
            {
                if (apis != obj.apis)
                {
                    throw new InvalidCastException("ScriptObject form other papi provider!");
                }

                // apis is the same, using apis
                var objEnvRef = NativeAPI.pesapi_get_ref_associated_env(apis, obj.objRef);
                if (!NativeAPI.pesapi_env_ref_is_valid(apis, objEnvRef))
                {
                    throw new InvalidCastException("ScriptObject env is invalid!");
                }
                
                var scope = NativeAPI.pesapi_open_scope(apis, objEnvRef);
                
                var isEnvEq = NativeAPI.pesapi_get_env_from_ref(apis, objEnvRef) == env;
                NativeAPI.pesapi_close_scope(apis, scope);
                //TODO: 提供一种能判断env是否同样的方式
                //if (!isEnvEq)
                //{
                //    throw new InvalidCastException("ScriptObject own by anther env");
                //}
                return NativeAPI.pesapi_get_value_from_ref(apis, env, obj.objRef);
            }

            public static IntPtr NativeToScript_NativeType(IntPtr apis, IntPtr env, NativeType t)
            {
                return NativeAPI.pesapi_create_class(apis, env, new IntPtr(t.typeId));
            }

            public static IntPtr NativeToScript_ArrayBuffer(IntPtr apis, IntPtr env, ArrayBuffer arrayBuffer)
            {
                return NativeAPI.pesapi_create_binary(apis, env, arrayBuffer.Bytes, new UIntPtr((uint)arrayBuffer.Count));
            }

            public static IntPtr NativeToScript_Object(IntPtr apis, IntPtr env, object t)
            {
                if(t == null)
                {
                    return NativeAPI.pesapi_create_null(apis, env);
                }
                else if (t is int intValue)
                {
                    return NativeAPI.pesapi_create_int32(apis, env, intValue);
                }
                else if (t is uint uintValue)
                {
                    return NativeAPI.pesapi_create_uint32(apis, env, uintValue);
                }
                else if (t is long longValue)
                {
                    return NativeAPI.pesapi_create_int64(apis, env, longValue);
                }
                else if (t is ulong ulongValue)
                {
                    return NativeAPI.pesapi_create_uint64(apis, env, ulongValue);
                }
                else if (t is double doubleValue)
                {
                    return NativeAPI.pesapi_create_double(apis, env, doubleValue);
                }
                else if (t is float floatValue)
                {
                    return NativeAPI.pesapi_create_double(apis, env, floatValue);
                }
                else if (t is char charValue)
                {
                    return NativeAPI.pesapi_create_int32(apis, env, charValue);
                }
                else if (t is bool boolValue)
                {
                    return NativeAPI.pesapi_create_boolean(apis, env, boolValue);
                }
                else if (t is string strValue)
                {
                    return NativeToScript_String(apis, env, strValue);
                }
                else if (t is JSObject jsObject)
                {
                    return NativeToScript_ScriptObject(apis, env, jsObject);
                }
                else if (t is ArrayBuffer arrayBuffer)
                {
                    return NativeToScript_ArrayBuffer(apis, env, arrayBuffer);
                }
                else if (!t.GetType().IsValueType)
                {
                    return NativeToScript_T<object>(apis, env, t);
                }
                else if(t.GetType().IsValueType && !t.GetType().IsPrimitive)
                {
                    return NativeToScript_ValueType_Boxed(apis, env, t);
                }
                throw new NotSupportedException($"NativeToScript_Object does not support type: {t.GetType()}");
            }

            public static IntPtr NativeToScript_T<T>(IntPtr apis, IntPtr env, T value) where T : class
            {
                if (value == null)
                {
                    return NativeAPI.pesapi_create_null(apis, env);
                }
                var envIdx = NativeAPI.pesapi_get_env_private(apis, env).ToInt32();
                var objectPool = JsEnv.jsEnvs[envIdx].objectPool;
                var typeId = TypeRegister.Instance.FindOrAddTypeId(value.GetType());
                var objId = objectPool.FindOrAddObject(value);
                return NativeAPI.pesapi_native_object_to_value(apis, env, new IntPtr(typeId), new IntPtr(objId), false);
            }

            public static IntPtr NativeToScript_ValueType_Boxed(IntPtr apis, IntPtr env, object value)
            {
                var envIdx = NativeAPI.pesapi_get_env_private(apis, env).ToInt32();
                var objectPool = JsEnv.jsEnvs[envIdx].objectPool;
                var typeId = TypeRegister.Instance.FindOrAddTypeId(value.GetType());
                var objId = objectPool.AddBoxedValueType(value);
                return NativeAPI.pesapi_native_object_to_value(apis, env, new IntPtr(typeId), new IntPtr(objId), false);
            }

            public static IntPtr NativeToScript_ValueType<T>(IntPtr apis, IntPtr env, T value) where T : struct
            {
                return NativeToScript_ValueType_Boxed(apis, env, value);
            }

            public static T ScriptToNative_T<T>(IntPtr apis, IntPtr env, IntPtr obj)
            {
                var envIdx = NativeAPI.pesapi_get_env_private(apis, env).ToInt32();
                var objIdx = NativeAPI.pesapi_get_native_object_ptr(apis, env, obj).ToInt32();
                return (T)JsEnv.jsEnvs[envIdx].objectPool.Get(objIdx);
            }

            public static bool IsAssignable_ByRef<T>(IntPtr apis, IntPtr env, IntPtr obj)
            {
                if (NativeAPI.pesapi_is_null(apis, env, obj)) return true;
                var typeId = NativeAPI.pesapi_get_native_object_typeid(apis, env, obj).ToInt32();
                return typeId != 0 && typeof(T).IsAssignableFrom(TypeRegister.Instance.FindTypeById(typeId));
            }

            public static bool IsAssignable_ValueType<T>(IntPtr apis, IntPtr env, IntPtr obj)
            {
                var typeId = NativeAPI.pesapi_get_native_object_typeid(apis, env, obj).ToInt32();
                return typeId != 0 && typeof(T).IsAssignableFrom(TypeRegister.Instance.FindTypeById(typeId));
            }

            public static JSObject ScriptToNative_ScriptObject(IntPtr apis, IntPtr env, IntPtr value)
            {
                var valueRef = NativeAPI.pesapi_create_value_ref(apis, env, value, 0);
                return new JSObject(apis, valueRef);
            }

            public static string ScriptToNative_String(IntPtr apis, IntPtr env, IntPtr value)
            {
                UIntPtr outLen = UIntPtr.Zero;
                NativeAPI.pesapi_get_value_string_utf16(apis, env, value, null, ref outLen);
                byte[] buf = new byte[outLen.ToUInt32() * 2];
                NativeAPI.pesapi_get_value_string_utf16(apis, env, value, buf, ref outLen);
                return Encoding.Unicode.GetString(buf);
            }

            public static ArrayBuffer ScriptToNative_ArrayBuffer(IntPtr apis, IntPtr env, IntPtr value)
            {
                UIntPtr outLen = UIntPtr.Zero;
                IntPtr ptr = NativeAPI.pesapi_get_value_binary(apis, env, value, ref outLen);
                return new ArrayBuffer(ptr, (int)outLen.ToUInt32());
            }

            public static object ScriptToNative_Object(IntPtr apis, IntPtr env, IntPtr value)
            {
                if (NativeAPI.pesapi_is_null(apis, env, value) || NativeAPI.pesapi_is_undefined(apis, env, value))
                {
                    return null;
                }
                else if (NativeAPI.pesapi_is_boolean(apis, env, value))
                {
                    return NativeAPI.pesapi_get_value_bool(apis, env, value);
                }
                else if (NativeAPI.pesapi_is_int32(apis, env, value))
                {
                    return NativeAPI.pesapi_get_value_int32(apis, env, value);
                }
                else if (NativeAPI.pesapi_is_uint32(apis, env, value))
                {
                    return NativeAPI.pesapi_get_value_uint32(apis, env, value);
                }
                else if (NativeAPI.pesapi_is_int64(apis, env, value))
                {
                    return NativeAPI.pesapi_get_value_int64(apis, env, value);
                }
                else if (NativeAPI.pesapi_is_uint64(apis, env, value))
                {
                    return NativeAPI.pesapi_get_value_uint64(apis, env, value);
                }
                else if (NativeAPI.pesapi_is_double(apis, env, value))
                {
                    return NativeAPI.pesapi_get_value_double(apis, env, value);
                }
                else if (NativeAPI.pesapi_is_string(apis, env, value))
                {
                    return ScriptToNative_String(apis, env, value);
                }
                else if (NativeAPI.pesapi_is_object(apis, env, value))
                {
                    return ScriptToNative_ScriptObject(apis, env, value);
                }
                else if (NativeAPI.pesapi_is_array(apis, env, value))
                {
                    return ScriptToNative_ScriptObject(apis, env, value);
                }
                else if (NativeAPI.pesapi_is_binary(apis, env, value))
                {
                    return ScriptToNative_ArrayBuffer(apis, env, value);
                }
                else if (NativeAPI.pesapi_is_function(apis, env, value))
                {
                    return ScriptToNative_ScriptObject(apis, env, value);
                }
                var objId = NativeAPI.pesapi_get_native_object_ptr(apis, env, value);
                if (objId != IntPtr.Zero)
                {
                    var envIdx = NativeAPI.pesapi_get_env_private(apis, env).ToInt32();
                    return JsEnv.jsEnvs[envIdx].objectPool.Get(objId.ToInt32());
                }
                throw new NotSupportedException("Unsupported value type");
            }
        }

        class CompileContext
        {
            public List<ParameterExpression> Variables;
            public List<Expression> BlockExpressions;
            public ParameterExpression Apis;
            public Expression Env;
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
            // call NativeAPI
            var methodInfo = typeof(NativeAPI).GetMethod("pesapi_" + apiName);
            return Expression.Call(null, methodInfo, new [] { apis }.Concat(arguments));
        }

        private static Expression nativeToScript(CompileContext context, Type type, Expression value)
        {
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
                var toScriptMethod = typeof(Helpper).GetMethod(nameof(Helpper.NativeToScript_String));
                return Expression.Call(toScriptMethod, context.Apis, context.Env, value);
            }
            else if (tranType == typeof(JSObject))
            {
                var toScriptMethod = typeof(Helpper).GetMethod(nameof(Helpper.NativeToScript_ScriptObject));
                return Expression.Call(toScriptMethod, context.Apis, context.Env, value);
            }
            else if (tranType == typeof(NativeType))
            {
                var toScriptMethod = typeof(Helpper).GetMethod(nameof(Helpper.NativeToScript_NativeType));
                return Expression.Call(toScriptMethod, context.Apis, context.Env, value);
            }
            else if (tranType == typeof(ArrayBuffer))
            {
                var toScriptMethod = typeof(Helpper).GetMethod(nameof(Helpper.NativeToScript_ArrayBuffer));
                return Expression.Call(toScriptMethod, context.Apis, context.Env, value);
            }
            else if (tranType == typeof(object))
            {
                var toScriptMethod = typeof(Helpper).GetMethod(nameof(Helpper.NativeToScript_Object));
                return Expression.Call(toScriptMethod, context.Apis, context.Env, value);
            }
            else if (!tranType.IsValueType)
            {
                var toScriptMethod = typeof(Helpper).GetMethod(nameof(Helpper.NativeToScript_T)).MakeGenericMethod(tranType);
                return Expression.Call(toScriptMethod, context.Apis, context.Env, value);
            }
            else if (tranType.IsValueType && !tranType.IsPrimitive)
            {
                var toScriptMethod = typeof(Helpper).GetMethod(nameof(Helpper.NativeToScript_ValueType)).MakeGenericMethod(tranType);
                return Expression.Call(toScriptMethod, context.Apis, context.Env, value);
            }
            else
            {
                throw new Exception("nativeToScript: " + tranType + " not support yet!");
            }
        }

        private static MethodInfo logMethod = typeof(UnityEngine.Debug).GetMethod("Log", new[] { typeof(object) });
        private static MethodInfo stringFormatMethod = typeof(string).GetMethod("Format", new[] { typeof(string), typeof(object[]) });

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

        private static Expression delegateBridage(Type type, ParameterExpression apis, Expression envRef, Expression funcRef)
        {
            var invokeMethodInfo = type.GetMethod("Invoke");
            var delegateParams = invokeMethodInfo.GetParameters()
                .Select(pi => Expression.Parameter(pi.ParameterType, pi.Name))
                .ToArray();
            
            var checkException = typeof(Helpper).GetMethod(nameof(Helpper.CheckException));

            // 打印各参数，用作调试
            //var printArgs = delegateParams
            //    .Select(param => Printf($"{{1}} {param.Name}: {{0}}", param, Expression.Constant(type.Name)))
            //    .Cast<Expression>();
            
            var outerVariables = new List<ParameterExpression>();
            var outerExpressions = new List<Expression>();

            // var scope = apis.open_scope(envRef);
            var scope = Expression.Variable(typeof(IntPtr));
            outerVariables.Add(scope);
            outerExpressions.Add(Expression.Assign(scope, callPApi(apis, "open_scope", envRef)));

            var variables = new List<ParameterExpression>();
            //var blockExpressions = new List<Expression>(printArgs);
            var blockExpressions = new List<Expression>();

            var env = Expression.Variable(typeof(IntPtr));
            variables.Add(env);
            blockExpressions.Add(Expression.Assign(env, callPApi(apis, "get_env_from_ref", envRef)));

            var context = new CompileContext()
            {
                Variables = variables,
                BlockExpressions = blockExpressions,
                Apis = apis,
                Env = env
            };

            List<Expression> scriptValues = invokeMethodInfo.GetParameters().Select((ParameterInfo pi, int index) => nativeToScript(context, pi.ParameterType, delegateParams[index])).ToList();

            var argv = Expression.Variable(typeof(IntPtr[]));
            variables.Add(argv);
            blockExpressions.Add(Expression.Assign(argv, Expression.NewArrayInit(typeof(IntPtr), scriptValues)));

            var func = callPApi(apis, "get_value_from_ref", env, funcRef);

            // res = pesapi_call_function(apis, env, func, default(IntPtr), argc, argv);
            var res = Expression.Variable(typeof(IntPtr));
            variables.Add(res);

            var callFunc = callPApi(apis, "call_function", env, func, Expression.Default(typeof(IntPtr)), Expression.Constant(scriptValues.Count), argv);
            blockExpressions.Add(Expression.Assign(res, callFunc));

            blockExpressions.Add(Expression.Call(checkException, apis, scope));

            if (invokeMethodInfo.ReturnType != typeof(void))
            {
                blockExpressions.Add(scriptToNative(context, invokeMethodInfo.ReturnType, res));
            }

            outerExpressions.Add(Expression.TryFinally(Expression.Block(variables, blockExpressions), callPApi(apis, "close_scope", scope)));

            return Expression.Lambda(type, Expression.Block(outerVariables, outerExpressions), delegateParams);
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
                /*
                // UIntPtr bufsize = UIntPtr.Zero;
                var refBuffSize = Expression.Variable(typeof(UIntPtr));
                context.Variables.Add(refBuffSize);
                context.BlockExpressions.Add(Expression.Assign(refBuffSize, Expression.Field(null, typeof(UIntPtr), "Zero")));

                // NativeAPI.pesapi_get_value_string_utf16(apis, env, str, null, ref bufsize);
                context.BlockExpressions.Add(callPApi(context.Apis, "get_value_string_utf16", context.Env, value, Expression.Constant(null, typeof(byte[])), refBuffSize)); // 不添加到BlockExpressions会被优化掉，看上去是Lambda那反向遍历语法树，如果不是最终的表达式所需（依赖）的都会gc掉

                // byte[] buf = new byte[bufsize.ToUInt32() * 2];
                var bufVar = Expression.Variable(typeof(byte[]), "buf");
                context.Variables.Add(bufVar);
                var toUInt32Method = typeof(UIntPtr).GetMethod("ToUInt32");
                var multiplyExpr = Expression.Multiply(
                    Expression.Call(refBuffSize, toUInt32Method),
                    Expression.Constant((uint)2)
                );
                var newArrayExpr = Expression.NewArrayBounds(typeof(byte), multiplyExpr);
                context.BlockExpressions.Add(Expression.Assign(bufVar, newArrayExpr));


                // NativeAPI.pesapi_get_value_string_utf16(apis, env, str, buf, ref bufsize);
                context.BlockExpressions.Add(callPApi(context.Apis, "get_value_string_utf16", context.Env, value, bufVar, refBuffSize));

                // return System.Text.Encoding.Unicode.GetString(buf)
                var encodingUnicode = Expression.Property(null, typeof(System.Text.Encoding).GetProperty("Unicode"));
                var getStringMethod = typeof(System.Text.Encoding).GetMethod("GetString", new[] { typeof(byte[]) });
                var getStringExpr = Expression.Call(
                    encodingUnicode,
                    getStringMethod,
                    bufVar
                );
                return getStringExpr;
                */
                // 以上是直接通过Express Tree生成，对比如下封装好的逻辑
                var scriptToNativeMethod = typeof(Helpper).GetMethod(nameof(Helpper.ScriptToNative_String), BindingFlags.DeclaredOnly | BindingFlags.Public | BindingFlags.Static);
                ret = Expression.Call(scriptToNativeMethod, context.Apis, context.Env, value);
            }
            else if (typeof(ArrayBuffer) == tranType)
            {
                var scriptToNativeMethod = typeof(Helpper).GetMethod(nameof(Helpper.ScriptToNative_ArrayBuffer), BindingFlags.DeclaredOnly | BindingFlags.Public | BindingFlags.Static);
                ret = Expression.Call(scriptToNativeMethod, context.Apis, context.Env, value);
            }
            else if (typeof(object) == tranType)
            {
                var scriptToNativeMethod = typeof(Helpper).GetMethod(nameof(Helpper.ScriptToNative_Object));
                ret = Expression.Call(scriptToNativeMethod, context.Apis, context.Env, value);
            }
            else if (typeof(JSObject) == tranType)
            {
                var scriptToNativeMethod = typeof(Helpper).GetMethod(nameof(Helpper.ScriptToNative_ScriptObject));
                ret = Expression.Call(scriptToNativeMethod, context.Apis, context.Env, value);
            }
            else if (typeof(Delegate).IsAssignableFrom(tranType))
            {
                var envRef = Expression.Variable(typeof(IntPtr));
                context.Variables.Add(envRef);
                context.BlockExpressions.Add(Expression.Assign(envRef, callPApi(context.Apis, "create_env_ref", context.Env)));

                var funcRef = Expression.Variable(typeof(IntPtr));
                context.Variables.Add(funcRef);
                context.BlockExpressions.Add(Expression.Assign(funcRef, callPApi(context.Apis, "create_value_ref", context.Env, value, Expression.Constant((uint)0))));

                ret = delegateBridage(tranType, context.Apis, envRef, funcRef);
            }
            else if (!tranType.IsValueType)
            {
                var scriptToNativeMethod = typeof(Helpper).GetMethod(nameof(Helpper.ScriptToNative_T)).MakeGenericMethod(tranType);
                ret = Expression.Call(scriptToNativeMethod, context.Apis, context.Env, value);
            }
            else if (tranType.IsValueType && !tranType.IsPrimitive) // the same as byref
            {
                var scriptToNativeMethod = typeof(Helpper).GetMethod(nameof(Helpper.ScriptToNative_T)).MakeGenericMethod(tranType);
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
                return directCheckArgumentConditions(context.Apis, context.Env, value, "is_null", "is_string");
            }
            else if (type == typeof(object))
            {
                return Expression.Constant(true); // accpet any type
            }
            else if (type == typeof(JSObject))
            {
                return directCheckArgumentConditions(context.Apis, context.Env, value, "is_null", "is_object");
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
                return directCheckArgumentConditions(context.Apis, context.Env, value, "is_null", "is_binary");
            }
            else if (typeof(Delegate).IsAssignableFrom(type))
            {
                return directCheckArgumentConditions(context.Apis, context.Env, value, "is_null", "is_function");
            }
            else if (!type.IsValueType)
            {
                var isAssignableMethod = typeof(Helpper).GetMethod(nameof(Helpper.IsAssignable_ByRef)).MakeGenericMethod(type);
                return Expression.Call(isAssignableMethod, context.Apis, context.Env, value);
            }
            else if (type.IsValueType && !type.IsPrimitive)
            {
                var isAssignableMethod = typeof(Helpper).GetMethod(nameof(Helpper.IsAssignable_ValueType)).MakeGenericMethod(type);
                return Expression.Call(isAssignableMethod, context.Apis, context.Env, value);
            }
            else
            {
                throw new Exception("checkArgument: " + type + " not support yet!");
            }
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

        private static Expression buildArgumentsCheck(CompileContext context, MethodBase methodBase, ParameterExpression jsArgc, Func<int, Expression> getJsArg)
        {
            List<Expression> expressions = new List<Expression>();
            expressions.Add(Expression.Equal(jsArgc, Expression.Constant(methodBase.GetParameters().Length)));
            if (methodBase.GetParameters().Length > 0)
            {
                expressions.AddRange(methodBase.GetParameters()
                        .Select((ParameterInfo pi, int index) => checkArgument(context, pi.ParameterType, getJsArg(index))));
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

        private static T BuildMethodBaseWrap<T>(MethodBase[] methodBases, bool forceCheckArgs, Func<CompileContext, MethodBase, ParameterExpression, ParameterExpression, Func<int, Expression>, Expression> buildBody)
        {
            bool checkArgs = forceCheckArgs || methodBases.Length > 1;
            var methodBase0 = methodBases[0];
            Type returnType = typeof(T).GetMethod("Invoke").ReturnType;
            var isVoid = returnType == typeof(void);

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

            ParameterExpression self = null;

            if (!methodBase0.IsStatic && !methodBase0.IsConstructor)
            {
                // Class1 self = Helpper.Get<Class1>(apis, env, info);
                var getSelfMethod = typeof(Helpper).GetMethod(nameof(Helpper.GetSelf)).MakeGenericMethod(methodBase0.DeclaringType);
                self = Expression.Variable(methodBase0.DeclaringType, "self");
                variables.Add(self);
                var callGetSelf = Expression.Call(getSelfMethod, apis, env, info);
                blockExpressions.Add(Expression.Assign(self, callGetSelf));
            }

            if (checkArgs)
            {
                var tests = methodBases.Select(mb => buildArgumentsCheck(context, mb, jsArgc, getJsArg)).ToArray();

                var ifTrues = methodBases.Select(mb => buildBody(context, mb, info, self, getJsArg)).ToArray();

                var throwToJs = callPApi(apis, "throw_by_string", info, Expression.Constant($"invalid arguments to {methodBase0.Name} of {methodBase0.DeclaringType.Name}"));
                var ifFalse = isVoid ? throwToJs : Expression.Block(throwToJs, Expression.Default(returnType));

                blockExpressions.Add(isVoid ? buildVoidIfElseIfChain(tests, ifTrues, ifFalse) : buildConditionalChain(tests, ifTrues, ifFalse));
            }
            else // methodBases.Length == 1;
            {
                blockExpressions.Add(buildArgumentsCheck(context, methodBase0, jsArgc, getJsArg));
            }

            var block = Expression.Block(variables, blockExpressions);

            var exVar = Expression.Variable(typeof(Exception), "ex");

            var formatMethod = typeof(string).GetMethod("Format", new[] { typeof(string), typeof(object[]) });

            var formatExpr = Expression.Call(
                formatMethod,
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

            return Expression.Lambda<T>(tryCatchExpr, apis, info).Compile();
        }

        public static pesapi_callback BuildMethodWrap(MethodInfo[] methodInfos, bool forceCheckArgs)
        {
            return BuildMethodBaseWrap<pesapi_callback>(methodInfos, forceCheckArgs, (context, methodBase, info, self, getJsArg) =>
            {
                var methodInfo = methodBase as MethodInfo;
                var callMethod = Expression.Call(self, methodInfo, methodInfo.GetParameters().Select((ParameterInfo pi, int index) => scriptToNative(context, pi.ParameterType, getJsArg(index))));
                var addReturn = returnToScript(context, methodInfo.ReturnType, info, callMethod);

                return (addReturn != null) ? addReturn : callMethod;
            });

        }

        public static pesapi_callback BuildMethodWrap(MethodInfo methodInfo, bool forceCheckArgs)
        {
            return BuildMethodWrap(new MethodInfo[] { methodInfo }, forceCheckArgs);
        }

        public static pesapi_constructor BuildConstructorWrap(ConstructorInfo[] constructorInfos, bool forceCheckArgs)
        {
            return BuildMethodBaseWrap<pesapi_constructor>(constructorInfos, forceCheckArgs, (context, methodBase, info, self, getJsArg) =>
            {
                var constructorInfo = methodBase as ConstructorInfo;
                var callNew = Expression.New(constructorInfo, constructorInfo.GetParameters().Select((ParameterInfo pi, int index) => scriptToNative(context, pi.ParameterType, getJsArg(index))));

                var isValueType = constructorInfo.DeclaringType.IsValueType;
                var addToObjectPoolMethod = isValueType ? typeof(Helpper).GetMethod(nameof(Helpper.AddValueType)).MakeGenericMethod(constructorInfo.DeclaringType) : typeof(Helpper).GetMethod(nameof(Helpper.FindOrAddObject));
                var addToObjectPool = Expression.Call(addToObjectPoolMethod, context.Apis, context.Env, callNew);

                return addToObjectPool;
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
                var getSelfMethod = typeof(Helpper).GetMethod(nameof(Helpper.GetSelf)).MakeGenericMethod(fieldInfo.DeclaringType);
                self = Expression.Variable(fieldInfo.DeclaringType, "self");
                variables.Add(self);
                var callGetSelf = Expression.Call(getSelfMethod, apis, env, info);
                blockExpressions.Add(Expression.Assign(self, callGetSelf));
            }

            var field = Expression.Field(self, fieldInfo);
            var addReturn = returnToScript(context, fieldInfo.FieldType, info, field);
            blockExpressions.Add(addReturn);
            return (Expression.Lambda<pesapi_callback>(Expression.Block(
                variables, blockExpressions
                ), apis, info)).Compile();
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
                var getSelfMethod = typeof(Helpper).GetMethod(nameof(Helpper.GetSelf)).MakeGenericMethod(fieldInfo.DeclaringType);
                self = Expression.Variable(fieldInfo.DeclaringType, "self");
                variables.Add(self);
                var callGetSelf = Expression.Call(getSelfMethod, apis, env, info);
                blockExpressions.Add(Expression.Assign(self, callGetSelf));
            }

            var field = Expression.Field(self, fieldInfo);
            var jsValue = getArgument(context, info, 0);
            blockExpressions.Add(Expression.Assign(field, scriptToNative(context, fieldInfo.FieldType, jsValue)));
            return (Expression.Lambda<pesapi_callback>(Expression.Block(
                variables, blockExpressions
                ), apis, info)).Compile();
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
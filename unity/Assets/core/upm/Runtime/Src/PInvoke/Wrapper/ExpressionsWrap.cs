using System;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Collections.Generic;
using System.Runtime.InteropServices;

namespace Puerts
{
    public static class UnmanagedType
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
            if (type == typeof(int))
            {
                //apis.create_int32(env, value)
                return callPApi(context.Apis, "create_int32", context.Env, value);
            }
            else
            {
                throw new Exception("nativeToScript: " + type + " not support yet!");
            }
        }

        private static Expression scriptToNative(CompileContext context, Type type, Expression value)
        {
            if (type == typeof(int))
            {
                //return apis.get_value_int32(env, val);
                return callPApi(context.Apis, "get_value_int32", context.Env, value);
            }
            else if (type == typeof(string))
            {
                // UIntPtr bufsize = UIntPtr.Zero;
                var refBuffSize = Expression.Variable(typeof(UIntPtr));
                context.Variables.Add(refBuffSize);
                context.BlockExpressions.Add(Expression.Assign(refBuffSize, Expression.Field(null, typeof(UIntPtr), "Zero")));

                // NativeAPI.pesapi_get_value_string_utf16(apis, env, str, null, ref bufsize);
                context.BlockExpressions.Add(callPApi(context.Apis, "get_value_string_utf16", context.Env, value, Expression.Constant(null, typeof(byte[])), refBuffSize)); // 不添加到BlockExpressions会被优化掉

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
                throw new Exception("scriptToNative: " + type + " not support yet!");
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

        /*private static Expression checkArgument(CompileContext context, Type type, Expression value)
        {

        }*/

        private static Expression getArgument(CompileContext context, ParameterInfo parameterInfo, ParameterExpression info, int index)
        {
            //var temp = apis.get_arg(info, 0);
            var getArg = callPApi(context.Apis, "get_arg", info, Expression.Constant(index));
            return scriptToNative(context, parameterInfo.ParameterType, getArg);
        }

        public static pesapi_callback MethodWrap(MethodInfo methodInfo, bool check)
        {
            if (!methodInfo.IsStatic)
            {
                throw new Exception("instance method not support yet!");
            }
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

            Expression self = null; // TODO: this for instance method
            var callMethod = Expression.Call(self, methodInfo, methodInfo.GetParameters().Select((ParameterInfo pi, int index) => getArgument(context, pi, info, index)));
            var addReturn = returnToScript(context, methodInfo.ReturnType, info, callMethod);

            if (addReturn != null)
            {
                blockExpressions.Add(addReturn);
            }
            else
            {
                blockExpressions.Add(callMethod);
            }

            var block = Expression.Block(variables, blockExpressions);
            //var block = Expression.Block();

            return (Expression.Lambda<pesapi_callback>(block, apis, info)).Compile();
        }
    }
}
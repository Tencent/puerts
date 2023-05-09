using System;
using System.Runtime.InteropServices;
using System.Collections.Generic;

namespace Puerts
{
    namespace WebGL
    {
        public class MainEnv
        {
            private static JsEnv jsEnvInstance;

            public static JsEnv Get()
            {
                if (jsEnvInstance != null) 
                {
                    return jsEnvInstance;
                }
                return Get(new Puerts.DefaultLoader());
            }
            
            public static JsEnv Get(Puerts.ILoader loader, int debugPort = -1)
            {
                if (jsEnvInstance != null) 
                {
                    return jsEnvInstance;
                }

#if !UNITY_EDITOR && UNITY_WEBGL
                InitPuertsWebGL();

                try 
                {
                    SetCallV8(
                        CallV8FunctionCallback, 
                        CallV8ConstructorCallback, 
                        CallV8DestructorCallback
                    );    
                }
                catch(Exception e)
                {
                    InitPuertsWebGLRollback();
                    throw e;
                }
#endif
                jsEnvInstance = new JsEnv(loader, debugPort);
                return jsEnvInstance;
            }

#if !UNITY_EDITOR && UNITY_WEBGL
            [DllImport("__Internal", CallingConvention = CallingConvention.Cdecl)]
            private static extern IntPtr InitPuertsWebGL();

            [DllImport("__Internal", CallingConvention = CallingConvention.Cdecl)]
            private static extern IntPtr InitPuertsWebGLRollback();

            [DllImport("__Internal", CallingConvention = CallingConvention.Cdecl)]
            internal static extern void SetCallV8(
                CallV8Function callV8Function, 
                CallV8Constructor callV8Constructor,
                CallV8Destructor callV8Destructor
            );
#endif

            internal delegate void CallV8Function(int functionCallback, int info, int self, int paramLen, int data);
            internal delegate int CallV8Constructor(int constructorCallback, int info, int paramLen, int data);
            internal delegate void CallV8Destructor(int destructorCallback, int self, int data);
            
            internal static Dictionary<IntPtr, V8FunctionCallback> FunctionCallbackCache = new Dictionary<IntPtr, V8FunctionCallback>();
            internal static Dictionary<IntPtr, V8ConstructorCallback> ConstructorCallbackCache = new Dictionary<IntPtr, V8ConstructorCallback>();
            internal static Dictionary<IntPtr, V8DestructorCallback> DestructorCallbackCache = new Dictionary<IntPtr, V8DestructorCallback>();

            [MonoPInvokeCallback(typeof(CallV8Function))]
            internal static void CallV8FunctionCallback(int functionCallback, int info, int self, int paramLen, int callbackIdx)
            {
                V8FunctionCallback callback = null;
                var ptr = new IntPtr(functionCallback);
                if (!FunctionCallbackCache.TryGetValue(ptr, out callback))
                {
                    // 这个函数非常慢，用Dict做一层缓存目测会好很多
                    // 在PuerTS场景下，FunctionPtr总量应该不超过C#函数的总量，Dict size理论上可控.
                    callback = Marshal.GetDelegateForFunctionPointer<V8FunctionCallback>(ptr);
                    FunctionCallbackCache.Add(ptr, callback);
                }
                
                callback.Invoke(IntPtr.Zero, new IntPtr(info), new IntPtr(self), paramLen, Utils.TwoIntToLong(0, callbackIdx));
            }

            [MonoPInvokeCallback(typeof(CallV8Constructor))]
            internal static int CallV8ConstructorCallback(int constructorCallback, int info, int paramLen, int callbackIdx)
            {
                V8ConstructorCallback callback = null;
                var ptr = new IntPtr(constructorCallback);
                if (!ConstructorCallbackCache.TryGetValue(ptr, out callback))
                {
                    // 这个函数非常慢，用Dict做一层缓存目测会好很多
                    // 在PuerTS场景下，CtorPtr总量应该不超过C#类的总量，Dict size理论上可控.
                    callback = Marshal.GetDelegateForFunctionPointer<V8ConstructorCallback>(ptr);
                    ConstructorCallbackCache.Add(ptr, callback);
                }
                return callback.Invoke(IntPtr.Zero, new IntPtr(info), paramLen, Utils.TwoIntToLong(0, callbackIdx)).ToInt32();
            }

            [MonoPInvokeCallback(typeof(CallV8Destructor))]
            internal static void CallV8DestructorCallback(int destructorCallback, int self, int callbackIdx)
            {
                V8DestructorCallback callback = null;
                var ptr = new IntPtr(destructorCallback);
                if (!DestructorCallbackCache.TryGetValue(ptr, out callback))
                {
                    // 这个函数非常慢，用Dict做一层缓存目测会好很多
                    // 在PuerTS场景下，DtorPtr总量应该不超过C#类的总量，Dict size理论上可控.
                    callback = Marshal.GetDelegateForFunctionPointer<V8DestructorCallback>(ptr);
                    DestructorCallbackCache.Add(ptr, callback);
                }
                callback.Invoke(new IntPtr(self), Utils.TwoIntToLong(0, callbackIdx));
            }
        }
    }
}
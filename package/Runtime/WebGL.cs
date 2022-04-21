#if UNITY_WEBGL
using System;
using System.Runtime.InteropServices;

namespace Puerts
{
    public static class WebGL
    {
        private static JsEnv jsEnvSingleton;
        public static JsEnv GetBrowserEnv()
        {
            return GetBrowserEnv(new DefaultLoader());
        }
        
        public static JsEnv GetBrowserEnv(ILoader loader, int debugPort = -1)
        {
            if (jsEnvSingleton != null) 
            {
                return jsEnvSingleton;
            }

        #if !UNITY_EDITOR
            InitPuertsWebGL();
        #endif

            try 
            {
            #if !UNITY_EDITOR
                SetCallV8(
                    CallV8FunctionCallback, 
                    CallV8ConstructorCallback, 
                    CallV8DestructorCallback,
                    CallGetJSArgumentsCallback
                );    
            #endif
                jsEnvSingleton = new JsEnv(loader, debugPort);
                jsEnvSingleton.ExecuteModule("puerts/webgl.mjs");
                return jsEnvSingleton;
            }
            catch(Exception e)
            {
            #if !UNITY_EDITOR
                InitPuertsWebGLRollback();
            #endif
                throw e;
            }
        }

        #if !UNITY_EDITOR
        [DllImport("__Internal", CallingConvention = CallingConvention.Cdecl)]
        private static extern IntPtr InitPuertsWebGL();

        [DllImport("__Internal", CallingConvention = CallingConvention.Cdecl)]
        private static extern IntPtr InitPuertsWebGLRollback();

        [DllImport("__Internal", CallingConvention = CallingConvention.Cdecl)]
        internal static extern void SetCallV8(
            CallV8Function callV8Function, 
            CallV8Constructor callV8Constructor,
            CallV8Destructor callV8Destructor,
            CallJSArgumentsGetter callJSArgumentsGetter
        );
        #endif

        internal delegate void CallV8Function(int functionCallback, int info, int self, int paramLen, int data);
        internal delegate int CallV8Constructor(int constructorCallback, int info, int paramLen, int data);
        internal delegate void CallV8Destructor(int destructorCallback, int self, int data);
        internal delegate void CallJSArgumentsGetter(int getJSArgumentsCallback, int jsEnvIdx, IntPtr JSFunction);
        
        [MonoPInvokeCallback(typeof(CallV8Function))]
        internal static void CallV8FunctionCallback(int functionCallback, int info, int self, int paramLen, int data)
        {
            V8FunctionCallback callback =
                Marshal.GetDelegateForFunctionPointer<V8FunctionCallback>(new IntPtr(functionCallback));
            callback.Invoke(IntPtr.Zero, new IntPtr(info), new IntPtr(self), paramLen, data);
        }

        [MonoPInvokeCallback(typeof(CallV8Constructor))]
        internal static int CallV8ConstructorCallback(int constructorCallback, int info, int paramLen, int data)
        {
            V8ConstructorCallback callback =
                Marshal.GetDelegateForFunctionPointer<V8ConstructorCallback>(new IntPtr(constructorCallback));
            return callback.Invoke(IntPtr.Zero, new IntPtr(info), paramLen, data).ToInt32();
        }

        [MonoPInvokeCallback(typeof(CallV8Destructor))]
        internal static void CallV8DestructorCallback(int destructorCallback, int self, int data)
        {
            V8DestructorCallback callback =
                Marshal.GetDelegateForFunctionPointer<V8DestructorCallback>(new IntPtr(destructorCallback));
            callback.Invoke(new IntPtr(self), data);
        }

        [MonoPInvokeCallback(typeof(CallV8Destructor))]
        internal static void CallGetJSArgumentsCallback(int getJSArgumentsCallback, int jsEnvIdx, IntPtr JSFunction)
        {
            PushJSFunctionArgumentsCallback callback =
                Marshal.GetDelegateForFunctionPointer<PushJSFunctionArgumentsCallback>(new IntPtr(getJSArgumentsCallback));
            callback.Invoke(IntPtr.Zero, jsEnvIdx, JSFunction);
        }
    }
}
#endif
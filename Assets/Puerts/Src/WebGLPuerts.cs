#if UNITY_WEBGL
using System;
using System.Runtime.InteropServices;

namespace Puerts
{
    public static class WebGLPuerts
    {
        public delegate void CallV8Function(int functionCallback, int info, int self, int paramLen, int data);
        public delegate int CallV8Constructor(int constructorCallback, int info, int paramLen, int data);
        public delegate void CallV8Destructor(int destructorCallback, int self, int data);

        public static void Init()
        {
            SetCallV8(CallV8FunctionCallback, CallV8ConstructorCallback, CallV8DestructorCallback);    
        }
        
        [MonoPInvokeCallback(typeof(CallV8Function))]
        public static void CallV8FunctionCallback(int functionCallback, int info, int self, int paramLen, int data)
        {
            V8FunctionCallback callback =
                Marshal.GetDelegateForFunctionPointer<V8FunctionCallback>(new IntPtr(functionCallback));
            callback.Invoke(IntPtr.Zero, new IntPtr(info), new IntPtr(self), paramLen, data);
        }

        [MonoPInvokeCallback(typeof(CallV8Constructor))]
        public static int CallV8ConstructorCallback(int constructorCallback, int info, int paramLen, int data)
        {
            V8ConstructorCallback callback =
                Marshal.GetDelegateForFunctionPointer<V8ConstructorCallback>(new IntPtr(constructorCallback));
            return callback.Invoke(IntPtr.Zero, new IntPtr(info), paramLen, data).ToInt32();
        }

        [MonoPInvokeCallback(typeof(CallV8Destructor))]
        public static void CallV8DestructorCallback(int destructorCallback, int self, int data)
        {
            V8DestructorCallback callback =
                Marshal.GetDelegateForFunctionPointer<V8DestructorCallback>(new IntPtr(destructorCallback));
            callback.Invoke(new IntPtr(self), data);
        }

        [DllImport("__Internal", CallingConvention = CallingConvention.Cdecl)]
        public static extern void SetCallV8(CallV8Function callV8Function, CallV8Constructor callV8Constructor,
            CallV8Destructor callV8Destructor);
    }
}
#endif
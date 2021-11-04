#if UNITY_WEBGL && !UNITY_EDITOR
using System;
using System.Runtime.InteropServices;
using Puerts;
using UnityEngine;

public class WebGLPuertsMonoBehaviour : MonoBehaviour {
    protected IntPtr info;
    public void SetInfoPtr(int info)
    {
        this.info = new IntPtr(info);
    }

    protected IntPtr self;
    public void SetSelfPtr(int self)
    {
        this.self = new IntPtr(self);
    }

    protected int paramLen;
    public void SetParamLen(int paramLen)
    {
        this.paramLen = paramLen;
    }

    protected long data;
    public void SetData(int data)
    {
        this.data = data;
    }

    public void CallV8FunctionCallback(int functionCallback) {
        V8FunctionCallback callback = Marshal.GetDelegateForFunctionPointer<V8FunctionCallback>(new IntPtr(functionCallback));
        callback.Invoke(IntPtr.Zero, info, self, paramLen, data);
        Reset();
    }
    public void CallV8ConstructorCallback(int constructorCallback) {
        V8ConstructorCallback callback = Marshal.GetDelegateForFunctionPointer<V8ConstructorCallback>(new IntPtr(constructorCallback));
        IntPtr csObjectID = callback.Invoke(IntPtr.Zero, info, paramLen, data);
        SetLastResult(csObjectID);
        Reset();
    }
    public void CallV8DestructorCallback(int destructorCallback) {
        V8DestructorCallback callback = Marshal.GetDelegateForFunctionPointer<V8DestructorCallback>(new IntPtr(destructorCallback));
        callback.Invoke(self, data);
        Reset();
    }

    protected void Reset()
    {
        info = IntPtr.Zero;
        self = IntPtr.Zero;
        paramLen = 0;
        data = 0;
    }

    
    [DllImport("__Internal", CallingConvention = CallingConvention.Cdecl)]
    public static extern int SetLastResult(IntPtr result);
}
#endif
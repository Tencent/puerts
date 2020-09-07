/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace Puerts
{
    internal class DelegateCreatorTree
    {
        private class Node
        {
            public Func<Type, IntPtr, Delegate> Creator;
            public Dictionary<Type, Node> Branchs = new Dictionary<Type, Node>();
        }

        private readonly Node root = new Node();

        private Node FindNode(Type[] types, bool createIfNotExisted)
        {
            Node cur = root;
            Node next;

            for (int i = 0; i < types.Length; i++)
            {
                if (!cur.Branchs.TryGetValue(types[i], out next))
                {
                    if (createIfNotExisted)
                    {
                        next = new Node();
                        cur.Branchs.Add(types[i], next);
                    }
                    else
                    {
                        return null;
                    }
                }
                cur = next;
            }
            return cur;
        }

        public void Add(Func<Type, IntPtr, Delegate> creator, params Type[] types)
        {
            Node node = FindNode(types, true);
            node.Creator = creator;
        }

        public Func<Type, IntPtr, Delegate> Find(Type[] types)
        {
            Node node = FindNode(types, false);
            return node == null ? null : node.Creator;
        }
    }

    internal class GenericDelegateFactory
    {
        readonly JsEnv jsEnv;

        //无返回值泛型方法
        MethodInfo[] genericAction = null;
        //有返回值泛型方法
        MethodInfo[] genericFunc = null;

        //泛型delegate适配器构造器的缓存
        Dictionary<Type, Func<Type, IntPtr, Delegate>> genericDelegateCreatorCache
            = new Dictionary<Type, Func<Type, IntPtr, Delegate>>();

        internal GenericDelegateFactory(JsEnv jsEnv)
        {
            this.jsEnv = jsEnv;
        }

        //Prevent unity il2cpp code stripping
        static void PreventStripping(object obj)
        {
            if (obj != null)
            {
                var gd = new GenericDelegate(IntPtr.Zero, null);
                gd.Action();
                gd.Action(obj);
                gd.Action(obj, obj);
                gd.Action(obj, obj, obj);
                gd.Action(obj, obj, obj, obj);

                gd.Func<object>();
                gd.Func<object, object>(obj);
                gd.Func<object, object, object>(obj, obj);
                gd.Func<object, object, object, object>(obj, obj, obj);
                gd.Func<object, object, object, object, object>(obj, obj, obj, obj);
            }
        }

        static GenericDelegateFactory()
        {
            PrimitiveTypeTranslate.Init();
        }

        internal Delegate Create(Type delegateType, IntPtr nativeJsFuncPtr)
        {
            Func<Type, IntPtr, Delegate> genericDelegateCreator;
            if (!genericDelegateCreatorCache.TryGetValue(delegateType, out genericDelegateCreator))
            {
                //如果泛型方法数组未初始化
                if (genericAction == null)
                {
                    PreventStripping(null);
                    var methods = typeof(GenericDelegate).GetMethods(BindingFlags.Instance | BindingFlags.Public
                        | BindingFlags.DeclaredOnly);
                    genericAction = methods.Where(m => m.Name == "Action").OrderBy(m => m.GetParameters().Length)
                        .ToArray();
                    genericFunc = methods.Where(m => m.Name == "Func").OrderBy(m => m.GetParameters().Length).ToArray();
                }

                MethodInfo delegateMethod = delegateType.GetMethod("Invoke");
                var parameters = delegateMethod.GetParameters();
                var typeArgs = parameters.Select(pinfo => pinfo.ParameterType).ToArray();

                if (delegateMethod.ReturnType == typeof(void))
                {
                    if (parameters.Length == 0)
                    {
                        //对无参无返回值特殊处理
                        var methodInfo = genericAction[0];
                        genericDelegateCreator = (dt, ptr) => Delegate.CreateDelegate(dt, new GenericDelegate(ptr, jsEnv), methodInfo);
                    }
                    else
                    {
                        genericDelegateCreator = ActionCreatorTree.Find(typeArgs);
                    }
                }
                else
                {
                    //如果是有返回值，需要加上返回值作为泛型实参
                    typeArgs = typeArgs.Concat(new Type[] { delegateMethod.ReturnType }).ToArray();
                    genericDelegateCreator = FuncCreatorTree.Find(typeArgs);
                }

                if (genericDelegateCreator == null)
                {
                    if ((delegateMethod.ReturnType.IsValueType && delegateMethod.ReturnType != typeof(void))
                        || parameters.Length > 4
                        || typeArgs.Any(paramType => paramType.IsValueType || paramType.IsByRef)
                        )
                    {
                        //如果不在支持的范围，则生成一个永远返回空的构造器
                        genericDelegateCreator = (dt, x) => null;
                    }
                    else
                    {
                        //根据参数个数，返回值找到泛型实现
                        MethodInfo genericMethodInfo = null;
                        if (delegateMethod.ReturnType == typeof(void))
                        {
                            genericMethodInfo = genericAction[parameters.Length];
                        }
                        else
                        {
                            genericMethodInfo = genericFunc[parameters.Length];
                        }
                        //实例化泛型方法
                        var methodInfo = genericMethodInfo.MakeGenericMethod(typeArgs);
                        //构造器
                        genericDelegateCreator = (dt, ptr) => Delegate.CreateDelegate(dt, new GenericDelegate(ptr, jsEnv), methodInfo);
                    }
                }
                //缓存构造器，下次调用直接返回
                genericDelegateCreatorCache[delegateType] = genericDelegateCreator;
            }
            //创建delegate
            return genericDelegateCreator(delegateType, nativeJsFuncPtr);
        }

        DelegateCreatorTree ActionCreatorTree = new DelegateCreatorTree();

        DelegateCreatorTree FuncCreatorTree = new DelegateCreatorTree();

        public void RegisterAction<T1>()
        {
            ActionCreatorTree.Add((type, ptr) =>
            {
                GenericDelegate genericDelegate = new GenericDelegate(ptr, jsEnv);
                return Delegate.CreateDelegate(type, genericDelegate, new Action<T1>(genericDelegate.Action<T1>).Method);
            }, typeof(T1));
        }

        public void RegisterAction<T1, T2>()
        {
            ActionCreatorTree.Add((type, ptr) =>
            {
                GenericDelegate genericDelegate = new GenericDelegate(ptr, jsEnv);
                return Delegate.CreateDelegate(type, genericDelegate, new Action<T1, T2>(genericDelegate.Action<T1, T2>).Method);
            }, typeof(T1), typeof(T2));
        }

        public void RegisterAction<T1, T2, T3>()
        {
            ActionCreatorTree.Add((type, ptr) =>
            {
                GenericDelegate genericDelegate = new GenericDelegate(ptr, jsEnv);
                return Delegate.CreateDelegate(type, genericDelegate, new Action<T1, T2, T3>(genericDelegate.Action<T1, T2, T3>).Method);
            }, typeof(T1), typeof(T2), typeof(T3));
        }

        public void RegisterAction<T1, T2, T3, T4>()
        {
            ActionCreatorTree.Add((type, ptr) =>
            {
                GenericDelegate genericDelegate = new GenericDelegate(ptr, jsEnv);
                return Delegate.CreateDelegate(type, genericDelegate, new Action<T1, T2, T3, T4>(genericDelegate.Action<T1, T2, T3, T4>).Method);
            }, typeof(T1), typeof(T2), typeof(T3), typeof(T4));
        }

        public void RegisterFunc<TResult>()
        {
            FuncCreatorTree.Add((type, ptr) =>
            {
                GenericDelegate genericDelegate = new GenericDelegate(ptr, jsEnv);
                return Delegate.CreateDelegate(type, genericDelegate, new Func<TResult>(genericDelegate.Func<TResult>).Method);
            }, typeof(TResult));
        }

        public void RegisterFunc<T1, TResult>()
        {
            FuncCreatorTree.Add((type, ptr) =>
            {
                GenericDelegate genericDelegate = new GenericDelegate(ptr, jsEnv);
                return Delegate.CreateDelegate(type, genericDelegate, new Func<T1, TResult>(genericDelegate.Func<T1, TResult>).Method);
            }, typeof(T1), typeof(TResult));
        }

        public void RegisterFunc<T1, T2, TResult>()
        {
            FuncCreatorTree.Add((type, ptr) =>
            {
                GenericDelegate genericDelegate = new GenericDelegate(ptr, jsEnv);
                return Delegate.CreateDelegate(type, genericDelegate, new Func<T1, T2, TResult>(genericDelegate.Func<T1, T2, TResult>).Method);
            }, typeof(T1), typeof(T2), typeof(TResult));
        }

        public void RegisterFunc<T1, T2, T3, TResult>()
        {
            FuncCreatorTree.Add((type, ptr) =>
            {
                GenericDelegate genericDelegate = new GenericDelegate(ptr, jsEnv);
                return Delegate.CreateDelegate(type, genericDelegate, new Func<T1, T2, T3, TResult>(genericDelegate.Func<T1, T2, T3, TResult>).Method);
            }, typeof(T1), typeof(T2), typeof(T3), typeof(TResult));
        }

        public void RegisterFunc<T1, T2, T3, T4, TResult>()
        {
            FuncCreatorTree.Add((type, ptr) =>
            {
                GenericDelegate genericDelegate = new GenericDelegate(ptr, jsEnv);
                return Delegate.CreateDelegate(type, genericDelegate, new Func<T1, T2, T3, T4, TResult>(genericDelegate.Func<T1, T2, T3, T4, TResult>).Method);
            }, typeof(T1), typeof(T2), typeof(T3), typeof(T4), typeof(TResult));
        }
    }

    //泛型适配器
    internal class GenericDelegate
    {
        private readonly JsEnv jsEnv;
        private IntPtr nativeJsFuncPtr;
        private IntPtr isolate;

        internal GenericDelegate(IntPtr nativeJsFuncPtr, JsEnv jsEnv)
        {
            this.nativeJsFuncPtr = nativeJsFuncPtr;
            isolate = jsEnv != null ? jsEnv.isolate : IntPtr.Zero;
            this.jsEnv = jsEnv;
        }

        //TODO: 虚拟机析构时应调用该函数
        internal void Close()
        {
            nativeJsFuncPtr = IntPtr.Zero;
        }

        ~GenericDelegate() 
        {
            if (jsEnv.isolate != IntPtr.Zero)
            {
                PuertsDLL.ReleaseJSFunction(jsEnv.isolate, nativeJsFuncPtr);
            }
        }

        public void Action()
        {
            jsEnv.CheckLiveness();
            IntPtr resultInfo = PuertsDLL.InvokeJSFunction(nativeJsFuncPtr, false);
            if (resultInfo == IntPtr.Zero)
            {
                string exceptionInfo = PuertsDLL.GetFunctionLastExceptionInfo(nativeJsFuncPtr);
                throw new Exception(exceptionInfo);
            }
        }

        public void Action<T1>(T1 p1)
        {
            jsEnv.CheckLiveness();
            StaticTranslate<T1>.Set(jsEnv.Idx, isolate, NativeValueApi.SetValueToArgument, nativeJsFuncPtr, p1);
            IntPtr resultInfo = PuertsDLL.InvokeJSFunction(nativeJsFuncPtr, false);
            if (resultInfo == IntPtr.Zero)
            {
                string exceptionInfo = PuertsDLL.GetFunctionLastExceptionInfo(nativeJsFuncPtr);
                throw new Exception(exceptionInfo);
            }
        }

        public void Action<T1, T2>(T1 p1, T2 p2) 
        {
            jsEnv.CheckLiveness();
            StaticTranslate<T1>.Set(jsEnv.Idx, isolate, NativeValueApi.SetValueToArgument, nativeJsFuncPtr, p1);
            StaticTranslate<T2>.Set(jsEnv.Idx, isolate, NativeValueApi.SetValueToArgument, nativeJsFuncPtr, p2);
            IntPtr resultInfo = PuertsDLL.InvokeJSFunction(nativeJsFuncPtr, false);
            if (resultInfo == IntPtr.Zero)
            {
                string exceptionInfo = PuertsDLL.GetFunctionLastExceptionInfo(nativeJsFuncPtr);
                throw new Exception(exceptionInfo);
            }
        }

        public void Action<T1, T2, T3>(T1 p1, T2 p2, T3 p3)
        {
            jsEnv.CheckLiveness();
            StaticTranslate<T1>.Set(jsEnv.Idx, isolate, NativeValueApi.SetValueToArgument, nativeJsFuncPtr, p1);
            StaticTranslate<T2>.Set(jsEnv.Idx, isolate, NativeValueApi.SetValueToArgument, nativeJsFuncPtr, p2);
            StaticTranslate<T3>.Set(jsEnv.Idx, isolate, NativeValueApi.SetValueToArgument, nativeJsFuncPtr, p3);
            IntPtr resultInfo = PuertsDLL.InvokeJSFunction(nativeJsFuncPtr, false);
            if (resultInfo == IntPtr.Zero)
            {
                string exceptionInfo = PuertsDLL.GetFunctionLastExceptionInfo(nativeJsFuncPtr);
                throw new Exception(exceptionInfo);
            }
        }

        public void Action<T1, T2, T3, T4>(T1 p1, T2 p2, T3 p3, T4 p4)
        {
            jsEnv.CheckLiveness();
            StaticTranslate<T1>.Set(jsEnv.Idx, isolate, NativeValueApi.SetValueToArgument, nativeJsFuncPtr, p1);
            StaticTranslate<T2>.Set(jsEnv.Idx, isolate, NativeValueApi.SetValueToArgument, nativeJsFuncPtr, p2);
            StaticTranslate<T3>.Set(jsEnv.Idx, isolate, NativeValueApi.SetValueToArgument, nativeJsFuncPtr, p3);
            StaticTranslate<T4>.Set(jsEnv.Idx, isolate, NativeValueApi.SetValueToArgument, nativeJsFuncPtr, p4);
            IntPtr resultInfo = PuertsDLL.InvokeJSFunction(nativeJsFuncPtr, false);
            if (resultInfo == IntPtr.Zero)
            {
                string exceptionInfo = PuertsDLL.GetFunctionLastExceptionInfo(nativeJsFuncPtr);
                throw new Exception(exceptionInfo);
            }
        }

        public TResult Func<TResult>()
        {
            jsEnv.CheckLiveness();
            IntPtr resultInfo = PuertsDLL.InvokeJSFunction(nativeJsFuncPtr, true);
            if (resultInfo == IntPtr.Zero)
            {
                string exceptionInfo = PuertsDLL.GetFunctionLastExceptionInfo(nativeJsFuncPtr);
                throw new Exception(exceptionInfo);
            }
            TResult result = StaticTranslate<TResult>.Get(jsEnv.Idx, isolate, NativeValueApi.GetValueFromResult, resultInfo, false);
            PuertsDLL.ResetResult(resultInfo);
            return result;
        }

        public TResult Func<T1, TResult>(T1 p1)
        {
            jsEnv.CheckLiveness();
            StaticTranslate<T1>.Set(jsEnv.Idx, isolate, NativeValueApi.SetValueToArgument, nativeJsFuncPtr, p1);
            IntPtr resultInfo = PuertsDLL.InvokeJSFunction(nativeJsFuncPtr, true);
            if (resultInfo == IntPtr.Zero)
            {
                string exceptionInfo = PuertsDLL.GetFunctionLastExceptionInfo(nativeJsFuncPtr);
                throw new Exception(exceptionInfo);
            }
            TResult result = StaticTranslate<TResult>.Get(jsEnv.Idx, isolate, NativeValueApi.GetValueFromResult, resultInfo, false);
            PuertsDLL.ResetResult(resultInfo);
            return result;
        }

        public TResult Func<T1, T2, TResult>(T1 p1, T2 p2)
        {
            jsEnv.CheckLiveness();
            StaticTranslate<T1>.Set(jsEnv.Idx, isolate, NativeValueApi.SetValueToArgument, nativeJsFuncPtr, p1);
            StaticTranslate<T2>.Set(jsEnv.Idx, isolate, NativeValueApi.SetValueToArgument, nativeJsFuncPtr, p2);
            IntPtr resultInfo = PuertsDLL.InvokeJSFunction(nativeJsFuncPtr, true);
            if (resultInfo == IntPtr.Zero)
            {
                string exceptionInfo = PuertsDLL.GetFunctionLastExceptionInfo(nativeJsFuncPtr);
                throw new Exception(exceptionInfo);
            }
            TResult result = StaticTranslate<TResult>.Get(jsEnv.Idx, isolate, NativeValueApi.GetValueFromResult, resultInfo, false);
            PuertsDLL.ResetResult(resultInfo);
            return result;
        }

        public TResult Func<T1, T2, T3, TResult>(T1 p1, T2 p2, T3 p3)
        {
            jsEnv.CheckLiveness();
            StaticTranslate<T1>.Set(jsEnv.Idx, isolate, NativeValueApi.SetValueToArgument, nativeJsFuncPtr, p1);
            StaticTranslate<T2>.Set(jsEnv.Idx, isolate, NativeValueApi.SetValueToArgument, nativeJsFuncPtr, p2);
            StaticTranslate<T3>.Set(jsEnv.Idx, isolate, NativeValueApi.SetValueToArgument, nativeJsFuncPtr, p3);
            IntPtr resultInfo = PuertsDLL.InvokeJSFunction(nativeJsFuncPtr, true);
            if (resultInfo == IntPtr.Zero)
            {
                string exceptionInfo = PuertsDLL.GetFunctionLastExceptionInfo(nativeJsFuncPtr);
                throw new Exception(exceptionInfo);
            }
            TResult result = StaticTranslate<TResult>.Get(jsEnv.Idx, isolate, NativeValueApi.GetValueFromResult, resultInfo, false);
            PuertsDLL.ResetResult(resultInfo);
            return result;
        }

        public TResult Func<T1, T2, T3, T4, TResult>(T1 p1, T2 p2, T3 p3, T4 p4)
        {
            jsEnv.CheckLiveness();
            StaticTranslate<T1>.Set(jsEnv.Idx, isolate, NativeValueApi.SetValueToArgument, nativeJsFuncPtr, p1);
            StaticTranslate<T2>.Set(jsEnv.Idx, isolate, NativeValueApi.SetValueToArgument, nativeJsFuncPtr, p2);
            StaticTranslate<T3>.Set(jsEnv.Idx, isolate, NativeValueApi.SetValueToArgument, nativeJsFuncPtr, p3);
            StaticTranslate<T4>.Set(jsEnv.Idx, isolate, NativeValueApi.SetValueToArgument, nativeJsFuncPtr, p4);
            IntPtr resultInfo = PuertsDLL.InvokeJSFunction(nativeJsFuncPtr, true);
            if (resultInfo == IntPtr.Zero)
            {
                string exceptionInfo = PuertsDLL.GetFunctionLastExceptionInfo(nativeJsFuncPtr);
                throw new Exception(exceptionInfo);
            }
            TResult result = StaticTranslate<TResult>.Get(jsEnv.Idx, isolate, NativeValueApi.GetValueFromResult, resultInfo, false);
            PuertsDLL.ResetResult(resultInfo);
            return result;
        }
    }
}

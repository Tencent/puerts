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
    public class LazyMembersWrap
    {
        protected string memberName;
        protected JsEnv jsEnv;
        protected Type definitionType;

        protected BindingFlags flag = BindingFlags.DeclaredOnly | BindingFlags.Instance | BindingFlags.Static | BindingFlags.Public;

        public LazyMembersWrap(string memberName, JsEnv jsEnv, Type definitionType)
        {
            this.memberName = memberName;
            this.jsEnv = jsEnv;
            this.definitionType = definitionType;
        }
    }
    public class LazyFieldWrap : LazyMembersWrap
    {
        public LazyFieldWrap(string memberName, JsEnv jsEnv, Type definitionType) : base(memberName, jsEnv, definitionType) { }

        private JSFunctionCallback Getter;
        private JSFunctionCallback Setter;
        public void InvokeSetter(IntPtr isolate, IntPtr info, IntPtr self, int argumentsLen)
        {
            if (Getter == null)
            {
                FieldInfo field = definitionType.GetField(memberName, flag);
                Getter = GenFieldGetter(definitionType, field);

                if (!field.IsInitOnly && !field.IsLiteral)
                {
                    Setter = GenFieldSetter(definitionType, field);
                }
            }
            if (Setter != null)
            {
                Setter(isolate, info, self, argumentsLen);
            }
        }
        public void InvokeGetter(IntPtr isolate, IntPtr info, IntPtr self, int argumentsLen)
        {
            if (Getter == null)
            {
                FieldInfo field = definitionType.GetField(memberName, flag);
                Getter = GenFieldGetter(definitionType, field);

                if (!field.IsInitOnly && !field.IsLiteral)
                {
                    Setter = GenFieldSetter(definitionType, field);
                }
            }
            Getter(isolate, info, self, argumentsLen);
        }

        private JSFunctionCallback GenFieldGetter(Type type, FieldInfo field)
        {
            var translateFunc = jsEnv.GeneralSetterManager.GetTranslateFunc(field.FieldType);
            if (field.IsStatic)
            {
                return (IntPtr isolate, IntPtr info, IntPtr self, int argumentsLen) =>
                {
                    translateFunc(jsEnv.GeneralSetterManager.jsEnvIdx, isolate, NativeValueApi.SetValueToResult, info, field.GetValue(null));
                };
            }
            else
            {
                return (IntPtr isolate, IntPtr info, IntPtr self, int argumentsLen) =>
                {
                    var me = jsEnv.GeneralGetterManager.GetSelf(self);
                    translateFunc(jsEnv.GeneralSetterManager.jsEnvIdx, isolate, NativeValueApi.SetValueToResult, info, field.GetValue(me));
                };
            }
        }

        private JSFunctionCallback GenFieldSetter(Type type, FieldInfo field)
        {
            var translateFunc = jsEnv.GeneralGetterManager.GetTranslateFunc(field.FieldType);
            var typeMask = GeneralGetterManager.GetJsTypeMask(field.FieldType);
            if (field.IsStatic)
            {
                return (IntPtr isolate, IntPtr info, IntPtr self, int argumentsLen) =>
                {
                    var valuePtr = PuertsDLL.GetArgumentValue(info, 0);
                    var valueType = PuertsDLL.GetJsValueType(isolate, valuePtr, false);
                    if ((typeMask & valueType) != valueType)
                    {
                        PuertsDLL.ThrowException(isolate, "expect " + typeMask + " but got " + valueType);
                    }
                    else
                    {
                        field.SetValue(null, translateFunc(jsEnv.GeneralGetterManager.jsEnv.Idx, isolate, NativeValueApi.GetValueFromArgument, valuePtr, false));
                    }
                };
            }
            else
            {
                return (IntPtr isolate, IntPtr info, IntPtr self, int argumentsLen) =>
                {
                    var valuePtr = PuertsDLL.GetArgumentValue(info, 0);
                    var valueType = PuertsDLL.GetJsValueType(isolate, valuePtr, false);
                    if ((typeMask & valueType) != valueType)
                    {
                        PuertsDLL.ThrowException(isolate, "expect " + typeMask + " but got " + valueType);
                    }
                    else
                    {
                        var me = jsEnv.GeneralGetterManager.GetSelf(self);
                        field.SetValue(me, translateFunc(jsEnv.GeneralGetterManager.jsEnv.Idx, isolate, NativeValueApi.GetValueFromArgument, valuePtr, false));
                    }
                };
            }
        }
    }
    public class LazyPropertyWrap : LazyMembersWrap
    {
        public LazyPropertyWrap(string memberName, JsEnv jsEnv, Type definitionType): base(memberName, jsEnv, definitionType) { }

        protected MethodReflectionWrap reflectionWrap;

        public void Invoke(IntPtr isolate, IntPtr info, IntPtr self, int argumentsLen) 
        {
            try
            {
                if (reflectionWrap == null) 
                {
                    MethodInfo xetMethodInfo = definitionType.GetMethod(memberName, flag);

                    reflectionWrap = new MethodReflectionWrap(memberName, new List<OverloadReflectionWrap>() {
                        new OverloadReflectionWrap(xetMethodInfo, jsEnv.GeneralGetterManager, jsEnv.GeneralSetterManager)
                    });
                }

                reflectionWrap.Invoke(isolate, info, self, argumentsLen);
            }
            catch (Exception e)
            {
                PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }
    }
    public class LazyMethodWrap : LazyMembersWrap
    {
        public LazyMethodWrap(string memberName, JsEnv jsEnv, Type definitionType) : base(memberName, jsEnv, definitionType) { }

        protected MethodReflectionWrap reflectionWrap;

        public void Invoke(IntPtr isolate, IntPtr info, IntPtr self, int argumentsLen)
        {
            try
            {
                if (reflectionWrap == null)
                {
                    MethodInfo[] overload = Utils.GetMethodAndOverrideMethodByName(definitionType, memberName);
                    reflectionWrap = new MethodReflectionWrap(memberName,
                        overload.Select(m => new OverloadReflectionWrap(m, jsEnv.GeneralGetterManager, jsEnv.GeneralSetterManager, false)).ToList()
                    );

                }

                reflectionWrap.Invoke(isolate, info, self, argumentsLen);
            }
            catch (Exception e)
            {
                PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }
    }
}
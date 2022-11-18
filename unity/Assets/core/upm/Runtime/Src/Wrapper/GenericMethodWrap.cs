/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if !EXPERIMENTAL_IL2CPP_PUERTS || !ENABLE_IL2CPP

using System;
using System.Linq;
using System.Reflection;

namespace Puerts 
{
    public class GenericMethodWrap
    {
        private string memberName;
        private JsEnv env;
        private Type definitionType;
        private Type[] genericArguments;

        public GenericMethodWrap(string memberName, JsEnv env, Type definitionType, Type[] genericArguments)
        { 
            this.env = env;
            this.memberName = memberName;
            this.definitionType = definitionType;
            this.genericArguments = genericArguments;
        }

        protected MethodReflectionWrap reflectionWrap;

        public void Invoke(IntPtr isolate, IntPtr info, IntPtr self, int argumentsLen)
        {
            try
            {
                if (reflectionWrap == null)
                {
                    MethodInfo[] overload = Utils.GetMethodAndOverrideMethodByName(definitionType, memberName)
                        .Where(item=> item.IsGenericMethodDefinition && item.GetGenericArguments().Count() == genericArguments.Count())
                        .Select(item=> item.MakeGenericMethod(genericArguments))
                        .ToArray();
                    if (overload.Count() == 0) {
                        throw new Exception("no suitable method found to make GenericMethodWrap");
                    }
                    reflectionWrap = new MethodReflectionWrap(memberName,
                        overload.Select(m => new OverloadReflectionWrap(m, env, false)).ToList()
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

#endif

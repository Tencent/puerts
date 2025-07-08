/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
#if UNITY_2020_1_OR_NEWER
#if !PUERTS_DISABLE_IL2CPP_OPTIMIZATION && (PUERTS_IL2CPP_OPTIMIZATION || !UNITY_IPHONE) && ENABLE_IL2CPP

using System;
using System.Collections.Generic;
using System.Reflection;
using System.Linq;
using PuertsIl2cpp;

namespace Puerts.TypeMapping
{
    internal class TypeRegister
    {
        internal static RegisterInfoManager RegisterInfoManager = null;

        internal static void AddRegisterInfoGetter(Type type, Func<RegisterInfo> getter)
        {
            if (RegisterInfoManager == null) RegisterInfoManager = new RegisterInfoManager();
                
            RegisterInfoManager.Add(type, getter);
        }

        
    }
}
#endif
#endif
/*
 * Tencent is pleased to support the open source community by making InjectFix available.
 * Copyright (C) 2019 THL A29 Limited, a Tencent company.  All rights reserved.
 * InjectFix is licensed under the MIT License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
 * This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
 */

using System.Collections.Generic;
using Puerts;
using System;
using UnityEngine;

//1、配置类必须打[Configure]标签
//2、必须放Editor目录
[Configure]
public class ExamplesCfg
{
    [Binding]
    static IEnumerable<Type> Bindings
    {
        get
        {
            return new List<Type>()
            {
                typeof(Puerts.UnitTest.OptionalParametersClass),
            };
        }
    }
    
    [Filter]
    static bool FilterMethods(System.Reflection.MemberInfo mb)
    {
        // 排除 MonoBehaviour.runInEditMode, 在 Editor 环境下可用发布后不存在
        if (mb.DeclaringType == typeof(MonoBehaviour) && mb.Name == "runInEditMode") {
            return true;
        }
        if (mb.DeclaringType == typeof(Type) && (mb.Name == "MakeGenericSignatureType" || mb.Name == "IsCollectible")) {
            return true;
        }
        if (mb.DeclaringType == typeof(System.IO.File)) {
            if (mb.Name == "SetAccessControl" || mb.Name == "GetAccessControl") {
                return true;

            } else if (mb.Name == "Create") {
                return true;
            }
        }
        return false;
    }
}

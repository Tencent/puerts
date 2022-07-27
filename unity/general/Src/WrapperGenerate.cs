/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using Puerts;
using System.Collections.Generic;
using System;

[Configure]
public class WrapperGenConfig
{
    [Binding]
    static IEnumerable<Type> Bindings
    {
        get
        {
            return new List<Type>()
            {
                typeof(Puerts.UnitTest.OptionalParametersClass),
                typeof(Puerts.UnitTest.WrapperTest),
                typeof(Puerts.UnitTest.GenericGenTest<Type, JsEnv>),
                typeof(Puerts.UnitTest.GenericGenTest2),
                typeof(Puerts.UnitTest.GenericWrapperBase<JsEnv>),
            };
        }
    }
}

public class PuertsTest
{
    public static void Main()
    {
        Puerts.Editor.Generator.FileExporter.ExportWrapper(
            TxtLoader.PathToBinDir("../Src/UnitTest/wrap/"),
            new TxtLoader()
        );
    }
}
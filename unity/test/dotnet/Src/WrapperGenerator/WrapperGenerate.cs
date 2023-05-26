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
    // [Filter]
    // public static bool Filter(MemberInfo mbi)
    // {
    //     if (mbi.DeclaringType == typeof(System.DateTime) && (
    //         mbi.Name.Contains("TryParse") ||
    //         mbi.Name.Contains("TryParseExact") || 
    //         mbi.Name.Contains("TryFormat") || 

            
    //     )) 
    //         return true
    // }

    [Binding]
    static IEnumerable<Type> Bindings
    {
        get
        {
            return new List<Type>()
            {
                typeof(Puerts.UnitTest.HelperExtension),
                typeof(Puerts.UnitTest.ExtensionTestHelper),
                typeof(Puerts.UnitTest.ExtensionTestHelperDerived),
                typeof(Puerts.UnitTest.ExtensionTestHelper1),
                typeof(Puerts.UnitTest.ExtensionTestHelperDerived1),
                typeof(System.Object),
                typeof(TxtLoader),
                typeof(System.Array),
                typeof(Puerts.UnitTest.TestHelper),
                typeof(Puerts.UnitTest.CrossLangTestHelper),
                typeof(System.ValueType),
                typeof(Puerts.UnitTest.TestObject),
                typeof(Puerts.UnitTest.TestStruct),
                typeof(Puerts.UnitTest.CSharpModuleTest),
                typeof(System.Reflection.MemberInfo),
                typeof(System.Type),
                typeof(System.Reflection.TypeInfo),
                typeof(System.Console),
                typeof(Puerts.UnitTest.GenericMethodTest),
                typeof(Puerts.UnitTest.ExceptionTestHelper),
                typeof(Puerts.UnitTest.ExceptionTestHelper.TestStruct),
                typeof(Puerts.UnitTest.ExceptionTestHelper.TestBaseClass),
                typeof(Puerts.UnitTest.ExceptionTestHelper.TestDerivedClass),
                typeof(Puerts.UnitTest.ExtensionTestHelper),
                typeof(Puerts.UnitTest.ExtensionTestHelper1),
                typeof(Puerts.UnitTest.ExtensionTestHelperDerived),
                typeof(Puerts.UnitTest.ExtensionTestHelperDerived1),
                typeof(System.Collections.Generic.List<int>),
                typeof(System.Collections.IEnumerable),
                typeof(System.Collections.Generic.Dictionary<int, int>),
                typeof(System.Collections.Generic.List<string>),
                typeof(Puerts.UnitTest.ForofTestHelper),
                typeof(Puerts.UnitTest.TestVector),
                typeof(Puerts.UnitTest.GenericTestClass),
                typeof(Puerts.UnitTest.GenericTestHelper),
                typeof(Puerts.FloatValue),
                typeof(Puerts.UnitTest.JSTypeTest.TypedValueTestHelper),
                typeof(Puerts.Int64Value),
                typeof(Puerts.UnitTest.MultiEnvTestA),
                typeof(Puerts.UnitTest.MultiEnvTestB),
                typeof(Puerts.UnitTest.MultiEnvTestA),
                typeof(Puerts.UnitTest.MultiEnvTestB),
                typeof(Puerts.UnitTest.OptionalParametersClass),
                typeof(Puerts.UnitTest.Timer),
                typeof(Puerts.UnitTest.TimerTest),
            };
        }
    }
}


public class PuerGen
{
    public static void Main()
    {
        Puerts.Editor.Generator.FileExporter.ExportWrapper(
            TxtLoader.PathToBinDir("../../../Src/StaticWrapper/"),
            new TxtLoader()
        );
        Puerts.Editor.Generator.FileExporter.GenRegisterInfo(
            TxtLoader.PathToBinDir("../../../Src/StaticWrapper/"),
            new TxtLoader()
        );
    }
}
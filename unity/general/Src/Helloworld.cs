/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using Puerts;

public class PuertsTest
{
    public static void Main()
    {
        var jsEnv = new JsEnv(new TxtLoader());
        jsEnv.Eval(@"
            const CS = require('csharp');
            CS.System.Console.WriteLine('hello world');
        ");
        jsEnv.Dispose();
    }
}
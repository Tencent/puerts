/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System.IO;
using System.Reflection;
using Puerts;

public class TxtLoader : ILoader
{
    private string root = Path.Combine(
        System.Text.RegularExpressions.Regex.Replace(Path.GetDirectoryName(Assembly.GetExecutingAssembly().GetName().CodeBase), "^file:(\\\\)?", ""),
        "../../Assets/Puerts/Src/Resources"
    );

    public bool FileExists(string filepath)
    {
        return File.Exists(Path.Combine(root, filepath + ".txt"));
    }

    public string ReadFile(string filepath, out string debugpath)
    {
        debugpath = Path.Combine(root, filepath);
        return File.ReadAllText(debugpath + ".txt");
    }
}

public class PuertsTest
{
    public static void Main()
    {
        var jsEnv = new JsEnv(new TxtLoader(), 9224);
        jsEnv.WaitDebugger();
        jsEnv.Eval(@"
            const CS = require('csharp');
            CS.System.Console.WriteLine('hello world');
        ");

        jsEnv.Dispose();
    }
}
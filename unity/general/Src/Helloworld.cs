/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System.IO;
using System.Reflection;
using System.Diagnostics;
using Puerts;
using System.Collections.Generic;
using System;

public class TxtLoader : ILoader
{
    private string root = Path.Combine(
        System.Text.RegularExpressions.Regex.Replace(Path.GetDirectoryName(Assembly.GetExecutingAssembly().GetName().CodeBase), "^file:(\\\\)?", ""),
        "../../Assets/Puerts/Src/Resources"
    );

    public bool FileExists(string filepath)
    {
        return mockFileContent.ContainsKey(filepath) || File.Exists(Path.Combine(root, filepath));
    }

    public string ReadFile(string filepath, out string debugpath)
    {
        debugpath = Path.Combine(root, filepath);

        string mockContent;
        if (mockFileContent.TryGetValue(filepath, out mockContent))
        {
            return mockContent;
        }

        using (StreamReader reader = new StreamReader(debugpath))
        {
            return reader.ReadToEnd();
        }
    }

    private Dictionary<string, string> mockFileContent = new Dictionary<string, string>();
    public void AddMockFileContent(string fileName, string content)
    {
        mockFileContent.Add(fileName, content);
    }
}

public class PuertsTest
{
    public static void Main()
    {
        var jsEnv = new JsEnv(new TxtLoader());
        //PuertsStaticWrap.AutoStaticCodeRegister.Register(jsEnv);
        jsEnv.Eval(@"
            const CS = require('csharp');

            CS.System.Console.WriteLine('start');

            let start = Date.now();
            const cls = CS.Puerts.UnitTest.WrapperGenTest;
            CS.System.Console.WriteLine((Date.now() - start) + 'ms');

            start = Date.now();
            const obj = new cls;
            CS.System.Console.WriteLine((Date.now() - start) + 'ms');

            start = Date.now();
            obj.LazyMethod()
            CS.System.Console.WriteLine((Date.now() - start) + 'ms');

            start = Date.now();
            for (var i = 0; i < 10000; i++) obj.LazyMethod();
            CS.System.Console.WriteLine((Date.now() - start) + 'ms');
        ");
        jsEnv.Dispose();
    }
}
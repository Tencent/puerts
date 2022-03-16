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
    public static string PathToBinDir(string appendix)
    {
        return Path.Combine(
            System.Text.RegularExpressions.Regex.Replace(
                Path.GetDirectoryName(Assembly.GetExecutingAssembly().GetName().CodeBase), "^file:(\\\\)?", ""
            ),
            appendix
        );
    }

    private string root = PathToBinDir("../../Assets/Puerts/Src/Resources");
    private string editorRoot = PathToBinDir("../../Assets/Puerts/Src/Editor/Resources");

    public bool FileExists(string filepath)
    {
        return mockFileContent.ContainsKey(filepath) ||
            File.Exists(Path.Combine(root, filepath)) ||
            File.Exists(Path.Combine(editorRoot, filepath));
    }

    public string ReadFile(string filepath, out string debugpath)
    {
        debugpath = Path.Combine(root, filepath);
        if (File.Exists(Path.Combine(editorRoot, filepath)))
        {
            debugpath = Path.Combine(editorRoot, filepath);
        }

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
                typeof(Puerts.UnitTest.WrapperGenTest)
            };
        }
    }
}

public class PuertsTest
{
    public static void Main()
    {
        Puerts.Editor.Generator.Menu.GenerateWrapper(
            TxtLoader.PathToBinDir("../Src/UnitTest/wrap/"),
            new TxtLoader()
        );
    }
}
/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System.IO;

public interface LuaLoader
{
    // string or ArrrayBuffer
    object ReadFile(string filepath, out string debugpath);
}

public class LuaDefaultLoader : LuaLoader
{
#if ENABLE_IL2CPP
    [UnityEngine.Scripting.Preserve]
#endif
    public virtual object ReadFile(string filepath, out string debugpath)
    {
        filepath = filepath.Replace('.', '/');
        debugpath = filepath;
        if (!debugpath.EndsWith(".lua"))
        {
            debugpath += ".lua";
        }
        try
        {
#if PUERTS_GENERAL
            return File.ReadAllText(debugpath);
#else
            UnityEngine.TextAsset file = (UnityEngine.TextAsset)UnityEngine.Resources.Load(filepath);
            return (file == null) ? null : file.text;
#endif
        }
        catch
        {
            return null;
        }
    }
}

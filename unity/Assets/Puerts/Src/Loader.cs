/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

namespace Puerts
{
    public interface ILoader
    {
        bool FileExists(string filepath);
        string ReadFile(string filepath, out string debugpath);
    }

    public class DefaultLoader : ILoader
    {
        private string root = "";

        public DefaultLoader()
        {
        }

        public DefaultLoader(string root)
        {
            this.root = root;
        }

        public bool FileExists(string filepath)
        {
            return UnityEngine.Resources.Load(filepath) != null;
        }

        public string ReadFile(string filepath, out string debugpath)
        {
            UnityEngine.TextAsset file = (UnityEngine.TextAsset)UnityEngine.Resources.Load(filepath);
            debugpath = System.IO.Path.Combine(root, filepath);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN
            debugpath = debugpath.Replace("/", "\\");
#endif
            return file == null ? null : file.text;
        }
    }
}
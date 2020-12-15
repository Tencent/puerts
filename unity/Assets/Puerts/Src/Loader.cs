/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if PUERTS_GENERAL
using System.IO;
#endif

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

        private string PathToUse(string filepath)
        {
            return filepath.EndsWith(".cjs") ? 
                filepath.Substring(0, filepath.Length - 4) : 
                filepath;
        }

        public bool FileExists(string filepath)
        {
#if PUERTS_GENERAL
            return File.Exists(Path.Combine(root, filepath));
#else
            string pathToUse = this.PathToUse(filepath);
            return UnityEngine.Resources.Load(pathToUse) != null;
#endif
        }

        public string ReadFile(string filepath, out string debugpath)
        {
#if PUERTS_GENERAL
            debugpath = Path.Combine(root, filepath);
            return File.ReadAllText(debugpath);
#else
            string pathToUse = this.PathToUse(filepath);
            UnityEngine.TextAsset file = (UnityEngine.TextAsset)UnityEngine.Resources.Load(pathToUse);
            debugpath = System.IO.Path.Combine(root, filepath);
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN
            debugpath = debugpath.Replace("/", "\\");
#endif
            return file == null ? null : file.text;
#endif
        }
    }
}

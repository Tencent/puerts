/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;

namespace Puerts
{
    public class PythonLoader : ILoader
    {
        public bool FileExists(string filepath)
        {
            throw new NotImplementedException();
        }

        public string ReadFile(string filepath, out string debugpath)
        {
            throw new NotImplementedException();
        }
    }

    public class PythonDefaultLoader : PythonLoader
    {
    }
}
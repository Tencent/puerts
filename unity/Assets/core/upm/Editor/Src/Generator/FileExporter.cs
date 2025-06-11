/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;

namespace Puerts.Editor
{
    namespace Generator
    {
        public class FileExporter
        {
            public static void ExportWrapper(string saveTo, ILoader loader = null)
            {

            }

            public static void GenRegisterInfo(string outDir, ILoader loader = null)
            {
                using (StreamWriter textWriter = new StreamWriter(Path.Combine(outDir, "RegisterInfo_Gen.cs"), false, Encoding.UTF8))
                {
                    textWriter.Write(@"namespace PuertsStaticWrap
{
#if !PUERTS_GENERAL
    [UnityEngine.Scripting.Preserve]
#endif
    public static class PuerRegisterInfo_Gen
    {
        public static void AddRegisterInfoGetterIntoJsEnv(Puerts.JsEnv jsEnv)
        {
        }
    }
}
");
                    textWriter.Flush();
                }
            }
        }
    }

}
/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System.Reflection;
using System.IO;
using System;
#if !PUERTS_GENERAL
using UnityEditor;
using UnityEngine;
#endif

namespace Puerts.Editor
{
    namespace Generator {

        public class UnityMenu {
            public const string PUERTS_MENU_PREFIX = "PuerTS";

#if !PUERTS_GENERAL
            [MenuItem(PUERTS_MENU_PREFIX + "/Generate Code", false, 1)]
            public static void GenerateCode()
            {
                var start = DateTime.Now;
                var saveTo = Configure.GetCodeOutputDirectory();
                Directory.CreateDirectory(saveTo);
                Directory.CreateDirectory(Path.Combine(saveTo, "Typing/csharp"));

                FileExporter.ExportWrapper(saveTo);
                FileExporter.ExportDTS(saveTo);
                Debug.Log("finished! use " + (DateTime.Now - start).TotalMilliseconds + " ms");
                AssetDatabase.Refresh();

                Utils.filters = null;
            }

            [MenuItem(PUERTS_MENU_PREFIX + "/Generate index.d.ts (global.CS style)", false, 1)]
            public static void GenerateDTS()
            {
                var start = DateTime.Now;
                var saveTo = Configure.GetCodeOutputDirectory();
                Directory.CreateDirectory(saveTo);
                Directory.CreateDirectory(Path.Combine(saveTo, "Typing/csharp"));
                FileExporter.ExportDTS(saveTo);
                Debug.Log("finished! use " + (DateTime.Now - start).TotalMilliseconds + " ms");
                AssetDatabase.Refresh();

                Utils.filters = null;
            }

            [MenuItem(PUERTS_MENU_PREFIX + "/Generate index.d.ts (require('csharp') style)", false, 1)]
            public static void GenerateDTSOldStyle()
            {
                var start = DateTime.Now;
                var saveTo = Configure.GetCodeOutputDirectory();
                Directory.CreateDirectory(saveTo);
                Directory.CreateDirectory(Path.Combine(saveTo, "Typing/csharp"));
                FileExporter.ExportDTS(saveTo, null, true);
                Debug.Log("finished! use " + (DateTime.Now - start).TotalMilliseconds + " ms");
                AssetDatabase.Refresh();

                Utils.filters = null;
            }

            [MenuItem(PUERTS_MENU_PREFIX + "/Clear Generated Code", false, 2)]
            public static void ClearAll()
            {
                var saveTo = Configure.GetCodeOutputDirectory();
                if (Directory.Exists(saveTo))
                {
                    Directory.Delete(saveTo, true);
                    AssetDatabase.DeleteAsset(saveTo.Substring(saveTo.IndexOf("Assets") + "Assets".Length));
                    AssetDatabase.Refresh();
                }
            }

#endif
        }
    }
}

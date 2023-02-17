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
            [MenuItem(PUERTS_MENU_PREFIX + "/Generate (all in one)", false, 1)]
            public static void GenV1() {
                Puerts.Editor.Generator.UnityMenu.GenerateCode();
                Puerts.Editor.Generator.UnityMenu.GenerateDTS();
                Puerts.Editor.Generator.UnityMenu.GenerateMacroHeader(false);
            }
            
            [MenuItem(PUERTS_MENU_PREFIX + "/Generate/Wrapper Code", false, 6)]
            public static void GenerateCode()
            {
                var start = DateTime.Now;
                var saveTo = Configure.GetCodeOutputDirectory();
                Directory.CreateDirectory(saveTo);

                FileExporter.ExportWrapper(saveTo);
                Debug.Log("finished! use " + (DateTime.Now - start).TotalMilliseconds + " ms");
                AssetDatabase.Refresh();

                Utils.filters = null;
            }

            [MenuItem(PUERTS_MENU_PREFIX + "/Generate/index.d.ts (global.CS style)", false, 6)]
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

            [MenuItem(PUERTS_MENU_PREFIX + "/Generate/index.d.ts (require('csharp') style)", false, 6)]
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

            [MenuItem(PUERTS_MENU_PREFIX + "/Generate/il2cpp macro .h", false, 6)]
            public static void GenerateMacroHeader() {
#if !EXPERIMENTAL_IL2CPP_PUERTS
                GenerateMacroHeader(false);
#else
                GenerateMacroHeader(true);
#endif
            }
            public static void GenerateMacroHeader(bool forceIl2Cpp)
            {
                var saveTo = Puerts.Configure.GetCodeOutputDirectory();
                FileExporter.GenMarcoHeader(saveTo, forceIl2Cpp);
            }

            [MenuItem(PUERTS_MENU_PREFIX + "/Clear Generated Code", false, 9)]
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

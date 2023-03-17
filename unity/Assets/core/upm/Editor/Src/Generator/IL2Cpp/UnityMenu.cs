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

namespace PuertsIl2cpp.Editor
{
    namespace Generator {

        public class UnityMenu {
            public const string PUERTS_MENU_PREFIX = "PuerTS";

#if !PUERTS_GENERAL && !UNITY_WEBGL
            [MenuItem(PUERTS_MENU_PREFIX + "/Generate For il2cpp Binding (all in one)", false, 2)]
            public static void GenV2() {
                PuertsIl2cpp.Editor.Generator.UnityMenu.GenerateCppWrappers();
                PuertsIl2cpp.Editor.Generator.UnityMenu.GenerateExtensionMethodInfos();
                PuertsIl2cpp.Editor.Generator.UnityMenu.GenerateLinkXML();
                Puerts.Editor.Generator.UnityMenu.GenerateMacroHeader(true);
            }

            [MenuItem(PUERTS_MENU_PREFIX + "/Generate/FunctionBridge.Gen.h", false, 6)]
            public static void GenerateCppWrappers()
            {   
                var start = DateTime.Now;
#if CPP_OUTPUT_TO_NATIVE_SRC
                var saveTo = Path.Combine(Application.dataPath, "..", "native_src_il2cpp", "Src");
#elif PUERTS_CPP_OUTPUT_TO_NATIVE_SRC_UPM
                var saveTo = Path.Combine(Path.GetFullPath("Packages/com.tencent.puerts.core/"), "../../../", "native_src_il2cpp", "Src");
#else
                var saveTo = Puerts.Configure.GetCodeOutputDirectory();
#endif
                
                
                Directory.CreateDirectory(saveTo);
                FileExporter.GenCPPWrap(saveTo);
                Debug.Log("finished! use " + (DateTime.Now - start).TotalMilliseconds + " ms Outputed to " + saveTo);
            }
            
            [MenuItem(PUERTS_MENU_PREFIX + "/Generate/FunctionBridge.Gen.h(Configure)", false, 6)]
            public static void GenerateCppWrappersInConfigure()
            {
                var start = DateTime.Now;
#if CPP_OUTPUT_TO_NATIVE_SRC
                var saveTo = Path.Combine(Application.dataPath, "..", "native_src_il2cpp", "Src");
#elif PUERTS_CPP_OUTPUT_TO_NATIVE_SRC_UPM
                var saveTo = Path.Combine(Path.GetFullPath("Packages/com.tencent.puerts.core/"), "../../../", "native_src_il2cpp", "Src");
#else
                var saveTo = Puerts.Configure.GetCodeOutputDirectory();
#endif
                
                
                Directory.CreateDirectory(saveTo);
                FileExporter.GenCPPWrap(saveTo, true);
                Debug.Log("finished! use " + (DateTime.Now - start).TotalMilliseconds + " ms Outputed to " + saveTo);
            }

            [MenuItem(PUERTS_MENU_PREFIX + "/Generate/ExtensionMethodInfos_Gen.cs", false, 6)]
            public static void GenerateExtensionMethodInfos()
            {
                var start = DateTime.Now;
                var saveTo = Puerts.Configure.GetCodeOutputDirectory();

                Directory.CreateDirectory(saveTo);
                FileExporter.GenExtensionMethodInfos(saveTo);
                Debug.Log("finished! use " + (DateTime.Now - start).TotalMilliseconds + " ms Outputed to " + saveTo);
                AssetDatabase.Refresh();
            }

            [MenuItem(PUERTS_MENU_PREFIX + "/Generate/Link.xml", false, 6)]
            public static void GenerateLinkXML()
            {
                var start = DateTime.Now;
                var saveTo = Puerts.Configure.GetCodeOutputDirectory();
                Directory.CreateDirectory(saveTo);
                FileExporter.GenLinkXml(saveTo);
                Debug.Log("finished! use " + (DateTime.Now - start).TotalMilliseconds + " ms Outputed to " + saveTo);
                AssetDatabase.Refresh();
            }

#endif
        }
    }
}

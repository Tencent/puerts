/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if UNITY_2020_1_OR_NEWER
using System.Reflection;
using System.IO;
using System;
#if !PUERTS_GENERAL
using UnityEditor;
using UnityEngine;
#endif

#if !PUERTS_GENERAL
namespace Puerts.Editor
{
    namespace Generator 
    {

        public class UnityMenu 
        {
            [MenuItem(Puerts.Editor.Generator.UnityMenu.PUERTS_MENU_PREFIX + "/Generate il2cpp/Reflection Mode", false, 2)]
            public static void GenV2WithoutWrapper()
            {
                var start = DateTime.Now;
                var saveTo = PathHelper.GetIl2cppPluginPath();
                Directory.CreateDirectory(saveTo);
                CSharpFileExporter.GenAll(saveTo, false, true);

                var codeOutputDir = Puerts.Configure.GetCodeOutputDirectory();
                Directory.CreateDirectory(codeOutputDir);
                CSharpFileExporter.GenExtensionMethodInfos(codeOutputDir);
                CSharpFileExporter.GenLinkXml(codeOutputDir);

                Debug.Log("finished! use " + (DateTime.Now - start).TotalMilliseconds + " ms Outputed to " + saveTo);
                AssetDatabase.Refresh();
            }

            [MenuItem(Puerts.Editor.Generator.UnityMenu.PUERTS_MENU_PREFIX + "/Generate il2cpp/Static Wrapper Mode", false, 3)]
            public static void GenV2()
            {
                var start = DateTime.Now;
                var saveTo = PathHelper.GetIl2cppPluginPath();
                Directory.CreateDirectory(saveTo);
                CSharpFileExporter.GenAll(saveTo, false, false);

                var codeOutputDir = Puerts.Configure.GetCodeOutputDirectory();
                Directory.CreateDirectory(codeOutputDir);
                CSharpFileExporter.GenExtensionMethodInfos(codeOutputDir);
                CSharpFileExporter.GenLinkXml(codeOutputDir);

                Debug.Log("finished! use " + (DateTime.Now - start).TotalMilliseconds + " ms Outputed to " + saveTo);
                AssetDatabase.Refresh();
            }

            [MenuItem(Puerts.Editor.Generator.UnityMenu.PUERTS_MENU_PREFIX + "/Generate il2cpp/Minimal Bridge, Reflection Mode", false, 4)]
            public static void GenMinimumWrappersAndBridge()
            {
                var start = DateTime.Now;
                var saveTo = PathHelper.GetIl2cppPluginPath();
                Directory.CreateDirectory(saveTo);
                CSharpFileExporter.GenAll(saveTo, true, true);

                var codeOutputDir = Puerts.Configure.GetCodeOutputDirectory();
                Directory.CreateDirectory(codeOutputDir);
                CSharpFileExporter.GenExtensionMethodInfos(codeOutputDir);
                CSharpFileExporter.GenLinkXml(codeOutputDir);

                Debug.Log("finished! use " + (DateTime.Now - start).TotalMilliseconds + " ms Outputed to " + saveTo);
                AssetDatabase.Refresh();
            }

            [MenuItem(Puerts.Editor.Generator.UnityMenu.PUERTS_MENU_PREFIX + "/Generate C# Static Wrappers", false, 5)]
            public static void GenerateStaticWrappers()
            {
                var start = DateTime.Now;

                try
                {
                    var outputDir = Puerts.Configure.GetCodeOutputDirectory();
                    Directory.CreateDirectory(outputDir);

                    StaticWrapperMenu.GenerateStaticWrappersTo(outputDir);

                    Debug.Log($"[PuerTS] Static wrapper generation finished! Took {(DateTime.Now - start).TotalMilliseconds:F0} ms. Output: {outputDir}");
                    AssetDatabase.Refresh();
                }
                catch (Exception e)
                {
                    Debug.LogError($"[PuerTS] Static wrapper generation failed: {e.Message}\n{e.StackTrace}");
                }
            }

            [MenuItem(Puerts.Editor.Generator.UnityMenu.PUERTS_MENU_PREFIX + "/Advanced/Generate Native Plugin Files", false, 6)]
            public static void GenerateCppPlugin()
            {
                var start = DateTime.Now;
                var saveTo = PathHelper.GetIl2cppPluginPath();
                Directory.CreateDirectory(saveTo);
                CSharpFileExporter.CopyStaticResources(saveTo);
                CSharpFileExporter.GenMacroHeader(saveTo);
                Debug.Log("finished! use " + (DateTime.Now - start).TotalMilliseconds + " ms Outputed to " + saveTo);
            }

            [MenuItem(Puerts.Editor.Generator.UnityMenu.PUERTS_MENU_PREFIX + "/Advanced/Generate Extension Method Infos", false, 6)]
            public static void GenerateExtensionMethodInfos()
            {
                var start = DateTime.Now;
                var saveTo = Puerts.Configure.GetCodeOutputDirectory();
                Directory.CreateDirectory(saveTo);
                CSharpFileExporter.GenExtensionMethodInfos(saveTo);
                Debug.Log("finished! use " + (DateTime.Now - start).TotalMilliseconds + " ms Outputed to " + saveTo);
                AssetDatabase.Refresh();
            }

            [MenuItem(Puerts.Editor.Generator.UnityMenu.PUERTS_MENU_PREFIX + "/Advanced/Generate Link.xml", false, 6)]
            public static void GenerateLinkXml()
            {
                var start = DateTime.Now;
                var saveTo = Puerts.Configure.GetCodeOutputDirectory();
                Directory.CreateDirectory(saveTo);
                CSharpFileExporter.GenLinkXml(saveTo);
                Debug.Log("finished! use " + (DateTime.Now - start).TotalMilliseconds + " ms Outputed to " + saveTo);
                AssetDatabase.Refresh();
            }

            public const string PUERTS_MENU_PREFIX = "Tools/PuerTS";

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
        }
    }
}
#endif
#endif
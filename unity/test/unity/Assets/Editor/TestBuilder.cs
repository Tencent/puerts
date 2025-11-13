#if !UNITY_WEBGL
using System;
using System.IO;
using UnityEngine;
using System.Collections;
using System.Linq;
using UnityEditor;
using UnityEditor.Build.Reporting;
public class TestBuilder 
{
#if PUERTS_DISABLE_IL2CPP_OPTIMIZATION
    public static void GenV1() 
    {
        Puerts.Editor.Generator.UnityMenu.GenerateCode();
    }
    [MenuItem("PuerTS/Tester/BuildV1")]
    public static void BuildWindowsV1() { BuildWindows(false); }
#endif

#if !PUERTS_DISABLE_IL2CPP_OPTIMIZATION
    public static void GenV2WithoutWrapper() 
    {
        PuertsIl2cpp.Editor.Generator.UnityMenu.GenerateEmptyCppWrappers();
        PuertsIl2cpp.Editor.Generator.UnityMenu.GenerateExtensionMethodInfos();
        PuertsIl2cpp.Editor.Generator.UnityMenu.GenerateLinkXML();
        PuertsIl2cpp.Editor.Generator.UnityMenu.GenerateCppPlugin();
        //Puerts.Editor.Generator.UnityMenu.GenRegisterInfo();
    }
    public static void GenV2() 
    {
        PuertsIl2cpp.Editor.Generator.UnityMenu.GenerateCppWrappers();
        PuertsIl2cpp.Editor.Generator.UnityMenu.GenerateExtensionMethodInfos();
        PuertsIl2cpp.Editor.Generator.UnityMenu.GenerateLinkXML();
        PuertsIl2cpp.Editor.Generator.UnityMenu.GenerateCppPlugin();
        //Puerts.Editor.Generator.UnityMenu.GenRegisterInfo();
    }
    public static void GenMinimumWrappersAndBridge() 
    {
        PuertsIl2cpp.Editor.Generator.UnityMenu.GenerateMinimumWrappersAndBridge();
        PuertsIl2cpp.Editor.Generator.UnityMenu.GenerateExtensionMethodInfos();
        PuertsIl2cpp.Editor.Generator.UnityMenu.GenerateLinkXML();
        PuertsIl2cpp.Editor.Generator.UnityMenu.GenerateCppPlugin();
    }
    [MenuItem("PuerTS/Tester/BuildV2")]
    public static void BuildWindowsV2() { BuildWindows(true); }
#endif

    public static void BuildWindows(bool withV2)
    {
        PlayerSettings.SetScriptingBackend(BuildTargetGroup.Standalone, ScriptingImplementation.IL2CPP);

        BuildPlayerOptions buildPlayerOptions = new BuildPlayerOptions();
        buildPlayerOptions.scenes = new[] { "Assets/Scenes/Test.unity" };

        string extension = "";
        if (Application.platform == RuntimePlatform.WindowsPlayer ||
            Application.platform == RuntimePlatform.WindowsEditor)
        {
            buildPlayerOptions.target = BuildTarget.StandaloneWindows64;
            extension = ".exe";
        }
        else if (Application.platform == RuntimePlatform.OSXPlayer ||
                 Application.platform == RuntimePlatform.OSXEditor)
        {
            buildPlayerOptions.target = BuildTarget.StandaloneOSX;
        }
        else if (Application.platform == RuntimePlatform.LinuxPlayer ||
                 Application.platform == RuntimePlatform.LinuxEditor)
        {
            buildPlayerOptions.target = BuildTarget.StandaloneLinux64;
        }
        buildPlayerOptions.locationPathName = "build/" + (withV2 ? "v2" : "v1") + "/Tester" + extension;
        buildPlayerOptions.options = BuildOptions.None;

        BuildReport report = BuildPipeline.BuildPlayer(buildPlayerOptions);
        BuildSummary summary = report.summary;

        if (summary.result == BuildResult.Succeeded)
        {
            Debug.Log("Build succeeded: " + summary.outputPath + " with " + summary.totalSize + " bytes");
        }

        if (summary.result == BuildResult.Failed)
        {
            Debug.Log("Build failed: " + summary.outputPath);
        }
    }
    
    public static void BuildAndroid()
    {
        PlayerSettings.SetScriptingBackend(BuildTargetGroup.Android, ScriptingImplementation.IL2CPP);
        PlayerSettings.SetApplicationIdentifier(BuildTargetGroup.Android, "com.tencent.puerts_test");
        PlayerSettings.Android.targetArchitectures = AndroidArchitecture.X86_64;

        // Fix x86_64 plugin import settings - auto discover all .so files
        string pluginDir = "Packages/com.tencent.puerts.core/Plugins/Android/libs/x86_64";
        string[] guids = AssetDatabase.FindAssets("t:PluginImporter", new[] { pluginDir });
        
        int fixedCount = 0;
        foreach (string guid in guids)
        {
            string assetPath = AssetDatabase.GUIDToAssetPath(guid);
            if (assetPath.EndsWith(".so"))
            {
                PluginImporter pluginImporter = AssetImporter.GetAtPath(assetPath) as PluginImporter;
                if (pluginImporter != null)
                {
                    pluginImporter.SetCompatibleWithAnyPlatform(false);
                    pluginImporter.SetCompatibleWithEditor(false);
                    pluginImporter.SetCompatibleWithPlatform(BuildTarget.Android, true);
                    pluginImporter.SetPlatformData(BuildTarget.Android, "CPU", "x86_64");
                    pluginImporter.SaveAndReimport();
                    Debug.Log($"Fixed plugin import settings for {assetPath}");
                    fixedCount++;
                }
            }
        }
        
        if (fixedCount == 0)
        {
            Debug.LogWarning($"No plugins found in directory: {pluginDir}");
        }
        else
        {
            Debug.Log($"Successfully configured {fixedCount} x86_64 plugin(s)");
        }

        BuildPlayerOptions buildPlayerOptions = new BuildPlayerOptions();
        buildPlayerOptions.scenes = new[] { "Assets/Scenes/Test.unity" };
        buildPlayerOptions.target = BuildTarget.Android;
        buildPlayerOptions.locationPathName = "build/puerts_test.apk";
        buildPlayerOptions.options = BuildOptions.None;

        BuildReport report = BuildPipeline.BuildPlayer(buildPlayerOptions);
        BuildSummary summary = report.summary;

        if (summary.result == BuildResult.Succeeded)
        {
            Debug.Log("Build succeeded: " + summary.outputPath + " with " + summary.totalSize + " bytes");
        }

        if (summary.result == BuildResult.Failed)
        {
            Debug.Log("Build failed: " + summary.outputPath);
        }
    }
}
#endif
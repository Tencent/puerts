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
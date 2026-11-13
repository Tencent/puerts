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
        Puerts.Editor.Generator.UnityMenu.GenV2WithoutWrapper();
    }
    public static void GenV2() 
    {
        Puerts.Editor.Generator.UnityMenu.GenV2();
    }
    public static void GenMinimumWrappersAndBridge() 
    {
        Puerts.Editor.Generator.UnityMenu.GenMinimumWrappersAndBridge();
    }
    [MenuItem("PuerTS/Tester/BuildV2")]
    public static void BuildWindowsV2() { BuildWindows(true); }

    // 导出 IL2CPP 的 Visual Studio 工程（Build Settings 里的 "Create Visual Studio Solution"），用于本地调试 player
    [MenuItem("PuerTS/Tester/ExportVSProjectV2")]
    public static void ExportWindowsVSProjectV2()
    {
        // UnityEditor.WindowsStandalone.UserBuildSettings 只在装了 Windows 支持模块时存在，用反射设置，失败再走通用接口
        var userBuildSettings = AppDomain.CurrentDomain.GetAssemblies()
            .Select(a => a.GetType("UnityEditor.WindowsStandalone.UserBuildSettings"))
            .FirstOrDefault(t => t != null);
        var createSolution = userBuildSettings == null ? null : userBuildSettings.GetProperty("createSolution");
        if (createSolution != null)
        {
            createSolution.SetValue(null, true);
        }
        else
        {
            EditorUserBuildSettings.SetPlatformSettings("Standalone", "CreateSolution", "true");
        }
        Debug.Log("CreateSolution set via " + (createSolution != null ? "UserBuildSettings" : "SetPlatformSettings"));

        PlayerSettings.SetScriptingBackend(BuildTargetGroup.Standalone, ScriptingImplementation.IL2CPP);
        BuildPlayerOptions buildPlayerOptions = new BuildPlayerOptions();
        buildPlayerOptions.scenes = new[] { "Assets/Scenes/Test.unity" };
        buildPlayerOptions.target = BuildTarget.StandaloneWindows64;
        // Unity 6 导出 VS 工程时把 locationPathName 当作 exe 路径，取其父目录作为工程根（写 build/vs 会导出到 build/）
        buildPlayerOptions.locationPathName = "build/vs/Tester.exe";
        buildPlayerOptions.options = BuildOptions.Development;

        BuildReport report = BuildPipeline.BuildPlayer(buildPlayerOptions);
        Debug.Log("Export VS solution " + report.summary.result + ": " + report.summary.outputPath);
        if (report.summary.result != BuildResult.Succeeded && Application.isBatchMode) EditorApplication.Exit(1);
    }
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
            if (Application.isBatchMode) EditorApplication.Exit(1);
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
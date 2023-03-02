using System;
using System.IO;
using UnityEngine;
using System.Collections;
using System.Linq;
using UnityEditor;
using UnityEditor.Build.Reporting;
public class TestBuilder 
{
    public static void GenV1() 
    {
        PlayerSettings.SetScriptingDefineSymbolsForGroup(BuildTargetGroup.Standalone, "");
        Puerts.Editor.Generator.UnityMenu.GenerateCode();
        Puerts.Editor.Generator.UnityMenu.GenerateMacroHeader(false);
    }
    public static void GenV2() 
    {
        PlayerSettings.SetScriptingDefineSymbolsForGroup(BuildTargetGroup.Standalone, "EXPERIMENTAL_IL2CPP_PUERTS");
        PuertsIl2cpp.Editor.Generator.UnityMenu.GenerateCppWrappers();
        PuertsIl2cpp.Editor.Generator.UnityMenu.GenerateExtensionMethodInfos();
        PuertsIl2cpp.Editor.Generator.UnityMenu.GenerateLinkXML();
        Puerts.Editor.Generator.UnityMenu.GenerateMacroHeader(true);
    }

    [MenuItem("PuerTS/Tester/BuildV1")]
    public static void BuildWindowsV1() { BuildWindows(false); }
    [MenuItem("PuerTS/Tester/BuildV2")]
    public static void BuildWindowsV2() { BuildWindows(true); }

    public static void BuildWindows(bool withV2) 
    {
        PlayerSettings.SetScriptingDefineSymbolsForGroup(BuildTargetGroup.Standalone, withV2 ? "EXPERIMENTAL_IL2CPP_PUERTS" : "");
        PlayerSettings.SetScriptingBackend(BuildTargetGroup.Standalone, ScriptingImplementation.IL2CPP);

        BuildPlayerOptions buildPlayerOptions = new BuildPlayerOptions();
        buildPlayerOptions.scenes = new[] { "Assets/Scenes/Test.unity"};
        buildPlayerOptions.locationPathName = "build/" + (withV2 ? "v2" : "v1") + "/Tester.exe";
        buildPlayerOptions.target = BuildTarget.StandaloneWindows64;
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
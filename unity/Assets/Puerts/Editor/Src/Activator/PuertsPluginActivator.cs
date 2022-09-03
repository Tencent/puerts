#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;

[UnityEditor.InitializeOnLoad]
public class PuertsPluginActivator
{
    public enum PluginRuntimeType
    {
        Editor,
        Runtime,
        ALL
    }

    private const string MENU_PATH = "PuerTS/ActivatePlugins/";
    private const string PuertsPluginFolder = "Plugins";
    private const UnityEditor.BuildTarget INVALID_BUILD_TARGET = (UnityEditor.BuildTarget)(-1);
    static PuertsPluginActivator()
    {
        BuildTargetToPlatformName.Add(UnityEditor.BuildTarget.StandaloneOSX, "macOS");
        BuildTargetToPlatformName.Add(UnityEditor.BuildTarget.StandaloneWindows, "x86");
        BuildTargetToPlatformName.Add(UnityEditor.BuildTarget.StandaloneWindows64, "x86_64");
        var curEditorEngineType = EditorBackEndTypeSetting.getAsset().backEndType;
        activatePluginByEngineType(curEditorEngineType, false);
        UnityEditor.EditorApplication.delayCall += delayUpdateMenu;

    }
    // private static ScriptEngineType ttype;

    // private static void delayUpdateMenu()
    // {
    //     var curEditorEngineType = TsProjDevUserSetting.getAsset().editorEngineType;
    //     ttype = curEditorEngineType;
    //     UnityEngine.Debug.LogError("enginetype"+ttype.ToString());
    //     activatePluginByEngineType(ttype, false);
    //     updateMenuItemState(ttype);

    // }
    private static void delayUpdateMenu()
    {
        var curBackEndType = EditorBackEndTypeSetting.getAsset().backEndType;

        updateMenuItemState(curBackEndType);

    }
    public static bool activatePluginsForEditor(PuertsBackEndType targetType)
    {
        var importers = getPuertsPluginImporters(new UnityEditor.BuildTarget[] { UnityEditor.BuildTarget.StandaloneWindows, UnityEditor.BuildTarget.StandaloneOSX });
        var hadActivated = false;

        foreach (var pluginImporter in importers)
        {
            var splitPath = getPluginInfoFromPath(pluginImporter.assetPath);
            if (splitPath == null)
            {
                continue;
            }
            var pluginPlatform = splitPath[0];
            var engineType = string.Empty;
            var editorCPU = string.Empty;
            var editorOS = string.Empty;

            if (pluginPlatform != "macOS" && pluginPlatform != "x86" && pluginPlatform != "x86_64") continue;

            switch (pluginPlatform)
            {
                case "macOS":
                    editorCPU = splitPath[1];
                    engineType = splitPath[2];

                    editorOS = "OSX";
                    break;

                case "x86":
                    editorCPU = "x86";
                    engineType = splitPath[1];
                    editorOS = "Windows";
                    break;
                case "x86_64":
                    editorCPU = "x86_64";
                    engineType = splitPath[1];
                    editorOS = "Windows";
                    break;
            }
            var AssetChanged = false;
            if (pluginImporter.GetCompatibleWithAnyPlatform())
            {
                pluginImporter.SetCompatibleWithAnyPlatform(false);
                pluginImporter.isPreloaded = false;
                AssetChanged = true;
            }
            var bActivate = false;
            if (!string.IsNullOrEmpty(editorOS))
            {
                bActivate = engineType == targetType.ToString();

                if (bActivate)
                {
                    hadActivated = true;
                    pluginImporter.SetEditorData("CPU", editorCPU);
                    pluginImporter.SetEditorData("OS", editorOS);
                }
            }
            AssetChanged |= pluginImporter.GetCompatibleWithEditor() != bActivate;
            pluginImporter.SetCompatibleWithEditor(bActivate);
            pluginImporter.isPreloaded = bActivate;
            if (AssetChanged)
            {
                UnityEditor.AssetDatabase.ImportAsset(pluginImporter.assetPath);
            }
        }
        if (hadActivated)
        {
            UnityEngine.Debug.Log("[Puerts] Plugins successfully activated for " + targetType.ToString() + " in Editor.");
        }
        else
        {
            UnityEngine.Debug.LogWarning("[Puerts] Plugins fail activated for " + targetType.ToString() + " in Editor. maybe not has " + targetType.ToString());
        }
        return hadActivated;
    }
    public static void activatePluginsForDeployment(UnityEditor.BuildTarget target, PuertsBackEndType type, bool activate)
    {
        var importers = getPuertsPluginImporters(new UnityEditor.BuildTarget[] { target });
        foreach (var pluginImporter in importers)
        {
            var splitPath = getPluginInfoFromPath(pluginImporter.assetPath);
            if (splitPath == null)
            {
                continue;
            }

            var pluginPlatform = splitPath[0];


            var pluginName = splitPath[splitPath.Length - 1].Split('.')[0];
            var pluginArch = string.Empty;
            var engineType = string.Empty;


            switch (pluginPlatform)
            {
                case "iOS":
                case "tvOS":
                case "PS4":
                case "PS5":
                case "XboxOne":
                case "Stadia":
                case "XboxSeriesX":
                case "XboxOneGC":
                    engineType = splitPath[1];
                    break;

                case "Android":
                    pluginArch = splitPath[1];
                    engineType = splitPath[2];

                    if (pluginArch == "armeabi-v7a")
                    {
                        pluginImporter.SetPlatformData(UnityEditor.BuildTarget.Android, "CPU", "ARMv7");
                    }
                    else if (pluginArch == "arm64-v8a")
                    {
                        pluginImporter.SetPlatformData(UnityEditor.BuildTarget.Android, "CPU", "ARM64");
                    }
                    else if (pluginArch == "x86")
                    {
                        pluginImporter.SetPlatformData(UnityEditor.BuildTarget.Android, "CPU", "x86");
                    }
                    else
                    {
                        UnityEngine.Debug.Log("[Puerts]: Architecture not found: " + pluginArch);
                    }
                    break;

                case "Linux":
                    pluginArch = splitPath[1];
                    engineType = splitPath[2];

                    if (pluginArch != "x86" && pluginArch != "x86_64")
                    {
                        UnityEngine.Debug.Log("[Puerts]: Architecture not found: " + pluginArch);
                        continue;
                    }
                    setStandalonePlatformData(pluginImporter, pluginPlatform, pluginArch);
                    break;

                case "macOS":
                    pluginArch = splitPath[1];
                    engineType = splitPath[2];
                    setStandalonePlatformData(pluginImporter, pluginPlatform, pluginArch);
                    break;

                // case "WSA":
                //     pluginArch = splitPath[1];
                //     engineType = splitPath[2];

                //     pluginImporter.SetPlatformData(UnityEditor.BuildTarget.WSAPlayer, "SDK", "AnySDK");

                //     if (pluginArch == "WSA_UWP_Win32")
                //     {
                //         pluginImporter.SetPlatformData(UnityEditor.BuildTarget.WSAPlayer, "CPU", "X86");
                //     }
                //     else if (pluginArch == "WSA_UWP_x64")
                //     {
                //         pluginImporter.SetPlatformData(UnityEditor.BuildTarget.WSAPlayer, "CPU", "X64");
                //     }
                //     else if (pluginArch == "WSA_UWP_ARM")
                //     {
                //         pluginImporter.SetPlatformData(UnityEditor.BuildTarget.WSAPlayer, "CPU", "ARM");
                //     }
                //     else if (pluginArch == "WSA_UWP_ARM64")
                //     {
                //         pluginImporter.SetPlatformData(UnityEditor.BuildTarget.WSAPlayer, "CPU", "ARM64");
                //     }
                //     break;

                case "x86":
                    pluginArch = "x86";
                    engineType = splitPath[1];

                    if (pluginArch != "x86" && pluginArch != "x86_64")
                    {
                        UnityEngine.Debug.Log("[Puerts]: Architecture not found: " + pluginArch);
                        continue;
                    }
                    setStandalonePlatformData(pluginImporter, pluginPlatform, pluginArch);
                    break;
                case "x86_64":
                    pluginArch = "x86_64";
                    engineType = splitPath[1];

                    if (pluginArch != "x86" && pluginArch != "x86_64")
                    {
                        UnityEngine.Debug.Log("[Puerts]: Architecture not found: " + pluginArch);
                        continue;
                    }
                    setStandalonePlatformData(pluginImporter, pluginPlatform, pluginArch);
                    break;
                // case "Switch":
                //     pluginArch = splitPath[1];
                //     engineType = splitPath[2];

                //     if (SwitchBuildTarget == INVALID_BUILD_TARGET)
                //     {
                //         continue;
                //     }

                //     if (pluginArch != "NX32" && pluginArch != "NX64")
                //     {
                //         UnityEngine.Debug.Log("[Puerts]: Architecture not found: " + pluginArch);
                //         continue;
                //     }
                //     break;

                default:
                    UnityEngine.Debug.Log("[Puerts]: Unknown platform: " + pluginPlatform);
                    continue;
            }

            var AssetChanged = false;
            if (pluginImporter.GetCompatibleWithAnyPlatform())
            {
                pluginImporter.SetCompatibleWithAnyPlatform(false);
                AssetChanged = true;
            }

            var bActivate = true;
            if (engineType != type.ToString())
            {
                bActivate = false;
            }

            bool isCompatibleWithPlatform = bActivate && activate;
            if (!bActivate && target == UnityEditor.BuildTarget.WSAPlayer)
            {
                AssetChanged = true;
            }
            else
            {
                AssetChanged |= pluginImporter.GetCompatibleWithPlatform(target) != isCompatibleWithPlatform;
            }

            pluginImporter.SetCompatibleWithPlatform(target, isCompatibleWithPlatform);

            if (AssetChanged)
            {
                pluginImporter.SaveAndReimport();
            }
        }
    }
    public static Dictionary<UnityEditor.BuildTarget, string> BuildTargetToPlatformName = new Dictionary<UnityEditor.BuildTarget, string>();

    // returns the name of the folder that contains plugins for a specific target
    private static string getBuildTargetPlatformName(UnityEditor.BuildTarget target)
    {
        if (BuildTargetToPlatformName.ContainsKey(target))
        {
            return BuildTargetToPlatformName[target];
        }
        return target.ToString();
    }
    private static void setStandalonePlatformData(UnityEditor.PluginImporter pluginImporter, string platformName, string architecture)
    {
        var isLinux = platformName == "Linux";
        var isWindows = platformName == "Windows";
        var isMac = platformName == "Mac";
        var isX86 = architecture == "x86";
        var isX64 = architecture == "x86_64";

#if !UNITY_2019_2_OR_NEWER
		pluginImporter.SetPlatformData(UnityEditor.BuildTarget.StandaloneLinux, "CPU", isLinux && isX86 ? "x86" : "None");
		pluginImporter.SetPlatformData(UnityEditor.BuildTarget.StandaloneLinuxUniversal, "CPU", !isLinux ? "None" : isX86 ? "x86" : isX64 ? "x86_64" : "None");
#endif
        pluginImporter.SetPlatformData(UnityEditor.BuildTarget.StandaloneLinux64, "CPU", isLinux && isX64 ? "x86_64" : "None");
        pluginImporter.SetPlatformData(UnityEditor.BuildTarget.StandaloneWindows, "CPU", isWindows && isX86 ? "AnyCPU" : "None");
        pluginImporter.SetPlatformData(UnityEditor.BuildTarget.StandaloneWindows64, "CPU", isWindows && isX64 ? "AnyCPU" : "None");
        pluginImporter.SetPlatformData(UnityEditor.BuildTarget.StandaloneOSX, "CPU", isMac ? "AnyCPU" : "None");
    }
    private static string[] getPluginInfoFromPath(string path)
    {
        var indexOfPluginFolder = path.IndexOf(PuertsPluginFolder, System.StringComparison.OrdinalIgnoreCase);
        if (indexOfPluginFolder == -1)
        {
            return null;
        }

        return path.Substring(indexOfPluginFolder + PuertsPluginFolder.Length + 1).Split('/');
    }
    public static List<UnityEditor.PluginImporter> getPuertsPluginImporters(UnityEditor.BuildTarget[] targetPlatforms)

    {

        UnityEditor.PluginImporter[] pluginImporters = UnityEditor.PluginImporter.GetAllImporters();

        List<UnityEditor.PluginImporter> puertsPlugins = new List<UnityEditor.PluginImporter>();
        string filterPath = "com.tencent.puerts.core/Runtime/Plugins";


        foreach (var pluginImporter in pluginImporters)
        {
            if (targetPlatforms != null)
            {
                for (int i = 0; i < targetPlatforms.Length; i++)
                {
                    string platformName = getBuildTargetPlatformName(targetPlatforms[i]);
                    string platformFilterPath = filterPath + "/" + platformName;
                    if (pluginImporter.assetPath.Contains(platformFilterPath))
                    {
                        puertsPlugins.Add(pluginImporter);
                    }
                }
            }
            else
            {
                if (pluginImporter.assetPath.Contains(filterPath))
                {
                    puertsPlugins.Add(pluginImporter);
                }
            }


        }
        return puertsPlugins;
    }

    private static void activatePluginByEngineType(PuertsBackEndType type, bool updateMenu = true)
    {
        if (UnityEngine.Application.isPlaying)
        {
            Debug.LogWarning("[Puerts]can not change Plugin in play mode");
            return;
        }
        var activatedBackEnd = activatePluginsForEditor(type);
        if (activatedBackEnd)
        {
            EditorBackEndTypeSetting.setCurEditorEngineType(type);
            if (updateMenu) updateMenuItemState(type);
        }

    }
    private static void updateMenuItemState(PuertsBackEndType type)
    {

        SetChecked(PuertsBackEndType.Nodejs, type);
        SetChecked(PuertsBackEndType.Quickjs, type);
        SetChecked(PuertsBackEndType.V8_Debug, type);
        SetChecked(PuertsBackEndType.V8_Release, type);
    }
    private static void SetChecked(PuertsBackEndType menuType, PuertsBackEndType targetType)
    {

        UnityEditor.Menu.SetChecked(MENU_PATH + menuType, menuType == targetType);
    }
    [UnityEditor.MenuItem(MENU_PATH + "DiableAll", false)]
    public static void deactivateAllPlugins()
    {
        var importers = getPuertsPluginImporters(null);
        var platforms = new BuildTarget[] {
            BuildTarget.Android,
            BuildTarget.iOS,
            BuildTarget.WebGL,
            BuildTarget.StandaloneWindows,
            BuildTarget.StandaloneWindows64,
            BuildTarget.StandaloneOSX,
            BuildTarget.StandaloneLinux64
        };
        foreach (var pluginImporter in importers)
        {
            //var assetPath = pluginImporter.assetPath;
            var isChanged = false;

            var isAny = pluginImporter.GetCompatibleWithAnyPlatform();
            if (isAny)
            {
                pluginImporter.SetCompatibleWithAnyPlatform(false);
            }
            var isForEditor = pluginImporter.GetCompatibleWithEditor();
            if (isForEditor)
            {
                pluginImporter.SetCompatibleWithEditor(false);

            }
            for (int i = 0; i < platforms.Length; i++)
            {
                var platformTarget = platforms[i];
                if (pluginImporter.GetCompatibleWithPlatform(platformTarget))
                {
                    pluginImporter.SetCompatibleWithPlatform(platformTarget, false);
                    isChanged = true;
                }
            }


            if (isChanged)
            {
                pluginImporter.isPreloaded = false;
                pluginImporter.SaveAndReimport();
            }

        }
    }
    private static void deactivateEditorPlugins()
    {
        var importers = getPuertsPluginImporters(null);
        foreach (var pluginImporter in importers)
        {
            //var assetPath = pluginImporter.assetPath;
            pluginImporter.SetCompatibleWithAnyPlatform(false);
            pluginImporter.SetCompatibleWithEditor(false);
            pluginImporter.isPreloaded = false;
        }
    }
    [UnityEditor.MenuItem(MENU_PATH + "Nodejs", false)]
    public static void ActivateNodejs()
    {
        activatePluginByEngineType(PuertsBackEndType.Nodejs);
    }
    [UnityEditor.MenuItem(MENU_PATH + "Quickjs")]
    public static void ActivateQuickjs()
    {
        activatePluginByEngineType(PuertsBackEndType.Quickjs);
    }
    [UnityEditor.MenuItem(MENU_PATH + "V8_Debug")]
    public static void ActivateV8_Debug()
    {
        activatePluginByEngineType(PuertsBackEndType.V8_Debug);
    }
    [UnityEditor.MenuItem(MENU_PATH + "V8_Release")]
    public static void ActivateV8_Release()
    {
        activatePluginByEngineType(PuertsBackEndType.V8_Release);

    }
}
#endif


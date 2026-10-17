#if UNITY_EDITOR
using System;
using System.IO;
using UnityEditor;
using UnityEditor.Callbacks;
using UnityEngine;

public static class CopyPuertsPythonRuntimePostBuild
{
    [PostProcessBuild(999)]
    public static void OnPostprocessBuild(BuildTarget target, string buildPath)
    {
        string sourceRelativePath = null;
        string destinationRelativePath = null;


        switch (target)
        {
            case BuildTarget.StandaloneOSX:
                // TODO
                break;
            case BuildTarget.StandaloneWindows64:
                sourceRelativePath = "Plugins/x86_64";
                destinationRelativePath = "Plugins/x86_64";
                break;
            default:
                break;
        }

        if (sourceRelativePath == null || destinationRelativePath == null)
        {
            Debug.Log($"[PuertsPythonCopy] Skip target={target}, no configuration for this platform.");
            return;
        }

        var productName = Path.GetFileNameWithoutExtension(buildPath);

        const string packageName = "com.tencent.puerts.python";
        var pi = UnityEditor.PackageManager.PackageInfo.FindForPackageName(packageName);
        string packagePath = null;
        if (pi != null && !string.IsNullOrEmpty(pi.resolvedPath))
        {
            packagePath = pi.resolvedPath;
        }

        try
        {
            if (string.IsNullOrEmpty(packagePath))
            {
                Debug.LogWarning($"[PuertsPythonCopy] Package not found: {packagePath}");
                return;
            }

            var sourceDir = Path.GetFullPath(Path.Combine(packagePath, sourceRelativePath));
            if (!Directory.Exists(sourceDir))
            {
                Debug.LogWarning($"[PuertsPythonCopy] Source directory not found: {sourceDir}");
                return;
            }

            var targetDir = Path.Combine(Path.GetDirectoryName(buildPath), $"{productName}_Data", destinationRelativePath);


            switch (target)
            {
                case BuildTarget.StandaloneOSX:
                    // TODO
                    break;
                case BuildTarget.StandaloneWindows64:
                    string[] patterns = new[] { "LICENSE.txt", "*.pyd", "python.cat", "python.exe", "pythonw.exe", "python3*._pth", "python3*.zip" };
                    foreach (string pattern in patterns)
                    {
                        foreach (var file in Directory.GetFiles(sourceDir, pattern))
                        {
                            var destFile = Path.Combine(targetDir, Path.GetFileName(file));
                            File.Copy(file, destFile, true);
                        }
                    }
                    break;
                default:
                    break;
            }


        }
        catch (Exception ex)
        {
            Debug.LogError("[PuertsPythonCopy] Failed: " + ex);
        }
    }
}
#endif
/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#if UNITY_EDITOR && !PUERTS_GENERAL && !PUERTS_NUGET
using System.IO;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEngine;

namespace Puerts.Editor
{
    // Copies the bundled python home (PythonHome~/<rid>, ignored by Unity's asset import) into the
    // StreamingAssets/PuertsPython folder of a desktop player, where BackendPython.ResolvePythonHome looks for it.
    // The native libraries (PapiPython, libpython3.X.dylib on macOS) are regular plugins and are handled by Unity.
    public class PythonBuildProcessor : IPostprocessBuildWithReport
    {
        public int callbackOrder { get { return 0; } }

        static string GetRid(BuildTarget target)
        {
            switch (target)
            {
                case BuildTarget.StandaloneWindows64: return "win-x64";
                case BuildTarget.StandaloneLinux64: return "linux-x64";
                case BuildTarget.StandaloneOSX: return "osx-arm64";
                default: return null;
            }
        }

        static string GetStreamingAssetsDir(BuildTarget target, string outputPath)
        {
            if (target == BuildTarget.StandaloneOSX)
            {
                // Tester.app/Contents/Resources/Data/StreamingAssets
                return Path.Combine(outputPath, "Contents", "Resources", "Data", "StreamingAssets");
            }
            // Tester.exe / Tester.x86_64 -> Tester_Data/StreamingAssets
            return Path.Combine(Path.GetDirectoryName(outputPath), Path.GetFileNameWithoutExtension(outputPath) + "_Data", "StreamingAssets");
        }

        static void CopyDirectory(string src, string dst)
        {
            Directory.CreateDirectory(dst);
            foreach (var file in Directory.GetFiles(src))
            {
                File.Copy(file, Path.Combine(dst, Path.GetFileName(file)), true);
            }
            foreach (var dir in Directory.GetDirectories(src))
            {
                CopyDirectory(dir, Path.Combine(dst, Path.GetFileName(dir)));
            }
        }

        public void OnPostprocessBuild(BuildReport report)
        {
            var target = report.summary.platform;
            var rid = GetRid(target);
            if (rid == null) return;

            var packageRoot = BackendPython.FindPackageRoot();
            if (packageRoot == null)
            {
                Debug.LogWarning("[Puerts] can not find the com.tencent.puerts.python package, bundled python is not copied");
                return;
            }
            var src = Path.Combine(packageRoot, "PythonHome~", rid);
            if (!Directory.Exists(src))
            {
                Debug.LogWarning("[Puerts] bundled python not found at " + src + ", the player will use the default python initialization");
                return;
            }

            var dst = Path.Combine(GetStreamingAssetsDir(target, report.summary.outputPath), BackendPython.PlayerPythonHomeDirName);
            if (Directory.Exists(dst)) Directory.Delete(dst, true);
            CopyDirectory(src, dst);
            Debug.Log("[Puerts] copied bundled python " + rid + " to " + dst);
        }
    }
}
#endif

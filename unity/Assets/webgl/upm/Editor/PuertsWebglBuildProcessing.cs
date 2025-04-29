using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using System.IO;
using System.Collections.Generic;

public class PuertsWebglBuildProcessing : IPreprocessBuildWithReport, IPostprocessBuildWithReport
{
    public int callbackOrder => 1;
    public void OnPreprocessBuild(BuildReport report)
    {
        //#if UNITY_EDITOR && UNITY_EDITOR_OSX
        //        System.Environment.SetEnvironmentVariable("EMSDK_PYTHON", "/Library/Frameworks/Python.framework/Versions/3.10/bin/python3");
        //#endif

#if UNITY_WEBGL
        if (string.IsNullOrEmpty(PlayerSettings.WebGL.emscriptenArgs))
        {
            PlayerSettings.WebGL.emscriptenArgs = "-s ALLOW_TABLE_GROWTH=1";
        }
        else if (!PlayerSettings.WebGL.emscriptenArgs.Contains("-s ALLOW_TABLE_GROWTH=1"))
        {
            PlayerSettings.WebGL.emscriptenArgs += " -s ALLOW_TABLE_GROWTH=1";
        }
#endif
    }

    public void OnPostprocessBuild(BuildReport report)
    {
#if UNITY_WEBGL
#if UNITY_2022_1_OR_NEWER
        foreach(var file in report.GetFiles())
#else
        foreach (var file in report.files)
#endif
        {
            if (file.path.EndsWith("index.html"))
            {
                string indexContent = File.ReadAllText(file.path);
                if (!indexContent.Contains("puerts-runtime.js") || !indexContent.Contains("puerts_browser_js_resources.js"))
                {
                    UnityEngine.Debug.Log("inject to " + file.path);
                    int pos = indexContent.IndexOf("</head>");
                    indexContent = indexContent.Substring(0, pos) + "  <script src=\"./puerts-runtime.js\"></script>\n    <script src=\"./puerts_browser_js_resources.js\"></script>" + indexContent.Substring(pos);
                    File.WriteAllText(file.path, indexContent);
                }
                PackJsResources(System.IO.Path.GetDirectoryName(file.path));
            }
        }
#endif
    }

#if UNITY_WEBGL
    [MenuItem("Tools/PuerTS/WebGLBuildTarget/Browser", false, 30)]
    private static void SetWebglBuildTargetToBrowser()
    {
        EditorPrefs.SetString("PuerTS.WebGLBuildTarget", "Browser");
        //EditorApplication.ExecuteMenuItem("File/Save Project");
    }

    [MenuItem("Tools/PuerTS/WebGLBuildTarget/Browser", true)]
    private static bool ValidateBrowserTarget()
    {
        var currentTarget = EditorPrefs.GetString("PuerTS.WebGLBuildTarget", "Browser");
        Menu.SetChecked("Tools/PuerTS/WebGLBuildTarget/Browser", currentTarget == "Browser");
        return true;
    }

    [MenuItem("Tools/PuerTS/WebGLBuildTarget/MiniGame", false, 31)]
    private static void SetWebglBuildTargetToMiniGame()
    {
        EditorPrefs.SetString("PuerTS.WebGLBuildTarget", "MiniGame");
        //EditorApplication.ExecuteMenuItem("File/Save Project");
    }

    [MenuItem("Tools/PuerTS/WebGLBuildTarget/MiniGame", true)]
    private static bool ValidateMiniGameTarget()
    {
        var currentTarget = EditorPrefs.GetString("PuerTS.WebGLBuildTarget", "Browser");
        Menu.SetChecked("Tools/PuerTS/WebGLBuildTarget/MiniGame", currentTarget == "MiniGame");
        return true;
    }

    private void PackJsResources(string dir)
    {
        UnityEngine.Debug.Log("Pack JavaScript Resources to " + dir);
        var currentTarget = EditorPrefs.GetString("PuerTS.WebGLBuildTarget", "Browser");
        string output = currentTarget == "Browser" ? dir : Path.Join(dir, "../minigame");
        if (!Directory.Exists(output)) Directory.CreateDirectory(output);
        File.Copy(Path.GetFullPath("Packages/com.tencent.puerts.webgl/Javascripts~/PuertsDLLMock/dist/puerts-runtime.js"), Path.Join(output, "puerts-runtime.js"), true);

        List<string> resourcesPattens = new List<string>
        {
            UnityEngine.Application.dataPath + "/**/Resources/**/*.mjs",
            UnityEngine.Application.dataPath + "/**/Resources/**/*.cjs",
            Path.GetFullPath("Packages/com.tencent.puerts.core/") + "/**/Resources/**/*.mjs"
        };

        var unittestPath = Path.GetFullPath("Packages/com.tencent.puerts.unittest/");
        if (!string.IsNullOrEmpty(unittestPath))
        {
            resourcesPattens.AddRange(new string[]
            {
                unittestPath + "/**/Resources/**/*.mjs",
                unittestPath + "/**/Resources/**/*.cjs",
                unittestPath + "/**/Resources/**/*.js.txt",
            });
        }

        // Build node command
        var command = currentTarget == "Browser" ? "buildForBrowser" : "buildForMinigame";
        var args = Path.GetFullPath("Packages/com.tencent.puerts.webgl/Cli/Javascripts~/index.js") + " " + command + " -p " + string.Join(" ", resourcesPattens.ConvertAll(p => 
            "\"" + p.Replace("\\", "/") + "\"")) + " -o \"" + output + "\"";
        UnityEngine.Debug.Log("executing cmd: node " + args);

        // Start node process
        var startInfo = new System.Diagnostics.ProcessStartInfo()
        {
            FileName = "node",
            Arguments = args,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using (var process = System.Diagnostics.Process.Start(startInfo))
        {
            process.OutputDataReceived += (sender, e) => 
            {
                if (!string.IsNullOrEmpty(e.Data))
                    UnityEngine.Debug.Log(e.Data);
            };
            process.ErrorDataReceived += (sender, e) => 
            {
                if (!string.IsNullOrEmpty(e.Data))
                    UnityEngine.Debug.LogError(e.Data);
            };
            
            process.BeginOutputReadLine();
            process.BeginErrorReadLine();
            process.WaitForExit();
            
            if (process.ExitCode != 0)
            {
                UnityEngine.Debug.LogError($"Node process exited with code: {process.ExitCode}");
            }
        }
    }
#endif
}
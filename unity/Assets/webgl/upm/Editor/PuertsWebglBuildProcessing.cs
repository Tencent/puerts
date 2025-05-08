using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using System.IO;
using System.Collections.Generic;
using System;
using UnityEngine;

public class PuertsWebglBuildProcessing : IPreprocessBuildWithReport, IPostprocessBuildWithReport
{
    public int callbackOrder => 2;
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

    static Type GetWXConvertCoreType()
    {
        try
        {
            var WxEditor = System.Reflection.Assembly.Load("WxEditor");
            return (WxEditor != null) ? WxEditor.GetType("WeChatWASM.WXConvertCore", false) : null;
        }
        catch { }
        return null;
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
                var dir = System.IO.Path.GetDirectoryName(file.path);
                if (GetWXConvertCoreType() == null)
                {
                    PackJsResources("Browser", dir);
                }
                else
                {
                    if (StartWXMiniGameByPuerts)
                    {
                        LastBuildPath = Path.GetFullPath(Path.Join(dir, "../minigame"));
                        //UnityEngine.Debug.Log("[PuerTs] Set BuildPath for Weixin MiniGame: " + LastBuildPath);
                    }
                    else
                    {
                        UnityEngine.Debug.LogWarning("[PuerTs] Please use 'Tools/PuerTS/Export WXMiniGame'") ;
                        PackJsResources("Browser", dir);
                    }
                }
            }
        }
#endif
    }

#if UNITY_WEBGL
    private static string LastBuildPath = "";

    private static bool StartWXMiniGameByPuerts = false;

    [MenuItem("Tools/PuerTS/Export WXMiniGame", false, 0)]
    static void ExportWXMiniGame()
    {
        StartWXMiniGameByPuerts = true;
        try
        {
            var typeOfWXConvertCore = GetWXConvertCoreType();
            var methodDoExport = typeOfWXConvertCore.GetMethod("DoExport");
            var ret = methodDoExport.Invoke(null, new object[] { true });
            var code = System.Convert.ChangeType(ret, typeof(int));
            UnityEngine.Debug.Log("DoExport ret " + ret + " code " + code);
            if (ret.ToString().Contains("SUCCEED") || (code != null && (int)code == 0))
            {
                PackJsResources("MiniGame", LastBuildPath);
            }
        }
        finally
        {
            StartWXMiniGameByPuerts = false;
        }
    }

    [MenuItem("Tools/PuerTS/Export WXMiniGame", true)]
    static bool WXConvertToolInstalled()
    {
        return GetWXConvertCoreType() != null;
    }

    private static void PackJsResources(string currentTarget, string output)
    {
        Debug.Log("[PuerTs] >>>> Pack JavaScript Resources to " + output);

        if (!Directory.Exists(output)) Directory.CreateDirectory(output);

        File.Copy(Path.GetFullPath("Packages/com.tencent.puerts.webgl/Javascripts~/PuertsDLLMock/dist/puerts-runtime.js"), Path.Join(output, "puerts-runtime.js"), true);

        List<string> resourcesPattens = new List<string>
        {
            Application.dataPath + "/**/Resources/**/*.mjs",
            Application.dataPath + "/**/Resources/**/*.cjs",
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
        var executeFileName = "node";

#if !UNITY_EDITOR_WIN
        string userHome = Environment.GetEnvironmentVariable("HOME");
        string nvmScriptPath = $"{userHome}/.nvm/nvm.sh";
        if (File.Exists(nvmScriptPath))
        {
            args = "-c 'source \"" + nvmScriptPath + "\" && node " + args + "'";
            executeFileName = "bash";
        }
#endif
        Debug.Log("executing cmd: " + executeFileName + " " + args);

        // Start node process
        var startInfo = new System.Diagnostics.ProcessStartInfo()
        {
            FileName = executeFileName,
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

        if (currentTarget != "Browser")
        {
            string entryPath = Path.Join(output, "game.js");
            string entryContent = File.ReadAllText(entryPath);
            if (!entryContent.Contains("puerts-runtime.js"))
            {
                UnityEngine.Debug.Log("[PuerTs] >>>> inject to " + entryPath);
                int pos = entryContent.IndexOf("import");
                entryContent = entryContent.Substring(0, pos) + "import 'puerts-runtime.js';\n" + entryContent.Substring(pos);
                File.WriteAllText(entryPath, entryContent);
            }
        }
        else
        {
            string indexPath = Path.Join(output, "index.html");
            string indexContent = File.ReadAllText(indexPath);
            if (!indexContent.Contains("puerts-runtime.js") || !indexContent.Contains("puerts_browser_js_resources.js"))
            {
                UnityEngine.Debug.Log("[PuerTs] >>>> inject to " + indexPath);
                int pos = indexContent.IndexOf("</head>");
                indexContent = indexContent.Substring(0, pos) + "  <script src=\"./puerts-runtime.js\"></script>\n    <script src=\"./puerts_browser_js_resources.js\"></script>" + indexContent.Substring(pos);
                File.WriteAllText(indexPath, indexContent);
            }
        }
    }
#endif
    }
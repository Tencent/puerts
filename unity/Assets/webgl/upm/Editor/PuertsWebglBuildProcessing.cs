using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;

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
            PlayerSettings.WebGL.emscriptenArgs += "-s ALLOW_TABLE_GROWTH=1";
        }
#endif
    }

    public void OnPostprocessBuild(BuildReport report)
    {
#if UNITY_WEBGL
        foreach(var file in report.GetFiles())
        {
            if (file.path.EndsWith("index.html"))
            {
                string indexContent = System.IO.File.ReadAllText(file.path);
                if (!indexContent.Contains("puerts-runtime.js") || !indexContent.Contains("puerts_browser_js_resources.js"))
                {
                    UnityEngine.Debug.Log("inject to " + file.path);
                    int pos = indexContent.IndexOf("</head>");
                    indexContent = indexContent.Substring(0, pos) + "  <script src=\"./puerts-runtime.js\"></script>\n    <script src=\"./puerts_browser_js_resources.js\"></script>" + indexContent.Substring(pos);
                    System.IO.File.WriteAllText(file.path, indexContent);
                }
            }
        }
#endif
    }
}
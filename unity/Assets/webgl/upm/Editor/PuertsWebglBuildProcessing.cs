using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;

public class PuertsWebglBuildProcessing : IPreprocessBuildWithReport
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
}
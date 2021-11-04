using UnityEngine;
using UnityEditor;
using UnityEditor.Callbacks;
using Puerts;
using System;

public class WebGLPuertsPostProcessor {
    protected static string lastBuiltPath = null;
    [PostProcessBuildAttribute(1)]
    public static void OnPostprocessBuild(BuildTarget target, string pathToBuiltProject) 
    {
        if (target == BuildTarget.WebGL) 
        {
            lastBuiltPath = pathToBuiltProject;
            UnityEngine.Debug.Log("构建成功，请用puerts-webgl/build js构建js资源");
        }
    }

    [MenuItem("puerts-webgl/build js")]
    static void test() 
    {
        if (lastBuiltPath != null) {
            UnityEngine.Debug.Log("上一次构建路径：" + lastBuiltPath);
            JsEnv jsenv = new JsEnv();
            try {
                Action<string> postProcess = jsenv.Eval<Action<string>>(@"
                    const mod = require('puerts/webglprocess.js');
                    mod.buildjs;
                ");
                postProcess(lastBuiltPath);
            } 
            catch(Exception e) 
            {
                UnityEngine.Debug.LogError(e);
            }
            jsenv.Dispose();

        } else {
            UnityEngine.Debug.Log("上一次构建路径为空");
        }
    }
}
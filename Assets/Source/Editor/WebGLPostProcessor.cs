using UnityEngine;
using UnityEditor;
using UnityEditor.Callbacks;
using Puerts;
using System;

public class WebGLPuertsPostProcessor {
    protected static string _lastBuiltPath = null;
    [PostProcessBuildAttribute(1)]
    public static void OnPostprocessBuild(BuildTarget target, string pathToBuiltProject) 
    {
        if (target == BuildTarget.WebGL) 
        {
            _lastBuiltPath = pathToBuiltProject;
            UnityEngine.Debug.Log("构建成功，请用puerts-webgl/build js构建js资源");
        }
    }

    private static void run(string runEntry, string lastBuiltPath) 
    {
        string PuertsWebglJSRoot = Application.dataPath + "/../puerts-webgl/";
        if (lastBuiltPath != null) {
            UnityEngine.Debug.Log("上一次构建路径：" + lastBuiltPath);

        } else {
            lastBuiltPath = PuertsWebglJSRoot + "dist/";
            UnityEngine.Debug.Log("上一次构建路径为空，生成至：" + lastBuiltPath);
        }
        JsEnv jsenv = new JsEnv();
        // JsEnv jsenv = new JsEnv(new DefaultLoader(), 9222);
        // jsenv.WaitDebugger();

        Action postProcess = jsenv.Eval<Action>(@"
            (function() {
                const nodeModuleRequire = require('module').createRequire('" + PuertsWebglJSRoot + @"')
                const cp = require('child_process');
                const mkdirp = nodeModuleRequire('mkdirp');
                const csharp = puertsRequire('csharp');

                try {
                    const build = require('" + PuertsWebglJSRoot + @"/build.js');
                    build('" + lastBuiltPath + @"');
                    nodeModuleRequire('./glob-js/index.js')." + runEntry + @"('" + lastBuiltPath + @"');
                } catch(e) {
                    console.log(e.stack);
                    return;
                }
            })
        ");
        
        try {
            postProcess();
        } 
        catch(Exception e) 
        {
            UnityEngine.Debug.LogError(e);
        }
        jsenv.Dispose();
    }

    [MenuItem("puerts-webgl/build puerts-js for minigame")]
    static void minigame() 
    {
        run("buildForMinigame", _lastBuiltPath != null ? _lastBuiltPath + "/../minigame" : null);
    }

    [MenuItem("puerts-webgl/build puerts-js for browser")]
    static void browser() 
    {
        run("buildForBrowser", _lastBuiltPath);
    }
}
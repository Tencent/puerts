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
        try {
            Action<string> postProcess = jsenv.Eval<Action<string>>(@"
                (function() {
                    const nodeModuleRequire = require('module').createRequire('" + PuertsWebglJSRoot + @"')
                    const cp = require('child_process');
                    const mkdirp = nodeModuleRequire('mkdirp');
                    var csharp = puertsRequire('csharp')
                    try {
                        mkdirp.sync('" + lastBuiltPath + @"')
                        cp.execSync('npm run build && mv ./PuertsDLLMock/dist/puerts-runtime.js " + lastBuiltPath + @"', {
                            cwd: '" + PuertsWebglJSRoot + @"'
                        });
                    } catch(e) {
                        csharp.UnityEngine.Debug.Log(e.stdout.toString());
                        csharp.UnityEngine.Debug.LogError(e.stderr.toString());
                        return;
                    }

                    return nodeModuleRequire('./glob-js/index.js')." + runEntry + @";
                })()
            ");
            postProcess(lastBuiltPath);
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
#if UNITY_EDITOR
using System;
using System.IO;
using System.Collections.Generic;

namespace Puerts
{
    public class TSCompiler
    {
        Func<string, string> emitTSFile;
        public TSCompiler(string tsRootPath)
        {
            var env = new JsEnv();
            env.UsingFunc<string, string>();
            env.UsingAction<string, string>();
            env.Eval<Action<string, string>>(@"(function (tsRootPath, requirePath) { 
                global.require = require('node:module').createRequire(requirePath + '/')
                if (!require('node:fs').existsSync(requirePath + '/node_modules')) {
                    throw new Error(`node_modules is not installed, please run 'npm install' in ${requirePath}`);
                }
                global.tsRootPath = tsRootPath
            })")(tsRootPath, Path.GetFullPath("Packages/com.tencent.puerts.ts-loader/Javascripts~"));

            emitTSFile = env.Eval<Func<string, string>>(@"
                (function() {
                    const Transpiler = require('.').default;
                    const transpiler = new Transpiler(global.tsRootPath);

                    return function(tsFilePath) {
                        return transpiler.transpile(tsFilePath);
                    }
                })()
            ");
        }

        public string EmitTSFile(string tsPath) 
        {
            var ret = emitTSFile(tsPath);
            return ret;
        }
    }
}
#endif
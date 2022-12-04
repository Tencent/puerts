#if UNITY_EDITOR
using System;
using System.IO;
using System.Collections.Generic;

namespace Puerts
{
    public class TSCompiler
    {
        Func<string, string> emitTSFile;
        public TSCompiler()
        {
            var env = new JsEnv();
            env.UsingFunc<string, string>();
            env.UsingAction<string>();
            env.Eval<Action<string>>(@"(function (requirePath) { 
                global.require = require('node:module').createRequire(requirePath + '/')
            })")(Path.GetFullPath("Packages/com.tencent.puerts.ts-loader/Javascripts~"));

            emitTSFile = env.Eval<Func<string, string>>(@"
                (function() {
                    const Transpiler = require('./swc').default;
                    const transpiler = new Transpiler();

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
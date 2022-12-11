using UnityEngine;
using System.Linq;
#if UNITY_EDITOR
using System.IO;
using System.Collections.Generic;
#endif

namespace Puerts
{
    public class TSLoader : Puerts.ILoader, Puerts.IModuleChecker
    {
        Puerts.DefaultLoader puerDefaultLoader;
#if UNITY_EDITOR
            protected TSCompiler tsCompiler;
#endif
        public TSLoader()
        {
            puerDefaultLoader = new Puerts.DefaultLoader();
#if UNITY_EDITOR
                tsCompiler = new TSCompiler(Application.dataPath + "/../Puer-Project");
#endif
        }

        public bool IsESM(string path)
        {
            return !path.EndsWith(".cjs");
        }

        public virtual string Resolve(string specifier)
        {

#if UNITY_EDITOR
                if (!specifier.EndsWith(".cjs")) {
                    var trySpecifier = !specifier.EndsWith("ts") && !specifier.EndsWith("js") ? specifier + ".ts" : specifier;
                    var filePath = System.IO.Path.Combine(Application.dataPath, "../Puer-Project/" + trySpecifier);
                    if (System.IO.File.Exists(filePath)) {
                        return filePath;
                    }
#else
            if (specifier.EndsWith(".ts") || specifier.EndsWith(".mts"))
            {
                specifier = specifier.Replace(".mts", ".mjs").Replace(".ts", ".js");
#endif
            }

            return puerDefaultLoader.FileExists(specifier) ? specifier : null;
        }

        public bool FileExists(string filename)
        {
            var resolveResult = Resolve(filename);
            return resolveResult != null && resolveResult != "";
        }

        public virtual string ReadFile(string specifier, out string debugpath)
        {
#if UNITY_EDITOR
                if (!specifier.EndsWith(".cjs")) {
                    string filepath = Resolve(specifier);
                    if (filepath.EndsWith("ts")) {
                        debugpath = "";
                        var ret = tsCompiler.EmitTSFile(filepath);
                        return ret;
                    }
                }
#endif
            return puerDefaultLoader.ReadFile(specifier, out debugpath);
        }
    }
}
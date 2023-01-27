using UnityEngine;
using System;
using System.Linq;
#if UNITY_EDITOR
using System.IO;
using System.Collections.Generic;
using UnityEditor;
using System.Reflection;
#endif

namespace Puerts
{
#if UNITY_EDITOR
    [InitializeOnLoad]
    public class TSDirectoryCollector
    {
        protected static Dictionary<string, TSCompiler> tsCompilers = new Dictionary<string, TSCompiler>();

        protected static string GetCurrentFolder()
        {
            Type projectWindowUtilType = typeof(ProjectWindowUtil);
            MethodInfo getActiveFolderPath = projectWindowUtilType.GetMethod("GetActiveFolderPath", BindingFlags.Static | BindingFlags.NonPublic);
            object obj = getActiveFolderPath.Invoke(null, new object[0]);
            string pathToCurrentFolder = obj.ToString();
            return pathToCurrentFolder;
        }

        [MenuItem("Assets/PuerTS/Create Typescript File(ESM)")]
        public static void CreateMTS()
        {
            System.IO.File.WriteAllText(
                System.IO.Path.Combine(Application.dataPath, "..", GetCurrentFolder(), "script.mts"),
                @"export default 'hello world'"
            );
            AssetDatabase.Refresh();
        }
        [MenuItem("Assets/PuerTS/Create tsconfig.json")]
        public static void CreateTSConfig()
        {
            System.IO.File.WriteAllText(
                System.IO.Path.Combine(Application.dataPath, "..", GetCurrentFolder(), "tsconfig.json"),
                @"
{
    ""compilerOptions"": { 
        ""target"": ""esnext"",
        ""module"": ""ES2015"",
        ""jsx"": ""react"",
        ""inlineSourceMap"": true,
        ""moduleResolution"": ""node"",
        ""experimentalDecorators"": true,
        ""noImplicitAny"": true,
        ""typeRoots"": [
        ],
    }
}"
            );
            AssetDatabase.Refresh();
        }

        static TSDirectoryCollector() 
        {
            var tsConfigList = AssetDatabase
                .FindAssets("tsconfig t:textAsset")
                .Select(guid => AssetDatabase.GUIDToAssetPath(guid))
                .Where(path=> path.Contains("/tsconfig.json"));
            foreach (var tsConfigPath in tsConfigList)
            {
                var absPath = Application.dataPath + "/../" + tsConfigPath;
                AddTSCompiler(System.IO.Path.GetDirectoryName(tsConfigPath));
            }
        }

        public static void AddTSCompiler(string absPath)
        {
            tsCompilers[absPath] = new TSCompiler(absPath);
        }

        public static string TryGetFullTSPath(string specifier) 
        {
            foreach (KeyValuePair<string, TSCompiler> item in tsCompilers)
            {
                string tryPath = System.IO.Path.Combine(item.Key, specifier);
                // UnityEngine.Debug.Log($"System.IO.File.Exists {tryPath} " + System.IO.File.Exists(tryPath));
                if (System.IO.File.Exists(tryPath)) {
                    return tryPath;
                }
            }
            return null;
        }

        public static string EmitTSFile(string absPath) 
        {
            foreach (KeyValuePair<string, TSCompiler> item in tsCompilers)
            {
                if (absPath.Contains(item.Key)) {
                    return item.Value.EmitTSFile(absPath);
                }
            }
            throw new Exception("emit tsfile " + absPath + " failed: not found");
            return null;
        }
    }
#endif

    public class TSLoader : Puerts.ILoader, Puerts.IModuleChecker
    {
        Puerts.DefaultLoader puerDefaultLoader;

        public TSLoader(string additionalBasePath): this(new string[]{ additionalBasePath }) {}

        public TSLoader(string[] additionalBasePath = null)
        {
            puerDefaultLoader = new Puerts.DefaultLoader();
#if UNITY_EDITOR
            if (additionalBasePath != null)
            {   
                foreach(string path in additionalBasePath)
                {
                    TSDirectoryCollector.AddTSCompiler(path);
                }
            }
#endif
        }

        public bool IsESM(string path)
        {
            return !path.EndsWith(".cjs") && !path.EndsWith(".cts");
        }

        public virtual string Resolve(string specifier)
        {
#if UNITY_EDITOR
            string tryPath = TSDirectoryCollector.TryGetFullTSPath(specifier);
            if (tryPath != null) return tryPath;

            if (specifier.EndsWith("js"))
            {
                tryPath = TSDirectoryCollector.TryGetFullTSPath(specifier.Substring(0, specifier.Length - 2) + "ts");
                if (tryPath != null) return tryPath;
            }

            tryPath = TSDirectoryCollector.TryGetFullTSPath(specifier + ".ts");
            if (tryPath != null) return tryPath;
#else
            if (specifier.EndsWith(".ts") || specifier.EndsWith(".mts"))
            {
                specifier = specifier.Replace(".mts", ".mjs").Replace(".ts", ".js");
            }
#endif

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
            string filepath = Resolve(specifier);
            if (filepath.EndsWith("ts")) {
                debugpath = ""; 
                var content = TSDirectoryCollector.EmitTSFile(filepath);
                return content; 
            } 
#endif
            return puerDefaultLoader.ReadFile(specifier, out debugpath);
        }
    }
}
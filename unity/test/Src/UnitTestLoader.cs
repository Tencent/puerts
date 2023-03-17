using System.IO;
using System.Reflection;
using System.Collections.Generic;
using Puerts;

namespace Puerts.UnitTest 
{
    public class UnitTestLoader : ILoader
    {
        private string FixSpecifier(string specifier)
        {
            return 
            // .cjs/.mjs asset is only supported in unity2018+
    #if UNITY_2018_1_OR_NEWER
            specifier.EndsWith(".cjs") || specifier.EndsWith(".mjs")  ? 
                specifier.Substring(0, specifier.Length - 4) : 
    #endif
                specifier;
        }

//         /**
//         * 判断文件是否存在，并返回调整后文件标识符，供ReadFile使用。
//         * localFilePath为文件本地路径，调试器调试时会使用。
//         */
// #if EXPERIMENTAL_IL2CPP_PUERTS && ENABLE_IL2CPP
//         public override string Resolve(string specifier)
//         {
//             string path = UnityEngine.Application.streamingAssetsPath + "/" + specifier;
//             if (System.IO.File.Exists(path)) {
//                 return path;
//             }
//             else if (mockFileContent.ContainsKey(specifier)) 
//             {
//                 return "mock/" + specifier;
//             } 
//             else if (UnityEngine.Resources.Load(FixSpecifier(specifier)) != null) 
//             {
//                 return "resources/" + FixSpecifier(specifier);
//             }
//             return null;
//         }
// #else
        [UnityEngine.Scripting.Preserve]
        public bool FileExists(string specifier)
        {
            string path = UnityEngine.Application.streamingAssetsPath + "/" + specifier;
            if (System.IO.File.Exists(path))
            {
                return true;
            }
            else if (mockFileContent.ContainsKey(specifier)) 
            {
                return true;
            } 
            else if (UnityEngine.Resources.Load(FixSpecifier(specifier)) != null) 
            {
                return true;
            }
            return false;
        }
// #endif

// #if EXPERIMENTAL_IL2CPP_PUERTS && ENABLE_IL2CPP
//         public override void ReadFile(string specifier, out string content)
//         {
//             if (specifier != null) {    
//                 if (specifier.StartsWith(UnityEngine.Application.streamingAssetsPath)) {
//                     content = System.IO.File.ReadAllText(specifier);
//                     return;
//                 } else if (specifier.StartsWith("mock/")) {
//                     content = mockFileContent[specifier.Substring(5)];
//                     return;

//                 } else if (specifier.StartsWith("resources/")) {
//                     content = UnityEngine.Resources.Load<UnityEngine.TextAsset>(specifier.Substring(10)).text;
//                     return;
//                 }
//             } 
//             content = "";
//         }
// #else
        [UnityEngine.Scripting.Preserve]
        public string ReadFile(string specifier, out string debugpath)
        {
            debugpath = "";
            if (specifier != null) {
                if (specifier.StartsWith(UnityEngine.Application.streamingAssetsPath) || File.Exists(UnityEngine.Application.streamingAssetsPath + "/" + specifier)) {
                    return System.IO.File.ReadAllText(UnityEngine.Application.streamingAssetsPath + "/" + specifier);
                } else if (mockFileContent.ContainsKey(specifier)) {
                    return mockFileContent[specifier];
                } else if (UnityEngine.Resources.Load(FixSpecifier(specifier)) != null) {
                    return UnityEngine.Resources.Load<UnityEngine.TextAsset>(FixSpecifier(specifier)).text;
                }
            }
            return "";
        }
// #endif
        private Dictionary<string, string> mockFileContent = new Dictionary<string, string>();
        [UnityEngine.Scripting.Preserve]
        public void AddMockFileContent(string fileName, string content)
        {
            mockFileContent[fileName] = content;
        }
    }
}
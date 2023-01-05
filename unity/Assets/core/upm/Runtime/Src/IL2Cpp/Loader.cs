// using System;
// #if EXPERIMENTAL_IL2CPP_PUERTS && ENABLE_IL2CPP

// namespace Puerts
// {
//     public abstract class ILoader
//     {
//         public abstract string Resolve(string specifier);
//         public virtual void ReadFile(string specifier, out string content)
//         {
//             throw new Exception("ILoader.ReadFile(string, out string) is not implemented yet");
//         }
//         public virtual void ReadFile(string specifier, out byte[] content) 
//         {
//             throw new Exception("ILoader.ReadFile(string, out byte[]) is not implemented yet");
//         }
//     }

//     [UnityEngine.Scripting.Preserve]
//     public class DefaultLoader : ILoader
//     {
//         private string root = "";

//         public DefaultLoader()
//         {
//         }

//         public DefaultLoader(string root)
//         {
//             this.root = root;
//         }

//         private string FixSpecifier(string specifier)
//         {
//             return 
//             // .cjs/.mjs asset is only supported in unity2018+
// #if UNITY_2018_1_OR_NEWER
//             specifier.EndsWith(".cjs") || specifier.EndsWith(".mjs")  ? 
//                 specifier.Substring(0, specifier.Length - 4) : 
// #endif
//                 specifier;
//         }

//         /**
//         * 判断文件是否存在，并返回调整后文件标识符，供ReadFile使用。
//         * localFilePath为文件本地路径，调试器调试时会使用。
//         */
//         [UnityEngine.Scripting.Preserve]
//         public override string Resolve(string specifier)
//         {
//             string fixedSpecifier = FixSpecifier(specifier);

//             if (UnityEngine.Resources.Load(fixedSpecifier) != null) {
//                 return fixedSpecifier;
//             }
//             return null;
//         }

//         [UnityEngine.Scripting.Preserve]
//         public override void ReadFile(string identifer, out string content)
//         {
//             if (identifer == null) {
//                 content = "";
//                 return;
//             }
//             UnityEngine.TextAsset file = (UnityEngine.TextAsset)UnityEngine.Resources.Load(identifer);
//             content = file.text;
//         }
//     }
// }
// #endif
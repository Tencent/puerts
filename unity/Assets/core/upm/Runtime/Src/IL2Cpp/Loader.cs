using System;
#if EXPERIMENTAL_IL2CPP_PUERTS && ENABLE_IL2CPP

namespace Puerts
{
    public abstract class ILoader
    {
        public abstract string Resolve(string identifier, out string localFilePath);
        public virtual void ReadFile(string identifier, out string content)
        {
            throw new Exception("ILoader.ReadFile(string, out string) is not implemented yet");
        }
        public virtual void ReadFile(string identifier, out byte[] content) 
        {
            throw new Exception("ILoader.ReadFile(string, out byte[]) is not implemented yet");
        }
    }

    public class DefaultLoader : ILoader
    {
        private string root = "";

        public DefaultLoader()
        {
        }

        public DefaultLoader(string root)
        {
            this.root = root;
        }

        private string FixIdentifier(string identifier)
        {
            return 
            // .cjs/.mjs asset is only supported in unity2018+
#if UNITY_2018_1_OR_NEWER
            identifier.EndsWith(".cjs") || identifier.EndsWith(".mjs")  ? 
                identifier.Substring(0, identifier.Length - 4) : 
#endif
                identifier;
        }

        /**
        * 判断文件是否存在，并返回调整后文件标识符，供ReadFile使用。
        * localFilePath为文件本地路径，调试器调试时会使用。
        */
        public override string Resolve(string identifier, out string localFilePath)
        {
            string fixedIdentifier = FixIdentifier(identifier);

            localFilePath = System.IO.Path.Combine(root, identifier);

            if (UnityEngine.Resources.Load(fixedIdentifier) != null) {
                return fixedIdentifier;
            }
            return null;
        }

        public override void ReadFile(string identifer, out string content)
        {
            if (identifer == null) {
                content = "";
                return;
            }
            UnityEngine.TextAsset file = (UnityEngine.TextAsset)UnityEngine.Resources.Load(identifer);
            content = file.text;
        }
    }
}
#endif
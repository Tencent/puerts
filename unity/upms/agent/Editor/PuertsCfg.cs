using System;
using System.Collections.Generic;
using Puerts;

namespace LLMAgent.Editor
{
    /// <summary>
    /// PuerTS configuration for generating C# type declarations (index.d.ts).
    /// Run "Tools > PuerTS > Generate index.d.ts" in Unity Editor to regenerate.
    /// </summary>
    [Configure]
    public class PuertsCfg
    {
        /// <summary>
        /// Types that will have d.ts declarations generated.
        /// These are the C# types referenced from TypeScript via the CS namespace.
        /// </summary>
        [Typing]
        static IEnumerable<Type> Typings
        {
            get
            {
                return new List<Type>()
                {
                    typeof(LLMAgent.HttpBridge),
                    typeof(LLMAgent.UnityLogBridge),
                    typeof(LLMAgent.ScreenCaptureBridge),
                    typeof(LLMAgent.TypeReflectionBridge),
                    typeof(LLMAgent.ScriptEnvBridge),
                    typeof(UnityEngine.Vector3),
                    typeof(UnityEngine.Resources),
                    typeof(UnityEngine.Object),
                    typeof(UnityEngine.TextAsset),
                    typeof(Puerts.ScriptEnv),
                    typeof(System.Array),
                    typeof(Action<string, bool>),
                    typeof(Action<string>),
                    typeof(Func<string, bool>),
                    typeof(Func<string, bool, int>),
                    typeof(Func<string>),
                };
            }
        }
    }
}

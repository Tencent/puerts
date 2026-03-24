using Puerts;
using System;
using UnityEngine;

namespace LLMAgent
{
    public class ScriptEnvBridge
    {
        [UnityEngine.Scripting.Preserve]
        public static ScriptEnv CreateJavaScriptEnv()
        {
            return new ScriptEnv(new BackendV8());
        }

        [UnityEngine.Scripting.Preserve]
        public static void Eval(ScriptEnv env, string script, Action<string> onFinish)
        {
            env.Eval<Action<Action<string>>>(script)(onFinish);
        }

        [UnityEngine.Scripting.Preserve]
        public static void EvalSync(ScriptEnv env, string script)
        {
            env.Eval(script);
        }

        /// <summary>
        /// Tick the eval VM to process pending JS microtasks and timers (setTimeout/setInterval).
        /// Should be called periodically from the main VM (e.g. via setInterval).
        /// </summary>
        [UnityEngine.Scripting.Preserve]
        public static void Tick(ScriptEnv env)
        {
            env.Tick();
        }
    }
}

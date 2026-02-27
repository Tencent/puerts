using System;
using System.Runtime.InteropServices;
using System.Collections.Generic;

namespace Puerts
{
    namespace WebGL
    {
        public class MainEnv
        {
            private static ScriptEnv jsEnvInstance;

            public static ScriptEnv Get()
            {
                if (jsEnvInstance != null) 
                {
                    return jsEnvInstance;
                }
                return Get(new Puerts.DefaultLoader());
            }
            
            public static ScriptEnv Get(Puerts.ILoader loader, int debugPort = -1)
            {
                if (jsEnvInstance != null) 
                {
                    return jsEnvInstance;
                }

#if !UNITY_EDITOR
                jsEnvInstance = new ScriptEnv(new BackendWebGL(loader), debugPort);
#else
                jsEnvInstance = new ScriptEnv(Activator.CreateInstance(PuertsIl2cpp.TypeUtils.GetType("Puerts.BackendV8"), loader) as Backend, debugPort);
#endif
                return jsEnvInstance;
            }
        }
    }
}
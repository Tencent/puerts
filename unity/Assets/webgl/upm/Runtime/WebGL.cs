using System;
using System.Runtime.InteropServices;
using System.Collections.Generic;

namespace Puerts
{
    namespace WebGL
    {
        public class MainEnv
        {
            private static JsEnv jsEnvInstance;

            public static JsEnv Get()
            {
                if (jsEnvInstance != null) 
                {
                    return jsEnvInstance;
                }
                return Get(new Puerts.DefaultLoader());
            }
            
            public static JsEnv Get(Puerts.ILoader loader, int debugPort = -1)
            {
                if (jsEnvInstance != null) 
                {
                    return jsEnvInstance;
                }

#if !UNITY_EDITOR && UNITY_WEBGL
                InitPuertsWebGL();
#endif
                jsEnvInstance = new JsEnv(loader, debugPort);
                return jsEnvInstance;
            }

#if !UNITY_EDITOR && UNITY_WEBGL
            [DllImport("__Internal", CallingConvention = CallingConvention.Cdecl)]
            private static extern IntPtr InitPuertsWebGL();
#endif
        }
    }
}
namespace Puerts.ThirdParty
{
    public class CommonJS
    {
        public static void InjectSupportForCJS(Puerts.JsEnv env)
        {
            env.ExecuteModule("puer-commonjs/load.mjs");
            env.ExecuteModule("puer-commonjs/modular.mjs");
        }        
    }
}
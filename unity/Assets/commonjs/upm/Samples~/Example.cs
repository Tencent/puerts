using UnityEngine;
using Puerts;
public class Example : MonoBehaviour
{
    void Start()
    {
        JsEnv env = new JsEnv();
        Puerts.ThirdParty.CommonJS.InjectSupportForCJS(env);
        env.Eval("require('main.js')");

    }
}
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Puerts;

public class HelloWorlder : MonoBehaviour
{
    public static int ShouldDispose = 0;

    private JsEnv env;

    // Start is called before the first frame update
    void Start()
    {
        Application.runInBackground = true;
        env = new JsEnv(new DefaultLoader(), 8080);
        env.WaitDebugger();
        env.Eval("setTimeout(()=> { console.log('Dispose'); CS.HelloWorlder.ShouldDispose = 1 }, 5000)");

    }

    // Update is called once per frame
    void Update()
    {
        if (env != null)
        {
            if (ShouldDispose > 0) {
                env.Dispose();
                return;
            }
            env.Tick();
            env.Eval("console.log('Update');");
        }
    }
}

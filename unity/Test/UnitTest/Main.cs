using System.Collections;
using System.Collections.Generic;
using Puerts;
using UnityEngine;

public class Main : MonoBehaviour
{
    // Start is called before the first frame update
    private JsEnv jsEnv;
    private ILoader loader = new DefaultLoader();
    void Start()
    {
        jsEnv = new JsEnv();
        ExecuteFile("timer/index.js");
    }
    void ExecuteFile(string filename)
    {
        if (loader.FileExists(filename))
        {
            string debugPath;
            var context = loader.ReadFile(filename, out debugPath);
            jsEnv.Eval(context, debugPath);
        }
    }
    // Update is called once per frame
    void Update()
    {
        jsEnv.Tick();
    }
}

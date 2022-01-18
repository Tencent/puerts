using System.Collections;
using System;
using System.Collections.Generic;
using UnityEngine;
using Puerts;

public class JsMonoBehaviour : MonoBehaviour
{
    static JsEnv env;

    public string JSClassName;

    // Start is called before the first frame update
    public Action JsStart;
    void Start()
    {
        if (env == null) {
            env = new JsEnv();
        }
        // Action<JsMonoBehaviour> init = env.Eval<Action<JsMonoBehaviour>>(@"
        //     global.CS = require('csharp');

        //     var jsCls = require('behaviours.cjs')." + JSClassName + @";
        //     (function init(mono) {
        //         return new jsCls(mono)
        //     });
        // ");
        Action<JsMonoBehaviour> init = env.ExecuteModule<Action<JsMonoBehaviour>>("behaviours.mjs", JSClassName);
        init(this);
        if (JsStart!= null) JsStart();
    }

    // Update is called once per frame
    public Action JsUpdate;
    void Update()
    {
        env.Tick();
        if (JsUpdate!= null) JsUpdate();
    }

    public Action<Collider> JsOnTriggerEnter;
    void OnTriggerEnter(Collider other) {
        if (JsOnTriggerEnter != null) JsOnTriggerEnter(other);
    }
}

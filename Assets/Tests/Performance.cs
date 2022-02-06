using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

[XLua.LuaCallCSharp]
public class PerformanceHelper
{
    public static int ReturnNumber(int num)
    {
        return num;
    }
    public static Vector3 ReturnVector(int x, int y, int z)
    {
        return new Vector3(x, y, z);
    }

    public static Text JSNumber;
    public static Text JSVector;
    public static Text JSFibonacci;
    public static Text LuaNumber;
    public static Text LuaVector;
    public static Text LuaFibonacci;
}

public class Performance : MonoBehaviour
{
    public Text JSNumber;
    public Text JSVector;
    public Text JSFibonacci;
    public Text LuaNumber;
    public Text LuaVector;
    public Text LuaFibonacci;
    // Start is called before the first frame update
    void Start()
    {
        PerformanceHelper.JSNumber = JSNumber;
        PerformanceHelper.JSVector = JSVector;
        PerformanceHelper.JSFibonacci = JSFibonacci;
        PerformanceHelper.LuaNumber = LuaNumber;
        PerformanceHelper.LuaVector = LuaVector;
        PerformanceHelper.LuaFibonacci = LuaFibonacci;

        Puerts.JsEnv JsEnv = new Puerts.JsEnv();
        JsEnv.ExecuteModule("performance.mjs");
        
        // XLua.LuaEnv env = new XLua.LuaEnv();
        // env.DoString(Resources.Load<TextAsset>("performance.lua").text);
    }

    // Update is called once per frame
    void Update()
    {
        
    }
}

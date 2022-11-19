using UnityEngine;
using System;
using Puerts;
using System.IO;
using System.Reflection;
using System.Collections.Generic;

public delegate int SimpleDelegate(int a, int v);
public delegate void ObjectArgDelegate(Calculator calculator);
public delegate Calculator ObjectRetDelegate();

struct TestStruct : IDisposable
{
    public void Dispose()
    {
        Debug.Log("TestStruct.Dispose");
    }
}

public class AnthorClass
{
    public void Foo()
    {
        Debug.Log("AnthorClass.Foo,a=" + a);
    }

    int a = 988432;
}

public class Calculator
{
    public int x;
    public int y;

    public Vector3 v3 = new Vector3(8, 8, 8);


    public Calculator()
    {
        Debug.Log("Calculator()");
        x = 82;
        y = 2;
    }

    public Calculator(int a, int b)
    {
        Debug.Log("Calculator("+ a + "," + b + ")");
        x = a;
        y = b;
    }

    public static int Add(int a, int b)
    {
        //Debug.Log("Calculator.Add invoked a =" + a + ", b=" + b);
        return a + b;
    }

    public int Id(int a)
    {
        //Debug.Log("Calculator.Id invoked a =" + a + ", x=" + x + ",y=" + y);
        return a;
    }

    public static void VecTest(Vector3 vector)
    {
        //Debug.Log(string.Format("Calculator.VecTest invoked vector ={0}, {1}, {2}", vector.x, vector.y, vector.z));
    }

    public static void PrintVec(Vector3 vector)
    {
        Debug.Log(string.Format("Calculator.PrintVec invoked vector ={0}, {1}, {2}", vector.x, vector.y, vector.z));
    }

    private SimpleDelegate simpleDelegate;

    public void SetSimpleDelegate(SimpleDelegate simpleDelegate)
    {
        this.simpleDelegate = simpleDelegate;
    }

    public int MAdd(int a, int b)
    {
        return a + b;
    }

    public void SetSetSimpleDelegateToMAdd()
    {
        simpleDelegate = MAdd;
    }

    public void SetSetSimpleDelegateToAdd()
    {
        simpleDelegate = Add;
    }

    public void InterfaceArgumnent(IDisposable obj)
    {
        obj.Dispose();
    }

    public static AnthorClass TestLazyLoad()
    {
        return new AnthorClass();
    }

    public void CallInterfaceArgumnentByStruct()
    {
        var s = new TestStruct();
        InterfaceArgumnent(s);
    }

    public void CallSimpleDelegate(int loop)
    {
        //Debug.Log("CallSimpleDelegate loop =" + loop);
        for (int i = 0; i < loop; i++)
        {
            var ret = simpleDelegate == null ? -1 : simpleDelegate(99, i);
            //Debug.Log(string.Format("loop {0}: {1}", i, ret));
        }
    }

    public static int ThrowTest(int a, int b)
    {
        throw new Exception("aabbcc");
    }

    static Calculator calc = new Calculator(87, 65);

    public static Calculator ObjRet()
    {
        return calc;
    }

    public void PrintState()
    {
        Debug.Log("PrintState x=" + x + ",y=" + y + ",v3=" + v3);
    }

    public static Vector3 VecRet()
    {
        return new Vector3(9, 9, 9);
    }

    public static Vector4 V4Ret()
    {
        return new Vector4(9, 9, 9, 9);
    }

    public int Overload(int a)
    {
        Debug.Log("Overload(int) a=" + a);
        return a + 1;
    }

    public Vector3 Overload(Vector3 a)
    {
        Debug.Log("Overload(Vector3) a=" + a );
        return a + new Vector3(1, 1, 1);
    }

    int mPP;

    public int PP
    {
        get
        {
            Debug.Log("Get PP");
            return mPP;
        }
        set
        {
            Debug.Log("Set PP:val=" + value);
            mPP = value;
        }
    }

    static float gVV;

    public static float VV
    {
        get
        {
            Debug.Log("Get VV");
            return gVV;
        }
        set
        {
            Debug.Log("Set VV:val=" + value);
            gVV = value;
        }
    }

    public static Vector3 FFV = new Vector3(8, 8, 8);

    public static float FFF = 998;

    public AnthorClass FFAC = new AnthorClass();

    public void IntRef(ref int p1)
    {
        Debug.Log("IntRef:" + p1);
        p1 = 100;
    }

    public void ObjRef(ref object p1)
    {
        Debug.Log("ObjRef:" + p1);
        if (p1 is double)
        {
            p1 = 8899;
        }
        else if (p1 is string)
        {
            p1 = "hehe";
        }
        else
        {
            p1 = this;
        }
    }

    public unsafe void IntPtr(int * p1)
    {
        Debug.Log("IntPtr:" + *p1);
        *p1 = 101;
    }

    public override string ToString()
    {
        return "Calculator..........";
    }
}

public class Test : MonoBehaviour
{
    void PreventStrip()
    {
        
    }

    void Start()
    {
        /*BindingFlags flag = BindingFlags.DeclaredOnly | BindingFlags.Instance | BindingFlags.Static | BindingFlags.Public;
        HashSet<string> allSignature = new HashSet<string>();
        int AllMethodCount = 0;
        foreach (Assembly assembly in AppDomain.CurrentDomain.GetAssemblies())
        {
            //Debug.Log(assembly);
            foreach (Type type in assembly.GetExportedTypes())
            {
                foreach (var mi in type.GetMethods(flag))
                {
                    allSignature.Add(PuertsIl2cpp.NativeAPI.GetMethodSignature(mi));
                    ++AllMethodCount;
                }
                foreach (var ctor in type.GetConstructors(flag))
                {
                    allSignature.Add(PuertsIl2cpp.NativeAPI.GetMethodSignature(ctor));
                    ++AllMethodCount;
                }
            }
        }
        Debug.Log("Assemblies.Count=" + AppDomain.CurrentDomain.GetAssemblies().Length);
        Debug.Log("AllMethodCount=" + AllMethodCount);
        Debug.Log("allSignature.Count=" + allSignature.Count);*/

        JsEnv jsEnv = new JsEnv();

        // prevent strip
#if EXPERIMENTAL_IL2CPP_PUERTS && ENABLE_IL2CPP
        var loader = jsEnv.GetLoader("");
        string debugPath, content;
        loader.ReadFile(loader.Resolve("main.mjs", out debugPath), out content);
        
        jsEnv.GetTypeByString("System.Type");
        var cal = new Calculator();
        object obj = null;
        cal.ObjRef(ref obj);
#endif
        // prevent strip end

        var jsCode = @"
            const CalculatorV8 = loadType(jsEnv.GetTypeByString('Calculator'));
            const Vector3 =  loadType(jsEnv.GetTypeByString('UnityEngine.Vector3'));
            const Debug = loadType(jsEnv.GetTypeByString('UnityEngine.Debug'));

            Debug.Log('start');
            const loader = jsEnv.GetLoader('sb');
            Debug.Log(loader);
            const content = ['']
            loader.ReadFile(loader.Resolve('main.mjs', ['']), content);
            Debug.Log(content[0]);

            const LOOP = 1000000
            Debug.Log(`puerts loop=${LOOP}`)

            const ret = CalculatorV8.Add(88, 99);
            Debug.Log(`88 + 99 = ${ret}`);

            new CalculatorV8(123, 456);

            try {
                new CalculatorV8('123', '456');
            } catch(e){
                Debug.Log(`constructor overload ok:${e}`)
            }

            var obj = new CalculatorV8();
            const r2 = CalculatorV8.Add(89, 99);
            Debug.Log(`89 + 99 = ${r2}`);

            const vvv = CalculatorV8.VecRet();
            CalculatorV8.PrintVec(vvv);
            vvv.Set(9, 8, 7.65)
            CalculatorV8.PrintVec(vvv);
            

            const v3 = new Vector3(9.8, 5.6, 2.3);
            CalculatorV8.PrintVec(v3);

            v3.Set(7, 8, 9)
            CalculatorV8.PrintVec(v3);

            Debug.Log(`v3.x = ${v3.x} v3.y = ${v3.y}, v3.z = ${v3.z}`);
            v3.x = 1
            v3.y = 2
            v3.z = 3
            CalculatorV8.PrintVec(v3);
            Debug.Log(`v3.x = ${v3.x} v3.y = ${v3.y}, v3.z = ${v3.z}`);

            var so = CalculatorV8.ObjRet();
            so.PrintState();

            obj.Id(9999);

            Debug.Log(`obj.PP:${obj.PP}`);
            obj.PP = 100;
            Debug.Log(`obj.PP:${obj.PP}`);

            Debug.Log(`CalculatorV8.VV:${CalculatorV8.VV}`);
            CalculatorV8.VV = 500
            Debug.Log(`CalculatorV8.VV:${CalculatorV8.VV}`);

            Debug.Log(`Vector3.kEpsilon:${Vector3.kEpsilon}`);
            Debug.Log(`CalculatorV8.FFF:${CalculatorV8.FFF}`);
            CalculatorV8.FFF = 9009;
            Debug.Log(`CalculatorV8.FFF:${CalculatorV8.FFF}`);
            CalculatorV8.PrintVec(CalculatorV8.FFV);
            CalculatorV8.FFV = new Vector3(10, 10, 10);
            CalculatorV8.PrintVec(CalculatorV8.FFV);
            obj.FFAC.Foo();

            Debug.Log(`obj.x = ${obj.x} obj.y = ${obj.y}`);

            CalculatorV8.PrintVec(obj.v3);
            obj.v3.Set(1.01, 55, 66);
            CalculatorV8.PrintVec(obj.v3);

            var r = [18];
            obj.IntRef(r);
            Debug.Log(`ref return = ${r[0]}`);
            obj.IntPtr(r);
            Debug.Log(`ptr return = ${r[0]}`);

            obj.ObjRef(r);
            Debug.Log(`objref return = ${r[0]},type=${typeof r[0]}`);
            r[0] = 'abcd';
            obj.ObjRef(r);
            Debug.Log(`objref return = ${r[0]},type=${typeof r[0]}`);
            r[0] = undefined;
            obj.ObjRef(r);
            Debug.Log(`objref return type=${typeof r[0]}`);

            var ao = CalculatorV8.TestLazyLoad();
            ao.Foo();

            Debug.Log(`Calculator.ToString=${obj.ToString()}`); // Calculator.ToString
            Debug.Log(`Vector3.ToString=${v3.ToString()}`); // Vector3.ToString 1.01, 55, 66
            Debug.Log(`System.Object.ToString=${ao.ToString()}`); 

            var start = Date.now();
            for(var i = 0; i < LOOP; i++) {
                CalculatorV8.Add(1, 2);
            }
            Debug.Log(`puerts Add using ${Date.now() - start}`);

            start = Date.now();
            for(var i = 0; i < LOOP; i++) {
                obj.Id(88);
            }
            Debug.Log(`puerts obj.Id(88) using ${Date.now() - start}`);

            start = Date.now();
            for(var i = 0; i < LOOP; i++) {
                CalculatorV8.VecTest(v3);
            }
            Debug.Log(`puerts VecTest using ${Date.now() - start}`);

            obj.SetSimpleDelegate((a, b) => {
                //Debug.Log(`jscallback: a=${a},b=${b}`);
                return a + b;
            });

            start = Date.now();
            obj.CallSimpleDelegate(LOOP);
            Debug.Log(`puerts SimpleDelegate using ${Date.now() - start}`);

            obj.SetSimpleDelegate(null);

            start = Date.now();
            for(var i = 0; i < LOOP; i++) {
                CalculatorV8.ObjRet();
            }
            Debug.Log(`puerts ObjRet using ${Date.now() - start}`);

            start = Date.now();
            for(var i = 0; i < LOOP; i++) {
                v3.Set(7, 8, 9)
            }
            Debug.Log(`puerts Vector.Set using ${Date.now() - start}`);

            start = Date.now();
            for(var i = 0; i < LOOP; i++) {
                const a = obj.x;
            }
            Debug.Log(`puerts obj.x using ${Date.now() - start}`);

            start = Date.now();
            for(var i = 0; i < LOOP; i++) {
                const a = obj.v3;
            }
            Debug.Log(`puerts obj.v3 using ${Date.now() - start}`);

            start = Date.now();
            for(var i = 0; i < LOOP; i++) {
                CalculatorV8.VecRet();
            }
            Debug.Log(`puerts VecRet using ${Date.now() - start}`);

            function NewJsVector(x, y, z) {
                return {x:x, y:y, z:z};
            }

            start = Date.now();
            for(var i = 0; i < LOOP; i++) {
                NewJsVector(i, i, i);
            }
            Debug.Log(`puerts NewJsVector using ${Date.now() - start}`);

            start = Date.now();
            for(var i = 0; i < LOOP; i++) {
                CalculatorV8.V4Ret();;
            }
            Debug.Log(`puerts V4Ret using ${Date.now() - start}`);

            try {
                CalculatorV8.ThrowTest(3, 4);
            } catch(e) {
                Debug.Log(`catch exception:${e}`)
            }

            Debug.Log(`obj.Overload(124) = ${obj.Overload(124)}`);
            CalculatorV8.PrintVec(v3);
            const rrr = obj.Overload(v3);
            CalculatorV8.PrintVec(rrr);

            try {
                obj.Overload('111');
            } catch(e){
                Debug.Log(`method overload ok:${e}`)
            }

            delegate = undefined;
            obj = undefined;
            so = undefined;
            ao = undefined;
            
            gc();
            
        ";
        if (File.Exists("pt.js"))
        {
            Debug.Log("load js code from file");
            jsCode = File.ReadAllText("pt.js");
        }
        jsEnv.Eval(jsCode);
        //GC.Collect();//delegate not expire test
        //GC.WaitForPendingFinalizers();

        Debug.Log("12 = " + jsEnv.Eval<int>("12"));
        Debug.Log("12 = " + jsEnv.Eval<float>("12.12"));
        Debug.Log("42 = " + jsEnv.Eval<byte>("42"));
        Debug.Log("42 = " + jsEnv.Eval<double>("42.42"));
        Debug.Log("info = " + jsEnv.Eval<string>("'hello world'"));
        Debug.Log("==================================");
        Debug.Log("info = " + jsEnv.Eval<string>("'中文'"));

        var sd = jsEnv.Eval<SimpleDelegate>("(x, y) => {log(`lambda x=${x},y=${y}`); return x + y;}");
        Debug.Log("sd(1024, 4096)=" + sd(1024, 4096));

        var willThrow = jsEnv.Eval<SimpleDelegate>("(x, y) => { throw new Error('Required'); }");
        try
        {
            willThrow(1, 1);
        }
        catch (Exception e)
        {
            Debug.Log("test callback throw ok:" + e);
        }

        jsEnv.Eval("gc()");

        jsEnv.Dispose();
    }

    // Update is called once per frame
    void Update()
    {
        
    }
}

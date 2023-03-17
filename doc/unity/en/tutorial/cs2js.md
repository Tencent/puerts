# Invoking JavaScript in C#
### Invoking via Delegate
Puerts provides a crucial ability to convert JavaScript functions into C# delegates. With this ability, you can invoke JavaScript from the C# side.

```csharp
public class TestClass
{
    Callback1 callback1;

    public delegate void Callback1(string str);

    public void AddEventCallback1(Callback1 callback1)
    {
        this.callback1 += callback1;
    }
    public void Trigger()
    {
        if (callback1 != null) 
        {
            callback1("test");
        }
    }
}

void Start() {
    Puerts.JsEnv env = new Puerts.JsEnv();
    env.Eval(@"
        const obj = new CS.TestClass();
        obj.AddEventCallback1(i => console.log(i));
        obj.Trigger();
        // Printed the obj variable
        // Although triggered from JS, it is actually calling JS functions from C#, completing the console.log
    ");
}
```

------------------

### Passing Arguments from C# to JavaScript
When converting a JS function to a delegate, you can also convert it to a delegate with parameters, so you can pass any C# variables to JavaScript. The rules for type conversion when passing arguments are the same as when returning variables from C# to JavaScript.

```csharp
void Start() {
    Puerts.JsEnv env = new Puerts.JsEnv();
    // Here, you can directly get the delegate from the result of Eval
    System.Action<int> LogInt = env.Eval<System.Action<int>>(@"
        const func = function(a) {
            console.log(a);
        }
        func;
    ");

    LogInt(3); // 3
}
```
> Note that if the delegate you generated has value type parameters, you need to add a UsingAction or UsingFunc declaration. See FAQ for details.

### Invoking JavaScript from C# and Getting Return Values
Similar to the previous section, just need to convert the Action delegate to a Func delegate.

```csharp
void Start() {
    Puerts.JsEnv env = new Puerts.JsEnv();
    // Here, you can directly get the delegate from the result of Eval
    System.Func<int, int> Add3 = env.Eval<System.Func<int, int>>(@"
        const func = function(a) {
            return 3 + a;
        }
        func;
    ");

    System.Console.WriteLine(Add3(1)); // 4
}
```
> Note that if the delegate you generated has value type parameters, you need to add a UsingAction or UsingFunc declaration. See FAQ for details.
------------------
### Implementing MonoBehaviour in JS
With all the abilities mentioned above, we can easily implement this functionality in JS.

```csharp
using System;
using Puerts;
using UnityEngine;

public class JsBehaviour : MonoBehaviour
{
    public Action JsStart;
    public Action JsUpdate;
    public Action JsOnDestroy;

    static JsEnv jsEnv;

    void Awake()
    {
        if (jsEnv == null) jsEnv = new JsEnv(new DefaultLoader(), 9229);

        var init = jsEnv.Eval<ModuleInit>(@"const m = 
            class Rotate {
                constructor(bindTo) {
                    this.bindTo = bindTo;
                    this.bindTo.JsUpdate = () => this.onUpdate();
                    this.bindTo.JsOnDestroy = () => this.onDestroy();
                }
                
                onUpdate() {
                    console.log('update...')
                }
                
                onDestroy() {
                    console.log('onDestroy...');
                }
            }

            (function(bindTo) {
                new Rotate(bindTo);
            })
        ");

        if (init != null) init(this);
    }

    void Start()
    {
        if (JsStart != null) JsStart();
    }

    void Update()
    {
        jsEnv.Tick();
        if (JsUpdate != null) JsUpdate();
    }

    void OnDestroy()
    {
        if (JsOnDestroy != null) JsOnDestroy();
        JsStart = null;
        JsUpdate = null;
        JsOnDestroy = null;
    }
}
```
This feature has been implemented by many enthusiastic members of the community, and you can happily choose from their implementations.

it is a good time to discuss the **module**. As your code gets longer or you need to import it into someone else's code, the concept of modules becomes essential. The next section will introduce the usage of JS modules in PuerTS.
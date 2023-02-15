# 在C#中调用Javascript

### 通过 Delegate 调用
PuerTS 提供了一个关键能力：将 Javascript 函数转换为 C# 的 delegate。依靠这个能力，你就可以在 C# 侧调用 Javascript。

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
        // 打印了obj变量
        // 虽然是JS触发的，但实际上是C#调用JS函数，完成了console.log
    ");
}
```

------------------

### 从 C# 往 Javascript 传参
把 JS 函数转换成 delegate 的时候，你也可以将其转换成带参数的delegate、这样你就可以把任意 C# 变量传递给 Javascript。传参时，类型转换的规则和把变量从 C# 返回值到 Javascript 是一致的。
```csharp
void Start() {
    Puerts.JsEnv env = new Puerts.JsEnv();
    // 这里可以直接通过 Eval 的结果获得 delegate
    System.Action<int> LogInt = env.Eval<System.Action<int>>(@"
        const func = function(a) {
            console.log(a);
        }
        func;
    ");

    LogInt(3); // 3
}
```

> 需要注意的是，如果你生成的 delegate 带有值类型参数，需要添加 UsingAction 或者 UsingFunc 声明。具体请参见 FAQ
------------------

### 从 C# 调用 Javascript 并获得返回值
与上一部分类似。只需要将 Action delegate 变成 Func delegate 就可以了。
```csharp
void Start() {
    Puerts.JsEnv env = new Puerts.JsEnv();
    // 这里可以直接通过 Eval 的结果获得 delegate
    System.Func<int, int> Add3 = env.Eval<System.Func<int, int>>(@"
        const func = function(a) {
            return 3 + a;
        }
        func;
    ");

    System.Console.WriteLine(Add3(1)); // 4
}
```

> 需要注意的是，如果你生成的 delegate 带有值类型参数，需要添加 UsingAction 或者 UsingFunc 声明。具体请参见 FAQ

------------------
### 在 JS 中实现 MonoBehaviour

综合上面所有能力，我们很轻易地可以在 JS 里实现这个功能
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

        var init = jsEnv.Eval<Action<MonoBehaviour>>(@"
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
这项功能，有许多热心的社区朋友们贡献了他们自己的实现，你可以愉快地选用它们。

----------------

说到这，正好让我们来讨论一下**模块机制**。当你写的代码越来越长，或是需要引入到别人的代码时，就很需要模块这个概念。下一部分就会介绍 PuerTS 里，JS 模块的用法。

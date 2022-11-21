# 在Javascript调用C#

在上一篇中，我们简单试了一下Hello world

```csharp
//1. Hello World
void Start() {
    Puerts.JsEnv env = new Puerts.JsEnv();
    env.Eval(@"
        console.log('hello world');
    ");
}
```

事实上，此处`console.log`和浏览器的`console.log`并不太一致。这个`console.log`被PuerTS所内置劫持了，实际会将字符串内容调用`UnityEngine.Debug.Log`打印。

在Puerts的帮助下，Javascript和C#的打通还可以更精彩，请往下看：

------------------

```csharp
//2. 创建C#对象
void Start() {
    Puerts.JsEnv env = new Puerts.JsEnv();
    env.Eval(@"
        console.log(new CS.UnityEngine.Vector3(1, 2, 3));
        // (1.0, 2.0, 3.0)
    ");
}
```
在本例中，我们直接在 Javascript 中创建了一个 C# 的Vector!

在 PuerTS 所创建的 Javascript 环境里，你可以通过`CS`这个对象，输入任意类的 FullName (包含完整命名空间的路径)，访问任意的 C# 类，包括直接创建一个 Vector3 对象。

当然，写出完整的命名空间还是比较麻烦的，不过你也可以通过声明一个变量别名来简化
```
    const Vector2 = CS.UnityEngine.Vector2;
    console.log(Vector2.one)
```
------------------------------------

对象创建出来了，调用其方法、访问其属性也是非常容易的。
```csharp
//3. 调用C#函数或对象方法
void Start() {
    Puerts.JsEnv env = new Puerts.JsEnv();
    env.Eval(@"
        CS.UnityEngine.Debug.Log('Hello World');
        const rect = new CS.UnityEngine.Rect(0, 0, 2, 2);
        CS.UnityEngine.Debug.Log(rect.Contains(CS.UnityEngine.Vector2.one)); // True
        rect.width = 0.1
        CS.UnityEngine.Debug.Log(rect.Contains(CS.UnityEngine.Vector2.one)); // False
    ");
}
```
可以看出，不管是函数调用还是属性访问/赋值，用法上都和 C# 一模一样。

---------------------

不过，C# 还是会有一些在 JS 里不常见的用法，比如**ref**,**out**和**泛型**。就需要借助 PuerTS 提供的 API 来实现

```csharp
//4. out/ref/泛型
class Example4 {
    public static double InOutArgFunc(int a, out int b, ref int c)
    {
        Debug.Log("a=" + a + ",c=" + c);
        b = 100;
        c = c * 2;
        return a + b;
    }
}
void Start() {
    Puerts.JsEnv env = new Puerts.JsEnv();
    env.Eval(@"
        // 通过puer.$ref创建一个可以用于使用out/ref参数的变量
        let p1 = puer.$ref();
        let p2 = puer.$ref(10);
        let ret = CS.Example4.InOutArgFunc(100, p1, p2);
        console.log('ret=' + ret + ', out=' + puer.$unref(p1) + ', ref=' + puer.$unref(p2));
        // ret=200, out=100, ref=20

        // 通过puer.$generic来创建一个List<int>类型
        let List = puer.$generic(CS.System.Collections.Generic.List$1, CS.System.Int32);
        let lst = new List();
        lst.Add(1);
        lst.Add(0);
        lst.Add(2);
        lst.Add(4);
    ");
}
```
也并没有非常复杂，就可以完成了！

> 需要注意的是，可能你会想“Typescript明明支持泛型，为什么不用上呢？“。遗憾的是，Typescript泛型只是一个编译时的概念，在实际运行的时候还是运行的是Javascript，因此还是需要puer.$generic来处理。

----------------------------

除了这上述特殊的用法之外，还要介绍两种情况：typeof函数和运算符重载：

```csharp
//5. typeof/运算符重载
void Start() {
    Puerts.JsEnv env = new Puerts.JsEnv();
    env.Eval(@"
        let go = new CS.UnityEngine.GameObject('testObject');
        go.AddComponent(puer.$typeof(CS.UnityEngine.ParticleSystem));

        const Vector3 = CS.UnityEngine.Vector3;
        let ret = Vector3.op_Multiply(Vector3.up, 1600)
        
        console.log(ret) // (0.0, 1600.0, 0.0)
    ");
}
```
因为 C# 的`typeof`无法通过 C# 命名空间的方式访问，有点类似关键字的角色，因此PuerTS 提供内置方法`$typeof`访问

另外由于 JS 尚未全面支持运算符重载（TC39还在草案阶段），这里需要用 op_xxxx 代替运算符

----------------

让我们来看 Javascript 调用 C# 的最后一个案例：async

```csharp
// async
class Example6 {
    public async Task<int> GetFileLength(string path)
    {
        Debug.Log("start read " + path);
        using (StreamReader reader = new StreamReader(path))
        {
            string s = await reader.ReadToEndAsync();
            Debug.Log("read " + path + " completed");
            return s.Length;
        }
    }
}

void Start() {
    Puerts.JsEnv env = new Puerts.JsEnv();
    env.Eval(@"
        (async function() {
            let task = obj.GetFileLength('xxxx');
            let result = await puer.$promise(task);
            console.log('file length is ' + result);
        })()
        .catch(err=> {
            console.error(err)
        })
    ");
}
```
对于 C# 的`async`函数，JS 侧通过`puer.$promise`包装一下 C# 返回的 task，即可 await 调用了

-------------
这一部分是有关 JS 调用 C# 的。下一部分我们反过来，介绍 C# 调用 JS
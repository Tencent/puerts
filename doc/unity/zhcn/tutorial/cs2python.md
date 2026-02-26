# 在 C# 中调用 Python

> 💡 PuerTS 3.0 同时支持 C# 调用 [Javascript](./cs2js.md) 和 [Lua](./cs2lua.md)，语法各有不同，可点击链接查看对应教程。

### 通过 Delegate 调用

PuerTS 提供了一个关键能力：将 Python 函数转换为 C# 的 delegate。依靠这个能力，你就可以在 C# 侧调用 Python 函数。

```csharp
public delegate void TestCallback(string msg);

public class TestClass
{
    public TestCallback Callback;

    public void TriggerCallback()
    {
        if (Callback != null)
        {
            Callback("hello_from_csharp");
        }
    }
}

void Start()
{
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());
    env.Eval(@"
exec('''
import Puerts.UnitTest.TestClass as TestClass
obj = TestClass()

def callback(msg):
    global info
    info = msg

# Assign a Python function to the C# delegate property
obj.Callback = callback
# Trigger the callback from C# side
obj.TriggerCallback()
''')
");
    // info is now 'hello_from_csharp'
    env.Dispose();
}
```

> ⚠️ 注意：Python 中多行代码需要使用 `exec('''...''')` 包裹。单行表达式可以直接用 `Eval` 执行。

你也可以在 Python 侧主动调用 delegate 的 `Invoke` 方法：

```python
# Directly invoke the delegate from Python
obj.Callback.Invoke('hello_from_python')
```

------------------

### 从 C# 往 Python 传参

把 Python 函数转换成 delegate 时，可以将其转换成带参数的 delegate，这样就可以把 C# 变量传递给 Python。传参时，类型转换的规则和把变量从 C# 返回到 Python 是一致的。

Python 支持使用 `lambda` 表达式来创建简单的匿名函数：

```csharp
void Start()
{
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());
    // Get a Python lambda as a C# delegate
    System.Action<int> LogInt = env.Eval<System.Action<int>>("lambda a: print(a)");

    LogInt(3); // Output: 3
    env.Dispose();
}
```

对于更复杂的逻辑，使用 `def` 定义函数，然后通过 `Eval` 获取：

```csharp
void Start()
{
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());
    // Define a function with def, then retrieve it
    env.Eval(@"
exec('''
def log_int(a):
    print(a)
''')
");
    System.Action<int> LogInt = env.Eval<System.Action<int>>("log_int");

    LogInt(3); // Output: 3
    env.Dispose();
}
```

Python 函数还支持**可选参数**，转换为不同签名的 delegate 后都可以正常工作：

```csharp
void Start()
{
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());
    env.Eval(@"
exec('''
def flexible_func(a, b=0):
    if b == 0:
        return str(a)
    else:
        return str(a) + str(b)
''')
");

    // Cast as Action<int> — only pass the first argument
    var cb1 = env.Eval<Action<int>>("flexible_func");
    cb1(1); // Uses default b=0

    // Cast as Action<string, long> — pass both arguments
    var cb2 = env.Eval<Action<string, long>>("flexible_func");
    cb2("hello", 999); // Output: hello999

    env.Dispose();
}
```

> 需要注意的是，如果你生成的 delegate 带有值类型参数，需要添加 UsingAction 或者 UsingFunc 声明。具体请参见 FAQ

------------------

### 从 C# 调用 Python 并获得返回值

与上一部分类似，只需要将 Action delegate 变成 Func delegate 就可以了。

**使用 `lambda` 表达式**（适合简单的单行逻辑）：

```csharp
void Start()
{
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());
    // Python lambda can directly return a value
    System.Func<int, int> Add3 = env.Eval<System.Func<int, int>>("lambda a: 3 + a");

    System.Console.WriteLine(Add3(1)); // Output: 4
    env.Dispose();
}
```

**使用 `def` 定义函数**（适合复杂逻辑）：

```csharp
void Start()
{
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());
    env.Eval(@"
exec('''
def add3(a):
    return 3 + a
''')
");
    System.Func<int, int> Add3 = env.Eval<System.Func<int, int>>("add3");

    System.Console.WriteLine(Add3(1)); // Output: 4
    env.Dispose();
}
```

你也可以直接使用 `Eval<T>` 来获取简单的返回值：

```csharp
void Start()
{
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());
    // Directly evaluate a Python expression and get the return value
    int result = env.Eval<int>("1 + 2");
    System.Console.WriteLine(result); // Output: 3

    string str = env.Eval<string>("'hello python'");
    System.Console.WriteLine(str); // Output: hello python

    // Convert non-string types with Python builtins
    var ret = env.Eval<string>("str(9999)");
    System.Console.WriteLine(ret); // Output: 9999

    env.Dispose();
}
```

> ⚠️ **与 Lua 的差异**：Python 的 `lambda` 表达式会自动返回结果（类似 JS），无需显式 `return`。但 `def` 定义的函数中必须使用 `return` 语句返回值，否则返回 `None`。

> 需要注意的是，如果你生成的 delegate 带有值类型参数，需要添加 UsingAction 或者 UsingFunc 声明。具体请参见 FAQ

------------------

### Python 中的错误处理

当 Python 代码中使用 `raise` 抛出异常时，C# 侧可以通过 `try-catch` 捕获：

```csharp
void Start()
{
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());

    // Python raise will be caught as a C# exception
    try
    {
        env.Eval(@"
exec('''
raise Exception('something went wrong')
''')
");
    }
    catch (Exception e)
    {
        Debug.Log(e.Message); // Contains: something went wrong
    }

    // SyntaxError is also catchable
    try
    {
        env.Eval(@"
exec('''
def test():
    return 1 +
''')
");
    }
    catch (Exception e)
    {
        Debug.Log(e.Message); // Contains: SyntaxError
    }

    // RuntimeError (e.g. KeyError) is catchable too
    try
    {
        env.Eval(@"
exec('''
obj = {}
obj['nonexistent']()
''')
");
    }
    catch (Exception e)
    {
        Debug.Log(e.Message); // Contains: KeyError
    }

    env.Dispose();
}
```

------------------

### 环境销毁与 Delegate 生命周期

当 Python 环境（`ScriptEnv`）被 `Dispose()` 后，之前转换的 delegate 将不再可用。调用已销毁环境的 delegate 会抛出异常，请务必注意管理好生命周期。

```csharp
void Start()
{
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());
    System.Action callback = env.Eval<System.Action>("lambda: print('hello')");

    callback(); // OK — Output: hello

    env.Dispose();

    // ❌ This will throw an exception!
    // callback();
}
```

------------------

### 在 Python 中实现 MonoBehaviour

综合上面所有能力，我们可以在 Python 里实现 MonoBehaviour 的生命周期回调：

```csharp
using System;
using Puerts;
using UnityEngine;

public class PythonBehaviour : MonoBehaviour
{
    public Action PythonStart;
    public Action PythonUpdate;
    public Action PythonOnDestroy;

    static ScriptEnv pythonEnv;

    void Awake()
    {
        if (pythonEnv == null) pythonEnv = new ScriptEnv(new BackendPython());

        pythonEnv.Eval(@"
exec('''
import UnityEngine.MonoBehaviour as MonoBehaviour

def init_behaviour(bindTo):
    def on_update():
        print(""update..."")
    def on_destroy():
        print(""onDestroy..."")
    bindTo.PythonUpdate = on_update
    bindTo.PythonOnDestroy = on_destroy
''')
");
        var init = pythonEnv.Eval<Action<MonoBehaviour>>("init_behaviour");
        if (init != null) init(this);
    }

    void Start()
    {
        if (PythonStart != null) PythonStart();
    }

    void Update()
    {
        if (PythonUpdate != null) PythonUpdate();
    }

    void OnDestroy()
    {
        if (PythonOnDestroy != null) PythonOnDestroy();
        PythonStart = null;
        PythonUpdate = null;
        PythonOnDestroy = null;
    }
}
```

> ⚠️ 注意 Python 与其他语言的关键差异：
> - Python 多行代码需要 `exec('''...''')` 包裹
> - Python 使用 `def` 定义函数，无需 `end` 或花括号
> - Python 使用 `import` 语法访问 C# 类型
> - Python 的缩进（indentation）是语法的一部分，请注意保持一致

------------------

### Python 与其他语言在 C# 调用方面的主要差异

| 特性 | Javascript | Lua | Python |
|------|-----------|-----|--------|
| Eval 返回值 | 表达式最后一个值自动返回 | 必须使用 `return` | `lambda` 自动返回；`def` 需要 `return` |
| 匿名函数 | `(a) => { ... }` | `function(a) ... end` | `lambda a: ...` |
| 命名函数 | `function f(a) { ... }` | `function f(a) ... end` | `def f(a): ...` |
| 多行代码 | 直接写 | 直接写 | 需 `exec('''...''')` 包裹 |
| delegate 赋值 | `obj.Callback = (msg) => { ... }` | `obj.Callback = function(msg) ... end` | `obj.Callback = callback_func` |
| 方法调用 | 点号 `obj.Method()` | 冒号 `obj:Method()` | 点号 `obj.Method()` |
| 输出到控制台 | `console.log()` | `print()` | `print()` |
| 空值 | `null` / `undefined` | `nil` | `None` |
| 异常抛出 | `throw new Error()` | `error()` | `raise Exception()` |

------------------

### 平台限制

> ⚠️ Python 后端当前**不支持** WebGL、iOS、Android 平台。如需跨平台支持，请使用 Javascript 或 Lua 后端。

----------------

> 📖 其他语言的 C# 调用教程：[C# 调用 Javascript](./cs2js.md) | [C# 调用 Lua](./cs2lua.md) | [三语言对比速查表](./lang-comparison.md)

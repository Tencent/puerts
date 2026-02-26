# Invoking Python from C#

> 💡 PuerTS 3.0 also supports C# calling [Javascript](./cs2js.md) and [Lua](./cs2lua.md), each with different syntax. Click the links to see the corresponding tutorials.

### Calling via Delegate

PuerTS provides a key capability: converting Python functions into C# delegates. With this, you can call Python functions from the C# side.

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

> ⚠️ Note: Multi-line Python code must be wrapped with `exec('''...''')`. Single-line expressions can be executed directly with `Eval`.

You can also directly invoke the delegate's `Invoke` method from the Python side:

```python
# Directly invoke the delegate from Python
obj.Callback.Invoke('hello_from_python')
```

------------------

### Passing Arguments from C# to Python

When converting a Python function to a delegate, you can convert it to a delegate with parameters, allowing you to pass C# variables to Python. The type conversion rules are the same as when returning variables from C# to Python.

Python supports using `lambda` expressions to create simple anonymous functions:

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

For more complex logic, use `def` to define a function, then retrieve it via `Eval`:

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

Python functions also support **optional parameters**, which work correctly when converted to delegates with different signatures:

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

> Note: If your generated delegate has value type parameters, you need to add UsingAction or UsingFunc declarations. Please refer to the FAQ for details.

------------------

### Calling Python from C# and Getting Return Values

Similar to the previous section, just change the Action delegate to a Func delegate.

**Using `lambda` expressions** (suitable for simple one-line logic):

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

**Using `def` to define functions** (suitable for complex logic):

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

You can also use `Eval<T>` directly to get simple return values:

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

> ⚠️ **Difference from Lua**: Python's `lambda` expressions automatically return the result (similar to JS), without needing an explicit `return`. However, functions defined with `def` must use a `return` statement to return values, otherwise they return `None`.

> Note: If your generated delegate has value type parameters, you need to add UsingAction or UsingFunc declarations. Please refer to the FAQ for details.

------------------

### Error Handling in Python

When Python code raises an exception using `raise`, the C# side can catch it with `try-catch`:

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

### Environment Disposal and Delegate Lifecycle

After the Python environment (`ScriptEnv`) is `Dispose()`d, previously converted delegates will no longer be usable. Calling a delegate from a disposed environment will throw an exception. Be sure to manage the lifecycle properly.

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

### Implementing MonoBehaviour in Python

Combining all the capabilities above, we can implement MonoBehaviour lifecycle callbacks in Python:

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

> ⚠️ Key differences between Python and other languages:
> - Multi-line Python code requires `exec('''...''')` wrapping
> - Python uses `def` to define functions, no `end` or curly braces needed
> - Python uses `import` syntax to access C# types
> - Python's indentation is part of the syntax — keep it consistent

------------------

### Key Differences Between Python and Other Languages for C# Invocation

| Feature | Javascript | Lua | Python |
|---------|-----------|-----|--------|
| Eval return value | Last expression value auto-returned | Must use `return` | `lambda` auto-returns; `def` needs `return` |
| Anonymous function | `(a) => { ... }` | `function(a) ... end` | `lambda a: ...` |
| Named function | `function f(a) { ... }` | `function f(a) ... end` | `def f(a): ...` |
| Multi-line code | Write directly | Write directly | Wrap with `exec('''...''')` |
| Delegate assignment | `obj.Callback = (msg) => { ... }` | `obj.Callback = function(msg) ... end` | `obj.Callback = callback_func` |
| Method call | Dot `obj.Method()` | Colon `obj:Method()` | Dot `obj.Method()` |
| Console output | `console.log()` | `print()` | `print()` |
| Null value | `null` / `undefined` | `nil` | `None` |
| Throwing exceptions | `throw new Error()` | `error()` | `raise Exception()` |

------------------

### Platform Limitations

> ⚠️ The Python backend currently does **not** support WebGL, iOS, or Android platforms. If cross-platform support is needed, please use the Javascript or Lua backend.

----------------

> 📖 Other language tutorials for invoking from C#: [C# to Javascript](./cs2js.md) | [C# to Lua](./cs2lua.md) | [Multi-Language Comparison Cheat Sheet](./lang-comparison.md)

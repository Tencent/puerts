# Getting Started with PuerTS (Python)

> **PuerTS 3.0 Multi-Language Support**: Starting from version 3.0, PuerTS supports **Lua** and **Python** alongside JavaScript/TypeScript. All languages share a unified `ScriptEnv` + `Backend` architecture. This guide covers using Python as the scripting language. For other languages, see [JS Getting Started](./runJS.md) or [Lua Getting Started](./runLua.md).

> **Platform Limitation**: The Python backend currently does **not** support WebGL, iOS, or Android. It is only available on desktop platforms (Windows, macOS, Linux) and in the Unity Editor.

First, please follow the [installation guide](../install.md) to install PuerTS into your Unity project, and make sure the Python backend (`BackendPython`) is included.

------------

Then, prepare a scene and a MonoBehaviour component in Unity, and write the following code in the MonoBehaviour:

```csharp
using Puerts;

void Start() {
    var pyEnv = new ScriptEnv(new BackendPython());
    pyEnv.Eval("print('hello world')");
    pyEnv.Dispose();
}
```

After execution, you will see `hello world` in the Unity console.

Success!

This means that we have executed real Python in Unity!

> **Tip**: Python's `print()` function is automatically mapped to Unity console output (`Debug.Log`), no extra configuration needed.

------------

## Executing Multi-line Code

Unlike JS and Lua, Python is indentation-sensitive. When executing multi-line Python code via `Eval`, you need to wrap it with `exec('''...''')`:

```csharp
using Puerts;

void Start() {
    var pyEnv = new ScriptEnv(new BackendPython());
    pyEnv.Eval(@"
exec('''
def greet(name):
    print('hello, ' + name)

greet('PuerTS')
''')
");
    // output: hello, PuerTS
    pyEnv.Dispose();
}
```

> **Note**: `exec()` is used to execute multi-line statement blocks. For single-line expressions (e.g. `print('hello')`), you can omit the `exec()` wrapper.

------------

## Key Differences from JS/Lua

If you have previously used PuerTS with JS or Lua, here are the key points to keep in mind when switching to Python:

| Feature | JavaScript | Lua | Python |
|---------|-----------|-----|--------|
| Environment | `new ScriptEnv(new BackendV8())` | `new ScriptEnv(new BackendLua())` | `new ScriptEnv(new BackendPython())` |
| Console output | `console.log(...)` | `print(...)` | `print(...)` |
| Multi-line code | Write directly | Write directly | Wrap with `exec('''...''')` |
| Access C# types | `CS.Namespace.Class` | `require('csharp')` | `import Namespace.Class` |
| Method calls | `obj.Method()` | `obj:Method()` | `obj.Method()` |
| Null representation | `null` / `undefined` | `nil` | `None` |
| Platform support | All platforms | All platforms | Desktop only |

> **Note**: There is no `JsEnv` legacy syntax for Python. Use `ScriptEnv` + `BackendPython` directly.

> **Note**: Python does not support passing a class to C# as a `ScriptObject`. This is a known limitation.

------------

## Using Eval to Execute Scripts and Get Return Values

You can use the generic `Eval<T>` to get the return value of a Python expression:

```csharp
using Puerts;
using System;

void Start() {
    var pyEnv = new ScriptEnv(new BackendPython());

    // Eval a Python expression and get return value
    int result = pyEnv.Eval<int>("1 + 2");
    UnityEngine.Debug.Log(result); // output: 3

    // Eval a Python lambda and convert to C# delegate
    var add = pyEnv.Eval<Func<int, int, int>>("lambda a, b: a + b");
    UnityEngine.Debug.Log(add(10, 20)); // output: 30

    // Eval a Python function defined via exec, then retrieve it
    pyEnv.Eval(@"
exec('''
def greet():
    print('hello from python function')
''')
");
    var greet = pyEnv.Eval<Action>("greet");
    greet(); // output: hello from python function

    pyEnv.Dispose();
}
```

> **Note**: For simple expressions (e.g. `1 + 2`, `lambda`), Python automatically returns the expression value without needing `return`. For functions defined via `exec()`, you need to define them first and then retrieve them by variable name.

------------

## Error Handling

When a Python script encounters an error, a C# exception is thrown. You can catch it with `try-catch`:

```csharp
using Puerts;

void Start() {
    var pyEnv = new ScriptEnv(new BackendPython());
    try {
        pyEnv.Eval(@"
exec('''
raise Exception('something went wrong')
''')
");
    } catch (System.Exception e) {
        UnityEngine.Debug.LogError("Python error: " + e.Message);
    }
    pyEnv.Dispose();
}
```

Common error types include:
- **SyntaxError**: Incomplete statements like `def test(): return 1 +`
- **Runtime errors (KeyError/TypeError etc.)**: Accessing non-existent dictionary keys
- **ModuleNotFoundError**: Importing non-existent modules like `import notfound.whatever`
- **Explicit raise**: Actively raising exceptions via `raise Exception('message')`

------------

## Passing None

Python's `None` corresponds to C#'s `null`. You can pass `None` when calling C# methods:

```python
import Puerts.UnitTest.TestHelper as TestHelper
obj = TestHelper.GetInstance()
obj.PassStr(None)   # equivalent to passing null for string parameter
obj.PassObj(None)   # equivalent to passing null for object parameter
```

------------

With the help of PuerTS, the integration between Python and C# can be even more exciting. Keep reading!

**Related tutorials:**
- [Calling C# from Python](./python2cs.md) | [Invoking Python from C#](./cs2python.md)
- [JS Getting Started](./runJS.md) | [Lua Getting Started](./runLua.md)
- [Multi-Language Comparison Cheat Sheet](./lang-comparison.md)

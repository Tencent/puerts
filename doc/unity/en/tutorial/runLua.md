# Getting Started with PuerTS (Lua)

> **PuerTS 3.0 Multi-Language Support**: Starting from version 3.0, PuerTS supports **Lua** and **Python** in addition to JavaScript/TypeScript. All three languages share a unified `ScriptEnv` + `Backend` architecture. This tutorial covers the Lua backend. For other languages, see the [JS Getting Started](./runJS.md) or [Python Getting Started](./runPython.md) tutorials.

First, please follow the [installation guide](../install.md) to install PuerTS into your Unity project, and make sure the Lua backend (`BackendLua`) is included.

------------

Then, prepare a scene and a MonoBehaviour component in Unity, and write the following code:

```csharp
using Puerts;

void Start() {
    var luaEnv = new ScriptEnv(new BackendLua());
    luaEnv.Eval(@"
        print('hello world')
    ");
    luaEnv.Dispose();
}
```

After execution, you will see `hello world` in the Unity console.

Success!

This means we have executed real Lua code inside Unity!

> **Tip**: Lua's `print()` function is automatically mapped to Unity's console output (`Debug.Log`), no extra configuration needed.

------------

## Key Differences from the JS Version

If you have used PuerTS with JavaScript before, here are the key differences when switching to Lua:

| Feature | JavaScript | Lua |
|---------|-----------|-----|
| Environment creation | `new ScriptEnv(new BackendV8())` | `new ScriptEnv(new BackendLua())` |
| Console output | `console.log(...)` | `print(...)` |
| Accessing C# types | `CS.Namespace.Class` | `require('csharp')` to get namespace entry |
| Method calls | `obj.Method()` | Instance methods use `obj:Method()`, static methods use `Class.Method()` |
| Null representation | `null` / `undefined` | `nil` |

> **Note**: The Lua backend does **not** have a legacy `JsEnv`-style API. Always use `ScriptEnv` + `BackendLua`.

------------

## Using Eval to Execute Scripts and Get Return Values

Besides executing code directly, you can use the generic `Eval<T>` to get return values from Lua scripts:

```csharp
using Puerts;
using System;

void Start() {
    var luaEnv = new ScriptEnv(new BackendLua());

    // Eval a Lua expression and get return value
    int result = luaEnv.Eval<int>("return 1 + 2");
    UnityEngine.Debug.Log(result); // output: 3

    // Eval a Lua function and convert to C# delegate
    var greet = luaEnv.Eval<Action>(@"
        return function()
            print('hello from lua function')
        end
    ");
    greet(); // output: hello from lua function

    luaEnv.Dispose();
}
```

> **Important**: In Lua, you must use an explicit `return` statement when returning values from `Eval`. This differs from JS, where the last expression's value is automatically returned.

------------

## Error Handling

When a Lua script encounters an error, a C# exception is thrown, which you can catch with `try-catch`:

```csharp
using Puerts;

void Start() {
    var luaEnv = new ScriptEnv(new BackendLua());
    try {
        luaEnv.Eval(@"
            error('something went wrong')
        ");
    } catch (System.Exception e) {
        UnityEngine.Debug.LogError("Lua error: " + e.Message);
    }
    luaEnv.Dispose();
}
```

Common error types include:
- **Syntax errors**: e.g., `return 1 +` (incomplete statement)
- **Runtime errors**: e.g., calling a non-existent function `obj.nonexistent()`
- **Explicit errors**: thrown via `error('message')`

------------

## Passing nil

Lua's `nil` corresponds to C#'s `null`. You can pass `nil` when calling C# methods:

```lua
local CS = require('csharp')
local obj = CS.SomeNamespace.SomeClass()
obj:SomeMethod(nil)  -- equivalent to passing null in C#
```

------------

With the help of PuerTS, the integration between Lua and C# can be even more powerful. Keep reading!

**Related tutorials:**
- [Calling C# from Lua](./lua2cs.md) | [Invoking Lua from C#](./cs2lua.md)
- [JS Getting Started](./runJS.md) | [Python Getting Started](./runPython.md)
- [Multi-Language Comparison Cheat Sheet](./lang-comparison.md)

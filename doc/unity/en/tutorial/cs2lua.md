# Invoking Lua from C#

> 💡 PuerTS 3.0 also supports invoking [Javascript](./cs2js.md) and [Python](./cs2python.md) from C#. Each language has its own syntax — click the links to see the corresponding tutorials.

### Calling via Delegates

PuerTS provides a key capability: converting Lua functions into C# delegates. With this, you can call Lua functions from the C# side.

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
    var env = new Puerts.ScriptEnv(new Puerts.BackendLua());
    env.Eval(@"
        local CS = require('csharp')
        -- Create a C# object
        local obj = CS.TestClass()
        -- Assign a Lua function to the C# delegate property
        obj.Callback = function(msg)
            info = msg
        end
        -- Trigger the callback from C# side
        obj:TriggerCallback()
    ");
    // info is now 'hello_from_csharp'
    env.Dispose();
}
```

> ⚠️ Note: When assigning a Lua function to a C# delegate property, use **dot** syntax `obj.Callback = function(...) end`. When calling instance methods, use **colon** syntax `obj:TriggerCallback()`.

You can also directly invoke the delegate from Lua:

```lua
-- Directly invoke the delegate from Lua
obj.Callback:Invoke('hello_from_lua')
```

------------------

### Passing Arguments from C# to Lua

When converting a Lua function to a delegate, you can convert it to a delegate with parameters, allowing you to pass C# variables to Lua. The type conversion rules are the same as when returning variables from C# to Lua.

```csharp
void Start()
{
    var env = new Puerts.ScriptEnv(new Puerts.BackendLua());
    // Get a Lua function as a C# delegate via Eval
    System.Action<int> LogInt = env.Eval<System.Action<int>>(@"
        return function(a)
            print(a)
        end
    ");

    LogInt(3); // Output: 3
    env.Dispose();
}
```

> ⚠️ **Important difference**: Unlike Javascript, Lua's `Eval` requires an explicit **`return`** statement to return values. If you forget `return`, the C# side will receive `null`.

> Note: If your generated delegate has value-type parameters, you need to add a UsingAction or UsingFunc declaration. See the FAQ for details.

------------------

### Calling Lua and Getting Return Values from C#

Similar to the previous section, just change the Action delegate to a Func delegate.

```csharp
void Start()
{
    var env = new Puerts.ScriptEnv(new Puerts.BackendLua());
    // Get a Lua function that returns a value
    System.Func<int, int> Add3 = env.Eval<System.Func<int, int>>(@"
        return function(a)
            return 3 + a
        end
    ");

    System.Console.WriteLine(Add3(1)); // Output: 4
    env.Dispose();
}
```

You can also use `Eval<T>` directly to get simple return values:

```csharp
void Start()
{
    var env = new Puerts.ScriptEnv(new Puerts.BackendLua());
    // Directly evaluate and get the return value
    int result = env.Eval<int>("return 1 + 2");
    System.Console.WriteLine(result); // Output: 3

    string str = env.Eval<string>("return 'hello lua'");
    System.Console.WriteLine(str); // Output: hello lua
    env.Dispose();
}
```

> ⚠️ Reminder: Lua requires `return` to return values. This is one of the biggest differences from Javascript. In JS, the last expression's value is automatically returned; in Lua, without `return` there is no return value.

> Note: If your generated delegate has value-type parameters, you need to add a UsingAction or UsingFunc declaration. See the FAQ for details.

------------------

### Error Handling in Lua

When Lua code throws an error via `error()`, the C# side can catch it with `try-catch`:

```csharp
void Start()
{
    var env = new Puerts.ScriptEnv(new Puerts.BackendLua());

    // Lua error will be caught as a C# exception
    try
    {
        env.Eval("error('something went wrong')");
    }
    catch (Exception e)
    {
        Debug.Log(e.Message); // Contains: something went wrong
    }

    // Errors in Lua functions converted to delegates are also catchable
    try
    {
        var foo = env.Eval<Action>(@"
            return function()
                error('error in function')
            end
        ");
        foo(); // This will throw
    }
    catch (Exception e)
    {
        Debug.Log(e.Message); // Contains: error in function
    }

    env.Dispose();
}
```

------------------

### Environment Disposal and Delegate Lifecycle

After the Lua environment (`ScriptEnv`) is `Dispose()`d, previously converted delegates will no longer be usable. Calling a delegate from a disposed environment will throw an exception — make sure to manage the lifecycle properly.

```csharp
void Start()
{
    var env = new Puerts.ScriptEnv(new Puerts.BackendLua());
    System.Action<string> luaFunc = env.Eval<System.Action<string>>(@"
        return function(msg)
            print(msg)
        end
    ");

    luaFunc("before dispose"); // OK

    env.Dispose();

    // ❌ This will throw an exception!
    // luaFunc("after dispose");
}
```

------------------

### Implementing MonoBehaviour in Lua

Combining all the capabilities above, we can implement MonoBehaviour lifecycle callbacks in Lua:

```csharp
using System;
using Puerts;
using UnityEngine;

public class LuaBehaviour : MonoBehaviour
{
    public Action LuaStart;
    public Action LuaUpdate;
    public Action LuaOnDestroy;

    static ScriptEnv luaEnv;

    void Awake()
    {
        if (luaEnv == null) luaEnv = new ScriptEnv(new BackendLua());

        var init = luaEnv.Eval<Action<MonoBehaviour>>(@"
            return function(bindTo)
                -- Bind Lua functions to C# delegate properties
                bindTo.LuaUpdate = function()
                    print('update...')
                end
                bindTo.LuaOnDestroy = function()
                    print('onDestroy...')
                end
            end
        ");

        if (init != null) init(this);
    }

    void Start()
    {
        if (LuaStart != null) LuaStart();
    }

    void Update()
    {
        if (LuaUpdate != null) LuaUpdate();
    }

    void OnDestroy()
    {
        if (LuaOnDestroy != null) LuaOnDestroy();
        LuaStart = null;
        LuaUpdate = null;
        LuaOnDestroy = null;
    }
}
```

> ⚠️ Key differences between Lua and JS:
> - Lua's `Eval` must use `return` to return functions
> - Assigning delegate properties uses **dot** syntax: `bindTo.LuaUpdate = function() ... end`
> - Calling C# instance methods uses **colon** syntax: `bindTo:SomeMethod()`

------------------

### Key Differences Between Lua and Javascript for C# Invocation

| Feature | Javascript | Lua |
|---------|-----------|-----|
| Eval return values | Last expression's value is auto-returned | Must use `return` explicitly |
| Function syntax | `(a) => { ... }` or `function(a) { ... }` | `function(a) ... end` |
| Delegate assignment | `obj.Callback = (msg) => { ... }` | `obj.Callback = function(msg) ... end` |
| Method calls | Dot syntax for all: `obj.Method()` | Instance methods use colon: `obj:Method()` |
| Console output | `console.log()` | `print()` |
| Null value | `null` / `undefined` | `nil` |

----------------

> 📖 Invoking other languages from C#: [Invoking Javascript](./cs2js.md) | [Invoking Python](./cs2python.md) | [Multi-Language Comparison Cheat Sheet](./lang-comparison.md)

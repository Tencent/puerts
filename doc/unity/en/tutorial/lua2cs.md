# Calling C# from Lua

> 💡 PuerTS 3.0 also supports calling C# from [JavaScript](./js2cs.md) and [Python](./python2cs.md). Each language has its own syntax — click the links to see the corresponding tutorials.

In the previous tutorial, we ran a simple Hello World:

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendLua());
    env.Eval(@"print('hello world')");
    env.Dispose();
}
```

With PuerTS, the integration between Lua and C# goes much further. Read on!

------------------
### Accessing C# Namespaces

To access C# types from Lua, you first need to get the C# namespace entry via `require('csharp')`:

```lua
local CS = require('csharp')
-- Now you can access any C# type through CS
-- e.g.: CS.UnityEngine.Debug, CS.System.Collections.Generic.List_1
```

The `CS` object is the gateway to the C# world. You can access any C# type by providing its FullName (the full namespace path).

Of course, typing the full namespace every time is tedious. You can simplify it by assigning to a local variable:

```lua
local Vector2 = CS.UnityEngine.Vector2
print(Vector2.one)
```

------------------
### Object Creation

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendLua());
    env.Eval(@"
        local CS = require('csharp')
        local v = CS.UnityEngine.Vector3(1, 2, 3)
        print(tostring(v))
        -- (1.0, 2.0, 3.0)
    ");
    env.Dispose();
}
```

In this example, we created a C# Vector3 directly from Lua!

> ⚠️ Note: Lua does **not** use the `new` keyword to create C# objects. Simply call the type as a function. This differs from JS where you use `new CS.xxx()`.

------------------------------------
### Property Access and Method Calls

Once an object is created, calling methods and accessing properties is straightforward.

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendLua());
    env.Eval(@"
        local CS = require('csharp')
        -- Static method call: use dot syntax
        CS.UnityEngine.Debug.Log('Hello World')

        -- Create an object and call instance methods
        local rect = CS.UnityEngine.Rect(0, 0, 2, 2)
        CS.UnityEngine.Debug.Log(rect:Contains(CS.UnityEngine.Vector2.one)) -- True
        rect.width = 0.1
        CS.UnityEngine.Debug.Log(rect:Contains(CS.UnityEngine.Vector2.one)) -- False
    ");
    env.Dispose();
}
```

> ⚠️ Key syntax difference: In Lua, **instance methods use colon `:` syntax** (e.g., `obj:Method()`), while **static methods and properties use dot `.` syntax** (e.g., `Class.Method()`). The colon syntax automatically passes the object itself as the first argument.

```lua
-- Instance method — use colon
local testHelper = CS.Puerts.UnitTest.TestHelper.GetInstance()
testHelper:NumberTestPipeLine(1, outRef, callback)

-- Static method — use dot
CS.Puerts.UnitTest.TestHelper.AssertAndPrint('msg', 1, 1)

-- Property read/write — use dot
testHelper.numberTestField = 3          -- write instance property
local val = testHelper.numberTestField  -- read instance property
CS.Puerts.UnitTest.TestHelper.numberTestFieldStatic = 3  -- write static property
```

---------------------
### ref/out Parameters

C# `ref` and `out` parameters are handled in Lua using **tables** as containers:

```csharp
// C# side
class Example {
    public static double InOutArgFunc(int a, out int b, ref int c)
    {
        Debug.Log("a=" + a + ",c=" + c);
        b = 100;
        c = c * 2;
        return a + b;
    }
}

void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendLua());
    env.Eval(@"
        local CS = require('csharp')
        -- Create tables as out/ref containers
        local outB = {}          -- out parameter: empty table
        local refC = {}
        refC[1] = 10             -- ref parameter: initial value at table[1]

        local ret = CS.Example.InOutArgFunc(100, outB, refC)
        print('ret=' .. ret .. ', out=' .. outB[1] .. ', ref=' .. refC[1])
        -- ret=200, out=100, ref=20
    ");
    env.Dispose();
}
```

> 📌 Rules:
> - `out` parameter: pass an empty table `{}`, the result is stored at `table[1]` after the call
> - `ref` parameter: pass a table with the initial value at `table[1]`, the updated value is at `table[1]` after the call

----------------------------
### Generics

C# generic types in Lua can be created by directly calling the generic type definition with type arguments using parentheses:

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendLua());
    env.Eval(@"
        local CS = require('csharp')

        -- Create List<int> type
        local List = CS.System.Collections.Generic.List_1(CS.System.Int32)
        local ls = List()
        ls:Add(1)
        ls:Add(2)
        ls:Add(3)
    ");
    env.Dispose();
}
```

> ⚠️ Note the generic type naming convention: C# backtick notation (e.g., `` List`1 ``) is represented as **underscores** in Lua (e.g., `List_1`). Common mappings:
> - `List<T>` → `List_1`
> - `Dictionary<TKey, TValue>` → `Dictionary_2`
> - `Action<T>` → `Action_1`

#### Generic Methods

To call generic methods, use `puerts.genericMethod()`:

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendLua());
    env.Eval(@"
        local CS = require('csharp')
        local puerts = require('puerts')

        -- Call static generic method GenericTestClass.StaticGenericMethod<int>()
        local func = puerts.genericMethod(
            CS.Puerts.UnitTest.GenericTestClass,  -- type
            'StaticGenericMethod',                 -- method name
            CS.System.Int32                        -- generic type argument
        )
        print(func())  -- 'Int32'

        -- Call instance generic method
        local testobj = CS.Puerts.UnitTest.GenericTestClass()
        testobj.stringProp = 'world'
        local instanceFunc = puerts.genericMethod(
            CS.Puerts.UnitTest.GenericTestClass,
            'InstanceGenericMethod',
            CS.System.Int32
        )
        print(instanceFunc(testobj))  -- 'world_Int32'
    ");
    env.Dispose();
}
```

> 📌 `puerts.genericMethod()` parameters: first is the type, second is the method name string, followed by generic type arguments. When calling an instance generic method, pass the object instance as the first argument.

#### Accessing Static Members and Nested Types of Generic Classes

```lua
local CS = require('csharp')

-- Create generic class GenericTestClass<string>
local GenericTestClass = CS.Puerts.UnitTest.GenericTestClass_1(CS.System.String)
GenericTestClass.v = '6'

-- Access nested types
GenericTestClass.Inner()
print(GenericTestClass.Inner.stringProp) -- 'hello'
```

----------------------------
### Array & Indexer Access

C#'s `[]` operator (including array indexing, List indexing, Dictionary indexing, and any custom indexer) **cannot** be used directly with `[]` syntax in Lua. You must use `get_Item()` / `set_Item()` methods instead (note the colon syntax):

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendLua());
    env.Eval(@"
        local CS = require('csharp')
        local puerts = require('puerts')
        local typeof = puerts.typeof

        -- Create a C# array
        local arr = CS.System.Array.CreateInstance(typeof(CS.System.Int32), 3)
        arr:set_Item(0, 42)            -- equivalent to C#: arr[0] = 42
        local val = arr:get_Item(0)    -- equivalent to C#: val = arr[0]
        print(val)                     -- 42

        -- Same for List<T>
        local List = CS.System.Collections.Generic.List_1(CS.System.Int32)
        local lst = List()
        lst:Add(10)
        local first = lst:get_Item(0)  -- equivalent to C#: lst[0]
        lst:set_Item(0, 20)            -- equivalent to C#: lst[0] = 20

        -- Same for Dictionary<TKey, TValue>
        local Dict = CS.System.Collections.Generic.Dictionary_2(CS.System.String, CS.System.Int32)
        local dict = Dict()
        dict:set_Item('key', 100)      -- equivalent to C#: dict['key'] = 100
        local v = dict:get_Item('key') -- equivalent to C#: v = dict['key']
    ");
    env.Dispose();
}
```

> ⚠️ **Important**: Since `get_Item` / `set_Item` are instance methods, you must use **colon syntax** `:` in Lua. Lua's native `[]` only works on Lua tables. For indexed access on C# objects, you must use these two methods.

----------------------------
### typeof

Since C#'s `typeof` cannot be accessed through the namespace, PuerTS provides the built-in `puerts.typeof()`:

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendLua());
    env.Eval(@"
        local CS = require('csharp')
        local typeof = require('puerts').typeof

        local go = CS.UnityEngine.GameObject('testObject')
        go:AddComponent(typeof(CS.UnityEngine.ParticleSystem))

        -- Type comparison
        local helper = CS.Puerts.UnitTest.CrossLangTestHelper()
        local val = helper:GetDateTime()
        print(val:GetType() == typeof(CS.System.DateTime))  -- true
    ");
    env.Dispose();
}
```

----------------------------
### Enums

C# enum values can be accessed directly through the namespace path:

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendLua());
    env.Eval(@"
        local CS = require('csharp')
        local helper = CS.Puerts.UnitTest.CrossLangTestHelper()

        -- Read enum value
        local enumVal = helper.EnumField
        print(tostring(enumVal))  -- '213'

        -- Set enum value
        helper.EnumField = CS.Puerts.UnitTest.TestEnum.A
        print(tostring(helper.EnumField))  -- '1'
    ");
    env.Dispose();
}
```

----------------------------
### Operator Overloading

Since Lua's metatable-based operator overloading mechanism differs from C#, you need to use the `op_Xxxx` method names to invoke C# operator overloads:

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendLua());
    env.Eval(@"
        local CS = require('csharp')
        local Vector3 = CS.UnityEngine.Vector3

        -- C#: Vector3.up * 1600
        local ret = Vector3.op_Multiply(Vector3.up, 1600)
        print(tostring(ret))  -- (0.0, 1600.0, 0.0)
    ");
    env.Dispose();
}
```

> 📌 Common operator mappings:
> - `+` → `op_Addition`
> - `-` → `op_Subtraction`
> - `*` → `op_Multiply`
> - `/` → `op_Division`
> - `==` → `op_Equality`

----------------------------
### Passing null

In Lua, use `nil` to represent C#'s `null`:

```lua
local CS = require('csharp')
local testHelper = CS.Puerts.UnitTest.TestHelper.GetInstance()
testHelper:PassStr(nil)   -- pass null string
testHelper:PassObj(nil)   -- pass null object
```

For nullable structs (`Nullable<T>`), also use `nil`:

```lua
local outRef = {}
outRef[1] = nil
testHelper:NullableNativeStructTestPipeLine(nil, outRef, function(obj)
    print(obj == nil)  -- true
    return nil
end)
```

-------------
This covers calling C# from Lua. In the next part, we'll look at the reverse: [Invoking Lua from C#](./cs2lua.md).

> 📖 Calling C# from other languages: [JS to C#](./js2cs.md) | [Python to C#](./python2cs.md) | [Multi-Language Comparison Cheat Sheet](./lang-comparison.md)

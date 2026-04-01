# PuerTS 3.0 Multi-Language Comparison Cheat Sheet

> This table summarizes the syntax differences between JavaScript, Lua, and Python when interacting with C# in PuerTS, for quick reference.
>
> 📖 Detailed tutorials for each language: [JS](./runJS.md) | [Lua](./runLua.md) | [Python](./runPython.md)

---

## 1. Environment Creation

| Language | C# Code |
|----------|---------|
| **JavaScript** | `var env = new ScriptEnv(new BackendV8());` |
| **Lua** | `var env = new ScriptEnv(new BackendLua());` |
| **Python** | `var env = new ScriptEnv(new BackendPython());` |

> All three languages share a unified `ScriptEnv` + `Backend` architecture, differing only in the `Backend` type.

---

## 2. C# Namespace / Type Access

| Language | Syntax |
|----------|--------|
| **JavaScript** | `CS.UnityEngine.Vector3` — access directly via the global `CS` object |
| **Lua** | `local CS = require('csharp')` then `CS.UnityEngine.Vector3` |
| **Python** | `import UnityEngine.Vector3 as Vector3` or `puerts.load_type('UnityEngine.Vector3')` |

---

## 3. Object Creation

| Language | Example |
|----------|---------|
| **JavaScript** | `let v = new CS.UnityEngine.Vector3(1, 2, 3);` |
| **Lua** | `local v = CS.UnityEngine.Vector3(1, 2, 3)` — no `new` |
| **Python** | `v = Vector3(1, 2, 3)` — no `new` |

---

## 4. Instance Method Calls

| Language | Example | Notes |
|----------|---------|-------|
| **JavaScript** | `rect.Contains(point)` | Dot syntax |
| **Lua** | `rect:Contains(point)` | **Colon syntax** (auto-passes self) |
| **Python** | `rect.Contains(point)` | Dot syntax |

---

## 5. Static Method Calls

| Language | Example |
|----------|---------|
| **JavaScript** | `CS.UnityEngine.Debug.Log('msg')` |
| **Lua** | `CS.UnityEngine.Debug.Log('msg')` — dot syntax |
| **Python** | `Debug.Log('msg')` — requires `import` first |

> In Lua, static methods use dot `.`, instance methods use colon `:`; JS and Python uniformly use dot.

---

## 6. Property Read/Write

| Language | Read | Write |
|----------|------|-------|
| **JavaScript** | `let w = rect.width` | `rect.width = 0.1` |
| **Lua** | `local w = rect.width` | `rect.width = 0.1` |
| **Python** | `w = rect.width` | `rect.width = 0.1` |

> Property read/write syntax is identical across all three languages, all using dot notation.

---

## 7. ref/out Parameters

| Language | Create Container | Pass as Argument | Get Result |
|----------|-----------------|-----------------|------------|
| **JavaScript** | `let p = puer.$ref(initialValue)` | `Func(p)` | `puer.$unref(p)` |
| **Lua** | `local p = {initialValue}` or `{}` | `Func(p)` | `p[1]` |
| **Python** | `p = [initialValue]` or `[None]` | `Func(p)` | `p[0]` |

Comparison example (`out int b, ref int c`):

```javascript
// JavaScript
let outB = puer.$ref();
let refC = puer.$ref(10);
Example.InOutArgFunc(100, outB, refC);
console.log(puer.$unref(outB), puer.$unref(refC)); // 100, 20
```

```lua
-- Lua
local outB = {}
local refC = {10}
CS.Example.InOutArgFunc(100, outB, refC)
print(outB[1], refC[1])  -- 100, 20
```

```python
# Python
outB = [None]
refC = [10]
Example.InOutArgFunc(100, outB, refC)
print(outB[0], refC[0])  # 100, 20
```

---

## 8. Generic Type Creation

| Language | Generic Class Name | Creating `List<int>` |
|----------|--------------------|---------------------|
| **JavaScript** | `List$1` | `puer.$generic(CS.System.Collections.Generic.List$1, CS.System.Int32)` |
| **Lua** | `List_1` | `CS.System.Collections.Generic.List_1(CS.System.Int32)` |
| **Python** | `List` | `List[System.Int32]` |

> In Python, using `import XXX` imports a special generic factory type. When called with type arguments, it creates an instance of a generic type based on the number of mixed-in type arguments.

---

## 9. Generic Method Calls

| Language | Syntax |
|----------|--------|
| **JavaScript** | Call directly, V8 auto-infers type parameters |
| **Lua** | `puerts.genericMethod(Type, 'MethodName', GenericArgs...)` |
| **Python** | `puerts.generic_method(Type, 'MethodName', GenericArgs...)` |

```lua
-- Lua example
local func = puerts.genericMethod(CS.MyClass, 'MyMethod', CS.System.Int32)
func(obj)
```

---

## 10. Array and Indexer Access (`[]` Operator)

C# `[]` operators (arrays, `List`, `Dictionary`, custom indexers) **cannot** be accessed directly with `[]` in these three languages. You must use `get_Item()` / `set_Item()`.

| Language | Read (C# `arr[0]`) | Write (C# `arr[0] = val`) |
|----------|---------------------|---------------------------|
| **JavaScript** | `arr.get_Item(0)` | `arr.set_Item(0, val)` |
| **Lua** | `arr:get_Item(0)` | `arr:set_Item(0, val)` |
| **Python** | `arr.get_Item(0)` | `arr.set_Item(0, val)` |

> ⚠️ Lua uses colon `:` syntax for instance methods, while JS and Python use dot `.` syntax. This rule applies to all C# types with indexers (arrays, `List`, `Dictionary`, etc.).

---

## 11. typeof

| Language | Syntax |
|----------|--------|
| **JavaScript** | `puer.$typeof(CS.UnityEngine.ParticleSystem)` |
| **Lua** | `require('puerts').typeof(CS.UnityEngine.ParticleSystem)` |
| **Python** | `puerts.typeof(ParticleSystem)` |

---

## 12. null Representation

| Language | Script-side null | Notes |
|----------|-----------------|-------|
| **JavaScript** | `null` / `undefined` | Standard JS null values |
| **Lua** | `nil` | Standard Lua null value |
| **Python** | `None` | Standard Python null value |

---

## 13. Callbacks / Lambda

| Language | Example |
|----------|---------|
| **JavaScript** | `obj.Callback = (msg) => { console.log(msg); }` |
| **Lua** | `obj.Callback = function(msg) print(msg) end` |
| **Python** | `obj.Callback = lambda msg: print(msg)` |

Getting a script function as a delegate on the C# side:

```csharp
// Same for all three languages
Action<string> fn = env.Eval<Action<string>>("script code");
fn("hello");
```

---

## 14. Throwing Exceptions

| Language | Syntax |
|----------|--------|
| **JavaScript** | `throw new Error('msg')` |
| **Lua** | `error('msg')` |
| **Python** | `raise Exception('msg')` |

> Exceptions thrown from the script side are wrapped as corresponding exception types on the C# side, catchable via `try/catch`.

---

## Appendix: Key API Reference Table

| Feature | JavaScript (`puer.xxx`) | Lua (`require('puerts').xxx`) | Python (`puerts.xxx`) |
|---------|------------------------|------------------------------|----------------------|
| Generic type | `puer.$generic()` | `List_1(TypeArgs...)` — direct call | You can import the generic directly using `import` (e.g., `import List`). For details, refer to the explanation of generics above. |
| Generic method | — (auto-inferred) | `puerts.genericMethod()` | `puerts.generic_method()` |
| typeof | `puer.$typeof()` | `puerts.typeof()` | `puerts.typeof()` |
| ref/out create | `puer.$ref()` | `{}` (table) | `[]` (list) |
| ref/out retrieve | `puer.$unref()` | `[1]` | `[0]` |
| async/await | `puer.$promise(task)` | — | — |

---

> 📖 Detailed tutorials for each language:
> - JavaScript: [Getting Started](./runJS.md) · [JS to C#](./js2cs.md) · [C# to JS](./cs2js.md)
> - Lua: [Getting Started](./runLua.md) · [Lua to C#](./lua2cs.md) · [C# to Lua](./cs2lua.md)
> - Python: [Getting Started](./runPython.md) · [Python to C#](./python2cs.md) · [C# to Python](./cs2python.md)

# PuerTS 3.0 三语言对比速查表

> 本表汇总了 JavaScript、Lua、Python 在 PuerTS 中与 C# 交互的语法差异，方便快速查阅。
>
> 📖 各语言详细教程：[JS](./runJS.md) | [Lua](./runLua.md) | [Python](./runPython.md)

---

## 1. 环境创建

| 语言 | C# 代码 |
|------|---------|
| **JavaScript** | `var env = new ScriptEnv(new BackendV8());` |
| **Lua** | `var env = new ScriptEnv(new BackendLua());` |
| **Python** | `var env = new ScriptEnv(new BackendPython());` |

> 三种语言共享统一的 `ScriptEnv` + `Backend` 架构，仅 `Backend` 类型不同。

---

## 2. C# 命名空间 / 类型访问

| 语言 | 语法 |
|------|------|
| **JavaScript** | `CS.UnityEngine.Vector3` — 全局 `CS` 对象直接访问 |
| **Lua** | `local CS = require('csharp')` 然后 `CS.UnityEngine.Vector3` |
| **Python** | `import UnityEngine.Vector3 as Vector3` 或 `puerts.load_type('UnityEngine.Vector3')` |

---

## 3. 对象创建

| 语言 | 示例 |
|------|------|
| **JavaScript** | `let v = new CS.UnityEngine.Vector3(1, 2, 3);` |
| **Lua** | `local v = CS.UnityEngine.Vector3(1, 2, 3)` — 无 `new` |
| **Python** | `v = Vector3(1, 2, 3)` — 无 `new` |

---

## 4. 实例方法调用

| 语言 | 示例 | 说明 |
|------|------|------|
| **JavaScript** | `rect.Contains(point)` | 点号语法 |
| **Lua** | `rect:Contains(point)` | **冒号语法**（自动传入 self） |
| **Python** | `rect.Contains(point)` | 点号语法 |

---

## 5. 静态方法调用

| 语言 | 示例 |
|------|------|
| **JavaScript** | `CS.UnityEngine.Debug.Log('msg')` |
| **Lua** | `CS.UnityEngine.Debug.Log('msg')` — 点号语法 |
| **Python** | `Debug.Log('msg')` — 需先 `import` |

> Lua 中静态方法用点号 `.`，实例方法用冒号 `:`；JS 和 Python 统一使用点号。

---

## 6. 属性读写

| 语言 | 读取 | 写入 |
|------|------|------|
| **JavaScript** | `let w = rect.width` | `rect.width = 0.1` |
| **Lua** | `local w = rect.width` | `rect.width = 0.1` |
| **Python** | `w = rect.width` | `rect.width = 0.1` |

> 三种语言的属性读写语法完全一致，均使用点号。

---

## 7. ref/out 参数

| 语言 | 创建容器 | 传入参数 | 获取结果 |
|------|---------|---------|---------|
| **JavaScript** | `let p = puer.$ref(初始值)` | `Func(p)` | `puer.$unref(p)` |
| **Lua** | `local p = {初始值}` 或 `{}` | `Func(p)` | `p[1]` |
| **Python** | `p = [初始值]` 或 `[None]` | `Func(p)` | `p[0]` |

示例对比（`out int b, ref int c`）：

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

## 8. 泛型类型创建

| 语言 | 泛型类名写法 | 创建 `List<int>` |
|------|-------------|-----------------|
| **JavaScript** | `List$1` | `puer.$generic(CS.System.Collections.Generic.List$1, CS.System.Int32)` |
| **Lua** | `List_1` | `puerts.generic(CS.System.Collections.Generic.List_1, CS.System.Int32)` |
| **Python** | `List__T1`（import 时）或 `` List`1 ``（load_type 时） | `puerts.generic(List, System.Int32)` |

> 三种语言中反引号 `` ` `` 的替代符不同：JS 用 `$`，Lua 用 `_`，Python import 时用 `__T`。

---

## 9. 泛型方法调用

| 语言 | 语法 |
|------|------|
| **JavaScript** | 直接调用，V8 自动推断类型参数 |
| **Lua** | `puerts.genericMethod(类型, '方法名', 泛型参数...)` |
| **Python** | `puerts.genericMethod(类型, '方法名', 泛型参数...)` |

```lua
-- Lua 示例
local func = puerts.genericMethod(CS.MyClass, 'MyMethod', CS.System.Int32)
func(obj)
```

---

## 10. typeof

| 语言 | 语法 |
|------|------|
| **JavaScript** | `puer.$typeof(CS.UnityEngine.ParticleSystem)` |
| **Lua** | `require('puerts').typeof(CS.UnityEngine.ParticleSystem)` |
| **Python** | `puerts.typeof(ParticleSystem)` |

---

## 11. null 表示

| 语言 | 脚本侧 null | 说明 |
|------|-------------|------|
| **JavaScript** | `null` / `undefined` | 标准 JS 空值 |
| **Lua** | `nil` | 标准 Lua 空值 |
| **Python** | `None` | 标准 Python 空值 |

---

## 12. 回调函数 / Lambda

| 语言 | 示例 |
|------|------|
| **JavaScript** | `obj.Callback = (msg) => { console.log(msg); }` |
| **Lua** | `obj.Callback = function(msg) print(msg) end` |
| **Python** | `obj.Callback = lambda msg: print(msg)` |

C# 侧获取脚本函数为 delegate：

```csharp
// 三种语言通用
Action<string> fn = env.Eval<Action<string>>("脚本代码");
fn("hello");
```

---

## 13. 异常抛出

| 语言 | 语法 |
|------|------|
| **JavaScript** | `throw new Error('msg')` |
| **Lua** | `error('msg')` |
| **Python** | `raise Exception('msg')` |

> 脚本侧抛出的异常在 C# 侧会被封装为对应的异常类型，可通过 `try/catch` 捕获。

---

## 附：关键 API 对照表

| 功能 | JavaScript (`puer.xxx`) | Lua (`require('puerts').xxx`) | Python (`puerts.xxx`) |
|------|------------------------|------------------------------|----------------------|
| 泛型类型 | `puer.$generic()` | `puerts.generic()` | `puerts.generic()` |
| 泛型方法 | — (自动推断) | `puerts.genericMethod()` | `puerts.genericMethod()` |
| typeof | `puer.$typeof()` | `puerts.typeof()` | `puerts.typeof()` |
| ref/out 创建 | `puer.$ref()` | `{}` (table) | `[]` (list) |
| ref/out 取值 | `puer.$unref()` | `[1]` | `[0]` |
| async/await | `puer.$promise(task)` | — | — |

---

> 📖 各语言详细教程：
> - JavaScript: [入门](./runJS.md) · [JS 调用 C#](./js2cs.md) · [C# 调用 JS](./cs2js.md)
> - Lua: [入门](./runLua.md) · [Lua 调用 C#](./lua2cs.md) · [C# 调用 Lua](./cs2lua.md)
> - Python: [入门](./runPython.md) · [Python 调用 C#](./python2cs.md) · [C# 调用 Python](./cs2python.md)

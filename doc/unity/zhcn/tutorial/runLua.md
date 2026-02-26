# 开始PuerTS之旅（Lua篇）

> **PuerTS 3.0 多语言支持**：从 3.0 版本起，PuerTS 新增了对 **Lua** 和 **Python** 的支持，与原有的 JavaScript/TypeScript 共享统一的 `ScriptEnv` + `Backend` 架构。本篇介绍如何使用 Lua 作为脚本语言。如需了解其他语言，请参阅 [JS 入门教程](./runJS.md) 或 [Python 入门教程](./runPython.md)。

首先，请跟随[安装指引](../install.md)将PuerTS装入你的Unity项目，并确保已引入 Lua 后端（`BackendLua`）。

------------

然后，在Unity里准备好一个场景及一个MonoBehaviour组件，在MonoBehaviour里编写如下代码：

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

执行后，你能看见Unity控制台中打印出了`hello world`。

成功了！

这就意味着，我们在Unity里执行了一段真正的Lua脚本！

> **提示**：Lua 中的 `print()` 函数会自动映射到 Unity 控制台输出（`Debug.Log`），无需额外配置。

------------

## 与 JS 版本的主要差异

如果你之前使用过 PuerTS 的 JS 版本，以下是切换到 Lua 时需要注意的要点：

| 对比项 | JavaScript | Lua |
|-------|-----------|-----|
| 环境创建 | `new ScriptEnv(new BackendV8())` | `new ScriptEnv(new BackendLua())` |
| 控制台输出 | `console.log(...)` | `print(...)` |
| 访问 C# 类 | `puer.$typeof(CS.Namespace.Class)` | `require('csharp')` 获取命名空间入口 |
| 方法调用 | `obj.Method()` | 实例方法用 `obj:Method()`，静态方法用 `Class.Method()` |
| null 表示 | `null` / `undefined` | `nil` |

> **注意**：Lua 版本**没有** `JsEnv` 的兼容写法，直接使用 `ScriptEnv` + `BackendLua` 即可。

------------

## 使用 Eval 执行脚本并获取返回值

除了直接执行代码，你还可以通过泛型 `Eval<T>` 获取 Lua 脚本的返回值：

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

> **注意**：在 Lua 中，`Eval` 返回值时需要显式使用 `return` 语句。这与 JS 版本不同——JS 中最后一个表达式的值会自动作为返回值。

------------

## 错误处理

Lua 脚本执行出错时，会抛出 C# 异常，你可以用 `try-catch` 捕获：

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

常见的错误类型包括：
- **语法错误**：如 `return 1 +` 这类不完整的语句
- **运行时错误**：如调用不存在的函数 `obj.nonexistent()`
- **显式抛出**：通过 `error('message')` 主动抛出错误

------------

## 传递 nil

Lua 中的 `nil` 对应 C# 中的 `null`。你可以在调用 C# 方法时传递 `nil`：

```lua
local CS = require('csharp')
local obj = CS.SomeNamespace.SomeClass()
obj:SomeMethod(nil)  -- equivalent to passing null in C#
```

------------

在PuerTS的帮助下，Lua和C#的打通还可以更精彩，请往下看

**相关教程：**
- [Lua 调用 C#](./lua2cs.md) | [C# 调用 Lua](./cs2lua.md)
- [JS 入门](./runJS.md) | [Python 入门](./runPython.md)
- [三语言对比速查表](./lang-comparison.md)

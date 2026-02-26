# 开始PuerTS之旅（Python篇）

> **PuerTS 3.0 多语言支持**：从 3.0 版本起，PuerTS 新增了对 **Lua** 和 **Python** 的支持，与原有的 JavaScript/TypeScript 共享统一的 `ScriptEnv` + `Backend` 架构。本篇介绍如何使用 Python 作为脚本语言。如需了解其他语言，请参阅 [JS 入门教程](./runJS.md) 或 [Lua 入门教程](./runLua.md)。

> **平台限制**：Python 后端当前**不支持** WebGL、iOS、Android 平台。仅可在桌面平台（Windows、macOS、Linux）及 Editor 中使用。

首先，请跟随[安装指引](../install.md)将PuerTS装入你的Unity项目，并确保已引入 Python 后端（`BackendPython`）。

------------

然后，在Unity里准备好一个场景及一个MonoBehaviour组件，在MonoBehaviour里编写如下代码：

```csharp
using Puerts;

void Start() {
    var pyEnv = new ScriptEnv(new BackendPython());
    pyEnv.Eval("print('hello world')");
    pyEnv.Dispose();
}
```

执行后，你能看见Unity控制台中打印出了`hello world`。

成功了！

这就意味着，我们在Unity里执行了一段真正的Python脚本！

> **提示**：Python 中的 `print()` 函数会自动映射到 Unity 控制台输出（`Debug.Log`），无需额外配置。

------------

## 执行多行代码

与 JS 和 Lua 不同，Python 对缩进敏感。在 `Eval` 中执行多行 Python 代码时，需要使用 `exec('''...''')` 包裹：

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

> **注意**：`exec()` 用于执行多行语句块。如果只是单行表达式（如 `print('hello')`），可以不使用 `exec()` 包裹。

------------

## 与 JS/Lua 版本的主要差异

如果你之前使用过 PuerTS 的 JS 或 Lua 版本，以下是切换到 Python 时需要注意的要点：

| 对比项 | JavaScript | Lua | Python |
|-------|-----------|-----|--------|
| 环境创建 | `new ScriptEnv(new BackendV8())` | `new ScriptEnv(new BackendLua())` | `new ScriptEnv(new BackendPython())` |
| 控制台输出 | `console.log(...)` | `print(...)` | `print(...)` |
| 多行代码 | 直接书写 | 直接书写 | 需 `exec('''...''')` 包裹 |
| 访问 C# 类 | `puer.$typeof(CS.Namespace.Class)` | `require('csharp')` | `import Namespace.Class` |
| 方法调用 | `obj.Method()` | `obj:Method()` | `obj.Method()` |
| null 表示 | `null` / `undefined` | `nil` | `None` |
| 平台支持 | 全平台 | 全平台 | 仅桌面平台 |

> **注意**：Python 版本**没有** `JsEnv` 的兼容写法，直接使用 `ScriptEnv` + `BackendPython` 即可。

> **注意**：Python 不支持将 class 传递给 C# 作为 `ScriptObject`，这是当前的已知限制。

------------

## 使用 Eval 执行脚本并获取返回值

你可以通过泛型 `Eval<T>` 获取 Python 表达式的返回值：

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

> **注意**：对于简单表达式（如 `1 + 2`、`lambda`），Python 会自动返回表达式的值，无需 `return`。但对于通过 `exec()` 定义的函数，需要先定义再通过变量名取出。

------------

## 错误处理

Python 脚本执行出错时，会抛出 C# 异常，你可以用 `try-catch` 捕获：

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

常见的错误类型包括：
- **语法错误（SyntaxError）**：如 `def test(): return 1 +` 这类不完整的语句
- **运行时错误（KeyError/TypeError 等）**：如访问不存在的字典键 `obj['nonexistent']()`
- **模块未找到（ModuleNotFoundError）**：如 `import notfound.whatever`
- **显式抛出**：通过 `raise Exception('message')` 主动抛出异常

------------

## 传递 None

Python 中的 `None` 对应 C# 中的 `null`。你可以在调用 C# 方法时传递 `None`：

```python
import Puerts.UnitTest.TestHelper as TestHelper
obj = TestHelper.GetInstance()
obj.PassStr(None)   # equivalent to passing null for string parameter
obj.PassObj(None)   # equivalent to passing null for object parameter
```

------------

在PuerTS的帮助下，Python和C#的打通还可以更精彩，请往下看

**相关教程：**
- [Python 调用 C#](./python2cs.md) | [C# 调用 Python](./cs2python.md)
- [JS 入门](./runJS.md) | [Lua 入门](./runLua.md)
- [三语言对比速查表](./lang-comparison.md)

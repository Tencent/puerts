# 开始PuerTS之旅

> **PuerTS 3.0 多语言支持**：从 3.0 版本起，PuerTS 不再仅支持 JavaScript/TypeScript，还新增了 **Lua** 和 **Python** 的支持。三种语言共享统一的 `ScriptEnv` + `Backend` 架构。如果你希望使用 Lua 或 Python，请参阅 [Lua 入门教程](./runLua.md) 或 [Python 入门教程](./runPython.md)。

首先，请跟随[安装指引](../install.md)将PuerTS装入你的Unity项目

------------

然后，在Unity里准备好一个场景及一个MonoBehaviour组件，在MonoBehaviour里编写如下代码：

**推荐写法（3.0+）：** 使用 `ScriptEnv` + `BackendV8`
```csharp
// Hello World — 推荐写法
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.Backend.V8.BackendV8());
    env.Eval(@"
        console.log('hello world');
    ");
    env.Dispose();
}
```

<details>
<summary>兼容写法（旧版 JsEnv）</summary>

> `JsEnv` 在 3.0 中已标记为 `[Obsolete]`，仍可使用但建议迁移到 `ScriptEnv`。

```csharp
// Hello World — 兼容写法
void Start() {
    Puerts.JsEnv env = new Puerts.JsEnv();
    env.Eval(@"
        console.log('hello world');
    ");
}
```
</details>

执行后，你能看见Unity控制台中打印出了`hello world`。

![throttle cpu](../../../pic/1.png)

成功了！

这就意味着，我们在Unity里执行了一段真正的Javascript！

PuerTS就是这么容易！

------------

在PuerTS的帮助下，Javascript和C#的打通还可以更精彩，请往下看

**相关教程：**
- [JS 调用 C#](./js2cs.md) | [C# 调用 JS](./cs2js.md)
- [Lua 入门](./runLua.md) | [Python 入门](./runPython.md)
- [三语言对比速查表](./lang-comparison.md)
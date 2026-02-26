# Getting Started with PuerTS

> **PuerTS 3.0 Multi-Language Support**: Starting from version 3.0, PuerTS supports not only JavaScript/TypeScript but also **Lua** and **Python**. All three languages share a unified `ScriptEnv` + `Backend` architecture. If you want to use Lua or Python, please refer to the [Lua Getting Started](./runLua.md) or [Python Getting Started](./runPython.md) tutorials.

First, please follow the [installation guide](../install.md) to install PuerTS into your Unity project.

------------

Then, prepare a scene and a MonoBehaviour component in Unity, and write the following code in the MonoBehaviour:

**Recommended syntax (3.0+):** Using `ScriptEnv` + `BackendV8`
```csharp
// Hello World — Recommended syntax
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.Backend.V8.BackendV8());
    env.Eval(@"
        console.log('hello world');
    ");
    env.Dispose();
}
```

<details>
<summary>Legacy syntax (old JsEnv)</summary>

> `JsEnv` has been marked as `[Obsolete]` in 3.0. It still works but migration to `ScriptEnv` is recommended.

```csharp
// Hello World — Legacy syntax
void Start() {
    Puerts.JsEnv env = new Puerts.JsEnv();
    env.Eval(@"
        console.log('hello world');
    ");
}
```
</details>

After execution, you will see `hello world` in the Unity console.

![throttle cpu](../../../pic/1.png)

Success!

This means that we have executed real JavaScript in Unity!

That's how easy it is with PuerTS!

------------

With the help of PuerTS, the integration between JavaScript and C# can be even more exciting. Keep reading.

**Related tutorials:**
- [Calling C# from JS](./js2cs.md) | [Invoking JS from C#](./cs2js.md)
- [Lua Getting Started](./runLua.md) | [Python Getting Started](./runPython.md)
- [Multi-Language Comparison Cheat Sheet](./lang-comparison.md)
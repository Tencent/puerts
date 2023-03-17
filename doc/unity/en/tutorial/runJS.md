# Getting Started with PuerTS
First, please follow the [installation guide](../install.md) to install PuerTS into your Unity project.

Then, prepare a scene and a MonoBehaviour component in Unity, and write the following code in the MonoBehaviour:

```csharp
//1. Hello World
void Start() {
    Puerts.JsEnv env = new Puerts.JsEnv();
    env.Eval(@"
        console.log('hello world');
    ")
}
```
After execution, you will see `Hello world` in the Unity console.

![throttle cpu](../../..//pic/1.png)

Success!

This means that we have executed real JavaScript in Unity!

That's how easy it is with PuerTS!

------------

With the help of PuerTS, the integration between JavaScript and C# can be even more exciting. Keep reading.
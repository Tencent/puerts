# VSCode Debug Guide
Here, we recommend using VSCode for debugging. But if you are debugging on mobile, we recommend that you refer to the [development blog](https://zhuanlan.zhihu.com/p/359598262).

* When creating a new JsEnv, you need to enter the port and the output directory of the VSCode project's JavaScript as shown below, and call the Tick function of JsEnv at an appropriate location.
```csharp

// 8080 is the port used for connection, which should match the setting in .vscode\launch.json under the VSCode project directory.
void Start()
{
    jsEnv = new JsEnv(new DefaultLoader("F:/puerts/unity/TsProj/output/"), 8080);
}

void Update()
{
    jsEnv.Tick();
}
```
* Waiting for the debugger to connect
- The debugger connects through WebSocket, during which there are TCP handshake, WebSocket handshake, and exchange of some information between the debugger and V8. The whole process takes a few hundred milliseconds.
- Scripts executed during these few hundred milliseconds cannot have breakpoints. If you want to set breakpoints for these codes, you can use the "wait for debugger" feature of Puerts.
- If the C# version is higher than 7.2 (supporting async), it is recommended to use asynchronous waiting. Otherwise, use synchronous blocking waiting.
## Example of asynchronous waiting
```csharp
async void RunScript()
{
    jsEnv = new JsEnv(new DefaultLoader("E:/puerts_unity_demo/TsProj/output/"), 8080);
    await jsEnv.WaitDebuggerAsync();
    jsEnv.Eval("require('QuickStart')");
}

void Start()
{
    RunScript();
}

void Update()
{
    jsEnv.Tick();
}
```
** Example of synchronous blocking waiting

```csharp
void Start()
{
    jsEnv = new JsEnv(new DefaultLoader("E:/puerts_unity_demo/TsProj/output/"), 8080);
    jsEnv.WaitDebugger();
    jsEnv.Eval("require('QuickStart')");
}

void Update()
{
    jsEnv.Tick();
}
```
* In VSCode, open the setting, search for "auto attach", and set "Debug>Node:Auto Attach" to "on" (this option may not exist in higher versions of VSCode and can be left unset).

* Open the "ProjectSetting/Player" page and check "Run In Background".
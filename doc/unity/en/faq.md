# FAQ

## ErrorCode relavanted

#### [Puer001]DllNotFoundException: puerts

This error means that Unity cannot load the Native Plugin of PuerTS, such as `.dll` on Windows, `.dylib` or `.bundle` on macOS, `.a`, `.so`, etc. on other platforms.

There are several possible reasons for this error:
1. You did not put the Native Plugin of PuerTS in the Assets directory.
2. The Import Setting of the Native Plugin, i.e., the platform setting, is not correct. Please click on the corresponding file in Unity to set the platform correctly. Alternatively, you can copy the corresponding meta file from the [official demo project](https://github.com/chexiongsheng/puerts_unity_demo).
3. The system library that the Native Plugin depends on does not exist. You can use `otool` on Mac, `objdump` on Linux, or [Dependencies](https://github.com/lucasg/Dependencies) on Windows to check the dependencies of the Native Plugin file. After finding out the missing dependencies, you need to install them yourself.

Related issue: https://github.com/Tencent/puerts/issues/941

#### [Puer002]module not found | [Puer003]module not found

`Puer002` means that PuerTS cannot find the corresponding js file when loading the js file. Specifically, when calling the `FileExists` function of ILoader or the `Resolve` function of IResolvableLoader, it returns false or an empty string or null.

If you encounter this problem, first check whether you are using the DefaultLoader (i.e., not passing any parameters when creating JsEnv) or your own custom Loader. Then check the `FileExists` function or the `Resolve` function of this Loader to see why it returns an incorrect value.

`Puer003` is similar to `Puer002`, except that the `ReadFile` function of Loader returns empty. You also need to check why `FileExists` or `Resolve` returns true, but `ReadFile` reads empty.

#### [Puer W001] You are not using upm to install PuerTS or did not add 'PUERTS_CPP_OUTPUT_TO_UPM' definition.

In xil2cpp mode, the product of PuerTS->Generate needs to be recompiled by the plugin to be used. Therefore, Puer needs to put the product of Generate back to the plugin source code directory. 

If you did not use the recommended way of [document](./performance/il2cpp.md) to `git clone` and add PuerTS from the package manager, plus adding the `PUERTS_CPP_OUTPUT_TO_UPM` macro, you need to take the compiled product and compile the plugin yourself.

## Installation relavanted

#### What do `Stable/Latest`, `RC/Preview` mean in versions?
1. Stable: Stable means that this version has been verified for a long time and can be used stably with few obvious problems.
2. latest: Latest means that this versions will carry the latest features, such as compatibility with recent upstream/downstream changes (such as the launch of the mac m series CPU), better performance or stronger feature.

`pre/rc` in version tag:
2. Preview or pre: Preview means that this version comes with some experimental features, and these features may be modified/deleted in the future
3. RC: Means release candidate. A version entering RC from preview means that this version number will not add/modify/delete functions radically, and the number of bugs will gradually converge. When there is no bug feedback for a period of time, it will enter the release stage.

#### What do V8/QuickJS/NodeJS mean in PuerTS backend?
1. PuerTS itself is not responsible for compiling or interpreting JavaScript, but does this by introducing third-party JS engines. By default, the NodeJS engine is used. However, depending on the different usage scenarios, you can also use the QuickJS and NodeJS backends.
2. V8 the classic choise. best performance, debugging support, and medium size.
3. QuickJS does not support debugging and JIT, but it is very small. Sometimes you may need to compress the installation package size. Then you can use the quickjs version of plugins.
4. NodeJS is the backend used in OpenUPM package. For a detailed introduction to NodeJS, please refer to the [official website](https://nodejs.org/). It provides APIs such as **files** and **networks** based on v8. It supports most of the powerful ecology of JavaScript. With it, you can use various packages brought by npm more smoothly. If you have follow-up questions about using npm packages, please refer to [puerts-ts-loader](https://github.com/zombieyang/puerts-ts-loader).

#### How to choose between OpenUPM/Git Clone/Copy installation?
1. **Simplest Step-OpenUPM**: You only need to run `openupm add xxx`. However, it is limited by the upm design of Unity itself. When you modify the internal code of the package, Unity will automatically reset it for you. If you have modification requirements, you need to copy the package contents from Library/PackageCache by yourself, and then change it to use the local path in PackageManager.
2. **Most Flexible-Git Clone and add**: Git Clone and then use the local path in PackageManager can directly solve the problem of difficult modification. But you'd better check out the appropriate tag to use (the code on the master branch is not always fully tested).
3. **Brain Dead Easy-just copy into Unity**: Download and install from [github release](https://github.com/Tencent/puerts/releases) without any prior knowledge, the easiest to get started. However, after version 2.0, PuerTS will gradually add some auxiliary functions that are only available in the UPM system, and will not work in this installation way.


## Other

#### invalid arguments to XXX

If you use js, it may be because you entered the wrong arguments.

If you use typescript, it may be because a function with the same name but different parameters in the subclass overrides the function in the parent class. For example, `System.Text.Encoding.UTF8.GetBytes` will cause an error if you call it directly.

```csharp
System.Text.Encoding.UTF8.GetBytes("你好");
```

The object that `System.Text.Encoding.UTF8` points to is `System.Text.UTF8Encoding`, which has other overloads of `GetBytes`. According to the current implementation, if a function with the same name is found in the current class, it will not look for the base class. In this case, you can manually specify to access the object using its base class interface.

```csharp
Object.setPrototypeOf(System.Text.Encoding.UTF8, System.Text.Encoding.prototype);//Only need to call it once. Subsequent calls to GetBytes do not need to call it again.
System.Text.Encoding.UTF8.GetBytes("你好");
```

#### setInterval does not callback

It may be because you did not call JsEnv.Tick.

#### How to debug

This is [vscode](./knowjs/debugging.md). For other IDEs, please refer to their guides and handle them as nodejs debugging.

#### How to handle the debugpath parameter of ILoader when debugging?

When you call `require('./a/b')` in ts/js, ILoader will be called and passed the string ".../a/b.js" (the complete path relative to rootPath). You need to understand this string and load the js file (from file/memory/network, etc.) and return it directly. The debugpath needs to return a file path that the debugger can understand (such as the absolute path of the js file: D:/.../a/b.js), which is returned by setting the out string debuggpath parameter. The debugger will subsequently match the breakpoint on the file based on this file path.
> Windows platform does not distinguish between file name case and uses backslash "\\" instead of "/"

#### can not find delegate bridge for XXX

Sometimes you will get this error when you map a js function to a delegate. XXX is the delegate to be mapped, and the possible situations are as follows:

* The delegate has value type parameters or return values. Solution: If there is no return value, use JsEnv.UsingAction to declare it. If there is a return value, use JsEnv.UsingFunc to declare it. For the necessity of doing this work, please refer to this [stackoverflow question](https://stackoverflow.com/questions/56183606/invoke-generic-method-via-reflection-in-c-sharp-il2cpp-on-ios).

* The number of parameters exceeds 4. Solution: The official currently only supports 4. If necessary, you can write more parameter support by analogy.

* The parameters contain the ref or out modifier, which is not currently supported. Solution: Fill in the issues to provide requirements.

```csharp
// 代码示例
Puerts.JsEnv jsEnv = new Puerts.JsEnv();
jsEnv.UsingFunc<int, int>();
System.Func<int, int> add = env.Eval<System.Func<int, int>>(@"
    const add_func = function (num) {
        return num + 1;
    }
    add_func;
");
Console.WriteLine(add(10));
```

#### macOS 10.15 or later prompts that puerts.bundle is damaged and moves it to the trash when starting Unity

Execute

~~~bash
sudo xattr -r -d com.apple.quarantine puerts.bundle
~~~ 

#### The generated code reports that the method (runInEditMode, etc.) cannot be found when packaging for mobile

Because these methods are unique to the editor, they can be filtered out using the filter. Please refer to the [user manual](wrapper/filter.md) for the configuration of link.xml.

#### The code generated in the editor runs normally, but calling functions/accessing properties fails after il2cpp packaging

Unity will perform code pruning by default. In short, if Unity finds that some engine APIs or system APIs have not been used in the business C#, it will not compile them to cpp. Solution: 1. Generate wrap code for the API to be called, so that C# has a reference to it; 2. Inform Unity not to prune by using link.xml. Please refer to the Unity official documentation for the configuration of link.xml.

#### The code generated in the editor runs normally, but the generated code reports that "there is no definition of a certain method/property/field" after packaging. What should I do?

Often, the method/property/field is defined in conditional compilation, and it is only valid under UNITY_EDITOR. In this case, you need to filter out this method/property/field using the Filter tag, and then regenerate the code and package it. ([discussions说明](https://github.com/Tencent/puerts/discussions/806))

#### The extension method reports an error after packaging (static code is not generated)

By default, reflection is not used to obtain extension functions after packaging. You can use the `PUERTS_REFLECT_ALL_EXTENSION` macro to enable reflection. (Reflection is slow, it is recommended to generate static code at all times)

#### `GetComponent<XXX>()` is null in CS, but not null when called in JS, why?

Actually, the C# object is not null. It is the `==` operator overloaded by UnityEngine.Object. When an object is Destroyed, uninitialized, etc., `obj == null` returns true; `GetComponent<XXX>()` also returns null if the component does not exist, and the result of the

#### undefined symbol: InitialPuerts

No code has been generated. Please follow the [il2cpp Optimization Features/Usage Steps](performance/il2cpp.md#usage-steps) Steps to proceed.
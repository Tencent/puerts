# FAQ

## [Puer001]DllNotFoundException: puerts

This means that Unity is unable to load PuerTS's native plugin, such as `.dll` files on Windows, `.dylib` or `.bundle` files on macOS, or `.a` and `.so` files on other platforms.

There are several possible reasons why this issue may occur:

1. You may have not placed PuerTS's native plugin in the Assets directory.

2. The import setting of the native plugin, i.e., platform setting, may not be configured correctly. Please click on the corresponding file in Unity and set the platform correctly. Alternatively, you can use the corresponding meta file from the [official demo project](https://github.com/chexiongsheng/puerts_unity_demo).

3. The system library that the native plugin depends on may not exist. On macOS, you can use `otool`, on Linux, you can use `objdump`, and on Windows, you can use [Dependencies](https://github.com/lucasg/Dependencies) to view the dependencies of the native plugin file. After identifying the missing libraries, you can install them manually.

Related issue: https://github.com/Tencent/puerts/issues/941

## [Puer002]module not found
PuerTS was unable to find the corresponding js file when loading the js script. Specifically, either the `FileExists` call of the `ILoader` returned false, or the `Resolve` call of the `IResolvableLoader` returned an empty string or null.

If you encounter this issue, first confirm whether you are using the `DefaultLoader` (i.e., no parameters are passed when creating the JsEnv) or a custom Loader you wrote yourself. Then, check the `FileExists` function or the `Resolve` function of the Loader and see why it returns incorrect values.

## invalid arguments to XXX

If you're using JS, it may be because you have typed the arguments incorrectly.

If you're using TypeScript, it may be because a subclass with the same name but different parameters is overriding the parent class. For example, if you call `System.Text.Encoding.UTF8.GetBytes`, an error will occur.

```csharp
System.Text.Encoding.UTF8.GetBytes("hello");
```

The object pointed to by `System.Text.Encoding.UTF8` is `System.Text.UTF8Encoding`, and there are other overloads of `GetBytes`. If the current class has a function with the same name, it will not look for it in the base class. In this case, you can manually specify that you want to access the object using its base class interface.

```csharp
Object.setPrototypeOf(System.Text.Encoding.UTF8, System.Text.Encoding.prototype); // Only needs to be called once. Subsequent calls to GetBytes do not need to call this again.
System.Text.Encoding.UTF8.GetBytes("hello");
```

## setInterval didn't call back

It may be because `JsEnv.Tick` was not called.

## How should the `debugpath` parameter of `ILoader` be handled if debugging is needed?
When you call require('./a/b') in TS/JS, ILoader is called and passed the string ".../a/b.js", which is the full path relative to rootPath. You need to understand this string and (load directly from file/memory/network, etc.) load the JS file and return it directly. The debugpath needs to return a path that the debugger can understand (such as the absolute path of the JS file: D:/.../a/b.js). This is done by setting the out string debuggpath parameter, and the debugger will subsequently match the breakpoints on the file based on this file path.

> Windows platform does not distinguish between file name case and uses backslash \ instead of forward slash /.


## can not find delegate bridge for XXX

Sometimes, you may get this error when mapping a JS function to a delegate, where XXX is the delegate you want to map. The possible scenarios are as follows:

* The delegate has a value type parameter or return value. Solution: If there is no return value, use JsEnv.UsingAction to declare it; if there is a return value, use JsEnv.UsingFunc to declare it. For the necessity of doing this work, see this[stackoverflow](https://stackoverflow.com/questions/56183606/invoke-generic-method-via-reflection-in-c-sharp-il2cpp-on-ios)

* The number of parameters exceeds four. Solution: Officially, only four parameters are supported. If necessary, you can draw on this to write more parameter support.

* The parameters contain ref, out modifiers, which are not yet supported. Solution: Fill in the issues to provide demand.

## macOS 10.15 or higher, when starting Unity, prompts that puerts.bundle is damaged and moves it to the trash

Execute this

~~~bash
sudo xattr -r -d com.apple.quarantine puer.bundle
~~~

## When building the mobile version with packaged code, the error "method (runInEditMode, etc.) not found" is reported.
Because these methods are only available in the editor, they can be filtered out using a filter. For usage, refer to the [manual](wrapper/filter.md).

## The program runs normally under the editor, but after il2cpp packing, calling functions or accessing properties fails.
Unity will perform code clipping by default, in short, Unity will not compile APIs from the engine or system that are not used in business C# code.
Solution:

1. Generate wrap code for the API to be called, so that there is a reference in C#;
2. Inform Unity not to clip through link.xml. For the configuration of link.xml, please refer to the Unity official documentation.

## The program runs normally under the editor, but when generating code during packing, it reports "no definition for certain methods/properties/fields". What should I do?
Often because the method/property/field is expanded in conditional compilation, it is only valid under UNITY_EDITOR. In this case, the method/property/field needs to be filtered through the Filter tag, and then the code generation is re-executed and packed. (See [discussions](https://github.com/Tencent/puerts/discussions/806))

## The program runs normally under the editor, but after packing, calling the extension method reports an error (static code is not generated).
By default, after packing, reflection is not used to obtain extension functions. You can use the `PUERTS_REFLECT_ALL_EXTENSION` macro to enable reflection (reflection is slow, it is recommended to generate static code at all times).

## `GetComponent<XXX>()` is null in C#, but not null when called in JS. Why?
Actually, the C# object is not null, it is the overloaded `==` operator of UnityEngine.Object. When an object is Destroyed, uninitialized, etc., `obj == null` returns true; if the component does not exist, the result of the overloaded `==` by Unity will also cause it to return null. But these C# objects are not null and can be verified using `System.Object.ReferenceEquals(null, obj)`.

For this situation, you can write an extension method for UnityEngine.Object to handle null checks uniformly:
```
public static bool IsNull(this UnityEngine.Object o) 
{
    return o == null;
}
```
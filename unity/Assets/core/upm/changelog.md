# Changelog
All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

you can get the english version change log at [Github Release](https://github.com/Tencent/puerts/releases)

## [2.0.2] - 2023-09-07
1. fix: defaultParam's value is not as expected when StaticWrapper in generated @ctxdegithub
2. fix: could not build puerts with v8_8.4. In Unity2020-, the xil2cpp mode binary with v8_9.4 of android armv7 may not work. #1469
3. optimize: combine `libwee8.a` and `libpuerts.a` in android for xil2cpp mode @mingxxming
4. optimize: use universal binary instead of two binary with different arch in OSX now. @mikejurka
5. optimize: `JsEnv` now have a public `Isolate` field to get the pointer of `v8::Isolate` @mingxxming
6. optimize: remove our `SnapshotBlob.h`. Use v8's builtin snapshot instead. #1477
7. optimize: The build script can now run with low version @xiezheng-XD #1495
8. optimize: support inspector by default in Linux @geequlim

## [2.0.1] - 2023-08-16
1. Fix: NestedType was not declared correctly in `link.xml` #1460
2. Fix: `out` parameters with ValueType might cause crash in xil2cpp mode. #1460
3. Fix: default value of parameters in extension method was not correct in xil2cpp mode #1456
4. Fix: JSObject was not recycle correctly

## [2.0.0] - 2023-07-31
1. Fix: `debugpath` was not work and make VSCode debug not availabled
2. Fix: `puer.$genericMethod` cannot get the genericMethod from super class in xil2cpp mode #1417 @danij91
3. Fix: `GetFriendlyName is not a function` when generating extensionInfo #1437

This is the first stable version of `2.0.0`. Shout out to everyone who attending the test.

If you need any help in upgrading. See [upgrade guide](https://puerts.github.io/en/docs/puerts/unity/other/upgrade/)

## [2.0.0-rc.1] - 2023-07-14
1. Fix: BlitableCopy was broken issue #1427
2. Fix: two wrapper generation issue #1433 #1432

## [2.0.0-rc.0] - 2023-06-30
1. Fix: struct's paramless default ctor was unable to use #1301
2. Fix: op_xxxx method was unable to use after generated #1399
3. Fix: `GetFriendlyName` was not defined after generated
4. Fix: the Constructor of BlittableCopy Type didn't invoked
5. Optimization: isESM check optimize #1391

## [2.0.0-pre.5] - 2023-06-15
1. Fix: Error occurs when generating classes with `op_explicit` #1363.
2. Fix: Issue with `ClearModuleCache` causing a crash #1364.
3. Fix: Error in generating when struct produces recursive definition through pointers in xil2cpp mode #1365.
4. Fix: Crash when printing struct in xil2cpp mode #1376.
5. Fix: Crash when assigning JSObject to numeric type C# Field/Property #1383.
6. Fix: Issue with ineffective `Filter`.
7. Optimization: Changed xil2cpp mode's c plugin code to be generated instead of being included in the package.
8. Optimization: Added FAQHelper to optimize code generation and error prompts during build.
9. Optimization: Improved error messages for reflection calls, compatible with trimmed interfaces.
10. Optimization: Changed the separator for console.log elements from comma to space.
11. Optimization: Improved Node.js event loop #1093 #1279.
12. Optimization: Suppressed warnings from DefaultMode's StaticWrapper.
13. Feature: Added `JSObject.Get<T>(string)` and refactored ExecuteModule to use this Get interface.
13. Feature: Added Filter for xil2cpp valuetype declaration.

## [2.0.0-pre.4] - 2023-05-29
1. Fix: the Error message threw from JS to CS would have unexpected character.
2. Fix: doc generating fix #1322 #1329
3. Fix: if an error is thrown in constructor, some valuetype would become null unexpectly.
4. optimize: performance in WebGL is optimized.
5. Fix: dts with Enumerable would throw compile error #1322
6. To distinguish the meaning between Unity Il2cpp backend, we named the new il2cpp binding mode(v2 mode) to xIl2cpp mode.
7. Fix: in xIl2cpp mode, create Puerts.ArrayBuffer in csharp would make its memory unstable. #1340
8. Fix: in xIl2cpp mode, it would crash when returning a valuetype in a method with returntype `System.Object`.
9. Fix: in xIl2cpp mode, it would crash when transfering nullable valuetype. #1320
10. Fix: in xIl2cpp mode, it would crash when setting a valuetype to ref/out arguments. #1343
11. Register logic refactor: #1317. Now we have a new access control ability.

## [2.0.0-pre.3] - 2023-04-19
1. Fix: ios Node.js cannot start for PuerTS's openupm version #1302
2. Fix: the dependencies of DontBinding methods are still generated in DTS generation #1295
3. Fix: some properties only have setters will report errors in wrapper generation #1298
4. Fix: several problems with static fields in il2cpp binding mode #1288
5. Fix: il2cpp binding mode + Unity2021 will crash when using structs reflecting #1288
6. Fix: still cannot find generic classes after link.xml generation #1288
7. Feature: add C# Enumerable forof support on JS side #1234
8. Feature: refactor old ExecuteModule implementation to be consistent with il2cpp binding mode. At the same time, import 'csharp' and import 'puerts' are no longer supported, and it is recommended to use global variables.
9. Feature: add `IResolvableLoader` to implement node_modules loading and solve #1270.
10. Feature: add `IBuiltinLoadedListener` to allow Loader to do some operations after the built-in script is executed, which is convenient for encapsulating third-party Loader.

## [2.0.0-pre.1] - 2023-02-27
1. Add a new language binding directly based on il2cpp and there will be huge performance benifit. see our docsite for more information.
2. The package layout of unity code in this repository is changed to UPM layout.
3. Move the [commonjs-support](https://github.com/puerts/puerts-commonjs) package into this package.

***breaking change since 1.x***
1. `System.DateTime` will no longer translate to `Date` in Javascript #1145
2. TypedValue could pass to a object only. You will no longer use it to select overload.
3. If a method has no overload and default param, PuerTS will not check the type of the params in ReflectionMode(SlowBinding).
4. The accessor key of ref object change to `[0]` instead of `['value']`. (If all your code was using `puer.$ref` or `puer.$unref`, it will take no effect)
5. As what we mentioned in changelog of 1.4: there will be no `require` by default in 2.0.

## [1.4.1] - 2023-03-02

> changelog since 1.4.0

1. fix: the crashed after getting a StackOverflowException #1208
2. fix: could not get any log in inspector with Node.js backend. #1201
3. fix: if a error is thrown in ESM and the message contains line ends, the error message could be incorrect. #1188
4. fix: did not filt a obsoleted property setter/getter. #1152
5. fix：when passing a JS number to C# `object`. the number would be cut to a Int.
6. feature: JsEnv.ClearModuleCache can clear ESM module cache now.
7. feature: now you can use JSObject to store a JS function. #1143 #1144
8. feature: add `EXPERIMENTAL_PUERTS_DISABLE_SLOWBINDING`. It will be useful in somewhere need to do access control. This feature is still experimental and will be changed in the future.
9. optimize: do not lock the mutex when destroying a JSFunction or JSObject.

## [1.4.1-pre.2] - 2023-02-09
1. fix: could not get any log in inspector with Node.js backend. #1201
2. fix: if a error is thrown in ESM and the message contains line ends, the error message could be incorrect. #1188
3. optimize: do not lock the mutex when destroying a JSFunction.
4. feature: JsEnv.ClearModuleCache can clear ESM module cache now.

## [1.4.1-pre.1] - 2023-01-27
1. fix: did not filt a obsoleted property setter/getter. #1152
2. feature: add console.time. #1170
3. feature: now you can use JSObject to store a JS function. #1143 #1144

## [1.4.1-pre.0] - 2022-12-23
1. fix：when passing a JS number to C# `object`. the number will be cut to a Int.
2. feature: add `PUERTS_DISABLE_SLOWBINDING`. It will be useful in somewhere need to do access control.

## [1.4.0] - 2022-11-24
1. fix: requiring failed when searching directory named with `.`

## [1.4.0-rc.7] - 2022-11-15
1. fix：ts error when some methods are returning Task without GenericType #1027
2. fix：Nested class in Generic class will cause error in StaticWrapper #1030
3. fix：illegal unity api access erro when creating JsEnv not in main thread#1049
4. fix：`IsByRefLike` missing error in Unity2021.1 #1050
5. feature：add support for Android x86_64 (v8/quickjs)
6. feature：add `Puerts.IModuleChecker`. if your `ILoader` implement this interface. Then you can indicate which extname of jsfile will be treated as ESM Module.

## [1.4.0-rc.6] - 2022-10-20
1. support ambigious methods calling after generated staticwrapper. #1020
2. fix a bug that after blittablecopy staticwrapper generated, passing two or more struct from C# to a JSFunction will get wrong JS arguments #1018
3. fix Array Type arguments will cause error in staticwrapper #1015
4. refactor the template of wrapper and get a little performance improvement [report](https://github.com/puerts/PerformanceTesting/tree/build/States) 
5. add missing '--jitless' flag for ios PuerTS with nodejs backend

## [1.4.0-rc.2] - 2022-09-28
1. full platform support for Node.js (i.e. Android and iOS support added). upm package now uses Node.js Backend by default.
2. In order to make the Node.js function more convenient to use, and also to solve the problem of WebGL version in WeChat mini-game, from this version on, add global variables `CS` and `puer`, corresponding to the original `require('csharp')` and `require('puerts')`. Please change the using of `require` to `global.CS`, `global.puer`, `import 'xxx'`. The `require` in PuerTS will be considered to be removed in version 1.5.
3. Add `JsEnv.Backend` and add some GC API. `LowMemoryNotification` has moved into it too.
4. refactor `NodeRunner`
5. `ExecuteModule` handling of multi-level dependencies fixed.
6. GeneralSetterManager/GeneralGetterManager optimization #688
7. fix the bug that inspector break point + `setInterval` will cause crash #707
8. support multiple inspectors connection for one single JsEnv, `hotreload` can also be used with inspector at the same time now #841
9. remove `Node.js backend`'s `--no-browser-globals`
10. fix the problem that circular dependency will cause crash when loading ESM
11. fix the problem that ESM throws error when loading dependency with relative path
12. add `import.meta.url` when module is loading
13. fix the problem that dts reports an error when generating nullable types

## [1.4.0-preview.6] - 2022-07-08
1. support multi inspector client 
2. fix the inspector crash problem in unity2021.3.4+
3. fix #708
4. disable generic wrapper in unity2018-

## [1.4.0-preview.5] - 2022-07-08
1. downgrade the v8 to 8.4 in android、ios building. to avoid #908
2. fix #907

## [1.4.0-preview.3] - 2022-07-08
1. merge 1.3.5 
2. fix #899

## [1.4.0-preview.2] - 2022-06-20
1. fix android arm64 plugin meta

## [1.4.0-preview.1] - 2022-06-10
1. support apple silicon #591
2. upgrade the default v8 to 9.4，nodejs to 16
3. make all members become configurable #667
4. add `require('puerts').getLastException` to get the Error instance #629
5. change LC_RPATH setter to support silicon

## [1.3.8] - 2022-08-31
1. fix: didn't check NativeObject's type when setting fields. #954
1. fix: easy to cause `task.GetAwaiter(...).OnCompleted is not a function` error in Unity's Ilcpp mode #966
2. optimize: the memory usage for JSObject #947
2. optimize: disable setting constructor's BindingMode to Lazy
2. optimize: disable reflect extension feature in Editor's Playmode

## [1.3.7] - 2022-07-28
1. disable generic wrapper by default in 1.3 #937 #918
2. fix: arguments number mismatch when generating BlittableCopy #938
3. fix: MJSImporter will cause warning in 2018
4. fix: #912

## [1.3.6] - 2022-07-13
1. fix: UnityMenu.cs code bug fix.
2. fix: thrown error when generating generic type with constrained generic argument.

## [1.3.5] - 2022-07-06
1. fix: duplicated key error during generating: #657
2. fix: cannot $generic a Type with Enum #856
3. fix: did not filter the pointer type in delegate during generating: #857
4. fix: in the d.ts, the return type of an interface's extension method would be wrong: #857
5. fix: do not generate extension method for enum #857
6. fix: some order of parameters with ArrayBuffer will throw an Error. #853
7. feature: support invoking generic method without constraint: #819
8. feature: the wrapper file of a generic type can now combine into one single file. #816
9. feature: TypedValue can now pass to the argument of the corresponding type. #833
10. optimize: add a reusable Github action for downloading JS backend artifact.
11. optimize: can download the backend file by a URL in action.

## [1.3.4] - 2022-05-18
1. the module csharp in d.ts will use export = just like what Node.js did #750
2. fix: ignored assemblies which path is with Editor when generating extension method #735
3. add try catch for builtin script running. and will destroy the jsengine when error is thrown.
4. the Debug build of Plugin will now have the global.gc function.

## [1.3.3] - 2022-04-17
1. fix: some event members did not generated as LazyMember Tencent#739
2. fix: some parameters with in modifier would use ref modifier to invoke in the generated code. Tencent#758
3. fix: the op_Implicit method could not be called Tencent#767

## [1.3.2] - 2022-04-06
1. fix: unity would not ignore iOS library when in Android Mode.
2. fix: old filter wrongly return BindingMode.SlowBinding
3. add .asmdef in main repository

## [1.3.0] - 2022-04-05
1. rearrange the directory layout to support UPM
2. Generator refactored. Generator is seperated to many small file now.
3. Rename LibVersion to ApiLevel。
4. JSFunction::Invoke refactored，fix #681 。
5. Deleted some deprecated v8 calls. to make puerts compat with v8 8.4++。
6. New concept `LazyBinding`：
    In 1.3- when you write `return false` in filter for some c# member. That member will still do TypeRegist by reflection could be call during runtime.
    Now, this feature will still work. But that kind of member will do reflection during first invoke but not during TypeRegister.
 8. New form of `filter`
     To compat with the new `LazyBinding` mode. `Filter` now can not only return a boolean but can return a `BindingMode`. Which is a enum inculde `FastBinding` (means will generate static wrapper)、`LazyBinding` (mentioned above)、`DontBinding` (can not be called during runtime)。you can find an example in `U2018Compatible.cs`

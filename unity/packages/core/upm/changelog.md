# Changelog
All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

you can get the english version change log at [Github Release](https://github.com/Tencent/puerts/releases)

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

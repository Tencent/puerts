# Changelog
All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

you can get the english version change log at [Github Release](https://github.com/Tencent/puerts/releases)

## [1.3.9] - 2022-09-30
1. fix a bug that will throw 'undefined is not a xx' error when running multi jsenv parallel.
1. fix the problem that circular dependency will cause crash when loading ESM
2. fix the problem that ESM throws an error when loading dependency with relative path
3. fix the problem that dts reports an error when generating nullable types
4. add `import.meta.url` in es module js

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
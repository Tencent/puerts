# Changelog
All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

you can get the english version change log at [Github Release](https://github.com/Tencent/puerts/releases)

## [1.4.1-pre.2] - 2023-02-09
1. 修复：Node.js版本连接inspector时打不出Log #1201
2. 修复：ESM模块报错时报错信息包含换行符会导致报错信息不正确。#1188
3. 优化：销毁JSFunction时不加锁
4. 功能：JsEnv.ClearModuleCache现在可以清理ESM模块缓存

## [1.4.1-pre.1] - 2023-01-27
1. 修复：生成时Obsolete字段未被过滤的问题。 #1152
2. 功能：添加console.time。#1170
3. 功能：JSObject现在可以接收一个JS函数。#1143 #1144

## [1.4.1-pre.0] - 2022-12-23
1. 修复：将JS数字传递给C# object时，浮点数精度丢失的问题。
2. 功能：添加PUERTS_DISABLE_SLOWBINDING，适用于需要做权限控制的地方。

## [1.4.0] - 2022-11-24
1. 修复：commonjs 查找带.目录时的问题

## [1.4.0-rc.7] - 2022-11-15
1. 修复：返回无泛型Task时typescript检查报错的问题 #1027
2. 修复：泛型类内部类在wrapper报错的问题 #1030
3. 修复：子线程创建JsEnv报跨线程访问Unity API的错#1049
4. 修复：Unity2021.1下报`IsByRefLike`缺失的错 #1050
5. 功能：添加v8和quickjs的Android x86_64支持
6. 功能：新增Puerts.IModuleChecker。传入的ILoader如果实现了该接口，则可以自定义哪些文件后缀会被识别为ESM模块

## [1.4.0-rc.6] - 2022-10-20
1. 支持了staticwrapper生成后，歧义方法的调用 #1020
2. 修复BlittableCopy模式下，同时为JS函数传递两个结构体时的错误 #1018
3. 修复Array类型再wrapper重载选择时报错 #1015
4. 重构wrapper模板，小幅度性能提升 可参见[性能报告](https://github.com/puerts/PerformanceTesting/tree/build/States) 
5. 在Node后端的ios下，补上遗漏的`--jitless`flag

## [1.4.0-rc.2] - 2022-09-28
1. 全平台支持了Node.js（也就是新增了Android和iOS的支持）。upm包现在默认全使用Node.js Backend了。
2. 为了让Node.js功能使用起来更方便，也同时解决WebGL版本在微信小游戏的问题，加上ES Module是JS生态的未来。从本版本开始，添加全局变量`CS` 和 `puer`，对应原本的`require('csharp')`和`require('puerts')`。PuerTS的`require`不再建议使用，原有的使用全局require的地方请改成`global.CS`、`global.puer`、`import 'xxx'`，抑或是`puerts.require`。PuerTS的**全局require**将考虑在1.5版本删除。
3. 添加 `JsEnv.Backend` 并加入了一些GC API. `LowMemoryNotification` 也移进去了。
4. 重构 `NodeRunner`
5. `ExecuteModule`处理多级依赖的问题修复。
6. GeneralSetterManager/GeneralGetterManager优化 #688
7. 修复了在inspector下打断点+`setInterval`会引起crash的bug #707
8. 支持一个JsEnv连接多个inspector，hotreload也能和inspector同时使用了 #841
9. 去掉了Node.js的`--no-browser-globals`选项
10. 修复ESM加载时循环依赖会引起崩溃的问题
11. 修复ESM使用相对路径加载依赖时报错的问题
12. 添加了模块加载时的import.meta.url路径
13. 修复生成可空类型时，dts报错的问题

## [1.4.0-preview.6] - 2022-07-25
1. 支持同时连接多个inspector调试端
2. 修复unity2021.3.4+ inspector崩溃的问题
3. fix #708
4. unity2018- 禁用generic wrapper

## [1.4.0-preview.5] - 2022-07-08
1. android、ios平台的v8降到8.4以规避 #908
2. 修复 #907

## [1.4.0-preview.3] - 2022-07-08
1. 合入1.3.5的改动
2. 修复 #899

## [1.4.0-preview.1] - 2022-06-07
1. 支持apple silicon芯片 #591
2. 升级默认v8到9.4版本，nodejs到16版本
3. 所有属性改为configurable #667
4. 添加`require('puerts').getLastException`接口 #629

## [1.3.9] - 2022-09-30
1. 修复了一个多JsEnv同时运行时，报`undefined is not a function` 或者 `cannot read property of undefined`等错的问题
10. 修复ESM加载时循环依赖会引起崩溃的问题
11. 修复ESM使用相对路径加载依赖时报错的问题
13. 修复生成可空类型时，dts报错的问题
12. 添加了模块加载时的import.meta.url路径

## [1.3.8] - 2022-08-31
1. fix: 优化JSObject的内存占用 #947
1. fix: field赋值时没有NativeObject类型检查的问题 #954
1. fix: ILCPP模式下容易出现`task.GetAwaiter(...).OnCompleted is not a function`的问题 #966
2. optimize: 禁用构造函数设置为Lazy
2. optimize: Editor下运行模式默认不打开反射extension功能

## [1.3.7] - 2022-07-28
1. 1.3版本改为默认不开启泛型类的泛型式生成 #937 #918
2. fix: 生成BlittableCopy时报参数数量不匹配的错 #938
3. fix: MJSImporter在2018下会出警告的问题

## [1.3.6] - 2022-07-13
1. fix: UnityMenu.cs传参错误
2. fix: 带约束的泛型类wrapper生成错误

## [1.3.5] - 2022-07-06
1. fix: 生成代码时出现重复key的问题: #657
1. fix: 不能生成带Enum泛型参数的generic类型 #856
1. fix: 生成delegate时没有过滤掉带指针类型的: #857
1. fix: 生成的dts里，interface的扩展函数返回值不对: #857
1. fix: 不再生成enum的扩展函数 #857
1. fix: C#调用JS时如果带有ArrayBuffer参数，某些顺序可能抛错. #853
1. feature: 支持不带约束的泛型函数调用（有限度的）: #819
1. feature: 泛型类的wrapper文件现在可以使用泛型，而不再是一种泛型参数一个文件. #816
1. feature: TypedValue在调用时，现在可以直接传递给对应类型的参数. #833
1. 优化: 新增了一个可重用的原子github action，用于下载backend文件

## [1.3.4] - 2022-05-18
1. dts中的csharp模块现在和node.js一样使用`export = `导出 #750
2. 修复生成扩展函数时，忽略了路径带Editor的Assembly的内容 #735
3. 添加执行内置脚本时的Try Catch，并且这个时候会自动Destroy创建出来的Isolate 
4. Debug版本的Plugin现在全局会有手动gc函数（正常情况还是建议使用JsEnv.LowMemoryNotification）

## [1.3.3] - 2022-04-17
1. 修复event成员没有成功转为Lazy的问题 #739
2. 修复2021下某些in成员在生成代码里被写成了ref的问题 #758
3. 修复op_Implicit无法调用的问题 #767

## [1.3.2] - 2022-04-06
1. 修复UPM安装时安卓会识别到iOS库的问题
2. 修复旧有filter无效的问题
3. 主仓库加上了asmdef

## [1.3.0] - 2022-04-05
0. 终于支持UPM！
1. 重排了整体目录结构，使puerts符合unity package的结构标准。
2. 重构了Generator代码结构，分成几个小文件（本人比较喜欢）
3. 将libversion重命名为了apilevel。
4. 重构JSFunction Invoke的机制，fix #681 。
5. 去掉了一些deprecated的v8接口调用，适配8.4以后的版本。
6. 新增懒绑定模式：
    在filter中return false的成员，以前会在TypeRegister时被反射，并在后续代码中依然能被调用
    新的版本里，PuerTS继续兼容了这种调用。但这类成员的反射时机不再是TypeRegister阶段，而是在该成员被首次使用时。
 7. filter的新写法
     为了适配新增的懒绑定模式，filter除了return false，现在还增加了返回BindingMode的模式，可选值：`FastBinding`(即会生成static wrapper)、`LazyBinding`(前面提到的首次调用时反射)、`DontBinding`(完全不允许JS调用)。例子可以查看仓库中 U2018Compatible.cs

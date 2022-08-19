# Changelog
All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

you can get the english version change log at [Github Release](https://github.com/Tencent/puerts/releases)

## [1.3.7] - 2022-07-28
1. 1.3版本改为默认不开启泛型类的泛型式生成 #937 #918
2. fix: 生成BlittableCopy时报参数数量不匹配的错 #938
3. fix: MJSImporter在2018下会出警告的问题
4. fix: #912

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

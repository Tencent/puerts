# Changelog
All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

you can get the english version change log at [Github Release](https://github.com/Tencent/puerts/releases)

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

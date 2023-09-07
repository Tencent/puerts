# Changelog
All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

you can get the english version change log at [Github Release](https://github.com/Tencent/puerts/releases)

## [2.0.2] - 2023-09-07
1. 修复：静态wrapper里params参数获取到的默认值不正确的问题 @ctxdegithub
2. 修复：使用v8_8.4版本build的问题。unity2020及以下xil2cpp模式armv7可能需要v8_8.4才能编通 #1469
3. 优化：xi2cpp模式下安卓平台合并v8和puerts两个库
4. 优化：mac下改为使用universal binary，不再区分两个平台（覆盖升级时请注意删除旧Plugin）@mikejurka
5. 优化：JsEnv现在会暴露Isolate字段，获得v8::Isolate的指针 @mingxxming
6. 优化：去掉puerts自己的SnapshotBlob.h，直接使用v8内置的
7. 优化：构建脚本现在可以运行在低版本node上 @xiezheng-XD #1495
8. 优化：Linux平台自带inspector @geequlim

## [2.0.1] - 2023-08-16
1. 修复：内部类型在link.xml中声明不正确的问题 #1460
2. 修复：xil2cpp模式下使用结构体out参数可能导致crash的问题 #1460
3. 修复：xil2cpp模式下扩展函数获取默认参数不正确的问题 #1456
4. 修复：JSObject没有正确调用回收的问题

## [2.0.0] - 2023-07-31
1. 修复：debugpath失效并导致VSCode调试不可用的问题
2. 修复：xil2cpp模式下`puer.$genericMethod`无法获取父类泛型函数的问题 #1417 @danij91
3. 修复：生成代码时报GetFriendlyName is not a function的问题 #1437

这个版本是2.0第一个正式版本。感谢所有参与过2.0内测的朋友。

对升级有疑问的朋友可以参见[升级指南](https://puerts.github.io/docs/puerts/unity/other/upgrade)

## [2.0.0-rc.1] - 2023-07-14
1. 修复: BlittableCopy不可用的问题 #1427
2. 修复: 两个wrapper生成的问题 #1433 #1432

## [2.0.0-rc.0] - 2023-06-30
1. 修复：xil2cpp模式下结构体默认无参构造函数不可用的问题 #1301
2. 修复：运算符重载不可用的问题 #1399
3. 修复：已生成wrapper时点击生成报GetFriendlyName不存在的问题
3. 修复：BlittableCopy类构造函数不生效的问题
4. 优化：isESM检测优化 #1391

## [2.0.0-pre.5] - 2023-06-15
1. 修复：生成带op_explicit的类的时候会出现报错 #1363
2. 修复：ClearModuleCache导致crash的问题 #1364
3. 修复：xil2cpp模式下结构体通过指针的方式产生递归定义时生成报错的问题 #1365
4. 修复：xil2cpp模式下打印结构体时crash的问题 #1376
5. 修复：向数字类型的C# Field/Prop赋值JSObject时crash的问题 #1383
6. 修复：Filter过滤失效的问题
7. 优化：xil2cpp的c plugin代码改成生成出来，而不是包内自带。
8. 优化：添加FAQHelper，用于优化代码生成和build时的错误提示
9. 优化：反射调用时错误信息优化，兼容接口被裁剪的情况
10. 优化：console.log各个元素的分隔符由逗号变为空格
11. 优化：Node.js事件循环优化 #1093 #1279
12. 优化：屏蔽了DefaultMode StaticWrapper报的警告
13. 功能：添加`JSObject.Get<T>(string)`，ExecuteModule也重构改为使用该Get接口
14. 功能：添加了一种新的Filter用于过滤xil2cpp模式的结构体类型声明

## [2.0.0-pre.4] - 2023-05-29
1. 修复：从JS往C#抛错时可能出现非法字符。
2. 修复：注释文档生成的两个问题 #1322 #1329
3. 修复：如果一个C#对象的构造函数抛错，可能导致后续有对象莫名其妙变为null
4. 优化：WebGL下的性能优化
5. 修复: 生成继承于IEnumerable的类在dts下报错 #1322
6. 为了更好区分`Unity本身的Il2cpp backend`和我们在2.0版本新做的`puerts il2cpp特别优化模式`，我们将我们2.0的新模式命名为`xIl2cpp mode`
7. 修复：在xIl2cpp模式下，在C#侧创建ArrayBuffer可能导致它的内存被改写。#1340
8. 修复：在xIl2cpp模式下，在一个返回值为System.Object的函数里返回结构体会导致crash。
9. 修复：在xIl2cpp模式下，传递nullable valuetype会导致crash。 #1320
10. 修复：在xIl2cpp模式下，往ref/out参数设置valuetype会导致crash。 #1343
11. 类注册逻辑重构: #1317。现在我们拥有了全新的权限控制能力，修复了一些xil2cpp模式下的相关问题。

## [2.0.0-pre.3] - 2023-04-19
1. 修复：openupm版本ios Node.js无法启动的问题 #1302
1. 修复：DTS生成时DontBinding方法的依赖依旧被生成的问题 #1295
1. 修复：wrapper生成时某些property只有setter时报错的问题 #1298
1. 修复：il2cpp绑定模式下，static field的若干问题 #1288
1. 修复：il2cpp绑定模式+Unity2021 反射调用结构体时的crash问题 #1288
1. 修复：link.xml生成后，il2cpp绑定模式下依然无法找到泛型类的问题 #1288
1. 功能：添加C# Enumerable在JS侧的forof支持 #1234
2. 功能：重构旧版ExecuteModule的实现，使之与il2cpp绑定模式下一致。同时不再支持import 'csharp'和 import 'puerts'，建议使用全局变量。
3. 功能：添加`IResolvableLoader`，用于实现node_modules加载与解决 #1270 问题
4. 功能：添加`IBuiltinLoadedListener`，可以让Loader在内置脚本执行完毕后做一些操作，便于封装第三方Loader。

## [2.0.0-pre.1] - 2023-02-27
1. 添加了新的il2cpp binding方式，性能有飞跃式提升。详见官方文档`Il2cpp绑定`章节
2. 本仓库的Unity代码变为了UPM目录结构。
3. 将[commonjs-support](https://github.com/puerts/puerts-commonjs)包移入了本仓库。

***与1.x版本不兼容的地方***
1. DateTime不再映射到js Date对象 #1145
2. TypedValue只能传给object类型，不再具备选择重载的作用。
3. 反射模式下，如果一个函数无重载也无默认参数，不会进行参数检查
4. Ref所使用的下标由['value']变为[0]（如果你代码使用的是puer.$ref和puer.$unref，而不是直接使用下标的话，不受影响）
5. 1.4版本中预告过的：2.0版本不自带require

## [1.4.1] - 2023-03-02

> 以下为相比1.4.0的内容

1. 修复：出现stack overflow错误后JsEnv析构产生crash的问题 #1208
2. 修复：Node.js版本连接inspector时打不出Log #1201
3. 修复：ESM模块报错时报错信息包含换行符会导致报错信息不正确。#1188
4. 修复：生成时Obsolete字段未被过滤的问题。 #1152
5. 修复：将JS数字传递给C# object时，浮点数精度丢失的问题。
6. 功能：JsEnv.ClearModuleCache现在可以清理ESM模块缓存
7. 功能：JSObject现在可以接收一个JS函数。#1143 #1144
8. 功能：添加PUERTS_DISABLE_SLOWBINDING，适用于需要做权限控制的地方。
9. 功能：添加EXPERIMENTAL_PUERTS_DISABLE_SLOWBINDING，适用于需要做权限控制的地方。该功能为试验功能，还可能改动。
10. 优化：销毁JSFunction、JSObject时不加锁

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

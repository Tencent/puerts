## What？
PuerTS是游戏引擎下的TypeScript编程解决方案

* 提供了一个JavaScript运行时

* 提供通过TypeScript与宿主引擎互相访问的能力（JavaScript层面的绑定以及TypeScript声明生成）
 

## Why?

* JavaScript生态有众多的库和工具链，结合专业商业引擎的渲染能力，快速打造游戏。可使用Node.js 作为执行引擎。

* 相比游戏领域常用的lua脚本，TypeScript的静态类型检查有助于编写更健壮，可维护性更好的程序

* 可用 WebGL，兼容小游戏。且其性能领先其它脚本/热更方案

* 全引擎，全平台支持多种Binding：静态Binding，兼顾了需要高性能的场景；反射Binding无需额外（生成代码）步骤即可开发

---

## 示例

* [QuickStart.ts](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TsProj/QuickStart.ts) ： 演示TypeScript和UE4引擎互相调用

* [NewContainer.ts](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TsProj/NewContainer.ts) ： 演示容器的创建

* [AsyncTest.ts](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TsProj/AsyncTest.ts) ： 将异步加载蓝图，Delay封装成async/await

* [UsingWidget.ts](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TsProj/UsingWidget.ts) ： UI加载，绑定事件，获取数据的演示

* [UsingMixin.ts](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TsProj/UsingMixin.ts)：演示mixin功能的使用

* [FPS demo](https://github.com/chexiongsheng/puerts_fps_demo) ： 以一个FPS游戏例子演示如何使用Puerts的“继承引擎类功能”，该功能的介绍见[继承引擎类功能](uclass_extends.md)

## 可用环境

* unity 5 ~ latest
* 任意.net环境

## 兼容平台

* iOS，Android，Windows，Macos

## Ask for help | 技术支持

[Github Discussion](https://github.com/Tencent/puerts/discussions)

QQ群：942696334

UE4专属群：689643903

## 开发博客
[知乎专栏](https://www.zhihu.com/column/c_1355534112468402176)

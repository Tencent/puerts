## 示例

### 自行构造虚拟机

* [构造虚拟机例子](https://github.com/chexiongsheng/puerts_unreal_demo): 用户可以自己构造（一个或多个）虚拟机。

  - [TsGameInstance.cpp](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/Source/puerts_unreal_demo/TsGameInstance.cpp)：演示在GameInstance（也可以根据需要在别的地方构造）构造虚拟机。

### 继承引擎类功能

* [FPS demo](https://github.com/chexiongsheng/BlockBreakerStarter) ： 以一个FPS游戏例子演示如何使用Puerts的“继承引擎类功能”，该功能的介绍见[unreal手册](manual.md)

继承引擎类功能开启后，系统会启动一个（默认）虚拟机作为继承了引擎类的TypeScript的运行环境，要注意的是如果你还另外启动了虚拟机，这些虚拟机间是相互隔离的。

### TypeScript和引擎、C++交互例子

虽然这些是在[构造虚拟机例子](https://github.com/chexiongsheng/puerts_unreal_demo) 下演示，但实际上这里的例子在所有虚拟机下均能运行。

* [QuickStart.ts](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TypeScript/QuickStart.ts) ： 演示TypeScript和UE4引擎互相调用

   - 在继承引擎类的TypeScript里头·argv.getByName("GameInstance")·返回为undefined，这是因为默认虚拟机并未传入该参数。

* [NewContainer.ts](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TypeScript/NewContainer.ts) ： 演示容器的创建

* [AsyncTest.ts](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TypeScript/AsyncTest.ts) ： 将异步加载蓝图，Delay封装成async/await

* [UsingWidget.ts](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TypeScript/UsingWidget.ts) ： UI加载，绑定事件，获取数据的演示

* [UsingMixin.ts](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TypeScript/UsingMixin.ts) ： Mixin功能的演示

* 调用普通c++类

  - [TestClass.h](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/Plugins/Puerts/Source/JsEnv/Private/TestBinding/TestClass.h) ： 基础例子C++类定义
  
  - [TestClass.h](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/Plugins/Puerts/Source/JsEnv/Private/TestBinding/AdvanceTestClass.h) ： 高级例子C++类定义
  
  - [TestClassWrap.cpp](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/Plugins/Puerts/Source/JsEnv/Private/TestBinding/TestClassWrap.cpp) ： 绑定（导出到TypeScript）声明
  
  - [CDataTest.ts](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TypeScript/CDataTest.ts) ： TypeScript调用演示
  
  
运行方式，将[TsGameInstance.cpp](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/Source/puerts_unreal_demo/TsGameInstance.cpp)的入口修改为对应的TypeScript名字（不含后缀，例子现默认为QuickStart）。

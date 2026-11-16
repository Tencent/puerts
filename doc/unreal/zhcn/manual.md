# Puerts-Unreal使用手册

## puerts的本质

puerts的本质是：

* 在（UE）引擎提供了JavaScript虚拟机环境

* 让TypeScript/JavaScript能够和引擎交互，或者说能调用C++或者蓝图API，也能被C++或者蓝图调用到

js虚拟机实现了js语言，但js语言本身基本什么都干不了，它能做的事情取决于宿主环境给它添加的api，比如浏览器在js环境添加了dom操作api，于是浏览器里的js可以编写动态页面的逻辑，比如nodejs添加异步网络（io）api，于是nodejs里的js能用来编写web服务器。

puerts里js的宿主环境是游戏引擎，又添加了哪些api呢？

首先，puerts默认导入了**所有**反射api。换句话在UE蓝图里能调用的引擎API，在Typescript/JavaScript环境都可以调用，如果用Typescript，正确引入了声明文件到工程中，这些api会有提示。

其次对于非反射api，手工封装成反射后蓝图也能访问，这点在typescript同样适用，而且puerts还额外支持[《基于模板的静态绑定》](template_binding.md)，按文档声明一下在typescript即可调用。

在puerts里，要实现一项游戏编程任务，先想下这任务在C++或者蓝图里如何实现，然后在typescript调用同样的api去实现。

puerts并未重定义引擎，只是定义了ts和引擎相互调用的规则。puerts的demo也倾向于演示这些规则，而不是做一个游戏。


## puerts::FJsEnv

一个puerts::FJsEnv实例代表一个虚拟机实例（可以类比一个nodejs进程）

* 在合适的地方（比如GameInstance）根据需要构造一个或者多个虚拟机
    - 如果启动多个虚拟机，这些虚拟机间是相互隔离的（可以类比多个nodejs进程间数据是隔离的）

* 通过Start函数启动一个脚本，作为脚本逻辑的入口（类似c的main函数）
    - Start可以传入一些数据作为参数，供脚本获取使用（可以类比为nodejs命令输入的入口脚本）

示例，在GameInstance的OnStart构造虚拟机，并在Shutdown删除

~~~c++
UCLASS()
class PUERTS_UNREAL_DEMO_API UTsGameInstance : public UGameInstance
{
public:
    TSharedPtr<puerts::FJsEnv> JsEnv;

    virtual void OnStart() override {
        JsEnv = MakeShared<puerts::FJsEnv>();
        TArray<TPair<FString, UObject*>> Arguments;
        Arguments.Add(TPair<FString, UObject*>(TEXT("GameInstance"), this)); // 可选步骤
        JsEnv->Start("QuickStart", Arguments);
    }

    virtual void Shutdown() override {
        JsEnv.Reset();
    }
};
~~~

虚拟机默认加载JavaScript文件的根目录是Content/JavaScript，该根目录可以通过FJsEnv构造函数更改。

在ts访问Start传入的参数（如果有的话）

~~~typescript

import * as UE from 'ue'
import {argv} from 'puerts';

let world = (argv.getByName("GameInstance") as UE.GameInstance).GetWorld();
~~~


## TypeScript和引擎的相互调用

### 通用规则

UE里头，支持反射的API（标注了UCLASS，UPPROPERTY，UFUNCTION，USTRUCT，UENUM的C++类，以及所有的蓝图）都能调用。

简单的生成下声明文件（可以理解为typescript的头文件，“.d.ts”后缀），然后import一下，根据IDE的智能提示即可。

要注意的是，在TypeScript里的类名是的UE类型ScriptName，相比C++类，都是去了前缀的，比如FVector在TypeScript里头是Vector，AActor是Actor。

反射api的使用文档：[script_call_uclass](script_call_uclass.md)。

如果非反射C++ API呢？比如UE部分C++ API，比如第三方C++库。

请看[基于模板的静态绑定](template_binding.md)

### 蓝图mixin功能

把一个ts类mixin到一个蓝图类（或者原生声明为UCLASS的类）的能力。

蓝图mixin的介绍看[这里](mixin.md)

## puerts::FJsEnv与蓝图mixin功能的关系

* 一个puerts::FJsEnv就是一个虚拟机实例，虚拟机间数据是隔离的。

* 蓝图mixin功能是puerts::FJsEnv的一个特性，或者说任意一个puerts::FJsEnv都有蓝图mixin功能。

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


## 虚拟机启动

### 自行构造puerts::FJsEnv

* 在合适的地方（比如GameInstance）根据需要构造一个或者多个虚拟机
    - 如果启动多个虚拟机，这些虚拟机间是相互隔离的

* 通过Start函数启动一个脚本，作为脚本逻辑的入口（类似c的main函数）
    - Start可以传入一些数据作为参数，供脚本获取使用

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

### 开启“继承引擎类功能”

开启该功能，Puerts会构造一个默认的虚拟机

* 引擎构造一个继承了UE类TypeScript类（代理对象）时，这个TypeScript类以及其引用的代码，都是跑在这个默认虚拟机上

  - 这个虚拟机本身相比自行构造的虚拟机没什么两样，和UE的交互规则都一样
  
  - 由于虚拟机间相互隔离，所以如果你自己创建了虚拟机，你会发现那里的代码和继承了UE类TypeScript类相互访问不了

* 该虚拟机不会启动一个启动脚本，也不会传参数，因而argv不可用，也没必要用

* 原来的入口脚本可以通过覆盖ReceiveBeginPlay之类的回调来实现

## TypeScript和引擎的相互调用

### 通用规则

UE里头，支持反射的API（标注了UCLASS，UPPROPERTY，UFUNCTION，USTRUCT，UENUM的C++类，以及所有的蓝图）都能调用。

简单的生成下声明文件（可以理解为typescript的头文件，“.d.ts”后缀），然后import一下，根据IDE的智能提示即可。

要注意的是，在TypeScript里的类名是的UE类型ScriptName，相比C++类，都是去了前缀的，比如FVector在TypeScript里头是Vector，AActor是Actor。

反射api的使用文档在[这](interact_with_uclass.md)。

如果非反射C++ API呢？比如UE部分C++ API，比如第三方C++库。

有两种方式：

* 推荐[基于模板的静态绑定](template_binding.md)

* 目前不太推荐的[扩展函数](extension_methods.md)

上述两种方式，都可以把普通C++ API转成能被TypeScript的api，重启后重新生成声明文件即可。

### 蓝图mixin功能

把一个ts类mixin到一个蓝图类（或者原生声明为UCLASS的类）的能力。

蓝图mixin的介绍看[这里](mixin.md)

### 继承引擎类功能

开启该功能后能做到特定写法的类能被UE编辑器识别。

自行构造puerts::FJsEnv，TypeScript/JavaScript能被引擎调用的方式或者入口，只有通过DYNAMIC_DELEGATE来调用。大多数时候是能满足需求的：通过DYNAMIC_DELEGATE接受网络或者用户UI事件，处理后根据需要调用显示，服务器等。

而开启该功能后本质上是新增了另外一种能被UE引擎调用的方式：

* 根据TypeScript声明生成一个能被UE引擎识别、使用的代理蓝图类，这些类可能继承了某个UCLASS，也可能是静态蓝图函数库（继承BlueprintFunctionLibrary）。
   - 代理蓝图类就是普通的蓝图，只不过它的函数实现是空的
   
* Puerts会启动一个默认的虚拟机加载相关脚本逻辑

* Puerts会拦截代理蓝图类的调用，重定向到默认的虚拟机里对应的脚本逻辑

继承引擎类功能的启用和使用看[这里](uclass_extends.md)

！！继承引擎类功能使用建议

我发现不少项目把该功能当成“蓝图”的另一种写法，大面积的使用该功能直接去完成游戏逻辑。

该功能的滥用会导致密集的跨语言交互进而导致性能问题。

实际上该功能建议使用场景是：项目已经开发了挺久了，已经是一个成型的项目，要贸然添加脚本对原有架构冲击很大，于是可以用这功能，写些继承ue类的ts类作为原有系统和新脚本系统间的边界（原有系统能认识这种ts类生成的代理蓝图），而且在这个场景下也是作为边界有限的使用，仍然切记不要滥用。


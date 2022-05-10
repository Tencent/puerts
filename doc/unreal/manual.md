# Puerts-Unreal使用手册

puerts的核心功能主要是：

* 在（UE）引擎启动（JavaScript）虚拟机环境

* 让TypeScript/JavaScript能够和引擎交互，或者说能调用C++或者蓝图API，也能被C++或者蓝图调用到

下面分别介绍

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

* 引擎构造一个TypeScript（代理对象）时，要跑脚本，找的是这个虚拟机，但这个虚拟机本身相比自行构造的虚拟机没什么两样，和UE的交互规则都一样

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


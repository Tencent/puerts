# Puerts-Unreal使用手册

## 两种使用方式简介

### 方式一：自行启动虚拟机

* 在合适的地方（比如GameInstance）根据需要启动一个或者多个虚拟机
    - 如果启动多个虚拟机，这些虚拟机间是相互隔离的

* 通过Start函数启动一个脚本，作为脚本逻辑的入口（类似c的main函数）
    - Start可以传入一些数据作为参数，供脚本获取使用

* 在虚拟机里头的脚本可以按puerts的规则（后面的章节）和引擎交互

~~~c++
UCLASS()
class PUERTS_UNREAL_DEMO_API UTsGameInstance : public UGameInstance
{
public:
    TSharedPtr<puerts::FJsEnv> JsEnv;

    virtual void OnStart() override {
        JsEnv = MakeShared<puerts::FJsEnv>();
        TArray<TPair<FString, UObject*>> Arguments;
        Arguments.Add(TPair<FString, UObject*>(TEXT("GameInstance"), this));
        JsEnv->Start("QuickStart", Arguments);
    }

    virtual void Shutdown() override {
        JsEnv.Reset();
    }
};
~~~

### 方式二：自动绑定模式

该模式的优点是能做到特定写法的类能被UE编辑器识别

* 命令行进入Plugins/Puerts目录，执行如下命令即可完成该模式的开启和依赖安装

~~~shell
node enable_puerts_module.js
~~~

例如这么一个类：

~~~typescript
import * as UE from 'ue'

class TS_Player extends UE.Character {
}

export default TS_Player;
~~~

然后你在UE编辑器就能选择它


![select_character.png](../../pic/select_character.png)

* 能被UE识别的类，支持构造函数，支持override蓝图能override的方法，支持轴映射Axis、Action事件，支持RPC

~~~typescript
class TS_Player extends UE.Character {
    FpsCamera: UE.CameraComponent;
    //...

    Constructor() {
        let FpsCamera = this.CreateDefaultSubobjectGeneric<UE.CameraComponent>("FpsCamera", UE.CameraComponent.StaticClass());
        FpsCamera.SetupAttachment(this.CapsuleComponent, "FpsCamera");
        //...
    }

    MoveForward(axisValue: number): void {
        this.AddMovementInput(this.GetActorForwardVector(), axisValue, false);
    }

    MoveRight(axisValue: number): void {
        this.AddMovementInput(this.GetActorRightVector(), axisValue, false);
    }

    ReceiveBeginPlay(): void {
        //...
    }

~~~


### 两种模式之间的关系

* 自动绑定模式是建立于自行启动虚拟机模式的基础上的，PuertsModule启动了一个虚拟机，然后做了些自动绑定蓝图，代码增量编译、增量刷新功能

* 两者可以并存，但要谨记你自己手动启动的虚拟机，和PuertsModule的虚拟机不是同一个，他们是相互隔离的


## 自动绑定模式

### 格式

一个TypeScript满足如下以下三点，一个类才能被UE编辑器识别

* 这个类继承自UE的类或者另一继承UE的类；
* 类名和去掉.ts后缀的文件名相同；
* 把这个类export default。

### 构造函数

和标准的typescript构造函数不一样，自动绑定模式被UE初始化调用的构造函数首字母需大写，也就是Constructor

~~~typescript
class TsTestActor extends UE.Actor {
    tickCount: number;

    //注意，继承UE类的js类，构造函数必须大写开头
    Constructor() {
        this.PrimaryActorTick.bCanEverTick = true;
        tickCount = 0;
    }
}
~~~

* 构造函数中可以调用一些UE限定必须在构造函数调用的API，比如CreateDefaultSubobject
* 如果一个类定义了构造函数，该类成员变量的初始化会被TypeScript接管，这时你在UE编辑器下设置的值将会无效
* 如果没定义构造函数，则支持在UE编辑器手动设置成员变量值
* Constructor是UE调用的构造函数，只用作UE成员的初始化
  - 不能在该函数中做js的初始化工作，比如no-blueprint标注的变量的初始化
  - 不能在该函数中申请js的资源，比如创建一个闭包函数，因为重载虚拟机后这些资源将失效，然而构造函数不会重新执行
* 目前不支持在一个Actor的构造函数修改Component的属性，因为SpawnActor在构造完对象后，有个对Component的重置: [构造函数设置Component属性无效](https://github.com/Tencent/puerts/issues/287)

### 自动绑定模式支持的数据类型

只有用自动绑定模式支持的类型声明的字段、方法，才能被UE识别

**直接映射的类型**

void，number，string，bigint，boolean，UE模块下的UObject派生类、枚举、UStruct，TArray、TSet、TMap、TSubclassOf（类引用）、TSoftObjectPtr（软对象引用）、TSoftClassPtr（软类引用）

注意：一个函数返回类型声明为void才是无返回值，如果一个函数不声明返回类型，等同于返回any类型，而自动半丁模式并不支持any类型

如下是几个字段和方法的示例：

~~~typescript
class TsTestActor extends UE.Actor {
    tickCount: number;

    actor: UE.Actor; 

    map: UE.TMap<string, number>;

    arr: UE.TArray<UE.Object>;

    set: UE.TSet<string>;

    Add(a: number, b: number): number {
        return a + b;
    }
    
    e: UE.ETickingGroup;
    
    clsOfWidget: UE.TSubclassOf<UE.Widget>;

    softObject: UE.TSoftObjectPtr<UE.Actor>;

    softClass: UE.TSoftClassPtr<UE.Actor>;
}
~~~

**类型注解**

TypeScript和UE两者间的数据类型丰富程度不一样，因而两者并不是一一映射的，比如UE里头的byte，int，float都对应TypeScript的number，那么我们如何告诉puerts生成我们所需的类型呢？puerts提供了类型注解，如下是几个例子：

~~~typescript
class TsTestActor extends UE.Actor {
    //@cpp:text
    Foo(): string {
        return "hello";
    }

    Bar(p1:number/*@cpp:int*/): void {
    }

    //@cpp:name
    Field: string;
}
~~~

* Foo的返回值是FText
* Bar的参数是int
* Field字段的类型是FName
* 目前支持的类型注解支持的类型有：text，name，int，byte

### 其它注解

除了类型注解，puerts还支持其它注解

* @no-blueprint

表示不被UE编辑器识别，方法和字段均可用

~~~typescript
class TsTestActor extends UE.Actor {
    //@no-blueprint
    TsOnlyMethod():void {

    }

    //@no-blueprint
    TsOnlyField: number;
}
~~~

### rpc

可以通过decorator来设置方法、字段的RPC属性。

注意：TypeScript的decorator默认不打开，需要在tsconfig.json上将experimentalDecorators属性设置为true

* rpc.flags

为字段，方法设置flags

* rpc.condition

为字段设置replicate condition


~~~typescript
class TsTestActor extends UE.Actor {
    @rpc.flags(rpc.PropertyFlags.CPF_Net | rpc.PropertyFlags.CPF_RepNotify)
    @rpc.condition(rpc.ELifetimeCondition.COND_InitialOrOwner)
    dint: number;

    @rpc.flags(rpc.FunctionFlags.FUNC_Net | rpc.FunctionFlags.FUNC_NetClient)
    Fire(): void {

    }

    @rpc.flags(rpc.FunctionFlags.FUNC_Net | rpc.FunctionFlags.FUNC_NetServer | rpc.FunctionFlags.FUNC_NetReliable)
    FireServer(): void {

    }

    //如果字段设置了CPF_RepNotify，需要增加“OnRep_字段名”为名字的方法
    OnRep_dint(): void {
        
    }
}
~~~

## 虚拟机切换

puerts同时支持V8和quickjs两种虚拟机，而V8目前有两套版本

* 对于UE4.24及以下，android用的是7.4.288版本的v8，其它系统用的是7.7.299版本的v8
* 对于高于4.24的版本，可以各操作性统一为8.4.371.19
* 对于包大小苛刻的场景，可以选用quickjs

默认提供的上述第一种V8版本。

希望使用8.4.371.19的v8的话，先到[这里](https://github.com/Tencent/puerts/actions/workflows/build_v8.yml)下载编译好的V8，解压到Plugins/Puerts/ThirdParty下，然后把[JsEnv.Build.cs](../../unreal/Puerts/Source/JsEnv/JsEnv.Build.cs)的UseNewV8修改为true

希望使用quickjs的话，先到[这里](https://github.com/Tencent/puerts/actions/workflows//build_quickjs.yml)下载编译好的quickjs，解压到Plugins/Puerts/ThirdParty下，然后把[JsEnv.Build.cs](../../unreal/Puerts/Source/JsEnv/JsEnv.Build.cs)的UseQuickjs修改为true

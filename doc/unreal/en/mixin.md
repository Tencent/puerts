## 蓝图mixin

把一个ts类（假设是类A）mixin到一个蓝图类（类B）的能力：

* 如果A和B都有同样的函数，A的逻辑会替换B的

* 一些事件（比如，ReceiveBeginPlay），如果A有，继续B没有，也会被回调

* 可新增方法或字段

特点：

* 安全：如果ts类和蓝图类有同名函数，将会检查两者的兼容性（符合ts的协变逆变规则）

* 高效：ts类可以调用蓝图类的方法，有代码提示

* 强大
   
   - ts可新增方法（但蓝图不可见）
   
   - ts能新增字段（但蓝图不可见）
   
   - 支持网络相关方法（RPC）的mixin
   
   - 支持事件mixin并能被回调
   
   - 对象声明周期支持脚本持有和引擎持有
   
   - 支持原生类的BlueprintNativeEvent、BlueprintImplementableEvent方法的mixin
   
   
### 基本用法

本文完整例子看[这里](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TsProj/UsingMixin.ts)，将Start脚本改为UsingMixin即可运行。


#### 加载被mixin的蓝图类

~~~typescript
let ucls = UE.Class.Load('/Game/StarterContent/MixinTest.MixinTest_C');

const MixinTest = blueprint.tojs<typeof UE.Game.StarterContent.MixinTest.MixinTest_C>(ucls);
~~~
   
   
#### 写ts扩展

~~~typescript
interface Loggable extends UE.Game.StarterContent.MixinTest.MixinTest_C {};

class Loggable {
    //可以覆盖蓝图对应的函数，函数签名和MixinTest_C声明的不兼容（不需要严格一致，能满足协变逆变要求即可）会报错
    Log(msg:string): void {
        console.log(this.GetName(), msg);
        console.log(`1 + 3 = ${this.TsAdd(1, 3)}`);
    }

    //蓝图没有的纯Ts方法
    TsAdd(x : number, y: number): number {
        console.log(`Ts Add(${x}, ${y})`)
        return x + y;
    }
}
~~~

#### 执行mixin

~~~typescript
const MixinTestWithMixin = blueprint.mixin(MixinTest, Loggable);
~~~

#### 使用新类

MixinTestWithMixin即为新类

~~~typescript
world.SpawnActor(MixinTestWithMixin.StaticClass(), undefined, UE.ESpawnActorCollisionHandlingMethod.Undefined, undefined, undefined) as Loggable;
~~~

### 进阶用法

#### 前置知识

一个UE对象传入到ts，ts侧会建立一个stub (ts)对象与之相对应（ts调用这个stub对象会被转发到真实的UE原生调用），而且在puerts中他们的生命周期间的关系有两种。

* stub对象由js gc管理，stub对象持有ue对象的强引用（下称“stub对象持有ue对象”）

    - 如果stub对象在ts无引用，将会被gc，进而释放对ue对象的强引用
    
    - 如果进一步在ue引擎也没有该ue对象，该ue对象会被gc

* ue对象由ue gc管理，ue对象持有stub对象的强引用（下称“ue对象持有stub对象”）


    - 如果ue对象在ue引擎无引用，该ue对象会被gc，进而释放对stub对象的强引用
    
    - 如果进一步在ts也没有引用该stub对象，该stub对象会被gc

#### blueprint.mixin的参数3

该参数声明

~~~typescript
type MixinConfig = { objectTakeByNative?:boolean, inherit?:boolean, generatedClass?: Class};
~~~



* objectTakeByNative默认为false，表示“stub对象持有ue对象”，为true表示“ue对象持有stub对象”

* inherit和generatedClass是配合使用的，默认为false，表示重定向的是原蓝图类，如果为true的话，将会先动态生成一个继承类，然后重定向生成的类，然后该生成类会通过generatedClass字段返回

#### super关键字的说明

假设有个蓝图类MixinSuperTestDerived继承了蓝图类MixinSuperTestBase，这两个类都有Foo方法，我们要通过mixin覆盖MixinSuperTestDerived上的Foo，在ts逻辑中需要调用基类（蓝图类）的Foo要怎么处理。

直接在前面介绍的不extends任何类的mixin类中调用super会报错。

如下代码会报语法错误。

~~~
class DerivedClassMixin {
    Foo():void {
        console.log("i am ts mixin");
        super.Foo();
    }
}

~~~

这时可以通过添加个中转类来解决问题

~~~
interface MixinSuperTestBasePlaceHold extends UE.Game.StarterContent.MixinSuperTestBase.MixinSuperTestBase_C {};
class MixinSuperTestBasePlaceHold {}
Object.setPrototypeOf(MixinSuperTestBasePlaceHold.prototype, MixinSuperTestBase.prototype);

class DerivedClassMixin extends MixinSuperTestBasePlaceHold {
    Foo():void {
        console.log("i am ts mixin");
        super.Foo();
    }
}
~~~

#### 新增字段

新增字段其实是存放在stub对象里，因而：

* objectTakeByNative为false时，需要保持对stub对象的引用，否则stub对象释放后，ue对象回传将会建立一个新对象，原来的数据就丢失了

* objectTakeByNative为false不需要保持stub对象引用，但注意不要期望通过持有stub对象进而引用ue对象，该ue对象应保证被引擎持有

#### 原生类的mixin

只支持BlueprintNativeEvent、BlueprintImplementableEvent方法，比如如下C++声明的函数

~~~c++
class UMainObject : public UObject
{
	GENERATED_BODY()

public:
    UFUNCTION(BlueprintNativeEvent)
    int32 Mult(int32 a, int32 b) const;


    UFUNCTION(BlueprintImplementableEvent)
    int32 Div(int32 a, int32 b) const;

    int32 Mult_Implementation(int32 a, int32 b) const
    {
        UE_LOG(LogTemp, Warning, TEXT("wrong implementation div %d %d"), a, b);
        return a + b;
    }
}；
~~~

typescript这样mixin

~~~typescript
let obj = new UE.MainObject();

console.log('before mixin start....')
obj.Mult(1, 2);
obj.Div(4, 5);
console.log('before mixin end....')

class Calc {
    //声明为BlueprintNativeEvent的原生方法
    Mult(x: number, y: number) : number
    {
        console.log(`Ts Mult(${x}, ${y})`)
        return x * y;
    }

    //声明为BlueprintImplementableEvent的方法
    Div(x: number, y: number) : number
    {
        console.log(`Ts Div(${x}, ${y})`)
        return x / y;
    }

}

interface Calc extends UE.MainObject {};

blueprint.mixin(UE.MainObject, Calc);

console.log('after mixin start....')
obj.Mult(1, 2);
obj.Div(4, 5);
console.log('after mixin end....')
~~~

输出

~~~bash
before mixin start....
wrong implementation div 1 2
before mixin end....
after mixin start....
Ts Mult(1, 2)
Ts Div(4, 5)
after mixin end....
~~~

可以看到，即使是已经new出来的对象，mixin后调用也是调用到新的ts方法

#### C++ BlueprintNativeEvent函数bug修复

如果你的C++函数声明为BlueprintNativeEvent的话，如果有bug，可以用该功能替换成正确逻辑。

# 基于模板的静态绑定

## 简述

支持反射的UE API（所有蓝图以及C++中标记了UCLASS，USTRUCT，UPPROPERTY，UFUNCTION，UENUM的部分）不用额外操作即可直接用typescript调用，如果是普通的C++ class/struct，或者是UCLASS，USTRUCT中未标记UPPROPERTY，UFUNCTION成员，按照本指引手动声明后可以用typescript调用。

支持特性：

* 构造函数
* 静态函数
* 成员变量
* 成员函数
* 构造函数/静态函数/成员函数，均支持重载
* 支持继承
* 可生成typescript声明
* UE类型未标记UPPROPERTY，UFUNCTION成员声明后，会无缝出现于原类声明中
* 支持Js对象映射到C++的JsObject，JsObject可以获取/设置属性，调用Js函数。
* 支持Js函数映射到std::function
* 支持自定义转换器

## !！注意

如果希望在JsEnv之外的地方使用该特性，比如游戏模块，需要使用动态库版本的v8库，切换方法：

* 到puerts官网下载和puerts配套的v8库，解压于：“Plugins/Puerts/ThirdParty/”目录下

* 找到JsEnv.Build.cs文件，将UseNewV8变量改为true

## helloworld

以一个最简单的普通c++ class为例

~~~cpp
//Calc.h
class Calc
{
public:
    static int32_t Add(int32_t a, int32_t b)
    {
        return a + b;
    }
};
~~~

我们按如下方式声明

~~~cpp
#include "Calc.h"
#include "Binding.hpp"

UsingCppType(Calc);

struct AutoRegisterForCPP
{
    AutoRegisterForCPP()
    {
        puerts::DefineClass<Calc>()
            .Function("Add", MakeFunction(&Calc::Add))
            .Register();
    }
};

AutoRegisterForCPP _AutoRegisterForCPP__;
~~~

（编译，进入UE界面，点击生成按钮）即可在TypeScript中调用
~~~typescript
import * as cpp from 'cpp'

let Calc = cpp.Calc;

//static function
console.log(Calc.Add(12, 34));
~~~

说明：

* 使用到的C++类用UsingCppType前置声明

* 注册类的成员信息，基本模式是：puerts::DefineClass<YouClass>().Function/Method/Property().Register();

* 静态AutoRegisterForCPP类型变量，只是为了利用C++的机制完成自动注册，实际上注册语句可放在脚本调用前执行的任意合法C++代码中。


## 静态函数声明

上章节演示的就是静态函数，用.Function(名字，函数引用)注册静态函数，函数引用有几种方式：

* 函数没有重载：MakeFunction(&Calc::Add)

* 函数有重载，只希望选择其中一个：SelectFunction(float (*)(float, float), &Calc::Add)

* 函数有重载，希望都选择：
~~~c++
CombineOverloads(
    MakeOverload(void(*)(), &TestClass::Overload),
    MakeOverload(void(*)(int32_t), &TestClass::Overload),
    MakeOverload(void(*)(int32_t, int32_t), &TestClass::Overload),
    MakeOverload(void(*)(std::string, int32_t), &TestClass::Overload)
    )
~~~

* 函数没有重载，但希望校验参数：MakeCheckFunction(&Calc::Add)

## 成员变量

~~~c++
class TestClass
{
public:
    int32_t X;
    int32_t Y;
};
~~~

声明：
~~~c++
puerts::DefineClass<TestClass>()
    .Property("X", MakeProperty(&TestClass::X))
    .Property("Y", MakeProperty(&TestClass::Y))
    .Register();
~~~

## 构造函数

~~~c++
class TestClass
{
public:
    TestClass();
    
    TestClass(int32_t InX, int32_t InY);
};
~~~

声明：
~~~c++
puerts::DefineClass<TestClass>()
    .Constructor(CombineConstructors(
        MakeConstructor(TestClass, int32_t, int32_t),
        MakeConstructor(TestClass)
        ))
    .Register();
~~~

如果只有一个构造函数，可以简化
~~~c++
puerts::DefineClass<AdvanceTestClass>()
    .Constructor<int>() //if only one Constructor
    .Register();
~~~

## 成员函数

~~~c++
class TestClass
{
public:
    int32_t OverloadMethod();

    int32_t OverloadMethod(int32_t a);

    uint32_t OverloadMethod(uint32_t a);

    int64_t OverloadMethod(int64_t a);

    TestClass *GetSelf();
};
~~~

声明

~~~c++
puerts::DefineClass<TestClass>()
    .Method("OverloadMethod", CombineOverloads(
        MakeOverload(int32_t(TestClass::*)(), &TestClass::OverloadMethod),
        MakeOverload(int32_t(TestClass::*)(int32_t), &TestClass::OverloadMethod),
        MakeOverload(uint32_t(TestClass::*)(uint32_t), &TestClass::OverloadMethod),
        MakeOverload(int64_t(TestClass::*)(int64_t), &TestClass::OverloadMethod)
        ))
    .Method("GetSelf", MakeFunction(&TestClass::GetSelf))
    .Register();
~~~

## 继承

~~~c++
class BaseClass
{
public:
    void Foo(int p);
};

class TestClass : public BaseClass
{
public:
};
~~~

声明

~~~c++
puerts::DefineClass<BaseClass>()
    .Method("Foo", MakeFunction(&BaseClass::Foo))
    .Register();

puerts::DefineClass<TestClass>()
    .Extends<BaseClass>()
    .Register();
~~~

## Js对象映射到JsObject并获取/修改Js对象属性

~~~c++
#include "JsObject.h"

class AdvanceTestClass
{
public:
    AdvanceTestClass(int A);

    void JsObjectTest(FJsObject Object);
};

void AdvanceTestClass::JsObjectTest(FJsObject Object)
{
    auto P = Object.Get<int>("p");
    UE_LOG(LogTemp, Warning, TEXT("AdvanceTestClass::JsObjectTest({p:%d})"), P);
    Object.Set<std::string>("q", "john");
}
~~~

在typescript中使用

~~~typescript
import * as cpp from 'cpp'

//js object
let obj  = new cpp.AdvanceTestClass(100);
let j:any = {p:100};
obj.JsObjectTest(j);
console.log(j.q);
~~~

## Js函数映射JsObject并回调

~~~c++
//class decl ...
void AdvanceTestClass::CallJsObjectTest(FJsObject Object)
{
    auto Ret = Object.Func<float>(1024, "che");
    UE_LOG(LogTemp, Warning, TEXT("AdvanceTestClass::CallJsObjectTest Callback Ret %f"), Ret);
}

~~~

在typescript中使用

~~~typescript
let obj  = new cpp.AdvanceTestClass(100);
obj.CallJsObjectTest((i, str) => {
    console.log(i, str);
    return 1.01;
})
~~~

## Js函数映射到std::function

~~~c++
//class decl ...
void AdvanceTestClass::StdFunctionTest(std::function<int(int, int)> Func)
{
    int Ret = Func(88, 99);
    UE_LOG(LogTemp, Warning, TEXT("AdvanceTestClass::StdFunctionTest Callback Ret %d"), Ret);
}
~~~

在typescript中使用

~~~typescript
let obj  = new cpp.AdvanceTestClass(100);
obj.StdFunctionTest((x:number, y:number) => {
    console.log('x=' + x + ",y=" + y);
    return x + y;
})
~~~

## UE类补充声明

比如UObject的CreateDefaultSubobject、GetName、GetOuter、GetClass、GetWorld方法，均不是UFunction

添加如下声明：

~~~c++
#include "CoreMinimal.h"
#include "Binding.hpp"
#include "UEDataBinding.hpp"

UsingUClass(UObject)
UsingUClass(UWorld) // for return type
UsingUClass(UClass)
UsingUClass(USceneComponent)

puerts::DefineClass<UObject>()
#if ENGINE_MAJOR_VERSION >= 4 && ENGINE_MINOR_VERSION >= 23
    .Method("CreateDefaultSubobject", SelectFunction(UObject* (UObject::*)(FName, UClass*, UClass*, bool , bool), &UObject::CreateDefaultSubobject))
#else
    .Method("CreateDefaultSubobject", SelectFunction(UObject* (UObject::*)(FName, UClass*, UClass*, bool, bool, bool), &UObject::CreateDefaultSubobject))
#endif
    .Method("GetName", SelectFunction(FString (UObjectBaseUtility::*)() const, &UObjectBaseUtility::GetName))
    .Method("GetOuter", MakeFunction(&UObject::GetOuter))
    .Method("GetClass", MakeFunction(&UObject::GetClass))
    .Method("GetWorld", MakeFunction(&UObject::GetWorld))
    .Register();
~~~

注意：和普通c++类不一样，如果是一个UClass，需要使用UsingUClass前置声明，类似的如果是UStruct，需要用UsingUStruct

重新生成ue.d.ts，可以看到上述方法已经添加到UE.Object的声明

~~~typescript
class Object {
    constructor(Outer?: Object, Name?: string, ObjectFlags?: number);
    ExecuteUbergraph(EntryPoint: number): void;
    CreateDefaultSubobject(p0: string, p1: $Nullable<Class>, p2: $Nullable<Class>, p3: boolean, p4: boolean) : Object;
    GetName() : string;
    GetOuter() : Object;
    GetClass() : Class;
    GetWorld() : World;
    static StaticClass(): Class;
    static Find(OrigInName: string, Outer?: Object): Object;
    static Load(InName: string): Object;
}
~~~

后续可以直接在Object对象上使用上述方法。

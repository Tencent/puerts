# UE下脚本和引擎交互

所有（C++/蓝图）的UCLASS，UPPROPERTY，UFUNCTION，USTRUCT，UENUM，都可以直接访问

但对于UCLASS/USTRUCT下未标记UPPROPERTY，UFUNCTION的属性和方法，以及普通c++ class/struct，需要根据[《基于模板的静态绑定》](template_binding.md)介绍的方法，声明、注册后使用。

## 生成TypeScript声明文件

* C++/蓝图均按TypeScript声明调用即可，除了C++类是常驻内存，蓝图需要手动加载之外，其它对象上的方法/属性访问等没区别

* 点击如下按钮进行声明文件的生成

![puerts_gen_dts.png](../../pic/puerts_gen_dts.png)

* 或者，也可以通过控制台命令生成声明文件：`Puerts.Gen`
    - 注：UE5 EA版的工具栏扩展按钮目前无法使用，故可用这种方式替代。
## 成员及函数

~~~typescript
//对象构造
let obj = new UE.MainObject();

//成员访问
console.log("before set", obj.MyString)
obj.MyString = "PPPPP";
console.log("after set", obj.MyString)

//简单类型参数函数
let sum = obj.Add(100, 300);
console.log('sum', sum)

//复杂类型参数函数
obj.Bar(new UE.Vector(1, 2, 3));

//引用类型参数函数
let vectorRef = $ref(new UE.Vector(1, 2, 3))
obj.Bar2(vectorRef);
obj.Bar($unref(vectorRef));

//静态函数
let str1 = UE.JSBlueprintFunctionLibrary.GetName();
let str2 = UE.JSBlueprintFunctionLibrary.Concat(', ', str1);
UE.JSBlueprintFunctionLibrary.Hello(str2);

//枚举
obj.EnumTest(UE.EToTest.V1);

~~~

## 蓝图&其它资源加载

~~~typescript
//加载蓝图类
let bpClass = UE.Class.Load('/Game/StarterContent/TestBlueprint.TestBlueprint_C');
//UE.XXX.Load等同于在C++里头写LoadObject<XXX>，所以UE.Class.Load等同于C++的LoadObject<UClass>
let bpActor = world.SpawnActor(bpClass, undefined, UE.ESpawnActorCollisionHandlingMethod.Undefined, undefined, undefined) as UE.TestBlueprint_C;
~~~

蓝图类本质也是一种资源，用类似的方式也可以加载其它资源，比如例子和Static Mesh的加载：

~~~typescript
let bulletImpact = UE.ParticleSystem.Load("/Game/BlockBreaker/ParticleSystems/PS_BulletImpact");
let rifle = UE.StaticMesh.Load("/Game/BlockBreaker/Meshes/SM_Rifle");
~~~

## TArray、TSet、TMap

* 创建

~~~typescript
//TArray<int>
let a2 = UE.NewArray(UE.BuiltinInt);
//TArray<FString>
let a3 = UE.NewArray(UE.BuiltinString);
//TArray<UActor>
let a4 = UE.NewArray(UE.Actor);
//TArray<FVector>
let a5 = UE.NewArray(UE.Vector);
//TSet<FString>
let s1 = UE.NewSet(UE.BuiltinString);
//TMap<FString, int>
let m1 = UE.NewMap(UE.BuiltinString, UE.BuiltinInt);
~~~

* 访问，按IDE的自动提示访问容器即可

~~~typescript
a2.Add(888);
a2.Set(0, 7);
console.log(a2.Num());
m1.Add("John", 0)
m1.Add("Che", 1)
console.log(m1.Get("John"))
~~~

## ArrayBuffer

处理网络消息需要用到这个

### TypeScript访问C++的Buffer

C++

~~~c++
UPROPERTY()
FArrayBuffer ArrayBuffer;

//设置内容
ArrayBuffer.Data = "hello";
ArrayBuffer.Length = 5;
~~~

TypeScript

~~~typescript
let ab = obj.ArrayBuffer;
let u8a1 = new Uint8Array(ab);
for (var i = 0; i < u8a1.length; i++) {
    console.log(i, u8a1[i]);
}
~~~

## TypeScript传ArrayBuffer给C++

C++

~~~c++
void UMainObject::ArrayBufferTest(const FArrayBuffer& Ab) const
{
    UE_LOG(LogTemp, Warning, TEXT("Ab(%p, %d)"), Ab.Data, Ab.Length);
}
~~~

TypeScript

~~~typescript
var arr = new Uint8Array([21,31]);
obj.ArrayBufferTest(arr);
~~~

## 回调

引擎侧可以通过DYNAMIC_DELEGATE，DYNAMIC_MULTICAST_DELEGATE来主动调用TypeScript

* UI的用户操作、网络消息可以通过这个通知到TypeScript

* 如果希望导出个TypeScript函数给C++调用，也可以用这个

C++定义

~~~c++
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FNotifyWithInt, int32, A);
DECLARE_DYNAMIC_DELEGATE_RetVal_OneParam(FString, FNotifyWithStringRet, FString, A);
DECLARE_DYNAMIC_DELEGATE_OneParam(FNotifyWithRefString, FString&, A);

UCLASS()
class PUERTS_UNREAL_DEMO_API AMyActor : public AActor
{
	GENERATED_BODY()

public:
    UPROPERTY()
    FNotifyWithInt NotifyWithInt;

    UPROPERTY()
    FNotifyWithRefString NotifyWithRefString;

    UPROPERTY()
    FNotifyWithStringRet NotifyWithStringRet;
    //...
};

~~~

TypeScript绑定

~~~typescript
function MutiCast1(i) {
    console.warn("MutiCast1<<<", i);
}

function MutiCast2(i) {
    console.warn("MutiCast2>>>", i);
}

actor.NotifyWithInt.Add(MutiCast1)
actor.NotifyWithInt.Add(MutiCast2)

actor.NotifyWithRefString.Bind((strRef) => {
    console.log("NotifyWithRefString", $unref(strRef));
    $set(strRef, "out to NotifyWithRefString");//引用参数输出
});

actor.NotifyWithStringRet.Bind((inStr) => {
    return "////" + inStr;
});
~~~

C++触发

~~~c++
NotifyWithInt.Broadcast(0);
NotifyWithStringRet.ExecuteIfBound("hi...");
if (NotifyWithRefString.IsBound())
{
    FString Str = TEXT("hello john che ");

    NotifyWithRefString.Execute(Str);
    UE_LOG(LogTemp, Warning, TEXT("NotifyWithRefString out ? %s"), *Str);
}
~~~

## 扩展函数

UE有很多C++函数没有UFUNCTION标记，这种API要怎么调用呢？方式有两种：

* 扩展函数，这是推荐的方式
* 用Puerts一个未发布的代码生成器生成wrap代码

以UObject::GetClass和UObject::FindFunction为例

C++扩展

~~~c++
//ObjectExtension.h
UCLASS()
class UObjectExtension : public UExtensionMethods
{
	GENERATED_BODY()

    UFUNCTION(BlueprintCallable, Category = "ObjectExtension")
    static UClass *GetClass(UObject *Object);

    UFUNCTION(BlueprintCallable, Category = "ObjectExtension")
    static UFunction* FindFunction(UObject *Object, FName InName);
};
~~~

~~~c++
//ObjectExtension.cpp
#include "ObjectExtension.h"

UClass * UObjectExtension::GetClass(UObject *Object)
{
    return Object->GetClass();
}

UFunction* UObjectExtension::FindFunction(UObject *Object, FName InName)
{
    return Object->FindFunction(InName);
}
~~~

要点：

* 新建一个类继承自UExtensionMethods
* 扩展函数的参数1就是被扩展类

在TypeScript访问时，跟访问一个对象的成员方法类似

* ps，新增扩展函数需要重新生成声明文件

~~~typescript
let cls = obj.GetClass();
let func = obj.FindFunction("Func");
~~~

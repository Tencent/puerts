# UE下脚本和引擎交互

所有（C++/蓝图）的UCLASS，UPPROPERTY，UFUNCTION，USTRUCT，UENUM，都可以直接访问

但对于UCLASS/USTRUCT下未标记UPPROPERTY，UFUNCTION的属性和方法，以及普通c++ class/struct，需要根据[《基于模板的静态绑定》](template_binding.md)介绍的方法，声明、注册后使用。

## 生成TypeScript声明文件

* C++/蓝图均按TypeScript声明调用即可，除了C++类是常驻内存，蓝图需要手动加载之外，其它对象上的方法/属性访问等没区别

* 点击如下按钮进行声明文件的生成

![puerts_gen_dts.png](../../../doc/pic/puerts_gen_dts.png)

* 或者，也可以通过控制台命令生成声明文件：`Puerts.Gen`

   - Puerts.Gen默认仅生成UCLASS及被UCLASS引用的USTRUCT，UENUM
   
   - 如果希望增加未引用的USTRUCT，执行`Puerts.Gen STRUCT`
   
   - 如果希望增加未引用的UENUM，执行`Puerts.Gen ENUM`
   
   - 如果希望增加未引用的USTRUCT、UENUM，执行`Puerts.Gen ALL`

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

### C++ LoadObject的等价操作

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

### blueprint.load /  blueprint.unload

对一个蓝图类，蓝图结构体，蓝图枚举执行blueprint.load后，可以直接访问该蓝图

~~~typescript
blueprint.load(UE.Game.StarterContent.TestEnum.TestEnum);

console.log(UE.Game.StarterContent.TestEnum.TestEnum.Blue);
console.log(UE.Game.StarterContent.TestEnum.TestEnum.Red);
console.log(UE.Game.StarterContent.TestEnum.TestEnum.Green);

//等价于前面UE.Class.Load的例子
blueprint.load(UE.Game.StarterContent.TestBlueprint.TestBlueprint_C)
const TestBlueprint_C = UE.Game.StarterContent.TestBlueprint.TestBlueprint_C
let bpActor = world.SpawnActor(TestBlueprint_C.StaticClass(), undefined, UE.ESpawnActorCollisionHandlingMethod.Undefined, undefined, undefined) as UE.TestBlueprint_C;
~~~

说明

* blueprint.load只需执行一次，没被unload前都可用

* blueprint.load执行过后，该类对应的(UClass, UScriptStruct, UEnum)示例都会被持有，需要通过blueprint.unload释放

* 静态蓝图类（Blueprint Function Library）可以blueprint.load加载后使用

### blueprint.tojs

将一个UClass对象转换成ts的类

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


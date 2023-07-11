# 引擎(或纯C++)调用脚本

主要用于引擎主动调用脚本的某些功能（比如eval），或者UI事件、网络消息等回调通知场景。

## C++

### DYNAMIC_DELEGATE

#### UClass下的DYNAMIC_DELEGATE字段

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

#### 如果不是UClass下的DYNAMIC_DELEGATE字段

C++代码
~~~c++
void UMainObject::PassJsFunctionAsDelegate(FCallback Callback) const
{
    auto Ret = Callback.Execute(TEXT("John"));
    UE_LOG(LogTemp, Warning, TEXT("John ? %d"), Ret);

    Ret = Callback.Execute(TEXT("Che"));
    UE_LOG(LogTemp, Warning, TEXT("Che ? %d"), Ret);
}
~~~


方式一：toDelegate(owner: UE.Object, func: Function)

~~~typescript
import {toDelegate} from 'puerts';

function IsJohn(str:string) : boolean {
    return str == "John";
}
//owner是一个UObject，owner释放后自动释放IsJohn
obj.PassJsFunctionAsDelegate(toDelegate(owner, IsJohn));
~~~

方式二：toManualReleaseDelegate(func:Function)

~~~typescript
import {toManualReleaseDelegate, releaseManualReleaseDelegate} from 'puerts';

function IsJohn(str:string) : boolean {
    return str == "John";
}
obj.PassJsFunctionAsDelegate(toManualReleaseDelegate(IsJohn));
//用完需要手动释放，否则有内存泄露
releaseManualReleaseDelegate(IsJohn);
~~~

方式三：toDelegate(obj: UE.Object, funcName: string)

~~~typescript
import {toDelegate} from 'puerts';

//obj是一个UObject，IsJohn是这个UObject上的UFunction
obj.PassJsFunctionAsDelegate(toDelegate(obj, "IsJohn"));
~~~


### std::function

普通C++下更建议用std::function，和Delegate类似

~~~c++
void AdvanceTestClass::StdFunctionTest(std::function<int(int, int)> Func)
{
    int Ret = Func(88, 99);
    UE_LOG(LogTemp, Warning, TEXT("AdvanceTestClass::StdFunctionTest Callback Ret %d"), Ret);
}
~~~


TypeScript访问

~~~typescript
obj2.StdFunctionTest((x:number, y:number) => {
    console.log('x=' + x + ",y=" + y);
    return x + y;
})
~~~

## 蓝图

### DYNAMIC_DELEGATE

C++章节介绍的DYNAMIC_DELEGATE也是可用的

### 静态脚本方法

！注意，这种方式需要开启[继承UE类功能](uclass_extends.md)

~~~typescript
import * as UE from "ue";

class TsUtils extends UE.BlueprintFunctionLibrary {
  public static Sum(a: number, b: number, c: number): number {
    return a + b + c
  }
  
  public static GetBool() :boolean {
    return true;
  }
}

export default TsUtils

~~~

上述TsUtils在蓝图里可以像普通的蓝图函数库一样使用。

### 成员脚本方法

！注意，这种方式需要开启[继承UE类功能](uclass_extends.md)

成功后，就可以像普通蓝图类那样使用该ts类

具体操作见[继承UE类功能](uclass_extends.md)。

### 基于Mixin成员方法调用

有没开启继承UE类功能均可使用该功能。

mixin后，蓝图方法将会被同名ts方法覆盖。

于是你可以获取一些引擎通知，比如ReceiveBeginPlay，也可以在蓝图添加一个空函数，用ts覆盖后，调用这个空函数就相当于到相应的ts方法。

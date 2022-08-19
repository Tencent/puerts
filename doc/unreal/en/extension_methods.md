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

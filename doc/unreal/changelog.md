### v1.0.0 2022年4月8日

#### 新增特性

* UE下启动一个或者多个JavaScript虚拟机的能力

* 通过反射访问UE反射API（标注了UCLASS，UPPROPERTY，UFUNCTION，USTRUCT，UENUM的C++类，以及所有的蓝图）的能力

* 通过模板绑定功能访问普通C++ API的能力

* 根据反射及模板绑定声明，生成对应的TypeScript的能力

* 通过DYNAMIC_DELEGATE、静态绑定的std::function，被UE引擎调用脚本函数的能力

* 通过“继承引擎类功能”提供被UE引擎访问脚本逻辑的能力


#### 变更

#### bug修复
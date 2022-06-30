### v1.0.0 2022年6月30日

#### 新增特性

* 多线程安全

* 蓝图mixin功能

* 支持UE本地化工作流

* 原生类型强校验

* 静态绑定支持默认值

* 静态绑定支持静态变量

* 静态绑定支持const char*、const TCHAR*参数

* 静态绑定支持数组类型及std::string的指针，映射到ts的$Ref<T>

* 静态绑定引用类型的性能优化

* UE5.0正式版的支持

* 添加blueprint.load，blueprint.unload，blueprint.tojs

* 嵌套结构体（第一个字段嵌套）性能优化

* 添加gc相关接口：IdleNotificationDeadline、RequestMinorGarbageCollectionForTesting、RequestFullGarbageCollectionForTesting

* 添加FName的ArrayBuffer表达支持，可优化字符串字面值FName的传输

* enum添加支持反向映射

* ts生成的蓝图的路径改为可以通过宏来修改

* 内部优化：关键路径std::map -> TMap

* 新增导出DTS时 Ignore Struct、Class 的配置

* ts_file_versions_info.json的版本号处理优化

* DefaultJSModuleLoader的一些函数改为虚函数，可被继承和覆盖

* 把模块的search以及load阶段分开，优化大文件模块会重复读取的问题，某大型项目实测加载性能提升3倍

* Puerts.Gen增加STRUCT，ENUM，ALL参数

* 继承ue类支持使用枚举

* 容器支持GetRef

* 新增“持有结构体指针时，阻止父节点回收”功能

#### 变更

* 非编辑器不调用TS的构造函数

* 原生类型改为强校验

* 默认对蓝图枚举生成声明

* ts声明中，UStruct的StaticClass改为StaticStruct，和C++对齐

* 去掉生成蓝图ts里，参数用TArray的报错

#### bug修复

* 解决nodejs版本异步实例化wasm一直没回调的问题

* 解决ts文件被锁定，编译时死循环的问题

* 一个文件变更触发整个ts工程读取两遍的性能问题

* 数字作为name的蓝图枚举，生成的ts声明报错

* 修复当尝试ts继承一个ustruct的时候，编辑器崩溃的问题

* 解决静态绑定const UStruct*参数声明生成语法错误的问题

* nodejs版本打包后，程序退出时崩溃

* 结构体类型的字段访问的内存泄漏

* 静态绑定含结构体字段的结构体（比如FBox2d）的首字段的字段访问失败


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
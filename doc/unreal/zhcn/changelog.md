### v1.0.3 2022年2月2日

#### 新增特性

* ue类型对应的js类型增加类型名称（编辑器全路径），以便于打印堆栈dump的时候分析

* 静态绑定void*参数支持任意原生对象传入

* 添加常用方法UDataTableFunctionLibrary::Generic_GetDataTableRowFromName的静态绑定

* 手动删除蓝图，重启后自动生成

* puerts::Object、puerts::Funcion加入对JsEnv的生命周期跟踪，降低使用的难度

* cjs和mjs配合优化，支持package.json中通过"type": "module"指定为esm模块，支持在esm中加载.cjs（cjs模块）。

* 添加Puerts.Gen FULL，蓝图全量生成功能

* 默认生成所有struct的声明

* 添加控制台命令（puerts ls，puerts compile）

* 生成代码时，如果加载的蓝图GeneratedClass为空报错

* nodejs版本下，优先调用nodejs的require，加载不成功再使用puerts的加载逻辑

* 编辑器下，quickjs后端默认用dll版本，去掉该后端下不能在业务模块静态声明的问题

* 增加运行时 JavaScript 路径配置


#### 优化

* 反射性能优化

* 蓝图结构体都生成到ue_bp.d.ts

* 优化大量代理蓝图以及ts代码的启动速度


#### 变更

#### bug修复

* 解决刚创建蓝图但未保存，生成d.ts的崩溃

* mixin对输出值设置无效的问题

* 解决带Out参数蓝图调用另一个重定向到ts的Out参数方法，ts中设置Out参数无效的问题

* DefaultJSModuleLoader加载名字带点号的模块

* react-umg声明，对于struct改为Partial来自动处理成可选字段，可以避免引用UE模块时产生的名字空间问题

* 解决如果一个package含超过一个类型，只生成一个类型的bug

* 解决ts继承BlueprintFunctionLibrary在Editor下只跑一次，打包后不跑的问题

* 结构体两次Init的修正

* FName大小写的问题导致函数为空的问题

* json文件加载失败的问题

* 解决继承链上有同名类导致的tid冲突

* ue5生成声明忽略Engine.Transient包，解决ue5改包下类的.d.ts报错问题

* 静态绑定和pesapi的int64、uint64参数，不传bigint都统一用默认值


### v1.0.2 2022年9月8日

#### 新增特性

* 手机nodejs后端支持

* 静态绑定支持bound array( 例如：int ba[10])字段，支持void *

* 静态绑定支持仅声明无定义类的注册

* 静态绑定支持“重载+默认参数”

* 静态绑定增加对script type的const T*的支持

* const char*支持通过ArrayBuffer传递

* 自创建的JsEnv也能支持代码热刷新

* 支持std::function的函数签名声明生成

* 静态绑定添加ExtensionMethod（类似C#）的支持

* 静态绑定添加TSharedPtr的支持

* nodejs版本支持代码热刷新

* 静态绑定支持运行时获取typeid

#### 优化

* 编辑器下虚拟机重置时，大量对象需要加载js脚本而导致启动速度慢的问题

* 通过对BackingStore封装，支持编辑器下的结构体gc优化

* JsEnv.Start统一改为通过require来加载，让初始脚本和其它脚本一致（debug、热刷新等）

* 增量生成蓝图的ue.d.ts声明，解决业务连带资源过多，导致生成太慢的问题

#### 变更


#### bug修复

* 解决开启ThreadSafe选项后，由ts触发ue gc可能会导致死锁的问题

* 解决将std map替换成tmap后( b823ab9 )，tmap可能会因为插入操作而导致外部查找结果失效的问题

* 解决release编译，由于同签名函数的CFunctionInfoImpl合并成一个导致生成d.ts的默认值个数不对的问题

* 修复符合继承类格式，但是继承的不是UE类型而是ts原生类型时导致的报错

* 稳定性增强，对FV8Utils::GetUObject返回的对象增加无效指针判断

* previewworld下找不到jsobject的报错 

* 解决UE静态绑定使用了cpp模块里头的类型作为字段，ue.d.ts报错的问题

* 静态绑定的静态属性生成ue.d.ts时崩溃的问题

* SignatureFunction所在内存被重用，导致FFunctionTranslator访问无效UFunction导致崩溃

* 修复DynamicInvoker被多线程访问导致的问题

* 解决容器（或者其它非POD UStruct）引用参数用$ref(undefined)传递时、内存泄漏的问题

* 解压容器反射因为字节对齐问题导致的崩溃

* 解决mixin特性在非运行状态使用，如果编辑器触发保存会触发蓝图非法断言的问题


### v1.0.1 2022年6月30日

#### 新增特性

* 多线程安全

* 蓝图mixin功能

* 支持UE本地化工作流

* 原生类型强校验

* 静态绑定支持默认值

* 静态绑定支持静态变量

* 静态绑定支持const char*、const TCHAR*参数

* 静态绑定支持数组类型及std::string的指针，映射到ts的`$Ref<T>`

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
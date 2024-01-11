### v1.0.6 2024年1月11日

#### 新增特性

* 支持通过赋值去清空一个JsObject

* 添加UsingCrossModuleCppType，能避免不同模块引用同一个类typeid不同的问题

* 静态绑定支持在原生函数中跑异常，有两种实现，线程本地存储以及异常，前者有侵入性，后者不能跨动态库使用

* 容器添加[Symbol.iterator]支持

* puerts::Object尝试添加SetWeakAndOwnBy方法，用于某种场景下避免循环引用

* 静态绑定新增MethodProxy，PropertyProxy，用于解决多重继承virtual public静态绑定，子类对象调用父类方法时，this指针错误的问题

* 静态绑定添加从Function数据获取this的选项：GetSelfFromData

* ue5.3兼容

* v8后端拓展esm的支持：引用ue，cpp模块，继承ue类支持esm（*.mts)

* TArray.Add() 变参函数 (#1513)


#### 优化

* v8 和 UE 字符串传递默认使用 UTF16 避免编码转换

* 声明生成排除PropertyMetaRoot

* 重构静态绑定，支持同时使用多种后端

* 支持在puerts名字空间加个_qjs后缀

* 默认打开UE绕行优化 fix #1537

* 容器以及纯c++类型修改为使用InstanceTemplate()->NewInstance实现FindOrAdd，fix #1496

* 优化timer实现，fix #1506


#### 变更

* 内部使用的GetJsObject方法改为私有，防止业务调用

* pesapi版本升级以及api新增

* v8编译参数v8_use_external_startup_data改为false，去掉SnapshotBlob.h，fix #1478

#### bug修复

* 修复在windows下使用远程IOS编译，变量名重名导致的编译失败

* Delegate没调用Bind就Unbind会报错 (#1622)

* mixin原生类，然后恢复，导致后续原生实现调用参数不对的问题，fix #1618

* 解决静态绑定下，需要检查参数类型，子类不能通过基类参数的检查的问题

* 修复 codegen .d.ts 函数参数列表可能重名的问题 (#1609)

* V8Object.hpp加上线程安全支持

* FJsObject析构时加入JsEnv生命周期的判断，fix #1582

* 属性的meta在ts删除了，生成蓝图要同步删除，fix #1551

* UStruct 析构可能发生在后台线程 fix #1539

* js分配的容器，在关闭JsEnv时可能会有内存泄露，fix #1530

* 防止toManualReleaseDelegate传给多个不同签名的回调，导致后面的参数处理错误

* 函数返回const FXXStruct&时，静态绑定报错，fix #1516

* 如果require脚本发送错误，不应该放cache，这会导致第二次require能成功返回（但模块不正常）

### v1.0.5 2023年8月31日

#### 新增特性

* ios下，以及quickjs后端的wasm实现

* FJsObject添加JsEnv生命周期监听，puerts.Object补上拷贝构造，赋值的JsEnv生命周期监听

* 支持使用visual studio时，typescript的监听和自动蓝图，js生成

* 支持通过@uproperty.attach设置Component层次

* 对放置路径不符合ts标识符规范的蓝图

* 支持单独设置某个虚拟机的max-old-space-size，并把增量分析编译虚拟机的内存增加到2G

* 声明生成按钮改为puerts按钮，除了生成*.d.ts，也拷贝系统js文件

* 添加自动管理生命周期的puerts.toDelegate方法

* ue.d.ts新增ue api的注释

* pesapi addon的支持

* pesapi添加类型信息支持

* pesapi addon支持通过WITHOUT_PESAPI_WRAPPER使用dll链接，而不是内部函数指针

* pesapi addon支持直接使用V8 api

* pesapi addon支持v8 fast api call

* 添加pesapi_create_array, pesapi_is_array，pesapi_get_array_length

* 添加macOS arm64的支持

* quickjs版本支持html5打包


#### 优化

* minxin如果class是RootSet，Function也AddToRoot

* 只有原生的才生成到ue.d.ts

* 重构静态绑定：backend彻底分离而且可以共存

* 尝试ts继承蓝图类时报错

#### 变更

* 配置类别更名 Engine Class Extends Mode -> Default JavaScript Environment

* 不支持override GameInstance.ReceiveInit

* Typing目录调整到Project下

* quickjs编辑器下默认使用静态链接！影响比较大，如果用quickjs，就不能在JsEnv外使用静态绑定

* ReactUMG不再随Puerts发布，有需要自行下载：https://github.com/puerts/ReactUMG

#### bug修复

* 函数参数是ts关键字导致的语法非法

* 解决重用外层esm标记导致的两次require间相互影响的问题

* 静态绑定如果构造函数没重载时，参数错误构造函数不执行也不抛异常的问题

* 解决元素为组件的容器识别为组件的问题

* 解决v8 fast api call下静态函数性能慢的问题

* 修复forceinject的时候可能重复setprototype导致的exception

* ue5.2可能会生成重名的隐藏property，加个过滤

### v1.0.4 2023年6月19日

#### 新增特性

* 容器GetRef支持LinkOuter

* 默认添加UObject的IsA函数的静态绑定

* setTimeout, setInterval增加argumentgs的支持

* 静态绑定加入fast api call支持

* 添加C#版本的默认值收集模块，用于支持ue5.2

* 添加PUERTS_FORCE_CPP_UFUNCTION选项：打开后在js调用js实现的蓝图方法时，直接调用而不需要在引擎段绕一圈

* 反射支持TFieldPath类型

* 添加栈生命周期的原生Buff转js的ArrayBuffer的支持，fix #1360


#### 优化

* 清理大部分ue5的deprecated api使用
 
* 生成时如果蓝图路径和文件名含特殊符号，忽略并打印warning，如果基类非法，就跳到更基础的基类来继承

* 声明生成过滤掉+号

* 在push对象到js的阶段就处理好引用方向（是原生对象引用js，还是js引用原生对象），简化逻辑，并提升性能

* 对象IsUnreachable也作为无效状态

* 非GameThread加载代理蓝图，js相关初始化延迟到第一次push到js fix #1229

* instancof不走ts，提升静态绑定的性能 (#1246)

* 静态绑定返回值如果是非const引用，按指针处理，不用特别指明 fix #1258

* 去掉EscapableHandleScope的使用，fix #1291

* JsEnv.Build.cs的ShadowVariable设置为Warning fix #1189

* 跳过非法蓝图结构体，蓝图类的生成


#### 变更

* 如果一个方法是蓝图静态方法，而且第一个参数是__WorldContext的话，调用js时忽略该参数 fix #1210

* makeUClass声明为@deprecated

* Puerts模块的LoadingPhase改为PostEngineInit，这会导致GameInstance的ReceiveInit支持不了

* 如果继承引擎类的ts类成员变量类型为UActorComponent子类，将添加组件，而不是仅仅添加一个变量，这会导致业务代码调整

   - 定义了组件，就自动在蓝图创建组件，无需在构造函数中通过代码创建，规避了UE的一些多线程加载问题，也更简单些

   - 构造函数无法访问Component，建议一些初始化操作放到ReceiveBeginPlay，或者直接在生成的代理蓝图上修改
   
   - 不能通过SetupAttachment对component的层级修改（因为构造函数访问不了，ReceiveBeginPlay又太晚了），需要生成的代理蓝图上手动修改

#### bug修复

* 修复在unity v2发现的问题：https://github.com/Tencent/puerts/issues/1203 ，该问题理论上在ue也有机率发生

* linux编译找不到libnode.so

* 反射调用，参数转换抛出异常后不应该继续往下走

* 修复运行Commandlet时的崩溃问题 (#1247) 

* 静态模板const USTRUCT*参数报错的问题，fix #1258

* 代理蓝图，第二次PIE不生效的问题

* ue 5.1按钮消失的问题

* 增加头文件生成的依赖引入

* cjs，esm加载的一些不兼容情况修复

* 中文名字蓝图会导致ue_bp.d.ts重复声明的问题

* 蓝图Interface声明生成无namespace，fix #1304

* 解决反射调用代理蓝图函数，引用参数传递失败的问题

* 解决子类和基类生成蓝图同时被删除，先生成子类再生成基类时导致的REINST assert

### v1.0.3 2023年2月2日

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

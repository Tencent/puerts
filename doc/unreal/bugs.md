### v1.0.1

#### BindInfoPtr可能指向无效数据进而导致崩溃

##### 问题描述

[std::map替换为TMap的优化](https://github.com/Tencent/puerts/commit/b823ab9255d93e805039da138cbbc97bd21d4faa)，没考虑到FindOrAdd会引发BindInfoMap的rehash，进而导致BindInfoPtr失效

##### 修复

https://github.com/Tencent/puerts/commit/d6e3dbf50d5e54c195d95d64aa09a6112ecc6b1a

### v1.0.0

#### 结构体类型的字段访问的内存泄漏

##### 问题描述

[结构体字段cache](https://github.com/Tencent/puerts/commit/0c64722f961bb5ec241aa2808d9872db66ccf91f)引入的问题。

obj.VecotrField，会有对该字段的cache，但这个字段js不在引用了cache未清理

##### 修复

https://github.com/Tencent/puerts/commit/1460c0d64d30f2aac63e213f1ed2c926d173ab44

#### 静态绑定含结构体字段的结构体（比如FBox2d）的首字段的字段访问失败

##### 问题描述

[结构体字段cache](https://github.com/Tencent/puerts/commit/0c64722f961bb5ec241aa2808d9872db66ccf91f)引入的问题。

如果一个结构体，它的第一个字段也是结构体，并且是静态绑定的话（目前只看到FBox2d满足这些条件）就会出现如下问题：

~~~typescript
let box = new UE.Box2D();
box.Max.X = 100;
box.Max.Y = 102;
box.Min.X = 1100; //其实设置的是box.X
box.Min.Y = 102;  //其实设置的是box.Y
~~~

传入引擎后，box.Min.X，box.Min.Y都是未初始化变量。

##### 修复

https://github.com/Tencent/puerts/commit/347e57aef4bb96e5603b192cb4229798a59363b0


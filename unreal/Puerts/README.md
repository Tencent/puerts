# puerts for unreal

puerts方案的Unreal版本

## 特点

* 无需胶水代码的生成即可访问任意蓝图接口

* 非蓝图类可以通过生成代码静态Binding访问，而蓝图接口也能通过静态Binding提升性能

* 支持TypeScript类继承一个UClass，并支持override其父类的函数

## 特性列表

* UClass，UStruct的构造

* UProperty的访问

* UFunction的访问

* 扩展方法

* UEnum的使用

* 容器（TArray，TMap，TSet）

* 蓝图动态加载和带类型检查的访问

* 一个TypeScript函数映射到DynamicDelegate，MuticastDynamicDelegate

* TypeScript类继承UClass，并支持override其父类的一些函数

    
## 性能

### 基于反射的Binding

(数值单位：百万次每秒)

|              | 无参数无返回值函数 | 无参数有int返回值函数 | int参数int返回值函数 | 字符串参数int返回值函数  |
| ------------ | ------------------ | --------------------- | -------------------- | ------------------------ |
| iPhone XR    | 3.68               | 3.27                  | 2.86                 | 0.67                     |
| huawei p30   | 2.41               | 1.75                  | 1.51                 | 0.34                     |

### 基于静态代码的Binding

待测试

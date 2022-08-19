# 其他 JS 后端
### 何为 JS 后端
PuerTS本身并不负责编译或是解释执行Javascript，而是通过引入第三方 JS 引擎来做这件事。

默认情况下，使用的是 v8 引擎。但根据不同的使用场景，同时也允许你改用以下两种 JS 后端。

### QuickJS 后端
QuickJS **不支持调试和JIT**，但是它 **很小**。

某些时候你可能有需要压缩安装包大小的需求。那么你就可以quickjs版本的plugins。

### NodeJS 后端
NodeJS 的详细介绍可以参见[官网](https://nodejs.org/)。它在v8的基础上提供了**文件**、**网络**等等API。

它撑起了 Javascript 强大生态的大半壁江山。有了它你可以更顺畅地使用 npm 带来的各种包。
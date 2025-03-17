# il2cpp优化特性
> 可用版本：>2.0.0

简单地说，il2cpp优化的思路是绕过 PInvoke直接通过il2cpp的接口访问C#，减少跨语言的消耗。最终使得性能表现大幅提升，详见[il2cpp优化特性性能数据](./index.md)

## 开启

* 2.1.1及以下版本默认全平台关闭，要开启该特性需要进入Unity的`Player Settings`，添加Scripting Define Symbols: `PUERTS_IL2CPP_OPTIMIZATION`。
* 2.2.0及以上版本在window、mac、linux、android默认开启，如果需要关闭该特性，需要进入Unity的`Player Settings`，添加Scripting Define Symbols: `PUERTS_DISABLE_IL2CPP_OPTIMIZATION`，在ios和webgl下默认关闭，添加Scripting Define Symbols: `PUERTS_IL2CPP_OPTIMIZATION`。

## 使用步骤

* 如果你期待更高的性能，生成全量胶水代码：点击Unity的`Tools/PuerTS/Generate For xIl2cpp mode (all in one with full wrapper)`。

* 如果你期待更小的代码量，仅生成基于反射的胶水代码：点击Unity的`Tools/PuerTS/Generate For xIl2cpp mode (all in one without wrapper)`。

### FAQ
1. ios构建时报hash_map头找不到。
    Unity构建时，一部分头文件不会自动打包到产物xcode项目里(在2021及以下版本常见)。你可以在`你的Unity.app/Contents/il2cpp/external/`下找到缺失的内容，复制到`iosbuild目录/Libraries/external/`即可
2. ios构建时报 `ReentrantLock is ambigious`
    在2022常见。解决办法：
    
修改/Applications/Unity/Hub/Editor/2022.3.47f1c1/PlaybackEngines/iOSSupport/il2cpp/libil2cpp/il2cpp-config.h （根据你安装的unity的实际路径）

在#pragma once后加入宏定义：
```
#pragma once

#define BASELIB_INLINE_NAMESPACE il2cpp_baselib //this line fix 'ReentrantLock is ambigious'

#include <string.h>
```
分析参见issue: https://github.com/Tencent/puerts/issues/1428
    

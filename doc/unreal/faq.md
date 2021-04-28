# FAQ

## 在V8里头报OOM崩溃

* 原因1：Unreal重载了new，而且处理不符合C++规范：用no-throw方式new一个长度为0的数组，返回了nullptr，标准应该是返回有效值，只有OOM时才返回nullptr，这让遵从规范的V8误以为是OOM了，进而crash（目前只发现window有这问题），解决方式有两个（二选一），原理都是强转切换回系统默认的内存分配器
  - 方案1：程序启动加上参数-ansimalloc，比如window下用vs调试，点击菜单“调试”->“(你项目名)属性”，打开属性页后，转到活动的属性，打开“调试”页，把命令行改为`"$(SolutionDir)$(ProjectName).uproject" -skipcompile  -ansimalloc`
  - 方案2：打开“安装目录\Epic Games\UE_4.24\Engine\Source\Runtime\Core\Public\ProfilingDebugging\UMemoryDefines.h”，把FORCE_ANSI_ALLOCATOR宏改为1
  - 以上方案是否生效的检查：看FJsEnv启动时，是否回打印"new (std::nothrow) int[0] return nullptr"的告警
  
* 原因2：真的OOM了，去定位问题吧（可以试试chrome dev tools的内存快照工具）。
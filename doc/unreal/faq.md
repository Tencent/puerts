# FAQ

## 在V8里头报OOM崩溃

* 原因1：Unreal重载了new，而且处理不符合C++规范：用no-throw方式new一个长度为0的数组，返回了nullptr，标准应该是返回有效值，只有OOM时才返回nullptr，这让遵从规范的V8误以为是OOM了，进而crash（目前只发现window有这问题），解决方式有两个（二选一），原理都是强转切换回系统默认的内存分配器
  - 方案1：程序启动加上参数-ansimalloc，比如window下用vs调试，点击菜单“调试”->“(你项目名)属性”，打开属性页后，转到活动的属性，打开“调试”页，把命令行改为`"$(SolutionDir)$(ProjectName).uproject" -skipcompile  -ansimalloc`
  - 方案2：打开“安装目录\Epic Games\UE_4.24\Engine\Source\Runtime\Core\Public\ProfilingDebugging\UMemoryDefines.h”，把FORCE_ANSI_ALLOCATOR宏改为1
  - 以上方案是否生效的检查：看FJsEnv启动时，是否回打印"new (std::nothrow) int[0] return nullptr"的告警

补充下，官方已经确认了这是UE的bug，而且最新版本puerts在window也规避了这个bug
  
* 原因2：真的OOM了，去定位问题吧（可以试试chrome dev tools的内存快照工具）。


## 自动绑定模式有些扩展函数用不了

这是由于puerts模块启动得比较早，它启动的时候遍历Class遍历不了比它后启动的模块里的扩展函数。
解决办法：你所有模块启动完，调用下如下api就可以让它重新查找扩展函数。

~~~c++
IPuertsModule::Get().InitExtensionMethodsMap();
~~~

## 勾选Wait Debugger选项启动卡住

这个选项就是卡住进程来等待调试器连接，连上了就往下走了。

如果你还没配置好调试器，又不小心选了这个选项，也就没办法进入把这个选项去掉，此时可以关闭进程，打开Config\DefaultPuerts.ini把WaitDebugger改为False。

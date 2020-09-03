## vscode debug指引

* 创建FJsEnv传入调试端口

~~~cpp
//8080是调试端口
GameScript = MakeShared<puerts::FJsEnv>(std::make_unique<puerts::DefaultJSModuleLoader>(TEXT("JavaScript")), std::make_shared<puerts::FDefaultLogger>(), 8080);
~~~

* 阻塞等待调试器链接
  - 调试器通过websocket连接，期间有TCP的握手，websocket握手，建立连接后，调试器和V8还会交换些信息，整个过程大概几百毫秒
  - 在这几百毫秒内执行的脚本将无法断点，如果你想断点这些代码，可以用puerts的阻塞等待调试器连接功能

~~~cpp
GameScript = MakeShared<puerts::FJsEnv>(std::make_unique<puerts::DefaultJSModuleLoader>(TEXT("JavaScript")), std::make_shared<puerts::FDefaultLogger>(), 8080);
GameScript->WaitDebugger();

//...

GameScript->Start("QuickStart", Arguments);
~~~

* vscode下打开setting，搜索auto attach，将Debug>Node:Auto Attach设置为“on”


* 菜单打开“编辑->编辑器偏好设置”页面，在“通用->性能”中把“处于背景中时占用教室CPU”的勾选去掉，否则debug连接会很慢

![throttle cpu](../pic/ue_throttle_cpu.png)

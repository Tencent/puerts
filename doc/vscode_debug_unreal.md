## vscode debug指引

* 创建FJsEnv传入调试端口

~~~cpp
//8080是调试端口
GameScript = MakeShared<puerts::FJsEnv>(std::make_unique<puerts::DefaultJSModuleLoader>(TEXT("JavaScript")), std::make_shared<puerts::FDefaultLogger>(), 8080);
~~~

* 如果希望阻塞等待调试器链接

~~~cpp
GameScript = MakeShared<puerts::FJsEnv>(std::make_unique<puerts::DefaultJSModuleLoader>(TEXT("JavaScript")), std::make_shared<puerts::FDefaultLogger>(), 8080);
GameScript->WaitDebugger();

//...

GameScript->Start("QuickStart", Arguments);
~~~

* vscode下打开setting，搜索auto attach，将Debug>Node:Auto Attach设置为“on”


* 菜单打开“编辑->编辑器偏好设置”页面，在“通用->性能”中把“处于背景中时占用教室CPU”的勾选去掉，否则debug连接会很慢

![throttle cpu](../pic/ue_throttle_cpu.png)

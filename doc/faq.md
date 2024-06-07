# FAQ

## 这文档描述的是UE、Unity通用问题，引擎专用问题分别看相应文档

* [unreal faq](unreal/zhcn/faq.md)
* [unity faq](unity/zhcn/faq.md)

## npm上所有包都可用么？

一个js虚拟机一般不会独立存在，都会依托于某个环境，用于解决特定问题。比如：nodejs是js虚拟机加上编写webserver需要用到的api；浏览器js环境是js虚拟机加上dom操作的api；而puerts是js虚拟机+游戏引擎api导出，并实现了cjs和esm。它们间的js模块不一定通用。

所以一个npm在puerts的可用性可以分为如下几种情况：

* 一个纯js模块仅用了es规范的内容，这种是通用js模块，在各种js环境都可用，自然可以在puerts上使用

* 一个nodejs专用（换句话说调用了nodejs特有的api）的纯js模块，推荐使用nodejs后端的puerts，大多数这种模块都支持（不过ue下手机nodejs禁用了ssl相关特性，用了相关特性的模块在“ue + 手机”下运行不正常），如果你使用的是v8后端或者quickjs后端，你需要自己实现用到的nodejs api。

* 一个带原生扩展的nodejs专用模块，如果你只跑在pc，和上一种“nodejs专用纯js模块”的情况类似。如果你希望跑在移动平台（ios、android），你需要考虑这些原生部分的移植，因为本来移动平台就没官方支持（截至2023/4/21），这些npm模块自然没考虑过。

* 一个浏览器专用（换句话说调用了浏览器特有的api）的纯js模块，你需要实现用到的浏览器api。（ps：使用nodejs后端的puerts，有可能能找到实现这些api的npm扩展）

## vscode 1.60以上版本断点断不上，1.59版本可以断点

需要在launch.json那设置下remoteRoot，设置为JavaScript的输出路径，例子：

~~~json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "attach",
            "name": "Attach",
            "protocol": "inspector",
            "port": 8080,
            "sourceMaps": true,
            "remoteRoot": "${workspaceRoot}../dist"
        }
    ]
}
~~~

## vscode 1.82.x-1.85.x之间的版本不能调试

据说是vscode本身的bug： https://github.com/microsoft/vscode-js-debug/issues/1848#issuecomment-1765152784

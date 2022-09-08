# FAQ

## 这文档描述的是UE、Unity通用问题，引擎专用问题分别看相应文档

* [unreal faq](unreal/zhcn/faq.md)
* [unity faq](unity/zhcn/faq.md)

## npm上所有包都可用么？

一个js虚拟机一般不会独立存在，都会依托于某个环境，用于解决特定问题。比如nodejs是js虚拟机加上编写webserver需要用到的api，浏览器js环境是js虚拟机加上dom操作的api。

如果一个js包仅用了es规范的内容，这些环境下都能跑，但如果用了该环境特有的东西，比如用了node特有的api，就不能直接在浏览器跑，反之亦然。

而puerts是“js脚本后端”+“游戏引擎封装”，其中“js脚本后端”有三种选择：v8，quickjs，nodejs。前两者只是“纯净版js虚拟机”，只包含es规范的实现，如果一个npm包只用了es规范的api，可以直接使用。而nodejs后端的puerts在pc下可以正常使用适用于nodejs的npm包。但手机则不一定，因为带原生实现的包本来就没考虑手机的支持。而且目前nodejs手机版本也裁掉了一些特性。

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

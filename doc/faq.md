# FAQ

## 这文档描述的是UE、Unity通用问题，引擎专用问题分别看相应文档

* [unreal faq](unreal/zhcn/faq.md)
* [unity faq](unity/zhcn/faq.md)

## npm上所有包都可用么？

js虚拟机一般不会独立存在，都会依托于某个环境，用于解决特定问题。比如nodejs是js虚拟机加上编写webserver需要用到的api，浏览器js环境是js虚拟机加上dom操作的api。

如果一个js包仅用了es规范的内容，这些环境下都能跑，但如果用了该环境特有的东西，比如用了node特有的api，就不能直接在浏览器跑，反之亦然。

而puerts是另外一个js环境：js虚拟机+游戏引擎。它和nodejs，浏览器js环境是并列关系，nodejs和浏览器专用的包固然没法在puerts上使用，相反如果你用了puerts特有的api做成一个包提交到npm，同样也没法在nodejs或者浏览器上跑。

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

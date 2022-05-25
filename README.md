![Logo](./doc/pic/puerts_logo.png)

[![license](https://img.shields.io/badge/license-BSD_3_Clause-blue.svg)](https://github.com/Tencent/puerts/blob/master/LICENSE)
[![unreal](https://img.shields.io/badge/unreal-v1.0.0-blue.svg)](doc/unreal/install.md)
[![unity](https://img.shields.io/badge/unity-v1.3.3-blue.svg)](doc/unity/install.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-blue.svg)](https://github.com/Tencent/puerts/pulls)
![CI](https://github.com/Tencent/puerts/workflows/CI/badge.svg)

[(English README Available)](./doc/en/README.md)
## What？

puerts是游戏引擎下的TypeScript编程解决方案

* 提供了一个JavaScript运行时

* 提供通过TypeScript访问宿主引擎的能力（JavaScript层面的绑定以及TypeScript声明生成）

## Why?

* JavaScript生态有众多的库和工具链，结合专业商业引擎的渲染能力，快速打造游戏

* 相比游戏领域常用的lua脚本，TypeScript的静态类型检查有助于编写更健壮，可维护性更好的程序

* 高效：全引擎，全平台支持反射Binding，无需额外（生成代码）步骤即可开发

* 高性能：全引擎，全平台支持静态Binding，兼顾了高性能的场景

## How to Install | 最新版本安装

* click it ->[![unreal](https://img.shields.io/badge/unreal-v1.0.0-blue.svg)](doc/unreal/install.md)

* click it ->[![unity](https://img.shields.io/badge/unity-v1.3.3-blue.svg)](doc/unity/install.md)

### Changelog

* [unreal](doc/unreal/changelog.md)
* [unity](doc/unity/changelog.md)

### Known issues | 已知问题

各发布版本已知的，影响较大的bug及其修复办法

* [unreal](doc/unreal/bugs.md)
* [unity](doc/unity/bugs.md)

## Example | 编程样例

Unity

```typescript
import {UnityEngine} from 'csharp'

UnityEngine.Debug.Log('hello world');
let gameObject = new UnityEngine.GameObject("testobject");
console.log(gameObject.name);
gameObject.transform.position = new UnityEngine.Vector3(1, 2, 3);
```

Unreal

```typescript
import * as UE from 'ue'
import {argv} from 'puerts';
let world = argv.getByName("World") as UE.World;
let actor = world.SpawnActor(UE.MainActor.StaticClass(),
    undefined, UE.ESpawnActorCollisionHandlingMethod.Undefined, undefined, undefined) as UE.MainActor;
console.log(actor.GetName());
console.log(actor.K2_GetActorLocation().ToString());
```

## FAQ | 常见问题

* [general faq](doc/faq.md)
* [unreal faq](doc/unreal/faq.md)
* [unity faq](doc/unity/faq.md)

## Manual | 使用文档

* [unreal手册](doc/unreal/manual.md)
* [unity手册](doc/unity/manual.md)
* [unreal调试](doc/unreal/vscode_debug.md)
* [unity调试](doc/unity/vscode_debug.md)

## Detailed Readme | 详细信息

* [unreal](unreal/README.md)
* [unity](unity/README.md)

## Example | 示例

### Unreal

* [QuickStart.ts](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TsProj/QuickStart.ts) ： 演示TypeScript和UE4引擎互相调用

* [NewContainer.ts](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TsProj/NewContainer.ts) ： 演示容器的创建

* [AsyncTest.ts](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TsProj/AsyncTest.ts) ： 将异步加载蓝图，Delay封装成async/await

* [UsingWidget.ts](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TsProj/UsingWidget.ts) ： UI加载，绑定事件，获取数据的演示

* [UsingMixin.ts](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TsProj/UsingMixin.ts)：演示mixin功能的使用

* [FPS demo](https://github.com/chexiongsheng/puerts_fps_demo) ： 以一个FPS游戏例子演示如何使用Puerts的“继承引擎类功能”，该功能的介绍见[unreal手册](doc/unreal/manual.md)

### Unity

* [01_JsCallCs](https://github.com/chexiongsheng/puerts_unity_demo/tree/master/projects/0_Basic_Demo/Assets/Examples/01_JsCallCs) ： js调用c#

* [02_Require](https://github.com/chexiongsheng/puerts_unity_demo/tree/master/projects/0_Basic_Demo/Assets/Examples/02_Require) ： 加载js文件

* [03_Callback](https://github.com/chexiongsheng/puerts_unity_demo/tree/master/projects/0_Basic_Demo/Assets/Examples/03_Callback) ： 回调基本演示

* [04_JsBehaviour](https://github.com/chexiongsheng/puerts_unity_demo/tree/master/projects/0_Basic_Demo/Assets/Examples/04_JsBehaviour) ： 用js模拟MonoBehaviour

* [05_Typescript](https://github.com/chexiongsheng/puerts_unity_demo/tree/master/projects/0_Basic_Demo/Assets/Examples/05_Typescript) ： 包含了大部分TypeScript和C#互相调用的演示

* [06_UIEvent](https://github.com/chexiongsheng/puerts_unity_demo/tree/master/projects/0_Basic_Demo/Assets/Examples/06_UIEvent) ：UI事件的演示

## Supported Engine | 引擎

* unreal engine 4.22 ~ latest

* unity 5 ~ latest

## Supported Platform | 平台

* iOS，Android，Windows，Macos

* 任意.net环境 | Any .net project


## Ask for help | 技术支持

[Github Discussion](https://github.com/Tencent/puerts/discussions)

QQ群：942696334

UE4专属群：689643903

## 开发博客
[知乎专栏](https://www.zhihu.com/column/c_1355534112468402176)

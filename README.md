![Logo](./pic/puerts_logo.png)

[![license](http://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Tencent/puerts/blob/master/LICENSE)
[![release](https://img.shields.io/badge/release-v1.0.0-blue.svg)](https://github.com/Tencent/puerts/releases)
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

## 安装
<!-- 方法1. 下载项目 -->
* git clone https://github.com/Tencent/puerts.git

* 拷贝插件到您项目

    - unreal engine
    
        + 拷贝puerts/unreal下的Puerts目录到您项目的Plugins目录下，可以参考[unreal demo](https://github.com/chexiongsheng/puerts_unreal_demo)
    
    - unity
    
        + 拷贝puerts/unity/Assets下的所有内容到您项目的Assets目录下，可以参考[unity demo](https://github.com/chexiongsheng/puerts_unity_demo)
        
        + Plugins要单独下载[releases](https://github.com/Tencent/puerts/releases)，或者自行编译

<!-- 方法2. 通过npm快速安装

1. 已经安装好Node.js后，执行以下命令下载安装器

```
npm i -g @puerts/cli
```

2. 随后，你可以在unreal项目根目录(包含*.uproject文件)或是unity项目根目录(包含Assets目录)执行以下命令安装puerts

```
puerts init
``` -->

## 编程样例

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

## 调试

* [unreal](doc/unreal/vscode_debug.md)
* [unity](doc/unity/vscode_debug.md)

## 常见问题

* [general faq](doc/faq.md)
* [unreal faq](doc/unreal/faq.md)
* [unity faq](doc/unity/faq.md)

## 使用文档

* [unreal手册](doc/unreal/manual.md)
* [unity手册](doc/unity/manual.md)
* [unreal下脚本和引擎交互](doc/unreal/interact_with_uclass.md)
* [纯c++api的支持](doc/unreal/template_binding.md)

## 支持的引擎，平台

### 引擎

* unreal engine 4.22 ~ 最新版本

* unity 5 ~ 最新版本

### 平台

* iOS，Android，Windows，Macos

* 任意.net环境

## 详细信息

* [unreal](unreal/README.md)
* [unity](unity/README.md)

## 示例

### Unreal继承引擎类模式

* [FPS demo](https://github.com/chexiongsheng/puerts_fps_demo) ： 以一个FPS游戏例子演示如何使用Puerts的继承引擎类模式

### Unreal自创建虚拟机模式

* [QuickStart.ts](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TsProj/QuickStart.ts) ： 演示TypeScript和UE4引擎互相调用

* [NewContainer.ts](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TsProj/NewContainer.ts) ： 演示容器的创建

* [AsyncTest.ts](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TsProj/AsyncTest.ts) ： 将异步加载蓝图，Delay封装成async/await

* [UsingWidget.ts](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TsProj/UsingWidget.ts) ： UI加载，绑定事件，获取数据的演示

### Unity

* [01_JsCallCs](https://github.com/chexiongsheng/puerts_unity_demo/tree/master/Assets/Examples/01_JsCallCs) ： js调用c#

* [02_Require](https://github.com/chexiongsheng/puerts_unity_demo/tree/master/Assets/Examples/02_Require) ： 加载js文件

* [03_Callback](https://github.com/chexiongsheng/puerts_unity_demo/tree/master/Assets/Examples/03_Callback) ： 回调基本演示

* [04_JsBehaviour](https://github.com/chexiongsheng/puerts_unity_demo/tree/master/Assets/Examples/04_JsBehaviour) ： 用js模拟MonoBehaviour

* [05_Typescript](https://github.com/chexiongsheng/puerts_unity_demo/tree/master/Assets/Examples/05_Typescript) ： 包含了大部分TypeScript和C#互相调用的演示

* [06_UIEvent](https://github.com/chexiongsheng/puerts_unity_demo/tree/master/Assets/Examples/06_UIEvent) ：UI事件的演示

## 技术支持

QQ群：942696334

UE4专属群：689643903

## 开发博客
[知乎专栏](https://www.zhihu.com/column/c_1355534112468402176)
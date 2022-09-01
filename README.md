![Logo](./doc/pic/puerts_logo.png)

[![license](https://img.shields.io/badge/license-BSD_3_Clause-blue.svg)](https://github.com/Tencent/puerts/blob/master/LICENSE)
[![unreal](https://img.shields.io/badge/unreal-v1.0.1-blue.svg)](https://github.com/Tencent/puerts/releases/tag/Unreal_v1.0.1)
[![unity](https://img.shields.io/badge/unity-v1.3.8-blue.svg)](doc/unity/zhcn/install.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-blue.svg)](https://github.com/Tencent/puerts/pulls)
![CI](https://github.com/Tencent/puerts/workflows/CI/badge.svg)

## What？
 
PuerTS is a TypeScript programming solution within game engines. | PuerTS是游戏引擎下的TypeScript编程解决方案
* provides a JavaScript Runtime | 提供了一个JavaScript运行时

* allows TypeScript to access the host engine by including: | 提供通过TypeScript访问宿主引擎的能力，包括:
  * module-binding on the JavaScript level | JavaScript层面的绑定
  * TypeScript declarations generation | TypeScript声明文件生成


## Why?

* Facililates game building processes by combining JavaScript ecosystem with the rendering power of professional game engines
* JavaScript生态有众多的库和工具链，结合专业商业引擎的渲染能力，快速打造游戏

> 

* In contrast to lua script, TypeScript supports static type checking, which significantly improves code robustness and maintainability.
* 相比游戏领域常用的lua脚本，TypeScript的静态类型检查有助于编写更健壮，可维护性更好的程序

> 

* High efficiency: supports reflection binding throughout the platform (engine) - no extra steps (code generation) needed for development.
* 高效：全引擎，全平台支持反射Binding，无需额外（生成代码）步骤即可开发

> 

* High performance：supports static binding throughout the platform (engine) - takes care of complex scenes
* 高性能：全引擎，全平台支持静态Binding，兼顾了高性能的场景

> 

* Talented WebGL Support: huge advantage in performance and dev efficiency compare to Lua.
* WebGL平台下的天生优势：相比Lua脚本在WebGL版本的表现，在性能和效率上都有极大提升。

---

## Documentation | 官方文档

* [Doc for Unity](https://puerts.github.io/unity/en/readme) | [Unity版文档](https://puerts.github.io/unity/zhcn/readme)
* [Doc for UE](https://puerts.github.io/unreal/en/readme) | [UE版文档](https://puerts.github.io/unreal/zhcn/readme)

## FAQ | 常见问题

* [general faq](doc/faq.md)
* [unreal faq](doc/unreal/zhcn/faq.md)
* [unity faq](doc/unity/zhcn/faq.md)

---

## How to Install | 最新版本安装

* [unreal](doc/unreal/zhcn/install.md)
* [unity](doc/unity/en/install.md)

### Changelog

* [unreal](doc/unreal/zhcn/changelog.md)
* [unity](doc/unity/zhcn/changelog.md)

### Known issues | 已知问题与解决办法

* [unreal](doc/unreal/zhcn/bugs.md)
* [unity](doc/unity/zhcn/bugs.md)
<<<<<<< HEAD
=======

---

## Code Sample | 编程样例

> Unity

```typescript
import {UnityEngine} from 'csharp'

UnityEngine.Debug.Log('hello world');
let gameObject = new UnityEngine.GameObject("testobject");
console.log(gameObject.name);
gameObject.transform.position = new UnityEngine.Vector3(1, 2, 3);
```

> Unreal

```typescript
import * as UE from 'ue'
import {argv} from 'puerts';
let world = argv.getByName("World") as UE.World;
let actor = world.SpawnActor(UE.MainActor.StaticClass(),
    undefined, UE.ESpawnActorCollisionHandlingMethod.Undefined, undefined, undefined) as UE.MainActor;
console.log(actor.GetName());
console.log(actor.K2_GetActorLocation().ToString());
```

## Manual | 参考文档

> Unreal
* [Unreal Readme](unreal/README.md)
* [Unreal Manual](doc/unreal/zhcn/manual.md)
* [Unreal debugging](doc/unreal/zhcn/vscode_debug.md)
* [TypeScript and unreal engine interaction](doc/unreal/zhcn/interact_with_uclass.md)
* [Template-based static binding](doc/unreal/zhcn/template_binding.md)
> Unity
* [Unity Manual](doc/unity/zhcn/manual.md)
* [Unity debugging](doc/unity/zhcn/other/debugging.md)
* [More Framework for Unity](https://github.com/chexiongsheng/puerts_unity_demo#more-example--%E6%9B%B4%E5%A4%9A%E7%9A%84%E7%A4%BA%E4%BE%8B%E6%88%96%E8%80%85%E6%95%99%E7%A8%8B)

## Sample Projects | 示例项目

> Unreal

* [QuickStart.ts](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TsProj/QuickStart.ts) ： 演示TypeScript和UE4引擎互相调用

* [NewContainer.ts](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TsProj/NewContainer.ts) ： 演示容器的创建

* [AsyncTest.ts](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TsProj/AsyncTest.ts) ： 将异步加载蓝图，Delay封装成async/await

* [UsingWidget.ts](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TsProj/UsingWidget.ts) ： UI加载，绑定事件，获取数据的演示

* [UsingMixin.ts](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TsProj/UsingMixin.ts)：演示mixin功能的使用

* [FPS demo](https://github.com/chexiongsheng/puerts_fps_demo) ： 以一个FPS游戏例子演示如何使用Puerts的“继承引擎类功能”，该功能的介绍见[unreal手册](doc/unreal/zhcn/manual.md)

> Unity

* [Basic_Demo](https://github.com/chexiongsheng/puerts_unity_demo/tree/master/projects/0_Basic_Demo)

  * [01_JsCallCs](https://github.com/chexiongsheng/puerts_unity_demo/tree/master/projects/0_Basic_Demo/Assets/Examples/01_JsCallCs) ： js调用c#

  * [02_Require](https://github.com/chexiongsheng/puerts_unity_demo/tree/master/projects/0_Basic_Demo/Assets/Examples/02_Require) ： 加载js文件

  * [03_Callback](https://github.com/chexiongsheng/puerts_unity_demo/tree/master/projects/0_Basic_Demo/Assets/Examples/03_Callback) ： 回调基本演示

  * [04_JsBehaviour](https://github.com/chexiongsheng/puerts_unity_demo/tree/master/projects/0_Basic_Demo/Assets/Examples/04_JsBehaviour) ： 用js模拟MonoBehaviour

  * [05_Typescript](https://github.com/chexiongsheng/puerts_unity_demo/tree/master/projects/0_Basic_Demo/Assets/Examples/05_Typescript) ： 包含了大部分TypeScript和C#互相调用的演示

  * [06_UIEvent](https://github.com/chexiongsheng/puerts_unity_demo/tree/master/projects/0_Basic_Demo/Assets/Examples/06_UIEvent) ：UI事件的演示

* [Start_Template](https://github.com/chexiongsheng/puerts_unity_demo/tree/master/projects/1_Start_Template)

## FAQ | 常见问题

* [general faq](doc/faq.md)
* [unreal faq](doc/unreal/zhcn/faq.md)
* [unity faq](doc/unity/zhcn/faq.md)
>>>>>>> c710d19b (update doc)

---

## Avaliable on these Engine | 引擎

* unreal engine 4.22 ~ latest

* unity 5 ~ latest

## Available on these Platform | 平台

* iOS，Android，Windows，Macos

* 任意.net环境 | Any .net project


## Ask for help | 技术支持

[Github Discussion](https://github.com/Tencent/puerts/discussions)

QQ群：942696334

UE4专属群：689643903

## 开发博客
[知乎专栏](https://www.zhihu.com/column/c_1355534112468402176)

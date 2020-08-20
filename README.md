# puerts

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

* git clone https://github.com/Tencent/puerts.git

* 拷贝插件到您项目

    - unreal engine: 拷贝puerts/unreal下的Puerts目录到您项目的Plugins目录下，可以参考[unreal demo](https://github.com/chexiongsheng/puerts_unreal_demo)
    
    - unity： 拷贝puerts/unity/Assets下的所有内容到您项目的Assets目录下，可以参考[unity demo](https://github.com/chexiongsheng/puerts_unity_demo)

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

* [unreal](doc/vscode_debug_unreal.md)
* [unity](doc/vscode_debug_unity.md)

## 支持的引擎，平台

### 引擎

* unreal engine 4.22 ~ 4.25

* unity 5 ~ 2019

### 平台

* iOS，Android，Windows，Macos

* 任意.net环境

## 详细信息

* [unreal](unreal/README.md)
* [unity](unity/README.md)

## 示例

* [unreal demo](https://github.com/chexiongsheng/puerts_unreal_demo)

* [unity demo](https://github.com/chexiongsheng/puerts_unity_demo)

## 技术支持

QQ群：942696334
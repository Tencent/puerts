![Logo](../../doc/pic/puerts_logo.png)

[![license](http://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Tencent/puerts/blob/master/LICENSE)
[![release](https://img.shields.io/badge/release-v1.0.0-blue.svg)](https://github.com/Tencent/puerts/releases)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-blue.svg)](https://github.com/Tencent/puerts/pulls)
![CI](https://github.com/Tencent/puerts/workflows/CI/badge.svg)

## What？

puerts is a TypeScript programming solution within game engines.

* provides a JavaScript Runtime

* allows TypeScript to access the host engine（module-binding on the JavaScript level and generating TypeScript declarations）

## Why?

* Facililates game building processes by combining JavaScript packages and toolchains with the rendering power of professional game engines

* In contrast to lua script, TypeScript supports static type checking, which significantly improves code robustness and maintainability.

* High efficiency: supports reflection binding throughout the platform (engine) - no extra steps (code generation) needes for development.

* High performance：supports static binding throughout the platform (engine) - takes care of complex scenes

## Installation

* git clone https://github.com/Tencent/puerts.git

* Copying the plugin to your project

    - unreal engine
    
        + copy `Puerts` under `puerts/unreal` to your project's `Plugins` folder - please refer to [unreal demo](https://github.com/chexiongsheng/puerts_unreal_demo)
    
    - unity
    
        + copy all contents under `puerts/unity/Assets` to your project's `Assets` folder - please refer to [unity demo](https://github.com/chexiongsheng/puerts_unity_demo)
        
        + Plugins needs to be either downloaded from [releases](https://github.com/Tencent/puerts/releases) or complied by yourself.

## Code samples

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

## Debugging

* [unreal](unreal/vscode_debug.md)
* [unity](../unity/vscode_debug.md)

## FAQ

* [unreal faq](unreal/faq.md)
* [unity faq](../unity/faq.md)

## Manual

* [unity](../unity/manual.md)
* [unreal](unreal/manual.md)
* [TypeScript and unreal engine interaction](unreal/interact_with_uclass.md)
* [Template-based static binding](unreal/template_binding.md)

## Available on

### Game engines

* unreal engine 4.22 ~ latest version

* unity 5 ~ latest version

### Programming platforms

* iOS，Android，Windows，Macos

* any .net environment

## Details

* [unreal](../../unreal/README.md)
* [unity](../../unity/README.md)

## Sample projects

* [unreal demo](https://github.com/chexiongsheng/puerts_unreal_demo)

* [unity demo](https://github.com/chexiongsheng/puerts_unity_demo)

## Technical Support

QQ group：942696334

UE4-only QQ group：689643903

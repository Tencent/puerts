![Logo](https://raw.githubusercontent.com/Tencent/puerts/refs/heads/master/doc/pic/puerts_logo.png)

[![license](https://img.shields.io/badge/license-BSD_3_Clause-blue.svg)](https://github.com/Tencent/puerts/blob/master/LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-blue.svg)](https://github.com/Tencent/puerts/pulls)
![Unity_Test](https://github.com/Tencent/puerts/workflows/unity%20unittest/badge.svg)

## Unreal Releases

[![unreal](https://img.shields.io/badge/unreal-v1.0.9-blue.svg)](https://github.com/Tencent/puerts/releases/tag/Unreal_v1.0.9)

## Unity Releases

[![unity](https://img.shields.io/badge/unity-v3.0.0(latest)-blue.svg)](https://github.com/Tencent/puerts/releases/tag/Unity_v3.0.0)
[![unity](https://img.shields.io/badge/unity-v2.2.3(lts)-blue.svg)](https://github.com/Tencent/puerts/releases/tag/Unity_v2.2.3)

## Nuget Releases

[![Puerts.V8.Complete](https://img.shields.io/nuget/v/Puerts.V8.Complete.svg?label=Puerts.V8)](https://www.nuget.org/packages/Puerts.V8.Complete)
[![Puerts.NodeJS.Complete](https://img.shields.io/nuget/v/Puerts.NodeJS.Complete.svg?label=Puerts.NodeJS)](https://www.nuget.org/packages/Puerts.NodeJS.Complete)
[![Puerts.QuickJS.Complete](https://img.shields.io/nuget/v/Puerts.QuickJS.Complete.svg?label=Puerts.QuickJS)](https://www.nuget.org/packages/Puerts.QuickJS.Complete)
[![Puerts.Lua.Complete](https://img.shields.io/nuget/v/Puerts.Lua.Complete.svg?label=Puerts.Lua)](https://www.nuget.org/packages/Puerts.Lua.Complete)
[![Puerts.Python.Complete](https://img.shields.io/nuget/v/Puerts.Python.Complete.svg?label=Puerts.Python)](https://www.nuget.org/packages/Puerts.Python.Complete)

[跳转中文](#what---普洱ts是什么)

## WHAT is PuerTS?
 
`PuerTS` is a **multi-language scripting solution** for Unity/Unreal/DotNet.

* 🌐 **Multi-Language Support (Unity 3.0 New!)**: JavaScript/TypeScript, **Lua**, and **Python** — use the language your team is most productive in, or even mix them in one project. *(Unreal currently supports JavaScript/TypeScript only.)*
* 🚀 Provides high-performance script runtimes with seamless C#/C++ interop.
* 📝 TypeScript declaration generation for type-safe access to host engine APIs.

## WHY should I use PuerTS?

* **Choose your language (Unity)**: PuerTS 3.0 introduces a unified `ScriptEnv` architecture — write game logic in TypeScript, Lua, or Python with a consistent C# bridging API. No more one-size-fits-all.
* **Massive ecosystem access**: leverage npm, LuaRocks, or PyPI packages alongside professional game engines to accelerate development.
* **Type safety when you want it**: TypeScript's static type checking significantly improves code robustness, while Lua and Python offer rapid prototyping flexibility.
* **High efficiency**: full-engine, cross-platform reflection calls — zero boilerplate for C++/C# interop.
* **High performance**: static wrapper generation for performance-critical paths, across all supported languages.
* **Talented WebGL Support**: massive advantage in performance and dev efficiency, even faster than pure C# in some cases.

## Quick Start (Unity)

All three languages share the same `ScriptEnv` API — just swap the `Backend`:

**JavaScript / TypeScript**

```csharp
using Puerts;
using UnityEngine;

void Start() {
    var env = new ScriptEnv(new BackendV8());
    env.Eval(@"
        const Vector3 = CS.UnityEngine.Vector3;
        const Debug = CS.UnityEngine.Debug;
        let pos = new Vector3(1, 2, 3);
        Debug.Log('Hello from JS! pos = ' + pos);
    ");
    env.Dispose();
}
```

**Lua**

```csharp
using Puerts;
using UnityEngine;

void Start() {
    var env = new ScriptEnv(new BackendLua());
    env.Eval(@"
        local CS = require('csharp')
        local Vector3 = CS.UnityEngine.Vector3
        local Debug = CS.UnityEngine.Debug
        local pos = Vector3(1, 2, 3)
        Debug.Log('Hello from Lua! pos = ' .. pos:ToString())
    ");
    env.Dispose();
}
```

**Python**

```csharp
using Puerts;
using UnityEngine;

void Start() {
    var env = new ScriptEnv(new BackendPython());
    env.Eval(@"
exec('''
import UnityEngine.Vector3 as Vector3
import UnityEngine.Debug as Debug
pos = Vector3(1.0, 2.0, 3.0)
Debug.Log('Hello from Python! pos = ' + pos.ToString())
''')
");
    env.Dispose();
}
```

> 💡 Three languages, one API surface. Each example creates a `Vector3`, then calls `Debug.Log` — real C# interop in just a few lines.

## HOW can I start to use PuerTS
[Documentation](https://puerts.github.io/en)

---

## FAQ

* [general faq](doc/faq.md)
* [unreal faq](doc/unreal/en/faq.md)
* [unity faq](doc/unity/en/faq.md)

## How to Install

* [unreal](doc/unreal/en/install.md)
* [unity](doc/unity/en/install.md)

### Changelog

* [unreal](doc/unreal/en/changelog.md)
* [unity](unity/Assets/core/upm/changelog.md)

### Known issues

* [unreal](doc/unreal/en/bugs.md)
* [unity](doc/unity/en/bugs.md)

---

## Select Script Backend

PuerTS supports multiple script backends. For **JavaScript/TypeScript**, choose from V8, QuickJS, or Node.js. PuerTS 3.0 also adds **Lua** and **Python** as first-class backends.

### JavaScript Backends

* V8 (default): Generally excellent performance, moderate code size, only includes the implementation of the ECMAScript specification, does not include Node.js API or browser API.

* QuickJS: Performance is not as good as V8, does not support debugging, but has a small code size, suitable for scenarios where code size is critical.

* Node.js: Supports Node.js API (OpenSSL-related APIs are not supported on Unreal Engine's mobile platform), but has a larger code size.

| JS Backend | Node API | Performance | Code Size | Debugging | Notes |
| --- | --- | --- | --- | --- | --- |
| V8 | ❌ | `*****` | `***` | ✔️ | |
| QuickJS | ❌ | `**` | `*` | ❌ | |
| Node.js | ✔️ | `*****` | `*****` | ✔️ | OpenSSL may be disabled |

### Additional Language Backends (Unity 3.0 New!)

> **Note**: Lua and Python backends are currently available for **Unity only**. Unreal Engine still supports JavaScript/TypeScript exclusively.

| Backend | Language | Performance | Platform Support | Notes |
| --- | --- | --- | --- | --- |
| Lua | Lua 5.4 | `*****` | All platforms | Ideal for teams already using Lua |
| Python | CPython | `***` | Desktop only | Great for AI/ML integration & tooling |

## Avaliable on these Engine

* unreal engine 4.22 ~ latest

* unity 5 ~ latest

* Any .net project

## Available on these Platform

* iOS
* Android
* OpenHarmony
* Windows
* Macos
* WebGL(H5)


## Ask for help

[Github Discussion](https://github.com/Tencent/puerts/discussions)

------

## WHAT - 普洱TS是什么?
PuerTS 是 Unity/Unreal/Dotnet 下的**多语言脚本编程解决方案**。

* 🌐 **多语言支持（Unity 3.0 新特性！）**：JavaScript/TypeScript、**Lua**、**Python** 三大语言开箱即用——团队擅长什么就用什么，同一个项目里甚至可以混用。*（Unreal 目前仅支持 JavaScript/TypeScript。）*
* 🚀 提供高性能脚本运行时，与 C#/C++ 无缝互操作。
* 📝 提供 TypeScript 声明文件生成能力，类型安全地访问宿主引擎 API。


## WHY - 为什么我该用普洱TS?

* **自由选择语言（Unity）**：PuerTS 3.0 引入了统一的 `ScriptEnv` 架构——用 TypeScript、Lua 或 Python 编写游戏逻辑，享受一致的 C# 桥接 API，不再被某一种脚本语言绑定。
* **海量生态随手可用**：npm、LuaRocks、PyPI 的海量包 + 专业游戏引擎的渲染能力，加速开发效率。
* **按需选择类型安全**：TypeScript 的静态类型检查显著提升代码健壮性；Lua 和 Python 则提供快速原型验证的灵活性。
* **高效**：全引擎，全平台支持反射调用，无需额外步骤即可与宿主 C++/C# 通信。
* **高性能**：全引擎，全平台支持生成静态调用桥梁，所有支持的语言都兼顾了高性能场景。
* **WebGL 平台天生优势**：相比其他脚本方案，PuerTS 在 WebGL 平台性能和效率上都有极大提升，极限情况甚至比纯 C# 更快。

## 快速上手（Unity）

三种语言共享同一套 `ScriptEnv` API，只需切换 `Backend`：

**JavaScript / TypeScript**

```csharp
using Puerts;
using UnityEngine;

void Start() {
    var env = new ScriptEnv(new BackendV8());
    env.Eval(@"
        const Vector3 = CS.UnityEngine.Vector3;
        const Debug = CS.UnityEngine.Debug;
        let pos = new Vector3(1, 2, 3);
        Debug.Log('Hello from JS! pos = ' + pos);
    ");
    env.Dispose();
}
```

**Lua**

```csharp
using Puerts;
using UnityEngine;

void Start() {
    var env = new ScriptEnv(new BackendLua());
    env.Eval(@"
        local CS = require('csharp')
        local Vector3 = CS.UnityEngine.Vector3
        local Debug = CS.UnityEngine.Debug
        local pos = Vector3(1, 2, 3)
        Debug.Log('Hello from Lua! pos = ' .. pos:ToString())
    ");
    env.Dispose();
}
```

**Python**

```csharp
using Puerts;
using UnityEngine;

void Start() {
    var env = new ScriptEnv(new BackendPython());
    env.Eval(@"
exec('''
import UnityEngine.Vector3 as Vector3
import UnityEngine.Debug as Debug
pos = Vector3(1.0, 2.0, 3.0)
Debug.Log('Hello from Python! pos = ' + pos.ToString())
''')
");
    env.Dispose();
}
```

> 💡 三种语言，同一套 API。每个示例都创建了一个 `Vector3`，然后调用 `Debug.Log` ——短短几行代码即可实现真正的 C# 互操作。

## HOW - 我该怎么开始

* [官方文档](https://puerts.github.io)

---


## 常见问题

* [通用 faq](doc/faq.md)
* [unreal faq](doc/unreal/zhcn/faq.md)
* [unity faq](doc/unity/zhcn/faq.md)

## 最新版本安装

* [unreal](doc/unreal/zhcn/install.md)
* [unity](doc/unity/zhcn/install.md)

### 改动日志

* [unreal](doc/unreal/zhcn/changelog.md)
* [unity](unity/Assets/core/upm/changelog-hans.md)

### 已知问题与解决办法

* [unreal](doc/unreal/zhcn/bugs.md)
* [unity](doc/unity/zhcn/bugs.md)

---

## 脚本后端选择

PuerTS 支持多种脚本后端。**JavaScript/TypeScript** 可选 V8、QuickJS、Node.js；3.0 新增 **Lua** 和 **Python** 作为一等公民后端。

### JavaScript 后端

* V8（默认）：综合比较优秀，高性能，代码体积适中，仅包含 ECMAScript 规范的实现，不包含 Node.js API、浏览器 API。

* QuickJS：性能不如 V8，不支持调试，但代码体积小，适用于包体大小敏感的场景。

* Node.js：支持 Node.js API（Unreal Engine 移动平台下不支持 OpenSSL 相关 API），代码体积较大。

| JS 后端 | Node API | 性能 | 代码体积 | 调试 | 补充 |
| --- | --- | --- | --- | --- | --- |
| V8 | ❌ | `*****` | `***` | ✔️ | |
| QuickJS | ❌ | `**` | `*` | ❌ | |
| Node.js | ✔️ | `*****` | `*****` | ✔️ | OpenSSL 可能被禁用 |

### 新增语言后端（Unity 3.0 新特性！）

> **注意**：Lua 和 Python 后端目前**仅在 Unity 版本**中可用，Unreal Engine 仍仅支持 JavaScript/TypeScript。

| 后端 | 语言 | 性能 | 平台支持 | 补充 |
| --- | --- | --- | --- | --- |
| Lua | Lua 5.4 | `*****` | 全平台 | 适合已有 Lua 技术栈的团队 |
| Python | CPython | `***` | 桌面平台 | 适合 AI/ML 集成与工具链开发 |

## 可用引擎

* unreal engine 4.22 ~ latest

* unity 5 ~ latest

* 任意.net环境

## 可用平台

* iOS
* Android
* 鸿蒙（OpenHarmony）
* Windows
* Macos
* WebGL(H5/小游戏)


## 技术支持

[Github Discussion](https://github.com/Tencent/puerts/discussions)

QQ群：942696334

UE4专属群：689643903

## 开发博客
[知乎专栏](https://www.zhihu.com/column/c_1355534112468402176)

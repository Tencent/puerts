![Logo](https://raw.githubusercontent.com/Tencent/puerts/refs/heads/master/doc/pic/puerts_logo.png)

[![license](https://img.shields.io/badge/license-BSD_3_Clause-blue.svg)](https://github.com/Tencent/puerts/blob/master/LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-blue.svg)](https://github.com/Tencent/puerts/pulls)
![Unity_Test](https://github.com/Tencent/puerts/actions/workflows/unity_unittest.yml/badge.svg?branch=master)
![Unreal_CI](https://github.com/Tencent/puerts/actions/workflows/unreal_ci.yml/badge.svg?branch=master)
![Nuget_Build](https://github.com/Tencent/puerts/actions/workflows/build_nuget.yml/badge.svg?branch=master)

## Unreal Releases

[![unreal](https://img.shields.io/badge/unreal-v1.0.9-blue.svg)](https://github.com/Tencent/puerts/releases/tag/Unreal_v1.0.9)

## Unity Releases

[![unity](https://img.shields.io/badge/unity-v3.0.2(latest)-blue.svg)](https://github.com/Tencent/puerts/releases/tag/Unity_v3.0.2)
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

## Puerts.AI (Unity Only)

Built on top of PuerTS, **Puerts.AI** brings AI capabilities directly into Unity — both in the Editor and at game runtime.

### Unity Editor Assistant

Puerts.AI includes a ready-to-use **Unity Editor Assistant** that lets you control the Unity Editor with natural language. For example:

- *"Build a medieval castle scene using basic meshes"* — AI creates GameObjects, adjusts Transforms, assigns materials
- *"Analyze puerts-related logs"* — AI filters and summarizes logs intelligently
- *"Check for missing scripts in the current scene"* — AI traverses all GameObjects and reports issues

**Any C# API is callable** — the AI generates scripts that run in the PuerTS environment with full access to `UnityEngine.*` and `UnityEditor.*`.

The Editor Assistant comes in two versions:

| | Agent Version (Built-in) | MCP Version (External) |
|:---|:---|:---|
| **How it works** | Chat directly inside a Unity Editor window | Connect from Cursor, Windsurf, Claude Desktop, or any MCP-compatible AI tool |
| **Speed** | ⚡ Faster — no network round-trips | Communicates via HTTP/SSE |
| **Best for** | Scene building, inspections, quick prototyping | Vibe coding workflows — AI edits code while controlling Unity to verify results |

**What makes Puerts MCP different from other Unity MCP solutions?**

- **No separate process** — the MCP server runs directly inside the Unity process, no extra services to launch
- **Single tool, on-demand builtins** — instead of registering dozens of tools upfront, it exposes only one tool; builtin modules are loaded on demand, saving context tokens while remaining equally powerful
- **Extensible via builtins & skills** — add new capabilities by dropping files into the resource directory, no code changes needed

### Puerts.Agent Framework

The Editor Assistant above is built with **Puerts.Agent** — an open, extensible LLM Agent framework. But it's not just for the editor — **agents can also run in game runtime**, opening up gameplay possibilities:

- 🎮 **Smart NPC Demo** — Each NPC has its own LLM Agent instance and personality-driven system-prompt. NPCs generate truly dynamic dialogue based on player behavior and game state, sense their surroundings via C# APIs, and form personalized interactions through conversation memory. ([SmartNPCDemo](https://github.com/chexiongsheng/SmartNPCDemo))
- 🧩 **Maze Runner Demo** — An AI that autonomously navigates a 3D maze by taking screenshots to observe the environment, reasoning about viable paths, executing movement commands, and verifying results — all powered by just two builtin modules and a system-prompt.([MazeRunnerDemo](https://github.com/chexiongsheng/MazeRunnerDemo))

Build your own agent by creating a simple resource directory:

```
Resources/my-agent/
├── system-prompt.md.txt      # Who the AI is and how it behaves
├── skills/                   # Domain knowledge documents (loaded on demand)
└── builtins/                 # Executable helper modules
```

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

PuerTS's core code supports all platforms supported by the game engines, but each script backend has its own platform requirements:

|  | Windows | Mac | Linux | Android | iOS | H5/Mini Games |
| --- | --- | --- | --- | --- | --- | --- |
| V8 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ❌ |
| Nodejs | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ❌ |
| Quickjs | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |
| Webgl | ❌ | ❌ | ❌ | ❌ | ❌ | ✔️ |
| Lua | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |
| Python | ✔️ | ✔️ | ✔️ | ❌ | ❌ | ❌ |

Note 1: Only V8, Nodejs, and Quickjs backends are available for Unreal. Unity supports all backends listed above.
Note 2: Although the Webgl backend only supports H5/Mini Games, its scripts run in the native JS VM of the web environment, which typically delivers higher performance (e.g., JIT support in iOS Mini Games). It also provides first-class language benefits such as convenient debugging and profiling.
Note 3: For JavaScript, different platforms can use different JS backends — e.g., V8 for mobile apps and Webgl for H5 — achieving full platform coverage with optimal performance.

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

## Puerts.AI（仅 Unity）

基于 PuerTS 构建的 **Puerts.AI**，将 AI 能力直接带入 Unity——无论是编辑器还是游戏运行时。

### Unity 编辑器助手

Puerts.AI 内置了一个开箱即用的 **Unity 编辑器助手**，让你用自然语言操控 Unity 编辑器。例如：

- *"用基础 Mesh 搭建一座中世纪城堡场景"* —— AI 自动创建 GameObject、调整 Transform、设置材质
- *"分析下 puerts 相关的日志"* —— AI 智能过滤并总结日志
- *"检查当前场景有没有脚本丢失"* —— AI 遍历所有 GameObject 并报告问题

**凡是 C# 能调用的，AI 都能做到**——AI 生成的脚本运行在 PuerTS 环境中，可直接访问 `UnityEngine.*` 和 `UnityEditor.*` 的完整 API。

编辑器助手有两个版本：

| | Agent 版（内置） | MCP 版（外接） |
|:---|:---|:---|
| **使用方式** | 在 Unity 编辑器窗口内直接对话 | 从 Cursor、Windsurf、Claude Desktop 等支持 MCP 协议的 AI 工具接入 |
| **速度** | ⚡ 更快——没有网络往返 | 通过 HTTP/SSE 通信 |
| **适合场景** | 场景搭建、日常检查、快速原型 | Vibe coding 工作流——AI 一边改代码一边操控 Unity 验证效果 |

**Puerts MCP 与市面上其他 Unity MCP 方案有何不同？**

- **无需额外启动进程** —— MCP Server 直接跑在 Unity 进程内，不用另起服务
- **单工具 + 按需加载 builtin** —— 不像其他方案预注册几十个工具，Puerts MCP 只暴露一个工具，builtin 模块按需加载，更省上下文 token，但功能同样强大
- **通过 builtin 和 skill 机制拓展** —— 只需往资源目录里放文件就能添加新能力，无需改代码

### Puerts.Agent 框架

上面的编辑器助手就是用 **Puerts.Agent** 开发的——一个开放、可扩展的 LLM Agent 框架。它不仅能用于编辑器，**还能跑在游戏运行时环境中**，为 gameplay 玩法开发打开全新可能：

- 🎮 **智能 NPC Demo** —— 每个 NPC 拥有独立的 LLM Agent 实例和个性化 system-prompt。NPC 能根据玩家行为和游戏状态生成真正动态的对话，通过 C# 接口感知周围环境，并基于对话历史形成个性化的交互体验。（[SmartNPCDemo](https://github.com/chexiongsheng/SmartNPCDemo)）
- 🧩 **迷宫 AI Demo** —— AI 自主走迷宫的 Demo，展示 Agent 通过截屏观察 + 工具调用来探索 3D 迷宫。AI 截屏观察当前视野、推理可行路径、执行移动指令、再截屏验证结果——完全自主完成，整个实现仅用了两个 builtin 模块和一段 system-prompt。（[MazeRunnerDemo](https://github.com/chexiongsheng/MazeRunnerDemo)）

构建你自己的 Agent，只需创建一个简单的资源目录：

```
Resources/my-agent/
├── system-prompt.md.txt      # 告诉 AI 它是谁、该怎么做
├── skills/                   # 领域知识文档（按需加载）
└── builtins/                 # 可执行的辅助模块
```

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

PuerTS的核心代码支持游戏引擎支持的所有平台，但每个脚本后端有其特有的平台要求：

|  | Window | Mac | Linux | Android | IOS | H5/小游戏|
| --- | --- | --- | --- | --- | --- |--- |
| V8 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ❌ |
| Nodejs  | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ❌ |
| Quickjs  | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |
| Webgl  | ❌ | ❌ | ❌ | ❌ | ❌  | ✔️ |
| Lua   | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |
| Python  | ✔️ | ✔️ | ✔️ | ❌ | ❌ | ❌ |

注1： Unreal下只有V8、Nodejs、Quickjs三种后端，Unity支持以上所有脚本后端
注2： Webgl后端虽然只支持H5/小游戏，但它的脚本是运行在web环境的原生js虚拟机里，通常性能更高（比如在ios小游戏环境里支持jit），也能享受first class语言诸如方便调试，profiler等好处
注3： 对于js，不同平台可以选不同的js脚本后端，比如app选v8，H5平台选Webgl实现全平台支持且性能最优

## 技术支持

[Github Discussion](https://github.com/Tencent/puerts/discussions)

QQ群：942696334

UE4专属群：689643903

## 开发博客
[知乎专栏](https://www.zhihu.com/column/c_1355534112468402176)

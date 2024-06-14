![Logo](./doc/pic/puerts_logo.png)

[![license](https://img.shields.io/badge/license-BSD_3_Clause-blue.svg)](https://github.com/Tencent/puerts/blob/master/LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-blue.svg)](https://github.com/Tencent/puerts/pulls)

[![unreal](https://img.shields.io/badge/unreal-v1.0.6p1-blue.svg)](https://github.com/Tencent/puerts/releases/tag/Unreal_v1.0.6p1)

[![unity](https://img.shields.io/badge/unity(stable)-v2.0.2-blue.svg)](doc/unity/zhcn/install.md)
![Unity_Test](https://github.com/Tencent/puerts/workflows/unity%20unittest/badge.svg)

[跳转中文](#what---普洱ts是什么)

## WHAT is PuerTS (PUER Typescript)?
 
`PuerTS` is a TypeScript programming solution in Unity/Unreal/DotNet.
* provides a JavaScript Runtime.
* allows TypeScript to access the host engine with the help of TypeScript declarations generation.

## WHY should I use PuerTS?

* Facilitates game-building processes by combining JavaScript/Node.js ecosystem and professional game engines
* In contrast to Lua script, TypeScript supports static type checking, which significantly improves code robustness and maintainability.
* High efficiency: supports reflection call throughout the host - no extra steps needed for interop with C++/C#.
* High performance: supports static wrapper generation - handles complex scenes with high-performance demands.
* Talented WebGL Support: massive advantage in performance and dev efficiency compared to Lua, even faster than pure C# in some cases.

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

## Select Script Engine

* V8 (default): Generally excellent performance, moderate code size, only includes the implementation of the ECMAScript specification, does not include Node.js API or browser API.

* QuickJS: Performance is not as good as V8, does not support debugging, but has a small code size, suitable for scenarios where code size is critical.

* Node.js: Supports Node.js API (OpenSSL-related APIs are not supported on Unreal Engine's mobile platform), but has a larger code size.


| Script Engine | Node api | Performance | Code Size | Debugging | Notes |
| --- | --- | --- | --- | --- | --- |
| V8 | ❌ | `*****` | `***` | ✔️ | |
| QuickJS | ❌ | `**` | `*` | ❌ | |
| Node.js | ✔️ | `*****` | `*****` | ✔️ | OpenSSL may be disabled |

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


## Ask for help

[Github Discussion](https://github.com/Tencent/puerts/discussions)

------

## WHAT - 普洱TS是什么?
PuerTS是 Unity/Unreal/Dotnet 下的TypeScript编程解决方案

* 提供了一个JavaScript运行时
* 提供TypeScript声明文件生成能力，易于通过TypeScript访问宿主引擎，


## WHY - 为什么我该用普洱TS?

* JavaScript生态有众多的库和工具链，结合专业商业引擎的渲染能力，快速打造游戏
* 相比游戏领域常用的lua脚本，TypeScript的静态类型检查有助于编写更健壮，可维护性更好的程序
* 高效：全引擎，全平台支持反射调用，无需额外步骤即可与宿主C++/C#通信。
* 高性能：全引擎，全平台支持生成静态调用桥梁，兼顾了高性能的场景。
* WebGL平台下的天生优势：相比Lua脚本在WebGL版本的表现，PuerTS在性能和效率上都有极大提升，目前极限情况甚至比C#更快。

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

## 脚本引擎选择

* v8（默认）：综合比较优秀，高性能，代码体积适中，仅包含ecmascript规范的实现，不包含nodejs api、浏览器 api

* quickjs： 性能不如v8，不支持调试，但代码体积小，适用于代码段大小敏感型业务

* nodejs：支持nodejs api（unreal engine的移动平台下不支持openssl相关api），代码体积较大

| 脚本引擎 | Node api | 性能 | 代码体积 | 调试 | 补充 |
| --- | --- | --- | --- | --- | --- |
| V8 | ❌ | `*****` | `***` | ✔️ | |
| QuickJS | ❌ | `**` | `*` | ❌ | |
| Node.js | ✔️ | `*****` | `*****` | ✔️ | OpenSSL 可能被禁用 |

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


## 技术支持

[Github Discussion](https://github.com/Tencent/puerts/discussions)

QQ群：942696334

UE4专属群：689643903

## 开发博客
[知乎专栏](https://www.zhihu.com/column/c_1355534112468402176)

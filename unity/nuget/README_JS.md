# PuerTS — JavaScript/TypeScript for .NET

[![license](https://img.shields.io/badge/license-BSD_3_Clause-blue.svg)](https://github.com/Tencent/puerts/blob/master/LICENSE)
[![Puerts.V8.Complete](https://img.shields.io/nuget/v/Puerts.V8.Complete.svg?label=Puerts.V8)](https://www.nuget.org/packages/Puerts.V8.Complete)
[![Puerts.NodeJS.Complete](https://img.shields.io/nuget/v/Puerts.NodeJS.Complete.svg?label=Puerts.NodeJS)](https://www.nuget.org/packages/Puerts.NodeJS.Complete)
[![Puerts.QuickJS.Complete](https://img.shields.io/nuget/v/Puerts.QuickJS.Complete.svg?label=Puerts.QuickJS)](https://www.nuget.org/packages/Puerts.QuickJS.Complete)

**PuerTS** is a scripting solution that brings **JavaScript / TypeScript** to your .NET applications. It provides high-performance script runtimes with seamless C# interop.

## Features

- 🚀 **High Performance** — Execute JavaScript/TypeScript with V8, Node.js, or QuickJS engines.
- 🔗 **Seamless C# Interop** — Call any .NET type directly from JavaScript, and invoke JS functions from C#.
- 📝 **TypeScript Support** — Type-safe scripting with full TypeScript declaration generation.
- 🌍 **Cross-Platform** — Supports Windows, macOS, and Linux.

## JavaScript Backend Comparison

| Backend | Node API | Performance | Binary Size | Debugging |
| --- | --- | --- | --- | --- |
| **V8** | ❌ | ★★★★★ | ★★★ | ✔️ |
| **QuickJS** | ❌ | ★★ | ★ | ❌ |
| **Node.js** | ✔️ | ★★★★★ | ★★★★★ | ✔️ |

- **V8** (recommended): Best overall performance, moderate binary size, ECMAScript spec only.
- **QuickJS**: Smallest binary size, suitable for size-sensitive scenarios.
- **Node.js**: Full Node.js API support, largest binary size.

## Installation

Install via NuGet. Choose one of the following **Complete** packages (includes core + native assets for all desktop platforms):

```shell
# V8 backend (recommended)
dotnet add package Puerts.V8.Complete

# Or Node.js backend (with Node API support)
dotnet add package Puerts.NodeJS.Complete

# Or QuickJS backend (minimal size)
dotnet add package Puerts.QuickJS.Complete
```

Or install components separately for finer control:

```shell
# Core library (required)
dotnet add package Puerts.Core

# Backend (choose one)
dotnet add package Puerts.V8
dotnet add package Puerts.NodeJS
dotnet add package Puerts.QuickJS

# Native assets per platform (choose what you need)
dotnet add package Puerts.V8.NativeAssets.Win32
dotnet add package Puerts.V8.NativeAssets.Linux
dotnet add package Puerts.V8.NativeAssets.macOS
```

### Supported Platforms

`.net8.0+`, `.netstandard2.1`

| | Windows (x64) | Linux (x64) | macOS (Universal) |
|---|---|---|---|
| V8 | ✔️ | ✔️ | ✔️ |
| Node.js | ✔️ | ✔️ | ✔️ |
| QuickJS | ✔️ | ✔️ | ✔️ |

> **Note**: AOT compilation is not currently supported.

## Quick Start

Create a `ScriptEnv` with the backend matching your installed package:

| Installed Package | Backend Class |
|---|---|
| `Puerts.V8` / `Puerts.V8.Complete` | `new BackendV8()` |
| `Puerts.NodeJS` / `Puerts.NodeJS.Complete` | `new BackendNodeJS()` |
| `Puerts.QuickJS` / `Puerts.QuickJS.Complete` | `new BackendQuickJS()` |

```csharp
using Puerts;

// Use the backend that matches your installed package:
//   V8      → new BackendV8()
//   Node.js → new BackendNodeJS()
//   QuickJS → new BackendQuickJS()
var env = new ScriptEnv(new BackendV8());

// Execute JavaScript
env.Eval(@"
    const Console = CS.System.Console;
    Console.WriteLine('Hello from JavaScript!');
");

// Eval with return value
int result = env.Eval<int>("1 + 2");
Console.WriteLine($"JS result: {result}"); // output: 3

env.Dispose();
```

### Calling C# from JavaScript

Access any .NET type via the `CS` namespace:

```javascript
// Access C# types
const Console = CS.System.Console;
const DateTime = CS.System.DateTime;
const List = CS.System.Collections.Generic.List$1(CS.System.String);

// Create instances and call methods
let now = DateTime.Now;
Console.WriteLine('Current time: ' + now.ToString());

let list = new List();
list.Add('hello');
list.Add('world');
Console.WriteLine('Count: ' + list.Count);
```

### Calling JavaScript from C#

```csharp
using Puerts;
using System;

// Use the backend that matches your installed package
var env = new ScriptEnv(new BackendV8());

// Get a JS function as a C# delegate
var add = env.Eval<Func<int, int, int>>("(a, b) => a + b");
Console.WriteLine(add(10, 20)); // output: 30

// Get a JS action
var greet = env.Eval<Action<string>>(@"
    (name) => {
        const Console = CS.System.Console;
        Console.WriteLine('Hello, ' + name + '!');
    }
");
greet("PuerTS");

env.Dispose();
```

## Documentation

For full documentation, tutorials and API reference, visit: [https://puerts.github.io/en](https://puerts.github.io/en)

## License

[BSD 3-Clause](https://github.com/Tencent/puerts/blob/master/LICENSE)

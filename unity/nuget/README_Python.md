# PuerTS — Python for .NET

[![license](https://img.shields.io/badge/license-BSD_3_Clause-blue.svg)](https://github.com/Tencent/puerts/blob/master/LICENSE)
[![Puerts.Python.Complete](https://img.shields.io/nuget/v/Puerts.Python.Complete.svg?label=Puerts.Python)](https://www.nuget.org/packages/Puerts.Python.Complete)

**PuerTS** is a scripting solution that brings **Python** (CPython) to your .NET applications. It provides seamless C# interop — using the same unified `ScriptEnv` API as the JavaScript and Lua backends. Great for AI/ML integration, tooling, and rapid prototyping.

## Features

- 🐍 **CPython Powered** — Run real Python code with full CPython runtime.
- 🔗 **Seamless C# Interop** — Call any .NET type directly from Python, and invoke Python functions from C#.
- 🤖 **AI/ML Ready** — Ideal for integrating Python-based AI/ML libraries with .NET applications.
- 🔄 **Unified API** — Same `ScriptEnv` architecture as JS and Lua backends — easy to switch or mix languages.

## Installation

Install via NuGet. The **Complete** package includes core + native assets for all desktop platforms:

```shell
dotnet add package Puerts.Python.Complete
```

Or install components separately for finer control:

```shell
# Core library (required)
dotnet add package Puerts.Core

# Python backend
dotnet add package Puerts.Python

# Native assets per platform (choose what you need)
dotnet add package Puerts.Python.NativeAssets.Win32
dotnet add package Puerts.Python.NativeAssets.Linux
dotnet add package Puerts.Python.NativeAssets.macOS
```

### Supported Platforms

`.net8.0+`, `.netstandard2.1`

| | Windows (x64) | Linux (x64) | macOS (arm64) |
|---|---|---|---|
| Python | ✔️ | ✔️ | ✔️ |

> **Note**: The macOS native assets currently support `osx-arm64` only.
>
> **Note**: AOT compilation is not currently supported.

## Quick Start

```csharp
using Puerts;

var env = new ScriptEnv(new BackendPython());

// Execute Python code
env.Eval("print('Hello from Python!')");

// Eval with return value
int result = env.Eval<int>("1 + 2");
Console.WriteLine($"Python result: {result}"); // output: 3

env.Dispose();
```

### Multi-line Code

Python is indentation-sensitive. For multi-line code blocks, wrap with `exec('''...''')`:

```csharp
var env = new ScriptEnv(new BackendPython());

env.Eval(@"
exec('''
def greet(name):
    print('Hello, ' + name + '!')

greet('PuerTS')
''')
");
// output: Hello, PuerTS!

env.Dispose();
```

### Calling Python from C#

```csharp
using Puerts;
using System;

var env = new ScriptEnv(new BackendPython());

// Get a Python lambda as a C# delegate
var add = env.Eval<Func<int, int, int>>("lambda a, b: a + b");
Console.WriteLine(add(10, 20)); // output: 30

// Define a function via exec, then retrieve it
env.Eval(@"
exec('''
def greet(name):
    print('Hello,' + name + '!')
''')
");
var greet = env.Eval<Action<string>>("greet");
greet("PuerTS"); // output: Hello,PuerTS!

env.Dispose();
```

## Key Differences from JS/Lua

| Feature | JavaScript | Lua | Python |
|---------|-----------|-----|--------|
| Environment creation | `new ScriptEnv(new BackendV8())` | `new ScriptEnv(new BackendLua())` | `new ScriptEnv(new BackendPython())` |
| Console output | `console.log(...)` | `print(...)` | `print(...)` |
| Multi-line code | Write directly | Write directly | Wrap with `exec('''...''')` |
| Accessing C# types | `CS.Namespace.Class` | `require('csharp')` | `import Namespace.Class` |
| Instance method calls | `obj.Method()` | `obj:Method()` | `obj.Method()` |
| Null representation | `null` / `undefined` | `nil` | `None` |

## Documentation

For full documentation, tutorials and API reference, visit: [https://puerts.github.io/en](https://puerts.github.io/en)

## License

[BSD 3-Clause](https://github.com/Tencent/puerts/blob/master/LICENSE)

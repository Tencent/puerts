# PuerTS — Lua for .NET

[![license](https://img.shields.io/badge/license-BSD_3_Clause-blue.svg)](https://github.com/Tencent/puerts/blob/master/LICENSE)
[![Puerts.Lua.Complete](https://img.shields.io/nuget/v/Puerts.Lua.Complete.svg?label=Puerts.Lua)](https://www.nuget.org/packages/Puerts.Lua.Complete)

**PuerTS** is a scripting solution that brings **Lua** to your .NET applications. Built on Lua 5.4, it provides high-performance script execution with seamless C# interop — using the same unified `ScriptEnv` API as the JavaScript and Python backends.

## Features

- 🚀 **High Performance** — Powered by Lua 5.4, one of the fastest embeddable scripting languages.
- 🔗 **Seamless C# Interop** — Call any .NET type directly from Lua, and invoke Lua functions from C#.
- 🌍 **Cross-Platform** — Supports Windows, macOS, and Linux.
- 🔄 **Unified API** — Same `ScriptEnv` architecture as JS and Python backends — easy to switch or mix languages.

## Installation

Install via NuGet. The **Complete** package includes core + native assets for all desktop platforms:

```shell
dotnet add package Puerts.Lua.Complete
```

Or install components separately for finer control:

```shell
# Core library (required)
dotnet add package Puerts.Core

# Lua backend
dotnet add package Puerts.Lua

# Native assets per platform (choose what you need)
dotnet add package Puerts.Lua.NativeAssets.Win32
dotnet add package Puerts.Lua.NativeAssets.Linux
dotnet add package Puerts.Lua.NativeAssets.macOS
```

### Supported Platforms

`.net8.0+`, `.netstandard2.1`

| | Windows (x64) | Linux (x64) | macOS (Universal) |
|---|---|---|---|
| Lua | ✔️ | ✔️ | ✔️ |

> **Note**: AOT compilation is not currently supported.

## Quick Start

```csharp
using Puerts;

var env = new ScriptEnv(new BackendLua());

// Execute Lua code
env.Eval(@"
    local CS = require('csharp')
    local Console = CS.System.Console
    Console.WriteLine('Hello from Lua!')
");

// Eval with return value (Lua requires explicit 'return')
int result = env.Eval<int>("return 1 + 2");
Console.WriteLine($"Lua result: {result}"); // output: 3

env.Dispose();
```

### Calling C# from Lua

Access .NET types via `require('csharp')`:

```lua
local CS = require('csharp')
local Console = CS.System.Console
local DateTime = CS.System.DateTime
local List = CS.System.Collections.Generic.List(CS.System.String)

-- Create instances and call methods
local now = DateTime.Now
Console.WriteLine('Current time: ' .. now:ToString())

local list = List()
list:Add('hello')
list:Add('world')
Console.WriteLine('Count: ' .. tostring(list.Count))
```

> **Note**: In Lua, instance methods use the colon syntax `obj:Method()`, while static methods use the dot syntax `Class.Method()`.

### Calling Lua from C#

```csharp
using Puerts;
using System;

var env = new ScriptEnv(new BackendLua());

// Get a Lua function as a C# delegate
var add = env.Eval<Func<int, int, int>>("return function(a, b) return a + b end");
Console.WriteLine(add(10, 20)); // output: 30

// Get a Lua action
var greet = env.Eval<Action<string>>(@"
    return function(name)
        local CS = require('csharp')
        CS.System.Console.WriteLine('Hello, ' .. name .. '!')
    end
");
greet("PuerTS");

env.Dispose();
```

## Key Differences from JS

| Feature | JavaScript | Lua |
|---------|-----------|-----|
| Environment creation | `new ScriptEnv(new BackendV8())` | `new ScriptEnv(new BackendLua())` |
| Console output | `console.log(...)` | `print(...)` |
| Accessing C# types | `CS.Namespace.Class` | `require('csharp')` to get namespace entry |
| Instance method calls | `obj.Method()` | `obj:Method()` (colon syntax) |
| Null representation | `null` / `undefined` | `nil` |
| Return from Eval | Last expression auto-returned | Explicit `return` required |

## Documentation

For full documentation, tutorials and API reference, visit: [https://puerts.github.io/en](https://puerts.github.io/en)

## License

[BSD 3-Clause](https://github.com/Tencent/puerts/blob/master/LICENSE)

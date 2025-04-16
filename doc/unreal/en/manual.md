# Puerts - Unreal Engine User Manual

In essence, Puerts provides developers with the opportunity to integrate TypeScript into modern game engines such as Unreal Engine.

By employing the following two techniques, Puerts aims to provide a comprehensive development experience and reduce integration-related friction:

1. Puerts imports all reflective APIs by default. In other words, any functionality that can be accessed via Blueprint may also be referenced inside the TypeScript environment.
2. Any non-reflective APIs, such as C++ only functions, can be exposed to TypeScript through manual encapsulation.

Puerts does not re-define the engine. It simply defines a set of methods for TypeScript and the game engine to interact with one another.

## Table Of Contents
- [Introduction](#introduction)
- [Install](./install.md)
- [Setup](./dev_environment.md)
- [Getting Started](./getting_started.md)
    - [Automatic Binding Mode](./automatic_binding_mode.md)
    - [Manually Starting A JavasScript Virtual Machine](./start_a_virtual_machine.md)
- [Interacting With TypeScript From C++](./cpp_interacts_typescript.md)
- [Interacting With C++ From TypeScript](./typescript_interacts_cpp.md)
    - [Interacting With Non-Reflected API Using Template-Based Static Binding](./template_binding.md)
    - [Combining TypeScript and C++ Classes With Mixin](./mixin.md)
- [Debugging](./vscode_debug.md)
- [Official Demo](./demos.md)
- [FAQ](./faq.md)